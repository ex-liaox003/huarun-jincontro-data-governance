/* 依据最新《金控战略部银行指标体系模板.xlsx》(excel_fresh.json, 2026-09-04 读取)
   重建 sheets_data.js（华润银行 9 张报表），样式对齐华润保险：
   - 两级表头（r/c 跨行跨列）由 Excel 表头行+合并单元格推导
   - 指标分类/分项按 Excel 合并单元格生成 spans（rowspan 合并，同保险报表2）
   - levels 层级沿用旧版按指标名称映射；新增指标按规则（其中：→2，09 表→0，其余→1）
   - 模板为空表：数值沿用旧版演示值（按指标名称映射），新增指标用 NEWDEMO 演示值 */
const fs = require('fs'), path = require('path');
const base = __dirname;
const fresh = JSON.parse(fs.readFileSync(path.join(base, 'excel_fresh.json'), 'utf8'));
const OLD = new Function(fs.readFileSync(path.join(base, 'sheets_data.js'), 'utf8') + '; return SHEETS;')();

/* 新增指标演示值：[2025年实际, 本月末实际, 同比, 较年初, 全年预算, 预算达成率] */
const NEWDEMO = {
  '06': {
    '低成本存款占比': ['38.50', '38.50', '+1.5%', '+1.2%', '40.00', '96.3%'],
    '产融协同低成本存款年日均余额': ['850.00', '850.00', '+18.5%', '+12.6%', '950.00', '89.5%'],
    '绿色金融余额': ['620.00', '620.00', '+25.6%', '+18.2%', '700.00', '88.6%'],
    '产业金融余额': ['480.00', '480.00', '+22.5%', '+15.8%', '540.00', '88.9%']
  },
  '08': {
    '产融协同客户数': ['1,850', '1,850', '+15.6%', '+10.8%', '2,100', '88.1%'],
    '零售高净值客户数': ['8.50', '8.50', '+12.6%', '+8.8%', '9.50', '89.5%']
  },
  '09': {
    '对公新增风险管控额': ['12.50', '12.50', '-8.5%', '-5.2%', '15.00', '83.3%']
  }
};
const DEMO_ORDER = ['y2025', 'act', 'yoy', 'ytd', 'bud', 'rate'];
const SEM = { '2025年实际': 'y2025', '实际': 'act', '同比(%)': 'yoy', '同比(ppt)': 'yoy', '较年初(%)': 'ytd', '较年初(ppt)': 'ytd', '全年预算': 'bud', '预算达成率': 'rate' };
const FORMULA = '实际/全年预算*%';

