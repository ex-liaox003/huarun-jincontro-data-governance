
/* 管理驾驶舱模块脚本（内嵌自 华润金控管理驾驶舱.html，IIFE 隔离；2026-10-12） */
(function(){

/* ================= 数据（样例示意） ================= */
/* 板块色：深蓝大屏底经对比度校验的提亮版（蓝/翠绿/暖金/天青/橘橙）；仅用于业务身份 */
var BU_COLORS = { bank:'#1d5ca8', trust:'#0f9d6e', ins:'#f59e0b', asset:'#5b9bd9', lease:'#e8823c' }; /* 2026-10-20 领导层统一色板（浅底经 CVD 校验） */
var T2='#42557a', T3='#7a8ba6', BLUE='#2f7fd6', BLUE2='#17427d', GOLD='#f59e0b', GOLD2='#fbbf6e';
var CAL = 1;                                // 数据固定合并口径（v3 起控件精简，不再切换）
/* 数据日期（年-月）下拉：全页数值 = 基准(2026-09) × 月度系数（原型样例联动示意） */
var MFACT = [.938,.941,.944,.947,.950,.953,.956,.960,.964,.968,.972,.976,.980,.984,.987,.990,.993,.996,.998,.999,1];
var selDate = "2026-09";
function dateFactor(){ var y=+selDate.slice(0,4), mo=+selDate.slice(5,7);
  var idx = (y-2025)*12 + (mo-1);
  return MFACT[Math.max(0, Math.min(MFACT.length-1, idx))]; }

/* 核心指标六卡（2026-10-26 按需求定序——资本约束机构阅读逻辑：回报效率→盈利结果→资本底盘→资产体量→杠杆风险；
   ROE/ROA/股东应占净利润=本年累计口径（变动行：同比/累计同比），净资产/总资产/资产负债率=本月末时点；
   dl[]=多变动行 [[标签,值,pct?]…]；单变动行沿用 yoy+yoyLbl；来源=金控风险部&华润金融_深国投指标数据梳理表「经营指标」行 */
var NORTH = [
  {l:'ROE',              u:'%',    v:9.8,  yoy:-0.4, pct:true, yoyLbl:'同比',     kal:'本年累计'},
  {l:'ROA',              u:'%',    v:0.62, yoy:0.5,  pct:true, yoyLbl:'同比',     kal:'本年累计'},
  {l:'股东应占净利润',   u:'亿元', v:26.8, yoy:8.2,  yoyLbl:'累计同比', kal:'本年累计'},
  {l:'净资产（所有者权益）', u:'亿元', v:882, raw:true, dl:[['同比','+6.1'],['较年初','+3.2']], kal:'本月末'},
  {l:'总资产',           u:'亿元', v:6820, raw:true, dl:[['同比','+5.2'],['较年初','+3.8']], kal:'本月末'},
  {l:'资产负债率',       u:'%',    v:87.1, dec:1, dl:[['同比','-0.5',true],['较年初','-0.3',true]], kal:'本月末'}
];
/* 利润链三 hero（本行下方=华润银行同款本月数柱+月度同比金线双轴） */
var OV_HERO = [
  /* 2026-10-27 按需求对齐华润银行页：三 hero 趋势柱统一亮蓝 #4d94ff（原蓝/橙/绿各异，与图例「蓝方块=本月数」不符） */
  {id:'recv', l:'营业收入', ytd:130.4, yoy:9.1,  end:15.8, seed:1,
   mon:[13.9,14.6,15.9,13.1,12.4,15.2,14.8,13.6,15.1,14.9,15.5,15.8], col:'#4d94ff'},
  {id:'prof', l:'利润总额', ytd:35.2,  yoy:6.5,  end:4.2,  seed:2,
   mon:[3.6,3.9,4.4,3.5,3.1,4.0,3.9,3.6,4.0,4.0,4.1,4.2], col:'#4d94ff'},
  {id:'net',  l:'净利润',   ytd:28.9,  yoy:7.8,  end:3.4,  seed:3,
   mon:[2.9,3.2,3.6,2.8,2.5,3.3,3.2,3.0,3.3,3.3,3.3,3.4], col:'#4d94ff'}
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
  /* 2026-10-30 按需求：管理驾驶舱全页数值统一保留 2 位小数 */
  return n.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}); }
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
/* 2026-10-31 按需求：弹框多行信息行距放宽（bodySpacing），配合各图分行的回调，
   彻底消除文字行间重叠/拥挤；白底+淡蓝细边+柔和阴影皮肤不变（全局规范） */
Chart.defaults.plugins.tooltip.bodySpacing = 4;
Chart.defaults.plugins.tooltip.displayColors = false;
Chart.defaults.plugins.tooltip.boxPadding = 0;
/* 2026-10-30 全局Tooltip统一：白底 tooltip 垫 canvas 柔和投影层（Chart.js 无阴影配置）。
   仅包裹 tooltip 实例的 drawBackground（背景+箭头带影、文字保持清晰），save/restore 在
   包裹内部严格配对，不污染绘制管线；每图 tooltip 实例只包一次（_shWrap 标记） */
Chart.register({id:'tipShadow',
  beforeTooltipDraw:function(ch,args){ var tt=args&&args.tooltip;
    if(!tt||tt._shWrap||typeof tt.drawBackground!=='function') return;
    tt._shWrap=true;
    var orig=tt.drawBackground;
    tt.drawBackground=function(pos,ctx,size,opts){
      ctx.save();
      ctx.shadowColor='rgba(70,130,210,.22)'; ctx.shadowBlur=16; ctx.shadowOffsetY=5;
      orig.call(this,pos,ctx,size,opts);
      ctx.restore(); };
  }});

/* 2026-10-31 按需求：环形饼悬停 Tooltip 与饼中心总量浮层重叠的根因修复——
   .donut-total 是 DOM 元素，绘制层级永远在 canvas 内绘制的 tooltip 之上（收入/支出构成、
   存/贷款结构、条线营收构成等卡中心「229.50 亿元」压住弹框文字）。
   tooltip 活跃（opacity>0.05）期间把中心浮层淡至 .15（保留"家底还在"的暗示但绝不与
   弹框文字打架），弹框收起自动恢复；用 afterTooltipDraw 钩子（tooltip 淡入淡出每帧都会
   回调，不能放 afterDraw——v4 的 tooltip 动画帧不触发 canvas 整体重绘）。
   0.18s transition 做渐隐渐显与弹框动画同节奏 */
Chart.register({id:'donutTipLift',
  afterDraw:function(ch){
    if(!ch||!ch.tooltip) return;
    var tt=ch.tooltip;
    if(tt.opacity>0.05) return; /* 活跃期交给 afterTooltipDraw */
    var el=centerOf(ch); if(el&&el.style.opacity!=='1') el.style.opacity='1';
  },
  afterTooltipDraw:function(ch,args){
    var tt=args&&args.tooltip; if(!tt||tt.opacity<=0.05) return;
    var el=centerOf(ch); if(el&&el.style.opacity!=='0.15') el.style.opacity='0.15';
  }});
function centerOf(ch){
  var cv=ch&&ch.canvas; if(!cv||!cv.parentElement||!cv.parentElement.parentElement) return null;
  return cv.parentElement.parentElement.querySelector(':scope > .donut-total');
}

}
var charts = {};
function m(x){ return x*dateFactor(); }

/* 悬停值单位映射（华润金融页利润总额/风险四图走外部 .ld-tip 浮层已带亿元，此处覆盖其余 tab 图表） */
var TIP_UNIT={ 'c-bk-loan':'亿元','c-bk-dep':'亿元','c-bk-line':'亿元',
  'c-bk-t-recv':'亿元','c-bk-t-prof':'亿元','c-bk-rc-0':'亿元','c-bk-rc-1':'亿元',
  'c-bk-wf-0':'亿元','c-bk-wf-1':'亿元','c-bk-wf-2':'亿元','c-bk-wf-3':'亿元','c-bk-wf-4':'亿元','c-bk-raroc':'%','c-bk-eva':'亿元',
  'c-ts-scale':'亿元','c-ts-rev':'亿元','c-ts-fund':'亿元','c-ts-gx':'亿元','c-ts-new3':'亿元',
  'c-ts-t-rev':'亿元','c-ts-t-prof':'亿元','c-ts-t-net':'亿元',
  'c-in-prem':'万元','c-in-comm':'万元','c-in-mix':'万元',
  'c-in-t-rev':'万元','c-in-t-prof':'万元','c-in-t-net':'万元','c-in-t-prem':'万元','c-in-t-comm':'万元',
  'c-as-wf':'亿元','c-as-biz':'亿元','c-as-pl':'亿元','c-as-syn':'亿元','c-as-cmp':'亿元','c-as-risk':'亿元','c-as-cal':'亿元',
  'c-as-t-rev':'亿元','c-as-t-prof':'亿元',
  'c-ls-pl':'亿元','c-ls-sector':'亿元','c-ls-prod':'亿元','c-ls-spread':'%','c-ls-fund':'亿元',
  'c-ls-t-rev':'亿元','c-ls-t-prof':'亿元','c-ls-t-net':'亿元','c-ls-deploy':'亿元' };
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
      var txt=Math.abs(v).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
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
  if(id!=='c-bk-pl'&&id!=='c-ls-wf'&&!/^(c-bk-(t-|rc-|wf-)|c-bk-(raroc|eva)$|c-(ts|in|as|ls)-t-|c-ov-t-|c-ov-conc-)/.test(id)&&(cfg.type==='bar'||(cfg.data&&cfg.data.datasets&&cfg.data.datasets.some(function(d){return !d.type})))){ (cfg.plugins=cfg.plugins||[]).push(barValLabel); }
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
      var txt=Number(v).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
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
    if(sheet==='asset01'){ asDestroy(['c-as-pl','c-as-cmp','c-as-rev-pie','c-as-t-rev','c-as-t-prof']); asRenderPl(); }
    else if(sheet==='asset02'){ asDestroy(['c-as-own-pie','c-as-wf']); asRenderBiz(); }
    else if(sheet==='asset03'){ asDestroy(['c-as-risk','c-as-cal']); asRenderRisk(); } },
  /* 银行 tab：条线页签切换（重建左 RAROC + 右 EVA 两图） */
  bkRaroc:function(i,el){ bkRarocCur=i;
    if(el){ var p=el.parentNode; p.querySelectorAll('.src').forEach(function(b){b.classList.remove('on')}); el.classList.add('on'); }
    bkDestroyCanvases(/^c-bk-(raroc|eva)$/); bkRarocRender(); },
  go:function(id,el){ curView=id;
    document.querySelectorAll('#moduleLeader header nav button').forEach(function(b){b.classList.remove('on')}); el.classList.add('on');
    document.querySelectorAll('#moduleLeader .view').forEach(function(v){v.classList.remove('on')});
    document.getElementById('v-'+id).classList.add('on');
    this.refresh(); },
  refresh:function(){ var tp=document.querySelector('.ld-tip'); if(tp) tp.style.display='none';
    charts[curView] && charts[curView].forEach(function(c){ c && c.destroy() }); charts[curView]=[];
    ({overview:drawOverview,bank:drawBank,trust:drawTrust,ins:drawIns,asset:drawAsset,lease:drawLease})[curView](); }
};

/* 华润金融 tab 指标卡生成器（fkk，2026-10-26 参考驾驶舱 gk 指标卡样式）：
   hdr=名称；kal=口径徽标；rows=[[行标签,值,单位,[[涨跌标签,串,pct?]…]],…]；note=卡底浅注
   行版式对齐参考图：左=标签，中=大数值+单位，右=「同比 ▲ +5.6%」式涨跌（可多个） */
function fkkCard(hdr, kal, rows, note){
  var h='<div class="fkk"><div class="fkk-h">'+hdr+
    (kal?'<span class="fkk-kal">'+kal+'</span>':'')+'<span class="fkk-info">ⓘ</span></div><div class="fkk-b">';
  rows.forEach(function(r){
    var lbl=r[0], val=r[1], u=r[2], ds=r[3]||[];
    var dHtml=ds.map(function(d){ var s=String(d[1]), down=s.charAt(0)==='-';
      return '<span class="fkk-dl">'+d[0]+' <span class="fkk-d '+(down?'down':'up')+'">'+(down?'▼':'▲')+' '+s.replace(/^[+-]/,'')+(d[2]?'pct':'%')+'</span></span>'; }).join('');
    h+='<div class="fkk-l"><span class="fkk-cap">'+lbl+'</span><span class="fkk-v"><b>'+val+'</b><small>'+u+'</small></span>'+
      '<span class="fkk-dwrap">'+dHtml+'</span></div>';
  });
  if(note) h+='<div class="fkk-note">'+note+'</div>';
  return h+'</div></div>';
}
/* 核心六卡纵排变体（2026-10-26 按参考图）：卡头只留名称+ⓘ（口径徽标移入卡体）；
   体=口径标签（第一行）→ 大数值 → 「累计同比 / 同比: 值↑」 */
function fkkCardStack(hdr, kal, val, u, dLbl, dVal, pct){
  function dLine(lb, s, p){ var down=String(s).charAt(0)==='-', flat=(s==='—'||s==='');
    var valHtml=flat?s:String(s).replace(/^[+-]/,'');
    var arrow=flat?'':(down?' ↓':' ↑');
    return '<span class="s-dlt">'+lb+'：<em class="'+(flat?'flat':(down?'down':'up'))+'">'+(flat?'':(String(s).charAt(0)==='-'?'-':'+'))+valHtml+(p?'pct':'%')+arrow+'</em></span>'; }
  var multi = Array.isArray(dLbl);   /* 传数组=多变动行 [[标签,值,pct?]…]，横排一行（2026-10-26 按需求：同比+较年初同行） */
  var dl = multi
    ? '<span class="s-dlrow">'+dLbl.map(function(d){ return dLine(d[0], d[1], d[2]); }).join('')+'</span>'
    : dLine(dLbl, dVal, pct);
  return '<div class="fkk"><div class="fkk-h">'+hdr+'<span class="fkk-info">ⓘ</span></div>'+
    '<div class="fkk-b"><div class="fkk-st">'+
      '<span class="s-lbl">'+kal+'</span>'+
      '<span class="s-val"><b>'+val+'</b><small>'+u+'</small></span>'+
      dl+
    '</div></div></div>';
}
function renderNorth(){
  document.getElementById('north').innerHTML = NORTH.map(function(k){
    var pctK = k.pct || k.u==='%';
    var v = pctK? k.v*CAL*dateFactor() : m(k.v);
    var dec = k.dec!=null? k.dec : 2;
    var vs = k.raw? Math.round(v).toLocaleString('zh-CN') : v.toLocaleString('zh-CN',{minimumFractionDigits:dec,maximumFractionDigits:dec});
    /* 变动行：dl[]=多行 [[标签,值,pct?]…]；否则单行 yoy（标签可自定义，缺省按口径推） */
    var dl = k.dl || [[k.yoyLbl || (k.kal==='本年累计数'? '累计同比' : '同比'), (k.yoy>0?'+':'')+k.yoy.toFixed(2), !!k.pct]];
    return fkkCardStack(k.l, k.kal||'数值', vs, k.u, dl);
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
/* 预算完成环：全站统一银行页样式（浅灰轨道+亮蓝粗弧+墨色进度数），2026-10-26 按需求各 tab 与华润银行一致 */
function kpiRing(v,bud,unit){
  var p=v/bud*100, pw=Math.min(p,100), C=2*Math.PI*17;
  return '<div class="ringwrap">'+
    '<svg class="kping" width="54" height="54" viewBox="0 0 54 54" aria-label="预算达成 '+p.toFixed(1)+'%">'+
      '<circle cx="27" cy="27" r="17" fill="none" stroke="#e9edf3" stroke-width="5"/>'+
      '<circle cx="27" cy="27" r="17" fill="none" stroke="#3f82f6" stroke-width="5" stroke-linecap="round" '+
        'stroke-dasharray="'+(C*pw/100).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 27 27)"/>'+
      '<text x="27" y="27" text-anchor="middle" fill="#1f2937" font-size="11.5" font-weight="800">'+p.toFixed(2)+'%</text>'+
      '<text x="27" y="38" text-anchor="middle" fill="#8a97a8" font-size="7.5">进度</text>'+
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
  /* 利润链三 hero（2026-10-28 按需求与华润银行页三 hero 卡片样式完全一致）：
     合并口径无下达预算=非考核 → 不渲染达成环、不渲染预算数行（同银行页净利润卡处理）；
     中=本年累计（蓝大字，标签上/数值下）+ 累计同比（hv-inl 行内排）｜右=本月数 + 月度同比（mo-yoy 结构）
     下=趋势图（2026-10-29 按需求对齐银行页扩窗口径）：【上年1月—当年末月】全量柱+月度同比金线双轴，
     当年止月=所选月与10月取大；当年段按本年累计/BK_SHAPE 形状拆分并以所选月校准，上年段=同比回推；
     标签全量「2025/01…」由 bkMonthYoyCfg 自动倾斜 60°；金线锚定所选月与累计同比收敛，其后外推 */
  var lastM=+String(selDate).slice(5,7)||9;
  var ovYY=+String(selDate).slice(0,4)||2026;
  var ovEnd=Math.max(lastM,10);
  var ovScale=CAL*dateFactor();
  function ovShapeOf(mm){ return BK_SHAPE[mm-1]-((mm===1)?0:BK_SHAPE[mm-2]); }
  OV_HERO.forEach(function(h){
    var curAnnual=h.ytd/BK_SHAPE[lastM-1];                            /* 本年年化=累计÷已过形状 */
    var prevAnnual=h.yoy==null?curAnnual/1.08:curAnnual/(1+h.yoy/100);/* 去年全年=同比回推 */
    var ovLabels=[], ovMon=[];
    for(var ok=0;ok<12+ovEnd;ok++){
      var om=ok<12?ok+1:ok-11;
      ovLabels.push((ok<12?ovYY-1:ovYY)+'/'+String(om).padStart(2,'0'));
      ovMon.push(((ok>=12?curAnnual:prevAnnual)*ovShapeOf(om)));
    }
    /* 所选月柱校准为月度序列现值（仅重缩本年段，卡图一致） */
    var ovSelIx=11+lastM;
    var mvTarget=h.mon[11];
    if(ovMon[ovSelIx]>0){ var ovK=mvTarget/ovMon[ovSelIx];
      for(var oi=12;oi<ovMon.length;oi++) ovMon[oi]=ovMon[oi]*ovK; }
    ovMon=ovMon.map(function(x){ return +(x*ovScale).toFixed(1); });
    var mvEl=ovMon[ovSelIx];
    var mYoy=bkMonthYoyArr(12+ovEnd,h.seed,h.yoy,ovSelIx)[ovSelIx];
    var el=document.getElementById('ov-hero-'+h.id);
    if(el){
      var yd=h.yoy, down=yd<0;
      el.innerHTML='<div class="hv-l">'+
        '<div class="hv-main">'+
          '<div class="hv-row"><span class="lbl">本年累计</span><span class="val hv-blue">'+bkNum(m(h.ytd),'亿元')+'<small>亿元</small></span></div>'+
          '<div class="hv-row hv-inl"><span class="lbl">累计同比</span><span class="val '+(down?'down':'up')+'">'+(down?'-':'+')+Math.abs(yd).toFixed(2)+'%'+(down?' ↓':' ↑')+'</span></div>'+
        '</div></div>'+
        '<div class="hv-mo"><span class="mol">本月数</span><span class="mov">'+bkNum(mvEl,'亿元')+'<small>亿元</small></span>'+
        '<span class="mo-yoy"><span class="mol">月度同比</span><span class="val '+(mYoy>=0?'up':'down')+'" style="font-size:11px;font-weight:600">'+(mYoy>=0?'+':'')+Math.abs(mYoy).toFixed(2)+'%'+(mYoy>=0?' ↑':' ↓')+'</span></span></div>';
    }
    mk('c-ov-t-'+h.id, bkMonthYoyCfg({mon:ovMon,labels:ovLabels,selIx:ovSelIx}, h.col, h.seed, h.yoy));
  });
  /* ===== 业务单元利润表（2026-10-28 按需求新增，紧随营业收入三 hero 行）=====
     五家业务单元 × 营业收入/利润总额/净利润 × 本年累计/累计同比/占比（占五家合计）
     实时取数：银行02(nm1,act7,yoy8)｜信托trust01含国信(nm1,act5,yoy6)｜保险ins01(nm1,act6,yoy7，万元→亿元)
     ｜资产asset01财务考核口径calibers[0](nm3,act8,yoy9，无净利润行)｜租赁lease01(nm2,act8,yoy9) */
  (function(){
    var el=document.getElementById('ov-bu-pl'); if(!el) return;
    var sh02=SHEETS['02'], c2=BK_COL['02'];
    function bankRow(nm){ var r=null; (sh02.rows||[]).forEach(function(x){ if(String(x[c2.nm])===nm) r=x; }); return r; }
    function bkRowGet(r){ return r?{v:asNum(r[c2.act])||0, y:asNum(r[c2.yoy])}:null; }
    function tR(sheet,nm){ var c=TIL_COL[sheet],r=tRow(sheet,nm);
      return r?{v:asNum(r[c.act])||0, y:asNum(r[c.yoy])}:null; }
    var a01=ASSET_SHEETS.asset01.calibers[0].rows, ac=ASSET_COL.asset01;
    function aR(nm){ var r=null; a01.forEach(function(x){ if(String(x[ac.nm])===nm) r=x; });
      return r?{v:asNum(r[ac.act])||0, y:asNum(r[ac.yoy])}:null; }
    var BU_PL=[
      {bu:'华润银行', items:[bkRowGet(bankRow('营业收入')),bkRowGet(bankRow('利润总额')),bkRowGet(bankRow('净利润'))]},
      {bu:'华润信托', items:[tR('trust01','总收入（含国信）'),tR('trust01','利润总额（含国信）'),tR('trust01','净利润（含国信）')]},
      {bu:'华润保险', items:[tR('ins01','营业收入'),tR('ins01','利润总额'),tR('ins01','净利润')].map(function(e){ if(e) e.v=e.v/10000; return e; })}, /* 万元→亿元 */
      {bu:'华润资产', items:[aR('营业收入'),aR('利润总额'),null]}, /* 资产报表无净利润科目 */
      {bu:'华润租赁', items:[tR('lease01','营业收入'),tR('lease01','利润总额'),tR('lease01','净利润')]}
    ];
    /* 日期系数与利润链 hero 同口径（累计数随时点缩放） */
    BU_PL.forEach(function(b){ b.items.forEach(function(e){ if(e) e.v=+(m(e.v)).toFixed(2); }); });
    var tot=[0,1,2].map(function(i){ return BU_PL.reduce(function(s,b){ return s+((b.items[i]&&b.items[i].v)||0); },0); });
    function cell(e,t){ if(!e) return '<td class="ko-v">—</td><td class="ko-y flat">—</td><td class="ko-y flat">—</td>';
      var up=e.y==null?'flat':(e.y>=0?'up':'down'), ar=e.y==null?'':(e.y>=0?'▲ ':'▼ ');
      return '<td class="ko-v">'+e.v.toFixed(2)+'</td>'+
        '<td class="ko-y '+up+'">'+ar+(e.y==null?'—':Math.abs(e.y).toFixed(2)+'%')+'</td>'+
        '<td class="ko-y">'+(t?(e.v/t*100).toFixed(2)+'%':'—')+'</td>'; }
    el.innerHTML=BU_PL.map(function(b){
      return '<tr><td class="ko-bu">'+b.bu+'</td>'+
        cell(b.items[0],tot[0])+cell(b.items[1],tot[1])+cell(b.items[2],tot[2])+'</tr>'; }).join('')+
      '<tr class="bu-pl-sum"><td class="ko-bu">华润金融</td>'+
      [0,1,2].map(function(i){
        var ys=BU_PL.map(function(b){ return b.items[i]&&b.items[i].y; }).filter(function(x){ return x!=null; });
        /* 合计同比=按各家累计值加权的平均同比（缺项不计入权重） */
        var wsum=BU_PL.reduce(function(s,b){ return s+((b.items[i]&&b.items[i].v)||0); },0);
        var wy=BU_PL.reduce(function(s,b){ return s+((b.items[i]&&b.items[i].v||0)*(b.items[i]&&b.items[i].y||0)); },0);
        var avg=wsum?wy/wsum:null;
        return '<td class="ko-v">'+tot[i].toFixed(2)+'</td>'+
          '<td class="ko-y '+(avg==null?'flat':(avg>=0?'up':'down'))+'">'+(avg==null?'—':(avg>=0?'▲ ':'▼ ')+Math.abs(avg).toFixed(2)+'%')+'</td>'+
          '<td class="ko-y">100.00%</td>'; }).join('')+'</tr>';
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
  function f1(x){ return x.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}) }
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
          ctx.fillText((p>0?'+':'')+p.toFixed(2)+'%', el.x, el.y+7); ctx.textBaseline='bottom'; });
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
                +'<span>同比<i class="'+(p>0?'up':(p<0?'down':''))+'">'+(p>0?'+':'')+p.toFixed(2)+'%</i></span>'
                +RISK_SRC.map(function(r){ var v=D[r[0]][i];
                  return '<span class="seg"><span class="lab"><i class="dotc" style="background:'+SRC_COLORS[r[0]]+'"></i>'+r[1]+'</span><i>'+f1(v)+' 亿 · '+(v/tot[i]*100).toFixed(2)+'%</i></span>'; }).join('');
            }else{
              var nm=RISK_SRC.filter(function(r){ return r[0]===solo })[0][1], v=D[solo][i], sp=YM[solo][i];
              h+='<span class="seg"><span class="lab"><i class="dotc" style="background:'+SRC_COLORS[solo]+'"></i>'+nm+'</span><i>'+f1(v)+' 亿元</i></span>'
                +'<span>同比<i class="'+(sp>0?'up':(sp<0?'down':''))+'">'+(sp>0?'+':'')+sp.toFixed(2)+'%</i></span>'
                +'<span>占华润金融<i>'+(v/tot[i]*100).toFixed(2)+'%</i></span>'
                +'<span class="seg sum"><span class="lab">金融合计</span><i>'+f1(tot[i])+' 亿元</i></span>';
            }
            ldTip(h, c.chart, tt);
          }}},
        scales:{x:{stacked:true,grid:{display:false},ticks:{font:{size:11},color:T3}},
          y:{stacked:true,position:'left',grid:GRID,ticks:{font:{size:11},color:T3}},
          y1:{position:'right',grid:{display:false},ticks:{font:{size:10.5},color:'#f59e0b',callback:function(v){ return v+'%' }}}}}});
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
    bkDonut('c-ov-prob-pie',['不良类','关注类','正常但预警'],[npl,spe,war],['#d64550','#eda14e','#6cc0f0']);
    bkDonutCenter('ov-prob-center',prob,'问题资产 · 亿');
    var el=document.getElementById('ov-prob-rows');
    if(el) el.innerHTML=
      bkCompRow('#d64550','不良类资产总额',npl,'-8.5%','占比 '+(npl/prob*100).toFixed(2)+'%')+
      bkCompRow('#eda14e','关注类资产总额',spe,'3.2%','占比 '+(spe/prob*100).toFixed(2)+'%')+
      bkCompRow('#5b9bd9','正常但预警资产总额',war,'-2.4%','占比 '+(war/prob*100).toFixed(2)+'%');
    var iNpl=m(27.5), iSpe=m(6.9), iWar=m(3.2), iTot=iNpl+iSpe+iWar;
    bkDonut('c-ov-imp-pie',['不良资产减值余额','关注资产减值余额','正常但预警资产减值余额'],[iNpl,iSpe,iWar],['#d64550','#eda14e','#6cc0f0']);
    bkDonutCenter('ov-imp-center',iTot,'减值余额 · 亿');
    var el2=document.getElementById('ov-imp-rows');
    if(el2) el2.innerHTML=
      bkCompRow('#d64550','不良资产减值余额',iNpl,'-6.2%','占比 '+(iNpl/iTot*100).toFixed(2)+'%')+
      bkCompRow('#eda14e','关注资产减值余额',iSpe,'2.8%','占比 '+(iSpe/iTot*100).toFixed(2)+'%')+
      bkCompRow('#6cc0f0','正常但预警资产减值余额',iWar,'-1.5%','占比 '+(iWar/iTot*100).toFixed(2)+'%');
    /* 行D 集中度六小卡（2026-10-26 按需求：删除对比条形大图，六指标各占一小卡；卡内=本季末大数+近4个季度折线趋势；
       比率无构成关系→按卡分列不做堆叠；不显示环比；轴标签带年份；
       排序=监管敏感度分组：非同业（单一→集团→最大十家，第一红线在前）→ 同业（单一→集团）→ 地区） */
    var curYear=+String(selDate).slice(0,4)||2026;
    var lastQ=(function(){ var mm=+String(selDate).slice(5,7)||9; return Math.floor((mm-1)/3)+1; })();
    var QL=['Q1','Q2','Q3','Q4'].map(function(q,i){ return (i<=lastQ-1)?curYear+'.'+q:null; }).filter(Boolean);
    var CN=[
      ['非同业单一客户集中度',[9.4,9.0,9.1,8.6]],
      ['非同业集团客户集中度',[10.5,10.9,11.8,11.2]],
      ['最大十家非同业客户集中度',[39.8,41.2,44.1,42.6]],
      ['同业单一客户集中度',[13.4,12.8,13.0,12.5]],
      ['同业集团客户集中度',[17.9,18.6,19.2,18.4]],
      ['地区集中度（最大地区）',[22.8,22.1,20.8,21.3]]];
    bkDestroyCanvases(/^c-ov-conc-/);
    var g3=document.getElementById('ov-conc-cards');
    function concArr(vals){ return vals.slice(-QL.length); }   /* 按当年已有季度数截取尾部（本季末=末位） */
    if(g3) g3.innerHTML=CN.map(function(e,i){
      var a=concArr(e[1]), cur=a[a.length-1];
      return '<div class="conc-card"><div class="fkk-h conc-h">'+e[0]+'<span class="fkk-info">ⓘ</span></div>'+
        '<div class="cc-b"><span class="cc-q">'+QL[QL.length-1]+'末</span>'+
        '<div class="cc-v"><b>'+cur.toFixed(2)+'</b><small>%</small></div>'+
        '<div class="cc-ch"><canvas id="c-ov-conc-'+i+'"></canvas></div></div></div>'; }).join('');
    /* 折线点上方标注各季度值插件（末点=本季末 加粗藏蓝，历史点灰蓝；末位点若靠右缘自动左移防裁切） */
    var concValLbl={id:'concValLbl',afterDatasetsDraw:function(ch){
      if(ch.config.type!=='line') return;
      var meta=ch.getDatasetMeta(0); if(!meta||!meta.data) return;
      var ctx=ch.ctx, area=ch.chartArea, n=meta.data.length;
      ctx.save(); ctx.textAlign='center';
      meta.data.forEach(function(pt,idx){
        var v=ch.data.datasets[0].data[idx]; if(v==null) return;
        var last=idx===n-1;
        ctx.font=(last?'800 9.5px':'600 9px')+' "Microsoft YaHei",sans-serif';
        ctx.fillStyle=last?'#17427d':'#7a8ba6';
        var x=pt.x; if(x>area.right-22) x=area.right-22;
        ctx.fillText((+v.toFixed(2))+'%', x, Math.max(area.top+8, pt.y-7));
      });
      ctx.restore(); }};
    CN.forEach(function(e,i){
      var el=document.getElementById('c-ov-conc-'+i); if(!el||!HAS_CHART) return;
      var a=concArr(e[1]);
      mk('c-ov-conc-'+i,{type:'line',plugins:[concValLbl],
        data:{labels:QL,datasets:[{label:e[0],data:a.map(function(v){ return +(v*dateFactor()).toFixed(1) }),
          borderColor:BLUE,backgroundColor:'rgba(47,127,214,.10)',fill:true,tension:.35,
          pointRadius:3,pointBackgroundColor:function(c){ return c.dataIndex===a.length-1?BLUE:'#bcd6f2'; },
          pointBorderWidth:0,borderWidth:2}]},
        options:Object.assign(base(),{
          layout:{padding:{top:14}},
          plugins:{legend:{display:false},tooltip:{callbacks:{label:function(it){ return ' '+QL[it.dataIndex]+'：'+it.parsed.y.toFixed(2)+'%'; }}}},
          scales:{y:{display:false,grace:'36%'},x:{grid:{display:false},ticks:{font:{size:8.5},color:T3,maxRotation:30,autoSkip:true,maxTicksLimit:4}}}})});
    });
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
/* 考核/高质量双标识徽章（2026-11-03 按需求）：个人非存AUM月日均 既是考核指标又是高质量指标，
   卡头标题栏右侧渲染两枚图标小圆角片，一眼识别标签属性；
   数据源=台账 star 列（★=考核｜高质量指标），含「考核/★」→ 🎯，含「高质量」→ ⭐；
   仅 opts.badges 启用的卡渲染（其余卡不受影响）；悬停徽章有完整说明 text（2026-11-03 同日按需求：
   卡头只显示图标、不显示「考核/高质量」文字，语义由 title 悬停提示承载，宽度由 49/59px 降至约 17px，
   窄卡下彻底消除第二枚徽章被卡头 overflow:hidden 裁切的问题） */
