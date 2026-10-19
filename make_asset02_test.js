// 生成 asset02(业务结构) 截图测试页：仅显示该面板、4个口径面板全部展开、概览展开
const fs = require('fs');
const path = require('path');
const base = __dirname;
let html = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');
// 概览区默认展开
html = html.split('overview-area collapsed').join('overview-area');
// 仅显示 asset02 面板，且其内部所有口径 pane 全部可见
html = html.replace('</style>', `
.sheet-panel{display:none !important;}
#panel-asset02{display:block !important;}
#panel-asset02 .caliber-pane{display:block !important;}
#panel-asset02 .caliber-pane + .caliber-pane{margin-top:26px; border-top:2px dashed #c8d8ec; padding-top:18px;}
</style>`);
fs.writeFileSync(path.join(base, 'test_asset02.html'), html.replace('</body>', '<script>switchTab(\'asset02\');</script>\n</body>'));
console.log('截图测试页已生成: test_asset02.html');
