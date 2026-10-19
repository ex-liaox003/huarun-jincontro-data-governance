// DOM-simulation render test: run the real inline script + data files with a minimal DOM shim,
// then verify the 华润资产 panels render caliber tabs + panes correctly.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const base = __dirname;

/* ---------- minimal DOM shim ---------- */
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
    const n = makeNode('div'); n.id = id; return n; // auto-stub for stdName/stdOverlay etc.
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
// external data scripts first (same order as page)
vm.runInContext(fs.readFileSync(path.join(base,'sheets_data.js'),'utf8'), ctx, {filename:'sheets_data.js'});
vm.runInContext(fs.readFileSync(path.join(base,'asset_sheets_data.js'),'utf8'), ctx, {filename:'asset_sheets_data.js'});
// indicator_standard_data.js is optional for this test
const stdFile = path.join(base,'indicator_standard_data.js');
if(fs.existsSync(stdFile)) vm.runInContext(fs.readFileSync(stdFile,'utf8'), ctx, {filename:'indicator_standard_data.js'});
// the page script itself (renders tabs+content on load)
vm.runInContext(inline[0], ctx, {filename:'inline_page.js'});

/* ---------- assertions ---------- */
let fail = 0;
const expect = (cond,msg)=>{ if(!cond){ fail++; console.log('  FAIL: '+msg);} else { console.log('  ok: '+msg);} };

const panels = allNodes.filter(n=>n.id && n.id.indexOf('panel-')===0);
console.log('\nrendered panels:', panels.map(p=>p.id).join(', '));

const assetIds = ['panel-asset01','panel-asset02','panel-asset03','panel-asset04'];
assetIds.forEach(id=>{
  const p = allNodes.find(n=>n.id===id);
  expect(!!p, `${id} exists`);
  if(!p) return;
  const h = p.innerHTML;
  const tabs = (h.match(/class="caliber-tab( active)?"/g)||[]).length;
  const activeTabs = (h.match(/caliber-tab active/g)||[]).length;
  /* 页签面板分两类：table-wrap caliber-pane（每页签1个）与 kpi-row caliber-pane（按口径KPI，可选）；断言以表面板为准 */
  const panes = (h.match(/table-wrap caliber-pane/g)||[]).length;
  const activePanes = (h.match(/table-wrap caliber-pane active/g)||[]).length;
  expect(tabs>=1, `${id} has ${tabs} caliber tab(s)`);
  expect(activeTabs===1, `${id} exactly 1 active tab`);
  expect(panes===tabs, `${id} pane count(${panes}) === tab count(${tabs})`);
  expect(activePanes===1, `${id} exactly 1 active pane`);
  expect(h.indexOf('指标口径')<0, `${id} table has no 指标口径 column header`);
});

// bank panel should NOT have caliber tabs (unchanged behavior)
const bankPanel = allNodes.find(n=>n.id==='panel-01');
expect(bankPanel && bankPanel.innerHTML.indexOf('caliber-tab')<0, 'bank panel-01 has no caliber tabs');

// spot-check asset01 tab labels
const a1 = allNodes.find(n=>n.id==='panel-asset01').innerHTML;
['财务考核口径','资产单体口径','渝康单体口径','资产香港(含深圳)口径'].forEach(lb=>{
  expect(a1.indexOf('caliber-tab-name">'+lb+'<')>=0, `asset01 tab label "${lb}" present`);
});
expect(a1.indexOf('表头')<0, 'noop');

// count tables inside asset02: should be 4 panes each with 1 data-table
const a2 = allNodes.find(n=>n.id==='panel-asset02').innerHTML;
expect((a2.match(/<table class="data-table">/g)||[]).length===4, 'asset02 renders 4 tables (one per caliber)');

console.log(fail===0 ? '\nRENDER TEST PASSED ✓' : `\n${fail} RENDER CHECK(S) FAILED ✗`);
process.exit(fail===0?0:1);
