import { useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import { serialManager } from '../services/serialManager';
import { espDiagnostics } from '../services/espDiagnostics';
import { Button } from '@react-spectrum/s2/Button';
import { Badge } from '@react-spectrum/s2/Badge';
import { ProgressBar } from '@react-spectrum/s2/ProgressBar';
import { Text } from '@react-spectrum/s2';
import { style, iconStyle } from "@react-spectrum/s2/style" with { type: "macro" };
import DataUploadIcon from '@react-spectrum/s2/icons/DataUpload';
import AlertTriangleIcon from '@react-spectrum/s2/icons/AlertTriangle';
import PlayIcon from '@react-spectrum/s2/icons/Play';
import FileTextIcon from '@react-spectrum/s2/icons/FileText';

interface FirmwareFlasherCardProps {
  serialState: SerialConnectionState;
}

const cardStyles = style({
  backgroundColor: 'layer-1',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'gray-200',
  borderRadius: 'lg',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  boxShadow: 'elevated',
});

const firmwareFiles = [
  { name: 'bootloader.bin', address: 0x1000, path: 'firmware/Bushers_Samsung_NU_TU_ESP32_CLASICO.ino.bootloader.bin' },
  { name: 'partitions.bin', address: 0x8000, path: 'firmware/Bushers_Samsung_NU_TU_ESP32_CLASICO.ino.partitions.bin' },
  { name: 'boot_app0.bin', address: 0xE000, path: 'firmware/boot_app0.bin' },
  { name: 'firmware.bin', address: 0x10000, path: 'firmware/Bushers_Samsung_NU_TU_ESP32_CLASICO.ino.bin' },
];

export const FirmwareFlasherCard: FC<FirmwareFlasherCardProps> = ({ serialState }) => {
  const [flashing, setFlashing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState<number | undefined>(undefined);

  const handleFlash = async () => {
    if (!serialState.port) return;
    setFlashing(true);
    setProgressMsg('Downloading firmware files...');
    setProgressPercent(undefined);

    try {
      const fileArray: { data: Uint8Array; address: number }[] = [];
      for (const file of firmwareFiles) {
        const response = await fetch(file.path);
        if (!response.ok) throw new Error(`Failed to load ${file.name}`);
        const buffer = await response.arrayBuffer();
        fileArray.push({ data: new Uint8Array(buffer), address: file.address });
      }

      setProgressMsg('Connecting to ESP32 Bootloader...');

      await serialManager.runExclusiveAction(async (port) => {
        return await espDiagnostics.flashFirmware(
          port,
          serialState.baudRate,
          fileArray,
          (msg, percent) => {
            setProgressMsg(msg);
            setProgressPercent(percent);
          }
        );
      });
      
    } catch (err: unknown) {
      setProgressMsg(`Flash failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setFlashing(false);
    }
  };

  return (
    <div className={cardStyles as any}>
      <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) as any}>
        <h2 className={style({ font: 'heading-xs', color: 'neutral', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }) as any}>
          <DataUploadIcon styles={iconStyle({ size: 'M' })} />
          <Text>Firmware Flasher</Text>
        </h2>
        <Badge variant="notice" fillStyle="subtle">ESP32 Demo</Badge>
      </div>

      <div className={style({ display: 'flex', flexDirection: 'column', gap: 8 }) as any}>
        <Text styles={style({ font: 'body-sm', fontWeight: 'bold', color: 'neutral' })}>Bushers Samsung NU/TU ESP32 Clasico Demo</Text>
        <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
          This utility will flash the pre-compiled Bushers Samsung NU/TU remote emulator firmware onto your ESP32. It uses the standard layout for a 4MB flash ESP32 module.
        </Text>
      </div>

      <div className={style({ backgroundColor: 'gray-50', padding: 12, borderRadius: 'lg', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
        <div className={style({ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }) as any}>
          <FileTextIcon styles={iconStyle({ size: 'S' })} />
          <Text styles={style({ font: 'body-xs', fontWeight: 'bold', color: 'neutral' })}>Flash Memory Map</Text>
        </div>
        <ul className={style({ margin: 0, paddingLeft: 20, font: 'body-xs', color: 'neutral', display: 'flex', flexDirection: 'column', gap: 4 }) as any}>
          {firmwareFiles.map((f, i) => (
            <li key={i}><code>0x{f.address.toString(16).toUpperCase().padStart(4, '0')}</code> : {f.name}</li>
          ))}
        </ul>
      </div>

      {serialState.isConnected ? (
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }) as any}>
          <Button 
            variant="accent" 
            onPress={handleFlash}
            isDisabled={flashing}
            styles={style({ width: 'full' }) as any}
          >
            {flashing ? <DataUploadIcon /> : <PlayIcon />}
            <Text>{flashing ? 'Flashing in Progress...' : 'Start Flash Sequence'}</Text>
          </Button>

          {progressMsg && (
            <div className={style({ 
              font: 'body-xs', 
              fontFamily: 'code', 
              color: 'neutral-subdued', 
              backgroundColor: 'gray-100', 
              padding: 12, 
              borderRadius: 'sm',
            }) as any}>
              <div className={style({ marginBottom: 8 }) as any}>{progressMsg}</div>
              {progressPercent !== undefined && (
                <ProgressBar value={progressPercent} label="Upload Progress" size="S" />
              )}
            </div>
          )}
          
          <div className={style({ display: 'flex', alignItems: 'center', gap: 8, font: 'body-xs', color: 'neutral-subdued' }) as any}>
            <AlertTriangleIcon styles={iconStyle({ size: 'S', color: 'notice' })} />
            <Text>Note: This will overwrite any existing firmware on the ESP32.</Text>
          </div>
        </div>
      ) : (
        <div className={style({
          textAlign: 'center',
          color: 'neutral-subdued',
          font: 'body-sm',
          padding: 24,
        }) as any}>
          <Text>Connect a serial bridge to flash firmware.</Text>
        </div>
      )}
    </div>
  );
};
