export interface UsbConverterDetails {
  type: 'CP210x' | 'FTDI' | 'CH340' | 'PL2303' | 'CDC' | 'Unknown';
  manufacturer: string;
  productName: string;
  serialNumber: string;
  vendorId: string;
  productId: string;
  model: string;
  usbVersion: string;
  maxPower?: string;
  attributes?: string;
  
  // CP210x specific parameters
  cp210xFlushBmp?: string;
  cp210xMode?: string;
  cp210xPartNumCode?: number;
}

const ITEM_MODEL = 0x370B;
const ITEM_FLUSH = 0x370D;
const ITEM_MODE = 0x3711;

class UsbAnalyzer {
  /**
   * Prompts the user to authorize the USB device via WebUSB.
   * Targets Silicon Labs default Vendor ID 0x10C4.
   */
  public async requestUsbAccess(vid: number, pid: number): Promise<USBDevice | null> {
    try {
      if (!navigator.usb) {
        console.warn('WebUSB API is not supported in this browser.');
        return null;
      }
      const device = await navigator.usb.requestDevice({
        filters: [{ vendorId: vid, productId: pid }]
      });
      return device;
    } catch (err) {
      console.error('[WebUSB] Request access error:', err);
      return null;
    }
  }

  /**
   * Query all paired WebUSB devices that match a specific VID and PID.
   */
  public async findPairedUsbDevice(vid: number, pid: number): Promise<USBDevice | null> {
    if (!navigator.usb) return null;
    try {
      const devices = await navigator.usb.getDevices();
      const match = devices.find((d: USBDevice) => d.vendorId === vid && d.productId === pid);
      return match || null;
    } catch (e) {
      console.error('[WebUSB] Error listing devices:', e);
      return null;
    }
  }

  /**
   * Query detailed metadata from the USB device, executing Silicon Labs AN978 requests if it is a CP210x.
   */
  public async analyzeDevice(vid: number, pid: number): Promise<UsbConverterDetails> {
    const defaultDetails: UsbConverterDetails = {
      type: this.classifyConverter(vid, pid),
      manufacturer: this.getDefaultManufacturer(vid),
      productName: this.getDefaultProductName(vid, pid),
      serialNumber: 'N/A (Connect via USB for details)',
      vendorId: `0x${vid.toString(16).toUpperCase().padStart(4, '0')}`,
      productId: `0x${pid.toString(16).toUpperCase().padStart(4, '0')}`,
      model: this.classifyConverterModelName(vid, pid, null),
      usbVersion: '2.0 (estimated)'
    };

    const usbDevice = await this.findPairedUsbDevice(vid, pid);
    if (!usbDevice) {
      return defaultDetails;
    }

    // Populate with WebUSB descriptor properties
    const details: UsbConverterDetails = {
      type: this.classifyConverter(vid, pid),
      manufacturer: usbDevice.manufacturerName || defaultDetails.manufacturer,
      productName: usbDevice.productName || defaultDetails.productName,
      serialNumber: usbDevice.serialNumber || 'None (No Serial descriptor)',
      vendorId: `0x${usbDevice.vendorId.toString(16).toUpperCase().padStart(4, '0')}`,
      productId: `0x${usbDevice.productId.toString(16).toUpperCase().padStart(4, '0')}`,
      model: defaultDetails.model,
      usbVersion: `${usbDevice.usbVersionMajor}.${usbDevice.usbVersionMinor}`,
      maxPower: usbDevice.configuration?.interfaces?.[0]?.alternate?.endpoints?.[0]?.packetSize 
        ? 'N/A' 
        : undefined
    };

    // If it's Silicon Labs, run control transfers
    if (usbDevice.vendorId === 0x10C4) {
      try {
        await usbDevice.open();
        
        // Read Model (ITEM_MODEL = 0x370B)
        // Set up setup parameters for controlTransferIn
        // wValue is the item register, wIndex is 0
        const modelResult = await usbDevice.controlTransferIn({
          requestType: 'vendor',
          recipient: 'device',
          request: 0xFF, // CP210X_VENDOR_SPECIFIC
          value: ITEM_MODEL,
          index: 0
        }, 1);

        if (modelResult.data && modelResult.status === 'ok') {
          const modelCode = modelResult.data.getUint8(0);
          details.cp210xPartNumCode = modelCode;
          details.model = this.classifyConverterModelName(0x10C4, pid, modelCode);
          
          // If CP2105, we can also query the mode (ITEM_MODE) and flush buffers (ITEM_FLUSH)
          if (modelCode === 5) {
            // Buffer Flush bitmap (ITEM_FLUSH = 0x370D, 1 byte)
            const flushResult = await usbDevice.controlTransferIn({
              requestType: 'vendor',
              recipient: 'device',
              request: 0xFF,
              value: ITEM_FLUSH,
              index: 0
            }, 1);
            if (flushResult.data && flushResult.status === 'ok') {
              details.cp210xFlushBmp = `0x${flushResult.data.getUint8(0).toString(16).toUpperCase().padStart(2, '0')}`;
            }

            // SCI/ECI Mode configuration (ITEM_MODE = 0x3711, 2 bytes)
            const modeResult = await usbDevice.controlTransferIn({
              requestType: 'vendor',
              recipient: 'device',
              request: 0xFF,
              value: ITEM_MODE,
              index: 0
            }, 2);
            if (modeResult.data && modeResult.status === 'ok') {
              const modeVal = modeResult.data.getUint16(0, true); // little-endian
              details.cp210xMode = `0x${modeVal.toString(16).toUpperCase().padStart(4, '0')} (${
                modeVal === 0 ? 'ECI: GPIO, SCI: GPIO' : modeVal === 1 ? 'ECI: RS232, SCI: GPIO' : 'Custom'
              })`;
            }
          }
        }
      } catch (err) {
        console.warn('[WebUSB] Failed to perform vendor control transfers:', err);
        details.model += ' (Control transfer blocked by OS driver)';
      } finally {
        try {
          await usbDevice.close();
        } catch (e) {}
      }
    }

    return details;
  }

