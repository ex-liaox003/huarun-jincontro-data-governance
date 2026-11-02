/* 构建「预算值填报.html」：从 index.html 抽取预算值填报功能为独立单页。
   - CSS：复用 index.html 全量 <style>（保证表格/按钮/侧栏/toast 与源页面完全一致）
   - JS：按函数名锚点 + 大括号配对精确抽取依赖函数；事件分发为预算专属的精简重写版
   - index.html 本身不做任何改动
   用法：node build_budget_page.js */
const fs = require('fs');
const path = require('path');
const base = __dirname;
const src = fs.readFileSync(path.join(base, 'index.html'), 'utf8');

/* ===== 抽取工具 ===== */
/* 函数声明：function name( 起，做花括号配对（模板字面量里的 ${} 成对出现，不影响平衡） */
function extractFn(name){
  const re = new RegExp('(?:^|\\n)function\\s+' + name + '\\s*\\(', 'g');
  const m = re.exec(src);
  if(!m) throw new Error('未找到函数: ' + name);
  const start = m.index + (src[m.index] === '\n' ? 1 : 0);
  let i = src.indexOf('{', m.index), depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{') depth++;
    else if(src[i] === '}'){ depth--; if(depth === 0){ return src.slice(start, i + 1); } }
  }
  throw new Error('函数体未闭合: ' + name);
}
/* const X = [ ... ]; 或单行 const */
function extractConst(name, endMark){
  const at = src.indexOf('const ' + name);
  if(at < 0) throw new Error('未找到常量: ' + name);
  const end = src.indexOf(endMark, at);
  if(end < 0) throw new Error('常量未闭合: ' + name);
  return src.slice(at, end + endMark.length);
}
/* <style> 块（可能多个，全部保留） */
const styles = [...src.matchAll(/<style>[\s\S]*?<\/style>/g)].map(m => m[0]).join('\n');
if(!styles) throw new Error('未找到 style 块');

/* ===== 依赖函数（保持定义顺序：数据常量 → 工具 → 取数 → 渲染 → 交互 → 导入） ===== */
const FNS = [
  'menuName', 'panelName',            // 表名工具（budIndicatorRows→panelName）
  'hideColsView', 'ledgerBaseView', 'ledgerLeaves',   // 指标清单取数视图
  'budLatestDate', 'budIndicatorRows',                // 预算指标清单
  'renderBudgetPanel',                                // 面板渲染
  'budgetCollectInputs', 'budgetToggleEdit', 'budgetSubmit',  // 编辑/提交
  'loadSheetJS', 'parseCsv', 'budHandleImportFile', 'budImportApply', // 导入
  'showToast', 'escHtml'
];
const jsBody = [
  '/* ===== 业务单元常量与页面状态（与 index.html 同源） ===== */',
  extractConst('BUDGET_UNITS', '\n];'),
  extractConst('budState', '\n'),   // 单行 const（行尾带注释）→ 取到行尾换行
  extractConst('BUDGET_KEY', '\n'),
  '',
  '/* ===== 依赖函数（抽取自 index.html，逻辑零改动） ===== */',
  ...FNS.map(n => extractFn(n) + '\n'),
].join('\n');

/* 输入过滤监听（预算数值框，抽取自 index.html 原文） */
const atInput = src.indexOf("document.addEventListener('input'");
if(atInput < 0) throw new Error('未找到 input 监听');
{
  const braceI = src.indexOf('{', atInput);
  let d = 0, i = braceI;
  for(; i < src.length; i++){
    if(src[i] === '{') d++;
    else if(src[i] === '}'){ d--; if(d === 0) break; }
  }
  var inputListener = src.slice(atInput, i + 1) + ');';
}

/* ===== 页面外壳 ===== */
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>预算值填报 · 金控指标体系数据应用平台</title>
${styles}
</head>
<body>

