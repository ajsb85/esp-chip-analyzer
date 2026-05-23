// @ts-nocheck
import { useEffect, useState } from 'react';
import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import { Switch } from '@react-spectrum/s2/Switch';
import { StatusLight } from '@react-spectrum/s2/StatusLight';
import { InlineAlert, Heading, Content } from '@react-spectrum/s2/InlineAlert';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

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

const titleStyles = style({
  font: 'heading-xs',
  color: 'neutral',
  margin: 0,
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
    if (!serialState.isConnected || !serialState.port) {
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
  }, [serialState.isConnected, serialState.port]);

  // Handle setting outputs
  const handleToggleOutput = async (signal: 'dtr' | 'rts' | 'brk', checked: boolean) => {
    if (!serialState.isConnected || !serialState.port) return;
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

  return (
    <div className={cardStyles as any}>
      <h2 className={titleStyles as any}>
        <DataIcon /> RS232 DB9 Signals
      </h2>

      {!serialState.isConnected ? (
        <div className={style({
          textAlign: 'center',
          color: 'neutral-subdued',
          font: 'body-sm',
          padding: 24,
        }) as any}>
          Connect device to monitor signal states.
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
              >
                DTR (Data Terminal Ready)
              </Switch>

              <Switch 
                isSelected={outputs.rts} 
                onChange={(checked) => handleToggleOutput('rts', checked)}
              >
                RTS (Request To Send)
              </Switch>

              <Switch 
                isSelected={outputs.brk} 
                onChange={(checked) => handleToggleOutput('brk', checked)}
              >
                BREAK (TX Line Toggle)
              </Switch>
            </div>
          </div>

          {/* Read-only Inputs */}
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
