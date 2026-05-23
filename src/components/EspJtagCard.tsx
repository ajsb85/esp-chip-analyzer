import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Button } from '@react-spectrum/s2/Button';
import { Text } from '@react-spectrum/s2';
import { Badge } from '@react-spectrum/s2/Badge';
import { Switch } from '@react-spectrum/s2/Switch';
import { TextField } from '@react-spectrum/s2/TextField';
import { Picker, PickerItem } from '@react-spectrum/s2/Picker';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import BugIcon from '@react-spectrum/s2/icons/Bug';
import { espJtag } from '../services/espJtag';

export const EspJtagCard: FC = () => {
  const [connected, setConnected] = useState(false);
  const [pairedDevices, setPairedDevices] = useState<USBDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [log, setLog] = useState<string[]>([]);
  
  // Command states
  const [clkTms, setClkTms] = useState(false);
  const [clkTdi, setClkTdi] = useState(false);
  const [clkCap, setClkCap] = useState(false);
  const [inLength, setInLength] = useState('64');
  const [divisor, setDivisor] = useState('0');
  const [repCount, setRepCount] = useState('1');
  const [ioTdi, setIoTdi] = useState(false);
  const [ioTms, setIoTms] = useState(false);
  const [ioTck, setIoTck] = useState(false);
  const [ioTrst, setIoTrst] = useState(false);
  const [ioSrst, setIoSrst] = useState(false);

  const addLog = (msg: string) => {
    setLog(prev => [...prev, msg]);
  };

  const attemptConnect = async (device?: USBDevice) => {
    addLog(device ? `Connecting to paired device ${device.productName}...` : 'Requesting new WebUSB JTAG device...');
    const success = await espJtag.connect(device);
    if (success) {
      setConnected(true);
      const dev = espJtag.getDevice();
      addLog(`Connected to ESP USB JTAG interface (USB ${dev?.usbVersionMajor}.${dev?.usbVersionMinor}).`);
      
      if (dev && dev.serialNumber) {
        localStorage.setItem('lastJtagSerial', dev.serialNumber);
        setSelectedDevice(dev.serialNumber);
      }
      const devices = await espJtag.getPairedDevices();
      setPairedDevices(devices);
    } else {
      addLog('Failed to connect or device not found.');
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchDevices = async () => {
      const devices = await espJtag.getPairedDevices();
      if (!mounted) return;
      setPairedDevices(devices);
      
      const lastSerial = localStorage.getItem('lastJtagSerial');
      const deviceToConnect = devices.find(d => d.serialNumber === lastSerial);

      if (deviceToConnect && !espJtag.isConnected()) {
        attemptConnect(deviceToConnect);
      } else if (devices.length > 0) {
        setSelectedDevice(devices[0].serialNumber || '');
      }
    };
    fetchDevices();
    
    const handleConnect = () => fetchDevices();
    const handleDisconnect = () => fetchDevices();
    navigator.usb?.addEventListener('connect', handleConnect);
    navigator.usb?.addEventListener('disconnect', handleDisconnect);
    return () => {
      mounted = false;
      navigator.usb?.removeEventListener('connect', handleConnect);
      navigator.usb?.removeEventListener('disconnect', handleDisconnect);
    };
  }, []);

  const handleConnectNew = () => attemptConnect();

  const handleConnectPaired = () => {
    const device = pairedDevices.find(d => d.serialNumber === selectedDevice);
    if (device) attemptConnect(device);
  };

  const handleDisconnect = async () => {
    await espJtag.disconnect();
    setConnected(false);
    addLog('Disconnected.');
  };

  // Commands
  const handleTestReset = async () => {
    if (!connected) return;
    try {
      addLog('Sending CMD_RST with srst=1');
      await espJtag.setReset(true);
      addLog('Sending CMD_RST with srst=0');
      await espJtag.setReset(false);
    } catch (e: any) {
      addLog('Error: ' + e.message);
    }
  };

  const handleFlush = async () => {
    if (!connected) return;
    try {
      addLog('Sending CMD_FLUSH');
      await espJtag.flush();
    } catch (e: any) {
      addLog('Error: ' + e.message);
    }
  };

  const handleClock = async () => {
    if (!connected) return;
    try {
      addLog(`Sending CMD_CLK (TMS=${clkTms}, TDI=${clkTdi}, CAP=${clkCap})`);
      await espJtag.clock(clkTms, clkTdi, clkCap);
    } catch (e: any) {
      addLog('Error: ' + e.message);
    }
  };

  const handleReadIn = async () => {
    if (!connected) return;
    try {
      const len = parseInt(inLength, 10);
      addLog(`Reading ${len} bytes from IN endpoint...`);
      const data = await espJtag.readIn(len);
      if (data) {
        const hex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ');
        addLog(`Read (${data.length} bytes): ${hex}`);
      } else {
        addLog('No data received or timeout.');
      }
    } catch (e: any) {
      addLog('Error: ' + e.message);
    }
  };

  const handleGetTdo = async () => {
    if (!connected) return;
    try {
      addLog('Sending VEND_JTAG_GETTDO...');
      const val = await espJtag.getTdo();
      addLog(`TDO state: ${val}`);
    } catch (e: any) {
      addLog('Error: ' + e.message);
    }
  };

  const handleSetDivisor = async () => {
    if (!connected) return;
    try {
      const div = parseInt(divisor, 10);
      addLog(`Sending VEND_JTAG_SETDIV (${div})...`);
      await espJtag.setDivisor(div);
    } catch (e: any) {
      addLog('Error: ' + e.message);
    }
  };

  const handleSendRepeat = async () => {
    if (!connected) return;
    try {
      const reps = parseInt(repCount, 10);
      addLog(`Sending CMD_REP (${reps})...`);
      await espJtag.sendRepeat(reps);
    } catch (e: any) {
      addLog('Error: ' + e.message);
    }
  };

  const handleSetIo = async () => {
    if (!connected) return;
    try {
      addLog(`Sending VEND_JTAG_SETIO (TDI=${ioTdi}, TMS=${ioTms}, TCK=${ioTck}, TRST=${ioTrst}, SRST=${ioSrst})...`);
      await espJtag.setIo(ioTdi, ioTms, ioTck, ioTrst, ioSrst);
    } catch (e: any) {
      addLog('Error: ' + e.message);
    }
  };

  const handleClearLog = () => setLog([]);

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
          <BugIcon />
          <Text>JTAG Debugger Console</Text>
        </h2>
        {connected ? (
          <Badge variant="positive" fillStyle="subtle">Connected via WebUSB</Badge>
        ) : (
          <Badge variant="neutral" fillStyle="subtle">Disconnected</Badge>
        )}
      </div>

      <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
        Advanced JTAG interface bypassing the virtual COM port. Communicate via raw USB OUT/IN endpoints using the Espressif JTAG protocol.
      </Text>

      <div className={style({ display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: 'gray-50', padding: 12, borderRadius: 'lg', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
        {!connected ? (
          <>
            <div className={style({ display: 'flex', gap: 12, alignItems: 'end' }) as any}>
              {pairedDevices.length > 0 && (
                <>
                  <Picker
                    label="Paired Devices"
                    value={selectedDevice}
                    onSelectionChange={(val) => setSelectedDevice(val as string)}
                    styles={style({ flex: 1 }) as any}
                  >
                    {pairedDevices.map((d, i) => (
                      <PickerItem key={i} id={d.serialNumber || `device-${i}`}>
                        {d.productName || `Device ${d.vendorId.toString(16)}:${d.productId.toString(16)}`} {d.serialNumber ? `(${d.serialNumber})` : ''}
                      </PickerItem>
                    ))}
                  </Picker>
                  <Button variant="secondary" onPress={handleConnectPaired}>Connect</Button>
                  <Text styles={style({ alignSelf: 'center', marginX: 8 })}>or</Text>
                </>
              )}
              <Button variant="accent" onPress={handleConnectNew}>Authorize New Device</Button>
            </div>
          </>
        ) : (
          <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) as any}>
            <Text styles={style({ font: 'body-sm', fontWeight: 'bold' })}>
              {espJtag.getDevice()?.productName} ({espJtag.getDevice()?.serialNumber})
            </Text>
            <Button variant="secondary" onPress={handleDisconnect}>Disconnect</Button>
          </div>
        )}
      </div>

      {connected && (
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 16 }) as any}>
          {/* Quick Actions */}
          <div className={style({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }) as any}>
            <Button variant="primary" onPress={handleTestReset}>Toggle Reset</Button>
            <Button variant="primary" onPress={handleFlush}>Flush IN</Button>
            <Button variant="primary" onPress={handleGetTdo}>Get TDO</Button>
            <Button variant="secondary" onPress={handleClearLog}>Clear Log</Button>
          </div>

          {/* Clock Command */}
          <div className={style({ display: 'flex', alignItems: 'end', gap: 12, backgroundColor: 'gray-50', padding: 12, borderRadius: 'lg', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
            <div className={style({ display: 'flex', gap: 16, flex: 1, flexWrap: 'wrap' }) as any}>
              <Switch isSelected={clkTms} onChange={setClkTms}><Text>TMS</Text></Switch>
              <Switch isSelected={clkTdi} onChange={setClkTdi}><Text>TDI</Text></Switch>
              <Switch isSelected={clkCap} onChange={setClkCap}><Text>CAP (Capture)</Text></Switch>
            </div>
            <Button variant="primary" onPress={handleClock}>Send CMD_CLK</Button>
          </div>

          {/* Repeat Command */}
          <div className={style({ display: 'flex', alignItems: 'end', gap: 12, backgroundColor: 'gray-50', padding: 12, borderRadius: 'lg', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
            <TextField 
              label="Repeat Count" 
              value={repCount} 
              onChange={setRepCount}
              styles={style({ width: 120 }) as any}
            />
            <Button variant="primary" onPress={handleSendRepeat}>Send CMD_REP</Button>
          </div>

          {/* Direct IO Control */}
          <div className={style({ display: 'flex', alignItems: 'end', gap: 12, backgroundColor: 'gray-50', padding: 12, borderRadius: 'lg', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
            <div className={style({ display: 'flex', gap: 16, flex: 1, flexWrap: 'wrap' }) as any}>
              <Switch isSelected={ioTdi} onChange={setIoTdi}><Text>TDI</Text></Switch>
              <Switch isSelected={ioTms} onChange={setIoTms}><Text>TMS</Text></Switch>
              <Switch isSelected={ioTck} onChange={setIoTck}><Text>TCK</Text></Switch>
              <Switch isSelected={ioTrst} onChange={setIoTrst}><Text>TRST</Text></Switch>
              <Switch isSelected={ioSrst} onChange={setIoSrst}><Text>SRST</Text></Switch>
            </div>
            <Button variant="primary" onPress={handleSetIo}>Send SETIO</Button>
          </div>

          {/* Read IN Endpoint */}
          <div className={style({ display: 'flex', alignItems: 'end', gap: 12, backgroundColor: 'gray-50', padding: 12, borderRadius: 'lg', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
            <TextField 
              label="Bytes to Read" 
              value={inLength} 
              onChange={setInLength}
              styles={style({ width: 120 }) as any}
            />
            <Button variant="primary" onPress={handleReadIn}>Read IN Endpoint</Button>
          </div>

          {/* Config */}
          <div className={style({ display: 'flex', alignItems: 'end', gap: 12, backgroundColor: 'gray-50', padding: 12, borderRadius: 'lg', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
            <TextField 
              label="Clock Divisor" 
              value={divisor} 
              onChange={setDivisor}
              styles={style({ width: 120 }) as any}
            />
            <Button variant="primary" onPress={handleSetDivisor}>Set Divisor</Button>
          </div>
        </div>
      )}

      <div className={style({
        backgroundColor: 'gray-900',
        color: 'gray-50',
        padding: 12,
        borderRadius: 'lg',
        fontFamily: 'code',
        font: 'detail-sm',
        height: 200,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }) as any}>
        {log.length === 0 && <Text styles={style({ color: 'gray-500' })}>JTAG command log will appear here...</Text>}
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
};