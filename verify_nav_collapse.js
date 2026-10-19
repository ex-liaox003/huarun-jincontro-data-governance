// 验证：数据应用→固定报表管理 左侧菜单默认收起，点击可逐一展开
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const dir = __dirname;
const html = fs.readFileSync(path.join(dir, '战略部数据应用平台.html'), 'utf8');

let fail = 0;
function check(name, ok, extra) {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  [' + extra + ']' : ''));
  if (!ok) fail++;
}

/* ---------- 最小 DOM 桩 ---------- */
function makeEl(tag) {
  const el = {
    tagName: tag, dataset: {}, children: [], style: {},
    innerHTML: '', textContent: '', type: '', value: '', parentNode: null,
    classList: {
      _s: new Set(),
      add(...cs) { cs.forEach(c => this._s.add(c)); },
      remove(...cs) { cs.forEach(c => this._s.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; },
      contains(c) { return this._s.has(c); }
    },
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    addEventListener() {},
    setAttribute(k, v) { (this._attrs || (this._attrs = {}))[k] = String(v); },
    getAttribute(k) { return this._attrs && k in this._attrs ? this._attrs[k] : null; },
    getBoundingClientRect() { return { top: 0 }; },
    get nextElementSibling() {
      const p = this.parentNode; if (!p) return null;
      return p.children[p.children.indexOf(this) + 1] || null;
    },
    closest(sel) {
      // 仅支持本验证需要的选择器
      let n = el;
      while (n) {
        if (sel === '[data-action]' && n.dataset && n.dataset.action) return n;
        if (sel === 'rect[data-sp-i]' && n.tagName === 'rect' && n.dataset && n.dataset.spI != null) return n;
        if (sel === 'rect[data-t12-i]' && n.tagName === 'rect' && n.dataset && n.dataset.t12I != null) return n;
        if (sel === 'svg' && n.tagName === 'svg') return n;
        if (sel === '[data-module]' && n.dataset && n.dataset.module) return n;
        if (sel === '.dp' && n.classList.contains('dp')) return n;
        if (sel === '.fz-select' && n.classList.contains('fz-select')) return n;
        if (sel === '.topnav-drop' && n.classList.contains('topnav-drop')) return n;
        if (sel === '.dp-pop' && n.classList.contains('dp-pop')) return n;
        if (sel === '.table-card' && n.classList.contains('table-card')) return n;
        if (sel.startsWith('tr[data-no]')) return null;
        n = n.parentNode;
      }
      return null;
    },
    querySelectorAll(sel) {
      const cls = String(sel || '').split('.').filter(Boolean);
      const out = [];
      const walk = n => (n.children || []).forEach(c => {
        if (cls.length && cls.every(x => c.classList.contains(x))) out.push(c);
        walk(c);
      });
      walk(el);
      return out;
    },
    querySelector(sel) { return el.querySelectorAll(sel)[0] || null; }
  };
  // className 与 classList 双向同步
  Object.defineProperty(el, 'className', {
    get() { return [...el.classList._s].join(' '); },
    set(v) { el.classList._s = new Set(String(v == null ? '' : v).split(/\s+/).filter(Boolean)); },
    enumerable: true
  });
  return el;
}
const byId = {};
const docListeners = [];
const chListeners = [];
const hovListeners = { mouseover: [], mousemove: [], mouseout: [] };
const document_ = {
  createElement: t => makeEl(t),
  getElementById: id => byId[id] || (byId[id] = makeEl('div')),
  querySelectorAll: sel => {
    const cls = String(sel || '').split('.').filter(Boolean);
    const out = [];
    const walk = n => {
      if (cls.length && cls.every(x => n.classList && n.classList.contains(x))) out.push(n);
      (n.children || []).forEach(walk);
    };
    Object.keys(byId).forEach(id => walk(byId[id]));
    return out;
  },
  querySelector: sel => {
    // querySheet 用到的选择器：select.ym-select[data-key="K"][data-part="P"]
    const dm = sel.match(/^select\.ym-select\[data-key="([^"]+)"\]\[data-part="([^"]+)"\]$/);
    if (!dm) return null;
    const k = dm[1], part = dm[2];
    const kids = byId['content'] ? byId['content'].children : [];
    for (const p of kids) {
      const h = typeof p.innerHTML === 'string' ? p.innerHTML : '';
      if (!h) continue;
      const re = new RegExp('<select class="ym-select" data-key="' + k + '" data-part="' + part + '"[^>]*>([\\s\\S]*?)</select>');
      const sm = h.match(re);
      if (sm) {
        // 读写穿透到面板 innerHTML 字符串，模拟真实 <select> 的 value
        const readSel = () => {
          const m2 = (typeof p.innerHTML === 'string' ? p.innerHTML : '').match(re);
          if (!m2) return null;
          const o = m2[1].match(/<option value="([^"]+)" selected>/) || m2[1].match(/<option value="([^"]+)">/);
          return o ? o[1] : null;
        };
        return {
          dataset: { key: k, part: part },
          classList: { contains: () => true },
          get value() { return readSel(); },
          set value(v) {
            p.innerHTML = p.innerHTML.replace(re, mm2 =>
              mm2.replace(/ selected>/g, '>').replace('<option value="' + v + '">', '<option value="' + v + '" selected>'));
          }
        };
      }
    }
    return null;
  },
  addEventListener: (t, fn) => {
    if (t === 'click') docListeners.push(fn);
    else if (t === 'change') chListeners.push(fn);
    else if (hovListeners[t]) hovListeners[t].push(fn);
  },
  createElement: t => makeEl(t),
  body: makeEl('body')
};
const sandbox = {
  console, document: document_,
  window: { pageYOffset: 0, scrollTo() {}, innerWidth: 1400 },
  localStorage: { getItem: () => null, setItem() {} },
  alert() {}, Date, parseInt, parseFloat, isNaN, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Error, encodeURIComponent,
  setTimeout, clearTimeout
};
sandbox.window.document = document_;
vm.createContext(sandbox);

/* ---------- 1) 语法检查所有内联脚本 ---------- */
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
let m, blocks = [];
while ((m = re.exec(html))) blocks.push(m[1]);
blocks.forEach((s, i) => {
  try { new vm.Script(s); } catch (e) { check('内联脚本 #' + (i + 1) + ' 语法', false, e.message); }
});
check('内联脚本语法全部通过', true, blocks.length + ' 块');

/* ---------- 2) 按页面顺序加载外部数据脚本 + 主脚本 ---------- */
const srcRe = /<script\s+src="([^"]+)"><\/script>/g;
let srcm, order = [];
while ((srcm = srcRe.exec(html))) order.push(srcm[1]);
for (const f of order) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) { check('外部脚本存在: ' + f, false); continue; }
  try { vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: f }); }
  catch (e) { check('外部脚本执行: ' + f, false, e.message); }
}
check('外部数据脚本加载', true, order.join(', '));

const mainScript = blocks.find(s => s.includes('function renderTabs'));
check('主脚本块定位', !!mainScript);
try {
  vm.runInContext(mainScript, sandbox, { filename: 'inline-main.js' });
  check('主脚本端到端执行（renderTabs/renderContent/switchTab/事件委托）', true);
} catch (e) {
  check('主脚本端到端执行', false, e.message);
  console.log('\n' + fail + ' CHECK(S) FAILED'); process.exit(1);
}

/* ---------- 3) 默认状态断言（驾驶舱管理已上移为顶层模块，侧栏仅固定报表管理） ---------- */
const wrap = byId['tabsWrap'];
const branches = wrap.children;
check('侧栏仅 1 个一级分支（驾驶舱管理已移出）', branches.length === 1, branches.length + '');
check('侧栏无「驾驶舱管理」入口', !branches.some(b => String(b.children[0].innerHTML).includes('驾驶舱管理')));
const fixedHead = branches[0].children[0];
const fixedKids = branches[0].children[1];
check('一级「固定报表管理」默认展开（子菜单仍收起）',
  fixedHead.classList.contains('open') && fixedKids.classList.contains('open'));
check('顶层导航含驾驶舱模块（独立全屏、子菜单挂载顶导航）', html.includes('data-module="cock"') && html.includes('id="moduleCock"') && html.includes('id="cockContent"') && html.includes('id="cockNavSub"') && !html.includes('cock-topbar'));

