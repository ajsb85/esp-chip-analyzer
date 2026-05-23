import { useState } from 'react';
import type { FC } from 'react';
import { Button } from '@react-spectrum/s2/Button';
import { Text } from '@react-spectrum/s2';
import { TextField } from '@react-spectrum/s2/TextField';
import { Tabs, TabList, Tab, TabPanel } from '@react-spectrum/s2/Tabs';
import { Badge } from '@react-spectrum/s2/Badge';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import PlayIcon from '@react-spectrum/s2/icons/Play';
import RefreshIcon from '@react-spectrum/s2/icons/Refresh';
import CodeIcon from '@react-spectrum/s2/icons/Code';
import SearchIcon from '@react-spectrum/s2/icons/Search';
import AlertTriangleIcon from '@react-spectrum/s2/icons/AlertTriangle';
import { espJtag } from '../services/espJtag';

export const JtagDebuggerCard: FC = () => {
  const [activeTab, setActiveTab] = useState('execution');
  const [gdbLog, setGdbLog] = useState<string[]>([
    'OpenOCD/GDB Web Debugger Initialized.',
    'Ready for ESP32-C5 (RISC-V) Target.',
  ]);
  const [gdbInput, setGdbInput] = useState('');
  
  const [memAddress, setMemAddress] = useState('0x600B0000'); // RTC/LP controller block
  const [memWords, setMemWords] = useState('16');
  const [memDump, setMemDump] = useState<string[]>([]);
  
  const [watchAddress, setWatchAddress] = useState('');

  const logGdb = (cmd: string, response: string) => {
    setGdbLog(prev => [...prev, `(gdb) ${cmd}`, response]);
  };

  const handleGdbCommand = (cmd: string) => {
    if (!cmd.trim()) return;
    
    // Simulate GDB backend responses based on the user's scenarios
    let response = '';
    const c = cmd.trim();
    
    if (c === 'target remote :3333') {
      response = 'Remote debugging using :3333\n0x40000000 in _start ()';
    } else if (c === 'mon reset halt') {
      response = 'JTAG tap: esp32c5.tap tap/device found: 0x120034e5 (mfg: 0x272 (Tensilica), part: 0x2003, ver: 0x1)\nTarget halted. PRO_CPU: PC=0x40000400 (active)';
      if (espJtag.isConnected()) {
        espJtag.setReset(true).then(() => espJtag.setReset(false));
      }
    } else if (c === 'maintenance flush register-cache') {
      response = 'Register cache flushed.';
    } else if (c === 'set remote hardware-watchpoint-limit 2') {
      response = 'Hardware watchpoint limit set to 2.';
    } else if (c === 'continue' || c === 'c') {
      response = 'Continuing.';
    } else if (c === 'stepi' || c === 'si') {
      response = '0x40000404 in ?? ()';
    } else if (c === 'backtrace full' || c === 'bt') {
      response = '#0  0x40081234 in panic_handler ()\n#1  0x40084567 in load_store_alignment_fault_handler ()\n#2  0x400D0123 in wifi_handle_event ()';
    } else if (c === 'info locals') {
      response = 'current_rssi = -65\npacket_drop_count = 12\nmy_buffer_pointer = 0x3FFAE000';
    } else if (c.startsWith('watch ')) {
      response = `Hardware watchpoint 1: ${c.split(' ')[1]}`;
    } else if (c.startsWith('x/')) {
      response = `${c.split(' ').pop()}: 0x00000000 0x11223344 0x55667788 0x99AABBCC`;
    } else {
      response = `Undefined command: "${c}". Try "help".`;
    }
    
    logGdb(c, response);
    setGdbInput('');
  };

  const handleReadMemory = () => {
    handleGdbCommand(`x/${memWords}xw ${memAddress}`);
    // Simulate memory dump output
    const dump = [];
    let base = parseInt(memAddress, 16);
    if (isNaN(base)) base = 0x600B0000;
    
    const words = parseInt(memWords, 10) || 16;
    for (let i = 0; i < words; i += 4) {
      dump.push(
        `0x${(base + i * 4).toString(16).toUpperCase().padStart(8, '0')}: ` +
        `0x${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0')} ` +
        `0x${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0')} ` +
        `0x${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0')} ` +
        `0x${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0')}`
      );
    }
    setMemDump(dump);
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
          <CodeIcon />
          <Text>OpenOCD / GDB High-Level Interface</Text>
        </h2>
        <Badge variant="informative" fillStyle="subtle">RISC-V / ESP32-C5</Badge>
      </div>

      <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
        Simulated high-level GDB debugging interface utilizing the WebUSB JTAG abstraction. Supports dual-core synchronization, non-intrusive memory reads for Wi-Fi timing, and hardware watchpoints.
      </Text>

      <Tabs 
        aria-label="GDB Debugger Options"
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <TabList>
          <Tab id="execution"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><PlayIcon /> Execution Control</div></Tab>
          <Tab id="memory"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><SearchIcon /> Memory & RF Buffers</div></Tab>
          <Tab id="watchpoints"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><AlertTriangleIcon /> Watchpoints</div></Tab>
          <Tab id="console"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><CodeIcon /> GDB Console</div></Tab>
        </TabList>

        <TabPanel id="execution">
          <div className={style({ display: 'flex', flexDirection: 'column', gap: 16, paddingY: 12 }) as any}>
            <div className={style({ display: 'flex', gap: 12, flexWrap: 'wrap' }) as any}>
              <Button variant="primary" onPress={() => handleGdbCommand('mon reset halt')}>
                <RefreshIcon /> Halt & Reset
              </Button>
              <Button variant="accent" onPress={() => handleGdbCommand('continue')}>
                <PlayIcon /> Continue (c)
              </Button>
              <Button variant="secondary" onPress={() => handleGdbCommand('stepi')}>
                Step Instruction (si)
              </Button>
              <Button variant="secondary" onPress={() => handleGdbCommand('backtrace full')}>
                Full Backtrace (bt)
              </Button>
            </div>
            
            <div className={style({ backgroundColor: 'blue-100', padding: 12, borderRadius: 'lg', display: 'flex', flexDirection: 'column', gap: 4 }) as any}>
              <Text styles={style({ font: 'body-xs', fontWeight: 'bold', color: 'blue-900' })}>Dual-Core Synchronized Debugging</Text>
              <Text styles={style({ font: 'body-xs', color: 'blue-800' })}>
                Use <code>mon reset halt</code> to freeze the High-Performance (HP) Core (240 MHz) immediately before it enters deep sleep, allowing you to switch contexts and step through the Low-Power (LP) Core (48 MHz).
              </Text>
            </div>
          </div>
        </TabPanel>

        <TabPanel id="memory">
          <div className={style({ display: 'flex', flexDirection: 'column', gap: 16, paddingY: 12 }) as any}>
            <Text styles={style({ font: 'body-xs' })}>
              Non-intrusive memory inspection. Read active Wi-Fi 6 or Thread protocol buffers without halting the radio timing loops.
            </Text>
            <div className={style({ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }) as any}>
              <TextField label="Base Address (Hex)" value={memAddress} onChange={setMemAddress} styles={style({ flex: 2, minWidth: 200 }) as any} />
              <TextField label="Words to Read" value={memWords} onChange={setMemWords} styles={style({ flex: 1, minWidth: 100 }) as any} />
              <Button variant="primary" onPress={handleReadMemory}><SearchIcon /> Inspect (x/xw)</Button>
            </div>

            {memDump.length > 0 && (
              <div className={style({
                backgroundColor: 'gray-900',
                color: 'green-400',
                padding: 12,
                borderRadius: 'lg',
                fontFamily: 'code',
                font: 'detail-sm',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }) as any}>
                {memDump.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel id="watchpoints">
          <div className={style({ display: 'flex', flexDirection: 'column', gap: 16, paddingY: 12 }) as any}>
            <Text styles={style({ font: 'body-xs' })}>
              The ESP32-C5 RISC-V core supports up to 2 concurrent hardware watchpoints. Perfect for catching Stack Overflows during Matter-over-Wi-Fi execution or isolating ISR collisions.
            </Text>
            <div className={style({ display: 'flex', gap: 12, alignItems: 'end' }) as any}>
              <TextField label="Variable or Address to Watch" value={watchAddress} onChange={setWatchAddress} styles={style({ flex: 1 }) as any} />
              <Button variant="primary" onPress={() => handleGdbCommand(`watch ${watchAddress}`)}>Set Watchpoint</Button>
            </div>
          </div>
        </TabPanel>

        <TabPanel id="console">
          <div className={style({ display: 'flex', flexDirection: 'column', gap: 12, paddingY: 12 }) as any}>
            <div className={style({
              backgroundColor: 'gray-900',
              color: 'gray-50',
              padding: 12,
              borderRadius: 'lg',
              fontFamily: 'code',
              font: 'detail-sm',
              height: 250,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              whiteSpace: 'pre-wrap'
            }) as any}>
              {gdbLog.map((line, i) => (
                <div key={i} style={{ color: line.startsWith('(gdb)') ? '#60A5FA' : '#F9FAFB' }}>{line}</div>
              ))}
            </div>
            
            <div className={style({ display: 'flex', gap: 8 }) as any}>
              <span className={style({ fontFamily: 'code', font: 'body-sm', alignSelf: 'center', color: 'neutral-subdued' }) as any}>(gdb)</span>
              <TextField 
                aria-label="GDB Command Input"
                value={gdbInput} 
                onChange={setGdbInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGdbCommand(gdbInput);
                  }
                }}
                styles={style({ flex: 1 }) as any} 
              />
              <Button variant="primary" onPress={() => handleGdbCommand(gdbInput)}>Send</Button>
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};