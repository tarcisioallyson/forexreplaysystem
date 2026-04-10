// js/app.js
function initChart() {
    const container = document.getElementById('chart-container');
    const s = window.App.settings;

    window.App.chart = LightweightCharts.createChart(container, {
        layout: {
            background: { type: 'solid', color: s.chart.background },
            textColor: s.chart.textColor
        },
        grid: {
            vertLines: { color: s.chart.gridColor, visible: true },
            horzLines: { color: s.chart.gridColor, visible: true }
        },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        timeScale: { timeVisible: true, secondsVisible: false }
    });

    window.App.candleSeries = window.App.chart.addCandlestickSeries({
        upColor: s.candles.upColor, downColor: s.candles.downColor,
        borderVisible: false,
        wickUpColor: s.candles.wickUpColor, wickDownColor: s.candles.wickDownColor,
    });

    new ResizeObserver(entries => {
        if (!entries.length || entries[0].target !== container) return;
        const r = entries[0].contentRect;
        if (r.width > 0 && r.height > 0) window.App.chart.resize(r.width, r.height);
    }).observe(container);

    if (typeof setupDrawings      === 'function') setupDrawings();
    if (typeof setupTrading       === 'function') setupTrading();
    if (typeof setupSettingsPanel === 'function') setupSettingsPanel();

    window.App.currentTargetTz = parseFloat(document.getElementById('display-tz').value);
}

// ─── CARREGAR CSV ─────────────────────────────────────────────────────────────
document.getElementById('btn-load').addEventListener('click', () => {
    const fileInput = document.getElementById('csv-file').files[0];
    if (!fileInput) return alert(t('alert.noFile'));

    document.getElementById('status-text').innerText = t('status.reading');
    document.getElementById('btn-load').disabled = true;

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('status-text').innerText = t('status.processing');
        setTimeout(() => {
            const text = e.target.result;
            let sep = '\t';
            if (text.indexOf('\t') === -1) sep = text.indexOf(';') !== -1 ? ';' : ',';

            const lines = text.trim().split('\n');
            const total = lines.length;

            window.App.historyM1 = []; window.App.replayM1 = [];
            window.App.replayIndex = 0; window.App.currentTfCandle = null;
            let decimalsSet = false;

            const sourceTz  = parseFloat(document.getElementById('csv-tz').value);
            const displayTz = parseFloat(document.getElementById('display-tz').value);
            window.App.currentTargetTz = displayTz;

            const startStr = document.getElementById('start-date').value;
            const endStr   = document.getElementById('end-date').value;
            const startTs  = startStr ? (new Date(startStr+'T00:00:00Z').getTime()/1000) - (displayTz*3600) : 0;
            const endTs    = endStr   ? (new Date(endStr  +'T23:59:59Z').getTime()/1000) - (displayTz*3600) : Infinity;

            let idx = 1;
            const chunk = 50000;

            function processChunk() {
                const end = Math.min(idx + chunk, total);
                for (; idx < end; idx++) {
                    const cols = lines[idx].trim().split(sep);
                    if (cols.length < 6) continue;
                    if (!decimalsSet && cols[5].includes('.')) {
                        const nd = cols[5].split('.')[1].length;
                        window.App.candleSeries.applyOptions({
                            priceFormat: { type:'price', precision:nd, minMove:1/Math.pow(10,nd) }
                        });
                        window.App.point = 1/Math.pow(10,nd);
                        decimalsSet = true;
                    }
                    const dp=cols[0].split('.'), tp=cols[1].split(':');
                    const ts=Date.UTC(parseInt(dp[0]),parseInt(dp[1])-1,parseInt(dp[2]),
                        parseInt(tp[0]),parseInt(tp[1]),parseInt(tp[2]||0))/1000;
                    const utc=ts-(sourceTz*3600);
                    const candle={time:utc,open:parseFloat(cols[2]),high:parseFloat(cols[3]),low:parseFloat(cols[4]),close:parseFloat(cols[5])};
                    if (utc<startTs) window.App.historyM1.push(candle);
                    else if (utc<=endTs) window.App.replayM1.push(candle);
                }
                if (idx < total) {
                    document.getElementById('status-text').innerText = t('status.filtering', Math.round(idx/total*100));
                    setTimeout(processChunk, 0);
                } else {
                    if (window.App.replayM1.length === 0) {
                        alert(t('alert.noData'));
                        document.getElementById('btn-load').disabled = false;
                        document.getElementById('status-text').innerText = t('status.waiting');
                        return;
                    }
                    document.getElementById('status-text').innerText =
                        t('status.loaded', window.App.historyM1.length, window.App.replayM1.length);
                    document.getElementById('btn-play').disabled = false;
                    document.getElementById('btn-step').disabled = false;
                    document.getElementById('btn-load').disabled = false;
                    renderCurrentView();
                    window.App.chart.timeScale().fitContent();
                }
            }
            processChunk();
        }, 50);
    };
    reader.readAsText(fileInput);
});

