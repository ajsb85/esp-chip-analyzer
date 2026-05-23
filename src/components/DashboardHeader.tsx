import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';

interface DashboardHeaderProps {
  serialState: SerialConnectionState;
  isOnline: boolean;
  onForgetPort: () => void;
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({
  serialState,
  isOnline,
  onForgetPort
}) => {
  const renderStatusBadge = () => {
    if (serialState.isReconnecting) {
      return (
        <span className="badge badge-reconnecting">
          Reconnecting...
        </span>
      );
    }
    if (serialState.isConnected) {
      return (
        <span className="badge badge-connected">
          ● Connected ({serialState.baudRate} bps)
        </span>
      );
    }
    return <span className="badge badge-disconnected">○ Disconnected</span>;
  };

  const isWebSerialSupported = typeof navigator !== 'undefined' && !!navigator.serial;
  const isWebUsbSupported = typeof navigator !== 'undefined' && !!navigator.usb;

  return (
    <header className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: '#0B0F19',
          fontSize: '1.2rem',
          boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)'
        }}>
          ESP
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>ESP32 Chip Analyzer</h1>
          <p style={{ fontStyle: 'normal', fontSize: '0.8rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
            Enterprise Diagnostic Platform & Silicon Labs AN978 Customs Inspector
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Support badges */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isWebSerialSupported && (
            <span style={{ background: 'rgba(255, 82, 82, 0.1)', color: '#ff5252', border: '1px solid rgba(255,82,82,0.2)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px' }}>
              No WebSerial Support
            </span>
          )}
          {!isWebUsbSupported && (
            <span style={{ background: 'rgba(255, 82, 82, 0.1)', color: '#ff5252', border: '1px solid rgba(255,82,82,0.2)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px' }}>
              No WebUSB Support
            </span>
          )}
        </div>

        {/* Network connection badge */}
        <span style={{ 
          background: isOnline ? 'rgba(105, 240, 174, 0.08)' : 'rgba(255, 110, 64, 0.08)', 
          color: isOnline ? '#69f0ae' : '#ff6e40',
          border: `1px solid ${isOnline ? 'rgba(105, 240, 174, 0.15)' : 'rgba(255, 110, 64, 0.15)'}`,
          fontSize: '0.75rem', 
          padding: '4px 10px', 
          borderRadius: '20px',
          fontWeight: 600
        }}>
          {isOnline ? '🌐 Online PWA' : '📡 Offline Diagnostic Active'}
        </span>

        {renderStatusBadge()}

        {serialState.port && (
          <button 
            onClick={onForgetPort}
            className="btn btn-outline btn-danger"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            title="Revoke browser permission to access this serial port"
          >
            🔒 Revoke Access
          </button>
        )}
      </div>
    </header>
  );
};
