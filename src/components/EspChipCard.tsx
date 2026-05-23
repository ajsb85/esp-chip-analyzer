import { useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import { serialManager } from '../services/serialManager';
import { espDiagnostics } from '../services/espDiagnostics';
import type { EspChipDetails } from '../services/espDiagnostics';
import { Button } from '@react-spectrum/s2/Button';
import { Badge } from '@react-spectrum/s2/Badge';
import { ProgressCircle } from '@react-spectrum/s2/ProgressCircle';
import { Switch } from '@react-spectrum/s2/Switch';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { Text } from "@react-spectrum/s2";
import RefreshIcon from '@react-spectrum/s2/icons/Refresh';
import PlayIcon from '@react-spectrum/s2/icons/Play';
import DataSettingsIcon from '@react-spectrum/s2/icons/DataSettings';
import AlertTriangleIcon from '@react-spectrum/s2/icons/AlertTriangle';
import InfoCircleIcon from '@react-spectrum/s2/icons/InfoCircle';

interface EspChipCardProps {
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

const metaListStyles = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const EspChipCard: FC<EspChipCardProps> = ({ serialState }) => {
  const [chipDetails, setChipDetails] = useState<EspChipDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [useStub, setUseStub] = useState(false); // Default false for simple diagnostics

  const handleAnalyzeChip = async () => {
    if (!serialState.port) return;
    setLoading(true);
    setProgressMsg('Synchronizing with bootloader...');
    
    try {
      const details = await serialManager.runExclusiveAction(async (port) => {
        return await espDiagnostics.analyzeChip(
          port,
          serialState.baudRate,
          { useStub },
          (text: string) => setProgressMsg(text)
        );
      });
      
      if (details) {
        setChipDetails(details);
      }
    } catch (err: any) {
      setProgressMsg(`Error: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHardReset = async () => {
    if (!serialState.port) return;
    setProgressMsg('Resetting Espressif chip into execution mode...');
    await serialManager.runExclusiveAction(async (port) => {
      await espDiagnostics.hardReset(port);
      return true;
    });
    setProgressMsg('Hard reset signal issued.');
  };

  const handleClear = () => {
    setChipDetails(null);
    setProgressMsg('');
  };

  if (!serialState.isConnected) {
    return (
      <div className={cardStyles as any}>
        <h2 className={style({ font: 'heading-xs', color: 'neutral', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }) as any}>
          <DataSettingsIcon /> Espressif Chip Diagnostics
        </h2>
        <div className={style({
          textAlign: 'center',
          color: 'neutral-subdued',
          font: 'body-sm',
          padding: 24,
        }) as any}>
          <Text>Connect a serial bridge to perform chip analysis.</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={cardStyles as any}>
      <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) as any}>
        <h2 className={style({ font: 'heading-xs', color: 'neutral', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }) as any}>
          <DataSettingsIcon /> Espressif Chip Diagnostics
        </h2>
        {chipDetails && (
          <Button 
            variant="secondary" 
            size="S" 
            onPress={handleClear}
          >
            Clear
          </Button>
        )}
      </div>

      {/* scan prompt state */}
      {!chipDetails && !loading && (
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center', paddingY: 8 }) as any}>
          <Text styles={style({ font: 'body-sm', color: 'neutral-subdued' })}>
            The Web App will attempt to use DTR/RTS auto-reset signals to synchronize with the chip's internal bootloader ROM and extract eFuse registers.
          </Text>

          <div className={style({ backgroundColor: 'blue-100', padding: 12, borderRadius: 'lg', borderStyle: 'solid', borderWidth: 1, borderColor: 'blue-200', textAlign: 'start' }) as any}>
            <span className={style({ font: 'body-xs', fontWeight: 'bold', color: 'blue-900', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }) as any}>
              <InfoCircleIcon /> Manual Bootloader Mode
            </span>
            <Text styles={style({ font: 'body-xs', color: 'blue-800' })}>
              If your board lacks an auto-programmer circuit, you must manually enter bootloader mode before scanning:
              <ol style={{ margin: 0, marginTop: 4, paddingLeft: 20 }}>
                <li>Press and hold the <strong>BOOT (IO0)</strong> button.</li>
                <li>Click the <strong>EN (RESET)</strong> button once.</li>
                <li>Release the <strong>BOOT</strong> button.</li>
              </ol>
            </Text>
          </div>

          <div className={style({ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }) as any}>
            <Switch isSelected={useStub} onChange={setUseStub}>
               <Text styles={style({ font: 'body-xs', fontWeight: 'bold' })}>Use Fast Stub</Text>
            </Switch>
            <Button 
              variant="accent" 
              onPress={handleAnalyzeChip}
            >
              <PlayIcon />
              Run Chip eFuse Scan
            </Button>
          </div>
          
          <div className={style({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, font: 'body-xs', color: 'neutral-subdued', margin: 0 }) as any}>
            <AlertTriangleIcon /> Reading eFuses requires the chip to be in Bootloader Mode. It is not possible to extract this hardware data while your custom firmware is actively executing.
          </div>
        </div>
      )}

      {/* loading handshake progress */}
      {loading && (
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: 24 }) as any}>
          <ProgressCircle isIndeterminate size="L" aria-label="Analyzing Chip" />
          <Text styles={style({ font: 'body-sm', color: 'neutral' })}>{progressMsg}</Text>
        </div>
      )}

      {/* result details card */}
      {chipDetails && (
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 16 }) as any}>
          <div className={style({ backgroundColor: 'gray-50', padding: 16, borderRadius: 'lg', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
            <div className={style({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }) as any}>
              <div className={metaListStyles as any}>
                <span className={style({ font: 'body-xs', color: 'neutral-subdued' }) as any}>Chip Family</span>
                <span className={style({ font: 'body-sm', fontWeight: 'bold', color: 'neutral' }) as any}>{chipDetails.chipName}</span>
              </div>
              <div className={metaListStyles as any}>
                <span className={style({ font: 'body-xs', color: 'neutral-subdued' }) as any}>MAC Address</span>
                <span className={style({ font: 'body-sm', fontWeight: 'bold', color: 'neutral' }) as any}>{chipDetails.macAddress}</span>
              </div>
              <div className={metaListStyles as any}>
                <span className={style({ font: 'body-xs', color: 'neutral-subdued' }) as any}>Crystal Freq</span>
                <span className={style({ font: 'body-sm', fontWeight: 'bold', color: 'neutral' }) as any}>{chipDetails.crystalFreq}</span>
              </div>
              <div className={metaListStyles as any}>
                <span className={style({ font: 'body-xs', color: 'neutral-subdued' }) as any}>Flash Size</span>
                <Badge variant="notice" fillStyle="subtle">{chipDetails.flashSize}</Badge>
              </div>
            </div>
            
            <div className={style({ marginTop: 12, borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: 'gray-200', paddingTop: 12 }) as any}>
               <span className={style({ font: 'body-xs', color: 'neutral-subdued', display: 'block', marginBottom: 4 }) as any}>Model Description</span>
               <span className={style({ font: 'body-xs', color: 'neutral' }) as any}>{chipDetails.description}</span>
            </div>
          </div>

          <div>
            <span className={style({ font: 'body-xs', fontWeight: 'bold', color: 'neutral', display: 'block', marginBottom: 8 }) as any}>Detected Hardware Features</span>
            <div className={style({ display: 'flex', flexWrap: 'wrap', gap: 8 }) as any}>
              {chipDetails.features.map((f, i) => (
                <Badge key={i} variant="informative" fillStyle="subtle">{f}</Badge>
              ))}
            </div>
          </div>

          {/* Reset Action Buttons */}
          <div className={style({ display: 'flex', gap: 12 }) as any}>
            <Button 
              variant="secondary" 
              onPress={handleHardReset}
              styles={style({ flex: 1 }) as any}
            >
              <RefreshIcon />
              Hard Reset Chip
            </Button>
            <Button 
              variant="accent" 
              onPress={handleAnalyzeChip}
              styles={style({ flex: 1 }) as any}
            >
              <RefreshIcon />
              Rescan eFuse
            </Button>
          </div>
        </div>
      )}

      {/* standby debug messages */}
      {progressMsg && !loading && !chipDetails && (
        <div className={style({ 
          font: 'body-xs', 
          fontFamily: 'code', 
          color: 'neutral-subdued', 
          backgroundColor: 'gray-100', 
          padding: 8, 
          borderRadius: 'sm',
          wordBreak: 'break-all'
        }) as any}>
          <Text>{progressMsg}</Text>
        </div>
      )}
    </div>
  );
};
