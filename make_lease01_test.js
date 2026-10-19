// 生成 lease01(收入结构) 截图测试页：仅显示该面板、概览展开、启动后切到 lease01
const fs = require('fs');
const path = require('path');
const base = __dirname;
let html = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');
html = html.split('overview-area collapsed').join('overview-area');
html = html.replace('</style>', `
.sheet-panel{display:none !important;}
#panel-lease01{display:block !important;}
</style>`);
html = html.replace('</body>', '<script>switchTab(\'lease01\');</script>\n</body>');
fs.writeFileSync(path.join(base, 'test_lease01.html'), html);
console.log('截图测试页已生成: test_lease01.html');
