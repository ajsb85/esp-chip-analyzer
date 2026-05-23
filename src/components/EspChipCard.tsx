import { useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import { espDiagnostics } from '../services/espDiagnostics';
import type { EspChipDetails } from '../services/espDiagnostics';

interface EspChipCardProps {
  serialState: SerialConnectionState;
}

export const EspChipCard: FC<EspChipCardProps> = ({ serialState }) => {
  const [chipDetails, setChipDetails] = useState<EspChipDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');

  const handleAnalyzeChip = async () => {
    if (!serialState.port) return;
    setLoading(true);
    setProgressMsg('Synchronizing with bootloader...');
    
    // We execute diagnostics. Note: this will temporarily sync and put the chip in stub/ROM mode
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
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 className="panel-title">
          🔬 Espressif Chip Diagnostics
        </h2>
        <div style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.9rem', padding: '20px 0' }}>
          Connect a serial bridge to perform chip eFuse diagnostics.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          🔬 Espressif Chip Diagnostics
        </h2>
        {chipDetails && (
          <button 
            onClick={handleClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Clear Scan
          </button>
        )}
      </div>

      {!chipDetails && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>
            Toggle DTR/RTS auto-reset signals to synchronize with bootloader and read internal ROM registers.
          </p>
          <button 
            onClick={handleAnalyzeChip}
            className="btn btn-cyan"
            style={{ alignSelf: 'center' }}
          >
            🔍 Run Chip eFuse Scan
          </button>
          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
            ⚠️ This will temporarily halt any firmware currently running on the ESP.
          </p>
        </div>
      )}

      {loading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          padding: '20px 0',
          textAlign: 'center'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid hsla(var(--primary-cyan), 0.1)',
            borderTop: '3px solid hsl(var(--primary-cyan))',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'hsl(var(--primary-cyan))' }}>
            Diagnostic Pipeline Running...
          </div>
          <div style={{ 
            fontSize: '0.78rem', 
            fontFamily: 'var(--font-mono)', 
            color: 'hsl(var(--text-muted))',
            background: 'rgba(0,0,0,0.3)',
            padding: '8px 12px',
            borderRadius: '6px',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {progressMsg}
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {chipDetails && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="meta-list">
            <div className="meta-item">
              <span className="meta-label">Chip Family</span>
              <span className="meta-value highlight" style={{ color: 'hsl(var(--accent-purple))' }}>{chipDetails.chipName}</span>
            </div>

            <div className="meta-item">
              <span className="meta-label">MAC Address</span>
              <span className="meta-value" style={{ textTransform: 'uppercase' }}>{chipDetails.macAddress}</span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Crystal Speed</span>
              <span className="meta-value">{chipDetails.crystalFreq}</span>
            </div>

            <div className="meta-item">
              <span className="meta-label">SPI Flash Size</span>
              <span className="meta-value">{chipDetails.flashSize}</span>
            </div>

            <div className="meta-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px', borderBottom: 'none' }}>
              <span className="meta-label">Features Map</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', width: '100%' }}>
                {chipDetails.features.length > 0 ? (
                  chipDetails.features.map((feat, idx) => (
                    <span key={idx} style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: 'rgba(127, 0, 255, 0.1)',
                      border: '1px solid rgba(127, 0, 255, 0.25)',
                      color: '#b366ff',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {feat}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
                    No special feature registers declared in eFuse.
                  </span>
                )}
              </div>
            </div>

            {chipDetails.description && (
              <div className="meta-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', borderBottom: 'none', paddingTop: '10px' }}>
                <span className="meta-label">Revision Description</span>
                <p style={{ 
                  fontSize: '0.8rem', 
                  color: 'hsl(var(--text-secondary))', 
                  lineHeight: '1.45', 
                  background: 'rgba(0,0,0,0.15)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  width: '100%'
                }}>
                  {chipDetails.description}
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button 
              onClick={handleHardReset}
              className="btn btn-outline"
              style={{ flex: 1, padding: '10px' }}
              title="Issue classic RTS/DTR toggle to reboot chip into firmware"
            >
              🔄 Hard Reset Chip
            </button>
            <button 
              onClick={handleAnalyzeChip}
              className="btn btn-cyan"
              style={{ flex: 1, padding: '10px' }}
            >
              🔄 Rescan eFuse
            </button>
          </div>
        </div>
      )}

      {progressMsg && !loading && !chipDetails && (
        <div style={{ 
          fontSize: '0.78rem', 
          fontFamily: 'var(--font-mono)', 
          color: 'hsl(var(--text-muted))', 
          background: 'rgba(0,0,0,0.2)', 
          padding: '8px', 
          borderRadius: '4px',
          wordBreak: 'break-all'
        }}>
          {progressMsg}
        </div>
      )}
    </div>
  );
};
