const fs=require('fs'),path=require('path');
const { execFileSync }=require('child_process');
const CH='C:/Program Files/Google/Chrome/Application/chrome.exe';
const DIR=__dirname;
let src=fs.readFileSync(path.join(DIR,'index.html'),'utf8');
src=src.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>','<script src="_chart_umd.js"></script>');
const probe=`<script>
window.addEventListener('load',function(){try{
switchModule('leader');
var b=document.querySelector("#moduleLeader header nav button[data-v='bank']");
LeaderApp.go('bank',b);
}catch(e){document.title='ERR:'+e.message}});
<\/script>`;
fs.writeFileSync(path.join(DIR,'_shot_bk3.html'), src.replace(/<\/body>/i,probe+'</body>'),'utf8');
try{
execFileSync(CH,['--headless=new','--disable-gpu','--no-sandbox','--user-data-dir='+DIR+'/_ch10','--window-size=1500,760','--hide-scrollbars','--virtual-time-budget=9000','--timeout=40000','--screenshot='+path.join(DIR,'_bank_v23_hero.png'),'file:///'+path.join(DIR,'_shot_bk3.html').split(path.sep).join('/')],{stdio:'pipe',timeout:80000});
console.log('done');}catch(e){console.log('FAIL', e.message.split('\n')[0]);}
fs.unlinkSync(path.join(DIR,'_shot_bk3.html'));