// ─── TIMEFRAME ────────────────────────────────────────────────────────────────
function buildTimeframeData(m1Array, tfMinutes) {
    const tfSec = tfMinutes*60, shift = (window.App.currentTargetTz||0)*3600;
    const aggregated = []; let current = null;
    for (const m1 of m1Array) {
        const aligned = Math.floor((m1.time+shift)/tfSec)*tfSec;
        if (!current || current.time !== aligned) {
            if (current) aggregated.push({...current});
            current = {time:aligned,open:m1.open,high:m1.high,low:m1.low,close:m1.close};
        } else {
            current.high=Math.max(current.high,m1.high);
            current.low=Math.min(current.low,m1.low);
            current.close=m1.close;
        }
    }
    if (current) aggregated.push({...current});
    return { aggregated, lastCandle:current };
}

function renderCurrentView() {
    const tf = parseInt(document.getElementById('timeframe').value);
    const combined = window.App.historyM1.concat(window.App.replayM1.slice(0,window.App.replayIndex));
    const { aggregated, lastCandle } = buildTimeframeData(combined, tf);
    window.App.candleSeries.setData(aggregated);
    window.App.currentTfCandle = lastCandle ? {...lastCandle} : null;
}

document.getElementById('timeframe').addEventListener('change', () => {
    if (window.App.historyM1.length>0||window.App.replayM1.length>0) renderCurrentView();
});

// ─── FUSO HORÁRIO ─────────────────────────────────────────────────────────────
document.getElementById('display-tz').addEventListener('change', e => {
    window.App.currentTargetTz = parseFloat(e.target.value);
    if (window.App.historyM1 && (window.App.historyM1.length>0||window.App.replayM1.length>0)) {
        const ts=window.App.chart.timeScale(), lr=ts.getVisibleLogicalRange();
        renderCurrentView();
        if (window.App.drawingsPrimitives) window.App.drawingsPrimitives.forEach(p=>p.updateAllViews());
        if (lr) ts.setVisibleLogicalRange(lr);
    }
});

// ─── REPLAY ───────────────────────────────────────────────────────────────────
function nextReplayStep() {
    if (window.App.replayIndex >= window.App.replayM1.length) {
        if (window.App.replayInterval) clearInterval(window.App.replayInterval);
        document.getElementById('btn-play').disabled  = false;
        document.getElementById('btn-pause').disabled = true;
        document.getElementById('btn-step').disabled  = true;
        alert(t('alert.replayDone'));
        return;
    }
    const tf=parseInt(document.getElementById('timeframe').value), tfSec=tf*60;
    const m1=window.App.replayM1[window.App.replayIndex];
    const shift=(window.App.currentTargetTz||0)*3600;
    const aligned=Math.floor((m1.time+shift)/tfSec)*tfSec;

    if (!window.App.currentTfCandle||window.App.currentTfCandle.time!==aligned) {
        window.App.currentTfCandle={time:aligned,open:m1.open,high:m1.high,low:m1.low,close:m1.close};
    } else {
        window.App.currentTfCandle.high=Math.max(window.App.currentTfCandle.high,m1.high);
        window.App.currentTfCandle.low=Math.min(window.App.currentTfCandle.low,m1.low);
        window.App.currentTfCandle.close=m1.close;
    }
    window.App.candleSeries.update(window.App.currentTfCandle);
    window.App.replayIndex++;
    if (typeof updateTrading==='function') updateTrading(m1);
}

document.getElementById('btn-play').addEventListener('click', () => {
    const speed=parseInt(document.getElementById('speed').value);
    document.getElementById('btn-play').disabled=true;
    document.getElementById('btn-pause').disabled=false;
    window.App.replayInterval=setInterval(nextReplayStep,speed);
});
document.getElementById('btn-pause').addEventListener('click', () => {
    clearInterval(window.App.replayInterval);
    document.getElementById('btn-play').disabled=false;
    document.getElementById('btn-pause').disabled=true;
});
document.getElementById('btn-step').addEventListener('click', nextReplayStep);
document.getElementById('speed').addEventListener('change', () => {
    if (!document.getElementById('btn-pause').disabled) {
        clearInterval(window.App.replayInterval);
        window.App.replayInterval=setInterval(nextReplayStep,parseInt(document.getElementById('speed').value));
    }
});

// ─── ZOOM ─────────────────────────────────────────────────────────────────────
document.getElementById('btn-zoom-in').addEventListener('click', () => {
    if (!window.App.chart) return;
    const ts=window.App.chart.timeScale(), r=ts.getVisibleLogicalRange();
    if (r) { const d=r.to-r.from; ts.setVisibleLogicalRange({from:r.from+d*0.15,to:r.to-d*0.15}); }
});
document.getElementById('btn-zoom-out').addEventListener('click', () => {
    if (!window.App.chart) return;
    const ts=window.App.chart.timeScale(), r=ts.getVisibleLogicalRange();
    if (r) { const d=r.to-r.from; ts.setVisibleLogicalRange({from:r.from-d*0.15,to:r.to+d*0.15}); }
});
document.getElementById('btn-zoom-reset').addEventListener('click', () => {
    if (!window.App.chart) return;
    window.App.chart.timeScale().fitContent();
    window.App.candleSeries.priceScale().applyOptions({autoScale:true});
});

initChart();
