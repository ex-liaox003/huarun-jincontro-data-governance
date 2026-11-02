const fs=require("fs"),path=require("path");
const {execFileSync}=require("child_process");
const CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe";
let src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
src=src.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>','<script src="_chart_umd.js"></script>');
const probe='<script>try{switchModule("leader");var btn=document.querySelector("#moduleLeader header nav button[data-v="+String.fromCharCode(34)+"trust"+String.fromCharCode(34)+"]");LeaderApp.go("trust",btn);window.__TOK=1;}catch(e){document.title="SHOTERR:"+e.message;}</script>';
const tmp=path.join(__dirname,"_shot_trust_view.html");
fs.writeFileSync(tmp,src.replace(/<\/body>/i,probe+"</body>"),"utf8");
const url="file:///"+tmp.split(path.sep).join("/");
try{
  execFileSync(CHROME,["--headless=new","--disable-gpu","--no-sandbox","--window-size=1500,2400","--hide-scrollbars","--virtual-time-budget=9000","--screenshot="+path.join(__dirname,"_trust_v26.png"),url],{stdio:"inherit",timeout:60000});
}catch(e){console.error("shot fail",e.message);}
/* 诊断：再跑一次 dump-dom 看 title */
try{
  const dom=execFileSync(CHROME,["--headless=new","--disable-gpu","--no-sandbox","--virtual-time-budget=7000","--timeout=15000","--dump-dom",url],{encoding:"utf8",maxBuffer:268435456,timeout:60000});
  const m=dom.match(/<title>([^<]*)<\/title>/);
  console.log("TITLE:",m?m[1]:"(none)");
}catch(e){console.error("dump fail",e.message);}
fs.unlinkSync(tmp);