const groups = fixedKids.children;
check('固定报表管理下 5 个公司分组', groups.length === 5, groups.length + '');
const labels = groups.map(g => g.children[0].innerHTML.replace(/<[^>]+>/g, ''));
console.log('      分组: ' + labels.join(' / '));
let collapsed = 0, childTotal = 0;
groups.forEach(g => {
  const head = g.children[0], kids = g.children[1];
  if (!head.classList.contains('open') && !kids.classList.contains('open')) collapsed++;
  childTotal += kids.children.length;
});
check('5 个公司分组默认全部收起', collapsed === 5, collapsed + '/5');
check('收起状态下报表按钮仍已生成（点击展开即可见）', childTotal === 26, childTotal + ' 张报表');

/* ---------- 4) 模拟真实点击：走页面自己的事件委托 ---------- */
function click(el) {
  const ev = { target: el };
  docListeners.forEach(fn => fn(ev));
}
// 逐一展开 5 个分组
groups.forEach(g => click(g.children[0]));
let opened = 0;
groups.forEach(g => {
  if (g.children[0].classList.contains('open') && g.children[1].classList.contains('open')) opened++;
});
check('点击后 5 个分组可逐一展开', opened === 5, opened + '/5');
// 再点一次「华润银行」→ 收起，其余保持展开（非手风琴，互不影响）
click(groups[0].children[0]);
check('再次点击单个分组可收起，其余不受影响',
  !groups[0].children[0].classList.contains('open') &&
  groups.slice(1).every(g => g.children[0].classList.contains('open')));
// 一级菜单固定展开、不可收起
click(fixedHead);
check('一级「固定报表管理」不可收起（点击保持展开）', fixedHead.classList.contains('open') && fixedKids.classList.contains('open') && !fixedHead.dataset.action);

