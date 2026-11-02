/* 验证管理驾驶舱-华润银行 tab 2026-10-21 展示规则优化（离线：以 Chart 桩替代 CDN）
   验证项：JS 无报错 / 本月数趋势口径 / 4+2 饼图构成 / 瀑布 7 步 / 业绩合同 4 组 / 各卡片计数 / 明细行数值 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let srcHtml = fs.readFileSync(path.join(base, 'index.html'), 'utf8');

/* Chart 桩：替换 CDN script，记录每个 canvas 的配置 */
srcHtml = srcHtml.replace(
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>',
  '<script>(function(){window.__CHARTS__={};var F=function(el,cfg){window.__CHARTS__[el.id]=cfg;' +
  'this.canvas=el;this.config=cfg;this.data=cfg.data;this.destroy=function(){};};' +
  'var D={color:"",borderColor:"",font:{},plugins:{tooltip:{},legend:{}}};F.defaults=D;F.instances={};window.Chart=F;' +
  'F.helpers={};})();</script>'
);
if (srcHtml.indexOf('__CHARTS__') < 0) { console.error('CDN 替换失败'); process.exit(1); }

const probe = `<script>
(function(){
  window.__errs=[]; window.onerror=function(m){ __errs.push(m); };
  try{ switchModule('leader'); LeaderApp.go('bank', document.querySelector('#moduleLeader header nav button[data-v="bank"]')); }
  catch(e){ __errs.push('BOOT:'+e.message); }
  setTimeout(function(){
    try{
      var C=window.__CHARTS__||{}, out='';
      var bkIds=Object.keys(C).filter(function(k){return k.indexOf('c-bk')===0;}).sort();
      out+=' CHARTS='+bkIds.map(function(k){return k+':'+C[k].type;}).join(',');
      /* 本月数趋势：柱数据集 label */
      out+=' RECV_DS='+(C['c-bk-t-recv']?C['c-bk-t-recv'].data.datasets.map(function(d){return d.label;}).join('/'):'MISSING');
      out+=' PROF_DS='+(C['c-bk-t-prof']?C['c-bk-t-prof'].data.datasets.map(function(d){return d.label;}).join('/'):'MISSING');
      /* 本月数首末值应为当月量级（非累计 300+） */
      if(C['c-bk-t-recv']) out+=' RECV_MONS='+C['c-bk-t-recv'].data.datasets[0].data.join(','); out+=' RECV_NEG='+C['c-bk-t-recv'].data.datasets[0].data.some(function(x){return x<0;});
      /* 收入构成饼：4 片数值+label */
      if(C['c-bk-rev-pie']) out+=' PIE_REV='+C['c-bk-rev-pie'].data.labels.join('/')+'='+C['c-bk-rev-pie'].data.datasets[0].data.join(',');
      /* 利润扣减结构（摊平桥）：单行 5 段（4扣减+净利润），段合计=营业收入 */
      if(C['c-bk-wf']) out+=' WF='+C['c-bk-wf'].data.datasets.map(function(d){return d.label+'='+d.data[0]}).join(',')+'|sum='+C['c-bk-wf'].data.datasets.reduce(function(a,d){return a+d.data[0]},0);
      /* 资产/负债饼 */
      if(C['c-bk-asset-pie']) out+=' PIE_ASSET='+C['c-bk-asset-pie'].data.labels.length+'片 sum='+C['c-bk-asset-pie'].data.datasets[0].data.reduce(function(a,b){return a+b;},0);
      if(C['c-bk-debt-pie']) out+=' PIE_DEBT='+C['c-bk-debt-pie'].data.labels.length+'片 sum='+C['c-bk-debt-pie'].data.datasets[0].data.reduce(function(a,b){return a+b;},0);
      if(C['c-bk-dep-pie']) out+=' PIE_DEP4='+C['c-bk-dep-pie'].data.datasets[0].data.join(',');
      if(C['c-bk-npl-pie']) out+=' PIE_NPL='+C['c-bk-npl-pie'].data.datasets[0].data.join(',');
      if(C['c-bk-line-pie']) out+=' PIE_LINE='+C['c-bk-line-pie'].data.datasets[0].data.join(',');
      function cnt(sel){ return document.querySelectorAll(sel).length; }
      out+=' HERO_M='+(document.querySelector('#bk-hero-recv .hv-mo')?document.querySelector('#bk-hero-recv .hv-mo').textContent.replace(/\\s+/g,' ').trim():'MISSING');
      out+=' CENTERS='+['bk-rev-center','bk-asset-center','bk-debt-center','bk-line-center'].map(function(i){var e=document.getElementById(i);return e?e.textContent.replace(/\\s+/g,' ').trim():'MISS';}).join('|');
      var cap=[].map.call(document.querySelectorAll('#bk-contract .stgrp-cap'),function(e){return e.childNodes[0].textContent.trim();});
      out+=' GROUPS='+cap.join(',')+' CARDS='+cnt('#bk-contract .stx');
      out+=' EFF6='+cnt('#bk-eff-cards .stx')+' BS6='+cnt('#bk-bs-cards .stx')+' REG6='+cnt('#bk-reg .stx');
      out+=' DEPROWS='+cnt('#bk-dep-rows .strow')+' NPLROWS='+cnt('#bk-npl-rows .strow')+' LINEROWS='+cnt('#bk-line-rows .strow');
      var ln=[].map.call(document.querySelectorAll('#bk-line-rows .strow b'),function(b){return b.textContent.replace(/\\s+/g,' ').trim();});
      out+=' LINE='+ln.join(' || ');
      out+=' CORP='+cnt('#bk-corp .strow')+' RET='+cnt('#bk-retail .strow')+' CHAN='+cnt('#bk-chan .strow')+' RAROCTABS='+cnt('#bk-raroc-tabs .src');
      out+=' ERRS='+window.__errs.length+(window.__errs.length?'::'+window.__errs.join(';'):'');
      document.title='PROBE::'+out;
    }catch(e){ document.title='PROBE::EXC::'+e.message+'::'+window.__errs.join(';'); }
  },900);
})();
</script>`;

const tmp = path.join(base, '_test_bank_redesign.html');
fs.writeFileSync(tmp, srcHtml.replace(/<\/body>/i, probe + '</body>'), 'utf8');
let out;
try {
  out = execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=6000',
    '--timeout=30000', '--dump-dom', 'file:///' + tmp.split(path.sep).join('/')
  ], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, timeout: 90000 });
} catch (e) {
  console.error('CHROME FAIL', e.message); process.exit(1);
}
const m = out.match(/<title>PROBE::([^<]*)<\/title>/);
if (!m) { console.error('NO PROBE RESULT'); fs.unlinkSync(tmp); process.exit(1); }
console.log(m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'"));
fs.unlinkSync(tmp);
