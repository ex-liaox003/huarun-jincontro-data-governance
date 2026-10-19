/* 验证 sheets_data.js 结构 + HTML 内联 JS 语法 */
const fs = require('fs');
const path = require('path');
const base = __dirname;

let errors = [];
let ok = [];

// 1) 加载并校验 sheets_data.js
const src = fs.readFileSync(path.join(base, 'sheets_data.js'), 'utf8');
let SHEETS;
try {
  SHEETS = new Function(src + '; return SHEETS;')();
  ok.push('sheets_data.js 语法正确');
} catch (e) {
  console.log('FATAL: sheets_data.js 语法错误: ' + e.message);
  process.exit(1);
}

const keys = Object.keys(SHEETS);
if (keys.length !== 9) errors.push('sheet 数量 != 9, 实际 ' + keys.length);

keys.forEach(k => {
  const s = SHEETS[k];
  const row1 = s.headers[0];
  const row2 = s.headers[1] || [];
  let colCount = 0, leafCount = 0;
  row1.forEach(h => {
    colCount += (h.c || 1);
    if ((h.r || 1) <= 1) leafCount += (h.c || 1);
  });
  if (row2.length !== leafCount) errors.push(k + ': 二级表头列数 ' + row2.length + ' != ' + leafCount);
  s.rows.forEach((r, i) => {
    if (r.length !== colCount) errors.push(k + ' 第' + (i + 1) + '行: ' + r.length + ' 列 != ' + colCount);
  });
  if (s.rows.length !== s.count) errors.push(k + ': 数据行数 ' + s.rows.length + ' != count ' + s.count);
  // 层级数组校验
  if (!s.levels) errors.push(k + ': 缺少 levels 层级数组');
  else {
    if (s.levels.length !== s.rows.length) errors.push(k + ': levels 长度 ' + s.levels.length + ' != rows ' + s.rows.length);
    s.levels.forEach((v, i) => { if (![0, 1, 2].includes(v)) errors.push(k + ' 第' + (i + 1) + '行 level 非法: ' + v); });
  }
  // sheet 名中的 (N个) 为 Excel 原文标注，可能与实际行数不一致（如 06 标注26个实际30行）——仅提示不报错
  const m = s.name.match(/[(（]\s*(\d+)\s*个\s*[)）]/);
  if (m && parseInt(m[1]) !== s.count) ok.push(k + ': 名称标注 ' + m[1] + ' 个，实际 ' + s.count + ' 行（以 Excel 实际为准）');
  if (!s.kpi || s.kpi.length !== 4) errors.push(k + ': KPI 卡片不是 4 个');
  if (!s.chart || !s.chart2) errors.push(k + ': 缺少图表配置');
  ok.push(k + ' [' + s.name + '] ' + s.rows.length + '行 x ' + colCount + '列 ✓');
});

// 2) HTML 内联脚本语法校验
const html = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
scripts.forEach((s, i) => {
  try {
    new Function(s);
    ok.push('HTML 内联脚本 #' + (i + 1) + ' 语法正确 (' + s.length + ' 字符)');
  } catch (e) {
    errors.push('HTML 内联脚本 #' + (i + 1) + ' 语法错误: ' + e.message);
  }
});

// 3) 关键函数与引用存在性
['menuName', 'renderTabs', 'renderContent', 'getColTypes', 'renderTable', 'renderTableRow',
 'renderProgressCell', 'switchTab', 'exportSheet',
 'refreshSheet', 'querySheet', 'showToast'].forEach(fn => {
  if (!html.includes('function ' + fn)) errors.push('HTML 缺少函数: ' + fn);
});
if (!html.includes('sheets_data.js')) errors.push('HTML 未引用 sheets_data.js');
if (!/预算进度\|预算达成率/.test(html)) errors.push('预算达成率进度列识别未生效');
if (!html.includes("val==='★'")) errors.push('★ 考核高亮未生效');
if (!html.includes('indicator-name lv')) errors.push('指标名称层级 class 未生效');
if (!/indicator-name\.lv1/.test(html)) errors.push('lv1 缩进样式缺失');

console.log('=== 校验通过项 ===');
ok.forEach(x => console.log('  ✓ ' + x));
if (errors.length) {
  console.log('=== 发现错误 ===');
  errors.forEach(x => console.log('  ✗ ' + x));
  process.exit(1);
} else {
  console.log('=== 全部校验通过，无错误 ===');
}
