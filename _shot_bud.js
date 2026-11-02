const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const src=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
// shot1: 仅查看默认态; shot2: 编辑+提交拦截红框态
const probe1="<script>setTimeout(function(){try{switchTab('bud-fill');}catch(e){}},500);</"+"script>";
fs.writeFileSync(path.join(__dirname,'_t1.html'),src.replace(/<\/body>/i,probe1+'</body>'),'utf8');
const probe2="<script>setTimeout(function(){try{switchTab('bud-fill');document.querySelector('[data-action=\"bud-submit\"]').click();}catch(e){document.title='E'+e.message;}},500);</"+"script>";
fs.writeFileSync(path.join(__dirname,'_t2.html'),src.replace(/<\/body>/i,probe2+'</body>'),'utf8');
function shot(f,png){execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--window-size=1500,1150','--virtual-time-budget=8000','--screenshot='+path.join(__dirname,png),'file:///'+f.split(path.sep).join('/')],{encoding:'utf8',maxBuffer:256*1024*1024});}
shot(path.join(__dirname,'_t1.html'),'_bud_view.png');
shot(path.join(__dirname,'_t2.html'),'_bud_err.png');
console.log('done');
