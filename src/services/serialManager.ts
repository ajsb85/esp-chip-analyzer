export interface SerialConnectionState {
  isConnected: boolean;
  port: SerialPort | null;
  baudRate: number;
  error: string | null;
  errorClass: 'Security' | 'Busy' | 'DeviceLost' | 'Unknown' | null;
  isReconnecting: boolean;
  chipMode: 'Unknown' | 'Execution' | 'Download';
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
    isReconnecting: false,
    chipMode: 'Unknown'
  };

  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private keepReading = false;
  private onDataCallback: DataCallback | null = null;
  private onDisconnectCallback: DisconnectCallback | null = null;
  private reconnectTimer: any = null;
  private isExplicitDisconnect = false;
  private bootDecoder = new TextDecoder('utf-8', { fatal: false });
  private bootBuffer = '';

  private stateListeners: Set<(state: SerialConnectionState) => void> = new Set();

  constructor() {
    if (typeof navigator !== 'undefined' && navigator.serial) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  public async requestPort(): Promise<SerialPort | null> {
    try {
      this.updateState({ error: null, errorClass: null });
      const port = await navigator.serial.requestPort();
      return port;
    } catch (err) {
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
      this.updateState({ error: null, errorClass: null, isReconnecting: false, chipMode: 'Unknown' });

      console.log('[SERIAL] Connecting at baud:', baudRate);
      
      // Close first if somehow browser state is desynced
      await this.safeClosePort(port);

      await port.open({ baudRate });
      this.updateState({ isConnected: true, port, baudRate });

      this.startReading();
      return true;
    } catch (err) {
      this.handleError(err);
      return false;
    }
  }

  /**
   * Safe idempotent port closure.
   */
  public async safeClosePort(port: SerialPort | null): Promise<void> {
    if (!port) return;
    
    console.log('[SERIAL] Safe closing port...');
    
    // 1. Release locks if any
    if (port.readable && port.readable.locked) {
       try {
         const reader = port.readable.getReader();
         await reader.cancel().catch(() => {});
         reader.releaseLock();
       } catch (e) {
         console.warn('[SERIAL] Failed to release readable lock:', e);
       }
    }
    
    if (port.writable && port.writable.locked) {
       try {
         const writer = port.writable.getWriter();
         await writer.abort().catch(() => {});
         writer.releaseLock();
       } catch (e) {
         console.warn('[SERIAL] Failed to release writable lock:', e);
       }
    }

    // 2. Try to close
    try {
      // We only call close() if the streams are null (meaning it might be open)
      // or if we just unlocked them.
      await port.close().catch(() => {});
    } catch (e: any) {
      // Ignore "already closed"
      if (!e.message.includes('already closed')) {
        console.warn('[SERIAL] Close warning:', e);
      }
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

    const port = this.state.port;
    
    if (this.reader) {
      try {
        await this.reader.cancel().catch(() => {});
      } catch (_e) { /* ignore */ }
      this.reader = null;
    }

    await this.safeClosePort(port);

    this.updateState({ isConnected: false, port: null, isReconnecting: false, chipMode: 'Unknown' });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (port && (port as any).forget) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (port as any).forget();
      } catch (e) {
        console.error('Failed to forget port:', e);
      }
    }
  }

  /**
   * Executes an action with exclusive port access.
   */
  public async runExclusiveAction<T>(action: (port: SerialPort) => Promise<T>): Promise<T> {
    if (!this.state.port || !this.state.isConnected) {
      throw new Error('No active serial port connected.');
    }

    const port = this.state.port;
    const originalBaud = this.state.baudRate;

    console.log('[EXCLUSIVE] Pausing background operations...');
    this.keepReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel().catch(() => {});
      } catch (_e) { /* ignore */ }
      this.reader = null;
    }

    await this.safeClosePort(port);

    // Wait for the OS to acknowledge the closure
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      console.log('[EXCLUSIVE] Executing tool action...');
      const result = await action(port);
      return result;
    } finally {
      console.log('[EXCLUSIVE] Restoring serial connection...');
      
      // TOOL might have closed it, or left it open. 
      // We ensure it's closed before we try to re-open for our terminal.
      await this.safeClosePort(port);

      // Guard delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        await port.open({ baudRate: originalBaud });
        this.startReading();
      } catch (e: any) {
        console.warn('[EXCLUSIVE] Restoration retry sequence initiated...', e.message);
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          // If first attempt failed, try ONE more time after a longer wait
          await this.safeClosePort(port);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await port.open({ baudRate: originalBaud });
          this.startReading();
        } catch (retryErr: any) {
          console.error('[EXCLUSIVE] Restoration failed:', retryErr.message);
          this.updateState({ isConnected: false, port: null, error: 'Port was not released by the tool.' });
        }
      }
    }
  }

  public setChipMode(mode: SerialConnectionState['chipMode']) {
    this.updateState({ chipMode: mode });
  }

  /**
   * Start asynchronous reading loop.
   */
  private async startReading() {
    if (!this.state.port || !this.state.port.readable) return;
    this.keepReading = true;
    this.bootBuffer = '';

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
            if (value) {
              const text = this.bootDecoder.decode(value, { stream: true });
              this.bootBuffer += text;
              if (this.bootBuffer.length > 2000) this.bootBuffer = this.bootBuffer.slice(-2000);

              if (this.bootBuffer.includes('DOWNLOAD_BOOT')) {
                if (this.state.chipMode !== 'Download') {
                  this.updateState({ chipMode: 'Download' });
                }
              } else if (this.bootBuffer.includes('SPI_FAST_FLASH_BOOT') || this.bootBuffer.includes('FLASH_BOOT')) {
                if (this.state.chipMode !== 'Execution') {
                  this.updateState({ chipMode: 'Execution' });
                }
              }

              if (this.onDataCallback) {
                this.onDataCallback(value);
              }
            }
          }
        } catch (readErr) {
          console.error('Read error inside serial stream loop:', readErr);
          break;
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
    
    this.updateState({ isConnected: false, errorClass: 'DeviceLost', error: 'Device physically disconnected.', chipMode: 'Unknown' });
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

  private handleError(err: unknown) {
    let message = err instanceof Error ? err.message : String(err);
    const errName = err instanceof Error ? err.name : '';
    let errClass: SerialConnectionState['errorClass'] = 'Unknown';

    const isUserCancel = 
      errName === 'NotFoundError' || 
      message.includes('No port selected') || 
      message.includes('User cancelled') ||
      message.includes('cancel');

    if (isUserCancel) {
      console.log('[SERIAL] Port selection cancelled by the user.');
      this.updateState({ error: null, errorClass: null });
      return;
    }

    if (errName === 'SecurityError') {
      errClass = 'Security';
      message = 'Security blocked: Permission denied or site blocked by system rules.';
    } else if (errName === 'NetworkError' || message.includes('busy') || message.includes('already open')) {
      errClass = 'Busy';
      message = 'Port is busy: Currently claimed by another tab, serial terminal, or OS process.';
    } else if (errName === 'InvalidStateError' || message.includes('device lost')) {
      errClass = 'DeviceLost';
      message = 'Device lost: Port disconnected from system during operation.';
    }

    this.updateState({ error: message, errorClass: errClass });
    console.error(`[SERIAL ERROR] Class: ${errClass}, Msg: ${message}`);
  }
}

export const serialManager = new SerialManager();
