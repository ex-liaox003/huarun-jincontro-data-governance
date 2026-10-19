// 从 战略部数据应用平台.html 抽取「指标查询」模块，生成独立页面 指标查询-(业务人员.html
//  组成：完整 <style> + 精简页头（无模块导航）+ moduleQuery/stdOverlay/stdDrawer 标记 +
//        indicator_standard_data.js + 指标查询模块 JS（函数区 + 事件绑定区，原样复用）
//  事件委托中数据应用/驾驶舱分支因新页面无对应元素（无 data-module/ym-select/cock-* 节点）永不触发，保留不影响运行
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '战略部数据应用平台.html');
const OUT = path.join(__dirname, '指标查询-(业务人员.html');
const src = fs.readFileSync(SRC, 'utf8');

function slice(from, to, name){
  const i = src.indexOf(from);
  const j = to ? src.indexOf(to, i + from.length) : src.length;
  if(i < 0 || (to && j < 0)) throw new Error('marker missing: ' + name);
  return src.slice(i, j);
}

// 1) 样式（完整复用，保证视觉一致）
const style = slice('<style>', '</style>', 'style').replace(/^<style>\n?/, '').replace(/<\/style>$/, '');

// 2) 指标查询标记：moduleQuery + 详情抽屉遮罩（含注释头），去掉默认隐藏
let queryHtml = slice('<!-- 模块二：指标查询 -->', '<script src=', 'queryHtml').trim();
queryHtml = queryHtml.replace('<div class="module" id="moduleQuery" style="display:none;">',
                              '<div class="module" id="moduleQuery">');
if(queryHtml.includes('display:none')) throw new Error('moduleQuery still hidden');

// 3) JS 函数区：escHtml + 指标标准库全部函数（至「顶部导航模块切换」前）
const stdJs = slice('/* ============================================================\n   指标查询模块', '// 顶部导航模块切换', 'stdJs');

// 4) JS 事件绑定区：实时检索/分页/全局委托/行点击/遮罩Esc/筛选联动
const bindJs = slice('// 指标标准库：名称/编号实时检索', '</script>', 'bindJs').replace(/<\/script>\s*$/, '');

const out = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<title>指标查询（业务人员）· 金控指标体系数据应用平台</title>
<style>
${style.trim()}
</style>
</head>
<body>

<!-- Header（独立页面：无模块导航，仅指标查询） -->
<div class="header">
  <div class="header-left">
    <div class="header-logo">华</div>
    <div>
      <h1>金控指标体系数据应用平台</h1>
      <div class="header-sub">指标查询 · 业务人员版 · Indicator Query (Business)</div>
    </div>
  </div>
</div>

${queryHtml}

<script src="indicator_standard_data.js"></script>
<script>
${stdJs.trim()}

/* ============================================================
   独立页面初始化：无模块切换，直接进入指标标准库
   ============================================================ */
initStdModule();

${bindJs.trim()}
</script>
</body>
</html>
`;
fs.writeFileSync(OUT, out);

// 校验：内联脚本语法 + 关键节点齐全
new Function(stdJs + '\ninitStdModule();\n' + bindJs);
['stdView','stdStats','stdTable','stdKeyword','stdPageSize','stdOverlay','stdDrawer','stdThemeTreePop']
  .forEach(id=>{ if(!out.includes('id="' + id + '"')) throw new Error('missing #' + id); });
console.log('OK ->', path.basename(OUT), (out.length/1024).toFixed(1) + 'KB');
