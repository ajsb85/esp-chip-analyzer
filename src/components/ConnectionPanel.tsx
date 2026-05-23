import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { serialManager } from '../services/serialManager';
import type { SerialConnectionState } from '../services/serialManager';

interface ConnectionPanelProps {
  serialState: SerialConnectionState;
  onConnect: (port: SerialPort, baud: number) => void;
  onDisconnect: () => void;
}

export const ConnectionPanel: FC<ConnectionPanelProps> = ({
  serialState,
  onConnect,
  onDisconnect
}) => {
  const [selectedBaud, setSelectedBaud] = useState<number>(115200);
  const [pairedPorts, setPairedPorts] = useState<SerialPort[]>([]);
  const [selectedPortIndex, setSelectedPortIndex] = useState<number>(-1);

  const baudOptions = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600, 1500000, 2000000];

  const refreshPairedPorts = async () => {
    const ports = await serialManager.getPairedPorts();
    setPairedPorts(ports);
    if (ports.length > 0 && selectedPortIndex === -1) {
      setSelectedPortIndex(0);
    }
  };

  useEffect(() => {
    refreshPairedPorts();
    // Set up timer to refresh paired ports list
    const timer = setInterval(refreshPairedPorts, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectPort = async () => {
    const port = await serialManager.requestPort();
    if (port) {
      await refreshPairedPorts();
      // Find the index of the newly added port
      const currentPorts = await serialManager.getPairedPorts();
      const newIndex = currentPorts.findIndex(p => p === port);
      if (newIndex !== -1) {
        setSelectedPortIndex(newIndex);
      }
    }
  };

  const handleConnectClick = () => {
    if (selectedPortIndex >= 0 && selectedPortIndex < pairedPorts.length) {
      onConnect(pairedPorts[selectedPortIndex], selectedBaud);
    }
  };

  const getPortDisplayName = (port: SerialPort) => {
    const info = port.getInfo();
    if (info.usbVendorId) {
      const vidStr = info.usbVendorId.toString(16).toUpperCase().padStart(4, '0');
      const pidStr = info.usbProductId ? info.usbProductId.toString(16).toUpperCase().padStart(4, '0') : 'N/A';
      return `USB Serial (VID: 0x${vidStr}, PID: 0x${pidStr})`;
    }
    return 'Generic Serial Port';
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 className="panel-title">
        ⚡ Port Connection
      </h2>

      {serialState.error && (
        <div style={{
          background: 'rgba(255, 82, 82, 0.12)',
          border: '1px solid rgba(255, 82, 82, 0.25)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '0.85rem',
          color: '#ff5252',
          wordBreak: 'break-word'
        }}>
          <strong>Connection Failure:</strong> {serialState.error}
          {serialState.errorClass === 'Busy' && (
            <p style={{ marginTop: '6px', fontSize: '0.78rem', opacity: 0.85 }}>
              💡 Tip: Make sure the device is not opened in Arduino IDE, Espruino, or another browser tab.
            </p>
          )}
        </div>
      )}

      {serialState.isReconnecting && (
        <div style={{
          background: 'rgba(255, 215, 0, 0.08)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '0.85rem',
          color: '#ffd740'
        }}>
          🔄 Device disconnected. Searching matching serial interfaces to resume connection...
        </div>
      )}

      <div className="form-group">
        <label>Active Device</label>
        {pairedPorts.length > 0 ? (
          <select 
            value={selectedPortIndex}
            onChange={(e) => setSelectedPortIndex(Number(e.target.value))}
            disabled={serialState.isConnected}
          >
            {pairedPorts.map((p, idx) => (
              <option key={idx} value={idx}>
                {getPortDisplayName(p)}
              </option>
            ))}
          </select>
        ) : (
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid hsl(var(--border-glass))',
            padding: '10px 14px',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '0.9rem',
            color: 'hsl(var(--text-muted))',
            textAlign: 'center'
          }}>
            No Authorized Ports Found
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
        <button 
          onClick={handleSelectPort} 
          className="btn btn-outline"
          disabled={serialState.isConnected}
          style={{ width: '100%' }}
        >
          🔍 Select New Device
        </button>
      </div>

      <div className="form-group">
        <label>Baud Rate (bps)</label>
        <select 
          value={selectedBaud} 
          onChange={(e) => setSelectedBaud(Number(e.target.value))}
          disabled={serialState.isConnected}
        >
          {baudOptions.map(baud => (
            <option key={baud} value={baud}>
              {baud}
            </option>
          ))}
        </select>
      </div>

      {!serialState.isConnected ? (
        <button 
          onClick={handleConnectClick} 
          className="btn btn-cyan glow-pulse"
          disabled={pairedPorts.length === 0}
          style={{ width: '100%', marginTop: '8px' }}
        >
          🔌 Connect Analyzer
        </button>
      ) : (
        <button 
          onClick={onDisconnect} 
          className="btn btn-danger"
          style={{ width: '100%', marginTop: '8px' }}
        >
          🔌 Disconnect Analyzer
        </button>
      )}
    </div>
  );
};
