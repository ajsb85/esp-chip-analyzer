import { useEffect, useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import { usbAnalyzer } from '../services/usbAnalyzer';
import type { UsbConverterDetails } from '../services/usbAnalyzer';
import { Badge } from '@react-spectrum/s2/Badge';
import { InlineAlert, Heading, Content } from '@react-spectrum/s2/InlineAlert';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

interface UsbConverterCardProps {
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

const naValueStyles = style({
  font: 'body-sm',
  color: 'neutral-subdued',
  fontWeight: 'medium',
});

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
      <div className={cardStyles as any}>
        <h2 className={titleStyles as any}>
          🔌 USB Bridge Diagnostics
        </h2>
        <div className={style({
          textAlign: 'center',
          color: 'neutral-subdued',
          font: 'body-sm',
          padding: 24,
        }) as any}>
          Connect a serial bridge to retrieve USB configuration details.
        </div>
      </div>
    );
  }

  const getChipBadgeVariant = () => {
    switch (details.type) {
      case 'CP210x': return 'accent';
      case 'FTDI': return 'informative';
      case 'CH340': return 'positive';
      case 'PL2303': return 'notice';
      default: return 'neutral';
    }
  };

  return (
    <div className={cardStyles as any}>
      <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) as any}>
        <h2 className={titleStyles as any}>
          🔌 USB Bridge Diagnostics
        </h2>
        <Badge variant={getChipBadgeVariant()} fillStyle="subtle">
          {details.type} Chip
        </Badge>
      </div>

      {loading ? (
        <div className={style({ textAlign: 'center', color: 'neutral-subdued', padding: 24 }) as any}>
          Querying USB interface descriptors...
        </div>
      ) : (
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 12 }) as any}>
          <div className={metaListStyles as any}>
            <div className={metaItemStyles as any}>
              <span className={metaLabelStyles as any}>Manufacturer</span>
              <span className={metaValueStyles as any}>{details.manufacturer}</span>
            </div>
            
            <div className={metaItemStyles as any}>
              <span className={metaLabelStyles as any}>Product Name</span>
              <span className={metaValueStyles as any}>{details.productName}</span>
            </div>

            <div className={metaItemStyles as any}>
              <span className={metaLabelStyles as any}>Serial Number String</span>
              <span className={(details.serialNumber.startsWith('N/A') ? naValueStyles : metaValueStyles) as any}>
                {details.serialNumber}
              </span>
            </div>

            <div className={metaItemStyles as any}>
              <span className={metaLabelStyles as any}>Hardware Address (VID:PID)</span>
              <span className={metaValueStyles as any}>{details.vendorId} : {details.productId}</span>
            </div>

            <div className={metaItemStyles as any}>
              <span className={metaLabelStyles as any}>USB Spec Version</span>
              <span className={metaValueStyles as any}>{details.usbVersion}</span>
            </div>

            <div className={metaItemStyles as any}>
              <span className={metaLabelStyles as any}>Decoded Model</span>
              <span className={style({
                font: 'body-sm',
                fontWeight: 'bold',
                color: {
                  default: 'blue-900',
                  _dark: 'blue-500'
                }
              }) as any}>{details.model}</span>
            </div>

            {/* CP210x customized properties */}
            {details.type === 'CP210x' && usbDevicePaired && (
              <>
                {details.cp210xPartNumCode !== undefined && (
                  <div className={metaItemStyles as any}>
                    <span className={metaLabelStyles as any}>Part Number Register</span>
                    <span className={metaValueStyles as any}>0x{details.cp210xPartNumCode.toString(16).toUpperCase().padStart(2, '0')}</span>
                  </div>
                )}
                {details.cp210xFlushBmp !== undefined && (
                  <div className={metaItemStyles as any}>
                    <span className={metaLabelStyles as any}>Flush Buffers Latch</span>
                    <span className={metaValueStyles as any}>{details.cp210xFlushBmp}</span>
                  </div>
                )}
                {details.cp210xMode !== undefined && (
                  <div className={metaItemStyles as any}>
                    <span className={metaLabelStyles as any}>SCI / ECI Pin Mode</span>
                    <span className={metaValueStyles as any}>{details.cp210xMode}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* WebUSB Advanced Diagnostics invitation */}
          {!usbDevicePaired && (
            <InlineAlert variant="informative">
              <Heading>Advanced Diagnostics Available!</Heading>
              <Content>
                Pair this bridge via WebUSB to read EEPROM registers, hardware modes, and latch details directly.
                <button 
                  onClick={handleRequestWebUsb}
                  className={style({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'full',
                    paddingY: 8,
                    paddingX: 12,
                    borderStyle: 'none',
                    borderRadius: 'default',
                    fontWeight: 'bold',
                    fontSize: 'body-xs',
                    cursor: 'pointer',
                    backgroundColor: { 
                      default: 'blue-900', 
                      _hover: 'blue-1000', 
                      _active: 'blue-1100',
                      _dark: 'blue-500',
                      _dark_hover: 'blue-400',
                      _dark_active: 'blue-300'
                    },
                    color: 'white',
                    transition: 'colors',
                    marginTop: 8
                  }) as any}
                >
                  Request WebUSB Permission
                </button>
              </Content>
            </InlineAlert>
          )}
        </div>
      )}
    </div>
  );
};
