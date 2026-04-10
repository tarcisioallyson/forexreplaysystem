// js/trading.js
const CONTRACT_SIZE = 100000;

function renderTradingPanel() {
    document.getElementById('val-balance').innerText = `$${window.App.account.balance.toFixed(2)}`;
    document.getElementById('val-equity').innerText  = `$${window.App.account.equity.toFixed(2)}`;

    const pnlEl    = document.getElementById('val-pnl');
    const totalPnl = window.App.positions.reduce((s,p)=>s+p.pnl, 0);
    pnlEl.innerText  = `$${totalPnl.toFixed(2)}`;
    pnlEl.className  = totalPnl>0?'positive':(totalPnl<0?'negative':'neutral');

    const listEl = document.getElementById('positions-list');
    listEl.innerHTML = '';

    window.App.positions.forEach(p => {
        const isBuy = p.type==='BUY';
        listEl.innerHTML += `
            <div class="trade-item">
                <div class="trade-item-header">
                    <span class="${isBuy?'positive':'negative'}">${p.type} ${p.lot}</span>
                    <button class="trade-close-btn" onclick="closePosition('${p.id}')">X</button>
                </div>
                <div>${t('trading.openPrice')} ${p.openPrice.toFixed(5)}</div>
                <div>${t('trading.pnl')} <span class="${p.pnl>=0?'positive':'negative'}">$${p.pnl.toFixed(2)}</span></div>
            </div>`;
    });

    window.App.pendingOrders.forEach(o => {
        listEl.innerHTML += `
            <div class="trade-item" style="border-left:3px solid #e2b022;">
                <div class="trade-item-header">
                    <span style="color:#e2b022">${o.type} ${o.lot}</span>
                    <button class="trade-close-btn" onclick="cancelPending('${o.id}')">X</button>
                </div>
                <div>${t('trading.target')} ${o.price.toFixed(5)}</div>
                <div>${t('trading.waiting')}</div>
            </div>`;
    });
}

function updateTrading(candleM1) {
    if (!candleM1) return;
    const cur = candleM1.close;
    let modified = false;

    for (let i=window.App.positions.length-1;i>=0;i--) {
        const pos=window.App.positions[i];
        pos.pnl = pos.type==='BUY'
            ? (cur-pos.openPrice)*CONTRACT_SIZE*pos.lot
            : (pos.openPrice-cur)*CONTRACT_SIZE*pos.lot;

        let closed=false;
        if (pos.type==='BUY') {
            if (pos.sl&&candleM1.low<=pos.sl)  closed=true;
            else if (pos.tp&&candleM1.high>=pos.tp) closed=true;
        } else {
            if (pos.sl&&candleM1.high>=pos.sl) closed=true;
            else if (pos.tp&&candleM1.low<=pos.tp)  closed=true;
        }
        if (closed) {
            window.App.account.balance+=pos.pnl;
            removeTradeVisuals(pos.id);
            window.App.positions.splice(i,1);
        }
        modified=true;
    }

    for (let i=window.App.pendingOrders.length-1;i>=0;i--) {
        const order=window.App.pendingOrders[i];
        let triggered=false;
        if (order.type==='BUY_STOP'   && candleM1.high>=order.price) triggered=true;
        if (order.type==='BUY_LIMIT'  && candleM1.low<=order.price)  triggered=true;
        if (order.type==='SELL_STOP'  && candleM1.low<=order.price)  triggered=true;
        if (order.type==='SELL_LIMIT' && candleM1.high>=order.price) triggered=true;
        if (triggered) {
            removeTradeVisuals(order.id);
            openPosition(order.type.split('_')[0], order.lot, order.price, order.sl, order.tp);
            window.App.pendingOrders.splice(i,1);
            modified=true;
        }
    }

    if (modified) {
        window.App.account.equity = window.App.account.balance + window.App.positions.reduce((s,p)=>s+p.pnl,0);
        renderTradingPanel();
    }
}

