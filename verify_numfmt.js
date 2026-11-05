/* 验证 2026-11-04：固定报表 去年末/实际/全年预算 三列 → 右对齐 + 千分位
   1) 全部 5 家 30 张报表面板中 .num-right 单元格存在且计算样式 text-align:right
   2) 抽查数值：panel-01 总资产 去年末/实际 = 12,580.00；panel-02 营业收入 全年预算 = 365.00
   3) 非目标列（同比/环比 delta 列）不受影响：仍居中、原样显示
   4) 占位符 --（无预算行）不破坏、仍渲染
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
      function panels(){ return [].slice.call(document.querySelectorAll('.sheet-panel')); }
      var all=[].slice.call(document.querySelectorAll('td.value.num-right'));
      out+=' NUMRIGHT_CELLS='+all.length;
      /* 计算样式必须为 right */
      var badAlign=all.filter(function(td){ return getComputedStyle(td).textAlign!=='right'; }).length;
      out+=' BAD_ALIGN='+badAlign;
      /* 各面板覆盖：列出含 num-right 的 panel id 数 */
      var pid={}; all.forEach(function(td){ var p=td.closest('.sheet-panel'); if(p) pid[p.id]=1; });
      out+=' PANELS_COVERED='+Object.keys(pid).length;
      /* 抽查 panel-01 总资产行（去年末/实际两列） */
      var p01=document.getElementById('panel-01');
      if(p01){
        var tr=[].slice.call(p01.querySelectorAll('tbody tr')).filter(function(r){return r.textContent.indexOf('总资产')>=0;})[0];
        if(tr){ var tds=tr.querySelectorAll('td'); out+=' P01总资产='+[].slice.call(tds).map(function(t){return t.className.indexOf('num-right')>=0?('['+t.textContent.trim()+']'):t.textContent.trim();}).join('|');
          var nr=[].slice.call(tds).filter(function(t){return t.className.indexOf('num-right')>=0;});
          out+=' P01NUM='+nr.length; }
      }
      /* 抽查 panel-02 营业收入 全年预算=365.00 且右对齐 */
      var p02=document.getElementById('panel-02');
      if(p02){
        var tr2=[].slice.call(p02.querySelectorAll('tbody tr')).filter(function(r){return r.textContent.indexOf('营业收入')>=0;})[0];
        if(tr2){ var nr2=[].slice.call(tr2.querySelectorAll('td.num-right')).map(function(t){return t.textContent.trim();});
          out+=' P02营收_NUM='+nr2.join(','); }
      }
      /* delta 列不受影响：同比单元格无 num-right 且居中 */
      if(p02){
        var yoy=[].slice.call(p02.querySelectorAll('td.yoy'))[0];
        out+=' YOY_SAMPLE='+(yoy?yoy.textContent.trim()+' align='+getComputedStyle(yoy).textAlign:'MISS');
      }
      /* 非考核行 -- 占位符仍渲染（panel-02 利息净收入 全年预算应为 --） */
      if(p02){
        var tr3=[].slice.call(p02.querySelectorAll('tbody tr')).filter(function(r){return r.textContent.indexOf('利息净收入')>=0;})[0];
        if(tr3){ var dash=[].slice.call(tr3.querySelectorAll('td.num-right .dim-dash')).length; out+=' P02利息_DASH='+dash; }
      }
      /* 其他 4 家抽查：信托 trust01 / 保险 ins01 / 租赁 lease01 / 资产 asset01 均有 num-right */
      ['panel-trust01','panel-ins01','panel-lease01','panel-asset01'].forEach(function(id){
        var el=document.getElementById(id);
        out+=' '+id+'='+(el?el.querySelectorAll('td.num-right').length:'NOPANEL');
      });
      out+=' ERRS='+window.__errs.length+(window.__errs.length?'::'+window.__errs.join(';'):'');
      document.title='PROBE::'+out;
    }catch(e){ document.title='PROBE::EXC::'+e.message+'::'+window.__errs.join(';'); }
  },900);
})();
</script>`;

const tmp = path.join(base, '_test_numfmt.html');
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