<!-- Header（与 index.html 同款；仅保留数据应用入口，无其他模块菜单） -->
<div class="header">
  <div class="header-left">
    <div class="header-logo">华</div>
    <div>
      <h1>金控指标体系数据应用平台</h1>
      <div class="header-sub">Financial Holdings Indicator System · Data Application Platform</div>
    </div>
  </div>
  <nav class="header-nav">
    <button class="topnav-item active" type="button">数据应用</button>
  </nav>
</div>

<div class="module" id="moduleData">
  <div class="layout">
    <aside class="sidebar" id="tabsWrap"></aside>
    <main class="content" id="content"></main>
  </div>
</div>

<!-- 指标标准库数据源（与 index.html 相同：预算指标清单按业务单元从中筛选加载） -->
<script src="sheets_data.js"></script>
<script src="asset_sheets_data.js"></script>
<script src="trust_sheets_data.js"></script>
<script src="insurance_sheets_data.js"></script>
<script src="lease_sheets_data.js"></script>

<script>
${jsBody}

/* ===== 输入过滤（抽取自 index.html 原监听） ===== */
${inputListener}

/* ===== 侧栏菜单：仅「预算值填报管理 → 预算值填报」一项 ===== */
function renderTabs(){
  const wrap = document.getElementById('tabsWrap');
  wrap.innerHTML = '';
  const budget = document.createElement('div');
  budget.className = 'nav-branch';
  const budHead = document.createElement('button');
  budHead.className = 'nav-parent open nav-fixed nav-budget';
  budHead.innerHTML = '<span>预算值填报管理</span>';
  const budKids = document.createElement('div');
  budKids.className = 'nav-children open';
  const budBtn = document.createElement('button');
  budBtn.className = 'nav-item active';
  budBtn.dataset.sheet = BUDGET_KEY;
  budBtn.dataset.action = 'nav-sheet';
  budBtn.textContent = '预算值填报';
  budKids.appendChild(budBtn);
  budget.appendChild(budHead);
  budget.appendChild(budKids);
  wrap.appendChild(budget);
}

/* ===== 点击分发：预算页全部动作（编辑/提交/导入/导出/菜单激活） ===== */
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  const action = btn.dataset.action;
  if(action === 'nav-sheet'){
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active', b === btn));
    const panel = document.getElementById('panel-' + BUDGET_KEY);
    if(panel) panel.classList.add('active');
  }
  else if(action === 'bud-edit'){ budgetToggleEdit(); }
  else if(action === 'bud-submit'){ budgetSubmit(); }
  else if(action === 'bud-import'){ budgetCollectInputs(); document.getElementById('budImportFile').click(); }
  else if(action === 'export' && btn.dataset.key === BUDGET_KEY){
    alert('正在导出 预算指标填报表...\\n（演示功能，实际环境对接导出接口）');
  }
});

/* ===== 下拉/文件监听：预算年度、业务单元切换 + 导入文件选择 ===== */
document.addEventListener('change', (e)=>{
  const t = e.target;
  if(t.id === 'budImportFile'){
    const f = t.files && t.files[0];
    t.value = '';
    if(f) budHandleImportFile(f);
    return;
  }
  if(t.id === 'budYearSel' || t.id === 'budUnitSel'){
    budgetCollectInputs();
    budState.year = +document.getElementById('budYearSel').value;
    budState.unit = document.getElementById('budUnitSel').value;
    budState.editing = false;
    budState.showErr = false;
    renderBudgetPanel();
    return;
  }
});

/* ===== 初始化：菜单 + 预算面板（默认即显示、激活） ===== */
renderTabs();
renderBudgetPanel();
(function(){
  const panel = document.getElementById('panel-' + BUDGET_KEY);
  if(panel) panel.classList.add('active');
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(base, '预算值填报.html'), html, 'utf8');
console.log('✓ 预算值填报.html 已生成（' + (html.length/1024).toFixed(0) + ' KB）');
