// @ts-nocheck
import { useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import { espDiagnostics } from '../services/espDiagnostics';
import type { EspChipDetails } from '../services/espDiagnostics';
import { Button } from '@react-spectrum/s2/Button';
import { Badge } from '@react-spectrum/s2/Badge';
import { ProgressCircle } from '@react-spectrum/s2/ProgressCircle';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import RefreshIcon from '@react-spectrum/s2/icons/Refresh';
import PlayIcon from '@react-spectrum/s2/icons/Play';

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

const titleStyles = style({
  font: 'heading-xs',
  color: 'neutral',
  margin: 0,
});

const metaListStyles = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

const metaItemStyles = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingY: 8,
  borderBottomStyle: 'solid',
  borderBottomWidth: 1,
  borderBottomColor: 'gray-200',
});

const metaLabelStyles = style({
  font: 'body-sm',
  fontWeight: 'bold',
  color: 'neutral-subdued',
});

const metaValueStyles = style({
  font: 'body-sm',
  color: 'neutral',
  fontWeight: 'medium',
});

export const EspChipCard: FC<EspChipCardProps> = ({ serialState }) => {
  const [chipDetails, setChipDetails] = useState<EspChipDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');

  const handleAnalyzeChip = async () => {
    if (!serialState.port) return;
    setLoading(true);
    setProgressMsg('Synchronizing with bootloader...');
    
    const details = await espDiagnostics.analyzeChip(
      serialState.port,
      serialState.baudRate,
      (text) => setProgressMsg(text)
    );
    
    if (details) {
      setChipDetails(details);
    }
    setLoading(false);
  };

  const handleHardReset = async () => {
    if (!serialState.port) return;
    setProgressMsg('Resetting Espressif chip into execution mode...');
    await espDiagnostics.hardReset(serialState.port);
    setProgressMsg('Hard reset signal issued.');
  };

  const handleClear = () => {
    setChipDetails(null);
    setProgressMsg('');
  };

  if (!serialState.isConnected) {
    return (
      <div className={cardStyles as any}>
        <h2 className={titleStyles as any}>
          🔬 Espressif Chip Diagnostics
        </h2>
        <div className={style({
          textAlign: 'center',
          color: 'neutral-subdued',
          font: 'body-sm',
          padding: 24,
        }) as any}>
          Connect a serial bridge to perform chip eFuse diagnostics.
        </div>
      </div>
    );
  }

  return (
    <div className={cardStyles as any}>
      <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) as any}>
        <h2 className={titleStyles as any}>
          🔬 Espressif Chip Diagnostics
        </h2>
        {chipDetails && (
          <Button 
            variant="secondary" 
            size="S" 
            onPress={handleClear}
          >
            Clear Scan
          </Button>
        )}
      </div>

      {/* scan prompt state */}
      {!chipDetails && !loading && (
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center', paddingY: 8 }) as any}>
          <p className={style({ font: 'body-sm', color: 'neutral-subdued', margin: 0 }) as any}>
            Toggle DTR/RTS auto-reset signals to synchronize with the chip's internal bootloader ROM and extract eFuse registers.
          </p>
          <Button 
            variant="accent" 
            onPress={handleAnalyzeChip}
            styles={style({ alignSelf: 'center' }) as any}
          >
            <PlayIcon />
            Run Chip eFuse Scan
          </Button>
          <p className={style({ font: 'body-xs', color: 'neutral-subdued', margin: 0 }) as any}>
            ⚠️ This will temporarily halt any firmware currently executing on the ESP.
          </p>
        </div>
      )}

      {/* loading handshake progress */}
      {loading && (
        <div className={style({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          paddingY: 16,
          textAlign: 'center'
        }) as any}>
          <ProgressCircle size="L" isIndeterminate aria-label="Querying Espressif silicon registers" />
          <span className={style({ font: 'body-sm', fontWeight: 'bold', color: 'accent' }) as any}>
            Diagnostic Pipeline Running...
          </span>
          <div className={style({ 
            font: 'body-xs', 
            fontFamily: 'code', 
            color: 'neutral-subdued',
            backgroundColor: 'gray-100',
            paddingX: 12,
            paddingY: 8,
            borderRadius: 'sm',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }) as any}>
            {progressMsg}
          </div>
        </div>
      )}

      {/* diagnostic results display */}
      {chipDetails && !loading && (
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 16 }) as any}>
          <div className={metaListStyles as any}>
            <div className={metaItemStyles as any}>
              <span className={metaLabelStyles as any}>Chip Family</span>
              <span className={style({
                font: 'body-sm',
                fontWeight: 'bold',
                color: 'accent'
              }) as any}>{chipDetails.chipName}</span>
            </div>

            <div className={metaItemStyles as any}>
              <span className={metaLabelStyles as any}>MAC Address (eFuse)</span>
              <span className={style({
                font: 'body-sm',
                fontFamily: 'code',
                textTransform: 'uppercase',
                color: 'neutral'
              }) as any}>{chipDetails.macAddress}</span>
            </div>

            <div className={metaItemStyles as any}>
              <span className={metaLabelStyles as any}>Crystal Frequency</span>
              <span className={metaValueStyles as any}>{chipDetails.crystalFreq}</span>
            </div>

            <div className={metaItemStyles as any}>
              <span className={metaLabelStyles as any}>SPI Flash Size (Auto)</span>
              <span className={metaValueStyles as any}>{chipDetails.flashSize}</span>
            </div>

            {/* features list badges */}
            <div className={style({
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingY: 8,
              borderBottomStyle: 'solid',
              borderBottomWidth: 1,
              borderBottomColor: 'gray-200'
            }) as any}>
              <span className={metaLabelStyles as any}>Silicon Features Map</span>
              <div className={style({ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }) as any}>
                {chipDetails.features.length > 0 ? (
                  chipDetails.features.map((feat, idx) => (
                    <Badge key={idx} variant="informative" fillStyle="subtle">
                      {feat}
                    </Badge>
                  ))
                ) : (
                  <span className={style({ font: 'body-sm', color: 'neutral-subdued', fontStyle: 'italic' }) as any}>
                    No special feature registers declared in eFuse.
                  </span>
                )}
              </div>
            </div>

            {/* Revision Description */}
            {chipDetails.description && (
              <div className={style({
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingY: 8
              }) as any}>
                <span className={metaLabelStyles as any}>Revision Description</span>
                <p className={style({ 
                  font: 'body-sm', 
                  color: 'neutral-subdued', 
                  lineHeight: 'body', 
                  backgroundColor: 'gray-100',
                  paddingX: 12,
                  paddingY: 8,
                  borderRadius: 'lg',
                  width: '100%',
                  margin: 0
                }) as any}>
                  {chipDetails.description}
                </p>
              </div>
            )}
          </div>

          {/* Reset Action Buttons */}
          <div className={style({ display: 'flex', gap: 12 }) as any}>
            <Button 
              variant="secondary" 
              onPress={handleHardReset}
              styles={style({ flex: 1 }) as any}
            >
              🔄 Hard Reset Chip
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
          {progressMsg}
        </div>
      )}
    </div>
  );
};
