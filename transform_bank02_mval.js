// 02-损益表简表 结构优化：
//  1) 表头：去年末后新增「当月值{实际/环比(%)}」列组；「截止本月末」c:3→c:2，叶子删除「较年初(%)」
//  2) 行数据：去年末后插入 [当月值实际, 环比]，删除原「较年初」元素（10列 → 11列）
//  3) 当月值实际 = 截止本月末实际 / 12（ flow 指标月均口径），环比为演示值
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'sheets_data.js');
let src = fs.readFileSync(file, 'utf8');
const mark = 'const SHEETS = ';
const i = src.indexOf(mark);
const head = src.slice(0, i);
const body = src.slice(i + mark.length).replace(/;\s*$/, '');
const S = JSON.parse(body);
const sh = S['02'];

// --- 表头 ---
const r1 = sh.headers[0];
const iYm = r1.findIndex(h => h.l === '去年末');
const iEom = r1.findIndex(h => h.l === '截止本月末');
if (iYm < 0 || iEom < 0) throw new Error('header anchor missing');
r1[iEom].c = 2;                                   // 截止本月末 3叶→2叶
r1.splice(iYm + 1, 0, { l: '当月值', c: 2 });      // 去年末后插入当月值组
sh.headers[1] = [{ l: '实际' }, { l: '环比(%)' }, { l: '实际' }, { l: '同比(%)' }];

// --- 行数据 ---
const MOM = ['+1.2%', '+0.8%', '+2.1%', '+1.5%', '+0.6%', '+1.8%', '-0.4%',
  '+1.1%', '+0.9%', '+1.4%', '-0.6%', '+1.6%', '+0.7%', '+1.3%'];
sh.rows.forEach((r, ri) => {
  if (r.length !== 10) throw new Error('row ' + ri + ' len=' + r.length);
  const eom = r[5];
  const mval = (eom === '-' || eom === '') ? '-' :
    (parseFloat(String(eom).replace(/,/g, '')) / 12).toFixed(2);
  const nr = r.slice(0, 5).concat([mval, MOM[ri]], [r[5], r[6]], [r[8], r[9]]);
  if (nr.length !== 11) throw new Error('new row len=' + nr.length);
  sh.rows[ri] = nr;
});

// --- 文件头注释补充 ---
let nh = head.replace(' ============================================================ */',
  '   - 2026-09-22：02-损益表简表——去年末后新增「当月值(实际/环比)」列组、删除「较年初」列；指标卡片不显示较年初\n ============================================================ */');
if (nh === head) throw new Error('comment anchor missing');

fs.writeFileSync(file, nh + mark + JSON.stringify(S, null, 2) + ';\n');
console.log('OK rows=' + sh.rows.length, 'cols=' + sh.rows[0].length);
console.log('header leaves:', sh.headers[1].map(h => h.l).join('/'));
console.log('row1:', r1.map(h => h.l + (h.c ? '(c' + h.c + ')' : '')).join(' | '));
console.log('row1 sample:', JSON.stringify(sh.rows[0]));
