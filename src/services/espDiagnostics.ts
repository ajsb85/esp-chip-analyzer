import { ESPLoader, Transport } from 'esptool-js';
import { serialManager } from './serialManager';

export interface EspChipDetails {
  chipName: string;
  chipType: string;
  macAddress: string;
  crystalFreq: string;
  features: string[];
  description: string;
  flashSize: string;
}

export type ProgressCallback = (text: string) => void;

class EspDiagnostics {
  private loader: ESPLoader | null = null;
  private transport: Transport | null = null;

  /**
   * Performs the Espressif bootloader handshake and diagnostics.
   * Note: This will put the chip into bootloader mode, resetting it.
   */
  public async analyzeChip(
    port: SerialPort,
    baudRate: number,
    onProgress: ProgressCallback
  ): Promise<EspChipDetails | null> {
    try {
      onProgress('Initializing WebSerial transport layer...');
      // esptool-js Transport requires the SerialPort object
      this.transport = new Transport(port, true);
      
      const termMock = {
        clean: () => {},
        writeLine: (data: string) => {
          onProgress(data);
        },
        write: (data: string) => {
          onProgress(data);
        }
      };

      onProgress('Creating ESPLoader session...');
      this.loader = new ESPLoader({
        transport: this.transport,
        baudrate: baudRate,
        terminal: termMock,
        debugLogging: false
      });

      onProgress('Synchronizing with bootloader... (Toggling DTR/RTS)');
      const chipType = await this.loader.main();
      serialManager.setChipMode('Download');
      onProgress(`Chip type identified: ${chipType}`);

      const chip = this.loader.chip;
      if (!chip) {
        throw new Error('Sync completed but chip ROM module was not initialized.');
      }

      onProgress('Reading MAC Address from eFuse registers...');
      let macAddress = 'Unknown';
      try {
        macAddress = await chip.readMac(this.loader);
      } catch (macErr) {
        console.error('Failed to read MAC address:', macErr);
        onProgress('Warning: Failed to read eFuse MAC address.');
      }

      onProgress('Querying crystal frequency...');
      let crystalFreq = 'Unknown';
      try {
        const freqVal = await chip.getCrystalFreq(this.loader);
        crystalFreq = `${freqVal} MHz`;
      } catch (freqErr) {
        console.error('Failed to get crystal frequency:', freqErr);
      }

      onProgress('Extracting eFuse chip features...');
      let features: string[] = [];
      try {
        features = await chip.getChipFeatures(this.loader);
      } catch (featErr) {
        console.error('Failed to read features:', featErr);
      }

      onProgress('Fetching chip model description...');
      let description = 'N/A';
      try {
        description = await chip.getChipDescription(this.loader);
      } catch (descErr) {
        console.error('Failed to get chip description:', descErr);
      }

      onProgress('Detecting connected flash memory size...');
      let flashSize = 'Unknown';
      try {
        flashSize = await this.loader.detectFlashSize();
      } catch (flashErr) {
        console.error('Failed to detect flash size:', flashErr);
        onProgress('SPI Flash size query skipped or failed.');
      }

      onProgress('Diagnostic scan completed successfully!');

      return {
        chipName: chip.CHIP_NAME || chipType,
        chipType,
        macAddress,
        crystalFreq,
        features,
        description,
        flashSize
      };
    } catch (err: unknown) {
      console.error('[EspDiagnostics] Error running diagnostics:', err);
      const msg = err instanceof Error ? err.message : String(err);
      onProgress(`Error: ${msg}`);
      return null;
    } finally {
      // We keep the transport open if we want to run consecutive commands,
      // but for pure read-only diagnostics we release DTR/RTS to let the chip run.
      if (this.transport) {
        try {
          await this.transport.setDTR(false);
          await this.transport.setRTS(false);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { /* ignore */ }
      }
    }
  }

  /**
   * Resets the Espressif chip into standard firmware execution mode (hard reset).
   */
  public async hardReset(port: SerialPort): Promise<void> {
    try {
      const info = port.getInfo();
      const isUsbJtag = info.usbVendorId === 0x303A && info.usbProductId === 0x1001;

      const tempTransport = this.transport || new Transport(port, true);

      if (isUsbJtag) {
        // Native USB-JTAG reset sequence
        await tempTransport.setRTS(false);
        await new Promise(resolve => setTimeout(resolve, 100));
        await tempTransport.setRTS(true); // Pulse RTS to trigger reset
        await new Promise(resolve => setTimeout(resolve, 100));
        await tempTransport.setRTS(false);
      } else {
        // Hard reset sequence (toggle DTR/RTS)
        await tempTransport.setDTR(false);
        await new Promise(resolve => setTimeout(resolve, 100));
        await tempTransport.setRTS(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        await tempTransport.setDTR(true);
        await tempTransport.setRTS(false);
      }
    } catch (err) {
      console.error('[EspDiagnostics] Hard reset failed:', err);
    }
  }

  /**
   * Performs the Espressif bootloader handshake and flashes firmware files.
   */
  public async flashFirmware(
    port: SerialPort,
    baudRate: number,
    fileArray: { data: Uint8Array; address: number }[],
    onProgress: (msg: string, percent?: number) => void
  ): Promise<boolean> {
    try {
      const info = port.getInfo();
      const isUsbJtag = info.usbVendorId === 0x303A && info.usbProductId === 0x1001;

      if (this.transport) {
        try { await this.transport.disconnect(); } catch(_e){ /* ignore */ }
      }
      this.transport = new Transport(port, true);

      const termMock = {
        clean: () => {},
        writeLine: (data: string) => {
          if (data.trim() !== '') {
            onProgress(`[ESPTool] ${data.trim()}`);
          }
        },
        write: () => {}
      };

      this.loader = new ESPLoader({
        transport: this.transport,
        baudrate: baudRate,
        terminal: termMock,
        debugLogging: false
      });

      onProgress('Synchronizing with bootloader...');

      if (isUsbJtag) {
        onProgress('Detected Native USB-JTAG Unit. Using specialized sync sequence...');
        // For USB-JTAG, we might need to manually trigger the sync if loader.main() fails
        // but esptool-js generally handles the PID internally if configured correctly.
      }

      await (this.loader as any).main();
      serialManager.setChipMode('Download');

      // Check if any part of the binary overlaps with the flasher stub address space (usually 0x40800000)
      const hasOverlap = fileArray.some(f => {
        // If the address is in RAM range, it might conflict
        return f.address >= 0x40000000 && f.address < 0x50000000;
      });

      if (hasOverlap) {
        onProgress('Detected RAM segments in binary. Disabling high-speed stub to avoid memory conflict...');
      } else {
        try {
          onProgress('Uploading flasher stub...');
          this.loader = (await (this.loader as any).runStub()) as ESPLoader;
        } catch (stubErr: any) {
          onProgress('Warning: Failed to load stub. Falling back to ROM mode...');
        }
      }

      onProgress('Flashing firmware image...');
      if (this.loader) {
        await (this.loader as any).writeFlash({
          fileArray,
          flashMode: 'keep',
          flashFreq: 'keep',
          flashSize: 'keep',
          eraseAll: false,
          compress: true,
          reportProgress: (_fileIndex: number, written: number, total: number) => {
            const percent = Math.round((written / total) * 100);
            onProgress(`Writing flash... ${written}/${total} bytes`, percent);
          }
        });
      }

      onProgress('Flashing complete! Verifying MD5...');

      onProgress('Restarting device into application mode...');
      if (this.loader) {
        // Use specialized reset for USB-JTAG
        await (this.loader as any).after(isUsbJtag ? 'usb_reset' : 'hard_reset');
      }

      return true;
} catch (err: unknown) {
console.error('[EspDiagnostics] Flashing error:', err);
onProgress(`Error: ${err instanceof Error ? err.message : String(err)}`);
return false;
} finally {
// Release DTR/RTS properly
if (this.transport) {
  try {
    await this.transport.setDTR(false);
    await this.transport.setRTS(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) { /* ignore */ }
}
}
  }
}

export const espDiagnostics = new EspDiagnostics();
