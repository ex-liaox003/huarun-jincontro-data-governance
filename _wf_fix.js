const fs = require('fs');
const P = '战略部数据应用平台.html';
let h = fs.readFileSync(P, 'utf8');

/* 1) 卡内图区加高（242→300） */
const oldBox = '<div class="chd">损益瀑布 <span class="tag">亿元 · 截止本月末</span></div><div class="cbd"><div class="chartbox"><canvas id="c-bk-pl">';
const newBox = '<div class="chd">损益瀑布 <span class="tag">亿元 · 截止本月末</span></div><div class="cbd"><div class="chartbox tall"><canvas id="c-bk-pl">';
if (!h.includes(oldBox)) { console.log('✗ 卡头未命中'); process.exit(1); }
h = h.split(oldBox).join(newBox);

/* 2) 重写瀑布图配置：柱内/柱上数值 + 级联虚线 + y 轴留白 */
const oldCfg = `  mk('c-bk-pl',{type:'bar',data:{labels:wfLabels,datasets:[{data:wf,borderColor:wfColors,backgroundColor:wfColors.map(function(c){return c+'CC'}),borderWidth:0,borderRadius:4}]},
    options:Object.assign(base({tooltip:{callbacks:{label:function(c){var r=c.raw;return c.label+'：'+Math.abs(r[1]-r[0]).toFixed(1)+' 亿元'}}}}),
    {scales:{y:YAX,x:{grid:{display:false},ticks:{font:{size:10.5},color:T2}}}})});`;
const newCfg = `  var wfSign=[1,-1,-1,-1,-1,1];
  var wfCum=[86.4,53.8,52.9,29.5,21.3]; /* 每根减项柱后的累计水位（虚线连接位置） */
  mk('c-bk-pl',{type:'bar',data:{labels:wfLabels,datasets:[{data:wf,borderColor:wfColors,backgroundColor:wfColors.map(function(c){return c+'CC'}),borderWidth:0,borderRadius:3,maxBarThickness:58}]},
    plugins:[{id:'bkWfDecor',afterDatasetsDraw:function(ch){
      var meta=ch.getDatasetMeta(0), ctx=ch.ctx, ys=ch.scales.y;
      ctx.save();
      /* 级联虚线：上一柱顶/底水位 → 下一柱 */
      ctx.strokeStyle='rgba(160,200,255,.38)'; ctx.setLineDash([4,3]); ctx.lineWidth=1;
      for(var i=0;i<5;i++){ var a=meta.data[i], b=meta.data[i+1], yy=ys.getPixelForValue(wfCum[i]);
        ctx.beginPath(); ctx.moveTo(a.x+a.width/2+2,yy); ctx.lineTo(b.x-b.width/2-2,yy); ctx.stroke(); }
      ctx.setLineDash([]);
      /* 数值标注：高柱落在柱内（白字），矮柱（如税金及附加）标注在柱上方 */
      ctx.textAlign='center';
      meta.data.forEach(function(el,i){
        var val=Math.abs(wf[i][1]-wf[i][0]);
        var txt=(wfSign[i]<0?'-':'')+val.toFixed(1);
        var hgt=Math.abs(el.base-el.y);
        ctx.font='700 10.5px "Microsoft YaHei",sans-serif';
        if(hgt>=16){ ctx.fillStyle='#fff'; ctx.textBaseline='middle'; ctx.fillText(txt,el.x,(el.y+el.base)/2); }
        else{ ctx.fillStyle='#cfe4ff'; ctx.textBaseline='bottom'; ctx.fillText(txt,el.x,Math.min(el.y,el.base)-7); }
      });
      ctx.restore();
    }}],
    options:Object.assign(base({tooltip:{callbacks:{label:function(c){var r=c.raw;return c.label+'：'+Math.abs(r[1]-r[0]).toFixed(1)+' 亿元'}}}}),
    {scales:{y:Object.assign({},YAX,{grace:'8%'}),x:{grid:{display:false},ticks:{font:{size:10.5},color:T2}}}})});`;
if (!h.includes(oldCfg)) { console.log('✗ 瀑布配置未命中'); process.exit(1); }
h = h.split(oldCfg).join(newCfg);

fs.writeFileSync(P, h);

/* 语法校验 */
const re = /<script>([\s\S]*?)<\/script>/g; let m, i = 0;
while ((m = re.exec(h))) { i++; try { new Function(m[1]); } catch (err) { console.log('✗ 脚本#' + (i + 1) + ':' + err.message); process.exit(1); } }
console.log('✓ 瀑布改造完成，脚本语法通过', i);
