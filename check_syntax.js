const fs = require('fs');
const html = fs.readFileSync('战略部数据应用平台.html', 'utf8');
const m = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const js = m[m.length-1][1];
try {
  new Function(js);
  console.log('OK: JavaScript syntax is valid');
} catch(e) {
  console.log('ERR:', e.message);
  const lines = js.split('\n');
  // 尝试定位错误行
  const match = e.stack.match(/<anonymous>:(\d+)/);
  if(match){
    const ln = parseInt(match[1]);
    for(let i=Math.max(0,ln-3); i<Math.min(lines.length,ln+2); i++){
      console.log((i+1)+': '+lines[i]);
    }
  }
}
