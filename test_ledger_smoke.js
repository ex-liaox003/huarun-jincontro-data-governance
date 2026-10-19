/* 台账模块整页冒烟：以最小 DOM 桩执行 HTML 内联脚本全量初始化，
   再模拟 菜单点击(switchTab led-*) / 年度切换(queryLedger) / 导出(exportSheet) 路径 */
const fs = require('fs');
const path = require('path');
const base = __dirname;

function loadVar(file, varName){
  const src = fs.readFileSync(path.join(base, file), 'utf8');
  return new Function(src + '; return ' + varName + ';')();
}
const SHEETS = loadVar('sheets_data.js','SHEETS');
const ASSET_SHEETS = loadVar('asset_sheets_data.js','ASSET_SHEETS');
const TRUST_SHEETS = loadVar('trust_sheets_data.js','TRUST_SHEETS');
const INSURANCE_SHEETS = loadVar('insurance_sheets_data.js','INSURANCE_SHEETS');
const LEASE_SHEETS = loadVar('lease_sheets_data.js','LEASE_SHEETS');
const INDICATOR_STANDARD = loadVar('indicator_standard_data.js','INDICATOR_STANDARD');

/* ---- 最小 DOM 桩 ---- */
function El(id){
  const el = {
    id: id||'', tagName:'DIV', dataset:{}, style:{}, children:[], innerHTML:'',
    textContent:'', value:'', className:'', parentNode:null,
    classList:{ _s:new Set(),
      add(c){this._s.add(c);}, remove(c){this._s.delete(c);},
      toggle(c,f){ if(f===undefined) f=!this._s.has(c); f?this._s.add(c):this._s.delete(c); return f; },
      contains(c){return this._s.has(c);} },
    appendChild(ch){ this.children.push(ch); ch.parentNode=this; return ch; },
    addEventListener(){}, removeEventListener(){}, setAttribute(){}, getAttribute(){return null;},
    querySelector(sel){ return makeSelect(sel); },
    querySelectorAll(){ const a=[]; a.forEach=Array.prototype.forEach; return a; },
    closest(){ return null; },
    getBoundingClientRect(){ return {top:0,left:0,width:0,height:0}; },
  };
  return el;
}
let createdSelects = [];
function makeSelect(){ const el = El(); el.value='2025'; createdSelects.push(el); return el; }
const byId = {};
['tabsWrap','content','cockContent','moduleData','moduleQuery','moduleCock','stdKeyword','stdPageSize','stdOverlay','stdDrawer','stdMain','stdPagerTotal','stdPagerBtns','stdThemeTree','stdThemeTreeSel','cockNavSub','cockNavDrop']
  .forEach(id=>{ byId[id]=El(id); });

const allNodes = [];
const document = {
  getElementById(id){ return byId[id] || allNodes.find(n=>n.id===id) || null; },
  createElement(tag){ const e = El(); e.tagName=(tag||'DIV').toUpperCase(); allNodes.push(e); return e; },
  body: Object.assign(El('body'), {}),
  addEventListener(){}, querySelector(){ return null; },
  querySelectorAll(sel){
    const list = allNodes.filter(n=>{
      if(sel==='.sheet-panel') return n.className.indexOf('sheet-panel')>=0;
      if(sel==='.nav-item') return n._isNavItem;
      return false;
    });
    list.forEach = Array.prototype.forEach.bind(list);
    return list;
  },
};
/* renderTabs 生成的 nav-item 记录到 allNodes（createElement 已收集）；className 由代码赋值 */
global.window = { scrollTo(){}, pageYOffset:0, Lib:null };
global.document = document;
global.setTimeout = setTimeout; global.clearTimeout = clearTimeout;
global.alert = ()=>{};

/* ---- 执行内联脚本 ---- */
const html = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');
const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const run = new Function('SHEETS','ASSET_SHEETS','TRUST_SHEETS','INSURANCE_SHEETS','LEASE_SHEETS','INDICATOR_STANDARD','document','window',
  js + '\nreturn {switchTab, queryLedger, exportSheet, sheetByKey, buildLedgerView, renderLedgerPanel, ledgerMonthCount, ledgerQuarterCount, LEDGER_NOW_Y, LEDGER_NOW_M, ledgerYearSel};');
const api = run(SHEETS, ASSET_SHEETS, TRUST_SHEETS, INSURANCE_SHEETS, LEASE_SHEETS, INDICATOR_STANDARD, document, window);
console.log('✓ 整页脚本初始化执行无异常（含 renderTabs / renderContent / renderAllLedgers）');

