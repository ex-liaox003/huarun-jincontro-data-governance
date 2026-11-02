const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const re=/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g; let m,i=0;
while((m=re.exec(src))){ i++; if(i!==2) continue;
  const base=src.slice(0,m.index).split('\n').length;
  const lines=m[1].split('\n');
  // grow prefix until parse fails with something OTHER than truncation
  for(let n=50;n<=lines.length;n+=50){
    try{ new Function(lines.slice(0,n).join('\n')); }
    catch(e){
      const trunc=/Unexpected end of input/.test(e.message);
      if(!trunc){ console.log('fail near script-line',n,'(html line ~'+(base+n)+'):',e.message);
        for(let k=Math.max(0,n-6);k<Math.min(lines.length,n+2);k++) console.log((base+k+1)+':',lines[k]);
        // narrow within window
        for(let k=n-5;k<=n;k++){ try{ new Function(lines.slice(0,k).join('\n')); }catch(e2){ if(!/Unexpected end of input/.test(e2.message)){ console.log('=> first bad line',base+k+1, JSON.stringify(lines[k-1])); break; } } }
        break;
      }
    }
  }
}
