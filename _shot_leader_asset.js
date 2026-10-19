/* 截图验证：领导驾驶舱-华润资产 tab 重构后（口径切换+取数） */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const srcHtml = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');

const probe = `<script>
(function(){
  window.__errs=[]; window.onerror=function(m){ __errs.push(m); };
  try{
    switchModule('leader');
    var btn=document.querySelector('#moduleLeader header nav button[data-v="asset"]');
    LeaderApp.go('asset',btn);
  }catch(e){ __errs.push('BOOT:'+e.message); }
  /* 冒烟：默认口径渲染检查 + 切口径函数存在 */
  setTimeout(function(){
    try{
      if(typeof LeaderApp.asCal!=='function') __errs.push('asCal missing');
      var k1=document.querySelectorAll('#askpi-1 .bukpi');
      var k2=document.querySelectorAll('#askpi-2 .bukpi');
      var k3=document.querySelectorAll('#askpi-3 .bukpi');
      var k4=document.querySelectorAll('#askpi-4 .bukpi');
      var ex=document.querySelectorAll('#as-exit-grid .stx');
      var info='KPI1='+k1.length+' ['+Array.prototype.map.call(k1,function(c){return c.querySelector('.l').textContent+'='+c.querySelector('.v b').textContent}).join(' | ')+']'+
        ' | KPI2='+k2.length+' ['+Array.prototype.map.call(k2,function(c){return c.querySelector('.l').textContent+'='+c.querySelector('.v b').textContent}).join(' | ')+']'+
        ' | KPI3='+k3.length+' ['+Array.prototype.map.call(k3,function(c){return c.querySelector('.l').textContent+'='+c.querySelector('.v b').textContent}).join(' | ')+']'+
        ' | KPI4='+k4.length+' | EXIT='+ex.length;
      var cvs=document.querySelectorAll('#v-asset canvas');
      info += ' | CANVAS='+cvs.length;
      document.title='VERIFY='+info.replace(/\\s*\\n\\s*/g,'')+'|PAGESIZE=1460x'+Math.ceil(document.documentElement.scrollHeight)+'|ERRS='+__errs.join(';');
    }catch(e){ document.title='VERIFY-FAIL='+e.message+'|ERRS='+__errs.join(';'); }
  }, 1200);
})();
</script></body>`;
const file = path.join(base, '_shot_leader_asset.html');
fs.writeFileSync(file, srcHtml.replace('</body>', probe), 'utf8');
const url = 'file:///' + file.split('\\').join('/');

let H = 2600, verify = '', errs = '';
try {
  const out = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--window-size=1460,1200','--virtual-time-budget=9000','--dump-dom', url],
    { maxBuffer: 64*1024*1024 }).toString('utf8');
  const m = out.match(/<title>VERIFY=([^<]*)<\/title>/);
  if (m) {
    const s = m[1];
    const pm = s.match(/PAGESIZE=\d+x(\d+)/); if (pm) H = +pm[1];
    const em = s.match(/ERRS=([^|]*)/); if (em) errs = em[1];
    verify = s.split('|PAGESIZE')[0];
  }
} catch (e) { console.log('probe fail', String(e.message).slice(0, 160)); }

const png = path.join(base, '_leader_asset_shot.png');
execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
  '--default-background-color=FF081A38',
  '--window-size=1460,' + Math.min(H, 4400),
  '--virtual-time-budget=9000',
  '--screenshot=' + png, url], { maxBuffer: 64*1024*1024 });
console.log('OK', png, '1460x' + H);
console.log('VERIFY:', verify);
console.log(errs ? ('JS-ERRS: ' + errs) : 'no-js-errs');