/* 校验生成的台账面板 */
const ledPanels = allNodes.filter(n=>n.className.indexOf('sheet-panel')>=0 && /^panel-led-/.test(n.id));
const totalReports = Object.keys(SHEETS).length + Object.keys(ASSET_SHEETS).length + Object.keys(TRUST_SHEETS).length + Object.keys(INSURANCE_SHEETS).length + Object.keys(LEASE_SHEETS).length;
if(ledPanels.length !== totalReports) throw new Error('台账面板数 '+ledPanels.length+' != 报表数 '+totalReports);
console.log('✓ 台账面板 ' + ledPanels.length + ' 个（与固定报表 1:1 复制）');

const p01 = ledPanels.find(p=>p.id==='panel-led-01');
if(/kpi-card|overview-area|kpi-row/.test(p01.innerHTML)) throw new Error('台账面板包含指标卡片');
if(p01.innerHTML.indexOf('table-wrap') < 0) throw new Error('台账面板缺少表格区域');
console.log('✓ 台账面板无 KPI 卡片、仅表格区域');

/* 一级菜单结构：报表台账管理 与 固定报表管理 同级（tabsWrap 直接子节点），
   且不再有嵌套的 nav-group 形态台账入口 */
const branches = byId['tabsWrap'].children;
const branchHeads = branches.map(b=>{
  const head = b.children && b.children[0];
  return head ? {cls:head.className, text:head.innerHTML} : null;
}).filter(Boolean);
const ledBranch = branchHeads.find(h=>/nav-ledger/.test(h.cls) && /报表台账管理/.test(h.text));
const fixedBranch = branchHeads.find(h=>/nav-fixed/.test(h.cls) && /固定报表管理/.test(h.text) && !/nav-ledger/.test(h.cls));
if(!ledBranch) throw new Error('未找到一级菜单「报表台账管理」: ' + JSON.stringify(branchHeads));
if(!fixedBranch) throw new Error('未找到一级菜单「固定报表管理」');
if(!/nav-parent/.test(ledBranch.cls)) throw new Error('报表台账管理不是一级菜单节点');
if(allNodes.some(n=>/nav-ledger-head/.test(n.className))) throw new Error('残留嵌套台账菜单节点');
console.log('✓ 左侧一级菜单同级：' + branchHeads.map(h=>h.text.replace(/<[^>]*>/g,'')).join(' / '));

/* 2026-09-30 调整：顶部展示更新频率、不展示数据范围；表内无同比、无指标属性标签 */
if(p01.innerHTML.indexOf('更新频率') < 0) throw new Error('台账顶部未展示更新频率');
if(p01.innerHTML.indexOf('数据范围') >= 0) throw new Error('台账顶部仍展示数据范围');
if(p01.innerHTML.indexOf('月同比') >= 0) throw new Error('台账表头仍含同比列');
if(p01.innerHTML.indexOf('指标属性标签') >= 0) throw new Error('台账表头仍含指标属性标签列');
console.log('✓ 顶部展示更新频率、已删除数据范围；表内无同比列、无指标属性标签列');

