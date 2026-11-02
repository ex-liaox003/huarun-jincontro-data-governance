
/* 管理驾驶舱模块脚本（内嵌自 华润金控管理驾驶舱.html，IIFE 隔离；2026-10-12） */
(function(){

/* ================= 数据（样例示意） ================= */
/* 板块色：深蓝大屏底经对比度校验的提亮版（蓝/翠绿/暖金/天青/橘橙）；仅用于业务身份 */
var BU_COLORS = { bank:'#1d5ca8', trust:'#0f9d6e', ins:'#d9a531', asset:'#5b9bd9', lease:'#e8823c' }; /* 2026-10-20 领导层统一色板（浅底经 CVD 校验） */
var T2='#42557a', T3='#7a8ba6', BLUE='#2f7fd6', BLUE2='#17427d', GOLD='#d9a531', GOLD2='#e8c063';
var CAL = 1;                                // 数据固定合并口径（v3 起控件精简，不再切换）
/* 数据日期（年-月）下拉：全页数值 = 基准(2026-09) × 月度系数（原型样例联动示意） */
var MFACT = [.938,.941,.944,.947,.950,.953,.956,.960,.964,.968,.972,.976,.980,.984,.987,.990,.993,.996,.998,.999,1];
var selDate = "2026-09";
function dateFactor(){ var y=+selDate.slice(0,4), mo=+selDate.slice(5,7);
  var idx = (y-2025)*12 + (mo-1);
  return MFACT[Math.max(0, Math.min(MFACT.length-1, idx))]; }

/* 核心指标带（2026-10-21 按 Excel 口径重排：利润链四卡=本月数报送值；ROE=本年累计数、ROA=本月数——
   来源=金控风险部&华润金融_深国投指标数据梳理表「经营指标」行；kal=报送值口径徽标，管理层一眼分清零/累计口径） */
var NORTH = [
  {l:'营业收入',         u:'亿元', v:15.8, yoy:9.1,  kal:'本月数'},
  {l:'利润总额',         u:'亿元', v:4.2,  yoy:6.5,  kal:'本月数'},
  {l:'净利润',           u:'亿元', v:3.4,  yoy:7.8,  kal:'本月数'},
  {l:'股东应占净利润',   u:'亿元', v:3.1,  yoy:8.2,  kal:'本月数'},
  {l:'ROE',              u:'%',    v:9.8,  yoy:-0.4, pct:true, kal:'本年累计数'},
  {l:'ROA',              u:'%',    v:0.62, yoy:0.5,  pct:true, kal:'本月数'}
];

/* 板块卡数据已随总览板块卡移除（2026-10-12 v4） */


var BUKPI = {
  bank:[{l:'营业收入',u:'亿元',v:86.4,yoy:8.2,bud:98},{l:'利润总额',u:'亿元',v:29.5,yoy:6.5,bud:39},{l:'净利润',u:'亿元',v:21.3,yoy:7.1},{l:'拨备前利润',u:'亿元',v:52.9,yoy:7.9}],
  trust:[{l:'信托管理规模',u:'亿元',v:4210,yoy:-3.1,raw:1},{l:'总收入(除国信)',u:'亿元',v:12.6,yoy:2.4},{l:'净利润(含国信)',u:'亿元',v:10.2,yoy:4.0},{l:'ROE(除国信)',u:'%',v:11.2,yoy:-0.6,pct:1}],
  ins:[{l:'保费规模',u:'亿元',v:38.7,yoy:15.4},{l:'佣金收入',u:'亿元',v:9.8,yoy:11.2},{l:'利润总额',u:'亿元',v:2.4,yoy:9.0},{l:'ROE',u:'%',v:9.4,yoy:0.3,pct:1}],
  asset:[{l:'生息资产规模',u:'亿元',v:512,yoy:6.8,raw:1},{l:'自有出资存量',u:'亿元',v:286,yoy:9.4,raw:1},{l:'新增自有出资',u:'亿元',v:58.2,yoy:14.0},{l:'利润总额',u:'亿元',v:7.9,yoy:5.2}],
  lease:[{l:'公司整体业务规模',u:'亿元',v:689,yoy:11.2,raw:1},{l:'新增投放',u:'亿元',v:126,yoy:8.9},{l:'整体业务收益率',u:'%',v:4.62,yoy:-0.08,pct:1},{l:'新增资产不良率',u:'%',v:0.86,yoy:0.12,pct:1,invert:1}]
};

/* ================= 工具 ================= */
function fmt(n,raw){ if(raw) return Math.round(n).toLocaleString('zh-CN');
  return (Math.round(n*10)/10).toLocaleString('zh-CN',{minimumFractionDigits:1,maximumFractionDigits:1}); }
function delta(v,pct){ var cls = pct>0?'up':(pct<0?'down':'flat'); var ar = pct>0?'▲':(pct<0?'▼':'—');
  return '<span class="'+cls+'">'+ar+' '+Math.abs(pct).toFixed(1)+(v.pct?'pct':'%')+' 同比</span>'; }

var HAS_CHART = typeof Chart !== "undefined";
if(HAS_CHART){
/* Chart.js 蓝白浅色默认 */
Chart.defaults.color = T2;
Chart.defaults.borderColor = 'rgba(120,150,190,0.16)';
Chart.defaults.font.family = '"Microsoft YaHei","PingFang SC",Arial,sans-serif';
/* tooltip 样式对齐平台驾驶舱「关注类资产总额」趋势浮层（.gk-t12-tip：深蓝玻璃 · 蓝描边 · 圆角 · 白标题） */
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(255,255,255,.97)';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(120,160,215,.55)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 7;
Chart.defaults.plugins.tooltip.padding = {top:7,right:11,bottom:8,left:11};
Chart.defaults.plugins.tooltip.titleColor = '#17427d';
Chart.defaults.plugins.tooltip.titleFont = {size:11.5,weight:'700'};
Chart.defaults.plugins.tooltip.titleMarginBottom = 5;
Chart.defaults.plugins.tooltip.bodyColor = '#33547e';
Chart.defaults.plugins.tooltip.bodyFont = {size:11.5};
Chart.defaults.plugins.tooltip.displayColors = false;
Chart.defaults.plugins.tooltip.boxPadding = 0;

}
var charts = {};
function m(x){ return x*dateFactor(); }

/* 悬停值单位映射（华润金融页利润总额/风险四图走外部 .ld-tip 浮层已带亿元，此处覆盖其余 tab 图表） */
var TIP_UNIT={ 'c-ov-conc':'%','c-bk-loan':'亿元','c-bk-dep':'亿元','c-bk-line':'亿元',
  'c-bk-t-recv':'亿元','c-bk-t-prof':'亿元','c-bk-rc-0':'亿元','c-bk-rc-1':'亿元',
  'c-bk-wf-0':'亿元','c-bk-wf-1':'亿元','c-bk-wf-2':'亿元','c-bk-wf-3':'亿元','c-bk-wf-4':'亿元','c-bk-raroc':'%',
  'c-ts-scale':'亿元','c-ts-rev':'亿元','c-ts-fund':'亿元','c-ts-gx':'亿元','c-ts-new3':'亿元',
  'c-in-prem':'万元','c-in-comm':'万元','c-in-mix':'万元',
  'c-as-wf':'亿元','c-as-biz':'亿元','c-as-pl':'亿元','c-as-syn':'亿元','c-as-cmp':'亿元','c-as-risk':'亿元','c-as-cal':'亿元',
  'c-ls-pl':'亿元','c-ls-sector':'亿元','c-ls-prod':'亿元','c-ls-spread':'%','c-ls-fund':'亿元' };
/* 柱顶数值标注插件：柱状图在柱端直接标数值（不带单位，详情看悬停）。
   跳过：瀑布 c-bk-pl（已有柱内标注）、堆叠图（分段标注过密）、趋势线数据集、隐藏数据集 */
var barValLabel={id:'barValLabel',afterDatasetsDraw:function(ch){
  var o=ch.options||{}; var stacked=!!((o.scales&&((o.scales.y&&o.scales.y.stacked)||(o.scales.x&&o.scales.x.stacked))));
  if(stacked||ch.config.type!=='bar') return;
  var horz=o.indexAxis==='y'; var ctx=ch.ctx, area=ch.chartArea;
  ctx.save();
  ch.data.datasets.forEach(function(ds,di){
    if(ds.hidden||!ch.isDatasetVisible(di)) return;
    if(ds.type==='line'||ds.__trend||ds.label==='同比'||ds.label==='趋势') return;
    var meta=ch.getDatasetMeta(di); if(meta.type!=='bar') return;
    var n=meta.data.length;
    var slot=Math.max(1,(horz?area.height:area.width)/Math.max(1,n));
    var fsz=slot>=44?10:(slot>=26?9:8);
    ctx.font='700 '+fsz+'px "Microsoft YaHei",sans-serif';
    meta.data.forEach(function(el,i){
      var r=ds.data[i]; if(r==null) return;
      var v=Array.isArray(r)?Math.abs(r[1]-r[0]):(typeof r==='object'?null:+r);
      if(v==null||isNaN(v)) return;
      var txt=Math.abs(v).toLocaleString('zh-CN',{maximumFractionDigits:Math.abs(v)>=100?0:(Math.abs(v)>=10?1:2)});
      var w=ctx.measureText(txt).width;
      if(horz){
        var len=Math.abs(el.x-el.base); if(len<w+8) return;
        ctx.fillStyle='rgba(30,55,95,.9)'; ctx.textBaseline='middle';
        if(len>=w+12){ ctx.textAlign='left'; ctx.fillText(txt,el.x+6,el.y); }
      }else{
        var top=Math.min(el.y,el.base);
        ctx.textAlign='center';
        if(top-6>=area.top+fsz){ ctx.textBaseline='bottom'; ctx.fillStyle='rgba(30,55,95,.9)'; ctx.fillText(txt,el.x,top-5); }
        else if(Math.abs(el.base-el.y)>=14){ ctx.textBaseline='top'; ctx.fillStyle='#ffffff'; ctx.fillText(txt,el.x,top+4); }
        else{ ctx.textBaseline='bottom'; ctx.fillStyle='#42557a'; ctx.fillText(txt,el.x,top-4); }
      }
    });
  });
  ctx.restore();
}};
function mk(id,cfg){ var el=document.getElementById(id); if(!el||!HAS_CHART) return null;
  /* 柱顶数值标注跳过：损益瀑布(自绘)、银行趋势组合小图(c-bk-t-* / c-bk-rc-* / c-bk-wf-* / c-bk-raroc)——12 根月度柱加数值会过密，读数走悬停 */
  if(id!=='c-bk-pl'&&!/^c-bk-(t-|rc-|wf-)|^c-bk-raroc$/.test(id)&&(cfg.type==='bar'||(cfg.data&&cfg.data.datasets&&cfg.data.datasets.some(function(d){return !d.type})))){ (cfg.plugins=cfg.plugins||[]).push(barValLabel); }
  /* 无自定义 label 回调的图：注入「名称：值 单位」默认提示 */
  if(TIP_UNIT[id]!==undefined){
    var opt=cfg.options=cfg.options||{}; var plg=opt.plugins=opt.plugins||{};
    var tp=plg.tooltip=plg.tooltip||{}; var cb=tp.callbacks=tp.callbacks||{};
    if(!cb.label){ cb.label=(function(unit){ return function(c){
      var r=c.raw, v, nm=(c.dataset&&c.dataset.label)?c.dataset.label:(c.label||'');
      if(Array.isArray(r)) v=Math.abs(r[1]-r[0]);
      else if(c.chart.options.indexAxis==='y') v=c.parsed.x;
      else if(typeof c.parsed==='object') v=c.parsed.y;
      else v=c.parsed;
      var txt=Number(v).toLocaleString('zh-CN',{maximumFractionDigits:2});
      return nm+'：'+txt+(unit==='%'?'%':' '+unit);
    }; })(TIP_UNIT[id]); }
  }
  (charts[curView]=charts[curView]||[]).push(null);
  var _c=new Chart(el,cfg); charts[curView][charts[curView].length-1]=_c; return _c; }
var GRID={color:'rgba(120,150,190,0.16)'}, NOG={grid:{display:false},ticks:{font:{size:11},color:T3}};
function base(extra){ var o={responsive:true,maintainAspectRatio:false,
  plugins:{legend:{display:false},
    /* 组合图悬停只显示柱值一行（趋势线为同数据的视觉线，过滤避免重复），对齐参考浮层 */
    tooltip:{filter:function(it){ return it.dataset.label!=='同比'; }}}};
  if(extra)Object.assign(o.plugins,extra); return o; }
var YAX={grid:GRID,ticks:{font:{size:11},color:T3}};
var LGL={display:true,position:'top',align:'end',labels:{font:{size:11},color:T2,boxWidth:12}};

/* ================= 视图渲染 ================= */
var curView='overview';
var LeaderApp = {
  setDate:function(v){ selDate=v; renderNorth(); this.refresh(); },
  /* 资产 tab：分区口径切换（sheet=asset01/02/03，仅刷新对应分区，不重建整页图表） */
  asCal:function(sheet,ci,el){ ASSET_CAL[sheet]=ci;
    if(el){ var p=el.parentNode; p.querySelectorAll('.src').forEach(function(b){b.classList.remove('on')}); el.classList.add('on'); }
    /* 重渲染前先销毁该分区旧图表实例，避免 canvas 复用报错 */
    if(sheet==='asset01'){ asDestroy(['c-as-pl','c-as-cmp']); asRenderPl(); }
    else if(sheet==='asset02'){ asDestroy(['c-as-biz','c-as-wf']); asRenderBiz(); }
    else if(sheet==='asset03'){ asDestroy(['c-as-risk','c-as-cal']); asRenderRisk(); } },
  /* 银行 tab：条线 RAROC 页签切换（仅重建该卡图表） */
  bkRaroc:function(i,el){ bkRarocCur=i;
    if(el){ var p=el.parentNode; p.querySelectorAll('.src').forEach(function(b){b.classList.remove('on')}); el.classList.add('on'); }
    bkDestroyCanvases(/^c-bk-raroc$/); bkRarocRender(); },
  go:function(id,el){ curView=id;
    document.querySelectorAll('#moduleLeader header nav button').forEach(function(b){b.classList.remove('on')}); el.classList.add('on');
    document.querySelectorAll('#moduleLeader .view').forEach(function(v){v.classList.remove('on')});
    document.getElementById('v-'+id).classList.add('on');
    this.refresh(); },
  refresh:function(){ var tp=document.querySelector('.ld-tip'); if(tp) tp.style.display='none';
    charts[curView] && charts[curView].forEach(function(c){ c && c.destroy() }); charts[curView]=[];
    ({overview:drawOverview,bank:drawBank,trust:drawTrust,ins:drawIns,asset:drawAsset,lease:drawLease})[curView](); }
};

function renderNorth(){
  document.getElementById('north').innerHTML = NORTH.map(function(k){
    var v = k.pct? k.v*CAL*dateFactor() : m(k.v);
    var dec = (k.u==='%'||k.pct)?2:1;
    var vs = k.raw? Math.round(v).toLocaleString('zh-CN') : v.toLocaleString('zh-CN',{minimumFractionDigits:dec,maximumFractionDigits:dec});
    var kal = k.kal? '<span class="kal">'+k.kal+'</span>' : '';
    return '<div class="nk"><div class="l">'+k.l+kal+'</div>'+
      '<div class="v"><b>'+vs+'</b><small>'+k.u+'</small></div>'+
      '<div class="d">'+delta(k,k.yoy)+'</div></div>';
  }).join('');
}
function spark(seed, dir){
  var pts=[];
  for(var t=0;t<8;t++){ var ph=Math.sin(t*1.3+seed)*0.32 + Math.sin(t*2.9+seed*2)*0.18;
    var y = 15.5 - (3.5 + (dir>=0? t/7*9.5 : (7-t)/7*9.5) + ph*4.2);
    pts.push((2.5+t*8.4).toFixed(1)+','+Math.max(1.5,Math.min(16.5,y)).toFixed(1)); }
  return '<svg class="spark" viewBox="0 0 66 18" preserveAspectRatio="none"><polyline points="'+pts.join(' ')+'" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function renderBuKpi(bid){
  var el=document.getElementById('kpi-'+bid); if(!el) return;
  el.innerHTML = BUKPI[bid].map(function(k,i){
    var v=k.pct?k.v:m(k.v);
    var good = k.invert? k.yoy<0 : k.yoy>0;
    return '<div class="bukpi c'+i+(k.bud?' hasbud':'')+'">'+
      '<div class="l">'+k.l+'</div>'+
      (k.bud? '<div class="vrow"><div class="v"><b>'+fmt(v,k.raw)+'</b><small>'+k.u+'</small></div>'+kpiRing(v,k.bud,k.u)+'</div>'
            :  '<div class="v"><b>'+fmt(v,k.raw)+'</b><small>'+k.u+'</small></div>')+
      '<div class="foot"><span class="d '+(good?'up':'down')+'">'+(k.yoy>0?'▲':'▼')+' '+Math.abs(k.yoy).toFixed(2)+(k.pct?'pct':'%')+' 同比</span>'+
      '</div></div>';
  }).join('');
}
/* 预算完成度圆环：右半=环形进度（达成率配色：绿≥100 蓝≥85 金≥70 红<70），旁边=全年预算字段+值 */
function kpiRing(v,bud,unit){
  var p=v/bud*100, pw=Math.min(p,100), C=2*Math.PI*17;
  var col = p>=100?'#0f9d6e':(p>=85?'#2f7fd6':(p>=70?'#d9a531':'#d64550'));
  return '<div class="ringwrap">'+
    '<svg class="kping" width="54" height="54" viewBox="0 0 54 54" aria-label="预算达成 '+p.toFixed(1)+'%">'+
      '<circle cx="27" cy="27" r="17" fill="none" stroke="rgba(120,150,190,.2)" stroke-width="5"/>'+
      '<circle cx="27" cy="27" r="17" fill="none" stroke="'+col+'" stroke-width="5" stroke-linecap="round" '+
        'stroke-dasharray="'+(C*pw/100).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 27 27)"/>'+
      '<text x="27" y="31" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="800">'+Math.round(p)+'%</text>'+
    '</svg>'+
    '<div class="budbox"><span class="bl">全年预算</span><span class="bv">'+bud+'<small>'+unit+'</small></span></div></div>';
}

/* ---- 总览 ---- */
function drawOverview(){
  /* 展示规则①（本月数趋势）：Excel「经营指标」报送值口径=本月数——累计数只反映规模，
     本月数才反映当期动能拐点，供管理层判断"最近一个月有没有走强/走弱"。
     悬停浮层 = 外部 HTML（.ld-tip，对齐 平台驾驶舱-华润资产「关注类资产总额」.gk-t12-tip）：
     月份标题下画横线，其下 数值(金) 与 同比(红涨绿跌) 两行同时显示，一次移入全部呈现。
     yoy = 近12月同比%（原型样例示意数据） */
  var MON12=['10','11','12','1','2','3','4','5','6','7','8','9'];
  var ldTipEl=null;
  function ldTip(html,chart,tt){
    if(!ldTipEl){ ldTipEl=document.createElement('div'); ldTipEl.className='ld-tip'; document.body.appendChild(ldTipEl); }
    if(html==null){ if(ldTipEl) ldTipEl.style.display='none'; return; }
    ldTipEl.innerHTML=html; ldTipEl.style.display='flex';
    var r=chart.canvas.getBoundingClientRect();
    var x=r.left+tt.caretX+12, y=r.top+tt.caretY+12;
    var bw=ldTipEl.offsetWidth, bh=ldTipEl.offsetHeight;
    if(x+bw>(window.innerWidth||1400)-8) x=r.left+tt.caretX-bw-12;
    if(y+bh>(window.innerHeight||900)-8) y=r.top+tt.caretY-bh-12;
    ldTipEl.style.left=x+'px'; ldTipEl.style.top=y+'px';
  }
  function ovBarLine(id,arr,color,barLabel,yoy){
    var d=arr.map(function(x){return +(x*CAL*dateFactor()).toFixed(1)});
    mk(id,{type:'bar',data:{labels:MON12,
      datasets:[
      {label:barLabel,data:d,backgroundColor:color+'8C',borderColor:color,borderWidth:1,borderRadius:4,order:2},
      {label:'同比',type:'line',data:d,borderColor:GOLD,backgroundColor:'transparent',tension:0.35,pointRadius:3,pointBackgroundColor:GOLD,borderWidth:2,order:1}]},
      options:{responsive:true,maintainAspectRatio:false,
        interaction:{mode:'index',intersect:false},
        plugins:{legend:LGL,
          tooltip:{enabled:false,external:function(c){
            var tt=c.tooltip;
            if(!tt||tt.opacity===0||!tt.dataPoints||!tt.dataPoints.length){ ldTip(null); return; }
            var i=tt.dataPoints[0].dataIndex, p=yoy[i];
            ldTip('<b>'+MON12[i]+'月</b>'
              +'<span>'+barLabel+'<i>'+d[i].toLocaleString('zh-CN',{minimumFractionDigits:1,maximumFractionDigits:1})+' 亿元</i></span>'
              +'<span>同比<i class="'+(p>0?'up':(p<0?'down':''))+'">'+(p>0?'+':'')+p.toFixed(1)+'%</i></span>', c.chart, tt);
          }}},
        scales:{y:YAX,x:NOG}}});
  }
  /* 近12个月「本月数」序列（原型样例：随日期系数联动；末月=核心卡所选月值，前面按形状回溯） */
  ovBarLine('c-ov-rev-m',[13.9,14.6,15.9,13.1,12.4,15.2,14.8,13.6,15.1,14.9,15.5,15.8],BLUE,'本月数',
    [7.9,8.2,8.8,8.4,7.6,8.0,7.8,7.2,7.0,8.3,8.9,9.1]);
  ovBarLine('c-ov-line',[3.6,3.9,4.4,3.5,3.1,4.0,3.9,3.6,4.0,4.0,4.1,4.2],GOLD,'本月数',
    [7.9,8.2,8.8,8.4,7.6,8.0,7.8,7.2,7.0,6.8,6.6,6.5]);
  /* ===== 其他财务指标 =====
     资金来源结构饼（展示规则②构成→饼）：Excel「经营指标」总资产/所有者权益（=净资产）为层级构成关系
     （负债=总资产−净资产 轧差），负债+净资产=总资产 恒等闭环，中心=总资产。
     资产负债核心科目卡（展示规则④时点数→卡片）：总资产/净资产/资产负债率报送值=本月末，附环比/较年初 */
  (function(){
    var total=m(6820), net=m(882), debt=total-net;
    bkDonut('c-ov-bs-pie',['负债','净资产（所有者权益）'],[+debt.toFixed(0),+net.toFixed(0)],['#5b9bd9','#d9a531']);
    bkDonutCenter('ov-bs-center',total,'总资产 · 亿');
    var el=document.getElementById('ov-bs-rows');
    if(el) el.innerHTML=
      bkCompRow('#5b9bd9','负债',debt,null,'资产负债率 '+(debt/total*100).toFixed(1)+'%')+
      bkCompRow('#d9a531','净资产',net,'6.1%','占 '+(net/total*100).toFixed(1)+'%');
    var g=document.getElementById('ov-fin-cards');
    if(g) g.innerHTML=
      '<div class="stx"><span class="t">总资产 · 本月末</span><span class="v">'+bkNum(total,'亿元')+'<small>亿</small></span><div class="drow">'+bkDelta('5.2%',' 同比')+bkDelta('3.8%',' 较年初')+'</div></div>'+
      '<div class="stx"><span class="t">净资产（所有者权益）· 本月末</span><span class="v">'+bkNum(net,'亿元')+'<small>亿</small></span><div class="drow">'+bkDelta('6.1%',' 同比')+bkDelta('3.2%',' 较年初')+'</div></div>'+
      '<div class="stx gold"><span class="t">资产负债率 · 本月末</span><span class="v">'+(debt/total*100).toFixed(1)+'<small>%</small></span><div class="drow">'+bkDelta('-0.5pct',' 同比')+bkDelta('-0.3pct',' 较年初')+'</div></div>'+
      '<div class="stx"><span class="t">股东应占净利润占比（本月）</span><span class="v">'+(NORTH[3].v/NORTH[2].v*100).toFixed(1)+'<small>%</small></span><div class="drow"><i class="yoy flat">归母净利÷净利润</i></div></div>';
  })();
  /* 风险指标四图：每个指标均由 银行/信托/资产/租赁/深国投 五家分别上报后汇总。
     展示方案（总=构成 / 分=趋势 两种视图）：
     ① 「全部」= 堆叠柱：五家构成，柱顶即华润金融合计；金线=合计同比%（右轴）；
     ② 卡头色签行 = 图例 + 切换器：点单家 → 切为该家 12 个月「趋势图」（自有色折线+渐变填充+每点数值标注，
        隐藏柱、金线与右轴），再点「全部」还原构成视图；
     ③ 悬停浮层 = 全部模式：合计/同比/逐家（值·占比）；单家模式：该家值/同比/占比/金融合计。
     mat 行=家、列=近12月；yoy=合计近12月同比%；ym=各家近12月同比%（原型样例示意：围绕合计同比确定性生成，
     接入真实数据时替换为各家实际同比即可） */
  var RISK_SRC=[['bank','银行'],['trust','信托'],['asset','资产'],['lease','租赁'],['sgi','深国投']];
  var SRC_COLORS=Object.assign({},BU_COLORS,{sgi:'#7c6bd0'});
  function f1(x){ return x.toLocaleString('zh-CN',{minimumFractionDigits:1,maximumFractionDigits:1}) }
  function genYoyMat(yoy){ var out={};
    RISK_SRC.forEach(function(r,ri){ out[r[0]]=yoy.map(function(p,i){
      return +(p + Math.sin(i*1.7+ri*2.1)*(2.2+ri*0.6)).toFixed(1); }); });
    return out; }
  function ovStack(id,srId,mat,yoy){
    var raw=MON12.map(function(_,i){ return RISK_SRC.reduce(function(s,r){ return s+mat[r[0]][i] },0) });
    var D={}; RISK_SRC.forEach(function(r){ D[r[0]]=mat[r[0]].map(function(x){ return +(x*CAL*dateFactor()).toFixed(2) }) });
    var tot=raw.map(function(x){ return +(x*CAL*dateFactor()).toFixed(1) });
    var YM=genYoyMat(yoy);
    var solo=null, chart=null;
    var dss=RISK_SRC.map(function(r){ return {label:r[1],__k:r[0],data:D[r[0]],
      backgroundColor:SRC_COLORS[r[0]]+'B3',borderColor:SRC_COLORS[r[0]],borderWidth:1,borderRadius:3,order:2} });
    var LINE={type:'line',label:'合计同比',data:yoy.slice(),yAxisID:'y1',borderColor:GOLD,backgroundColor:'transparent',
      tension:0.35,pointRadius:3,pointBackgroundColor:GOLD,borderWidth:2,order:1};
    /* 单家趋势线：默认隐藏；点色签后填入该家数据/颜色并显示（自带渐变面积，即"趋势图"） */
    var TREND={type:'line',label:'趋势',__trend:true,data:[],yAxisID:'y',borderColor:'#8aa4c8',backgroundColor:'transparent',
      fill:true,tension:0.35,pointRadius:3.5,pointBorderWidth:0,borderWidth:2.5,order:0,hidden:true};
    dss.push(LINE,TREND);
    chart=mk(id,{type:'bar',data:{labels:MON12,datasets:dss},
      plugins:[{id:'valLbl',afterDatasetsDraw:function(ch){
        /* 单家趋势模式：每个数据点上方标注该家数值（值+同比）；「全部」构成模式不标注避免拥挤 */
        if(!solo) return;
        var ds=ch.data.datasets, ti=ds.findIndex(function(d){ return d.__trend });
        if(ti<0 || !ch.isDatasetVisible(ti)) return;
        var meta=ch.getDatasetMeta(ti), ctx=ch.ctx; ctx.save();
        ctx.textAlign='center'; ctx.textBaseline='bottom';
        meta.data.forEach(function(el,i){ var v=ds[ti].data[i]; if(v==null) return;
          ctx.font='700 10.5px "Microsoft YaHei",sans-serif'; ctx.fillStyle='#1f3350';
          ctx.fillText((+v.toFixed(2))+'', el.x, el.y-9);
          var p=YM[solo][i];
          ctx.font='600 9.5px "Microsoft YaHei",sans-serif';
          ctx.fillStyle=p>0?'#d64550':(p<0?'#0f9d6e':'#7a8ba6'); ctx.textBaseline='top';
          ctx.fillText((p>0?'+':'')+p.toFixed(1)+'%', el.x, el.y+7); ctx.textBaseline='bottom'; });
        ctx.restore();
      }}],
      options:{responsive:true,maintainAspectRatio:false,
        interaction:{mode:'index',intersect:false},
        plugins:{legend:{display:false},
          tooltip:{enabled:false,external:function(c){
            var tt=c.tooltip;
            if(!tt||tt.opacity===0||!tt.dataPoints||!tt.dataPoints.length){ ldTip(null); return; }
            var i=tt.dataPoints[0].dataIndex, h='<b>'+MON12[i]+'月</b>';
            if(!solo){
              var p=yoy[i];
              h+='<span class="seg sum"><span class="lab">华润金融合计</span><i>'+f1(tot[i])+' 亿元</i></span>'
                +'<span>同比<i class="'+(p>0?'up':(p<0?'down':''))+'">'+(p>0?'+':'')+p.toFixed(1)+'%</i></span>'
                +RISK_SRC.map(function(r){ var v=D[r[0]][i];
                  return '<span class="seg"><span class="lab"><i class="dotc" style="background:'+SRC_COLORS[r[0]]+'"></i>'+r[1]+'</span><i>'+f1(v)+' 亿 · '+(v/tot[i]*100).toFixed(0)+'%</i></span>'; }).join('');
            }else{
              var nm=RISK_SRC.filter(function(r){ return r[0]===solo })[0][1], v=D[solo][i], sp=YM[solo][i];
              h+='<span class="seg"><span class="lab"><i class="dotc" style="background:'+SRC_COLORS[solo]+'"></i>'+nm+'</span><i>'+f1(v)+' 亿元</i></span>'
                +'<span>同比<i class="'+(sp>0?'up':(sp<0?'down':''))+'">'+(sp>0?'+':'')+sp.toFixed(1)+'%</i></span>'
                +'<span>占华润金融<i>'+(v/tot[i]*100).toFixed(1)+'%</i></span>'
                +'<span class="seg sum"><span class="lab">金融合计</span><i>'+f1(tot[i])+' 亿元</i></span>';
            }
            ldTip(h, c.chart, tt);
          }}},
        scales:{x:{stacked:true,grid:{display:false},ticks:{font:{size:11},color:T3}},
          y:{stacked:true,position:'left',grid:GRID,ticks:{font:{size:11},color:T3}},
          y1:{position:'right',grid:{display:false},ticks:{font:{size:10.5},color:'#d9a531',callback:function(v){ return v+'%' }}}}}});
    function chips(){ var el=document.getElementById(srId); if(!el) return;
      /* 色签仅作图例+筛选，不显示数值；数值切到单家后由柱顶标注呈现 */
      el.innerHTML='<span class="src'+(solo?'':' on')+'" data-k="">全部</span>'
        +RISK_SRC.map(function(r){ return '<span class="src'+(solo===r[0]?' on':'')+'" data-k="'+r[0]+'">'
          +'<i class="dotc" style="background:'+SRC_COLORS[r[0]]+'"></i>'+r[1]+'</span>'; }).join('');
      el.onclick=function(e){ var t=e.target.closest?e.target.closest('.src'):null; if(!t) return;
        solo=t.getAttribute('data-k')||null;
        if(chart){
          /* Chart.js v4：可见性切换必须走 setDatasetVisibility，直接改 dataset.hidden 在 update() 时不生效 */
          var ti=chart.data.datasets.findIndex(function(d){ return d.__trend });
          var li=chart.data.datasets.findIndex(function(d){ return d===LINE });
          if(solo){
            var col=SRC_COLORS[solo];
            TREND.data=D[solo].slice(); TREND.borderColor=col; TREND.pointBackgroundColor=col;
            var ca=chart.chartArea, g=null;
            if(ca){ g=chart.ctx.createLinearGradient(0,ca.top,0,ca.bottom);
              g.addColorStop(0,col+'59'); g.addColorStop(1,col+'05'); }
            TREND.backgroundColor=g||col+'26';
            chart.data.datasets.forEach(function(ds,i){ chart.setDatasetVisibility(i, i===ti) }); /* 只留趋势线 */
            chart.options.scales.y1.display=false;
          }else{
            chart.data.datasets.forEach(function(ds,i){ chart.setDatasetVisibility(i, i!==ti) }); /* 柱+合计同比线，隐藏趋势线 */
            chart.options.scales.y1.display=true;
          }
          chart.update();
        }
        chips(); };
    }
    chips();
  }
  ovStack('c-rk-disp','sr-rk-disp',{
    bank :[1.0,1.2,1.5,1.4,1.6,1.7,1.7,1.8,1.6,1.5,1.8,1.9],
    trust:[0.2,0.2,0.3,0.2,0.3,0.3,0.3,0.3,0.2,0.3,0.3,0.3],
    asset:[0.4,0.5,0.5,0.5,0.6,0.6,0.6,0.7,0.6,0.5,0.6,0.6],
    lease:[0.1,0.1,0.2,0.2,0.2,0.3,0.2,0.3,0.2,0.2,0.3,0.3],
    sgi  :[0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1]},
    [10.2,10.8,11.5,11.0,11.8,12.1,12.6,13.0,12.8,12.4,12.5,12.3]);
  ovStack('c-rk-mig','sr-rk-mig',{
    bank :[2.0,1.7,2.2,1.9,1.8,2.1,1.9,1.7,2.0,1.8,1.6,1.7],
    trust:[0.4,0.4,0.5,0.4,0.4,0.5,0.4,0.4,0.5,0.4,0.4,0.4],
    asset:[0.5,0.4,0.5,0.5,0.4,0.5,0.4,0.4,0.5,0.4,0.4,0.4],
    lease:[0.2,0.2,0.3,0.2,0.2,0.2,0.2,0.1,0.2,0.2,0.1,0.2],
    sgi  :[0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1]},
    [4.1,2.8,5.6,4.2,3.0,4.8,3.9,2.2,4.5,3.1,1.8,2.6]);
  ovStack('c-rk-npl','sr-rk-npl',{
    bank :[42.0,41.6,41.2,40.7,40.4,39.9,39.5,39.1,38.7,38.2,37.8,37.5],
    trust:[6.8,6.7,6.6,6.5,6.5,6.4,6.3,6.3,6.2,6.1,6.0,6.0],
    asset:[10.5,10.4,10.3,10.2,10.1,10.0,9.9,9.8,9.7,9.6,9.5,9.4],
    lease:[4.6,4.6,4.5,4.5,4.4,4.4,4.4,4.3,4.3,4.2,4.2,4.1],
    sgi  :[1.5,1.5,1.6,1.6,1.7,1.7,1.7,1.7,1.6,1.7,1.6,1.6]},
    [-2.1,-2.6,-3.2,-3.8,-4.3,-4.9,-5.4,-6.0,-6.6,-7.2,-7.8,-8.5]);
  ovStack('c-rk-imp','sr-rk-imp',{
    bank :[27.0,26.7,26.4,26.2,25.9,25.5,25.2,24.9,24.7,24.4,24.2,23.9],
    trust:[4.4,4.3,4.3,4.2,4.2,4.1,4.1,4.0,4.0,4.0,3.9,3.9],
    asset:[6.8,6.7,6.6,6.5,6.4,6.3,6.2,6.2,6.1,6.0,6.0,5.9],
    lease:[3.0,3.0,3.0,3.0,3.0,2.9,2.9,2.8,2.8,2.8,2.7,2.7],
    sgi  :[1.3,1.3,1.3,1.3,1.3,1.3,1.2,1.3,1.2,1.2,1.2,1.2]},
    [-1.8,-2.2,-2.7,-3.1,-3.6,-4.0,-4.5,-5.0,-5.4,-5.9,-6.3,-6.8]);
  /* ===== 行A 构成饼 ×2（展示规则②：层级构成→饼）=====
     问题资产 = 不良类 + 关注类 + 正常但预警（Excel 三级分类，相加=总规模，不重不漏）；
     减值余额 = 不良减值 + 关注减值 + 预警减值（Excel 口径：合计=问题资产减值余额，与右下堆叠图同数据源）*/
  (function(){
    var npl=m(58.6), spe=m(42.3), war=m(18.5), prob=npl+spe+war;
    bkDonut('c-ov-prob-pie',['不良类','关注类','正常但预警'],[npl,spe,war],['#d64550','#d9a531','#5b9bd9']);
    bkDonutCenter('ov-prob-center',prob,'问题资产 · 亿');
    var el=document.getElementById('ov-prob-rows');
    if(el) el.innerHTML=
      bkCompRow('#d64550','不良类资产总额',npl,'-8.5%','占 '+(npl/prob*100).toFixed(1)+'%（较年初 ▼12.0%）')+
      bkCompRow('#d9a531','关注类资产总额',spe,'3.2%','占 '+(spe/prob*100).toFixed(1)+'%（环比 ▲1.1%）')+
      bkCompRow('#5b9bd9','正常但预警资产总额',war,'-2.4%','占 '+(war/prob*100).toFixed(1)+'%（较年初 ▼5.2%）');
    var iNpl=m(27.5), iSpe=m(6.9), iWar=m(3.2), iTot=iNpl+iSpe+iWar;
    bkDonut('c-ov-imp-pie',['不良资产减值余额','关注资产减值余额','正常但预警资产减值余额'],[iNpl,iSpe,iWar],['#b0303e','#c07f14','#3d6ea8']);
    bkDonutCenter('ov-imp-center',iTot,'减值余额 · 亿');
    var el2=document.getElementById('ov-imp-rows');
    if(el2) el2.innerHTML=
      bkCompRow('#b0303e','不良资产减值余额',iNpl,'-6.2%','覆盖度 '+(iNpl/npl*100).toFixed(1)+'%')+
      bkCompRow('#c07f14','关注资产减值余额',iSpe,'2.8%','覆盖度 '+(iSpe/spe*100).toFixed(1)+'%')+
      bkCompRow('#3d6ea8','正常但预警资产减值余额',iWar,'-1.5%','覆盖度 '+(iWar/war*100).toFixed(1)+'%');
    /* 行B 减值比例四卡（展示规则④：比率类时点数→卡片；Excel 派生指标：减值余额÷对应类别余额） */
    var g=document.getElementById('ov-imp-cards');
    if(g) g.innerHTML=[
      ['问题资产减值比例',iTot/prob*100,'-2.1','-1.4','问题资产整体抵补厚度','#2f7fd6'],
      ['不良资产减值比例',iNpl/npl*100,'1.2','2.6','不良处置资源充足度','#d64550'],
      ['关注资产减值比例',iSpe/spe*100,'0.4','0.8','关注下迁前瞻拨备','#d9a531'],
      ['正常但预警资产减值比例',iWar/war*100,'0.2','-0.3','预警资产风险缓冲','#5b9bd9']
    ].map(function(e){
      return '<div class="stx" style="border-left:3px solid '+e[5]+'"><span class="t">'+e[0]+' · 本月末</span>'+
        '<span class="v">'+e[1].toFixed(1)+'<small>%</small></span>'+
        '<div class="drow">'+bkDelta(e[2],' 环比')+bkDelta(e[3],' 较年初')+'</div>'+
        '<span class="t" style="font-size:10.5px">'+e[4]+'</span></div>'; }).join('');
    /* 行D 集中度六项对比条形（展示规则④：无构成关系的比率对比→条形；季度·本季末 vs 上季末） */
    var CN=[['最大十家非同业客户集中度',42.6,44.1],['同业集团客户集中度',18.4,19.2],
            ['地区集中度（最大地区）',21.3,20.8],['同业单一客户集中度',12.5,13.0],
            ['非同业集团客户集中度',11.2,11.8],['非同业单一客户集中度',8.6,9.1]];
    mk('c-ov-conc',{type:'bar',data:{labels:CN.map(function(e){return e[0]}),
      datasets:[
      {label:'本季末',data:CN.map(function(e){return e[1]}),backgroundColor:BLUE+'B3',borderRadius:3,maxBarThickness:12,order:2},
      {label:'上季末',data:CN.map(function(e){return e[2]}),backgroundColor:'#9ec3ea',borderRadius:3,maxBarThickness:12,order:1}]},
      options:Object.assign(base({legend:LGL}),{indexAxis:'y',
        scales:{x:Object.assign({},YAX,{ticks:{font:{size:10},color:T3,callback:function(v){return v+'%'}}}),
                y:{grid:{display:false},ticks:{font:{size:10.5},color:T2}}}})});
  })();
}

/* ---- 银行（2026-10-15 四大展示模块重构：数据源 = 数据应用·固定报表管理·华润银行 SHEETS 实时取数）
   模块：① 核心指标与盈利分解 ② 业绩合同指标（指标属性标签打标项：考核★/高质量） ③ 资产负债结构 ④ 条线分解与客群
   去重规则：上层优先（①>②>③>④），下层不重复；有全年预算的指标显示预算完成情况。
   取数模式对齐信托/保险/租赁 tab 的 TIL 辅助（asNum 复用资产 tab 定义，函数声明提升）。 ---- */
var BK_COL = {
  '01':{nm:1,un:2,ly:3,act:4,yoy:5,ytd:6},
  '02':{nm:1,un:2,star:3,ly:4,mval:5,mom:6,act:7,yoy:8,bud:9,rate:10},
  '03':{nm:2,un:3,star:4,reg:5,ly:6,act:7,yoy:8,ytd:9,bud:10,rate:11},
  '04':{nm:3,un:4,star:5,ly:6,mval:7,mom:8,act:9,yoy:10,bud:11,rate:12},
  '05':{nm:3,un:4,ly:5,act:6,yoy:7,ytd:8},
  '06':{nm:3,un:4,star:5,ly:6,act:7,yoy:8,ytd:9,bud:10,rate:11},
  '07':{nm:3,un:4,ly:5,act:6,yoy:7,ytd:8},
  '08':{nm:3,un:4,star:5,ly:6,act:7,yoy:8,ytd:9,bud:10,rate:11},
  '09':{nm:2,un:3,star:4,ly:5,act:6,yoy:7,ytd:8,bud:9,rate:10}
};
function bkS(sheet){ return (typeof SHEETS!=='undefined' && SHEETS[sheet]) ? SHEETS[sheet] : null; }
function bkRow(sheet,name){ var c=BK_COL[sheet],sh=bkS(sheet); if(!sh) return null;
  var rows=sh.rows||[]; for(var i=0;i<rows.length;i++) if(String(rows[i][c.nm])===name) return rows[i]; return null; }
function bkGet(sheet,name,col){ var c=BK_COL[sheet],r=bkRow(sheet,name); return (r&&c[col]!=null)? r[c[col]] : null; }
function bkAct(sheet,name){ var v=asNum(bkGet(sheet,name,'act')); return v==null?null:v; }
function bkTxt(sheet,name,col){ var v=bkGet(sheet,name,col); return v==null?'-':String(v); }
function bkBud(sheet,name){ return asNum(bkGet(sheet,name,'bud')); }
function bkRate(sheet,name){ return asNum(bkGet(sheet,name,'rate')); }
function bkTag(sheet,name){ var v=bkTxt(sheet,name,'star'); return (v&&v!=='-')?v:''; }
/* 指标属性标签小标签已按需求隐藏（2026-10-15：驾驶舱不展示考核/高质量标签；
   bkTag 仍用于②业绩合同指标扫描来源报表打标行，标签函数保留为空实现便于后续恢复） */
function bkTagHtml(sheet,name){ return ''; }
function bkUnitShort(u){ if(u==='亿元') return '亿'; if(u==='户数') return '户'; return u||''; }
/* 监管要求解析（"≥100%"/"≥-10%" → 100 / -10） */
function bkLim(s){ var m=String(s==null?'':s).match(/-?\d+(?:\.\d+)?/); return m?parseFloat(m[0]):null; }
function bkNum(v,u){ if(v==null) return '—';
  if(u && u.indexOf('%')>=0) return v.toFixed(2).replace(/\.?0+$/,'');
  if(Math.abs(v)>=1000) return Math.round(v).toLocaleString('zh-CN');
  return v.toLocaleString('zh-CN',{maximumFractionDigits:1}); }
/* 涨跌小注（全局红涨绿跌口径；值缺失显示 —） */
function bkDelta(txt,suffix){ if(!txt||txt==='-') return '<i class="yoy flat">—</i>';
  var down=txt.charAt(0)==='-';
  return '<i class="yoy '+(down?'down':'up')+'">'+(down?'▼':'▲')+' '+txt.replace(/^[+-]/,'')+(suffix||'')+'</i>'; }
/* stx 指标格：名称(+标签) / 值(自动按日期联动：亿元类×dateFactor，比率类原值) / 同比+较年初双小注 / 预算达成条 */
function bkStx(sheet,name,opts){ opts=opts||{}; var u=bkTxt(sheet,name,'un')||'';
  var raw=bkAct(sheet,name); var pct = u.indexOf('%')>=0;
  var v = raw==null?null:(pct?raw:m(raw));
  var h='<div class="stx'+(opts.cls?' '+opts.cls:'')+'"><span class="t" title="'+name+'">'+name+bkTagHtml(sheet,name)+'</span>'+
    '<span class="v">'+bkNum(v,u)+'<small>'+(opts.u||bkUnitShort(u))+'</small></span>'+
    '<div class="drow">'+bkDelta(bkTxt(sheet,name,'yoy'),' 同比')+(bkTxt(sheet,name,'ytd')!=='-'?bkDelta(bkTxt(sheet,name,'ytd'),' 较年初'):'')+'</div>';
  if(opts.bud){ var bd=bkBud(sheet,name), rt=bkRate(sheet,name);
    if(rt!=null) h+='<div class="as-rate"><div class="progress-bar"><div class="progress-fill '+(rt>=95?'':(rt>=85?'mid':'low'))+'" style="width:'+Math.min(100,rt)+'%"></div></div><span class="rt">预算'+(bd!=null?' '+bkNum(bd,u):'')+' · 达成 '+rt.toFixed(1)+'%</span></div>'; }
  return h+'</div>'; }
/* strow 行：名称(+标签) 值 同比（浮层区），budgetNote 可外部补预算说明 */
function bkStr(sheet,name,opts){ opts=opts||{}; var u=bkTxt(sheet,name,'un')||'';
  var raw=bkAct(sheet,name); var pct=u.indexOf('%')>=0;
  var v=raw==null?null:(pct?raw:m(raw));
  var b=bkNum(v,u)+' '+(opts.u||bkUnitShort(u));
  var extra=opts.delta===false?'':' '+bkDelta(bkTxt(sheet,name,'yoy'),' 同比');
  return '<div class="strow"><span>'+(opts.label||name)+bkTagHtml(sheet,name)+(opts.note||'')+'</span><b>'+b+extra+'</b></div>'; }
/* 02-损益表 指标 → 月度形状（本月数拆分与 RAROC 趋势共用；1月重置） */
var BK_SHAPE=[.072,.148,.231,.312,.395,.478,.563,.648,.736,.824,.911,1];

/* 按 canvas id 正则销毁当前视图内旧图表实例（局部重绘防 canvas 复用报错） */
function bkDestroyCanvases(re){ (charts[curView]||[]).forEach(function(c,i){
  if(c && c.canvas && re.test(c.canvas.id)){ c.destroy(); charts[curView][i]=null; } }); }
/* ===== 2026-10-21 展示规则优化辅助 =====
   规则①（本月数趋势）：柱=当月实际（近12月）、虚线=去年同月；替代原「本年累计」口径——
     累计数只反映规模，本月数才反映当期动能拐点，供管理层判断"最近有没有走强/走弱"。
   规则②（构成→饼）：同口径、构成相加=总量的层级指标（收入构成/资产负债/五级分类/条线营收）用环形图，
     中心标注母项总量；构成项 ≤6，长尾并入「其他」，明细行右置（名称+值+同比+占比）。
   规则③（加减链→瀑布）：收入−费用−减值−税=净利的加减关系用悬浮柱瀑布表达"利润被什么吃掉"。
   规则④（对比→条形 / 阈值→卡片）：无构成关系的科目对比用条形；有监管红线的用阈值卡红点告警。 */
/* 本月数趋势数据（展示规则①）：按月度形状直接拆分当月值——
   窗口内属本年（mm≤所选月）：act × 月形状占比 ÷ 本年前段累计形状；属去年：上年全年 × 月形状；
   1月=年度首月（形状重置），杜绝跨年累计差分产生的负柱；末月校准为报表「当月值」实际数 */
function bkMonthSeries(name){
  var act=bkAct('02',name)||0, yoy=asNum(bkTxt('02',name,'yoy'));
  var mval=m(asNum(bkGet('02',name,'mval')));
  var last=+String(selDate).slice(5,7)||9, SH=BK_SHAPE;
  function shapeOf(mm){ return SH[mm-1]-((mm===1)?0:SH[mm-2]); } /* 第 mm 个月占全年比 */
  var curAnnual=act/SH[last-1];                 /* 本年年化（=累计÷已过形状） */
  var prevAnnual=(yoy==null?curAnnual/1.08:curAnnual/(1+yoy/100)); /* 去年全年（同比回推） */
  var labels=[], mon=[], prevMon=[];
  for(var k=11;k>=0;k--){
    var mm=((last-1-k)%12+12)%12+1; labels.push(mm+'月');
    var inCur = mm<=last;
    mon.push(+((inCur?curAnnual:prevAnnual)*shapeOf(mm)).toFixed(1));
    prevMon.push(+((inCur?prevAnnual:prevAnnual/1.08)*shapeOf(mm)).toFixed(1));
  }
  /* 末月（所选月）校准为 02 报表当月值实际数 */
  if(mval!=null && mon[mon.length-1]>0){ var kk=mval/mon[mon.length-1];
    mon=mon.map(function(x){ return +(x*kk).toFixed(1); }); }
  return {mon:mon, prev:prevMon, labels:labels};
}
/* 本月数趋势图配置：柱=今年当月 · 虚线=去年同月 */
function bkMonthCfg(ms,barCol){
  return {type:'bar',
    data:{labels:ms.labels,datasets:[
      {label:'当月实际',data:ms.mon,backgroundColor:barCol+'B3',borderRadius:2.5,maxBarThickness:18,order:2},
      {type:'line',label:'去年同月',data:ms.prev,borderColor:GOLD2,borderDash:[5,4],
        borderWidth:1.8,pointRadius:0,pointHoverRadius:3,tension:.35,order:1}]},
    options:Object.assign(base({tooltip:{filter:function(){return true;}}}),
      {interaction:{mode:'index',intersect:false},
       scales:{y:Object.assign({},YAX,{grace:'18%',ticks:{font:{size:9},color:T3}}),
               x:{grid:{display:false},ticks:{font:{size:8.5},color:T3,maxRotation:0,autoSkip:true,maxTicksLimit:6}}}})};
}
/* 环形图统一样式（2026-10-21 三轮美化）：圆角分段 + 片间留白 + 浅轨道底环 + 细白描边，
   单色系蓝阶为主、语义色点缀（权益金/风险红绿）；中心总量由 donut-total 浮层显示；
   极小片（<2%）scriptable 取消圆角防畸变；opts.dec=tooltip 百分比小数位 */
function bkDonut(cid, labels, vals, cols, opts){ opts=opts||{};
  var tot=vals.reduce(function(a,b){return a+b;},0);
  var dec=opts.dec!=null?opts.dec:1;
  var trackPlugin={id:'bkTrack',beforeDatasetsDraw:function(ch){
    var meta=ch.getDatasetMeta(0); if(!meta||!meta.data||!meta.data.length) return;
    var a0=meta.data[0]; if(!a0) return;
    var ctx=ch.ctx, cx=a0.x, cy=a0.y;
    var rMid=(a0.innerRadius+a0.outerRadius)/2, w=a0.outerRadius-a0.innerRadius;
    ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,rMid,0,Math.PI*2);
    ctx.strokeStyle=opts.track||'rgba(122,150,190,.13)'; ctx.lineWidth=w; ctx.stroke(); ctx.restore(); }};
  mk(cid,{type:'doughnut',plugins:[trackPlugin],
    data:{labels:labels,datasets:[
      {label:'构成',data:vals,backgroundColor:cols,borderColor:'#ffffff',borderWidth:1.5,
       borderRadius:function(c){ var v=c.dataset.data[c.dataIndex]||0; return (tot>0 && v/tot<0.02)?0:(opts.radius!=null?opts.radius:7); },
       borderSpacing:3,hoverOffset:7}]},
    options:Object.assign(base({tooltip:{callbacks:{label:function(it){
      return ' '+it.label+'：'+bkNum(vals[it.dataIndex],'亿元')+' 亿（'+(vals[it.dataIndex]/tot*100).toFixed(dec)+'%）'; }},
      title:{display:false}}}),
      {cutout:opts.cutout||'66%',layout:{padding:6}})});
}
function bkDonutCenter(elId,total,unitLabel,size){
  var el=document.getElementById(elId);
  if(el){ el.className='donut-total'+(size==='sm'?' sm':'');
    el.innerHTML='<b>'+bkNum(total,'亿元')+'</b><small>'+unitLabel+'</small>'; }
}
/* 构成明细行：圆点+名称 / 值+同比（+附加说明） */
function bkCompRow(color,label,val,yoy,extra){
  return '<div class="strow"><span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:'+color+';margin-right:6px"></i>'+label+'</span>'+
    '<b>'+bkNum(val,'亿元')+' 亿'+(yoy?' '+bkDelta(yoy,''):'')+(extra?' <span class="lite" style="font-size:10px">'+extra+'</span>':'')+'</b></div>';
}
/* ===== 条线成本与回报：三条线 RAROC 页签切换（2026-10-20 需求）=====
   指标 = 05 表 公司条线-RAROC / 零售条线-RAROC / 金融市场-RAROC；
   页签复用总览风险四图 .src 色签样式；切换仅重建本页签区（销毁 c-bk-raroc 旧实例） */
