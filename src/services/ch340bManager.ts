export interface CH34xConfig {
  chipType: 'CH340' | 'CH343';
  sig: number;
  mode: number;
  cfg: number;
  wp: number;
  vid: number;
  pid: number;
  bcd?: number;       // CH343 only
  power: number;      // Max Power in mA (raw value * 2)
  attributes?: number;// CH343 only
  serialNumber: string;
  productString: string;
  manufacturerString?: string; // CH343 only
  rawBytes: Uint8Array;
}

class CH340BManager {
  /**
   * Helper to decode UTF-16LE bytes to standard Javascript string
   */
  private decodeUTF16LE(bytes: number[]): string {
    let str = '';
    for (let i = 0; i < bytes.length; i += 2) {
      if (i + 1 < bytes.length) {
        const charCode = bytes[i] | (bytes[i + 1] << 8);
        if (charCode === 0) break; // Null terminator
        str += String.fromCharCode(charCode);
      }
    }
    return str;
  }

  /**
   * Helper to decode a standard USB string descriptor block
   */
  private decodeDescriptorString(rawBytes: Uint8Array, startOffset: number, maxLength: number): string {
    const len = rawBytes[startOffset];
    if (len < 2 || len > maxLength) return '';
    const type = rawBytes[startOffset + 1];
    if (type !== 0x03) return ''; // String descriptor type is always 0x03
    
    const charBytes: number[] = [];
    const endOffset = startOffset + Math.min(len, maxLength);
    for (let i = startOffset + 2; i < endOffset; i++) {
      charBytes.push(rawBytes[i]);
    }
    return this.decodeUTF16LE(charBytes);
  }

