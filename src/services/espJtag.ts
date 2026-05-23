/**
 * WebUSB implementation of ESP USB JTAG.
 * Ported from esp_usb_jtag.c
 */

export class EspJtag {
  private device: USBDevice | null = null;
  private interfaceNumber: number = 0;
  private endpointIn: number = 0;
  private endpointOut: number = 0;

  public async getPairedDevices(): Promise<USBDevice[]> {
    if (!navigator.usb) return [];
    try {
      const devices = await navigator.usb.getDevices();
      return devices.filter(d => d.vendorId === 0x303A && d.productId === 0x1001);
    } catch (e) {
      console.error('Failed to get paired WebUSB devices:', e);
      return [];
    }
  }

  public async connect(selectedDevice?: USBDevice): Promise<boolean> {
    try {
      if (!navigator.usb) {
        console.error('WebUSB not supported');
        return false;
      }
      
      const device = selectedDevice || await navigator.usb.requestDevice({
        filters: [{ vendorId: 0x303A, productId: 0x1001 }]
      });
      
      await device.open();
      
      // Find JTAG interface (usually class 0xFF, subclass 0xFF, protocol 0x01)
      let found = false;
      if (device.configurations) {
        for (const configuration of device.configurations) {
          for (const iface of configuration.interfaces) {
            const alt = iface.alternates[0];
            if (alt.interfaceClass === 0xFF && alt.interfaceSubclass === 0xFF && alt.interfaceProtocol === 0x01) {
              this.interfaceNumber = iface.interfaceNumber;
              for (const ep of alt.endpoints) {
                if (ep.direction === 'out') this.endpointOut = ep.endpointNumber;
                if (ep.direction === 'in') this.endpointIn = ep.endpointNumber;
              }
              if (device.configuration?.configurationValue !== configuration.configurationValue) {
                await device.selectConfiguration(configuration.configurationValue);
              }
              await device.claimInterface(this.interfaceNumber);
              found = true;
              break;
            }
          }
          if (found) break;
        }
      }

      if (!found) {
        console.error('JTAG interface not found on this device');
        await device.close();
        return false;
      }

      this.device = device;
      return true;
    } catch (e) {
      console.error('Failed to connect to ESP USB JTAG:', e);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await this.device.releaseInterface(this.interfaceNumber);
        await this.device.close();
      } catch (e) {
        // ignore
      }
      this.device = null;
    }
  }

  public isConnected(): boolean {
    return this.device !== null;
  }

  public getDevice(): USBDevice | null {
    return this.device;
  }

  /**
   * Send CMD_RST
   * bit 3=1, bit 2=0, bit 1=0, bit 0=srst
   */
  public async setReset(srst: boolean): Promise<void> {
    if (!this.device) return;
    const cmd = 0x8 | (srst ? 1 : 0);
    const data = new Uint8Array([cmd]);
    await this.device.transferOut(this.endpointOut, data);
  }

  /**
   * Send CMD_FLUSH
   */
  public async flush(): Promise<void> {
    if (!this.device) return;
    const cmd = 0xA;
    const data = new Uint8Array([cmd]);
    await this.device.transferOut(this.endpointOut, data);
  }

  /**
   * Send CMD_CLK
   */
  public async clock(tms: boolean, tdi: boolean, cap: boolean): Promise<void> {
    if (!this.device) return;
    const cmd = 0x0 | (cap ? 4 : 0) | (tdi ? 2 : 0) | (tms ? 1 : 0);
    const data = new Uint8Array([cmd]);
    await this.device.transferOut(this.endpointOut, data);
  }

  /**
   * Send CMD_REP
   * Repeats the last command.
   */
  public async sendRepeat(repeats: number): Promise<void> {
    if (!this.device) return;
    // repeats is encoded into 2 bits in the command: r1 and r0
    // r1 * 2 + r0 determines how many times it repeats.
    // the max repeats handled directly by 1 byte is defined by the hardware, but simple repetitions:
    const r = repeats & 3; // ensure it's max 3 for the command
    const cmd = 0xC + r;
    const data = new Uint8Array([cmd]);
    await this.device.transferOut(this.endpointOut, data);
  }

  /**
   * Set IO Pins Directly
   * VEND_JTAG_SETIO = 1
   * Format: {11'b0, srst, trst, tck, tms, tdi}
   */
  public async setIo(tdi: boolean, tms: boolean, tck: boolean, trst: boolean, srst: boolean): Promise<void> {
    if (!this.device) return;
    let val = 0;
    if (tdi) val |= 1;
    if (tms) val |= 2;
    if (tck) val |= 4;
    if (trst) val |= 8;
    if (srst) val |= 16;
    await this.device.controlTransferOut({
      requestType: 'vendor',
      recipient: 'device',
      request: 1, // VEND_JTAG_SETIO
      value: val,
      index: 0
    });
  }

  /**
   * Read IN endpoint (TDO bits if captured)
   */
  public async readIn(length: number = 64): Promise<Uint8Array | null> {
    if (!this.device) return null;
    try {
      const result = await this.device.transferIn(this.endpointIn, length);
      if (result.status === 'ok' && result.data) {
        return new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength);
      }
      return null;
    } catch (e) {
      console.error('Failed to read IN endpoint:', e);
      return null;
    }
  }

  /**
   * Set JTAG Clock Divisor
   * VEND_JTAG_SETDIV = 0
   */
  public async setDivisor(divisor: number): Promise<void> {
    if (!this.device) return;
    await this.device.controlTransferOut({
      requestType: 'vendor',
      recipient: 'device',
      request: 0,
      value: divisor,
      index: 0
    });
  }

  /**
   * Get TDO State directly
   * VEND_JTAG_GETTDO = 2
   */
  public async getTdo(): Promise<number | null> {
    if (!this.device) return null;
    const result = await this.device.controlTransferIn({
      requestType: 'vendor',
      recipient: 'device',
      request: 2,
      value: 0,
      index: 0
    }, 1);
    
    if (result.status === 'ok' && result.data) {
      return result.data.getUint8(0);
    }
    return null;
  }
}

export const espJtag = new EspJtag();
