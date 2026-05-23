export interface SerialOpenOptionsSnapshot {
  baudRate: number;
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd';
  flowControl: 'none' | 'hardware';
  bufferSize?: number;
}

export interface SerialPortRuntimeMetadata {
  usbVendorId?: number;
  usbProductId?: number;
  vendorId: string;
  productId: string;
  connectionKey: string;
  physicallyConnected: boolean;
  portOpen: boolean;
  readableState: 'missing' | 'available' | 'locked';
  writableState: 'missing' | 'available' | 'locked';
  canForget: boolean;
  isEspressifUsbJtag: boolean;
  isNativeEspressifUsb: boolean;
  transport: string;
  suggestedReset: string;
  openOptions: SerialOpenOptionsSnapshot;
  lastOpenedAt: string | null;
  lastClosedAt: string | null;
  lastRestoredAt: string | null;
  reconnectAttempts: number;
  recoveryCount: number;
}

export interface SerialConnectionState {
  isConnected: boolean;
  port: SerialPort | null;
  baudRate: number;
  serialOptions: SerialOpenOptionsSnapshot;
  portMetadata: SerialPortRuntimeMetadata | null;
  error: string | null;
  errorClass: 'Security' | 'Busy' | 'DeviceLost' | 'Unknown' | null;
  isReconnecting: boolean;
  isPortBusy: boolean;
  activeOperation: string | null;
  chipMode: 'Unknown' | 'Execution' | 'Download';
}

export interface ExclusiveActionOptions {
  label?: string;
  openPort?: boolean;
  baudRate?: number;
  serialOptions?: Partial<Omit<SerialOpenOptionsSnapshot, 'baudRate'>>;
  restore?: boolean;
  deviceSettleMs?: number;
  restoreDelayMs?: number;
}

export type DataCallback = (data: Uint8Array) => void;
export type DisconnectCallback = () => void;

const DEFAULT_SERIAL_OPTIONS: SerialOpenOptionsSnapshot = {
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none',
};

class SerialManager {
  private state: SerialConnectionState = {
    isConnected: false,
    port: null,
    baudRate: DEFAULT_SERIAL_OPTIONS.baudRate,
    serialOptions: { ...DEFAULT_SERIAL_OPTIONS },
    portMetadata: null,
    error: null,
    errorClass: null,
    isReconnecting: false,
    isPortBusy: false,
    activeOperation: null,
    chipMode: 'Unknown',
  };

  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private readLoopPromise: Promise<void> | null = null;
  private keepReading = false;
  private onDataCallback: DataCallback | null = null;
  private onDisconnectCallback: DisconnectCallback | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isExplicitDisconnect = false;
  private bootDecoder = new TextDecoder('utf-8', { fatal: false });
  private bootBuffer = '';
  private exclusiveQueue: Promise<void> = Promise.resolve();

  private lastOpenedAt: string | null = null;
  private lastClosedAt: string | null = null;
  private lastRestoredAt: string | null = null;
  private reconnectAttempts = 0;
  private recoveryCount = 0;

  private stateListeners: Set<(state: SerialConnectionState) => void> = new Set();

