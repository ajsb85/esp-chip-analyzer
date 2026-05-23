import { useEffect, useState } from 'react';
import { serialManager } from './services/serialManager';
import type { SerialConnectionState } from './services/serialManager';
import { DashboardHeader } from './components/DashboardHeader';
import { ConnectionPanel } from './components/ConnectionPanel';
import { SignalMonitor } from './components/SignalMonitor';
import { UsbConverterCard } from './components/UsbConverterCard';
import { EspChipCard } from './components/EspChipCard';
import { ConsoleTerminal } from './components/ConsoleTerminal';

function App() {
  const [serialState, setSerialState] = useState<SerialConnectionState>(serialManager.getState());
  const [receivedData, setReceivedData] = useState<Uint8Array[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? window.navigator.onLine : true);

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
      // Data callback
      (chunk) => {
        setReceivedData((prev) => [...prev, chunk]);
      },
      // Disconnect callback
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
    <div className="app-container">
      {/* Top Header Card */}
      <DashboardHeader 
        serialState={serialState} 
        isOnline={isOnline}
        onForgetPort={handleForgetPort}
      />

      {/* Primary Dashboard Grid */}
      <main className="dashboard-grid">
        {/* Left Side: Connection & Hardware Controls */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ConnectionPanel 
            serialState={serialState}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
          
          <SignalMonitor 
            serialState={serialState}
          />

          <UsbConverterCard 
            serialState={serialState}
          />
        </section>

        {/* Right Side: Chip Diagnostics & Interactive Terminal */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <EspChipCard 
            serialState={serialState}
          />
          
          <ConsoleTerminal 
            serialState={serialState}
            receivedData={receivedData}
            onSendData={handleSendData}
            onClearLogs={handleClearLogs}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
