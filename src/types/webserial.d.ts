interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
  bluetoothServiceClassId?: string;
}

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
  bluetoothServiceClassId?: string;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  flowControl?: 'none' | 'hardware';
}

interface SerialInputSignals {
  dataCarrierDetect: boolean;
  clearToSend: boolean;
  ringIndicator: boolean;
  dataSetReady: boolean;
}

interface SerialOutputSignals {
  dataTerminalReady?: boolean;
  requestToSend?: boolean;
  break?: boolean;
}

interface SerialPort {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  readonly connected: boolean;
  getInfo(): SerialPortInfo;
  open(options: SerialOptions): Promise<void>;
  getSignals(): Promise<SerialInputSignals>;
  setSignals(signals: SerialOutputSignals): Promise<void>;
  close(): Promise<void>;
  forget(): Promise<void>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

interface SerialPortConnectionEvent extends Event {
  readonly port: SerialPort;
}

interface Serial extends EventTarget {
  onconnect: ((this: Serial, ev: SerialPortConnectionEvent) => void) | null;
  ondisconnect: ((this: Serial, ev: SerialPortConnectionEvent) => void) | null;
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: { filters?: SerialPortFilter[] }): Promise<SerialPort>;
  addEventListener(type: 'connect' | 'disconnect', listener: (ev: SerialPortConnectionEvent) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

interface USBDevice {
  readonly usbVersionMajor: number;
  readonly usbVersionMinor: number;
  readonly vendorId: number;
  readonly productId: number;
  readonly manufacturerName?: string;
  readonly productName?: string;
  readonly serialNumber?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly configuration?: any;
  readonly configurations?: any[];
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<any>;
  controlTransferIn(setup: {
    requestType: 'vendor' | 'standard' | 'class';
    recipient: 'device' | 'interface' | 'endpoint' | 'other';
    request: number;
    value: number;
    index: number;
  }, length: number): Promise<{
    data?: DataView;
    status: 'ok' | 'stall' | 'babble';
  }>;
  forget(): Promise<void>;
}

interface USB extends EventTarget {
  getDevices(): Promise<USBDevice[]>;
  requestDevice(options: { filters: Array<{ vendorId?: number; productId?: number }> }): Promise<USBDevice>;
}

interface Navigator {
  readonly serial: Serial;
  readonly usb?: USB;
}
