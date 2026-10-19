// 校验：9 张表 36 个 KPI 均已配置较年初(ytd)字段，且同比/较年初值可被正确解析
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'sheets_data.js'), 'utf8');
const SHEETS = new Function(src + '; return SHEETS;')();

let total = 0;
const missing = [];
const badParse = [];

function parseNum(val){
  return parseFloat(String(val).replace(/[,，\s]/g,'').replace(/%|ppt/gi,''));
}

Object.keys(SHEETS).forEach(k=>{
  SHEETS[k].kpi.forEach(x=>{
    total++;
    if(!x.ytd) missing.push(k + '/' + x.label);
    [x.trend, x.ytd].forEach(v=>{
      if(v && isNaN(parseNum(v))) badParse.push(k + '/' + x.label + ': ' + v);
    });
  });
});

console.log('KPI 总数:', total);
console.log('缺少较年初字段:', missing.length ? missing : '无 ✓');
console.log('无法解析的同比/较年初值:', badParse.length ? badParse : '无 ✓');

if(missing.length || badParse.length || total !== 36){
  console.log('FAIL');
  process.exit(1);
}
console.log('PASS: 36 个 KPI 全部具备同比+较年初且格式可解析');

// 从 HTML 提取 deltaSpan 函数实测
const html = fs.readFileSync(path.join(__dirname, '战略部数据应用平台.html'), 'utf8');
const m = html.match(/function deltaSpan\(val\)\{[\s\S]*?\n\}/);
if(!m){ console.log('FAIL: 未在 HTML 中找到 deltaSpan 函数'); process.exit(1); }
const deltaSpan = eval('(' + m[0].replace(/^function deltaSpan/, 'function') + ')');
const cases = [
  ['+8.6%',    'kpi-delta up',      '▲'],
  ['-0.25',    'kpi-delta down',    '▼'],
  ['-0.22ppt', 'kpi-delta down',    '▼'],
  ['+0.0%',    'kpi-delta neutral', ''],
  ['-',        'kpi-delta neutral', ''],
  ['',         'kpi-delta neutral', ''],
  ['+0.05ppt', 'kpi-delta up',      '▲']
];
let fail = 0;
cases.forEach(([input, cls, arrow])=>{
  const out = deltaSpan(input);
  const okCls = out.includes(cls);
  const okArrow = arrow ? out.includes(arrow) : !out.includes('▲') && !out.includes('▼');
  if(!okCls || !okArrow){ fail++; console.log('  ✗ deltaSpan(' + JSON.stringify(input) + ') => ' + out); }
});
if(fail){ console.log('FAIL: deltaSpan ' + fail + ' 个用例失败'); process.exit(1); }
console.log('PASS: deltaSpan 7 个用例全部通过（正红▲/负绿▼/零灰）');

