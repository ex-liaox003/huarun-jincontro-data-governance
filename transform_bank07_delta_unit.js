// 07-利率结构 优化（2026-09-24）：同比、较年初列数据值追加单位 ppt
//  利率类指标（单位 %）的变动值口径为百分点，与 KPI 卡片 trend（-0.22ppt）及华润保险 ROE 行（+0.8ppt）惯例一致
//  区间限定文本手术：仅处理 "07" 区域内 rows 每行第 8/9 个元素（index 7/8），纯数值才追加，避免重复加单位
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'sheets_data.js');
const src = fs.readFileSync(file, 'utf8');

const s07 = src.indexOf('"07": {');
const s08 = src.indexOf('"08": {');
if (s07 < 0 || s08 < 0 || s08 <= s07) throw new Error('sheet 07 region not found');
let region = src.slice(s07, s08);

const rowsStart = region.indexOf('"rows": [');
const rowsEnd = region.indexOf('\n    ],', rowsStart);
if (rowsStart < 0 || rowsEnd < 0) throw new Error('rows region not found');
const rowsTxt = region.slice(rowsStart, rowsEnd);

const out = [];
let inRow = false, elIdx = 0, rows = 0, patched = 0;
rowsTxt.split('\n').forEach(line => {
  if (!inRow && /^ {6}\[$/.test(line)) { inRow = true; elIdx = 0; rows++; out.push(line); return; }
  if (inRow && /^ {6}\]/.test(line)) {
    if (elIdx !== 9) throw new Error('row ' + rows + ' len=' + elIdx);
    inRow = false; out.push(line); return;
  }
  const m = inRow && line.match(/^ {8}"([+-]?\d+(?:\.\d+)?)"(,?)$/);
  if (m && (elIdx === 7 || elIdx === 8)) {
    out.push('        "' + m[1] + 'ppt"' + m[2]);
    patched++;
  } else {
    out.push(line);
  }
  if (inRow && /^ {8}"/.test(line)) elIdx++;
});
if (rows !== 15 || patched !== 30) throw new Error('rows=' + rows + ' patched=' + patched);
region = region.slice(0, rowsStart) + out.join('\n') + region.slice(rowsEnd);

// 文件头注释补充
let head = src.slice(0, s07);
const anchor = ' ============================================================ */';
head = head.replace(anchor,
  '   - 2026-09-24：07-利率结构——同比/较年初列数据值追加单位 ppt（利率类指标变动值为百分点口径）\n' + anchor);

fs.writeFileSync(file, head + region + src.slice(s08));
console.log('OK rows=' + rows + ' patched=' + patched);