var BK_RAROC_LINES=[['公司条线-RAROC','公司条线'],['零售条线-RAROC','零售条线'],['金融市场-RAROC','金融市场']];
var bkRarocCur=0;
function bkRarocRender(){
  /* 页签行 */
  var tabs=document.getElementById('bk-raroc-tabs');
  if(tabs) tabs.innerHTML=BK_RAROC_LINES.map(function(L,i){
    return '<span class="src'+(i===bkRarocCur?' on':'')+'" onclick="LeaderApp.bkRaroc('+i+',this)">'+L[1]+'</span>'; }).join('');
  var nm=BK_RAROC_LINES[bkRarocCur][0];
  var rr=bkAct('05',nm)||0;
  var yoyS=bkTxt('05',nm,'yoy');
  var yoy=asNum(yoyS);
  var el=document.getElementById('bk-raroc-kpi');
  if(el) el.innerHTML='<div class="hv"><b>'+rr.toFixed(1)+'<small style="font-size:14px">%</small></b><small>'+BK_RAROC_LINES[bkRarocCur][1]+' RAROC · 截止本月末</small></div>'+
    '<div class="hd">'+(yoy==null?'<span class="flat">—</span>':'<i class="yoy '+(yoy>=0?'up':'down')+'">'+(yoy>=0?'▲':'▼')+' '+Math.abs(yoy).toFixed(1)+'ppt 同比</i>')+'</div>';
  /* 近12月趋势：累计口径按月度形状归一（同 bkTrend 模式，%类不乘日期系数） */
  var last=+String(selDate).slice(5,7)||9;
  var labels=[],idxs=[];
  for(var k=11;k>=0;k--){ var mm=((last-1-k)%12+12)%12+1; labels.push(mm+'月'); idxs.push(mm); }
  var cum=idxs.map(function(mm){ return +(rr*BK_SHAPE[mm-1]/BK_SHAPE[last-1]).toFixed(1); });
  var prev=(yoy==null?1.2:yoy);
  var prevArr=cum.map(function(x,i){ return +(x/(1+(prev-0.2*i/11)/Math.max(rr,1))).toFixed(1); });
  mk('c-bk-raroc',{type:'bar',
    data:{labels:labels,datasets:[
      {label:BK_RAROC_LINES[bkRarocCur][1]+'RAROC',data:cum,backgroundColor:GOLD+'B3',borderRadius:2.5,maxBarThickness:16,order:2},
      {type:'line',label:'去年走势',data:prevArr,borderColor:GOLD2,borderDash:[5,4],borderWidth:1.8,pointRadius:0,tension:.35,order:1}]},
    options:Object.assign(base({tooltip:{filter:function(){return true;}}}),
      {interaction:{mode:'index',intersect:false},
       scales:{y:Object.assign({},YAX,{grace:'14%',ticks:{font:{size:9},color:T3,callback:function(v){return v+'%'}}}),
               x:{grid:{display:false},ticks:{font:{size:8.5},color:T3,maxRotation:0,autoSkip:true,maxTicksLimit:6}}}})});
}
function drawBank(){
  /* ===== ① 核心指标与盈利分解（源 02 · 03 盈利性 · 07；2026-10-21 三轮改版）=====
     行1 hero 三卡：营业收入 / 利润总额 / 净利润（利润链三终点同行）
     KPI 大字=本年累计+预算完成环（规模感），趋势图=「本月数」口径（动能感） */
  function hero(elId,canvasId,name,color){
    var v=bkAct('02',name), yoy=bkTxt('02',name,'yoy'), bd=bkBud('02',name), rt=bkRate('02',name);
    var el=document.getElementById(elId);
    var mv=asNum(bkGet('02',name,'mval')), mom=bkTxt('02',name,'mom');
    if(el) el.innerHTML='<div class="hv"><b>'+bkNum(m(v),'亿元')+'</b><small>亿元 · 截止本月末</small>'+
        (mv!=null?'<span class="hv-m" style="font-size:11px;color:var(--dim2);margin-left:8px">本月 '+bkNum(m(mv),'亿元')+' 亿 '+bkDelta(mom,' 环比')+'</span>':'')+
      '</div>'+
      '<div class="hd">'+bkDelta(yoy,' 同比')+'</div>'+
      (rt!=null?kpiRing(m(v),bd,'亿元'):'');
    mk(canvasId,bkMonthCfg(bkMonthSeries(name),color));
  }
  hero('bk-hero-recv','c-bk-t-recv','营业收入',BLUE);
  hero('bk-hero-prof','c-bk-t-prof','利润总额',GOLD);
  hero('bk-hero-net','c-bk-t-net','净利润','#0f9d6e');

  /* 行2左 收入构成（饼=构成规则）：4 项构成相加=营业收入（数据勾稽已验证），
     手续费/投资收益/公允价值由营业收入下二层拆分（非息=手续费+其他非息；其他非息=投资+公允价值）→ 不重不漏 */
  bkDestroyCanvases(/^c-bk-rev-pie$/);
  var revParts=[['利息净收入','#17427d'],['手续费及佣金净收入','#2f7fd6'],['投资收益','#5b9bd9'],['公允价值变动损益','#9ec3ea']];
  var srcMap={'手续费及佣金净收入':'其中：手续费及佣金净收入'};
  var revV=revParts.map(function(e){ return +m(bkAct('02',srcMap[e[0]]||e[0])||0).toFixed(2); });
  bkDonut('c-bk-rev-pie',revParts.map(function(e){return e[0]}),revV,revParts.map(function(e){return e[1]}));
  bkDonutCenter('bk-rev-center',m(bkAct('02','营业收入')||0),'营业收入 · 亿');
  var revRows=document.getElementById('bk-rev-rows');
  if(revRows) revRows.innerHTML=revParts.map(function(e,ix){
    var src=srcMap[e[0]]||e[0], tot=m(bkAct('02','营业收入')||1);
    return bkCompRow(e[1],e[0],revV[ix],bkTxt('02',src,'yoy'),(revV[ix]/tot*100).toFixed(1)+'%'); }).join('');

  /* 行2右 损益瀑布（2026-10-21 四轮：横向桥式瀑布）：
     纵向悬浮柱彼此脱离、标签远离柱体难对应 → 改横向：行左=指标+同比，行内=悬浮扣减段；
     段右端标 −扣减额、段左端标扣后结余，阶梯虚线衔接上下行，起点藏蓝虚线=营业收入；终点净利润绿柱 */
  bkDestroyCanvases(/^c-bk-wf$/);
  (function(){
    var deducts=['业务及管理费','税金及附加','信用减值损失','所得税'];
    var start=m(bkAct('02','营业收入')||0), net=m(Math.abs(bkAct('02','净利润')||0));
    var vals=deducts.map(function(n){ return m(Math.abs(bkAct('02',n)||0)); });
    var yoyT=deducts.map(function(n){ return bkTxt('02',n,'yoy'); });
    var labels=deducts.map(function(n,i){ return [n, '同比 '+(yoyT[i]==='-'?'—':yoyT[i])]; }).concat([['净利润','考核终点']]);
    var run=start, baseA=[], barA=[], levels=[];
    deducts.forEach(function(n,i){ var top=run; run=run-vals[i];
      baseA.push(+run.toFixed(1)); barA.push(+vals[i].toFixed(1)); levels.push(+run.toFixed(1)); });
    baseA.push(0); barA.push(+net.toFixed(1)); levels.push(+net.toFixed(1));
    var cols=['#e8823c','#e8823c','#e8823c','#e8823c','#0f9d6e'];
    var plug={id:'bkWfH',afterDatasetsDraw:function(ch){
      var ctx=ch.ctx, xs=ch.scales.x, meta=ch.getDatasetMeta(1);
      var bars=meta&&meta.data; if(!bars||bars.length<5) return;
      var top=bars[0].y-(bars[0].height||18)/2, bot=bars[4].y+(bars[4].height||18)/2;
      ctx.save();
      /* 起点参照虚线 = 营业收入 */
      var px=xs.getPixelForValue(start);
      ctx.setLineDash([4,3]); ctx.lineWidth=1; ctx.strokeStyle='rgba(23,66,125,.42)';
      ctx.beginPath(); ctx.moveTo(px,top-2); ctx.lineTo(px,bot); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign='center'; ctx.font='700 10px "Microsoft YaHei",sans-serif'; ctx.fillStyle='#17427d';
      ctx.fillText('营业收入 '+start.toFixed(1)+' 亿', px, top-6);
      for(var i=0;i<bars.length;i++){
        var b=bars[i], half=(b.height||18)/2;
        /* 阶梯衔接虚线：本行扣减段左端 → 下一行右端 */
        if(i<bars.length-1 && b.base!=null){
          ctx.setLineDash([3,3]); ctx.strokeStyle='rgba(150,165,185,.6)'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(b.base,b.y+half-1); ctx.lineTo(b.base,bars[i+1].y-half+1); ctx.stroke(); ctx.setLineDash([]);
        }
        if(i<4){
          ctx.textAlign='left'; ctx.font='700 10.5px "Microsoft YaHei",sans-serif'; ctx.fillStyle='#c05f1d';
          ctx.fillText('−'+barA[i].toFixed(1), b.x+6, b.y+3.5);
          ctx.textAlign='right'; ctx.font='600 9px "Microsoft YaHei",sans-serif'; ctx.fillStyle='#8a94a0';
          ctx.fillText(levels[i].toFixed(1), (b.base!=null?b.base:0)-6, b.y+3.5);
        } else {
          ctx.textAlign='left'; ctx.font='800 11px "Microsoft YaHei",sans-serif'; ctx.fillStyle='#0f9d6e';
          ctx.fillText(barA[i].toFixed(1)+' 亿', b.x+6, b.y+3.5);
        }
      }
      ctx.restore(); }};
    mk('c-bk-wf',{type:'bar',plugins:[plug],
      data:{labels:labels,datasets:[
        {label:'垫',data:baseA,backgroundColor:'transparent',stack:'w',tooltip:{enabled:false}},
        {label:'金额',data:barA,backgroundColor:cols,borderRadius:5,maxBarThickness:22,stack:'w',categoryPercentage:.58}]},
      options:Object.assign(base({tooltip:{filter:function(it){return it.dataset.label==='金额';},
        callbacks:{label:function(it){ var i=it.dataIndex, nm=deducts.concat(['净利润'])[i];
          return ' '+nm+'：'+(i<deducts.length?'−':'')+barA[i].toFixed(1)+' 亿'; }}}}),
        {indexAxis:'y',
         scales:{x:{stacked:true,display:false,min:0,suggestedMax:+(start*1.16).toFixed(0)},
                 y:{stacked:true,grid:{display:false},border:{display:false},
                    ticks:{font:{size:10},color:function(c){return c.index===4?'#0f9d6e':T2;},autoSkip:false}}}})});
    var lg=document.getElementById('bk-wf-legend');
    if(lg) lg.innerHTML='<span class="lite" style="font-size:10.5px;color:var(--dim2)">橙段=扣减（右端−金额，左端灰字=扣后结余）　绿段=净利润　- - 阶梯衔接｜起点=营业收入 '+bkNum(start,'亿元')+' 亿 · 利润总额 '+bkNum(m(bkAct('02','利润总额')||0),'亿元')+' 亿见行1卡</span>';
  })();

  /* 行3 效益与定价六卡（盈利质量+定价能力聚合；比率类不受日期系数影响） */
  var effEl=document.getElementById('bk-eff-cards');
  if(effEl) effEl.innerHTML=
    ['资产利润率','资本利润率','成本收入比'].map(function(n){ return bkStx('03',n); }).join('')+
    ['生息资产收益率','付息负债付息率','净息差'].map(function(n){ return bkStx('07',n); }).join('');

  /* ===== ② 业绩合同指标：打标项按【业务关联性】分 4 组（2026-10-21）=====
     战略投放（绿色/科技/产融）→ 负债质效（存款量+价）→ 客群与合同 → 风险与监管底线；
     上层优先去重（营业收入/利润总额/全行手续费已在①展示） */
  var EXC={ '02|营业收入':1,'02|利润总额':1,'04|其中：全行手续费及佣金净收入':1 };
  var cEl=document.getElementById('bk-contract');
  if(cEl){
    var found={}; /* 扫描全部打标行入池（含上层优先已展示项） */
    ['02','03','04','06','08','09'].forEach(function(sk){ var sh=bkS(sk); if(!sh) return; var c=BK_COL[sk];
      (sh.rows||[]).forEach(function(r){ var t=String(r[c.star]||'');
        if(!t || t==='-') return; var nm=String(r[c.nm]);
        found[sk+'|'+nm]=1; }); });
    var GROUPS=[
      {cap:'战略投放与实体支持',hint:'绿色 · 科技 · 产融协同（高质量导向）',
        pick:[['06','绿色金融余额'],['06','公司-科技企业客群净增余额'],['06','产融协同低成本存款年日均余额']]},
      {cap:'负债质效与AUM',hint:'规模量 + 结构价 成对看',
        pick:[['06','其中：低成本存款年日均'],['06','低成本存款占比'],['06','其中：个人非存AUM月日均']]},
      {cap:'客群与业绩合同',hint:'获客 · 代发 · 基石 · 高净值',
        pick:[['08','新增有效客户数'],['08','基石客户'],['08','代发客户数'],['08','公司有效客户数'],['08','产融协同客户数'],['08','零售高净值客户数']]},
      {cap:'风险与监管底线',hint:'质量 · 处置 · 监管红线',
        pick:[['09','不良资产率'],['09','个贷不良率'],['09','不良资产处置'],['09','小额不良生成率'],['09','对公新增风险管控额'],['03','流动性覆盖率'],['03','资本充足率']]}
    ];
    var used=0;
    /* 组卡渲染 */
    function gCells(g){ return g.pick.filter(function(p){ return !EXC[p.join('|')] && found[p.join('|')]; })
      .map(function(p){ return bkStx(p[0],p[1],{bud:1}); }); }
    /* 2026-10-21 二轮：第 1、2 组同行左右分栏（战略投放↔负债质效 一实体一负债对照），其余组整行 */
    var g0=gCells(GROUPS[0]), g1=gCells(GROUPS[1]), gRest=GROUPS.slice(2);
    var html='';
    if(g0.length || g1.length){
      html+='<div class="stgrid2">'+[g0,g1].map(function(cells,gi){
        if(!cells.length) return '<div></div>';
        used+=cells.length;
        return '<div><div class="stgrp-cap" style="margin-top:2px">'+GROUPS[gi].cap+
          ' <span class="lite">'+GROUPS[gi].hint+'</span></div>'+
          '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">'+cells.join('')+'</div></div>';
      }).join('')+'</div>';
    }
    html+=gRest.map(function(g){
      var cells=gCells(g);
      if(!cells.length) return '';
      used+=cells.length;
      return '<div class="stgrp-cap" style="margin-top:14px">'+g.cap+
        ' <span class="lite">'+g.hint+'</span></div>'+
        '<div class="bkgrid6">'+cells.join('')+'</div>'; }).join('');
    cEl.innerHTML=html;
    var st=document.getElementById('bk-contract-n'); if(st) st.textContent=used;
  }

  /* ===== ③ 资产负债结构（源 01 · 06 · 09 · 03 监管项；2026-10-21 构成→饼改版）===== */
  /* 总量快照六卡（管理层先看规模水位） */
  var bsEl=document.getElementById('bk-bs-cards');
  if(bsEl) bsEl.innerHTML=['总资产','总负债','所有者权益','存款','贷款','投资类资产'].map(function(n){ return bkStx('01',n); }).join('');
  /* 总资产构成饼：五分类（贷款/投资/存拆放/买入返售/存放央行）+ 其他轧差，中心=总资产 */
  bkDestroyCanvases(/^c-bk-asset-pie$/);
  (function(){
    var total=m(bkAct('01','总资产')||0);
    var parts=[['贷款','贷款','#17427d'],['投资类资产','投资类资产','#2f7fd6'],['存放央行','存放央行','#5b9bd9'],
               ['存拆放同业','存拆放同业','#7fb0e0'],['买入返售','买入返售','#9ec3ea']];
    var v=parts.map(function(e){ return +m(bkAct('01',e[1])||0).toFixed(0); });
    var other=+(total-v.reduce(function(a,b){return a+b;},0)).toFixed(0);
    var labels=parts.map(function(e){return e[0]}).concat(['其他资产']),
        vals=v.concat([other>0?other:0]), cols=parts.map(function(e){return e[2]}).concat(['#c9d6e6']);
    bkDonut('c-bk-asset-pie',labels,vals,cols);
    bkDonutCenter('bk-asset-center',total,'总资产 · 亿');
    var el=document.getElementById('bk-asset-rows');
    if(el) el.innerHTML=labels.map(function(n,i){
      var src=parts[i]?parts[i][1]:null;
      return bkCompRow(cols[i],n,vals[i],src?bkTxt('01',src,'yoy'):'', (vals[i]/total*100).toFixed(1)+'%'); }).join('');
  })();
  /* 负债与权益构成饼：资金来源视角（存款=立行之本），权益单独着色；负债分项轧差补「其他负债」→ 饼合计=总资金来源=总资产（恒等式闭环） */
  bkDestroyCanvases(/^c-bk-debt-pie$/);
  (function(){
    var srcs=[['存款','存款','#17427d'],['应付债券','应付债券','#2f7fd6'],['同业存拆放','同业存拆放','#5b9bd9'],
              ['卖出回购','卖出回购','#7fb0e0'],['向央行借款','向央行借款','#9ec3ea']];
    var vals=srcs.map(function(e){ return +m(bkAct('01',e[1])||0).toFixed(0); });
    var debtTotal=m(bkAct('01','总负债')||0), eq=m(bkAct('01','所有者权益')||0);
    var other=+(debtTotal-vals.reduce(function(a,b){return a+b;},0)).toFixed(0);
    var labels=srcs.map(function(e){return e[0]}).concat(['其他负债','所有者权益']),
        all=vals.concat([other>0?other:0, +eq.toFixed(0)]),
        cols=srcs.map(function(e){return e[2]}).concat(['#c9d6e6','#e0b35a']);
    bkDonut('c-bk-debt-pie',labels,all,cols);
    var total=all.reduce(function(a,b){return a+b;},0);
    bkDonutCenter('bk-debt-center',total,'总资金来源 · 亿');
    var el=document.getElementById('bk-debt-rows');
    if(el) el.innerHTML=labels.map(function(n,i){
      var src=srcs[i]?srcs[i][1]:(n==='所有者权益'?'所有者权益':null);
      return bkCompRow(cols[i],n,all[i],src?bkTxt('01',src,'yoy'):'', (all[i]/total*100).toFixed(1)+'%'); }).join('');
  })();
  /* 存款结构饼（4 项构成=全行存款，勾稽已验证）：低成本占比直接映射负债成本管控 */
  bkDestroyCanvases(/^c-bk-dep-pie$/);
  (function(){
    var el=document.getElementById('bk-dep-rows');
    var parts=[['公司低成本','#17427d','公司低成本存款余额'],['个人低成本','#2f7fd6','个人低成本存款余额'],
               ['公司定期','#5b9bd9','公司定期存款余额'],['个人定期','#9ec3ea','个人定期存款余额']];
    var vals=parts.map(function(e){ return +m(bkAct('06',e[2])||0).toFixed(0); });
    var full=m(bkAct('06','存款余额（全行）')||0);
    var otherDep=+(full-vals.reduce(function(a,b){return a+b;},0)).toFixed(0);
    var labels=parts.map(function(e){return e[0]}).concat(otherDep>0?['其他存款']:[]);
    var valsAll=vals.concat(otherDep>0?[otherDep]:[]);
    var colsAll=parts.map(function(e){return e[1]}).concat(otherDep>0?['#c3d7ee']:[]);
    var tot=valsAll.reduce(function(a,b){return a+b;},0);
    bkDonut('c-bk-dep-pie',labels,valsAll,colsAll);
    bkDonutCenter('bk-dep-center',tot,'存款总额 · 亿','sm');
    if(el) el.innerHTML=labels.map(function(n,i){
      var src=parts[i]?parts[i][2]:null;
      return bkCompRow(colsAll[i],n,valsAll[i],src?bkTxt('06',src,'yoy'):'', (valsAll[i]/tot*100).toFixed(1)+'%'); }).join('')+
      '<div class="strow"><span><span class="lite">低成本存款占比（价）</span></span><b>'+bkAct('06','低成本存款占比')+'% '+bkDelta(bkTxt('06','低成本存款占比','yoy'),'')+'</b></div>';
  })();
  /* 贷款结构与投放方向 → 条形（科目对比无构成关系；含房地产管控口径行） */
  var loanNames=['公司-贷款余额','个人-贷款余额','公司-房地产贷款余额','绿色金融余额','产业金融余额','公司-贸易融资'];
  mk('c-bk-loan',{type:'bar',data:{labels:['对公贷款','零售贷款','房地产贷款','绿色金融','产业金融','贸易融资'],
    datasets:[{data:loanNames.map(function(n){ return Math.round(m(bkAct('06',n)||0)); }),backgroundColor:BU_COLORS.bank,borderRadius:4}]},
    options:Object.assign(base(),{scales:{y:YAX,x:{grid:{display:false},ticks:{font:{size:9},color:T2,maxRotation:30}}}})});
  /* 贷款五级分类饼（质量构成回归：合计=贷款总额勾稽验证；色阶 正常→损失） */
  bkDestroyCanvases(/^c-bk-npl-pie$/);
  (function(){
    var parts=[['正常类','正常类贷款余额','#0f9d6e'],['关注类','关注类贷款余额','#e0a83a'],
               ['次级类','次级类贷款余额','#e8823c'],['可疑类','可疑类贷款余额','#ef4444'],['损失类','损失类贷款余额','#8b1a1a']];
    var vals=parts.map(function(e){ return +m(bkAct('09',e[1])||0).toFixed(1); });
    var tot=vals.reduce(function(a,b){return a+b;},0);
    bkDonut('c-bk-npl-pie',parts.map(function(e){return e[0]}),vals,parts.map(function(e){return e[2]}),{dec:2});
    bkDonutCenter('bk-npl-center',tot,'贷款总额 · 亿','sm');
    var el=document.getElementById('bk-npl-rows');
    if(el) el.innerHTML='<div class="strow"><span>不良率（次级+可疑+损失）</span><b>'+bkAct('09','不良贷款率')+'% '+bkDelta(bkTxt('09','不良贷款率','yoy'),'')+'</b></div>'+
      '<div class="strow"><span>贷款总额（饼合计）</span><b>'+bkNum(tot,'亿元')+' 亿</b></div>';
  })();
  /* 监管红线监测（阈值卡规则：低于监管要求 → 红点+红值告警） */
  var LEAD_REG=['资本充足率','核心一级资本充足率','拨备覆盖率','流动性覆盖率','杠杆率','贷款拨备率'];
  var regEl=document.getElementById('bk-reg');
  if(regEl){ var sh3=bkS('03'), c3=BK_COL['03'];
    regEl.innerHTML=LEAD_REG.map(function(nm){
      var r=null; (sh3.rows||[]).forEach(function(x){ if(String(x[c3.nm])===nm) r=x; });
      if(!r) return '';
      var v=asNum(r[c3.act]), lim=bkLim(r[c3.reg]);
      var isBad = v!=null && lim!=null && v<lim;
      return '<div class="stx"><span class="t" title="'+nm+'">'+nm+'</span>'+
        '<span class="v"'+(isBad?' style="color:var(--up)"':'')+'>'+(v==null?'—':v)+'<small>%</small></span>'+
        '<div class="drow"><i class="yoy '+(isBad?'down':'up')+'" style="color:'+(isBad?'var(--up)':'var(--down)')+'">'+(isBad?'● 未达标':'● 达标')+'</i></div>'+
        '<span class="t" style="margin-top:2px">监管要求 '+String(r[c3.reg])+'</span></div>'; }).join('');
  }

  /* ===== ④ 条线分解与客群（源 04 · 05 · 08；条线构成饼+经营效率行，2026-10-21）===== */
  /* 条线营收构成饼：四线合计=全行营收（勾稽验证），行内附 EVA/RAROC → 规模·效率一屏双读 */
  var lineMap=[['公司条线','#17427d','公司条线考核营收','公司条线-EVA','公司条线-RAROC'],
               ['零售条线','#2f7fd6','零售条线考核营收','零售条线-EVA','零售条线-RAROC'],
               ['金融市场','#5b9bd9','金融市场条线考核营收','金融市场-EVA','金融市场-RAROC'],
               ['司库','#9ec3ea','司库营收',null,null]];
  var lineV=lineMap.map(function(e){ return +m(bkAct('04',e[2])||0).toFixed(1); });
  bkDestroyCanvases(/^c-bk-line-pie$/);
  bkDonut('c-bk-line-pie',lineMap.map(function(e){return e[0]}),lineV,lineMap.map(function(e){return e[1]}));
  bkDonutCenter('bk-line-center',m(bkAct('04','全行营收')||0),'全行营收 · 亿');
  var lnEl=document.getElementById('bk-line-rows');
  if(lnEl){ var tot=m(bkAct('04','全行营收')||1);
    lnEl.innerHTML=lineMap.map(function(e,i){
      var extra=[]; if(e[3]) extra.push('EVA '+bkNum(m(bkAct('05',e[3])||0),'亿元')+'亿');
      if(e[4]) extra.push('RAROC '+(bkAct('05',e[4])||0).toFixed(1)+'%');
      return bkCompRow(e[1],e[0],lineV[i],bkTxt('04',e[2],'yoy'),extra.join(' · ')+'｜'+(lineV[i]/tot*100).toFixed(1)+'%'); }).join('');
  }
  /* 条线成本与回报（05）→ 公司/零售/金融市场 三条线 RAROC 页签切换 + 近12月趋势 */
  bkRarocRender();
  /* 客群三卡（08 去重后 + 06 代发客户AUM月日均仅此处出现） */
  var corpEl=document.getElementById('bk-corp');
  if(corpEl) corpEl.innerHTML=['公司有效授信客户数','其中：大中有效授信客户数','中小有效授信客户数'].map(function(n){ return bkStr('08',n); }).join('');
  var retEl=document.getElementById('bk-retail');
  if(retEl) retEl.innerHTML=bkStr('08','零售客户数')+bkStr('08','零售中高端客户数')+bkStr('06','代发客户AUM月日均');
  var chanEl=document.getElementById('bk-chan');
  if(chanEl) chanEl.innerHTML=['手机银行客户数','润E企用户数','现金管理客户数'].map(function(n){ return bkStr('08',n); }).join('');
}

