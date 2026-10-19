// 生成 ins02(业务指标) 指标分类筛选截图测试页：
//   test_ins02_all.html    —— 默认「全部」46 行
//   test_ins02_filter.html —— 模拟点击「保费规模」后仅 23 行
const fs = require('fs');
const path = require('path');
const base = __dirname;
let html = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');
html = html.split('overview-area collapsed').join('overview-area');
html = html.replace('</style>', `
.sheet-panel{display:none !important;}
#panel-ins02{display:block !important;}
#panel-ins02 .table-wrap{max-height:none !important;}
</style>`);

// 页面1：默认全部
fs.writeFileSync(path.join(base, 'test_ins02_all.html'),
  html.replace('</body>', "<script>switchTab('ins02');</script>\n</body>"));

// 页面2：模拟选中「保费规模」
const clickScript = `<script>
switchTab('ins02');
catFilterState['ins02']='保费规模';
rerenderCatTable('ins02');
document.querySelectorAll('#panel-ins02 .cat-filter-btn').forEach(b=>b.classList.toggle('active', b.dataset.cat==='保费规模'));
</script>\n</body>`;
fs.writeFileSync(path.join(base, 'test_ins02_filter.html'), html.replace('</body>', clickScript));
console.log('截图测试页已生成: test_ins02_all.html / test_ins02_filter.html');
