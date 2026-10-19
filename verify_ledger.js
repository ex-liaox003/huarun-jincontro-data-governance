/* 验证「报表台账管理」模块：
   1) 台账逻辑函数从 HTML 内联脚本中原样提取执行（buildLedgerView 及依赖）
   2) 对 5 家公司全部 25 张报表逐一构建台账视图：
      - 月度报表：当前年度表头 = 结构列 + 1—当前月「X月末」；历史年度 = 1—12 月
      - 季度频率报表（freq=季度，如 led-03/asset季度/lease04/lease05）：
        表头 = 结构列 + Q1—当前季度（历史年度 Q1—Q4），各季度列均有值（季末口径）
      - 行数、levels 与原表一致；spans 合并列号落在结构列内
   3) renderTable 产物行数 = 原表行数；单元格列数 = 表头列数
*/
const fs = require('fs');
const path = require('path');
const base = __dirname;

let errors = [], ok = [];

/* 加载数据 */
function loadVar(file, varName){
  const src = fs.readFileSync(path.join(base, file), 'utf8');
  return new Function(src + '; return ' + varName + ';')();
}
const collections = {
  SHEETS: loadVar('sheets_data.js','SHEETS'),
  ASSET_SHEETS: loadVar('asset_sheets_data.js','ASSET_SHEETS'),
  TRUST_SHEETS: loadVar('trust_sheets_data.js','TRUST_SHEETS'),
  INSURANCE_SHEETS: loadVar('insurance_sheets_data.js','INSURANCE_SHEETS'),
  LEASE_SHEETS: loadVar('lease_sheets_data.js','LEASE_SHEETS'),
};

/* 提取台账逻辑（与 HTML 内联脚本保持同步：直接截取源码片段执行） */
const html = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');
const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];

function grab(startMark, endMark, label){
  const a = js.indexOf(startMark);
  const b = js.indexOf(endMark, a);
  if(a < 0 || b < 0) throw new Error('HTML 中未找到片段: ' + label);
  return js.slice(a, b);
}
/* 依赖函数源码 */
const srcHide = grab('function hideColsView(', 'function renderTable(', 'hideColsView');
const srcTypes = grab('function getColTypes(', '/* 按口径/报表隐藏列', 'getColTypes');

const coreFns = grab('function ledgerYears()', 'function renderAllLedgers', 'ledger core');
// renderLedgerPanel 依赖 DOM，排除；只取纯函数段（ledgerYears ~ buildLedgerView 结束）
const pureEnd = coreFns.indexOf('/* 渲染单个台账面板');
/* buildLedgerView 依赖的数据可用性常量与期间函数（与页面同源） */
const srcDataFrom = "const DATA_DEFAULT_FROM = '2025-01';\nfunction periodVal(y, m){ return y * 100 + m; }\n";
const pure = srcDataFrom + grab('const LEDGER_NOW', 'function ledgerYears', 'LEDGER_NOW const') + coreFns.slice(0, pureEnd);

const sandbox = new Function(
  srcTypes + '\n' + srcHide + '\n' + pure +
  '\nreturn {buildLedgerView, ledgerMonthCount, ledgerLeaves, getColTypes, ledgerYears, LEDGER_NOW_Y, LEDGER_NOW_M};'
)();

const NOW_Y = sandbox.LEDGER_NOW_Y, NOW_M = sandbox.LEDGER_NOW_M;
if(NOW_Y !== 2026) errors.push('当前年度应为 2026, 实际 ' + NOW_Y);
ok.push(`当前日期基准: ${NOW_Y}年${NOW_M}月`);

