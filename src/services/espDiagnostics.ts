import { ESPLoader, Transport } from 'esptool-js';
import { serialManager } from './serialManager';

export interface EspRegisterSnapshot {
  name: string;
  address: string;
  value: string;
  decoded?: string;
}

export interface EspFlashDetails {
  flashId: string;
  manufacturerId: string;
  memoryType: string;
  capacityId: string;
  detectedSize: string;
}

export interface EspSecurityDetails {
  secureBoot: string;
  flashEncryption: string;
  downloadManualEncrypt: string;
  flashEncryptionKey: string;
  keyPurposes: string[];
}

export interface EspChipDetails {
  chipName: string;
  chipType: string;
  macAddress: string;
  crystalFreq: string;
  romExpectedCrystal?: string;
  features: string[];
  description: string;
  flashSize: string;
  flash: EspFlashDetails | null;
  security: EspSecurityDetails | null;
  transport: string;
  usesUsbJtagSerial: boolean | null;
  registers: EspRegisterSnapshot[];
  memoryRegions: string[];
}

export interface FirmwareFlashResult {
  success: boolean;
  flash: EspFlashDetails | null;
  chipName: string;
  bytesWritten: number;
}

export type ProgressCallback = (text: string) => void;

class EspDiagnostics {
  /**
   * Performs the Espressif bootloader handshake and diagnostics.
   */
  public async analyzeChip(
    port: SerialPort,
    baudRate: number,
    options: { useStub: boolean },
    onProgress: ProgressCallback,
  ): Promise<EspChipDetails | null> {
    let transport: Transport | null = null;
    try {
      const connection = await this.createConnectedLoader(port, baudRate, onProgress);
      transport = connection.transport;
      const loader = connection.loader;

      if (options.useStub) {
        try {
          onProgress('Uploading diagnostic stub...');
          await loader.runStub();
        } catch (_stubErr) {
          onProgress('Warning: Failed to load stub. Continuing in ROM mode...');
        }
      }

      const chip = loader.chip;
      if (!chip) {
        throw new Error('Sync completed but chip ROM module was not initialized.');
      }

      onProgress('Reading MAC address...');
      const macAddress = await this.tryRead('MAC address', () => chip.readMac(loader), 'Unknown');

      onProgress('Querying hardware features...');
      const freqVal = await this.tryRead('crystal frequency', () => chip.getCrystalFreq(loader), null);
      const romExpectedCrystal = await this.tryRead(
        'ROM expected crystal frequency',
        async () => {
          const candidate = chip as unknown as { getCrystalFreqRomExpect?: (loader: ESPLoader) => Promise<number> };
          if (!candidate.getCrystalFreqRomExpect) return null;
          return await candidate.getCrystalFreqRomExpect(loader);
        },
        null,
      );
      const crystalFreq = freqVal === null ? 'Unknown' : `${freqVal} MHz`;
      const features = await this.tryRead('chip features', () => chip.getChipFeatures(loader), []);
      const description = await this.tryRead('chip description', () => chip.getChipDescription(loader), 'N/A');

      onProgress('Detecting flash chip...');
      const flash = await this.readFlashDetails(loader, onProgress);

      onProgress('Reading security-related eFuse fields...');
      const security = await this.readSecurityDetails(loader);

      const usesUsbJtagSerial = await this.tryRead(
        'USB-JTAG/Serial transport marker',
        async () => {
          const candidate = chip as unknown as { usesUsbJtagSerial?: (loader: ESPLoader) => Promise<boolean> };
          if (!candidate.usesUsbJtagSerial) return null;
          return await candidate.usesUsbJtagSerial(loader);
        },
        null,
      );

      const registers = await this.readRegisterSnapshot(loader);
      const memoryRegions = this.describeMemoryMap(chip);

      onProgress('Diagnostic scan completed.');

      return {
        chipName: chip.CHIP_NAME || connection.chipType,
        chipType: connection.chipType,
        macAddress,
        crystalFreq,
        romExpectedCrystal: romExpectedCrystal === null ? undefined : `${romExpectedCrystal} MHz`,
        features,
        description,
        flashSize: flash?.detectedSize || 'Unknown',
        flash,
        security,
        transport: usesUsbJtagSerial ? 'Native USB-JTAG/Serial CDC' : 'UART / CDC serial bootloader',
        usesUsbJtagSerial,
        registers,
        memoryRegions,
      };
    } catch (err: unknown) {
      console.error('[EspDiagnostics] Error running diagnostics:', err);
      const msg = err instanceof Error ? err.message : String(err);
      onProgress(`Error: ${msg}`);
      return null;
    } finally {
      if (transport) {
        try {
          await transport.disconnect();
        } catch (_e) {
          // ignore already closed ports
        }
      }
    }
  }

