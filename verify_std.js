/* 指标标准库模块验证（对齐 2026-09 重构版页面）：
   1 内联脚本语法 · 2 数据完整性 · 3 页面接线 · 3c 列表列集合 · 3e 分页/状态/详情 · 3b 旧检索移除 · 4 过滤逻辑 */
const fs = require('fs');
const dir = 'd:/LIAOXIA/work-2026/AI-test/华润-战略部数据应用-LAB/';
const html = fs.readFileSync(dir + '战略部数据应用平台.html', 'utf8');
global.eval(fs.readFileSync(dir + 'indicator_standard_data.js', 'utf8').replace(/\bconst\s+INDICATOR_STANDARD\b/, 'var INDICATOR_STANDARD'));

let pass = 0, fail = 0;
function check(name, cond, detail){
  if(cond){ pass++; console.log('  ✓ ' + name + (detail ? ' -> ' + detail : '')); }
  else { fail++; console.log('  ✗ ' + name + (detail ? ' -> ' + detail : '')); }
}
function sliceFn(name){
  const start = html.indexOf('function ' + name + '(');
  if(start < 0) throw new Error('not found: ' + name);
  let i = html.indexOf('{', start), depth = 0, j = i;
  for(; j < html.length; j++){
    if(html[j] === '{') depth++;
    else if(html[j] === '}'){ depth--; if(depth === 0) break; }
  }
  return html.slice(start, j + 1);
}

console.log('=== 1. 内联脚本语法检查 ===');
const inline = html.match(/<script>([\s\S]*?)<\/script>/);
try{ new Function(inline[1]); check('内联 <script> 语法合法', true); }
catch(e){ check('内联 <script> 语法合法', false, e.message); }

console.log('=== 2. 数据文件完整性 ===');
const D = INDICATOR_STANDARD;
check('INDICATOR_STANDARD 存在且含 meta/items', !!(D && D.meta && D.items));
check('items 条数与 meta.total 一致', D.items.length === D.meta.total, '实际 ' + D.items.length);
const nos = new Set(D.items.map(it=>it.no));
check('序号唯一', nos.size === D.items.length);
check('每条含 code/name/cat1', D.items.every(it=>it.code && it.name && it.cat1));
const cat1Counts = {};
D.items.forEach(it=>{ cat1Counts[it.cat1] = (cat1Counts[it.cat1]||0)+1; });
check('一级分类汇总非空', Object.keys(cat1Counts).length > 0 && Object.keys(cat1Counts).every(k=>cat1Counts[k] > 0), JSON.stringify(cat1Counts));

console.log('=== 3. 页面接线检查 ===');
['moduleQuery','stdStats','stdTable','stdPageSize','stdPagerBtns','stdPagerTotal','stdDrawer',
 'stdKeyword','stdBizUnit','stdThemeTreeBtn','stdMsBtn-caliber','stdMsBtn-freq','stdMsBtn-timeDim','stdMsBtn-assess'
].forEach(id=>check('存在 id="' + id + '"', html.indexOf('id="' + id + '"') >= 0));
check('引入 indicator_standard_data.js', html.indexOf('<script src="indicator_standard_data.js"></script>') >= 0);
['std-search','std-reset','std-detail','std-page','std-tree-toggle','std-ms-toggle'].forEach(a=>{
  check('点击委托处理 ' + a, html.indexOf("action === '" + a + "'") >= 0);
});
check('change 委托处理 data-std-key', html.indexOf('t.dataset.stdKey') >= 0);
check('Esc/遮罩关闭抽屉', html.indexOf("e.key==='Escape'") >= 0);

console.log('=== 3b. 报表指标检索已彻底移除 ===');
['sheetView','qKeyword','qSheet','qAssess','qTable'].forEach(id=>{
  check('已移除 id="' + id + '"', html.indexOf('id="' + id + '"') < 0);
});
['runIndicatorQuery','buildIndicatorIndex','switchQueryView','报表指标检索'].forEach(s=>{
  check('已移除 ' + s, html.indexOf(s) < 0);
});

console.log('=== 3c. 列表列集合（18 列：左冻结4 + 右冻结1） ===');
['序号','指标标准编号','指标分组编号','业务单元','指标口径','指标名称','指标主题','一级分类','二级分类',
 '指标定义','时间维度','指标类型','指标单位','更新频次','是否考核/高质量指标','版本号','安全级别'
].forEach(l=>check('表头含列「' + l + '」', html.indexOf('>' + l + '</th>') >= 0));
['是否监管指标','报送监管机构','三级分类','数据范围','业务单元供数部门','业务单元业务对接人','指标责任人','指标管理部门'
].forEach(l=>check('表头不含列「' + l + '」', html.indexOf('>' + l + '</th>') < 0));
check('空结果 colspan 与列数一致（18）', html.indexOf('colspan="18"') >= 0);
check('左四列冻结样式存在', html.indexOf('.std-table .stick-4{') >= 0 || html.indexOf('stick-4{left:') >= 0 || html.indexOf('.stick-4{') >= 0);
check('操作列右侧固定锁定', html.indexOf('<th class="stick-r">操作</th>') >= 0);

