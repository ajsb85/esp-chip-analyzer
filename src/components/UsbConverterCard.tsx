// @ts-nocheck
import { useEffect, useState, useCallback } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import { usbAnalyzer } from '../services/usbAnalyzer';
import type { UsbConverterDetails } from '../services/usbAnalyzer';
import { Badge } from '@react-spectrum/s2/Badge';
import { InlineAlert, Heading, Content } from '@react-spectrum/s2/InlineAlert';
import { Button } from '@react-spectrum/s2/Button';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { serialManager } from '../services/serialManager';
import { ch340bManager } from '../services/ch340bManager';
import { TextField } from '@react-spectrum/s2/TextField';
import { Picker, PickerItem } from '@react-spectrum/s2/Picker';
import { Switch } from '@react-spectrum/s2/Switch';

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
  gap: 4,
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

// Segment Pill control styles
const pillContainerStyles = style({
  display: 'flex',
  gap: 4,
  backgroundColor: 'gray-100',
  padding: 4,
  borderRadius: 'lg',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'gray-200',
});

const pillButtonStyles = style({
  font: 'body-xs',
  fontWeight: 'bold',
  paddingY: 8,
  paddingX: 12,
  borderRadius: 'default',
  borderStyle: 'none',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  color: 'neutral-subdued',
  transition: 'colors',
  flexGrow: 1,
  textAlign: 'center',
});

const activePillButtonStyles = style({
  backgroundColor: 'layer-1',
  color: 'neutral',
  boxShadow: 'none',
});

const codeBoxStyles = style({
  fontFamily: 'code',
  font: 'body-xs',
  padding: 12,
  backgroundColor: 'gray-50',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'gray-200',
  borderRadius: 'default',
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
  color: 'neutral',
  maxHeight: 200,
  overflowY: 'auto',
});

const activeWiringButtonStyles = style({
  font: 'body-2xs',
  fontWeight: 'bold',
  paddingY: 4,
  paddingX: 8,
  borderRadius: 'default',
  borderStyle: 'solid',
  borderWidth: 1,
  cursor: 'pointer',
  borderColor: {
    default: 'blue-500',
    _dark: 'blue-600',
  },
  backgroundColor: {
    default: 'blue-subtle',
    _dark: 'blue-900',
  },
  color: {
    default: 'blue-900',
    _dark: 'blue-300',
  },
});

const inactiveWiringButtonStyles = style({
  font: 'body-2xs',
  fontWeight: 'bold',
  paddingY: 4,
  paddingX: 8,
  borderRadius: 'default',
  borderStyle: 'solid',
  borderWidth: 1,
  cursor: 'pointer',
  borderColor: 'gray-200',
  backgroundColor: 'transparent',
  color: 'neutral-subdued',
});

interface CH340VariantDetail {
  name: string;
  package: string;
  clock: string;
  pins: number;
  eeprom: string;
  flowControl: string;
  notes: string;
  v5Wiring: string;
  v33Wiring: string;
}