  private classifyConverter(vid: number, pid: number): UsbConverterDetails['type'] {
    if (vid === 0x10C4) return 'CP210x';
    if (vid === 0x0403) return 'FTDI';
    if (vid === 0x1A86) return 'CH340';
    if (vid === 0x067B) return 'PL2303';
    if (vid === 0x303A || (vid === 0x0483 && pid === 0x5740)) return 'CDC';
    return 'Unknown';
  }

  private getDefaultManufacturer(vid: number): string {
    switch (vid) {
      case 0x10C4: return 'Silicon Labs';
      case 0x0403: return 'FTDI';
      case 0x1A86: return 'WCH (Jiangsu Qinheng)';
      case 0x067B: return 'Prolific';
      case 0x303A: return 'Espressif Systems';
      default: return 'Generic USB Device';
    }
  }

  private getDefaultProductName(vid: number, pid: number): string {
    switch (vid) {
      case 0x10C4: return 'CP210x USB to UART Bridge';
      case 0x0403: return 'FTDI USB Serial Converter';
      case 0x1A86: return pid === 0x5523 ? 'CH341 USB Serial Adapter' : 'CH340 USB to UART Bridge';
      case 0x067B: return 'PL2303 USB Serial Adapter';
      case 0x303A: return 'Espressif USB JTAG/serial debug unit';
      default: return 'USB-to-UART Adapter';
    }
  }

  private classifyConverterModelName(vid: number, pid: number, modelCode: number | null): string {
    if (vid !== 0x10C4) {
      if (vid === 0x0403) return 'FT232R / FT2232';
      if (vid === 0x1A86) return pid === 0x5523 ? 'CH341A' : 'CH340';
      if (vid === 0x067B) return 'PL2303HX / TA';
      if (vid === 0x303A) return 'ESP32 Native USB-OTG';
      return 'N/A';
    }

    if (modelCode === null) {
      // Static estimation from common PIDs
      if (pid === 0xEA60) return 'CP2102 / CP2104';
      if (pid === 0xEA70) return 'CP2105 Dual COM';
      if (pid === 0xEA80) return 'CP2108 Quad COM';
      return 'CP210x Bridge';
    }

    switch (modelCode) {
      case 0x01: return 'CP2101';
      case 0x02: return 'CP2102';
      case 0x03: return 'CP2103';
      case 0x04: return 'CP2104';
      case 0x05: return 'CP2105 Dual UART';
      case 0x08: return 'CP2108 Quad UART';
      case 0x20: return 'CP2102N MPT';
      default: return `CP210x (Unknown model: ${modelCode})`;
    }
  }
}

export const usbAnalyzer = new UsbAnalyzer();
