// 复制真实页面为测试副本：强制所有面板可见 + 概览区默认展开，供无头浏览器整页截图
const fs = require('fs');
const path = require('path');
const base = __dirname;

let html = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');

// 1) 概览区不再默认收起
html = html.split('overview-area collapsed').join('overview-area');
// 2) 所有面板强制显示（真实页面仅激活面板可见）
html = html.replace('</style>', '.sheet-panel{display:block !important;}\n</style>');

fs.writeFileSync(path.join(base, 'test_real_page.html'), html);
console.log('整页测试副本已生成: test_real_page.html');
