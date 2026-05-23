import type { FC } from 'react';
import { Badge } from '@react-spectrum/s2/Badge';
import { StatusLight } from '@react-spectrum/s2/StatusLight';
import { Button } from '@react-spectrum/s2/Button';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import DataUploadIcon from '@react-spectrum/s2/icons/DataUpload';
import PluginIcon from '@react-spectrum/s2/icons/Plugin';
import RefreshIcon from '@react-spectrum/s2/icons/Refresh';
import DeleteIcon from '@react-spectrum/s2/icons/Delete';

interface DashboardFooterProps {
  isOnline: boolean;
}

const footerStyles = style({
  backgroundColor: 'layer-1',
  borderTopStyle: 'solid',
  borderTopWidth: 1,
  borderTopColor: 'gray-200',
  paddingY: 24,
  paddingX: 32,
  display: 'flex',
  flexDirection: {
    default: 'column',
    lg: 'row'
  },
  gap: 24,
  justifyContent: 'space-between',
  alignItems: {
    default: 'start',
    lg: 'center'
  },
  marginTop: 'auto',
});

const gridStyles = style({
  display: 'flex',
  gap: 32,
  flexWrap: 'wrap',
});

const columnStyles = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const DashboardFooter: FC<DashboardFooterProps> = ({ isOnline }) => {
  const handleHardUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map(key => caches.delete(key)));
    window.location.reload();
  };

  return (
    <footer className={footerStyles}>
      {/* Brand Identity / Copyright */}
      <div className={style({ display: 'flex', flexDirection: 'column', gap: 4 })}>
        <span className={style({ font: 'heading-xs', color: 'neutral' })}>
          ESP Chip & USB Bridge Analyzer
        </span>
        <span className={style({ font: 'body-xs', color: 'neutral-subdued' })}>
          &copy; {new Date().getFullYear()} Espressif Systems / Reverse Engineering Community
        </span>
        <span className={style({ font: 'body-xs', color: 'neutral-subdued', marginTop: 4 })}>
          Built with React Spectrum S2 & WebSerial API
        </span>
      </div>

      {/* Corporate Links & Meta */}
      <div className={gridStyles}>
        <div className={columnStyles}>
          <span className={style({ font: 'body-xs', fontWeight: 'bold', color: 'neutral' })}>Telemetry & Status</span>
          <div className={style({ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 8,
            alignItems: 'start'
          })}>
            {/* Caching Status */}
            <Badge variant="positive" fillStyle="subtle">
              <DataUploadIcon /> PWA Status: Fully Offline Cached (v1.1.7)
            </Badge>

            {/* Execution Env */}
            <Badge variant="notice" fillStyle="subtle">
              <PluginIcon /> Client: 100% Sandboxed Web Serial
            </Badge>

            {/* Network Online Status */}
            <StatusLight variant={isOnline ? 'positive' : 'negative'}>
              Connection: {isOnline ? 'Online / Operational' : 'Offline / Standalone Mode'}
            </StatusLight>
          </div>
        </div>
      </div>

      {/* Utilities */}
      <div className={style({ display: 'flex', flexWrap: 'wrap', gap: 12 })}>
        <Button 
          variant="secondary" 
          size="S"
          onPress={() => window.location.reload()}
        >
          <RefreshIcon />
          Soft Refresh
        </Button>
        <Button 
          variant="negative" 
          size="S"
          onPress={handleHardUpdate}
        >
          <DeleteIcon />
          Hard Update & Clear Cache
        </Button>
      </div>

      {/* Color Accent Bar */}
      <div className={style({
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        display: 'flex',
      })}>
        <div className={style({ flex: '0 0 40%', backgroundColor: 'red-600' })} />
        <div className={style({ flex: '0 0 35%', backgroundColor: 'yellow-500' })} />
        <div className={style({ flex: '0 0 25%', backgroundColor: 'blue-600' })} />
      </div>
    </footer>
  );
};