const norm = t => String(t).replace(/\s*\n\s*/g, '');
const colIdx = letters => { let n = 0; for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
const parseRange = rg => {
  const m = rg.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  return { c1: colIdx(m[1]), r1: +m[2], c2: colIdx(m[3]), r2: +m[4] };
};

/* 由两级表头推导每列语义标签 */
function colLabelsOf(headers) {
  const labels = []; let li = 0, ci = 0;
  headers[0].forEach(h => {
    if (h.r && h.r > 1) { labels[ci] = h.l; ci += 1; }
    else { const n = h.c || 1; for (let k = 0; k < n; k++) { labels[ci] = (headers[1][li] || {}).l; li++; ci++; } }
  });
  return labels;
}

function buildSheet(sh) {
  const key = sh.name.slice(0, 2);
  const old = OLD[key];
  const merges = sh.merged_ranges.map(parseRange);
  const dataRows = sh.rows.filter(r => Number.isInteger(r.cells[0]));
  const firstRow = dataRows[0].row_num;

  /* 表头：含「序号」的行为一级，其后行为二级 */
  const pre = sh.rows.filter(r => r.row_num < firstRow);
  const h1i = pre.findIndex(r => r.cells.some(c => c === '序号'));
  const h1 = pre[h1i], h2 = pre[h1i + 1];
  const maxCol = Math.max(
    ...sh.rows.map(r => r.cells.map((v, i) => v !== null ? i : -1).reduce((a, b) => Math.max(a, b), 0)),
    ...merges.map(m => Math.max(m.c1, m.c2))
  ) + 1;

  const row1 = [], covered2 = new Set();
  merges.forEach(m => { if (m.r1 === h1.row_num && m.r2 === h2.row_num) { for (let c = m.c1; c <= m.c2; c++) covered2.add(c); } });
  h1.cells.forEach((v, i) => {
    if (v === null) return;
    const vm = merges.find(m => m.c1 === i && m.r1 === h1.row_num && m.r2 > h1.row_num);
    const hm = merges.find(m => m.c1 === i && m.r1 === h1.row_num && m.c2 > m.c1);
    if (hm) row1.push({ l: norm(v), c: hm.c2 - hm.c1 + 1 });
    else if (vm) row1.push({ l: norm(v), r: 2 });
    else row1.push({ l: norm(v), r: 2 });
  });
  const row2 = [];
  h2.cells.forEach((v, i) => { if (v !== null) row2.push({ l: norm(v) }); });
  const headers = [row1, row2];

  /* 数据区 spans（分类/分项 rowspan 合并，同华润保险报表2） */
  const spans = [];
  const covered = new Set(); // "rowOff,col" 被覆盖格（非起点）
  merges.forEach(m => {
    if (m.r1 >= firstRow && m.r2 > m.r1) {
      spans.push({ col: m.c1, row: m.r1 - firstRow, rs: m.r2 - m.r1 + 1 });
      for (let r = m.r1 + 1; r <= m.r2; r++) covered.add((r - firstRow) + ',' + m.c1);
    }
  });

  const labels = colLabelsOf(headers);
  const nameCol = labels.indexOf('指标名称');

  /* 旧表按名称映射：levels + 数值语义值 */
  const oldLabels = colLabelsOf(old.headers);
  const oldNameCol = oldLabels.indexOf('指标名称');
  const oldByName = {};
  old.rows.forEach((r, i) => {
    const vals = {};
    oldLabels.forEach((lb, ci) => { if (SEM[lb]) vals[SEM[lb]] = r[ci]; });
    oldByName[r[oldNameCol]] = { level: old.levels[i], vals };
  });

  const rows = [], levels = [];
  dataRows.forEach((r, ri) => {
    const arr = Array(maxCol).fill('');
    r.cells.forEach((v, i) => {
      if (v === null || i === 0) return;
      if (covered.has(ri + ',' + i)) return;
      if (SEM[labels[i]] && norm(v) === FORMULA) return; // 模板公式说明 → 由演示值填充
      arr[i] = typeof v === 'number' ? String(v) : norm(v);
    });
    arr[0] = String(r.cells[0]);
    const name = arr[nameCol];
    const ob = oldByName[name];
    const demo = (NEWDEMO[key] || {})[name];
    labels.forEach((lb, ci) => {
      const sem = SEM[lb];
      if (!sem || arr[ci] !== '') return;
      if (ob && ob.vals[sem] !== undefined && ob.vals[sem] !== '') arr[ci] = ob.vals[sem];
      else if (demo) arr[ci] = demo[DEMO_ORDER.indexOf(sem)] || '';
    });
    rows.push(arr);
    levels.push(ob ? ob.level : (key === '09' ? 0 : (name.startsWith('其中：') ? 2 : 1)));
  });

  return {
    key,
    data: {
      name: sh.name,
      title: old.title,
      subtitle: old.subtitle,
      count: rows.length,
      levels,
      kpi: old.kpi,
      spans: spans.length ? spans : undefined,
      headers,
      rows,
      chart: old.chart,
      chart2: old.chart2
    }
  };
}

const out = {};
fresh.sheets.forEach(sh => { const { key, data } = buildSheet(sh); out[key] = data; });

const head = `/* ============================================================
   金控指标体系数据应用平台 - 华润银行报表数据
   依据《金控战略部银行指标体系模板.xlsx》(2026-09-04 重新读取) 生成
   - sheet 名称、两级表头、指标分类/分项/名称、单位、★考核与监管要求均与 Excel 完全一致
   - 样式对齐华润保险报表：指标分类/分项按 Excel 合并单元格 rowspan 合并（spans）；
     levels 层级（0=一级加粗顶格，1=二级，2=三级「其中：」）；二/三级右对齐由全局样式统一
   - 模板为空表：数值为演示示例（沿用旧版按指标名称映射，新增指标另行补充演示值）
   - 06/08/09 表 Excel 行数已更新为 30/12/15（sheet 名中个数为模板原文标注）
   ============================================================ */
const SHEETS = `;

fs.writeFileSync(path.join(base, 'sheets_data.js'), head + JSON.stringify(out, null, 2) + ';\n');

/* 摘要 */
Object.entries(out).forEach(([k, s]) => {
  console.log(k, s.name, 'rows=' + s.rows.length, 'cols=' + s.rows[0].length, 'spans=' + (s.spans ? s.spans.length : 0));
});
console.log('OK');
