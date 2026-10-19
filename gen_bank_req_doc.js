/* ============================================================
   生成《华润银行模块需求文档》HTML
   - 数据源：sheets_data.js（实时读取，保证文档与页面实现一致）
   - 受众：业务（确认页面展示与取值口径）+ 开发（按文档开发/验收）
   - 产出：需求文档-华润银行模块.html
   ============================================================ */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'sheets_data.js'), 'utf8');
eval(src.replace('const SHEETS', 'globalThis.SHEETS'));

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* 占位/数值展示：'-' → 灰色 -- */
const val = v => (v === '-' || v === '' || v == null) ? '<span class="ph">--</span>' : esc(v);
/* 指标属性标签：★→蓝「考核指标」；高质量指标→绿；★|高质量→双标签 */
function tagHtml(v) {
  const s = String(v == null ? '' : v);
  if (!s.trim()) return '<span class="ph">--</span>';
  const parts = s.split('|');
  let h = '';
  if (parts.includes('★')) h += '<span class="tag assess">考核指标</span>';
  if (parts.includes('高质量指标')) h += '<span class="tag hq">高质量指标</span>';
  return h || esc(s);
}
/* 展开表头叶子列（与平台 hideColsView 同规则），返回 [{group,label,r}] */
function expandCols(sh) {
  const row1 = sh.headers[0], row2 = sh.headers[1] || [];
  const leaves = []; let j = 0;
  row1.forEach(h => {
    const c = h.c || 1, r = h.r || 1;
    for (let k = 0; k < c; k++) {
      if (r > 1) leaves.push({ group: h.l, label: h.l, r });
      else { leaves.push({ group: h.l, label: row2[j] ? row2[j].l : h.l, r: 1 }); j++; }
    }
  });
  const hide = sh.hideCols || [];
  return leaves.filter(L => {
    const key = L.r > 1 ? L.group : L.group + '/' + L.label;
    return hide.indexOf(key) < 0;
  });
}
/* 渲染两级表头（应用 hideCols 后） */
function headerTable(sh) {
  const cols = expandCols(sh);
  const hide = sh.hideCols || [];
  let r1 = '<tr>', r2 = '<tr>', j = 0;
  sh.headers[0].forEach(h => {
    const c = h.c || 1, r = h.r || 1;
    if (r > 1) {
      const hidden = hide.indexOf(h.l) >= 0;
      if (!hidden) r1 += `<th rowspan="2">${esc(h.l)}</th>`;
    } else {
      const sub = (sh.headers[1] || []).slice(j, j + c);
      const vis = sub.filter(x => hide.indexOf(h.l + '/' + x.l) < 0);
      j += c;
      if (!vis.length) return;
      r1 += `<th colspan="${vis.length}">${esc(h.l)}</th>`;
      r2 += vis.map(x => `<th class="sub">${esc(x.l)}</th>`).join('');
    }
  });
  return `<table class="doc-table head-demo"><thead>${r1}</tr>${r2}</tr></thead></table>`;
}
/* 指标明细全量表（含层级样式、标签、确认列） */
function rowsTable(sh) {
  const cols = expandCols(sh);
  let h = '<table class="doc-table rows"><thead><tr>'
    + cols.map(c => `<th${c.group !== c.label ? ` title="${esc(c.group)}"` : ''}>${esc(c.label)}</th>`).join('')
    + '<th class="cfm">业务确认</th></tr></thead><tbody>';
  sh.rows.forEach((r, i) => {
    const lv = (sh.levels && sh.levels[i]) || 0;
    h += '<tr>' + r.map((v, ci) => {
      const label = cols[ci] ? cols[ci].label : '';
      if (label === '指标名称') return `<td class="name lv${lv}">${esc(v)}</td>`;
      if (label === '指标属性标签') return `<td>${tagHtml(v)}</td>`;
      if (/序号/.test(label)) return `<td class="c">${esc(v)}</td>`;
      return `<td class="c">${val(v)}</td>`;
    }).join('') + '<td class="cfm">☐</td></tr>';
  });
  return h + '</tbody></table>';
}
/* KPI 卡片需求表 */
function kpiTable(sh, hideYtd) {
  if (!sh.kpi || !sh.kpi.length) return '<p class="none">本报表无指标概览卡片。</p>';
  let h = '<table class="doc-table"><thead><tr><th>卡片</th><th>指标名称</th><th>当前值</th><th>单位</th><th>同比</th>'
    + (hideYtd ? '' : '<th>较年初</th>') + '<th>说明</th></tr></thead><tbody>';
  sh.kpi.forEach((k, i) => {
    const noYtd = hideYtd || k.noYtd;
    h += `<tr><td class="c">${i + 1}</td><td>${esc(k.label)}</td><td class="c num">${esc(k.value)}</td><td class="c">${esc(k.unit)}</td>`
      + `<td class="c">${esc(k.trend || '-')}</td>`
      + (hideYtd ? '' : `<td class="c">${noYtd ? '<span class="ph">不显示</span>' : esc(k.ytd || '-')}</td>`)
      + `<td>${k.trendLabel ? '同比行标签为「' + esc(k.trendLabel) + '」；' : ''}${noYtd ? '不显示较年初行' : '含较年初行'}</td></tr>`;
  });
  return h + '</tbody></table>';
}
/* （2）指标概览卡片：仅文字说明卡片有哪些指标、每个指标分别展示什么（不列表格与数值） */
function kpiDesc(sh, hideYtd) {
  if (!sh.kpi || !sh.kpi.length) return '<p class="none">本报表无指标概览卡片。</p>';
  const valCol = sh.freq === '季度' ? '截止本季末' : '截止本月末'; // 季度报表展示截止本季末
  let h = `<p>面板顶部共 <b>${sh.kpi.length} 张</b>指标概览卡片，各卡片的指标与展示内容如下：</p><ul class="tight">`;
  sh.kpi.forEach((k, i) => {
    const noYtd = hideYtd || k.noYtd;
    let s = `展示<b>${valCol}</b>（单位：${esc(k.unit)}）、<b>${k.trendLabel ? esc(k.trendLabel) : '同比'}</b>`;
    if (!noYtd) s += '、<b>较年初</b>';
    h += `<li><b>卡片${i + 1}·${esc(k.label)}</b>：${s}。</li>`;
  });
  return h + '</ul>';
}
function chartDesc(sh) {
  const d = [];
  [['chart', '图表一'], ['chart2', '图表二']].forEach(([k, nm]) => {
    const c = sh[k]; if (!c) return;
    const typeMap = { composition: '结构占比图（横向堆叠条+图例）', bar: '柱状对比图', trend: '趋势折线图', gauge: '监测仪表盘', waterfall: '瀑布图' };
    let items = '';
    if (c.data) items = c.data.map(x => `${x.name}=${x.value}`).join('，');
    if (c.type === 'gauge') items = `监测值 ${c.value}${c.threshold != null ? '，监管阈值 ' + c.threshold : ''}${c.target != null ? '，目标值 ' + c.target : ''}（量程 ${c.min}~${c.max}）`;
    d.push(`<li><b>${nm}「${esc(c.title)}」</b>：${typeMap[c.type] || c.type}。数据项：${esc(items)}。</li>`);
  });
  return d.length ? '<ul class="tight">' + d.join('') + '</ul>' : '<p class="none">本报表无图表。</p>';
}

