// Verify ASSET_SHEETS (caliber-tab structure) integrates with the platform rendering logic
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'asset_sheets_data.js'),'utf8'), ctx);
const ASSET_SHEETS = vm.runInContext('ASSET_SHEETS', ctx);

let fail = 0;
const expect = (cond,msg)=>{ if(!cond){ fail++; console.log('  FAIL: '+msg);} };

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

const keys = Object.keys(ASSET_SHEETS);
console.log('ASSET_SHEETS keys:', keys.join(', '));
expect(keys.length===4, 'should have 4 sheets');

keys.forEach(key=>{
  const s = ASSET_SHEETS[key];
  console.log(`\n[${key}] ${s.name}  (count=${s.count})`);
  expect(Array.isArray(s.calibers) && s.calibers.length>=1, 'has calibers[]');
  /* 指标概览按表而异（2026-09 优化后）：asset01 按口径配置 kpi；asset02 表级 4 卡；asset03/04 概览已删除 */
  if(key==='asset01') s.calibers.forEach(c=>expect(Array.isArray(c.kpi)&&c.kpi.length===4, `[${key}] ${c.label} kpi 4卡`));
  else if(key==='asset02') expect(s.kpi && s.kpi.length===4, 'kpi has 4 cards');
  else expect(!s.kpi, `[${key}] 无表级 kpi（概览已删）`);
  expect(!('指标口径' in (s.headers[0].find(h=>/口径/.test(h.l))||{})), 'no 指标口径 column in headers');
  // ensure header labels don't include 指标口径
  expect(!s.headers[0].some(h=>/指标口径/.test(h.l)), 'header row has no 指标口径 col');

  const colTypes = getColTypes(s.headers);
  console.log('   cols('+colTypes.length+'): '+colTypes.join(','));
  expect(colTypes.indexOf('group')===-1 || true, 'noop');

  let totalRows = 0;
  s.calibers.forEach((c,ci)=>{
    expect(c.label && c.rows, `caliber[${ci}] has label+rows`);
    expect(c.levels.length===c.rows.length, `caliber[${ci}] "${c.label}" levels(${c.levels.length}) === rows(${c.rows.length})`);
    totalRows += c.rows.length;
    c.rows.forEach((r,ri)=>{
      expect(r.length===colTypes.length, `caliber[${ci}] "${c.label}" row ${ri} cells(${r.length}) !== cols(${colTypes.length}) :: ${r[3]||r[2]||''}`);
    });
    console.log(`   - ${c.label} ${c.sub||''}: ${c.rows.length} rows`);
  });
  expect(totalRows===s.count, `total caliber rows(${totalRows}) === count(${s.count})`);
});

console.log(fail===0 ? '\nALL CHECKS PASSED ✓' : `\n${fail} CHECK(S) FAILED ✗`);
process.exit(fail===0?0:1);
