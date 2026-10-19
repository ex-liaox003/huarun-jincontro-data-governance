/* 将「华润保险-需求规格说明书.html」转换为交付用 Word 源文件（docx_build_ins.html）。
   流程与 gen_bank_req_docx.js 一致；差异：3 张报表 / 6 张截图（已内嵌 img，无 proto 块）。
   产物由 Word COM 打开（gen_ins_req_docx.ps1），套用样式/页眉页脚/TOC 域后另存为 .docx。 */
const fs = require('fs');
const path = require('path');
const base = __dirname;
const SRC = path.join(base, '华润保险-需求规格说明书.html');
const OUT = path.join(base, 'docx_build_ins.html');

let html = fs.readFileSync(SRC, 'utf8');

/* ===== 通用：div 深度配对 ===== */
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

/* ===== 1) 去 web 专属结构：打印样式、目录锚点 ===== */
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
    out += s.slice(i, a);
    i = j;
  }
  return out;
}
html = stripMediaPrint(html);
html = html.replace(/<a href="#[^"]*">/g, '').replace(/<\/a>/g, '');
html = html.replace(/<meta name="viewport"[^>]*>/, '');

/* ===== 2) Word 交付版样式（与银行文档一致） ===== */
const wordCss = `
/* ===== Word 交付版覆盖样式（gen_ins_req_docx.js 注入） ===== */
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
/* 提示/说明框与导出高亮：去背景、去边框，黑色正文字号，按普通段落展示（2026-10-12 业务反馈） */
.tip{background:none;border:none;border-radius:0;padding:0;color:#000;font-size:12pt;margin:4pt 0;}
.confirm-box{background:none;border:none;border-radius:0;padding:0;color:#000;margin:4pt 0;}
.dev-box{background:none;border:none;border-radius:0;padding:0;color:#000;font-size:12pt;margin:4pt 0;}
.tt{display:inline;background:none;color:#000;font-weight:normal;padding:0;border-radius:0;}
.tt-point,.tt-period{background:none;color:#000;}
.tag{display:inline;background:none;color:#000;font-weight:normal;padding:0;}
.tag.assess,.tag.hq{background:none;color:#000;}
.xmark{color:#000;font-weight:bold;}
.hl-exp{background:none;color:#000;padding:0;}
.ph{color:#000;letter-spacing:0;}
code{background:none;color:#000;font-family:inherit;}
/* 圆点列表 → 序号列表（2026-10-12 业务反馈） */
ul.tight{list-style:decimal;}
</style>
<style>
@page Section1 {size:595.3pt 841.9pt; margin:2.54cm 2.6cm 2.54cm 2.6cm; mso-header-margin:1.5cm; mso-footer-margin:1.75cm;}
div.Section1 {page:Section1;}
</style>`;
html = html.replace('</style>', wordCss);

/* ===== 3) 表格补内联黑色细边框 ===== */
html = html.replace(/<table(?![^>]*\bborder=)/g,
  '<table border="1" cellspacing="0" cellpadding="4" style="border:0.5pt solid #000000;border-collapse:collapse;"');

/* ===== 3c) 去背景色段落：Word 2007 导入对 .dev-box/.tip 等类的 CSS 覆盖不稳定
   （直接剥离类名，使基础样式选择器失效，段落回落为普通黑色正文段落）。 ===== */
html = html.replace(/ class="(tip|dev-box|confirm-box)"/g, '');

/* ===== 3b) 圆点列表 → 序号列表（2026-10-12 业务反馈）
   Word 2007 HTML 导入忽略 CSS list-style，仅按 ul/ol 标签映射 List Bullet/List Number；
   故这里把 ul.tight 整体转为 ol.tight（tight 列表无嵌套 ul，配对安全）。 */
{
  const before = (html.match(/<ul class="tight">/g) || []).length;
  html = html.replace(/<ul class="tight">([\s\S]*?)<\/ul>/g, '<ol class="tight">$1</ol>');
  const left = (html.match(/<ul class="tight">/g) || []).length;
  if(before === 0 || left !== 0) throw new Error('ul.tight 转换异常: before=' + before + ' left=' + left);
  console.log('✓ ul.tight → ol.tight: ' + before + ' 处');
}

