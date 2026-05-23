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

  /**
   * RISC-V DMI (Debug Module Interface) Access
   * IR 0x12 = DMI
   */
  public async dmiOp(address: number, data: number, op: 1 | 2): Promise<number | null> {
    if (!this.device) return null;

    try {
      // 1. Load IR with 0x12 (DMI)
      // TAP Reset first
      for (let i = 0; i < 6; i++) await this.clock(true, false, false);
      // Move to Shift-IR (TMS: 0, 1, 1, 0, 0)
      await this.clock(false, false, false); // Idle
      await this.clock(true, false, false);  // Select-DR
      await this.clock(true, false, false);  // Select-IR
      await this.clock(false, false, false); // Capture-IR
      await this.clock(false, false, false); // Shift-IR

      // Shift in 0x12 (5 bits for ESP32-C5)
      const ir_val = 0x12;
      for (let i = 0; i < 4; i++) {
        await this.clock(false, (ir_val >> i) & 1 ? true : false, false);
      }
      await this.clock(true, (ir_val >> 4) & 1 ? true : false, false); // Exit-IR

      // 2. Move to Shift-DR
      await this.clock(true, false, false); // Update-IR
      await this.clock(true, false, false); // Select-DR
      await this.clock(false, false, false); // Capture-DR
      await this.clock(false, false, false); // Shift-DR

      // 3. Shift in DMI Command: [Address (7) | Data (32) | Op (2)] = 41 bits
      // Op: 0=Ignore, 1=Read, 2=Write, 3=Reserved
      
      // Shift 40 bits
      const totalBits = 41;
      // Combine into a BigInt since it's 41 bits
      // We'll shift them out bit by bit
      for (let i = 0; i < totalBits - 1; i++) {
        let bit = 0;
        if (i < 2) bit = (op >> i) & 1;
        else if (i < 34) bit = (data >> (i - 2)) & 1;
        else bit = (address >> (i - 34)) & 1;
        
        await this.clock(false, bit === 1, true);
      }
      // Last bit with TMS=1
      let lastBit = (address >> 6) & 1;
      await this.clock(true, lastBit === 1, true);

      await this.flush();
      
      // 4. Read response
      const resp = await this.readIn(64);
      if (!resp || resp.length < 6) return null;
      
      // Extract data bits from the captured stream
      // This is a simplified extraction for the demo
      const resultData = (resp[4] << 24) | (resp[3] << 16) | (resp[2] << 8) | resp[1];
      return resultData >>> 0;
    } catch (e) {
      return null;
    }
  }

  public async readIdCode(): Promise<string | null> {
    if (!this.device) return null;

    try {
      // 1. Reset TAP (TMS=1 for 5+ clocks)
      for (let i = 0; i < 6; i++) await this.clock(true, false, false);
      
      // 2. Move to Shift-DR (TMS: 0, 1, 0, 0)
      await this.clock(false, false, false); // Run-Test/Idle
      await this.clock(true, false, false);  // Select-DR-Scan
      await this.clock(false, false, false); // Capture-DR
      await this.clock(false, false, false); // Shift-DR

      // 3. Shift out 32 bits while capturing (TDI=0)
      // We use the 'cap' parameter in clock() to tell the hardware to capture TDO
      for (let i = 0; i < 31; i++) {
        await this.clock(false, false, true);
      }
      // Last bit with TMS=1 to exit Shift-DR
      await this.clock(true, false, true);
      
      await this.flush();
      
      // 4. Read captured bits from IN endpoint
      const data = await this.readIn(64);
      if (!data || data.length < 4) return '0x00000000 (Failed to read)';

      // The bits are packed into the returned bytes
      // For simplicity in this demo, we assume the buffer contains the shifted bits
      // In a real implementation, we'd need to parse the bitstream properly.
      const idcode = (data[3] << 24) | (data[2] << 16) | (data[1] << 8) | data[0];
      return `0x${(idcode >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
    } catch (e) {
      console.error('Failed to read IDCODE:', e);
      return null;
    }
  }
}

export const espJtag = new EspJtag();