/* 列类型判定（与平台 getColTypes 同规则；序号单列为 seq，均为结构列） */
function colTypeOf(label) {
  const l = String(label || '');
  if (/指标名称/.test(l)) return 'name';
  if (/指标属性标签|是否考核/.test(l)) return 'assess';
  if (/预算进度|预算达成率/.test(l)) return 'progress';
  if (/同比|较年初|环比/.test(l)) return 'delta';
  if (/指标分类|指标分项|指标类|指标项|指标口径/.test(l)) return 'group';
  if (/监管要求/.test(l)) return 'req';
  if (/^单位$/.test(l)) return 'unit';
  if (/^序号$/.test(l)) return 'seq';
  return 'value';
}
/* 结构列（原样显示）：name/assess/group/req/unit/seq；数值列（value/delta/progress）：不显示具体值，
   有值→空白，无值('-')→打 ✗。指标分类/分项按 spans 复现纵向合并。 */
const STRUCT_TYPES = { name: 1, assess: 1, group: 1, req: 1, unit: 1, seq: 1 };

/* 时间类型：根据指标名称自动匹配 →「时点指标」（存量/时点）|「期间指标」（流量/期间发生额/期间日均）
   规则：期间特征优先（收入/利润/费用/日均/新增/收益率等；「低成本存款」的"成本"为产品名，需排除）；
        其余按存量特征（余额/比率/客户数等）判时点；未匹配默认时点（银行报表以存量为主）。 */
function timeTypeOf(name) {
  const n = String(name == null ? '' : name);
  if (/(收入|营收|收益|利润|损益|减值|费用|管理费|税金|所得税|附加|EVA|RAROC|生成|处置|新增|净增|日均|收益率|付息率|利差|息差)/.test(n)
      || /(?<!低)成本/.test(n)) return '期间指标';
  if (/(余额|资产|负债|所有者权益|净额|存款|贷款|投资|贴现|福费廷|存拆放|回购|存放央行|借款|应付债券|客户|用户|户数|比率|比例|占比|率|集中度|拨备|规模|AUM|贸易融资|基石)/.test(n)) return '时点指标';
  return '时点指标';
}
/* 时间类型人工指定（业务确认口径，优先于名称自动匹配）：
   06-存贷结构 / 07-利率结构 全表 → 时点指标；
   09-风险情况：小额不良生成率、对公新增风险管控额 → 时点指标 */
const TT_SHEET_OVERRIDE = { '06': '时点指标', '07': '时点指标' };
const TT_NAME_OVERRIDE = { '09': ['小额不良生成率', '对公新增风险管控额'] };

/* ============ 系统原型示意图：以 DOM shim 加载平台脚本，取各报表面板真实渲染 markup；
   平台样式经 scopeCss 限定于 .proto 作用域后内联，原型为静态示意（无运行时 JS 依赖） ============ */
function scopeCss(css, scope) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, ''); // 先去注释，避免注释混入选择符块
  const prefix = sel => sel.split(',').map(s0 => {
    const s = s0.trim();
    if (!s) return s;
    if (s === '*') return scope + ' *';
    if (/^(body|html)\b/.test(s)) return scope + s.replace(/^(body|html)/, '');
    if (s.startsWith(':root')) return scope;
    return scope + ' ' + s;
  }).join(',');
  function walk(src) {
    let out = '', i = 0;
    while (i < src.length) {
      const at = src.indexOf('@', i), ob = src.indexOf('{', i);
      if (ob < 0) { out += src.slice(i); break; }
      if (at >= 0 && at < ob) {
        let depth = 0, j = ob;
        do { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++; } while (j < src.length && depth > 0);
        const head = src.slice(at, ob), body = src.slice(ob + 1, j - 1);
        if (/@(keyframes|font-face)/.test(head)) out += head + '{' + body + '}';
        else out += head + '{' + walk(body) + '}';
        i = j;
      } else {
        const cb = src.indexOf('}', ob);
        out += prefix(src.slice(i, ob)) + '{' + src.slice(ob + 1, cb) + '}';
        i = cb + 1;
      }
    }
    return out;
  }
  return walk(css);
}
function loadPlatform() {
  const vm = require('vm');
  const ph = fs.readFileSync(path.join(__dirname, '战略部数据应用平台.html'), 'utf8');
  const css = ph.slice(ph.indexOf('<style>') + 7, ph.indexOf('</style>'));
  const inline = [...ph.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const allNodes = [];
  const makeNode = tag => {
    const node = {
      tagName: (tag || 'div').toUpperCase(), children: [], className: '', id: '', textContent: '',
      _innerHTML: '', dataset: {}, style: {}, attrs: {},
      classList: {
        add: (...cs) => cs.forEach(c => { if (!node.className.split(/\s+/).includes(c)) node.className += ' ' + c; }),
        remove: (...cs) => { node.className = node.className.split(/\s+/).filter(c => c && !cs.includes(c)).join(' '); },
        toggle: (c, f) => { const has = node.className.split(/\s+/).includes(c); const w = f === undefined ? !has : !!f; node.className = w ? node.className + ' ' + c : node.className.split(/\s+/).filter(x => x !== c).join(' '); return w; },
        contains: c => node.className.split(/\s+/).includes(c)
      },
      appendChild(ch) { node.children.push(ch); return ch; },
      addEventListener() {}, setAttribute(k, v) { node.attrs[k] = v; },
      querySelectorAll() { return []; }, querySelector() { return null; }, closest() { return null; },
      getBoundingClientRect() { return { top: 0, left: 0 }; },
      get nextElementSibling() { return null; }
    };
    Object.defineProperty(node, 'innerHTML', { get: () => node._innerHTML, set: v => { node._innerHTML = String(v); } });
    allNodes.push(node);
    return node;
  };
  const documentStub = {
    createElement: t => makeNode(t),
    getElementById(id) { return allNodes.find(n => n.id === id) || (() => { const n = makeNode('div'); n.id = id; return n; })(); },
    querySelectorAll() { return []; }, querySelector() { return null; }, addEventListener() {},
    body: makeNode('body')
  };
  const windowStub = { pageYOffset: 0, scrollTo() {}, addEventListener() {} };
  const ctx = vm.createContext({
    document: documentStub, window: windowStub, alert() {}, console,
    setTimeout: () => 0, clearTimeout() {}, parseFloat, parseInt, isNaN, Array, Object, String, Number, Math, RegExp
  });
  ['sheets_data.js', 'asset_sheets_data.js', 'trust_sheets_data.js', 'insurance_sheets_data.js', 'lease_sheets_data.js', 'cockpit_data.js', 'indicator_standard_data.js'].forEach(f => {
    const fp = path.join(__dirname, f);
    if (fs.existsSync(fp)) vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: f });
  });
  vm.runInContext(inline[0], ctx, { filename: 'inline_page.js' });
  const panels = {};
  Object.keys(SHEETS).forEach(k => {
    const p = allNodes.find(n => n.id === 'panel-' + k);
    panels[k] = p ? p.innerHTML : '';
  });
  return { css, panels };
}

