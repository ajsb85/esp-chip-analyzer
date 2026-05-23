import { useEffect, useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import { serialManager } from '../services/serialManager';
import { espDiagnostics } from '../services/espDiagnostics';
import { firmwareAnalyzer } from '../services/firmwareAnalyzer';
import type { PartitionEntry } from '../services/firmwareAnalyzer';
import { Button } from '@react-spectrum/s2/Button';
import { Badge } from '@react-spectrum/s2/Badge';
import { ProgressBar } from '@react-spectrum/s2/ProgressBar';
import { Text } from '@react-spectrum/s2';
import { Picker, PickerItem } from '@react-spectrum/s2/Picker';
import { style, iconStyle } from "@react-spectrum/s2/style" with { type: "macro" };
import DataUploadIcon from '@react-spectrum/s2/icons/DataUpload';
import AlertTriangleIcon from '@react-spectrum/s2/icons/AlertTriangle';
import PlayIcon from '@react-spectrum/s2/icons/Play';
import SearchIcon from '@react-spectrum/s2/icons/Search';

interface FirmwareFlasherCardProps {
  serialState: SerialConnectionState;
}

const tableStyles = style({
  width: 'full',
  borderCollapse: 'collapse',
  font: 'body-xs',
  marginTop: 8,
});

const thStyles = style({
  textAlign: 'start',
  padding: 4,
  borderBottomStyle: 'solid',
  borderBottomWidth: 1,
  borderBottomColor: 'gray-300',
  color: 'neutral-subdued',
  fontWeight: 'bold',
  font: 'detail-sm',
});

const tdStyles = style({
  padding: 4,
  borderBottomStyle: 'solid',
  borderBottomWidth: 1,
  borderBottomColor: 'gray-200',
  fontFamily: 'code',
  font: 'detail-sm',
});

const firmwareOptions = [
  { 
    id: 'merged',
    label: 'Standard Full Flash (Merged)',
    description: 'Flash the complete 4MB image at 0x0. Safest for demos.',
    files: [
      { name: 'merged.bin', address: 0x0, path: 'firmware/Bushers_Samsung_NU_TU_ESP32_CLASICO.ino.merged.bin' }
    ]
  },
  { 
    id: 'split',
    label: 'Partitioned Flash (Experimental)',
    description: 'Flash separate bootloader, partitions, and app segments.',
    files: [
      { name: 'bootloader.bin', address: 0x1000, path: 'firmware/Bushers_Samsung_NU_TU_ESP32_CLASICO.ino.bootloader.bin' },
      { name: 'partitions.bin', address: 0x8000, path: 'firmware/Bushers_Samsung_NU_TU_ESP32_CLASICO.ino.partitions.bin' },
      { name: 'boot_app0.bin', address: 0xE000, path: 'firmware/boot_app0.bin' },
      { name: 'firmware.bin', address: 0x10000, path: 'firmware/Bushers_Samsung_NU_TU_ESP32_CLASICO.ino.bin' },
    ]
  }
];

export const FirmwareFlasherCard: FC<FirmwareFlasherCardProps> = ({ serialState }) => {
  const [flashing, setFlashing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState<number | undefined>(undefined);
  const [flashBaud, setFlashBaud] = useState<number>(460800);
  const [selectedMethod, setSelectedMethod] = useState<string>('merged');
  const [partitions, setPartitions] = useState<PartitionEntry[]>([]);

  const activeMethod = firmwareOptions.find(o => o.id === selectedMethod) || firmwareOptions[0];

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch('firmware/Bushers_Samsung_NU_TU_ESP32_CLASICO.ino.merged.bin');
        if (!response.ok) return;
        const buffer = await response.arrayBuffer();
        const parts = firmwareAnalyzer.parsePartitionTable(buffer);
        setPartitions(parts);
      } catch (e) {
        console.warn('Failed to parse metadata from binary:', e);
      }
    };
    fetchMetadata();
  }, []);

  const handleFlash = async () => {
    if (!serialState.port) return;
    setFlashing(true);
    setProgressMsg('Initiating flash sequence...');
    setProgressPercent(undefined);

    try {
      const fileArray: { data: Uint8Array; address: number }[] = [];
      setProgressMsg('Downloading firmware binary from server...');
      
      for (const file of activeMethod.files) {
        const response = await fetch(file.path);
        if (!response.ok) throw new Error(`Failed to load ${file.name}`);
        const buffer = await response.arrayBuffer();
        fileArray.push({ data: new Uint8Array(buffer), address: file.address });
      }

      await serialManager.runExclusiveAction(async (port) => {
        return await espDiagnostics.flashFirmware(
          port,
          flashBaud,
          fileArray,
          (msg, percent) => {
            setProgressMsg(msg);
            if (percent !== undefined) setProgressPercent(percent);
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
    <div className={style({
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
    }) as any}>
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
          Specialized SPI Flash Programmer and Register Editor for Samsung TV Logic Boards.
        </Text>
      </div>

      <div className={style({ display: 'flex', gap: 16, flexWrap: 'wrap' }) as any}>
        <Picker 
          label="Flashing Method" 
          value={selectedMethod}
          onSelectionChange={(val) => setSelectedMethod(val as string)}
          styles={style({ flex: 2, minWidth: 200 }) as any}
        >
          {firmwareOptions.map(opt => (
            <PickerItem key={opt.id} id={opt.id}>{opt.label}</PickerItem>
          ))}
        </Picker>

        <Picker 
          label="Baud Rate" 
          value={flashBaud.toString()}
          onSelectionChange={(val) => setFlashBaud(Number(val))}
          styles={style({ flex: 1, minWidth: 120 }) as any}
        >
          <PickerItem id="115200">115200 (Safe)</PickerItem>
          <PickerItem id="230400">230400</PickerItem>
          <PickerItem id="460800">460800</PickerItem>
          <PickerItem id="921600">921600 (Fast)</PickerItem>
        </Picker>
      </div>

      {partitions.length > 0 && (
        <div className={style({ backgroundColor: 'gray-50', padding: 12, borderRadius: 'lg', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
          <div className={style({ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }) as any}>
            <SearchIcon styles={iconStyle({ size: 'S' })} />
            <Text styles={style({ font: 'body-xs', fontWeight: 'bold', color: 'neutral' })}>Payload Forensic Analysis (Metadata)</Text>
          </div>
          <table className={tableStyles as any}>
            <thead>
              <tr>
                <th className={thStyles as any}>Label</th>
                <th className={thStyles as any}>Type</th>
                <th className={thStyles as any}>Offset</th>
                <th className={thStyles as any}>Size</th>
              </tr>
            </thead>
            <tbody>
              {partitions.map((p, i) => (
                <tr key={i}>
                  <td className={tdStyles as any}>{p.label}</td>
                  <td className={tdStyles as any}>{p.typeLabel} ({p.subtypeLabel})</td>
                  <td className={tdStyles as any}>0x{p.offset.toString(16).toUpperCase()}</td>
                  <td className={tdStyles as any}>{(p.size / 1024).toFixed(0)} KB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
          
          <div className={style({ backgroundColor: 'orange-100', padding: 12, borderRadius: 'lg', display: 'flex', alignItems: 'start', gap: 8 }) as any}>
            <AlertTriangleIcon styles={iconStyle({ size: 'S', color: 'notice' })} />
            <div className={style({ display: 'flex', flexDirection: 'column', gap: 4 }) as any}>
              <Text styles={style({ font: 'body-xs', fontWeight: 'bold', color: 'orange-900' })}>Stability Warning</Text>
              <Text styles={style({ font: 'body-2xs', color: 'orange-800' })}>
                If the device restarts during flashing, try lowering the **Baud Rate** to 115200 and ensure the ESP32 has an external power supply. USB-to-UART bridges often cannot provide enough current for stable writing.
              </Text>
            </div>
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