const variantsList: CH340VariantDetail[] = [
  {
    name: 'CH340G',
    package: 'SOP-16',
    clock: 'External (12MHz oscillator)',
    pins: 16,
    eeprom: 'No',
    flowControl: 'Full Modem (RTS, CTS, DTR, DSR, DCD, RI)',
    notes: 'The classic, most common variant. Needs external 12MHz crystal + 2x 22pF caps.',
    v5Wiring: 'Connect VCC to 5V power supply. Place a 0.1μF decoupling capacitor between V3 and GND. Wire XI/XO to 12MHz crystal.',
    v33Wiring: 'Connect both VCC and V3 directly to the 3.3V supply rail. Wire XI/XO to 12MHz crystal.'
  },
  {
    name: 'CH340C',
    package: 'SOP-16',
    clock: 'Integrated (no crystal needed)',
    pins: 16,
    eeprom: 'No',
    flowControl: 'Full Modem (RTS, CTS, DTR, DSR, DCD, RI)',
    notes: 'Pin-compatible upgrade to CH340G. Eliminates external crystal clock components.',
    v5Wiring: 'Connect VCC to 5V power supply. Place a 0.1μF decoupling capacitor between V3 and GND.',
    v33Wiring: 'Connect both VCC and V3 directly to the 3.3V supply rail.'
  },
  {
    name: 'CH340B',
    package: 'SOP-16',
    clock: 'Integrated (no crystal needed)',
    pins: 16,
    eeprom: 'Yes (38-byte configuration logic)',
    flowControl: 'Full Modem (RTS, CTS, DTR, DSR, DCD, RI)',
    notes: 'Premium variant. Supports software EEPROM customization (VID/PID/Serial) and has physical RESET# pin.',
    v5Wiring: 'Connect VCC to 5V power supply. Place a 0.1μF decoupling capacitor between V3 and GND.',
    v33Wiring: 'Connect both VCC and V3 directly to the 3.3V supply rail.'
  },
  {
    name: 'CH340N',
    package: 'SOP-8',
    clock: 'Integrated (no crystal needed)',
    pins: 8,
    eeprom: 'No',
    flowControl: 'Reduced (RTS only / CTS shared)',
    notes: 'Ultra-small outline. Ideal for custom compact PCBs with limited routing area.',
    v5Wiring: 'Connect VCC to 5V power supply. Place a 0.1μF decoupling capacitor between V3 and GND.',
    v33Wiring: 'Connect both VCC and V3 directly to the 3.3V supply rail.'
  },
  {
    name: 'CH340K',
    package: 'ESSOP-10',
    clock: 'Integrated (no crystal needed)',
    pins: 10,
    eeprom: 'No',
    flowControl: 'Reduced (RTS, CTS, DTR)',
    notes: 'Includes integrated back-feed protection diode preventing current leaking from TXD to unpowered hosts.',
    v5Wiring: 'Connect VCC to 5V power supply. Place a 0.1μF decoupling capacitor between V3 and GND.',
    v33Wiring: 'Connect both VCC and V3 directly to the 3.3V supply rail.'
  },
  {
    name: 'CH340E',
    package: 'MSOP-10',
    clock: 'Integrated (no crystal needed)',
    pins: 10,
    eeprom: 'No',
    flowControl: 'Reduced (RTS, CTS, DTR)',
    notes: 'Popular micro-size variant. Common on tiny ESP32/ESP8266 breakout modules (e.g. ESP32-C3 SuperMini).',
    v5Wiring: 'Connect VCC to 5V power supply. Place a 0.1μF decoupling capacitor between V3 and GND.',
    v33Wiring: 'Connect both VCC and V3 directly to the 3.3V supply rail.'
  },
  {
    name: 'CH340T',
    package: 'SSOP-20',
    clock: 'External (12MHz oscillator)',
    pins: 20,
    eeprom: 'No',
    flowControl: 'Full Modem + SSOP-20 breakout',
    notes: 'Supports 9-bit framing formats for proprietary or multi-drop systems.',
    v5Wiring: 'Connect VCC to 5V power supply. Place a 0.1μF decoupling capacitor between V3 and GND. Wire XI/XO to 12MHz crystal.',
    v33Wiring: 'Connect both VCC and V3 directly to the 3.3V supply rail. Wire XI/XO to 12MHz crystal.'
  },
  {
    name: 'CH340X',
    package: 'MSOP-10',
    clock: 'Integrated (no crystal needed)',
    pins: 10,
    eeprom: 'No',
    flowControl: 'Reduced (RTS, CTS, DTR)',
    notes: 'Improved E-variant. Adds full 5V logic IO level tolerance when powered under 3.3V operation.',
    v5Wiring: 'Connect VCC to 5V power supply. Place a 0.1μF decoupling capacitor between V3 and GND.',
    v33Wiring: 'Connect both VCC and V3 directly to the 3.3V supply rail.'
  },
  {
    name: 'CH341A',
    package: 'SOP-28',
    clock: 'External (12MHz oscillator)',
    pins: 28,
    eeprom: 'Yes (Requires external 24CXX EEPROM)',
    flowControl: 'Full Modem / Multi-interface (SPI, I2C, Parallel, UART)',
    notes: 'Multi-function chip. Often used as an standalone BIOS flasher or high-end UART bridge.',
    v5Wiring: 'Connect VCC to 5V power supply. Place a 0.1μF decoupling capacitor between V3 and GND. Wire XI/XO to 12MHz crystal.',
    v33Wiring: 'Connect both VCC and V3 directly to the 3.3V supply rail. Wire XI/XO to 12MHz crystal.'
  }
];

