const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const base = __dirname;
const srcHtml = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const probe = `<script>
setTimeout(function(){
  try{
    var mod=document.querySelector('.topnav-item[data-module="leader"]'); if(mod) mod.click();
    var btn=document.querySelector('#moduleLeader header nav button[data-v="bank"]');
    if(typeof LeaderApp!=='undefined'&&btn) LeaderApp.go('bank',btn);
  }catch(e){}
  setTimeout(function(){
    try{
      var ids=['bk-asset-rows','bk-debt-rows','bk-dep-rows','bk-loan-rows','bk-corp','bk-retail','bk-chan'];
      var out=ids.map(function(id){
        var el=document.getElementById(id); if(!el) return id+':MISS';
        var row=el.querySelector('.strow');
        var nm=row?row.querySelector('span:first-child'):null;
        return id+'='+Math.round(el.getBoundingClientRect().width)+(row?('/nm'+Math.round(nm.getBoundingClientRect().width)):'');
      }).join(' ');
      document.title='PROBE::'+out;
    }catch(e){ document.title='PROBE::EXC2::'+e.message; }
  },1400);
},400);
<\/script>`;
const tmp = path.join(base, '_w.html');
fs.writeFileSync(tmp, srcHtml.replace(/<\/body>/i, probe + '</body>'), 'utf8');
try {
  const out = execFileSync('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=1720,1100',
    '--virtual-time-budget=15000', '--dump-dom', 'file:///' + tmp.split(path.sep).join('/')
  ], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
  const m = out.match(/<title>PROBE::([\s\S]*?)<\/title>/);
  console.log(m ? m[1].replace(/&amp;/g, '&') : 'NO PROBE');
} catch (e) { console.error('FAIL', e.message); }
fs.unlinkSync(tmp);
