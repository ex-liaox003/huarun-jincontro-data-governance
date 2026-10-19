/* 将「华润银行-需求规格说明书.html」转换为交付用 Word 源文件（docx_src.html）。
   目标：产物在 Word 中打开即像人工编写的需求规格说明书——封面页/修订记录/目录占位、
   黑体标题+宋体正文、实线表格，原型示意图全部替换为系统页面截图（gen_bank_proto_shots.js 生成）。
   产物 docx_src.html 由 Word COM 打开，套用样式/页眉页脚/TOC 域后另存为 .docx（gen_bank_req_docx.ps1）。 */
const fs = require('fs');
const path = require('path');
const base = __dirname;
const SRC = path.join(base, '华润银行-需求规格说明书.html');
const OUT = path.join(base, 'docx_build.html');

let html = fs.readFileSync(SRC, 'utf8');

/* ===== 通用：从 '<div' 起始位置做 div 深度配对，返回匹配 </div> 之后的下标 ===== */
function divBlockEnd(s, from){
  let j = from, depth = 0;
  while(true){
    const open = s.indexOf('<div', j);
    const close = s.indexOf('</div>', j);
    if(close < 0) throw new Error('div 块未闭合 @' + from);
    if(open >= 0 && open < close){ depth++; j = open + 4; }
    else { depth--; j = close + 6; if(depth === 0) return j; }
  }
}

/* ===== 1) 去 web 专属结构：打印样式、目录锚点、viewport ===== */
function stripMediaPrint(s){
  const key = '@media print';
  let out = '', i = 0;
  while(true){
    const a = s.indexOf(key, i);
    if(a < 0) { out += s.slice(i); break; }
    let j = s.indexOf('{', a), depth = 0;
    for(; j < s.length; j++){
      if(s[j] === '{') depth++;
      else if(s[j] === '}'){ depth--; if(depth === 0){ j++; break; } }
    }
    out += s.slice(i, a);  // 仅拼接匹配块之前内容；块后内容由下一轮/退出时统一拼接
    i = j;
  }
  return out;
}
html = stripMediaPrint(html);
html = html.replace(/<a href="#[^"]*">/g, '').replace(/<\/a>/g, '');
html = html.replace(/<meta name="viewport"[^>]*>/, '');

/* ===== 2) Word 交付版样式：黑体标题 + 宋体正文 + 扁平灰表格头；去渐变/彩色徽章/web 观感 ===== */
const wordCss = `
/* ===== Word 交付版覆盖样式（gen_bank_req_docx.js 注入） ===== */
body{font-family:"宋体","SimSun",serif;color:#000;font-size:12pt;line-height:1.5;background:#fff;}
.page{box-shadow:none;max-width:none;margin:0;}
h2{font-family:'黑体';font-size:16pt;font-weight:bold;color:#000;border:none;background:none;padding:0;margin:17pt 0 10pt;page-break-after:avoid;}
h3{font-family:'黑体';font-size:14pt;font-weight:bold;color:#000;border:none;background:none;padding:0;margin:13pt 0 8pt;page-break-after:avoid;}
h4{font-family:'黑体';font-size:13pt;font-weight:bold;color:#000;border:none;background:none;padding:0;margin:10pt 0 6pt;page-break-after:avoid;}
h5{font-family:'黑体';font-size:12pt;font-weight:bold;color:#000;margin:10pt 0 6pt;page-break-after:avoid;}
h6{font-family:'黑体';font-size:12pt;font-weight:bold;color:#000;margin:8pt 0 4pt;page-break-after:avoid;}
p{margin:4pt 0;}
.brief{color:#000;}
.cnt{color:#808080;font-size:10pt;font-weight:normal;}
ul.tight,ol.tight{margin:4pt 0 4pt 24px;}
ul.tight li,ol.tight li{margin:2pt 0;}
table{page-break-inside:auto;}
tr{page-break-inside:avoid;}
th{background:#E8ECF1;}
td{background:none;}
.tip{background:#E8ECF1;border:0.5pt solid #7F7F7F;border-radius:0;padding:6pt 9pt;color:#000;font-size:10.5pt;}
.confirm-box{background:#E8ECF1;border:0.5pt solid #7F7F7F;border-radius:0;padding:6pt 9pt;color:#000;}
.tt{display:inline;background:none;color:#000;font-weight:normal;padding:0;border-radius:0;}
.tt-point,.tt-period{background:none;color:#000;}
.tag{display:inline;background:none;color:#000;font-weight:normal;padding:0;}
.tag.assess,.tag.hq{background:none;color:#000;}
.xmark{color:#000;font-weight:bold;}
.hl-exp{background:#FFF2CC;color:#000;padding:0;}
.ph{color:#404040;letter-spacing:0;}
</style>
<style>
@page Section1 {size:595.3pt 841.9pt; margin:2.54cm 2.6cm 2.54cm 2.6cm; mso-header-margin:1.5cm; mso-footer-margin:1.75cm;}
div.Section1 {page:Section1;}
</style>`;
html = html.replace('</style>', wordCss);

