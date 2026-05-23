import type { FC } from 'react';
import { Badge } from '@react-spectrum/s2/Badge';
import { InlineAlert, Heading, Content } from '@react-spectrum/s2/InlineAlert';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { Tabs, TabList, Tab, TabPanel } from '@react-spectrum/s2/Tabs';
import PluginIcon from '@react-spectrum/s2/icons/Plugin';
import FileTextIcon from '@react-spectrum/s2/icons/FileText';
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

const preStyles = style({
  fontFamily: 'code',
  font: 'body-xs',
  padding: 16,
  backgroundColor: 'gray-50',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'gray-200',
  borderRadius: 'default',
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
  color: 'neutral',
});

export const AutoProgrammerCard: FC = () => {
  return (
    <div className={cardStyles}>
      <div className={style({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
        <h2 className={style({ font: 'heading-xs', color: 'neutral', margin: 0, display: 'flex', alignItems: 'center', gap: 8 })}>
          <PluginIcon /> ESP32 Auto-Programmer Circuit
        </h2>
        <Badge variant="positive" fillStyle="subtle">Reference</Badge>
      </div>
      
      <p className={style({ font: 'body-sm', color: 'neutral-subdued' })}>
        The standard ESP32 / ESP8266 auto-reset circuit uses two NPN transistors (typically S8050) driven by the <strong>DTR</strong> and <strong>RTS</strong> lines of a USB-to-Serial converter like the CH340X.
      </p>

      <InlineAlert variant="informative">
        <Heading>Circuit Logic</Heading>
        <Content>
          <ul className={style({ margin: 0, paddingLeft: 20 })}>
            <li><strong>EN (Reset)</strong> = <code>DTR &amp; ~RTS</code></li>
            <li><strong>IO0 (Boot Mode)</strong> = <code>~DTR &amp; RTS</code></li>
          </ul>
          This logic prevents both EN and IO0 from being pulled low simultaneously, which could cause an undefined state.
        </Content>
      </InlineAlert>

      <Tabs aria-label="Auto-Programmer Reference">
        <TabList>
          <Tab id="schematic"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><FileTextIcon /> ASCII Schematic</div></Tab>
          <Tab id="kicad"><div className={style({ display: 'flex', alignItems: 'center', gap: 8 }) as any}><FolderIcon /> KiCad Implementation</div></Tab>
        </TabList>
        <TabPanel id="schematic">
          <pre className={preStyles}>{`
 CH340X/CP2102                     ESP32
+------------+                  +---------+
|        DTR |----[ R 10k ]--+  |         |
|            |               |  |         |
|            |     Q1        |  |         |
|            |    +--|/|-----+--| EN      |
|            |    |  |>|        | (Reset) |
|            |    |    |        |         |
|            |    +----+        |         |
|            |         |        |         |
|        RTS |----[ R 10k ]--+  |         |
|            |               |  |         |
|            |     Q2        |  |         |
|            |    +--|/|-----+--| IO0     |
|            |    |  |>|        | (Boot)  |
|            |    |    |        |         |
+------------+    +----+        +---------+
                    |
                   GND
          `}</pre>
        </TabPanel>
        <TabPanel id="kicad">
          <div className={style({ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 })}>
            <p className={style({ font: 'body-sm' })}>
              The project repository contains a complete KiCad 7 design for a standalone CH340X-based ESP programmer.
            </p>
            <ul className={style({ font: 'body-sm', margin: 0, paddingLeft: 20 })}>
              <li><code>ch34x/auto-programmer-solution/ch340x.kicad_sch</code></li>
              <li><code>ch34x/auto-programmer-solution/ch340x.kicad_pcb</code></li>
              <li><code>ch34x/auto-programmer-solution/ch340x.pdf</code></li>
            </ul>
            <p className={style({ font: 'body-sm' })}>
              You can integrate this circuit block directly into your custom ESP32 PCBs to enable seamless flashing without manual BOOT/EN buttons.
            </p>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};