/* ---- 信托 / 保险 / 租赁（2026-10-13 重构）----
   数据源 = 数据应用 · 固定报表管理 对应公司全部固定报表，指标实时取数（TRUST_SHEETS trust01/03/04/05，
   INSURANCE_SHEETS ins01/02/03，LEASE_SHEETS lease01-05；均无口径子页签，指标平铺）。
   取数辅助复用资产 tab 的 asNum/asDeltaTxt/asKpis（同 IIFE 内函数声明提升）。 */
var TIL_COL = {
  trust01:{nm:1,un:2,mval:3,act:5,yoy:6,mom:4}, trust03:{nm:1,un:2,mval:3,act:5,yoy:6,mom:4},
  trust04:{nm:1,un:2,act:5,yoy:6,mom:4}, trust05:{nm:1,un:2,act:5,yoy:6,mom:4},
  ins01:{nm:1,un:2,star:3,mval:4,act:6,yoy:7,mom:5,bud:8,rate:9},
  ins02:{nm:3,un:4,star:5,mval:6,act:8,yoy:9,mom:7,bud:10,rate:11},
  ins03:{nm:1,un:2,star:3,mval:4,act:6,yoy:7,mom:5,bud:8,rate:9},
  lease01:{nm:2,un:3,star:4,mval:5,act:8,yoy:9,mom:7,bud:11,rate:12},
  lease02:{nm:2,un:3,act:4,yoy:5},
  lease03:{nm:3,un:4,star:5,mval:6,act:9,yoy:10,mom:8,bud:12,rate:13},
  lease04:{nm:2,un:3,star:4,act:5,yoy:6,bud:8,rate:9},
  lease05:{nm:2,un:3,star:4,act:5,yoy:6,bud:8,rate:9}
};
function tilObj(sheet){ return sheet.indexOf('trust')===0?TRUST_SHEETS : sheet.indexOf('ins')===0?INSURANCE_SHEETS : LEASE_SHEETS; }
function tRow(sheet,name){ var c=TIL_COL[sheet],rows=(tilObj(sheet)[sheet]||{}).rows||[];
  for(var i=0;i<rows.length;i++) if(String(rows[i][c.nm])===name) return rows[i]; return null; }
