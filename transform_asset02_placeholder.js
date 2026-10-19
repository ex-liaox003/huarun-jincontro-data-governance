/* 2026-09-14 业务结构页面数据占位优化：
   1) 名单内指标：当月值「实际」「环比(%)」无数据 → '-'（页面渲染为灰色 --）
   2) 名单外其余指标：「较年初(%)」无数据 → '-'
   3) 指标概览 4 张 KPI 卡（均为名单外指标）：ytd → '-'
   仅改 asset02（02-业务结构），其他 sheet 不动 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'asset_sheets_data.js');
let lines = fs.readFileSync(file, 'utf8').split('\n');

const LIST_A = new Set([
  '生息资产规模',
  '本月末服务集团退出项目存续数量',
  '自有出资规模',
  '其中：特殊资产管理业务自有出资规模',
  '其中：特殊机遇投资业务自有出资规模',
  '其中：不良资产经营业务自有出资规模',
  '其中：问题企业纾困业务自有出资规模'
]);

// 定位 asset02 块边界
let start = -1, end = -1;
lines.forEach((ln, i) => {
  if (start < 0 && ln.includes('"asset02"')) start = i;
  else if (start >= 0 && end < 0 && /"asset03"\s*:/.test(ln)) end = i;
});
if (start < 0 || end < 0) throw new Error('asset02 block not found');
console.log(`asset02 block: line ${start + 1} ~ ${end}`);

let rowsA = 0, rowsOther = 0, kpis = 0;
for (let i = start; i < end; i++) {
  const raw = lines[i];
  const t = raw.trim();
  const indent = raw.slice(0, raw.length - raw.trimStart().length);
  // 明细行： ["分类","分项","序号","名称",...]
  if (t.startsWith('["')) {
    const hadComma = t.endsWith(',');
    const arr = JSON.parse(hadComma ? t.slice(0, -1) : t);
    if (!Array.isArray(arr) || arr.length !== 13) throw new Error(`unexpected row at line ${i + 1}: len=${arr.length}`);
    const name = arr[3];
    if (LIST_A.has(name)) {
      arr[6] = '-'; arr[7] = '-';           // 当月值-实际 / 当月值-环比
      rowsA++;
    } else {
      arr[10] = '-';                          // 截止本月末-较年初(%)
      rowsOther++;
    }
    lines[i] = indent + JSON.stringify(arr) + (hadComma ? ',' : '');
  }
  // KPI 卡对象（含 ytd 字段）
  else if (t.startsWith('{') && t.includes('"ytd"')) {
    const hadComma = t.endsWith(',');
    const obj = JSON.parse(hadComma ? t.slice(0, -1) : t);
    obj.ytd = '-';
    kpis++;
    lines[i] = indent + JSON.stringify(obj) + (hadComma ? ',' : '');
  }
}

let out = lines.join('\n');
// 更新文件头部说明（原「环比/同比/较年初均已补全」已不成立）
out = out.replace(
  '     · 合并口径各指标环比/同比/较年初均已补全',
  '     · 2026-09-14 数据占位规则：存量类指标（生息资产规模/存续数量/自有出资规模及4项其中）当月值实际与环比无数据、\n' +
  '       其余指标（累计新增/退出、业绩合同2项、新增/退出自有出资规模及其其中项）较年初无数据，均以 \'-\' 占位（页面显示 --）'
);
fs.writeFileSync(file, out, 'utf8');
console.log(`完成：名单A行 ${rowsA}（当月值实际/环比→-），其余行 ${rowsOther}（较年初→-），KPI卡 ${kpis}（ytd→-）`);
if (rowsA !== 14 || rowsOther !== 24 || kpis !== 4) {
  console.log('⚠ 数量与预期(14/24/4)不符，请人工核对');
  process.exit(1);
}
