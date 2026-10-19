// 验证 LEASE_SHEETS 数据结构 + 与 Excel(lease_grid.json) 一致性 + 页面渲染逻辑集成
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fail = 0;
const expect = (cond, msg) => { if (!cond) { fail++; console.log('  FAIL: ' + msg); } };

/* ---- 1. 加载数据文件 ---- */
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, 'lease_sheets_data.js'), 'utf8'), ctx);
const LEASE_SHEETS = vm.runInContext('LEASE_SHEETS', ctx);
const grid = JSON.parse(fs.readFileSync(path.join(__dirname, 'lease_grid.json'), 'utf8'));

const keys = Object.keys(LEASE_SHEETS);
console.log('LEASE_SHEETS keys:', keys.join(', '));
expect(keys.length === 5, '应有 5 张报表');
expect(JSON.stringify(keys) === JSON.stringify(['lease01','lease02','lease03','lease04','lease05']), '键名 lease01-05 顺序');

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

/* ---- 3. 各表与 Excel 网格的列映射（0 基）：
      grid 数据行起始行号、数据行各字段对应的 grid 列下标 ---- */
const MAP = {
  lease01: {start:4, cols:{cat:[0,1], seq:[1,2], name:[2,3], unit:[3,4], assess:[4,5]}, emptyFrom:6},
  lease02: {start:3, cols:{cat:[0,1], seq:[1,2], name:[2,3], unit:[3,4]}, emptyFrom:5},
  lease03: {start:4, cols:{cat:[0,1], item:[1,2], seq:[2,3], name:[3,4], unit:[4,5], assess:[5,6]}, emptyFrom:7},
  lease04: {start:4, cols:{cat:[0,1], seq:[1,2], name:[2,3], unit:[3,4], assess:[4,5], req:[5,6]}, emptyFrom:7},
  lease05: {start:4, cols:{cat:[0,1], seq:[1,2], name:[2,3], unit:[3,4], assess:[4,5], req:[5,6]}, emptyFrom:7}
};
/* 注：页面 getColTypes 的 /指标类|指标项/ 实际匹配不到「指标分类/指标分项」
   （"指标类"非连续子串），故这些列按 value 类型渲染 —— 与华润银行/资产模块行为一致 */
const COLTYPES_EXPECT = {
  lease01: ['value','value','name','value','assess','value','value','delta','delta','value','progress'],
  lease02: ['value','value','name','value','value','value','delta','delta'],
  lease03: ['value','value','value','name','value','assess','value','value','delta','delta','value','progress'],
  lease04: ['value','value','name','value','assess','req','value','value','delta','delta','value','progress'],
  lease05: ['value','value','name','value','assess','req','value','value','delta','delta','value','progress']
};