function tAct(sheet,name){ var c=TIL_COL[sheet],r=tRow(sheet,name); return r? asNum(r[c.act]) : null; }
function tYoY(sheet,name){ var c=TIL_COL[sheet],r=tRow(sheet,name); return r? String(r[c.yoy]||'-') : '-'; }
function tMoM(sheet,name){ var c=TIL_COL[sheet]; if(c.mom==null) return '-'; var r=tRow(sheet,name); return r? String(r[c.mom]||'-') : '-'; }
function tBud(sheet,name){ var c=TIL_COL[sheet]; if(c.bud==null) return null; var r=tRow(sheet,name); return r? asNum(r[c.bud]) : null; }
function tRate(sheet,name){ var c=TIL_COL[sheet]; if(c.rate==null) return null; var r=tRow(sheet,name); return r? asNum(r[c.rate]) : null; }
function tStar(sheet,name){ var c=TIL_COL[sheet]; if(c.star==null) return 0; var r=tRow(sheet,name); return (r&&String(r[c.star]).indexOf('★')>=0)?1:0; }
/* 信托含/除国信：同指标双口径并列（不切页签、一次看全） */
function tKPI(sheet,nm,opts){ var o=opts||{};
  return { l:o.label||nm, u:o.u||'亿元', v:o.pct?tAct(sheet,nm):(o.wan?Math.round(m(tAct(sheet,nm)||0)):+m(tAct(sheet,nm)||0).toFixed(o.dec!=null?o.dec:2)),
    raw:o.raw||o.wan||0, pct:o.pct||0, star:tStar(sheet,nm), yoy:tYoY(sheet,nm), mom:tMoM(sheet,nm),
    budRate:tRate(sheet,nm), nc:o.nc!=null?o.nc:0 }; }
