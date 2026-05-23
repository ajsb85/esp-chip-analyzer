import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';

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
    // Keep the last incomplete fragment in the buffer
    bufferRef.current = lines.pop() || '';

    if (lines.length > 0) {
      const parsedLines = lines.map(line => {
        const cleaned = line.replace(/\x1b\[[0-9;]*m/g, ''); // strip ansi codes for regex matching
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

      setLogLines(prev => [...prev, ...parsedLines].slice(-1500)); // Cap at 1500 lines for layout speed
    }
  }, [receivedData]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (screenRef.current) {
      screenRef.current.scrollTop = screenRef.current.scrollHeight;
    }
  }, [logLines]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputVal) return;
    let suffix = '';
    if (eol === 'lf') suffix = '\n';
    else if (eol === 'crlf') suffix = '\r\n';
    else if (eol === 'cr') suffix = '\r';
    
    onSendData(inputVal + suffix);

    // Append standard user echo line to terminal
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

  const getLineClass = (type: LogLine['type']) => {
    switch (type) {
      case 'error': return 'terminal-line error';
      case 'warning': return 'terminal-line warning';
      case 'info': return 'terminal-line info';
      case 'debug': return 'terminal-line debug';
      case 'system': return 'terminal-line system';
      default: return 'terminal-line';
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          📺 Bidirectional Serial Console
        </h2>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Level Filter */}
          <select 
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
          >
            <option value="all">🔍 Show All Raw</option>
            <option value="debug">⚙️ Verbose [D]</option>
            <option value="info">🟢 Info [I] + Above</option>
            <option value="warning">🟡 Warning [W] + Above</option>
            <option value="error">🔴 Errors Only [E]</option>
          </select>

          {/* EOL Selector */}
          <select 
            value={eol}
            onChange={(e) => setEol(e.target.value as any)}
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
            title="End of line terminator appended to commands"
          >
            <option value="lf">Line Feed (\n)</option>
            <option value="crlf">Carriage Return + LF (\r\n)</option>
            <option value="cr">Carriage Return (\r)</option>
            <option value="none">No Terminator</option>
          </select>

          <button onClick={handleDownloadLog} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} disabled={logLines.length === 0}>
            💾 Export Log
          </button>
          <button onClick={onClearLogs} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="terminal-wrapper">
        <div className="terminal-header">
          <span>COM PORT MONITOR</span>
          <span>{filteredLines.length} lines shown</span>
        </div>
        
        <div className="terminal-screen" ref={screenRef}>
          {filteredLines.length === 0 ? (
            <div style={{ margin: 'auto', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', textAlign: 'center' }}>
              📟 Console Idle. Ready to receive serial stream...
            </div>
          ) : (
            filteredLines.map((line, idx) => (
              <div key={idx} className={getLineClass(line.type)}>
                <span style={{ color: 'hsl(var(--text-muted))', marginRight: '8px', fontSize: '0.75rem', userSelect: 'none' }}>
                  [{line.timestamp}]
                </span>
                {line.text}
              </div>
            ))
          )}
        </div>

        <div className="terminal-input-bar">
          <input 
            type="text" 
            placeholder={serialState.isConnected ? "Type command here and press Enter to send..." : "Console offline. Connect port to send data."}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!serialState.isConnected}
          />
          <button 
            onClick={handleSend} 
            className="btn btn-cyan" 
            disabled={!serialState.isConnected || !inputVal}
            style={{ borderRadius: 0, padding: '0 24px' }}
          >
            Send ➜
          </button>
        </div>
      </div>
    </div>
  );
};
