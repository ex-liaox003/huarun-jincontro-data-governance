/* 将「预算值填报-需求规格说明书.html」转换为 Word 源文件（docx_build_bud.html）。
   样式对齐「华润银行-数据应用需求文档.docx」生成链（gen_bank_req_docx.js 简化版）：
   封面页 / 修订记录 / 目录占位（TOC 域）/ 黑体标题+宋体正文 / 实线表格 / 全文完。
   产物由 Word COM 打开，套用样式/页眉页脚/TOC 域后另存为 .docx（gen_bud_req_docx.ps1）。 */
const fs = require('fs');
const path = require('path');
const base = __dirname;
const SRC = path.join(base, '预算值填报-需求规格说明书.html');
const OUT = path.join(base, 'docx_build_bud.html');

let html = fs.readFileSync(SRC, 'utf8');

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
    out += s.slice(i, a);
    i = j;
  }
  return out;
}
html = stripMediaPrint(html);
html = html.replace(/<a href="#[^"]*">/g, '').replace(/<\/a>/g, '');
html = html.replace(/<meta name="viewport"[^>]*>/, '');

/* ===== 2) Word 交付版样式：黑体标题 + 宋体正文 + 扁平灰表格头 ===== */
const wordCss = `
/* ===== Word 交付版覆盖样式（gen_bud_req_docx.js 注入） ===== */
body{font-family:"宋体","SimSun",serif;color:#000;font-size:12pt;line-height:1.5;background:#fff;}
.page{box-shadow:none;max-width:none;margin:0;}
h2{font-family:'黑体';font-size:16pt;font-weight:bold;color:#000;border:none;background:none;padding:0;margin:17pt 0 10pt;page-break-after:avoid;}
h3{font-family:'黑体';font-size:14pt;font-weight:bold;color:#000;border:none;background:none;padding:0;margin:13pt 0 8pt;page-break-after:avoid;}
h4{font-family:'黑体';font-size:13pt;font-weight:bold;color:#000;border:none;background:none;padding:0;margin:10pt 0 6pt;page-break-after:avoid;}
p{margin:4pt 0;}
.brief{color:#000;}
ul.tight,ol.tight{margin:4pt 0 4pt 24px;}
ul.tight li,ol.tight li{margin:2pt 0;}
table{page-break-inside:auto;}
tr{page-break-inside:avoid;}
th{background:#E8ECF1;}
td{background:none;}
.tip{background:#E8ECF1;border:0.5pt solid #7F7F7F;border-radius:0;padding:6pt 9pt;color:#000;font-size:10.5pt;}
.req-star{color:#000;font-weight:bold;}
.btn-demo{background:none;border:0.5pt solid #7F7F7F;border-radius:0;padding:0 3pt;color:#000;font-weight:normal;}
code{background:none;border:none;color:#000;font-family:'宋体';font-size:10.5pt;}
.footer{border:none;padding:0;color:#000;}
</style>
<style>
@page Section1 {size:595.3pt 841.9pt; margin:2.54cm 2.6cm 2.54cm 2.6cm; mso-header-margin:1.5cm; mso-footer-margin:1.75cm;}
div.Section1 {page:Section1;}
</style>`;
html = html.replace('</style>', wordCss);

/* ===== 3) 表格补内联黑色细边框（Word 对纯 CSS 边框支持差） ===== */
html = html.replace(/<table(?![^>]*\bborder=)/g,
  '<table border="1" cellspacing="0" cellpadding="4" style="border:0.5pt solid #000000;border-collapse:collapse;"');

/* ===== 4) 封面页：替换渐变 web 头为规范封面（独立成页） ===== */
{
  const a = html.indexOf('<div class="cover">');
  if(a < 0) throw new Error('未找到封面块');
  const end = divBlockEnd(html, a);
  const cover = `
<p align="center" style="margin:170pt 0 0 0;font-family:'黑体';font-size:26pt;font-weight:bold;">预算值填报</p>
<p align="center" style="margin:0;font-family:'黑体';font-size:26pt;font-weight:bold;">数据应用需求文档</p>
<p align="center" style="margin:16pt 0 0 0;font-size:13pt;">金控指标体系数据应用平台 —— 数据应用 / 预算值填报管理</p>
<p align="center" style="margin:150pt 0 0 0;font-size:13pt;">文档版本：V1.0</p>
<p align="center" style="margin:6pt 0 0 0;font-size:13pt;">编制日期：2026-10-28</p>
<p align="center" style="margin:6pt 0 0 0;font-size:13pt;">密　　级：内部资料</p>
<p style="margin:0;page-break-after:always;">&nbsp;</p>`;
  html = html.slice(0, a) + cover + html.slice(end);
}

