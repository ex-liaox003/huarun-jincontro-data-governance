/* 验证「预算值填报.html」独立页：加载渲染 → 编辑 → 必填校验 → 填写提交 → 切换年度/单元 → CSV 导入 → 导出提示 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const probe = `<script>
(function(){
  window.__errs=[]; window.onerror=function(m){ __errs.push(String(m)); };
  window.__probe=function(){
    var r={};
    r.navItems = document.querySelectorAll('.nav-item').length;
    r.navText = [...document.querySelectorAll('.nav-item,.nav-parent')].map(b=>b.textContent).join('|');
    var panel=document.getElementById('panel-bud-fill');
    r.panelActive = !!(panel && panel.classList.contains('active'));
    r.rows = panel? panel.querySelectorAll('tbody tr').length : 0;
    r.headers = panel? [...panel.querySelectorAll('thead th')].map(t=>t.textContent.trim()).join('|') : '';
    var first=panel.querySelector('input.bud-input');
    r.ro0 = first.readOnly;
    /* 编辑态 */
    panel.querySelector('[data-action=bud-edit]').click();
    first=panel.querySelector('input.bud-input');
    r.editableAfterClick = !first.readOnly;
    /* 提交校验（未填→红框） */
    document.querySelector('[data-action=bud-submit]').click();
    r.errCount = document.querySelectorAll('#panel-bud-fill .bud-input.bud-err').length;
    /* 全填 */
    document.querySelectorAll('#panel-bud-fill input.bud-input').forEach(function(inp,i){
      var nk=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
      nk.call(inp, String(100+i)); inp.dispatchEvent(new Event('input',{bubbles:true}));
    });
    document.querySelector('[data-action=bud-submit]').click();
    r.toastAfterSubmit = (document.getElementById('toast')||{}).textContent;
    r.readonlyAfterSubmit = document.querySelector('#panel-bud-fill input.bud-input').readOnly;
    /* 年度下拉倒序 */
    r.yearOpts = [...document.getElementById('budYearSel').options].map(o=>o.value).join(',');
    r.yearSel = document.getElementById('budYearSel').value;
    /* 切换业务单元 */
    var us=document.getElementById('budUnitSel');
    var nkv=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set;
    nkv.call(us,'lease'); us.dispatchEvent(new Event('change',{bubbles:true}));
    r.leaseRows = document.querySelectorAll('#panel-bud-fill tbody tr').length;
    r.leaseUnit = document.querySelector('#panel-bud-fill tbody td').textContent;
    /* CSV 导入 */
    var head=document.querySelectorAll('#panel-bud-fill thead th')[7].textContent.replace('*','').trim();
    var names=[...document.querySelectorAll('#panel-bud-fill tbody .indicator-name')].slice(0,2).map(td=>td.textContent.trim());
    var csv='\\uFEFF业务单元,指标标准编号,指标名称,指标单位,'+head+'\\n华润租赁,,'+names[0]+',亿元,777\\n华润租赁,,'+names[1]+',亿元,888\\n';
    var file=new File([csv],'t.csv',{type:'text/csv'});
    window.__impDone=false;
    var of=budHandleImportFile;
    budHandleImportFile=function(f){ of(f); setTimeout(function(){
      var vals=[...document.querySelectorAll('#panel-bud-fill input.bud-input')].slice(0,2).map(i=>i.value);
      window.__impVals=vals;
      window.__impToast=(document.getElementById('toast')||{}).textContent;
      window.__impDone=true;
    },400); };
    var dt=new DataTransfer(); dt.items.add(file);
    var fi=document.getElementById('budImportFile');
    fi.files=dt.files; fi.dispatchEvent(new Event('change',{bubbles:true}));
    /* 等待异步导入完成后统一输出 */
    var waited=0;
    (function poll(){
      if(window.__impDone || waited>40){
        r.impVals = window.__impVals;
        r.impToast = window.__impToast;
        var pre=document.createElement('pre');
        pre.id='__probe_out';
        pre.textContent=JSON.stringify(r);
        document.body.appendChild(pre);
        window.__errs.forEach(function(e){
          var pe=document.createElement('pre'); pe.className='__ERR__'; pe.textContent='__ERR__:'+e; document.body.appendChild(pe);
        });
        return;
      }
      waited++; setTimeout(poll,100);
    })();
  };
  try{ window.__probe(); }catch(e){
    var pe=document.createElement('pre'); pe.className='__ERR__'; pe.textContent='__ERR__:PROBE '+e.message+' @'+e.stack.split('\\n')[1]; document.body.appendChild(pe);
  }
})();
</`+`script>`;

const tmp = path.join(base, '_test_bud_solo.html');
let html = fs.readFileSync(path.join(base, '预算值填报.html'), 'utf8');
html = html.replace('</body>', probe + '\n</body>');
fs.writeFileSync(tmp, html, 'utf8');

const out = execFileSync(CHROME, [
  '--headless', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files',
  '--virtual-time-budget=15000',
  '--run-all-compositor-stages-before-draw',
  '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });

const m = out.match(/<pre id="__probe_out">([\s\S]*?)<\/pre>/);
const errs = [...out.matchAll(/<pre[^>]*>(__ERR__:[^<]*)<\/pre>/g)].map(x=>x[1]);
if(fs.existsSync(tmp)) fs.unlinkSync(tmp);
console.log('JS errors:', errs.length ? errs : 'none');
if(m){
  const r = JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'));
  console.log(JSON.stringify(r, null, 1));
} else {
  const pe=[...out.matchAll(/<pre[^>]*class="__ERR__"[^>]*>([^<]*)<\/pre>/g)].map(x=>x[1]); console.log('PROBE MISSING', JSON.stringify(pe));
}
