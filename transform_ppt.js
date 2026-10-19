/* ============================================================
   2026-09-23 优化：指标单位为 % 的行，其 同比/环比/较年初 列数值
   后缀统一由 % 改为 ppt（百分点）；同单位 KPI 卡片的同比/较年初同步。
   - 仅转换「单位=%」的行；亿元/万元等行的同比仍为相对变化 %，不动
   - 已是 ppt / - / 空 的值不动
   - pretty JSON 文件（sheets/asset）整对象回写（格式与原文件一致）；
     手写紧凑文件（trust/insurance/lease）逐行外科手术式替换，保留原格式
   ============================================================ */
const fs = require('fs');

/* 展开两级表头得到叶列标签（与页面 getColTypes 同一套规则） */
function leafCols(headers){
  const row1 = headers[0], row2 = headers[1] || [];
  const cols = []; let j = 0;
  row1.forEach(h=>{
    const c = h.c || 1, r = h.r || 1;
    for(let k=0;k<c;k++){
      if(r > 1){ cols.push(h.l); }
      else { cols.push(row2[j] ? row2[j].l : h.l); j++; }
    }
  });
  return cols;
}
const isDelta = l => /同比|环比|较年初/.test(l);
/* 手写紧凑数组（无引号键）→ 先给键补引号再 JSON.parse */
const parseJSArray = s => JSON.parse(s.replace(/([{\[,])\s*([A-Za-z_]\w*)\s*:/g, '$1"$2":'));
const PCT = /^([+-]?\d+(?:\.\d+)?)%$/;
const toPpt = v => { const m = String(v).trim().match(PCT); return m ? m[1] + 'ppt' : null; };

function fixRow(r, uIdx, dIdxs, stat){
  if(!Array.isArray(r) || uIdx < 0 || r[uIdx] !== '%') return;
  dIdxs.forEach(i=>{
    const nv = typeof r[i] === 'string' ? toPpt(r[i]) : null;
    if(nv){ r[i] = nv; stat.n++; }
  });
}
function fixKpi(k, stat){
  if(!k || k.unit !== '%') return;
  ['trend','ytd'].forEach(f=>{
    const nv = typeof k[f] === 'string' ? toPpt(k[f]) : null;
    if(nv){ k[f] = nv; stat.k++; }
  });
}
function transformSheet(s, stat){
  const cols = leafCols(s.headers);
  const uIdx = cols.indexOf('单位');
  const dIdxs = cols.map((l,i)=>isDelta(l)?i:-1).filter(i=>i>=0);
  (s.rows || []).forEach(r=>fixRow(r, uIdx, dIdxs, stat));
  (s.calibers || []).forEach(c=>(c.rows || []).forEach(r=>fixRow(r, uIdx, dIdxs, stat)));
  (s.kpi || []).forEach(k=>fixKpi(k, stat));
  (s.calibers || []).forEach(c=>(c.kpi || []).forEach(k=>fixKpi(k, stat)));
}

/* ---- pretty JSON 文件：整对象回写（先校验回写格式与原文件逐字一致） ---- */
function rewritePretty(file, varName){
  const text = fs.readFileSync(file, 'utf8');
  const at = text.indexOf('const ' + varName + ' = ');
  if(at < 0) throw new Error(file + ' 未找到 ' + varName);
  const prefix = text.slice(0, at + ('const ' + varName + ' = ').length);
  const body = text.slice(prefix.length).trim();
  const obj = JSON.parse(body.replace(/;$/,''));
  if(body.replace(/;$/,'') !== JSON.stringify(obj, null, 2)) throw new Error(file + ' 原格式非标准 2 空格 JSON，放弃整对象回写');
  const stat = {n:0, k:0};
  Object.values(obj).forEach(s=>transformSheet(s, stat));
  fs.writeFileSync(file, prefix + JSON.stringify(obj, null, 2) + ';\n');
  console.log(file + ': 列值转换 ' + stat.n + ' 处, KPI ' + stat.k + ' 处');
}

/* ---- 手写紧凑文件：逐行替换（表头块解析列下标，行/KPI 单行内改值） ---- */
function rewriteCompact(file){
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const stat = {n:0, k:0};
  let collecting = null, uIdx = -1, dIdxs = [];
  const out = lines.map(line=>{
    if(/^\s*headers:\s*\[\s*$/.test(line)){ collecting = []; return line; }
    if(collecting){
      const hm = line.match(/^\s*(\[\{.*\])\s*,?\s*$/);
      if(hm){ collecting.push(parseJSArray(hm[1])); return line; }
      if(/^\s*\],?\s*$/.test(line)){
        const cols = leafCols(collecting);
        uIdx = cols.indexOf('单位');
        dIdxs = cols.map((l,i)=>isDelta(l)?i:-1).filter(i=>i>=0);
        collecting = null;
      }
      return line;
    }
    if(/(^|,)unit:"%"/.test(line) && /\{label:/.test(line)){
      let nl = line, c = 0;
      nl = nl.replace(/(trend|ytd):"([+-]?\d+(?:\.\d+)?)%"/g, (m,f,v)=>{ c++; return f+':"'+v+'ppt"'; });
      stat.k += c;
      return nl;
    }
    const rm = line.match(/^(\s*)\[(.*)\](,?)\s*$/);
    if(rm && uIdx >= 0){
      let arr; try{ arr = JSON.parse('[' + rm[2] + ']'); }catch(e){ return line; }
      if(arr[uIdx] === '%'){
        let ch = false;
        dIdxs.forEach(i=>{
          const nv = typeof arr[i] === 'string' ? toPpt(arr[i]) : null;
          if(nv){ arr[i] = nv; ch = true; stat.n++; }
        });
        if(ch) return rm[1] + JSON.stringify(arr) + rm[3];
      }
    }
    return line;
  });
  fs.writeFileSync(file, out.join('\n'));
  console.log(file + ': 列值转换 ' + stat.n + ' 处, KPI ' + stat.k + ' 处');
}

rewritePretty('sheets_data.js', 'SHEETS');
rewritePretty('asset_sheets_data.js', 'ASSET_SHEETS');
rewriteCompact('trust_sheets_data.js');
rewriteCompact('insurance_sheets_data.js');
rewriteCompact('lease_sheets_data.js');
console.log('完成');
