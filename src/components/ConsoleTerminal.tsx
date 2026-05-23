import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import CodeIcon from '@react-spectrum/s2/icons/Code';
import { Button } from '@react-spectrum/s2/Button';
import { Picker, PickerItem } from '@react-spectrum/s2/Picker';
import { TextField } from '@react-spectrum/s2/TextField';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import DeleteIcon from '@react-spectrum/s2/icons/Delete';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface ConsoleTerminalProps {
  serialState: SerialConnectionState;
  receivedData: Uint8Array[];
  onSendData: (data: string) => void;
  onClearLogs: () => void;
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

const terminalWrapperStyles = style({
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 'lg',
  overflow: 'hidden',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'gray-300',
  boxShadow: 'elevated',
});

const terminalHeaderStyles = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'gray-100',
  paddingX: 16,
  paddingY: 8,
  font: 'body-xs',
  fontWeight: 'bold',
  color: 'neutral-subdued',
  borderBottomStyle: 'solid',
  borderBottomWidth: 1,
  borderBottomColor: 'gray-200',
});

export const ConsoleTerminal: FC<ConsoleTerminalProps> = ({
  serialState,
  receivedData,
  onSendData,
  onClearLogs
}) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [eol, setEol] = useState<'lf' | 'crlf' | 'cr' | 'none'>('crlf');
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const prevDataLengthRef = useRef(0);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#111827', // gray-900
        foreground: '#F9FAFB', // gray-50
      },
      fontFamily: 'monospace',
      fontSize: 14,
      disableStdin: true,
      cursorBlink: false,
      convertEol: true, // Fixes staircase formatting
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    // Observe the parent container instead of the terminal container to avoid recursive resizing
    if (terminalRef.current.parentElement) {
      resizeObserver.observe(terminalRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (!xtermRef.current) return;
    
    if (receivedData.length === 0) {
      xtermRef.current.clear();
      prevDataLengthRef.current = 0;
      return;
    }

    if (receivedData.length > prevDataLengthRef.current) {
      const newChunks = receivedData.slice(prevDataLengthRef.current);
      newChunks.forEach(chunk => {
        xtermRef.current?.write(chunk);
      });
      prevDataLengthRef.current = receivedData.length;
    }
  }, [receivedData]);

  const handleSend = () => {
    if (!inputVal) return;
    let suffix = '';
    if (eol === 'lf') suffix = '\n';
    else if (eol === 'crlf') suffix = '\r\n';
    else if (eol === 'cr') suffix = '\r';
    
    onSendData(inputVal + suffix);
    
    // Echo locally for clarity (optional, often serial bridges echo back anyway)
    xtermRef.current?.writeln(`\x1b[32m> ${inputVal}\x1b[0m`);

    setInputVal('');
  };

  return (
    <div className={cardStyles as any}>
      <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }) as any}>
        <h2 className={titleStyles as any}>
          <CodeIcon /> Bidirectional Serial Console
        </h2>

        {/* Toolbar controls */}
        <div className={style({ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }) as any}>
          {/* EOL Selector */}
          <Picker 
            label="EOL Terminator" 
            value={eol} 
            onSelectionChange={(val) => setEol(val as any)}
            size="S"
          >
            <PickerItem id="lf">Line Feed (\n)</PickerItem>
            <PickerItem id="crlf">Carriage Return + LF (\r\n)</PickerItem>
            <PickerItem id="cr">Carriage Return (\r)</PickerItem>
            <PickerItem id="none">No Terminator</PickerItem>
          </Picker>

          <Button 
            variant="secondary" 
            size="S" 
            onPress={onClearLogs}
          >
            <DeleteIcon />
            Clear
          </Button>
        </div>
      </div>

      <div className={terminalWrapperStyles as any}>
        <div className={terminalHeaderStyles as any}>
          <span>COM PORT MONITOR (XTERM)</span>
        </div>
        
        {/* XTerm Container */}
        <div 
          className={style({
            backgroundColor: 'gray-900',
            padding: 16,
            minWidth: 0,
          }) as any}
          style={{ background: '#111827' }}
        >
          <div ref={terminalRef} style={{ height: 350, width: '100%', overflow: 'hidden', background: '#111827' }} />
        </div>

        {/* Command bar input form */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          className={style({
            display: 'flex',
            gap: 8,
            alignItems: 'end',
            padding: 16,
            backgroundColor: 'layer-2',
            borderTopStyle: 'solid',
            borderTopWidth: 1,
            borderTopColor: 'gray-200',
          }) as any}
        >
          <TextField 
            placeholder={serialState.isPortBusy ? `Port reserved by ${serialState.activeOperation}...` : serialState.isConnected ? "Type command here and press Enter to send..." : "Console offline. Connect port to send data."}
            value={inputVal}
            onChange={setInputVal}
            isDisabled={!serialState.isConnected || serialState.isPortBusy}
            aria-label="Serial command input"
            styles={style({ 
              flexGrow: 1, 
            }) as any}
          />
          <Button 
            variant="accent" 
            type="submit"
            isDisabled={!serialState.isConnected || serialState.isPortBusy || !inputVal}
            styles={style({ marginBottom: 0 }) as any}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};
