// 04-收入结构 优化（2026-09-24）：区间限定文本手术，不做 JSON 往返（文件内含 JS 注释）
//  1) 表头：「截止本月末」c:3→c:2，叶子删除「较年初」
//  2) 行数据：删除每行第 12 个元素（较年初值，14列 → 13列）
//  3) 文件头注释补充；指标卡片不显示较年初（HTML 侧 hideYtd 增加 key==='04'）
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'sheets_data.js');
const src = fs.readFileSync(file, 'utf8');

const s04 = src.indexOf('"04": {');
const s05 = src.indexOf('"05": {');
if (s04 < 0 || s05 < 0 || s05 <= s04) throw new Error('sheet 04 region not found');
let region = src.slice(s04, s05);

// --- 1) 表头 ---
let n1 = 0;
region = region.replace(/("l": "截止本月末",\s*\n(\s*)"c": )3/, (m, p1) => { n1++; return p1 + '2'; });
if (n1 !== 1) throw new Error('截止本月末 c:3 anchor count=' + n1);
let n2 = 0;
region = region.replace(/,\s*\n\s*\{\s*\n\s*"l": "较年初"\s*\n\s*\}/, () => { n2++; return ''; });
if (n2 !== 1) throw new Error('较年初 leaf anchor count=' + n2);

// --- 2) 行数据：每行删除第 12 个元素（index 11，较年初） ---
const rowsStart = region.indexOf('"rows": [');
const rowsEnd = region.indexOf('\n    ],', rowsStart);
if (rowsStart < 0 || rowsEnd < 0) throw new Error('rows region not found');
const rowsTxt = region.slice(rowsStart, rowsEnd);
const out = [];
let inRow = false, elIdx = 0, removed = 0, rows = 0;
rowsTxt.split('\n').forEach(line => {
  if (!inRow && /^ {6}\[$/.test(line)) { inRow = true; elIdx = 0; rows++; out.push(line); return; }
  if (inRow && /^ {6}\]/.test(line)) { inRow = false; out.push(line); return; }
  if (inRow && /^ {8}"/.test(line)) {
    if (elIdx === 11) { removed++; }        // 跳过较年初元素（整行删除，前序元素自带逗号）
    else out.push(line);
    elIdx++;
    return;
  }
  out.push(line);
});
if (rows !== 21 || removed !== 21) throw new Error('rows=' + rows + ' removed=' + removed);
region = region.slice(0, rowsStart) + out.join('\n') + region.slice(rowsEnd);

// --- 3) 文件头注释 ---
let head = src.slice(0, s04);
const anchor = ' ============================================================ */';
if (!head.includes(anchor)) throw new Error('comment anchor missing');
head = head.replace(anchor,
  '   - 2026-09-24：04-收入结构——删除「较年初」列（表头与全部明细行同步移除）；指标卡片不显示较年初\n' + anchor);

fs.writeFileSync(file, head + region + src.slice(s05));
console.log('OK rows=' + rows + ' removed=' + removed);
