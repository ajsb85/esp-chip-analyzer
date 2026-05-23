export interface PartitionEntry {
  label: string;
  type: number;
  typeLabel: string;
  subtype: number;
  subtypeLabel: string;
  offset: number;
  size: number;
  flags: number;
}

export interface NvsEntry {
  namespace: string;
  key: string;
  type: string;
  value: any;
}

const PART_TYPES: Record<number, string> = {
  0x00: "APP",
  0x01: "DATA"
};

const PART_SUBTYPES_APP: Record<number, string> = {
  0x00: "FACTORY",
  0x20: "TEST"
};

// OTA sub types
for (let i = 0; i < 16; i++) {
  PART_SUBTYPES_APP[0x10 | i] = "ota_" + i;
}

const PART_SUBTYPES_DATA: Record<number, string> = {
  0x00: "OTA",
  0x01: "RF",
  0x02: "WIFI",
  0x04: "NVS"
};

class FirmwareAnalyzer {
  /**
   * Parses the ESP32 partition table from a binary buffer.
   * Standard offset is 0x8000.
   */
  public parsePartitionTable(buffer: ArrayBuffer): PartitionEntry[] {
    const partitions: PartitionEntry[] = [];
    const view = new DataView(buffer);
    const offset = 0x8000;
    
    if (buffer.byteLength < offset + 32) return [];

    for (let i = 0; i < 95; i++) {
      const entryPos = offset + (i * 32);
      if (entryPos + 32 > buffer.byteLength) break;

      const magic1 = view.getUint8(entryPos);
      const magic2 = view.getUint8(entryPos + 1);

      // Check partition magic 0xAA 0x50
      if (magic1 !== 0xAA || magic2 !== 0x50) {
        break;
      }

      const type = view.getUint8(entryPos + 2);
      const subtype = view.getUint8(entryPos + 3);
      const partOffset = view.getUint32(entryPos + 4, true);
      const size = view.getUint32(entryPos + 8, true);
      
      // Label is 16 bytes at offset 12
      const labelBytes = new Uint8Array(buffer, entryPos + 12, 16);
      let label = new TextDecoder().decode(labelBytes).split('\0')[0];
      
      const flags = view.getUint32(entryPos + 28, true);

      const typeLabel = PART_TYPES[type] || "Unknown";
      let subtypeLabel = "Unknown";
      if (typeLabel === "APP") {
        subtypeLabel = PART_SUBTYPES_APP[subtype] || "Unknown";
      } else if (typeLabel === "DATA") {
        subtypeLabel = PART_SUBTYPES_DATA[subtype] || "Unknown";
      }

      partitions.push({
        label,
        type,
        typeLabel,
        subtype,
        subtypeLabel,
        offset: partOffset,
        size,
        flags
      });
    }

    return partitions;
  }

  /**
   * Extremely simplified NVS parser.
   * Real NVS parsing is very complex (pages, entries, states).
   * This is a placeholder for a more robust implementation.
   */
  public parseNvs(_buffer: Uint8Array): NvsEntry[] {
    // TODO: Port read_nvs.py logic here
    return [];
  }
}

export const firmwareAnalyzer = new FirmwareAnalyzer();
