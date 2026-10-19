/* 功能测试：验证同比/较年初单元格着色与箭头逻辑 */
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/战略部数据应用平台.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if(!m){ console.log('FAIL: 未找到内联脚本'); process.exit(1); }
const src = m[1];

function extractFn(name){
  const lines = src.split('\n');
  const start = lines.findIndex(l => l.startsWith('function ' + name + '('));
  if(start < 0) return null;
  let depth = 0, started = false, out = [];
  for(let i = start; i < lines.length; i++){
    const l = lines[i];
    for(const ch of l){
      if(ch === '{'){ depth++; started = true; }
      else if(ch === '}'){ depth--; }
    }
    out.push(l);
    if(started && depth === 0) break;
  }
  return out.join('\n');
}

const ctx = {};
for(const f of ['renderDeltaCell','getColTypes','renderTableRow']){
  const code = extractFn(f);
  if(!code){ console.log('FAIL: 未找到函数 ' + f); process.exit(1); }
  eval('ctx.' + f + ' = ' + code.replace('function ' + f, 'function'));
}
// renderTableRow 内部以全局名调用 renderDeltaCell
globalThis.renderDeltaCell = ctx.renderDeltaCell;

let pass = 0, fail = 0;
function check(desc, actual, expectSub){
  const ok = actual.includes(expectSub);
  if(ok){ pass++; } else { fail++; console.log('FAIL: ' + desc + '\n  实际: ' + actual + '\n  期望包含: ' + expectSub); }
}

// 1) renderDeltaCell —— 正红负绿 + 箭头
check('正百分比 → 红色+▲', ctx.renderDeltaCell('+8.6%'), 'class="yoy up"><span class="delta-arrow">▲</span>+8.6%');
check('负百分比 → 绿色+▼', ctx.renderDeltaCell('-8.0%'), 'class="yoy down"><span class="delta-arrow">▼</span>-8.0%');
check('零值 → 灰色无箭头', ctx.renderDeltaCell('0.0%'), 'class="yoy neutral"');
check('空值 → 灰色-', ctx.renderDeltaCell('-'), 'class="yoy neutral">-');
check('空串 → 灰色-', ctx.renderDeltaCell(''), 'class="yoy neutral">-');
check('负ppt数值(-0.25) → 绿色+▼', ctx.renderDeltaCell('-0.25'), 'class="yoy down"><span class="delta-arrow">▼</span>-0.25');
check('正ppt数值(+0.05) → 红色+▲', ctx.renderDeltaCell('+0.05'), 'class="yoy up"><span class="delta-arrow">▲</span>+0.05');
check('普通数值(108.20,无符号) → 红色+▲', ctx.renderDeltaCell('108.20'), 'class="yoy up"><span class="delta-arrow">▲</span>108.20');

// 2) getColTypes —— 同比/较年初均识别为 delta（含 % 与 ppt 两种表头）
const h1 = [
  [{l:"序号",r:2},{l:"指标名称",r:2},{l:"单位",r:2},{l:"2025年实际",r:2},{l:"本月末",c:3}],
  [{l:"实际"},{l:"同比(%)"},{l:"较年初(%)"}]
];
const t1 = ctx.getColTypes(h1);
check('表头(%) 同比列=delta', JSON.stringify(t1[5]), 'delta');
check('表头(%) 较年初列=delta', JSON.stringify(t1[6]), 'delta');
check('表头(%) 实际列=value', JSON.stringify(t1[4]), 'value');

const h2 = [
  [{l:"序号",r:2},{l:"指标分类",r:2},{l:"指标分项",r:2},{l:"指标名称",r:2},{l:"单位",r:2},{l:"2025年实际",r:2},{l:"本月末",c:3}],
  [{l:"实际"},{l:"同比(ppt)"},{l:"较年初(ppt)"}]
];
const t2 = ctx.getColTypes(h2);
check('表头(ppt) 同比列=delta', JSON.stringify(t2[7]), 'delta');
check('表头(ppt) 较年初列=delta', JSON.stringify(t2[8]), 'delta');
check('表头(ppt) 实际列=value', JSON.stringify(t2[6]), 'value');

// 03 表 本季末 + 监管要求
const h3 = [
  [{l:"序号",r:2},{l:"指标分类",r:2},{l:"监测指标信息",c:4},{l:"2025年实际",r:2},{l:"本季末",c:3},{l:"全年预算",r:2},{l:"预算达成率",r:2}],
  [{l:"指标名称"},{l:"单位"},{l:"是否考核指标"},{l:"监管要求"},{l:"实际"},{l:"同比(%)"},{l:"较年初(%)"}]
];
const t3 = ctx.getColTypes(h3);
check('03表 同比列=delta', JSON.stringify(t3[8]), 'delta');
check('03表 较年初列=delta', JSON.stringify(t3[9]), 'delta');
check('03表 实际列=value', JSON.stringify(t3[7]), 'value');
check('03表 监管要求列=req', JSON.stringify(t3[5]), 'req');

// 3) renderTableRow 端到端：01表首行
const colTypes01 = ['value','name','value','value','value','delta','delta'];
const rowHtml = ctx.renderTableRow(["1","总资产","亿元","12,580.00","12,580.00","+8.6%","+6.2%"], colTypes01, 0);
check('行渲染 同比+8.6% 红▲', rowHtml, 'class="yoy up"><span class="delta-arrow">▲</span>+8.6%');
check('行渲染 较年初+6.2% 红▲', rowHtml, 'class="yoy up"><span class="delta-arrow">▲</span>+6.2%');

const rowNeg = ctx.renderTableRow(["11","信用减值损失","亿元","","108.20","108.20","-8.0%","-5.5%"], ['value','name','value','value','value','delta','delta'], 0);
check('行渲染 同比-8.0% 绿▼', rowNeg, 'class="yoy down"><span class="delta-arrow">▼</span>-8.0%');

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
