import { useEffect, useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import { usbAnalyzer } from '../services/usbAnalyzer';
import type { UsbConverterDetails } from '../services/usbAnalyzer';

interface UsbConverterCardProps {
  serialState: SerialConnectionState;
}

export const UsbConverterCard: FC<UsbConverterCardProps> = ({ serialState }) => {
  const [details, setDetails] = useState<UsbConverterDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [usbDevicePaired, setUsbDevicePaired] = useState(false);

  const fetchDetails = async () => {
    if (!serialState.port) {
      setDetails(null);
      setUsbDevicePaired(false);
      return;
    }
    const info = serialState.port.getInfo();
    if (info.usbVendorId && info.usbProductId) {
      setLoading(true);
      const paired = await usbAnalyzer.findPairedUsbDevice(info.usbVendorId, info.usbProductId);
      setUsbDevicePaired(!!paired);
      const data = await usbAnalyzer.analyzeDevice(info.usbVendorId, info.usbProductId);
      setDetails(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [serialState.isConnected, serialState.port]);

  const handleRequestWebUsb = async () => {
    if (!serialState.port) return;
    const info = serialState.port.getInfo();
    if (info.usbVendorId && info.usbProductId) {
      const granted = await usbAnalyzer.requestUsbAccess(info.usbVendorId, info.usbProductId);
      if (granted) {
        await fetchDetails();
      }
    }
  };

  if (!serialState.isConnected || !details) {
    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 className="panel-title">
          🔌 USB Bridge Diagnostics
        </h2>
        <div style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.9rem', padding: '20px 0' }}>
          Connect a serial bridge to retrieve USB configuration details.
        </div>
      </div>
    );
  }

  const getChipTypeColor = () => {
    switch (details.type) {
      case 'CP210x': return 'hsl(var(--primary-cyan))';
      case 'FTDI': return 'hsl(var(--accent-purple))';
      case 'CH340': return '#69f0ae';
      case 'PL2303': return '#ffd740';
      default: return 'hsl(var(--text-primary))';
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          🔌 USB Bridge Diagnostics
        </h2>
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: 'bold', 
          padding: '2px 8px', 
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.05)',
          color: getChipTypeColor(),
          border: `1px solid ${getChipTypeColor()}22`
        }}>
          {details.type} Chip
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '20px 0' }}>
          Querying USB interface descriptors...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="meta-list">
            <div className="meta-item">
              <span className="meta-label">Manufacturer</span>
              <span className="meta-value">{details.manufacturer}</span>
            </div>
            
            <div className="meta-item">
              <span className="meta-label">Product Name</span>
              <span className="meta-value">{details.productName}</span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Serial String</span>
              <span className="meta-value" style={{ color: details.serialNumber.startsWith('N/A') ? 'hsl(var(--text-muted))' : 'hsl(var(--text-primary))' }}>
                {details.serialNumber}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Hardware Address</span>
              <span className="meta-value">{details.vendorId}:{details.productId}</span>
            </div>

            <div className="meta-item">
              <span className="meta-label">USB Spec Version</span>
              <span className="meta-value">{details.usbVersion}</span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Decoded Model</span>
              <span className="meta-value highlight" style={{ color: getChipTypeColor() }}>{details.model}</span>
            </div>

            {/* CP210x customized properties */}
            {details.type === 'CP210x' && usbDevicePaired && (
              <>
                {details.cp210xPartNumCode !== undefined && (
                  <div className="meta-item">
                    <span className="meta-label">Part Number Register</span>
                    <span className="meta-value">0x{details.cp210xPartNumCode.toString(16).toUpperCase()}</span>
                  </div>
                )}
                {details.cp210xFlushBmp !== undefined && (
                  <div className="meta-item">
                    <span className="meta-label">Flush Buffers Latch</span>
                    <span className="meta-value">{details.cp210xFlushBmp}</span>
                  </div>
                )}
                {details.cp210xMode !== undefined && (
                  <div className="meta-item">
                    <span className="meta-label">SCI / ECI Pin Mode</span>
                    <span className="meta-value" style={{ fontSize: '0.8rem' }}>{details.cp210xMode}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {!usbDevicePaired && (
            <div style={{
              marginTop: '8px',
              padding: '12px',
              background: 'rgba(0, 242, 254, 0.04)',
              border: '1px dashed hsla(var(--primary-cyan), 0.25)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>
                💡 <strong>Advanced Diagnostics Available!</strong> Pair this bridge via WebUSB to read EEPROM registers, hardware modes, and latch details directly.
              </p>
              <button 
                onClick={handleRequestWebUsb}
                className="btn btn-outline"
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '0.8rem',
                  borderColor: 'hsla(var(--primary-cyan), 0.4)',
                  color: 'hsl(var(--primary-cyan))'
                }}
              >
                🔍 Request WebUSB Permission
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
