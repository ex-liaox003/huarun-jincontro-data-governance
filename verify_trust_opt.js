/* 验证管理驾驶舱-华润信托 tab 2026-10-26 优化：
   1) JS 无报错
   2) 新增「业绩合同指标」六卡（bkgrid6→3列×2行卡），置于收入构成模块之前
   3) 六卡数值：高费率收入占比=28.3%（4.68/16.52）/ 财富家办 980 亿 / 自有资金收益率 27.6%（4.66/16.52?→固有收入4.66÷固有规模425=1.10%）等由报表实时计算
   4) 四大原有模块（核心 hero 三卡 / 收入构成饼+双口径条 / 新三分类饼+条线条 / 固有资金饼+元大条）全存活
   5) 分区顺序：核心经营→业绩合同→收入构成→规模结构→固有元大 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let srcHtml = fs.readFileSync(path.join(base, 'index.html'), 'utf8');

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
  try{ switchModule('leader'); LeaderApp.go('trust', document.querySelector('#moduleLeader header nav button[data-v="trust"]')); }
  catch(e){ __errs.push('BOOT:'+e.message); }
  setTimeout(function(){
    try{
      var C=window.__CHARTS__||{}, out='';
      function cnt(sel){ return document.querySelectorAll(sel).length; }
      var v=document.getElementById('v-trust');
      /* 分区顺序（secttl 标题） */
      var secs=[].map.call(v.querySelectorAll('.secttl .ttl'),function(e){return e.textContent.trim();});
      out+=' SECTIONS='+secs.join(',');
      /* ② 业绩合同六卡 */
      var con=document.getElementById('ts-contract');
      out+=' CONTRACT_CARDS='+(con?con.querySelectorAll('.stx').length:'MISSING');
      if(con){ var names=[].map.call(con.querySelectorAll('.stx .t'),function(t){return t.childNodes[0].textContent.trim();});
        var vals=[].map.call(con.querySelectorAll('.stx .v'),function(t){return t.textContent.trim();});
        var rates=[].map.call(con.querySelectorAll('.as-rate .rt'),function(t){return t.textContent.replace(/\\s+/g,' ').trim();});
        var subs=[].map.call(con.querySelectorAll('.stx .t+span:not(.v)'),function(t){return t.textContent.trim();});
        out+=' C_NAMES='+names.join('|');
        out+=' C_VALS='+vals.join('|');
        out+=' C_RATES='+rates.join('|');
      }
      /* 卡片网格列数 */
      out+=' GRID_COLS='+(con?getComputedStyle(con).gridTemplateColumns.split(' ').length:'-');
      /* 图表：hero 趋势×3 + 构成饼×3 + 双口径条 + 条线条 + 元大条 */
      var tsIds=Object.keys(C).filter(function(k){return k.indexOf('c-ts')===0||k.indexOf('c-in')!==0&&k.indexOf('ts-')===0;}).sort();
      out+=' CHARTS='+Object.keys(C).filter(function(k){return /^c-ts/.test(k);}).sort().map(function(k){return k+':'+C[k].type;}).join(',');
      /* hero */
      out+=' HERO_REV='+((document.getElementById('ts-hero-rev')||{}).textContent||'').replace(/\\s+/g,' ').trim().slice(0,46);
      /* 收入构成饼勾稽：3片合计=18.65 */
      if(C['c-ts-rev-pie']) out+=' PIE_REV='+C['c-ts-rev-pie'].data.labels.join('/')+' sum='+C['c-ts-rev-pie'].data.datasets[0].data.reduce(function(a,b){return a+b;},0).toFixed(2);
      if(C['c-ts-new3-pie']) out+=' PIE_NEW3='+C['c-ts-new3-pie'].data.labels.length+'片 sum='+C['c-ts-new3-pie'].data.datasets[0].data.reduce(function(a,b){return a+b;},0);
      if(C['c-ts-fund-pie']) out+=' PIE_FUND='+C['c-ts-fund-pie'].data.labels.length+'片 sum='+C['c-ts-fund-pie'].data.datasets[0].data.reduce(function(a,b){return a+b;},0).toFixed(1);
      /* 中心值 */
      out+=' CENTERS='+['ts-rev-center','ts-new3-center','ts-fund-center'].map(function(i){var e=document.getElementById(i);return e?e.textContent.replace(/\\s+/g,' ').trim():'MISS';}).join('|');
      /* 原明细区 */
      out+=' REVROWS='+cnt('#ts-rev-rows .strow')+' GXROWS='+cnt('#ts-gx-rows .strow')+' YDROWS='+cnt('#ts-yd-rows .strow');
      out+=' ERRS='+window.__errs.length+(window.__errs.length?'::'+window.__errs.join(';'):'');
      document.title='PROBE::'+out;
    }catch(e){ document.title='PROBE::EXC::'+e.message+'::'+window.__errs.join(';'); }
  },900);
})();
</script>`;

const tmp = path.join(base, '_test_trust_opt.html');
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