function bkBadges(sheet,name){
  var t=bkTag(sheet,name); if(!t) return '';
  var h='';
  if(t.indexOf('★')>=0||t.indexOf('考核')>=0) h+='<span class="badge" title="考核指标：纳入年度业绩合同考核">🎯</span>';
  if(t.indexOf('高质量')>=0) h+='<span class="badge" title="高质量指标">⭐</span>';
  return h;
}
function bkUnitShort(u){ if(u==='亿元') return '亿元'; if(u==='户数') return '户'; return u||''; }
/* 监管要求解析（"≥100%"/"≥-10%" → 100 / -10） */
/* bkLim（监管阈值解析）2026-10-28 随监管红线监测模块删除（无调用方） */
function bkNum(v,u){ if(v==null) return '—';
  /* 2026-10-30 按需求：全页数值统一保留 2 位小数（比率不再去尾零）；
     同日再按需求：单位=户/万户/户数 的计数类指标值显示整数（客户数不存在小数户） */
  if(u && (u==='户'||u==='万户'||u==='户数')) return Math.round(v).toLocaleString('zh-CN');
  if(u && u.indexOf('%')>=0) return v.toFixed(2);
  return v.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}); }
/* 涨跌小注（全局红涨绿跌口径；值缺失显示 —）
   2026-10-30 按需求：数值统一补足 2 位小数（台账串 +8.5%→8.50%、-5.6ppt→5.60ppt；≥3位小数保留原精度） */
function bkDec2(s){ var m=String(s).match(/^([+-]?)(\d+(?:\.\d+)?)(.*)$/);
  if(!m) return s; var num=m[2];
  if(num.indexOf('.')<0) num+='.00';
  else if(num.split('.')[1].length===1) num+='0';
  return m[1]+num+m[3]; }
function bkDelta(txt,suffix){ if(!txt||txt==='-') return '<i class="yoy flat">—</i>';
  var down=txt.charAt(0)==='-';
  return '<i class="yoy '+(down?'down':'up')+'">'+(down?'▼':'▲')+' '+bkDec2(txt.replace(/^[+-]/,''))+(suffix||'')+'</i>'; }
/* stx 迷你趋势 sparkline（2026-10-28 按需求，定价两卡）：按月由【较年初变动】回推确定性走势——
   起点=现值−较年初，逐月线性爬升+小幅波动（名称哈希定相位，刷新稳定），末点=当期实际值；
   纯内联 SVG 折线+末点高亮，逐点透明热区挂原生 title（月份 + 值），不入 Chart.js 实例体系、零重绘负担 */
function bkSparkHtml(name, act, ytdNum, unit, color){
  if(act==null||ytdNum==null) return '';
  var last=+String(selDate).slice(5,7)||9;
  var seed=0; String(name).split('').forEach(function(c){ seed+=c.charCodeAt(0); });
  var start=act-ytdNum, pts=[], labs=[];
  /* 2026-10-28 按需求加大波动：双频叠加正弦（振幅约为利率绝对值的 12%，上限 0.06ppt 级），
     逐月起落更明显；末点仍严格=报表当期实际值，起点=现值−较年初（锚点不变）
     2026-10-30 按需求：①仅显示近 6 个月（数据不足 6 月时按实际月数）；
     ②金额类（亿元）振幅按量纲缩放（14% 变动额、上限 0.6% 当期值），比率类维持原 0.03~0.06ppt 区间 */
  var isAmt=!!(unit && String(unit).indexOf('亿')>=0);
  for(var i=1;i<=last;i++){
    var base=start+(act-start)*(i/last);
    var amp=isAmt? Math.min(Math.abs(act)*0.006, Math.abs(ytdNum)*0.14)
                  : Math.min(0.06, Math.max(0.03, Math.abs(ytdNum)*0.14));
    var wob=i===last?0:amp*Math.sin(i*1.9+(seed%7))+amp*0.45*Math.sin(i*3.7+(seed%5));
    pts.push(+(base+wob).toFixed(2)); labs.push(String(i)+'月');
  }
  var cut=Math.max(0,pts.length-6);
  pts=pts.slice(cut); labs=labs.slice(cut);
  var W=104,H=34,P=3;
  var mn=Math.min.apply(null,pts), mx=Math.max.apply(null,pts), rg=(mx-mn)||1;
  var xy=pts.map(function(p,i){ return [P+(W-2*P)*i/(pts.length-1), H-P-(H-2*P)*(p-mn)/rg]; });
  var d=xy.map(function(c,i){ return (i?'L':'M')+c[0].toFixed(1)+' '+c[1].toFixed(1); }).join(' ');
  /* 面积闭合路径：折线 → 右下角 → 左下角 → 闭合（浅蓝填充自上而下渐隐） */
  var area=d+' L'+xy[xy.length-1][0].toFixed(1)+' '+(H-P)+' L'+xy[0][0].toFixed(1)+' '+(H-P)+' Z';
  var dots=xy.map(function(c,i){ return '<circle cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" r="5.5" fill="transparent"><title>'+labs[i]+'：'+pts[i].toFixed(2)+(unit||'%')+'</title></circle>'; }).join('');
  var lastPt=xy[xy.length-1];
  /* 2026-10-28 按需求改面积图：深蓝实线（主蓝 #0d6ef0，与页面趋势柱同色系）+ 浅蓝渐变填充（.28→.04 渐隐） */
  var gid='spg-'+(seed%1000)+'-'+Math.round(act*100);
  return '<span class="spark" title="'+name+' 近'+pts.length+'月走势（悬停点看各月值）"><svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+
    '<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d6ef0" stop-opacity=".28"/><stop offset="1" stop-color="#0d6ef0" stop-opacity=".04"/></linearGradient></defs>'+
    '<path d="'+area+'" fill="url(#'+gid+')" stroke="none"/>'+
    '<path d="'+d+'" fill="none" stroke="#0d6ef0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'+
    '<circle cx="'+lastPt[0].toFixed(1)+'" cy="'+lastPt[1].toFixed(1)+'" r="2.4" fill="#0d6ef0"/>'+dots+'</svg></span>';
}
/* 当前账期月末日期（2026-10-30 按需求：监管指标卡悬浮提示「最新日期」用）：
   取全局数据日期下拉（YYYY-MM）当月最后一天，如 2026-09 → 2026-09-30；随下拉切换联动 */
function bkPeriodEnd(){
  var y=+String(selDate).slice(0,4)||2026, mo=+String(selDate).slice(5,7)||9;
  var last=new Date(y,mo,0).getDate();
  return y+'-'+(mo<10?'0'+mo:mo)+'-'+(last<10?'0'+last:last);
}
/* 较上年派生（2026-11-03 按需求，ROA/ROE/成本收入比三卡加「较上年」）：
   台账 03「去年末」列=上年末值，差值=当期−上年末；比率类（%）为 ppt 口径、金额类换算百分比变动。
   与「同比」同量纲但基准不同（同比=上年同期，较上年=上年末），补齐变动小注行 */
function bkLtY(sheet,name,u){
  var a=asNum(bkTxt(sheet,name,'act')), l=asNum(bkTxt(sheet,name,'ly'));
  if(a==null||l==null) return '-';
  var pct=String(u||'').indexOf('%')>=0;
  var d=pct ? (a-l) : ((l? (a/l-1)*100 : 0));
  return (d>=0?'+':'-')+Math.abs(d).toFixed(2)+(pct?'ppt':'%');
}
/* 环比派生（2026-11-03 按需求，零售财富与低成本存款四卡「较年初」改「环比」）：
   06 台账无当月/环比列，按当期已过月数把「较年初」均摊为月度环比（演示口径，台账原值不变，
   切换账期自动跟随；占比类保留 ppt 后缀，总额类保留 % 后缀） */