/* ===== 3) 表格补内联黑色细边框（Word 2007 对纯 CSS 边框支持差） ===== */
html = html.replace(/<table(?![^>]*\bborder=)/g,
  '<table border="1" cellspacing="0" cellpadding="4" style="border:0.5pt solid #000000;border-collapse:collapse;"');

/* ===== 4) 2.1 分报表「（5）系统原型示意图」：复刻示意图 → 系统页面截图 bank0X.png ===== */
for(let i=1;i<=9;i++){
  const key = '0'+i;
  const a = html.indexOf('<section id="sheet-'+key+'">');
  if(a < 0) throw new Error('未找到 sheet-'+key);
  const p = html.indexOf('<div class="proto">', a);
  const c = html.indexOf('</section>', a);
  if(p < 0 || c < 0 || p > c) throw new Error('sheet-'+key+' 内未找到 proto 块');
  const img = '<p align="center" style="margin:8pt 0"><img src="shots/bank'+key+'.png" width="620" style="width:100%;max-width:100%;border:0.5pt solid #7F7F7F;"/></p>';
  html = html.slice(0, p) + img + html.slice(c); // proto 块整体（至 </section> 前）替换为截图
}

/* ===== 4b) 2.2 台账「2.2.5 系统原型示意图」：复刻示意图 → 台账页面截图 bank_led0X.png ===== */
{
  const ledgerAt = html.indexOf('id="ledger"');
  if(ledgerAt < 0) throw new Error('未找到 ledger 章节');
  let cursor = ledgerAt;
  for(let i=1;i<=9;i++){
    const key = '0'+i;
    const p = html.indexOf('<div class="proto">', cursor);
    if(p < 0) throw new Error('台账区 proto 块不足: 第'+i+'个未找到');
    const end = divBlockEnd(html, p);
    const img = '<p align="center" style="margin:8pt 0"><img src="shots/bank_led'+key+'.png" width="620" style="width:100%;max-width:100%;border:0.5pt solid #7F7F7F;"/></p>';
    html = html.slice(0, p) + img + html.slice(end);
    cursor = p + img.length;
  }
  if(html.indexOf('<div class="proto">') >= 0) throw new Error('仍有残留 proto 块');
}

/* 示意图提示语统一为「真实页面截图」口径 */
html = html.split('以下为本报表<b>当前系统页面的静态示意图</b>（含演示数值与页面控件样式）；页面交互（期间切换、概览收起、导出等）仅作样式参考。')
           .join('以下截图取自<b>当前系统页面实机界面</b>（演示数据；下拉、按钮等控件为页面原样，Word 内不可交互）。');
html = html.split('以下为各报表台账的<b>当前系统页面静态示意图</b>（含演示数值与页面控件样式）；交互（年度切换、导出等）仅作样式参考。')
           .join('以下截图取自<b>当前系统页面实机界面</b>（演示数据；下拉、按钮等控件为页面原样，Word 内不可交互）。');