  /**
   * Helper to encode a string into standard USB string descriptor block
   */
  private encodeDescriptorString(str: string, maxLength: number): Uint8Array {
    const maxCharBytes = maxLength - 2;
    const unicodeBytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      unicodeBytes.push(charCode & 0xFF);
      unicodeBytes.push((charCode >> 8) & 0xFF);
    }
    const truncatedBytes = unicodeBytes.slice(0, maxCharBytes);
    const block = new Uint8Array(maxLength);
    block[0] = truncatedBytes.length + 2;
    block[1] = 0x03;
    block.set(truncatedBytes, 2);
    return block;
  }

  /**
   * Reads the EEPROM configuration data from a connected WCH chip (CH340B or CH343/CH9102).
   * Assumes the port is already opened at 300 baud.
   */
  public async readConfig(
    port: SerialPort,
    onProgress?: (current: number, total: number) => void
  ): Promise<CH34xConfig> {
    // 1. Establish RTS & DTR lines for programming mode
    await port.setSignals({ dataTerminalReady: true, requestToSend: true });

    const writer = port.writable!.getWriter();
    const reader = port.readable!.getReader();

    try {
      // Helper function to read a single byte from a register address with a timeout
      const readByte = async (addr: number): Promise<number> => {
        const cmd = new Uint8Array([0x40, 0xA1, addr, 0x00]);
        await writer.write(cmd);
        
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Timeout waiting for response from chip at register 0x${addr.toString(16).toUpperCase()}`));
          }, 1000); // 1000ms timeout per register query to account for OS latency
        });

        try {
          const { value, done } = await Promise.race([reader.read(), timeoutPromise]);
          if (timeoutId !== undefined) clearTimeout(timeoutId);
          if (done || !value || value.length === 0) {
            throw new Error(`Failed to read byte from register 0x${addr.toString(16).toUpperCase()}`);
          }
          return value[0];
        } catch (err) {
          if (timeoutId !== undefined) clearTimeout(timeoutId);
          try {
            // Cancel reader on timeout to unlock the stream
            await reader.cancel();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_e) { /* ignore */ }
          throw err;
        }
      };

      // 1. Read signature byte at 0x00 to detect chip generation
      const sig = await readByte(0x00);
      let chipType: 'CH340' | 'CH343' = 'CH340';
      let totalBytes = 64;

      if (sig === 0x53) {
        chipType = 'CH343';
        totalBytes = 120; // CH343 config block is 120 bytes
      } else if (sig === 0x5B) {
        chipType = 'CH340';
        totalBytes = 64; // CH340B config block is 64 bytes
      } else {
        // Fallback or unknown, try to read 64 bytes
        chipType = 'CH340';
        totalBytes = 64;
      }

      const rawBytes = new Uint8Array(totalBytes);
      rawBytes[0] = sig;

      if (onProgress) onProgress(1, totalBytes);

      // Read remaining bytes sequentially
      for (let addr = 1; addr < totalBytes; addr++) {
        rawBytes[addr] = await readByte(addr);
        if (onProgress) onProgress(addr + 1, totalBytes);
      }

      // Decode structures according to chip layout
      const mode = rawBytes[0x01];
      const cfg = rawBytes[0x02];
      const wp = rawBytes[0x03];
      const vid = rawBytes[0x04] | (rawBytes[0x05] << 8);
      const pid = rawBytes[0x06] | (rawBytes[0x07] << 8);
      const power = rawBytes[0x0A] * 2; // Power in mA

      let serialNumber = '';
      let productString = '';
      let manufacturerString = '';
      let bcd: number | undefined;
      let attributes: number | undefined;

      if (chipType === 'CH343') {
        // CH343: offset 0x08-0x09 is BCD version, 0x0B is attributes
        bcd = rawBytes[0x08] | (rawBytes[0x09] << 8);
        attributes = rawBytes[0x0B];

        // Decoders for String Descriptors
        serialNumber = this.decodeDescriptorString(rawBytes, 0x10, 24);
        productString = this.decodeDescriptorString(rawBytes, 0x28, 40);
        manufacturerString = this.decodeDescriptorString(rawBytes, 0x50, 40);
      } else {
        // CH340B: offset 0x10-0x17 is 8-byte ASCII serial number
        const asciiBytes: number[] = [];
        for (let i = 0x10; i <= 0x17; i++) {
          if (rawBytes[i] >= 0x20 && rawBytes[i] <= 0x7E) {
            asciiBytes.push(rawBytes[i]);
          }
        }
        serialNumber = String.fromCharCode(...asciiBytes);

        // Product String: descriptor length at 0x1A, type at 0x1B, chars from 0x1C to 0x3F (max 38 bytes)
        productString = this.decodeDescriptorString(rawBytes, 0x1A, 38);
      }

      return {
        chipType,
        sig,
        mode,
        cfg,
        wp,
        vid,
        pid,
        bcd,
        power,
        attributes,
        serialNumber,
        productString,
        manufacturerString,
        rawBytes
      };

    } finally {
      writer.releaseLock();
      reader.releaseLock();
    }
  }

  /**
   * Writes the EEPROM configuration data to a connected CH340B or CH343/CH9102 chip.
   * Assumes the port is already opened at 300 baud.
   */
  public async writeConfig(
    port: SerialPort,
    data: Omit<CH34xConfig, 'rawBytes'>,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    await port.setSignals({ dataTerminalReady: true, requestToSend: true });

    const writer = port.writable!.getWriter();

    try {
      const writeByte = async (addr: number, val: number): Promise<void> => {
        const cmd = new Uint8Array([0x40, 0xA0, addr, val]);
        await writer.write(cmd);
        // Delay between byte writes for stable EEPROM latching
        await new Promise(resolve => setTimeout(resolve, 40));
      };

      const totalBytes = data.chipType === 'CH343' ? 120 : 64;
      const buffer = new Uint8Array(totalBytes);

      // Reconstruct buffer based on chip profile
      buffer[0x00] = data.sig;
      buffer[0x01] = data.mode;
      buffer[0x02] = data.cfg;
      buffer[0x03] = data.wp;
      buffer[0x04] = data.vid & 0xFF;
      buffer[0x05] = (data.vid >> 8) & 0xFF;
      buffer[0x06] = data.pid & 0xFF;
      buffer[0x07] = (data.pid >> 8) & 0xFF;
      buffer[0x0A] = Math.min(255, Math.floor(data.power / 2)); // power in 2mA steps

      if (data.chipType === 'CH343') {
        // CH343 specifics
        buffer[0x08] = (data.bcd || 0x0100) & 0xFF;
        buffer[0x09] = ((data.bcd || 0x0100) >> 8) & 0xFF;
        buffer[0x0B] = data.attributes || 0x80; // Default: bus powered

        // Encode string descriptors
        const serialBlock = this.encodeDescriptorString(data.serialNumber, 24);
        buffer.set(serialBlock, 0x10);

        const productBlock = this.encodeDescriptorString(data.productString, 40);
        buffer.set(productBlock, 0x28);

        const manufacturerBlock = this.encodeDescriptorString(data.manufacturerString || '', 40);
        buffer.set(manufacturerBlock, 0x50);
      } else {
        // CH340B specifics
        // Serial: 8 bytes raw ASCII
        const serialAscii = new Uint8Array(8);
        const encodedSerial = new TextEncoder().encode(data.serialNumber.slice(0, 8));
        serialAscii.set(encodedSerial);
        buffer.set(serialAscii, 0x10);

        // Product String: 38 bytes max starting at 0x1A
        const productBlock = this.encodeDescriptorString(data.productString, 38);
        buffer.set(productBlock, 0x1A);
      }

      // Write signature first to unlock subsequent writes
      await writeByte(0x00, data.sig);
      if (onProgress) onProgress(1, totalBytes);

      // Write all other registers
      for (let addr = 1; addr < totalBytes; addr++) {
        await writeByte(addr, buffer[addr]);
        if (onProgress) onProgress(addr + 1, totalBytes);
      }

    } finally {
      writer.releaseLock();
    }
  }
}

export const ch340bManager = new CH340BManager();