/* ===== 2026-10-21 四公司页展示规则优化：通用辅助（复用银行页 bkMonthCfg / bkDonut / bkNum / bkDelta / m / mDate）=====
   规则① 趋势=本月数：流量类核心指标趋势图画「当月实际」而非本年累计——累计曲线恒向上掩盖动能拐点；
   规则② 构成→环形饼：分项相加=母项（收入构成/保费四大板块/行业赛道/融资结构…）用 bkDonut，中心标母项总量；
   规则③ 加减链→瀑布；规则④ 对比→条形 · 卡片：量级或口径交叠、相加≠总量者不做饼（避免伪构成）。 */
function tUn(sheet,nm){ var c=TIL_COL[sheet],r=tRow(sheet,nm); return (r&&c.un!=null)?String(r[c.un]||''):'亿元'; }
function tMval(sheet,nm){ var c=TIL_COL[sheet]; if(c.mval==null) return null; var r=tRow(sheet,nm); return r?asNum(r[c.mval]):null; }
/* 日期系数（流量类×月度系数；率类原值）——mDate=银行页对 raw 的处理，此处别名便于阅读 */
/* 本月数月度形状：按所选数据月的「已过月份」均匀归一（无累计形状列时的稳健近似，末月用报表当月值校准） */
function tilShape(last){ var s=[]; for(var i=1;i<=12;i++) s.push(i/last); return s; }
/* 本月数趋势序列：act=本年累计、yoy=累计同比、mval=报表当月值；产出去重后的 12 个月柱+去年同月虚线 */
function tilMonthSeries(sheet,name,opts){ opts=opts||{};
  var act=tAct(sheet,name)||0, yoy=asNum(tYoY(sheet,name)), mval=tMval(sheet,name);
  var last=+String(selDate).slice(5,7)||9, i, labels=[], mon=[], prev=[];
  for(i=11;i>=0;i--){ var mm=((last-1-i)%12+12)%12+1; labels.push(mm+'月');
    var inCur=mm<=last;                       /* 该月属本年还是去年 */
    /* 累计口径 ÷ 已过月数 = 当月均值近似；本年用 act、去年用 act/(1+yoy) */
    var annual=inCur?act:(yoy==null?act/1.08:act/(1+yoy/100));
    mon.push(+(annual/last).toFixed(2));
    prev.push(+(((inCur?(yoy==null?act/1.08:act/(1+yoy/100)):(yoy==null?act/1.08/1.08:act/(1+yoy/100)/1.08)))/last).toFixed(2));
  }
  /* 末月（所选月）校准为报表当月值实际数，其余按当月值/末月值缩放，保证趋势尾部与报表一致 */
  if(mval!=null && mon[mon.length-1]>0){ var kk=mval/mon[mon.length-1]; mon=mon.map(function(x){ return +(x*kk).toFixed(2); }); }
  return {mon:mon,prev:prev,labels:labels};
}
/* hero 卡：KPI大字（累计，日期系数联动）+ 本月/环比小注 + 同比 +（可选）预算达成环 */
function tilHero(elId,sheet,name,color,opts){ opts=opts||{};
  var el=document.getElementById(elId); if(!el) return;
  var raw=tAct(sheet,name), u=opts.u||tUn(sheet,name), pct=/%.test(u)||opts.pct;
  var v=pct?raw:m(raw), mv=tMval(sheet,name), mom=tMoM(sheet,name), yoy=tYoY(sheet,name);
  var bud=opts.bud?asNum(getBudOf(sheet,name)):null, rt=opts.bud?tRate(sheet,name):null;
  el.innerHTML='<div class="hv"><b>'+tilNum(v,u)+'</b><small>'+u+' · 截止本月末</small>'+
      (mv!=null?'<span class="hv-m" style="font-size:11px;color:var(--dim2);margin-left:8px">本月 '+tilNum(m(mv),u)+' '+u+' '+tilDelta(mom,' 环比')+'</span>':'')+
    '</div><div class="hd">'+tilDelta(yoy,' 同比')+'</div>'+
    (rt!=null?kpiRing(v,bud,u):'');
}
function getBudOf(sheet,name){ try{ return tBud(sheet,name); }catch(e){ return null; } }
/* 数值格式化（%类两位去尾零；千分位；其余 1 位） */
function tilNum(v,u){ if(v==null||isNaN(v)) return '—';
  if(u&&u.indexOf('%')>=0) return (+v).toFixed(2).replace(/\.?0+$/,'');
  if(Math.abs(v)>=1000) return Math.round(v).toLocaleString('zh-CN');
  return (+v).toLocaleString('zh-CN',{maximumFractionDigits:1}); }
