// DOM-simulation render test: 华润保险 ins01/ins03 新增「是否考核指标」列
// 复用 render_test_asset.js 的 DOM shim，按页面真实加载顺序执行，断言 panel 渲染输出
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const base = __dirname;

/* ---------- minimal DOM shim (same as render_test_asset.js) ---------- */
const allNodes = [];
function makeNode(tag){
  const node = {
    tagName:(tag||'div').toUpperCase(),
    children:[],
    className:'',
    id:'',
    textContent:'',
    _innerHTML:'',
    dataset:{},
    style:{},
    attrs:{},
    listeners:{},
    classList:{
      add(...cs){ node._cls().push(...cs); },
      remove(...cs){ node._clsList = node._cls().filter(c=>!cs.includes(c)); },
      toggle(c, force){
        const has = node._cls().includes(c);
        const want = force===undefined ? !has : !!force;
        if(want && !has) node._cls().push(c);
        if(!want && has) node._clsList = node._cls().filter(x=>x!==c);
        return want;
      },
      contains(c){ return node._cls().includes(c); }
    },
    _clsList:null,
    _cls(){ if(node._clsList===null) node._clsList = node.className.split(/\s+/).filter(Boolean); return node._clsList; },
    appendChild(ch){ node.children.push(ch); return ch; },
    addEventListener(){},
    setAttribute(k,v){ node.attrs[k]=v; },
    querySelectorAll(){ return []; },
    querySelector(){ return null; },
    closest(){ return null; },
    getBoundingClientRect(){ return {top:0,left:0}; },
    get nextElementSibling(){ return null; }
  };
  Object.defineProperty(node,'innerHTML',{
    get(){ return node._innerHTML; },
    set(v){ node._innerHTML = String(v); }
  });
  allNodes.push(node);
  return node;
}

const documentStub = {
  createElement: t=>makeNode(t),
  getElementById(id){
    for(const n of allNodes){ if(n.id===id) return n; }
    const n = makeNode('div'); n.id = id; return n;
  },
  querySelectorAll(){ return []; },
  querySelector(){ return null; },
  addEventListener(){},
  body: makeNode('body')
};
const windowStub = { pageYOffset:0, scrollTo(){}, addEventListener(){} };

/* ---------- load real page code ---------- */
const html = fs.readFileSync(path.join(base,'战略部数据应用平台.html'),'utf8');
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
if(inline.length!==1) throw new Error('expected 1 inline script, got '+inline.length);

const ctx = vm.createContext({
  document:documentStub, window:windowStub, alert(){}, console,
  setTimeout:(fn)=>0, clearTimeout(){}, parseFloat, parseInt, isNaN, Array, Object, String, Number, Math, RegExp
});
// external data scripts (same order as page)
for(const f of ['sheets_data.js','asset_sheets_data.js','trust_sheets_data.js','insurance_sheets_data.js','lease_sheets_data.js','cockpit_data.js','indicator_standard_data.js']){
  const fp = path.join(base,f);
  if(fs.existsSync(fp)) vm.runInContext(fs.readFileSync(fp,'utf8'), ctx, {filename:f});
}
vm.runInContext(inline[0], ctx, {filename:'inline_page.js'});

/* ---------- assertions ---------- */
let fail = 0;
const expect = (cond,msg)=>{ if(!cond){ fail++; console.log('  FAIL: '+msg);} else { console.log('  ok: '+msg);} };

for(const key of ['ins01','ins03']){
  const p = allNodes.find(n=>n.id==='panel-'+key);
  expect(!!p, `panel-${key} exists`);
  if(!p) continue;
  const h = p.innerHTML;
  // 1. 表头含「是否考核指标」，且位于「单位」之后、「当月值」之前
  const iUnit = h.indexOf('<th rowspan="2">单位</th>');
  const iAssess = h.indexOf('<th rowspan="2">是否考核指标</th>');
  const iMonth = h.indexOf('当月值');
  expect(iUnit>=0 && iAssess===iUnit+'<th rowspan="2">单位</th>'.length, `${key} 表头「是否考核指标」紧跟「单位」`);
  expect(iAssess>=0 && iAssess<iMonth, `${key} 「是否考核指标」位于「当月值」分组之前`);
  // 2. 金色考核星：<td class="assess yes">★</td> 单元格数 = 行数（4）
  const yesCells = (h.match(/class="assess yes">★/g)||[]).length;
  const stars = (h.match(/★/g)||[]).length;
  expect(stars>=4, `${key} 渲染 ★ 数量 ${stars} ≥ 4（每行默认考核）`);
  expect(yesCells===4, `${key} assess yes 金色星单元格 = 4 (实际 ${yesCells})`);
  // 3. 无「较年初」残留
  expect(h.indexOf('较年初')<0, `${key} 无「较年初」列残留`);
  // 4. 每行 td 数 = 10（首行抽查：按 </tr> 切块找到含指标名的数据块）
  const firstName = key==='ins01' ? '营业收入' : '华润燃气存量用户保费占比';
  const chunk = h.split('</tr>').find(seg=>seg.indexOf('<td')>=0 && seg.indexOf(firstName)>=0);
  if(chunk){
    const tds = (chunk.match(/<td/g)||[]).length;
    expect(tds===10, `${key} 首数据行 10 个 td (实际 ${tds})`);
  } else {
    expect(false, `${key} 找到含「${firstName}」的数据行`);
  }
}

