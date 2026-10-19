// 临时脚本：① 校验 asset02 KPI 标签已去除「合并口径」 ② 生成 test_a02.html 截图页
const fs = require('fs');

// ---- 校验 ----
eval(fs.readFileSync('asset_sheets_data.js', 'utf8') + ';globalThis.ASSET_SHEETS=ASSET_SHEETS;');
const a2 = ASSET_SHEETS.find(s => s.key === 'asset02');
console.log('KPI labels:');
a2.kpi.forEach((k, i) => console.log('  ' + (i + 1) + '. ' + k.label + ' = ' + k.value + ' ' + k.unit));
const bad = a2.kpi.filter(k => k.label.includes('合并口径'));
console.log('KPI 标签含「合并口径」数量:', bad.length, bad.length === 0 ? 'PASS' : 'FAIL');
console.log('口径页签(保留正式口径名):', a2.calibers.map(c => c.label).join(' | '));
eval(fs.readFileSync('cockpit_data.js', 'utf8') + ';globalThis.COCKPITS=COCKPITS;');
console.log('cockpit_data.js 解析:', Array.isArray(COCKPITS) ? COCKPITS.length + ' 个驾驶舱' : 'object');
console.log('STRUCTURE OK');
if (bad.length > 0) { console.error('校验失败，不生成截图页'); process.exit(1); }

// ---- 生成截图测试页（平台副本 + 自动切到 asset02） ----
let html = fs.readFileSync('战略部数据应用平台.html', 'utf8');
html = html.replace('</body>',
  '<script>window.addEventListener("DOMContentLoaded",function(){try{switchTab("asset02")}catch(e){console.warn(e)}});</script></body>');
fs.writeFileSync('test_a02.html', html, 'utf8');
console.log('test_a02.html generated');
