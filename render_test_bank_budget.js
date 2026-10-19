// 渲染断言：华润银行 02/03/04/06/08/09 预算一致性规则
// 考核行(★)：全年预算有值 + 预算达成率渲染进度条；非考核行：两列均渲染灰色 --
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const base = __dirname;

/* ---------- DOM shim（同 render_test_ins_assess.js） ---------- */
const allNodes = [];
function makeNode(tag){
  const node = {
    tagName:(tag||'div').toUpperCase(), children:[], className:'', id:'', textContent:'',
    _innerHTML:'', dataset:{}, style:{}, attrs:{}, listeners:{},
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
    addEventListener(){}, setAttribute(k,v){ node.attrs[k]=v; },
    querySelectorAll(){ return []; }, querySelector(){ return null; }, closest(){ return null; },
    getBoundingClientRect(){ return {top:0,left:0}; },
    get nextElementSibling(){ return null; }
  };
  Object.defineProperty(node,'innerHTML',{ get(){ return node._innerHTML; }, set(v){ node._innerHTML = String(v); } });
  allNodes.push(node);
  return node;
}
const documentStub = {
  createElement: t=>makeNode(t),
  getElementById(id){ for(const n of allNodes){ if(n.id===id) return n; } const n = makeNode('div'); n.id = id; return n; },
  querySelectorAll(){ return []; }, querySelector(){ return null; }, addEventListener(){},
  body: makeNode('body')
};
const windowStub = { pageYOffset:0, scrollTo(){}, addEventListener(){} };

/* ---------- 加载真实页面代码 ---------- */
const html = fs.readFileSync(path.join(base,'战略部数据应用平台.html'),'utf8');
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const ctx = vm.createContext({
  document:documentStub, window:windowStub, alert(){}, console,
  setTimeout:(fn)=>0, clearTimeout(){}, parseFloat, parseInt, isNaN, Array, Object, String, Number, Math, RegExp
});
for(const f of ['sheets_data.js','asset_sheets_data.js','trust_sheets_data.js','insurance_sheets_data.js','lease_sheets_data.js','cockpit_data.js','indicator_standard_data.js']){
  const fp = path.join(base,f);
  if(fs.existsSync(fp)) vm.runInContext(fs.readFileSync(fp,'utf8'), ctx, {filename:f});
}
vm.runInContext(inline[0], ctx, {filename:'inline_page.js'});

/* ---------- 断言 ---------- */
let fail = 0;
const expect = (cond,msg)=>{ if(!cond){ fail++; console.log('  FAIL: '+msg);} else { console.log('  ok: '+msg);} };

// vm 中 const 声明不挂全局，单独加载数据文件取 SHEETS 对象
const dataCtx = {};
vm.createContext(dataCtx);
vm.runInContext(fs.readFileSync(path.join(base,'sheets_data.js'),'utf8')+';this.SHEETS=SHEETS;', dataCtx);
const SHEETS = dataCtx.SHEETS;
const cfg={'02':[3,8,9],'03':[4,10,11],'04':[5,10,11],'06':[5,10,11],'08':[5,10,11],'09':[4,9,10]};

for(const k of Object.keys(cfg)){
  const [ai,bi,ci] = cfg[k];
  const p = allNodes.find(n=>n.id==='panel-'+k);
  expect(!!p, 'panel-'+k+' 已渲染');
  if(!p) continue;
  const h = p.innerHTML;
  const rows = SHEETS[k].rows;
  const segs = h.split('</tr>').filter(s=>s.indexOf('<td')>=0);
  expect(segs.length===rows.length, k+' 数据行数 = '+rows.length+' (实际 '+segs.length+')');

  let assessedN=0, plainN=0;
  rows.forEach((r,i)=>{
    const seg = segs[i]||'';
    const assessed = (r[ai]==='★'||r[ai]==='是');
    if(assessed){
      assessedN++;
      // 预算值原样出现 + 进度条渲染
      expect(seg.indexOf('>'+r[bi]+'<')>=0 || seg.indexOf(r[bi])>=0, k+' 考核行'+r[0]+' 全年预算 '+r[bi]+' 渲染');
      expect(seg.indexOf('progress-fill')>=0, k+' 考核行'+r[0]+' 预算达成率进度条渲染 ('+r[ci]+')');
    } else {
      plainN++;
      // 该行不应出现进度条，且 dim-dash 至少 2 处（预算+达成率）
      expect(seg.indexOf('progress-fill')<0, k+' 非考核行'+r[0]+' 无进度条');
      const dashes = (seg.match(/dim-dash">--/g)||[]).length;
      expect(dashes>=2, k+' 非考核行'+r[0]+' 预算/达成率均渲染 -- (dim-dash '+dashes+' 处)');
    }
  });
  console.log('  ['+k+'] 考核行 '+assessedN+' / 非考核行 '+plainN);
}

/* 01/05/07 回归：无预算列，不受影响 */
for(const k of ['01','05','07']){
  const p = allNodes.find(n=>n.id==='panel-'+k);
  expect(!!p && p.innerHTML.indexOf('progress-fill')<0, k+' 表无预算达成率列（回归）');
}

console.log(fail===0 ? '\n=== 全部 '+ '断言通过 ===' : '\n=== 失败 '+fail+' 项 ===');
process.exit(fail===0?0:1);
