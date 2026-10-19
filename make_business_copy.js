/* 生成业务版单文件页面：指标查询-业务版.html
   - 内联全部外部数据脚本（单文件即可发送，无需附带 js）
   - 隐藏「数据应用」模块及其顶部导航入口
   - 打开后直接进入「指标查询」模块 */
const fs = require('fs');
const path = require('path');
const base = __dirname;

let html = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');

// 1) 内联外部数据脚本
html = html.replace(/<script src="([^"]+\.js)"><\/script>/g, (m, file)=>{
  const p = path.join(base, file);
  if(!fs.existsSync(p)){ console.warn('WARN: 缺少文件，保持外链 ->', file); return m; }
  const code = fs.readFileSync(p, 'utf8');
  if(code.indexOf('</script>') >= 0) console.warn('WARN: 内容含 </script> ->', file);
  return '<script>\n/* ==== inlined: ' + file + ' ==== */\n' + code + '\n</script>';
});

// 2) 隐藏「数据应用」模块与导航入口
html = html.replace('</head>',
  '<style>\n/* 业务版：仅展示指标查询模块 */\n.topnav-item[data-module="data"]{display:none !important;}\n#moduleData{display:none !important;}\n</style>\n</head>');

// 3) 初始化后直接进入「指标查询」
html = html.replace(
  "switchTab(typeof COCKPITS!=='undefined' ? 'cock-group' : '01');",
  "switchTab(typeof COCKPITS!=='undefined' ? 'cock-group' : '01');\nswitchModule('query');");

// 4) 页面标题
html = html.replace('<title>金控指标体系数据应用平台</title>', '<title>金控指标体系 · 指标标准查询</title>');

const out = path.join(base, '指标查询-业务版.html');
fs.writeFileSync(out, html, 'utf8');
const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log('OK ->', out, kb + 'KB');
console.log('内联校验: 无外链script =', !/<script src="/.test(html));
console.log('导航隐藏 =', html.indexOf('.topnav-item[data-module="data"]{display:none !important;}') >= 0);
console.log('默认指标查询 =', html.indexOf("switchModule('query');") >= 0);