  /**
   * Resets the Espressif chip into standard firmware execution mode.
   */
  public async hardReset(port: SerialPort): Promise<void> {
    let transport: Transport | null = null;
    let openedHere = false;
    try {
      const info = port.getInfo();
      const isUsbJtag = info.usbVendorId === 0x303A && info.usbProductId === 0x1001;

      transport = new Transport(port, true);
      if (!port.readable && !port.writable) {
        await transport.connect(115200);
        openedHere = true;
      }

      if (isUsbJtag) {
        await transport.setRTS(false);
        await transport.setDTR(false);
        await this.sleep(100);
        await transport.setDTR(true);
        await transport.setRTS(false);
        await this.sleep(100);
        await transport.setRTS(true);
        await transport.setDTR(false);
        await transport.setRTS(true);
        await this.sleep(100);
        await transport.setRTS(false);
        await transport.setDTR(false);
      } else {
        await transport.setDTR(false);
        await transport.setRTS(true);
        await this.sleep(100);
        await transport.setDTR(true);
        await transport.setRTS(false);
        await this.sleep(100);
        await transport.setDTR(false);
        await transport.setRTS(false);
      }
      serialManager.setChipMode('Execution');
    } catch (err) {
      console.error('[EspDiagnostics] Hard reset failed:', err);
    } finally {
      if (transport && openedHere) {
        try {
          await transport.disconnect();
        } catch (_e) {
          // ignore
        }
      }
    }
  }

