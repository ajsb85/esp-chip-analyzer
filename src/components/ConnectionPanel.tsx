import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { serialManager } from '../services/serialManager';
import type { SerialConnectionState } from '../services/serialManager';
import { Picker, PickerItem } from '@react-spectrum/s2/Picker';
import { InlineAlert, Heading, Content } from '@react-spectrum/s2/InlineAlert';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import SearchIcon from '@react-spectrum/s2/icons/Search';

interface ConnectionPanelProps {
  serialState: SerialConnectionState;
  onConnect: (port: SerialPort, baud: number) => void;
  onDisconnect: () => void;
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

  const refreshPortTimer = () => {
    refreshPairedPorts();
  };

  useEffect(() => {
    refreshPortTimer();
    const timer = setInterval(refreshPortTimer, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectPort = async () => {
    const port = await serialManager.requestPort();
    if (port) {
      await refreshPairedPorts();
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
    <div className={cardStyles as any}>
      <h2 className={titleStyles as any}>
        ⚡ Port Connection
      </h2>

      {/* Semantic Connection Errors */}
      {serialState.error && (
        <InlineAlert variant="negative">
          <Heading>Connection Failure</Heading>
          <Content>
            {serialState.error}
            {serialState.errorClass === 'Busy' && (
              <span className={style({ display: 'block', marginTop: 4, font: 'body-xs' }) as any}>
                💡 Tip: Make sure the device is not open in Arduino IDE, Espruino, or another browser tab.
              </span>
            )}
          </Content>
        </InlineAlert>
      )}

      {/* Reconnecting Notifications */}
      {serialState.isReconnecting && (
        <InlineAlert variant="notice">
          <Heading>Reconnecting</Heading>
          <Content>
            Device disconnected. Searching matching serial interfaces to resume connection...
          </Content>
        </InlineAlert>
      )}

      {/* Active Device Selector */}
      {pairedPorts.length > 0 ? (
        <Picker 
          label="Active Device" 
          value={selectedPortIndex.toString()}
          onSelectionChange={(val) => setSelectedPortIndex(Number(val))}
          isDisabled={serialState.isConnected}
          styles={style({ width: '100%' }) as any}
        >
          {pairedPorts.map((p, idx) => (
            <PickerItem key={idx} id={idx.toString()}>
              {getPortDisplayName(p)}
            </PickerItem>
          ))}
        </Picker>
      ) : (
        <div className={style({
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: 12,
          backgroundColor: { default: 'gray-100', _dark: 'gray-200' },
          borderStyle: 'dashed',
          borderWidth: 1,
          borderColor: { default: 'gray-300', _dark: 'gray-400' },
          borderRadius: 'lg',
          alignItems: 'center',
        }) as any}>
          <span className={style({ font: 'body-sm', color: 'neutral-subdued' }) as any}>
            No Authorized Ports Found
          </span>
        </div>
      )}

      {/* Select Port Trigger (Secondary Brand Blue Contrast Button) */}
      <button 
        onClick={handleSelectPort} 
        disabled={serialState.isConnected}
        className={style({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: 'full',
          paddingY: 8,
          paddingX: 16,
          borderStyle: 'none',
          borderRadius: 'default',
          fontWeight: 'bold',
          fontSize: 'body-sm',
          cursor: { default: 'pointer', _disabled: 'not-allowed' },
          opacity: { default: 1, _disabled: 0.5 },
          backgroundColor: { 
            default: 'blue-900', 
            _hover: 'blue-1000', 
            _active: 'blue-1100',
            _dark: 'blue-500',
            _dark_hover: 'blue-400',
            _dark_active: 'blue-300',
            _disabled: 'gray-300'
          },
          color: 'white',
          transition: 'colors'
        }) as any}
      >
        <SearchIcon />
        Select New Device
      </button>

      {/* Baud Rate selector */}
      <Picker 
        label="Baud Rate (bps)" 
        value={selectedBaud.toString()}
        onSelectionChange={(val) => setSelectedBaud(Number(val))}
        isDisabled={serialState.isConnected}
        styles={style({ width: '100%' }) as any}
      >
        {baudOptions.map(baud => (
          <PickerItem key={baud} id={baud.toString()}>
            {baud.toLocaleString()}
          </PickerItem>
        ))}
      </Picker>

      {/* Connection Buttons (Primary Corporate Red buttons) */}
      {!serialState.isConnected ? (
        <button 
          onClick={handleConnectClick} 
          disabled={pairedPorts.length === 0}
          className={style({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: 'full',
            paddingY: 12,
            paddingX: 16,
            borderStyle: 'none',
            borderRadius: 'default',
            fontWeight: 'bold',
            fontSize: 'body-sm',
            cursor: { default: 'pointer', _disabled: 'not-allowed' },
            opacity: { default: 1, _disabled: 0.5 },
            backgroundColor: { 
              default: 'red-900', 
              _hover: 'red-1000', 
              _active: 'red-1100',
              _dark: 'red-600',
              _dark_hover: 'red-500',
              _dark_active: 'red-400',
              _disabled: 'gray-300'
            },
            color: 'white',
            transition: 'colors',
            marginTop: 8
          }) as any}
        >
          🔌 Connect Analyzer
        </button>
      ) : (
        <button 
          onClick={onDisconnect} 
          className={style({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: 'full',
            paddingY: 12,
            paddingX: 16,
            borderStyle: 'none',
            borderRadius: 'default',
            fontWeight: 'bold',
            fontSize: 'body-sm',
            cursor: 'pointer',
            backgroundColor: { 
              default: 'red-900', 
              _hover: 'red-1000', 
              _active: 'red-1100',
              _dark: 'red-600',
              _dark_hover: 'red-500',
              _dark_active: 'red-400'
            },
            color: 'white',
            transition: 'colors',
            marginTop: 8
          }) as any}
        >
          🔌 Disconnect Analyzer
        </button>
      )}
    </div>
  );
};
