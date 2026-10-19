// 依据优化要求转换 ASSET_SHEETS 并重写 asset_sheets_data.js
// 01-收入结构：① 三个口径(除香港)营业收入下加「其中：产融业务收入」 ② 预算/达成率仅★保留
//             ③ 概览KPI按口径配置(营业收入/利润总额/人工成本/成本收入比-拨备前) ④ 分类/分项合并
// 02-业务结构：①② 删除现金周转率×2与服务集团退出4项 ③ 分类/分项合并 ④ 预算/达成率仅★保留(删后无★→全空)
// 03-风险指标/04-产融业务：① 删除概览KPI ② 指标分类合并
const fs = require('fs'), path = require('path'), vm = require('vm');
const base = __dirname;
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(base,'asset_sheets_data.js'),'utf8'), ctx);
const A = vm.runInContext('ASSET_SHEETS', ctx);

/* 分组合并：相同非空值(含连续)与后续空串同组；组长度>1 输出 rowspan */
function groupSpans(rows, col){
  const spans = [];
  let start = -1, val = null;
  rows.forEach((r,i)=>{
    const v = r[col];
    if(v && v!==val){
      if(start>=0 && i-start>1) spans.push({col, row:start, rs:i-start});
      start = i; val = v;
    }
    // v===val(连续相同) 或 v 为空：延续当前组
  });
  if(start>=0 && rows.length-start>1) spans.push({col, row:start, rs:rows.length-start});
  return spans;
}

/* ---------- 01-收入结构 ---------- */
const a1 = A.asset01;
delete a1.kpi; // 概览KPI改为口径化
const ADD_ROW = {
  '财务考核口径': ['6.80','+1.3%','6.80','+15.2%','+9.8%'],
  '资产单体口径': ['4.20','+1.4%','4.20','+16.5%','+10.2%'],
  '渝康单体口径': ['2.60','+1.2%','2.60','+14.8%','+9.5%']
};
a1.calibers.forEach(c=>{
  const add = ADD_ROW[c.label];
  if(add && c.rows[1] && c.rows[1][3]!=='其中：产融业务收入'){
    // 营业收入下插入子指标「其中：产融业务收入」（幂等保护：已插入则跳过）
    c.rows.splice(1, 0, ['', '收入指标', '2', '其中：产融业务收入', '亿元', ''].concat(add).concat(['','']));
    c.levels.splice(1, 0, 1);
  }
  c.rows.forEach((r,i)=>{ r[2] = String(i+1); });              // 序号重排
  c.rows.forEach(r=>{ if(r[5]!=='★'){ r[11]=''; r[12]=''; } }); // 预算/达成率仅★
  // 口径化概览KPI：营业收入/利润总额/人工成本/成本收入比-拨备前
  const pick = n => { const r = c.rows.find(x=>x[3]===n);
    return {label:n, value:r[8], unit:r[4], trend:r[9], ytd:r[10], dir:'up', type:''}; };
  c.kpi = ['营业收入','利润总额','人工成本','成本收入比-拨备前'].map(pick);
  c.spans = groupSpans(c.rows,0).concat(groupSpans(c.rows,1));
});
a1.count = a1.calibers.reduce((n,c)=>n+c.rows.length,0);
a1.name = '01-收入结构('+a1.count+'个)';

/* ---------- 02-业务结构 ---------- */
const a2 = A.asset02;
const DEL2 = ['现金周转率（不良资产经营类业务）','现金周转率（公司整体）',
  '本月末累计新增服务集团退出项目数量','本月末累计退出的服务集团退出项目数量',
  '业绩合同下服务集团退出项目数量','业绩合同下达成里程碑项目数量'];
a2.calibers.forEach(c=>{
  const keep = [];
  c.rows.forEach((r,i)=>{ if(DEL2.indexOf(r[3])<0) keep.push([r,i]); });
  c.rows = keep.map(x=>x[0]);
  c.levels = keep.map(x=>c.levels[x[1]]);
  c.rows.forEach(r=>{ if(r[5]!=='★'){ r[11]=''; r[12]=''; } });
  c.spans = groupSpans(c.rows,0).concat(groupSpans(c.rows,1));
});
a2.kpi = [
  {label:'生息资产规模（合并口径）',value:'520.00',unit:'亿元',trend:'+9.5%',ytd:'+6.2%',dir:'up',type:''},
  {label:'自有出资规模（横琴单体）',value:'260.00',unit:'亿元',trend:'+10.5%',ytd:'+6.8%',dir:'up',type:''},
  {label:'新增自有出资规模（横琴单体）',value:'68.00',unit:'亿元',trend:'+15.2%',ytd:'+9.5%',dir:'up',type:''},
  {label:'退出自有出资规模（横琴单体）',value:'42.00',unit:'亿元',trend:'+12.5%',ytd:'+8.0%',dir:'up',type:''}
];
a2.count = a2.calibers.reduce((n,c)=>n+c.rows.length,0);
a2.name = '02-业务结构('+a2.count+'个)';