function openPosition(type, lot, price, sl, tp) {
    const id  = 'POS_'+Date.now()+Math.random().toString(16).slice(2);
    const pos = { id, type, lot, openPrice:price, sl, tp, pnl:0, visuals:[] };
    const col = type==='BUY'?'#26a69a':'#ef5350';

    pos.visuals.push(window.App.candleSeries.createPriceLine({
        price, color:col, lineWidth:2,
        lineStyle:LightweightCharts.LineStyle.Solid, title:`${type} ${lot}`
    }));
    if (sl) pos.visuals.push(window.App.candleSeries.createPriceLine({
        price:sl, color:'#ef5350', lineWidth:1,
        lineStyle:LightweightCharts.LineStyle.Dashed, title:t('line.sl')
    }));
    if (tp) pos.visuals.push(window.App.candleSeries.createPriceLine({
        price:tp, color:'#26a69a', lineWidth:1,
        lineStyle:LightweightCharts.LineStyle.Dashed, title:t('line.tp')
    }));

    window.App.positions.push(pos);
    renderTradingPanel();
}

function openMarketOrder(type) {
    if (!window.App.currentTfCandle) return alert(t('alert.noReplay'));
    const lot   = parseFloat(document.getElementById('trade-lot').value)||0.1;
    const price = window.App.currentTfCandle.close;
    const slPts = parseFloat(document.getElementById('oco-sl').value);
    const tpPts = parseFloat(document.getElementById('oco-tp').value);
    let sl=null, tp=null;
    if (type==='BUY') {
        if (!isNaN(slPts)&&slPts>0) sl=price-(slPts*window.App.point);
        if (!isNaN(tpPts)&&tpPts>0) tp=price+(tpPts*window.App.point);
    } else {
        if (!isNaN(slPts)&&slPts>0) sl=price+(slPts*window.App.point);
        if (!isNaN(tpPts)&&tpPts>0) tp=price-(tpPts*window.App.point);
    }
    openPosition(type, lot, price, sl, tp);
}

function closePosition(id) {
    const idx=window.App.positions.findIndex(p=>p.id===id);
    if (idx>-1) {
        window.App.account.balance+=window.App.positions[idx].pnl;
        removeTradeVisuals(id);
        window.App.positions.splice(idx,1);
        renderTradingPanel();
    }
}

function cancelPending(id) {
    const idx=window.App.pendingOrders.findIndex(o=>o.id===id);
    if (idx>-1) {
        removeTradeVisuals(id);
        window.App.pendingOrders.splice(idx,1);
        renderTradingPanel();
    }
}

function removeTradeVisuals(id) {
    const pos=window.App.positions.find(p=>p.id===id)||window.App.pendingOrders.find(o=>o.id===id);
    if (pos&&pos.visuals) {
        pos.visuals.forEach(l=>{ try{window.App.candleSeries.removePriceLine(l);}catch(e){} });
        pos.visuals=[];
    }
}

function startVisualOrder(type) {
    if (!window.App.currentTfCandle) return alert(t('alert.noReplay'));
    ['hline','vline','rect','fibo','trend','eraser'].forEach(id=>{
        const el=document.getElementById(`btn-${id}`);
        if(el) el.classList.remove('active');
    });
    window.App.currentTool=null;
    document.getElementById('chart-container').classList.remove('cursor-eraser');

    window.App.tradeSetup={
        active:true, step:0, type,
        lot:parseFloat(document.getElementById('trade-lot').value)||0.1,
        price:null, sl:null, tp:null, tempLine:null, visualLines:[]
    };

    window.App.chart.applyOptions({crosshair:{mode:LightweightCharts.CrosshairMode.Magnet}});

    window.App.tradeSetup.tempLine=window.App.candleSeries.createPriceLine({
        price:window.App.currentTfCandle.close, color:'#e2b022', lineWidth:2,
        lineStyle:LightweightCharts.LineStyle.Dashed,
        title:t(type==='VISUAL_BUY'?'line.priceVisualBuy':'line.priceVisualSell')
    });
}