/* （3）指标明细说明：完整表头 + 全部指标，不展示具体数值，仅以 ✗ 标记该指标在该列无数据 */
function detailTable(sh, sheetKey) {
  const hide = sh.hideCols || [];
  const row1 = sh.headers[0], row2 = sh.headers[1] || [];
  /* 展开全部叶子列（含隐藏列），raw = 在 rows 元素中的下标 */
  const all = []; let j = 0;
  row1.forEach(h => {
    const c = h.c || 1, r = h.r || 1;
    for (let k = 0; k < c; k++) {
      if (r > 1) all.push({ group: h.l, label: h.l, r, raw: all.length });
      else { all.push({ group: h.l, label: row2[j] ? row2[j].l : h.l, r: 1, raw: all.length }); j++; }
    }
  });
  /* 应用 hideCols → 可见叶子列（与页面一致） */
  const vis = all.filter(L => {
    const key = L.r > 1 ? L.group : L.group + '/' + L.label;
    return hide.indexOf(key) < 0;
  });
  const rawToVis = {}; vis.forEach((L, p) => { rawToVis[L.raw] = p; });
  const types = vis.map(L => colTypeOf(L.label));
  const namePos = types.indexOf('name');            // 指标名称列（时间类型匹配来源）
  const nameRaw = namePos >= 0 ? vis[namePos].raw : -1;

  /* ---- 两级表头（与页面一致，应用 hideCols） ---- */
  let h1 = '<tr>', h2 = '<tr>', jj = 0;
  row1.forEach(h => {
    const c = h.c || 1, r = h.r || 1;
    if (r > 1) {
      if (hide.indexOf(h.l) < 0) h1 += `<th rowspan="2">${esc(h.l)}</th>`;
    } else {
      const sub = row2.slice(jj, jj + c);
      const vsub = sub.filter(x => hide.indexOf(h.l + '/' + x.l) < 0);
      jj += c;
      if (!vsub.length) return;
      h1 += `<th colspan="${vsub.length}">${esc(h.l)}</th>`;
      h2 += vsub.map(x => `<th class="sub">${esc(x.l)}</th>`).join('');
    }
  });
  h1 += '<th rowspan="2" class="ttype">时间类型</th>';
  let html = `<table class="doc-table rows detail"><thead>${h1}</tr>${h2}</tr></thead><tbody>`;

  /* ---- 合并配置：spans 原始列号 → 可见列位置；被覆盖单元格跳过输出 ---- */
  const spanMap = {};
  (sh.spans || []).forEach(sp => {
    const p = rawToVis[sp.col];
    if (p === undefined) return; // 合并列被隐藏
    spanMap[sp.row + ',' + p] = sp.rs;
    for (let k = 1; k < sp.rs; k++) spanMap[(sp.row + k) + ',' + p] = 0;
  });

  /* ---- 表体 ---- */
  sh.rows.forEach((r, i) => {
    const lv = (sh.levels && sh.levels[i]) || 0;
    let tr = '<tr>';
    vis.forEach((L, p) => {
      const sm = spanMap[i + ',' + p];
      if (sm === 0) return; // 被上方 rowspan 覆盖
      const rs = sm > 1 ? ` rowspan="${sm}"` : '';
      const v = r[L.raw], t = types[p];
      if (t === 'name') tr += `<td class="name lv${lv}"${rs}>${esc(v)}</td>`;
      else if (t === 'assess') { // 指标属性标签：页面为 -- 的（无标签）→ 打 ✗；有标签 → 徽章
        const s = String(v == null ? '' : v);
        tr += `<td class="c"${rs}>${s.trim() ? tagHtml(v) : '<span class="xmark">✗</span>'}</td>`;
      }
      else if (STRUCT_TYPES[t]) tr += `<td class="c"${rs}>${val(v)}</td>`; // seq/group/req/unit
      else { // value/delta/progress：不显示具体值
        const na = (v === '-' || v === '' || v == null);
        tr += `<td class="c"${rs}>${na ? '<span class="xmark">✗</span>' : ''}</td>`;
      }
    });
    const nm = nameRaw >= 0 ? String(r[nameRaw] == null ? '' : r[nameRaw]) : '';
    let tt = timeTypeOf(nm); // 时间类型：按指标名称自动匹配
    if (TT_SHEET_OVERRIDE[sheetKey]) tt = TT_SHEET_OVERRIDE[sheetKey]; // 整表人工指定优先
    else if ((TT_NAME_OVERRIDE[sheetKey] || []).indexOf(nm) >= 0) tt = '时点指标'; // 指定指标人工改判
    const ttCls = tt === '期间指标' ? 'tt-period' : 'tt-point'; // 时点=蓝 / 期间=橙
    html += tr + `<td class="c ttype"><span class="tt ${ttCls}">${tt}</span></td></tr>`;
  });
  return html + '</tbody></table>';
}

