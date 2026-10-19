// Parse extracted xlsx XML (sharedStrings + worksheets) with merged-cell support
// Usage: node parse_trust_xlsx.js  -> trust_grid.json
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'trust_x', 'xl');

function decode(s){
  return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
          .replace(/&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n))
          .replace(/&#x([0-9a-fA-F]+);/g,(_,h)=>String.fromCharCode(parseInt(h,16)))
          .replace(/&amp;/g,'&');
}

// ---- shared strings ----
const shared = [];
const ssPath = path.join(DIR,'sharedStrings.xml');
if(fs.existsSync(ssPath)){
  const ssXml = fs.readFileSync(ssPath,'utf8');
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while((m = siRe.exec(ssXml)) !== null){
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let tm, text='';
    while((tm = tRe.exec(m[1])) !== null) text += tm[1];
    shared.push(decode(text));
  }
}

// ---- workbook sheet names & order ----
const wbXml = fs.readFileSync(path.join(DIR,'workbook.xml'),'utf8');
const sheetNames = [];
const shRe2 = /<sheet\b[^>]*>/g;
let m;
while((m = shRe2.exec(wbXml)) !== null){
  const tag = m[0];
  const nm = /name="([^"]+)"/.exec(tag);
  const rid = /r:id="(rId\d+)"/.exec(tag);
  if(nm && rid) sheetNames.push({name: decode(nm[1]), rid: rid[1]});
}

// rels: rId -> sheetN.xml
const relsXml = fs.readFileSync(path.join(DIR,'_rels','workbook.xml.rels'),'utf8');
const relMap = {};
const relRe = /<Relationship[^>]*Id="(rId\d+)"[^>]*Target="([^"]+)"/g;
while((m = relRe.exec(relsXml)) !== null) relMap[m[1]] = m[2];

function colToIdx(ref){ // 'AB12' -> {col:27, row:12}
  const mm = /^([A-Z]+)(\d+)$/.exec(ref);
  let col = 0;
  for(const ch of mm[1]) col = col*26 + (ch.charCodeAt(0)-64);
  return {col, row: +mm[2]};
}

function parseSheet(file){
  const xml = fs.readFileSync(path.join(DIR,'worksheets',file),'utf8');
  // merged cells
  const merged = [];
  const mcRe = /<mergeCell ref="([A-Z]+\d+:[A-Z]+\d+)"/g;
  while((m = mcRe.exec(xml)) !== null){
    const [a,b] = m[1].split(':');
    merged.push([colToIdx(a), colToIdx(b)]);
  }
  // cells
  const cells = {}; // "r,c" -> value
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while((rm = rowRe.exec(xml)) !== null){
    const cRe = /<c\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cm;
    while((cm = cRe.exec(rm[1])) !== null){
      const attrs = cm[1];
      const refM = /r="([A-Z]+\d+)"/.exec(attrs);
      if(!refM) continue;
      const {col,row} = colToIdx(refM[1]);
      const inner = cm[2] || '';
      let val = null;
      const vm = /<v>([\s\S]*?)<\/v>/.exec(inner);
      const tm = /<t[^>]*>([\s\S]*?)<\/t>/.exec(inner);
      const isT = /t="inlineStr"/.test(attrs);
      if(attrs.includes('t="s"') && vm) val = shared[+vm[1]];
      else if(isT && tm) val = decode(tm[1]);
      else if(vm) val = decode(vm[1]);
      if(val !== null) cells[row+','+col] = val;
    }
  }
  // apply merges: value of top-left fills whole range
  for(const [a,b] of merged){
    const v = cells[a.row+','+a.col];
    if(v === undefined) continue;
    for(let r=a.row;r<=b.row;r++) for(let c=a.col;c<=b.col;c++){
      if(r===a.row && c===a.col) continue;
      cells[r+','+c] = v;
    }
  }
  // find max row/col
  let maxR=0, maxC=0;
  for(const k in cells){ const [r,c]=k.split(',').map(Number); if(r>maxR)maxR=r; if(c>maxC)maxC=c; }
  return {cells, maxR, maxC, merged};
}

const out = {};
sheetNames.forEach((sn)=>{
  const target = relMap[sn.rid];
  if(!target) return;
  const file = target.split('/').pop();
  const {cells, maxR, maxC} = parseSheet(file);
  const grid = [];
  for(let r=1;r<=maxR;r++){
    const rowArr = [];
    for(let c=1;c<=maxC;c++){
      rowArr.push(cells[r+','+c] !== undefined ? cells[r+','+c] : null);
    }
    grid.push(rowArr);
  }
  out[sn.name] = grid;
});

fs.writeFileSync(path.join(__dirname,'trust_grid.json'), JSON.stringify(out,null,1), 'utf8');
console.log('sheets:', Object.keys(out));
for(const k in out) console.log(k, '->', out[k].length, 'rows x', (out[k][0]||[]).length, 'cols');
