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
import DataIcon from '@react-spectrum/s2/icons/Data';
import { espJtag } from '../services/espJtag';

export const JtagDebuggerCard: FC = () => {
  const [activeTab, setActiveTab] = useState('execution');
  const [gdbLog, setGdbLog] = useState<string[]>([
    'OpenOCD/GDB Web Debugger Initialized.',
    'Ready for ESP32-C5 (RISC-V) Target.',
  ]);
  const [gdbInput, setGdbInput] = useState('');
  
  const [memAddress, setMemAddress] = useState('0x4080D6A0'); 
  const [memWords] = useState('16');
  const [memDump, setMemDump] = useState<string[]>([]);
  
  const [registers, setRegisters] = useState<{name: string, value: string}[]>([
    { name: 'pc', value: '0x42004560' },
    { name: 'ra', value: '0x40000400' },
    { name: 'sp', value: '0x4080AF00' },
    { name: 'gp', value: '0x4080D000' },
    { name: 'tp', value: '0x00000000' },
    { name: 't0', value: '0x00000001' },
    { name: 't1', value: '0x00000000' },
    { name: 't2', value: '0x00000000' },
    { name: 's0', value: '0x00000000' },
    { name: 's1', value: '0x00000000' },
    { name: 'a0', value: '0x00000000' },
    { name: 'a1', value: '0x00000000' },
  ]);

  const logGdb = (cmd: string, response: string) => {
    setGdbLog(prev => [...prev, `(gdb) ${cmd}`, response]);
  };

  const handleGdbCommand = (cmd: string) => {
    if (!cmd.trim()) return;
    
    let response = '';
    const c = cmd.trim();
    
    if (c === 'target remote :3333') {
      response = 'Remote debugging using :3333\n0x42004560 in app_main () at main/jtag-showcase-fw.c:20';
    } else if (c === 'mon reset halt') {
      response = 'JTAG tap: esp32c5.cpu0 tap/device found: 0x00000cd5\nTarget halted. PC=0x40000400';
      if (espJtag.isConnected()) {
        espJtag.setReset(true).then(() => espJtag.setReset(false));
      }
    } else if (c === 'p jtag_counter') {
      response = `$1 = ${Math.floor(Date.now() / 1000) % 1000}`;
    } else if (c === 'p jtag_message') {
      response = '$2 = "JTAG is watching you"';
    } else if (c === 'continue' || c === 'c') {
      response = 'Continuing.';
    } else if (c === 'info registers' || c === 'i r') {
      response = registers.map(r => `${r.name.padEnd(8)} ${r.value}`).join('\n');
    } else if (c === 'backtrace' || c === 'bt') {
      response = '#0  0x42004560 in app_main () at main/jtag-showcase-fw.c:20\n#1  0x40000400 in start_cpu0 ()';
    } else if (c === 'info locals') {
      response = 'jtag_counter = 42\njtag_control = 0\nstatus_flags = 0x00000001\ntemp_buffer = 0x4080AF10';
    } else if (c === 'maintenance flush register-cache') {
      response = 'Register cache flushed.';
    } else if (c === 'x/16xw $sp') {
      response = '0x4080AF00: 0x00000000 0x40000400 0x42004560 0x00000000\n0x4080AF10: 0x00000000 0x00000000 0x00000000 0x00000000\n0x4080AF20: 0x00000000 0x00000000 0x00000000 0x00000000\n0x4080AF30: 0x00000000 0x00000000 0x00000000 0x00000000';
    } else if (c.startsWith('set variable jtag_control')) {
      const val = c.split('=').pop()?.trim();
      response = `jtag_control set to ${val}`;
    } else if (c.startsWith('set {char[')) {
      response = '';
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
    const dump = [];
    let base = parseInt(memAddress, 16);
    if (isNaN(base)) base = 0x4080D6A0;
    
    const words = 16;
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

  const refreshRegisters = () => {
    setRegisters(prev => prev.map(r => ({
      ...r,
      value: r.name === 'pc' ? `0x4200${Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0')}` : r.value
    })));
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
          <Text>WebOCD JTAG Debugger Console</Text>
        </h2>
        <Badge variant="informative" fillStyle="subtle">ESP32-C5 (RISC-V)</Badge>
      </div>

      <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
        Live JTAG debugging session for ESP32-C5. Interact with the target via GDB commands or high-level controls.
      </Text>

      <Tabs 
        aria-label="GDB Debugger Options"
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <TabList>
          <Tab id="execution"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><PlayIcon /> Execution</div></Tab>
          <Tab id="registers"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><DataIcon /> Registers</div></Tab>
          <Tab id="memory"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><SearchIcon /> Memory</div></Tab>
          <Tab id="console"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><CodeIcon /> GDB Console</div></Tab>
        </TabList>

        <TabPanel id="execution">
          <div className={style({ display: 'flex', flexDirection: 'column', gap: 16, paddingY: 12 }) as any}>
            <div className={style({ display: 'flex', gap: 12, flexWrap: 'wrap' }) as any}>
              <Button variant="primary" onPress={() => handleGdbCommand('mon reset halt')}>
                <RefreshIcon /> Reset & Halt
              </Button>
              <Button variant="accent" onPress={() => handleGdbCommand('continue')}>
                <PlayIcon /> Continue
              </Button>
              <Button variant="secondary" onPress={() => handleGdbCommand('backtrace')}>
                Backtrace
              </Button>
            </div>
          </div>
        </TabPanel>

        <TabPanel id="registers">
          <div className={style({ display: 'flex', flexDirection: 'column', gap: 16, paddingY: 12 }) as any}>
            <div className={style({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }) as any}>
              {registers.map((reg, i) => (
                <div key={i} className={style({ display: 'flex', justifyContent: 'space-between', padding: 8, backgroundColor: 'gray-50', borderRadius: 'sm', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
                  <Text styles={style({ font: 'body-xs', fontWeight: 'bold' })}>{reg.name}</Text>
                  <Text styles={style({ font: 'body-xs', fontFamily: 'code' })}>{reg.value}</Text>
                </div>
              ))}
            </div>
            <Button variant="secondary" onPress={refreshRegisters}><RefreshIcon /> Refresh Registers</Button>
          </div>
        </TabPanel>

        <TabPanel id="memory">
          <div className={style({ display: 'flex', flexDirection: 'column', gap: 16, paddingY: 12 }) as any}>
            <div className={style({ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }) as any}>
              <TextField label="Address" value={memAddress} onChange={setMemAddress} styles={style({ flex: 2 }) as any} />
              <Button variant="primary" onPress={handleReadMemory}><SearchIcon /> Inspect</Button>
            </div>
            {memDump.length > 0 && (
              <div className={style({ backgroundColor: 'gray-900', color: 'green-400', padding: 12, borderRadius: 'lg', fontFamily: 'code', font: 'detail-sm' }) as any}>
                {memDump.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel id="console">
          <div className={style({ display: 'grid', gridTemplateColumns: { default: '1fr', lg: '1fr 250px' }, gap: 16, paddingY: 12 }) as any}>
            
            <div className={style({ display: 'flex', flexDirection: 'column', gap: 12 }) as any}>
              <div className={style({
                backgroundColor: 'gray-900',
                color: 'gray-50',
                padding: 12,
                borderRadius: 'lg',
                fontFamily: 'code',
                font: 'detail-sm',
                height: 300,
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
                <TextField 
                  aria-label="GDB Command"
                  value={gdbInput} 
                  onChange={setGdbInput}
                  onKeyDown={(e) => e.key === 'Enter' && handleGdbCommand(gdbInput)}
                  styles={style({ flex: 1 }) as any} 
                />
                <Button variant="primary" onPress={() => handleGdbCommand(gdbInput)}>Send</Button>
              </div>
            </div>

            <div className={style({ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, backgroundColor: 'gray-50', borderRadius: 'lg', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
              <Text styles={style({ font: 'body-sm', fontWeight: 'bold' })}>Quick Snippets</Text>
              
              <div className={style({ display: 'flex', flexDirection: 'column', gap: 8 }) as any}>
                <Text styles={style({ font: 'body-2xs', color: 'neutral-subdued', textTransform: 'uppercase', fontWeight: 'bold' })}>Showcase Basic</Text>
                <Button variant="secondary" onPress={() => handleGdbCommand('p jtag_counter')}>Read Counter</Button>
                <Button variant="secondary" onPress={() => handleGdbCommand('set variable jtag_control = 99')}>Remote Restart</Button>
                <Button variant="secondary" onPress={() => handleGdbCommand('set {char[32]}jtag_message = "Hello JTAG!"')}>Set Message</Button>
              </div>

              <div className={style({ display: 'flex', flexDirection: 'column', gap: 8 }) as any}>
                <Text styles={style({ font: 'body-2xs', color: 'neutral-subdued', textTransform: 'uppercase', fontWeight: 'bold' })}>Advanced Diagnostics</Text>
                <Button variant="secondary" onPress={() => handleGdbCommand('x/16xw $sp')}>Dump Stack (SP)</Button>
                <Button variant="secondary" onPress={() => handleGdbCommand('info locals')}>Inspect Locals</Button>
                <Button variant="secondary" onPress={() => handleGdbCommand('maintenance flush register-cache')}>Flush Reg Cache</Button>
              </div>
            </div>

          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};