/* ============ 每张报表的业务描述与特殊规则（人工撰写） ============ */
const META = {
  '01': {
    brief: '全行资产负债总量与结构的存量余额监测表，覆盖资产（贷款/投资/同业）、负债（存款/债券/同业）与所有者权益三大板块。',
    rules: [
      '全部为<b>存量时点口径</b>：「去年末」=上年年末余额，「截止本月末-实际」=本月末余额；同比=较上年同期变动幅度，较年初=较去年末变动幅度。',
      '无「指标属性标签」「当月值」「全年预算」列（存量简表不设月度流量与预算考核）。',
      '层级关系：总资产/贷款/投资类资产/总负债/所有者权益等为一级指标；普通贷款、福费廷、票据贴现、债券投资、同业投资、信托基金投资、其他投资等为二级明细。',
    ],
    confirm: '请确认 20 项指标的名称、层级归属与存量口径是否符合业务预期。',
  },
  '02': {
    brief: '全行损益简表，含当月值列组（实际/环比），考核指标（★）带全年预算与达成率。',
    rules: [
      '<b>勾稽关系</b>：其他非息收入 = 投资收益 + 公允价值变动损益（当前演示值 22.90 = 投资收益项，勾稽成立）。',
      '「当月值-实际」为当月单月数（演示口径 = 去年末 ÷ 12），「环比」= 当月较上月；「截止本月末-实际」为本年累计数，「同比」= 较上年同期累计。',
      '本表<b>无「较年初」列</b>（2026-09-22 删除）；指标卡片同步不显示较年初行。',
      '层级关系：营业收入为一级；利息净收入、非息净收入、其中：手续费及佣金净收入、其他非息收入、投资收益、公允价值变动损益为二级（同样式）；拨备前利润及以下为一级。',
      '预算一致性：执行通用规则 2.1.8（当前演示数据中仅 ★ 行「营业收入」「利润总额」维护了全年预算）。',
    ],
    confirm: '请确认损益科目层级、勾稽关系与当月值口径（累计÷12 为演示算法，正式环境应取真实单月数）。',
  },
  '03': {
    brief: '监管关键监测指标表，按流动性风险/信用风险/盈利性/资本充足情况/集中度五大分类分组展示，含监管要求列。',
    rules: [
      '<b>更新频率为「季度」</b>：数据日期月份下拉自动切换为 Q1~Q4（默认 Q4，取值=季末月 3/6/9/12）。',
      '「监管要求」列展示监管红线（如 ≥100%、≥10.5%）；「监测指标信息」列组含 序号/指标名称/单位/指标属性标签/监管要求。',
      '比率类指标的同比/较年初变动值带 <b>ppt</b>（百分点）单位，随数值单元格显示。',
      '指标分类列 rowspan 合并：流动性风险(4)/信用风险(2)/盈利性(4)/资本充足情况(8)/集中度指标(3)。',
      '图表：资本充足率监测仪表盘（监管阈值 ≥10.5%）+ 监管指标达标对比柱状图（实际 vs 监管要求）。',
    ],
    confirm: '请确认五大分类的指标归属、监管要求值与季度频率设置。',
  },
  '04': {
    brief: '全行收入结构表，按条线营收/条线利息净收入/条线非息净收入三个分项展开，含当月值列组。',
    rules: [
      '「当月值-实际」演示口径 = 去年末 ÷ 12（正式环境应取真实单月数）；「截止本月末」为本年累计。',
      '本表<b>无「较年初」列</b>（2026-09-24 删除）；指标卡片同步不显示较年初行。',
      '层级关系（2026-09-24 调整）：全行利息净收入、公司条线利息净收入、零售条线利息净收入均为一级；全行非息收入/公司条线非息收入/零售条线非息收入/全行投资收益/其他收入为一级，其下「其中：」明细为二级。',
      '指标分项列 rowspan 合并：条线营收(9)/条线利息净收入(3)/条线非息净收入(9)；指标分类「收入结构」跨全部 21 行。',
      '预算一致性（通用规则 2.1.8）：本表仅「其中：全行手续费及佣金净收入」（★）维护了全年预算，显示预算 31.40 与达成率 91.1%。',
    ],
    confirm: '请确认 21 项指标的一/二级层级划分（尤其利息净收入三项拉平为一级）与「其中：」明细归属。',
  },
  '05': {
    brief: '三大条线（公司/零售/金融市场）成本结构表，含营业成本、日常成本、资本成本、EVA、RAROC。',
    rules: [
      '明细表<b>隐藏「截止本月末/较年初」列</b>（hideCols 配置，数据保留、页面不显示，2026-09-23）；指标卡片同步不显示较年初行。',
      '层级关系（2026-09-23 调整）：各条线 EVA / RAROC（公司/零售/金融市场共 6 项）提升为一级指标，不再隶属条线成本合计。',
      '指标分项列 rowspan 合并：公司条线成本(6)/零售条线成本(6)/金融市场条线成本(6)。',
      '本表无「指标属性标签」「当月值」「全年预算」列。',
    ],
    confirm: '请确认较年初列隐藏、EVA/RAROC 提升为一级后的展示效果。',
  },
  '06': {
    brief: '存款余额、AUM、存款年日均、贷款投放四大板块共 30 项指标，含高质量指标双标签。',
    rules: [
      '层级关系（2026-09-24 调整）：仅 4 项为二级——其中：个人非存AUM月日均、代发客户AUM月日均、其中：低成本存款年日均、其中：润薪贷、AUM贷、财富贷、车位贷；其余 26 项均为一级。',
      '<b>双标签并存</b>：其中：个人非存AUM月日均、公司-科技企业客群净增余额 =「考核指标+高质量指标」蓝绿双标签；低成本存款占比、产融协同低成本存款年日均余额、绿色金融余额 = 仅「高质量指标」绿标签。',
      '预算一致性：执行通用规则 2.1.8；高质量-only 行未维护全年预算，保持 --。',
      '指标分项列 rowspan 合并：存款余额(5)/AUM(3)/存款年日均(8)/贷款投放(14)。',
    ],
    confirm: '请确认 30 项指标层级（4 项二级）、5 项高质量标签打标名单与预算口径。',
  },
  '07': {
    brief: '资产收益率、负债付息率与利差监测表（15 项比率指标，单位均为 %）。',
    rules: [
      '<b>同比/较年初列数值自带 ppt 单位</b>（利率类指标的变动值为百分点口径，2026-09-24），表头不再标注 (%)。',
      '层级关系：贷款对客收益率（下含对公/个人/贴现 3 项二级）、存款对客付息率（下含公司/个人 2 项二级），其余为一级。',
      '指标分项列 rowspan 合并：资产(7)/负债(6)/其他(2)。',
      '本表无「指标属性标签」「当月值」「全年预算」列。',
    ],
    confirm: '请确认 15 项利率指标的数值与 ppt 变动值口径。',
  },
  '08': {
    brief: '公司客群、零售客群、数字客群三大板块客户规模监测（14 项），含高质量指标双标签。',
    rules: [
      '层级关系：仅「其中：大中有效授信客户数」「中小有效授信客户数」为二级，其余均为一级（2026-09-24 修正：产融协同客户数、零售中高端客户数由二级改为一级）。',
      '<b>双标签并存</b>：基石客户、代发客户数 =「考核指标+高质量指标」蓝绿双标签；公司有效客户数、产融协同客户数、零售高净值客户数 = 仅「高质量指标」绿标签。',
      '图表二为<b>考核指标预算达成率(%)</b>柱状图（仅统计 ★ 行）。',
      '<b>预算达成率净增量口径</b>（通用规则 2.1.8 特别说明）：公司有效客户数、基石客户、产融协同客户数、代发客户数、零售高净值客户数 5 项指标的达成率 =（截止本月末实际值 − 上一年度年末实际值）÷ 全年预算值 × 100%。',
      '指标分项列 rowspan 合并：公司客群(7)/零售客群(4)/数字客群(3)。',
    ],
    confirm: '请确认 14 项客群指标层级、5 项高质量标签名单与达成率图统计范围。',
  },
  '09': {
    brief: '资产质量与风险情况监测表（15 项），覆盖五级分类贷款余额、不良率、拨备、处置与新增风险管控。',
    rules: [
      '全部 15 项均为一级指标（无层级缩进）。',
      '<b>高质量指标打标</b>（2026-09-24）：小额不良生成率、对公新增风险管控额 两行「指标属性标签」列显示绿色「高质量指标」标签；两行仍为非考核口径，预算/达成率保持 --。',
      '图表：五级分类贷款余额结构占比图 + 不良率与拨备覆盖率趋势图。',
      '预算一致性：执行通用规则 2.1.8（当前演示数据中仅 ★ 行维护了全年预算）。',
    ],
    confirm: '请确认 15 项风险指标清单、2 项高质量标签与五级分类图数据。',
  },
};
const HIDE_YTD = ['02', '04', '05']; // 卡片不显示较年初的银行报表（HTML hideYtd 配置）

