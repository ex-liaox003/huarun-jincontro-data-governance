// 验证 TRUST_SHEETS 数据结构 + 与 Excel(trust_grid.json) 一致性 + 页面渲染逻辑集成
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fail = 0;
const expect = (cond, msg) => { if (!cond) { fail++; console.log('  FAIL: ' + msg); } };

/* ---- 1. 加载数据文件 ---- */
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, 'trust_sheets_data.js'), 'utf8'), ctx);
const TRUST_SHEETS = vm.runInContext('TRUST_SHEETS', ctx);
const grid = JSON.parse(fs.readFileSync(path.join(__dirname, 'trust_grid.json'), 'utf8'));

const keys = Object.keys(TRUST_SHEETS);
console.log('TRUST_SHEETS keys:', keys.join(', '));
expect(keys.length === 5, '应有 5 张报表');
expect(JSON.stringify(keys) === JSON.stringify(['trust01','trust02','trust03','trust04','trust05']), '键名 trust01-05 顺序');

/* ---- 2. 复用页面的 getColTypes 逻辑 ---- */
function getColTypes(headers){
  const row1 = headers[0], row2 = headers[1] || [];
  const cols = [];
  row1.forEach(h=>{ const c=h.c||1, r=h.r||1; for(let k=0;k<c;k++) cols.push({label:h.l, r:r}); });
  let j = 0;
  cols.forEach(col=>{ if(col.r <= 1){ if(row2[j]) col.label = row2[j].l; j++; } });
  return cols.map(col=>{
    const l = col.label;
    if(/指标名称/.test(l)) return 'name';
    if(/是否考核/.test(l)) return 'assess';
    if(/预算进度|预算达成率/.test(l)) return 'progress';
    if(/同比|较年初|环比/.test(l)) return 'delta';
    if(/指标类|指标项|指标口径/.test(l)) return 'group';
    if(/监管要求/.test(l)) return 'req';
    return 'value';
  });
}

/* ---- 3. 逐表结构校验 + 与 Excel 指标名称/顺序/空行 完全一致 ---- */
keys.forEach(key=>{
  const s = TRUST_SHEETS[key];
  console.log(`\n[${key}] ${s.name} (count=${s.count})`);
  expect(s.title && s.subtitle && s.count > 0, 'name/title/subtitle/count 完整');
  expect(Array.isArray(s.kpi), 'kpi 为数组');
  expect(key === 'trust02' ? s.kpi.length === 0 : s.kpi.length >= 2, key === 'trust02' ? 'trust02 无指标概览(kpi 空)' : 'kpi 卡片 >= 2');
  s.kpi.forEach((k,i)=>expect(k.label && k.value && k.unit && k.trend && k.ytd, `kpi[${i}] 字段完整`));
  expect(s.headers.length === 2, '两级表头');
  expect(s.headers[0].reduce((n,h)=>n+(h.c||1),0) === 8, '表头共 8 列');

  const colTypes = getColTypes(s.headers);
  console.log('   cols(' + colTypes.length + '): ' + colTypes.join(','));
  expect(JSON.stringify(colTypes) === JSON.stringify(['value','name','value','value','delta','value','delta','delta']), '列类型: 序号/名称/单位/当月实际/环比/截止实际/同比/较年初');
  expect(s.rows.length === s.levels.length, 'levels 与 rows 等长');

  // 与 Excel 网格逐行比对（grid 前 2 行为两级表头）
  const excelRows = grid[s.name].slice(2);
  expect(s.rows.length === excelRows.length, `行数(${s.rows.length}) === Excel(${excelRows.length})`);
  let dataN = 0;
  excelRows.forEach((er, i)=>{
    const blank = er.every(v=>v===null||v==='');
    const tr = s.rows[i];
    if(blank){
      expect(tr.length === 0, `row[${i}] Excel 空行 → 空数组`);
    } else {
      dataN++;
      expect(tr[0] === er[0] && tr[1] === er[1] && tr[2] === er[2], `row[${i}] 序号/名称/单位一致: ${er[0]} ${er[1]} ${er[2]}`);
      expect(tr.length === 8, `row[${i}] 8 列`);
    }
  });
  expect(dataN === s.count, `数据行数(${dataN}) === count(${s.count})`);
});

/* ---- 4. 用页面自身的渲染函数生成表格，确认无异常 ---- */
const html = fs.readFileSync(path.join(__dirname, '战略部数据应用平台.html'), 'utf8');
const start = html.indexOf('function getColTypes');
const end = html.indexOf('/* ============================================================\n   交互');
expect(start > 0 && end > start, 'HTML 中可定位渲染函数区段');
const renderCtx = vm.createContext({});
vm.runInContext(html.slice(start, end), renderCtx);
keys.forEach(key=>{
  const s = TRUST_SHEETS[key];
  const t = vm.runInContext('renderTable', renderCtx)(s, getColTypes(s.headers));
  const trN = (t.match(/<tr/g) || []).length;
  const sepN = (t.match(/row-sep/g) || []).length;
  const dataRows = s.rows.filter(r=>r.length).length;
  expect(trN === dataRows + s.rows.filter(r=>!r.length).length + 2, `[${key}] <tr> 数 = 表头2+数据行`);
  expect(sepN === s.rows.filter(r=>!r.length).length, `[${key}] row-sep 数 = 空行数(${s.rows.filter(r=>!r.length).length})`);
  console.log(`   render OK: <tr>=${trN}, 分隔行=${sepN}`);
});

/* ---- 5. HTML 集成点检查 ---- */
expect(html.includes('<script src="trust_sheets_data.js"></script>'), 'HTML 引入 trust_sheets_data.js');
expect(/label:'华润信托',\s*open:(?:true|false),\s*data:\(typeof TRUST_SHEETS!=='undefined'\?TRUST_SHEETS:null\)/.test(html), '侧边栏华润信托分组挂接 TRUST_SHEETS');
expect(html.includes('Object.keys(TRUST_SHEETS).forEach(key=>renderPanel(key, TRUST_SHEETS[key]))'), 'renderContent 渲染信托面板');
expect(html.includes("TRUST_SHEETS[key]) return TRUST_SHEETS[key]") || /TRUST_SHEETS\[key\]\) return TRUST_SHEETS\[key\]/.test(html), 'sheetByKey 支持 TRUST_SHEETS');
expect(!/label:'华润信托', open:false\}/.test(html), '华润信托不再是空分组');

console.log(fail === 0 ? '\nALL CHECKS PASSED ✓' : `\n${fail} CHECK(S) FAILED ✗`);
process.exit(fail === 0 ? 0 : 1);
