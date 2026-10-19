const fs=require('fs'),{execFileSync}=require('child_process');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
let h=fs.readFileSync('战略部数据应用平台.html','utf8').replace('</body>',
  "<script>\nswitchModule('leader');\nsetTimeout(function(){\n"+
  "  var d=document.createElement('div'); d.id='probe'; document.body.appendChild(d);\n"+
  "  try{\n"+
  "    var c=Chart.getChart('c-ov-line');\n"+
  "    var el=c.getDatasetMeta(0).data[11];\n"+
  "    c.tooltip.setActiveElements([{datasetIndex:0,index:11}],{x:el.x,y:el.y});\n"+
  "    c.update('none');\n"+
  "    var tt=c.tooltip;\n"+
  "    d.textContent='RESULT='+JSON.stringify({title:tt.title,body:(tt.body||[]).map(b=>b.lines),op:tt.opacity});\n"+
  "  }catch(err){ d.textContent='RESULT_ERR='+String(err&&err.message);\n"+
  "  }\n"+
  "},1200);\n</script></body>");
fs.writeFileSync('_smoke_tips.html',h);
const outp=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--window-size=1460,1400','--virtual-time-budget=12000','--dump-dom','file:///D:/LIAOXIA/work-2026/AI-test/华润-战略部数据应用-LAB/_smoke_tips.html'],{maxBuffer:64*1024*1024}).toString();
const m=outp.match(/<div id="probe">(RESULT[^<]*)<\/div>/);
console.log(m? decodeURIComponent(escape(m[1])) : '未取到');