keys.forEach(key=>{
  const s = LEASE_SHEETS[key];
  const map = MAP[key];
  console.log(`\n[${key}] ${s.name} (count=${s.count})`);
  expect(grid[s.name], `Excel 中存在同名 sheet: ${s.name}`);
  expect(s.title && s.subtitle && s.count > 0, 'title/subtitle/count 完整');
  expect(Array.isArray(s.kpi) && s.kpi.length === 4, 'kpi 卡片 4 张（同银行模块）');
  s.kpi.forEach((k,i)=>expect(k.label && k.value && k.unit && k.trend && k.ytd, `kpi[${i}] 字段完整`));
  expect(s.headers.length === 2, '两级表头');

  const colTypes = getColTypes(s.headers);
  console.log('   cols(' + colTypes.length + '): ' + colTypes.join(','));
  expect(JSON.stringify(colTypes) === JSON.stringify(COLTYPES_EXPECT[key]), '列类型与预期一致');

  const excelRows = grid[s.name].slice(map.start);
  expect(s.rows.length === excelRows.length, `行数(${s.rows.length}) === Excel 数据行(${excelRows.length})`);
  expect(s.rows.length === s.count, `行数(${s.rows.length}) === count(${s.count})`);
  expect(s.levels.length === s.rows.length, 'levels 与 rows 等长');

  // 逐行比对：序号/名称/单位/考核/监管要求 与 Excel 完全一致；
  // 指标分类/指标分项列按合并单元格语义：与上一行相同则为空
  const prev = {};
  let emptyVals = 0, nonEmptyVals = 0;
  excelRows.forEach((er, i)=>{
    const tr = s.rows[i];
    expect(tr.length === colTypes.length, `row[${i}] 列数=${colTypes.length}`);
    for(const f in map.cols){
      const [di, gi] = map.cols[f];
      let gv = er[gi] == null ? '' : String(er[gi]);
      if(f === 'cat' || f === 'item'){
        const raw = gv;
        if(prev[f] === gv) gv = '';
        prev[f] = raw;
      }
      expect(String(tr[di] == null ? '' : tr[di]) === gv, `row[${i}] ${f}: "${tr[di]}" === Excel "${gv}"`);
    }
    // Excel 数值列应为空（模板未填数）
    for(let c = map.emptyFrom; c < 13; c++){
      const v = er[c] == null ? '' : String(er[c]).trim();
      if(v === '') emptyVals++; else nonEmptyVals++;
    }
  });
  expect(nonEmptyVals === 0, `Excel 数值列全为空(非空=${nonEmptyVals}) → 演示值合规`);
  console.log(`   Excel 对照通过 · 数值列空单元格=${emptyVals}`);
});

/* ---- 4. 用页面自身的渲染函数生成表格，确认无异常 ---- */
const html = fs.readFileSync(path.join(__dirname, '战略部数据应用平台.html'), 'utf8');
const start = html.indexOf('function getColTypes');
const end = html.indexOf('/* ============================================================\n   交互');
expect(start > 0 && end > start, 'HTML 中可定位渲染函数区段');
const renderCtx = vm.createContext({});
vm.runInContext(html.slice(start, end), renderCtx);
keys.forEach(key=>{
  const s = LEASE_SHEETS[key];
  const t = vm.runInContext('renderTable', renderCtx)(s, getColTypes(s.headers));
  const trN = (t.match(/<tr/g) || []).length;
  expect(trN === s.rows.length + 2, `[${key}] <tr> 数 = 表头2 + 数据行${s.rows.length}`);
  // 关键样式类：与银行模块一致的单元格渲染
  expect(t.includes('indicator-name'), `[${key}] 指标名称样式类`);
  expect(/class="value"/.test(t), `[${key}] 数值样式类`);
  if(s.headers[0].some(h=>h.l==='是否考核指标')){
    expect(/class="assess/.test(t), `[${key}] 考核列样式类`);
  }
  if(s.headers[0].some(h=>h.l==='预算达成率')){
    expect(t.includes('progress-bar'), `[${key}] 预算达成率进度条`);
  }
  console.log(`   render OK: <tr>=${trN}`);
});

/* ---- 5. HTML 集成点检查 ---- */
expect(html.includes('<script src="lease_sheets_data.js"></script>'), 'HTML 引入 lease_sheets_data.js');
expect(html.includes("{label:'华润租赁', open:false, data:(typeof LEASE_SHEETS!=='undefined'?LEASE_SHEETS:null)}"), '侧边栏华润租赁分组挂接 LEASE_SHEETS（树形导航，默认收起）');
expect(html.includes('Object.keys(LEASE_SHEETS).forEach(key=>renderPanel(key, LEASE_SHEETS[key]))'), 'renderContent 渲染租赁面板');
expect(/LEASE_SHEETS\[key\]\) return LEASE_SHEETS\[key\]/.test(html), 'sheetByKey 支持 LEASE_SHEETS');
expect(!/label:'华润租赁', open:false\}/.test(html), '华润租赁不再是空分组');

console.log(fail === 0 ? '\nALL CHECKS PASSED ✓' : `\n${fail} CHECK(S) FAILED ✗`);
process.exit(fail === 0 ? 0 : 1);