  /**
   * Erases all flash on the connected ESP chip.
   */
  public async eraseAllFlash(
    port: SerialPort,
    baudRate: number,
    options: { useStub: boolean },
    onProgress: (msg: string) => void,
  ): Promise<boolean> {
    let transport: Transport | null = null;
    let loader: ESPLoader | null = null;
    try {
      const connection = await this.createConnectedLoader(port, baudRate, onProgress);
      transport = connection.transport;
      loader = connection.loader;

      if (options.useStub) {
        try {
          onProgress('Uploading flasher stub...');
          await loader.runStub();
        } catch (_stubErr) {
          onProgress('Warning: Failed to load stub. Continuing in ROM mode...');
        }
      }

      onProgress('Erasing all flash (this may take a while)...');
      await loader.eraseFlash();
      onProgress('Flash erased successfully.');
      return true;
    } catch (err: unknown) {
      console.error('[EspDiagnostics] Erasing error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      onProgress(`Error: ${msg}`);
      return false;
    } finally {
      if (transport) {
        try {
          await transport.disconnect();
        } catch (_e) {
          // ignore
        }
      }
    }
  }

  /**
   * Performs the Espressif bootloader handshake and flashes firmware files.
   */
  public async flashFirmware(
    port: SerialPort,
    baudRate: number,
    fileArray: { data: Uint8Array; address: number }[],
    options: { useStub: boolean; verifyMd5?: boolean; eraseAll?: boolean },
    onProgress: (msg: string, percent?: number) => void,
  ): Promise<FirmwareFlashResult> {
    let transport: Transport | null = null;
    let loader: ESPLoader | null = null;
    try {
      const totalBytes = fileArray.reduce((sum, file) => sum + file.data.length, 0);
      const connection = await this.createConnectedLoader(port, baudRate, (msg) => onProgress(msg));
      transport = connection.transport;
      loader = connection.loader;

      if (options.useStub) {
        try {
          onProgress('Uploading flasher stub...');
          await loader.runStub();
        } catch (_stubErr) {
          onProgress('Warning: Failed to load stub. Falling back to ROM mode...');
        }
      }

      if (baudRate !== 115200) {
        try {
          onProgress(`Switching bootloader link to ${baudRate.toLocaleString()} bps...`);
          const chipWithChangeBaud = loader.chip as unknown as { changeBaud?: (loader: ESPLoader) => Promise<void> };
          if (chipWithChangeBaud.changeBaud) {
            await chipWithChangeBaud.changeBaud(loader);
          } else {
            await loader.changeBaud();
          }
        } catch (_baudErr) {
          onProgress('Warning: Baud-rate switch failed. Retrying flash at ROM default 115200 bps...');
        }
      }

      const flash = await this.readFlashDetails(loader, (msg) => onProgress(msg));

      onProgress(`Flashing ${this.formatBytes(totalBytes)} firmware image...`);
      await loader.writeFlash({
        fileArray,
        flashMode: 'keep',
        flashFreq: 'keep',
        flashSize: 'keep',
        eraseAll: options.eraseAll ?? false,
        compress: true,
        calculateMD5Hash: options.verifyMd5 ? this.md5Hex : undefined,
        reportProgress: (fileIndex: number, written: number, total: number) => {
          const precedingBytes = fileArray.slice(0, fileIndex).reduce((sum, file) => sum + file.data.length, 0);
          const aggregateWritten = Math.min(precedingBytes + written, totalBytes);
          const percent = totalBytes > 0 ? Math.round((aggregateWritten / totalBytes) * 100) : 0;
          onProgress(
            `Writing image ${fileIndex + 1}/${fileArray.length}: ${this.formatBytes(written)} / ${this.formatBytes(total)}`,
            percent,
          );
        },
      });

      onProgress('Flash write completed. Resetting device...');

      try {
        await loader.after('hard_reset', port.getInfo().usbProductId === 0x1001);
      } catch (_resetErr) {
        await transport.disconnect();
        transport = null;
        await this.hardReset(port);
      }

      return {
        success: true,
        flash,
        chipName: loader.chip?.CHIP_NAME || connection.chipType,
        bytesWritten: totalBytes,
      };
    } catch (err: unknown) {
      console.error('[EspDiagnostics] Flashing error:', err);
      onProgress(`Error: ${err instanceof Error ? err.message : String(err)}`);
      return {
        success: false,
        flash: null,
        chipName: loader?.chip?.CHIP_NAME || 'Unknown',
        bytesWritten: 0,
      };
    } finally {
      if (transport) {
        try {
          await transport.disconnect();
        } catch (_e) {
          // ignore
        }
      }
    }
  }

  private async createConnectedLoader(
    port: SerialPort,
    baudRate: number,
    onProgress: ProgressCallback,
  ): Promise<{ transport: Transport; loader: ESPLoader; chipType: string }> {
    onProgress('Connecting to transport...');
    const transport = new Transport(port, true);

    const termMock = {
      clean: () => {},
      writeLine: (data: string) => {
        if (data.trim() !== '') onProgress(data.trim());
      },
      write: (data: string) => {
        if (data.trim() !== '') onProgress(data.trim());
      },
    };

    const loader = new ESPLoader({
      transport,
      baudrate: baudRate,
      terminal: termMock,
      debugLogging: false,
    });

    onProgress('Synchronizing with bootloader...');
    await loader.detectChip();
    serialManager.setChipMode('Download');
    const chipType = loader.chip?.CHIP_NAME || 'Unknown';
    onProgress(`Chip type identified: ${chipType}`);

    return { transport, loader, chipType };
  }

  private async readFlashDetails(
    loader: ESPLoader,
    onProgress?: ProgressCallback,
  ): Promise<EspFlashDetails | null> {
    try {
      const flashId = await loader.readFlashId();
      const manufacturerId = flashId & 0xff;
      const memoryType = (flashId >> 8) & 0xff;
      const capacityId = (flashId >> 16) & 0xff;
      const detectedSize = await loader.detectFlashSize();
      return {
        flashId: `0x${flashId.toString(16).toUpperCase().padStart(6, '0')}`,
        manufacturerId: `0x${manufacturerId.toString(16).toUpperCase().padStart(2, '0')}`,
        memoryType: `0x${memoryType.toString(16).toUpperCase().padStart(2, '0')}`,
        capacityId: `0x${capacityId.toString(16).toUpperCase().padStart(2, '0')}`,
        detectedSize,
      };
    } catch (flashErr) {
      console.error('Failed to read flash details:', flashErr);
      onProgress?.('Warning: Flash ID/size detection failed.');
      return null;
    }
  }

  private async readSecurityDetails(loader: ESPLoader): Promise<EspSecurityDetails | null> {
    const chip = loader.chip as unknown as {
      EFUSE_SPI_BOOT_CRYPT_CNT_REG?: number;
      EFUSE_SPI_BOOT_CRYPT_CNT_MASK?: number;
      EFUSE_SECURE_BOOT_EN_REG?: number;
      EFUSE_SECURE_BOOT_EN_MASK?: number;
      EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT_REG?: number;
      EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT?: number;
      EFUSE_MAX_KEY?: number;
      KEY_PURPOSES?: Record<number, string>;
      getKeyBlockPurpose?: (loader: ESPLoader, keyBlock: number) => Promise<number>;
      isFlashEncryptionKeyValid?: (loader: ESPLoader) => Promise<boolean>;
    };

    if (!chip.EFUSE_SECURE_BOOT_EN_REG && !chip.EFUSE_SPI_BOOT_CRYPT_CNT_REG) {
      return null;
    }

    const secureBootEnabled = await this.tryRead('secure boot eFuse', async () => {
      if (!chip.EFUSE_SECURE_BOOT_EN_REG || !chip.EFUSE_SECURE_BOOT_EN_MASK) return null;
      const value = await loader.readReg(chip.EFUSE_SECURE_BOOT_EN_REG);
      return (value & chip.EFUSE_SECURE_BOOT_EN_MASK) !== 0;
    }, null);

    const cryptCount = await this.tryRead('flash encryption count', async () => {
      if (!chip.EFUSE_SPI_BOOT_CRYPT_CNT_REG || !chip.EFUSE_SPI_BOOT_CRYPT_CNT_MASK) return null;
      const value = await loader.readReg(chip.EFUSE_SPI_BOOT_CRYPT_CNT_REG);
      const masked = value & chip.EFUSE_SPI_BOOT_CRYPT_CNT_MASK;
      return this.countSetBits(masked);
    }, null);

    const downloadManualEncryptDisabled = await this.tryRead('manual encryption disable eFuse', async () => {
      if (!chip.EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT_REG || !chip.EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT) return null;
      const value = await loader.readReg(chip.EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT_REG);
      return (value & chip.EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT) !== 0;
    }, null);

    const keyPurposes: string[] = [];
    if (chip.getKeyBlockPurpose && chip.EFUSE_MAX_KEY !== undefined) {
      for (let keyBlock = 0; keyBlock <= chip.EFUSE_MAX_KEY; keyBlock++) {
        const purpose = await this.tryRead(`key block ${keyBlock} purpose`, () => chip.getKeyBlockPurpose!(loader, keyBlock), null);
        if (purpose !== null) {
          const purposeLabel = chip.KEY_PURPOSES?.[purpose] || `Purpose ${purpose}`;
          keyPurposes.push(`KEY${keyBlock}: ${purposeLabel}`);
        }
      }
    }

    const flashEncryptionKeyValid = await this.tryRead('flash encryption key validity', async () => {
      if (!chip.isFlashEncryptionKeyValid) return null;
      return await chip.isFlashEncryptionKeyValid(loader);
    }, null);

    return {
      secureBoot: secureBootEnabled === null ? 'Unknown' : secureBootEnabled ? 'Enabled' : 'Disabled',
      flashEncryption: cryptCount === null
        ? 'Unknown'
        : cryptCount % 2 === 1
          ? `Enabled (${cryptCount} SPI_BOOT_CRYPT_CNT bits set)`
          : `Disabled (${cryptCount} SPI_BOOT_CRYPT_CNT bits set)`,
      downloadManualEncrypt: downloadManualEncryptDisabled === null
        ? 'Unknown'
        : downloadManualEncryptDisabled
          ? 'Disabled by eFuse'
          : 'Allowed',
      flashEncryptionKey: flashEncryptionKeyValid === null
        ? 'Unknown'
        : flashEncryptionKeyValid
          ? 'Present / assigned'
          : 'Not assigned',
      keyPurposes,
    };
  }

  private async readRegisterSnapshot(loader: ESPLoader): Promise<EspRegisterSnapshot[]> {
    const chip = loader.chip as unknown as {
      EFUSE_RD_REG_BASE?: number;
      EFUSE_BLOCK1_ADDR?: number;
      EFUSE_SPI_BOOT_CRYPT_CNT_REG?: number;
      EFUSE_SECURE_BOOT_EN_REG?: number;
      UART_CLKDIV_REG?: number;
      PCR_SYSCLK_CONF_REG?: number;
    };

    const candidates = [
      { name: 'EFUSE block0 read base', address: chip.EFUSE_RD_REG_BASE },
      { name: 'EFUSE block1 read base', address: chip.EFUSE_BLOCK1_ADDR },
      { name: 'SPI_BOOT_CRYPT_CNT register', address: chip.EFUSE_SPI_BOOT_CRYPT_CNT_REG },
      { name: 'SECURE_BOOT_EN register', address: chip.EFUSE_SECURE_BOOT_EN_REG },
      { name: 'UART clock divider', address: chip.UART_CLKDIV_REG },
      { name: 'PCR XTAL frequency config', address: chip.PCR_SYSCLK_CONF_REG },
    ];

    const snapshots: EspRegisterSnapshot[] = [];
    for (const candidate of candidates) {
      if (candidate.address === undefined) continue;
      const value = await this.tryRead(candidate.name, () => loader.readReg(candidate.address!), null);
      if (value === null) continue;
      snapshots.push({
        name: candidate.name,
        address: this.hex32(candidate.address),
        value: this.hex32(value),
      });
    }
    return snapshots;
  }

  private describeMemoryMap(chip: ESPLoader['chip']): string[] {
    return chip.MEMORY_MAP.map(([start, end, name]) => `${name}: ${this.hex32(start)}-${this.hex32(end)}`);
  }

  private async tryRead<T>(label: string, reader: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await reader();
    } catch (err) {
      console.warn(`[EspDiagnostics] Failed to read ${label}:`, err);
      return fallback;
    }
  }