/* ===== 4) 文档级版式重构：封面页 / 修订记录 / 目录占位 / 全文完 ===== */
{
  const a = html.indexOf('<div class="cover">');
  if(a < 0) throw new Error('未找到封面块');
  const end = divBlockEnd(html, a);
  const cover = `
<p align="center" style="margin:170pt 0 0 0;font-family:'黑体';font-size:26pt;font-weight:bold;">华润保险模块</p>
<p align="center" style="margin:0;font-family:'黑体';font-size:26pt;font-weight:bold;">数据应用需求文档</p>
<p align="center" style="margin:16pt 0 0 0;font-size:13pt;">金控指标体系数据应用平台 —— 固定报表管理 / 报表台账管理</p>
<p align="center" style="margin:150pt 0 0 0;font-size:13pt;">文档版本：V1.4</p>
<p align="center" style="margin:6pt 0 0 0;font-size:13pt;">编制日期：2026-10-10</p>
<p align="center" style="margin:6pt 0 0 0;font-size:13pt;">修订日期：2026-10-12</p>
<p align="center" style="margin:6pt 0 0 0;font-size:13pt;">密　　级：内部资料</p>
<p style="margin:0;page-break-after:always;">&nbsp;</p>`;
  html = html.slice(0, a) + cover + html.slice(end);
}
{
  const revision = `
<p align="center" style="margin:0 0 10pt 0;font-family:'黑体';font-size:16pt;font-weight:bold;">修 订 记 录</p>
<table border="1" cellspacing="0" cellpadding="4" style="border:0.5pt solid #000000;border-collapse:collapse;">
<thead><tr><th style="width:12%;">版本</th><th style="width:16%;">日期</th><th>修订说明</th><th style="width:12%;">编制</th><th style="width:12%;">审核</th></tr></thead>
<tbody>
<tr><td>V1.0</td><td>2026-10-10</td><td>初稿：固定报表管理（华润保险）3 张报表页面框架、指标清单、展示与取值规则；报表台账管理需求（台账页面结构、取数与展示规则、查询与导出）；权限说明与业务确认；2.1/2.2 系统原型示意图为系统实机截图。</td><td></td><td></td></tr>
<tr><td>V1.1</td><td>2026-10-12</td><td>按业务反馈修订：①需求背景表述调整（数据应用含固定报表管理、报表台账管理两模块）；②术语与定义：全年预算/预算达成率简化，考核指标口径更新，新增高质量指标条目；③固定报表年份下拉与台账年度范围可选起点由 2024 调整为 2023；④2.1.1.4 指标属性标签列补充取值逻辑（根据指标编号从指标台账中获取）。</td><td></td><td></td></tr>
<tr><td>V1.2</td><td>2026-10-12</td><td>按业务反馈排版优化：①全文圆点（项目符号）列表统一改为序号编号；②有背景色的段落（提示框、特别说明框、导出名称高亮等）取消背景色与边框，以黑色字体按普通段落展示。</td><td></td><td></td></tr>
<tr><td>V1.3</td><td>2026-10-12</td><td>按业务反馈修订 2.1.1.5 数值与涨跌显示规范：调整为 5 条编号规则——新增数值列千分位格式、保留 2 位小数口径；涨跌规范独立成条；同比/环比/较年初补充保留 2 位小数；占位符与比率类变动值规则保留（与华润银行模块文档口径一致）。</td><td></td><td></td></tr>
<tr><td>V1.4</td><td>2026-10-12</td><td>按业务反馈统一 2.1.1.7 指标计算公式说明：表结构与公式口径调整为与华润银行模块文档完全一致（含时点值/期间值 × 金额类/比率类 四行，补齐「较年初」列及其计算口径）。</td><td></td><td></td></tr>
</tbody>
</table>
<p style="margin:0;page-break-after:always;">&nbsp;</p>`;
  const t = html.indexOf('<h2 id="toc">');
  if(t < 0) throw new Error('未找到目录标题');
  html = html.slice(0, t) + revision + html.slice(t);
}
{
  const a = html.indexOf('<h2 id="toc">');
  const b = html.indexOf('</ul>', a);
  if(a < 0 || b < 0) throw new Error('未找到目录列表');
  const tocBlock = "<p align=\"center\" style=\"margin:0 0 10pt 0;font-family:'黑体';font-size:16pt;font-weight:bold;\">目　录</p>\n<p>__TOC_PLACEHOLDER__</p>";
  html = html.slice(0, a) + tocBlock + html.slice(b + 5);
}
html = html.replace('<h2 id="intro">', '<p style="margin:0;page-break-before:always;">&nbsp;</p>\n<h2 id="intro">');
{
  const a = html.indexOf('<div class="footer">');
  if(a >= 0){
    const end = divBlockEnd(html, a);
    html = html.slice(0, a) + '<p style="margin:24pt 0 0 0;text-align:center;color:#404040;">（全文完）</p>' + html.slice(end);
  }
}
html = html.split('<span class="xmark">✗</span>').join('<span class="xmark">×</span>');

/* ===== 5) 自检 ===== */
{
  const nSec = (html.match(/<section id="sheet-ins0\d">/g) || []).length;
  if(nSec !== 3) throw new Error('section 数异常: ' + nSec);
  const imgN = (html.match(/<img src="shots_ins\//g) || []).length;
  if(imgN !== 6) throw new Error('截图占位数 != 6（2.1×3 + 2.2×3），实际 ' + imgN);
}

/* ===== 6) 正文包进 Section1 + Office 命名空间 ===== */
html = html.replace(/<body>/, '<body>\n<div class="Section1">').replace(/<\/body>/, '</div>\n</body>');
html = html.replace(/<html lang="zh-CN">/, '<html lang="zh-CN" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">');

fs.writeFileSync(OUT, html, 'utf8');
console.log('✓ Word 源文件已生成: ' + OUT + '（' + (html.length/1024).toFixed(0) + ' KB）');
