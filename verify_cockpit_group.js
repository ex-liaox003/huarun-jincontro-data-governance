/* 校验驾驶舱集团总览：分组顺序 + 指标引用可解析 */
const fs = require('fs');
const path = require('path');
const base = __dirname;
const files = ['sheets_data.js', 'asset_sheets_data.js', 'trust_sheets_data.js', 'insurance_sheets_data.js', 'lease_sheets_data.js', 'cockpit_data.js'];
const src = files.map(f => fs.readFileSync(path.join(base, f), 'utf8')).join('\n');
const scope = new Function(src + '; return {SHEETS:SHEETS,ASSET_SHEETS:ASSET_SHEETS,TRUST_SHEETS:TRUST_SHEETS,INSURANCE_SHEETS:INSURANCE_SHEETS,LEASE_SHEETS:LEASE_SHEETS,COCKPITS:COCKPITS};')();
let bad = 0;
const co = scope.COCKPITS[0].companies[0];
co.groups.forEach(gr => {
  console.log('[' + gr.title + (gr.title2 ? ' | ' + gr.title2 : '') + ']');
  gr.picks.forEach(p => {
    const sh = scope[p.s] && scope[p.s][p.k];
    const allRows = sh ? (sh.rows || []).concat((sh.calibers || []).flatMap(c => c.rows || [])) : [];
    const hit = allRows.some(r => Array.isArray(r) && r.indexOf(p.row) >= 0);
    console.log('   ' + (hit ? '✓' : (bad++, '✗')) + ' ' + p.row + (p.mcals ? ' (口径切换)' : ''));
  });
});
console.log(bad ? '存在 ' + bad + ' 个未解析引用' : '全部引用解析成功');
process.exit(bad ? 1 : 0);