/* ---------- 03-风险指标 / 04-产融业务：删概览、分类合并 ---------- */
delete A.asset03.kpi;
A.asset03.calibers.forEach(c=>{ c.spans = groupSpans(c.rows,0); });
delete A.asset04.kpi;
A.asset04.calibers.forEach(c=>{ c.spans = groupSpans(c.rows,0).concat(groupSpans(c.rows,1)); });

/* ---------- 序列化输出 ---------- */
function ser(v, d){
  const pad = '  '.repeat(d);
  if(Array.isArray(v)){
    if(v.every(x=>typeof x==='string'||typeof x==='number'||x===null)) return JSON.stringify(v);
    return '[\n'+v.map(x=>pad+'  '+ser(x,d+1)).join(',\n')+'\n'+pad+']';
  }
  if(v && typeof v==='object'){
    if(Object.values(v).every(x=>typeof x!=='object')) return JSON.stringify(v);
    return '{\n'+Object.keys(v).map(k=>pad+'  '+JSON.stringify(k)+': '+ser(v[k],d+1)).join(',\n')+'\n'+pad+'}';
  }
  return JSON.stringify(v);
}

const header = `/* ============================================================
   金控指标体系数据应用平台 - 华润资产报表数据
   依据《华润资产报表.xlsx》(2026-08-28 读取) 生成，按页面优化要求调整：
   - sheet 名称：01-收入结构 / 02-业务结构 / 03-风险指标 / 04-产融业务
   - 指标按口径分组存于 calibers 数组，页面以页签切换；每个口径：
     label=口径名称，sub=口径范围说明，levels=层级，rows=指标行，spans=分类/分项 rowspan 合并
   - 表头：「当月值」分组(实际/环比(%))、「截止本月末」分组(实际/同比(%)/较年初(%))
   - 01-收入结构（优化）：
     · 财务考核/资产单体/渝康单体口径在营业收入下增设子指标「其中：产融业务收入」（香港口径不设）
     · 指标概览按口径配置：营业收入/利润总额/人工成本/成本收入比-拨备前，切换口径时数值随之变化
     · 指标分类/指标分项按分类 rowspan 合并
     · 仅考核指标(★ 成本收入比-拨备前)有全年预算/预算达成率，其余为空
   - 02-业务结构（优化）：
     · 删除指标：现金周转率（不良资产经营类业务）/现金周转率（公司整体）、
       本月末累计新增/退出服务集团退出项目数量、业绩合同下服务集团退出项目数量、业绩合同下达成里程碑项目数量
     · 指标分类/指标分项按分类 rowspan 合并；删除后无★考核指标，全年预算/达成率均为空
   - 03-风险指标 / 04-产融业务（优化）：删除指标概览；指标分类 rowspan 合并
   - 数据值为演示示例（模板本身为空表）；预算达成率 = 实际/全年预算*%
   ============================================================ */
const ASSET_SHEETS = `;

fs.writeFileSync(path.join(base,'asset_sheets_data.js'), header + ser(A,0) + ';\n', 'utf8');

/* 摘要校验 */
console.log('asset01:', a1.name, a1.calibers.map(c=>c.label+' rows='+c.rows.length+' kpi='+(c.kpi||[]).length+' spans='+c.spans.length).join(' | '));
console.log('asset02:', a2.name, a2.calibers.map(c=>c.label+' rows='+c.rows.length+' spans='+c.spans.length).join(' | '));
console.log('asset03 kpi:', A.asset03.kpi, 'spans:', A.asset03.calibers.map(c=>c.spans.length).join(','));
console.log('asset04 kpi:', A.asset04.kpi, 'spans:', A.asset04.calibers.map(c=>c.spans.length).join(','));
const star01 = a1.calibers.every(c=>c.rows.every(r=>(r[11]||r[12]) ? r[5]==='★' : true));
const star02 = a2.calibers.every(c=>c.rows.every(r=>!(r[11]||r[12])));
console.log('01 预算仅★:', star01, '| 02 预算全空:', star02);
