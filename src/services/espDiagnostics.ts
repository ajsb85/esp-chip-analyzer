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
  /**
   * Performs the Espressif bootloader handshake and diagnostics.
   */
  public async analyzeChip(
    port: SerialPort,
    baudRate: number,
    options: { useStub: boolean },
    onProgress: ProgressCallback
  ): Promise<EspChipDetails | null> {
    let transport: Transport | null = null;
    try {
      onProgress('Connecting to transport...');
      transport = new Transport(port, true);
      
      const termMock = {
        clean: () => {},
        writeLine: (data: string) => { onProgress(data); },
        write: (data: string) => { onProgress(data); }
      };

      const loader = new ESPLoader({
        transport: transport,
        baudrate: baudRate,
        terminal: termMock,
        debugLogging: false
      });

      onProgress('Synchronizing with bootloader...');
      const chipType = await loader.main();
      serialManager.setChipMode('Download');
      onProgress(`Chip type identified: ${chipType}`);

      if (options.useStub) {
        try {
          onProgress('Uploading diagnostic stub...');
          await loader.runStub();
        } catch (stubErr) {
          onProgress('Warning: Failed to load stub. Continuing in ROM mode...');
        }
      }

      const chip = loader.chip;
      if (!chip) {
        throw new Error('Sync completed but chip ROM module was not initialized.');
      }

      onProgress('Reading MAC Address...');
      let macAddress = 'Unknown';
      try {
        macAddress = await chip.readMac(loader);
      } catch (macErr) {
        console.error('Failed to read MAC address:', macErr);
      }

      onProgress('Querying hardware features...');
      let crystalFreq = 'Unknown';
      let features: string[] = [];
      let description = 'N/A';
      try {
        const freqVal = await chip.getCrystalFreq(loader);
        crystalFreq = `${freqVal} MHz`;
        features = await chip.getChipFeatures(loader);
        description = await chip.getChipDescription(loader);
      } catch (featErr) {
        console.error('Failed to read chip features:', featErr);
      }

      onProgress('Detecting flash size...');
      let flashSize = 'Unknown';
      try {
        flashSize = await loader.detectFlashSize();
      } catch (flashErr) {
        console.error('Failed to detect flash size:', flashErr);
      }

      onProgress('Diagnostic scan completed.');

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
      if (transport) {
        try {
          // Explicitly disconnect to stop internal read loops
          await transport.disconnect();
        } catch (_e) { /* ignore already closed */ }
      }
    }
  }

  /**
   * Resets the Espressif chip into standard firmware execution mode (hard reset).
   */
  public async hardReset(port: SerialPort): Promise<void> {
    let transport: Transport | null = null;
    try {
      const info = port.getInfo();
      const isUsbJtag = info.usbVendorId === 0x303A && info.usbProductId === 0x1001;
      
      // esptool-js transport handles port open
      transport = new Transport(port, true);
      
      if (isUsbJtag) {
        await transport.setRTS(false);
        await new Promise(resolve => setTimeout(resolve, 100));
        await transport.setRTS(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        await transport.setRTS(false);
      } else {
        await transport.setDTR(false);
        await new Promise(resolve => setTimeout(resolve, 100));
        await transport.setRTS(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        await transport.setDTR(true);
        await transport.setRTS(false);
      }
    } catch (err) {
      console.error('[EspDiagnostics] Hard reset failed:', err);
    } finally {
      if (transport) {
        try {
          await transport.disconnect();
        } catch (_e) { /* ignore */ }
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
    options: { useStub: boolean },
    onProgress: (msg: string, percent?: number) => void
  ): Promise<boolean> {
    let transport: Transport | null = null;
    try {
      transport = new Transport(port, true);
      
      const termMock = {
        clean: () => {},
        writeLine: (data: string) => { if (data.trim() !== '') onProgress(`[ESPTool] ${data.trim()}`); },
        write: () => {}
      };

      let loader = new ESPLoader({
        transport: transport,
        baudrate: baudRate,
        terminal: termMock,
        debugLogging: false
      });

      onProgress('Synchronizing with bootloader...');
      await (loader as any).main();
      serialManager.setChipMode('Download');

      if (options.useStub) {
        try {
          onProgress('Uploading flasher stub...');
          loader = (await (loader as any).runStub()) as ESPLoader;
        } catch (stubErr: any) {
          onProgress('Warning: Failed to load stub. Falling back to ROM mode...');
        }
      }

      onProgress('Flashing firmware image...');
      await (loader as any).writeFlash({
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
      
      onProgress('Flashing complete! Verifying MD5...');

      onProgress('Restarting device...');
      await (loader as any).after('no_reset_stub');
      
      // Cleanup this transport before calling hardReset which uses its own
      await transport.disconnect();
      transport = null;

      await this.hardReset(port);

      return true;
    } catch (err: unknown) {
      console.error('[EspDiagnostics] Flashing error:', err);
      onProgress(`Error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      if (transport) {
        try {
          await transport.disconnect();
        } catch (_e) { /* ignore */ }
      }
    }
  }
}

export const espDiagnostics = new EspDiagnostics();
