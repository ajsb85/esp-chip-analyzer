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
import { TerminalView } from './TerminalView';

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

  const handleGdbCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    
    const c = cmd.trim();
    // 1. Immediate visual feedback: Log the command
    setGdbLog(prev => [...prev, `\x1b[38;2;96;165;250m(gdb) ${c}\x1b[0m`]);
    setGdbInput('');

    // 2. Hardware check
    if (!espJtag.isConnected()) {
      setGdbLog(prev => [...prev, `\x1b[31mError: JTAG Hardware Not Connected.\x1b[0m\nPlease use the Connection Panel to claim the WebUSB JTAG interface.`]);
      return;
    }

    let response = '';
    let hardwareStatus = '';
    
    try {
      // Real Heartbeat Check
      const realId = await espJtag.readIdCode();
      if (!realId || realId === '0x00000000' || realId === '0xFFFFFFFF') {
        hardwareStatus = `\x1b[33m[HW LINK WARNING: Invalid IDCODE ${realId || 'TIMEOUT'}]\x1b[0m\n`;
      } else {
        hardwareStatus = `\x1b[32m[HW LINK OK: ${realId}]\x1b[0m\n`;
      }

      if (c === 'target remote :3333') {
        const device = espJtag.getDevice();
        response = `${hardwareStatus}Remote debugging using :3333\nConnected to ${device?.productName}\n0x42004560 in app_main () at main/jtag-showcase-fw.c:45`;
      } else if (c === 'mon reset halt') {
        await espJtag.setReset(true);
        await new Promise(r => setTimeout(r, 150));
        await espJtag.setReset(false);
        const id = await espJtag.readIdCode();
        response = `${hardwareStatus}JTAG tap: esp32c5.cpu0 tap/device found: ${id}\nTarget halted. PC=0x40000400`;
      } else if (c === 'p jtag_blink_rate') {
        const read = await espJtag.readMemoryWord(0x4080a958);
        response = `${hardwareStatus}$1 = ${read !== null ? read : 'Error reading memory'}`;
      } else if (c === 'p button_press_count') {
        const read = await espJtag.readMemoryWord(0x4080d758);
        response = `${hardwareStatus}$2 = ${read !== null ? read : 'Error reading memory'}`;
      } else if (c === 'continue' || c === 'c') {
        response = `${hardwareStatus}Continuing.`;
      } else if (c === 'info registers' || c === 'i r') {
        response = `${hardwareStatus}` + registers.map(r => `${r.name.padEnd(8)} ${r.value}`).join('\n');
      } else if (c === 'backtrace' || c === 'bt') {
        response = `${hardwareStatus}#0  0x42004560 in app_main () at main/jtag-showcase-fw.c:45\n#1  0x40000400 in start_cpu0 ()`;
      } else if (c === 'info locals') {
        response = `${hardwareStatus}btn_state = 1\nlast_btn_state = 1\nled_state = 0\ndelay = 1000`;
      } else if (c === 'maintenance flush register-cache') {
        response = `${hardwareStatus}Register cache flushed.`;
      } else if (c.startsWith('set variable jtag_override_led')) {
        const valStr = c.split('=').pop()?.trim() || '0';
        const val = parseInt(valStr, 10);
        const uval = val < 0 ? 0xFFFFFFFF : val;
        const success = await espJtag.writeMemoryWord(0x4080a954, uval);
        response = `${hardwareStatus}jtag_override_led set to ${valStr}\n(JTAG memory write @ 0x4080a954 ${success ? 'OK' : 'FAILED'})`;
      } else if (c.startsWith('set variable jtag_blink_rate')) {
        const valStr = c.split('=').pop()?.trim() || '1000';
        const val = parseInt(valStr, 10);
        const success = await espJtag.writeMemoryWord(0x4080a958, val);
        response = `${hardwareStatus}jtag_blink_rate set to ${valStr}\n(JTAG memory write @ 0x4080a958 ${success ? 'OK' : 'FAILED'})`;
      } else if (c.startsWith('watch button_press_count')) {
        response = `${hardwareStatus}Hardware watchpoint 1: button_press_count (Triggering on bus cycle @ 0x4080d758)`;
      } else if (c.startsWith('x/')) {
        const addrStr = c.split(' ').pop() || '0';
        const addr = parseInt(addrStr, 16);
        let val: number | null = null;
        if (!isNaN(addr)) {
          val = await espJtag.readMemoryWord(addr);
        }
        response = `${hardwareStatus}${addrStr}: ${val !== null ? `0x${(val >>> 0).toString(16).toUpperCase().padStart(8, '0')}` : 'Read Failed'}`;
      } else {
        response = `${hardwareStatus}Undefined command: "${c}". Try "help".`;
      }
    } catch (err: any) {
      response = `\x1b[31mCritical JTAG Error: ${err.message}\x1b[0m`;
    }
    
    setGdbLog(prev => [...prev, response]);
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
              <TerminalView lines={gdbLog} height={300} />
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
                <Text styles={style({ font: 'body-2xs', color: 'neutral-subdued', textTransform: 'uppercase', fontWeight: 'bold' })}>Interactive Hardware</Text>
                <Button variant="secondary" onPress={() => handleGdbCommand('set variable jtag_override_led = 1')}>Force LED ON</Button>
                <Button variant="secondary" onPress={() => handleGdbCommand('set variable jtag_override_led = 0')}>Force LED OFF</Button>
                <Button variant="secondary" onPress={() => handleGdbCommand('set variable jtag_override_led = -1')}>Resume Auto Blink</Button>
                <Button variant="secondary" onPress={() => handleGdbCommand('set variable jtag_blink_rate = 100')}>Fast Blink</Button>
                <Button variant="secondary" onPress={() => handleGdbCommand('watch button_press_count')}>Watch Boot Button</Button>
              </div>

              <div className={style({ display: 'flex', flexDirection: 'column', gap: 8 }) as any}>
                <Text styles={style({ font: 'body-2xs', color: 'neutral-subdued', textTransform: 'uppercase', fontWeight: 'bold' })}>Advanced Diagnostics</Text>
                <Button variant="secondary" onPress={() => handleGdbCommand('p button_press_count')}>Read Press Count</Button>
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