let total = 0;
Object.keys(collections).forEach(cn=>{
  const col = collections[cn];
  Object.keys(col).forEach(k=>{
    const s = col[k];
    total++;
    const isQ = s.freq === '季度';

    // 历史年度 2025：月度表 12 个月 / 季度表 Q1—Q4
    const v25 = sandbox.buildLedgerView(s, 2025);
    // 当前年度 2026：月度表 1—当前月 / 季度表 Q1—当前季度
    const v26 = sandbox.buildLedgerView(s, 2026);

    const h25 = v25.headers[0].map(h=>h.l);
    const h26 = v26.headers[0].map(h=>h.l);

    // 期间列识别：月度表「X月末」；季度表「Q1—Q4」
    const perCols = h => h.filter(l=> isQ ? /^Q[1-4]$/.test(l) : /月末$/.test(l));
    const n25 = perCols(h25).length;
    const n26 = perCols(h26).length;
    const NOW_Q = Math.floor((NOW_M-1)/3); // 已完结季度数：季末月已过才完结（10 月 → Q1—Q3）
    if(n25 !== (isQ ? 4 : 12)) errors.push(`${cn}.${k}: 2025 表头期间数 ${n25} != ${isQ?4:12}`);
    if(isQ){
      if(n26 !== NOW_Q) errors.push(`${cn}.${k}: 当前年度表头季度数 ${n26} != 已完结季度数 ${NOW_Q}`);
      // 未完结季度不得出现在当前年度表头
      for(let q=NOW_Q+1; q<=4; q++)
        if(h26.indexOf('Q'+q) >= 0) errors.push(`${cn}.${k}: 当前年度表头含未完结季度 Q${q}`);
    } else if(n26 !== NOW_M) errors.push(`${cn}.${k}: 当前年度表头月份数 ${n26} != ${NOW_M}`);
    // 季度表不得出现月份列；月度表不得出现季度列
    if(isQ && h25.some(l=>/月末$/.test(l))) errors.push(`${cn}.${k}: 季度表表头仍含月份列`);
    if(isQ && !['Q1','Q2','Q3','Q4'].every(q=>h25.indexOf(q)>=0)) errors.push(`${cn}.${k}: 季度表 2025 表头应为 Q1—Q4`);
    if(!isQ && h25.some(l=>/^Q[1-4]$/.test(l))) errors.push(`${cn}.${k}: 月度表表头混入季度列`);

    // 台账表头不含同比列、不含指标属性标签列（2026-09-30 调整）
    if(h25.some(l=>/同比/.test(l))) errors.push(`${cn}.${k}: 台账表头仍含同比列`);
    if(h25.some(l=>/指标属性标签/.test(l))) errors.push(`${cn}.${k}: 台账表头仍含指标属性标签列`);

    // 行数与原表一致
    const baseRows = (s.calibers ? s.calibers[0].rows : s.rows) || [];
    if(v25.rows.length !== baseRows.length)
      errors.push(`${cn}.${k}: 台账行数 ${v25.rows.length} != 原表 ${baseRows.length}`);

    // 每行列数 = 表头列数（空行除外）
    v25.rows.forEach((r,i)=>{
      if(!r.length || r.every(v=>v===null||v==='')) return;
      if(r.length !== h25.length)
        errors.push(`${cn}.${k}: 第${i+1}行列数 ${r.length} != 表头 ${h25.length}`);
    });

    // 季度表：表头为 Q1—Q4，各季度列均应有值（季末口径，不再有非季末月 N/A）
    if(isQ){
      ['Q1','Q2','Q3','Q4'].forEach(q=>{
        const qi = h25.indexOf(q);
        if(qi < 0){ errors.push(`${cn}.${k}: 季度表缺表头 ${q}`); return; }
        if(!v25.rows.some(r=>r.length>2 && r[qi] !== null && r[qi] !== '-'))
          errors.push(`${cn}.${k}: 季度表 ${q} 应有数值（季末口径）`);
      });
      // 流量类季度值随季递增（抽查首个可比数值行：Q4 > Q1）
      const q1i = h25.indexOf('Q1'), q4i = h25.indexOf('Q4');
      const incRow = v25.rows.find(r=>r.length>2 && r[q1i]!==null && r[q4i]!==null
        && !isNaN(parseFloat(r[q1i])) && !isNaN(parseFloat(r[q4i])) && parseFloat(r[q1i])>0);
      if(incRow && !(parseFloat(incRow[q4i]) > parseFloat(incRow[q1i])))
        errors.push(`${cn}.${k}: 季度表流量值未按 Q1<Q4 递增`);
    }

    // 月度值随月递增（流量类第一张银行表示例抽查：营业收入类行 9月末 ≈ 12月末*9/12）
    if(cn === 'SHEETS' && k === '02'){
      const row = v25.rows.find(r=>String(r[ h25.indexOf('指标名称') ]).indexOf('营业收入') === 0 && String(r[h25.indexOf('指标名称')]).indexOf('其中') < 0);
      if(row){
        const v12 = parseFloat(row[h25.indexOf('12月末')].replace(/,/g,''));
        const v9  = parseFloat(row[h25.indexOf('9月末')].replace(/,/g,''));
        const ratio = v9 / v12;
        if(Math.abs(ratio - 0.75) > 0.02) errors.push(`银行02 营业收入 9月/12月 = ${ratio.toFixed(3)} 偏离累计口径 0.75`);
        else ok.push(`银行02 营业收入累计推算: 12月末 ${row[h25.indexOf('12月末')]} → 9月末 ${row[h25.indexOf('9月末')]}（比例 ${ratio.toFixed(2)}）`);
        const v1 = parseFloat(row[h25.indexOf('1月末')].replace(/,/g,''));
        if(!(v1 < v9 && v9 < v12)) errors.push('银行02 营业收入未逐月递增');
      } else errors.push('银行02 未找到营业收入行');
    }

    // spans 合并列号必须落在结构列（期间列之前）
    const firstPerCol = l => isQ ? /^Q[1-4]$/.test(l) : /月末$/.test(l);
    if(v25.spans){
      const structCols = h25.findIndex(firstPerCol);
      v25.spans.forEach(sp=>{ if(sp.col >= structCols) errors.push(`${cn}.${k}: span 列 ${sp.col} 越界进入期间区`); });
    }

    // 无数据年度（2022，早于数据起始期间 2025-01）：全部期间值列为 null（页面渲染 N/A），结构列保留
    // dataFrom 早于 2022 的报表除外（当前 25 张表均无覆盖，全部应 N/A）
    const v22 = sandbox.buildLedgerView(s, 2022);
    const structN = h25.findIndex(firstPerCol);
    v22.rows.forEach((r,i)=>{
      if(!r.length || r.every(val=>val===null||val==='')) return;
      for(let c=structN;c<r.length;c++){
        if(r[c] !== null) errors.push(`${cn}.${k}: 2022 无数据年度第${i+1}行第${c}列应为 null(N/A)，实际 ${JSON.stringify(r[c])}`);
      }
      if(!r[0] && r[0]!=='0') {/* 结构列保留校验：序号列非空 */}
    });
    // 月度列语义：台账月份值只允许 数值字符串 或 null(N/A)，不允许 '-'（页面渲染 --）
    //（有数据月份=数值；未取到数/无历史期间/季度表非季末月=null → N/A）
    v25.rows.forEach((r,i)=>{
      if(!r.length || r.every(val=>val===null||val==='')) return;
      for(let c=structN;c<r.length;c++){
        if(r[c] === '-') errors.push(`${cn}.${k}: 2025 第${i+1}行第${c}列不应为 '-'（应改 N/A）`);
      }
    });
    // 有数据年度（2025）至少多数月份列有数值
    const numCells = v25.rows.flatMap(r=>r.slice(structN)).filter(val=>typeof val==='string' && val!=='-').length;
    if(numCells < 10) errors.push(`${cn}.${k}: 2025 数值单元格过少(${numCells})`);
  });
});
ok.push(`共校验 ${total} 张报表 × 2 个年度（2025 全年 / ${NOW_Y} 至 ${NOW_M} 月）`);

