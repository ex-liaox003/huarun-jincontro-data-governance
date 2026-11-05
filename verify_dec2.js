/* 验证 2026-11-04：固定报表全部页面数字统一 2 位小数
   1) num 列（去年末/实际/全年预算）：所有纯数值均 .XX 两位小数（含整数→10,260.00、36.00）
   2) delta 列（同比/环比/较年初）：+8.6% → +8.60%、+3.2ppt → +3.20ppt
   3) progress 列（预算达成率）：90.0% → 90.00%
   4) KPI 概览卡：大数值 2 位小数、同比行 2 位小数
   5) 例外：序号列保持整数、监管要求 ≥100% 原样、--/N/A 占位符不变
   6) ERRS=0
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
      var dec2=/^[+-]?[\\d,，]+\\.\\d{2}(%.?|ppt)?$/;
      /* 1) num 列 */
      var numTds=[].slice.call(document.querySelectorAll('.sheet-panel td.num-right'));
      var numBad=numTds.filter(function(td){var t=td.textContent.trim();
        if(t==='--'||t==='N/A'||t==='')return false; return !dec2.test(t);});
      out+=' NUM='+numTds.length+' NUMBAD='+numBad.length+(numBad.length?'['+numBad.slice(0,3).map(function(t){return t.textContent.trim();}).join(';')+']':'');
      /* 2) delta 列 */
      var yoyTds=[].slice.call(document.querySelectorAll('.sheet-panel td.yoy'));
      var yoyBad=yoyTds.filter(function(td){var t=td.textContent.replace(/[▲▼]/g,'').trim();
        if(t==='--'||t==='N/A'||t==='')return false; return !dec2.test(t);});
      out+=' YOY='+yoyTds.length+' YOYBAD='+yoyBad.length+(yoyBad.length?'['+yoyBad.slice(0,3).map(function(t){return t.textContent.trim();}).join(';')+']':'');
      /* 抽查样本 */
      var p01=document.getElementById('panel-01');
      var tr=[].slice.call(p01.querySelectorAll('tbody tr')).filter(function(r){return r.textContent.indexOf('总资产')>=0;})[0];
      out+=' P01总资产='+[].slice.call(tr.querySelectorAll('td')).map(function(t){return t.textContent.replace(/\\s+/g,' ').trim();}).join('|');
      /* 3) progress 文本 */
      var pt=[].slice.call(document.querySelectorAll('.sheet-panel .progress-text'));
      var ptBad=pt.filter(function(e){var t=e.textContent.trim(); if(t==='--'||t==='')return false; return !/^\\d[\\d,，]*\\.\\d{2}%$/.test(t);});
      out+=' PROG='+pt.length+' PROGBAD='+ptBad.length+(ptBad.length?'['+ptBad.slice(0,3).map(function(e){return e.textContent;}).join(';')+']':'');
      /* 4) KPI 卡：panel-08 整数样本已补 .00；panel-01 总资产卡 */
      var kpi1=document.querySelector('#panel-01 .kpi-card');
      out+=' KPI1='+(kpi1?kpi1.textContent.replace(/\\s+/g,' ').trim().slice(0,60):'MISS');
      /* 5) 例外：序号列保持整数（panel-01 第一行 td 文本 '1'） */
      var firstCell=tr?tr.querySelector('td').textContent.trim():'?';
      out+=' SEQ=' + firstCell;
      /* 监管要求 ≥100% 原样（panel-03） */
      var p03=document.getElementById('panel-03');
      var req=[].slice.call(p03.querySelectorAll('tbody td')).filter(function(t){return /≥/.test(t.textContent);}).slice(0,2).map(function(t){return t.textContent.trim();});
      out+=' REQ='+JSON.stringify(req);
      /* 6) 其他公司抽查：asset02 整数 36→36.00、lease01 环比、ins01 预算达成率 */
      var p02=document.getElementById('panel-asset02');
      var a02num=[].slice.call(p02.querySelectorAll('td.num-right')).map(function(t){return t.textContent.trim();}).slice(0,6);
      out+=' A02NUM='+a02num.join(',');
      /* delta 带 ppt：bank03 同比 */
      var p03r=[].slice.call(p03.querySelectorAll('td.yoy')).slice(0,4).map(function(t){return t.textContent.replace(/[▲▼]/g,'').trim();});
      out+=' B03YOY='+p03r.join(',');
      out+=' ERRS='+window.__errs.length+(window.__errs.length?'::'+window.__errs.join(';'):'');
      document.title='PROBE::'+out;
    }catch(e){ document.title='PROBE::EXC::'+e.message+'::'+window.__errs.join(';'); }
  },900);
})();
</script>`;

const tmp = path.join(base, '_test_dec2.html');
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
