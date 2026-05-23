import { useState } from 'react';
import type { FC } from 'react';
import { Button } from '@react-spectrum/s2/Button';
import { Text } from '@react-spectrum/s2';
import { Badge } from '@react-spectrum/s2/Badge';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import DataSettingsIcon from '@react-spectrum/s2/icons/DataSettings';
import { espJtag } from '../services/espJtag';

export const EspJtagCard: FC = () => {
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog(prev => [...prev, msg]);
  };

  const handleConnect = async () => {
    addLog('Requesting WebUSB device...');
    const success = await espJtag.connect();
    if (success) {
      setConnected(true);
      addLog('Connected to ESP USB JTAG interface.');
    } else {
      addLog('Failed to connect or device not found.');
    }
  };

  const handleDisconnect = async () => {
    await espJtag.disconnect();
    setConnected(false);
    addLog('Disconnected.');
  };

  const handleTestReset = async () => {
    if (!connected) return;
    try {
      addLog('Sending CMD_RST with srst=1');
      await espJtag.setReset(true);
      addLog('Sending CMD_RST with srst=0');
      await espJtag.setReset(false);
      addLog('Sending CMD_FLUSH');
      await espJtag.flush();
      addLog('Reset commands sent.');
    } catch (e: any) {
      addLog('Error: ' + e.message);
    }
  };

  return (
    <div className={style({
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
    }) as any}>
      <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) as any}>
        <h2 className={style({ font: 'heading-xs', color: 'neutral', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }) as any}>
          <DataSettingsIcon />
          <Text>ESP USB JTAG (WebUSB)</Text>
        </h2>
        {connected ? (
          <Badge variant="positive" fillStyle="subtle">Connected</Badge>
        ) : (
          <Badge variant="neutral" fillStyle="subtle">Disconnected</Badge>
        )}
      </div>

      <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
        Direct interface to the ESP32 built-in USB JTAG programmer. This bypasses the virtual COM port and communicates via raw USB OUT/IN endpoints using the Espressif JTAG protocol.
      </Text>

      <div className={style({ display: 'flex', gap: 12 }) as any}>
        {!connected ? (
          <Button variant="accent" onPress={handleConnect}>Connect via WebUSB</Button>
        ) : (
          <>
            <Button variant="secondary" onPress={handleDisconnect}>Disconnect</Button>
            <Button variant="primary" onPress={handleTestReset}>Send JTAG Reset</Button>
          </>
        )}
      </div>

      {log.length > 0 && (
        <div className={style({
          backgroundColor: 'gray-900',
          color: 'gray-50',
          padding: 12,
          borderRadius: 'lg',
          fontFamily: 'code',
          font: 'detail-sm',
          maxHeight: 150,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }) as any}>
          {log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
};
