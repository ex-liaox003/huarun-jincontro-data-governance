const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const re=/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g; let m,i=0,bad=0;
while((m=re.exec(src))){ i++;
  try{ new Function(m[1]); }catch(e){ bad++; console.log('SCRIPT #'+i,'html line ~'+src.slice(0,m.index).split('\n').length, e.message); }
}
console.log('inline scripts:',i,'errors:',bad);