/* ===== 5) 修订记录 + 目录占位：替换原「目 录」锚点列表 ===== */
{
  const a = html.indexOf('<h2>目 录</h2>');
  if(a < 0) throw new Error('未找到目录标题');
  const b = html.indexOf('</ol>', a);
  if(b < 0) throw new Error('未找到目录列表结尾');
  const repl = `
<p align="center" style="margin:0 0 10pt 0;font-family:'黑体';font-size:16pt;font-weight:bold;">修 订 记 录</p>
<table border="1" cellspacing="0" cellpadding="4" style="border:0.5pt solid #000000;border-collapse:collapse;">
<thead><tr><th style="width:12%;">版本</th><th style="width:16%;">日期</th><th>修订说明</th><th style="width:12%;">编制</th><th style="width:12%;">审核</th></tr></thead>
<tbody>
<tr><td>V1.0</td><td>2026-10-28</td><td>初稿：预算值填报页面功能需求定稿（指标清单自动加载、编辑填写、导入导出、提交校验、权限说明、业务确认）。后续补充：查询条件数据字典（业务单元/预算年度）、导入校验规则（表头与格式、指标匹配、跨年度拦截）、导出范围说明。</td><td></td><td></td></tr>
</tbody>
</table>
<p style="margin:0;page-break-after:always;">&nbsp;</p>
<p align="center" style="margin:0 0 10pt 0;font-family:'黑体';font-size:16pt;font-weight:bold;">目　录</p>
<p>__TOC_PLACEHOLDER__</p>`;
  html = html.slice(0, a) + repl + html.slice(b + 5);
}

/* ===== 6) 正文从新的一页开始；页脚 → 全文完 ===== */
html = html.replace('<h2 id="s1">', '<p style="margin:0;page-break-before:always;">&nbsp;</p>\n<h2 id="s1">');
{
  const a = html.indexOf('<div class="footer">');
  if(a >= 0){
    const end = divBlockEnd(html, a);
    html = html.slice(0, a) + '<p style="margin:24pt 0 0 0;text-align:center;color:#404040;">（全文完）</p>' + html.slice(end);
  }
}
/* 清理 emoji 按钮图标（Word 宋体下渲染不稳） */
html = html.split('🖊 ').join('').split('🖊').join('');
html = html.split('✅ ').join('').split('✅').join('');
html = html.split('📤 ').join('').split('📤').join('');
html = html.split('📥 ').join('').split('📥').join('');
html = html.split('✏️ ').join('').split('✏️').join('');
html = html.split('👁 ').join('').split('👁').join('');

/* ===== 7) 自检：章节数与源文件一致 ===== */
{
  const srcTxt = fs.readFileSync(SRC, 'utf8');
  const nH2 = (html.match(/<h2/g) || []).length;
  const srcH2 = (srcTxt.match(/<h2/g) || []).length - 1;   // 源含目录 h2，已替换
  if(nH2 !== srcH2) throw new Error('h2 数异常: ' + nH2 + ' != ' + srcH2);
  const nH3 = (html.match(/<h3/g) || []).length;
  const srcH3 = (srcTxt.match(/<h3/g) || []).length;
  if(nH3 !== srcH3) throw new Error('h3 数异常: ' + nH3 + ' != ' + srcH3);
}

/* ===== 8) 正文包进 Section1 + Office 命名空间 ===== */
html = html.replace(/<body>/, '<body>\n<div class="Section1">').replace(/<\/body>/, '</div>\n</body>');
html = html.replace(/<html lang="zh-CN">/, '<html lang="zh-CN" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">');

fs.writeFileSync(OUT, html, 'utf8');
console.log('✓ Word 源文件已生成: ' + OUT + '（' + (html.length/1024).toFixed(0) + ' KB）');
