import { useEffect, useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import DataIcon from '@react-spectrum/s2/icons/Data';
import { Switch } from '@react-spectrum/s2/Switch';
import { Button } from '@react-spectrum/s2/Button';
import { ButtonGroup } from '@react-spectrum/s2/ButtonGroup';
import { StatusLight } from '@react-spectrum/s2/StatusLight';
import { InlineAlert, Heading, Content } from '@react-spectrum/s2/InlineAlert';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { Text } from "@react-spectrum/s2";
import RefreshIcon from '@react-spectrum/s2/icons/Refresh';
import DownloadIcon from '@react-spectrum/s2/icons/Download';

interface SignalMonitorProps {
  serialState: SerialConnectionState;
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

const sectionLabelStyles = style({
  font: 'body-sm',
  fontWeight: 'bold',
  color: 'neutral',
  marginBottom: 8,
  display: 'block',
});

const signalCardStyles = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 12,
  backgroundColor: {
    default: 'blue-100',
    _dark: 'blue-1200'
  },
  borderRadius: 'lg',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'gray-200',
});

const signalLabelStyles = style({
  font: 'body-sm',
  fontWeight: 'bold',
  color: {
    default: 'gray-900',
    _dark: 'gray-1000'
  },
});

const signalSubStyles = style({
  font: 'body-xs',
  color: 'neutral-subdued',
});

const signalGridStyles = style({
  display: 'grid',
  gridTemplateColumns: {
    default: '1fr',
    md: '1fr 1fr',
  },
  gap: 12,
});

