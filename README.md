# 🔬 ESP32 Chip & USB Converter Analyzer

An enterprise-grade, browser-based Progressive Web App (PWA) designed to analyze, diagnose, and monitor connected Espressif (ESP8266, ESP32, ESP32-S2, ESP32-S3, ESP32-C2, ESP32-C3, ESP32-C5, ESP32-C6, ESP32-H2, ESP32-P4) microchips and USB-to-UART serial bridges (Silicon Labs CP210x, FTDI, CH340, Prolific).

Designed with a sleek dark glassmorphism aesthetic, the application provides engineers, developers, and hardware hackers with real-time signal diagnostics, eFuse registers auditing, and serial terminal capabilities completely client-side.

---

## ⚡ Key Technical Capabilities

### 1. Silicon Labs CP210x Customs Inspector (AN978 Spec)
When a Silicon Labs bridge is attached, the app prompts for **WebUSB** access. It performs device-level vendor control transfers (Endpoint 0, Request Type `0xC0`, Request Code `0xFF`) to read configuration latch parameters directly from the chip's internal EEPROM:
* **Decoded Model:** Reads `ITEM_MODEL` (`0x370B`) to identify the exact variant: CP2101, CP2102, CP2103, CP2104, CP2105, CP2108, or CP2102N.
* **Dual COM Mode:** Reads `ITEM_MODE` (`0x3711`) on CP2105 bridges to decode SCI/ECI pin configurations.
* **Buffer Flush:** Reads `ITEM_FLUSH` (`0x370D`) buffer control parameters.
* **Fallback Database:** Full identification profiles for FTDI (`FT232R`), WCH (`CH340`/`CH341`), Prolific (`PL2303`), and Native CDC interfaces.

### 2. Espressif Chip Diagnostic Suite (`esptool-js`)
Interfaces with the Espressif bootstrap ROM bootloader over Web Serial to extract crucial hardware properties:
* **MAC Address:** Decodes MAC address bytes retrieved from eFuse registers.
* **Crystal Frequency:** Identifies crystal speed (e.g. 40MHz).
* **Chip Features:** Maps active hardware capabilities (Dual-Core, WiFi, Bluetooth Low Energy, Flash Encryption, Secure Boot).
* **SPI Flash Auto-Detect:** Queries connected SPI Flash memory size.
* **Hard Reset Control:** Issue classic RTS/DTR toggles to reset the board into standard program execution.

### 3. Interactive DB9 RS232 Signal Monitor
* **Output Toggles:** Drive output lines **DTR (Data Terminal Ready)**, **RTS (Request To Send)**, and **BREAK** manually.
* **Polled Input LEDs:** Visualizes incoming handshake pins **CTS (Clear To Send)**, **DSR (Data Set Ready)**, **DCD (Data Carrier Detect)**, and **RI (Ring Indicator)** using a 150ms periodic query.

### 4. Bidirectional Terminal & Espressif Log Parser
* **Log Level Colorizer:** Automated regex tags that colorize standard Espressif IDF log outputs (green for Info, yellow for Warning, red for Error, gray for Debug).
* **Flexible EOL:** Select `\n`, `\r\n`, `\r` or none for terminal inputs.
* **Log Exporter:** Single-click utility to export styled terminal buffer as standard `.txt` files with timestamps.

### 5. Offline PWA Operation
Fully compliant Progressive Web App with service worker pre-caching. The app works **100% offline** in remote laboratories, RF-shielded chambers, or factory floors without internet access.

---

## 🛠️ Developer Setup & Build Instructions

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** (v9 or higher)
* A modern browser with Web Serial and WebUSB enabled (Google Chrome, MS Edge, Opera).

### Quickstart
1. Clone the repository and navigate into it:
   ```bash
   git clone https://github.com/ajsb85/esp-chip-analyzer.git
   cd esp-chip-analyzer
   ```
2. Build the local `esptool-js` library:
   ```bash
   cd ../esptool-js
   npm install
   npm run build
   cd ../esp-chip-analyzer
   ```
3. Install dependencies and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
4. Build the PWA static bundle:
   ```bash
   npm run build
   ```

---

## 🔒 Permission & Safety Standards
* **Permissions Revocation:** Built-in "Revoke Access" button calling `port.forget()` to allow users to immediately discard active port permissions.
* **No Cloud Connections:** 100% client-side operation. No serial data, unique MACs, or metadata ever leaves your browser.
* **Read-Only Safeties:** All control transfers target device-level read parameters, preventing any accidental bricking of CP210x EEPROMs.

---

## 📄 License
This project is licensed under the Apache License 2.0. See the `LICENSE` file for details.
