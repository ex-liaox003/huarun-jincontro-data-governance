const fs=require('fs'), path=require('path'), {execFileSync}=require('child_process');
const base=__dirname;
const srcHtml=fs.readFileSync(path.join(base,'index.html'),'utf8');
const probe = String.raw`<script>
window.addEventListener('load', function(){
  setTimeout(function(){
    try{
      var mod=document.querySelector('.topnav-item[data-module="leader"]'); if(mod) mod.click();
      var btn=document.querySelector('#moduleLeader header nav button[data-v="bank"]');
      if(typeof LeaderApp!=='undefined'&&btn) LeaderApp.go('bank',btn);
      setTimeout(function(){
        try{
          var out='';
          ['c-bk-raroc','c-bk-eva'].forEach(function(id){
            var c=Chart.getChart(id);
            if(!c){ out+=' '+id+':NOCH'; return; }
            var prev=c.data.datasets[0], cur=c.data.datasets[1];
            out+=' | '+id+' LEG='+prev.label+'/'+cur.label;
            out+=' PREV(1,9,10,12)=[prev.data[0],prev.data[8],prev.data[9],prev.data[11]]'.replace('[prev.data[0],prev.data[8],prev.data[9],prev.data[11]]',[prev.data[0],prev.data[8],prev.data[9],prev.data[11]].join('~'));
            out+=' CUR(1,9,10,12)='+[cur.data[0],cur.data[8],cur.data[9],cur.data[11]].join('~');
            var cb=c.options.plugins.tooltip.callbacks;
            out+=' AB9='+cb.afterBody([{dataIndex:8}]).join(' ');
            out+=' AB11=['+cb.afterBody([{dataIndex:10}]).join(' ')+']';
          });
          var kpi=document.getElementById('bk-raroc-kpi').querySelector('.hv b').textContent;
          document.title='PROBE::'+out+' KPI='+kpi;
        }catch(e){ document.title='PROBE::EXC2::'+e.message; }
      },1400);
    }catch(e){ document.title='PROBE::EXC::'+e.message; }
  },300);
});
<\/script>`;
const tmp=path.join(base,'_rc.html');
fs.writeFileSync(tmp, srcHtml.replace(/<\/body>/i, probe+'</body>'), 'utf8');
try{
const out=execFileSync('C:/Program Files/Google/Chrome/Application/chrome.exe',
['--headless=new','--disable-gpu','--no-sandbox','--window-size=1720,1100','--virtual-time-budget=15000','--dump-dom','file:///'+tmp.replace(/\/g,'/')],
{encoding:'utf8',maxBuffer:512*1024*1024});
const m=out.match(/<title>PROBE::([\s\S]*?)<\/title>/);
console.log(m?m[1].replace(/&amp;/g,'&'):'NO PROBE');
}catch(e){console.error('FAIL',e.message);}
fs.unlinkSync(tmp);