function bkMomFromYtd(txt){
  if(!txt||txt==='-') return '-';
  var m=String(txt).match(/^([+-]?)(\d+(?:\.\d+)?)(.*)$/); if(!m) return '-';
  var mo=+String(selDate).slice(5,7)||9;
  var v=(m[1]==='-'?-1:1)*(+m[2])/Math.max(1,mo);
  return (v>=0?'+':'-')+Math.abs(v).toFixed(2)+m[3];
}
/* stx 指标格：名称(+标签) / 值(自动按日期联动：亿元类×dateFactor，比率类原值) / 同比+较年初双小注 / 预算达成条 */
function bkStx(sheet,name,opts){ opts=opts||{}; var u=bkTxt(sheet,name,'un')||'';
  var disp = opts.label || name; /* 2026-10-28 银行行3：支持显示名覆写（ROA/ROE），取数仍按台账原名 */
  var raw=bkAct(sheet,name); var pct = u.indexOf('%')>=0;
  var v = raw==null?null:(pct?raw:m(raw));
  /* 2026-10-30 按需求：opts.tipDate=1 → 卡片悬浮显示「最新日期：月末账期」（季度报送指标用，
     账期取全局数据日期下拉的当月末，随下拉联动）；
     同日再按需求：opts.tipTitle/tipFormula → 三行弹框【指标名 / 最新日期 / 计算公式】（成本收入比），
     tipTitle=1 用卡显示名作第一行；属性值内禁用双引号（公式串不含引号即安全） */
  var tipAttr = '';
  if(opts.tipTitle||opts.tipFormula||opts.tipDef||opts.tipDate){
    /* 属性值内 HTML 用单引号 class（HTML5 合法），避免内层双引号截断 data-tip="..." 属性；
       2026-10-31 按需求：凡含「最新日期」的气泡统一=第一行指标名（.ct-t 加粗+分割线）→ 最新日期 →（可选）计算公式
       ——样式同「成本收入比」悬停；同日再按需求：opts.tipDef → 最新日期下加「指标定义」行（.ct-f 同款弱化，
       长定义允许折行，.ct-def 放宽到 460px） */
    var tRows='<span class=\'ct-t\'>'+disp+'</span>';
    tRows+='最新日期：<b>'+bkPeriodEnd()+'</b>';
    if(opts.tipFormula) tRows+='<br><span class=\'ct-f\'>计算公式：'+opts.tipFormula+'</span>';
    if(opts.tipDef) tRows+='<br><span class=\'ct-f ct-def\'>指标定义：'+opts.tipDef+'</span>';
    tipAttr=' data-tip="'+tRows+'"';
  }
  /* 口径标签（2026-10-27 按需求参考金融页卡片）：损益/收入/成本三表=流量类「本年累计」；其余表=时点类「本月末」；opts.kal 可覆写；
     2026-10-28 再按需求：opts.kal='' 显式传空串=不显示口径标签（核心科目三总量卡删「本月末」） */
  var kal = (opts.kal!=null) ? opts.kal : (sheet==='02'||sheet==='04'||sheet==='05' ? '本年累计' : '本月末');
  var h='<div class="stx'+(opts.cls?' '+opts.cls:'')+'"'+tipAttr+'><span class="t" title="'+disp+'">'+
    /* 2026-10-28 按需求：opts.icon=SVG 内部路径串 → 名称前小样式图标（核心科目三总量卡） */
    (opts.icon?'<svg class="t-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+opts.icon+'</svg>':'')+
    /* 2026-11-03 按需求：标题文本包 .tt 可收缩层——徽章启用时窄卡下文字先省略号收缩，徽章始终完整不裁切 */
    '<span class="tt">'+disp+'</span>'+bkTagHtml(sheet,name)+
    /* 2026-11-03 按需求：opts.badges → 考核/高质量双标识徽章（卡头右侧，见 bkBadges） */
    (opts.badges?bkBadges(sheet,name):'')+'</span>'+
    (kal?'<span class="s-lbl">'+kal+'</span>':'')+
    '<span class="v">'+bkNum(v,u)+'<small>'+(opts.u||bkUnitShort(u))+'</small>'+
    /* 同业对比（2026-10-28 按需求；2026-10-29 标签改「同行业」+ 胶囊样式；同日按需求删除悬停提示语）：opts.peer={v:行业值} */
    (function(){ if(opts.peer==null) return '';
      var pv=opts.peer.v;
      return '<span class="peer pkr">'+
        '<i class="pk-lb">同行业</i><b>'+bkNum(pv,u)+'<small>%</small></b></span>'; })()+
    /* 迷你趋势（2026-10-28 按需求）：opts.spark=1 时值行右缘显示近 N 月走势小折线
       （较年初串带 ppt 后缀，asNum 返回 null，此处直接 parseFloat 取数） */
    (opts.spark?bkSparkHtml(name,v,(function(){ var x=parseFloat(bkTxt(sheet,name,'ytd')); if(isNaN(x)) return null;
      /* 2026-10-30 按需求：金额类「较年初」台账是百分比→换算绝对变动额（spark 起点=现值−变动额）；比率类=ppt 原值 */
      return pct ? x : (v - v/(1+x/100)); })(),u,opts.sparkCol||'#6cc0f0'):'')+
    /* 分母注（2026-10-28 按需求，低成本存款占比卡）：opts.den=[源表,科目名,显示名?] 时右侧显示
       分母科目与当期值（直读台账实际值），比率卡的分母口径一眼可读；
       2026-10-30 按需求：样式改「同行业」同款（白底细蓝圆角框、标签在上值在下），
       显示名「分母：存款年日均」（去「（全行）」尾词，取数仍按台账原名） */
    (function(){ if(!opts.den) return '';
      var dv=bkAct(opts.den[0],opts.den[1]); if(dv==null) return '';
      var du=bkTxt(opts.den[0],opts.den[1],'un')||'';
      return '<span class="peer pkr dn"><i class="pk-lb">分母：'+(opts.den[2]||opts.den[1])+'</i>'+
        '<b>'+bkNum(m(dv),du)+'<small>'+bkUnitShort(du)+'</small></b></span>'; })()+
    '</span>'+
    /* 2026-11-03 按需求：opts.dlCol → 变动小注上下分行展示（.dlst 加 .dl-col 纵向排列），
       同比 / 较年初(环比) 各占一行完整不截断；未指定的卡仍保持同行横排 */
    '<div class="dlst'+(opts.dlCol?' dl-col':'')+'">'+bkDl(opts.ylbl||'同比',bkTxt(sheet,name,'yoy'))+
      (opts.noYtd?'':(function(){
        /* 2026-11-03 按需求：opts.momLbl → 第二变动小注改「环比」并用按账期均摊的派生值；
           否则沿用台账「较年初/较上年」列（opts.ytlbl 覆写标签） */
        var y2 = opts.momLbl ? bkMomFromYtd(bkTxt(sheet,name,'ytd')) : bkTxt(sheet,name,'ytd');
        return (y2 && y2!=='-') ? bkDl(opts.momLbl||opts.ytlbl||'较年初',y2) : ''; })())+
      /* 2026-11-03 按需求：opts.ltY → 追加「较上年」小注（基准=台账 03 去年末值） */
      (opts.ltY?bkDl('较上年',bkLtY(sheet,name,u)):'')+'</div>';
  if(opts.bud){ var bd=bkBud(sheet,name), rt=bkRate(sheet,name);
    if(rt!=null){
      /* 反向指标（不良率类，值越低越好；opts.inv=1）：达成率反算 = 预算上限 ÷ 当期值，
         ≥100%=管住在线上（台账 rate 列为顺向口径 act/bud，反向卡不采用）；
         2026-10-29 按需求：展示与顺向卡完全统一——标签「预算」、进度条蓝色、无悬停提示语 */
      if(opts.inv && bd!=null && v){ rt=+(bd/v*100).toFixed(2); }
      var inBar = rt>=18; /* 达成率≥18% 时百分比白字放条内，否则蓝字放填充末端右侧防溢出 */
      var wpct=Math.min(100,rt).toFixed(1)+'%';
      h+='<div class="budrow"><span class="bl">预算</span>'+
        '<span class="bbar"><i style="width:'+wpct+'"></i>'+
          (inBar? '<b class="b-in" style="left:calc('+wpct+' - 5px)">'+rt.toFixed(2)+'%</b>'
                : '<b class="b-out" style="left:calc('+wpct+' + 4px)">'+rt.toFixed(2)+'%</b>')+'</span>'+
        '<span class="bval">'+(bd!=null?bkNum(bd,u)+'<small>'+(opts.u||bkUnitShort(u))+'</small>':'—')+'</span></div>'; } }
  return h+'</div>'; }
/* 金融页式变动小注（2026-10-27）：标签在左、值右（红涨绿跌带箭头），stx 卡内两行 space-between 对齐 */
function bkDl(label,txt){ if(!txt||txt==='-') return '<span class="s-dlt">'+label+'：<em class="flat">—</em></span>';
  var down=String(txt).charAt(0)==='-';
  return '<span class="s-dlt">'+label+'：<em class="'+(down?'down':'up')+'">'+(down?'▼':'▲')+' '+bkDec2(String(txt).replace(/^[+-]/,''))+(String(txt).search(/pct|ppt|％|%/)>=0?'':'%')+'</em></span>'; }
/* strow 行：名称(+标签) 值 同比（浮层区），budgetNote 可外部补预算说明 */
function bkStr(sheet,name,opts){ opts=opts||{}; var u=bkTxt(sheet,name,'un')||'';
  var raw=bkAct(sheet,name); var pct=u.indexOf('%')>=0;
  var v=raw==null?null:(pct?raw:m(raw));
  var b=bkNum(v,u)+' '+(opts.u||bkUnitShort(u));
  var y=bkTxt(sheet,name,'yoy');
  /* 2026-10-30 按需求：右侧数值/单位/同比等改为「收入构成」cols3 固定列版式（值列右对齐、
     标签+涨跌成列纵向对齐）；字段内容不变——同比列沿用、第三变动列（较年初/较上年）用 .c-q 列；
     opts.ytlbl 覆写第三列标签（公司条线收益率/付息率=跨年比口径，改「较上年」） */
  var y2=bkTxt(sheet,name,'ytd');
  var cols='<b class="cols3"><i class="c-v">'+b+'</i>'+
    (opts.delta===false?'':'<i class="c-y"><span class="lb">同比</span>'+(y&&y!=='-'?bkDelta(y,''):'<i class="yoy flat">—</i>')+'</i>')+
    (opts.ytd && opts.delta!==false && y2 && y2!=='-' ?'<i class="c-q"><span class="lb">'+(opts.ytlbl||'较年初')+'</span>'+bkDelta(y2,'')+'</i>':'')+
    '</b>';
  /* 2026-10-31 按需求：行气泡与卡片气泡同构=第一行指标名（.ct-t+分割线）→ 最新日期（样式参考成本收入比）；
     同日按需求：弹框指标名称不加括号（去掉旧 '(名)' 包裹） */
  var tipHtml='';
  if(opts.tipDate) tipHtml=' data-tip="<span class=\'ct-t\'>'+(opts.label||name).replace(/^　+/,'')+'</span>最新日期：<b>'+bkPeriodEnd()+'</b>"';
  return '<div class="strow"'+tipHtml+'><span'+(opts.nameCls?' class="'+opts.nameCls+'"':'')+'>'+(opts.label||name)+bkTagHtml(sheet,name)+(opts.note||'')+'</span>'+cols+'</div>'; }/* 02-损益表 指标 → 月度形状（本月数拆分与 RAROC 趋势共用；1月重置） */
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
   1月=年度首月（形状重置），杜绝跨年累计差分产生的负柱；末月校准为报表「当月值」实际数
   2026-10-28 按需求：窗口由「近12月滚动」扩为【上年1月—当年10月】22个月（当年末月=所选月/10取大者），
   标签全量年份+补零月份（2025/01…2026/10，轴下倾斜展示）；校准只重缩本年段，上年段保持原值 */
function bkMonthSeries(name){
  var act=bkAct('02',name)||0, yoy=asNum(bkTxt('02',name,'yoy'));
  var mval=m(asNum(bkGet('02',name,'mval')));
  var yy=+String(selDate).slice(0,4)||2026;
  var last=+String(selDate).slice(5,7)||9, SH=BK_SHAPE;
  function shapeOf(mm){ return SH[mm-1]-((mm===1)?0:SH[mm-2]); } /* 第 mm 个月占全年比 */
  var curAnnual=act/SH[last-1];                 /* 本年年化（=累计÷已过形状） */
  var prevAnnual=(yoy==null?curAnnual/1.08:curAnnual/(1+yoy/100)); /* 去年全年（同比回推） */
  var end=Math.max(last,10);                    /* 当年止月：需求要求展示到 10 月；所选月更晚则随所选月 */
  var labels=[], mon=[], prevMon=[];
  for(var k=0;k<12+end;k++){
    var mm=k<12?k+1:k-11;                       /* 12+end 个月：去年1-12月 + 本年1-end月 */
    labels.push((k<12?yy-1:yy)+'/'+String(mm).padStart(2,'0'));
    var inCur = k>=12;
    mon.push(+((inCur?curAnnual:prevAnnual)*shapeOf(mm)).toFixed(1));
    prevMon.push(+((inCur?prevAnnual:prevAnnual/1.08)*shapeOf(mm)).toFixed(1));
  }
  /* 所选月柱校准为 02 报表「当月值」实际数（仅重缩本年段） */
  if(mval!=null && mon[11+last]>0){ var kk=mval/mon[11+last];
    for(var i=12;i<mon.length;i++) mon[i]=+(mon[i]*kk).toFixed(1); }
  return {mon:mon, prev:prevMon, labels:labels, selIx:11+last};
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
/* 本月数柱 + 月度同比线 双轴组合（2026-10-22 八轮按需求：柱=本月数，趋势线=月度同比；
   悬停一次显示 本月数 / 去年同月 / 月度同比 三行）：
   左轴柱=各月「本月数」（动能水位），右轴金线=各月同比增速%——金额与增速一屏对读；
   yoyPct=报表累计同比（锚点）：围绕锚点确定性波动（±22%），末月贴近锚点与累计口径收敛——
   不取 mon/prev 差分：当月值经 mval 校准后与年化形状不同基，差分同比会整体失真 */
/* 月度同比序列（hero 右侧"月度同比"与趋势线共用同一末月值，保证卡图一致）
   2026-10-28：anchorIx=累计同比锚定位置（默认序列末月；银行页趋势扩窗后=所选月，
   使最后一个实际上报月与累计口径收敛，其后外推月保持同等收敛幅度） */
function bkMonthYoyArr(len,seed,yoyPct,anchorIx){
  seed=seed||1;
  var anchor=(yoyPct==null||isNaN(yoyPct))?8:yoyPct;
  var aIx=(anchorIx==null||anchorIx<1)?len-1:anchorIx;
  var out=[];
  for(var i=0;i<len;i++){
    var conv=0.5+0.5*Math.min(i/aIx,1);                     /* 越接近锚定月越收敛到锚点 */
    var osc=Math.sin(i*1.9+seed*2.4)*0.22*(1.6-conv);
    out.push(+(anchor*(1+osc)).toFixed(1));
  }
  return out;
}
/* tooltip 标题下分割线插件（2026-10-30 按需求：hero 柱状图悬停弹框「日期标题」与「本月数」行之间加分割线）
   afterTooltipDraw 官方钩子取 tooltip 盒坐标；线 y=盒顶+padding.top+标题行高×行数+间距×(行数−1)+titleMarginBottom/2
   —— 与 Chart.js drawTitle 的步进公式一致，落在标题与正文留白的正中 */
var tipDividerPlugin={id:'tipDivider',afterTooltipDraw:function(ch){
  var tt=ch.tooltip;
  if(!tt||!(tt.opacity>0.05)||!(tt.title&&tt.title.length)||!(tt.body&&tt.body.length)) return;
  var e=tt.options;
  var pad=(typeof e.padding==='number')?e.padding:(e.padding&&e.padding.top!=null?e.padding.top:6);
  var fs=(e.titleFont&&+e.titleFont.size)||12, lh=fs*1.2, d=tt.title.length;
  var y=tt.y+pad+d*lh+(d-1)*(e.titleSpacing||2)+(e.titleMarginBottom||0)/2;
  var ctx=ch.ctx;
  ctx.save();
  ctx.globalAlpha=Math.min(1,tt.opacity);
  ctx.strokeStyle='rgba(120,160,215,.55)';
  ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(tt.x+9,Math.round(y)+.5);
  ctx.lineTo(tt.x+tt.width-9,Math.round(y)+.5);
  ctx.stroke();
  ctx.restore();
}};
function bkMonthYoyCfg(ms,barCol,seed,yoyPct,unit){
  var yoy=bkMonthYoyArr(ms.labels.length,seed,yoyPct,ms.selIx);
  /* 2026-10-28 按需求：年份月份标签（2025/01 样式，含'/'）→ 倾斜 60°全部显示；旧「9月」式短标签维持水平抽稀 */
  var tilt=!!(ms.labels[0]&&String(ms.labels[0]).indexOf('/')>=0);
  var U=unit||'亿元'; /* 悬停单位（保险页=万元） */
  function f1(x){ return Number(x).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  return {type:'bar',
    plugins:[tipDividerPlugin],   /* 悬停弹框=日期标题+本月数…：标题下加分割线（见上 tipDividerPlugin） */
    data:{labels:ms.labels,datasets:[
      {label:'本月数',data:ms.mon,backgroundColor:barCol,borderRadius:2.5,maxBarThickness:18,order:2},
      {type:'line',label:'月度同比',data:yoy,yAxisID:'y1',borderColor:GOLD,backgroundColor:'transparent',
        borderWidth:2,pointRadius:2.5,pointBackgroundColor:GOLD,tension:.35,order:1}]},
    options:Object.assign(base({tooltip:{filter:function(it){ return it.dataset.label==='本月数'; },
      /* 一次悬停三行：本月数 / 去年同月 / 月度同比（三数自洽：去年同月=本月数÷(1+同比)，读数走 index 对齐） */
      callbacks:{label:function(it){ return ' 本月数：'+f1(it.parsed.y)+' '+U; },
        afterBody:function(items){ var i=items[0].dataIndex, pr=ms.mon[i]/(1+yoy[i]/100);
          return [' 去年同月：'+f1(pr)+' '+U,
                  ' 月度同比：'+(yoy[i]>0?'+':'')+yoy[i].toFixed(2)+'%']; }}}}),
      {interaction:{mode:'index',intersect:false},
       layout:{padding:{bottom:tilt?16:0}},
       scales:{y:Object.assign({},YAX,{grace:'18%',ticks:{font:{size:9},color:T3}}),
               y1:{position:'right',grid:{display:false},ticks:{font:{size:9},color:'#d9a531',callback:function(v){return v+'%'}}},
               x:{grid:{display:false},ticks:{font:{size:tilt?8:8.5},color:T3,autoSkip:true,
                  maxRotation:tilt?60:0,minRotation:tilt?60:0,
                  maxTicksLimit:tilt?ms.labels.length:6}}}})};
}
/* 环形图统一样式（2026-10-21 三轮美化）：圆角分段 + 片间留白 + 浅轨道底环 + 细白描边，
   单色系蓝阶为主、语义色点缀（权益金/风险红绿）；中心总量由 donut-total 浮层显示；
   极小片（<2%）scriptable 取消圆角防畸变；opts.dec=tooltip 百分比小数位
   2026-10-22 九轮（参考图定稿）：
   ① 配色统一 BK_PIE 浅亮盘（藏蓝系太深弃用），语义片（权益金/风险五级/轧差灰蓝）由调用方覆盖；
   ② 悬停三行：opts.yoy[]=各片同比串 + opts.kind='period'→「本年累计数/累计同比/占比」，
      'time'→「本月末/同比/占比」（期间 vs 时点按数据源口径标注） */
var BK_PIE=['#4d94ff','#6cc0f0','#35c06b','#eda14e','#a0b4f0','#8fd8c8','#c3d9f2'];
/* 2026-10-31 按需求（附截图：存款结构弹框右侧「亿」被裁）：环形饼 Tooltip 改 DOM external 气泡——
   Chart.js 原生 tooltip 绘制在 canvas 内部，小尺寸饼图卡（存/贷款结构 canvas 仅 ~150px 宽）放不下
   三行文本，右侧内容被画布边界硬裁。external 气泡复用 .card-tip 体系（白底淡蓝细边+柔和阴影+指向
   箭头，与全页弹框语言零分叉），DOM 元素不受画布限制，且自动做视口左右钳位、顶部翻转，任何屏宽
   （含浏览器 100% 缩放 1366px）弹框完整可见。回调仍走各图 callbacks（解析 tooltip.title/body/afterBody）
   气泡 DOM 为模块级单例（悬停互斥，一图一个即可；重渲染复用不产生游离节点） */
var _pieTipEl=null;
function pieTipExternal(){
  function el(){ if(!_pieTipEl){ _pieTipEl=document.createElement('div'); _pieTipEl.className='card-tip'; document.body.appendChild(_pieTipEl); } return _pieTipEl; }
  return function(ctx){
    var tt=ctx.tooltip, t=el();
    if(!tt||tt.opacity===0){ t.classList.remove('show','down','up'); return; }
    var lines=[];
    /* 标题行仅在图配置了 title.display 时输出（与原生行为一致：无涨跌分支的老饼不显示标题行，避免与首行重复） */
    if(tt.options&&tt.options.title&&tt.options.title.display)(tt.title||[]).forEach(function(x){ lines.push('<span class=\'ct-t\'>'+x+'</span>'); });
    (tt.body||[]).forEach(function(b){ (b.lines||[]).forEach(function(L){ lines.push(L); }); });
    (tt.afterBody||[]).forEach(function(x){ lines.push(x); });
    if(!lines.length){ t.classList.remove('show','down','up'); return; }
    t.innerHTML=lines.join('<br>');
    t.classList.add('show');
    var cv=ctx.chart.canvas.getBoundingClientRect();
    var cx=cv.left+tt.caretX, cy=cv.top+tt.caretY;
    var w=t.offsetWidth, h=t.offsetHeight, vw=window.innerWidth, M=8;
    var left=Math.max(M, Math.min(cx-w/2, vw-w-M));      /* 视口左右钳位：贴屏边也不裁字 */
    var up=true, top=cy-h-14;                            /* 默认气泡在指针上方、箭头朝下 */
    if(top<M){ top=cy+14; up=false; }                    /* 顶部放不下翻到下方 */
    t.classList.toggle('down',up); t.classList.toggle('up',!up);
    t.style.setProperty('--ax',Math.max(10,Math.min(cx-left,w-10))+'px'); /* 箭头跟随指针（钳进气泡内） */
    t.style.left=left+'px'; t.style.top=top+'px';
  };
}
function bkDonut(cid, labels, vals, cols, opts){ opts=opts||{};
  var tot=vals.reduce(function(a,b){return a+b;},0);
  var dec=opts.dec!=null?opts.dec:2;
  var yoyArr=opts.yoy||null, kind=opts.kind||'period';
  var lbl1=kind==='time'?'本月末':'本年累计数';
  var lbl2=kind==='time'?'同比':'累计同比';
  var trackPlugin={id:'bkTrack',beforeDatasetsDraw:function(ch){
    var meta=ch.getDatasetMeta(0); if(!meta||!meta.data||!meta.data.length) return;
    var a0=meta.data[0]; if(!a0) return;
    var ctx=ch.ctx, cx=a0.x, cy=a0.y;
    var rMid=(a0.innerRadius+a0.outerRadius)/2, w=a0.outerRadius-a0.innerRadius;
    ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,rMid,0,Math.PI*2);
    ctx.strokeStyle=opts.track||'rgba(122,150,190,.13)'; ctx.lineWidth=w; ctx.stroke(); ctx.restore(); }};
  function yoyLine(y){ var s=String(y==null?'':y).trim();
    if(!s||s==='-') return lbl2+'：—';
    var down=s.charAt(0)==='-';
    return lbl2+'：'+(down?'▼':'▲')+' '+s.replace(/^[+-]/,''); }
  var lb=yoyArr?{label:function(it){ /* 2026-10-30 按需求：opts.signedVals=悬停读数带符号值数组（净额类指标，
          片宽/占比仍按 |值|，仅读数还原台账原符号，如「其他支出(净收益)」净收益时为负）；
          2026-10-31 按需求：弹框行距排优化——去前导空格、每行只放一条指标信息（值/同比/占比各一行），
          配合 bodySpacing/padding 放宽，消除文字重叠拥挤；皮肤沿用全局白底淡蓝边+柔和阴影规范 */
          var dv=opts.signedVals?opts.signedVals[it.dataIndex]:vals[it.dataIndex];
          return lbl1+'：'+bkNum(dv,'亿元')+' 亿元'; },
          afterBody:function(items){ var i=items[0].dataIndex;
            /* 2026-10-30 按需求：传 signedVals 时占比行同步带符号（分母不变=|值|合计，与明细行一致） */
            var sv=opts.signedVals?opts.signedVals[i]:vals[i];
            return [yoyLine(yoyArr[i]), '占比：'+(sv/tot*100).toFixed(2)+'%']; }}
    /* 未传 yoy[] 的调用（信托/保险/资产/租赁页）：保持原单行格式 */
    :{label:function(it){ return it.label+'：'+bkNum(vals[it.dataIndex],'亿元')+' 亿元'; },
      afterBody:function(items){ var i=items[0].dataIndex;
        return ['占比：'+(vals[i]/tot*100).toFixed(dec)+'%']; }};
  mk(cid,{type:'doughnut',plugins:[trackPlugin],
    data:{labels:labels,datasets:[
      {label:'构成',data:vals,backgroundColor:cols,borderColor:'#ffffff',borderWidth:1.5,
       borderRadius:function(c){ var v=c.dataset.data[c.dataIndex]||0; return (tot>0 && v/tot<0.02)?0:(opts.radius!=null?opts.radius:7); },
       borderSpacing:3,hoverOffset:7}]},
    options:Object.assign(base({tooltip:{enabled:false,external:pieTipExternal(),callbacks:lb,title:{display:!!yoyArr}}}),
      {cutout:opts.cutout||'66%',layout:{padding:6}})});
}
/* 双环构成饼（2026-10-28 按需求，条线营收构成）：内环=本年累计、外环=去年全年（浅色半透明同色系）
   悬停各环显示各自年度详情（标题=条线名，行=「2026年本年累计：x 亿元（占 y%）」式，年份直接入文）
   2026-10-30 按需求：外环数据改「去年全年」；悬停外环两行——第一行=去年全年值（含占比），第二行=去年同期累计值
   Chart.js 多数据集环：dataset[0]=外环 → 传 prevFull（附 _meta.same=去年同期累计）；dataset[1]=内环 → 传 cur */
function bkDonutDual(cid, labels, curVals, prevVals, cols, opts){ opts=opts||{};
  var totC=curVals.reduce(function(a,b){return a+b;},0)||1;
  var totP=prevVals.reduce(function(a,b){return a+b;},0)||1;
  var cy=opts.curYear, py=opts.prevYear;
  function ring(dsLabel,data,vals,colorArr,tot,year,tag,weight,sameArr){
    return {label:dsLabel,data:data,backgroundColor:colorArr,borderColor:'#ffffff',borderWidth:1.5,
      borderRadius:function(c){ var v=c.dataset.data[c.dataIndex]||0; return (tot>0 && v/tot<0.02)?0:6; },
      borderSpacing:3,hoverOffset:7,weight:weight||2,_meta:{tot:tot,year:year,tag:tag,same:sameArr||null,sameTot:sameArr?(sameArr.reduce(function(a,b){return a+b;},0)||1):null}};
  }
  function alpha(hex){ return hex+'80'; }
  var lb={title:function(items){ return items.length?labels[items[0].dataIndex]:''; },
    label:function(it){ var ds=it.dataset, meta=ds._meta||{};
      var v=ds.data[it.dataIndex]||0;
      /* 2026-10-31 按需求：弹框行距排优化——去前导空格、值与占比分两行（一行一条信息），消除重叠拥挤 */
      var rows=[meta.year+'年'+meta.tag+'：'+bkNum(v,'亿元')+' 亿元',
                '占比：'+(v/meta.tot*100).toFixed(2)+'%'];
      /* 外环追加对照行：去年同期累计值（累计→全年缺口=去年后段月份贡献） */
      if(meta.same){ var sv=meta.same[it.dataIndex];
        rows.push(meta.year+'年同期累计：'+bkNum(sv,'亿元')+' 亿元'); }
      return rows; }};
  /* 2026-10-30 按需求：外环收窄——weight 控制环带宽（今年内环 5 : 去年外环 3），去年仅作参照弱显示 */
  mk(cid,{type:'doughnut',
    data:{labels:labels,datasets:[
      ring('去年',prevVals,prevVals,cols.map(alpha),totP,py,'全年',opts.prevWeight||3,opts.sameVals),
      ring('今年',curVals,curVals,cols,totC,cy,'本年累计',opts.curWeight||5)]},
    options:Object.assign(base({tooltip:{enabled:false,external:pieTipExternal(),callbacks:lb,title:{display:true}}}),
      {cutout:opts.cutout||'34%',layout:{padding:6}})});
}
function bkDonutCenter(elId,total,unitLabel,size){
  var el=document.getElementById(elId);
  if(el){ el.className='donut-total'+(size==='sm'?' sm':'');
    el.innerHTML='<b>'+bkNum(total,'亿元')+'</b><small>'+unitLabel+'</small>'; }
}
/* 构成明细行：圆点+名称 / 值+同比（+附加说明） */
/* 构成明细行（饼卡右侧）：色点+名称 / 值 亿元 / 同比 / extra 附加注（如占比）
   2026-10-28 按需求：第6参 ytag=1 时同比值前补灰色小字「同比」（存款结构/贷款结构卡启用；
   风险总览等旧调用不传=保持原样；extra 由调用方自带「占 」前缀）
   2026-10-30 按需求：ytag=1（银行存款/贷款结构）右侧改「收入构成」b.cols3 固定列版式
   （值列右对齐 / 同比标签+涨跌 / 占比标签+值纵向成列）；仅样式统一，字段不变 */
function bkCompRow(color,label,val,yoy,extra,ytag){
  var dot='<i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:'+color+';margin-right:6px"></i>';
  if(ytag){
    var pctTxt=String(extra||'').replace(/^占[比]?\s*/,'');
    return '<div class="strow"><span>'+dot+label+'</span>'+
      '<b class="cols3"><i class="c-v">'+bkNum(val,'亿元')+' 亿元</i>'+
      '<i class="c-y"><span class="lb">同比</span>'+(yoy?bkDelta(yoy,''):'<i class="yoy flat">—</i>')+'</i>'+
      (pctTxt?'<i class="c-p"><span class="lb">占比</span><span class="pv">'+pctTxt+'</span></i>':'')+'</b></div>'; }
  return '<div class="strow"><span>'+dot+label+'</span>'+
    '<b>'+bkNum(val,'亿元')+' 亿元'+(yoy?(ytag?'<span style="margin-left:8px;font-size:10.5px;font-weight:400;color:#7a8ba6">同比</span> ':' ')+bkDelta(yoy,''):'')+(extra?' <span class="lite" style="font-size:10px">'+extra+'</span>':'')+'</b></div>';
}
/* ===== 条线成本与回报：卡内左右两半——RAROC（%）｜EVA（亿元）（2026-10-26 按需求拆分）=====
   指标 = 05 表 公司/零售/金融市场 条线 -RAROC 与 -EVA；
   页签复用总览风险四图 .src 色签样式，切换条线同时联动左右两半 */
var BK_LINE_NAMES=['公司条线','零售条线','金融市场'];
/* 2026-10-30 按需求：页签显示名「金融市场」→「金融条线」→「金市条线」（与条线营收构成卡显示名一致；取数仍按台账原名） */
var BK_LINE_DISP=['公司条线','零售条线','金市条线'];
var BK_RAROC_LINES=BK_LINE_NAMES.map(function(n){ return [n+'-RAROC',n]; });
var bkRarocCur=0;
function bkRarocRender(){
  /* 页签行（切换条线） */
  var tabs=document.getElementById('bk-raroc-tabs');
  if(tabs) tabs.innerHTML=BK_LINE_DISP.map(function(n,i){
    return '<span class="src'+(i===bkRarocCur?' on':'')+'" onclick="LeaderApp.bkRaroc('+i+',this)">'+n+'</span>'; }).join('');
  /* 时间窗（2026-10-30 按需求改日历对齐）：1—12月 固定 12 格横轴，每月双列=去年 vs 今年；
     今年未到的月份（如26年10-12月）今年列无柱、去年列照常展示全年——两年差异逐月直观对读；两图共用窗口 */
  var last=+String(selDate).slice(5,7)||9;
  var labels=[]; for(var mm=1;mm<=12;mm++) labels.push(mm+'月');
  /* 半区渲染：nm=指标名 / elKpi / cv=画布 / unit=%|亿 / color=柱色 / line=虚线色 / dec / yoySuffix
     %类（RAROC）不乘日期系数，累计口径按月度形状归一（同 bkTrend 模式）
     2026-10-28 按需求：柱状改「去年同月｜本年」双列成对（浅色=去年，主色=本年），删除去年走势虚线 */
  function half(nm,elKpi,cv,unit,yoySuffix){
    var cur=BK_LINE_NAMES[bkRarocCur], rr=bkAct('05',nm)||0;
    /* 同比解析：asNum 对 "+1.2ppt" 返回 null，这里容忍 ppt 后缀（RAROC 同比即百分点） */
    var yoyRaw=String(bkTxt('05',nm,'yoy')||'').replace(/[+,%\s]/g,'').replace(/ppt/i,'');
    var yoy=parseFloat(yoyRaw); if(isNaN(yoy)) yoy=null;
    var el=document.getElementById(elKpi);
    /* 2026-10-28 按需求：删除 KPI 值+单位后的小字说明行（如「公司条线 RAROC · 截止本月末」），条线名已由页签表达；
       同日再按需求：KPI 右侧小注「同比」改「累计同比」，且标签在值前、值放文字后（如「累计同比 ▲ 1.2ppt」） */
    if(el) el.innerHTML='<div class="hv"><b>'+rr.toFixed(2)+'<small style="font-size:14px">'+unit+'</small></b></div>'+
      '<div class="hd">'+(yoy==null?'<span class="flat">累计同比：—</span>':'<i class="yoy '+(yoy>=0?'up':'down')+'">累计同比 '+(yoy>=0?'▲':'▼')+' '+Math.abs(yoy).toFixed(2)+yoySuffix+'</i>')+'</div>';
    /* 2026-10-30 按需求改【1—12月 日历轴 · 去年/今年双列】：每月橙柱=去年同期累计（左）、蓝柱=本年累计（右），
       今年仅至数据月（如9月）——10/11/12月本年无柱、去年全年 12 根都在，两年逐月差异直观对读；
       同日再按需求定稿柱含义：橙=去年同期累计（左）、蓝=本年累计（右），barGap 收小双柱贴近成对，图例名同步。
       取值模型（累计口径·BK_SHAPE 形状拆分·锚点自洽）：
       · 本年 m 月累计 = rr×SHAPE[m]/SHAPE[last]（锚点月=台账实际值 rr）；m>last 无数据（null 不画柱）
       · 去年 m 月累计 = basePrev×SHAPE[m]/SHAPE[last]（basePrev=去年同月累计：
         RAROC 按 ppt 差 rr−yoy 回推、EVA 按增幅 rr/(1+yoy) 回推；去年铺满 1—12 月） */
    var SHAPE=BK_SHAPE;
    var basePrev=(unit==='%') ? (yoy==null? rr-1.2 : rr-yoy) : (yoy==null? rr/1.08 : rr/(1+yoy/100));
    function cumOf(val,m){ return +(val*SHAPE[m-1]/SHAPE[last-1]).toFixed(2); }
    var curArr=[],prevArr=[];
    for(var mi=1;mi<=12;mi++){
      curArr.push(mi<=last? cumOf(rr,mi) : null);
      prevArr.push(cumOf(basePrev,mi));
    }
    mk(cv,{type:'bar',
      data:{labels:labels,datasets:[
        {label:'去年同期累计',data:prevArr,backgroundColor:'#f59e0bB3',borderRadius:2,maxBarThickness:9,order:1},
        {label:'本年累计',data:curArr,backgroundColor:'#0d6ef0B3',borderRadius:2,maxBarThickness:9,order:2}]},
      options:Object.assign(base({legend:{display:true,position:'top',align:'end',labels:{boxWidth:8,boxHeight:8,padding:6,font:{size:9},color:T2}},
        tooltip:{filter:function(){return true;},
        callbacks:{label:function(c){
          var v=c.parsed.y;
          return ' '+c.dataset.label+'：'+(+v).toFixed(2)+(unit==='%'?'%':' 亿元');
        },
        afterBody:function(items){
          var i=items[0].dataIndex, v=curArr[i], pv=prevArr[i];
          if(v==null||!pv) return [];   /* 今年未到的月份：仅去年柱，无同比可言 */
          if(unit==='%'){ var dppt=v-pv; return ['累计同比：'+(dppt>=0?'+':'')+dppt.toFixed(2)+'ppt']; }
          var yoyV=(v/pv-1)*100; return ['累计同比：'+(yoyV>=0?'+':'')+yoyV.toFixed(2)+'%'];
        }}}}),
        {interaction:{mode:'index',intersect:false},
         datasets:{bar:{categoryPercentage:0.78,barPercentage:0.92,barGap:'45%'}},
         /* 2026-10-30 按需求：同月双柱留缝回调——0% 贴合后反馈"太近"，barGap 提到 35%（≈柱宽×0.35≈3px 缝），
            category 0.56→0.6 容纳缝隙且不撞邻月 */
         scales:{y:Object.assign({},YAX,{grace:'14%',ticks:{font:{size:9},color:T3,callback:function(v){return v+unit}}}),
                 x:{grid:{display:false},ticks:{font:{size:9},color:T3,maxRotation:0,autoSkip:false,maxTicksLimit:12}}}})});
  }
  bkDestroyCanvases(/^c-bk-eva$/);
  half(BK_RAROC_LINES[bkRarocCur][0],'bk-raroc-kpi','c-bk-raroc','%','ppt');
  half(BK_LINE_NAMES[bkRarocCur]+'-EVA','bk-eva-kpi','c-bk-eva','亿元','%');
}
function drawBank(){
  /* ===== ① 核心指标与盈利分解（源 02 · 03 盈利性 · 07；2026-10-22 五轮改版）=====
     行1 hero 三卡：营业收入 / 利润总额 / 净利润（利润链三终点同行）
     布局（按需求）：左=预算完成环（环内=达成进度数）→ 中=本年累计值+累计同比+全年预算 → 右=本月数+环比
     趋势图 = 月度同比%（当年柱+去年同月虚线对照） */
  function hero(elId,canvasId,name,color){
    var v=bkAct('02',name), yoy=bkTxt('02',name,'yoy'), bd=bkBud('02',name), rt=bkRate('02',name);
    var el=document.getElementById(elId);
    var mv=asNum(bkGet('02',name,'mval')), mom=bkTxt('02',name,'mom');
    /* 预算完成环（2026-10-22 八轮参考图样式）：浅灰轨道 + 统一亮蓝粗进度弧（双圆头端点、无独立圆点、无内虚线圈），
       环内上=进度百分比(两位小数·墨色) 下=「进度」灰标签；非考核项=灰轨道+灰字 */
    var RING_BLUE='#3f82f6';
    var ring;
    if(rt!=null){
      var p=m(v)/bd*100, pw=Math.min(p,100), R=33, C=2*Math.PI*R;
      ring='<svg class="hv-ring" width="86" height="86" viewBox="0 0 88 88" aria-label="预算达成 '+p.toFixed(2)+'%">'+
        '<circle cx="44" cy="44" r="'+R+'" fill="none" stroke="#e9edf3" stroke-width="9"/>'+
        '<circle cx="44" cy="44" r="'+R+'" fill="none" stroke="'+RING_BLUE+'" stroke-width="9" stroke-linecap="round" '+
          'stroke-dasharray="'+(C*pw/100).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 44 44)"/>'+
        '<text x="44" y="45" text-anchor="middle" fill="#1f2937" font-size="14.5" font-weight="800">'+p.toFixed(2)+'%</text>'+
        '<text x="44" y="60" text-anchor="middle" fill="#8a97a8" font-size="10">进度</text></svg>';
    }else{
      /* 2026-10-27 按需求：非考核项（如净利润）不显示达成率圆环，也无需「—/非考核」占位 */
      ring='';
    }
    /* 中间三行（参考图：标签在上、数值在下）：本年累计=亮蓝大字 ｜ 累计同比=红涨绿跌带箭头 ｜ 预算数=墨色 */
    var yv=asNum(yoy);
    var yoyHtml=yv==null?'<span class="val" style="color:var(--dim)">—</span>':
      '<span class="val '+(yv>=0?'up':'down')+'">'+(yv>=0?'+':'')+Math.abs(yv).toFixed(2)+'%'+(yv>=0?' ↑':' ↓')+'</span>';
    /* 右侧上下结构：本月数 + 月度同比（=趋势线所选月点值，卡图同源；2026-10-22 按需求环比改同比）
       2026-10-28 按需求：趋势窗口扩为上年1月—当年10月后，卡内月度同比取该序列 selIx 位置值，与图线一致 */
    var seedN=elId==='bk-hero-recv'?1:(elId==='bk-hero-prof'?2:3);
    var ms=bkMonthSeries(name);
    var mYoy=bkMonthYoyArr(ms.labels.length,seedN,asNum(yoy),ms.selIx)[ms.selIx];
    if(el) el.innerHTML=
      '<div class="hv-l">'+ring+
        '<div class="hv-main">'+
          '<div class="hv-row"><span class="lbl">本年累计</span><span class="val hv-blue">'+bkNum(m(v),'亿元')+'<small>亿元</small></span></div>'+
          '<div class="hv-row hv-inl"><span class="lbl">累计同比</span>'+yoyHtml+'</div>'+
          /* 2026-10-27 按需求：非考核项无预算数概念，预算数行整体不渲染（有预算的卡保留） */
          (bd!=null?'<div class="hv-row hv-inl"><span class="lbl">预算数</span><span class="val">'+bkNum(bd,'亿元')+'<small>亿元</small></span></div>':'')+
        '</div>'+
      '</div>'+
      '<div class="hv-mo"><span class="mol">本月数</span><span class="mov">'+bkNum(m(mv||0),'亿元')+'<small>亿元</small></span>'+
        '<span class="mo-yoy"><span class="mol">月度同比</span><span class="val '+(mYoy>=0?'up':'down')+'" style="font-size:11px;font-weight:600">'+(mYoy>=0?'+':'')+Math.abs(mYoy).toFixed(2)+'%'+(mYoy>=0?' ↑':' ↓')+'</span></span></div>';
    mk(canvasId,bkMonthYoyCfg(ms,color,seedN,asNum(yoy)));
  }
  /* 2026-10-27 按需求：三 hero 趋势柱加深为名称栏蓝渐变终点色 #0d6ef0（柱与卡头背景同色，页面主色统一） */
  /* 2026-10-27 按需求：柱色调淡为亮蓝 #4d94ff（仍属蓝色主题，与饼图主片同族；原 #0d6ef0 过深） */
  hero('bk-hero-recv','c-bk-t-recv','营业收入','#4d94ff');
  hero('bk-hero-prof','c-bk-t-prof','利润总额','#4d94ff');
  hero('bk-hero-net','c-bk-t-net','净利润','#4d94ff');

  /* 行2左 收入构成（饼=构成规则；2026-10-22 六轮按业务口径改并列）：
     营业收入 = 利息净收入 + 手续费及佣金净收入 + 投资收益 + 公允价值变动损益 + 其他非息收入
     五项互斥并列（相加=营收勾稽闭合），投资收益/公允价值与其他非息收入为并列关系、非层级拆分
     2026-10-29 按需求：「其他非息收入」移至末位（饼片与明细行同步），各项配色随项不变 */
  bkDestroyCanvases(/^c-bk-rev-pie$/);
  var revParts=[['利息净收入',BK_PIE[0]],['手续费及佣金净收入',BK_PIE[1]],
                ['投资收益',BK_PIE[3]],['公允价值变动损益',BK_PIE[4]],['其他非息收入',BK_PIE[2]]];
  var srcMap={'手续费及佣金净收入':'其中：手续费及佣金净收入'};
  var revV=revParts.map(function(e){ return +m(bkAct('02',srcMap[e[0]]||e[0])||0).toFixed(2); });
  bkDonut('c-bk-rev-pie',revParts.map(function(e){return e[0]}),revV,revParts.map(function(e){return e[1]}),
    {yoy:revParts.map(function(e){ return bkTxt('02',srcMap[e[0]]||e[0],'yoy'); }),kind:'period'});
  bkDonutCenter('bk-rev-center',m(bkAct('02','营业收入')||0),'营业收入 · 亿元');
  var revRows=document.getElementById('bk-rev-rows');
  if(revRows){
    var tot=m(bkAct('02','营业收入')||1);
    /* 2026-10-27 按需求：删除「构成项/累计同比｜占营收」列说明行；行内提示标签用浅色（仅提示作用，不与数值抢注意力） */
    revRows.innerHTML=
      revParts.map(function(e,ix){
      var src=srcMap[e[0]]||e[0];
      var y=bkTxt('02',src,'yoy');
      return '<div class="strow"><span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:'+e[1]+';margin-right:6px"></i>'+e[0]+'</span>'+
        '<b class="cols3"><i class="c-v">'+bkNum(revV[ix],'亿元')+' 亿元</i>'+
        '<i class="c-y"><span class="lb">累计同比</span>'+(y&&y!=='-'?bkDelta(y,''):'<i class="yoy flat">—</i>')+'</i>'+
        '<i class="c-p"><span class="lb">占比</span><span class="pv">'+(revV[ix]/tot*100).toFixed(2)+'%</span></i></b></div>'; }).join('');
  }

  /* 行2右 总支出构成（2026-10-30 按需求：「利润扣减结构」改「总支出」——删「净利润」片，五类支出并列片；
     中心不再注「营业收入」，仅显示数字+单位，且数字=右侧五项支出合计（饼片/悬停占比/明细行占比
     三处口径统一=占总支出比，勾稽自动闭合）。
     同日再按需求：卡名改「总支出构成」；「营业外收支」显示名改「其他支出」（取数仍按台账 02 原名）。
     2026-10-28 按需求新增「营业外收支」片（台账 02 表，净额口径演示值 −2.0=净支出；入饼取 |值| 作扣减片） */
  bkDestroyCanvases(/^c-bk-wf$/);
  (function(){
    /* 四元组：[台账原名(取数键), 颜色, 显示名(缺省=原名), 明细行带符号=1]
       2026-10-30 按需求：「其他支出(净收益)」=台账「营业外收支」净额口径——有时净支出有时净收益，
       明细行值按台账原符号显示（演示值 −2.00=净支出为负）；饼片/中心合计/占比仍取 |值|（环形图不支持负片） */
    var deducts=[['业务及管理费','#6cc0f0'],['税金及附加','#a0b4f0'],['信用减值损失','#eda14e'],
                 ['营业外收支','#8fd8c8','其他支出(净收益)',1],['所得税','#9db4d0']];
    var vals=deducts.map(function(e){ return +m(Math.abs(bkAct('02',e[0])||0)).toFixed(1); });
    var rowVals=deducts.map(function(e,i){ return e[3]? +(m(bkAct('02',e[0])||0)).toFixed(1) : vals[i]; });
    /* 中心=明细行五项带符号合计（净额净收益时为负，相加=真实总支出）；饼片宽/占比按 |值| */
    var total=+rowVals.reduce(function(a,b){return a+b;},0).toFixed(1);
    var absTotal=+vals.reduce(function(a,b){return a+b;},0).toFixed(1);
    bkDonut('c-bk-wf',deducts.map(function(e){return e[2]||e[0]}),vals,deducts.map(function(e){return e[1]}),
      {yoy:deducts.map(function(e){ return bkTxt('02',e[0],'yoy'); }),kind:'period',signedVals:rowVals});
    bkDonutCenter('bk-wf-center',total,'亿元');
    /* 明细行（同左卡 revRows 格式：色点+名称 / 值 亿元 / 累计同比 / 占比=占总支出） */
    var rowsEl=document.getElementById('bk-wf-rows');
    if(rowsEl){
      rowsEl.innerHTML=deducts.map(function(e,i){
        var y=bkTxt('02',e[0],'yoy');
        return '<div class="strow">'+
          '<span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:'+e[1]+';margin-right:6px"></i>'+(e[2]||e[0])+'</span>'+
          '<b class="cols3">'+
          '<i class="c-v">'+bkNum(rowVals[i],'亿元')+' 亿元</i>'+
          '<i class="c-y"><span class="lb">累计同比</span>'+(y&&y!=='-'?bkDelta(y,''):'<i class="yoy flat">—</i>')+'</i>'+
          '<i class="c-p"><span class="lb">占比</span><span class="pv">'+(absTotal?(rowVals[i]/absTotal*100).toFixed(2)+'%':'—')+'</span></i></b></div>'; }).join('');
    }
  })();

  /* 行3 效益与定价六卡（盈利质量+定价能力聚合；比率类不受日期系数影响）
     2026-10-28 按需求：①盈利三卡口径标签改「本年累计」（比率本身即累计口径）、变动小注「同比」改「累计同比」；
     ②资产利润率/资本利润率显示名改 ROA(资产利润率)/ROE(资本利润率)；③净息差前置到生息资产收益率之前；
     ④盈利三卡右侧显示「商业银行」行业当期值对比（值源=国家金融监督管理总局《商业银行主要监管指标情况表》，
       商业银行平均值列，按季更新；ROA/ROE 越高越好、成本收入比越低越好→徽标 优于/逊于同业） */
  var BK_INDUSTRY={peri:'（2026年二季度）',
    '资产利润率':{v:0.65,better:'high'},   /* 金监总局 商业银行平均·资产利润率（年化） */
    '资本利润率':{v:7.80,better:'high'},   /* 金监总局 商业银行平均·资本利润率（年化） */
    '成本收入比':{v:31.50,better:'low'},   /* 金监总局 商业银行平均·成本收入比 */
    '净息差':{v:1.43,better:'high'}};      /* 金监总局 商业银行平均·净息差（2026Q2 商业银行整体约1.4%±） */
  var effEl=document.getElementById('bk-eff-cards');
  /* 定价三卡（净息差/生息资产收益率/付息负债付息率）：2026-10-28 按需求
     ①净息差加「商业银行」行业对标（同成本收入比卡）；②生息资产收益率/付息负债付息率 右侧迷你趋势改近12月 */
  var sparkSet={'生息资产收益率':1,'付息负债付息率':1};
  var peerSet={'净息差':1};
  if(effEl) effEl.innerHTML=
    [['资产利润率','ROA(资产利润率)'],['资本利润率','ROE(资本利润率)'],['成本收入比','成本收入比']]
      .map(function(e){ return bkStx('03',e[0],Object.assign({kal:'本年累计',label:e[1],ylbl:'累计同比',ltY:1,tipDate:1,   /* 2026-10-30 按需求：效益与定价全卡悬停最新日期；2026-11-03 按需求：三卡加「较上年」小注 */
        peer:Object.assign({peri:BK_INDUSTRY.peri},BK_INDUSTRY[e[0]])},
        /* 2026-10-30 按需求：成本收入比悬停=三行弹框（指标名/最新日期/计算公式）；
           2026-10-31 按需求：公式符号改 ÷（与净息差等新加公式统一） */
        e[0]==='成本收入比'?{tipTitle:1,tipFormula:'成本收入比 = 业务及管理费 ÷ 营业收入 ×100%'}:{})); }).join('')+
    ['净息差','生息资产收益率','付息负债付息率'].map(function(n){ return bkStx('07',n,
      Object.assign({kal:'本年累计',ytlbl:'较上年',tipDate:1,   /* 2026-10-29 按需求：口径标签改本年累计、较年初改较上年；10-30 悬停最新日期 */
       spark:sparkSet[n], peer:peerSet[n]?Object.assign({peri:BK_INDUSTRY.peri},BK_INDUSTRY[n]):null},
       /* 2026-10-31 按需求：净息差悬停加第三行计算公式（指标名/最新日期/计算公式，同成本收入比） */
       n==='净息差'?{tipFormula:'净息差 = 利息净收入 ÷ 生息资产年日均 ÷ 实际天数 × 360 × 100%'}:{})); }).join('')+
    /* 2026-10-30 按需求：行尾新增「不良贷款率」卡（09 台账），样式同付息负债付息率
       （口径标签+近6月 spark 面积图+较上年小注）；本行改一行七卡 */
    /* 2026-10-30 按需求：口径标签「本年累计」改「本月末」（不良贷款率=时点余额口径）、
       小注「较上年」改「较年初」（删 ytlbl 覆写=默认较年初） */
    bkStx('09','不良贷款率',{kal:'本月末',spark:1,tipDate:1});

  /* ===== ② 业绩合同指标：打标项按【业务关联性】分 4 组（2026-10-21）=====
     2026-10-28 按需求重排第 1 行：先零售、后对公——「零售财富与低成本存款」四卡
     （AUM 底盘 → 存款总量 → 协同来源 → 结构占比）+「五篇大文章｜重点领域规模」两卡（客群净增 → 金融存量；2026-10-28 组头两度更名：对公客群与战略业务→科技绿色重点领域→五篇大文章｜重点领域规模）；
     客群、风险两域不变；上层优先去重（营业收入/利润总额/全行手续费已在①展示） */
  var EXC={ '02|营业收入':1,'02|利润总额':1,'04|其中：全行手续费及佣金净收入':1 };
  var cEl=document.getElementById('bk-contract');
  if(cEl){
    var found={}; /* 扫描全部打标行入池（含上层优先已展示项） */
    ['02','03','04','06','08','09'].forEach(function(sk){ var sh=bkS(sk); if(!sh) return; var c=BK_COL[sk];
      (sh.rows||[]).forEach(function(r){ var t=String(r[c.star]||'');
        if(!t || t==='-') return; var nm=String(r[c.nm]);
        found[sk+'|'+nm]=1; }); });
    var GROUPS=[
      {cap:'零售财富与低成本存款',hint:'',cols:4,
        /* 2026-10-28 按需求：卡片显示名精简（去「其中：」前缀、去「余额」尾词）；取数仍按台账原名；
           2026-10-29 按需求排序：AUM 底盘 → 低成本存款年日均占比 → 低成本存款年日均 → 产融协同年日均；
           本组四卡删除「本月末」口径标签（kal:''）；「低成本存款占比」更名「低成本存款年日均占比」；
           2026-11-03 按需求：本组四卡第二变动小注由「较年初」改「环比」展示（momLbl） */
        pick:[['06','其中：个人非存AUM月日均',{label:'个人非存AUM月日均',kal:'',momLbl:'环比',dlCol:1,badges:1}],['06','低成本存款占比',{label:'低成本存款年日均占比',kal:'',momLbl:'环比',badges:1,den:['06','存款年日均（全行）','存款年日均']}],['06','其中：低成本存款年日均',{label:'低成本存款年日均',kal:'',momLbl:'环比',dlCol:1,badges:1}],['06','产融协同低成本存款年日均余额',{label:'产融协同低成本存款年日均',kal:'',momLbl:'环比',dlCol:1,badges:1}]]},
      {cap:'五篇大文章相关',hint:'',cols:2,
        /* 2026-10-29 按需求：显示名去「公司-」前缀（取数仍按台账原名）；本组两卡删除「本月末」口径标签 */
        /* 2026-10-30 按需求：科技企业客群净增余额加「本年累计」口径标签（净增=年内累计动作量）、删「较年初」小注 */
        /* 2026-10-31 按需求：两卡悬停加「指标定义」行（定义长文，气泡内折行显示） */
        pick:[['06','公司-科技企业客群净增余额',{label:'科技企业客群净增余额',kal:'本年累计',noYtd:1,badges:1,tipDef:'科技企业客群余额为科技企业表内贷款余额。科技企业包含：“高新技术企业认定管理工作网”发布最新高新技术企业，或符合由国家工业和信息化部、广东省工业和信息化厅、深圳市工业和信息化局或深圳市中小企业主管部门认定的专精特新企业、小巨人企业、“全国科技型中小企业信息服务平台”发布的科技型中小企业以及行内科技金融领导小组办公室认定的科技企业'}],['06','绿色金融余额',{kal:'',badges:1,tipDef:'统计口径（现行《绿色金融支持项目目录（2025年版）》银调发〔2025〕7号，2025-10-01实施）：绿色贷款指金融机构发放给企事业单位/其他组织/个人，资金用于环境改善、应对气候变化、资源节约高效利用的贷款，仅统计表内贷款，本外币均统计。认定原则：按贷款实际用途认定，不是看企业本身是不是绿色企业；必须对应《绿色金融支持项目目录（2025年版）》允许的绿色经济活动，可核验、可追溯。包含9大一级目录门类（2025版）：1.节能降碳产业 2.环境保护产业 3.资源循环利用产业 4.能源绿色低碳转型 5.生态保护修复和利用 6.基础设施绿色升级 7.绿色服务 8.先进交通装备贸易 9.绿色消费'}]]},
      {rows:[
        {cap:'公司客群经营',hint:'',cols:4,
          /* 2026-10-29 按需求：客群行拆左（公司4）右（零售2）两组；新增有效客户数=年内累计获客，口径改「本年累计」 */
          /* 2026-10-31 按需求：两卡悬停加「指标定义」行 */
          pick:[['08','公司有效客户数',{dlCol:1,badges:1}],['08','新增有效客户数',{kal:'本年累计',badges:1}],['08','基石客户',{badges:1,tipDef:'与华润银行深度合作，授信地位“数一数二”，综合金融服务交叉覆盖，存款沉淀合理充分，能够持续为华润银行贡献综合收益的客户'}],['08','产融协同客户数',{tipDef:'核心企业上下游新开户数',badges:1}]]},
        {cap:'零售客群经营',hint:'',cols:2,
          /* 2026-10-31 按需求：两卡悬停加「指标定义」行 */
          pick:[['08','代发客户数',{badges:1,tipDef:'考核当年代发工资客户数。代发工资是指批量代发或交易类型为“代发工资、奖金、补贴、津贴、报销、年终奖、养老金、公积金”等的批量转账。代发客户是指连续代发三个月（自2025年11月1日起）或当年累计四个月，平均每月代发金额需大于等于1000元的客户'}],['08','零售高净值客户数',{tipDef:'资产月日均200万元及以上的客户数',badges:1}]]}]},
      {cap:'风险与监管底线',hint:'',
        /* 2026-10-28 按需求：资产质量三卡改【总锚→新增生成→条线拆分】（小额生成率提到个贷前）；
           不良资产处置=年内累计处置动作量，口径标签覆写为「本年累计」、小注「同比」改「累计同比」；
           2026-10-29 按需求：小额不良生成率口径改「本年累计」、较年初改「较上年」；
           资本充足率/流动性覆盖率=季度报送监管指标，口径标签改「本季末」；
           2026-10-30 按需求：两卡加悬浮提示，鼠标移入显示该指标最新获取日期（月末账期） */
        /* 2026-10-31 按需求：六卡悬停气泡在最新日期下加「计算公式」行（三行版同成本收入比） */
        pick:[['09','不良资产率',{inv:1,badges:1,tipFormula:'不良资产率 = 不良信用风险资产余额 ÷ 资产总额 × 100%'}],['09','小额不良生成率',{inv:1,kal:'本年累计',ytlbl:'较上年',badges:1,tipFormula:'小额不良生成率 = （期末不良额 − 期初不良额 + 核销（含差额核销） − 核销后回收） ÷ 期初贷款规模 × 100%'}],['09','个贷不良率',{inv:1,badges:1,tipFormula:'个贷不良率 = 个贷条线不良贷款 ÷ 个贷条线总贷款 × 100%'}],
              ['09','不良资产处置',{kal:'本年累计',ylbl:'累计同比',badges:1,tipFormula:'不良资产处置 = 1104报表《G12贷款质量迁徙情况表》[15.不良资产处置总额][本期减少]，即期末不良资产的（min(发放额,年初余额) − 期末余额）'}],
              ['03','资本充足率',{kal:'本季末',tipDate:1,badges:1,tipFormula:'资本充足率 = 资本净额 ÷ 应用资本底线及校准后的风险加权资产合计 × 100%'}],['03','流动性覆盖率',{kal:'本季末',tipDate:1,badges:1,tipFormula:'流动性覆盖率 = 合格优质流动性资产 ÷ 未来30天现金净流出量 × 100%'}]]}
    ];
    var used=0;
    /* 组卡渲染（pick 项第 3 元素=卡片选项覆写，如 kal 口径标签；去重键只取前两位；
       2026-10-30 按需求：业绩指标模块全部卡片悬停显示「最新日期」提示，统一注入 tipDate:1） */
    function gCells(g){ return g.pick.filter(function(p){ var k=p[0]+'|'+p[1]; return !EXC[k] && found[k]; })
      .map(function(p){ return bkStx(p[0],p[1],Object.assign({bud:1,tipDate:1},p[2]||{})); }); }
    /* 一行两组（左宽右窄 4+2）：组头按 cols 占列，卡片各占 1 列，卡宽与相邻模块严格一致 */
    function pairHtml(gA,gB,mid){
      var ca=gCells(gA), cb=gCells(gB);
      if(!ca.length && !cb.length) return '';
      used+=ca.length+cb.length;
      /* mid=true（客群行，2026-10-29 按需求）：组头文字垂直居中于上排与本排卡片之间——
         上下行距=grid row-gap(10px)+margin(8px)=18px 对称（原 margin-top:2px 使上距12px偏挤显"顶格"） */
      var capSt=mid?'margin:8px 0 8px':'margin-top:2px';
      return '<div class="bkgrid6">'+
        '<div class="stgrp-cap" style="grid-column:span '+gA.cols+';'+capSt+'">'+gA.cap+(gA.hint?' <span class="lite">'+gA.hint+'</span>':'')+'</div>'+
        '<div class="stgrp-cap" style="grid-column:span '+gB.cols+';'+capSt+'">'+gB.cap+(gB.hint?' <span class="lite">'+gB.hint+'</span>':'')+'</div>'+
        ca.join('')+cb.join('')+'</div>';
    }
    /* 2026-10-26 按需求：第 1、2 组同一 bkgrid6 六列网格（4+2 分布）；
       2026-10-29 按需求：客群行同为两列组对（公司4+零售2），rows 型组走 pairHtml；风险组整行 */
    var html='';
    html+=pairHtml(GROUPS[0],GROUPS[1]);
    html+=pairHtml(GROUPS[2].rows[0],GROUPS[2].rows[1],true);
    html+=GROUPS.slice(3).map(function(g){
      var cells=gCells(g);
      if(!cells.length) return '';
      used+=cells.length;
      return '<div class="stgrp-cap" style="margin-top:14px">'+g.cap+
        (g.hint?' <span class="lite">'+g.hint+'</span>':'')+'</div>'+
        '<div class="bkgrid6">'+cells.join('')+'</div>'; }).join('');
    cEl.innerHTML=html;
    var st=document.getElementById('bk-contract-n'); if(st) st.textContent=used;
  }

  /* ===== ③ 资产负债结构（源 01 · 06；2026-10-21 构成→饼改版）=====
     2026-10-28 按需求：核心科目=总资产/总负债/所有者权益三卡（资产负债恒等式三要素），
     原六卡行的 存款/贷款/投资类资产 不再单列卡——其数值已由下方双侧构成分项明细承载；
     同日再按需求撤除本模块两张构成饼，分项改行式列表（色点+名称 / 值+同比+占）；
     同日按需求删除「贷款五级分类」「监管红线监测」两模块（09/03 监管项不再进③区） */
  var bsEl=document.getElementById('bk-bs-cards');
  /* 三总量卡名称前小图标（2026-10-28 按需求参考图三改）： glossy 蓝渐变圆角方块 + 白色¥的 app-icon 质感
     ——上亮下暗纵向渐变（#6ab0ff→#0d6ef0）+ 顶部高光条；三卡通用 ¥ 符号（资产负债表=资金三要素），
     名称文本已自带区分，图标统一更精致 */
  function bsTile(gid){
    return '<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1">'
      +'<stop offset="0" stop-color="#6ab0ff"/><stop offset="1" stop-color="#0d6ef0"/></linearGradient></defs>'
      +'<rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="url(#'+gid+')" stroke="#0b5ed2" stroke-width=".6" stroke-opacity=".35"/>'
      +'<path d="M5 3.4h14" stroke="#fff" stroke-opacity=".55" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
      +'<path d="M8.6 7.4l3.4 3.8 3.4-3.8M12 11.2V17M9.6 13.2h4.8M9.6 15.4h4.8" stroke="#fff" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  var BS_ICONS={'总资产':bsTile('bsig0'),'总负债':bsTile('bsig1'),'所有者权益':bsTile('bsig2')};
  if(bsEl) bsEl.innerHTML=['总资产','总负债','所有者权益'].map(function(n){ return bkStx('01',n,{cls:'plain',kal:'',icon:BS_ICONS[n],spark:1}); }).join('');
  /* 构成分项行（无饼版式）：色点+名称 / 值 / 同比 / 占比
     2026-10-30 按需求：右侧统一对齐「收入构成」b.cols3 固定列版式（值列右对齐、同比标签+涨跌、占比列纵向成列）；
     仅样式统一，字段不变 */
  function bkCompBarRow(color,label,val,yoy,pct,pcColor){
    return '<div class="strow"><span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:'+color+';margin-right:6px"></i>'+label+'</span>'+
      '<b class="cols3"><i class="c-v">'+bkNum(val,'亿元')+'<small>亿元</small></i>'+
      '<i class="c-y"><span class="lb">同比</span>'+(yoy&&yoy!=='-'?bkDelta(yoy,''):'<i class="yoy flat">—</i>')+'</i>'+
      '<i class="c-p"><span class="lb">占比</span><i class="pv">'+pct.toFixed(2)+'%</i></i></b></div>';
  }
  /* 总资产构成分项（2026-10-28 按需求删除「其他资产」轧差行，仅列五分类明细）
     「流动性降序」列报（对齐年报/监管报表口径）：存放央行→存拆放同业→买入返售→贷款→投资类资产；
     色值仍绑定科目原语义色不随位序变化；占比=占总资产（五类合计<总资产，差额即原其他资产，不再单列） */
  (function(){
    var total=m(bkAct('01','总资产')||0);
    var parts=[['存放央行','存放央行',BK_PIE[2]],['存拆放同业','存拆放同业',BK_PIE[3]],['买入返售','买入返售',BK_PIE[4]],
               ['贷款','贷款',BK_PIE[0]],['投资类资产','投资类资产',BK_PIE[1]]];
    var v=parts.map(function(e){ return +m(bkAct('01',e[1])||0).toFixed(0); });
    var el=document.getElementById('bk-asset-rows');
    if(el) el.innerHTML=parts.map(function(e,i){
      return bkCompBarRow(e[2],e[0],v[i],bkTxt('01',e[1],'yoy'), total?v[i]/total*100:0); }).join('');
  })();
  /* 总负债构成分项（资金来源视角；2026-10-28 按需求删除「其他负债」轧差行；
     2026-10-29 按需求改列报顺序【市场化负债 → 核心负债】：向央行借款→同业存拆放→卖出回购→存款，
     并删除「应付债券」「所有者权益」两行；色值绑定科目原语义色；占比=占总资产（总资产口径母项不变） */
  (function(){
    var srcs=[['向央行借款','向央行借款',BK_PIE[4]],['同业存拆放','同业存拆放',BK_PIE[2]],
              ['卖出回购','卖出回购',BK_PIE[3]],['存款','存款',BK_PIE[0]]];
    var vals=srcs.map(function(e){ return +m(bkAct('01',e[1])||0).toFixed(0); });
    var total=m(bkAct('01','总资产')||0);
    var el=document.getElementById('bk-debt-rows');
    if(el) el.innerHTML=srcs.map(function(e,i){
      return bkCompBarRow(e[2],e[0],vals[i],bkTxt('01',e[1],'yoy'), total?vals[i]/total*100:0); }).join('');
  })();
  /* 存款结构饼（2026-10-22 按需求换指标：存款余额（全行）= 公司低成本+公司定期+个人低成本+个人定期，
     四项构成相加=全行存款（勾稽闭环，无轧差项）；低成本占比直接映射负债成本管控；
     2026-10-30 按需求显示名精简：中心「全行存款」改「存款余额」，四分项去「存款余额」尾词
     （公司低成本/公司定期/个人低成本/个人定期；取数与饼片 hover 名同步） */
  bkDestroyCanvases(/^c-bk-dep-pie$/);
  (function(){
    var el=document.getElementById('bk-dep-rows');
    var parts=[['公司低成本存款余额',BK_PIE[0],'公司低成本'],['公司定期存款余额',BK_PIE[1],'公司定期'],
               ['个人低成本存款余额',BK_PIE[2],'个人低成本'],['个人定期存款余额',BK_PIE[3],'个人定期']];
    var vals=parts.map(function(e){ return +m(bkAct('06',e[0])||0).toFixed(0); });
    var full=m(bkAct('06','存款余额（全行）')||0);
    var tot=vals.reduce(function(a,b){return a+b;},0);
    bkDonut('c-bk-dep-pie',parts.map(function(e){return e[2]}),vals,parts.map(function(e){return e[1]}),
      {yoy:parts.map(function(e){ return bkTxt('06',e[0],'yoy'); }),kind:'time'});
    bkDonutCenter('bk-dep-center',full,'存款余额 · 亿元','sm');
    if(el) el.innerHTML=parts.map(function(e,i){
      return bkCompRow(e[1],e[2],vals[i],bkTxt('06',e[0],'yoy'), '占比 '+(vals[i]/full*100).toFixed(2)+'%',1); }).join('');
  })();
  /* 贷款结构 → 环形饼（2026-10-27 按需求由条形改饼：公司+个人贷款 相加=贷款余额，
     严格层级构成满足入饼条件；中心=贷款余额，明细行 值+同比+占比，与存款结构卡同风格；
     2026-10-30 按需求显示名精简：中心「贷款总额」改「贷款余额」，分项「公司-贷款余额/个人-贷款余额」
     改「公司贷款/个人贷款」（取数仍按台账原名；饼片悬停名同步）；
     2026-11-03 按需求：①中心「贷款余额」改「贷款」（单位亿元随标签保留）；
     ②个人贷款下新增第三分项「其他贷款」（台账新增行 24a 其他-贷款余额 150.00 亿，同比+4.8%），
     三分项相加=中心合计 7,000.00 亿勾稽闭环；第三片色取 BK_PIE[4] 与前两片区分 */
  var loanNames=['公司-贷款余额','个人-贷款余额','其他-贷款余额'];
  var loanDisp=['公司贷款','个人贷款','其他贷款'];
  var loanYoys=loanNames.map(function(n){ return bkTxt('06',n,'yoy'); });
  (function(){
    var vals=loanNames.map(function(n){ return +m(bkAct('06',n)||0).toFixed(0); });
    var full=vals.reduce(function(a,b){return a+b;},0);
    var cols=[BK_PIE[0],BK_PIE[2],BK_PIE[4]];
    bkDestroyCanvases(/^c-bk-loan$/);
    bkDonut('c-bk-loan',loanDisp,vals,cols,{yoy:loanYoys,kind:'time'});
    bkDonutCenter('bk-loan-center',full,'贷款 · 亿元','sm');
    var el=document.getElementById('bk-loan-rows');
    if(el) el.innerHTML=loanNames.map(function(n,i){
      return bkCompRow(cols[i],loanDisp[i],vals[i],loanYoys[i],'占比 '+(vals[i]/full*100).toFixed(2)+'%',1); }).join('');
  })();
  /* 贷款五级分类饼、监管红线监测两模块 2026-10-28 按需求整体删除（HTML+JS 同步移除） */

  /* ===== ④ 条线分解与客群（源 04 · 05 · 08；条线构成饼+经营效率行，2026-10-21）===== */
  /* 条线营收构成饼：五环合计=饼中心（勾稽验证），行内附 EVA/RAROC → 规模·效率一屏双读
     2026-10-28 按需求改双环：内环=本年累计、外环=去年同期（去年值=本年值÷(1+累计同比)回推，
     与 04 台账同比列严格自洽）；悬停各环显示各自年度详情（标题带年份）；
     2026-10-30 按需求：①「金融市场」显示名改「金市条线」（原名→金融条线→金市条线；取数仍按台账原名）；
     ②司库下新增「其他」项（04 表「其他收入」行，未纳入条线考核营收部分），中心=四线+其他合计；
     ③外环收窄（ring weight 今年5:去年3）；④饼下注明内/外圈口径 */
  var lineMap=[['公司条线',BK_PIE[0],'公司条线考核营收','公司条线-EVA','公司条线-RAROC'],
               ['零售条线',BK_PIE[1],'零售条线考核营收','零售条线-EVA','零售条线-RAROC'],
               ['金市条线',BK_PIE[2],'金融市场条线考核营收','金融市场-EVA','金融市场-RAROC'],
               ['司库',BK_PIE[3],'司库营收',null,null],
               ['其他',BK_PIE[5],'其他收入',null,null]];
  var lineV=lineMap.map(function(e){ return +m(bkAct('04',e[2])||0).toFixed(1); });
  /* 去年同期累计（同比回推，与 04 台账同比列自洽）——2026-10-30 按需求改作外环悬停第二行 */
  var linePrev=lineMap.map(function(e,i){
    var y=asNum(bkTxt('04',e[2],'yoy'));
    if(y==null||y<=-100) return lineV[i]; /* 无同比列时退化为与内环同值（演示不空洞） */
    return +(lineV[i]/(1+y/100)).toFixed(1); });
  /* 去年全年=去年同期累计 ÷ 已过月形状占比（BK_SHAPE 与 RAROC 柱图同一模型，还原为 12 个月合计）——外环显示值 */
  var lineLastM=+String(selDate).slice(5,7)||9;
  var linePrevFull=linePrev.map(function(v){ return +(v/BK_SHAPE[lineLastM-1]).toFixed(1); });
  var lineY=+String(selDate).slice(0,4)||2026;
  bkDestroyCanvases(/^c-bk-line-pie$/);
  /* 2026-10-30 按需求②：内环带宽与单环卡一致（其他卡 cutout 66% → 带宽=0.34R）；
     内外环 weight 5:3 分带，解 (1-cutout)×5/8=0.34 → cutout=45.6%；外环带宽≈0.20R 更窄 */
  bkDonutDual('c-bk-line-pie',lineMap.map(function(e){return e[0]}),lineV,linePrevFull,lineMap.map(function(e){return e[1]}),
    {curYear:lineY,prevYear:lineY-1,cutout:'57%',curWeight:5,prevWeight:3,sameVals:linePrev});
  var lineSum=lineV.reduce(function(a,b){ return a+b; },0);
  bkDonutCenter('bk-line-center',lineSum,'全行营收 · 亿元','sm');
  var lnEl=document.getElementById('bk-line-rows');
  if(lnEl){
    /* 2026-10-30 按需求：右侧改「收入构成」同款 cols3 三列——值(亿元) / 累计同比标签+值 / 占比标签+值 */
    lnEl.innerHTML=lineMap.map(function(e,i){
      var y=bkTxt('04',e[2],'yoy');
      return '<div class="strow"><span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:'+e[1]+';margin-right:6px"></i>'+e[0]+'</span>'+
        '<b class="cols3"><i class="c-v">'+bkNum(lineV[i],'亿元')+' 亿元</i>'+
        '<i class="c-y"><span class="lb">累计同比</span>'+(y&&y!=='-'?bkDelta(y,''):'<i class="yoy flat">—</i>')+'</i>'+
        '<i class="c-p"><span class="lb">占比</span><span class="pv">'+(lineSum?(lineV[i]/lineSum*100).toFixed(2)+'%':'—')+'</span></i></b></div>'; }).join('');
  }
  /* 条线成本与回报（05）→ 公司/零售/金融市场 三条线 RAROC 页签切换 + 近12月趋势 */
  bkRarocRender();
  /* ④ 客群三卡（2026-10-28 按需求调整：行名精简/层级缩进/收益率下沉/新增个人付息率/渠道客群改「息率」四率；
     全部行同比后追加「较年初」（bkStr opts.ytd）；取数仍按台账原名；
     2026-10-30 按需求：公司客群收益率去「（不含贴现）」尾注+其下新增存款对客付息率-公司+中小有效授信客户数换基石客户数（去缩进）；
     零售客群个人付息率上增贷款对客收益率-个人；息率卡改【量价成对】四行：债券投资(01)→债券投资收益率(07)→应付债券(01)→应付债券付息率(07) */
  /* ④ 公司/零售条线+息率三卡（2026-10-30 按需求：公司/零售客群更名「公司条线/零售条线」；
     公司卡：贷款对客收益率-对公 显示名改「贷款对客收益率-公司」（取数仍按台账原名）、
     收益率/付息率两行「较年初」改「较上年」（跨年比口径）、底部新增「公司贷款信用损失准备」（09 台账）；
     零售卡底部新增「零售贷款信用损失准备」（09 台账）；
     息率卡：卡头去「07-利率结构」尾注，底部新增「1Y国债收益率」参照行（非台账科目=演示值内联：值/同比/较年初，2026-11-03 删除较月初） */
  var corpEl=document.getElementById('bk-corp');
  if(corpEl) corpEl.innerHTML=
    bkStr('08','公司有效授信客户数',{ytd:1,tipDate:1})+
    bkStr('08','其中：大中有效授信客户数',{label:'其中，大中有效授信客户数',nameCls:'qz-name',ytd:1,tipDate:1})+  /* 2026-11-03 按需求：全角空格缩进改「其中，」前缀；.qz-name 小字号保证 140/136px 名称列内单行不截断 */
    bkStr('08','基石客户',{label:'基石客户数',ytd:1,tipDate:1})+
    bkStr('07','贷款对客收益率-对公',{label:'贷款对客收益率-公司',ytd:1,ytlbl:'较上年',tipDate:1})+
    bkStr('07','存款对客付息率-公司',{ytd:1,ytlbl:'较上年',tipDate:1})+  /* 量价成对；跨年比口径「较上年」 */
    bkStr('09','公司贷款信用损失准备',{ytd:1,tipDate:1}); /* 新增：公司条线拨备（亿元） */
  var retEl=document.getElementById('bk-retail');
  if(retEl) retEl.innerHTML=
    bkStr('08','零售客户数',{ytd:1,tipDate:1})+
    bkStr('08','零售中高端客户数',{ytd:1,tipDate:1})+
    bkStr('06','代发客户AUM月日均',{ytd:1,tipDate:1})+
    bkStr('07','贷款对客收益率-个人',{ytd:1,tipDate:1})+  /* 个人贷款收益率（置于个人付息率上） */
    bkStr('07','存款对客付息率-个人',{ytd:1,tipDate:1})+
    bkStr('09','零售贷款信用损失准备',{ytd:1,tipDate:1}); /* 新增：零售条线拨备（亿元） */
  var chanEl=document.getElementById('bk-chan');
  if(chanEl) chanEl.innerHTML=
    /* 量价成对四行：资产端【债券投资 01 余额 → 债券投资收益率 07】· 负债端【应付债券 01 余额 → 应付债券付息率 07】 */
    bkStr('01','债券投资',{ytd:1,tipDate:1})+
    bkStr('07','债券投资收益率',{ytd:1,tipDate:1})+
    bkStr('01','应付债券',{ytd:1,tipDate:1})+
    bkStr('07','应付债券付息率',{ytd:1,tipDate:1})+
    /* 新增参照行：1Y/10Y国债收益率（市场基准利率，非 07 台账科目——演示值内联，小注=同比/较年初；
       10Y>1Y 为正常期限结构利差；2026-11-03 按需求删除「较月初」，列结构与上方台账行一致） */
    bkGovBondRow('1Y国债收益率','1.75','-0.15ppt','-0.10ppt')+
    bkGovBondRow('10Y国债收益率','2.15','-0.22ppt','-0.18ppt');
}
/* 国债收益率参照行（2026-10-30 按需求，息率卡）：市场基准利率非台账科目，演示值内联；
   小注=同比/较年初（ppt 变动），红涨绿跌与台账行同语言；
   2026-11-03 按需求：删除「较月初」列——与台账行同为 值/同比/较年初 三列结构，
   撤销 .gov 专属类与紧凑小注样式，列宽/字号/右移微调/对齐全量复用台账行规则 */
function bkGovBondRow(name,act,yoy,ytd){
  return '<div class="strow" data-tip="最新日期：<b>'+bkPeriodEnd()+'</b>"><span>'+name+'</span>'+
    '<b class="cols3"><i class="c-v">'+act+' %</i>'+
    '<i class="c-y"><span class="lb">同比</span>'+bkDelta(yoy,'')+'</i>'+
    '<i class="c-q"><span class="lb">较年初</span>'+bkDelta(ytd,'')+'</i></b></div>';
}

/* ---- 信托 / 保险 / 租赁（2026-10-13 重构）----
   数据源 = 数据应用 · 固定报表管理 对应公司全部固定报表，指标实时取数（TRUST_SHEETS trust01/03/04/05，
   INSURANCE_SHEETS ins01/02/03，LEASE_SHEETS lease01-05；均无口径子页签，指标平铺）。
   取数辅助复用资产 tab 的 asNum/asDeltaTxt/asKpis（同 IIFE 内函数声明提升）。 */
var TIL_COL = {
  trust01:{nm:1,un:2,mval:3,act:5,yoy:6,mom:4,ytd:7}, trust03:{nm:1,un:2,mval:3,act:5,yoy:6,mom:4},
  trust04:{nm:1,un:2,act:5,yoy:6,mom:4,ytd:7}, trust05:{nm:1,un:2,act:5,yoy:6,mom:4,ytd:7},
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
function tYtd(sheet,name){ var c=TIL_COL[sheet]; if(c.ytd==null) return '-'; var r=tRow(sheet,name); return r? String(r[c.ytd]||'-') : '-'; }
function tMoM(sheet,name){ var c=TIL_COL[sheet]; if(c.mom==null) return '-'; var r=tRow(sheet,name); return r? String(r[c.mom]||'-') : '-'; }
function tBud(sheet,name){ var c=TIL_COL[sheet]; if(c.bud==null) return null; var r=tRow(sheet,name); return r? asNum(r[c.bud]) : null; }
function tRate(sheet,name){ var c=TIL_COL[sheet]; if(c.rate==null) return null; var r=tRow(sheet,name); return r? asNum(r[c.rate]) : null; }
function tStar(sheet,name){ var c=TIL_COL[sheet]; if(c.star==null) return 0; var r=tRow(sheet,name); return (r&&String(r[c.star]).indexOf('★')>=0)?1:0; }
/* 信托含/除国信：同指标双口径并列（不切页签、一次看全） */
function tKPI(sheet,nm,opts){ var o=opts||{};
  return { l:o.label||nm, u:o.u||'亿元', v:o.pct?tAct(sheet,nm):(o.wan?Math.round(m(tAct(sheet,nm)||0)):+m(tAct(sheet,nm)||0).toFixed(o.dec!=null?o.dec:2)),
    raw:o.raw||o.wan||0, pct:o.pct||0, star:tStar(sheet,nm), yoy:tYoY(sheet,nm), mom:tMoM(sheet,nm),
    budRate:tRate(sheet,nm), nc:o.nc!=null?o.nc:0 }; }
/* ===== 2026-10-21 四公司页展示规则优化：通用辅助（视觉规格复用银行页 bkMonthCfg / stx / donutwrap）=====
   规则① 趋势=本月数：流量类核心指标趋势图画「当月实际」而非本年累计——累计曲线恒向上掩盖动能拐点；
   规则② 构成→环形饼：分项相加=母项（收入构成/保费四大板块/行业赛道/融资结构…）饼片≤6、中心标母项总量；
   规则④ 对比→条形 · 卡片：量级悬殊或口径交叠、相加≠总量者不做饼（避免伪构成）。 */
function tUn(sheet,nm){ var c=TIL_COL[sheet],r=tRow(sheet,nm); return (r&&c.un!=null)?String(r[c.un]||''):'亿元'; }
function tMval(sheet,nm){ var c=TIL_COL[sheet]; if(c.mval==null) return null; var r=tRow(sheet,nm); return r?asNum(r[c.mval]):null; }
/* 本月数趋势序列：act=报表累计（×日期系数）、mval=报表当月值（末月校准锚点）、yoy=累计同比（去年水平回推）；
   月度均值=累计÷已过月数，叠加 ±2.5% 确定性摆动（按指标名散列播种，避免全平柱；接入真实月度序列后整段替换） */
function tilMonthSeries(sheet,name){
  var act=m(tAct(sheet,name)||0), yoy=asNum(tYoY(sheet,name)), mval=tMval(sheet,name);
  var last=+String(selDate).slice(5,7)||9;
  var curMon=act/last, prevMon=(yoy==null?curMon/1.08:curMon/(1+yoy/100));
  var seed=0; for(var q=0;q<name.length;q++) seed+=name.charCodeAt(q);
  var labels=[], mon=[], prev=[];
  for(var i=11;i>=0;i--){ var mm=((last-1-i)%12+12)%12+1; labels.push(mm+'月');
    var inCur=mm<=last, w=1+0.025*Math.sin(i*1.9+seed*0.7);
    mon.push(+((inCur?curMon:prevMon)*w).toFixed(2));
    prev.push(+((inCur?prevMon:prevMon/1.08)*(2-w)).toFixed(2));
  }
  /* 末月（所选月）校准为报表当月值：整体缩放，趋势尾部与 KPI 卡「本月数」严格一致 */
  if(mval!=null && mon[mon.length-1]>0){ var kk=m(mval)/mon[mon.length-1];
    mon=mon.map(function(x){ return +(x*kk).toFixed(2); }); }
  return {mon:mon,prev:prev,labels:labels};
}
/* 本月数趋势图（2026-10-28 按需求统一为华润银行页样式：柱=本月数 + 右轴月度同比金线双轴，悬停三行）
   柱色统一 #4d94ff（银行三 hero 同色），悬停单位可覆盖（保险=万元）；重绘前销毁旧实例防 canvas 复用报错 */
function tilMonthChart(cid,sheet,name,barCol,unit){
  bkDestroyCanvases(new RegExp('^'+cid+'$'));
  var ms=tilMonthSeries(sheet,name);
  var seed=0; for(var q=0;q<name.length;q++) seed+=name.charCodeAt(q);
  mk(cid,bkMonthYoyCfg(ms,barCol||'#4d94ff',seed,asNum(tYoY(sheet,name)),unit));
}
/* hero 卡（2026-10-28 按需求统一为华润银行页三段式版式）：
   左=预算完成环（考核项才有，银行同款八轮样式；非考核不渲染环与预算行）
   中=本年累计（蓝大字）+ 累计同比（hv-inl 行内排）+ 预算数行（有预算才有）
   右=本月数 + 月度同比（mo-yoy 结构，与趋势金线同种子同源） */
function tilHero(elId,sheet,name,opts){ opts=opts||{};
  var el=document.getElementById(elId); if(!el) return;
  var c=TIL_COL[sheet];
  var raw=tAct(sheet,name), u=opts.u||tUn(sheet,name), pct=opts.pct||/%/.test(u);
  var v=pct?raw:m(raw), mv=tMval(sheet,name);
  var budv=c.bud!=null?tBud(sheet,name):null, rt=c.rate!=null?tRate(sheet,name):null;
  var yv=asNum(tYoY(sheet,name));
  var seed=0; for(var q=0;q<name.length;q++) seed+=name.charCodeAt(q);
  var mYoy=bkMonthYoyArr(12,seed,yv,11)[11];
  var RING_BLUE='#3f82f6', ring='';
  if(rt!=null&&budv!=null){
    var p=pct?rt:(m(raw))/budv*100, pw=Math.min(p,100), R=33, C=2*Math.PI*R;
    ring='<svg class="hv-ring" width="86" height="86" viewBox="0 0 88 88" aria-label="预算达成 '+p.toFixed(2)+'%">'+
      '<circle cx="44" cy="44" r="'+R+'" fill="none" stroke="#e9edf3" stroke-width="9"/>'+
      '<circle cx="44" cy="44" r="'+R+'" fill="none" stroke="'+RING_BLUE+'" stroke-width="9" stroke-linecap="round" '+
        'stroke-dasharray="'+(C*pw/100).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 44 44)"/>'+
      '<text x="44" y="45" text-anchor="middle" fill="#1f2937" font-size="14.5" font-weight="800">'+p.toFixed(2)+'%</text>'+
      '<text x="44" y="60" text-anchor="middle" fill="#8a97a8" font-size="10">进度</text></svg>';
  }
  var yoyHtml=yv==null?'<span class="val" style="color:var(--dim)">—</span>':
    '<span class="val '+(yv>=0?'up':'down')+'">'+(yv>=0?'+':'')+Math.abs(yv).toFixed(2)+'%'+(yv>=0?' ↑':' ↓')+'</span>';
  el.innerHTML='<div class="hv-l">'+ring+
    '<div class="hv-main">'+
      '<div class="hv-row"><span class="lbl">本年累计</span><span class="val hv-blue">'+tilNum(v,u)+'<small>'+u+'</small></span></div>'+
      '<div class="hv-row hv-inl"><span class="lbl">累计同比</span>'+yoyHtml+'</div>'+
      (rt!=null&&budv!=null?'<div class="hv-row hv-inl"><span class="lbl">预算数</span><span class="val">'+tilNum(budv,u)+'<small>'+u+'</small></span></div>':'')+
    '</div></div>'+
    '<div class="hv-mo"><span class="mol">本月数</span><span class="mov">'+tilNum(mv==null?null:m(mv),u)+'<small>'+u+'</small></span>'+
    '<span class="mo-yoy"><span class="mol">月度同比</span><span class="val '+(mYoy>=0?'up':'down')+'" style="font-size:11px;font-weight:600">'+(mYoy>=0?'+':'')+Math.abs(mYoy).toFixed(2)+'%'+(mYoy>=0?' ↑':' ↓')+'</span></span></div>';
}
/* 数值格式化（%类两位去尾零；≥1000 千分位取整；其余 1 位小数） */
function tilNum(v,u){ if(v==null||isNaN(v)) return '—';
  /* 2026-10-30 按需求：全页数值统一保留 2 位小数（与 bkNum 同规则） */
  if(u&&/%|ppt/.test(u)) return (+v).toFixed(2);
  return (+v).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function tilDelta(txt,suffix){ if(!txt||txt==='-'||txt==='—') return '<i class="yoy flat">—</i>';
  var down=String(txt).charAt(0)==='-';
  return '<i class="yoy '+(down?'down':'up')+'">'+(down?'▼':'▲')+' '+bkDec2(String(txt).replace(/^[+-]/,''))+(suffix||'')+'</i>'; }
/* stx 指标格（复用银行页 .stx 样式）：名称(★) / 值 / 同比小注 /（opts.bud 且有预算列）预算达成条 */
function tilStx(sheet,name,opts){ opts=opts||{}; var c=TIL_COL[sheet];
  var u=opts.u||tUn(sheet,name), pct=opts.pct||/%/.test(u);
  var raw=tAct(sheet,name), v=pct?raw:m(raw);
  var us=opts.us!==undefined?opts.us:(u==='亿元'?'亿':(u==='万元'?'万':u));
  var rt=c.rate!=null?tRate(sheet,name):null;
  return '<div class="stx'+(opts.cls?' '+opts.cls:'')+'"><span class="t" title="'+name+'">'+name+
    (tStar(sheet,name)?'<i class="kstar">★</i>':'')+'</span>'+
    '<span class="v">'+tilNum(v,u)+'<small>'+us+'</small></span>'+
    '<div class="drow">'+tilDelta(tYoY(sheet,name),' 同比')+'</div>'+
    (opts.bud&&rt!=null?tilBudBar(sheet,name,u):'')+'</div>'; }
function tilBudBar(sheet,name,u){ var b=tBud(sheet,name), rt=tRate(sheet,name);
  return '<div class="as-rate"><div class="progress-bar"><div class="progress-fill '+(rt>=95?'':(rt>=85?'mid':'low'))+'" style="width:'+Math.min(100,rt)+'%"></div></div>'+
    '<span class="rt">预算 '+tilNum(b,u)+' · 达成 '+rt.toFixed(1)+'%</span></div>'; }
/* 通用环形构成饼（规则②）：样式对齐银行页 bkDonut（圆角分段/片间留白/浅轨道底环），unit 参数化支持万元；
   vals 需已含轧差「其他」片 → 饼合计=中心母项总量；opts.yoys 明细行同比、opts.centerEl/rowsEl 挂载点 */
function tilDonut(cid,labels,vals,cols,unit,opts){ opts=opts||{};
  bkDestroyCanvases(new RegExp('^'+cid+'$'));
  var tot=vals.reduce(function(a,b){return a+b;},0)||1;
  var trackPlugin={id:'tilTrack',beforeDatasetsDraw:function(ch){
    var meta=ch.getDatasetMeta(0); if(!meta||!meta.data||!meta.data.length) return;
    var a0=meta.data[0]; if(!a0) return;
    var ctx=ch.ctx, cx=a0.x, cy=a0.y;
    var rMid=(a0.innerRadius+a0.outerRadius)/2, w=a0.outerRadius-a0.innerRadius;
    ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,rMid,0,Math.PI*2);
    ctx.strokeStyle='rgba(122,150,190,.13)'; ctx.lineWidth=w; ctx.stroke(); ctx.restore(); }};
  mk(cid,{type:'doughnut',plugins:[trackPlugin],
    data:{labels:labels,datasets:[
      {label:'构成',data:vals,backgroundColor:cols,borderColor:'#ffffff',borderWidth:1.5,
       borderRadius:function(c2){ var v2=c2.dataset.data[c2.dataIndex]||0; return (v2/tot<0.02)?0:7; },
       borderSpacing:3,hoverOffset:7}]},
    options:Object.assign(base({tooltip:{callbacks:{label:function(it){
      return ' '+it.label+'：'+tilNum(vals[it.dataIndex],unit)+' '+unit+'（'+(vals[it.dataIndex]/tot*100).toFixed(2)+'%）'; }},
      title:{display:false}}}),{cutout:'66%',layout:{padding:6}})});
  if(opts.centerEl){ var ce=document.getElementById(opts.centerEl);
    if(ce) ce.innerHTML='<b>'+tilNum(tot,unit)+'</b><small>'+opts.centerLab+'</small>'; }
  if(opts.rowsEl){ var re=document.getElementById(opts.rowsEl);
    if(re) re.innerHTML=labels.map(function(n,i2){
      return '<div class="strow"><span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:'+cols[i2]+';margin-right:6px"></i>'+n+
        '</span><b>'+tilNum(vals[i2],unit)+' '+unit+(opts.yoys?' '+tilDelta(opts.yoys[i2],''):'')+
        ' <span class="lite" style="font-size:10px">'+(vals[i2]/tot*100).toFixed(2)+'%</span></b></div>'; }).join(''); }
}

function drawTrust(){
  /* ① 核心经营：利润链三终点 hero 同行（规则①：KPI大字=本年累计 · 趋势图=本月数——柱=当月实际 虚线=去年同月） */
  tilHero('ts-hero-rev','trust01','总收入（含国信）'); tilMonthChart('c-ts-t-rev','trust01','总收入（含国信）','#4d94ff');
  tilHero('ts-hero-prof','trust01','利润总额（含国信）'); tilMonthChart('c-ts-t-prof','trust01','利润总额（含国信）','#4d94ff');
  tilHero('ts-hero-net','trust01','净利润（含国信）'); tilMonthChart('c-ts-t-net','trust01','净利润（含国信）','#4d94ff');
  /* 效益与规模六卡（规则④：比率/存量和金额不同尺度→卡片行；ROE 含/除同排即口径对照） */
  var eff=document.getElementById('ts-eff-cards');
  if(eff) eff.innerHTML=
    ['ROE（含国信）','ROE（除国信）'].map(function(n){ return tilStx('trust01',n,{pct:1}); }).join('')+
    tilStx('trust01','信托管理规模',{us:'亿'})+tilStx('trust01','元大基金管理规模',{us:'亿'})+
    tilStx('trust01','总资产',{us:'亿'})+tilStx('trust01','净资产',{us:'亿'});
  /* ② 业绩合同指标（2026-10-26 新增，置于收入构成前——叙事顺序：结果→承诺→拆解）
     六项=华润信托年度业绩合同；占比/收益率由报表实时计算（trust03/04/05 同口径联动），
     规模子集类显示合同口径目标+关联报表基数行注；卡内达成条=合同目标完成度 */
  var conEl=document.getElementById('ts-contract');
  if(conEl){
    /* 卡构造：t 指标名 / v 展示值 / u 单位 / pct 比率 / tgt 合同目标 / yoy 同比串
       2026-10-27：删除卡底口径注行（原误用 .t 类继承蓝色渐变，呈现蓝条），口径统一以 title 悬停显示 */
    function cc(o){
      var disp = o.pct ? o.v.toFixed(1)+'<small>%</small>' : tilNum(o.v,o.u)+'<small>'+o.u+'</small>';
      var rt = o.tgt!=null ? (o.v/o.tgt*100) : null;
      return '<div class="stx c6"><span class="t" title="'+o.t+(o.sub?'（'+o.sub+'）':'')+'">'+o.t+'</span>'+
        '<span class="v">'+disp+'</span>'+
        '<div class="drow">'+(o.yoy?tilDelta(o.yoy,' 同比'):'')+'</div>'+
        (rt!=null?'<div class="as-rate"><div class="progress-bar"><div class="progress-fill '+(rt>=95?'':(rt>=85?'mid':'low'))+'" style="width:'+Math.min(100,rt)+'%"></div></div><span class="rt">目标 '+tilNum(o.tgt,o.pct?'%':o.u)+(+o.pct?'%':'')+' · 达成 '+rt.toFixed(1)+'%</span></div>':'')+
        '</div>';
    }
    /* 1) 证券受托业务提升高费率业务收入占比 = 证券受托收入 ÷ 除国信总收入（trust03，比率不受日期系数影响） */
    var secRatio=(tAct('trust03','证券受托业务收入')/tAct('trust03','总收入（除国信）'))*100;
    /* 2) 财富家办业务规模 ≈ 财富管理业务规模（trust04，亿） */
    var wmScale=m(tAct('trust04','财富管理业务规模')||0);
    /* 3) 自有资金投资收益率 = 固有业务收入 ÷ 固有业务规模（trust01/trust04 派生） */
    var ownR=(tAct('trust01','固有业务收入')/tAct('trust04','固有业务规模'))*100;
    /* 4) 华润元大基金利润总额（合同口径，关联元大收入 6,800 万 trust01；利润为合同演示值） */
    var ydProf=3200;
    /* 5) 元大货币基金集团内投资规模（货基规模 280 亿 trust05 之集团内子集，合同口径） */
    var mmGrp=36;
    /* 6) 当年新落地社会治理类业务规模（公益慈善信托≈社会治理类，trust04 新落地合同口径） */
    var sgNew=18;
    conEl.innerHTML=[
      cc({t:'证券受托业务高费率收入占比',pct:1,v:secRatio,tgt:30,
          sub:'证券受托收入÷除国信总收入 · 实时计算'}),
      cc({t:'财富家办业务规模',u:'亿',v:wmScale,tgt:1050,yoy:tYoY('trust04','财富管理业务规模'),
          sub:'≈财富管理条线口径（03-规模结构）'}),
      cc({t:'自有资金投资收益率',pct:1,v:ownR,tgt:1.2,
          sub:'固有业务收入÷固有业务规模（01/03）'}),
      cc({t:'华润元大基金利润总额',u:'万元',v:ydProf,tgt:3800,
          sub:'关联：元大基金收入 6,800 万（01-财务指标）'}),
      cc({t:'元大货币基金集团内投资规模',u:'亿',v:mmGrp,tgt:42,yoy:tYoY('trust05','其中：货币型基金规模'),
          sub:'货基规模 280 亿之集团内口径（04-业务结构）'}),
      cc({t:'当年新落地社会治理类业务规模',u:'亿',v:sgNew,tgt:25,yoy:tYoY('trust04','公益慈善信托规模'),
          sub:'公益慈善信托≈社会治理类（03-规模结构）'})
    ].join('');
  }
  /* ② 收入构成饼（2026-10-27 按需求改除国信口径六条线：证券受托/财富家办/公私募资管/固有/对公/行政服务；
     源 02-收入结构 trust03；财富家办映射「财富管理业务收入」行。条线口径交叠（合计≠除国信总收入），
     饼占比=各条线占六线合计之比；中心=六条线合计并在明细行注记口径。含国信口径拆解由右卡双口径条承担） */
  var revParts=[['证券受托','#4d94ff','证券受托业务收入'],['财富家办','#6cc0f0','财富管理业务收入'],
                ['公私募资管','#35c06b','公私募资管业务收入'],['固有业务','#eda14e','固有业务收入'],
                ['对公业务','#a0b4f0','对公业务收入'],['行政服务','#8fd8c8','行政服务业务收入']];
  var revV=revParts.map(function(e){ return +m(tAct('trust03',e[2])||0).toFixed(2); });
  var revSum=revV.reduce(function(a,b){return a+b;},0);
  tilDonut('c-ts-rev-pie',revParts.map(function(e){return e[0]}),revV,revParts.map(function(e){return e[1]}),'亿元',
    {centerEl:'ts-rev-center',centerLab:'六条线合计 · 亿',yoys:revParts.map(function(e){return tYoY('trust03',e[2])}),rowsEl:'ts-rev-rows'});
  var revC=document.getElementById('ts-rev-center');
  if(revC) revC.innerHTML='<b>'+tilNum(revSum,'亿元')+'</b><small>六条线合计 · 亿</small>';
  /* 盈利口径对照：含国信 / 剔除国信（规则④：同指标两口径→分组条形，柱差=国信贡献） */
  var pairs=[['总收入','总收入（含国信）','总收入（除国信）'],['利润总额','利润总额（含国信）','利润总额（除国信）'],['净利润','净利润（含国信）','净利润（除国信）']];
  tilDestroyCanvases('c-ts-gx');
  mk('c-ts-gx',{type:'bar',data:{labels:pairs.map(function(p){return p[0]}),datasets:[
      {label:'含国信',data:pairs.map(function(p){ return +m(tAct('trust01',p[1])||0).toFixed(2); }),backgroundColor:'#2f7fd6',borderRadius:4},
      {label:'剔除国信',data:pairs.map(function(p){ return +m(tAct('trust01',p[2])||0).toFixed(2); }),backgroundColor:'#5b9bd9',borderRadius:4}]},
    options:Object.assign(base({legend:LGL}),{scales:{y:YAX,x:NOG}})});
  var el2=document.getElementById('ts-gx-rows');
  if(el2) el2.innerHTML=
    '<div class="strow"><span>ROE（含国信）</span><b>'+tAct('trust01','ROE（含国信）')+'% · 同比 '+tYoY('trust01','ROE（含国信）')+'</b></div>'+
    '<div class="strow"><span>ROE（除国信）</span><b>'+tAct('trust01','ROE（除国信）')+'% · 同比 '+tYoY('trust01','ROE（除国信）')+'</b></div>'+
    '<div class="strow"><span><span class="lite">口径说明</span></span><b><span class="lite" style="font-size:10.5px">柱差=国信投资收益（'+tilNum(m(tAct('trust01','国信投资收益')||0),'亿元')+' 亿）</span></b></div>';
  /* ③ 新三分类构成饼（2026-10-27 按需求删除「其他信托计划」轧差片：饼=资管/服务/公益三类本体，
     中心=三类合计 6,675、占比按三类合计计→合计恒=100%；与管理规模 6,850 的差额在卡头注记） */
  tilDestroyCanvases('c-ts-new3-pie');
  (function(){
    var parts=[['资产管理信托','资产管理信托规模','#4d94ff'],['资产服务信托','资产服务信托规模','#6cc0f0'],['公益慈善信托','公益慈善信托规模','#35c06b']];
    var v=parts.map(function(e){ return +m(tAct('trust04',e[1])||0).toFixed(0); });
    tilDonut('c-ts-new3-pie',parts.map(function(e){return e[0]}),v,parts.map(function(e){return e[2]}),'亿元',
      {centerEl:'ts-new3-center',centerLab:'三分类合计 · 亿',rowsEl:'ts-new3-rows',
       yoys:parts.map(function(e){return tYoY('trust04',e[1])})});
  })();
  /* 分条线规模（trust04；2026-10-27 按需求改纵向柱状图，指标五项全称=证券受托/财富家办/公私募资管/固有/对公；
     财富家办映射「财富管理业务规模」行（与合同卡2同口径），元大基金柱删除（公私募资管已含）；
     规则④：条线与三分类口径交叠（相加≠总量），柱状仅作量级对比、勿改饼 */
  var ln=[['证券受托','业务规模','证券受托业务规模'],['财富家办','业务规模','财富管理业务规模'],
          ['公私募资管','业务规模','公私募资管业务规模'],['固有','业务规模','固有业务规模'],
          ['对公','业务规模','对公业务规模']];
  tilDestroyCanvases('c-ts-scale');
  mk('c-ts-scale',{type:'bar',data:{labels:ln.map(function(e){return [e[0],e[1]]}),
    datasets:[{label:'亿元',data:ln.map(function(e){ return Math.round(m(tAct('trust04',e[2])||0)); }),backgroundColor:['#17427d','#2f7fd6','#5b9bd9','#7fb0e0','#9ec3ea'],borderRadius:4,maxBarThickness:34}]},
    options:Object.assign(base(),{scales:{y:{grid:GRID,grace:'18%',ticks:{font:{size:10},color:T3}},x:{grid:{display:false},ticks:{font:{size:9.5},color:T2,maxRotation:0,crossAlign:'far'}}}})});
  var elSc=document.getElementById('ts-scale-rows');
  if(elSc) elSc.innerHTML='<div style="font-size:10px;color:var(--dim);line-height:1.5;margin-top:6px">口径说明：条线与三分类交叠（相加≠管理规模）→ 柱状仅作量级对比；财富家办=财富管理条线口径；元大基金已含于公私募资管。</div>';
  /* ④ 固有资金运用构成饼（规则②：六项相加=资金运用规模 425=425 严格勾稽；出险项目=红色风险语义色；
     2026-10-27 按需求：六片用报表全称显示（不缩写），中心=「资金运用规模」全称） */
  tilDestroyCanvases('c-ts-fund-pie');
  (function(){
    var fu=[['现金及流动性管理规模','#4d94ff'],['证券权益类规模','#6cc0f0'],['证券固定收益类规模','#35c06b'],
            ['非证券类 - 剔除出险项目','#a0b4f0'],['长期股权投资','#8fd8c8'],['出险项目','#d64550']];
    var vals=fu.map(function(e){ return +m(tAct('trust05',e[0].replace(/ - /g,'-'))||0).toFixed(1); });
    tilDonut('c-ts-fund-pie',fu.map(function(e){return e[0]}),vals,fu.map(function(e){return e[1]}),'亿元',
      {centerEl:'ts-fund-center',centerLab:'资金运用规模'});
    var tot=vals.reduce(function(a,b){return a+b;},0);
    /* 右侧明细（2026-10-27 按需求）：指标名称 / 值 / 同比 / 较年初 / 占比 五列对齐；
       出险项目行整行红色语义（风险敞口），占比列合计=100%（六项相加=425 勾稽闭合） */
    var rows=document.getElementById('ts-fund-rows');
    if(rows){
      rows.innerHTML='<div class="fund-grid"><div class="fund-row fund-hd"><span class="n">指标名称</span>'+
        '<span class="v" style="text-align:right">值（亿元）</span><span class="y" style="text-align:right">同比</span>'+
        '<span class="y" style="text-align:right">较年初</span><span class="pc">占比</span></div>'+
        fu.map(function(e,i){
          var src=e[0].replace(/ - /g,'-'), isOut=e[0]==='出险项目';
          var yv=tYoY('trust05',src), jv=tYtd('trust05',src);
          return '<div class="fund-row"><span class="n" title="'+e[0]+'"><i style="background:'+e[1]+'"></i>'+e[0]+'</span>'+
            '<span class="v"'+(isOut?' style="color:#d64550"':'')+'>'+tilNum(vals[i],'亿元')+'</span>'+
            '<span class="y">'+tilDelta(yv,'')+'</span>'+
            '<span class="y">'+tilDelta(jv,'')+'</span>'+
            '<span class="pc"'+(isOut?' style="color:#d64550;font-weight:700"':'')+'>'+(vals[i]/tot*100).toFixed(2)+'%</span></div>';
        }).join('')+'</div>';
    }
  })();
}
/* 按精确 canvas id 销毁当前视图旧实例（tilDonut/tilMonthChart 与口径切换共用） */
function tilDestroyCanvases(cid){ (charts[curView]||[]).forEach(function(c,i){
  if(c && c.canvas && c.canvas.id===cid){ c.destroy(); charts[curView][i]=null; } }); }

/* ---- 保险 ---- */
function drawIns(){
  /* ① 核心经营（ins01 全★考核）：营业收入/利润总额/净利润=利润链三终点 → hero+本月数趋势（规则①，与银行页同构）；
     ROE/EVA 为比率/价值量，不入趋势图，仍保留于 ins01 报表页与考核区（规则④） */
  tilHero('in-hero-rev','ins01','营业收入'); tilMonthChart('c-in-t-rev','ins01','营业收入','#4d94ff','万元');
  tilHero('in-hero-prof','ins01','利润总额'); tilMonthChart('c-in-t-prof','ins01','利润总额','#4d94ff','万元');
  tilHero('in-hero-net','ins01','净利润'); tilMonthChart('c-in-t-net','ins01','净利润','#4d94ff','万元');
  /* ② 双主线复合卡：KPI 大字 + 本月数趋势（规则①）+ 构成饼（规则②）
     保费：机构+产融+香港+市场化 四板块相加=986,500=保费规模合计（勾稽已验证）
     佣金：同口径四板块相加=152,300=佣金合计 → 两张饼可横向对照"板块佣金率=佣金/保费" */
  var premSrc=[['机构业务保费规模','机构业务'],['产融业务保费规模','产融业务'],['香港业务保费规模','香港业务'],['市场化业务保费规模','市场化业务']];
  var commSrc=[['机构业务佣金收入','机构业务'],['产融业务佣金收入','产融业务'],['香港业务佣金收入','香港业务'],['市场化业务佣金收入','市场化业务']];
  var premTotal=tAct('ins02','保费规模'), commTotal=tAct('ins02','佣金收入');
  /* 保费复合卡：hero + 趋势 + 构成饼 */
  tilHero('in-hero-prem','ins02','保费规模'); tilMonthChart('c-in-t-prem','ins02','保费规模','#4d94ff','万元');
  tilDonut('c-in-prem-pie',premSrc.map(function(e){return e[1]}),
    premSrc.map(function(e){ return Math.round(m(tAct('ins02',e[0])||0)); }),
    ['#4d94ff','#6cc0f0','#35c06b','#eda14e'],'万元',
    {centerEl:'in-prem-center',centerLab:'保费规模 · 万',yoys:premSrc.map(function(e){return tYoY('ins02',e[0])})});
  /* 佣金复合卡 */
  tilHero('in-hero-comm','ins02','佣金收入'); tilMonthChart('c-in-t-comm','ins02','佣金收入','#4d94ff','万元');
  tilDonut('c-in-comm-pie',commSrc.map(function(e){return e[1]}),
    commSrc.map(function(e){ return Math.round(m(tAct('ins02',e[0])||0)); }),
    ['#4d94ff','#6cc0f0','#35c06b','#eda14e'],'万元',
    {centerEl:'in-comm-center',centerLab:'佣金收入 · 万',yoys:commSrc.map(function(e){return tYoY('ins02',e[0])})});
  /* 产融板块纵深明细（二层拆分：燃气→华润/市场；商户；银保；创新场景→社区等；★考核项带预算达成） */
  var D=[['产融业务保费规模','产融板块保费小计',0],['燃气业务保费规模','├ 燃气业务',0],
         ['其中：华润燃气业务保费规模','│　其中：华润燃气（★考核）',1],['其中：市场燃气业务保费规模','│　其中：市场燃气',0],
         ['商户保险保费规模','├ 商户保险',0],['银保保费规模','├ 银保',0],['产融创新场景保费规模','└ 创新场景（社区/职域/其他融融）',0]];
  var el=document.getElementById('ins-detail');
  if(el) el.innerHTML='<div class="stgrid" style="grid-template-columns:1fr 1fr;gap:0 26px"><div>'+
    '<div class="stgrp-cap">保费口径（万元）</div>'+D.map(function(e){ var r=tRow('ins02',e[0]); if(!r) return '';
      var rt=tRate('ins02',e[0]);
      return '<div class="strow"><span>'+e[1]+'</span><b>'+tilNum(m(tAct('ins02',e[0])||0),'万元')+' 万 '+tilDelta(tYoY('ins02',e[0]),'')+(rt!=null?' <span class="lite" style="font-size:10px">达成 '+rt.toFixed(2)+'%</span>':'')+'</b></div>'; }).join('')+
    '</div><div>'+
    '<div class="stgrp-cap">同板块对照（万元）</div>'+
    '<div class="strow"><span>产融板块佣金小计</span><b>'+tilNum(m(tAct('ins02','产融业务佣金收入')||0),'万元')+' 万 '+tilDelta(tYoY('ins02','产融业务佣金收入'),'')+'</b></div>'+
    '<div class="strow"><span>其中：华润燃气佣金</span><b>'+tilNum(m(tAct('ins02','其中：华润燃气业务佣金收入')||0),'万元')+' 万 '+tilDelta(tYoY('ins02','其中：华润燃气业务佣金收入'),'')+'</b></div>'+
    '<div class="strow"><span>燃气板块佣金率（佣/保）</span><b>'+((tAct('ins02','燃气业务佣金收入')/tAct('ins02','燃气业务保费规模'))*100).toFixed(2)+'%</b></div>'+
    '<div class="strow"><span>保费规模合计 · ★双口径</span><b>'+tilNum(m(premTotal||0),'万元')+' 万 '+tilDelta(tYoY('ins02','保费规模'),'')+'</b></div>'+
    '<div class="strow"><span>佣金收入合计</span><b>'+tilNum(m(commTotal||0),'万元')+' 万 '+tilDelta(tYoY('ins02','佣金收入'),'')+'</b></div>'+
    '</div></div>';
  /* ③ 关键管理指标：6 项★考核（ins03）
     2026-10-29 按需求卡片样式对齐华润银行「业绩指标」模块 bkStx 结构（bud=1 变体）：
     蓝渐变名称栏金融卡六列 bkgrid6 → 卡体=口径标签「本月末」→ 蓝色大数值 → 变动小注行（同比/环比 bkDl 格式）
     → 预算行三段式（「预算」标签 + 主蓝进度条内白字达成% + 右预算值） */
  var KM=[['华润燃气存量用户保费占比','%'],['集团其他产融渠道客户保费规模','万元'],['融融业务总中收','万元'],
          ['市场业务净收入','万元'],['华润场景产融保费规模','万元'],['华润燃气存量用户每年新增客户数','万户']];
  var g=document.getElementById('ins-kpi-grid');
  if(g) g.innerHTML=KM.map(function(e){ var nm=e[0], u=e[1], r=tRow('ins03',nm); if(!r) return '';
    var pct=u.indexOf('%')>=0;
    var raw=tAct('ins03',nm), v=raw==null?null:(pct?raw:m(raw));
    var bd=tBud('ins03',nm), rt=tRate('ins03',nm);
    var h='<div class="stx"><span class="t" title="'+nm+'">'+nm+'</span>'+
      '<span class="s-lbl">本月末</span>'+
      '<span class="v">'+bkNum(v,u)+'<small>'+u+'</small></span>'+
      '<div class="dlst">'+bkDl('同比',tYoY('ins03',nm))+bkDl('环比',tMoM('ins03',nm))+'</div>';
    if(rt!=null){
      var inBar=rt>=18, wpct=Math.min(100,rt).toFixed(1)+'%';
      h+='<div class="budrow"><span class="bl">预算</span>'+
        '<span class="bbar"><i style="width:'+wpct+'"></i>'+
          (inBar?'<b class="b-in" style="left:calc('+wpct+' - 5px)">'+rt.toFixed(2)+'%</b>'
                :'<b class="b-out" style="left:calc('+wpct+' + 4px)">'+rt.toFixed(2)+'%</b>')+'</span>'+
        '<span class="bval">'+(bd!=null?bkNum(bd,u)+'<small>'+u+'</small>':'—')+'</span></div>';
    }
    return h+'</div>'; }).join('');
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
    colors:cals.map(function(c,i){ return i===ci? '#f59e0b' : 'rgba(91,155,217,.55)'; }) }; }
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

/* ① 收入与利润（01-收入结构）：默认财务考核口径；★三项为年度考核指标，卡内带全年预算达成条；
   2026-10-21：本月数趋势 hero（规则①）+ 收入构成饼（规则②：单体口径四线相加=营收，跨表勾稽见规范附A；
   财务考核/香港口径无业务线明细则回退「各口径营收对比」条形，杜绝用交叠口径硬拼饼） */
var AS_MOM_COL={asset01:7,asset02:7,asset03:7};
function asMonthSeries(sheet,name){
  var act=m(asAct(sheet,ASSET_CAL[sheet]!=null?ASSET_CAL[sheet]:0,name)||0);
  var yoy=asNum(asYoY(sheet,ASSET_CAL[sheet]!=null?ASSET_CAL[sheet]:0,name));
  var last=+String(selDate).slice(5,7)||9;
  var curMon=act/last, prevMon=(yoy==null?curMon/1.08:curMon/(1+yoy/100));
  var seed=0; for(var q=0;q<name.length;q++) seed+=name.charCodeAt(q);
  var labels=[],mon=[],prev=[];
  for(var i=11;i>=0;i--){ var mm=((last-1-i)%12+12)%12+1; labels.push(mm+'月');
    var inCur=mm<=last, w=1+0.025*Math.sin(i*1.9+seed*0.7);
    mon.push(+((inCur?curMon:prevMon)*w).toFixed(2));
    prev.push(+((inCur?prevMon:prevMon/1.08)*(2-w)).toFixed(2)); }
  return {mon:mon,prev:prev,labels:labels};
}
function asTrendChart(cid,sheet,name,color){
  tilDestroyCanvases(cid);
  var seed=0; for(var q=0;q<name.length;q++) seed+=name.charCodeAt(q);
  mk(cid,bkMonthYoyCfg(asMonthSeries(sheet,name),color||'#4d94ff',seed,
    asNum(asYoY(sheet,ASSET_CAL[sheet]!=null?ASSET_CAL[sheet]:0,name))));
}
/* 资产 hero 卡（2026-10-28 按需求统一为华润银行页三段式版式；本月数=趋势序列末值） */
function asHero(elId,cid,sheet,name){
  var el=document.getElementById(elId); if(!el) return;
  var ci=ASSET_CAL[sheet]!=null?ASSET_CAL[sheet]:0;
  var v=m(asAct(sheet,ci,name)||0), budv=asBud(sheet,ci,name), rt=asRate(sheet,ci,name), yv=asNum(asYoY(sheet,ci,name));
  var ms=asMonthSeries(sheet,name), mv=ms.mon[ms.mon.length-1];
  var seed=0; for(var q=0;q<name.length;q++) seed+=name.charCodeAt(q);
  var mYoy=bkMonthYoyArr(12,seed,yv,11)[11];
  var RING_BLUE='#3f82f6', ring='';
  if(rt!=null&&budv){
    var p=v/budv*100, pw=Math.min(p,100), R=33, C=2*Math.PI*R;
    ring='<svg class="hv-ring" width="86" height="86" viewBox="0 0 88 88" aria-label="预算达成 '+p.toFixed(2)+'%">'+
      '<circle cx="44" cy="44" r="'+R+'" fill="none" stroke="#e9edf3" stroke-width="9"/>'+
      '<circle cx="44" cy="44" r="'+R+'" fill="none" stroke="'+RING_BLUE+'" stroke-width="9" stroke-linecap="round" '+
        'stroke-dasharray="'+(C*pw/100).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 44 44)"/>'+
      '<text x="44" y="45" text-anchor="middle" fill="#1f2937" font-size="14.5" font-weight="800">'+p.toFixed(2)+'%</text>'+
      '<text x="44" y="60" text-anchor="middle" fill="#8a97a8" font-size="10">进度</text></svg>';
  }
  var yoyHtml=yv==null?'<span class="val" style="color:var(--dim)">—</span>':
    '<span class="val '+(yv>=0?'up':'down')+'">'+(yv>=0?'+':'')+Math.abs(yv).toFixed(2)+'%'+(yv>=0?' ↑':' ↓')+'</span>';
  el.innerHTML='<div class="hv-l">'+ring+
    '<div class="hv-main">'+
      '<div class="hv-row"><span class="lbl">本年累计</span><span class="val hv-blue">'+bkNum(v,'亿元')+'<small>亿元</small></span></div>'+
      '<div class="hv-row hv-inl"><span class="lbl">累计同比</span>'+yoyHtml+'</div>'+
      (rt!=null&&budv?'<div class="hv-row hv-inl"><span class="lbl">预算数</span><span class="val">'+bkNum(budv,'亿元')+'<small>亿元</small></span></div>':'')+
    '</div></div>'+
    '<div class="hv-mo"><span class="mol">本月数</span><span class="mov">'+bkNum(mv,'亿元')+'<small>亿元</small></span>'+
    '<span class="mo-yoy"><span class="mol">月度同比</span><span class="val '+(mYoy>=0?'up':'down')+'" style="font-size:11px;font-weight:600">'+(mYoy>=0?'+':'')+Math.abs(mYoy).toFixed(2)+'%'+(mYoy>=0?' ↑':' ↓')+'</span></span></div>';
}
function asRenderPl(){
  var ci = ASSET_CAL.asset01!=null? ASSET_CAL.asset01 : 0;
  var KS=[['营业收入',0],['利润总额',2],['成本收入比-拨备前',1]];
  asKpis('askpi-1',KS.map(function(e){ var nm=e[0];
    return {l:nm,u:nm.indexOf('成本收入比')>=0?'%':'亿元',v:asAct('asset01',ci,nm),
      pct:nm.indexOf('成本收入比')>=0?1:0,star:1,yoy:asYoY('asset01',ci,nm),
      mom:asMoM('asset01',ci,nm),budRate:asRate('asset01',ci,nm),nc:e[1]}; }));
  /* 本月数趋势（规则①）：营业收入 / 利润总额 双卡（柱=当月实际 虚线=去年同月） */
  asHero('as-hero-rev','c-as-t-rev','asset01','营业收入');
  asHero('as-hero-prof','c-as-t-prof','asset01','利润总额');
  asTrendChart('c-as-t-rev','asset01','营业收入');
  asTrendChart('c-as-t-prof','asset01','利润总额');
  /* 收入构成：单体口径展示「其中：…业务收入」→ 构成饼（规则②）；财务考核/香港口径无明细 → 回退全口径对比条形 */
  var lab=document.getElementById('as-pl-lab');
  if(lab) lab.textContent='亿元 · 截止本月末 · '+(ASSET_SHEETS.asset01.calibers[ci].label)+'｜业务线相加=营收';
  var subs=asSubs('asset01',ci).filter(function(r){ return /收入$/.test(String(r[ASSET_COL.asset01.nm])); });
  var cb=asCalBars('asset01',ci,'营业收入');
  var pieWrap=document.getElementById('as-rev-piewrap'), fb=document.getElementById('as-pl-fallback');
  if(pieWrap&&fb){ pieWrap.style.display=subs.length?'':'none'; fb.style.display=subs.length?'none':''; }
  if(subs.length){
    tilDestroyCanvases('c-as-rev-pie');
    var names=subs.map(function(r){ return String(r[3]).replace('其中：','').replace('业务收入',''); });
    var vals=subs.map(function(r){ return +m(asNum(r[8])).toFixed(2); });
    var revTot=m(asAct('asset01',ci,'营业收入')||0);
    var revYoys=subs.map(function(r){ return String(r[9]||''); });
    /* 明细线合计 < 营收 → 轧差「其他/未拆分收入」补片，保证 饼合计=中心=营业收入（规则②整圆前提） */
    var gap=+(revTot-vals.reduce(function(a,b){return a+b;},0)).toFixed(2);
    if(gap>0.05){ names.push('其他/未拆分收入'); vals.push(gap); revYoys.push(''); }
    var palRev=['#4d94ff','#6cc0f0','#35c06b','#eda14e','#a0b4f0','#8fd8c8'];
    tilDonut('c-as-rev-pie',names,vals,palRev.slice(0,names.length),'亿元',
      {centerEl:'as-rev-center',centerLab:'营业收入 · 亿元',rowsEl:'as-rev-rows',yoys:revYoys});
    var ce=document.getElementById('as-rev-center');
    if(ce) ce.innerHTML='<b>'+tilNum(revTot,'亿元')+'</b><small>营业收入 · 亿</small>';
  } else {
    mk('c-as-pl',{type:'bar',data:{labels:cb.labels,datasets:[{data:cb.vals,backgroundColor:cb.colors,borderRadius:4}]},
      options:Object.assign(base(),{indexAxis:'y',scales:{x:{grid:GRID,ticks:{font:{size:11},color:T3}},y:{grid:{display:false},ticks:{font:{size:10},color:T2}}}})});
  }
  /* 营业收入 · 全口径对比（金色=当前所选口径） */
  mk('c-as-cmp',{type:'bar',data:{labels:cb.labels,datasets:[{data:cb.vals,backgroundColor:cb.colors,borderRadius:4}]},
    options:Object.assign(base(),{scales:{y:YAX,x:{grid:{display:false},ticks:{font:{size:10},color:T2,maxRotation:20}}}})});
}
/* ② 业务规模与投放退出（02-业务结构）：卡随口径展示该口径实有指标，缺失口径显示 —；
   2026-10-21：四线自有出资相加=自有出资存量（260=85+62+72+41 勾稽）→ 构成饼（规则②）；新增 vs 退出=一进一退对比→条形（规则④） */
