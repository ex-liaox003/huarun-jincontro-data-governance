/* 为需求文档 2.1/2.2「系统原型示意图」生成真实页面截图：
   1) 从 战略部数据应用平台.html 生成 _shot_<key>.html 副本：隐藏顶栏/侧栏，仅激活对应报表/台账面板，
      概览区展开；注入脚本把整页尺寸写入 document.title；
   2) Chrome 无头 --dump-dom 读取尺寸 → --screenshot 按该尺寸整页截图 → shots/bankXX.png / shots/bank_ledXX.png；
   3) 打印生成清单（供 gen_bank_req_docx.js 引用）。 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
// 2.1 固定报表面板 key → bankXX.png；2.2 台账面板 key(led-XX) → bank_ledXX.png
const KEYS = ['01','02','03','04','05','06','07','08','09']
  .flatMap(k => [ {panel:k, png:'bank'+k+'.png'}, {panel:'led-'+k, png:'bank_led'+k+'.png'} ]);
const shotDir = path.join(base, 'shots');
if(!fs.existsSync(shotDir)) fs.mkdirSync(shotDir);

const srcHtml = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');

function buildShotPage(key){
  let h = srcHtml;
  // 概览区默认展开
  h = h.split('overview-area collapsed').join('overview-area');
  // 仅显示目标面板；隐藏平台顶栏与侧栏，内容区占满宽度（截图只包含报表面板本身）
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
  // 页面脚本同步执行；平台默认落在驾驶舱模块，先 switchTab 切到目标报表面板，再测尺寸写入 title
  h = h.replace('</body>', `<script>
(function(){
  switchTab(${JSON.stringify(key)});
  function size(){
    var w = document.documentElement.scrollWidth, H = Math.ceil(document.documentElement.scrollHeight);
    // 面板内横向滚动表格：按最宽 table 展开（撑开容器避免截断）
    document.querySelectorAll('#panel-' + ${JSON.stringify(key)} + ' .table-wrap').forEach(function(el){
      var t = el.querySelector('table');
      if(t) w = Math.max(w, Math.ceil(el.getBoundingClientRect().left + t.scrollWidth + 36));
    });
    return [Math.ceil(w), H];
  }
  setTimeout(function(){ var s = size(); document.title = 'PAGESIZE=' + s[0] + 'x' + s[1]; }, 300);
})();
</script></body>`);
  const f = path.join(base, '_shot_' + key + '.html');
  fs.writeFileSync(f, h, 'utf8');
  return f;
}

function chromeDumpSize(file){
  const out = execFileSync(CHROME, [
    '--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--window-size=1460,1000','--virtual-time-budget=4000',
    '--dump-dom', 'file:///' + file.replace(/\\/g,'/')
  ], { maxBuffer: 64*1024*1024 }).toString('utf8');
  const m = out.match(/PAGESIZE=(\d+)x(\d+)/);
  if(!m) throw new Error('未取到页面尺寸: ' + file);
  return { w: +m[1], h: +m[2] };
}

function chromeShot(file, png, w, h){
  execFileSync(CHROME, [
    '--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--default-background-color=FFFFFFFF',
    '--force-device-scale-factor=2',
    '--window-size=' + w + ',' + h,
    '--virtual-time-budget=4000',
    '--screenshot=' + png,
    'file:///' + file.replace(/\\/g,'/')
  ], { stdio: ['ignore','ignore','pipe'] });
}

for(const {panel, png} of KEYS){
  const f = buildShotPage(panel);
  const s = chromeDumpSize(f);
  const out = path.join(shotDir, png);
  chromeShot(f, out, s.w, s.h);
  const size = fs.statSync(out).size;
  console.log(`✓ ${panel}: ${s.w}x${s.h}px → ${png}（${(size/1024).toFixed(0)} KB）`);
}
console.log('截图完成，目录: ' + shotDir);
