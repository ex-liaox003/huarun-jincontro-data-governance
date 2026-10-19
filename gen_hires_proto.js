/* 直接从 战略部数据应用平台.html 截取 数据应用模块 9 张固定报表 + 9 张报表台账 原型示意图，
   3x 高清渲染，输出到 系统原型图片/ */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';;
const SCALE = 4;
const NAMES = {
  '01':'01-资产负债简表','02':'02-损益表简表','03':'03-关键监测指标',
  '04':'04-收入结构','05':'05-成本结构','06':'06-存贷结构',
  '07':'07-利率结构','08':'08-客群结构','09':'09-风险情况'};
const outDir = path.join(base, '系统原型图片');
if(!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const srcHtml = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');

function buildShotPage(key){
  let h = srcHtml;
  h = h.split('overview-area collapsed').join('overview-area');
  h = h.replace('</style>', `
.sheet-panel{display:none !important;}
#panel-${key}{display:block !important;}
.table-wrap{max-height:none !important; overflow:visible !important;}
.header{display:none !important;}
.sidebar{display:none !important;}
.layout{display:block !important;}
.content{padding:14px 18px !important;max-width:1460px;margin:0 auto;}
body{background:#fff !important;}
</style>`);
  h = h.replace('</body>', `<script>
(function(){
  switchTab(${JSON.stringify(key)});
  function size(){
    var w = document.documentElement.scrollWidth, H = Math.ceil(document.documentElement.scrollHeight);
    document.querySelectorAll('#panel-' + ${JSON.stringify(key)} + ' .table-wrap').forEach(function(el){
      var t = el.querySelector('table');
      if(t) w = Math.max(w, Math.ceil(el.getBoundingClientRect().left + t.scrollWidth + 36));
    });
    return [Math.ceil(w), H];
  }
  setTimeout(function(){ var s = size(); document.title = 'PAGESIZE=' + s[0] + 'x' + s[1]; }, 500);
})();
</script></body>`);
  const f = path.join(base, '_hires_' + key + '.html');
  fs.writeFileSync(f, h, 'utf8');
  return f;
}

function chromeDumpSize(file){
  const out = execFileSync(CHROME, [
    '--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--window-size=1460,1000','--virtual-time-budget=6000',
    '--dump-dom', 'file:///' + file.split('\\').join('/')
  ], { maxBuffer: 64*1024*1024 }).toString('utf8');
  const m = out.match(/PAGESIZE=(\d+)x(\d+)/);
  if(!m) throw new Error('未取到页面尺寸: ' + file);
  return { w: +m[1], h: +m[2] };
}

function chromeShot(file, png, w, h){
  execFileSync(CHROME, [
    '--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--default-background-color=FFFFFFFF',
    '--force-device-scale-factor=' + SCALE,
    '--window-size=' + w + ',' + h,
    '--virtual-time-budget=6000',
    '--screenshot=' + png,
    'file:///' + file.split('\\').join('/')
  ], { stdio: ['ignore','ignore','pipe'], maxBuffer: 64*1024*1024 });
}

const KEYS = Object.keys(NAMES).flatMap(k => [
  {panel:k, png:'固定报表-'+NAMES[k]+'.png'},
  {panel:'led-'+k, png:'报表台账-'+NAMES[k]+'台账.png'}
]);
for(const {panel, png} of KEYS){
  const f = buildShotPage(panel);
  const s = chromeDumpSize(f);
  const out = path.join(outDir, png);
  chromeShot(f, out, s.w, s.h);
  const dim = (b=>b.readUInt32BE(16)+'x'+b.readUInt32BE(20))(fs.readFileSync(out,null).subarray(0,24));
  console.log(`✓ ${panel} → ${png}  ${dim}px  ${(fs.statSync(out).size/1024).toFixed(0)}KB`);
  fs.unlinkSync(f);
}
console.log('全部完成');
