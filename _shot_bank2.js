/* 截图验证：银行页 2026-10-20 二轮改造（瀑布6项 / 删达标情况行 / RAROC页签切换） */
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
      var info='';
      /* 1. 损益瀑布 6 项 + 名称顺序 */
      var wf=document.querySelectorAll('#bk-wf-cards .rcell');
      info+='WF='+wf.length+' NAMES='+Array.prototype.map.call(wf,function(x){return x.querySelector('.rl').textContent}).join(',');
      /* 2. 达标情况行应不存在 */
      info+=' REGSUM='+(document.getElementById('bk-reg-sum')?1:0);
      /* 3. RAROC 页签 */
      var tabs=document.querySelectorAll('#bk-raroc-tabs .src');
      info+=' TABS='+tabs.length+' KPI0='+document.querySelector('#bk-raroc-kpi .hv b').textContent;
      /* 点击「零售条线」页签验证切换 */
      tabs[1].click();
      setTimeout(function(){
        try{
          info+=' KPI1='+document.querySelector('#bk-raroc-kpi .hv b').textContent+' LABEL='+document.querySelector('#bk-raroc-kpi .hv small:last-child').textContent;
          document.title='VERIFY='+info+'|PAGESIZE=1460x'+Math.ceil(document.documentElement.scrollHeight)+'|ERRS='+__errs.join(';');
        }catch(e){ document.title='VERIFY-FAIL2='+e.message+'|ERRS='+__errs.join(';'); }
      },400);
    }catch(e){ document.title='VERIFY-FAIL='+e.message+'|ERRS='+__errs.join(';'); }
  }, 1500);
})();
</script></body>`;
const file = path.join(base, '_shot_style20.html');
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

const png = path.join(base, '_style20_bank2.png');
execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
  '--window-size=1460,' + Math.min(H, 4400),
  '--virtual-time-budget=12000',
  '--screenshot=' + png, url], { maxBuffer: 64*1024*1024 });
console.log('OK', png, '1460x' + H);
console.log('VERIFY:', verify);
console.log(errs ? ('JS-ERRS: ' + errs) : 'no-js-errs');
