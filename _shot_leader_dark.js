/* 验证截图：领导驾驶舱模块（明亮风）总览 + 银行页 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const srcHtml = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');

function buildShot(view, file){
  let h = srcHtml.replace('</body>', `<script>
(function(){
  switchModule('leader');
  if(${JSON.stringify(view)} !== 'overview'){
    var btn = document.querySelector('#moduleLeader [data-v=${JSON.stringify(view)}]');
    if(btn) LeaderApp.go(${JSON.stringify(view)}, btn);
  }
  setTimeout(function(){
    var w = 1460, H = Math.ceil(document.documentElement.scrollHeight);
    document.title = 'PAGESIZE=' + w + 'x' + H;
  }, 800);
})();
</script></body>`);
  fs.writeFileSync(file, h, 'utf8');
  return file;
}
function chromeShot(file, png, w, h){
  execFileSync(CHROME, [
    '--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--default-background-color=FFFFFFFF',
    '--window-size=' + w + ',' + Math.min(h, 4000),
    '--virtual-time-budget=9000',
    '--screenshot=' + png,
    'file:///' + file.split('\\').join('/')
  ], { stdio: ['ignore','ignore','pipe'], maxBuffer: 64*1024*1024 });
}
for(const view of ['overview','bank','lease']){
  const f = buildShot(view, path.join(base, '_shot_leader_' + view + '.html'));
  let H = 1500;
  try{
    const out = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
      '--window-size=1460,1200','--virtual-time-budget=9000','--dump-dom','file:///' + f.split('\\').join('/')
    ], { maxBuffer: 64*1024*1024 }).toString('utf8');
    const m = out.match(/PAGESIZE=(\d+)x(\d+)/);
    if(m) H = +m[2];
  }catch(e){ console.log('size probe fail', e.message.slice(0,120)); }
  const png = path.join(base, '_leader_' + view + '_shot.png');
  chromeShot(f, png, 1460, H);
  console.log('✓', png, '1460x' + H);
}