function setupTrading() {
    renderTradingPanel();
    window.App.draggedTradeLine=null;

    window.App.chart.subscribeCrosshairMove(param=>{
        if (!param.point) return;
        if (window.App.tradeSetup&&window.App.tradeSetup.active) {
            const price=window.App.candleSeries.coordinateToPrice(param.point.y);
            if (window.App.tradeSetup.tempLine&&price!==null)
                window.App.tradeSetup.tempLine.applyOptions({price});
        }
        if (window.App.draggedTradeLine) {
            let price=window.App.candleSeries.coordinateToPrice(param.point.y);
            if (window.App.magnetMode&&window.App.lastCrosshairParam) {
                const data=window.App.lastCrosshairParam.seriesData.get(window.App.candleSeries);
                if (data) {
                    const ps=[data.open,data.high,data.low,data.close].filter(v=>v!==undefined);
                    if (ps.length) price=ps.reduce((pv,cv)=>Math.abs(cv-price)<Math.abs(pv-price)?cv:pv);
                }
            }
            const {trade,type}=window.App.draggedTradeLine;
            trade[type]=price;
            const titleMap={sl:t('line.sl'),tp:t('line.tp'),price:trade.type};
            const line=trade.visuals.find(l=>l.options().title.startsWith(titleMap[type]));
            if (line) line.applyOptions({price});
        }
    });

    const container=document.getElementById('chart-container');
    if (container) {
        container.addEventListener('mousedown', e=>{
            if (window.App.currentTool||window.App.draggedPrimitive) return;
            if (!window.App.lastCrosshairParam||!window.App.lastCrosshairParam.point) return;
            const pt=window.App.lastCrosshairParam.point, thr=12;
            for (let i=window.App.positions.length-1;i>=0;i--) {
                const pos=window.App.positions[i];
                if (pos.sl) { const y=window.App.candleSeries.priceToCoordinate(pos.sl); if (y!==null&&Math.abs(pt.y-y)<thr){window.App.draggedTradeLine={trade:pos,type:'sl'};window.App.chart.applyOptions({handleScroll:false,handleScale:false});return;} }
                if (pos.tp) { const y=window.App.candleSeries.priceToCoordinate(pos.tp); if (y!==null&&Math.abs(pt.y-y)<thr){window.App.draggedTradeLine={trade:pos,type:'tp'};window.App.chart.applyOptions({handleScroll:false,handleScale:false});return;} }
            }
            for (let i=window.App.pendingOrders.length-1;i>=0;i--) {
                const ord=window.App.pendingOrders[i];
                if (ord.sl) { const y=window.App.candleSeries.priceToCoordinate(ord.sl); if (y!==null&&Math.abs(pt.y-y)<thr){window.App.draggedTradeLine={trade:ord,type:'sl'};window.App.chart.applyOptions({handleScroll:false,handleScale:false});return;} }
                if (ord.tp) { const y=window.App.candleSeries.priceToCoordinate(ord.tp); if (y!==null&&Math.abs(pt.y-y)<thr){window.App.draggedTradeLine={trade:ord,type:'tp'};window.App.chart.applyOptions({handleScroll:false,handleScale:false});return;} }
                const y=window.App.candleSeries.priceToCoordinate(ord.price);
                if (y!==null&&Math.abs(pt.y-y)<thr){window.App.draggedTradeLine={trade:ord,type:'price'};window.App.chart.applyOptions({handleScroll:false,handleScale:false});return;}
            }
        });
        const stopTrade=()=>{
            if (window.App.draggedTradeLine){
                window.App.draggedTradeLine=null;
                window.App.chart.applyOptions({handleScroll:true,handleScale:true});
                renderTradingPanel();
            }
        };
        container.addEventListener('mouseup',    stopTrade);
        container.addEventListener('mouseleave', stopTrade);
    }

    window.App.chart.subscribeClick(param=>{
        if (!window.App.tradeSetup||!window.App.tradeSetup.active||!param.point) return;
        const price=window.App.candleSeries.coordinateToPrice(param.point.y);
        const st=window.App.tradeSetup;

        if (st.step===0) {
            st.price=price; st.step=1;
            st.visualLines.push(window.App.candleSeries.createPriceLine({
                price:st.price, color:'#e2b022', lineWidth:2,
                lineStyle:LightweightCharts.LineStyle.Solid, title:t('line.entry')
            }));
            st.tempLine.applyOptions({color:'#ef5350', title:t('line.sl')});
        } else if (st.step===1) {
            st.sl=price;
            if (Math.abs(st.sl-st.price)<window.App.point*10) st.sl=null;
            st.step=2;
            if (st.sl) st.visualLines.push(window.App.candleSeries.createPriceLine({
                price:st.sl, color:'#ef5350', lineWidth:1,
                lineStyle:LightweightCharts.LineStyle.Dashed, title:t('line.sl')
            }));
            st.tempLine.applyOptions({color:'#26a69a', title:t('line.tp')});
        } else if (st.step===2) {
            st.tp=price;
            if (Math.abs(st.tp-st.price)<window.App.point*10) st.tp=null;
            window.App.candleSeries.removePriceLine(st.tempLine);
            if (st.visualLines) st.visualLines.forEach(l=>{ try{window.App.candleSeries.removePriceLine(l);}catch(e){} });
            st.visualLines=[]; st.active=false;
            window.App.chart.applyOptions({crosshair:{mode:LightweightCharts.CrosshairMode.Normal}});

            const cur=window.App.currentTfCandle.close;
            let orderType='';
            if (st.type==='VISUAL_BUY') {
                if (st.price>cur+(window.App.point*5)) orderType='BUY_STOP';
                else if (st.price<cur-(window.App.point*5)) orderType='BUY_LIMIT';
                else orderType='BUY';
            } else {
                if (st.price<cur-(window.App.point*5)) orderType='SELL_STOP';
                else if (st.price>cur+(window.App.point*5)) orderType='SELL_LIMIT';
                else orderType='SELL';
            }
            if (orderType==='BUY'||orderType==='SELL') {
                openPosition(orderType, st.lot, cur, st.sl, st.tp);
            } else {
                const id='PEND_'+Date.now();
                const o={id,type:orderType,lot:st.lot,price:st.price,sl:st.sl,tp:st.tp,visuals:[]};
                o.visuals.push(window.App.candleSeries.createPriceLine({
                    price:st.price, color:'#e2b022', lineWidth:2,
                    lineStyle:LightweightCharts.LineStyle.Solid, title:`${orderType} ${st.lot}`
                }));
                if (st.sl) o.visuals.push(window.App.candleSeries.createPriceLine({price:st.sl,color:'#ef5350',lineWidth:1,lineStyle:LightweightCharts.LineStyle.Dashed,title:t('line.sl')}));
                if (st.tp) o.visuals.push(window.App.candleSeries.createPriceLine({price:st.tp,color:'#26a69a',lineWidth:1,lineStyle:LightweightCharts.LineStyle.Dashed,title:t('line.tp')}));
                window.App.pendingOrders.push(o);
                renderTradingPanel();
            }
        }
    });

    document.getElementById('btn-buy-mkt').addEventListener('click',    ()=>openMarketOrder('BUY'));
    document.getElementById('btn-sell-mkt').addEventListener('click',   ()=>openMarketOrder('SELL'));
    document.getElementById('btn-visual-buy').addEventListener('click', ()=>startVisualOrder('VISUAL_BUY'));
    document.getElementById('btn-visual-sell').addEventListener('click',()=>startVisualOrder('VISUAL_SELL'));
    document.getElementById('btn-close-all').addEventListener('click',  ()=>{
        [...window.App.positions].forEach(p=>closePosition(p.id));
        [...window.App.pendingOrders].forEach(o=>cancelPending(o.id));
        if (window.App.tradeSetup&&window.App.tradeSetup.active) {
            window.App.tradeSetup.active=false;
            if (window.App.tradeSetup.tempLine) try{window.App.candleSeries.removePriceLine(window.App.tradeSetup.tempLine);}catch(e){}
            if (window.App.tradeSetup.visualLines) window.App.tradeSetup.visualLines.forEach(l=>{try{window.App.candleSeries.removePriceLine(l);}catch(e){}});
            window.App.chart.applyOptions({crosshair:{mode:LightweightCharts.CrosshairMode.Normal}});
        }
    });
}