/* ---------- 5) 报表头部：更新频率（独立块、在前）+ 数据日期年+月双下拉 ---------- */
const content = byId['content'];
const panels = content.children.filter(c => c.id && c.id.indexOf('panel-') === 0 && c.id.indexOf('panel-cock-') !== 0);
check('渲染出 26 个报表面板', panels.length === 26, panels.length + '');
let nFreq = 0, nFreqBefore = 0, nYm = 0, nOpts = 0, nOld = 0, nQ = 0;
panels.forEach(p => {
  const h = p.innerHTML;
  const quarterly = p.id === 'panel-asset04'; // 外部配置：04-产融业务 freq=季度
  const iFreq = h.indexOf('query-freq-box');
  const iYm = h.indexOf('class="ym"');
  if (h.includes('更新频率') && h.includes(quarterly ? '季度' : '月度')) nFreq++;
  if (quarterly && h.includes('季度')) nQ++;
  if (iFreq !== -1 && iYm !== -1 && iFreq < iYm) nFreqBefore++;
  if (iYm !== -1 && h.includes('数据日期') &&
      /class="ym-select" data-key="[^"]+" data-part="year"/.test(h) &&
      /class="ym-select" data-key="[^"]+" data-part="month"/.test(h)) nYm++;
  if ((h.match(/<option value="/g) || []).length === (quarterly ? 9 : 17)) nOpts++;
  if (h.includes('查询日期') || h.includes('数据期间') || h.includes('type="date"') || h.includes('dp-') || h.includes('切换') || h.includes('选择基准会计') || h.includes('empty-state') || h.includes('panel-data')) nOld++;
});
check('所有面板均含 更新频率（25 月度 + asset04 季度）', nFreq === panels.length && nQ === 1, nFreq + '/' + panels.length);
check('更新频率 独立成块且位于 数据日期 之前', nFreqBefore === panels.length, nFreqBefore + '/' + panels.length);
check('所有面板均含 年+月 双下拉（ym-select ×2）', nYm === panels.length, nYm + '/' + panels.length);
check('年 5 项 + 月 12 项 = 17 个选项（asset04 季度 = 5年+Q1~Q4 = 9 项）', nOpts === panels.length, nOpts + '/' + panels.length);
check('无残留旧控件（dp 弹层/切换/查询日期/date input/空状态块）', nOld === 0, nOld + ' 处');
check('初始（2025年12月）数值正常渲染', /<td class="value">[\d,.]/.test(byId['panel-02'].innerHTML));

// 查询提示从双下拉读取（2025年12月）
try {
  sandbox.querySheet('02');
  const toast = byId['toast'];
  check('查询提示使用 年月 格式（2025年12月）', !!(toast && toast.textContent && toast.textContent.includes('2025年12月')), toast && toast.textContent);
} catch (e) {
  check('querySheet 可执行', false, e.message);
}

/* ---------- 6) 年/月下拉变更自动查询（change 事件委托） ---------- */
const fakeSel = makeEl('select');
fakeSel.className = 'ym-select';
fakeSel.dataset.key = '02';
fakeSel.value = '2024';
chListeners.forEach(fn => fn({ target: fakeSel }));
check('年/月下拉变更触发自动查询', /已加载 \d{4}年\d{1,2}月 数据 · 损益表简表/.test(byId['toast'].textContent), byId['toast'].textContent);

/* ---------- 7) 无历史数据期间（2022）：结构保留、数值显示「-」 ---------- */
function setYm(key, part, val) {
  const p = byId['content'].children.find(c => c.id === 'panel-' + key);
  const re = new RegExp('(<select class="ym-select" data-key="' + key + '" data-part="' + part + '"[^>]*>)([\\s\\S]*?)(</select>)');
  p.innerHTML = p.innerHTML.replace(re, (mm2, a, body, c) =>
    a + body.replace(/ selected>/g, '>').replace('<option value="' + val + '">', '<option value="' + val + '" selected>') + c);
}
const f1 = makeEl('select');
f1.className = 'ym-select';
f1.dataset.key = '01';
setYm('01', 'year', '2022');
chListeners.forEach(fn => fn({ target: f1 }));
const h1 = byId['panel-01'].innerHTML;
check('2022：KPI 卡片、表头、指标行仍渲染', h1.includes('kpi-card') && h1.includes('<thead>') && (h1.match(/indicator-name/g) || []).length > 5);
check('2022：KPI 值与同比/较年初显示 N/A（取不到数据）', h1.includes('<div class="kpi-value"><span class="dim-na">N/A</span><span class="kpi-unit">') && h1.includes('同比</span><span class="dim-na">N/A</span>'));
check('2022：数值单元格显示 N/A', (h1.match(/<td class="value"><span class="dim-na">N\/A<\/span><\/td>/g) || []).length > 5);
check('2022：同比/较年初单元格显示 N/A', h1.includes('<td class="yoy neutral"><span class="dim-na">N/A</span></td>'));
check('2022：单位等结构列保留', /<td class="value">[^-<]/.test(h1) || h1.includes('class="assess'));
check('2022：提示「无历史数据」', byId['toast'].textContent.includes('无历史数据'), byId['toast'].textContent);
// 恢复 2025 → 数值回填
setYm('01', 'year', '2025');
chListeners.forEach(fn => fn({ target: f1 }));
const h2 = byId['panel-01'].innerHTML;
check('2022/2025：指标行数一致（结构完整）', (h1.match(/<tr>/g) || []).length === (h2.match(/<tr>/g) || []).length);
check('恢复 2025：数值回填', /<td class="value">[\d,.]/.test(h2) && !h2.includes('dim-na">N/A'));
check('2025：数据级占位 dash 显示为 --', Object.keys(byId).some(id => id.indexOf('panel-') === 0 && id.indexOf('panel-cock-') !== 0 && String(byId[id].innerHTML).includes('>--<')));
const panelIds = Object.keys(byId).filter(id => id.indexOf('panel-') === 0 && id.indexOf('panel-cock-') !== 0);
const dashTotal = panelIds.reduce((n,id)=> n + (String(byId[id].innerHTML).match(/>--</g) || []).length, 0);
const dashDim = panelIds.reduce((n,id)=> n + (String(byId[id].innerHTML).match(/class="dim-dash">--</g) || []).length, 0);
check('全部报表页面 -- 统一为 dim-dash 样式（颜色/字重/字距一致）', dashTotal > 0 && dashTotal === dashDim, dashTotal + '/' + dashDim);
check('恢复 2025：提示「已加载」', byId['toast'].textContent.includes('已加载 2025年12月'), byId['toast'].textContent);

/* ---------- 8) 驾驶舱管理（顶层独立模块：顶栏下拉 6 页面 + 全屏内容区） ---------- */
const cockOptsHtml = (byId['cockNavSub'] || {}).innerHTML || '';
check('顶导航驾驶舱子菜单 6 个页面选项', (cockOptsHtml.match(/topnav-sub-item/g) || []).length === 6, (cockOptsHtml.match(/topnav-sub-item/g) || []).length + '');
check('默认进入驾驶舱模块（全屏）且落地集团总览', byId['moduleCock'].style.display === '' && byId['moduleData'].style.display === 'none' && (byId['cockContent'].children.find(p => p.id === 'panel-cock-group') || { classList: { contains: () => false } }).classList.contains('active') && !html.includes('topnav-cur'));
const cockContent = byId['cockContent'];
const cockPanels = cockContent.children.filter(c => c.id && c.id.indexOf('panel-cock-') === 0);
check('渲染 6 个驾驶舱面板（挂载全屏区）', cockPanels.length === 6, cockPanels.length + '');
const groupPanel = cockPanels.find(p => p.id === 'panel-cock-group');
const bankPanel = cockPanels.find(p => p.id === 'panel-cock-bank');
const gHtml = groupPanel ? groupPanel.innerHTML : '';
check('集团总览含公司下拉选择器（6 选项含华润金融）', (gHtml.match(/fz-select-opt/g) || []).length === 6 && gHtml.includes('华润金融'), (gHtml.match(/fz-select-opt/g) || []).length + '');
check('集团总览无查看报表入口', !gHtml.includes('查看报表'));
check('下拉首项华润资产且默认选中', gHtml.indexOf('华润资产') < gHtml.indexOf('华润银行') && /fz-select-opt active/.test(gHtml));
check('一览表初始不渲染（移入华润金融）', !gHtml.includes('gk-table-section') && !gHtml.includes('五家核心企业指标一览'));
check('集团总览蓝白顶栏（凹凸造型+下拉+标题+元信息）', gHtml.includes('gq-bar') && gHtml.includes('gq-bar-bg') && gHtml.includes('gq-fil-l') && gHtml.includes('gq-fil-r') && gHtml.includes('gq-title') && gHtml.includes('gq-meta') && (gHtml.match(/gq-sel/g) || []).length >= 2);
check('顶栏标题为公司名、元信息仅币种', gHtml.includes('>华润资产</b>') && gHtml.includes('币种：人民币') && !gHtml.includes('数据截止日期') && !gHtml.includes('数据来源'));
check('描述行已删除', !gHtml.includes('站在集团领导层视角'));
check('集团总览顶栏含公司下拉与数据期间', gHtml.includes('fz-select') && gHtml.includes('2025年12月') && gHtml.includes('cock-toggle'));
check('集团总览无旧 panel-header', !gHtml.includes('panel-header'));
check('集团总览含公司视图容器', gHtml.includes('fz-company-view'));
check('非集团驾驶舱仍用标准头部', (bankPanel ? bankPanel.innerHTML : '').includes('panel-header') && (bankPanel ? bankPanel.innerHTML : '').includes('华润银行驾驶舱'));
// 默认公司视图：renderCockCompanyView 已在 renderContent 中填充到 #fz-company-view
const cv = byId['fz-company-view'];
const cvHtml = cv ? cv.innerHTML : '';
check('默认公司视图=华润资产（标题同步公司名）', (byId['gq-title-scope'] || {}).textContent === '华润资产' && cvHtml.includes('gk-card'), 'scope:' + ((byId['gq-title-scope'] || {}).textContent || 'MISS'));
check('华润资产视图含 4 组指标分区', (cvHtml.match(/class="gk-strip"/g) || []).length === 4, (cvHtml.match(/class="gk-strip"/g) || []).length + '');
check('模块顺序：服务集团退出→风险指标→收入结构→业务结构，且标题无序号',
  ['服务集团退出','风险指标','收入结构','业务结构'].every(t=>cvHtml.includes('gk-strip">'+t))
  && cvHtml.indexOf('gk-strip">服务集团退出') < cvHtml.indexOf('gk-strip">风险指标')
  && cvHtml.indexOf('gk-strip">风险指标') < cvHtml.indexOf('gk-strip">收入结构')
  && cvHtml.indexOf('gk-strip">收入结构') < cvHtml.indexOf('gk-strip">业务结构')
  && !/[①②③④]/.test(cvHtml));
check('华润资产视图指标卡≥15 张', (cvHtml.match(/gk-card/g) || []).length >= 15, (cvHtml.match(/gk-card/g) || []).length + '');
check('华润资产视图数值实时一致', cvHtml.includes('38.60') && cvHtml.includes('<b>128</b>') && cvHtml.includes('1.85'));
// --- 收入结构：口径页签切换（4 口径，默认财务考核口径） ---
check('收入结构含 4 个口径切换页签且默认选中财务考核口径', (cvHtml.match(/gk-caltab/g) || []).length === 4 && /gk-caltab active[^>]*>财务考核口径/.test(cvHtml), (cvHtml.match(/gk-caltab/g) || []).length + '');
check('默认显示财务考核口径值（38.60 / 成本收入比环 96.12%）', cvHtml.includes('38.60') && cvHtml.includes('96.12%'));
// 模拟点击「资产单体口径」页签（gid 从渲染出的口径页签容器 id 提取，模块顺序变化不影响）
const calGid = (cvHtml.match(/id="gk-calswitch-(\d+)"/) || [])[1] || '0';
const calTab = makeEl('button'); calTab.dataset.action = 'gk-cal'; calTab.dataset.gid = calGid; calTab.dataset.cal = '1';
click(calTab);
const calRowsHtml = (byId['gk-calrows-' + calGid] || {}).innerHTML || '';
check('切换资产单体口径：卡片值更新为该口径', calRowsHtml.includes('26.80') && calRowsHtml.includes('33.21') && !calRowsHtml.includes('38.60'));
check('切换资产单体口径：完成度环按该口径预算更新', calRowsHtml.includes('95.98%'));
// --- 业务结构：多口径指标卡（卡内药丸切换，各指标口径集合独立） ---
check('业务结构含 3 张多口径卡', (cvHtml.match(/id="gk-mcal-/g) || []).length === 3, (cvHtml.match(/id="gk-mcal-/g) || []).length + '');
const mc0 = cvHtml.slice(cvHtml.indexOf('id="gk-mcal-0"')).split('id="gk-mcal-1"')[0];
check('生息资产规模卡：3 药丸（合并/本部/渝康）默认合并 520.00', mc0.includes('生息资产规模') && mc0.includes('>合并<') && mc0.includes('>本部<') && mc0.includes('>渝康<') && /gk-mcal-tab active[^>]*>合并</.test(mc0) && mc0.includes('<b>520.00</b>'));
const mc1 = cvHtml.slice(cvHtml.indexOf('id="gk-mcal-1"')).split('id="gk-mcal-2"')[0];
check('新增自有出资规模卡：2 药丸（资产单体/渝康）默认 68.00', mc1.includes('新增自有出资规模') && mc1.includes('资产单体') && mc1.includes('<b>68.00</b>'));
check('多口径卡切换值：生息渝康 140.00 / 新增渝康 25.00 / 退出渝康 18.00',
  sandbox.mcalCardHtml(sandbox.GK_MCAL[0], 2, 0).includes('<b>140.00</b>')
  && sandbox.mcalCardHtml(sandbox.GK_MCAL[1], 1, 1).includes('<b>25.00</b>')
  && sandbox.mcalCardHtml(sandbox.GK_MCAL[2], 1, 2).includes('<b>18.00</b>'));
const mcBtn = makeEl('button'); mcBtn.dataset.action = 'gk-mcal'; mcBtn.dataset.uid = '0'; mcBtn.dataset.cal = '1';
click(mcBtn);
check('gk-mcal 委托切换可执行', (byId['gk-mcal-0'] || {}).outerHTML !== undefined && String(byId['gk-mcal-0'].outerHTML).includes('<b>380.00</b>'));
// --- 存续数量指标：与累计新增同排普通卡片，置于其前，样式与兄弟卡一致 ---
check('存续数量无独立大卡/图表残留', !cvHtml.includes('gk-spot-card') && !cvHtml.includes('gk-sp-hover') && !cvHtml.includes('sp-hl'));
const svcSeg = cvHtml.slice(cvHtml.indexOf('gk-strip">服务集团退出'));
const idxExist = svcSeg.indexOf('本月末服务集团退出项目存续数量');
const idxNew = svcSeg.indexOf('本月末累计新增服务集团退出项目数量');
check('存续数量排在累计新增之前（同一卡片行）', idxExist > -1 && idxNew > -1 && idxExist < idxNew);
check('服务集团退出：业绩合同两项置于存续数量之前', svcSeg.indexOf('业绩合同下服务集团退出项目数量') < idxExist);
const existCard = svcSeg.slice(idxExist).split('gk-card')[0];
check('存续数量卡片样式与兄弟卡一致（数值块+本月末标签+同比/较年初）', existCard.includes('gk-numblock') && existCard.includes('gk-np-cap">本月末') && existCard.includes('<b>128</b>') && existCard.includes('同比') && existCard.includes('较年初'));
check('存续数量卡底含近12月趋势区域图', existCard.includes('gk-trend12') && existCard.includes('近12月趋势') && existCard.includes('<svg') && existCard.includes('gkT12'));
const newCard = svcSeg.slice(idxNew).split('gk-card')[0];
check('累计新增卡为两行布局（本年累计+同比 / 当月值+环比）且含趋势图', newCard.includes('gk-2r') && newCard.includes('本年累计') && newCard.includes('当月值') && newCard.includes('环比') && newCard.includes('<b>36</b>') && newCard.includes('gk-trend12'));
const idxExit = svcSeg.indexOf('本月末累计退出的服务集团退出项目数量');
const exitCard = svcSeg.slice(idxExit).split('gk-card')[0];
check('累计退出卡片含趋势图', exitCard.includes('gk-trend12'));
const idxPerf = svcSeg.indexOf('业绩合同下服务集团退出项目数量');
const perfCard = svcSeg.slice(idxPerf).split('gk-card')[0];
check('业绩合同卡无趋势图', !perfCard.includes('gk-trend12'));
check('趋势图含月份标签与12悬停列（1月–12月）', existCard.includes('>1月</text>') && existCard.includes('>12月</text>') && (existCard.match(/data-t12-i=/g) || []).length === 12);
check('趋势图每个月份点均有圆圈标记（12 个）', (existCard.match(/<circle/g) || []).length === 12 && (newCard.match(/<circle/g) || []).length === 12 && (exitCard.match(/<circle/g) || []).length === 12, (existCard.match(/<circle/g) || []).length + '');
check('悬停列标签与卡片一致（存续=本月末，新增/退出=本年累计数）', existCard.includes('data-t12-c="本月末"') && newCard.includes('data-t12-c="本年累计数"') && exitCard.includes('data-t12-c="本年累计数"'));
check('悬停列携带各月同比（期末=报表实时同比）', existCard.includes('data-t12-p="6.7"') && newCard.includes('data-t12-p="12.5"') && exitCard.includes('data-t12-p="11.5"'));
// 模拟悬停 8月列 → 浮层显示月份、卡片标签、具体值与同比
const t12Rect = makeEl('rect'); t12Rect.dataset.t12I = '7';
['data-t12-m|8月', 'data-t12-v|108', 'data-t12-u|个数', 'data-t12-c|本年累计数', 'data-t12-p|5.4'].forEach(s => { const q = s.split('|'); t12Rect.setAttribute(q[0], q[1]); });
hovListeners.mouseover.forEach(fn => fn({ target: t12Rect }));
const t12Tip = document_.body.children.find(ch => String(ch.className).includes('gk-t12-tip'));
check('趋势图悬停显示月份、卡片标签、具体值与同比', !!t12Tip && t12Tip.style.display === 'flex' && t12Tip.innerHTML.includes('8月') && t12Tip.innerHTML.includes('本年累计数') && t12Tip.innerHTML.includes('108 个数') && t12Tip.innerHTML.includes('同比') && t12Tip.innerHTML.includes('+5.4%'));
hovListeners.mouseout.forEach(fn => fn({ target: t12Rect }));
check('趋势图移出后隐藏', t12Tip.style.display === 'none');
// --- 预算规则：3 个考核指标有全年预算 → 3 个完成度环，其余渐变大数值块（存续数量同排普通卡，含 numblock） ---
check('5 个完成度环（成本收入比 + 营业收入 + 利润总额 + 业绩合同 2 项）', (cvHtml.match(/gk-gauge/g) || []).length === 5, (cvHtml.match(/gk-gauge/g) || []).length + '');
check('本年累计无预算卡用两行布局（8 张：分组 6 + 多口径 2），时点值卡（本月末）保留数值块', (cvHtml.match(/class="gk-2r"/g) || []).length === 8 && (cvHtml.match(/gk-numblock/g) || []).length >= 5, (cvHtml.match(/class="gk-2r"/g) || []).length + '/' + (cvHtml.match(/gk-numblock/g) || []).length);
const a01 = byId['panel-asset01'] ? byId['panel-asset01'].innerHTML : '';
check('资产 4 表口径页签不含「X 项指标」字眼（口径范围说明保留）',
  ['panel-asset01','panel-asset02','panel-asset03','panel-asset04'].every(id => { const h = (byId[id]||{}).innerHTML||''; return h.includes('caliber-tab') && !h.includes('项指标'); })
  && a01.includes('（横琴+渝康）') && !a01.includes('· 11 项指标'));
check('收入结构：拨备两类/成本收入比 当月实际与环比显示 --（不置灰、无「不适用」）', (a01.match(/class="dim-dash">--</g) || []).length >= 12 && !a01.includes('不适用') && !a01.includes('class="value na"'), (a01.match(/class="dim-dash">--</g) || []).length + '');
const provRow1 = a01.slice(a01.indexOf('拨备计提（公允价值变动类）</td>'));
const provRow = provRow1.slice(0, provRow1.indexOf('</tr>'));
check('拨备计提（公允价值变动类）：当月值 --，月末/同比/较年初有值（外部数据更新）', provRow.includes('+5.2%') && provRow.includes('1.20') && provRow.includes('+8.5%') && (provRow.match(/dim-dash">--/g) || []).length === 5);
const impRow1 = a01.slice(a01.indexOf('拨备计提（减值损失类）</td>'));
const impRow = impRow1.slice(0, impRow1.indexOf('</tr>'));
check('拨备计提（减值损失类）：当月值 --，月末/同比/较年初有值（外部数据更新）', impRow.includes('+3.8%') && impRow.includes('2.40') && impRow.includes('+6.2%') && (impRow.match(/dim-dash">--/g) || []).length === 5);
check('收入结构：营业收入/利润总额 标记★考核且有全年预算与达成率', a01.includes('92.00') && a01.includes('42.0%') && a01.includes('24.00') && a01.includes('40.0%') && (a01.match(/★/g) || []).length >= 3);
// --- 较年初列规则：仅 拨备计提（公允价值变动类）/（减值损失类）有值，其余指标均 -- ---
const revRowSrc = a01.slice(a01.indexOf('>营业收入</td>'));
const revRow = revRowSrc.slice(0, revRowSrc.indexOf('</tr>'));
check('收入结构：营业收入行 较年初为--（值/环比/同比/预算保留）', revRow.includes('38.60') && revRow.includes('+1.4%') && revRow.includes('+6.8%') && revRow.includes('92.00') && !revRow.includes('+4.5%') && (revRow.match(/dim-dash">--</g) || []).length === 1, revRow);
const cirRowSrc = a01.slice(a01.indexOf('>成本收入比-拨备前</td>'));
const cirRow = cirRowSrc.slice(0, cirRowSrc.indexOf('</tr>'));
check('收入结构：成本收入比行 较年初为--（月末33.16/同比/预算保留）', cirRow.includes('33.16') && cirRow.includes('+1.8ppt') && cirRow.includes('34.50') && !cirRow.includes('+1.2ppt') && (cirRow.match(/dim-dash">--</g) || []).length === 3, cirRow);
check('资产报表 KPI 卡已删除较年初行（同比保留、样式已恢复原版无 asset-kpis）',
  ['panel-asset01','panel-asset02'].every(id => { const h = (byId[id]||{}).innerHTML||''; return h.includes('kpi-row') && !h.includes('asset-kpis') && !h.includes('kpi-trend-name">较年初') && h.includes('kpi-trend-name">同比'); })
  && (a01.match(/kpi-trend-name">同比/g) || []).length === 16);
check('银行报表 KPI 卡仍保留较年初行（样式不受影响）', (byId['panel-01'].innerHTML||'').includes('kpi-trend-name">较年初') && !(byId['panel-01'].innerHTML||'').includes('asset-kpis'));
check('收入结构：较年初列全清（面板 dash 总数≥56）', (a01.match(/class="dim-dash">--</g) || []).length >= 56, (a01.match(/class="dim-dash">--</g) || []).length + '');
const revSeg = cvHtml.slice(cvHtml.indexOf('gk-strip">收入结构'));
check('收入结构顺序：成本收入比→营业收入→利润总额→营业成本→人工成本', ['成本收入比-拨备前','营业收入','利润总额','营业成本','人工成本'].every((n,i,arr)=> i===0 || revSeg.indexOf('>'+arr[i-1]+'<') < revSeg.indexOf('>'+n+'<')));
check('业务结构分区条含产融业务（title2）且两指标入列', cvHtml.includes('gk-strip-sep') && cvHtml.includes('产融协同项目规模') && cvHtml.includes('<b>86.50</b>') && cvHtml.includes('产融协同营业收入'));
const riskSeg = cvHtml.slice(cvHtml.indexOf('gk-strip">风险指标'));
const riskRowSeg = riskSeg.slice(riskSeg.indexOf('gk-wide-row')).split('gk-strip">收入结构')[0];
check('风险指标 3 卡同一行展示（单行容器+3 宽卡+本月末标签）', riskSeg.includes('gk-wide-row') && (riskRowSeg.match(/gk-wide-card/g) || []).length === 3 && (riskRowSeg.match(/gk-np-cap">本月末</g) || []).length === 3, (riskRowSeg.match(/gk-wide-card/g) || []).length + '');
check('风险宽卡含柱状+趋势图（36 柱/36 悬停列/月份标签/图例）', (riskSeg.match(/gk-wc-bar/g) || []).length === 36 && (riskSeg.match(/data-t12-i=/g) || []).length === 36 && riskSeg.includes('>1月</text>') && riskSeg.includes('近12月月度波动') && riskSeg.includes('本月末数') && riskSeg.includes('</i>同比</span>'));
check('风险宽卡高度加高（图表 viewBox 640×210）', (riskSeg.match(/viewBox="0 0 640 210"/g) || []).length === 3, (riskSeg.match(/viewBox="0 0 640 210"/g) || []).length + '');
// --- 卡片精简：无迷你趋势图、无单位下横线 ---
check('指标卡已删除迷你趋势图', !cvHtml.includes('gk-spark'));
check('指标卡已删除单位下横线', !cvHtml.includes('<em></em>'));
// --- 「当期值」全部改为「本年累计数」 ---
check('集团视图无「当期值」文案', !cvHtml.includes('当期值'));
check('指标卡含「本年累计数」标签', (cvHtml.match(/本年累计数/g) || []).length >= 11, (cvHtml.match(/本年累计数/g) || []).length + '');
// 模拟下拉切换到华润银行
const optBank = makeEl('div'); optBank.dataset.action = 'cock-company'; optBank.dataset.idx = '1';
click(optBank);
const cv2Html = (byId['fz-company-view'] || {}).innerHTML || '';
check('切换到华润银行视图', cv2Html.includes('gk-card') && (cv2Html.match(/gk-strip/g) || []).length === 1 && (byId['gq-title-scope'] || {}).textContent === '华润银行', 'scope:' + ((byId['gq-title-scope'] || {}).textContent || 'MISS'));
check('华润银行视图含指标卡', (cv2Html.match(/gk-card/g) || []).length >= 3, (cv2Html.match(/gk-card/g) || []).length + '');
check('华润银行视图同样已删除趋势图与横线', !cv2Html.includes('gk-spark') && !cv2Html.includes('<em></em>'));
// 模拟下拉切换到华润金融：应渲染五家核心企业指标一览表
const optFin = makeEl('div'); optFin.dataset.action = 'cock-company'; optFin.dataset.idx = '5';
click(optFin);
const cv3Html = (byId['fz-company-view'] || {}).innerHTML || '';
check('华润金融视图=五家一览表（29 行）', (byId['gq-title-scope'] || {}).textContent === '华润金融' && cv3Html.includes('gk-table-section') && (cv3Html.match(/<tr><td>华润/g) || []).length === 29, 'rows:' + ((cv3Html.match(/<tr><td>华润/g) || []).length));
check('一览表数值与报表实时一致', cv3Html.includes('12,580.00') && cv3Html.includes('>38.60<span') && cv3Html.includes('>128<span') && cv3Html.includes('>1.85<span'));
check('一览表列头为「本年累计数」', cv3Html.includes('<th>本年累计数</th>') && !cv3Html.includes('<th>当期值</th>') && cv3Html.includes('>营业收入</td>'));
const tbSeg = cv3Html.slice(cv3Html.indexOf('gk-table-section'));
const tbRevSrc = tbSeg.slice(tbSeg.indexOf('>营业收入</td>'));
const tbRevRow = tbRevSrc.slice(0, tbRevSrc.indexOf('</tr>'));
check('一览表：营业收入行 较年初为--（本年累计数/同比保留）', tbRevRow.includes('38.60') && tbRevRow.includes('+6.8%') && tbRevRow.includes('dim-dash">--') && !tbRevRow.includes('+4.5%'), tbRevRow);
// --- 数据文件预算规则：仅 3 个考核指标有全年预算（成本收入比-拨备前 4 口径 + 业绩合同 2 项） ---
const ASSET_DATA = (() => { try { return vm.runInContext('ASSET_SHEETS', sandbox); } catch (e) { return null; } })();
if (ASSET_DATA) {
  const noBud = v => v === '' || v === '-' || v == null;
  const cal0 = ASSET_DATA.asset01.calibers[0], L = cal0.rows[0].length;
  const find = n => cal0.rows.find(r => r[3] === n);
  check('数据：营业收入/利润总额 新增预算 92.00/24.00，人工成本仍为空', find('营业收入')[L - 2] === '92.00' && find('利润总额')[L - 2] === '24.00' && noBud(find('人工成本')[L - 2]));
  check('数据：成本收入比-拨备前 保留预算 34.50', find('成本收入比-拨备前')[L - 2] === '34.50');
  check('数据：asset01 全口径较年初仅拨备两类有值，其余为-；KPI ytd 全为-',
    ASSET_DATA.asset01.calibers.every(c => c.rows.every(r => (r[3] === '拨备计提（公允价值变动类）' || r[3] === '拨备计提（减值损失类）') ? (r[10] !== '-' && r[10] !== '') : r[10] === '-'))
    && ASSET_DATA.asset01.calibers.every(c => c.kpi.every(k => k.ytd === '-')));
  const a02c0 = ASSET_DATA.asset02.calibers[0];
  const f2 = n => a02c0.rows.find(r => r[3] === n);
  check('数据：asset02 合并口径含 6 行（服务集团退出 5 项）', a02c0.rows.length === 6 && !!f2('本月末服务集团退出项目存续数量') && !!f2('本月末累计新增服务集团退出项目数量') && !!f2('本月末累计退出的服务集团退出项目数量'), 'rows:' + a02c0.rows.length);
  check('数据：存续数量月末=128（当月实际占位-）/新增=36/退出=29 且无预算', f2('本月末服务集团退出项目存续数量')[8] === '128' && f2('本月末服务集团退出项目存续数量')[6] === '-' && noBud(f2('本月末服务集团退出项目存续数量')[L - 2]) && f2('本月末累计新增服务集团退出项目数量')[6] === '36' && noBud(f2('本月末累计新增服务集团退出项目数量')[L - 2]) && f2('本月末累计退出的服务集团退出项目数量')[6] === '29');
  check('数据：业绩合同 2 项保留预算 29/11', f2('业绩合同下服务集团退出项目数量')[L - 2] === '29' && f2('业绩合同下达成里程碑项目数量')[L - 2] === '11');
  check('数据：生息资产规模预算为空', noBud(f2('生息资产规模')[L - 2]));
  check('数据：asset02 指标总数 38', ASSET_DATA.asset02.count === 38 && ASSET_DATA.asset02.calibers.reduce((a, c) => a + c.rows.length, 0) === 38);
} else {
  check('数据：ASSET_SHEETS 可加载', false, 'missing');
}
const bHtml = bankPanel ? bankPanel.innerHTML : '';
check('华润银行驾驶舱：8 KPI 卡 + 4 图表卡', (bHtml.match(/kpi-card/g) || []).length === 8 && (bHtml.match(/chart-card/g) || []).length === 4);
check('华润银行驾驶舱含仪表图与趋势图', bHtml.includes('ck-gauge') && bHtml.includes('ck-trend'));
const assetCockPanel = cockPanels.find(p => p.id === 'panel-cock-asset');
const aCkHtml = assetCockPanel ? assetCockPanel.innerHTML : '';
check('华润资产驾驶舱：4 KPI 卡（引用02-业务结构服务集团退出概览）+ 4 图表卡', (aCkHtml.match(/kpi-card/g) || []).length === 4 && (aCkHtml.match(/chart-card/g) || []).length === 4 && aCkHtml.includes('本月末累计新增'), (aCkHtml.match(/kpi-card/g) || []).length + '');
const allCock = cockPanels.map(p => p.innerHTML).join('');
check('驾驶舱无 undefined/NaN 残留', !allCock.includes('undefined') && !allCock.includes('NaN'));
sandbox.switchTab('cock-bank');
check('switchTab 可切换到驾驶舱', bankPanel.classList.contains('active'));
sandbox.switchTab('01');
check('可切回报表', byId['panel-01'].classList.contains('active') && !bankPanel.classList.contains('active') && byId['moduleData'].style.display === '');
// 顶导航「驾驶舱」子菜单：开合 + 选项切换页面
byId['cockNavDrop'].className = 'topnav-drop';
const navCock = makeEl('button'); navCock.dataset.module = 'cock'; navCock.parentNode = byId['cockNavDrop'];
click(navCock);
check('点击顶导航驾驶舱仅开子菜单（不切模块）', byId['cockNavDrop'].classList.contains('open') && byId['moduleData'].style.display === '');
const optTrust = makeEl('button'); optTrust.dataset.action = 'cock-page'; optTrust.dataset.key = 'cock-trust'; optTrust.parentNode = byId['cockNavDrop'];
click(optTrust);
const trustPanel = cockPanels.find(p => p.id === 'panel-cock-trust');
check('子菜单切换华润信托驾驶舱（子菜单收起）', trustPanel.classList.contains('active') && !byId['cockNavDrop'].classList.contains('open'));
// 点击顶部「数据应用」：默认展示资产负债简表
const navData = makeEl('button'); navData.dataset.module = 'data';
click(navData);
check('点击数据应用默认展示资产负债简表', byId['panel-01'].classList.contains('active') && byId['moduleData'].style.display === '' && byId['moduleCock'].style.display === 'none');
// 左侧报表菜单点击（委托 nav-sheet）：切换到对应报表
const repItem = groups[0].children[1].children[1];
click(repItem);
check('点击左侧菜单报表切换对应面板（委托 nav-sheet）', repItem.dataset.action === 'nav-sheet' && byId['panel-' + repItem.dataset.sheet].classList.contains('active') && repItem.classList.contains('active'));
// 非银行报表切换：不得被默认兜底抢回 01（历史缺陷回归断言）
['asset01', 'trust01', 'ins01', 'lease01'].forEach(k => {
  sandbox.switchTab(k);
  check('切换非银行报表 ' + k + ' 保持激活', byId['panel-' + k].classList.contains('active') && !byId['panel-01'].classList.contains('active'));
});
// 从驾驶舱首次进入数据应用模块时直接点非银行报表：不被兜底抢回
sandbox.switchTab('cock-group');
const assetItem2 = groups[1].children[1].children[0];
click(assetItem2);
check('首次进入模块点击资产报表保持激活', byId['panel-asset01'].classList.contains('active') && !byId['panel-01'].classList.contains('active'));

/* ---------- 指标查询模块（查询表单 + 列表改造） ---------- */
const formSeg = html.slice(html.indexOf('class="std-form"'), html.indexOf('id="stdTable"'));
check('查询表单：6 条件按 编号/名称(合并)·主题(树多选)·业务单元·口径·频次·时间维度 排列',
  ['stdKeyword','stdThemeTree','stdBizUnit','stdMs-caliber','stdMs-freq','stdMs-timeDim','stdMs-assess'].every((id,i,arr)=> i===0 || formSeg.indexOf('"'+arr[i-1]+'"') < formSeg.indexOf('"'+id+'"')) && formSeg.includes('指标编号/名称') && formSeg.includes('stdMsPop-caliber')
  && !formSeg.includes('stdName') && !formSeg.includes('stdClass') && !formSeg.includes('id="stdTheme"'));
check('查询表单：指标状态已删除', !formSeg.includes('stdStatus') && !formSeg.includes('指标状态'));
check('查询/重置按钮位于最右侧动作区（7 条件两行排满、按钮末行靠右）', html.includes('.std-form-actions{grid-column:4 / 5') && formSeg.indexOf('std-form-actions') > formSeg.indexOf('stdMs-assess'));
check('查询条件含 是否考核/高质量指标 多选控件（位于时间维度后）', formSeg.includes('stdMsBtn-assess') && formSeg.includes('stdMsPop-assess') && formSeg.indexOf('stdMs-assess') > formSeg.indexOf('stdMs-timeDim'));
byId['stdPageSize'].options = [];
vm.runInContext('initStdModule()', sandbox);
const stdHtml = byId['stdTable'].innerHTML || '';
const ths = (stdHtml.match(/<th[^>]*>[^<]*<\/th>/g) || []).map(t=>t.replace(/<[^>]+>/g,''));
check('列表表头 18 列且顺序精确（考核/高质量列位于更新频次后）', JSON.stringify(ths) === JSON.stringify(['序号','指标标准编号','指标分组编号','业务单元','指标口径','指标名称','指标主题','一级分类','二级分类','指标定义','时间维度','指标类型','指标单位','更新频次','是否考核/高质量指标','版本号','安全级别','操作']), ths.join('|'));
check('列表已删除 指标状态/计算公式/数据范围/供数部门/对接人/责任人/管理部门/（金控展示）',
  !stdHtml.includes('指标状态') && !stdHtml.includes('计算公式') && !stdHtml.includes('数据范围') && !stdHtml.includes('供数部门') && !stdHtml.includes('对接人') && !stdHtml.includes('指标责任人') && !stdHtml.includes('管理部门') && !stdHtml.includes('金控展示'));
const firstRow = stdHtml.slice(stdHtml.indexOf('<tr data-no='));
const tdCount = (firstRow.slice(0, firstRow.indexOf('</tr>')).match(/<td/g) || []).length;
check('数据行 18 单元格（前四列冻结 + 操作右冻结）', tdCount === 18 && firstRow.includes('stick stick-3') && firstRow.includes('stick stick-4') && firstRow.includes('stick-r'), 'td:' + tdCount);
check('列表含考核/高质量徽章（4 色映射）', /std-badge (base|hq|derived|neutral)/.test(firstRow) && vm.runInContext('STD_DATA.items.every(i=>STD_ENUM.assess.indexOf(i.assess)>=0)', sandbox) && vm.runInContext('new Set(STD_DATA.items.map(i=>i.assess)).size', sandbox) === 4);
check('行单元格顺序：口径徽章位于名称之前', firstRow.indexOf('std-badge neutral') !== -1 && firstRow.indexOf('std-badge neutral') < firstRow.indexOf('std-name'));
check('数据源已替换为金控&资产梳理表（166 条华润资产指标）',
  vm.runInContext('STD_DATA.meta.sourceFile', sandbox) === '金控&资产指标数据梳理表 .xlsx'
  && vm.runInContext('STD_DATA.items.length', sandbox) === 166
  && vm.runInContext('STD_DATA.items.every(i=>i.bizUnit==="华润资产")', sandbox)
  && !vm.runInContext('STD_DATA.items.some(i=>i.code==="STR000001")', sandbox));
check('指标分组编号取数据源真实 groupCode（STR_CRA_GROUP_########）',
  vm.runInContext('stdGroupCode(STD_DATA.items[0])', sandbox) === 'STR_CRA_GROUP_00000001'
  && vm.runInContext('STD_DATA.items.every(i=>/^STR_CRA_GROUP_\\d{8}$/.test(i.groupCode))', sandbox)
  && vm.runInContext('new Set(STD_DATA.items.map(i=>i.groupCode)).size', sandbox) === 96
  && stdHtml.includes('STR_CRA_GROUP_'));
// 详情抽屉：基础信息组已删除，标准编号/分组编号移入业务属性顶部
vm.runInContext('openStdDetail(1)', sandbox);
const drawerHtml = (byId['stdDrawer'] || {}).innerHTML || '';
check('详情抽屉无「基础信息」组（仅业务/技术/管理属性）',
  !drawerHtml.includes('基础信息') && drawerHtml.includes('业务属性') && drawerHtml.includes('技术属性') && drawerHtml.includes('管理属性'));
check('详情抽屉：3 页签（业务/技术/管理）+3 页体+默认业务页激活+无基础信息分区', (()=>{
  const iTabs = drawerHtml.indexOf('class="std-tabs"');
  return iTabs !== -1 && !drawerHtml.includes('基础信息')
    && drawerHtml.includes('data-tab="business"') && drawerHtml.includes('data-tab="technical"') && drawerHtml.includes('data-tab="management"')
    && (drawerHtml.match(/std-tab-pane/g) || []).length === 3
    && drawerHtml.includes('std-tab active') && drawerHtml.includes('std-tab-pane active');
})());
check('详情抽屉：标准编号/分组编号位于业务页顶部且值正确', (()=>{
  const seg = drawerHtml.slice(drawerHtml.indexOf('data-pane="business"'), drawerHtml.indexOf('data-pane="technical"'));
  return seg.includes('指标标准编号') && seg.includes('指标分组编号')
    && seg.indexOf('指标标准编号') < seg.indexOf('指标主题')
    && seg.includes('STR_CRA_00000001') && seg.includes('STR_CRA_GROUP_00000001');
})());
check('详情抽屉：业务页含主题/考核字段、技术页含数据湖库名、管理页含责任人', (()=>{
  const biz = drawerHtml.slice(drawerHtml.indexOf('data-pane="business"'), drawerHtml.indexOf('data-pane="technical"'));
  const tec = drawerHtml.slice(drawerHtml.indexOf('data-pane="technical"'), drawerHtml.indexOf('data-pane="management"'));
  const mg = drawerHtml.slice(drawerHtml.indexOf('data-pane="management"'));
  return biz.includes('指标主题') && biz.includes('是否考核/高质量指标')
    && tec.includes('唯一性识别规则数据湖库名') && mg.includes('指标责任人');
})());
check('详情抽屉：是否考核/高质量指标 位于 是否监管指标 之后且为枚举值', (()=>{
  const i1 = drawerHtml.indexOf('是否监管指标'); const i2 = drawerHtml.indexOf('是否考核/高质量指标');
  return i1 !== -1 && i2 !== -1 && i1 < i2 && drawerHtml.includes('仅考核指标');
})());
// 合并搜索：编号或名称关键字任一命中
vm.runInContext('stdState.kw = "STR_CRA_00000001"', sandbox);
const hitByCode = vm.runInContext('stdFiltered().length', sandbox);
vm.runInContext('stdState.kw = "营业收入"', sandbox);
const hitByName = vm.runInContext('stdFiltered().length', sandbox);
vm.runInContext('stdState.kw = ""', sandbox);
check('合并搜索：编号(STR_CRA_00000001)与名称(营业收入)均可命中', hitByCode === 1 && hitByName >= 1, 'code:' + hitByCode + ' name:' + hitByName);
// --- 指标主题树形多选：主题→一级→二级→三级，复选框级联 ---
vm.runInContext('stdRenderTreePop()', sandbox);
const treePop = byId['stdThemeTreePop'].innerHTML || '';
check('主题树：根=战略，带出一级分类（3 组）与复选框/展开箭头',
  vm.runInContext('stdTreeRoots.length', sandbox) === 1
  && vm.runInContext('stdTreeRoots[0].label', sandbox) === '战略'
  && vm.runInContext('stdTreeRoots[0].children.length', sandbox) === 3
  && treePop.includes('std-tree-cb') && treePop.includes('战略') && treePop.includes('▼') && treePop.includes('▶'));
check('主题树：一级分类下带出二级/三级子节点',
  vm.runInContext('stdTreeRoots[0].children.some(c=>c.children.length>0)', sandbox)
  && vm.runInContext('stdTreeRoots[0].children.some(c=>c.children.some(g=>g.children.length>0))', sandbox));
const c1id = vm.runInContext('stdTreeRoots[0].children[0].id', sandbox);
const c2id = vm.runInContext('stdTreeRoots[0].children[1].id', sandbox);
const n1 = vm.runInContext('stdTreeMap["' + c1id + '"].items.length', sandbox);
const n2 = vm.runInContext('stdTreeMap["' + c2id + '"].items.length', sandbox);
vm.runInContext('stdSetNodeChecked("' + c1id + '", true)', sandbox);
const tsel1 = vm.runInContext('stdFiltered().length', sandbox);
check('主题树单选：过滤结果=该分类下指标数', tsel1 === n1, tsel1 + '/' + n1);
check('主题树单选：按钮摘要与半选/全选态正确',
  byId['stdThemeTreeSel'].textContent === '已选 ' + vm.runInContext('stdTreeMap["' + c1id + '"].leaves.length', sandbox) + ' 项分类'
  && vm.runInContext('stdNodeState(stdTreeMap["' + c1id + '"]).checked', sandbox) === true);
// 半选态：取消一级分类下一个子叶子 → 一级节点半选，过滤数相应扣除
const leafId = vm.runInContext('(()=>{ const c1=stdTreeMap["' + c1id + '"]; const g=c1.children.find(x=>x.children.length); const p=(g?g:c1); return p.children.length ? p.children[0].id : c1.children[0].id; })()', sandbox);
const leafItems = vm.runInContext('stdTreeMap["' + leafId + '"].items.length', sandbox);
vm.runInContext('stdSetNodeChecked("' + leafId + '", false)', sandbox);
const halfN = vm.runInContext('stdFiltered().length', sandbox);
check('主题树半选：取消子叶子→父节点半选且过滤相应扣除',
  halfN === n1 - leafItems && vm.runInContext('stdNodeState(stdTreeMap["' + c1id + '"]).indet', sandbox) === true, halfN + '=' + n1 + '-' + leafItems);
vm.runInContext('stdSetNodeChecked("' + leafId + '", true)', sandbox);
vm.runInContext('stdSetNodeChecked("' + c2id + '", true)', sandbox);
const tsel2 = vm.runInContext('stdFiltered().length', sandbox);
check('主题树多选：结果为两分类并集', tsel2 === n1 + n2, tsel2 + '/' + (n1 + n2));
vm.runInContext('stdSetNodeChecked("' + c1id + '", false); stdSetNodeChecked("' + c2id + '", false)', sandbox);
check('主题树取消勾选：恢复全量 166', vm.runInContext('stdFiltered().length', sandbox) === 166 && byId['stdThemeTreeSel'].textContent === '请选择');
check('空结果 colspan=18（无 17/16/23 残留）', html.includes('colspan="18"') && !html.includes('colspan="23"') && !html.includes('colspan="16"') && !html.includes('colspan="17"'));
// 考核/高质量多选过滤
vm.runInContext('stdToggleMs("assess","仅考核指标", true)', sandbox);
const aN1 = vm.runInContext('stdFiltered().length', sandbox);
const aE1 = vm.runInContext('STD_DATA.items.filter(i=>i.assess==="仅考核指标").length', sandbox);
vm.runInContext('stdToggleMs("assess","两者都是", true)', sandbox);
const aN2 = vm.runInContext('stdFiltered().length', sandbox);
const aE2 = vm.runInContext('STD_DATA.items.filter(i=>i.assess==="仅考核指标"||i.assess==="两者都是").length', sandbox);
check('考核/高质量多选：单选=42、双选=并集 83', aN1 === aE1 && aN2 === aE2 && byId['stdMsSel-assess'].textContent === '已选 2 项', aN1 + '/' + aN2);
vm.runInContext('stdToggleMs("assess","仅考核指标", false); stdToggleMs("assess","两者都是", false)', sandbox);
check('考核/高质量取消勾选恢复全量 166', vm.runInContext('stdFiltered().length', sandbox) === 166 && byId['stdMsSel-assess'].textContent === '请选择');
// --- 更新频次 / 时间维度 / 指标口径 多选 ---
vm.runInContext('stdRenderMsPop("freq"); stdRenderMsPop("timeDim"); stdRenderMsPop("caliber")', sandbox);
check('更新频次多选弹层=5 枚举、时间维度=8 枚举',
  (byId['stdMsPop-freq'].innerHTML.match(/std-ms-row/g) || []).length === 5
  && (byId['stdMsPop-timeDim'].innerHTML.match(/std-ms-row/g) || []).length === 8);
check('指标口径联动门禁：未选业务单元时按钮禁用+提示请先选择业务单元+无选项',
  byId['stdMsBtn-caliber'].disabled === true
  && byId['stdMsSel-caliber'].textContent === '请先选择业务单元'
  && byId['stdMsPop-caliber'].innerHTML.includes('暂无可选项'));
vm.runInContext('stdToggleMs("freq","月度",true); stdToggleMs("freq","季度",true)', sandbox);
const fqN = vm.runInContext('stdFiltered().length', sandbox);
const fqE = vm.runInContext('STD_DATA.items.filter(i=>i.freq==="月度"||i.freq==="季度").length', sandbox);
check('更新频次多选：过滤=所选值并集且摘要已选2项', fqN === fqE && fqN > 0 && byId['stdMsSel-freq'].textContent === '已选 2 项', fqN + '/' + fqE);
vm.runInContext('stdState.bizUnit="华润资产"; stdUpdateCaliberCombo()', sandbox);
check('指标口径选项随业务单元联动（华润资产 6 口径）+清空已选+解除禁用',
  (byId['stdMsPop-caliber'].innerHTML.match(/std-ms-row/g) || []).length === 6
  && vm.runInContext('stdState.caliber.length', sandbox) === 0
  && byId['stdMsBtn-caliber'].disabled === false
  && byId['stdMsSel-caliber'].textContent === '请选择');
vm.runInContext('stdToggleMs("caliber","财务考核口径",true)', sandbox);
const calN = vm.runInContext('stdFiltered().length', sandbox);
const calE = vm.runInContext('STD_DATA.items.filter(i=>i.bizUnit==="华润资产"&&(i.freq==="月度"||i.freq==="季度")&&i.caliber==="财务考核口径").length', sandbox);
check('指标口径多选与频次/业务单元叠加过滤', calN === calE && calN > 0, calN + '/' + calE);
vm.runInContext('stdResetMs("freq"); stdResetMs("caliber"); stdState.bizUnit=""; stdUpdateCaliberCombo(); applyStd(false)', sandbox);
check('频次/口径多选重置后恢复全量 166 且口径门禁恢复', vm.runInContext('stdFiltered().length', sandbox) === 166
  && byId['stdMsSel-freq'].textContent === '请选择'
  && byId['stdMsSel-caliber'].textContent === '请先选择业务单元'
  && byId['stdMsBtn-caliber'].disabled === true);
// --- 底部分页条（原版）：每页条数 + ‹ 上一页/页码/下一页 › ---
check('底部分页条为原版：上一页/下一页+当前页高亮+共X条前置+摘要行已删除',
  byId['stdPagerBtns'].innerHTML.includes('‹ 上一页') && byId['stdPagerBtns'].innerHTML.includes('下一页 ›')
  && byId['stdPagerBtns'].innerHTML.includes('std-page active')
  && byId['stdPagerTotal'].textContent === '共 166 条'
  && !byId['stdPagerBtns'].innerHTML.includes('std-page-arrow')
  && !html.includes('id="stdSummary"'));
vm.runInContext('stdState.page = 1; applyStd(false)', sandbox);
// --- 顶部三卡随查询条件联动 ---
const statsVals = () => (byId['stdStats'].innerHTML.match(/kpi-value">(\d+)/g) || []).map(s => parseInt(s.replace(/\D+/g, ''), 10));
let sv = statsVals();
check('顶部三卡初始：166/166/0 且 战略+风险=总数', JSON.stringify(sv) === JSON.stringify([166, 166, 0]) && sv[1] + sv[2] === sv[0], sv.join('/'));
vm.runInContext('stdState.kw="营业收入"; applyStd(false)', sandbox);
sv = statsVals();
const kwExpect = vm.runInContext('stdFiltered().length', sandbox);
check('顶部三卡联动：总数=筛选条数且 战略+风险=总数', sv[0] === kwExpect && sv[1] + sv[2] === sv[0] && sv[1] === kwExpect && sv[2] === 0, sv.join('/') + ' expect:' + kwExpect);
vm.runInContext('stdState.kw=""; applyStd(false)', sandbox);
sv = statsVals();
check('顶部三卡：清空条件恢复 166/166/0', JSON.stringify(sv) === JSON.stringify([166, 166, 0]), sv.join('/'));

/* ---------- 华润信托·财务指标（trust01）优化 ---------- */
const t01 = byId['panel-trust01'] ? byId['panel-trust01'].innerHTML : '';
const tRow = n => { const s = t01.slice(t01.indexOf('>' + n + '</td>')); return s.slice(0, s.indexOf('</tr>')); };
check('信托财务指标：KPI 卡删除较年初、保留同比（4 卡）', !t01.includes('kpi-trend-name">较年初') && (t01.match(/kpi-trend-name">同比/g) || []).length === 4);
check('信托财务指标：ROE 两行当月值(实际/环比)--，月末/同比/较年初保留',
  (tRow('ROE（含国信）').match(/dim-dash">--/g) || []).length === 2 && tRow('ROE（含国信）').includes('12.80') && tRow('ROE（含国信）').includes('+0.5ppt')
  && (tRow('ROE（除国信）').match(/dim-dash">--/g) || []).length === 2 && tRow('ROE（除国信）').includes('10.65') && tRow('ROE（除国信）').includes('+0.4ppt'));
check('信托财务指标：4 规模行较年初--、其余列保留',
  ['总资产', '净资产', '信托管理规模', '元大基金管理规模'].every(n => (tRow(n).match(/dim-dash">--/g) || []).length === 1)
  && tRow('总资产').includes('386.50') && tRow('总资产').includes('+8.9%') && tRow('元大基金管理规模').includes('1,280.00'));
check('信托财务指标：其余指标较年初保留值', tRow('总收入（含国信）').includes('+7.8%') && tRow('净利润（除国信）').includes('+8.0%'));

/* ---------- 华润信托 trust02-05 优化 ---------- */
const t02 = byId['panel-trust02'] ? byId['panel-trust02'].innerHTML : '';
const t03 = byId['panel-trust03'] ? byId['panel-trust03'].innerHTML : '';
const t04 = byId['panel-trust04'] ? byId['panel-trust04'].innerHTML : '';
const t05 = byId['panel-trust05'] ? byId['panel-trust05'].innerHTML : '';
const rowOf = (h, n) => { const s = h.slice(h.indexOf('>' + n + '</td>')); return s.slice(0, s.indexOf('</tr>')); };
check('信托风险指标：全口径不良率当月值(实际/环比)--，月末/同比/较年初保留',
  (rowOf(t02, '全口径不良率').match(/dim-dash">--/g) || []).length === 2
  && rowOf(t02, '全口径不良率').includes('1.26') && rowOf(t02, '全口径不良率').includes('-0.22ppt'));
check('信托收入结构：指标概览删除+较年初列删除（行 7 单元格）',
  !t03.includes('kpi-card') && !t03.includes('较年初') && !t03.includes('collapse-bar')
  && (() => { const i = t03.indexOf('>总收入（含国信）</td>'); const row = t03.slice(t03.lastIndexOf('<tr', i), t03.indexOf('</tr>', i)); return (row.match(/<td/g) || []).length === 7; })());
check('信托规模结构：指标卡为指定 4 张（信托管理/证券受托/财富管理/其中：元大基金）',
  JSON.stringify((t04.match(/kpi-label">([^<]+)</g) || []).map(s => s.replace(/kpi-label">|<$/g, '')))
  === JSON.stringify(['信托管理规模', '证券受托业务规模', '财富管理业务规模', '其中：元大基金规模']));
check('信托业务结构：指标概览删除', !t05.includes('kpi-card') && !t05.includes('collapse-bar'));

console.log(fail === 0 ? '\nALL CHECKS PASSED' : '\n' + fail + ' CHECK(S) FAILED');
process.exit(fail === 0 ? 0 : 1);