console.log('=== 3e. 分页 / 状态标识 / 详情 / 提示 ===');
check('每页条数 10/20/50/100 且默认 10', html.indexOf('pageSize:10') >= 0 && html.indexOf('[10,20,50,100]') >= 0);
check('分页条含总数显示', html.indexOf('id="stdPagerTotal"') >= 0);
check('指标状态圆点样式（未发布橙/已发布绿/其余灰）', ['.std-status.unpub{','.std-status.pub{','.std-status.off{'].every(s=>html.indexOf(s) >= 0) && html.indexOf('function stdStatusHtml') >= 0);
check('详情表格化展示', html.indexOf('.std-detail-table{') >= 0 && html.indexOf('<table class="std-detail-table">') >= 0);
check('卡片 tips 问号 + body 级浮层', html.indexOf('class="gk-tip"') >= 0 && html.indexOf('.gk-tip-float{') >= 0);
check('指标口径随业务单元联动门禁', html.indexOf('function stdUpdateCaliberCombo') >= 0 && html.indexOf('请先选择业务单元') >= 0);
check('卡片含 战略/风险 统计', html.indexOf("label:'战略'") >= 0 && html.indexOf("label:'风险'") >= 0);

console.log('=== 4. 过滤逻辑功能测试 ===');
global.eval(sliceFn('stdIsEmpty'));
check('stdIsEmpty(待金控补充)=true', stdIsEmpty('待金控补充') === true);
check('stdIsEmpty(不涉及)=true', stdIsEmpty('不涉及') === true);
check('stdIsEmpty(亿元)=false', stdIsEmpty('亿元') === false);

global.STD_DATA = D;
global.stdState = { kw:'', bizUnit:'', caliber:[], freq:[], timeDim:[], assess:[], page:1, pageSize:10 };
global.stdLeafChecked = new Set();
global.eval(sliceFn('stdFiltered'));
function run(state){
  Object.assign(global.stdState, { kw:'', bizUnit:'', caliber:[], freq:[], timeDim:[], assess:[] }, state);
  return stdFiltered();
}
const cnt = fn=>D.items.filter(fn).length;
check('无条件=全量', run({}).length === D.items.length, run({}).length + ' 项');
const nm0 = String(D.items[0].name);
check('kw=名称命中', run({kw:nm0}).length >= 1 && run({kw:nm0}).some(it=>it.name===nm0), nm0);
check('kw=编号命中(大小写不敏感)', run({kw:String(D.items[0].code).toLowerCase()}).length >= 1, D.items[0].code);
check('kw=不存在关键字 -> 0', run({kw:'zzz不存在'}).length === 0);
check('bizUnit 过滤与数据一致', run({bizUnit:'华润银行'}).length === cnt(it=>it.bizUnit==='华润银行'), cnt(it=>it.bizUnit==='华润银行') + ' 项');
const f0 = (D.items.find(it=>it.freq) || {}).freq;
check('freq 多选过滤与数据一致', run({freq:[f0]}).length === cnt(it=>it.freq===f0), f0 + ' ' + cnt(it=>it.freq===f0) + ' 项');
const t0 = (D.items.find(it=>it.timeDim) || {}).timeDim;
check('timeDim 多选过滤与数据一致', run({timeDim:[t0]}).length === cnt(it=>it.timeDim===t0), t0 + ' ' + cnt(it=>it.timeDim===t0) + ' 项');
const c0 = (D.items.find(it=>it.caliber) || {}).caliber;
check('caliber 多选过滤与数据一致', run({caliber:[c0]}).length === cnt(it=>it.caliber===c0), c0 + ' ' + cnt(it=>it.caliber===c0) + ' 项');
const fi = D.items.find(it=>it.freq) || D.items[0];
const kn = String(fi.name).slice(0, 4);
check('kw+freq 组合过滤', run({kw:kn, freq:[fi.freq]}).length >= 1 && run({kw:kn, freq:[fi.freq]}).every(it=>it.freq===fi.freq && String(it.name).indexOf(kn) >= 0), kn + ' + ' + fi.freq);

console.log('');
console.log(fail === 0 ? '=== 全部 ' + pass + ' 项验证通过 ===' : '=== ' + fail + ' 项失败 / ' + pass + ' 项通过 ===');
process.exit(fail === 0 ? 0 : 1);