// ins02 回归：不受影响（12 列、2 个★、分类合并保留）
const p2 = allNodes.find(n=>n.id==='panel-ins02');
expect(!!p2, 'panel-ins02 exists');
if(p2){
  const h2 = p2.innerHTML;
  expect((h2.match(/★/g)||[]).length===2, 'ins02 考核星仍为 2 处（序号7/39）');
  expect(h2.indexOf('rowspan="23"')>=0, 'ins02 指标分类 rowspan=23 合并（46行=23+23）');
  expect(h2.indexOf('较年初(%)')<0, 'ins02 表格无「较年初(%)」列（KPI 卡片的较年初行属概览区，保留）');
  // 2026-09-15 新增两行：银保保费规模后+产融创新场景保费规模；银保佣金收入后+产融创新场景佣金收入
  expect(h2.indexOf('indicator-name lv2">产融创新场景保费规模<')>=0, 'ins02 新增「产融创新场景保费规模」(三级)');
  expect(h2.indexOf('indicator-name lv2">产融创新场景佣金收入<')>=0, 'ins02 新增「产融创新场景佣金收入」(三级)');
  const segs = h2.split('</tr>').filter(s=>s.indexOf('<td')>=0);
  expect(segs.length===46, 'ins02 数据行 = 46 (实际 '+segs.length+')');
  const seqOk = segs.every((sg,idx)=>sg.indexOf('>'+ (idx+1) +'</td>')>=0);
  expect(seqOk, 'ins02 序号 1~46 连续无缺');
  // 产融明细组内重排（2026-09-15）：商户→银保→产融创新场景 在前，四个「其中：」子项收拢其后
  const orderP=['商户保险保费规模','银保保费规模','产融创新场景保费规模','其中：社区保险保费规模','其中：其他产融创新场景保费规模','其中：职域保费规模','其中：其他融融保费规模'];
  orderP.forEach((nm,k)=>expect(segs[8+k] && segs[8+k].indexOf('>'+nm+'<')>=0, '产融保费组 序号'+(9+k)+' = '+nm));
  const orderC=['商户保险佣金收入','银保佣金收入','产融创新场景佣金收入','其中：社区保险佣金收入','其中：其他产融创新场景佣金收入','其中：职域佣金收入','其中：其他融融佣金收入'];
  orderC.forEach((nm,k)=>expect(segs[31+k] && segs[31+k].indexOf('>'+nm+'<')>=0, '产融佣金组 序号'+(32+k)+' = '+nm));
  // 重排后层级（2026-09-15 四级化）：一级=序号1/24 加粗靠左；二级=8个业务合计；三级=明细；四级=「其中：」
  expect(segs[0].indexOf('indicator-name lv0">保费规模<')>=0, '序号1 保费规模 为一级(lv0 加粗靠左)');
  expect(segs[23].indexOf('indicator-name lv0">佣金收入<')>=0, '序号24 佣金收入 为一级(lv0 加粗靠左)');
  expect(segs[1].indexOf('indicator-name lv1">机构业务保费规模<')>=0, '序号2 机构业务保费规模 为二级(lv1)');
  expect(segs[24].indexOf('indicator-name lv1">机构业务佣金收入<')>=0, '序号25 机构业务佣金收入 为二级(lv1)');
  expect(segs[10].indexOf('indicator-name lv2">产融创新场景保费规模<')>=0, '序号11 产融创新场景保费规模 为三级(lv2)');
  expect(segs[11].indexOf('indicator-name lv3">其中：社区保险保费规模<')>=0, '序号12 其中：社区保险保费规模 为四级(lv3)');
  expect(segs[34].indexOf('indicator-name lv3">其中：社区保险佣金收入<')>=0, '序号35 其中：社区保险佣金收入 为四级(lv3)');
  const lvCount=(h2,lv)=>(h2.match(new RegExp('indicator-name lv'+lv+'">','g'))||[]).length;
  expect(lvCount(h2,0)===2 && lvCount(h2,1)===8 && lvCount(h2,3)===12, 'ins02 层级计数 一级2/二级8/四级12 (实际 '+lvCount(h2,0)+'/'+lvCount(h2,1)+'/'+lvCount(h2,3)+')');
  // 产融业务保费明细/佣金明细 分项合并 = 7 行
  expect(h2.indexOf('rowspan="7"')>=0, 'ins02 产融明细分项 rowspan=7 合并');
  // 2026-09-15 指标概览 4 卡：保费规模/产融业务保费规模/佣金收入/香港业务佣金收入（按序）
  const klabels=['保费规模','产融业务保费规模','佣金收入','香港业务佣金收入'];
  let kpos=-1, kordered=true;
  klabels.forEach(lb=>{ const i=h2.indexOf('<div class="kpi-label">'+lb+'</div>'); if(i<0||i<=kpos) kordered=false; kpos=i; });
  expect(kordered, 'ins02 概览4卡按序 = 保费规模/产融业务保费规模/佣金收入/香港业务佣金收入');
  expect(h2.indexOf('<div class="kpi-label">机构业务保费规模</div>')<0, 'ins02 机构业务保费规模卡片已移除');
  // 2026-09-16 指标分类筛选条：位于表头上方，3 个按钮（默认「全部」激活）
  const iFilter = h2.indexOf('cat-filter');
  expect(iFilter>=0 && iFilter < h2.indexOf('<table'), 'ins02 筛选条渲染在表格之前');
  ['全部','保费规模','佣金收入'].forEach(o=>{
    expect(h2.indexOf('data-action="cat-filter" data-key="ins02" data-cat="'+o+'"')>=0, 'ins02 筛选按钮「'+o+'」存在');
  });
  expect(h2.indexOf('class="cat-filter-btn active" data-action="cat-filter" data-key="ins02" data-cat="全部"')>=0, 'ins02 默认「全部」激活');
}

