// js/settings.js

// ─── CARREGAR DO LOCALSTORAGE ─────────────────────────────────────────────────
(function loadFromStorage() {
    try {
        const raw = localStorage.getItem('forex-replay-settings');
        if (!raw) return;
        const saved = JSON.parse(raw);
        function merge(target, source) {
            if (!source || typeof source !== 'object') return;
            for (const key of Object.keys(source)) {
                if (!(key in target)) continue;
                if (Array.isArray(target[key])) { target[key] = source[key]; }
                else if (typeof target[key] === 'object') { merge(target[key], source[key]); }
                else { target[key] = source[key]; }
            }
        }
        merge(window.App.settings, saved);
    } catch (e) { console.warn('[Settings] Failed to load saved settings:', e); }

    // Aplica idioma carregado assim que o DOM está disponível
    applyI18n();
})();

// ─── PERSISTÊNCIA ─────────────────────────────────────────────────────────────
function saveSettings() {
    try { localStorage.setItem('forex-replay-settings', JSON.stringify(window.App.settings)); }
    catch (e) {}
}

// ─── APLICAR AO GRÁFICO ───────────────────────────────────────────────────────
function applyChartSettings() {
    if (!window.App.chart) return;
    const s = window.App.settings.chart;
    window.App.chart.applyOptions({
        layout: { background: { type: 'solid', color: s.background }, textColor: s.textColor },
        grid:   { vertLines: { color: s.gridColor }, horzLines: { color: s.gridColor } },
    });
}

function applyCandleSettings() {
    if (!window.App.candleSeries) return;
    const s = window.App.settings.candles;
    window.App.candleSeries.applyOptions({
        upColor: s.upColor, downColor: s.downColor,
        wickUpColor: s.wickUpColor, wickDownColor: s.wickDownColor,
    });
}

function applyDrawingsSettings() {
    if (!window.App.drawingsPrimitives) return;
    window.App.drawingsPrimitives.forEach(p => {
        if (p.priceLine && window.App.settings.drawings[p.type]) {
            p.priceLine.applyOptions({ color: window.App.settings.drawings[p.type] });
        }
        p.updateAllViews();
    });
}

function applyAllSettings() {
    applyChartSettings();
    applyCandleSettings();
    applyDrawingsSettings();
}

// ─── PAINEL ───────────────────────────────────────────────────────────────────
function setupSettingsPanel() {
    const btn = document.getElementById('btn-settings');
    if (!btn) return;

    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.innerHTML = buildPanelHTML();
    document.body.appendChild(panel);

    // Aplica traduções ao painel recém criado
    applyI18n();
    syncLangSelect();

    // Abre / fecha
    btn.addEventListener('click', () => {
        const isOpen = panel.classList.toggle('open');
        if (isOpen) { syncInputsToSettings(); syncLangSelect(); }
    });
    document.getElementById('sp-close').addEventListener('click', () => panel.classList.remove('open'));
    document.addEventListener('mousedown', e => {
        if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn)
            panel.classList.remove('open');
    });

    // Tabs
    panel.querySelectorAll('.sp-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            panel.querySelectorAll('.sp-tab, .sp-section').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('spsec-' + this.dataset.tab).classList.add('active');
        });
    });

    // Cores – gráfico
    wireColor('sp-bg',       v => { window.App.settings.chart.background = v; applyChartSettings(); });
    wireColor('sp-text',     v => { window.App.settings.chart.textColor  = v; applyChartSettings(); });
    wireColor('sp-grid',     v => { window.App.settings.chart.gridColor  = v; applyChartSettings(); });
    // Cores – candles
    wireColor('sp-cup',      v => { window.App.settings.candles.upColor       = v; applyCandleSettings(); });
    wireColor('sp-cdown',    v => { window.App.settings.candles.downColor     = v; applyCandleSettings(); });
    wireColor('sp-wickup',   v => { window.App.settings.candles.wickUpColor   = v; applyCandleSettings(); });
    wireColor('sp-wickdown', v => { window.App.settings.candles.wickDownColor = v; applyCandleSettings(); });
    // Cores – desenhos
    ['hline','hray','vline','trend','rect','fibo','text'].forEach(type => {
        wireColor('sp-d-' + type, v => { window.App.settings.drawings[type] = v; applyDrawingsSettings(); });
    });

    // Fibonacci
    document.getElementById('sp-fibo-add').addEventListener('click', () => {
        const inp = document.getElementById('sp-fibo-new-val');
        const val = parseFloat(inp.value);
        if (isNaN(val)) return;
        window.App.settings.fibo.levels.push({ value: val, label: `${(val*100).toFixed(1)}%` });
        window.App.settings.fibo.levels.sort((a,b) => a.value - b.value);
        inp.value = '';
        saveSettings(); renderFiboList(); applyDrawingsSettings();
    });

    // Idioma
    document.getElementById('sp-lang-select').addEventListener('change', e => {
        window.App.settings.language = e.target.value;
        saveSettings();
        applyI18n();                // atualiza todos os data-i18n do DOM
        renderFiboList();           // re-renderiza conteúdo dinâmico
        if (typeof renderTradingPanel === 'function') renderTradingPanel();
    });

    // Restaurar padrões
    document.getElementById('sp-reset').addEventListener('click', () => {
        if (!confirm(t('alert.resetConfirm'))) return;
        localStorage.removeItem('forex-replay-settings');
        location.reload();
    });

    renderFiboList();
}

function wireColor(id, onChange) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', e => { onChange(e.target.value); saveSettings(); });
}

