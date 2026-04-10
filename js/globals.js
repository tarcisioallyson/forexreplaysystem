// js/globals.js
window.App = {
    chart: null,
    candleSeries: null,

    currentTargetTz: null,

    historyM1: [],
    replayM1: [],
    replayIndex: 0,
    replayInterval: null,
    currentTfCandle: null,
    point: 0.00001,

    magnetMode: false,
    gridVisible: true,
    currentTool: null,
    drawingStep: 0,
    currentPrimitive: null,
    drawingsPrimitives: [],
    priceLines: [],
    lastCrosshairParam: null,
    draggedPrimitive: null,
    dragTarget: null,
    draggedTradeLine: null,

    account: { balance: 10000.00, equity: 10000.00 },
    positions: [],
    pendingOrders: [],

    tradeSetup: {
        active: false, step: 0, type: null,
        lot: 0.1, price: null, sl: null, tp: null, tempLine: null
    },

    settings: {
        language: 'pt-BR',   // ← idioma da interface
        chart: {
            background: '#131722',
            textColor:  '#d1d4dc',
            gridColor:  '#2a2e39',
        },
        candles: {
            upColor:       '#26a69a',
            downColor:     '#ef5350',
            wickUpColor:   '#26a69a',
            wickDownColor: '#ef5350',
        },
        drawings: {
            hline: '#2962ff',
            hray:  '#26a69a',
            vline: '#2962ff',
            trend: '#2962ff',
            rect:  '#2962ff',
            fibo:  '#ff9800',
            text:  '#e2b022',
        },
        fibo: {
            levels: [
                { value: 0,     label: '0%'    },
                { value: 0.236, label: '23.6%' },
                { value: 0.382, label: '38.2%' },
                { value: 0.5,   label: '50%'   },
                { value: 0.618, label: '61.8%' },
                { value: 0.705, label: '70.5%' },
                { value: 0.786, label: '78.6%' },
                { value: 1,     label: '100%'  },
            ]
        }
    }
};