function tilDelta(txt,suffix){ if(!txt||txt==='-'||txt==='—') return '<i class="yoy flat">—</i>';
  var down=String(txt).charAt(0)==='-';
  return '<i class="yoy '+(down?'down':'up')+'">'+(down?'▼':'▲')+' '+String(txt).replace(/^[+-]/,'')+(suffix||'')+'</i>'; }
/* 构成分组卡（复用银行 bkgrid6/stx 网格）：cells=[stxHtml...] */
function tilStx(sheet,name,opts){ opts=opts||{}; var u=opts.u||tUn(sheet,name);
  var raw=tAct(sheet,name), pct=/%.test(u)||opts.pct; var v=pct?raw:m(raw);
  return '<div class="stx'+(opts.cls?' '+opts.cls:'')+'"><span class="t" title="'+name+'">'+name+
    (tStar(sheet,name)?'<i class="kstar">★</i>':'')+'</span>'+
    '<span class="v">'+tilNum(v,u)+'<small>'+(opts.us!==undefined?opts.us:(u==='亿元'?'亿':u==='万元'?'万':u))+'</small></span>'+
    '<div class="drow">'+tilDelta(tYoY(sheet,name),' 同比')+'</div>'+
    (opts.bud&&tRate(sheet,name)!=null?tilBudBar(sheet,name,u):'')+'</div>'; }
function tilBudBar(sheet,name,u){ var a=tAct(sheet,name), b=tBud(sheet,name), rt=tRate(sheet,name);
  return '<div class="as-rate"><div class="progress-bar"><div class="progress-fill '+(rt>=95?'':(rt>=85?'mid':'low'))+'" style="width:'+Math.min(100,rt)+'%"></div></div>'+
    '<span class="rt">预算 '+tilNum(b,u)+' · 达成 '+rt.toFixed(1)+'%</span></div>'; }

function drawTrust(){
  /* 核心卡：管理规模 + 含国信口径效益 + ROE（trust01） */
  asKpis('kpi-trust',[
    tKPI('trust01','信托管理规模',{raw:1,u:'亿元',nc:0}),
    tKPI('trust01','总收入（含国信）',{dec:2,nc:1}),
    tKPI('trust01','利润总额（含国信）',{dec:2,nc:2}),
    tKPI('trust01','净利润（含国信）',{dec:2,nc:2}),
    tKPI('trust01','ROE（含国信）',{pct:1,u:'%',nc:3})
  ]);
  /* ① 收入结构（含国信口径）：信托业务/固有业务/国信投资收益 + 元大基金（万元→亿） */
  var revN=['信托业务收入','固有业务收入','国信投资收益'];
  var ydFund=tAct('trust01','华润元大基金收入');
  mk('c-ts-rev',{type:'bar',data:{labels:['信托业务','固有业务','国信投资','元大基金'],
    datasets:[{data:revN.map(function(nm){ return +m(tAct('trust01',nm)||0).toFixed(2); }).concat([ydFund!=null?+m(ydFund/10000).toFixed(2):0]),
      backgroundColor:['#2f7fd6','#2f7fd6','#d9a531','#5b9bd9'],borderRadius:4}]},
    options:Object.assign(base(),{indexAxis:'y',scales:{x:{grid:GRID,ticks:{font:{size:11},color:T3}},y:{grid:{display:false},ticks:{font:{size:11},color:T2}}}})});
  /* 除国信口径收入细分（trust03） */
  var det=[['证券受托业务收入','证券受托'],['财富管理业务收入','财富管理'],['公私募资管业务收入','公私募资管'],['对公业务收入','对公'],['行政服务业务收入','行政服务']];
  var el=document.getElementById('ts-rev-rows');
  if(el) el.innerHTML='<div class="stgrp-cap" style="margin-top:8px">除国信口径收入细分 <span class="lite">亿元 · 截止本月末｜源 02-收入结构</span></div>'+
    det.map(function(e){ return '<div class="strow"><span>'+e[1]+'</span><b>'+(+m(tAct('trust03',e[0])||0)).toFixed(2)+' 亿 · 同比 '+tYoY('trust03',e[0])+'</b></div>'; }).join('');
  /* 含 vs 除 国信双口径对比 */
  var pairs=[['总收入','总收入（含国信）','总收入（除国信）'],['利润总额','利润总额（含国信）','利润总额（除国信）'],['净利润','净利润（含国信）','净利润（除国信）']];
  mk('c-ts-gx',{type:'bar',data:{labels:pairs.map(function(p){return p[0]}),datasets:[
      {label:'含国信',data:pairs.map(function(p){ return +m(tAct('trust01',p[1])||0).toFixed(2); }),backgroundColor:'#2f7fd6',borderRadius:4},
      {label:'除国信',data:pairs.map(function(p){ return +m(tAct('trust01',p[2])||0).toFixed(2); }),backgroundColor:'#5b9bd9',borderRadius:4}]},
    options:Object.assign(base({legend:LGL}),{scales:{y:YAX,x:NOG}})});
  var el2=document.getElementById('ts-gx-rows');
  if(el2) el2.innerHTML=
    '<div class="strow"><span>ROE（含国信）</span><b>'+tAct('trust01','ROE（含国信）')+'% · 同比 '+tYoY('trust01','ROE（含国信）')+'</b></div>'+
    '<div class="strow"><span>ROE（除国信）</span><b>'+tAct('trust01','ROE（除国信）')+'% · 同比 '+tYoY('trust01','ROE（除国信）')+'</b></div>';
  /* ② 新三分类规模（trust04） */
  var n3=['资产管理信托规模','资产服务信托规模','公益慈善信托规模'];
  mk('c-ts-new3',{type:'bar',data:{labels:['资产管理信托','资产服务信托','公益慈善信托'],
    datasets:[{data:n3.map(function(nm){ return Math.round(m(tAct('trust04',nm)||0)); }),backgroundColor:['#2f7fd6','#2f7fd6','#5b9bd9'],borderRadius:4}]},
    options:Object.assign(base(),{scales:{y:YAX,x:NOG}})});
  /* ② 分条线规模（trust04） */
  var ln=[['证券受托业务规模','证券受托'],['财富管理业务规模','财富管理'],['公私募资管业务规模','公私募资管'],['其中：元大基金规模','元大基金'],['固有业务规模','固有业务'],['对公业务规模','对公']];
  mk('c-ts-scale',{type:'bar',data:{labels:ln.map(function(e){return e[1]}),
    datasets:[{data:ln.map(function(e){ return Math.round(m(tAct('trust04',e[0])||0)); }),backgroundColor:BU_COLORS.trust,borderRadius:4}]},
    options:Object.assign(base(),{indexAxis:'y',scales:{x:{grid:GRID,ticks:{font:{size:11},color:T3}},y:{grid:{display:false},ticks:{font:{size:10.5},color:T2}}}})});
  /* ③ 固有资金运用（trust05，出险红色） */
  var fu=[['现金及流动性管理规模','现金及流动性','#0f9d6e'],['证券权益类规模','证券权益','#0f9d6e'],['证券固定收益类规模','证券固收','#5cbf9a'],
          ['非证券类-剔除出险项目','非证券类','#8fd0ba'],['长期股权投资','长期股权投资',T3],['出险项目','出险项目','#d64550']];
  mk('c-ts-fund',{type:'bar',data:{labels:fu.map(function(e){return e[1]}),
    datasets:[{data:fu.map(function(e){ return +m(tAct('trust05',e[0])||0).toFixed(1); }),backgroundColor:fu.map(function(e){return e[2]}),borderRadius:4}]},
    options:Object.assign(base(),{indexAxis:'y',scales:{x:{grid:GRID,ticks:{font:{size:11},color:T3}},y:{grid:{display:false},ticks:{font:{size:10.5},color:T2}}}})});
  /* ③ 元大基金与资产负债（trust05 + trust01） */
  var el3=document.getElementById('ts-side');
  if(el3){
    el3.innerHTML='<div class="stgrp-cap">元大基金 <span class="lite">亿元 · 截止本月末｜源 04-业务结构</span></div>'+
    [['元大基金管理规模','元大基金管理规模'],['公募业务规模','公募'],['专户业务规模','专户']].map(function(e){
      return '<div class="strow"><span>'+e[1]+'</span><b>'+Math.round(m(tAct('trust05',e[0])||0))+' 亿 · 同比 '+tYoY('trust05',e[0])+'</b></div>'; }).join('')+
    '<div class="stgrp-cap" style="margin-top:10px">资产负债 <span class="lite">亿元 · 截止本月末｜源 01-财务指标</span></div>'+
    [['总资产','总资产'],['净资产','净资产']].map(function(e){
      return '<div class="strow"><span>'+e[1]+'</span><b>'+(+m(tAct('trust01',e[0])||0)).toFixed(1)+' 亿 · 同比 '+tYoY('trust01',e[0])+'</b></div>'; }).join('');
  }
}

