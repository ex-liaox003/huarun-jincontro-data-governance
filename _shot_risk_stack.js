/* 截图验证：领导驾驶舱-华润金融总览（风险四图改五家堆叠+来源色签） */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const srcHtml = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');

const probe = `<script>
(function(){
  window.__errs=[]; window.onerror=function(m){ __errs.push(m); };
  switchModule('leader');
  setTimeout(function(){
    var c = document.querySelector('#sr-rk-disp .src[data-k="bank"]');
    if (c) c.click();
  }, 600);
  setTimeout(function(){
    var w = 1460, H = Math.ceil(document.documentElement.scrollHeight);
    document.title = 'PAGESIZE=' + w + 'x' + H + '|ERRS=' + __errs.join(';');
  }, 900);
})();
</script></body>`;
const file = path.join(base, '_shot_leader_overview.html');
fs.writeFileSync(file, srcHtml.replace('</body>', probe), 'utf8');
const url = 'file:///' + file.split('\\').join('/');

let H = 1600, errs = '';
try {
  const out = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--window-size=1460,1200','--virtual-time-budget=9000','--dump-dom', url],
    { maxBuffer: 64*1024*1024 }).toString('utf8');
  const m = out.match(/PAGESIZE=(\d+)x(\d+)(\|ERRS=[^<]*)?/);
  if (m) { H = +m[2]; errs = (m[3] || '').replace('|ERRS=', ''); }
} catch (e) { console.log('size probe fail', String(e.message).slice(0, 160)); }

const png = path.join(base, '_leader_overview_shot.png');
execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
  '--default-background-color=FF081A38',
  '--window-size=1460,' + Math.min(H, 4200),
  '--virtual-time-budget=9000',
  '--screenshot=' + png, url], { maxBuffer: 64*1024*1024 });
console.log('OK', png, '1460x' + H, errs ? ('JS-ERRS: ' + errs) : 'no-js-errs');
