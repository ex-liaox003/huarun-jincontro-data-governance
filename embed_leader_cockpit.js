/* 战略部数据应用平台.html 改造：
   1) 删除顶部菜单「指标查询」页面（按钮/模块 DOM/专属 CSS/JS/数据脚本引用）；
      —— 保留 escHtml（驾驶舱分组卡片仍在使用）；
   2) 新增顶部菜单「领导驾驶舱」页面：将 D:\work-2026\AI-test\驾驶舱\华润金控领导驾驶舱.html
      的 样式(作用域隔离到 #moduleLeader)/HTML/IIFE 包裹的脚本 完整内嵌为模块二；
      Chart.js 改为与原页一致的 cdnjs CDN（缺失时图表静默降级，卡片不受影响）。
   原文件先备份为 战略部数据应用平台.html.bak_before_leader。 */
const fs = require('fs');
const path = require('path');
const base = __dirname;
const P = path.join(base, '战略部数据应用平台.html');
const COCK = 'D:/work-2026/AI-test/驾驶舱/华润金控领导驾驶舱.html';
let html = fs.readFileSync(P, 'utf8');
fs.writeFileSync(P + '.bak_before_leader', html, 'utf8');

const must = (cond, msg) => { if(!cond) throw new Error('中止：' + msg); };
const cut = (s, a, b, msg) => { // 删除 [a 起点, b 起点) 区间
  const i = s.indexOf(a); must(i >= 0, msg + ' 未找到起点: ' + a.slice(0,40));
  const j = s.indexOf(b, i); must(j >= 0, msg + ' 未找到终点: ' + b.slice(0,40));
  return s.slice(0, i) + s.slice(j);
};

/* ========== 1) 顶部导航按钮：指标查询 → 领导驾驶舱 ========== */
{
  const old = '    <button class="topnav-item" data-module="query" type="button">指标查询</button>';
  must(html.split(old).length === 2, '顶部导航 query 按钮异常');
  html = html.replace(old, '    <button class="topnav-item" data-module="leader" type="button">领导驾驶舱</button>');
}

/* ========== 2) 删除指标查询专属 CSS（80 行块 → Layout 块之前） ========== */
html = cut(html, '/* ===== 指标查询模块（通用） ===== */', '/* ===== Layout / Sidebar ===== */', '指标查询 CSS 块');

/* ========== 3) 模块 DOM：整体替换为领导驾驶舱模块 ========== */
// 3a) 读取驾驶舱源页并拆分 样式/主体/脚本
const cock = fs.readFileSync(COCK, 'utf8');
const cockCss = cock.match(/<style>([\s\S]*?)<\/style>/)[1];
const bStart = cock.indexOf('<body>') + 6;
const bEnd = cock.indexOf('<script>', bStart);   // body 主体结束于内联 <script>（Chart.js CDN 在 head）
must(bStart > 6 && bEnd > bStart, '驾驶舱 body 边界');
let cockBody = cock.slice(bStart, bEnd).trim();
const cockJs = cock.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)[1];