function asRenderBiz(){
  var ci = ASSET_CAL.asset02!=null? ASSET_CAL.asset02 : 0;
  var CAND=[['生息资产规模',0],['自有出资规模',1],['新增自有出资规模',2],['退出自有出资规模',3]];
  asKpis('askpi-2',CAND.map(function(e){ var nm=e[0];
    return {l:nm,u:'亿元',v:asAct('asset02',ci,nm),raw:1,yoy:asYoY('asset02',ci,nm),
      mom:asMoM('asset02',ci,nm),nc:e[1]}; }));
  /* 四大业务线自有出资构成饼：有线明细口径直接取；无明细口径回退横琴单体参考并在标签注明 */
  var ciS=ci, note='';
  var hasSubs=asSubs('asset02',ci).length>0;
  if(!hasSubs){ ciS=2; note='（横琴单体参考）'; }
  var lab=document.getElementById('as-biz-lab');
  if(lab) lab.textContent='亿元 · 截止本月末 · '+(ASSET_SHEETS.asset02.calibers[ciS].label)+note+'｜四线相加=存量（已勾稽）';
  var mVals=ASSET_LINES.map(function(w){ var r=asRow('asset02',ciS,'其中：'+w+'业务自有出资规模'); return r? +m(asNum(r[8])).toFixed(1):0; });
  tilDestroyCanvases('c-as-own-pie');
  tilDonut('c-as-own-pie',ASSET_LINES,mVals,['#4d94ff','#6cc0f0','#35c06b','#eda14e'],'亿元',
    {centerEl:'as-own-center',centerLab:'自有出资存量 · 亿',
     yoys:ASSET_LINES.map(function(w){ var r=asRow('asset02',ciS,'其中：'+w+'业务自有出资规模'); return r?String(r[9]||''):''; })});
  var rows=document.getElementById('as-own-rows');
  if(rows){ var nVals=ASSET_LINES.map(function(w){ var r=asRow('asset02',ciS,'其中：'+w+'业务新增自有出资规模'); return r? +m(asNum(r[8])).toFixed(1):0; });
    rows.insertAdjacentHTML('beforeend','<div class="strow"><span><span class="lite">其中本年新增（存量−退出+新增 蓄水池动态）</span></span><b>'+
      nVals.map(function(x){ return x.toFixed(0); }).join(' / ')+' 亿</b></div>'); }
  /* 新增 vs 退出投放规模：单体口径（横琴/渝康）全展示 */
  mk('c-as-wf',{type:'bar',data:{labels:['横琴单体','渝康单体'],datasets:[
      {label:'新增自有出资',data:[2,3].map(function(i){ return +m(asAct('asset02',i,'新增自有出资规模')).toFixed(1); }),backgroundColor:'#2f7fd6',borderRadius:4},
      {label:'退出自有出资',data:[2,3].map(function(i){ return +m(asAct('asset02',i,'退出自有出资规模')).toFixed(1); }),backgroundColor:'#f59e0b',borderRadius:4}]},
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
    return '<div class="prog"><div class="pl"><span>'+e[1]+' · 全年预算达成</span><span>'+a+' / '+b+' 个 · '+r.toFixed(2)+'%</span></div><div class="pb"><i style="width:'+Math.min(100,r)+'%"></i></div></div>';
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
      backgroundColor:['#d64550','#f59e0b'],borderRadius:4}]},
    options:Object.assign(base(),{scales:{y:YAX,x:NOG}})});
  /* 全口径对比：不良 vs 关注类双序列，每口径同图并列 */
  var cals=(ASSET_SHEETS.asset03||{}).calibers||[];
  mk('c-as-cal',{type:'bar',data:{labels:cals.map(function(c){return c.label}),datasets:[
      {label:'不良资产总额',data:cals.map(function(c,i){ var v=asAct('asset03',i,'不良资产总额'); return v==null?0:+m(v).toFixed(1); }),backgroundColor:'#d64550',borderRadius:4},
      {label:'关注类资产总额',data:cals.map(function(c,i){ var v=asAct('asset03',i,'关注类资产总额'); return v==null?0:+m(v).toFixed(1); }),backgroundColor:'#f59e0b',borderRadius:4}]},
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
      backgroundColor:['#4d94ff','#6cc0f0','#35c06b'],borderRadius:4}]},
    options:Object.assign(base(),{scales:{y:YAX,x:{grid:{display:false},ticks:{font:{size:10.5},color:T2,maxRotation:20}}}})});
}
function drawAsset(){
  asCalBar('ascal-1','asset01');
  asCalBar('ascal-2','asset02');
  asCalBar('ascal-3','asset03');
  asRenderPl(); asRenderBiz(); asRenderExit(); asRenderRisk(); asRenderSyn();
}

