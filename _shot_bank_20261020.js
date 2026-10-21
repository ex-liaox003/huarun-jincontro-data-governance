/* 截图验证：管理驾驶舱-华润银行 2026-10-20 需求改造后（收入构成/损益瀑布半区柱+趋势、一行6卡、存款结构合并、监管红线卡片、RAROC趋势） */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const srcHtml = fs.readFileSync(path.join(base, 'index.html'), 'utf8');

const probe = `<script>
(function(){
  window.__errs=[]; window.onerror=function(m){ __errs.push(m); };
  try{
    switchModule('leader');
    var btn=document.querySelector('#moduleLeader header nav button[data-v="bank"]');
    LeaderApp.go('bank',btn);
  }catch(e){ __errs.push('BOOT:'+e.message); }
  setTimeout(function(){
    try{
      var v=document.getElementById('v-bank');
      var info='';
      /* 收入构成 = 2 卡柱+趋势 */
      var rev=document.querySelectorAll('#bk-rev .rcell');
      info+='REV='+rev.length;
      /* 损益瀑布 = 5 卡 */
      var wf=document.querySelectorAll('#bk-wf-cards .rcell');
      info+=' WF='+wf.length;
      /* 业绩合同 = 打标卡（看首个行内列数样式） */
      var ct=document.querySelectorAll('#bk-contract .stx');
      info+=' CONTRACT='+ct.length+' cols6='+(getComputedStyle(document.getElementById('bk-contract')).gridTemplateColumns.split(' ').length);
      /* 资产负债核心科目 = 6 卡 */
      var bs=document.querySelectorAll('#bk-bs-cards .stx');
      info+=' BS='+bs.length;
      /* 存款结构双 canvas */
      info+=' LOAN='+(document.getElementById('c-bk-loan')?1:0)+' DEP='+(document.getElementById('c-bk-dep')?1:0);
      /* 监管红线 = 6 卡 */
      var rg=document.querySelectorAll('#bk-reg .stx');
      info+=' REG='+rg.length;
      /* 已删除模块不应存在 */
      info+=' DEL_PROF='+(document.getElementById('bk-prof')?1:0)+' DEL_BS='+(document.getElementById('c-bk-bs')?1:0)+' DEL_RATE='+(document.getElementById('c-bk-rate')?1:0)+' DEL_RISK='+(document.getElementById('c-bk-risk')?1:0)+' DEL_COST='+(document.getElementById('bk-cost')?1:0);
      /* RAROC 趋势 */
      info+=' RAROC='+(document.getElementById('c-bk-raroc')?1:0)+' RAROCV='+(document.querySelector('#bk-raroc-kpi .hv b')||{}).textContent;
      /* canvas 总数与图表实例 */
      info+=' CANVAS='+v.querySelectorAll('canvas').length;
      document.title='VERIFY='+info+'|PAGESIZE=1460x'+Math.ceil(document.documentElement.scrollHeight)+'|ERRS='+__errs.join(';');
    }catch(e){ document.title='VERIFY-FAIL='+e.message+'|ERRS='+__errs.join(';'); }
  }, 1500);
})();
</script></body>`;
const file = path.join(base, '_shot_bank_20261020.html');
fs.writeFileSync(file, srcHtml.replace('</body>', probe), 'utf8');
const url = 'file:///' + file.split('\\').join('/');

let H = 3400, verify = '', errs = '';
try {
  const out = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--window-size=1460,1200','--virtual-time-budget=12000','--dump-dom', url],
    { maxBuffer: 64*1024*1024 }).toString('utf8');
  const m = out.match(/<title>(VERIFY[^<]*)<\/title>/);
  if (m) {
    const s = m[1];
    const pm = s.match(/PAGESIZE=\d+x(\d+)/); if (pm) H = +pm[1];
    const em = s.match(/ERRS=([^|]*)/); if (em) errs = em[1];
    verify = s.split('|PAGESIZE')[0];
  }
} catch (e) { console.log('probe fail', String(e.message).slice(0, 160)); }

const png = path.join(base, '_bank_20261020_shot.png');
execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
  '--window-size=1460,' + Math.min(H, 4400),
  '--virtual-time-budget=12000',
  '--screenshot=' + png, url], { maxBuffer: 64*1024*1024 });
console.log('OK', png, '1460x' + H);
console.log('VERIFY:', verify);
console.log(errs ? ('JS-ERRS: ' + errs) : 'no-js-errs');