  private md5Hex(data: Uint8Array): string {
    const rotateLeft = (value: number, shift: number) => (value << shift) | (value >>> (32 - shift));
    const add = (a: number, b: number) => (a + b) >>> 0;
    const s = [
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
    ];
    const k = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
    const bitLength = data.length * 8;
    const paddedLength = (((data.length + 8) >> 6) + 1) << 6;
    const buffer = new Uint8Array(paddedLength);
    buffer.set(data);
    buffer[data.length] = 0x80;
    const view = new DataView(buffer.buffer);
    view.setUint32(paddedLength - 8, bitLength >>> 0, true);
    view.setUint32(paddedLength - 4, Math.floor(bitLength / 2 ** 32), true);

    let a0 = 0x67452301;
    let b0 = 0xefcdab89;
    let c0 = 0x98badcfe;
    let d0 = 0x10325476;

    for (let offset = 0; offset < paddedLength; offset += 64) {
      let a = a0;
      let b = b0;
      let c = c0;
      let d = d0;

      for (let i = 0; i < 64; i++) {
        let f: number;
        let g: number;
        if (i < 16) {
          f = (b & c) | (~b & d);
          g = i;
        } else if (i < 32) {
          f = (d & b) | (~d & c);
          g = (5 * i + 1) % 16;
        } else if (i < 48) {
          f = b ^ c ^ d;
          g = (3 * i + 5) % 16;
        } else {
          f = c ^ (b | ~d);
          g = (7 * i) % 16;
        }
        const word = view.getUint32(offset + g * 4, true);
        const next = d;
        d = c;
        c = b;
        b = add(b, rotateLeft(add(add(a, f >>> 0), add(k[i], word)), s[i]));
        a = next;
      }

      a0 = add(a0, a);
      b0 = add(b0, b);
      c0 = add(c0, c);
      d0 = add(d0, d);
    }

    const digest = new Uint8Array(16);
    const digestView = new DataView(digest.buffer);
    digestView.setUint32(0, a0, true);
    digestView.setUint32(4, b0, true);
    digestView.setUint32(8, c0, true);
    digestView.setUint32(12, d0, true);
    return Array.from(digest).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private hex32(value: number): string {
    return `0x${(value >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  }

  private countSetBits(value: number): number {
    let current = value >>> 0;
    let count = 0;
    while (current) {
      count += current & 1;
      current >>>= 1;
    }
    return count;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const espDiagnostics = new EspDiagnostics();
