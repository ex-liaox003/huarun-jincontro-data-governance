const fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
let src=fs.readFileSync('index.html','utf8');
src=src.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>','<script src="_chart_umd.js"></script>');
const W=process.env.PW||'1366';
const inject=`<script>
var out={};
function emit(){ var pre=document.createElement('pre'); document.body.appendChild(pre); pre.textContent='@OUT@'+JSON.stringify(out); }
setTimeout(function(){
  try{ switchModule('leader'); }catch(e){ out.err=e.message; return emit(); }
  setTimeout(function(){
    var bb=document.querySelector('#moduleLeader header nav button[data-v="bank"]'); if(bb) bb.click();
    setTimeout(function(){ try{
      function probe(id){ var e2=document.getElementById(id); if(!e2) return 'NO';
        var rows=[].slice.call(e2.querySelectorAll('.strow'));
        return rows.map(function(r,i){
          var sp=r.querySelector('span'), b=r.querySelector('b');
          var v=b.querySelector('.c-v'), y=b.querySelector('.c-y');
          var sr=sp.getBoundingClientRect(), vr=v.getBoundingClientRect(), yr=y.getBoundingClientRect();
          return 'r'+i+' nameW'+Math.round(sr.width)+' nameH'+Math.round(sr.height)+' vR'+Math.round(vr.right)+' yL'+Math.round(yr.left)+' overlap'+(vr.right>yr.left?'+'+Math.round(vr.right-yr.left):'ok')+' rowOver+'+Math.round(r.scrollWidth-r.clientWidth); }); }
      out.dep=probe('bk-dep-rows');
      out.asset=probe('bk-asset-rows');
    }catch(e3){ out.err=e3.message; }
    emit();
  },2000);
},800);
},600);
setTimeout(emit,16000);
<\/script>`;
const html=src.replace(/<\/body>/i, inject+'</body>');
fs.writeFileSync('_probe_dep.html',html);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--window-size='+W+',900','--virtual-time-budget=20000','--dump-dom','file:///'+__dirname.split(path.sep).join('/')+'/'+'_probe_dep.html'],{maxBuffer:40*1024*1024,timeout:120000}).toString();
const pres=[...dom.matchAll(/<pre>@OUT@([\s\S]*?)<\/pre>/g)];
console.log('W='+W+': '+(pres.length?pres[pres.length-1][1]:'NO-OUT'));
