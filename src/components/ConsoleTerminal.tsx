// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import { Button } from '@react-spectrum/s2/Button';
import { Picker, PickerItem } from '@react-spectrum/s2/Picker';
import { TextField } from '@react-spectrum/s2/TextField';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import DownloadIcon from '@react-spectrum/s2/icons/Download';
import DeleteIcon from '@react-spectrum/s2/icons/Delete';

interface ConsoleTerminalProps {
  serialState: SerialConnectionState;
  receivedData: Uint8Array[];
  onSendData: (data: string) => void;
  onClearLogs: () => void;
}

interface LogLine {
  text: string;
  type: 'info' | 'warning' | 'error' | 'debug' | 'system' | 'raw';
  timestamp: string;
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

const screenStyles = style({
  backgroundColor: 'gray-900',
  fontFamily: 'code',
  font: 'body-xs',
  padding: 16,
  height: 350,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

const lineTimeStyles = style({
  color: 'gray-500',
  marginRight: 8,
  font: 'body-xs',
  fontFamily: 'code',
  userSelect: 'none',
});

const errorLineStyles = style({ color: 'red-500', fontFamily: 'code' });
const warningLineStyles = style({ color: 'orange-500', fontFamily: 'code' });
const infoLineStyles = style({ color: 'green-500', fontFamily: 'code' });
const debugLineStyles = style({ color: 'purple-500', fontFamily: 'code' });
const systemLineStyles = style({ color: 'blue-500', fontFamily: 'code', fontWeight: 'bold' });
const defaultLineStyles = style({ color: 'gray-300', fontFamily: 'code' });

const getLineStyles = (type: LogLine['type']) => {
  switch (type) {
    case 'error': return errorLineStyles;
    case 'warning': return warningLineStyles;
    case 'info': return infoLineStyles;
    case 'debug': return debugLineStyles;
    case 'system': return systemLineStyles;
    default: return defaultLineStyles;
  }
};

const IDF_LOG_REGEX = /^(I|W|E|D|V) \([\d.: -]+\)\s+(.*)$/;

export const ConsoleTerminal: FC<ConsoleTerminalProps> = ({
  serialState,
  receivedData,
  onSendData,
  onClearLogs
}) => {
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warning' | 'error' | 'debug'>('all');
  const [inputVal, setInputVal] = useState<string>('');
  const [eol, setEol] = useState<'lf' | 'crlf' | 'cr' | 'none'>('lf');
  const screenRef = useRef<HTMLDivElement>(null);
  
  const textDecoderRef = useRef(new TextDecoder('utf-8'));
  const bufferRef = useRef<string>('');

  // Process raw serial data as it streams in
  useEffect(() => {
    if (receivedData.length === 0) {
      setLogLines([]);
      bufferRef.current = '';
      return;
    }

    const latestChunk = receivedData[receivedData.length - 1];
    const decoded = textDecoderRef.current.decode(latestChunk, { stream: true });
    bufferRef.current += decoded;

    const lines = bufferRef.current.split(/\r?\n/);
    bufferRef.current = lines.pop() || '';

    if (lines.length > 0) {
      const parsedLines = lines.map(line => {
        const cleaned = line.replace(/\x1b\[[0-9;]*m/g, ''); // strip ansi codes
        const match = cleaned.match(IDF_LOG_REGEX);
        let type: LogLine['type'] = 'raw';
        
        if (match) {
          const level = match[1];
          if (level === 'E') type = 'error';
          else if (level === 'W') type = 'warning';
          else if (level === 'I') type = 'info';
          else if (level === 'D') type = 'debug';
        } else if (line.includes('[DEVICE LOST]') || line.includes('[RECONNECT]') || line.includes('[SERIAL]')) {
          type = 'system';
        }

        return {
          text: line,
          type,
          timestamp: new Date().toLocaleTimeString()
        };
      });

      setLogLines(prev => [...prev, ...parsedLines].slice(-1500));
    }
  }, [receivedData]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (screenRef.current) {
      screenRef.current.scrollTop = screenRef.current.scrollHeight;
    }
  }, [logLines]);

  const handleSend = () => {
    if (!inputVal) return;
    let suffix = '';
    if (eol === 'lf') suffix = '\n';
    else if (eol === 'crlf') suffix = '\r\n';
    else if (eol === 'cr') suffix = '\r';
    
    onSendData(inputVal + suffix);

    // Append user echo line to terminal
    setLogLines(prev => [...prev, {
      text: `> ${inputVal}`,
      type: 'system',
      timestamp: new Date().toLocaleTimeString()
    }]);

    setInputVal('');
  };

  const handleDownloadLog = () => {
    const content = logLines.map(line => `[${line.timestamp}] ${line.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `esp_diag_log_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredLines = logLines.filter(line => {
    if (filterLevel === 'all') return true;
    if (filterLevel === 'error') return line.type === 'error';
    if (filterLevel === 'warning') return line.type === 'warning' || line.type === 'error';
    if (filterLevel === 'info') return line.type === 'info' || line.type === 'warning' || line.type === 'error';
    if (filterLevel === 'debug') return true;
    return true;
  });

  return (
    <div className={cardStyles as any}>
      <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }) as any}>
        <h2 className={titleStyles as any}>
          📺 Bidirectional Serial Console
        </h2>

        {/* Toolbar controls */}
        <div className={style({ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }) as any}>
          {/* Level Filter */}
          <Picker 
            label="Log Level" 
            value={filterLevel} 
            onSelectionChange={(val) => setFilterLevel(val as any)}
            size="S"
          >
            <PickerItem id="all">Show All Raw</PickerItem>
            <PickerItem id="debug">Verbose [D]</PickerItem>
            <PickerItem id="info">Info [I] + Above</PickerItem>
            <PickerItem id="warning">Warning [W] + Above</PickerItem>
            <PickerItem id="error">Errors Only [E]</PickerItem>
          </Picker>

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
            onPress={handleDownloadLog} 
            isDisabled={logLines.length === 0}
          >
            <DownloadIcon />
            Export Log
          </Button>

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

      {/* Scrollable screen */}
      <div className={terminalWrapperStyles as any}>
        <div className={terminalHeaderStyles as any}>
          <span>COM PORT MONITOR</span>
          <span>{filteredLines.length.toLocaleString()} lines shown</span>
        </div>
        
        <div className={screenStyles as any} ref={screenRef}>
          {filteredLines.length === 0 ? (
            <div className={style({ margin: 'auto', color: 'neutral-subdued', font: 'body-sm', textAlign: 'center' }) as any}>
              📟 Console Idle. Ready to receive serial stream...
            </div>
          ) : (
            filteredLines.map((line, idx) => (
              <div key={idx} className={getLineStyles(line.type) as any}>
                <span className={lineTimeStyles as any}>
                  [{line.timestamp}]
                </span>
                {line.text}
              </div>
            ))
          )}
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
            placeholder={serialState.isConnected ? "Type command here and press Enter to send..." : "Console offline. Connect port to send data."}
            value={inputVal}
            onChange={setInputVal}
            isDisabled={!serialState.isConnected}
            aria-label="Serial command input"
            styles={style({ 
              flexGrow: 1, 
            }) as any}
          />
          <Button 
            variant="accent" 
            type="submit"
            isDisabled={!serialState.isConnected || !inputVal}
            styles={style({ marginBottom: 0 }) as any}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};
