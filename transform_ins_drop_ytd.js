/* 一次性转换：华润保险 3 张表删除「较年初(%)」列（表头+所有行） */
const fs = require('fs');
const f = 'insurance_sheets_data.js';
let lines = fs.readFileSync(f, 'utf8').split('\n');
let rowFix = 0, headFix = 0, subFix = 0;
lines = lines.map(line => {
  if (line.includes('{l:"截止本月末",c:3}')) { headFix++; return line.replace('{l:"截止本月末",c:3}', '{l:"截止本月末",c:2}'); }
  if (line.includes('{l:"较年初(%)"}}]')) { subFix++; return line.replace(',{l:"较年初(%)"}}]', '}]'); }
  if (/^\s*\["\d+"/.test(line)) {
    const tokens = line.split('","');
    if (tokens.length === 10) { tokens.splice(7, 1); rowFix++; return tokens.join('","'); }
    if (tokens.length === 13) { tokens.splice(10, 1); rowFix++; return tokens.join('","'); }
    console.log('UNEXPECTED tokens=' + tokens.length + ' :: ' + line.slice(0, 60));
  }
  return line;
});
console.log('headFix=' + headFix + ' subFix=' + subFix + ' rowFix=' + rowFix);
if (headFix !== 3 || subFix !== 3 || rowFix !== 52) { console.log('COUNT MISMATCH'); process.exit(1); }
let s = lines.join('\n');
s = s.replace('· 「截止本月末」分组：实际 / 同比(%) / 较年初(%)', '· 「截止本月末」分组：实际 / 同比(%)（较年初(%) 列按 2026-09 要求删除）');
fs.writeFileSync(f, s);
console.log('OK');
