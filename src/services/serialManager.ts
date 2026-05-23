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

  public async getPairedPorts(): Promise<SerialPort[]> {
    if (navigator.serial && navigator.serial.getPorts) {
      return await navigator.serial.getPorts();
    }
    return [];
  }

  public async connect(port: SerialPort, baudRate: number, onData: DataCallback, onDisconnect: DisconnectCallback): Promise<boolean> {
    try {
      this.isExplicitDisconnect = false;
      this.onDataCallback = onData;
      this.onDisconnectCallback = onDisconnect;
      this.updateState({ error: null, errorClass: null, isReconnecting: false, chipMode: 'Unknown' });

      console.log('[SERIAL] Connecting at baud:', baudRate);
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

  public async safeClosePort(port: SerialPort | null): Promise<void> {
    if (!port) return;
    console.log('[SERIAL] Safe closing port...');
    
    // Release locks
    if (port.readable && port.readable.locked) {
       try {
         // Note: We don't getReader here as it might be owned by another async process.
         // We just attempt to close.
       } catch (e) {}
    }

    try {
      await port.close().catch(() => {});
    } catch (e: any) {
      if (!e.message.includes('already closed')) {
        console.warn('[SERIAL] Close warning:', e.message);
      }
    }
  }

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
      } catch (_e) { }
      this.reader = null;
    }

    await this.safeClosePort(port);

    this.updateState({ isConnected: false, port: null, isReconnecting: false, chipMode: 'Unknown' });
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  }

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
   * Improved to ensure restoration failures don't suppress tool results.
   */
  public async runExclusiveAction<T>(action: (port: SerialPort) => Promise<T>): Promise<T> {
    if (!this.state.port || !this.state.isConnected) {
      throw new Error('No active serial port connected.');
    }

    const port = this.state.port;
    const originalBaud = this.state.baudRate;

    console.log('[EXCLUSIVE] Releasing port for tool...');
    this.keepReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel().catch(() => {});
      } catch (_e) { }
      this.reader = null;
    }

    await this.safeClosePort(port);
    await new Promise(resolve => setTimeout(resolve, 800));

    let actionResult: T;
    try {
      actionResult = await action(port);
      console.log('[EXCLUSIVE] Tool action completed successfully.');
    } catch (err: any) {
      console.error('[EXCLUSIVE] Tool action failed:', err.message);
      throw err;
    } finally {
      console.log('[EXCLUSIVE] Reclaiming port for background stream...');
      
      // fallthrough restoration logic
      const restore = async () => {
        try {
          await this.safeClosePort(port);
          await new Promise(resolve => setTimeout(resolve, 1500));
          await port.open({ baudRate: originalBaud });
          this.startReading();
          console.log('[EXCLUSIVE] Background stream restored.');
        } catch (e: any) {
          console.warn('[EXCLUSIVE] Restoration retry sequence triggered...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            await this.safeClosePort(port);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await port.open({ baudRate: originalBaud });
            this.startReading();
            console.log('[EXCLUSIVE] Background stream restored on retry.');
          } catch (retryErr: any) {
            console.error('[EXCLUSIVE] Restoration permanently failed:', retryErr.message);
            this.updateState({ isConnected: false, port: null, error: 'Terminal connection lost. Refresh page.' });
          }
        }
      };

      // We DON'T await restoration here to ensure the action result is returned immediately
      // and errors in reconnection don't bubble up into the UI's action handler.
      restore();
    }
    
    return actionResult;
  }

  public setChipMode(mode: SerialConnectionState['chipMode']) {
    this.updateState({ chipMode: mode });
  }

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
            if (done) break;
            if (value) {
              const text = this.bootDecoder.decode(value, { stream: true });
              this.bootBuffer += text;
              if (this.bootBuffer.length > 2000) this.bootBuffer = this.bootBuffer.slice(-2000);

              if (this.bootBuffer.includes('DOWNLOAD_BOOT')) {
                if (this.state.chipMode !== 'Download') this.updateState({ chipMode: 'Download' });
              } else if (this.bootBuffer.includes('SPI_FAST_FLASH_BOOT') || this.bootBuffer.includes('FLASH_BOOT')) {
                if (this.state.chipMode !== 'Execution') this.updateState({ chipMode: 'Execution' });
              }
              if (this.onDataCallback) this.onDataCallback(value);
            }
          }
        } catch (readErr) {
          console.error('Reader loop error:', readErr);
          break;
        } finally {
          this.reader.releaseLock();
          this.reader = null;
        }
      }
    } catch (streamErr) {
      console.error('Serial stream error:', streamErr);
    }
  }

  private handleUnexpectedDisconnect() {
    if (this.isExplicitDisconnect) return;
    this.keepReading = false;
    if (this.reader) {
      this.reader.cancel().catch(() => {});
      this.reader = null;
    }
    this.updateState({ isConnected: false, errorClass: 'DeviceLost', error: 'Device physically disconnected.', chipMode: 'Unknown' });
    if (this.onDisconnectCallback) this.onDisconnectCallback();
    this.attemptReconnection();
  }

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
          return info.usbVendorId === originalPortInfo.usbVendorId && info.usbProductId === originalPortInfo.usbProductId;
        });
        if (matchingPort) {
          const connected = await this.connect(matchingPort, this.state.baudRate, this.onDataCallback!, this.onDisconnectCallback!);
          if (connected) return;
        }
      } catch (err) {}
      if (retryCount < maxRetries) {
        delay = Math.min(delay * 1.5, 10000);
        this.reconnectTimer = setTimeout(retry, delay);
      } else {
        this.updateState({ isReconnecting: false, error: 'Reconnection failed.' });
      }
    };
    this.reconnectTimer = setTimeout(retry, delay);
  }

  private handleError(err: unknown) {
    let message = err instanceof Error ? err.message : String(err);
    const errName = err instanceof Error ? err.name : '';
    let errClass: SerialConnectionState['errorClass'] = 'Unknown';
    if (errName === 'SecurityError') {
      errClass = 'Security';
      message = 'Security blocked: Permission denied.';
    } else if (errName === 'NetworkError' || message.includes('busy') || message.includes('already open')) {
      errClass = 'Busy';
      message = 'Port is busy.';
    } else if (errName === 'InvalidStateError' || message.includes('device lost')) {
      errClass = 'DeviceLost';
      message = 'Device lost.';
    }
    this.updateState({ error: message, errorClass: errClass });
  }
}

export const serialManager = new SerialManager();