// 3b) CSS 作用域隔离：所有选择器加 #moduleLeader 前缀；:root/body 变量挂到 #moduleLeader；* 通配跳过
function scopeCss(css){
  let out = '';
  let i = 0;
  while(i < css.length){
    const brace = css.indexOf('{', i);
    if(brace < 0){ out += css.slice(i); break; }
    let sel = css.slice(i, brace).replace(/\/\*[\s\S]*?\*\//g, '').trim();
    // 深度配对找块尾
    let depth = 1, j = brace + 1;
    while(j < css.length && depth > 0){
      if(css[j] === '{') depth++;
      else if(css[j] === '}') depth--;
      j++;
    }
    const inner = css.slice(brace + 1, j - 1);
    if(sel === '*'){ /* 平台已有同等 reset，跳过 */ }
    else if(sel === ':root' || sel === 'body'){ out += '#moduleLeader{' + inner + '}\n'; }
    else if(sel.startsWith('@media')){ out += sel + '{' + scopeCss(inner) + '}\n'; }
    else {
      const scoped = sel.split(',').map(s0 => {
        s0 = s0.trim();
        if(!s0) return s0;
        // :root 变量引用不动；仅前缀选择器主体
        return '#moduleLeader ' + s0.replace(/(^|[\s>+~])body\b/g, '$1');
      }).join(',');
      out += scoped + '{' + inner + '}\n';
    }
    i = j;
  }
  return out;
}
let leaderCss = scopeCss(cockCss);
// 双 sticky 修正：平台 header 常驻，驾驶舱 header 改 static；模块最小高度
leaderCss += '\n#moduleLeader header{position:static;}\n#moduleLeader{min-height:calc(100vh - 64px);}\n';

// 3c) 模块 HTML（App → LeaderApp，避免与其他全局命名歧义）
let leaderBody = cockBody.split('App.').join('LeaderApp.');

// 3d) JS：IIFE 包裹 + 全局名 LeaderApp + DOM 查询限定到模块内 + Chart.js 缺失降级
let leaderJs = cockJs
  .split('App.').join('LeaderApp.')
  .split('var App =').join('var LeaderApp =')
  .split("document.querySelectorAll('nav button')").join("document.querySelectorAll('#moduleLeader nav button')")
  .split("document.querySelectorAll('.view')").join("document.querySelectorAll('#moduleLeader .view')")
  .split("document.querySelectorAll('#freqSeg button')").join("document.querySelectorAll('#moduleLeader #freqSeg button')");
{
  const cmt = '/* Chart.js 蓝白浅色默认 */';
  must(leaderJs.includes(cmt), 'Chart.defaults 注释缺失');
  leaderJs = leaderJs.replace(cmt,
    'var HAS_CHART = typeof Chart !== "undefined";\nif(HAS_CHART){\n' + cmt);
  const chartsLine = 'var charts = {};';
  must(leaderJs.includes(chartsLine), 'var charts 缺失');
  leaderJs = leaderJs.replace(chartsLine, '}\n' + chartsLine);
  const mkOld = 'function mk(id,cfg){ var el=document.getElementById(id); if(!el) return null;';
  must(leaderJs.includes(mkOld), 'mk() 签名变化');
  leaderJs = leaderJs.replace(mkOld, 'function mk(id,cfg){ var el=document.getElementById(id); if(!el||!HAS_CHART) return null;');
}
const leaderModule = `<!-- 模块二：领导驾驶舱（内容内嵌自 驾驶舱文件/华润金控领导驾驶舱.html，2026-10-12；样式作用域 #moduleLeader，脚本 IIFE 暴露 window.LeaderApp） -->
<div class="module" id="moduleLeader" style="display:none;">
${leaderBody}
</div>`;

// 3e) 替换旧模块 DOM（含 std 抽屉）
{
  const i = html.indexOf('<!-- 模块二：指标查询 -->');
  must(i >= 0, '模块二 起点');
  const aside = '<aside class="std-drawer" id="stdDrawer" aria-hidden="true"></aside>';
  const j = html.indexOf(aside);
  must(j > i, 'stdDrawer 终点');
  html = html.slice(0, i) + leaderModule + html.slice(j + aside.length);
}

/* ========== 4) 脚本依赖：指标标准库数据 → Chart.js CDN ========== */
{
  const old = '<script src="indicator_standard_data.js"></script>';
  must(html.split(old).length === 2, 'indicator_standard_data 引用异常');
  html = html.replace(old, '<!-- 领导驾驶舱图表库（原页同款；加载失败时驾驶舱图表静默降级） -->\n<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>');
}
// 主脚本结束处（</script></body> 前）追加驾驶舱 IIFE 脚本
{
  const tail = '</script>\n</body>';
  must(html.includes(tail), '主脚本结尾');
  html = html.replace(tail,
    '</script>\n<script>\n/* 领导驾驶舱模块脚本（内嵌自 华润金控领导驾驶舱.html，IIFE 隔离；2026-10-12） */\n(function(){\n'
    + leaderJs + '\nwindow.LeaderApp = LeaderApp;\n})();\n</script>\n</body>');
}
// 作用域样式：注入主 <style> 块尾部
{
  const sEnd = '</style>';
  const i = html.indexOf(sEnd);
  must(i > 0, '主 style 结尾');
  html = html.slice(0, i) + '\n/* ===== 模块二：领导驾驶舱（内嵌页样式，作用域 #moduleLeader） ===== */\n' + leaderCss + '\n' + html.slice(i);
}

/* ========== 5) 主脚本内 std JS 清理 ========== */
// 5a) 「指标查询模块」注释头 → escHtml 保留（其他模块在用）
{
  const old = `/* ============================================================
   指标查询模块（顶部导航 · 指标查询）
   ============================================================ */
function escHtml(str){`;
  must(html.includes(old), 'escHtml 注释头');
  html = html.replace(old, '/* HTML 转义（集团总览驾驶舱卡片等多处使用） */\nfunction escHtml(str){');
}
// 5b) 指标标准库实现块（stdState ... resetStdFilters 结尾）→ 直到 switchModule 注释
html = cut(html, '/* ============================================================\n   指标标准库（指标查询模块）',
  '// 顶部导航模块切换：', 'std 实现块');
// 5c) switchModule 重写
{
  const s = html.indexOf('// 顶部导航模块切换：');
  const e = html.indexOf('/* 驾驶舱页面子菜单', s);
  must(s >= 0 && e > s, 'switchModule 边界');
  const newFn = `// 顶部导航模块切换：data=数据应用 / cock=驾驶舱（集团/板块驾驶舱） / leader=领导驾驶舱
function switchModule(mod){
  const dataEl = document.getElementById('moduleData');
  const dataWasHidden = dataEl.style.display === 'none';
  document.querySelectorAll('.topnav-item').forEach(b=>{
    b.classList.toggle('active', b.dataset.module===mod);
  });
  dataEl.style.display = (mod==='data') ? '' : 'none';
  document.getElementById('moduleCock').style.display = (mod==='cock') ? '' : 'none';
  document.getElementById('moduleLeader').style.display = (mod==='leader') ? '' : 'none';
  if(mod==='cock' || mod==='leader'){
    window.scrollTo({top:0});
  }else{
    /* 仅当从其他模块进入数据应用（模块原为隐藏）且无选中报表时，默认展示资产负债简表；
       模块内切换报表不触发，否则非银行报表会被抢回 01 */
    if(dataWasHidden){
      const anyRep = Array.prototype.some.call(document.querySelectorAll('.sheet-panel'), p=>
        p.classList.contains('active') && p.id.indexOf('panel-cock-') !== 0);
      if(!anyRep) switchTab('01');
      window.scrollTo({top:0});
    }
  }
}
`;
  html = html.slice(0, s) + newFn + html.slice(e);
}
// 5d) 初始化区的 std 监听（stdKeyword 两行 + stdPageSize）
{
  const a = "// 指标标准库：名称/编号实时检索 + 回车查询；指标口径输入实时过滤\ndocument.getElementById('stdKeyword')";
  const i = html.indexOf(a);
  must(i >= 0, 'std 初始化监听起点');
  const j = html.indexOf('// 全局事件委托', i);
  must(j > i, 'std 初始化监听终点');
  html = html.slice(0, i) + html.slice(j);
}
// 5e) 事件委托内：树下拉/ms 收起 段
html = cut(html, '  /* 指标主题树下拉：点击其外部时收起 */', "  const btn = e.target.closest('[data-action]');", '委托树/ms收起段');
// 5f) 事件委托内：std-* 分支（nav-toggle 收尾 } 之后 → addEventListener 收尾 }); 之前）
{
  const s = html.indexOf("  else if(action === 'std-tree-toggle'){");
  must(s >= 0, 'std 分支起点');
  const e = html.indexOf('});\n\n// 指标标准库：点击表格行打开详情', s);
  must(e > s, 'std 分支终点');
  html = html.slice(0, s) + html.slice(e);
}
// 5g) std 行点击 + 遮罩/Esc 监听
{
  const a = '// 指标标准库：点击表格行打开详情';
  const i = html.indexOf(a);
  must(i >= 0, 'std 行监听起点');
  const j = html.indexOf('// 集团总览：点击公司下拉外部时收起', i);
  must(j > i, 'std 行监听终点');
  html = html.slice(0, i) + html.slice(j);
}
// 5h) change 委托内 stdKey 分支
{
  const a = "  if(t.dataset && t.dataset.stdKey){";
  const i = html.indexOf(a);
  if(i >= 0){
    const j = html.indexOf('  }\n});', i);
    must(j > i, 'stdKey 分支终点');
    html = html.slice(0, i) + html.slice(j + 3);
  }
  html = html.replace('// 数据日期年/月下拉变更后自动查询；指标标准库筛选条件变更即时查询',
                      '// 数据日期年/月下拉变更后自动查询');
}

/* ========== 6) 自检 ========== */
{
  const gone = ['moduleQuery','stdKeyword','stdOverlay','stdDrawer','INDICATOR_STANDARD','indicator_standard_data',
                'initStdModule','stdState','applyStd()','closeStdDetail','STD_MS_KEYS','data-module="query"'];
  const leaks = gone.filter(k => html.includes(k));
  must(leaks.length === 0, '残留 std 引用: ' + leaks.join(','));
  must((html.match(/escHtml/g)||[]).length > 3, 'escHtml 被误删');
  must(html.includes('id="moduleLeader"'), 'moduleLeader 缺失');
  must(html.includes('data-module="leader"'), 'leader 按钮缺失');
  must(html.includes('switchModule'), 'switchModule 缺失');
  must((html.match(/LeaderApp/g)||[]).length >= 10, 'LeaderApp 绑定异常');
  must(html.includes("typeof Chart !== \"undefined\""), 'Chart 降级守卫缺失');
  // 驾驶舱模块内不应再出现全局选择器泄漏（scoped CSS 里不应有以裸 body/header/nav 开头的规则）
  const leakSel = /(^|\n)(body|header|nav|main|footer|select)\s*\{/m.test(html.slice(html.indexOf('作用域 #moduleLeader'), html.indexOf('</style>')));
  must(!leakSel, '驾驶舱 CSS 存在未作用域的全局选择器');
}
fs.writeFileSync(P, html, 'utf8');
console.log('✓ 已改造 战略部数据应用平台.html：指标查询模块已删除；领导驾驶舱模块已内嵌（备份 .bak_before_leader）');
console.log('  新文件大小:', (html.length/1024).toFixed(0), 'KB');
