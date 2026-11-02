/* 截图验证：预算值填报页 导入按钮 + CSV 导入按指标名称匹配填充 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const srcHtml = fs.readFileSync(path.join(base, 'index.html'), 'utf8');

const probe = `<script>
(function(){
  window.__errs=[]; window.onerror=function(m){ __errs.push(String(m)); };
  try{
    switchModule('data');
    switchTab('bud-fill', true);
  }catch(e){ __errs.push('BOOT:'+e.message); }
  setTimeout(function(){
    try{
      var info='';
      /* 1. 导入按钮与文件输入存在 */
      var btn=document.querySelector('#panel-bud-fill [data-action="bud-import"]');
      var fin=document.getElementById('budImportFile');
      info+=' BTN='+(btn?1:0)+' FILE_INPUT='+(fin?1:0);
      /* 2. 取前两行指标名构造 CSV 并模拟导入 */
      var inps=document.querySelectorAll('#panel-bud-fill input.bud-input');
      var rows=document.querySelectorAll('#panel-bud-fill tbody tr');
      info+=' ROWS='+rows.length;
      var names=[];
      rows.forEach(function(tr){ var c=tr.cells[2]; if(c){var n=c.textContent.trim(); if(n) names.push(n);} });
      var y=budState.year;
      var v1='123.45', v2='678';
      var csv='\\uFEFF指标编码,指标名称,单位,'+y+'年预算值,上年同期实际\\nA001,'+names[0]+',亿元,'+v1+',100\\nA002,'+names[1]+',亿元,'+v2+',500\\nA003,不存在的指标X,亿元,9,9\\n';
      var f=new File([csv],'test_budget.csv',{type:'text/csv'});
      var dt=new DataTransfer(); dt.items.add(f);
      fin.files=dt.files;
      fin.dispatchEvent(new Event('change',{bubbles:true}));
      setTimeout(function(){
        try{
          var inps2=document.querySelectorAll('#panel-bud-fill input.bud-input');
          info+=' V0='+inps2[0].value+' V1='+inps2[1].value+' V2='+(inps2[2]?inps2[2].value:'');
          /* 3. 非法表头文件 → 应提示失败不填充 */
          var f2=new File(['foo,bar\\n1,2\\n'],'bad.csv',{type:'text/csv'});
          var dt2=new DataTransfer(); dt2.items.add(f2);
          fin.files=dt2.files;
          fin.dispatchEvent(new Event('change',{bubbles:true}));
          setTimeout(function(){
            try{
              var inps3=document.querySelectorAll('#panel-bud-fill input.bud-input');
              info+=' AFTER-BAD V0='+inps3[0].value+' (应保留 123.45)';
              document.title='VERIFY='+info+'|PAGESIZE=1460x'+Math.ceil(document.documentElement.scrollHeight)+'|ERRS='+__errs.join(';');
            }catch(e){ document.title='VERIFY-FAIL2='+e.message+'|ERRS='+__errs.join(';'); }
          },2500);
        }catch(e){ document.title='VERIFY-FAIL='+e.message+'|ERRS='+__errs.join(';'); }
      },2500);
    }catch(e){ document.title='VERIFY-FAIL='+e.message+'|ERRS='+__errs.join(';'); }
  }, 1500);
})();
</script></body>`;
const file = path.join(base, '_shot_style20.html');
fs.writeFileSync(file, srcHtml.replace('</body>', probe), 'utf8');
const url = 'file:///' + file.split('\\').join('/');

let H = 2400, verify = '', errs = '';
try {
  const out = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--window-size=1460,1200','--virtual-time-budget=15000','--dump-dom', url],
    { maxBuffer: 64*1024*1024 }).toString('utf8');
  const m = out.match(/<title>(VERIFY[^<]*)<\/title>/);
  if (m) {
    const s = m[1];
    const pm = s.match(/PAGESIZE=\d+x(\d+)/); if (pm) H = +pm[1];
    const em = s.match(/ERRS=([^|]*)/); if (em) errs = em[1];
    verify = s.split('|PAGESIZE')[0];
  }
} catch (e) { console.log('probe fail', String(e.message).slice(0, 160)); }

const png = path.join(base, '_bud_import.png');
execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
  '--window-size=1460,' + Math.min(H, 4400),
  '--virtual-time-budget=15000',
  '--screenshot=' + png, url], { maxBuffer: 64*1024*1024 });
console.log('OK', png, '1460x' + H);
console.log('VERIFY:', verify);
console.log(errs ? ('JS-ERRS: ' + errs) : 'no-js-errs');
