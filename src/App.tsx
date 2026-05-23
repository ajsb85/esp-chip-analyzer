import { useEffect, useState } from 'react';
import { serialManager } from './services/serialManager';
import type { SerialConnectionState } from './services/serialManager';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardFooter } from './components/DashboardFooter';
import { ConnectionPanel } from './components/ConnectionPanel';
import { SignalMonitor } from './components/SignalMonitor';
import { UsbConverterCard } from './components/UsbConverterCard';
import { EspChipCard } from './components/EspChipCard';
import { AutoProgrammerCard } from './components/AutoProgrammerCard';
import { ConsoleTerminal } from './components/ConsoleTerminal';
import { Provider } from '@react-spectrum/s2/Provider';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { Tabs, TabList, Tab, TabPanel } from '@react-spectrum/s2/Tabs';

const appContainerStyles = style({
  maxWidth: 1200,
  marginX: 'auto',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  minHeight: '100vh',
});

const gridStyles = style({
  display: 'flex',
  flexDirection: {
    default: 'column',
    lg: 'row',
  },
  gap: 24,
  alignItems: 'start',
});

const leftColumnStyles = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  width: {
    default: '100%',
    lg: 350, // 350px width, perfect for left diagnostics column
  },
  flexShrink: 0,
});

const rightColumnStyles = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  flexGrow: 1,
  width: '100%',
});

// Tabs are styled and structured natively by Spectrum S2 components

function App() {
  const [serialState, setSerialState] = useState<SerialConnectionState>(serialManager.getState());
  const [receivedData, setReceivedData] = useState<Uint8Array[]>([]);
  const [activeTab, setActiveTab] = useState<'terminal' | 'diagnostics' | 'signals'>('terminal');
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Apply theme class and data attributes to documentElement
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    document.documentElement.setAttribute('data-color-scheme', theme);
    document.documentElement.setAttribute('data-background', 'base');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // System theme preference listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Subscribe to serial manager updates
  useEffect(() => {
    const unsubscribe = serialManager.subscribe((state) => {
      setSerialState(state);
    });
    return () => unsubscribe();
  }, []);

  // Monitor network online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleConnect = async (port: SerialPort, baud: number) => {
    setReceivedData([]);
    await serialManager.connect(
      port,
      baud,
      (chunk) => {
        setReceivedData((prev) => [...prev, chunk]);
      },
      () => {
        console.log('[SERIAL] Disconnection occurred.');
      }
    );
  };

  const handleDisconnect = async () => {
    await serialManager.disconnect();
  };

  const handleForgetPort = async () => {
    await serialManager.forgetActivePort();
    setReceivedData([]);
  };

  const handleSendData = async (data: string) => {
    const port = serialManager.getPort();
    if (!port || !port.writable) {
      console.warn('Cannot send data: Port is closed or not writable.');
      return;
    }

    try {
      const writer = port.writable.getWriter();
      const encoder = new TextEncoder();
      const encoded = encoder.encode(data);
      await writer.write(encoded);
      writer.releaseLock();
    } catch (err) {
      console.error('[SERIAL] Failed to write data:', err);
    }
  };

  const handleClearLogs = () => {
    setReceivedData([]);
  };

  return (
    <Provider
      locale="en-US"
      colorScheme={theme}
      background="base"
      styles={appContainerStyles}
    >
      {/* Top Header Card */}
      <DashboardHeader 
        serialState={serialState} 
        isOnline={isOnline}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        onForgetPort={handleForgetPort}
      />

      {/* Primary Dashboard Grid */}
      <main className={gridStyles as any}>
        {/* Left Side: Connection & Hardware Controls */}
        <section className={leftColumnStyles as any}>
          <ConnectionPanel 
            serialState={serialState}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
          
          <UsbConverterCard 
            serialState={serialState}
          />
        </section>

        {/* Right Side: Tabbed Workspace */}
        <section className={rightColumnStyles as any}>
          <Tabs 
            aria-label="Chip Analyzer Workspace"
            selectedKey={activeTab} 
            onSelectionChange={(key) => setActiveTab(key as any)}
            styles={style({ width: '100%' }) as any}
          >
            <TabList aria-label="Chip Analyzer Modes">
              <Tab id="terminal">📺 Serial Terminal</Tab>
              <Tab id="diagnostics">🔬 Chip Diagnostics</Tab>
              <Tab id="signals">🔌 RS232 Handshake</Tab>
            </TabList>

            <TabPanel id="terminal">
              <ConsoleTerminal 
                serialState={serialState}
                receivedData={receivedData}
                onSendData={handleSendData}
                onClearLogs={handleClearLogs}
              />
            </TabPanel>
            <TabPanel id="diagnostics">
              <div className={style({ display: 'flex', flexDirection: 'column', gap: 24 }) as any}>
                <EspChipCard 
                  serialState={serialState}
                />
                <AutoProgrammerCard />
              </div>
            </TabPanel>
            <TabPanel id="signals">
              <SignalMonitor 
                serialState={serialState}
              />
            </TabPanel>
          </Tabs>
        </section>
      </main>

      {/* Corporate Anchored Footer */}
      <DashboardFooter isOnline={isOnline} />
    </Provider>
  );
}

export default App;

