import type { FC } from 'react';
import type { SerialConnectionState } from '../services/serialManager';
import { Badge } from '@react-spectrum/s2/Badge';
import { StatusLight } from '@react-spectrum/s2/StatusLight';
import { Button } from '@react-spectrum/s2/Button';
import { Switch } from '@react-spectrum/s2/Switch';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import DeleteIcon from '@react-spectrum/s2/icons/Delete';

interface DashboardHeaderProps {
  serialState: SerialConnectionState;
  isOnline: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onForgetPort: () => void;
}

const headerStyles = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 16,
  paddingX: 24,
  paddingY: 16,
  backgroundColor: 'gray-50',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'gray-200',
  borderRadius: 'lg',
  boxShadow: 'elevated',
});

const appTitleStyles = style({
  font: 'heading-sm',
  color: 'neutral',
  margin: 0,
});

const subtitleStyles = style({
  font: 'body-xs',
  color: 'neutral-subdued',
  margin: 0,
});

export const DashboardHeader: FC<DashboardHeaderProps> = ({
  serialState,
  isOnline,
  theme,
  onToggleTheme,
  onForgetPort
}) => {
  const isWebSerialSupported = typeof navigator !== 'undefined' && !!navigator.serial;
  const isWebUsbSupported = typeof navigator !== 'undefined' && !!navigator.usb;

  const renderStatusBadge = () => {
    if (serialState.isReconnecting) {
      return (
        <StatusLight variant="notice">
          Reconnecting...
        </StatusLight>
      );
    }
    if (serialState.isConnected) {
      return (
        <StatusLight variant="positive">
          Connected ({serialState.baudRate.toLocaleString()} bps)
        </StatusLight>
      );
    }
    return <StatusLight variant="neutral">Disconnected</StatusLight>;
  };

  return (
    <header className={headerStyles as any}>
      {/* Title Segment & Application Brand Icon */}
      <div className={style({ display: 'flex', alignItems: 'center', gap: 16 }) as any}>
        <div className={style({
          display: 'flex', 
          alignItems: 'center',
          boxShadow: 'elevated',
          borderRadius: 'lg',
          overflow: 'hidden',
          backgroundColor: 'gray-100',
          padding: 4,
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: 'gray-200',
        }) as any}>
          <img 
            src="favicon.svg" 
            alt="ESP32 Chip Analyzer App Icon" 
            className={style({ 
              width: 32, 
              height: 32, 
              display: 'block'
            }) as any} 
          />
        </div>
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 2 }) as any}>
          <h1 className={appTitleStyles as any}>
            ESP32 Chip & USB Bridge Analyzer
          </h1>
          <p className={subtitleStyles as any}>
            Enterprise Diagnostics Utility &bull; Silicon Labs AN978 Customs Inspector
          </p>
        </div>
      </div>

      {/* Control Segment & Badges */}
      <div className={style({ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }) as any}>
        {/* Support status badges */}
        <div className={style({ display: 'flex', gap: 8 }) as any}>
          {!isWebSerialSupported ? (
            <Badge variant="negative" fillStyle="subtle">No WebSerial</Badge>
          ) : (
            <Badge variant="positive" fillStyle="subtle">WebSerial Supported</Badge>
          )}
          {!isWebUsbSupported ? (
            <Badge variant="negative" fillStyle="subtle">No WebUSB</Badge>
          ) : (
            <Badge variant="positive" fillStyle="subtle">WebUSB Supported</Badge>
          )}
        </div>

        {/* Network connection badge */}
        <Badge variant={isOnline ? 'positive' : 'notice'} fillStyle="outline">
          {isOnline ? '🌐 Online PWA' : '📡 Offline Diagnostic Active'}
        </Badge>

        {/* Connection status light */}
        {renderStatusBadge()}

        {/* Theme Commuter Toggle */}
        <Switch isSelected={theme === 'dark'} onChange={onToggleTheme}>
          Dark Mode
        </Switch>

        {/* Revoke Serial Port permission button */}
        {serialState.port && (
          <Button 
            variant="negative" 
            size="S" 
            onPress={onForgetPort}
          >
            <DeleteIcon />
            Revoke Access
          </Button>
        )}
      </div>
    </header>
  );
};
