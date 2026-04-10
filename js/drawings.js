// js/drawings.js

// ---------------------------------------------------------------------------
// UTILITÁRIOS DE COORDENADA
// ---------------------------------------------------------------------------

function getCoordinateForTime(t_utc) {
    if (!window.App || !window.App.chart) return null;
    const shiftSeconds = (window.App.currentTargetTz || 0) * 3600;
    const tfSeconds    = parseInt(document.getElementById('timeframe').value) * 60;
    const displayTime  = Math.floor((t_utc + shiftSeconds) / tfSeconds) * tfSeconds;

    let x = window.App.chart.timeScale().timeToCoordinate(displayTime);
    if (x !== null) return x;

    const lastCandle = window.App.currentTfCandle;
    if (lastCandle) {
        const lx = window.App.chart.timeScale().timeToCoordinate(lastCandle.time);
        if (lx !== null) {
            const lastLogical = window.App.chart.timeScale().coordinateToLogical(lx);
            if (lastLogical !== null)
                return window.App.chart.timeScale().logicalToCoordinate(
                    lastLogical + (displayTime - lastCandle.time) / tfSeconds
                );
        }
    }
    return null;
}

function resolveTime(param) {
    const shiftSeconds = (window.App.currentTargetTz || 0) * 3600;
    if (param.time !== undefined && param.time !== null) return param.time - shiftSeconds;
    if (param.point && param.logical !== undefined && window.App.currentTfCandle) {
        const tfSeconds     = parseInt(document.getElementById('timeframe').value) * 60;
        const lastDisplayTime = window.App.currentTfCandle.time;
        const lastX           = window.App.chart.timeScale().timeToCoordinate(lastDisplayTime);
        if (lastX !== null) {
            const lastLogical = window.App.chart.timeScale().coordinateToLogical(lastX);
            if (lastLogical !== null)
                return (lastDisplayTime + Math.round(param.logical - lastLogical) * tfSeconds) - shiftSeconds;
        }
    }
    return null;
}

