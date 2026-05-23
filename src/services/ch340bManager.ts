export interface CH340BConfigData {
  vid: number;
  pid: number;
  serialNumber: string;
  productString: string;
  rawBytes?: {
    vidBytes: number[];
    pidBytes: number[];
    serialBytes: number[];
    productBytes: number[];
  };
}

class CH340BManager {
  /**
   * Reads the EEPROM configuration data from a connected CH340B chip.
   * Assumes the port is already opened at 300 baud.
   */
  public async readConfig(port: SerialPort): Promise<CH340BConfigData> {
    // 1. Establish RTS & DTR lines for programming mode
    await port.setSignals({ dataTerminalReady: true, requestToSend: true });

    const writer = port.writable!.getWriter();
    const reader = port.readable!.getReader();

    const vidBytes: number[] = [];
    const pidBytes: number[] = [];
    const serialBytes: number[] = [];
    const productBytes: number[] = [];

    try {
      // Helper function to read a single byte from a register address with a timeout
      const readByte = async (addr: number): Promise<number> => {
        const cmd = new Uint8Array([0x40, 0xA1, addr, 0x00]);
        await writer.write(cmd);
        
        let timeoutId: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Timeout waiting for response from chip at register 0x${addr.toString(16).toUpperCase()}`));
          }, 800); // 800ms timeout per register query
        });

        try {
          const { value, done } = await Promise.race([reader.read(), timeoutPromise]);
          clearTimeout(timeoutId);
          if (done || !value || value.length === 0) {
            throw new Error(`Failed to read byte from register 0x${addr.toString(16).toUpperCase()}`);
          }
          return value[0];
        } catch (err) {
          clearTimeout(timeoutId);
          try {
            // Cancel reader on timeout to unlock the stream
            await reader.cancel();
          } catch (e) {}
          throw err;
        }
      };

      // Read VID at 0x04 (LSB) and 0x05 (MSB)
      const vidLsb = await readByte(0x04);
      vidBytes.push(vidLsb);
      const vidMsb = await readByte(0x05);
      vidBytes.push(vidMsb);
      const vid = (vidMsb << 8) | vidLsb;

      // Read PID at 0x06 (LSB) and 0x07 (MSB)
      const pidLsb = await readByte(0x06);
      pidBytes.push(pidLsb);
      const pidMsb = await readByte(0x07);
      pidBytes.push(pidMsb);
      const pid = (pidMsb << 8) | pidLsb;

      // Read Serial Number at 0x10 to 0x17 (8 bytes ASCII)
      for (let i = 0x10; i <= 0x17; i++) {
        const b = await readByte(i);
        serialBytes.push(b);
      }
      
      // Decode serial bytes as ASCII (printable chars only)
      let serialNumber = '';
      if (serialBytes[0] > 0x20 && serialBytes[0] < 0x7F) {
        serialNumber = String.fromCharCode(...serialBytes.filter(b => b >= 0x20 && b <= 0x7E));
      }

      // Read Product String Length at 0x1A
      const prodStringLen = await readByte(0x1A);
      productBytes.push(prodStringLen);
      
      // Read Product String descriptor tag at 0x1B (usually 0x03)
      const descriptorTag = await readByte(0x1B);
      productBytes.push(descriptorTag);

      // Read Product String bytes (from 0x1C to 0x3F)
      const maxAddr = Math.min(0x3F, 0x1C + (prodStringLen - 3)); // prodStringLen includes the len byte and the tag byte
      for (let i = 0x1C; i <= maxAddr; i++) {
        const b = await readByte(i);
        productBytes.push(b);
      }

      // Decode Product String as UTF-16LE (Unicode)
      let productString = '';
      for (let i = 2; i < productBytes.length; i += 2) {
        if (i + 1 < productBytes.length) {
          const charCode = productBytes[i] | (productBytes[i + 1] << 8);
          if (charCode !== 0) {
            productString += String.fromCharCode(charCode);
          }
        }
      }

      return {
        vid,
        pid,
        serialNumber,
        productString,
        rawBytes: {
          vidBytes,
          pidBytes,
          serialBytes,
          productBytes
        }
      };
    } finally {
      writer.releaseLock();
      reader.releaseLock();
    }
  }

  /**
   * Writes the EEPROM configuration data to a connected CH340B chip.
   * Assumes the port is already opened at 300 baud.
   */
  public async writeConfig(port: SerialPort, data: CH340BConfigData): Promise<void> {
    await port.setSignals({ dataTerminalReady: true, requestToSend: true });

    const writer = port.writable!.getWriter();

    try {
      const writeByte = async (addr: number, val: number): Promise<void> => {
        const cmd = new Uint8Array([0x40, 0xA0, addr, val]);
        await writer.write(cmd);
        // Short delay between byte writes for stable EEPROM latching
        await new Promise(resolve => setTimeout(resolve, 40));
      };

      // 1. Write the magic unlock latch to enable EEPROM writes
      await writeByte(0x00, 0x5B);

      // 2. Write VID (0x04 = LSB, 0x05 = MSB)
      await writeByte(0x04, data.vid & 0xFF);
      await writeByte(0x05, (data.vid >> 8) & 0xFF);

      // 3. Write PID (0x06 = LSB, 0x07 = MSB)
      await writeByte(0x06, data.pid & 0xFF);
      await writeByte(0x07, (data.pid >> 8) & 0xFF);

      // 4. Write Serial Number (8 bytes max, padded with 0x00 or spaces)
      const serialBuffer = new Uint8Array(8);
      const encodedSerial = new TextEncoder().encode(data.serialNumber.slice(0, 8));
      serialBuffer.set(encodedSerial);
      for (let i = 0; i < 8; i++) {
        await writeByte(0x10 + i, serialBuffer[i]);
      }

      // 5. Write Product String (Unicode/UTF-16LE, up to 36 bytes)
      const unicodeChars: number[] = [];
      for (let i = 0; i < data.productString.length; i++) {
        const charCode = data.productString.charCodeAt(i);
        unicodeChars.push(charCode & 0xFF);
        unicodeChars.push((charCode >> 8) & 0xFF);
      }
      
      // Limit to max 36 bytes (18 characters)
      const truncatedUnicode = unicodeChars.slice(0, 36);

      // First descriptor byte: length (characters bytes + 2 bytes header)
      await writeByte(0x1A, truncatedUnicode.length + 2);
      // Second descriptor byte: type (0x03 for String Descriptor)
      await writeByte(0x1B, 0x03);

      // Write UTF-16LE string bytes
      const prodStringBuffer = new Uint8Array(36);
      prodStringBuffer.set(truncatedUnicode);
      for (let i = 0; i < 36; i++) {
        await writeByte(0x1C + i, prodStringBuffer[i]);
      }

    } finally {
      writer.releaseLock();
    }
  }
}

export const ch340bManager = new CH340BManager();
