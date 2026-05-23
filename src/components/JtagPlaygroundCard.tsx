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
    setProgressMsg('Initiating XIAO ESP32-C5 showcase flash...');
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
        setProgressMsg('Firmware flashed! JTAG is active. Unplug/Replug USB to ensure boot mode clears.');
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
          <Text>Seeed Studio XIAO ESP32-C5 JTAG Playground</Text>
        </h2>
        <Badge variant="positive" fillStyle="subtle">XIAO V1.1 Build</Badge>
      </div>

      <div className={style({ display: 'grid', gridTemplateColumns: { default: '1fr', lg: '1fr 1fr' }, gap: 24 }) as any}>
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 16 }) as any}>
          <div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}>
            <InfoCircleIcon styles={iconStyle({ size: 'S', color: 'informative' })} />
            <Text styles={style({ font: 'body-sm', fontWeight: 'bold' })}>Hardware Interactive Showcase</Text>
          </div>
          <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
            This firmware uses the XIAO's built-in Yellow LED (GPIO 27) and Boot Button (GPIO 28) to help you understand JTAG by providing physical visual feedback. 
          </Text>
          
          <div className={style({ backgroundColor: 'gray-50', padding: 12, borderRadius: 'sm', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
            <Text styles={style({ font: 'body-2xs', fontWeight: 'bold', marginBottom: 4 })}>Memory Mapped Variables:</Text>
            <ul className={style({ margin: 0, paddingLeft: 16, font: 'body-2xs', color: 'neutral-subdued' }) as any}>
              <li><code>jtag_blink_rate</code> (0x4080a958): Delay in ms. Default: 1000.</li>
              <li><code>jtag_override_led</code> (0x4080a954): -1=Auto, 0=OFF, 1=ON.</li>
              <li><code>button_press_count</code> (0x4080d758): Total boot button presses.</li>
            </ul>
          </div>

          {serialState.isConnected ? (
            <Button variant="accent" onPress={handleFlashShowcase} isDisabled={flashing}>
              <DataUploadIcon />
              <Text>{flashing ? 'Flashing XIAO Showcase...' : 'Flash XIAO Showcase Firmware'}</Text>
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
            <Text styles={style({ font: 'body-sm', fontWeight: 'bold' })}>Interactive Experiments</Text>
          </div>
          
          <div className={style({ display: 'flex', flexDirection: 'column', gap: 12 }) as any}>
            <div className={style({ padding: 12, borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200', borderRadius: 'sm' }) as any}>
              <Text styles={style({ font: 'body-xs', fontWeight: 'bold' })}>1. CPU Bypass / Force State</Text>
              <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
                Override the logic loop and force the LED solid ON/OFF without changing the code:
                <code>set variable jtag_override_led = 1</code>
              </Text>
            </div>

            <div className={style({ padding: 12, borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200', borderRadius: 'sm' }) as any}>
              <Text styles={style({ font: 'body-xs', fontWeight: 'bold' })}>2. Live State Injection</Text>
              <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
                Make the LED blink crazy fast (100ms) by writing directly to RAM:
                <code>set variable jtag_blink_rate = 100</code>
              </Text>
            </div>

            <div className={style({ padding: 12, borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200', borderRadius: 'sm' }) as any}>
              <Text styles={style({ font: 'body-xs', fontWeight: 'bold' })}>3. Hardware Watchpoints (Halt CPU)</Text>
              <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
                Set a watchpoint on the counter. Then press the 'B' button on the board. The CPU will freeze instantly!
                <code>watch button_press_count</code>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
