/* 验证 2026-11-05：09-风险情况 四行「较年初」显示 --
   1) panel-09：信用减值损失/公司贷款信用损失准备/零售贷款信用损失准备/不良资产处置 四行 较年初单元格=--
   2) 同行 去年末/实际/同比 数值不变（同比仍 ▲x.xx%）
   3) 其他行较年初不受影响（如 不良贷款率 行仍显示数值）
   4) 驾驶舱取数不受影响：bkGet('09','不良资产处置','ytd') 原始值仍在（SHEETS 未被改写）
   5) ERRS=0
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
      var p=document.getElementById('panel-09');
      if(!p){ document.title='PROBE::NO-PANEL'; return; }
      function leaves(s){var row1=s.headers[0],row2=s.headers[1]||[];var o=[];var j=0;row1.forEach(function(h){var c=h.c||1,r=h.r||1;for(var k=0;k<c;k++){if(r>1){o.push(h.l);}else{o.push(row2[j]?row2[j].l:h.l);j++;}}});return o;}
      var L=leaves(SHEETS['09']);
      var yi=L.indexOf('较年初'), ni=L.indexOf('指标名称');
      /* 表头列名 */
      out+=' COLS='+L.join(',');
      /* 四目标行：遍历 tbody tr，取名称与较年初列文本 */
      var targets=['信用减值损失','公司贷款信用损失准备','零售贷款信用损失准备','不良资产处置'];
      var trs=[].slice.call(p.querySelectorAll('tbody tr'));
      targets.forEach(function(t){
        var tr=trs.filter(function(r){return r.textContent.indexOf(t)>=0;})[0];
        if(!tr){ out+=' '+t+'=MISS'; return; }
        var tds=tr.querySelectorAll('td');
        /* 列有 rowspan 偏移，改用名称列锚定：找含指标名的 td 索引，之后按剩余 td 对位 */
        var tArr=[].slice.call(tds).map(function(td){return td.textContent.replace(/\\s+/g,' ').trim();});
        out+=' '+t+'='+tArr.join('|');
      });
      /* 非目标行抽查（较年初应仍有值）：不良贷款率 / 拨备覆盖率 */
      ['不良贷款率','拨备覆盖率'].forEach(function(t){
        var tr=trs.filter(function(r){return r.textContent.indexOf(t)>=0;})[0];
        if(tr){ var tArr=[].slice.call(tr.querySelectorAll('td')).map(function(td){return td.textContent.trim();});
          out+=' CHK_'+t+'='+tArr.join('|'); }
      });
      /* SHEETS 原始数据未被改写（驾驶舱安全）*/
      var r12=SHEETS['09'].rows[12];
      out+=' RAW_处置_ytd='+r12[8];
      var r5=SHEETS['09'].rows[5]; out+=' RAW_减值_ytd='+r5[8];
      out+=' ERRS='+window.__errs.length+(window.__errs.length?'::'+window.__errs.join(';'):'');
      document.title='PROBE::'+out;
    }catch(e){ document.title='PROBE::EXC::'+e.message+'::'+(window.__errs||[]).join(';'); }
  },900);
})();
</script>`;

const tmp = path.join(base, '_test_mask.html');
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