function dc(type)  { return window.App.settings.drawings[type] || '#2962ff'; }
function hexToRgba(hex, alpha) {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// ---------------------------------------------------------------------------
// RENDERER
// ---------------------------------------------------------------------------

class ShapeRenderer {
    constructor(primitive) { this._p = primitive; }

    draw(target) {
        target.useBitmapCoordinateSpace(scope => {
            const ctx = scope.context;
            const { series, type, p1, p2, currentMouse } = this._p;
            if (!p1) return;

            const x1 = getCoordinateForTime(p1.time);
            const y1 = series.priceToCoordinate(p1.price);
            if (x1 === null || y1 === null) return;

            const hr=scope.horizontalPixelRatio, vr=scope.verticalPixelRatio;
            const sx1=x1*hr, sy1=y1*vr;
            const col=dc(type);
            ctx.save();

            // HLINE
            if (type === 'hline') {
                ctx.fillStyle='#ff9800';
                ctx.beginPath(); ctx.arc(sx1,sy1,5*hr,0,Math.PI*2); ctx.fill();
            }

            // HRAY
            else if (type === 'hray') {
                ctx.strokeStyle=col; ctx.lineWidth=2*hr;
                ctx.beginPath(); ctx.moveTo(sx1,sy1); ctx.lineTo(ctx.canvas.width,sy1); ctx.stroke();

                const decimals=window.App.point<0.001?5:(window.App.point<0.1?3:2);
                const fontSize=11*vr;
                ctx.font=`bold ${fontSize}px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif`;
                ctx.fillStyle=col; ctx.textBaseline='bottom';
                const priceStr=p1.price.toFixed(decimals);
                const textWidth=ctx.measureText(priceStr).width;
                ctx.fillText(priceStr, ctx.canvas.width-textWidth-8*hr, sy1-3*vr);

                ctx.fillStyle='#ff9800';
                ctx.beginPath(); ctx.arc(sx1,sy1,5*hr,0,Math.PI*2); ctx.fill();
            }

            // VLINE
            else if (type === 'vline') {
                ctx.strokeStyle=col; ctx.lineWidth=2*hr;
                ctx.beginPath(); ctx.moveTo(sx1,0); ctx.lineTo(sx1,ctx.canvas.height); ctx.stroke();

                const displayUtc=p1.time+(window.App.currentTargetTz||0)*3600;
                const d=new Date(displayUtc*1000), pad=n=>n<10?'0'+n:n;
                const dateStr=`${pad(d.getUTCDate())}/${pad(d.getUTCMonth()+1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;

                const fontSize=11*vr;
                ctx.font=`${fontSize}px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif`;
                const textWidth=ctx.measureText(dateStr).width;
                const pX=8*hr, pY=6*vr, bW=textWidth+pX*2, bH=fontSize+pY*2;
                const isRight=sx1+bW+10*hr>ctx.canvas.width;
                const bX=isRight?sx1-bW-5*hr:sx1+5*hr;
                const bY=ctx.canvas.height-bH-10*vr;
                ctx.fillStyle=col; ctx.fillRect(bX,bY,bW,bH);
                ctx.fillStyle='#ffffff'; ctx.textBaseline='middle';
                ctx.fillText(dateStr, bX+pX, bY+bH/2);

                ctx.fillStyle='#ff9800';
                ctx.beginPath(); ctx.arc(sx1,sy1,5*hr,0,Math.PI*2); ctx.fill();
            }

            // TEXT
            else if (type === 'text') {
                if (!p1.content) { ctx.restore(); return; }
                const fontSize=13*vr;
                ctx.font=`bold ${fontSize}px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif`;
                ctx.fillStyle=col; ctx.textBaseline='bottom';
                ctx.fillText(p1.content, sx1+10*hr, sy1-6*vr);

                ctx.fillStyle='#ff9800';
                ctx.beginPath(); ctx.arc(sx1,sy1,5*hr,0,Math.PI*2); ctx.fill();
            }

            // 2 PONTOS
            else {
                let x2,y2,priceDiff,sx2,sy2;
                if (p2) {
                    x2=getCoordinateForTime(p2.time); y2=series.priceToCoordinate(p2.price);
                    priceDiff=p2.price-p1.price;
                } else if (currentMouse) {
                    x2=currentMouse.x; y2=currentMouse.y; priceDiff=currentMouse.price-p1.price;
                } else { ctx.restore(); return; }
                if (x2!==undefined&&y2!==undefined) { sx2=x2*hr; sy2=y2*vr; }

                if (type==='rect') {
                    ctx.fillStyle=hexToRgba(col,0.2); ctx.strokeStyle=col; ctx.lineWidth=1*hr;
                    ctx.fillRect(sx1,sy1,sx2-sx1,sy2-sy1); ctx.strokeRect(sx1,sy1,sx2-sx1,sy2-sy1);
                    ctx.fillStyle='#ff9800';
                    ctx.beginPath(); ctx.arc(sx1,sy1,4*hr,0,Math.PI*2); ctx.fill();
                    if (x2!==null&&y2!==null) { ctx.beginPath(); ctx.arc(sx2,sy2,4*hr,0,Math.PI*2); ctx.fill(); }
                }
                else if (type==='fibo') {
                    const levels=window.App.settings.fibo.levels;
                    ctx.strokeStyle=hexToRgba(col,0.5); ctx.lineWidth=1*hr;
                    ctx.setLineDash([5*hr,5*hr]);
                    ctx.beginPath(); ctx.moveTo(sx1,sy1); ctx.lineTo(sx2,sy2); ctx.stroke();
                    ctx.setLineDash([]);
                    const extendX=60*hr, textX=Math.max(sx1,sx2)+extendX+5*hr;
                    levels.forEach(lvl=>{
                        const lvlPrice=p1.price+priceDiff*lvl.value;
                        const lY=series.priceToCoordinate(lvlPrice); if (lY===null) return;
                        const slY=lY*vr;
                        ctx.strokeStyle=hexToRgba(col,0.9); ctx.lineWidth=1*hr;
                        ctx.beginPath(); ctx.moveTo(Math.min(sx1,sx2),slY); ctx.lineTo(Math.max(sx1,sx2)+extendX,slY); ctx.stroke();
                        ctx.font=`${11*vr}px Arial`; ctx.fillStyle=col;
                        ctx.fillText(`${lvl.label} (${lvlPrice.toFixed(5)})`, textX, slY+4*vr);
                    });
                    ctx.fillStyle='#ff9800';
                    ctx.beginPath(); ctx.arc(sx1,sy1,4*hr,0,Math.PI*2); ctx.fill();
                    if (x2!==null&&y2!==null) { ctx.beginPath(); ctx.arc(sx2,sy2,4*hr,0,Math.PI*2); ctx.fill(); }
                }
                else if (type==='trend') {
                    ctx.strokeStyle=col; ctx.lineWidth=2*hr;
                    ctx.beginPath(); ctx.moveTo(sx1,sy1);
                    if (sx1!==sx2) { const slope=(sy2-sy1)/(sx2-sx1), extX=sx2>sx1?ctx.canvas.width:0; ctx.lineTo(extX,sy1+slope*(extX-sx1)); }
                    else ctx.lineTo(sx2,sy2>sy1?ctx.canvas.height:0);
                    ctx.stroke();
                    ctx.fillStyle='#ff9800';
                    ctx.beginPath(); ctx.arc(sx1,sy1,4*hr,0,Math.PI*2); ctx.fill();
                    if (x2!==null&&y2!==null) { ctx.beginPath(); ctx.arc(sx2,sy2,4*hr,0,Math.PI*2); ctx.fill(); }
                }
            }
            ctx.restore();
        });
    }
}

// ---------------------------------------------------------------------------
// PRIMITIVA / VIEW
// ---------------------------------------------------------------------------

class ShapePaneView {
    constructor(primitive) { this._primitive = primitive; }
    update() {}
    renderer() { return new ShapeRenderer(this._primitive); }
}

class ShapePrimitive {
    constructor(type) {
        this.type=type; this.p1=null; this.p2=null;
        this.currentMouse=null; this.priceLine=null;
        this._paneViews=[new ShapePaneView(this)];
    }
    updateAllViews() { if (this._requestUpdate) this._requestUpdate(); }
    paneViews()      { return this._paneViews; }
    attached(param)  { this.chart=param.chart; this.series=param.series; this._requestUpdate=param.requestUpdate; }
    detached()       {}
}

// ---------------------------------------------------------------------------
// INPUT FLUTUANTE PARA TEXTO
// ---------------------------------------------------------------------------

function showTextInput(screenX, screenY, onConfirm, onCancel) {
    const container = document.getElementById('chart-container');
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;left:${screenX}px;top:${Math.max(0,screenY-36)}px;z-index:200;`;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = t('textInput.placeholder');
    input.style.cssText = `background:#1e222d;color:${dc('text')};border:1px solid ${dc('text')};
        padding:5px 10px;font-size:13px;font-weight:bold;border-radius:4px;outline:none;
        min-width:210px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;`;

    wrap.appendChild(input); container.appendChild(wrap); input.focus();

    let done=false;
    const finish=(ok)=>{
        if (done) return; done=true;
        const text=input.value.trim();
        if (container.contains(wrap)) container.removeChild(wrap);
        if (ok&&text) onConfirm(text); else onCancel();
    };
    input.addEventListener('keydown', e=>{ e.stopPropagation(); if(e.key==='Enter')finish(true); if(e.key==='Escape')finish(false); });
    input.addEventListener('blur', ()=>setTimeout(()=>finish(false),200));
}

// ---------------------------------------------------------------------------
// SETUP PRINCIPAL
// ---------------------------------------------------------------------------

function setupDrawings() {
    const tools=['hline','hray','vline','rect','fibo','trend','text','eraser'];

    const resetButtons=()=>{
        tools.forEach(id=>{ const b=document.getElementById(`btn-${id}`); if(b) b.classList.remove('active'); });
        window.App.currentTool=null; window.App.drawingStep=0; window.App.currentPrimitive=null;
        const c=document.getElementById('chart-container'); if(c) c.classList.remove('cursor-eraser');
    };

    const btnMagnet=document.getElementById('btn-magnet');
    if (btnMagnet) btnMagnet.addEventListener('click',function(){ window.App.magnetMode=!window.App.magnetMode; this.classList.toggle('magnet-active',window.App.magnetMode); });

    tools.forEach(tool=>{
        const btn=document.getElementById(`btn-${tool}`);
        if (btn) btn.addEventListener('click',function(){
            const was=this.classList.contains('active'); resetButtons();
            if (!was) { this.classList.add('active'); window.App.currentTool=tool; if(tool==='eraser') document.getElementById('chart-container').classList.add('cursor-eraser'); }
        });
    });

    const btnGrid=document.getElementById('btn-grid');
    if (btnGrid) btnGrid.addEventListener('click',function(){
        window.App.gridVisible=!window.App.gridVisible; this.classList.toggle('active',window.App.gridVisible);
        window.App.chart.applyOptions({grid:{vertLines:{visible:window.App.gridVisible},horzLines:{visible:window.App.gridVisible}}});
    });

    const btnClear=document.getElementById('btn-clear');
    if (btnClear) btnClear.addEventListener('click',()=>{
        window.App.drawingsPrimitives.forEach(p=>{ if(p.priceLine) try{window.App.candleSeries.removePriceLine(p.priceLine);}catch(e){} window.App.candleSeries.detachPrimitive(p); });
        window.App.priceLines.forEach(pl=>{try{window.App.candleSeries.removePriceLine(pl);}catch(e){}});
        window.App.drawingsPrimitives=[]; window.App.priceLines=[]; resetButtons();
    });

    const container=document.getElementById('chart-container');
    if (!container) return;

    // MOUSEDOWN: criação instantânea (vline/hray) + arraste
    container.addEventListener('mousedown',()=>{
        if (window.App.currentTool==='vline'||window.App.currentTool==='hray') {
            const param=window.App.lastCrosshairParam;
            if (!param||!param.point) return;
            const rt=resolveTime(param); if (rt===null) return;
            let price=window.App.candleSeries.coordinateToPrice(param.point.y);
            if (window.App.magnetMode) {
                const data=param.seriesData.get(window.App.candleSeries);
                if (data) { const ps=[data.open,data.high,data.low,data.close].filter(v=>v!==undefined); if(ps.length) price=ps.reduce((pv,cv)=>Math.abs(cv-price)<Math.abs(pv-price)?cv:pv); }
            }
            const p=new ShapePrimitive(window.App.currentTool);
            p.p1={time:rt,price};
            window.App.candleSeries.attachPrimitive(p); p.updateAllViews();
            window.App.drawingsPrimitives.push(p); resetButtons(); return;
        }

        if (window.App.currentTool) return;
        if (!window.App.lastCrosshairParam||!window.App.lastCrosshairParam.point) return;
        const pt=window.App.lastCrosshairParam.point, thr=12;

        for (let i=window.App.drawingsPrimitives.length-1;i>=0;i--) {
            const p=window.App.drawingsPrimitives[i]; if (!p.p1) continue;
            const x1=getCoordinateForTime(p.p1.time), y1=window.App.candleSeries.priceToCoordinate(p.p1.price);
            if (x1===null||y1===null) continue;
            if (['hline','hray','text'].includes(p.type)) { if(Math.hypot(pt.x-x1,pt.y-y1)<thr){window.App.draggedPrimitive=p;window.App.dragTarget='p1';break;} continue; }
            if (p.type==='vline') { if(Math.abs(pt.x-x1)<thr){window.App.draggedPrimitive=p;window.App.dragTarget='p1';break;} continue; }
            if (!p.p2) continue;
            const x2=getCoordinateForTime(p.p2.time), y2=window.App.candleSeries.priceToCoordinate(p.p2.price);
            if (x2===null||y2===null) continue;
            if (p.type==='rect') {
                const mnX=Math.min(x1,x2),mxX=Math.max(x1,x2),mnY=Math.min(y1,y2),mxY=Math.max(y1,y2);
                if(Math.hypot(pt.x-x1,pt.y-y1)<thr)                                   {window.App.draggedPrimitive=p;window.App.dragTarget='p1';break;}
                if(Math.hypot(pt.x-x2,pt.y-y2)<thr)                                   {window.App.draggedPrimitive=p;window.App.dragTarget='p2';break;}
                if(Math.abs(pt.x-mxX)<thr&&pt.y>=mnY&&pt.y<=mxY)                      {window.App.draggedPrimitive=p;window.App.dragTarget=(mxX===x1)?'p1_time':'p2_time';break;}
                if(Math.abs(pt.x-mnX)<thr&&pt.y>=mnY&&pt.y<=mxY)                      {window.App.draggedPrimitive=p;window.App.dragTarget=(mnX===x1)?'p1_time':'p2_time';break;}
                if(Math.abs(pt.y-mxY)<thr&&pt.x>=mnX&&pt.x<=mxX)                      {window.App.draggedPrimitive=p;window.App.dragTarget=(mxY===y1)?'p1_price':'p2_price';break;}
                if(Math.abs(pt.y-mnY)<thr&&pt.x>=mnX&&pt.x<=mxX)                      {window.App.draggedPrimitive=p;window.App.dragTarget=(mnY===y1)?'p1_price':'p2_price';break;}
            } else {
                if(Math.hypot(pt.x-x1,pt.y-y1)<thr){window.App.draggedPrimitive=p;window.App.dragTarget='p1';break;}
                if(Math.hypot(pt.x-x2,pt.y-y2)<thr){window.App.draggedPrimitive=p;window.App.dragTarget='p2';break;}
            }
        }
        if (window.App.draggedPrimitive) window.App.chart.applyOptions({handleScroll:false,handleScale:false});
    });

    const stopDragging=()=>{
        if (window.App.draggedPrimitive) {
            window.App.draggedPrimitive=null; window.App.dragTarget=null;
            window.App.chart.applyOptions({handleScroll:true,handleScale:true});
        }
    };
    container.addEventListener('mouseup',    stopDragging);
    container.addEventListener('mouseleave', stopDragging);

    // DBLCLICK: editar texto
    container.addEventListener('dblclick',()=>{
        if (window.App.currentTool) return;
        const param=window.App.lastCrosshairParam; if (!param||!param.point) return;
        const pt=param.point, thr=16;
        for (let i=window.App.drawingsPrimitives.length-1;i>=0;i--) {
            const p=window.App.drawingsPrimitives[i];
            if (p.type!=='text'||!p.p1) continue;
            const x1=getCoordinateForTime(p.p1.time), y1=window.App.candleSeries.priceToCoordinate(p.p1.price);
            if (x1===null||y1===null) continue;
            if (Math.hypot(pt.x-x1,pt.y-y1)<thr) {
                window.App.chart.applyOptions({handleScroll:false,handleScale:false});
                showTextInput(pt.x,pt.y,
                    newContent=>{ p.p1.content=newContent; p.updateAllViews(); window.App.chart.applyOptions({handleScroll:true,handleScale:true}); },
                    ()=>window.App.chart.applyOptions({handleScroll:true,handleScale:true})
                );
                return;
            }
        }
    });

    // CROSSHAIR
    window.App.chart.subscribeCrosshairMove(param=>{
        window.App.lastCrosshairParam=param; if (!param.point) return;
        const rt=resolveTime(param); if (rt===null) return;
        let snappedPrice=window.App.candleSeries.coordinateToPrice(param.point.y);
        if (window.App.magnetMode) {
            const data=param.seriesData.get(window.App.candleSeries);
            if (data) { const ps=[data.open,data.high,data.low,data.close].filter(v=>v!==undefined); if(ps.length) snappedPrice=ps.reduce((pv,cv)=>Math.abs(cv-snappedPrice)<Math.abs(pv-snappedPrice)?cv:pv); }
        }
        if (window.App.draggedPrimitive&&window.App.dragTarget) {
            const p=window.App.draggedPrimitive, pr=snappedPrice;
            switch(window.App.dragTarget) {
                case 'p1':       p.p1={...p.p1,time:rt,price:pr}; break;
                case 'p2':       p.p2={...p.p2,time:rt,price:pr}; break;
                case 'p1_time':  p.p1.time=rt;   break;
                case 'p2_time':  p.p2.time=rt;   break;
                case 'p1_price': p.p1.price=pr;  break;
                case 'p2_price': p.p2.price=pr;  break;
            }
            if ((p.type==='hline'||p.type==='hray')&&p.priceLine) p.priceLine.applyOptions({price:p.p1.price});
            p.updateAllViews(); return;
        }
        if (window.App.drawingStep===1&&window.App.currentPrimitive) {
            window.App.currentPrimitive.currentMouse={x:param.point.x,y:param.point.y,price:snappedPrice};
            window.App.currentPrimitive.updateAllViews();
        }
    });

    // CLICK
    window.App.chart.subscribeClick(param=>{
        if (!window.App.currentTool||!param.point) return;
        if (window.App.currentTool==='vline'||window.App.currentTool==='hray') return;
        const rt=resolveTime(param); if (rt===null) return;
        let price=window.App.candleSeries.coordinateToPrice(param.point.y);
        const pt=param.point;

        if (window.App.magnetMode&&window.App.lastCrosshairParam) {
            const data=window.App.lastCrosshairParam.seriesData.get(window.App.candleSeries);
            if (data) { const ps=[data.open,data.high,data.low,data.close].filter(v=>v!==undefined); if(ps.length) price=ps.reduce((pv,cv)=>Math.abs(cv-price)<Math.abs(pv-price)?cv:pv); }
        }

        if (window.App.currentTool==='eraser') {
            const thr=15;
            for (let i=window.App.drawingsPrimitives.length-1;i>=0;i--) {
                const p=window.App.drawingsPrimitives[i]; if (!p.p1) continue;
                const x1=getCoordinateForTime(p.p1.time), y1=window.App.candleSeries.priceToCoordinate(p.p1.price);
                if (x1===null||y1===null) continue;
                let hit=false;
                if (p.type==='hline')      { if(Math.abs(pt.y-y1)<thr) hit=true; }
                else if (p.type==='hray')  { if(Math.abs(pt.y-y1)<thr&&pt.x>=x1-thr) hit=true; }
                else if (p.type==='vline') { if(Math.abs(pt.x-x1)<thr) hit=true; }
                else if (p.type==='text')  { if(Math.hypot(pt.x-x1,pt.y-y1)<thr*2) hit=true; }
                else if (p.p2) {
                    const x2=getCoordinateForTime(p.p2.time), y2=window.App.candleSeries.priceToCoordinate(p.p2.price);
                    if (x2===null||y2===null) continue;
                    if (p.type==='rect') { const mnX=Math.min(x1,x2),mxX=Math.max(x1,x2),mnY=Math.min(y1,y2),mxY=Math.max(y1,y2); if(pt.x>=mnX-thr&&pt.x<=mxX+thr&&pt.y>=mnY-thr&&pt.y<=mxY+thr) hit=true; }
                    else if (p.type==='trend') { const num=Math.abs((x2-x1)*(y1-pt.y)-(x1-pt.x)*(y2-y1)); const den=Math.sqrt((x2-x1)**2+(y2-y1)**2); const dist=den===0?Math.hypot(pt.x-x1,pt.y-y1):num/den; if(dist<thr&&(x2>x1?pt.x>=x1-thr:pt.x<=x1+thr)) hit=true; }
                    else if (p.type==='fibo') { const mnX=Math.min(x1,x2),mnY=Math.min(y1,y2),mxY=Math.max(y1,y2); if(pt.x>=mnX-thr&&pt.y>=mnY-thr&&pt.y<=mxY+thr) hit=true; }
                }
                if (hit) { if(p.priceLine) try{window.App.candleSeries.removePriceLine(p.priceLine);}catch(e){} window.App.candleSeries.detachPrimitive(p); window.App.drawingsPrimitives.splice(i,1); resetButtons(); return; }
            }
            for (let i=window.App.priceLines.length-1;i>=0;i--) { const pl=window.App.priceLines[i]; const y=window.App.candleSeries.priceToCoordinate(pl.options().price); if(y!==null&&Math.abs(pt.y-y)<thr){window.App.candleSeries.removePriceLine(pl);window.App.priceLines.splice(i,1);resetButtons();return;} }
            return;
        }

        if (window.App.currentTool==='hline') {
            const p=new ShapePrimitive('hline'); p.p1={time:rt,price};
            p.priceLine=window.App.candleSeries.createPriceLine({price,color:dc('hline'),lineWidth:2,lineStyle:LightweightCharts.LineStyle.Solid,axisLabelVisible:true,title:t('line.hline')});
            window.App.candleSeries.attachPrimitive(p); p.updateAllViews(); window.App.drawingsPrimitives.push(p); resetButtons();
        }
        else if (window.App.currentTool==='text') {
            const btn=document.getElementById('btn-text'); if(btn) btn.classList.remove('active');
            window.App.currentTool=null;
            showTextInput(param.point.x,param.point.y,
                content=>{ const p=new ShapePrimitive('text'); p.p1={time:rt,price,content}; window.App.candleSeries.attachPrimitive(p); p.updateAllViews(); window.App.drawingsPrimitives.push(p); resetButtons(); },
                ()=>resetButtons()
            );
        }
        else if (['rect','fibo','trend'].includes(window.App.currentTool)) {
            if (window.App.drawingStep===0) { window.App.currentPrimitive=new ShapePrimitive(window.App.currentTool); window.App.currentPrimitive.p1={time:rt,price}; window.App.candleSeries.attachPrimitive(window.App.currentPrimitive); window.App.drawingStep=1; }
            else if (window.App.drawingStep===1) { window.App.currentPrimitive.p2={time:rt,price}; window.App.currentPrimitive.currentMouse=null; window.App.currentPrimitive.updateAllViews(); window.App.drawingsPrimitives.push(window.App.currentPrimitive); resetButtons(); }
        }
    });
}
