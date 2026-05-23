import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { serialManager } from '../services/serialManager';
import type { SerialConnectionState } from '../services/serialManager';
import { Picker, PickerItem } from '@react-spectrum/s2/Picker';
import { InlineAlert, Heading, Content } from '@react-spectrum/s2/InlineAlert';
import { Button } from '@react-spectrum/s2/Button';
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

      {/* Select Port Trigger */}
      <Button 
        onPress={handleSelectPort}
        isDisabled={serialState.isConnected}
        variant="secondary"
        styles={style({ width: 'full' }) as any}
      >
        <SearchIcon />
        Select New Device
      </Button>

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

      {/* Connection Buttons */}
      {!serialState.isConnected ? (
        <Button 
          onPress={handleConnectClick} 
          isDisabled={pairedPorts.length === 0}
          variant="accent"
          styles={style({ width: 'full', marginTop: 8 }) as any}
        >
          Connect Analyzer
        </Button>
      ) : (
        <Button 
          onPress={onDisconnect} 
          variant="negative"
          styles={style({ width: 'full', marginTop: 8 }) as any}
        >
          Disconnect Analyzer
        </Button>
      )}
    </div>
  );
};