export const SignalMonitor: FC<SignalMonitorProps> = ({ serialState }) => {
  // Input signals
  const [inputs, setInputs] = useState({
    dcd: false,
    cts: false,
    ri: false,
    dsr: false
  });
  
  // Output signals
  const [outputs, setOutputs] = useState({
    dtr: false,
    rts: false,
    brk: false
  });

  const [supported, setSupported] = useState(true);

  // Periodic polling for input signals (when connected)
  useEffect(() => {
    if (!serialState.isConnected || !serialState.port || serialState.isPortBusy) {
      setSupported(true);
      return;
    }

    const port = serialState.port;
    let isActive = true;

    const pollSignals = async () => {
      if (!isActive) return;
      try {
        const sigs = await port.getSignals();
        setInputs({
          dcd: sigs.dataCarrierDetect,
          cts: sigs.clearToSend,
          ri: sigs.ringIndicator,
          dsr: sigs.dataSetReady
        });
        setSupported(true);
      } catch (err) {
        setSupported(false);
      }
    };

    pollSignals();
    const interval = setInterval(pollSignals, 150);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [serialState.isConnected, serialState.port, serialState.isPortBusy]);

  // Handle setting outputs
  const handleToggleOutput = async (signal: 'dtr' | 'rts' | 'brk', checked: boolean) => {
    if (!serialState.isConnected || !serialState.port || serialState.isPortBusy) return;
    try {
      const nextOutputs = { ...outputs, [signal]: checked };
      setOutputs(nextOutputs);
      
      await serialState.port.setSignals({
        dataTerminalReady: nextOutputs.dtr,
        requestToSend: nextOutputs.rts,
        break: nextOutputs.brk
      });
    } catch (err) {
      console.warn('[SignalMonitor] Failed to set signals:', err);
    }
  };

  /**
   * ACTION 1: TRIGGER RESET
   * EN = 0 (DTR=true), IO0 = 1 (RTS=false)
   */
  const handleResetPulse = async () => {
    if (!serialState.isConnected || !serialState.port || serialState.isPortBusy) return;
    try {
      console.log("Resetting ESP32...");
      // Step 1: EN Low, IO0 High (DTR=true, RTS=false)
      await serialState.port.setSignals({ dataTerminalReady: true, requestToSend: false });
      setOutputs({ dtr: true, rts: false, brk: false });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 2: Normal Running (DTR=false, RTS=false)
      await serialState.port.setSignals({ dataTerminalReady: false, requestToSend: false });
      setOutputs({ dtr: false, rts: false, brk: false });
    } catch (err) {
      console.warn('[SignalMonitor] Failed reset pulse:', err);
    }
  };

  /**
   * ACTION 2: ENTER BOOTLOADER MODE
   * Robust 4-step sequence for dual-transistor circuits
   */
  const handleBootloaderSequence = async () => {
    if (!serialState.isConnected || !serialState.port || serialState.isPortBusy) return;
    try {
      console.log("Entering ESP32 Bootloader Mode...");
      
      // Step 1: Set IO0 Low (DTR=false, RTS=true)
      await serialState.port.setSignals({ dataTerminalReady: false, requestToSend: true });
      setOutputs({ dtr: false, rts: true, brk: false });
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 2: Pull EN Low while keeping IO0 Low (DTR=true, RTS=true)
      await serialState.port.setSignals({ dataTerminalReady: true, requestToSend: true });
      setOutputs({ dtr: true, rts: true, brk: false });
      await new Promise(resolve => setTimeout(resolve, 150));

      // Step 3: Release EN High while IO0 stays Low (DTR=false, RTS=true)
      await serialState.port.setSignals({ dataTerminalReady: false, requestToSend: true });
      setOutputs({ dtr: false, rts: true, brk: false });
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 4: Release both lines to normal state (Ready for comms)
      await serialState.port.setSignals({ dataTerminalReady: false, requestToSend: false });
      setOutputs({ dtr: false, rts: false, brk: false });
      
      console.log("ESP32 ready for flashing.");
    } catch (err) {
      console.warn('[SignalMonitor] Failed boot sequence:', err);
    }
  };

  return (
    <div className={cardStyles as any}>
      <h2 className={style({ font: 'heading-xs', color: 'neutral', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }) as any}>
        <DataIcon /> RS232 DB9 Signals
      </h2>

      {!serialState.isConnected ? (
        <div className={style({
          textAlign: 'center',
          color: 'neutral-subdued',
          font: 'body-sm',
          padding: 24,
        }) as any}>
          <Text>Connect device to monitor signal states.</Text>
        </div>
      ) : !supported ? (
        <InlineAlert variant="notice">
          <Heading>Handshake Signals Unsupported</Heading>
          <Content>
            Handshake signals are not supported or blocked by the USB converter firmware.
          </Content>
        </InlineAlert>
      ) : (
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 20 }) as any}>
          {/* Writeable Outputs */}
          <div>
            <span className={sectionLabelStyles as any}>Output Pins (Writeable)</span>
            <div className={style({ display: 'flex', flexDirection: 'column', gap: 8 }) as any}>
              <Switch 
                isSelected={outputs.dtr} 
                onChange={(checked) => handleToggleOutput('dtr', checked)}
                isDisabled={serialState.isPortBusy}
              >
                DTR (Data Terminal Ready)
              </Switch>

              <Switch 
                isSelected={outputs.rts} 
                onChange={(checked) => handleToggleOutput('rts', checked)}
                isDisabled={serialState.isPortBusy}
              >
                RTS (Request To Send)
              </Switch>

              <Switch 
                isSelected={outputs.brk} 
                onChange={(checked) => handleToggleOutput('brk', checked)}
                isDisabled={serialState.isPortBusy}
              >
                BREAK (TX Line Toggle)
              </Switch>
            </div>
          </div>

          {/* Combined Circuit Logic */}
          <div>
            <span className={sectionLabelStyles as any}>ESP32 Auto-Reset Circuit Control</span>
            <div className={style({ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, backgroundColor: 'gray-50', borderRadius: 'lg', borderStyle: 'solid', borderWidth: 1, borderColor: 'gray-200' }) as any}>
              <div className={style({ display: 'flex', flexDirection: 'column', gap: 4 }) as any}>
                <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
                  Direct Web Serial signal manipulation:
                </Text>
                <code className={style({ font: 'code-xs', backgroundColor: 'gray-100', padding: 4, borderRadius: 'sm', width: 'fit' }) as any}>
                  EN (Reset) = DTR & ~RTS | IO0 (Boot) = ~DTR & RTS
                </code>
              </div>
              <ButtonGroup styles={style({ marginTop: 8 }) as any}>
                <Button variant="secondary" onPress={handleResetPulse} isDisabled={serialState.isPortBusy}>
                  <RefreshIcon />
                  <Text>Trigger Reset</Text>
                </Button>
                <Button variant="accent" onPress={handleBootloaderSequence} isDisabled={serialState.isPortBusy}>
                  <DownloadIcon />
                  <Text>Enter Boot Mode</Text>
                </Button>
              </ButtonGroup>
            </div>
          </div>

          {/* Read-only Status */}
          <div>
            <span className={sectionLabelStyles as any}>Input Pins (Read-Only Status)</span>
            <div className={signalGridStyles as any}>
              {/* CTS */}
              <div className={signalCardStyles as any}>
                <div>
                  <div className={signalLabelStyles as any}>CTS</div>
                  <div className={signalSubStyles as any}>Clear To Send</div>
                </div>
                <StatusLight variant={inputs.cts ? 'positive' : 'neutral'}>
                  {inputs.cts ? 'HIGH' : 'LOW'}
                </StatusLight>
              </div>

              {/* DSR */}
              <div className={signalCardStyles as any}>
                <div>
                  <div className={signalLabelStyles as any}>DSR</div>
                  <div className={signalSubStyles as any}>Data Set Ready</div>
                </div>
                <StatusLight variant={inputs.dsr ? 'positive' : 'neutral'}>
                  {inputs.dsr ? 'HIGH' : 'LOW'}
                </StatusLight>
              </div>

              {/* DCD */}
              <div className={signalCardStyles as any}>
                <div>
                  <div className={signalLabelStyles as any}>DCD</div>
                  <div className={signalSubStyles as any}>Carrier Detect</div>
                </div>
                <StatusLight variant={inputs.dcd ? 'positive' : 'neutral'}>
                  {inputs.dcd ? 'HIGH' : 'LOW'}
                </StatusLight>
              </div>

              {/* RI */}
              <div className={signalCardStyles as any}>
                <div>
                  <div className={signalLabelStyles as any}>RI</div>
                  <div className={signalSubStyles as any}>Ring Indicator</div>
                </div>
                <StatusLight variant={inputs.ri ? 'positive' : 'neutral'}>
                  {inputs.ri ? 'HIGH' : 'LOW'}
                </StatusLight>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