/* ===== 5) 文档级版式重构：封面页 / 修订记录 / 目录占位 / 全文完 ===== */
/* 5a) 封面：替换原渐变 web 头图为规范封面（独立成页） */
{
  const a = html.indexOf('<div class="cover">');
  if(a < 0) throw new Error('未找到封面块');
  const end = divBlockEnd(html, a);
  const cover = `
<p align="center" style="margin:170pt 0 0 0;font-family:'黑体';font-size:26pt;font-weight:bold;">华润银行模块</p>
<p align="center" style="margin:0;font-family:'黑体';font-size:26pt;font-weight:bold;">数据应用需求文档</p>
<p align="center" style="margin:16pt 0 0 0;font-size:13pt;">金控指标体系数据应用平台 —— 固定报表管理 / 报表台账管理</p>
<p align="center" style="margin:150pt 0 0 0;font-size:13pt;">文档版本：V1.3</p>
<p align="center" style="margin:6pt 0 0 0;font-size:13pt;">编制日期：2026-09-29</p>
<p align="center" style="margin:6pt 0 0 0;font-size:13pt;">修订日期：2026-10-08</p>
<p align="center" style="margin:6pt 0 0 0;font-size:13pt;">密　　级：内部资料</p>
<p style="margin:0;page-break-after:always;">&nbsp;</p>`;
  html = html.slice(0, a) + cover + html.slice(end);
}
/* 5b) 修订记录：封面之后、目录之前 */
{
  const revision = `
<p align="center" style="margin:0 0 10pt 0;font-family:'黑体';font-size:16pt;font-weight:bold;">修 订 记 录</p>
<table border="1" cellspacing="0" cellpadding="4" style="border:0.5pt solid #000000;border-collapse:collapse;">
<thead><tr><th style="width:12%;">版本</th><th style="width:16%;">日期</th><th>修订说明</th><th style="width:12%;">编制</th><th style="width:12%;">审核</th></tr></thead>
<tbody>
<tr><td>V1.0～V1.2</td><td>2026-09-29 及以前</td><td>初稿：固定报表管理（华润银行）9 张报表页面框架、指标清单、展示与取值规则；权限说明与业务确认。</td><td></td><td></td></tr>
<tr><td>V1.3</td><td>2026-10-08</td><td>①报表台账管理需求（2.2）定稿：台账页面结构、取数与展示规则（季度台账展示至最近已完结季度）、查询与导出；②固定报表导出说明（导出样式、导出文件名称）定稿；③2.1/2.2 系统原型示意图更新为系统实机截图。</td><td></td><td></td></tr>
</tbody>
</table>
<p style="margin:0;page-break-after:always;">&nbsp;</p>`;
  const t = html.indexOf('<h2 id="toc">');
  if(t < 0) throw new Error('未找到目录标题');
  html = html.slice(0, t) + revision + html.slice(t);
}
/* 5c) 目录：web 锚点列表 → 「目 录」标题 + TOC 域占位（Word COM 插入自动目录） */
{
  const a = html.indexOf('<h2 id="toc">');
  const b = html.indexOf('</ul>', a);
  if(a < 0 || b < 0) throw new Error('未找到目录列表');
  const tocBlock = "<p align=\"center\" style=\"margin:0 0 10pt 0;font-family:'黑体';font-size:16pt;font-weight:bold;\">目　录</p>\n<p>__TOC_PLACEHOLDER__</p>";
  html = html.slice(0, a) + tocBlock + html.slice(b + 5);
}
/* 5d) 正文从新的一页开始 */
html = html.replace('<h2 id="intro">', '<p style="margin:0;page-break-before:always;">&nbsp;</p>\n<h2 id="intro">');
/* 5e) 文末：生成信息行 → 全文完 */
{
  const a = html.indexOf('<div class="footer">');
  if(a >= 0){
    const end = divBlockEnd(html, a);
    html = html.slice(0, a) + '<p style="margin:24pt 0 0 0;text-align:center;color:#404040;">（全文完）</p>' + html.slice(end);
  }
}
/* 5f) 文本清理：红叉 → ×；去掉 tip 前缀的 💡 */
html = html.split('<span class="xmark">✗</span>').join('<span class="xmark">×</span>');
html = html.split('💡 ').join('');
html = html.split('💡').join('');

/* ===== 自检：章节/图数量与源文件一致，防止替换逻辑引发内容重复或丢失 ===== */
{
  const srcTxt = fs.readFileSync(SRC, 'utf8');
  const nSec = html.match(/<section id="sheet-0\d">/g) || [];
  if(nSec.length !== 9) throw new Error('section 数异常: '+nSec.length);
  const imgN = (html.match(/<img src="shots\/bank/g)||[]).length;
  if(imgN !== 18) throw new Error('截图占位数 != 18（2.1×9 + 2.2×9），实际 '+imgN);
  const protoN = (html.match(/<div class="proto">/g)||[]).length;
  if(protoN !== 0) throw new Error('proto 块未全部替换，残留 '+protoN+' 处');
  const bodyN = (html.match(/<div class="body">/g)||[]).length;
  const srcBodyN = (srcTxt.match(/<div class="body">/g)||[]).length;
  if(bodyN !== srcBodyN) throw new Error('body 容器数不一致: '+bodyN+' != '+srcBodyN);
  if((srcTxt.match(/<img/g)||[]).length !== 0 && (html.match(/<img/g)||[]).length !== 18)
    throw new Error('img 数异常');
}

/* ===== 6) 正文包进 Section1 + Office 命名空间 ===== */
html = html.replace(/<body>/, '<body>\n<div class="Section1">').replace(/<\/body>/, '</div>\n</body>');
html = html.replace(/<html lang="zh-CN">/, '<html lang="zh-CN" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">');

fs.writeFileSync(OUT, html, 'utf8');
console.log('✓ Word 源文件已生成: ' + OUT + '（' + (html.length/1024).toFixed(0) + ' KB）');
