const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const re=/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g; let m,i=0;
while((m=re.exec(src))){ i++; if(i!==2) continue;
  const base=src.slice(0,m.index).split('\n').length; // html line of "<script>"
  fs.writeFileSync('_script2_extract.js', m[1]);
  try{ new Function(m[1]); console.log('OK'); }
  catch(e){ console.log(e.stack.split('\n').slice(0,6).join('\n')); }
}
