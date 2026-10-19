/* ============================================================
   华润银行报表数据一致性转换（2026-09-17）
   规则：是否考核指标为 ★/是 的行 → 全年预算、预算达成率必须有值（缺失则报错提示）
        非考核行 → 全年预算、预算达成率一律置 '-'（页面渲染为灰色 --）
   涉及表：02/03/04/06/08/09（01/05/07 无此三列，跳过）
   方式：JSON 安全往返（文件主体为纯 JSON，头注释单独保留并追加说明）
   ============================================================ */
const fs = require('fs');
const FILE = __dirname + '/sheets_data.js';
const src = fs.readFileSync(FILE, 'utf8');

// 分离头注释与 JSON 主体
const startMark = 'const SHEETS = ';
const si = src.indexOf(startMark);
if (si < 0) { console.error('未找到 const SHEETS = 起始标记'); process.exit(1); }
let header = src.slice(0, si);
let body = src.slice(si + startMark.length).trim();
if (!body.endsWith(';')) { console.error('主体结尾非分号'); process.exit(1); }
body = body.slice(0, -1);

const SHEETS = JSON.parse(body);

// [是否考核col, 全年预算col, 预算达成率col, 指标名称col]
const CFG = {
  '02': [3, 8, 9, 1],
  '03': [4, 10, 11, 2],
  '04': [5, 10, 11, 3],
  '06': [5, 10, 11, 3],
  '08': [5, 10, 11, 3],
  '09': [4, 9, 10, 2]
};

let cleared = 0, kept = 0, missing = [];
const perSheet = {};
for (const k of Object.keys(CFG)) {
  const [ai, bi, ci, ni] = CFG[k];
  let n = 0;
  SHEETS[k].rows.forEach((r, idx) => {
    const assessed = (r[ai] === '★' || r[ai] === '是');
    if (assessed) {
      // 考核行必须有值
      const bad = [];
      if (!r[bi] || r[bi] === '-') bad.push('全年预算');
      if (!r[ci] || r[ci] === '-') bad.push('预算达成率');
      if (bad.length) missing.push(k + ' 行' + (idx + 1) + ' ' + r[ni] + ' 缺' + bad.join('/'));
      else kept++;
    } else {
      // 非考核行：预算/达成率置 '-'
      let changed = false;
      if (r[bi] !== '-') { r[bi] = '-'; changed = true; }
      if (r[ci] !== '-') { r[ci] = '-'; changed = true; }
      if (changed) { cleared++; n++; }
    }
  });
  perSheet[k] = n;
}

if (missing.length) {
  console.error('!! 发现考核行缺值（需人工补数）：\n' + missing.join('\n'));
  process.exit(1);
}

// 更新头注释：追加本次规则说明
const note = '   - 2026-09-17：预算一致性规则——仅考核指标（★）保留全年预算/预算达成率值，非考核行置 \'-\'（页面显示灰色 --）\n';
if (!header.includes('2026-09-17：预算一致性规则')) {
  header = header.replace(/(\r?\n)(\s*=+ \*\/)/, '$1' + note + '$2');
}

const out = header + startMark + JSON.stringify(SHEETS, null, 2) + ';\n';
fs.writeFileSync(FILE, out, 'utf8');
console.log('转换完成：非考核行置 - 共', cleared, '处；考核行保持有值', kept, '行');
console.log('分表替换行数：', JSON.stringify(perSheet));
