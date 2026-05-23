import { useEffect, useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';

interface SignalMonitorProps {
  serialState: SerialConnectionState;
}

export const SignalMonitor: FC<SignalMonitorProps> = ({ serialState }) => {
  // Input signals
  const [inputs, setInputs] = useState({
    dcd: false,
    cts: false,
    ri: false,
    dsr: false
  });
  
  // Output signals
  const [outputs, setOutputs] = useState({
    dtr: false,
    rts: false,
    brk: false
  });

  const [supported, setSupported] = useState(true);

  // Periodic polling for input signals (when connected)
  useEffect(() => {
    if (!serialState.isConnected || !serialState.port) {
      setSupported(true);
      return;
    }

    const port = serialState.port;
    let isActive = true;

    const pollSignals = async () => {
      if (!isActive) return;
      try {
        const sigs = await port.getSignals();
        setInputs({
          dcd: sigs.dataCarrierDetect,
          cts: sigs.clearToSend,
          ri: sigs.ringIndicator,
          dsr: sigs.dataSetReady
        });
        setSupported(true);
      } catch (err) {
        // Some simple USB-CDC drivers or physical virtual COM ports do not support handshaking lines
        setSupported(false);
      }
    };

    pollSignals();
    const interval = setInterval(pollSignals, 150); // Polling every 150ms

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [serialState.isConnected, serialState.port]);

  // Handle setting outputs
  const handleToggleOutput = async (signal: 'dtr' | 'rts' | 'brk', checked: boolean) => {
    if (!serialState.isConnected || !serialState.port) return;
    try {
      const nextOutputs = { ...outputs, [signal]: checked };
      setOutputs(nextOutputs);
      
      await serialState.port.setSignals({
        dataTerminalReady: nextOutputs.dtr,
        requestToSend: nextOutputs.rts,
        break: nextOutputs.brk
      });
    } catch (err) {
      console.warn('[SignalMonitor] Failed to set signals:', err);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 className="panel-title">
        🔌 RS232 DB9 Signals
      </h2>

      {!serialState.isConnected ? (
        <div style={{
          textAlign: 'center',
          color: 'hsl(var(--text-muted))',
          fontSize: '0.9rem',
          padding: '20px 0'
        }}>
          Connect device to monitor signal states.
        </div>
      ) : !supported ? (
        <div style={{
          textAlign: 'center',
          color: 'hsl(var(--warning-orange))',
          fontSize: '0.85rem',
          background: 'rgba(255, 215, 0, 0.05)',
          border: '1px dashed rgba(255,215,0,0.15)',
          padding: '12px',
          borderRadius: '8px'
        }}>
          ⚠️ Handshake signals are not supported or blocked by the USB converter firmware.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ marginBottom: '8px', display: 'block' }}>Output Pins (Writeable)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="switch-group">
                <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>DTR (Data Terminal Ready)</span>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={outputs.dtr}
                    onChange={(e) => handleToggleOutput('dtr', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="switch-group">
                <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>RTS (Request To Send)</span>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={outputs.rts}
                    onChange={(e) => handleToggleOutput('rts', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="switch-group">
                <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>BREAK (TX Line Toggle)</span>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={outputs.brk}
                    onChange={(e) => handleToggleOutput('brk', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '4px' }}>
            <label style={{ marginBottom: '8px', display: 'block' }}>Input Pins (Read-Only Status)</label>
            <div className="signal-grid">
              <div className="signal-card">
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>CTS</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Clear To Send</div>
                </div>
                <div className={`led-indicator ${inputs.cts ? 'high' : 'low'}`}></div>
              </div>

              <div className="signal-card">
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>DSR</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Data Set Ready</div>
                </div>
                <div className={`led-indicator ${inputs.dsr ? 'high' : 'low'}`}></div>
              </div>

              <div className="signal-card">
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>DCD</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Carrier Detect</div>
                </div>
                <div className={`led-indicator ${inputs.dcd ? 'high' : 'low'}`}></div>
              </div>

              <div className="signal-card">
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>RI</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Ring Indicator</div>
                </div>
                <div className={`led-indicator ${inputs.ri ? 'high' : 'low'}`}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
