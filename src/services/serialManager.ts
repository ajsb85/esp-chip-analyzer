export interface SerialConnectionState {
  isConnected: boolean;
  port: SerialPort | null;
  baudRate: number;
  error: string | null;
  errorClass: 'Security' | 'Busy' | 'DeviceLost' | 'Unknown' | null;
  isReconnecting: boolean;
}

export type DataCallback = (data: Uint8Array) => void;
export type DisconnectCallback = () => void;

class SerialManager {
  private state: SerialConnectionState = {
    isConnected: false,
    port: null,
    baudRate: 115200,
    error: null,
    errorClass: null,
    isReconnecting: false
  };

  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private keepReading = false;
  private onDataCallback: DataCallback | null = null;
  private onDisconnectCallback: DisconnectCallback | null = null;
  private reconnectTimer: any = null;
  private isExplicitDisconnect = false;

  private stateListeners: Set<(state: SerialConnectionState) => void> = new Set();

  constructor() {
    if (typeof navigator !== 'undefined' && navigator.serial) {
      navigator.serial.addEventListener('disconnect', (event: any) => {
        const disconnectedPort = event.port as SerialPort;
        if (this.state.port && this.state.port === disconnectedPort) {
          this.handleUnexpectedDisconnect();
        }
      });
    }
  }

  public subscribe(listener: (state: SerialConnectionState) => void) {
    this.stateListeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private notify() {
    this.stateListeners.forEach(listener => listener({ ...this.state }));
  }

  private updateState(updated: Partial<SerialConnectionState>) {
    this.state = { ...this.state, ...updated };
    this.notify();
  }

  public getState() {
    return { ...this.state };
  }

  public getPort() {
    return this.state.port;
  }

  /**
   * Request a new port from the user.
   */
  public async requestPort(): Promise<SerialPort | null> {
    try {
      this.updateState({ error: null, errorClass: null });
      const port = await navigator.serial.requestPort();
      return port;
    } catch (err: any) {
      this.handleError(err);
      return null;
    }
  }

  /**
   * Get all previously paired ports.
   */
  public async getPairedPorts(): Promise<SerialPort[]> {
    if (navigator.serial && navigator.serial.getPorts) {
      return await navigator.serial.getPorts();
    }
    return [];
  }

  /**
   * Connect to a specific port.
   */
  public async connect(port: SerialPort, baudRate: number, onData: DataCallback, onDisconnect: DisconnectCallback): Promise<boolean> {
    try {
      this.isExplicitDisconnect = false;
      this.onDataCallback = onData;
      this.onDisconnectCallback = onDisconnect;
      this.updateState({ error: null, errorClass: null, isReconnecting: false });

      await port.open({ baudRate });
      this.updateState({ isConnected: true, port, baudRate });

      this.startReading();
      return true;
    } catch (err: any) {
      this.handleError(err);
      return false;
    }
  }

  /**
   * Disconnect the active port.
   */
  public async disconnect(): Promise<void> {
    this.isExplicitDisconnect = true;
    this.keepReading = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch (e) {}
      this.reader = null;
    }

    if (this.state.port) {
      try {
        await this.state.port.close();
      } catch (e) {}
    }

    this.updateState({ isConnected: false, port: null, isReconnecting: false });
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  }

  /**
   * Revoke permission for the active port or all paired ports.
   */
  public async forgetActivePort(): Promise<void> {
    const port = this.state.port;
    await this.disconnect();
    if (port && (port as any).forget) {
      try {
        await (port as any).forget();
      } catch (e) {
        console.error('Failed to forget port:', e);
      }
    }
  }

  /**
   * Start asynchronous reading loop.
   */
  private async startReading() {
    if (!this.state.port || !this.state.port.readable) return;
    this.keepReading = true;

    try {
      const port = this.state.port;
      while (this.keepReading && port.readable) {
        this.reader = port.readable.getReader();
        try {
          while (true) {
            const { value, done } = await this.reader.read();
            if (done) {
              break;
            }
            if (value && this.onDataCallback) {
              this.onDataCallback(value);
            }
          }
        } catch (readErr) {
          console.error('Read error inside serial stream loop:', readErr);
          break; // Break and release reader
        } finally {
          this.reader.releaseLock();
          this.reader = null;
        }
      }
    } catch (streamErr) {
      console.error('Serial stream execution error:', streamErr);
    }
  }

  /**
   * Triggered when navigator.serial reports disconnection.
   */
  private handleUnexpectedDisconnect() {
    if (this.isExplicitDisconnect) return;
    
    this.keepReading = false;
    if (this.reader) {
      try {
        this.reader.cancel().catch(() => {});
      } catch (e) {}
      this.reader = null;
    }
    
    this.updateState({ isConnected: false, errorClass: 'DeviceLost', error: 'Device physically disconnected.' });
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }

    this.attemptReconnection();
  }

  /**
   * Reconnection routine with exponential backoff.
   */
  private async attemptReconnection() {
    const originalPortInfo = this.state.port?.getInfo();
    if (!originalPortInfo || !originalPortInfo.usbVendorId) return;

    this.updateState({ isReconnecting: true });
    
    let retryCount = 0;
    const maxRetries = 10;
    let delay = 1000;

    const retry = async () => {
      if (this.isExplicitDisconnect || this.state.isConnected) return;
      retryCount++;
      
      try {
        const ports = await this.getPairedPorts();
        const matchingPort = ports.find(p => {
          const info = p.getInfo();
          return info.usbVendorId === originalPortInfo.usbVendorId &&
                 info.usbProductId === originalPortInfo.usbProductId;
        });

        if (matchingPort) {
          console.log(`[RECONNECT] Found matching port on attempt ${retryCount}. Connecting...`);
          const connected = await this.connect(
            matchingPort,
            this.state.baudRate,
            this.onDataCallback!,
            this.onDisconnectCallback!
          );

          if (connected) {
            console.log('[RECONNECT] Reconnection successful!');
            return;
          }
        }
      } catch (err) {
        console.error('[RECONNECT] Error during retry:', err);
      }

      if (retryCount < maxRetries) {
        delay = Math.min(delay * 1.5, 10000); // Exponential backoff up to 10s
        console.log(`[RECONNECT] Attempt ${retryCount}/${maxRetries} failed. Retrying in ${delay}ms...`);
        this.reconnectTimer = setTimeout(retry, delay);
      } else {
        console.log('[RECONNECT] Reconnection exhausted. Giving up.');
        this.updateState({ isReconnecting: false, error: 'Reconnection failed. Please reconnect manually.' });
      }
    };

    this.reconnectTimer = setTimeout(retry, delay);
  }

  /**
   * Map standard serial errors.
   */
  private handleError(err: any) {
    let message = err?.message || String(err);
    let errClass: SerialConnectionState['errorClass'] = 'Unknown';

    if (err.name === 'SecurityError') {
      errClass = 'Security';
      message = 'Security blocked: Permission denied or site blocked by system rules.';
    } else if (err.name === 'NetworkError' || message.includes('busy') || message.includes('already open')) {
      errClass = 'Busy';
      message = 'Port is busy: Currently claimed by another tab, serial terminal, or OS process.';
    } else if (err.name === 'InvalidStateError' || message.includes('device lost')) {
      errClass = 'DeviceLost';
      message = 'Device lost: Port disconnected from system during operation.';
    }

    this.updateState({ error: message, errorClass: errClass });
    console.error(`[SERIAL ERROR] Class: ${errClass}, Msg: ${message}`);
  }
}

export const serialManager = new SerialManager();
