# Forex Replay

A lightweight, high-performance **browser-based Forex market replay tool** for traders who want to practice technical analysis and order execution on historical data — with no internet connection, no broker account, and no installation required.

Built entirely with vanilla JavaScript and [Lightweight Charts™](https://github.com/tradingview/lightweight-charts) by TradingView.

---

## ✨ Features

### Replay Engine
- Loads **M1 CSV files exported from MetaTrader 5** (`.csv` / `.txt`, tab/semicolon/comma separated)
- Rebuilds any timeframe on-the-fly (1m → Daily) from raw M1 data
- Play, pause, step bar-by-bar, and adjust replay speed (1s down to 10ms)
- **Timezone-aware**: configure the CSV source timezone and the display timezone independently — switching timezones preserves the current zoom/scroll position and all drawings

### Drawing Tools

| Tool | Shortcut | Description |
|---|---|---|
| ➖ H-Line | 1 click | Full horizontal line extending in both directions |
| ⇥ Ray | 1 click | Horizontal ray — starts at anchor point, extends right; price label on the right edge |
| │ V-Line | 1 click (instant) | Vertical line with a floating date/time label |
| 📏 Trend | 2 clicks | Trend ray extending in the clicked direction |
| 🔲 Rect | 2 clicks | Rectangle with configurable fill |
| 📐 Fibo | 2 clicks | Fibonacci retracement with fully configurable levels |
| 🔤 Text | 1 click | Free text anchored to a price/time coordinate; double-click to edit |
| 🧲 Magnet | toggle | Snaps price to the nearest OHLC value |
| 🧽 Eraser | click | Removes individual objects |
| 🗑️ Clear | — | Removes all drawings at once |

All objects are **draggable** by their orange anchor points. V-Line and Ray creation is **instant on mousedown** (no click delay).

### Trading Module (Paper Trading)
- **Buy / Sell Market** — executes immediately at the current replay price
- **Visual Order Entry** — click directly on the chart to define entry, SL, and TP in sequence
- **Pending Orders** — auto-triggers Buy Stop / Buy Limit / Sell Stop / Sell Limit when price reaches the level
- **Drag SL/TP** lines directly on the chart to adjust after entry
- Real-time floating P&L and equity tracking per bar
- Account balance updates automatically on close

### Appearance Settings ⚙️
All settings persist automatically in `localStorage` and are restored on the next visit. Accessible via the gear button in the toolbar.

| Tab | Options |
|---|---|
| Chart | Background color, text/axis color, grid color |
| Candles | Body and wick colors for bullish and bearish candles |
| Drawings | Individual color per drawing tool |
| Fibonacci | Add, remove, and rename levels — supports extension levels (e.g. 1.618, 2.0, −0.618) |
| Language | Switch between **Português (BR)** and **English (US)** |

### Internationalization (i18n)
The entire interface — toolbar, trading panel, settings panel, alerts, and status messages — is fully translated. The selected language is saved to `localStorage`. Adding a new language requires only a new entry in `i18n.js`.

---

## 📂 File Structure

```
/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── globals.js    # Global state (window.App) and settings defaults
    ├── i18n.js       # Translations (pt-BR / en-US), t() and applyI18n()
    ├── drawings.js   # All drawing tools and canvas primitives
    ├── trading.js    # Paper trading engine
    ├── settings.js   # Settings panel — loads from localStorage, applies to chart
    └── app.js        # Chart init, CSV loading, replay loop
```

**Script load order matters** (reflected in `index.html`):
```
globals.js → i18n.js → drawings.js → trading.js → settings.js → app.js
```

---

## 🚀 Getting Started

This is a **pure static web app** — no build step, no package manager, no server required.

1. **Clone or download** the repository
2. **Open** `index.html` directly in your browser, or serve it with any static file server:
   ```bash
   # Python (built-in)
   python3 -m http.server 8080

   # Node.js
   npx serve .
   ```
3. **Export M1 data from MetaTrader 5:**
   - Open the **Navigator** → right-click your symbol → *Chart Window*
   - Or use **Tools → History Center**, select symbol + M1, export as CSV
4. **Load the file:** select the CSV, set the source timezone (default: UTC+2, MT5 winter), pick a date range, and press **Load / Carregar**
5. Press **▶ Play** or **+1 Bar** to start the replay

---

## ⌨️ Quick Reference

| Action | How |
|---|---|
| Play / Pause | Toolbar buttons or change speed while playing |
| Step one bar | **+1 Bar** button |
| Zoom | 🔍+ / 🔍− buttons, or scroll wheel on chart |
| Fit all | **🔍 Fit All** button |
| Draw | Select a tool → click on chart (V-Line and Ray respond on mousedown) |
| Edit text | Double-click the orange anchor point of a text object |
| Move object | Drag from an orange anchor point |
| Delete object | Select Eraser → click the object |
| Change language | ⚙️ → Language tab |
| Reset settings | ⚙️ → Defaults button (reloads the page) |

---

## 📦 Dependencies

| Library | Version | License |
|---|---|---|
| [Lightweight Charts™](https://github.com/tradingview/lightweight-charts) | 4.2.1 | Apache 2.0 |

No npm, no bundler, no framework. The library is loaded from a CDN — for offline use, download it and point the `<script>` tag to the local file.

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Tarcísio Allyson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgements

Chart rendering powered by [Lightweight Charts™](https://github.com/tradingview/lightweight-charts) © TradingView, Inc. (Apache 2.0).