function syncInputsToSettings() {
    const s = window.App.settings;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('sp-bg',       s.chart.background);
    set('sp-text',     s.chart.textColor);
    set('sp-grid',     s.chart.gridColor);
    set('sp-cup',      s.candles.upColor);
    set('sp-cdown',    s.candles.downColor);
    set('sp-wickup',   s.candles.wickUpColor);
    set('sp-wickdown', s.candles.wickDownColor);
    ['hline','hray','vline','trend','rect','fibo','text'].forEach(tp => set('sp-d-'+tp, s.drawings[tp]));
    renderFiboList();
}

function syncLangSelect() {
    const el = document.getElementById('sp-lang-select');
    if (el) el.value = window.App.settings.language || 'pt-BR';
}

function renderFiboList() {
    const list = document.getElementById('sp-fibo-list');
    if (!list) return;
    list.innerHTML = '';
    window.App.settings.fibo.levels.forEach((lvl, idx) => {
        const row = document.createElement('div');
        row.className = 'sp-fibo-row';
        row.innerHTML = `
            <input class="sp-fibo-val" type="number" value="${lvl.value}" step="0.001" min="0" max="4">
            <input class="sp-fibo-lbl" type="text"   value="${lvl.label}" placeholder="Label">
            <button class="sp-fibo-del">✕</button>`;
        row.querySelector('.sp-fibo-val').addEventListener('change', e => {
            window.App.settings.fibo.levels[idx].value = parseFloat(e.target.value) || 0;
            saveSettings(); applyDrawingsSettings();
        });
        row.querySelector('.sp-fibo-lbl').addEventListener('input', e => {
            window.App.settings.fibo.levels[idx].label = e.target.value;
            saveSettings(); applyDrawingsSettings();
        });
        row.querySelector('.sp-fibo-del').addEventListener('click', () => {
            window.App.settings.fibo.levels.splice(idx, 1);
            saveSettings(); renderFiboList(); applyDrawingsSettings();
        });
        list.appendChild(row);
    });
}

// ─── HTML DO PAINEL (usa data-i18n; applyI18n() preenche os textos) ───────────
function buildPanelHTML() {
    const drawingTypes = ['hline','hray','vline','trend','rect','fibo','text'];
    const drawingRows = drawingTypes.map(tp => `
        <div class="sp-row">
            <label data-i18n="drawing.${tp}"></label>
            <input type="color" id="sp-d-${tp}">
        </div>`).join('');

    return `
        <div class="sp-header">
            <span data-i18n="settings.title"></span>
            <div style="display:flex;gap:8px;align-items:center;">
                <button id="sp-reset" class="sp-reset-btn" data-i18n="settings.reset"></button>
                <button id="sp-close" class="sp-close-btn">✕</button>
            </div>
        </div>

        <div class="sp-tabs">
            <button class="sp-tab active" data-tab="chart"    data-i18n="settings.tabChart"></button>
            <button class="sp-tab"        data-tab="candles"  data-i18n="settings.tabCandles"></button>
            <button class="sp-tab"        data-tab="drawings" data-i18n="settings.tabDrawings"></button>
            <button class="sp-tab"        data-tab="fibo"     data-i18n="settings.tabFibo"></button>
            <button class="sp-tab"        data-tab="lang"     data-i18n="settings.tabLang"></button>
        </div>

        <div class="sp-body">

            <!-- GRÁFICO -->
            <div class="sp-section active" id="spsec-chart">
                <p class="sp-section-hint" data-i18n="settings.chartHint"></p>
                <div class="sp-row"><label data-i18n="settings.bg"></label>        <input type="color" id="sp-bg"></div>
                <div class="sp-row"><label data-i18n="settings.textColor"></label> <input type="color" id="sp-text"></div>
                <div class="sp-row"><label data-i18n="settings.gridColor"></label> <input type="color" id="sp-grid"></div>
            </div>

            <!-- CANDLES -->
            <div class="sp-section" id="spsec-candles">
                <p class="sp-section-hint" data-i18n="settings.candlesHint"></p>
                <div class="sp-row"><label data-i18n="settings.upBody"></label>   <input type="color" id="sp-cup"></div>
                <div class="sp-row"><label data-i18n="settings.downBody"></label> <input type="color" id="sp-cdown"></div>
                <div class="sp-row"><label data-i18n="settings.upWick"></label>   <input type="color" id="sp-wickup"></div>
                <div class="sp-row"><label data-i18n="settings.downWick"></label> <input type="color" id="sp-wickdown"></div>
            </div>

            <!-- DESENHOS -->
            <div class="sp-section" id="spsec-drawings">
                <p class="sp-section-hint" data-i18n="settings.drawingsHint"></p>
                ${drawingRows}
            </div>

            <!-- FIBONACCI -->
            <div class="sp-section" id="spsec-fibo">
                <p class="sp-section-hint" data-i18n="settings.fiboHint"></p>
                <div id="sp-fibo-list"></div>
                <div class="sp-fibo-add-row">
                    <input type="number" id="sp-fibo-new-val" step="0.001" min="0" max="4"
                           data-i18n-placeholder="settings.fiboPlaceholder">
                    <button id="sp-fibo-add" data-i18n="settings.fiboAdd"></button>
                </div>
            </div>

            <!-- IDIOMA -->
            <div class="sp-section" id="spsec-lang">
                <p class="sp-section-hint" data-i18n="settings.langHint"></p>
                <div class="sp-row">
                    <label data-i18n="settings.langLabel"></label>
                    <select id="sp-lang-select" style="background:#2a2e39;color:#d1d4dc;border:1px solid #363c4e;padding:5px 8px;border-radius:4px;font-size:13px;">
                        <option value="pt-BR">Português (BR)</option>
                        <option value="en-US">English (US)</option>
                    </select>
                </div>
            </div>

        </div>`;
}
