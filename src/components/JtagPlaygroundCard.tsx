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
import BugIcon from '@react-spectrum/s2/icons/Bug';
import InfoCircleIcon from '@react-spectrum/s2/icons/InfoCircle';
import SearchIcon from '@react-spectrum/s2/icons/Search';

interface JtagPlaygroundCardProps {
  serialState: SerialConnectionState;
}

const firmwareFiles = [
  { name: 'bootloader.bin', address: 0x2000, path: 'firmware/jtag-showcase/bootloader.bin' },
  { name: 'partition-table.bin', address: 0x8000, path: 'firmware/jtag-showcase/partition-table.bin' },
  { name: 'jtag-showcase-fw.bin', address: 0x10000, path: 'firmware/jtag-showcase/jtag-showcase-fw.bin' },
];

export const JtagPlaygroundCard: FC<JtagPlaygroundCardProps> = ({ serialState }) => {
  const [flashing, setFlashing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState<number | undefined>(undefined);

  const handleFlashShowcase = async () => {
    if (!serialState.port) return;
    setFlashing(true);
    setProgressMsg('Initiating showcase flash...');
    setProgressPercent(undefined);

    try {
      const fileArray: { data: Uint8Array; address: number }[] = [];
      setProgressMsg('Fetching showcase binaries...');
      
      for (const file of firmwareFiles) {
        const response = await fetch(file.path);
        if (!response.ok) throw new Error(`Failed to load ${file.name}`);
        const buffer = await response.arrayBuffer();
        fileArray.push({ data: new Uint8Array(buffer), address: file.address });
      }

      const result = await serialManager.runExclusiveAction(async (port) => {
        return await espDiagnostics.flashFirmware(
          port,
          460800,
          fileArray,
          { useStub: true, verifyMd5: true, eraseAll: false },
          (msg, percent) => {
            setProgressMsg(msg);
            if (percent !== undefined) setProgressPercent(percent);
          }
        );
      }, {
        label: 'Showcase flasher',
        restoreDelayMs: 800,
      });

      if (result.success) {
        setProgressMsg('Showcase firmware flashed! JTAG is now active on the built-in USB port.');
        setProgressPercent(100);
      } else {
        setProgressMsg('Flash failed. Check console for details.');
      }
    } catch (err: any) {
      setProgressMsg(`Error: ${err.message}`);
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
      gap: 24,
      boxShadow: 'elevated',
    }) as any}>
      <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) as any}>
        <h2 className={style({ font: 'heading-xs', color: 'neutral', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }) as any}>
          <BugIcon styles={iconStyle({ size: 'M' })} />
          <Text>ESP32-C5 JTAG Playground</Text>
        </h2>
        <Badge variant="positive" fillStyle="subtle">Special Build</Badge>
      </div>

      <div className={style({ display: 'grid', gridTemplateColumns: { default: '1fr', lg: '1fr 1fr' }, gap: 24 }) as any}>
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 16 }) as any}>
          <div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}>
            <InfoCircleIcon styles={iconStyle({ size: 'S', color: 'informative' })} />
            <Text styles={style({ font: 'body-sm', fontWeight: 'bold' })}>About the Showcase Firmware</Text>
          </div>
          <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
            This firmware is specifically compiled for the **ESP32-C5** to demonstrate JTAG capabilities. 
            It includes several global variables at fixed addresses that you can inspect and modify in real-time using the **WebOCD JTAG Debugger**.
          </Text>
          
          <div className={style({ backgroundColor: 'gray-50', padding: 12, borderRadius: 'sm', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
            <Text styles={style({ font: 'body-2xs', fontWeight: 'bold', marginBottom: 4 })}>Target Variables:</Text>
            <ul className={style({ margin: 0, paddingLeft: 16, font: 'body-2xs', color: 'neutral-subdued' }) as any}>
              <li><code>jtag_counter</code> (0x4080D6AC): Increments every second.</li>
              <li><code>jtag_control</code> (0x4080D6A8): Change to <code>1</code> for delay, <code>99</code> for restart.</li>
              <li><code>jtag_message</code> (0x4080ACA8): A string you can overwrite.</li>
            </ul>
          </div>

          {serialState.isConnected ? (
            <Button variant="accent" onPress={handleFlashShowcase} isDisabled={flashing}>
              <DataUploadIcon />
              <Text>{flashing ? 'Flashing Showcase...' : 'Flash JTAG Showcase Firmware'}</Text>
            </Button>
          ) : (
            <div className={style({ padding: 12, backgroundColor: 'orange-100', borderRadius: 'sm', textAlign: 'center' }) as any}>
              <Text styles={style({ font: 'body-xs', color: 'orange-900' })}>Connect via Serial to flash the firmware.</Text>
            </div>
          )}

          {progressMsg && (
            <div className={style({ font: 'body-2xs', fontFamily: 'code', color: 'neutral-subdued' }) as any}>
              {progressMsg}
              {progressPercent !== undefined && <ProgressBar value={progressPercent} size="S" />}
            </div>
          )}
        </div>

        <div className={style({ display: 'flex', flexDirection: 'column', gap: 16 }) as any}>
          <div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}>
            <SearchIcon styles={iconStyle({ size: 'S', color: 'notice' })} />
            <Text styles={style({ font: 'body-sm', fontWeight: 'bold' })}>Experiments to Try</Text>
          </div>
          
          <div className={style({ display: 'flex', flexDirection: 'column', gap: 12 }) as any}>
            <div className={style({ padding: 12, borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200', borderRadius: 'sm' }) as any}>
              <Text styles={style({ font: 'body-xs', fontWeight: 'bold' })}>1. Live Variable Watch</Text>
              <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
                Go to the **WebOCD JTAG** tab, connect to the JTAG interface, and use the console:
                <code>p jtag_counter</code>
              </Text>
            </div>

            <div className={style({ padding: 12, borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200', borderRadius: 'sm' }) as any}>
              <Text styles={style({ font: 'body-xs', fontWeight: 'bold' })}>2. Remote Control</Text>
              <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
                Modify device behavior without changing code:
                <code>set variable jtag_control = 99</code>
              </Text>
            </div>

            <div className={style({ padding: 12, borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200', borderRadius: 'sm' }) as any}>
              <Text styles={style({ font: 'body-xs', fontWeight: 'bold' })}>3. Memory Manipulation</Text>
              <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
                Overwrite the status message:
                <code>set {`{char[32]}`}jtag_message = "Hacked via JTAG!"</code>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
