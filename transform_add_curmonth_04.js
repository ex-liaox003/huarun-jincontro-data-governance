// 2026-09-23: 04-收入结构 — 在"去年末"列组后新增"当月值(实际/环比)"列组（同 02-损益表简表 2026-09-22 的做法）。
// 运行: node transform_add_curmonth_04.js
const fs = require('fs');
const FILE = 'sheets_data.js';

// 当月值(实际/环比) 按行号(1..21)：实际 = 去年末/12 保留两位（同 02 表口径），环比为 plausible MoM。
const CM = {
  1: ['27.38', '+1.2%'], 2: ['13.77', '+1.0%'], 3: ['6.88', '+0.9%'], 4: ['6.88', '+1.1%'],
  5: ['8.21', '+1.3%'], 6: ['3.77', '+0.8%'], 7: ['4.44', '+1.4%'], 8: ['4.36', '+1.5%'],
  9: ['1.04', '+0.7%'], 10: ['22.38', '+0.8%'], 11: ['11.04', '+0.9%'], 12: ['7.19', '+1.2%'],
  13: ['5.00', '+2.1%'], 14: ['2.38', '+1.5%'], 15: ['1.27', '+1.6%'], 16: ['1.15', '+1.4%'],
  17: ['1.88', '+2.2%'], 18: ['1.23', '+1.8%'], 19: ['1.88', '+2.4%'], 20: ['1.73', '+2.0%'],
  21: ['0.74', '+1.9%']
};

let src = fs.readFileSync(FILE, 'utf8');
const i04 = src.indexOf('  "04": {');
const i05 = src.indexOf('  "05": {');
if (i04 < 0 || i05 < 0) { console.error('sheet 04 block not found'); process.exit(1); }
let block = src.slice(i04, i05);

// 1) 表头 row1：在"去年末"后插入"当月值 c2"
const H1_OLD = `        {
          "l": "去年末",
          "r": 2
        },
        {
          "l": "截止本月末",`;
const H1_NEW = `        {
          "l": "去年末",
          "r": 2
        },
        {
          "l": "当月值",
          "c": 2
        },
        {
          "l": "截止本月末",`;
if (!block.includes(H1_OLD)) { console.error('header row1 pattern not found'); process.exit(1); }
block = block.replace(H1_OLD, H1_NEW);

// 2) 表头 row2：实际/同比/较年初 -> 实际/环比/实际/同比/较年初
const H2_OLD = `      [
        {
          "l": "实际"
        },
        {
          "l": "同比"
        },
        {
          "l": "较年初"
        }
      ]`;
const H2_NEW = `      [
        {
          "l": "实际"
        },
        {
          "l": "环比"
        },
        {
          "l": "实际"
        },
        {
          "l": "同比"
        },
        {
          "l": "较年初"
        }
      ]`;
if (!block.includes(H2_OLD)) { console.error('header row2 pattern not found'); process.exit(1); }
block = block.replace(H2_OLD, H2_NEW);

// 3) 数据行：在 idx6(去年末) 后插入 当月值(实际/环比)
const ROW_RE = /      \[\n((?:        "[^"]*",?\n)+)      \](,?)\n/g;
let count = 0;
block = block.replace(ROW_RE, (m, inner, comma) => {
  const toks = inner.split('\n').filter(Boolean).map(l => (l.match(/"([^"]*)"/) || [])[1]);
  const cm = CM[toks[0]];
  if (!cm || toks.length !== 12) return m;
  const nt = [...toks.slice(0, 7), cm[0], cm[1], ...toks.slice(7)];
  count++;
  return '      [\n' + nt.map((t, i) => `        "${t}"${i < nt.length - 1 ? ',' : ''}\n`).join('') + '      ]' + comma + '\n';
});
if (count !== 21) { console.error('row patch count ' + count + ' != 21'); process.exit(1); }

src = src.slice(0, i04) + block + src.slice(i05);
fs.writeFileSync(FILE, src);
console.log('sheet 04 updated: header + ' + count + ' rows');
