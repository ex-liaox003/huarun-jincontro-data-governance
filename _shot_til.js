/* 截图验证：领导驾驶舱-信托/保险/租赁 tab 重构后（实时取数） */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const srcHtml = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');

const views = ['trust', 'ins', 'lease'];

for (const v of views) {
  const probe = `<script>
  (function(){
    window.__errs=[]; window.onerror=function(m){ __errs.push(String(m)); };
    try{ switchModule('leader'); LeaderApp.go('${v}',document.querySelector('#moduleLeader header nav button[data-v="${v}"]')); }
    catch(e){ __errs.push('BOOT:'+e.message); }
    setTimeout(function(){
      try{
        var sec=document.getElementById('v-${v}');
        var cards=sec.querySelectorAll('.bukpi');
        var info='CARDS='+cards.length+' ['+Array.prototype.slice.call(cards,function(){}).slice(0,6).map(function(c){return c.querySelector('.l').textContent+'='+c.querySelector('.v b').textContent+c.querySelector('.v small').textContent}).join(' | ')+']';
        var stx=sec.querySelectorAll('.stx');
        var rows=sec.querySelectorAll('.strow');
        var progs=sec.querySelectorAll('.prog');
        var cvs=sec.querySelectorAll('canvas');
        info+=' | STX='+stx.length+' ROWS='+rows.length+' PROG='+progs.length+' CANVAS='+cvs.length;
        document.title='VERIFY='+info+'|PS=1460x'+Math.ceil(document.documentElement.scrollHeight)+'|ERRS='+__errs.join(';');
      }catch(e){ document.title='VERIFY-FAIL='+e.message+'|ERRS='+__errs.join(';'); }
    }, 1100);
  })();
  </scr`+`ipt></body>`;
  const file = path.join(base, '_shot_til_' + v + '.html');
  fs.writeFileSync(file, srcHtml.replace('</body>', probe), 'utf8');
  const url = 'file:///' + file.split('\\').join('/');
  let H = 2400, verify = '', errs = '';
  try {
    const out = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
      '--window-size=1460,1200','--virtual-time-budget=9000','--dump-dom', url],
      { maxBuffer: 64*1024*1024 }).toString('utf8');
    const m = out.match(/<title>VERIFY=([^<]*)<\/title>/);
    if (m) {
      const s = m[1];
      const pm = s.match(/PS=1460x(\d+)/); if (pm) H = +pm[1];
      const em = s.match(/ERRS=([^|]*)/); if (em) errs = em[1];
      verify = s.split('|PS')[0];
    } else verify = '(no verify title)';
  } catch (e) { verify = 'probe fail ' + String(e.message).slice(0,120); }
  const png = path.join(base, '_leader_' + v + '_shot.png');
  execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--default-background-color=FF081A38','--window-size=1460,' + Math.min(H, 4400),
    '--virtual-time-budget=9000','--screenshot=' + png, url], { maxBuffer: 64*1024*1024 });
  console.log('[' + v + ']', '1460x' + H, errs ? ('JS-ERRS: '+errs) : 'no-js-errs');
  console.log('  ' + verify);
}
