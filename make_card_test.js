// 从真实页面抽取 <style> 块，构造卡片测试页，验证底色与悬停底色真实渲染
const fs = require('fs');
const path = require('path');
const base = __dirname;

const html = fs.readFileSync(path.join(base, '战略部数据应用平台.html'), 'utf8');
const styleRaw = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));
// 将 :hover 规则镜像为 .hsim 类，便于静态截图验证悬停效果
const style = styleRaw + '\n' + styleRaw.replaceAll(':hover', '.hsim');

const hsim = i => (i === 0 || i === 1) ? ' hsim' : '';
const cards = ['', 'accent', 'success', 'warning', 'danger'].map((t, i) => `
  <div class="kpi-card ${t}${hsim(i)}">
    <div class="kpi-label">测试卡片 ${t || 'default'}${hsim(i) ? '（模拟悬停）' : ''}</div>
    <div class="kpi-value">12,580.00<span class="kpi-unit">亿元</span></div>
    <div class="kpi-trends">
      <div class="kpi-trend-row"><span class="kpi-trend-name">同比</span><span class="kpi-delta up">▲ +8.6%</span></div>
      <div class="kpi-trend-row"><span class="kpi-trend-name">较年初</span><span class="kpi-delta up">▲ +6.2%</span></div>
    </div>
  </div>`).join('');

const stats = ['', 'accent', 'info', 'warning', 'danger'].map((t, i) => `
  <div class="std-stat ${t}${hsim(i)}">
    <div class="kpi-label">统计卡片 ${t || 'default'}${hsim(i) ? '（模拟悬停）' : ''}</div>
    <div class="kpi-value">159<span class="kpi-unit">项</span></div>
  </div>`).join('');

const test = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${style}</style></head>
<body style="padding:20px;">
<div class="sheet-panel" style="display:block;">
  <div class="kpi-row" style="grid-template-columns:repeat(5,1fr);">${cards}</div>
</div>
<div class="std-stats">${stats}</div>
</body></html>`;

fs.writeFileSync(path.join(base, 'test_card_style.html'), test);
console.log('测试页已生成: test_card_style.html');