export const UsbConverterCard: FC<UsbConverterCardProps> = ({ serialState }) => {
  const [details, setDetails] = useState<UsbConverterDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [usbDevicePaired, setUsbDevicePaired] = useState(false);
  
  // Card tabs: diagnostics (contains EEPROM), toolchain, reference
  const [cardTab, setCardTab] = useState<'diagnostics' | 'toolchain' | 'reference'>('diagnostics');

  // WCH CH34x programming utility states
  interface CH34xFormState {
    chipType: 'CH340' | 'CH343';
    sig: number;
    mode: number;
    cfg: number;
    wp: number;
    vid: string;
    pid: string;
    bcd?: string;
    power: string;
    attributes?: number;
    serialNumber: string;
    productString: string;
    manufacturerString?: string;
    rawBytes: Uint8Array;
  }
  const [ch340bConfig, setCh340bConfig] = useState<CH34xFormState | null>(null);
  const [ch34xProgress, setCh34xProgress] = useState<{ current: number; total: number } | null>(null);
  const [ch340bScanning, setCh340bScanning] = useState(false);
  const [ch340bWriting, setCh340bWriting] = useState(false);
  const [ch340bMessage, setCh340bMessage] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);

  // Toolchain Generator states
  const [toolchainEnv, setToolchainEnv] = useState<'platformio' | 'pyserial' | 'arduinocli'>('platformio');
  const [toolchainBaud, setToolchainBaud] = useState<number>(115200);
  const [toolchainPort, setToolchainPort] = useState<string>('/dev/ttyUSB0');
  const [copied, setCopied] = useState(false);

  // Variant selector states
  const [selectedVariant, setSelectedVariant] = useState<string>('CH340G');
  const [wiringPowerMode, setWiringPowerMode] = useState<'5v' | '3.3v'>('5v');

  const fetchDetails = useCallback(async () => {
    if (!serialState.port) {
      setTimeout(() => {
        setDetails(null);
        setUsbDevicePaired(false);
      }, 0);
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

      // Guess platform port format based on details
      if (typeof window !== 'undefined') {
        const isWindows = navigator.userAgent.toLowerCase().includes('win');
        setToolchainPort(isWindows ? 'COM3' : '/dev/ttyUSB0');
      }
    }
  }, [serialState.port]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleRequestWebUsb = async () => {
    const granted = await usbAnalyzer.requestUsbAccess();
    if (granted) {
      await fetchDetails();
    }
  };

  const handleReadCh340bConfig = async () => {
    setCh340bScanning(true);
    setCh340bMessage(null);
    setCh34xProgress(null);
    try {
      const config = await serialManager.runTemporary300BaudAction(async (port) => {
        return await ch340bManager.readConfig(port, (current, total) => {
          setCh34xProgress({ current, total });
        });
      });
      setCh340bConfig({
        chipType: config.chipType,
        sig: config.sig,
        mode: config.mode,
        cfg: config.cfg,
        wp: config.wp,
        vid: `0x${config.vid.toString(16).toUpperCase().padStart(4, '0')}`,
        pid: `0x${config.pid.toString(16).toUpperCase().padStart(4, '0')}`,
        bcd: config.bcd !== undefined ? `0x${config.bcd.toString(16).toUpperCase().padStart(4, '0')}` : undefined,
        power: config.power.toString(),
        attributes: config.attributes,
        serialNumber: config.serialNumber,
        productString: config.productString,
        manufacturerString: config.manufacturerString,
        rawBytes: config.rawBytes
      });
      setCh340bMessage({ type: 'success', text: `WCH ${config.chipType} EEPROM configuration loaded successfully!` });
    } catch (err: any) {
      console.error('[WCH Config] Read error:', err);
      setCh340bMessage({ type: 'error', text: `Failed to read EEPROM: ${err.message || err}` });
    } finally {
      setCh340bScanning(false);
      setCh34xProgress(null);
    }
  };

  const handleWriteCh340bConfig = async () => {
    if (!ch340bConfig) return;
    
    // Hex validation
    const hexPattern = /^(0x)?[0-9A-Fa-f]{4}$/;
    if (!hexPattern.test(ch340bConfig.vid) || !hexPattern.test(ch340bConfig.pid)) {
      setCh340bMessage({ type: 'error', text: 'Invalid hexadecimal structure for VID or PID (must be like 0x1A86 or 1A86)' });
      return;
    }
    if (ch340bConfig.chipType === 'CH343' && ch340bConfig.bcd && !hexPattern.test(ch340bConfig.bcd)) {
      setCh340bMessage({ type: 'error', text: 'Invalid hexadecimal structure for BCD version (must be like 0x0100 or 0100)' });
      return;
    }

    setCh340bWriting(true);
    setCh340bMessage(null);
    setCh34xProgress(null);
    try {
      const vidNum = parseInt(ch340bConfig.vid, 16);
      const pidNum = parseInt(ch340bConfig.pid, 16);
      const powerNum = parseInt(ch340bConfig.power, 10);
      const bcdNum = ch340bConfig.bcd ? parseInt(ch340bConfig.bcd, 16) : undefined;

      if (isNaN(vidNum) || isNaN(pidNum) || isNaN(powerNum)) {
        throw new Error('Invalid numeric values for VID, PID, or Max Power.');
      }

      await serialManager.runTemporary300BaudAction(async (port) => {
        await ch340bManager.writeConfig(port, {
          chipType: ch340bConfig.chipType,
          sig: ch340bConfig.sig,
          mode: ch340bConfig.mode,
          cfg: ch340bConfig.cfg,
          wp: ch340bConfig.wp,
          vid: vidNum,
          pid: pidNum,
          power: powerNum,
          bcd: bcdNum,
          attributes: ch340bConfig.attributes,
          serialNumber: ch340bConfig.serialNumber,
          productString: ch340bConfig.productString,
          manufacturerString: ch340bConfig.manufacturerString,
        }, (current, total) => {
          setCh34xProgress({ current, total });
        });
      });
      setCh340bMessage({ type: 'success', text: `WCH ${ch340bConfig.chipType} EEPROM written successfully! Re-plug converter to apply.` });
      await fetchDetails();
    } catch (err: any) {
      console.error('[WCH Config] Write error:', err);
      setCh340bMessage({ type: 'error', text: `Failed to write EEPROM: ${err.message || err}` });
    } finally {
      setCh340bWriting(false);
      setCh34xProgress(null);
    }
  };

  // Toolchain snippet generator helper
  const getToolchainSnippet = (): string => {
    const port = toolchainPort.trim() || '/dev/ttyUSB0';
    const baud = toolchainBaud;

    switch (toolchainEnv) {
      case 'platformio':
        return `[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
upload_port = ${port}
upload_speed = ${baud}
monitor_port = ${port}
monitor_speed = ${baud}
monitor_filters = esp32_exception_decoder, time, colorize`;

      case 'pyserial':
        return `import serial
import time

# Initialize serial connection for CH340 Bridge
ser = serial.Serial(
    port='${port}',
    baudrate=${baud},
    bytesize=serial.EIGHTBITS,
    parity=serial.PARITY_NONE,
    stopbits=serial.STOPBITS_ONE,
    timeout=1.0
)

print(f"Connected to CH340 adapter on {ser.name} at {ser.baudrate} bps.")

try:
    while True:
        if ser.in_waiting > 0:
            line = ser.readline()
            print(line.decode('utf-8', errors='ignore'), end='')
        time.sleep(0.01)
except KeyboardInterrupt:
    print("\\nTerminating connection.")
finally:
    ser.close()`;

      case 'arduinocli':
        return `# Arduino CLI compile & upload commands over CH340
arduino-cli compile --fqbn espressif:esp32:esp32dev sketch_name
arduino-cli upload -p ${port} --fqbn espressif:esp32:esp32dev sketch_name

# Open console execution monitor
arduino-cli monitor -p ${port} -c baudrate=${baud}`;
    }
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(getToolchainSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!serialState.isConnected || !details) {
    return (
      <div className={cardStyles as any}>
        <h2 className={titleStyles as any}>
          <PluginIcon /> USB Bridge Diagnostics
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

  const activeVariant = variantsList.find(v => v.name === selectedVariant) || variantsList[0];

  return (
    <div className={cardStyles as any}>
      {/* Header Info */}
      <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) as any}>
        <h2 className={titleStyles as any}>
          <PluginIcon /> USB Bridge Analyzer
        </h2>
        <Badge variant={getChipBadgeVariant()} fillStyle="subtle">
          {details.type} Chip
        </Badge>
      </div>

      {/* Pill switcher for sub-tabs */}
      <div className={pillContainerStyles as any}>
        <button 
          onClick={() => setCardTab('diagnostics')}
          className={`${pillButtonStyles} ${cardTab === 'diagnostics' ? activePillButtonStyles : ''}`}
        >
          <DataSettingsIcon /> Diagnostics
        </button>
        <button 
          onClick={() => setCardTab('toolchain')}
          className={`${pillButtonStyles} ${cardTab === 'toolchain' ? activePillButtonStyles : ''}`}
        >
          <ToolsIcon /> Toolchain
        </button>
        <button 
          onClick={() => setCardTab('reference')}
          className={`${pillButtonStyles} ${cardTab === 'reference' ? activePillButtonStyles : ''}`}
        >
          <FileTextIcon /> Models
        </button>
      </div>

      {loading ? (
        <div className={style({ textAlign: 'center', color: 'neutral-subdued', padding: 24 }) as any}>
          Querying USB interface descriptors...
        </div>
      ) : (
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 12 }) as any}>
          
          {/* TAB 1: DIAGNOSTICS & EEPROM UTILITY */}
          {cardTab === 'diagnostics' && (
            <>
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
              {details.type !== 'CH340' && !usbDevicePaired && (
                <InlineAlert variant="informative">
                  <Heading>Advanced Diagnostics Available!</Heading>
                  <Content>
                    Pair this bridge via WebUSB to read EEPROM registers, hardware modes, and latch details directly.
                    <Button 
                      onPress={handleRequestWebUsb}
                      variant="primary"
                      styles={style({ width: 'full', marginTop: 8 }) as any}
                    >
                      Request WebUSB Permission
                    </Button>
                  </Content>
                </InlineAlert>
              )}

              {/* CH340 Specific EEPROM Utility */}
              {details.type === 'CH340' && (
                <div className={style({
                  marginTop: 8,
                  padding: 16,
                  backgroundColor: 'layer-2',
                  borderRadius: 'lg',
                  borderStyle: 'solid',
                  borderWidth: 1,
                  borderColor: 'gray-200',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }) as any}>
                  <div className={style({ display: 'flex', flexDirection: 'column', gap: 4 }) as any}>
                    <span className={style({ font: 'heading-2xs', fontWeight: 'bold', color: 'neutral' }) as any}>
                      <PluginGearIcon /> WCH CH34x EEPROM Configurator
                    </span>
                    <span className={style({ font: 'body-xs', color: 'neutral-subdued' }) as any}>
                      Query and write hardware descriptors (VID, PID, Serial, Product name, Manufacturer) using 300-baud command structures.
                    </span>
                  </div>

                  {ch340bMessage && (
                    <InlineAlert variant={ch340bMessage.type === 'error' ? 'negative' : ch340bMessage.type === 'success' ? 'positive' : 'informative'}>
                      <Heading>{ch340bMessage.type === 'error' ? 'Operation Failed' : 'Success'}</Heading>
                      <Content>{ch340bMessage.text}</Content>
                    </InlineAlert>
                  )}

                  {ch34xProgress && (
                    <div className={style({ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }) as any}>
                      <div className={style({ display: 'flex', justifyContent: 'space-between', font: 'body-2xs', color: 'neutral-subdued' }) as any}>
                        <span>{ch340bScanning ? 'Scanning configuration...' : 'Writing configuration...'}</span>
                        <span>{ch34xProgress.current} / {ch34xProgress.total} bytes ({Math.round((ch34xProgress.current / ch34xProgress.total) * 100)}%)</span>
                      </div>
                      <div className={style({ width: 'full', backgroundColor: 'gray-200', borderRadius: 'full', height: 8, overflow: 'hidden' }) as any}>
                        <div 
                          className={style({ backgroundColor: 'blue-600', height: 'full' }) as any} 
                          style={{ width: `${(ch34xProgress.current / ch34xProgress.total) * 100}%`, transition: 'width 0.1s ease-out' }}
                        />
                      </div>
                    </div>
                  )}

                  {!ch340bConfig ? (
                    <Button
                      onPress={handleReadCh340bConfig}
                      variant="primary"
                      isDisabled={ch340bScanning}
                      styles={style({ width: 'full' }) as any}
                    >
                      {ch340bScanning ? 'Scanning EEPROM registers...' : 'Scan CH34x EEPROM Config'}
                    </Button>
                  ) : (
                    <div className={style({ display: 'flex', flexDirection: 'column', gap: 12 }) as any}>
                      <div className={style({
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12
                      }) as any}>
                        <TextField
                          label="Vendor ID (VID)"
                          value={ch340bConfig.vid}
                          onChange={(v) => setCh340bConfig(prev => prev ? { ...prev, vid: v } : null)}
                          isDisabled={ch340bWriting}
                        />
                        <TextField
                          label="Product ID (PID)"
                          value={ch340bConfig.pid}
                          onChange={(v) => setCh340bConfig(prev => prev ? { ...prev, pid: v } : null)}
                          isDisabled={ch340bWriting}
                        />
                      </div>

                      {ch340bConfig.chipType === 'CH343' ? (
                        <>
                          <div className={style({
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 12
                          }) as any}>
                            <TextField
                              label="Device Release (BCD)"
                              value={ch340bConfig.bcd || '0x0100'}
                              onChange={(v) => setCh340bConfig(prev => prev ? { ...prev, bcd: v } : null)}
                              isDisabled={ch340bWriting}
                            />
                            <TextField
                              label="Max Bus Power (mA)"
                              value={ch340bConfig.power}
                              onChange={(v) => setCh340bConfig(prev => prev ? { ...prev, power: v } : null)}
                              isDisabled={ch340bWriting}
                            />
                          </div>

                          <div className={style({ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }) as any}>
                            <Switch
                              isSelected={(ch340bConfig.cfg & (1 << 4)) !== 0}
                              onChange={(checked) => {
                                const mask = 1 << 4;
                                setCh340bConfig(prev => prev ? { ...prev, cfg: checked ? (prev.cfg | mask) : (prev.cfg & ~mask) } : null);
                              }}
                              isDisabled={ch340bWriting}
                            >
                              CDC Driver Mode (System CDC Driver)
                            </Switch>
                            
                            <Switch
                              isSelected={(ch340bConfig.cfg & (1 << 3)) !== 0}
                              onChange={(checked) => {
                                const mask = 1 << 3;
                                setCh340bConfig(prev => prev ? { ...prev, cfg: checked ? (prev.cfg | mask) : (prev.cfg & ~mask) } : null);
                              }}
                              isDisabled={ch340bWriting}
                            >
                              Internal EEPROM Write Protect Lock
                            </Switch>

                            <Switch
                              isSelected={((ch340bConfig.attributes !== undefined ? ch340bConfig.attributes : 0x80) & (1 << 6)) !== 0}
                              onChange={(checked) => {
                                const mask = 1 << 6;
                                setCh340bConfig(prev => {
                                  if (!prev) return null;
                                  const attrs = prev.attributes !== undefined ? prev.attributes : 0x80;
                                  return { ...prev, attributes: checked ? (attrs | mask) : (attrs & ~mask) };
                                });
                              }}
                              isDisabled={ch340bWriting}
                            >
                              Self-Powered Mode (vs Bus-Powered)
                            </Switch>

                            <Switch
                              isSelected={((ch340bConfig.attributes !== undefined ? ch340bConfig.attributes : 0x80) & (1 << 5)) !== 0}
                              onChange={(checked) => {
                                const mask = 1 << 5;
                                setCh340bConfig(prev => {
                                  if (!prev) return null;
                                  const attrs = prev.attributes !== undefined ? prev.attributes : 0x80;
                                  return { ...prev, attributes: checked ? (attrs | mask) : (attrs & ~mask) };
                                });
                              }}
                              isDisabled={ch340bWriting}
                            >
                              Remote Wakeup Support Enable
                            </Switch>
                          </div>

                          <div className={style({ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }) as any}>
                            <span className={style({ font: 'body-xs', fontWeight: 'bold', color: 'neutral' }) as any}>USB Descriptors Enablement:</span>
                            <div className={style({ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }) as any}>
                              <Switch
                                isSelected={(ch340bConfig.cfg & (1 << 5)) !== 0}
                                onChange={(checked) => {
                                  const mask = 1 << 5;
                                  setCh340bConfig(prev => prev ? { ...prev, cfg: checked ? (prev.cfg | mask) : (prev.cfg & ~mask) } : null);
                                }}
                                isDisabled={ch340bWriting}
                              >
                                Manufacturer
                              </Switch>
                              <Switch
                                isSelected={(ch340bConfig.cfg & (1 << 6)) !== 0}
                                onChange={(checked) => {
                                  const mask = 1 << 6;
                                  setCh340bConfig(prev => prev ? { ...prev, cfg: checked ? (prev.cfg | mask) : (prev.cfg & ~mask) } : null);
                                }}
                                isDisabled={ch340bWriting}
                              >
                                Product
                              </Switch>
                              <Switch
                                isSelected={(ch340bConfig.cfg & (1 << 7)) !== 0}
                                onChange={(checked) => {
                                  const mask = 1 << 7;
                                  setCh340bConfig(prev => prev ? { ...prev, cfg: checked ? (prev.cfg | mask) : (prev.cfg & ~mask) } : null);
                                }}
                                isDisabled={ch340bWriting}
                              >
                                Serial
                              </Switch>
                            </div>
                          </div>

                          <TextField
                            label="Manufacturer String (max 19 chars)"
                            value={ch340bConfig.manufacturerString || ''}
                            onChange={(v) => setCh340bConfig(prev => prev ? { ...prev, manufacturerString: v.slice(0, 19) } : null)}
                            isDisabled={ch340bWriting}
                          />
                          <TextField
                            label="Product String (max 19 chars)"
                            value={ch340bConfig.productString}
                            onChange={(v) => setCh340bConfig(prev => prev ? { ...prev, productString: v.slice(0, 19) } : null)}
                            isDisabled={ch340bWriting}
                          />
                          <TextField
                            label="Serial Number String (max 11 chars)"
                            value={ch340bConfig.serialNumber}
                            onChange={(v) => setCh340bConfig(prev => prev ? { ...prev, serialNumber: v.slice(0, 11) } : null)}
                            isDisabled={ch340bWriting}
                          />
                        </>
                      ) : (
                        <>
                          <TextField
                            label="Max Bus Power (mA)"
                            value={ch340bConfig.power}
                            onChange={(v) => setCh340bConfig(prev => prev ? { ...prev, power: v } : null)}
                            isDisabled={ch340bWriting}
                          />
                          <Switch
                            isSelected={(ch340bConfig.cfg & (1 << 5)) === 0}
                            onChange={(checked) => {
                              const mask = 1 << 5;
                              setCh340bConfig(prev => prev ? { ...prev, cfg: checked ? (prev.cfg & ~mask) : (prev.cfg | mask) } : null);
                            }}
                            isDisabled={ch340bWriting}
                          >
                            Enable Serial Number String (USB Bus)
                          </Switch>
                          <TextField
                            label="Serial Number String (ASCII, max 8 chars)"
                            value={ch340bConfig.serialNumber}
                            onChange={(v) => setCh340bConfig(prev => prev ? { ...prev, serialNumber: v.slice(0, 8) } : null)}
                            isDisabled={ch340bWriting}
                          />
                          <TextField
                            label="Product Name String (max 18 chars)"
                            value={ch340bConfig.productString}
                            onChange={(v) => setCh340bConfig(prev => prev ? { ...prev, productString: v.slice(0, 18) } : null)}
                            isDisabled={ch340bWriting}
                          />
                        </>
                      )}

                      {/* Raw Hex Dump registry table */}
                      {ch340bConfig.rawBytes && (
                        <div className={style({
                          marginTop: 8,
                          padding: 12,
                          backgroundColor: 'gray-50',
                          borderRadius: 'default',
                          borderStyle: 'solid',
                          borderWidth: 1,
                          borderColor: 'gray-200',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8
                        }) as any}>
                          <span className={style({ font: 'body-2xs', fontWeight: 'bold', color: 'neutral', display: 'block' }) as any}>
                            <SaveFloppyIcon /> Raw EEPROM Register Hex Dump ({ch340bConfig.chipType})
                          </span>
                          <pre className={codeBoxStyles as any}>
                            {(() => {
                              const lines: string[] = [];
                              const bytesPerLine = 16;
                              for (let i = 0; i < ch340bConfig.rawBytes.length; i += bytesPerLine) {
                                const chunk = ch340bConfig.rawBytes.slice(i, i + bytesPerLine);
                                const hex = Array.from(chunk).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
                                const addr = i.toString(16).toUpperCase().padStart(2, '0');
                                lines.push(`0x${addr}: ${hex}`);
                              }
                              return lines.join('\n');
                            })()}
                          </pre>
                        </div>
                      )}

                      <div className={style({ display: 'flex', gap: 8, marginTop: 8 }) as any}>
                        <Button
                          onPress={handleWriteCh340bConfig}
                          variant="accent"
                          isDisabled={ch340bWriting}
                        >
                          {ch340bWriting ? 'Writing EEPROM...' : 'Flash to EEPROM'}
                        </Button>
                        <Button
                          onPress={handleReadCh340bConfig}
                          variant="secondary"
                          isDisabled={ch340bWriting}
                        >
                          Reload
                        </Button>
                        <Button
                          onPress={() => setCh340bConfig(null)}
                          variant="secondary"
                          isDisabled={ch340bWriting}
                        >
                          Cancel
                        </Button>
                      </div>
                      
                      <span className={style({ font: 'body-2xs', color: 'neutral-subdued', fontStyle: 'italic', marginTop: 4 }) as any}>
                        <AlertTriangleIcon /> Note: Register writing requires physical {ch340bConfig.chipType} silicon containing modifiable configuration EEPROM memory.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 2: TOOLCHAIN CONFIGURATION GENERATOR */}
          {cardTab === 'toolchain' && (
            <div className={style({ display: 'flex', flexDirection: 'column', gap: 16 }) as any}>
              <div className={style({ display: 'flex', flexDirection: 'column', gap: 4 }) as any}>
                <span className={style({ font: 'heading-2xs', fontWeight: 'bold', color: 'neutral' }) as any}>
                  <ToolsIcon /> Toolchain Parameters Configuration
                </span>
                <span className={style({ font: 'body-xs', color: 'neutral-subdued' }) as any}>
                  Generate precise target build environments and script setups for your active connection parameters.
                </span>
              </div>

              <Picker 
                label="Target Environment" 
                value={toolchainEnv}
                onSelectionChange={(val) => setToolchainEnv(val as any)}
                styles={style({ width: '100%' }) as any}
              >
                <PickerItem id="platformio">PlatformIO (platformio.ini)</PickerItem>
                <PickerItem id="pyserial">Python (pyserial script)</PickerItem>
                <PickerItem id="arduinocli">Arduino CLI</PickerItem>
              </Picker>

              <div className={style({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }) as any}>
                <TextField 
                  label="Upload / Serial Port"
                  value={toolchainPort}
                  onChange={setToolchainPort}
                />
                <Picker 
                  label="Monitor Speed" 
                  value={toolchainBaud.toString()}
                  onSelectionChange={(val) => setToolchainBaud(Number(val))}
                  styles={style({ width: '100%' }) as any}
                >
                  <PickerItem id="9600">9,600 bps</PickerItem>
                  <PickerItem id="115200">115,200 bps</PickerItem>
                  <PickerItem id="230400">230,400 bps</PickerItem>
                  <PickerItem id="460800">460,800 bps</PickerItem>
                  <PickerItem id="921600">921,600 bps</PickerItem>
                  <PickerItem id="2000000">2,000,000 bps</PickerItem>
                </Picker>
              </div>

              {/* Generated Code Area */}
              <div className={style({ display: 'flex', flexDirection: 'column', gap: 8 }) as any}>
                <span className={style({ font: 'body-xs', fontWeight: 'bold', color: 'neutral' }) as any}>
                  Generated snippet:
                </span>
                <pre className={codeBoxStyles as any}>
                  {getToolchainSnippet()}
                </pre>
                <Button 
                  onPress={handleCopySnippet}
                  variant={copied ? "accent" : "secondary"}
                  styles={style({ width: 'full', marginTop: 4 }) as any}
                >
                  {copied ? <><CheckIcon /> Copied to Clipboard!</> : '<FileTextIcon /> Copy Config Snippet'}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: HARDWARE COMPARISON MATRIX & WIRING REFERENCE */}
          {cardTab === 'reference' && (
            <div className={style({ display: 'flex', flexDirection: 'column', gap: 16 }) as any}>
              <div className={style({ display: 'flex', flexDirection: 'column', gap: 4 }) as any}>
                <span className={style({ font: 'heading-2xs', fontWeight: 'bold', color: 'neutral' }) as any}>
                  <FileTextIcon /> WCH CH340/CH341 Silicon Database
                </span>
                <span className={style({ font: 'body-xs', color: 'neutral-subdued' }) as any}>
                  Select a chip variant to view clock architectures, modem configurations, and pin supply wiring layout guidelines.
                </span>
              </div>

              <Picker 
                label="Select Chip Variant" 
                value={selectedVariant}
                onSelectionChange={(val) => setSelectedVariant(val as string)}
                styles={style({ width: '100%' }) as any}
              >
                {variantsList.map(v => (
                  <PickerItem key={v.name} id={v.name}>{v.name}</PickerItem>
                ))}
              </Picker>

              {/* Selected model details card */}
              <div className={style({
                padding: 16,
                backgroundColor: 'gray-50',
                borderRadius: 'lg',
                borderStyle: 'solid',
                borderWidth: 1,
                borderColor: 'gray-200',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }) as any}>
                <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) as any}>
                  <span className={style({ font: 'body-sm', fontWeight: 'bold', color: 'neutral' }) as any}>
                    {activeVariant.name} Profile
                  </span>
                  <Badge variant="informative">{activeVariant.package} package</Badge>
                </div>

                <div className={style({ display: 'flex', flexDirection: 'column', gap: 4, font: 'body-xs', color: 'neutral' }) as any}>
                  <div><strong>Integrated Clock:</strong> {activeVariant.clock}</div>
                  <div><strong>Pin Count:</strong> {activeVariant.pins} pins</div>
                  <div><strong>EEPROM support:</strong> {activeVariant.eeprom}</div>
                  <div><strong>Modem Lines:</strong> {activeVariant.flowControl}</div>
                  <div className={style({ fontStyle: 'italic', marginTop: 4, color: 'neutral-subdued' }) as any}>
                    {activeVariant.notes}
                  </div>
                </div>

                <div className={style({ borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: 'gray-200', paddingTop: 8 }) as any}>
                  <span className={style({ font: 'body-xs', fontWeight: 'bold', color: 'neutral', display: 'block', marginBottom: 8 }) as any}>
                    <DataUploadIcon /> Pinout Power Supply Configuration:
                  </span>
                  
                  <div className={style({ display: 'flex', gap: 8, marginBottom: 8 }) as any}>
                    <button 
                      onClick={() => setWiringPowerMode('5v')}
                      className={(wiringPowerMode === '5v' ? activeWiringButtonStyles : inactiveWiringButtonStyles) as any}
                    >
                      5V Operation
                    </button>
                    <button 
                      onClick={() => setWiringPowerMode('3.3v')}
                      className={(wiringPowerMode === '3.3v' ? activeWiringButtonStyles : inactiveWiringButtonStyles) as any}
                    >
                      3.3V Operation
                    </button>
                  </div>

                  <span className={style({ font: 'body-xs', color: 'neutral-subdued' }) as any}>
                    {wiringPowerMode === '5v' ? activeVariant.v5Wiring : activeVariant.v33Wiring}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


