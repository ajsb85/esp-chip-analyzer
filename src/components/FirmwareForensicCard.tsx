import { useState } from 'react';
import type { FC } from 'react';
import { Button } from '@react-spectrum/s2/Button';
import { Badge } from '@react-spectrum/s2/Badge';
import { style, iconStyle } from "@react-spectrum/s2/style" with { type: "macro" };
import { Text } from "@react-spectrum/s2";
import { firmwareAnalyzer } from '../services/firmwareAnalyzer';
import type { PartitionEntry } from '../services/firmwareAnalyzer';
import SearchIcon from '@react-spectrum/s2/icons/Search';
import FileTextIcon from '@react-spectrum/s2/icons/FileText';
import AlertTriangleIcon from '@react-spectrum/s2/icons/AlertTriangle';
import FolderIcon from '@react-spectrum/s2/icons/Folder';

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

const tableStyles = style({
  width: 'full',
  borderCollapse: 'collapse',
  font: 'body-xs',
  marginTop: 8,
});

const thStyles = style({
  textAlign: 'start',
  padding: 8,
  borderBottomStyle: 'solid',
  borderBottomWidth: 1,
  borderBottomColor: 'gray-300',
  color: 'neutral-subdued',
  fontWeight: 'bold',
});

const tdStyles = style({
  padding: 8,
  borderBottomStyle: 'solid',
  borderBottomWidth: 1,
  borderBottomColor: 'gray-200',
  fontFamily: 'code',
});

export const FirmwareForensicCard: FC = () => {
  const [partitions, setPartitions] = useState<PartitionEntry[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    const parts = firmwareAnalyzer.parsePartitionTable(buffer);
    setPartitions(parts);
  };

  return (
    <div className={cardStyles as any}>
      <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) as any}>
        <h2 className={style({ font: 'heading-xs', color: 'neutral', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }) as any}>
          <SearchIcon styles={iconStyle({ size: 'M' })} />
          <Text>Firmware Forensic Explorer</Text>
        </h2>
        <Badge variant="informative" fillStyle="subtle">Binary Analysis</Badge>
      </div>

      <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
        Upload a raw ESP32 flash dump (.bin) to analyze its partition structure, identify app slots, and locate configuration data.
      </Text>

      <div className={style({ display: 'flex', flexDirection: 'column', gap: 12 }) as any}>
        <Button 
          variant="secondary" 
          onPress={() => document.getElementById('fw-upload')?.click()}
          styles={style({ alignSelf: 'start' }) as any}
        >
          <FolderIcon />
          <Text>Select Flash Dump (.bin)</Text>
        </Button>
        <input 
          id="fw-upload" 
          type="file" 
          hidden 
          accept=".bin" 
          onChange={handleFileUpload} 
        />
        {fileName && <Text styles={style({ font: 'body-xs', color: 'neutral' })}>File: {fileName}</Text>}
      </div>

      {partitions.length > 0 ? (
        <div className={style({ overflowX: 'auto' }) as any}>
          <table className={tableStyles as any}>
            <thead>
              <tr>
                <th className={thStyles as any}>Label</th>
                <th className={thStyles as any}>Type</th>
                <th className={thStyles as any}>Offset</th>
                <th className={thStyles as any}>Size</th>
              </tr>
            </thead>
            <tbody>
              {partitions.map((p, i) => (
                <tr key={i}>
                  <td className={tdStyles as any}>{p.label}</td>
                  <td className={tdStyles as any}>
                    <div className={style({ display: 'flex', flexDirection: 'column' }) as any}>
                      <span>{p.typeLabel}</span>
                      <span className={style({ font: 'detail-sm', color: 'neutral-subdued' }) as any}>{p.subtypeLabel}</span>
                    </div>
                  </td>
                  <td className={tdStyles as any}>0x{p.offset.toString(16).toUpperCase()}</td>
                  <td className={tdStyles as any}>{(p.size / 1024).toFixed(1)} KB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : fileName && (
        <div className={style({ backgroundColor: 'negative-subtle', padding: 12, borderRadius: 'lg', display: 'flex', alignItems: 'center', gap: 8 }) as any}>
          <AlertTriangleIcon styles={iconStyle({ size: 'S', color: 'negative' })} />
          <Text styles={style({ font: 'body-xs', color: 'negative' })}>No valid ESP32 partition table found at 0x8000.</Text>
        </div>
      )}

      <div className={style({ marginTop: 8, borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: 'gray-200', paddingTop: 16 }) as any}>
        <div className={style({ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }) as any}>
          <FileTextIcon styles={iconStyle({ size: 'S' })} />
          <Text styles={style({ font: 'body-xs', fontWeight: 'bold', color: 'neutral' })}>Reverse Engineering Resources</Text>
        </div>
        <div className={style({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }) as any}>
          <a href="https://github.com/tenable/esp32_image_parser" target="_blank" className={style({ font: 'body-xs', color: 'accent', textDecoration: 'none' }) as any}>&rarr; ESP32 Image Parser</a>
          <a href="https://github.com/themadinventor/ida-xtensa" target="_blank" className={style({ font: 'body-xs', color: 'accent', textDecoration: 'none' }) as any}>&rarr; IDA Xtensa Plugin</a>
          <a href="https://ghidra-re.org/" target="_blank" className={style({ font: 'body-xs', color: 'accent', textDecoration: 'none' }) as any}>&rarr; Ghidra RE Platform</a>
          <a href="https://github.com/espressif/svd" target="_blank" className={style({ font: 'body-xs', color: 'accent', textDecoration: 'none' }) as any}>&rarr; Espressif SVD Files</a>
        </div>
      </div>
    </div>
  );
};