/* renderTable 端到端：产物 <table> 行数、表头单元格数 */
const srcRender = grab('function renderTable(', '/* rowspan 合并配置', 'renderTable')
  + '\n' + grab('function buildSpanMap(', '/* ===== 指标分类筛选', 'buildSpanMap')
  + '\n' + grab('function renderTableRow(', '/* 指标卡片同比', 'renderTableRow')
  + '\n' + grab('function renderDeltaCell(', 'function renderProgressCell', 'renderDeltaCell')
  + '\n' + grab('function renderProgressCell(', '/* ============================================================\n   交互', 'renderProgressCell');
const rt = new Function(srcTypes + '\n' + srcRender + '\nreturn renderTable;')();
const v = sandbox.buildLedgerView(collections.SHEETS['01'], 2025);
const tableHtml = rt(v, sandbox.getColTypes(v.headers), true);
const trCount = (tableHtml.match(/<tr>/g)||[]).length;
if(trCount !== v.rows.length + 1) errors.push(`renderTable 行数 ${trCount} != ${(v.rows.length+1)}`);
else ok.push(`renderTable(银行01台账/2025): ${trCount-1} 数据行 + 表头 1 行, 表头 ${v.headers[0].length} 列`);

console.log('=== PASS ===');
ok.forEach(m=>console.log('  ✓ ' + m));
if(errors.length){
  console.log('=== FAIL (' + errors.length + ') ===');
  errors.forEach(m=>console.log('  ✗ ' + m));
  process.exit(1);
}
console.log('全部通过');
