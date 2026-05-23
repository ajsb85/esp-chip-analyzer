# Contributing to ESP32 Chip & USB Converter Analyzer

We welcome community contributions, hardware profiles, and bug fixes! This document provides guides and standards to ensure high-quality contributions.

---

## 🏗️ Technical Architecture

This application is built as a single-page **React + TypeScript** PWA using **Vite**. 
* **State Management:** Low-overhead React subscription pattern in `serialManager.ts` to coordinate Web Serial connection events, reconnect loops, and error reporting.
* **Control Transfers:** Standard WebUSB vendor control transfers in `usbAnalyzer.ts` targeted at Endpoint 0.
* **ROM Handshake:** Sub-modules in `espDiagnostics.ts` wrapping and compiling `esptool-js` targets.

---

## 🛠️ Adding Support for New USB Bridges

If you have a serial bridge that is not currently recognized or has custom diagnostics:
1. Identify its Vendor ID (VID) and Product ID (PID).
2. Open `src/services/usbAnalyzer.ts`.
3. Add the mapping to the `classifyConverter` method:
   ```typescript
   if (vid === YOUR_CUSTOM_VID) return 'YourConverterClass';
   ```
4. Define its name, manufacturer, and model resolution in `getDefaultManufacturer`, `getDefaultProductName`, and `classifyConverterModelName`.
5. If the bridge supports vendor-specific control transfers (like Silicon Labs AN978), add a custom WebUSB transaction sequence inside `analyzeDevice` and parse the resulting buffer.

---

## 💅 Style & Development Standards

* **TypeScript:** Enable strict typings. Avoid using `any` unless mapping browser API interfaces that are not fully typed by standard lib specifications.
* **Module Imports:** The template uses `verbatimModuleSyntax: true`. Types must be explicitly imported using `import type { ... }`.
* **Aesthetics:** Cards must align with the glassmorphism and HSL Obsidian styling tokens defined in `src/index.css`.
* **Disconnection Safety:** Any custom service running loops must intercept read/write exceptions (like cable unplug actions) and release locks using `.releaseLock()` to avoid blocking the device.

---

## 🧪 Hardware Testing Protocol

Before submitting a Pull Request, please test your branch on physical hardware:
1. Connect an ESP32 board (via CP210x, CH340, or Native USB-OTG).
2. Connect and verify the Handshake Input LEDs blink or toggle correctly.
3. Drive DTR and RTS toggles and verify the chip undergoes reset.
4. Run an eFuse register scan and confirm MAC, crystal, and flash parameters match `esptool` python command line outputs.
5. Emulate a cable-pull disconnect during serial data streaming and verify that:
   - The UI shows "Device Lost" in orange.
   - Reconnect backoff runs in the background.
   - Reconnecting the cable auto-restores the session without page reloads.
