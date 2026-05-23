import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

interface TerminalViewProps {
  lines: string[];
  height?: number | string;
}

export const TerminalView: FC<TerminalViewProps> = ({ lines, height = 300 }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#111827', // gray-900
        foreground: '#F9FAFB', // gray-50
      },
      fontFamily: 'monospace',
      fontSize: 12,
      disableStdin: true,
      cursorBlink: false,
      convertEol: true, // Fixes staircase formatting (interprets \n as \r\n)
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

  // Write new lines
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      lines.forEach(line => xtermRef.current?.writeln(line));
    }
  }, [lines]);

  return (
    <div 
      className={style({
        borderRadius: 'lg',
        overflow: 'hidden',
        width: '100%',
        backgroundColor: 'gray-900',
        minWidth: 0, // Fixes flexbox infinite stretch
      }) as any}
      style={{ height, boxSizing: 'border-box', padding: '12px', background: '#111827' }}
    >
      <div ref={terminalRef} style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#111827' }} />
    </div>
  );
};