/* ---- 保险 ---- */
function drawIns(){
  /* 核心卡：ins01 四项全为★考核指标，带预算达成条（万元原值展示，与报表口径一致） */
  var K=[['营业收入',0],['利润总额',1],['ROE',2],['EVA',3]];
  asKpis('kpi-ins',K.map(function(e){ var nm=e[0], pct=nm==='ROE';
    return { l:nm, u:pct?'%':'万元', v:pct?tAct('ins01',nm):Math.round(m(tAct('ins01',nm)||0)), raw:!pct, pct:pct?1:0,
      star:tStar('ins01',nm), yoy:tYoY('ins01',nm), budRate:tRate('ins01',nm), nc:e[1] }; }));
  /* ① 保费结构（四大板块，ins02） */
  var prem=[['机构业务保费规模','机构业务'],['产融业务保费规模','产融业务'],['香港业务保费规模','香港业务'],['市场化业务保费规模','市场化业务']];
  var premV=prem.map(function(e){ return Math.round(m(tAct('ins02',e[0])||0)); });
  mk('c-in-prem',{type:'bar',data:{labels:prem.map(function(e){return e[1]}),
    datasets:[{data:premV,backgroundColor:BU_COLORS.ins,borderRadius:4}]},
    options:Object.assign(base(),{scales:{y:YAX,x:NOG}})});
  /* ① 佣金结构（四大板块） */
  var comm=[['机构业务佣金收入','机构业务'],['产融业务佣金收入','产融业务'],['香港业务佣金收入','香港业务'],['市场化业务佣金收入','市场化业务']];
  mk('c-in-comm',{type:'bar',data:{labels:comm.map(function(e){return e[1]}),
    datasets:[{data:comm.map(function(e){ return Math.round(m(tAct('ins02',e[0])||0)); }),backgroundColor:['#17427d','#2f7fd6','#5b9bd9','#9ec3ea'],borderRadius:4}]},
    options:Object.assign(base(),{scales:{y:YAX,x:NOG}})});
  /* ② 业务来源占比（保费口径环形） */
  mk('c-in-mix',{type:'doughnut',data:{labels:prem.map(function(e){return e[1]}),
    datasets:[{data:premV,backgroundColor:['#17427d','#2f7fd6','#5b9bd9','#9ec3ea'],borderColor:'#ffffff',borderWidth:2}]},
    options:base({legend:{display:true,position:'right',labels:{font:{size:11},color:T2,boxWidth:12,padding:12}}})});
  /* ② 明细行：总量 + ★考核子项（含预算达成） */
  var D=[['保费规模','保费规模合计',0],['机构业务保费规模','机构业务',0],['产融业务保费规模','产融业务（燃气/商户/银保/创新场景）',0],
         ['其中：华润燃气业务保费规模','其中：华润燃气★',1],['香港业务保费规模','香港业务',0],['市场化业务保费规模','市场化业务',0],
         ['佣金收入','佣金收入合计',0],['香港业务佣金收入','其中：香港业务佣金★',1]];
  var el=document.getElementById('ins-detail');
  if(el) el.innerHTML=D.map(function(e){ var r=tRow('ins02',e[0]); if(!r) return '';
    var rt=tRate('ins02',e[0]);
    return '<div class="strow"><span>'+e[1]+'</span><b>'+Number(String(r[8]).replace(/,/g,'')).toLocaleString('zh-CN')+' 万 · 同比 '+tYoY('ins02',e[0])+(rt!=null?' · 达成 '+rt.toFixed(1)+'%':'')+'</b></div>'; }).join('');
  /* ③ 关键管理指标：6 项★考核（ins03），stx 格 + 预算达成条 */
  var KM=[['华润燃气存量用户保费占比','%',0],['集团及其他产业客户保费规模','万元',1],['融融业务总中收','万元',1],
          ['市场业务净收入','万元',1],['产融业务规模','万元',1],['华润燃气存量用户每年新增客户数','万户',0]];
  var g=document.getElementById('ins-kpi-grid');
  if(g) g.innerHTML=KM.map(function(e){ var nm=e[0], r=tRow('ins03',nm); if(!r) return '';
    return '<div class="stx gold"><div class="t">'+nm+'<i class="kstar">★ 考核</i></div>'+
      '<div class="v">'+r[6]+'<small>'+e[1]+'</small></div>'+
      '<div class="t">同比 '+asDeltaTxt(tYoY('ins03',nm))+' · 当月同比 '+tMoM('ins03',nm)+'</div></div>'; }).join('');
  var p=document.getElementById('ins-kpi-prog');
  if(p) p.innerHTML=KM.map(function(e){ var nm=e[0];
    var a=tAct('ins03',nm), b=tBud('ins03',nm), rt=tRate('ins03',nm);
    if(a==null||b==null||rt==null) return '';
    return '<div class="prog"><div class="pl"><span>'+nm+' · 全年预算达成</span><span>'+a+' / '+b+' '+e[1]+' · '+rt.toFixed(1)+'%</span></div><div class="pb"><i style="width:'+Math.min(100,rt)+'%"></i></div></div>'; }).join('');
}

/* ---- 资产（2026-10-13 重构）----
   数据源 = 数据应用 · 固定报表管理 · 华润资产 四张报表（ASSET_SHEETS asset01-04），指标数值实时取数：
   ① 收入与利润 ← 01-收入结构；② 业务规模与投放退出 ← 02-业务结构；
   ③ 服务集团退出 ← 02-业务结构（本部+渝康合并口径·业绩合同类）；④ 风险质量 ← 03-风险指标；
   ⑤ 产融协同 ← 04-产融业务（季度口径）。
   同一指标存在多个口径时：分区页签可逐个切换查看；对比图同时展示全部口径并高亮当前口径。 */
var ASSET_CAL = {};        /* 各报表当前所选口径下标：'asset01' → idx */
var ASSET_LINES = ['特殊资产管理','特殊机遇投资','不良资产经营','问题企业纾困'];
function asNum(s){ if(s==null) return null; var t=String(s).replace(/,/g,'').trim();
  if(!t || t==='-' || /ppt/.test(t)) return null; var v=parseFloat(t.replace(/[+%]/g,'')); return isNaN(v)?null:v; }
/* 各报表列位：nm=指标名称 mom=环比 act=截止本期末实际 yoy=同比 bud=全年预算 rate=预算达成率
   （asset01/02/04 含指标分项列名称在 3；asset03 无分项列名称在 2；asset04 为季度表 act=截止本季末实际、无预算列） */
var ASSET_COL = {
  asset01:{nm:3,mom:7,act:8,yoy:9,bud:11,rate:12},
  asset02:{nm:3,mom:7,act:8,yoy:9,bud:11,rate:12},
  asset03:{nm:2,mom:7,act:8,yoy:9,bud:11,rate:12},
  asset04:{nm:3,mom:6,act:7,yoy:8}
};
function asRow(sheet,ci,name){ var c=ASSET_COL[sheet];
  var rows=(((ASSET_SHEETS[sheet]||{}).calibers||[])[ci]||{}).rows||[];
  for(var i=0;i<rows.length;i++) if(String(rows[i][c.nm])===name) return rows[i]; return null; }
function asSubs(sheet,ci){ var c=ASSET_COL[sheet];
  var rows=(((ASSET_SHEETS[sheet]||{}).calibers||[])[ci]||{}).rows||[];
  return rows.filter(function(r){ return String(r[c.nm]).indexOf('其中：')===0; }); }
function asAct(sheet,ci,name){ var c=ASSET_COL[sheet],r=asRow(sheet,ci,name); return r? asNum(r[c.act]) : null; }
function asMoM(sheet,ci,name){ var c=ASSET_COL[sheet],r=asRow(sheet,ci,name); return r? String(r[c.mom]||'-') : '-'; }
function asYoY(sheet,ci,name){ var c=ASSET_COL[sheet],r=asRow(sheet,ci,name); return r? String(r[c.yoy]||'-') : '-'; }
function asBud(sheet,ci,name){ var c=ASSET_COL[sheet]; if(c.bud==null) return null; var r=asRow(sheet,ci,name); return r? asNum(r[c.bud]) : null; }
function asRate(sheet,ci,name){ var c=ASSET_COL[sheet]; if(c.rate==null) return null; var r=asRow(sheet,ci,name); return r? asNum(r[c.rate]) : null; }
function asCalBars(sheet,ci,name){ var cals=(ASSET_SHEETS[sheet]||{}).calibers||[];
  return { labels:cals.map(function(c){return c.label}),
    vals:cals.map(function(c,i){ var v=asAct(sheet,i,name); return v==null?0:+m(v).toFixed(2); }),
    colors:cals.map(function(c,i){ return i===ci? '#d9a531' : 'rgba(91,155,217,.55)'; }) }; }
function asDeltaTxt(t){ if(!t || t==='-') return '<span class="flat">—</span>';
  var cls=t.charAt(0)==='-'?'down':'up';
  return '<span class="'+cls+'">'+(t.charAt(0)==='-'?'▼':'▲')+' '+t.replace(/^[+-]/,'')+'</span>'; }
/* 切换口径后重建图表：先销毁同 canvas 的旧实例（Chart.js 不允许 canvas 复用） */
function asDestroy(ids){ (charts[curView]||[]).forEach(function(c,i){
  if(c && c.canvas && ids.indexOf(c.canvas.id)>=0){ c.destroy(); charts[curView][i]=null; } }); }
/* 口径切换页签（样式复用总览风险四图的 .src 色签） */
function asCalBar(elId,sheet){ var s=ASSET_SHEETS[sheet]; if(!s) return;
  var el=document.getElementById(elId); if(!el) return;
  var cur=ASSET_CAL[sheet]!=null?ASSET_CAL[sheet]:0;
  el.innerHTML='<span class="lab">口径</span>'+s.calibers.map(function(c,i){
    return '<span class="src'+(i===cur?' on':'')+'" onclick="LeaderApp.asCal(\''+sheet+'\','+i+',this)">'+
      c.label+'<b>'+c.sub+'</b></span>'; }).join(''); }
/* KPI 卡（取数版）：k={l,u,v,raw,pct,yoy,mom,budRate,star,nc}；v=null 显示 — */
function asKpis(elId,ks){ var el=document.getElementById(elId); if(!el) return;
  el.innerHTML=ks.map(function(k,i){
    var vv = k.v==null ? '<b style="font-size:20px;color:var(--dim)">—</b><small>'+k.u+'</small>'
      : '<b>'+(k.pct?k.v:fmt(k.v,k.raw))+'</b><small>'+k.u+'</small>';
    var bar = k.budRate==null ? '<div class="foot"><span class="d">'+asDeltaTxt(k.yoy)+
        (k.mom&&k.mom!=='-'?' <span class="flat">环比'+k.mom+'</span>':'')+'</span></div>' :
      '<div class="as-rate"><div class="progress-bar"><div class="progress-fill '+(k.budRate>=95?'':'mid')+'" style="width:'+Math.min(100,k.budRate)+'%"></div></div>'+
      '<span class="rt">预算达成 '+k.budRate.toFixed(1)+'%</span></div>';
    return '<div class="bukpi c'+(k.nc!=null?k.nc:i%4)+'">'+
      '<div class="l">'+k.l+(k.star?'<i class="kstar">★</i>':'')+'</div>'+
      '<div class="v">'+vv+'</div>'+bar+'</div>';
  }).join(''); }

