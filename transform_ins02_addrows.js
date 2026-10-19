// ins02 新增两行：银保保费规模后+产融创新场景保费规模；银保佣金收入后+产融创新场景佣金收入
// 联动：序号重排(44→46)、levels 插入、指标分类/分项 rowspan 合并区间位移、count 更新
const fs = require('fs');
const vm = require('vm');
const file = 'insurance_sheets_data.js';
let txt = fs.readFileSync(file, 'utf8');
const sb = {}; vm.createContext(sb);
vm.runInContext(txt + ';globalThis.__S=INSURANCE_SHEETS;', sb);
const s = sb.__S.ins02;

const rows = s.rows.map(r => r.slice());
const i = rows.findIndex(r => r[3] === '银保保费规模');           // 旧序号12 → idx11
const j = rows.findIndex(r => r[3] === '银保佣金收入');           // 旧序号34 → idx33
if (i < 0 || j < 0) throw new Error('anchor row not found');
// 演示值口径：当月值=截止本月末/12（金额指标惯例）；新行=其「其中：」子项之和（保费 22,800+11,800+26,500=61,100；佣金 3,500+1,500+4,200=9,200）
rows.splice(i + 1, 0, ["", "", "产融业务保费明细", "产融创新场景保费规模", "万元", "", "5,091.67", "+1.9%", "61,100.00", "+14.8%", "", ""]);
rows.splice(j + 2, 0, ["", "", "产融业务佣金明细", "产融创新场景佣金收入", "万元", "", "766.67", "+1.8%", "9,200.00", "+16.2%", "", ""]);
rows.forEach((r, idx) => r[0] = String(idx + 1));

const lv = s.levels.slice();
lv.splice(i + 1, 0, 1);      // 新保费行 = 二级
lv.splice(j + 2, 0, 1);      // 新佣金行 = 二级（第一次插入后索引+1，再在其后插）

// ---- 回写 rows 块 ----
const block = rows.map(r => '      [' + r.map(c => JSON.stringify(c)).join(',') + ']').join(',\n');
const p0 = txt.indexOf('"ins02"');
const rowsStart = txt.indexOf('    rows: [', p0);
const p1 = txt.indexOf('\n    ],\n    chart:', rowsStart);
if (rowsStart < 0 || p1 < 0) throw new Error('rows block not found');
txt = txt.slice(0, rowsStart) + '    rows: [\n' + block + txt.slice(p1);

// ---- 回写 levels ----
const lvStart = txt.indexOf('    levels: [', p0);
const lvEnd = txt.indexOf('],', lvStart);
txt = txt.slice(0, lvStart) + '    levels: [' + lv.join(',') + txt.slice(lvEnd);

// ---- 回写 spans（合并区间按新行号重算） ----
const spStart = txt.indexOf('    spans: [', p0);
const spEnd = txt.indexOf('    ],', spStart);
const newSpans = `    spans: [
      {col:1,row:0,rs:23},{col:1,row:23,rs:23},
      {col:2,row:2,rs:2},{col:2,row:6,rs:2},{col:2,row:8,rs:7},{col:2,row:16,rs:3},
      {col:2,row:25,rs:2},{col:2,row:29,rs:2},{col:2,row:31,rs:7},{col:2,row:39,rs:3}
`;
txt = txt.slice(0, spStart) + newSpans + txt.slice(spEnd);

// ---- count ----
if (!txt.includes('    count: 44,')) throw new Error('count 44 not found');
txt = txt.replace('    count: 44,', '    count: 46,');

fs.writeFileSync(file, txt);
console.log('完成: rows=' + rows.length + ', levels=' + lv.length);
console.log('新行位置: 保费序号' + (i + 2) + ' / 佣金序号' + (j + 3));
