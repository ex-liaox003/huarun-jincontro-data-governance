/* 验证 2026-11-05：03-关键监测指标 资产利润率→ROA(资产利润率)、资本利润率→ROE(资本利润率)
   1) 固定报表 panel-03：两行名称已改；「风险资产利润率」行不受影响
   2) 台账 led-03：两行名称同步改；风险资产利润率保持
   3) 驾驶舱不受影响：bkStx 按原名取数、SHEETS 原始行名仍为「资产利润率」
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
      function rowNames(p){ return [].slice.call(p.querySelectorAll('tbody tr')).map(function(r){
        var tds=r.querySelectorAll('td'); for(var i=0;i<tds.length;i++){ var t=tds[i].className;
          if(t.indexOf('indicator-name')>=0) return tds[i].textContent.trim(); }
        return ''; }).filter(Boolean); }
      var p3=document.getElementById('panel-03');
      var n3=rowNames(p3);
      out+=' P03_ROA='+n3.filter(function(n){return n.indexOf('ROA')>=0||n==='资产利润率';}).join(',')
        +' P03_ROE='+n3.filter(function(n){return n.indexOf('ROE')>=0||n==='资本利润率';}).join(',')
        +' P03_RISKROA='+(n3.filter(function(n){return n.indexOf('风险资产利润率')>=0;}).length);
      /* 行值抽查：ROA 行实际=0.85 */
      var tr=[].slice.call(p3.querySelectorAll('tbody tr')).filter(function(r){return r.textContent.indexOf('ROA(资产利润率)')>=0;})[0];
      out+=' P03_ROA_ROW='+(tr?tr.textContent.replace(/\\s+/g,' ').trim().slice(0,70):'MISS');
      /* 台账 */
      try{ if(typeof renderAllLedgers==='function') renderAllLedgers(); }catch(e){ out+=' LED_ERR='+e.message; }
      var l3=document.getElementById('panel-led-03');
      if(l3){ var n3l=rowNames(l3);
        out+=' LED03_ROA='+n3l.filter(function(n){return n.indexOf('ROA')>=0;}).join(',')
          +' LED03_ROE='+n3l.filter(function(n){return n.indexOf('ROE')>=0;}).join(',')
          +' LED03_RISKROA='+(n3l.filter(function(n){return n.indexOf('风险资产利润率')>=0;}).length); }
      else out+=' LED03=MISSING';
      /* 数据源未动 + 驾驶舱按原名取数 */
      out+=' RAW_row6='+SHEETS['03'].rows[6][2]+' RAW_row7='+SHEETS['03'].rows[7][2];
      try{ out+=' BKGET='+ (typeof bkGet==='function' ? bkGet('03','资产利润率','act') : 'nofn'); }catch(e){ out+=' BKGET_ERR='+e.message; }
      /* 全页检查无裸「资产利润率」名称单元格残留（固定+台账，排除 ROA/ROE/风险 前缀） */
      var bare=[].slice.call(document.querySelectorAll('.sheet-panel td.indicator-name')).filter(function(t){
        var n=t.textContent.trim(); return (n==='资产利润率'||n==='资本利润率');}).length;
      out+=' BARE_NAME_CELLS='+bare;
      out+=' ERRS='+window.__errs.length+(window.__errs.length?'::'+window.__errs.join(';'):'');
      document.title='PROBE::'+out;
    }catch(e){ document.title='PROBE::EXC::'+e.message+'::'+(window.__errs||[]).join(';'); }
  },900);
})();
</script>`;

const tmp = path.join(base, '_test_rename.html');
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