  constructor() {
    if (typeof navigator !== 'undefined' && navigator.serial) {
      navigator.serial.addEventListener('disconnect', (event) => {
        const disconnectedPort = event.port || (event.target as SerialPort);
        if (this.state.port && this.state.port === disconnectedPort) {
          if (this.state.isPortBusy) {
            this.keepReading = false;
            this.updateState({ isReconnecting: true });
            return;
          }
          this.handleUnexpectedDisconnect();
        }
      });
      navigator.serial.addEventListener('connect', (event) => {
        const connectedPort = event.port || (event.target as SerialPort);
        if (this.state.port && this.state.port === connectedPort) {
          this.refreshMetadata();
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
    const next = { ...this.state, ...updated };
    next.portMetadata = next.port ? this.buildPortMetadata(next.port, next) : null;
    this.state = next;
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
      return await navigator.serial.requestPort();
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

  public async connect(
    port: SerialPort,
    baudRate: number,
    onData: DataCallback,
    onDisconnect: DisconnectCallback,
  ): Promise<boolean> {
    try {
      if (this.state.isPortBusy) {
        throw new Error(`Port is reserved by ${this.state.activeOperation}.`);
      }

      this.isExplicitDisconnect = false;
      this.onDataCallback = onData;
      this.onDisconnectCallback = onDisconnect;

      const serialOptions = this.normalizeSerialOptions(baudRate);
      this.updateState({
        error: null,
        errorClass: null,
        isReconnecting: false,
        chipMode: 'Unknown',
        serialOptions,
      });

      console.log('[SERIAL] Connecting at baud:', baudRate);
      await this.stopReading();
      await this.safeClosePort(port);
      await this.sleep(150);

      await port.open(this.toOpenOptions(serialOptions));
      this.lastOpenedAt = new Date().toISOString();
      this.updateState({ isConnected: true, port, baudRate, serialOptions });

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

    if (port === this.state.port) {
      await this.stopReading();
    }

    await this.waitForPortUnlock(port, 1500);

    if (!this.isPortOpen(port)) {
      this.lastClosedAt = new Date().toISOString();
      return;
    }

    try {
      await port.close();
      this.lastClosedAt = new Date().toISOString();
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      if (!this.isBenignCloseError(err)) {
        console.warn('[SERIAL] Close warning:', err.message);
      }
      this.lastClosedAt = new Date().toISOString();
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
    await this.stopReading();
    await this.safeClosePort(port);

    this.updateState({
      isConnected: false,
      port: null,
      isReconnecting: false,
      isPortBusy: false,
      activeOperation: null,
      chipMode: 'Unknown',
    });
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  }

  public async forgetActivePort(): Promise<void> {
    const port = this.state.port;
    await this.disconnect();
    if (port && port.forget) {
      try {
        await port.forget();
      } catch (e) {
        console.error('Failed to forget port:', e);
      }
    }
  }

  /**
   * Executes a tool operation with exclusive ownership of the Web Serial port.
   * The background console reader is paused, the action gets a clean port, then
   * the console connection is restored before the action resolves.
   */
  public async runExclusiveAction<T>(
    action: (port: SerialPort) => Promise<T>,
    options: ExclusiveActionOptions = {},
  ): Promise<T> {
    const previous = this.exclusiveQueue.catch(() => {});
    let releaseQueue!: () => void;
    this.exclusiveQueue = new Promise<void>((resolve) => {
      releaseQueue = resolve;
    });

    await previous;
    try {
      return await this.runExclusiveActionNow(action, options);
    } finally {
      releaseQueue();
    }
  }

  public async writeData(data: Uint8Array): Promise<boolean> {
    if (!this.state.port || !this.state.isConnected || this.state.isPortBusy) {
      return false;
    }

    const port = this.state.port;
    if (!port.writable) return false;

    let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    try {
      writer = port.writable.getWriter();
      await writer.write(data);
      return true;
    } catch (err) {
      this.handleError(err);
      return false;
    } finally {
      try {
        writer?.releaseLock();
      } catch (_e) {
        // ignore already released writer locks
      }
    }
  }

  public async writeText(data: string): Promise<boolean> {
    const encoder = new TextEncoder();
    return this.writeData(encoder.encode(data));
  }

  public refreshMetadata(): void {
    if (this.state.port) {
      this.updateState({ port: this.state.port });
    }
  }

  public async recoverActiveConnection(): Promise<boolean> {
    if (!this.state.port || !this.state.isConnected) {
      throw new Error('No active serial port to recover.');
    }

    await this.runExclusiveAction(async () => true, {
      label: 'Manual port recovery',
      restoreDelayMs: 250,
    });
    return this.state.isConnected;
  }

  public setChipMode(mode: SerialConnectionState['chipMode']) {
    this.updateState({ chipMode: mode });
  }

  private async runExclusiveActionNow<T>(
    action: (port: SerialPort) => Promise<T>,
    options: ExclusiveActionOptions,
  ): Promise<T> {
    if (!this.state.port || !this.state.isConnected) {
      throw new Error('No active serial port connected.');
    }

    const port = this.state.port;
    const originalInfo = port.getInfo();
    const originalOptions = { ...this.state.serialOptions };
    const label = options.label || 'Tool operation';
    let actionResult: T | undefined;
    let actionError: unknown;

    this.updateState({
      activeOperation: label,
      isPortBusy: true,
      error: null,
      errorClass: null,
      isReconnecting: false,
    });

    console.log(`[EXCLUSIVE] ${label}: releasing background stream...`);
    await this.stopReading();
    await this.safeClosePort(port);
    await this.sleep(options.deviceSettleMs ?? 250);

    try {
      if (options.openPort) {
        const actionOptions = this.normalizeSerialOptions(
          options.baudRate ?? originalOptions.baudRate,
          options.serialOptions,
        );
        await port.open(this.toOpenOptions(actionOptions));
        this.lastOpenedAt = new Date().toISOString();
        this.updateState({ port });
      }

      actionResult = await action(port);
      console.log(`[EXCLUSIVE] ${label}: action completed.`);
    } catch (err) {
      actionError = err;
      console.error(`[EXCLUSIVE] ${label}: action failed:`, err);
    } finally {
      console.log(`[EXCLUSIVE] ${label}: restoring background stream...`);
      await this.safeClosePort(this.state.port || port);

      if (options.restore !== false && !this.isExplicitDisconnect) {
        await this.sleep(options.restoreDelayMs ?? 300);
        const restored = await this.restorePort(port, originalInfo, originalOptions);
        if (!restored && !actionError) {
          this.updateState({
            error: 'Tool completed, but the serial console could not be restored. Reconnect the device from Port Connection.',
            errorClass: 'DeviceLost',
          });
        }
      } else {
        this.updateState({
          activeOperation: null,
          isPortBusy: false,
          isReconnecting: false,
        });
      }
    }

    if (actionError) {
      throw actionError;
    }

    return actionResult as T;
  }

  private startReading(): void {
    if (!this.state.port || !this.state.port.readable || this.readLoopPromise) return;

    this.keepReading = true;
    this.bootBuffer = '';
    const port = this.state.port;
    const loop = this.readFromPort(port);
    this.readLoopPromise = loop;
    loop.finally(() => {
      if (this.readLoopPromise === loop) {
        this.readLoopPromise = null;
      }
    });
  }

  private async readFromPort(port: SerialPort): Promise<void> {
    try {
      while (this.keepReading && port === this.state.port && port.readable) {
        const reader = port.readable.getReader();
        this.reader = reader;
        try {
          while (this.keepReading) {
            const { value, done } = await reader.read();
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
          if (this.keepReading && !this.state.isPortBusy) {
            console.error('Reader loop error:', readErr);
          }
          if (
            readErr instanceof Error &&
            ['BufferOverrunError', 'BreakError', 'FramingError', 'ParityError'].includes(readErr.name)
          ) {
            continue;
          }
          break;
        } finally {
          try {
            reader.releaseLock();
          } catch (_e) {
            // ignore already released reader locks
          }
          if (this.reader === reader) {
            this.reader = null;
          }
        }
      }
    } catch (streamErr) {
      if (this.keepReading && !this.state.isPortBusy) {
        console.error('Serial stream error:', streamErr);
      }
    }
  }

  private async stopReading(): Promise<void> {
    this.keepReading = false;
    const reader = this.reader;
    if (reader) {
      try {
        await reader.cancel();
      } catch (_e) {
        // ignore cancellation on already closed streams
      }
    }

    const loop = this.readLoopPromise;
    if (loop) {
      await Promise.race([loop.catch(() => {}), this.sleep(1200)]);
    }
    this.reader = null;
  }

  private handleUnexpectedDisconnect() {
    if (this.isExplicitDisconnect) return;
    this.keepReading = false;
    if (this.reader) {
      this.reader.cancel().catch(() => {});
      this.reader = null;
    }
    this.updateState({
      isConnected: false,
      errorClass: 'DeviceLost',
      error: 'Device physically disconnected.',
      chipMode: 'Unknown',
    });
    if (this.onDisconnectCallback) this.onDisconnectCallback();
    void this.attemptReconnection();
  }

  private async attemptReconnection() {
    const port = this.state.port;
    const originalPortInfo = port?.getInfo();
    if (!port || !originalPortInfo || !originalPortInfo.usbVendorId) return;
    await this.restorePort(port, originalPortInfo, this.state.serialOptions);
  }

  private async restorePort(
    originalPort: SerialPort,
    originalInfo: SerialPortInfo,
    serialOptions: SerialOpenOptionsSnapshot,
  ): Promise<boolean> {
    const maxRetries = 12;
    let delay = 350;
    let lastError: unknown = null;

    this.updateState({ isReconnecting: true });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (this.isExplicitDisconnect) return false;
      this.reconnectAttempts = attempt;
      this.updateState({ isReconnecting: true });

      const candidate = await this.findMatchingPort(originalPort, originalInfo);
      if (candidate) {
        try {
          await this.safeClosePort(candidate);
          await this.sleep(120);
          await candidate.open(this.toOpenOptions(serialOptions));
          this.lastOpenedAt = new Date().toISOString();
          this.lastRestoredAt = new Date().toISOString();
          this.recoveryCount += 1;
          this.reconnectAttempts = 0;

          this.updateState({
            isConnected: true,
            port: candidate,
            baudRate: serialOptions.baudRate,
            serialOptions,
            error: null,
            errorClass: null,
            isReconnecting: false,
            isPortBusy: false,
            activeOperation: null,
          });
          this.startReading();
          return true;
        } catch (err) {
          lastError = err;
          await this.safeClosePort(candidate);
        }
      }

      await this.sleep(delay);
      delay = Math.min(Math.round(delay * 1.45), 1800);
    }

    const msg = lastError instanceof Error ? lastError.message : 'device did not re-enumerate in time';
    this.updateState({
      isConnected: false,
      port: null,
      isReconnecting: false,
      isPortBusy: false,
      activeOperation: null,
      errorClass: 'DeviceLost',
      error: `Serial port restoration failed: ${msg}`,
      chipMode: 'Unknown',
    });
    return false;
  }

  private async findMatchingPort(originalPort: SerialPort, originalInfo: SerialPortInfo): Promise<SerialPort | null> {
    const ports = await this.getPairedPorts();
    const sameObject = ports.find(port => port === originalPort);
    if (sameObject) return sameObject;

    return ports.find(port => {
      const info = port.getInfo();
      return (
        info.usbVendorId === originalInfo.usbVendorId &&
        info.usbProductId === originalInfo.usbProductId
      );
    }) || null;
  }

  private async waitForPortUnlock(port: SerialPort, timeoutMs: number): Promise<void> {
    const started = Date.now();
    while (
      (port.readable && port.readable.locked) ||
      (port.writable && port.writable.locked)
    ) {
      if (Date.now() - started > timeoutMs) {
        return;
      }
      await this.sleep(25);
    }
  }

  private normalizeSerialOptions(
    baudRate: number,
    overrides: Partial<Omit<SerialOpenOptionsSnapshot, 'baudRate'>> = {},
  ): SerialOpenOptionsSnapshot {
    return {
      ...DEFAULT_SERIAL_OPTIONS,
      ...overrides,
      baudRate,
    };
  }

  private toOpenOptions(options: SerialOpenOptionsSnapshot): SerialOptions {
    const openOptions: SerialOptions = {
      baudRate: options.baudRate,
      dataBits: options.dataBits,
      stopBits: options.stopBits,
      parity: options.parity,
      flowControl: options.flowControl,
    };
    if (options.bufferSize !== undefined) {
      openOptions.bufferSize = options.bufferSize;
    }
    return openOptions;
  }

  private buildPortMetadata(port: SerialPort, state: SerialConnectionState): SerialPortRuntimeMetadata {
    const info = port.getInfo();
    const isEspressifUsbJtag = info.usbVendorId === 0x303A && info.usbProductId === 0x1001;
    const isNativeEspressifUsb = info.usbVendorId === 0x303A;

    return {
      usbVendorId: info.usbVendorId,
      usbProductId: info.usbProductId,
      vendorId: this.formatUsbId(info.usbVendorId),
      productId: this.formatUsbId(info.usbProductId),
      connectionKey: info.usbVendorId
        ? `${this.formatUsbId(info.usbVendorId)}:${this.formatUsbId(info.usbProductId)}`
        : 'Generic Serial',
      physicallyConnected: port.connected,
      portOpen: this.isPortOpen(port),
      readableState: this.getStreamState(port.readable),
      writableState: this.getStreamState(port.writable),
      canForget: typeof port.forget === 'function',
      isEspressifUsbJtag,
      isNativeEspressifUsb,
      transport: isEspressifUsbJtag
        ? 'USB CDC ACM over native Espressif USB-JTAG/Serial'
        : isNativeEspressifUsb
          ? 'USB CDC ACM over native Espressif USB'
          : 'Web Serial',
      suggestedReset: isEspressifUsbJtag
        ? 'USB-JTAG/Serial DTR/RTS reset sequence'
        : 'Classic DTR/RTS serial reset sequence',
      openOptions: { ...state.serialOptions },
      lastOpenedAt: this.lastOpenedAt,
      lastClosedAt: this.lastClosedAt,
      lastRestoredAt: this.lastRestoredAt,
      reconnectAttempts: this.reconnectAttempts,
      recoveryCount: this.recoveryCount,
    };
  }

  private getStreamState(stream: ReadableStream<Uint8Array> | WritableStream<Uint8Array> | null) {
    if (!stream) return 'missing';
    return stream.locked ? 'locked' : 'available';
  }

  private isPortOpen(port: SerialPort): boolean {
    return Boolean(port.readable || port.writable);
  }

  private formatUsbId(value?: number): string {
    if (value === undefined) return 'N/A';
    return `0x${value.toString(16).toUpperCase().padStart(4, '0')}`;
  }

  private isBenignCloseError(err: Error): boolean {
    return (
      err.name === 'InvalidStateError' ||
      err.message.includes('already closed') ||
      err.message.includes('not open')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
