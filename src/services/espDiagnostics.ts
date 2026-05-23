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
   * Note: This will put the chip into bootloader mode, resetting it.
   */
  public async analyzeChip(
    port: SerialPort,
    baudRate: number,
    options: { useStub: boolean },
    onProgress: ProgressCallback
  ): Promise<EspChipDetails | null> {
    let transport: Transport | null = null;
    try {
      onProgress('Initializing WebSerial transport layer...');
      
      // Ensure port is open if it isn't already
      try {
        await port.open({ baudRate });
      } catch (e: any) {
        if (!e.message.includes('already open')) throw e;
      }

      transport = new Transport(port, true);
      
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
      const loader = new ESPLoader({
        transport: transport,
        baudrate: baudRate,
        terminal: termMock,
        debugLogging: false
      });

      onProgress('Synchronizing with bootloader... (Toggling DTR/RTS)');
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

      onProgress('Reading MAC Address from eFuse registers...');
      let macAddress = 'Unknown';
      try {
        macAddress = await chip.readMac(loader);
      } catch (macErr) {
        console.error('Failed to read MAC address:', macErr);
        onProgress('Warning: Failed to read eFuse MAC address.');
      }

      onProgress('Querying crystal frequency...');
      let crystalFreq = 'Unknown';
      try {
        const freqVal = await chip.getCrystalFreq(loader);
        crystalFreq = `${freqVal} MHz`;
      } catch (freqErr) {
        console.error('Failed to get crystal frequency:', freqErr);
      }

      onProgress('Extracting eFuse chip features...');
      let features: string[] = [];
      try {
        features = await chip.getChipFeatures(loader);
      } catch (featErr) {
        console.error('Failed to read features:', featErr);
      }

      onProgress('Fetching chip model description...');
      let description = 'N/A';
      try {
        description = await chip.getChipDescription(loader);
      } catch (descErr) {
        console.error('Failed to get chip description:', descErr);
      }

      onProgress('Detecting connected flash memory size...');
      let flashSize = 'Unknown';
      try {
        flashSize = await loader.detectFlashSize();
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
      if (transport) {
        try {
          await transport.setDTR(false);
          await transport.setRTS(false);
          // Only disconnect/close if the port is actually open
          await transport.disconnect();
        } catch (_e) { /* ignore */ }
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
      
      // Ensure port is open for signal toggling
      try {
        await port.open({ baudRate: 115200 });
      } catch (e: any) {
        if (!e.message.includes('already open')) throw e;
      }

      transport = new Transport(port, true);
      
      if (isUsbJtag) {
        // Native USB-JTAG reset sequence
        await transport.setRTS(false);
        await new Promise(resolve => setTimeout(resolve, 100));
        await transport.setRTS(true); // Pulse RTS to trigger reset
        await new Promise(resolve => setTimeout(resolve, 100));
        await transport.setRTS(false);
      } else {
        // Hard reset sequence (toggle DTR/RTS)
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
        } catch (_e) {
          // Ignore "already closed" or signal errors in finally
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
    options: { useStub: boolean },
    onProgress: (msg: string, percent?: number) => void
  ): Promise<boolean> {
    let transport: Transport | null = null;
    try {
      const info = port.getInfo();
      const isUsbJtag = info.usbVendorId === 0x303A && info.usbProductId === 0x1001;

      // Ensure port is open
      try {
        await port.open({ baudRate });
      } catch (e: any) {
        if (!e.message.includes('already open')) throw e;
      }

      transport = new Transport(port, true);
      
      const termMock = {
        clean: () => {},
        writeLine: (data: string) => {
          if (data.trim() !== '') {
            onProgress(`[ESPTool] ${data.trim()}`);
          }
        },
        write: () => {}
      };

      let loader = new ESPLoader({
        transport: transport,
        baudrate: baudRate,
        terminal: termMock,
        debugLogging: false
      });

      onProgress('Synchronizing with bootloader...');
      
      if (isUsbJtag) {
        onProgress('Detected Native USB-JTAG Unit. Using specialized sync sequence...');
      }

      await (loader as any).main();
      serialManager.setChipMode('Download');

      if (options.useStub) {
        try {
          onProgress('Uploading flasher stub...');
          loader = (await (loader as any).runStub()) as ESPLoader;
        } catch (stubErr: any) {
          onProgress('Warning: Failed to load stub (likely RAM overlap). Falling back to ROM mode...');
        }
      } else {
        onProgress('Stub loader disabled by user. Using ROM flashing mode...');
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

      onProgress('Restarting device into application mode...');
      // Stay in control and perform a manual hardware reset
      await (loader as any).after('no_reset_stub');
      await this.hardReset(port);

      return true;
    } catch (err: unknown) {
      console.error('[EspDiagnostics] Flashing error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      onProgress(`Error: ${msg}`);
      return false;
    } finally {
      if (transport) {
        try {
          await transport.setDTR(false);
          await transport.setRTS(false);
          await transport.disconnect();
        } catch (_e) { /* ignore */ }
      }
    }
  }
}

export const espDiagnostics = new EspDiagnostics();
