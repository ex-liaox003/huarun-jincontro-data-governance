/* 为华润保险需求文档截取系统原型示意图（源头：战略部数据应用平台.html）：
   数据应用模块 → 华润保险 3 张固定报表（ins01/ins02/ins03）+ 3 张报表台账（led-ins01/02/03）；
   4x 高清渲染；同时输出到 shots_ins/（docx 构建用）与 系统原型图片/（交付查看用）。 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SCALE = 4;
const NAMES = {
  'ins01':'01-财务指标','ins02':'02-业务指标','ins03':'03-关键管理指标'};
const shotDir = path.join(base, 'shots_ins');
const outDir  = path.join(base, '系统原型图片');
[shotDir, outDir].forEach(d=>{ if(!fs.existsSync(d)) fs.mkdirSync(d); });

const srcHtml = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');
const fileUrl = f => 'file:///' + f.split('\\').join('/');

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
  const f = path.join(base, '_hires_ins_' + key + '.html');
  fs.writeFileSync(f, h, 'utf8');
  return f;
}

function chromeDumpSize(file){
  const out = execFileSync(CHROME, [
    '--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--window-size=1460,1000','--virtual-time-budget=6000',
    '--dump-dom', fileUrl(file)
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
    fileUrl(file)
  ], { stdio: ['ignore','ignore','pipe'], maxBuffer: 64*1024*1024 });
}

/* KEYS：固定报表 ins_fixNN（docx 构建槽位 1-3）、台账 ins_ledNN（槽位 4-6） */
const KEYS = Object.keys(NAMES).flatMap((k,i)=>{
  const n = String(i+1).padStart(2,'0');
  return [
    {panel:k,        shot:'ins_fix'+n+'.png', cn:'保险固定报表-'+NAMES[k]+'.png'},
    {panel:'led-'+k, shot:'ins_led'+n+'.png', cn:'保险报表台账-'+NAMES[k]+'台账.png'}
  ];
});
for(const {panel, shot, cn} of KEYS){
  const f = buildShotPage(panel);
  const s = chromeDumpSize(f);
  const out = path.join(shotDir, shot);
  chromeShot(f, out, s.w, s.h);
  fs.copyFileSync(out, path.join(outDir, cn));
  const buf = fs.readFileSync(out);
  console.log(`OK ${panel} -> ${shot} (${s.w}x${s.h}px ${(buf.length/1024).toFixed(0)}KB) + 系统原型图片/${cn}`);
  fs.unlinkSync(f);
}
console.log('全部完成');