/* ---- 租赁（2026-10-21 展示规则优化：格式对齐华润银行驾驶舱——hero 本月数趋势 / 损益瀑布 / 构成饼 / 管控卡）---- */
function drawLease(){
  /* ① 核心经营：利润链三终点 hero（规则①：KPI=累计 · 趋势=本月数；流量类 lease01 月表 ×日期系数） */
  tilHero('ls-hero-rev','lease01','营业收入'); tilMonthChart('c-ls-t-rev','lease01','营业收入','#4d94ff');
  tilHero('ls-hero-prof','lease01','利润总额'); tilMonthChart('c-ls-t-prof','lease01','利润总额','#4d94ff');
  tilHero('ls-hero-net','lease01','净利润'); tilMonthChart('c-ls-t-net','lease01','净利润','#4d94ff');
  /* 损益瀑布（规则③）：营业收入−营业成本−管理费用−减值损失 = 利润总额（46.8−28.6−4.85−3.2=10.15 勾稽已验证） */
  tilDestroyCanvases('c-ls-wf');
  (function(){
    var deducts=['营业成本','管理费用','资产减值损失'];
    var start=m(tAct('lease01','营业收入')||0), prof=m(tAct('lease01','利润总额')||0);
    var vals=deducts.map(function(n){ return m(Math.abs(tAct('lease01',n)||0)); });
    var run=start, baseA=[], barA=[], levels=[];
    deducts.forEach(function(n,i){ var top=run; run=run-vals[i];
      baseA.push(+run.toFixed(2)); barA.push(+vals[i].toFixed(2)); levels.push(+run.toFixed(2)); });
    baseA.push(0); barA.push(+prof.toFixed(2)); levels.push(+prof.toFixed(2));
    var cols=['#6cc0f0','#a0b4f0','#9db4d0','#35c06b'];
    var labPlugin={id:'lsWfLab',afterDatasetsDraw:function(ch){
      var meta=ch.getDatasetMeta(1); if(!meta||!meta.data) return;
      var ctx=ch.ctx; ctx.save();
      ctx.font='700 10px "Microsoft YaHei",sans-serif'; ctx.textAlign='center';
      meta.data.forEach(function(bar,i){
        var txt=(i<deducts.length?'−'+barA[i].toFixed(1):barA[i].toFixed(1)+' 亿');
        ctx.fillStyle=i<deducts.length?'#c05f1d':'#0f9d6e';
        ctx.fillText(txt, bar.x, bar.y-5); });
      ctx.restore(); }};
    mk('c-ls-wf',{type:'bar',plugins:[labPlugin],
      data:{labels:deducts.map(function(n){ return n==='资产减值损失'?'减值损失':n; }).concat(['利润总额']),
        datasets:[
        {label:'垫',data:baseA,backgroundColor:'transparent',stack:'w',tooltip:{enabled:false}},
        {label:'金额',data:barA,backgroundColor:cols,borderRadius:3,maxBarThickness:46,stack:'w',categoryPercentage:.62},
        {type:'line',label:'扣后水平',data:levels,borderColor:'rgba(122,139,166,.65)',borderWidth:1.2,
         borderDash:[4,3],pointRadius:0,stepped:true,order:0}]},
      options:Object.assign(base({tooltip:{filter:function(it){return it.dataset.label==='金额';},
        callbacks:{label:function(it){ var i=it.dataIndex, nm=deducts.concat(['利润总额'])[i];
          return ' '+nm+'：'+(i<deducts.length?'−':'')+barA[i].toFixed(2)+' 亿'; }}}}),
        {scales:{y:Object.assign({},YAX,{stacked:true,grace:'20%',ticks:{font:{size:9},color:T3}}),
                 x:{stacked:true,grid:{display:false},ticks:{font:{size:9},color:T2,maxRotation:0,autoSkip:false}}}})});
    var lg=document.getElementById('ls-wf-legend');
    if(lg) lg.innerHTML='<span class="lite" style="font-size:10.5px;color:var(--dim2)">■ 扣减项（橙，柱顶 −金额）　■ 利润总额（绿·终点）　- - 扣后水平线｜起点 = 营业收入 '+tilNum(start,'亿元')+' 亿 · 净利润 '+tilNum(m(tAct('lease01','净利润')||0),'亿元')+' 亿见行1卡（本图不重复）</span>';
  })();
  /* 收入构成饼（规则②）：租赁+保理业务收入 相加=营业收入（38.5+6.2=44.7 vs 46.8 → 其他轧差片保整圆） */
  (function(){
    var total=m(tAct('lease01','营业收入')||0);
    var parts=[['租赁业务收入','#4d94ff','租赁业务收入'],['保理业务收入','#6cc0f0','保理业务收入']];
    var v=parts.map(function(e){ return +m(tAct('lease01',e[2])||0).toFixed(2); });
    var other=+(total-v.reduce(function(a,b){return a+b;},0)).toFixed(2);
    tilDonut('c-ls-rev-pie',parts.map(function(e){return e[0]}).concat(['其他收入']),
      v.concat([other>0?other:0]), parts.map(function(e){return e[1]}).concat(['#c3d9f2']),'亿元',
      {centerEl:'ls-rev-center',centerLab:'营业收入 · 亿元',
       yoys:parts.map(function(e){return tYoY('lease01',e[2])}).concat([''])});
  })();
  /* 效益与定价六卡（规则④：存量口径比率；新增投放口径行列表下） */
  var effEl=document.getElementById('ls-eff-cards');
  if(effEl) effEl.innerHTML=
    ['公司整体业务收益率','租赁业务收益率','保理业务收益率','公司整体融资成本率','租赁业务融资成本率','保理业务融资成本率']
    .map(function(n){ return tilStx('lease01',n,{pct:1}); }).join('');
  var el=document.getElementById('ls-spread-rows');
  if(el) el.innerHTML='<div class="stgrp-cap" style="margin-top:10px">新增投放口径（价差的先行指标） <span class="lite">% · 截止本月末</span></div>'+
    '<div class="strow"><span>整体新增投放收益率 / 新增融资成本率</span><b>'+tAct('lease01','公司整体业务新增投放收益率')+'% / '+tAct('lease01','公司整体新增融资成本率')+'%</b></div>'+
    '<div class="strow"><span>新增口径利差（收益率−成本率）</span><b style="color:#0f9d6e">'+(tAct('lease01','公司整体业务新增投放收益率')-tAct('lease01','公司整体新增融资成本率')).toFixed(2)+' pct</b></div>';
  /* ② 规模四卡（存量/投放/新赛道/绿色：★考核带预算达成；季度指标 ROE 类不入此处） */
  var scEl=document.getElementById('ls-scale-cards');
  if(scEl) scEl.innerHTML=
    tilStx('lease03','公司整体业务规模')+
    tilStx('lease03','公司整体业务新增投放')+
    tilStx('lease05','整体业务规模净增量')+
    tilStx('lease05','绿色资产规模');
  /* 行业赛道构成饼（规则②：七大板块相加=公司整体业务规模 262+85+68+72+45+88+60=680 勾稽已验证；
     风电/光伏/水电/储能 为能源电力二层细分→明细行注记，不入片避免双重计算） */
  (function(){
    var secs=[['能源电力','#4d94ff'],['医疗健康','#6cc0f0'],['民生服务','#35c06b'],['交通物流','#eda14e'],
              ['建筑施工','#a0b4f0'],['先进制造','#8fd8c8'],['其他','#c3d9f2']];
    var vals=secs.map(function(e){ return Math.round(m(tAct('lease03',e[0]+'领域规模')||0)); });
    tilDonut('c-ls-sector-pie',secs.map(function(e){return e[0]}),vals,secs.map(function(e){return e[1]}),'亿元',
      {centerEl:'ls-sector-center',centerLab:'整体业务规模 · 亿',
       yoys:secs.map(function(e){return tYoY('lease03',e[0]+'领域规模')})});
    var rows=document.getElementById('ls-sector-rows');
    if(rows) rows.insertAdjacentHTML('beforeend','<div class="strow"><span><span class="lite">能源电力细分：风电/光伏/水电/储能</span></span><b>'+
      ['风电','光伏','水电','储能'].map(function(s){ return Math.round(m(tAct('lease03',s+'领域规模')||0)); }).join(' / ')+' 亿</b></div>');
  })();
  /* 行业新增投放（与存量饼同序：管理层左右对照"存量结构 vs 加仓方向"） */
  (function(){
    var secs=['能源电力','医疗健康','民生服务','交通物流','建筑施工','先进制造','其他'];
    tilDestroyCanvases('c-ls-deploy');
    mk('c-ls-deploy',{type:'bar',data:{labels:secs,datasets:[
      {label:'本年新增投放',data:secs.map(function(s){ var v=tAct('lease03',s+'领域新增投放'); return v==null?0:+m(v).toFixed(1); }),
       backgroundColor:'#f59e0b',borderRadius:4}]},
      options:Object.assign(base(),{indexAxis:'y',scales:{x:{grid:GRID,ticks:{font:{size:10.5},color:T3}},y:{grid:{display:false},ticks:{font:{size:10.5},color:T2}}}})});
  })();
  /* 产品形态构成饼（规则②：回租+直租+经营租赁 相加=租赁业务规模 455+72+18=545 勾稽已验证；保理 135 另账行注） */
  (function(){
    var prod=[['售后回租','#4d94ff'],['直接租赁','#6cc0f0'],['经营性租赁','#35c06b']];
    var vals=prod.map(function(e){ return Math.round(m(tAct('lease03',e[0]+'业务规模')||0)); });
    tilDonut('c-ls-prod-pie',prod.map(function(e){return e[0]}),vals,prod.map(function(e){return e[1]}),'亿元',
      {centerEl:'ls-prod-center',centerLab:'租赁业务规模 · 亿',
       yoys:prod.map(function(e){return tYoY('lease03',e[0]+'业务规模')})});
    var rows=document.getElementById('ls-prod-rows');
    if(rows) rows.insertAdjacentHTML('beforeend','<div class="strow"><span><span class="lite">保理业务（另账）</span></span><b>'+
      Math.round(m(tAct('lease03','保理业务规模')||0))+' 亿 '+tilDelta(tYoY('lease03','保理业务规模'),'')+'</b></div>'+
      '<div class="strow"><span><span class="lite">直租+经营占比（战略转型考核项）</span></span><b>'+tAct('lease05','直租业务+经营性业务规模占比')+'% '+tilDelta(tYoY('lease05','直租业务+经营性业务规模占比'),'')+'</b></div>');
  })();
  /* 融资结构构成饼（规则②：银行+直融+其他 相加=整体融资规模 245+52+23=320 勾稽已验证；期限两分=第二维度行注） */
  (function(){
    var fu=[['银行融资','#2f7fd6'],['直接融资','#5b9bd9'],['其他渠道','#9ec3ea']];
    var vals=fu.map(function(e){ return Math.round(m(tAct('lease02',e[0]+'规模')||0)); });
    tilDonut('c-ls-fund-pie',fu.map(function(e){return e[0]}),vals,fu.map(function(e){return e[1]}),'亿元',
      {centerEl:'ls-fund-center',centerLab:'整体融资规模 · 亿',
       yoys:fu.map(function(e){return tYoY('lease02',e[0]+'规模')})});
    var rows=document.getElementById('ls-fund-rows');
    if(rows){ var sh=m(tAct('lease02','一年期及以下融资规模')||0), lg=m(tAct('lease02','一年期以上融资规模')||0);
      rows.insertAdjacentHTML('beforeend','<div class="strow"><span><span class="lite">期限结构：一年内 / 一年以上（续贷压力）</span></span><b>'+
        Math.round(sh)+' / '+Math.round(lg)+' 亿（短期占比 '+(sh/(sh+lg)*100).toFixed(0)+'%）</b></div>'); }
  })();
  /* ③ 风险质量（lease04 季度表取原值；★率类=管控红线卡带预算条，余额类=明细行——量级悬殊规则④） */
  var rc=document.getElementById('ls-risk-cards');
  if(rc) rc.innerHTML=
    tilStx('lease04','不良资产率',{pct:1,bud:1,cls:'amber'})+
    tilStx('lease04','新增资产不良率',{pct:1,bud:1,cls:'amber'})+
    tilStx('lease04','不良资产回收额',{bud:1,cls:'ok'})+
    tilStx('lease04','拨备覆盖率',{pct:1,cls:'ok'});
  var rr=[['不良资产余额','亿元'],['关注类资产余额','亿元'],['关注类资产率','%',1],['新增不良资产余额','亿元']];
  var el2=document.getElementById('ls-risk-rows');
  if(el2) el2.innerHTML='<div class="stgrid" style="grid-template-columns:1fr 1fr;gap:0 26px;margin-top:8px">'+
    rr.map(function(e){ var nm=e[0], r=tRow('lease04',nm); if(!r) return '';
      return '<div class="strow"><span>'+nm+(tStar('lease04',nm)?'<i class="kstar">★</i>':'')+'</span><b>'+r[5]+(e[1]==='%'?'%':' '+e[1])+' · 同比 '+asDeltaTxt(tYoY('lease04',nm))+' · 较年初 '+(String(r[7])||'-')+'</b></div>'; }).join('')+
    '</div>';
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
    return '<div class="prog"><div class="pl"><span>'+nm+' · 全年预算达成</span><span>'+a+' / '+b+' '+e[1]+' · '+rt.toFixed(2)+'%</span></div><div class="pb"><i style="width:'+Math.min(100,rt)+'%"></i></div></div>'; }).join('');
}