/* 频率取值随报表：季度报表显示「季度」 */
const p03freq = allNodes.find(n=>n.id==='panel-led-03');
if(!/query-freq-value">季度</.test(p03freq.innerHTML)) throw new Error('银行03 台账未展示季度频率');
if(!/query-freq-value">月度</.test(p01.innerHTML)) throw new Error('银行01 台账未展示月度频率');
console.log('✓ 更新频率按报表口径展示（月度 / 季度）');

/* 当前年度表头：1—当前月；切 2025：1—12 月 */
const hdr = p => (p.innerHTML.match(/<th[^>]*>(\d+月末)<\/th>/g)||[]);
if(hdr(p01).length !== api.LEDGER_NOW_M) throw new Error('默认年度表头月份数 != 当前月 '+api.LEDGER_NOW_M);
console.log('✓ 默认 ' + api.LEDGER_NOW_Y + ' 年：表头 1—' + api.LEDGER_NOW_M + ' 月（' + hdr(p01).length + ' 个月末列）');

/* 模拟年度下拉 → queryLedger（select 桩取值） */
const qSel = document.querySelector;
byId['__select'] = makeSelect();
document.querySelector = function(sel){
  if(sel.indexOf('data-key="led-01"')>=0){ const el = byId['__select']; el.value='2025'; return el; }
  return null;
};
api.queryLedger('led-01');
const p01b = allNodes.find(n=>n.id==='panel-led-01');
if(hdr(p01b).length !== 12) throw new Error('2025 年表头月份数 != 12');
console.log('✓ 切换 2025 年：表头 1—12 月完整月份（' + hdr(p01b).length + ' 个月末列）');

/* 无数据年度回溯：切 2022（早于数据起始期间 2025-01）→ 全部月份数值列渲染 N/A，结构列保留 */
document.querySelector = function(sel){
  if(sel.indexOf('data-key="led-01"')>=0){ const el = byId['__select']; el.value='2022'; return el; }
  return null;
};
api.queryLedger('led-01');
const p01c = allNodes.find(n=>n.id==='panel-led-01');
const naCount = (p01c.innerHTML.match(/dim-na">N\/A/g)||[]).length;
if(naCount < 12) throw new Error('2022 无数据年度 N/A 单元格数 '+naCount+' < 12');
if(p01c.innerHTML.indexOf('总资产') < 0) throw new Error('2022 无数据年度结构列（指标名称）丢失');
console.log('✓ 切换 2022 年（无历史数据）：数值列全部 N/A（' + naCount + ' 处）、报表结构保留');
document.querySelector = qSel;

/* sheetByKey 台账回落 + 导出 */
if(api.sheetByKey('led-ins02') !== INSURANCE_SHEETS['ins02']) throw new Error('sheetByKey 台账回落失败');
api.exportSheet('led-trust01');
console.log('✓ sheetByKey(led-*) 回落原数据模型；导出通道复用');

/* 季度报表台账（银行03-关键监测指标）：表头为季度列、默认展示至最近已完结季度；不出现「X月末」月份列 */
const p03 = allNodes.find(n=>n.id==='panel-led-03');
if(!p03) throw new Error('银行03(季度) 台账缺失');
if(/<th[^>]*>\d+月末<\/th>/.test(p03.innerHTML)) throw new Error('银行03(季度) 台账表头仍含月份列');
const qNames = p => (p.innerHTML.match(/<th[^>]*>(Q[1-4])<\/th>/g)||[]).map(c=>c.replace(/<[^>]*>/g,''));
const nowQ = Math.floor((api.LEDGER_NOW_M-1)/3); // 已完结季度数：季末月已过才完结（10 月 → Q3）
const defYear = nowQ === 0 ? api.LEDGER_NOW_Y-1 : api.LEDGER_NOW_Y; // 1—3 月默认回看上一完整年度
const qCols = qNames(p03);
const qExpect = nowQ === 0 ? ['Q1','Q2','Q3','Q4'] : Array.from({length:nowQ},(_,i)=>'Q'+(i+1));
if(JSON.stringify(qCols) !== JSON.stringify(qExpect))
  throw new Error('银行03(季度) 默认表头季度列 ' + qCols.join(',') + ' != ' + qExpect.join(',') + '（默认年度 ' + defYear + '）');
console.log('✓ 季度报表默认表头展示至已完结季度（' + defYear + ' 年 ' + qCols.join(' / ') + '，未完结季度不展示）');
/* 切换历史年度 2025 → Q1—Q4 完整季度 */
const qSel03 = document.querySelector;
byId['__select03'] = makeSelect();
document.querySelector = function(sel){
  if(sel.indexOf('data-key="led-03"')>=0){ const el = byId['__select03']; el.value='2025'; return el; }
  return null;
};
api.queryLedger('led-03');
const p03b = allNodes.find(n=>n.id==='panel-led-03');
const qColsB = (p03b.innerHTML.match(/<th[^>]*>(Q[1-4])<\/th>/g)||[]);
if(qColsB.length !== 4) throw new Error('银行03(季度) 2025 季度列数 != 4，实际 ' + qColsB.length);
console.log('✓ 季度报表切换 2025 年：表头 Q1—Q4 完整季度');
document.querySelector = qSel03;

/* 华润资产台账：保留口径页签（calibers），与固定报表管理一致 */
const assetKeys = Object.keys(ASSET_SHEETS);
let calPanels = 0;
assetKeys.forEach(k=>{
  const s = ASSET_SHEETS[k];
  const p = allNodes.find(n=>n.id==='panel-led-'+k);
  if(!p) throw new Error('资产台账面板缺失: '+k);
  if(s.calibers && s.calibers.length){
    if(p.innerHTML.indexOf('caliber-tabs') < 0) throw new Error('资产台账 '+k+' 无口径页签');
    s.calibers.forEach(c=>{
      if(p.innerHTML.indexOf(c.label) < 0) throw new Error('资产台账 '+k+' 缺口径标签: '+c.label);
    });
    calPanels++;
    /* 口径数据联动：多口径报表切换口径下标后，台账视图行数据应随之变化 */
    if(s.calibers.length > 1){
      const v0 = api.buildLedgerView(s, 2025, 0);
      const v1 = api.buildLedgerView(s, 2025, 1);
      if(JSON.stringify(v0.rows) === JSON.stringify(v1.rows))
        throw new Error('资产台账 '+k+' 切换口径后数据未变化');
    }
  }
});
console.log('✓ 华润资产台账保留口径页签（' + calPanels + '/' + assetKeys.length + ' 张含 calibers），切换口径数据联动');

console.log('\n整页冒烟全部通过');