/* ============ 组装 HTML ============ */
const keys = Object.keys(SHEETS);
const menuName = n => n.replace(/[(（]\s*\d+\s*个\s*[)）]\s*$/, '').trim();
const PLATFORM = loadPlatform();
const protoCss = scopeCss(PLATFORM.css, '.proto') + `
.proto{border:1px solid #d5dce8;border-radius:8px;background:#f4f6fa;padding:16px 18px;margin:10px 0 20px;}
.proto .sheet-panel{display:block !important;}
.proto .btn,.proto select{pointer-events:none;}
`;

let sheetSections = '', tocSheets = '';
keys.forEach((k, i) => {
  const sh = SHEETS[k];
  const cols = expandCols(sh);
  tocSheets += `<li><a href="#sheet-${k}">3.${i + 1}　${esc(menuName(sh.name))}</a></li>`;
  sheetSections += `
<section id="sheet-${k}">
  <h4>2.2.${i + 1}　${esc(menuName(sh.name))}　<span class="cnt">${sh.rows.length} 项指标</span></h4>
  <h5>（1）报表基本信息</h5>
  <table class="doc-table kv"><tbody>
    <tr><th>左侧菜单名称</th><td>${esc(menuName(sh.name))}</td><th>页面标题</th><td>${esc(sh.title)}</td></tr>
    <tr><th>更新频率</th><td>${esc(sh.freq || '月度')}${sh.freq === '季度' ? '（数据日期下拉为 Q1~Q4）' : '（数据日期下拉为 1~12 月）'}</td>
        <th>指标行数</th><td>${sh.rows.length} 行</td></tr>
    <tr><th>指标概览</th><td>${sh.kpi ? sh.kpi.length + ' 张卡片' : '无'}</td>
        <th>明细表列数</th><td>${cols.length} 列（含指标名称等结构列）</td></tr>
    <tr><th>数据起始期间</th><td>2024 ～ 当前年度，默认选中当前年度</td>
        <th>导出</th><td>面板右上角「📥 导出」按钮</td></tr>
  </tbody></table>
  <h5>（2）指标概览卡片</h5>
  ${kpiDesc(sh, HIDE_YTD.includes(k))}
  <h5>（3）导出说明</h5>
  <ul class="tight">
    <li><b>导出样式</b>：导出表头与数据展示保持和系统页面一致；</li>
    <li><b>导出文件名称</b>：统一为「华润银行-报表名称-数据期间.xlsx」；数据期间月度报表为「年-月」、季度报表为「年Q季」（如 ${sh.freq === '季度' ? `华润银行-${esc(menuName(sh.name))}-2026Q2.xlsx` : `华润银行-${esc(menuName(sh.name))}-2026-08.xlsx`}）。</li>
  </ul>
  <h5>（4）指标明细说明</h5>
  <p class="tip">💡 下表展示本报表页面的全部表头与对应指标清单，不显示具体指标值：指标在当前列不适用时，对应单元格以 <span class="xmark">✗</span> 标记；空白单元格表示该指标在对应列有数值；</p>
  ${k === '03' ? '<p class="tip">💡 <b>监管要求取值说明</b>：对于监管要求类的指标，由业务提供监管数据，在数据库通过指标编号、指标名称对监管取值进行统一维护；</p>' : ''}
  ${detailTable(sh, k)}
  <h5>（5）系统原型示意图</h5>
  <p class="tip">💡 以下为本报表<b>当前系统页面的静态示意图</b>（含演示数值与页面控件样式）；页面交互（期间切换、概览收起、导出等）仅作样式参考。</p>
  <div class="proto"><div class="sheet-panel active">${PLATFORM.panels[k] || '<p class="none">原型加载失败。</p>'}</div></div>
</section>`;
});

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>需求文档 · 华润银行模块（数据应用）</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:"Microsoft YaHei","PingFang SC",Arial,sans-serif;color:#1f2937;font-size:14px;line-height:1.75;background:#eef1f6;}
.page{max-width:1180px;margin:0 auto;background:#fff;box-shadow:0 2px 16px rgba(15,40,71,.10);}
/* 封面头部 */
.cover{background:linear-gradient(135deg,#0f2847 0%,#1a3a6b 55%,#2a5298 100%);color:#fff;padding:44px 56px 36px;}
.cover h1{font-size:26px;letter-spacing:2px;margin-bottom:8px;}
.cover .sub{font-size:14px;opacity:.85;letter-spacing:1px;}
.cover .meta{display:flex;flex-wrap:wrap;gap:10px 28px;margin-top:22px;font-size:12.5px;}
.cover .meta span{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:20px;padding:3px 14px;}
.body{padding:34px 56px 60px;}
h2{font-size:19px;color:#1a3a6b;border-left:5px solid #c8962e;padding-left:12px;margin:38px 0 14px;letter-spacing:1px;}
h2:first-of-type{margin-top:6px;}
h3{font-size:16.5px;color:#1a3a6b;margin:30px 0 10px;padding:8px 12px;background:linear-gradient(90deg,#eef3fa,#f8fafd);border-radius:6px;border-left:4px solid #2a5298;}
h3 .cnt,h4 .cnt{font-size:12px;color:#c8962e;font-weight:600;margin-left:8px;}
h4{font-size:14.5px;color:#2a5298;margin:20px 0 8px;}
h5{font-size:13.5px;color:#2a5298;margin:16px 0 6px;}
p{margin:6px 0;}
.brief{color:#4b5563;}
ul.tight,ol.tight{margin:6px 0 6px 22px;}
ul.tight li,ol.tight li{margin:4px 0;}
ol.toc{margin:8px 0 8px 24px;}
ol.toc li,ul.toc li{margin:3px 0;}
ul.toc{list-style:none;margin-left:0;columns:2;}
ul.toc li a{color:#1a3a6b;text-decoration:none;}
ul.toc li a:hover{text-decoration:underline;color:#2a5298;}
a{color:#2a5298;}
/* 表格 */
.doc-table{width:100%;border-collapse:collapse;font-size:12.5px;margin:8px 0 14px;}
.doc-table th{background:linear-gradient(135deg,#1a3a6b,#2a5298);color:#fff;padding:7px 9px;border:1px solid rgba(255,255,255,.22);font-weight:600;text-align:center;white-space:nowrap;}
.doc-table th.sub{background:linear-gradient(135deg,#2a5298,#3a6bb0);font-size:11.5px;}
.doc-table td{border:1px solid #dde3ec;padding:6px 9px;text-align:left;vertical-align:middle;}
.doc-table tbody tr:nth-child(even){background:#f7f9fc;}
.doc-table td.c{text-align:center;}
.doc-table td.num{font-family:Consolas,"Courier New",monospace;font-weight:600;}
.kv th{background:#f0f4fa;color:#1a3a6b;border:1px solid #dde3ec;width:130px;text-align:left;white-space:nowrap;}
/* 表头示意（还原页面蓝底两级表头） */
.head-demo{width:auto;min-width:60%;}
/* 明细行表 */
.rows{min-width:100%;}
.rows td.name{font-weight:400;}
.rows td.name.lv0{font-weight:700;color:#1a3a6b;text-align:left;}
.rows td.name.lv1{font-family:"SimHei","Heiti SC","Microsoft YaHei",sans-serif;text-align:left;padding-left:26px;}
.rows td.name.lv2{color:#9ca3af;text-align:left;padding-left:44px;}
.rows td.cfm,.rows th.cfm{text-align:center;width:64px;color:#c8962e;font-weight:700;}
td.cfm{text-align:center;color:#c8962e;font-weight:700;}
.rows td.ttype{text-align:center;width:84px;white-space:nowrap;}
.rows th.ttype{width:84px;}
/* 时间类型徽章：时点指标=蓝、期间指标=橙（一眼区分） */
.tt{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11.5px;font-weight:700;letter-spacing:.5px;}
.tt-point{background:#dce8f8;color:#1a4a8a;}
.tt-period{background:#fde3c8;color:#b45309;}
.ph{color:#6f7b88;font-weight:700;font-family:"SimHei","Microsoft YaHei",sans-serif;letter-spacing:1px;}
.xmark{color:#c0392b;font-weight:700;}
/* 标签（与平台一致：考核=蓝、高质量=绿） */
.tag{display:inline-block;padding:1px 9px;border-radius:4px;font-size:11.5px;font-weight:600;white-space:nowrap;margin:1px 2px;}
.tag.assess{background:#dce8f8;color:#2a5298;}
.tag.hq{background:#eaf7f0;color:#0d8a68;}
/* 提示与确认框 */
.tip{background:#fff8e6;border:1px solid #f0dca8;border-radius:6px;padding:8px 12px;font-size:12.5px;color:#7a5c10;margin:8px 0;}
.confirm-box{background:#eef7f1;border:1px solid #bfe3c9;border-radius:6px;padding:10px 14px;font-size:13px;color:#1d6b45;margin:12px 0;}
.dev-box{background:#eef3fa;border:1px solid #c6d8ee;border-radius:6px;padding:10px 14px;font-size:13px;color:#274b7d;margin:12px 0;}
.none{color:#9ca3af;font-size:12.5px;}
code{background:#f2f4f8;border:1px solid #e0e5ee;border-radius:4px;padding:1px 6px;font-family:Consolas,monospace;font-size:12px;color:#2a5298;}
.footer{padding:18px 56px 30px;color:#9ca3af;font-size:12px;border-top:1px solid #eef1f6;}
@media print{
  body{background:#fff;}
  .page{box-shadow:none;max-width:none;}
  section{page-break-inside:avoid;}
  h3{page-break-after:avoid;}
}
${protoCss}</style>
</head>
<body>
<div class="page">

<div class="cover">
  <h1>华润银行模块 · 数据应用需求文档</h1>
  <div class="sub">金控指标体系数据应用平台 —— 固定报表管理 / 华润银行（9 张报表）</div>
  <div class="meta">
    <span>版本：V1.3</span><span>编制日期：2026-09-29</span>
  </div>
</div>

<div class="body">

<h2 id="toc">目录</h2>
<ul class="toc">
  <li><a href="#intro">一、引言</a></li>
  <li><a href="#func">二、功能需求</a></li>
  <li><a href="#common">2.1　通用需求（9 张报表共用）</a></li>
  ${keys.map((k, i) => `<li><a href="#sheet-${k}">2.2.${i + 1}　${esc(menuName(SHEETS[k].name))}</a></li>`).join('')}
  <li><a href="#perm">三、权限说明</a></li>
  <li><a href="#confirm">四、业务确认</a></li>
</ul>

<h2 id="intro">一、引言</h2>
<h3>1、需求背景</h3>
<p>金控集团战略部推进指标体系数据化应用，在金控指标体系之上建设「数据应用」平台，以「固定报表管理」模块将各业务板块指标体系固化为线上报表，替代线下 Excel 报送与查阅，实现指标展示口径的统一与实时化。</p>
<p>本文档为平台<b>华润银行模块</b>的需求说明：围绕 9 张固定报表，定义页面框架、指标清单、层级与标签、展示与取值规则，作为开发实现与业务核对的依据。文档中指标名称、单位、层级与列结构均与指标体系梳理结果一致；当前数值为演示示例，正式环境由数据接口替换，展示规则不变。</p>
<h3>2、术语与定义</h3>
<table class="doc-table">
  <thead><tr><th style="width:160px;">术语/列名</th><th>口径说明</th></tr></thead>
  <tbody>
    <tr><td>去年末</td><td>上一自然年年末值</td></tr>
    <tr><td>当月值-实际</td><td>当月单月发生数（流量指标）；时点/比率类指标不适用时置 --</td></tr>
    <tr><td>当月值-环比</td><td>当月较上月变动幅度（%）；比率类为百分点差（ppt）</td></tr>
    <tr><td>截止本月末-实际</td><td>本月末时点数（存量）或本年累计发生数（流量），以各指标口径为准</td></tr>
    <tr><td>同比</td><td>较上年同期变动幅度（%）；比率类指标为百分点差（ppt）</td></tr>
    <tr><td>较年初</td><td>较去年末变动幅度（%）；比率类为 ppt；部分报表已按需求删除/隐藏该列</td></tr>
    <tr><td>全年预算 / 预算达成率</td><td>全年预算来源于业务在通用报送平台的维护数据；达成率 =（截止本月末实际 ÷ 全年预算）× 100%（含进度条分色：≥95% 绿、85~95 黄、&lt;85% 红）；<b>净增量口径例外</b>：公司有效客户数、基石客户、产融协同客户数、代发客户数、零售高净值客户数 =（截止本月末实际 − 上一年度年末实际）÷ 全年预算 × 100%</td></tr>
    <tr><td>考核指标</td><td>纳入绩效考核的指标，蓝色标签；唯一有权显示预算/达成率的行</td></tr>
    <tr><td>高质量指标</td><td>高质量发展监测指标，绿色标签；可与考核指标双标签并存</td></tr>
    <tr><td>监管要求</td><td>监管红线阈值（03 表专用列，如 ≥100%、≥10.5%）</td></tr>
    <tr><td>ppt</td><td>percentage point，百分点：两个百分比数值的算术差（如 4.35%→4.10% 为 -0.25ppt）</td></tr>
    <tr><td>N/A 与 --</td><td>N/A=所选期间无历史数据（灰）；--=该指标此列不适用/无值（灰色加粗）</td></tr>
  </tbody>
</table>
<h3>3、需求范围</h3>
<p><b>入口路径</b>：平台顶部导航「数据应用」→ 左侧菜单「固定报表管理 → 华润银行」→ 点击报表名称进入对应页面。</p>
<p><b>范围内</b>：华润银行 9 张固定报表的通用展示需求（2.1）与分报表差异化需求（2.2），含页面框架、数据日期与期间查询、指标概览卡片、明细表结构与取值口径、预算一致性与单元格合并规则。</p>
<p><b>范围外</b>：数据接口与 ETL 实现、通用报送平台的预算维护功能、平台权限体系实现（权限需求见第三章）。</p>
<p><b>报表清单</b>（共 9 张）：</p>
<table class="doc-table">
  <thead><tr><th>编号</th><th>报表名称</th><th>更新频率</th><th>指标行数</th><th>指标概览卡片</th><th>当月值列组</th><th>较年初列</th><th>全年预算列</th><th>指标属性标签列</th></tr></thead>
  <tbody>
  ${keys.map(k => {
    const sh = SHEETS[k], cols = expandCols(sh);
    const has = n => cols.some(c => c.label === n) ? '有' : '<span class="ph">无</span>';
    return `<tr><td class="c">${k}</td><td><a href="#sheet-${k}">${esc(menuName(sh.name))}</a></td><td class="c">${esc(sh.freq || '月度')}</td>`
      + `<td class="c">${sh.rows.length}</td><td class="c">${sh.kpi ? sh.kpi.length + ' 张' : '无'}</td>`
      + `<td class="c">${cols.some(c => c.group === '当月值') ? '有' : '<span class="ph">无</span>'}</td>`
      + `<td class="c">${has('较年初')}</td><td class="c">${has('全年预算')}</td><td class="c">${has('指标属性标签')}</td></tr>`;
  }).join('')}
  </tbody>
</table>
<p class="tip">💡 注：报表菜单名不显示「(N个)」后缀；06/08/09 表 sheet 名中的个数为 Excel 模板原文标注，实际行数以上表为准（06=30 行、08=14 行、09=15 行）。</p>

<h2 id="func">二、功能需求</h2>
<h3 id="common">2.1　通用需求（9 张报表共用）</h3>

<h4>2.1.1　页面框架</h4>
<p>每张报表页面自上而下由三部分组成：</p>
<ol class="toc" style="list-style:decimal;margin-left:24px;">
  <li><b>面板头</b>：左侧页面标题；右侧依次为「更新频率」块（月度/季度）、「📅 数据日期」年+月双下拉、「📥 导出」按钮。</li>
  <li><b>指标概览</b>：折叠条（「指标概览 · 4 项核心 KPI」，默认展开，可点击收起）+ 4 张 KPI 卡片（淡蓝/淡金/淡绿/淡粉四色轮排）；卡片含 指标名、数值+单位、同比行、较年初行（部分报表不显示较年初，见各章）。</li>
  <li><b>明细表</b>：白底卡片内两级表头 + 全量指标行；表头吸顶、超高滚动（最大高度约 600px）。</li>
</ol>

<h4>2.1.2　数据日期与期间查询</h4>
<ul class="tight">
  <li><b>年份下拉</b>：可选范围 <b>2024 ～ 当前年度</b>，默认选中<b>当前年度</b>。</li>
  <li><b>月份下拉</b>：可选范围为所选年份的 1~12 月，默认选中<b>日历上月</b>（有数据）；若当前为 1 月，则默认选中<b>上一年 12 月</b>（年份随之联动为上一年）。</li>
  <li><b>季度报表（03-关键监测指标）</b>：月份下拉切换为 <b>Q1~Q4</b> 季度下拉，默认选中<b>上一个已完结季度</b>；补充说明：若当前在 1~3 月，上一个已完结季度为<b>上一年 Q4</b>。</li>
  <li>切换年/月后<b>自动查询</b>并重渲染页面，右上角 toast 提示「已加载 XXXX 年 X 月 数据 · 报表名」。</li>
  <li><b>查询加载后无数据</b>：保留 KPI 卡片、表头、指标行结构，数值显示灰色 <code>N/A</code>，toast 提示「无历史数据，仅显示报表结构」。</li>
</ul>

<h4>2.1.3　指标名称层级样式</h4>
<ul class="tight">
  <li><b>一级（lv0）</b>：加粗、深蓝色、左对齐顶格。</li>
  <li><b>二级（lv1）</b>：黑体（SimHei）、正常字重、左对齐。</li>
  <li><b>三级（lv2）</b>：浅灰色、右对齐（当前银行 9 表中未使用，保留能力）。</li>
</ul>

<h4>2.1.4　指标属性标签列（含该列的报表）</h4>
<ul class="tight">
  <li>蓝色标签「考核指标」；绿色标签「高质量指标」。</li>
  <li>无标签 → 灰色占位 <span class="ph">--</span>。</li>
</ul>

<h4>2.1.5　数值与涨跌显示规范</h4>
<ul class="tight">
  <li>数值列：正增长<b>红色 ▲</b>、负增长<b>绿色 ▼</b>、零值灰色无箭头（金融业惯例：红涨绿跌）。</li>
  <li>同比/环比/较年初列表头不带 (%) 后缀（2026-09 统一优化），单位随数值单元格自带（% 或 ppt）。</li>
  <li>占位符统一：数据级占位 - → 灰色加粗 <span class="ph">--</span>；取不到数据 → 灰色 <code>N/A</code>。</li>
  <li>比率类指标（单位 %）的变动值用 ppt（百分点），金额/数量类用 %。</li>
</ul>

<h4>2.1.6　指标取值说明（去年末、当月值 / 当季值、截止本月末 / 截止本季末、年初余额）</h4>
<ol class="tight">
  <li><b>去年末</b>：<b>期间指标</b>取上一年度 12 月、时间维度为【本年累计数】；<b>时点指标</b>取上一年度 12 月、时间维度为【本月末】。</li>
  <li><b>当月值</b>：适用于<b>期间指标</b>，同指标分组编码下，取时间维度为【本月数】。</li>
  <li><b>当季值</b>：适用于<b>期间指标</b>，同指标分组编码下，取时间维度为【本季数】。</li>
  <li><b>截止本月末</b>：<b>期间指标</b>取时间维度为【本年累计数】；<b>时点指标</b>取时间维度为【本月末】。</li>
  <li><b>截止本季末</b>：<b>期间指标</b>取时间维度为【本年累计数】；<b>时点指标</b>取时间维度为【本季末】。</li>
  <li><b>年初余额</b>：适用于<b>时点指标</b>，取上一年度 12 月、时间维度为【本月末】。</li>
</ol>

<h4>2.1.7　指标计算公式说明</h4>
<table class="doc-table">
  <thead>
    <tr><th colspan="2">时间类型</th><th colspan="2">当月值</th><th colspan="3">截止本月末</th></tr>
    <tr><th class="sub">时间类型</th><th class="sub">举例</th><th class="sub">实际</th><th class="sub">环比</th><th class="sub">实际</th><th class="sub">同比</th><th class="sub">较年初</th></tr>
  </thead>
  <tbody>
    <tr><td class="c"><span class="tt tt-period">期间值</span></td><td><b>金额类</b>（保费、收入、利润）</td><td>截止本月累计-截止上月累计</td><td>(本月当月值-上月当月值)/上月当月值【%】</td><td>本年累计数</td><td>(本年累计-去年同月累计)/去年同月累计【%】</td><td>不适用</td></tr>
    <tr><td class="c"><span class="tt tt-point">时点值</span></td><td><b>金额类</b>（余额、规模）</td><td>不适用</td><td>不适用</td><td>本月末余额</td><td>(本月末余额-去年同月末余额)/去年同月末余额【%】</td><td>(本月末余额-年初余额)/年初余额【%】</td></tr>
    <tr><td class="c"><span class="tt tt-period">期间值</span></td><td><b>比率类</b>（ROE、新增不良率）</td><td>不适用</td><td>不适用</td><td>本月末数</td><td>本期比率-去年同期比率【百分点】</td><td>不适用</td></tr>
    <tr><td class="c"><span class="tt tt-point">时点值</span></td><td><b>比率类</b>（不良率、占比、覆盖率）</td><td>不适用</td><td>不适用</td><td>本月末数</td><td>本期比率-去年同期比率【百分点】</td><td>本期比率-年初比率【百分点】</td></tr>
  </tbody>
</table>

<h4>2.1.8　预算一致性规则</h4>
<ul class="tight">
  <li>业务在<b>通用报送平台</b>维护了全年预算的指标，则显示「全年预算」「预算达成率」值；否则两列一律 <span class="ph">--</span>。</li>
  <li>预算达成率 = （截止本月末实际值 ÷ 全年预算）× 100%，单元格内含进度条：≥95% 绿色、85%~95% 黄色、&lt;85% 红色。</li>
  <li><b>特别说明</b>：以下指标的预算达成率计算公式为 <b>（截止本月末实际值 − 上一年度年末实际值）÷ 全年预算值 × 100%</b>（净增量口径）：<br>
      <b>公司有效客户数、基石客户、产融协同客户数、代发客户数、零售高净值客户数</b>（以上 5 项均属 08-客群结构）。</li>
</ul>

<h4>2.1.9　单元格合并</h4>
<p>「指标分类」「指标分项」列，单元格按相同分类规则纵向合并，合并区间见各报表原型样式；</p>

<h3 id="perrep">2.2　分报表需求</h3>
${sheetSections}

<h2 id="perm">三、权限说明</h2>
<ul class="tight">
  <li><b>菜单权限</b>：华润银行报表挂接于平台「数据应用 → 固定报表管理」菜单下，查看权限遵循平台统一的角色-菜单权限管理，用户获授「固定报表管理 → 华润银行」菜单权限后方可进入查看。为全体战略部人员开放固定报表管理模块权限。</li>
  <li><b>数据范围</b>：报表数据为华润银行全量指标体系范围，暂不划分数据范围。</li>
  <li><b>功能权限</b>：支持战略部全体人员筛选和导出功能。</li>
  <li><b>维护权限</b>：全年预算等报送类数据由业务人员在通用报送平台维护，本模块只读展示，不提供数据维护入口。</li>
</ul>

<h2 id="confirm">四、业务确认</h2>
<table class="doc-table">
  <thead><tr><th style="width:150px;">确认角色</th><th style="width:180px;">公司-部门</th><th style="width:140px;">确认人（签字）</th><th style="width:120px;">日期</th><th>确认意见</th></tr></thead>
  <tbody>
    <tr><td>需求提出负责人</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>需求开发负责人</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>需求设计负责人</td><td></td><td></td><td></td><td></td></tr>
  </tbody>
</table>

</div>
<div class="footer">华润银行模块 · 数据应用需求文档 V1.3 ｜ 生成日期 2026-09-29 ｜ 本文档由 gen_bank_req_doc.js 基于 sheets_data.js 当前实现自动生成，报表结构/数值与页面一一对应。</div>
</div>
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, '需求文档-华润银行模块.html'), html);
console.log('OK ->  需求文档-华润银行模块.html  ' + (html.length / 1024).toFixed(1) + 'KB');
