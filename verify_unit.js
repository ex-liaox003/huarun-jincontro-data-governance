/* 验证 2026-11-04：单位「户数」→「户」（固定报表管理 + 报表台账管理两模块）
   1) 固定报表 panel-08 单位列：原 10 行「户数」全部显示「户」，页面内不再有「户数」单元格文本
   2) 「万户」不受影响（如 08 表其他行/集团总览）
   3) 台账 led-08 单位列同样显示「户」
   4) ERRS=0
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let srcHtml = fs.readFileSync(path.join(base, 'index.html'), 'utf8');

srcHtml = srcHtml.replace(
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>',
  '<script>window.Chart=function(){this.destroy=function(){};};window.Chart.defaults={};window.Chart.helpers={};</script>'
);

const probe = `<script>
(function(){
  window.__errs=[]; window.onerror=function(m){ __errs.push(m); };
  setTimeout(function(){
    try{
      var out='';
      /* 固定报表 panel-08：单位列 */
      var p=document.getElementById('panel-08');
      if(!p){ document.title='PROBE::NO-PANEL-08'; return; }
      var unitTds=[].slice.call(p.querySelectorAll('tbody td.value')).filter(function(t){return t.textContent.trim()==='户'||t.textContent.trim()==='户数';});
      var hu=[].slice.call(p.querySelectorAll('tbody td')).filter(function(t){return t.textContent.trim()==='户';}).length;
      var huShu=[].slice.call(p.querySelectorAll('tbody td')).filter(function(t){return t.textContent.trim()==='户数';}).length;
      var wanHu=[].slice.call(p.querySelectorAll('tbody td')).filter(function(t){return t.textContent.trim()==='万户';}).length;
      out+=' P08_HU='+hu+' P08_HUSHU='+huShu+' P08_WANHU='+wanHu;
      /* 全固定报表面板内不应再有独立「户数」单元格 */
      var allHuShu=[].slice.call(document.querySelectorAll('.sheet-panel tbody td')).filter(function(t){return t.textContent.trim()==='户数';}).length;
      out+=' SHEETS_HUSHU_CELLS='+allHuShu;
      /* 台账面板（led- 前缀）渲染验证 */
      try{
        if(typeof renderAllLedgers==='function'){ renderAllLedgers(); }
      }catch(e){ out+=' LEDGER_RENDER_ERR='+e.message; }
      var l8=document.getElementById('panel-led-08');
      if(l8){
        var l8hu=[].slice.call(l8.querySelectorAll('tbody td')).filter(function(t){return t.textContent.trim()==='户';}).length;
        var l8hs=[].slice.call(l8.querySelectorAll('tbody td')).filter(function(t){return t.textContent.trim()==='户数';}).length;
        out+=' LED08_HU='+l8hu+' LED08_HUSHU='+l8hs;
      } else out+=' LED08=MISSING';
      var allL8=[].slice.call(document.querySelectorAll('[id^="panel-led-"] tbody td')).filter(function(t){return t.textContent.trim()==='户数';}).length;
      out+=' LEDGERS_HUSHU_CELLS='+allL8;
      /* 样本行：公司有效客户数 行（原单位=户数） */
      var tr=[].slice.call(p.querySelectorAll('tbody tr')).filter(function(r){return r.textContent.indexOf('公司有效客户数')>=0;})[0];
      out+=' ROW1='+(tr?tr.textContent.replace(/\\s+/g,' ').trim().slice(0,50):'MISS');
      out+=' ERRS='+window.__errs.length+(window.__errs.length?'::'+window.__errs.join(';'):'');
      document.title='PROBE::'+out;
    }catch(e){ document.title='PROBE::EXC::'+e.message+'::'+(window.__errs||[]).join(';'); }
  },900);
})();
</script>`;

const tmp = path.join(base, '_test_unit.html');
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
