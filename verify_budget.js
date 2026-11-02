/* 验证「预算值填报管理 → 预算值填报」模块（2026-10-21 新增；2026-10-23 编辑/仅查看模式改造）：
   1) 侧栏一级菜单：报表台账管理 之后出现同级「预算值填报管理」，明细栏「预算值填报」
   2) 点击菜单 → panel-bud-fill 激活；工具栏两个下拉（业务单元/预算年度，无中括号）
   3) 表头 8 列；默认仅查看（输入框 readonly，无 placeholder）；点「编辑」后可填写
   4) 切换业务单元（银行→保险）行数变化；信托空态提示
   5) 未填全提交 → 拦截 toast + 空输入红框 + 行下方"请输入预算值"；输入后红框即时消失
   6) 全部填写提交成功；切换年度后草稿按键隔离
   运行：node verify_budget.js（需本机 Chrome） */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const srcHtml = fs.readFileSync(path.join(base, 'index.html'), 'utf8');

const probe = `<script>
(function(){
  window.__errs=[]; window.onerror=function(m){ __errs.push(m); };
  try{
    switchTab('bud-fill');
  }catch(e){ __errs.push('BOOT:'+e.message); }
  setTimeout(function(){
    try{
      var out='';
      /* 1) 侧栏菜单 */
      var parents=[].map.call(document.querySelectorAll('.nav-parent'),b=>b.textContent.trim());
      out+=' PARENTS='+parents.join(',');
      var budBtn=[].filter.call(document.querySelectorAll('.nav-item'),b=>b.dataset.sheet==='bud-fill')[0];
      out+=' MENUCTL='+(budBtn?budBtn.textContent:'MISSING')+' ACTIVE='+document.querySelector('.nav-item[data-sheet="bud-fill"]').classList.contains('active');
      /* 2) 面板与工具栏（标签无中括号） */
      var panel=document.getElementById('panel-bud-fill');
      out+=' PANEL_ACTIVE='+(panel&&panel.classList.contains('active'));
      var labels=[].map.call(panel.querySelectorAll('.bud-field-label'),l=>l.textContent.trim());
      out+=' LABELS='+labels.join('|');
      out+=' YSEL='+(document.getElementById('budYearSel')?document.getElementById('budYearSel').value:'MISSING')
          +' USEL='+(document.getElementById('budUnitSel')?document.getElementById('budUnitSel').value:'MISSING');
      /* 3) 表头 8 列 + 日期/预算值列白色字体 */
      var ths=[].map.call(panel.querySelectorAll('.bud-table thead th'),t=>t.textContent.trim());
      out+=' THEAD='+ths.join('|');
      var reqTh=panel.querySelectorAll('.bud-table thead th');
      out+=' TH7COLOR='+getComputedStyle(reqTh[6]).color+' TH7FONT='+getComputedStyle(reqTh[6]).fontFamily.indexOf('SimHei');
      /* 4) 默认仅查看：输入框 readonly */
      var firstInp=panel.querySelector('input.bud-input');
      out+=' VIEW_RO='+firstInp.readOnly+' MODE_TIP='+/仅查看/.test(panel.querySelector('.bud-mode').textContent);
      /* 5) 点编辑 → 可填写；下拉禁用 */
      document.querySelector('[data-action="bud-edit"]').click();
      var p2=document.getElementById('panel-bud-fill');
      out+=' EDIT_RO='+p2.querySelector('input.bud-input').readOnly
          +' SEL_DISABLED='+document.getElementById('budUnitSel').disabled;
      /* 6) 切换业务单元（先回仅查看）→ 保险行数 */
      document.querySelector('[data-action="bud-edit"]').click(); // 完成编辑
      var us=document.getElementById('budUnitSel');
      us.value='ins'; us.dispatchEvent(new Event('change',{bubbles:true}));
      out+=' INS_ROWS='+document.querySelectorAll('#panel-bud-fill .bud-table tbody tr').length;
      /* 信托 = 无已发布预算指标 → 空提示 */
      us=document.getElementById('budUnitSel'); us.value='trust';
      us.dispatchEvent(new Event('change',{bubbles:true}));
      out+=' TRUST_EMPTY='+!!document.querySelector('#panel-bud-fill .bud-empty-tip');
      /* 回到银行 → 编辑 → 漏填 1 项提交 → 红框 + 提示 */
      us=document.getElementById('budUnitSel'); us.value='bank';
      us.dispatchEvent(new Event('change',{bubbles:true}));
      document.querySelector('[data-action="bud-edit"]').click();
      var ins=[].slice.call(document.querySelectorAll('#panel-bud-fill input.bud-input'));
      ins.slice(0,ins.length-1).forEach(i=>{ i.value='100'; });
      document.querySelector('[data-action="bud-submit"]').click();
      var panel3=document.getElementById('panel-bud-fill');
      out+=' BLOCK_TOAST='+/提交失败/.test(document.getElementById('toast').textContent);
      var errs=panel3.querySelectorAll('input.bud-input.bud-err');
      var tips=panel3.querySelectorAll('.bud-err-tip');
      out+=' ERR_BOXES='+errs.length+' ERR_TIPS='+tips.length
          +' TIP_TXT='+(tips[0]?tips[0].textContent:'-')
          +' ERR_BORDER='+(errs[0]?getComputedStyle(errs[0]).borderColor:'-');
      /* 补填最后一项（重渲染后重新取输入框）→ 红框即时消失 */
      var ins2=[].slice.call(document.querySelectorAll('#panel-bud-fill input.bud-input'));
      var last=ins2[ins2.length-1];
      last.value='999'; last.dispatchEvent(new Event('input',{bubbles:true}));
      out+=' CLEARED='+!last.classList.contains('bud-err')
          +' TIP_GONE='+!last.parentNode.querySelector('.bud-err-tip');
      /* 提交成功 */
      document.querySelector('[data-action='+"bud-submit"+']').click();
      out+=' SUBMIT_TOAST='+/提交成功/.test(document.getElementById('toast').textContent);
      out+=' AFTER_SUBMIT_RO='+document.querySelector('#panel-bud-fill input.bud-input').readOnly;
      /* 切换年度 2027→2026 后草稿按 年度|单元|指标 键隔离：2026 应全空 */
      var ys=document.getElementById('budYearSel'); ys.value='2026';
      ys.dispatchEvent(new Event('change',{bubbles:true}));
      var empty26=[].every.call(document.querySelectorAll('#panel-bud-fill input.bud-input'),i=>i.value==='');
      out+=' YEAR_ISOLATED='+empty26;
      out+=' EDIT_BTN='+!!document.querySelector('[data-action="bud-edit"]')
          +' NO_SAVE_BTN='+!document.querySelector('[data-action="bud-save"]');
      out+=' ERRS='+window.__errs.length;
      document.title='PROBE::'+out;
    }catch(e){ document.title='PROBE::EXC::'+e.message+'::'+window.__errs.join(';'); }
  },700);
})();
<\/script>`;

/* 注入到最后一个 </body> 前 */
const tmp = path.join(base, '_test_budget.html');
fs.writeFileSync(tmp, srcHtml.replace(/<\/body>/i, probe + '</body>'), 'utf8');

let out;
try {
  out = execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=6000',
    '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')
  ], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
} catch (e) {
  console.error('CHROME FAIL', e.message); process.exit(1);
}
const m = out.match(/<title>PROBE::([^<]*)<\/title>/);
if (!m) { console.error('NO PROBE RESULT'); process.exit(1); }
console.log(m[1].replace(/&amp;/g, '&'));
fs.unlinkSync(tmp);