// ins01/ins03 不受影响：无筛选条
for(const key of ['ins01','ins03']){
  const p = allNodes.find(n=>n.id==='panel-'+key);
  expect(!!p && p.innerHTML.indexOf('cat-filter')<0, key+' 无指标分类筛选条');
}

// filterCatView 功能断言（在页面 VM 上下文中直接调用真实函数）
{
  const call = expr => vm.runInContext(expr, ctx);
  // 全部 → 原视图 46 行
  expect(call('filterCatView(INSURANCE_SHEETS.ins02,"全部",1).rows.length')===46, 'filterCatView 全部=46行');
  // 保费规模 → 23 行（序号1~23）
  expect(call('filterCatView(INSURANCE_SHEETS.ins02,"保费规模",1).rows.length')===23, 'filterCatView 保费规模=23行');
  expect(call('filterCatView(INSURANCE_SHEETS.ins02,"保费规模",1).rows.map(r=>r[0]).join(",")')
    === Array.from({length:23},(_,i)=>i+1).join(','), '保费规模视图序号=1~23');
  expect(call('JSON.stringify(filterCatView(INSURANCE_SHEETS.ins02,"保费规模",1).spans.filter(s=>s.col===1))')
    === '[{"col":1,"row":0,"rs":23}]', '保费规模视图 指标分类合并={row:0,rs:23}（佣金段剔除）');
  // 佣金收入 → 23 行（序号24~46），spans 行号重映射（23→0 基准）
  expect(call('filterCatView(INSURANCE_SHEETS.ins02,"佣金收入",1).rows.length')===23, 'filterCatView 佣金收入=23行');
  expect(call('filterCatView(INSURANCE_SHEETS.ins02,"佣金收入",1).rows.map(r=>r[0]).join(",")')
    === Array.from({length:23},(_,i)=>i+24).join(','), '佣金收入视图序号=24~46');
  expect(call('JSON.stringify(filterCatView(INSURANCE_SHEETS.ins02,"佣金收入",1).spans)')
    === '[{"col":1,"row":0,"rs":23},{"col":2,"row":2,"rs":2},{"col":2,"row":6,"rs":2},{"col":2,"row":8,"rs":7},{"col":2,"row":16,"rs":3}]',
    '佣金收入视图 spans 重映射（col1 归零起点 + col2 四段位移-23）');
  // levels 同步过滤：佣金收入视图 levels[0]=0（原序号24 一级）
  expect(call('filterCatView(INSURANCE_SHEETS.ins02,"佣金收入",1).levels[0]')===0, '佣金收入视图 levels[0]=0（佣金收入为一级）');
  // 过滤视图经 renderTable 渲染：保费规模表内不含「佣金收入」字样；分类格 rowspan=23 保留
  const tbl = call('renderTable(filterCatView(INSURANCE_SHEETS.ins02,"保费规模",1),getColTypes(INSURANCE_SHEETS.ins02.headers),true)');
  expect(typeof tbl==='string' && tbl.indexOf('佣金收入')<0, '保费规模过滤渲染无「佣金收入」残留');
  expect(tbl.indexOf('rowspan="23"')>=0 && (tbl.match(/<tr>/g)||[]).length===24, '保费规模过滤渲染 23 数据行(+1表头行) + 分类合并格');
}

console.log(fail? `\n=== ${fail} 项失败 ===` : '\n=== 全部断言通过 ===');
process.exit(fail?1:0);
