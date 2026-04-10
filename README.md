# Forex Replay

A lightweight, high-performance browser-based **Forex market replay tool** for traders who want to practice technical analysis and order execution on historical data — without needing an internet connection or a broker account.

Built entirely with vanilla JavaScript and [Lightweight Charts™](https://github.com/tradingview/lightweight-charts) by TradingView.

---

## ✨ Features

### Replay Engine
- Loads **M1 CSV files exported from MetaTrader 5** (`.csv` / `.txt`)
- Rebuilds any timeframe on-the-fly (1m → Daily) from M1 data
- Play, pause, step bar-by-bar, and adjust replay speed (1s → 10ms)
- Full timezone support: configure the CSV source timezone and the display timezone independently — timezone changes preserve the current chart view without losing position

### Drawing Tools
| Tool | Description |
|---|---|
| ➖ Linha | Full horizontal line (infinite both directions) |
| ⇥ Raio | Horizontal ray — starts at a point, extends right |
| │ Vert | Vertical line with date/time label |
| 📏 Tend | Trend line (ray extending in one direction) |
| 🔲 Rect | Rectangle with fill |
| 📐 Fibo | Fibonacci retracement with configurable levels |
| 🔤 Texto | Free text anchored to price/time |
| 🧲 Magneto | Snap price to OHLC of nearest candle |
| 🧽 Borracha | Erase individual objects |
| 🗑️ Limpar | Clear all drawings |

All objects are **draggable** by their anchor points.

### Trading Module (Paper Trading)
- **Buy / Sell Market** orders
- **Visual Order Entry** — click directly on the chart to set entry, SL, and TP
- **Pending Orders** — auto-triggers Buy Stop / Buy Limit / Sell Stop / Sell Limit
- **Drag SL/TP** lines directly on the chart to adjust after entry
- Real-time floating P&L and equity tracking
- Account balance updates on close

### Appearance Settings (⚙️)
All settings are saved automatically to `localStorage`:
- **Chart** — background color, text/axis color, grid color
- **Candles** — body and wick colors for bullish and bearish candles
- **Drawings** — individual color per drawing tool
- **Fibonacci** — add, remove, and rename retracement levels; supports extension levels (e.g. 1.618, 2.0)

---

## 📂 File Structure

```
/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── globals.js      # Global state (window.App) and settings defaults
    ├── settings.js     # Settings panel — loads from localStorage, applies to chart
    ├── drawings.js     # All drawing tools and canvas primitives
    ├── trading.js      # Paper trading engine
    └── app.js          # Chart init, CSV loading, replay loop
```

---

## 🚀 Getting Started

This is a **pure static web app** — no build step, no server required.

1. Clone or download the repository
2. Open `index.html` directly in your browser, **or** serve it with any static file server:
   ```bash
   # Python (built-in)
   python3 -m http.server 8080

   # Node.js (npx)
   npx serve .
   ```
3. Export M1 data from MetaTrader 5:
   - Open **History Center** (`Tools → History Center`)
   - Select your symbol and M1 timeframe
   - Export as CSV
4. Load the CSV, set the timezone, pick a date range, and press **Carregar**
5. Press **▶ Play** or **⏭ +1 Barra** to start the replay

---

## 📦 Dependencies

| Library | Version | License |
|---|---|---|
| [Lightweight Charts™](https://github.com/tradingview/lightweight-charts) | 4.2.1 | Apache 2.0 |

No other runtime dependencies. No npm, no bundler, no framework.

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 [Your Name or Project Name]

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

### Why MIT?

The only dependency — Lightweight Charts™ — uses the **Apache License 2.0**, which is permissive and fully compatible with MIT. Choosing MIT for your own code means:

- ✅ Anyone can use, copy, modify, and distribute your project
- ✅ Commercial use is allowed
- ✅ No obligation to open-source derivative works
- ✅ Compatible with Apache 2.0 (you must keep the LightweightCharts license notice)
- ✅ Widely recognized and understood by developers worldwide

The only requirement is that you **keep the copyright notice** in all copies or distributions (a one-line attribution).

> **Note:** If you want to **ensure all forks and modifications remain open source**, consider **GPL v3** instead. GPL v3 is also compatible with Apache 2.0 in this direction. However, it prevents commercial closed-source use — choose based on your goals.

---

## 🙏 Acknowledgements

- Chart rendering powered by [Lightweight Charts™](https://github.com/tradingview/lightweight-charts) © TradingView, Inc. (Apache 2.0)
