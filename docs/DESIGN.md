# AI-Based Intrusion Detection System: UI/UX Design System Specification

## 1. Design Philosophy

The **AI-Based Intrusion Detection System** uses a **Deep Obsidian Black & Electric Amber/Yellow** aesthetic with a subtle **10% Glassmorphism** finish (`.cyber-card`).

The visual language balances the tactical atmosphere of enterprise aerospace/defense SOC command centers with clean, high-contrast readability suitable for extended operational shifts and high-stakes academic evaluations.

### Core Visual Directives:
* **Tactical High Contrast**: Obsidian black surfaces (`#070707`, `#0d0d0d`) paired with high-visibility electric yellow accents (`#FACC15`, `#EAB308`).
* **10% Glassmorphism Finish**: Semi-translucent panels (`rgba(18, 18, 18, 0.85)`) with a `12px` Gaussian backdrop blur, crisp `1px` translucent borders, and yellow inset lighting.
* **Rigid Viewport Stabilization**: The application frame is locked to `100vh` and `100vw` with `overflow: hidden`, ensuring the Navbar, Sidebar, and Viewport never bounce or scroll up and down when reading or sorting internal tables.

---

## 2. Color Palette & Design Tokens

### Primary Palette (Obsidian & Electric Yellow)
| Token Name | Hex Code | RGBA / OKLCH | Primary Application |
| :--- | :--- | :--- | :--- |
| **Obsidian Base** | `#070707` | `rgba(7, 7, 7, 1)` | Root window backdrop, outer body framing |
| **Charcoal Surface**| `#0d0d0d` | `rgba(13, 13, 13, 1)` | Sidebar background, secondary containers |
| **Glass Card** | `#121212` | `rgba(18, 18, 18, 0.85)` | Primary `.cyber-card` surface with `backdrop-blur-md` |
| **Electric Yellow** | `#FACC15` | `oklch(85.2% 0.199 91.9)` | Primary brand color, KPI numbers, active tabs, buttons |
| **Amber Gold** | `#EAB308` | `oklch(79.5% 0.184 86.0)` | Hover states, risk badges, area chart gradients |
| **Deep Bronze** | `#854D0E` | `oklch(47.3% 0.137 46.2)` | Inset lighting, active borders, card shadows |

### Semantic Severity Tokens
| Severity | Text Color | Badge Background | Border Color | Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | `#FDA4AF` (Rose 300) | `rgba(244, 63, 94, 0.20)` | `rgba(244, 63, 94, 0.40)` | Active root compromise, data exfiltration |
| **HIGH** | `#FDBA74` (Orange 300) | `rgba(249, 115, 22, 0.20)` | `rgba(249, 115, 22, 0.40)` | Brute-force attacks, port scans, password sprays |
| **MEDIUM** | `#FDE047` (Yellow 300) | `rgba(250, 204, 21, 0.20)` | `rgba(250, 204, 21, 0.40)` | Off-hours logins, excessive web requests |
| **LOW** | `#D4D4D8` (Zinc 300) | `rgba(39, 39, 42, 0.60)` | `rgba(63, 63, 70, 0.50)` | Benign anomalies, minor threshold deviations |
| **SAFE / BENIGN**| `#6EE7B7` (Emerald 300) | `rgba(16, 185, 129, 0.20)` | `rgba(16, 185, 129, 0.40)` | Verified normal traffic, whitelisted indicators |

---

## 3. Glassmorphic Card Architecture (`.cyber-card`)

Cards are rendered using an optimized GPU-accelerated CSS class:

```css
.cyber-card {
  background: rgba(18, 18, 18, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem; /* 12px */
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.cyber-card:hover {
  border-color: rgba(250, 204, 21, 0.28);
  box-shadow: 0 4px 24px -2px rgba(234, 179, 8, 0.1), inset 0 1px 0 rgba(250, 204, 21, 0.1);
}
```

---

## 4. Viewport Geometry & Motion Stabilization

To eliminate the common flaw of "screen bounce" and outer scrollbars moving the navigation bars up and down:
1. `html, body, #root`: Locked to `height: 100%; width: 100%; overflow: hidden !important;`
2. `DashboardLayout.jsx`: Root styled with `h-screen w-screen overflow-hidden flex flex-col`.
3. `Navbar.jsx`: Fixed height of `h-14 shrink-0`.
4. `Sidebar.jsx`: Full vertical height `h-full overflow-y-auto` independent of the main viewport.
5. `<main>` Element: Allocated `flex-1 h-full min-h-0 overflow-y-auto` so only the internal data tables scroll.
6. Custom Gold Scrollbars: Compact `6px` track styled with charcoal and electric yellow hover thumbs.

---

## 5. Typography & Readability

* **Primary Interface Font**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`.
* **Technical Monospace Font**: `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `Courier New`.
  * Used for IP addresses, TCP/UDP ports, timestamps, SHA256 hashes, rule codes, and raw logs.
* **Contrast Compliance**: Meets WCAG AA contrast standards. Bright yellow `#FACC15` text achieves an **11.2:1** contrast ratio against the `#070707` obsidian background.

---

## 6. Key Components Breakdown

### 1. Navigation Console (Sidebar)
* Features grouped into three functional zones:
  - **OPERATIONS**: SOC Dashboard, Events Explorer, Alerts Queue, Incident Hub.
  - **FORENSICS & INTEL**: IP Forensics, User Analytics, IOC Threat Hub.
  - **DEFENSE & AI**: Detection Rules, ML Models & Matrix, Executive PDF Audit.
* Real-time system telemetry HUD fixed to the sidebar base showing CPU/Memory, Ingestion Velocity, and Armed Detection state.

### 2. Command Navbar
* Electric yellow brand badge with shield icon.
* Live WebSocket connection indicator with green pulsation LED.
* **RUN SIMULATION** 1-Click synthetic APT injection button.
* User identity badge with role indicator (`ADMIN` / `ANALYST`) and logout trigger.

### 3. Log Ingestion Modal
* 1-Click quick load pills for 8 attack datasets.
* File drag-and-drop zone and raw text stream tab.
* Instant client-side feedback and validation error handling.