/* ================= 指标卡悬浮提示（2026-10-30 按需求）=================
   卡片根节点带 data-tip 属性（当前=资本充足率/流动性覆盖率「最新日期」）时，
   鼠标移入在卡片上方浮出气泡。事件委托挂 document：卡片随日期下拉/页签重渲染也不失效。
   选择器限 .stx[data-tip]：避免误伤驾驶舱卡头 .gk-tip[data-tip]（问号气泡走 .gk-tip-float 自有机制）；
   2026-10-30 再按需求：扩展 .strow[data-tip]——条线三卡（公司/零售/金市）指标行悬停同款气泡 */
(function(){
  var tip=null;
  function el(){ if(!tip){ tip=document.createElement('div'); tip.className='card-tip'; document.body.appendChild(tip); } return tip; }
  function hide(){ if(tip){ tip.classList.remove('show'); tip._for=null; } }
  document.addEventListener('mouseover',function(e){
    var card=e.target.closest?e.target.closest('.stx[data-tip],.strow[data-tip]'):null;
    if(!card){ return; }
    var t=el();
    if(t._for!==card){ t.innerHTML=card.getAttribute('data-tip')||''; t._for=card; }
    t.classList.add('show');
    var r=card.getBoundingClientRect(), tw=t.offsetWidth, th=t.offsetHeight;
    var x=r.left+r.width/2-tw/2, y=r.top-th-14;
    var below=false;                            /* 气泡默认在卡上方，箭头朝下指向卡 */
    if(y<4){ y=r.bottom+14; below=true; }       /* 贴顶卡片翻到下方，箭头改朝上 */
    if(x<4) x=4; if(x+tw>window.innerWidth-4) x=window.innerWidth-tw-4;
    t.style.left=x+'px'; t.style.top=y+'px';
    /* 2026-10-30 按需求：箭头水平位置=卡片中心（x 被视口边界修正后仍指向卡） */
    t.classList.toggle('up',below); t.classList.toggle('down',!below);
    t.style.setProperty('--ax',Math.max(10,Math.min(tw-10,r.left+r.width/2-x))+'px');
  });
  document.addEventListener('mouseout',function(e){
    var card=e.target.closest?e.target.closest('.stx[data-tip],.strow[data-tip]'):null;
    if(card && !(e.relatedTarget && card.contains(e.relatedTarget))) hide();
  });
  /* 视图/模块切换时兜底隐藏（防止鼠标移开路径上未触发 mouseout） */
  document.addEventListener('click',hide);
})();

/* ================= 启动 ================= */
renderNorth();
LeaderApp.refresh();

window.LeaderApp = LeaderApp;
})();