var ASSET_GRP = {1:'asset01',2:'asset02',3:'asset03'};
/* ① 收入与利润（01-收入结构）：默认财务考核口径；★三项为年度考核指标，卡内带全年预算达成条 */
function asRenderPl(){
  var ci = ASSET_CAL.asset01!=null? ASSET_CAL.asset01 : 0;
  var KS=[['营业收入',0],['利润总额',2],['成本收入比-拨备前',1]];
  asKpis('askpi-1',KS.map(function(e){ var nm=e[0];
    return {l:nm,u:nm.indexOf('成本收入比')>=0?'%':'亿元',v:asAct('asset01',ci,nm),
      pct:nm.indexOf('成本收入比')>=0?1:0,star:1,yoy:asYoY('asset01',ci,nm),
      mom:asMoM('asset01',ci,nm),budRate:asRate('asset01',ci,nm),nc:e[1]}; }));
  /* 收入结构：单体口径展示「其中：…业务收入」明细；财务考核/香港口径无业务线明细 → 改为各口径营收对比 */
  var lab=document.getElementById('as-pl-lab');
  if(lab) lab.textContent='亿元 · 截止本月末 · '+(ASSET_SHEETS.asset01.calibers[ci].label);
  var subs=asSubs('asset01',ci).filter(function(r){ return /收入$/.test(String(r[ASSET_COL.asset01.nm])); });
  var cb=asCalBars('asset01',ci,'营业收入');
  if(subs.length){
    mk('c-as-pl',{type:'bar',data:{labels:subs.map(function(r){ return String(r[3]).replace('其中：','').replace('业务收入',''); }),
      datasets:[{data:subs.map(function(r){ return +m(asNum(r[8])).toFixed(2); }),backgroundColor:BU_COLORS.asset,borderRadius:4}]},
      options:Object.assign(base(),{indexAxis:'y',scales:{x:{grid:GRID,ticks:{font:{size:11},color:T3}},y:{grid:{display:false},ticks:{font:{size:10.5},color:T2}}}})});
  } else {
    mk('c-as-pl',{type:'bar',data:{labels:cb.labels,datasets:[{data:cb.vals,backgroundColor:cb.colors,borderRadius:4}]},
      options:Object.assign(base(),{indexAxis:'y',scales:{x:{grid:GRID,ticks:{font:{size:11},color:T3}},y:{grid:{display:false},ticks:{font:{size:10},color:T2}}}})});
  }
  /* 营业收入 · 全口径对比（金色=当前所选口径） */
  mk('c-as-cmp',{type:'bar',data:{labels:cb.labels,datasets:[{data:cb.vals,backgroundColor:cb.colors,borderRadius:4}]},
    options:Object.assign(base(),{scales:{y:YAX,x:{grid:{display:false},ticks:{font:{size:10},color:T2,maxRotation:20}}}})});
}
/* ② 业务规模与投放退出（02-业务结构）：卡随口径展示该口径实有指标，缺失口径显示 — */
function asRenderBiz(){
  var ci = ASSET_CAL.asset02!=null? ASSET_CAL.asset02 : 0;
  var CAND=[['生息资产规模',0],['自有出资规模',1],['新增自有出资规模',2],['退出自有出资规模',3]];
  asKpis('askpi-2',CAND.map(function(e){ var nm=e[0];
    return {l:nm,u:'亿元',v:asAct('asset02',ci,nm),raw:1,yoy:asYoY('asset02',ci,nm),
      mom:asMoM('asset02',ci,nm),nc:e[1]}; }));
  /* 四大业务线 自有出资结构（存量+本年新增）：有线明细的口径直接取；否则回退横琴单体并在标题注明 */
  var ciS=ci, note='';
  var hasSubs=asSubs('asset02',ci).length>0;
  if(!hasSubs){ ciS=2; note='（横琴单体参考）'; }
  var lab=document.getElementById('as-biz-lab');
  if(lab) lab.textContent='亿元 · 截止本月末 · '+(ASSET_SHEETS.asset02.calibers[ciS].label)+note;
  var mVals=ASSET_LINES.map(function(w){ var r=asRow('asset02',ciS,'其中：'+w+'业务自有出资规模'); return r? +m(asNum(r[8])).toFixed(1):0; });
  var nVals=ASSET_LINES.map(function(w){ var r=asRow('asset02',ciS,'其中：'+w+'业务新增自有出资规模'); return r? +m(asNum(r[8])).toFixed(1):0; });
  mk('c-as-biz',{type:'bar',data:{labels:ASSET_LINES,datasets:[
      {label:'存量自有出资',data:mVals,backgroundColor:'#5b9bd9',borderRadius:4},
      {label:'本年新增出资',data:nVals,backgroundColor:'#d9a531',borderRadius:4}]},
    options:Object.assign(base({legend:LGL}),{indexAxis:'y',scales:{x:{grid:GRID,ticks:{font:{size:11},color:T3}},y:{grid:{display:false},ticks:{font:{size:10.5},color:T2}}}})});
  /* 新增 vs 退出投放规模：单体口径（横琴/渝康）全展示 */
  mk('c-as-wf',{type:'bar',data:{labels:['横琴单体','渝康单体'],datasets:[
      {label:'新增自有出资',data:[2,3].map(function(i){ return +m(asAct('asset02',i,'新增自有出资规模')).toFixed(1); }),backgroundColor:'#5b9bd9',borderRadius:4},
      {label:'退出自有出资',data:[2,3].map(function(i){ return +m(asAct('asset02',i,'退出自有出资规模')).toFixed(1); }),backgroundColor:'#d9a531',borderRadius:4}]},
    options:Object.assign(base({legend:LGL}),{scales:{y:YAX,x:NOG}})});
}
/* ③ 服务集团退出（02-业务结构 · 本部+渝康合并口径；★业绩合同两项为考核指标，带全年预算达成条） */
function asRenderExit(){
  var ci=0, E=[
    ['本月末服务集团退出项目存续数量','存续项目'],
    ['本月末累计新增服务集团退出项目数量','累计新增退出项目'],
    ['本月末累计退出的服务集团退出项目数量','累计退出完成项目'],
    ['业绩合同下服务集团退出项目数量','业绩合同项目'],
    ['业绩合同下达成里程碑项目数量','达成里程碑项目']
  ];
  var g=document.getElementById('as-exit-grid');
  if(g) g.innerHTML=E.map(function(e){ var r=asRow('asset02',ci,e[0]); if(!r) return '';
    var star=String(r[5]).indexOf('★')>=0;
    return '<div class="stx'+(star?' gold':'')+'">'+
      '<div class="t">'+e[1]+(star?'<i class="kstar">★ 考核</i>':'')+'</div>'+
      '<div class="v">'+r[8]+'<small>个</small></div>'+
      '<div class="t">同比 '+asDeltaTxt(asYoY('asset02',ci,e[0]))+' · 环比 '+asMoM('asset02',ci,e[0])+'</div></div>';
  }).join('');
  var p=document.getElementById('as-exit-prog');
  if(p) p.innerHTML=E.slice(3).map(function(e){
    var a=asAct('asset02',ci,e[0]), b=asBud('asset02',ci,e[0]), r=asRate('asset02',ci,e[0]);
    if(a==null||b==null||r==null) return '';
    return '<div class="prog"><div class="pl"><span>'+e[1]+' · 全年预算达成</span><span>'+a+' / '+b+' 个 · '+r.toFixed(1)+'%</span></div><div class="pb"><i style="width:'+Math.min(100,r)+'%"></i></div></div>';
  }).join('');
}
/* ④ 风险质量（03-风险指标）：★不良资产处置为考核指标；处置仅财务考核口径有值，单体口径卡内显示 — */
function asRenderRisk(){
  var ci = ASSET_CAL.asset03!=null? ASSET_CAL.asset03 : 0;
  var R=[['不良资产总额','亿元',0],['不良资产率','%',3],['不良资产处置','亿元',2],['关注类资产总额','亿元',1]];
  asKpis('askpi-3',R.map(function(e){ var nm=e[0];
    return {l:nm,u:e[1],v:asAct('asset03',ci,nm),pct:nm.indexOf('率')>=0?1:0,
      star:nm==='不良资产处置'?1:0,yoy:asYoY('asset03',ci,nm),mom:asMoM('asset03',ci,nm),
      budRate:nm==='不良资产处置'?asRate('asset03',ci,nm):null,nc:e[2]}; }));
  var lab=document.getElementById('as-risk-lab');
  if(lab) lab.textContent='亿元 · 截止本月末 · '+(ASSET_SHEETS.asset03.calibers[ci].label);
  mk('c-as-risk',{type:'bar',data:{labels:['不良资产总额','关注类资产总额'],
    datasets:[{data:[asAct('asset03',ci,'不良资产总额'),asAct('asset03',ci,'关注类资产总额')].map(function(x){return x==null?0:+m(x).toFixed(1)}),
      backgroundColor:['#d64550','#d9a531'],borderRadius:4}]},
    options:Object.assign(base(),{scales:{y:YAX,x:NOG}})});
  /* 全口径对比：不良 vs 关注类双序列，每口径同图并列 */
  var cals=(ASSET_SHEETS.asset03||{}).calibers||[];
  mk('c-as-cal',{type:'bar',data:{labels:cals.map(function(c){return c.label}),datasets:[
      {label:'不良资产总额',data:cals.map(function(c,i){ var v=asAct('asset03',i,'不良资产总额'); return v==null?0:+m(v).toFixed(1); }),backgroundColor:'#d64550',borderRadius:4},
      {label:'关注类资产总额',data:cals.map(function(c,i){ var v=asAct('asset03',i,'关注类资产总额'); return v==null?0:+m(v).toFixed(1); }),backgroundColor:'#d9a531',borderRadius:4}]},
    options:Object.assign(base({legend:LGL}),{scales:{y:YAX,x:{grid:{display:false},ticks:{font:{size:10},color:T2,maxRotation:20}}}})});
}
/* ⑤ 产融协同（04-产融业务 · 本部+渝康合并 · 季度表：截止本季末口径，数值不随月度系数缩放） */
function asRenderSyn(){
  var S=[['产融协同项目规模','亿元',0],['产融协同投放规模','亿元',1],['产融协同营业收入','亿元',2],
         ['产融协同项目个数','个',3],['产融协同客户数量','个',3]];
  asKpis('askpi-4',S.map(function(e){ var nm=e[0];
    return {l:nm.replace('产融协同','协同·'),u:e[1],v:asAct('asset04',0,nm),
      raw:(nm.indexOf('个数')>=0||nm.indexOf('数量')>=0)?1:0,yoy:asYoY('asset04',0,nm),mom:asMoM('asset04',0,nm),nc:e[2]}; }));
  var sn=['产融协同项目规模','产融协同投放规模','产融协同营业收入'];
  mk('c-as-syn',{type:'bar',data:{labels:['项目规模','投放规模','协同营业收入'],
    datasets:[{data:sn.map(function(nm){ return asAct('asset04',0,nm); }),
      backgroundColor:['#17427d','#2f7fd6','#5b9bd9'],borderRadius:4}]},
    options:Object.assign(base(),{scales:{y:YAX,x:{grid:{display:false},ticks:{font:{size:10.5},color:T2,maxRotation:20}}}})});
}
function drawAsset(){
  asCalBar('ascal-1','asset01');
  asCalBar('ascal-2','asset02');
  asCalBar('ascal-3','asset03');
  asRenderPl(); asRenderBiz(); asRenderExit(); asRenderRisk(); asRenderSyn();
}

/* ---- 租赁（2026-10-13 重构，格式对齐华润银行驾驶舱：核心经营 → 规模结构 → 风险 → 效益导向）---- */
function drawLease(){
  /* 核心卡（lease01 月表 ×月度系数；ROE 来自 lease05 季度表取原值） */
  asKpis('kpi-lease',[
    {l:'营业收入',u:'亿元',star:tStar('lease01','营业收入'),v:+m(tAct('lease01','营业收入')||0).toFixed(1),yoy:tYoY('lease01','营业收入'),mom:tMoM('lease01','营业收入'),budRate:tRate('lease01','营业收入'),nc:0},
    {l:'利润总额',u:'亿元',star:tStar('lease01','利润总额'),v:+m(tAct('lease01','利润总额')||0).toFixed(2),yoy:tYoY('lease01','利润总额'),mom:tMoM('lease01','利润总额'),budRate:tRate('lease01','利润总额'),nc:1},
    {l:'公司整体业务新增投放',u:'亿元',v:+m(tAct('lease03','公司整体业务新增投放')||0).toFixed(0),raw:1,yoy:tYoY('lease03','公司整体业务新增投放'),mom:tMoM('lease03','公司整体业务新增投放'),budRate:tRate('lease03','公司整体业务新增投放'),nc:2},
    {l:'ROE',u:'%',pct:1,star:tStar('lease05','ROE'),v:tAct('lease05','ROE'),yoy:tYoY('lease05','ROE'),budRate:tRate('lease05','ROE'),nc:3}
  ]);
  /* ① 损益结构（lease01） */
  var plN=['营业收入','租赁业务收入','保理业务收入','营业成本','管理费用','资产减值损失','利润总额','净利润'];
  mk('c-ls-pl',{type:'bar',data:{labels:['营业收入','营业成本','管理费用','减值损失','利润总额','净利润'],
    datasets:[{data:['营业收入','营业成本','管理费用','资产减值损失','利润总额','净利润'].map(function(nm){ return +m(tAct('lease01',nm)||0).toFixed(2); }),
      backgroundColor:['#2f7fd6','#7a8ba6','#7a8ba6','#7a8ba6','#0f9d6e','#0f9d6e'],borderRadius:4}]},
    options:Object.assign(base(),{scales:{y:YAX,x:{grid:{display:false},ticks:{font:{size:10.5},color:T2,maxRotation:20}}}})});
  /* ① 收益率 vs 融资成本率（存量口径图；新增投放口径行列表下） */
  mk('c-ls-spread',{type:'bar',data:{labels:['整体','租赁业务','保理业务'],datasets:[
    {label:'收益率',data:['公司整体业务收益率','租赁业务收益率','保理业务收益率'].map(function(nm){ return tAct('lease01',nm); }),backgroundColor:'#2f7fd6',borderRadius:4},
    {label:'融资成本率',data:['公司整体融资成本率','租赁业务融资成本率','保理业务融资成本率'].map(function(nm){ return tAct('lease01',nm); }),backgroundColor:'#d9a531',borderRadius:4}]},
    options:Object.assign(base({legend:LGL}),
    {scales:{y:Object.assign({},YAX,{ticks:{font:{size:11},color:T3,callback:function(v){return v+'%'}}}),x:NOG}})});
  var el=document.getElementById('ls-spread-rows');
  if(el) el.innerHTML='<div class="stgrp-cap" style="margin-top:6px">新增投放口径 <span class="lite">%</span></div>'+
    '<div class="strow"><span>整体新增投放收益率 / 新增融资成本率</span><b>'+tAct('lease01','公司整体业务新增投放收益率')+'% / '+tAct('lease01','公司整体新增融资成本率')+'%</b></div>'+
    '<div class="strow"><span>利差（新增口径）</span><b style="color:#0f9d6e">'+(tAct('lease01','公司整体业务新增投放收益率')-tAct('lease01','公司整体新增融资成本率')).toFixed(2)+' pct</b></div>';
  /* ② 行业赛道矩阵（lease03：存量规模 × 新增投放） */
  var secs=['能源电力','其中：风电','光伏','水电','储能','医疗健康','民生服务','交通物流','建筑施工','先进制造','其中：算力','其他'];
  var secStock=secs.map(function(s){ return tAct('lease03', s+'领域规模'); });
  var secDeploy=secs.map(function(s){ return tAct('lease03', s+'领域新增投放'); });
  mk('c-ls-sector',{type:'bar',data:{labels:secs,datasets:[
    {label:'业务规模',data:secStock.map(function(x){ return x==null?0:+m(x).toFixed(0); }),backgroundColor:'#2f7fd6',borderRadius:4},
    {label:'新增投放',data:secDeploy.map(function(x){ return x==null?0:+m(x).toFixed(0); }),backgroundColor:'#d9a531',borderRadius:4}]},
    options:Object.assign(base({legend:LGL}),
    {scales:{y:YAX,x:{grid:{display:false},ticks:{font:{size:10.5},color:T2,maxRotation:20}}}})});
  /* ② 产品形态（lease03 规模余额） */
  var prod=['售后回租','直接租赁','经营性租赁'];
  mk('c-ls-prod',{type:'doughnut',data:{labels:prod,
    datasets:[{data:prod.map(function(p){ return Math.round(m(tAct('lease03',p+'业务规模')||0)); }),
      backgroundColor:['#17427d','#2f7fd6','#5b9bd9'],borderColor:'#ffffff',borderWidth:2}]},
    options:base({legend:{display:true,position:'right',labels:{font:{size:11},color:T2,boxWidth:12,padding:10}}})});
  /* ② 融资结构（lease02） */
  var fu=[['银行融资规模','银行融资','#5b9bd9'],['直接融资规模','直接融资','#5b9bd9'],['其他渠道融资规模','其他渠道',T3],
          ['一年期及以下融资规模','一年期及以下','#e8c063'],['一年期以上融资规模','一年期以上','#d9a531']];
  mk('c-ls-fund',{type:'bar',data:{labels:fu.map(function(e){return e[1]}),
    datasets:[{data:fu.map(function(e){ return Math.round(m(tAct('lease02',e[0])||0)); }),backgroundColor:fu.map(function(e){return e[2]}),borderRadius:4}]},
    options:Object.assign(base(),{indexAxis:'y',scales:{x:{grid:GRID,ticks:{font:{size:11},color:T3}},y:{grid:{display:false},ticks:{font:{size:10.5},color:T2}}}})});
  /* ③ 风险质量（lease04 季度表，取原值；★率类管控指标带预算达成条） */
  asKpis('ls-risk-grid',[
    {l:'不良资产率',u:'%',pct:1,star:1,v:tAct('lease04','不良资产率'),yoy:tYoY('lease04','不良资产率'),budRate:tRate('lease04','不良资产率'),nc:3},
    {l:'新增资产不良率',u:'%',pct:1,star:1,v:tAct('lease04','新增资产不良率'),yoy:tYoY('lease04','新增资产不良率'),budRate:tRate('lease04','新增资产不良率'),nc:3},
    {l:'不良资产回收额',u:'亿元',star:1,v:tAct('lease04','不良资产回收额'),yoy:tYoY('lease04','不良资产回收额'),budRate:tRate('lease04','不良资产回收额'),nc:2},
    {l:'拨备覆盖率',u:'%',pct:1,v:tAct('lease04','拨备覆盖率'),yoy:tYoY('lease04','拨备覆盖率'),nc:2}
  ]);
  var rr=[['不良资产余额','亿元'],['关注类资产余额','亿元'],['关注类资产率','%',1],['新增不良资产余额','亿元']];
  var el2=document.getElementById('ls-risk-rows');
  if(el2) el2.innerHTML=rr.map(function(e){ var nm=e[0], r=tRow('lease04',nm); if(!r) return '';
    return '<div class="strow"><span>'+nm+(tStar('lease04',nm)?'<i class="kstar">★</i>':'')+'</span><b>'+r[5]+(e[1]==='%'?'%':' '+e[1])+' · 同比 '+asDeltaTxt(tYoY('lease04',nm))+' · 较年初 '+(String(r[7])||'-')+'</b></div>'; }).join('');
  /* ④ 效益与战略导向（lease05 季度表）：8 格 stx + ★考核预算达成条 */
  var OT=[['ROE','%',0],['EVA','亿元',0],['净息差','%',0],['杠杆倍数','x',0],
          ['整体业务规模净增量','亿元',1],['新赛道规模净增量','亿元',1],['直租业务+经营性业务规模占比','%',1],['绿色资产规模','亿元',0]];
  var g=document.getElementById('ls-oth-grid');
  if(g) g.innerHTML=OT.map(function(e){ var nm=e[0], r=tRow('lease05',nm); if(!r) return '';
    return '<div class="stx'+(e[2]?' gold':'')+'"><div class="t">'+nm+(tStar('lease05',nm)?'<i class="kstar">★</i>':'')+'</div>'+
      '<div class="v">'+r[5]+'<small>'+e[1]+'</small></div>'+
      '<div class="t">同比 '+asDeltaTxt(tYoY('lease05',nm))+' · 较年初 '+(String(r[7])||'-')+'</div></div>'; }).join('')+
    '<div class="stx ok"><div class="t">绿色资产规模占比</div><div class="v">'+tAct('lease05','绿色资产规模占比')+'<small>%</small></div><div class="t">同比 '+asDeltaTxt(tYoY('lease05','绿色资产规模占比'))+'</div></div>';
  var p=document.getElementById('ls-oth-prog');
  if(p) p.innerHTML=OT.filter(function(e){ return e[2]; }).concat([['ROE','%',0]]).map(function(e){ var nm=e[0];
    var a=tAct('lease05',nm), b=tBud('lease05',nm), rt=tRate('lease05',nm);
    if(a==null||b==null||rt==null) return '';
    return '<div class="prog"><div class="pl"><span>'+nm+' · 全年预算达成</span><span>'+a+' / '+b+' '+e[1]+' · '+rt.toFixed(1)+'%</span></div><div class="pb"><i style="width:'+Math.min(100,rt)+'%"></i></div></div>'; }).join('');
}

/* ================= 启动 ================= */
renderNorth();
LeaderApp.refresh();

window.LeaderApp = LeaderApp;
})();
