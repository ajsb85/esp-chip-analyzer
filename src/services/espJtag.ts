/**
 * WebUSB implementation of ESP USB JTAG.
 * Ported from esp_usb_jtag.c logic.
 * Handles nibble-based command packing and RISC-V DMI protocols.
 */

export class EspJtag {
  private device: USBDevice | null = null;
  private interfaceNumber: number = 0;
  private endpointIn: number = 0;
  private endpointOut: number = 0;

  private nibbleBuffer: number[] = [];

  public async getPairedDevices(): Promise<USBDevice[]> {
    if (!navigator.usb) return [];
    try {
      const devices = await navigator.usb.getDevices();
      return devices.filter(d => d.vendorId === 0x303A && d.productId === 0x1001);
    } catch (e) {
      return [];
    }
  }

  public async connect(selectedDevice?: USBDevice): Promise<boolean> {
    try {
      if (!navigator.usb) return false;
      const device = selectedDevice || await navigator.usb.requestDevice({
        filters: [{ vendorId: 0x303A, productId: 0x1001 }]
      });
      await device.open();
      
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
        await device.close();
        return false;
      }

      this.device = device;
      return true;
    } catch (e) {
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await this.device.releaseInterface(this.interfaceNumber);
        await this.device.close();
      } catch (e) {}
      this.device = null;
    }
  }

  public isConnected(): boolean {
    return this.device !== null;
  }

  public getDevice(): USBDevice | null {
    return this.device;
  }

  private queueNibble(nibble: number) {
    this.nibbleBuffer.push(nibble & 0x0F);
  }

  public async flush(): Promise<void> {
    if (!this.device || this.nibbleBuffer.length === 0) return;

    // Pack nibbles into bytes: high-nibble first, low-nibble second
    const byteCount = Math.ceil(this.nibbleBuffer.length / 2);
    const data = new Uint8Array(byteCount);
    
    for (let i = 0; i < byteCount; i++) {
      const high = this.nibbleBuffer[i * 2] || 0;
      const low = (i * 2 + 1 < this.nibbleBuffer.length) ? this.nibbleBuffer[i * 2 + 1] : 0;
      data[i] = (high << 4) | low;
    }

    await this.device.transferOut(this.endpointOut, data);
    this.nibbleBuffer = [];
  }

  public async setReset(srst: boolean): Promise<void> {
    this.queueNibble(0x8 | (srst ? 1 : 0));
    await this.flush();
  }

  public async clock(tms: boolean, tdi: boolean, cap: boolean): Promise<void> {
    this.queueNibble((cap ? 4 : 0) | (tdi ? 2 : 0) | (tms ? 1 : 0));
  }

  public async writeFlushCommand(): Promise<void> {
    this.queueNibble(0xA); // CMD_FLUSH
    await this.flush();
  }

  /**
   * Send CMD_REP
   * Repeats the last command.
   */
  public async sendRepeat(repeats: number): Promise<void> {
    if (!this.device) return;
    const r = repeats & 3; 
    this.queueNibble(0xC + r);
    await this.flush();
  }

  /**
   * Set IO Pins Directly (VEND_JTAG_SETIO)
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
      request: 1, 
      value: val,
      index: 0
    });
  }

  /**
   * Set JTAG Clock Divisor (VEND_JTAG_SETDIV)
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
   * Get TDO State directly (VEND_JTAG_GETTDO)
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

  public async readIn(length: number = 64): Promise<Uint8Array | null> {
    if (!this.device) return null;
    try {
      const result = await this.device.transferIn(this.endpointIn, length);
      if (result.status === 'ok' && result.data) {
        return new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * ESP32-C5 JTAG IDCODE logic
   */
  public async readIdCode(): Promise<string | null> {
    if (!this.device) return null;

    try {
      // 1. Reset TAP (TMS=1 for 5+ clocks)
      for (let i = 0; i < 7; i++) await this.clock(true, false, false);
      
      // 2. Move to Shift-DR (TMS: 0, 1, 0, 0)
      await this.clock(false, false, false); // Idle
      await this.clock(true, false, false);  // Select-DR-Scan
      await this.clock(false, false, false); // Capture-DR
      await this.clock(false, false, false); // Shift-DR

      // 3. Shift out 32 bits
      for (let i = 0; i < 31; i++) await this.clock(false, false, true);
      await this.clock(true, false, true); // Last bit + Exit-DR
      
      await this.writeFlushCommand();
      
      const data = await this.readIn(16);
      if (!data || data.length < 4) return '0x00000000';

      // Reconstruct 32-bit ID from captured bits
      // Every bit we captured (cap=1) is packed into the IN endpoint
      let id = 0;
      for (let i = 0; i < 32; i++) {
        const byteIdx = Math.floor(i / 8);
        const bitIdx = i % 8;
        if (data[byteIdx] & (1 << bitIdx)) {
          id |= (1 << i);
        }
      }

      return `0x${(id >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
    } catch (e) {
      return null;
    }
  }

  /**
   * RISC-V DMI implementation for ESP32-C5
   */
  public async dmiTransfer(address: number, data: number, op: 1 | 2): Promise<number | null> {
    if (!this.device) return null;

    try {
      // 1. Load IR with 0x12 (DMI)
      for (let i = 0; i < 7; i++) await this.clock(true, false, false); // Reset
      await this.clock(false, false, false); // Idle
      await this.clock(true, false, false);  // Select-DR
      await this.clock(true, false, false);  // Select-IR
      await this.clock(false, false, false); // Capture-IR
      await this.clock(false, false, false); // Shift-IR

      // Shift in 0x12 (5 bits)
      const ir = 0x12;
      for (let i = 0; i < 4; i++) await this.clock(false, (ir >> i) & 1 ? true : false, false);
      await this.clock(true, (ir >> 4) & 1 ? true : false, false); // Exit-IR
      await this.clock(true, false, false); // Update-IR

      // 2. Move to Shift-DR
      await this.clock(true, false, false); // Select-DR
      await this.clock(false, false, false); // Capture-DR
      await this.clock(false, false, false); // Shift-DR

      // 3. Shift in 41 bits [Address (7) | Data (32) | Op (2)]
      // We also capture 41 bits coming out
      for (let i = 0; i < 40; i++) {
        let bit = 0;
        if (i < 2) bit = (op >> i) & 1;
        else if (i < 34) bit = (data >> (i - 2)) & 1;
        else bit = (address >> (i - 34)) & 1;
        await this.clock(false, bit === 1, true);
      }
      // Last bit
      let lastBit = (address >> 6) & 1;
      await this.clock(true, lastBit === 1, true);

      await this.writeFlushCommand();
      
      const resp = await this.readIn(16);
      if (!resp || resp.length < 6) return null;

      // Extract 32-bit data from the 41 bits captured
      // The first 2 bits are 'status', next 32 are 'data'
      let resultData = 0;
      for (let i = 0; i < 32; i++) {
        const bitPos = i + 2;
        const bIdx = Math.floor(bitPos / 8);
        const bPos = bitPos % 8;
        if (resp[bIdx] & (1 << bPos)) {
          resultData |= (1 << i);
        }
      }
      
      return resultData >>> 0;
    } catch (e) {
      return null;
    }
  }

  /**
   * RISC-V System Bus Memory Access
   * sbaddress0 = 0x39
   * sbdata0 = 0x3C
   * sbcs = 0x38
   */
  public async writeMemoryWord(address: number, value: number): Promise<boolean> {
    if (!this.device) return false;
    // 1. Write address
    await this.dmiTransfer(0x39, address, 2); // 2 = Write
    // 2. Write data
    await this.dmiTransfer(0x3C, value, 2);
    return true;
  }

  public async readMemoryWord(address: number): Promise<number | null> {
    if (!this.device) return null;
    // 1. Write address
    await this.dmiTransfer(0x39, address, 2);
    // 2. Trigger read by reading sbdata0
    return await this.dmiTransfer(0x3C, 0, 1); // 1 = Read
  }
}

export const espJtag = new EspJtag();
