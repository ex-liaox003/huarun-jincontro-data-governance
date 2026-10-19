// 同步最新页面到副本文件夹
const fs = require('fs');
const path = require('path');
const base = 'd:/LIAOXIA/work-2026/AI-test/华润-战略部数据应用-LAB';
const dst = 'd:/LIAOXIA/work-2026/AI-test/华润-数据应用-LAB';
['战略部数据应用平台.html', 'sheets_data.js', 'indicator_standard_data.js'].forEach(f => {
  fs.copyFileSync(path.join(base, f), path.join(dst, f));
  console.log('已同步:', f);
});
