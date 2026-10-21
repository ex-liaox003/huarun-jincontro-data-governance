/* 截图验证：管理驾驶舱 2026-10-20 领导层风格优化（总览 + 各板块） */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const srcHtml = fs.readFileSync(path.join(base, 'index.html'), 'utf8');

const view = process.argv[2] || 'overview';
const probe = `<script>
(function(){
  window.__errs=[]; window.onerror=function(m){ __errs.push(m); };
  try{
    switchModule('leader');
    var btn=document.querySelector('#moduleLeader header nav button[data-v="${view}"]');
    if(btn) LeaderApp.go('${view}',btn);
  }catch(e){ __errs.push('BOOT:'+e.message); }
  setTimeout(function(){
    try{
      var v=document.getElementById('v-${view}');
      var info='CANVAS='+(v?v.querySelectorAll('canvas').length:-1);
      document.title='VERIFY='+info+'|PAGESIZE=1460x'+Math.ceil(document.documentElement.scrollHeight)+'|ERRS='+__errs.join(';');
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

const png = path.join(base, '_style20_' + view + '.png');
execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
  '--window-size=1460,' + Math.min(H, 4400),
  '--virtual-time-budget=12000',
  '--screenshot=' + png, url], { maxBuffer: 64*1024*1024 });
console.log('OK', png, '1460x' + H);
console.log('VERIFY:', verify);
console.log(errs ? ('JS-ERRS: ' + errs) : 'no-js-errs');
