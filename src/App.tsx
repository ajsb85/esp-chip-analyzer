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
import { FirmwareFlasherCard } from './components/FirmwareFlasherCard';
import { FirmwareForensicCard } from './components/FirmwareForensicCard';
import { ConsoleTerminal } from './components/ConsoleTerminal';
import { Provider } from '@react-spectrum/s2/Provider';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { Tabs, TabList, Tab, TabPanel } from '@react-spectrum/s2/Tabs';
import CodeIcon from '@react-spectrum/s2/icons/Code';
import SearchIcon from '@react-spectrum/s2/icons/Search';
import DataSettingsIcon from '@react-spectrum/s2/icons/DataSettings';
import DataIcon from '@react-spectrum/s2/icons/Data';
import DataUploadIcon from '@react-spectrum/s2/icons/DataUpload';

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
    lg: 350, 
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

type AppTab = 'terminal' | 'diagnostics' | 'signals' | 'flasher' | 'forensic';

function App() {
  const [serialState, setSerialState] = useState<SerialConnectionState>(serialManager.getState());
  const [receivedData, setReceivedData] = useState<Uint8Array[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>('terminal');
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme', 'spectrum--light');
      document.documentElement.classList.remove('spectrum--dark');
    } else {
      document.documentElement.classList.remove('light-theme', 'spectrum--light');
      document.documentElement.classList.add('spectrum--dark');
    }
    document.documentElement.setAttribute('data-color-scheme', theme);
    document.documentElement.setAttribute('data-background', 'base');
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  useEffect(() => {
    const unsubscribe = serialManager.subscribe((state) => {
      setSerialState(state);
    });
    return () => unsubscribe();
  }, []);

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
    if (!port || !port.writable) return;
    try {
      const writer = port.writable.getWriter();
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(data));
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
      <DashboardHeader 
        serialState={serialState} 
        isOnline={isOnline}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        onForgetPort={handleForgetPort}
      />

      <main className={gridStyles}>
        <section className={leftColumnStyles}>
          <ConnectionPanel 
            serialState={serialState}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
          <UsbConverterCard 
            serialState={serialState}
          />
        </section>

        <section className={rightColumnStyles}>
          <Tabs 
            aria-label="Chip Analyzer Workspace"
            selectedKey={activeTab} 
            onSelectionChange={(key) => setActiveTab(key as any)}
            styles={style({ width: '100%' })}
          >
            <TabList aria-label="Chip Analyzer Modes">
              <Tab id="terminal"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><CodeIcon /> Serial Terminal</div></Tab>
              <Tab id="flasher"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><DataUploadIcon /> Firmware Flasher</div></Tab>
              <Tab id="forensic"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><SearchIcon /> Firmware Forensic</div></Tab>
              <Tab id="diagnostics"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><DataSettingsIcon /> Chip Diagnostics</div></Tab>
              <Tab id="signals"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><DataIcon /> RS232 Handshake</div></Tab>
            </TabList>

            <TabPanel id="terminal">
              <ConsoleTerminal 
                serialState={serialState}
                receivedData={receivedData}
                onSendData={handleSendData}
                onClearLogs={handleClearLogs}
              />
            </TabPanel>
            <TabPanel id="flasher">
              <FirmwareFlasherCard serialState={serialState} />
            </TabPanel>
            <TabPanel id="forensic">
              <FirmwareForensicCard />
            </TabPanel>
            <TabPanel id="diagnostics">
              <div className={style({ display: 'flex', flexDirection: 'column', gap: 24 })}>
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

      <DashboardFooter isOnline={isOnline} />
    </Provider>
  );
}

export default App;
