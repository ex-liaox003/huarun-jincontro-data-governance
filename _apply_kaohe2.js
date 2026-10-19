/* 华润金融页·年度考核指标表 v2：
   1) 标题精简为「年度考核指标」；
   2) 截止本月末数后新增「同比」列（▲红/▼绿，样例示意）；
   3) 预算达成率列改为 发光进度条 + 数值（金色刻度 = 时间进度75%）。 */
const fs=require('fs');
const P='战略部数据应用平台.html';
let h=fs.readFileSync(P,'utf8');
const must=(c,m)=>{ if(!c){ console.log('✗ '+m); process.exit(1);} };

/* ---- 1) 标题 ---- */
{
  const f='  <div class="secttl">年度考核指标 <span class="lite">—— 指标属性标签=考核指标｜达成率对照时间进度 75%（9月末）</span></div>';
  must(h.split(f).length===2,'标题');
  h=h.replace(f,'  <div class="secttl">年度考核指标</div>');
}

/* ---- 2+3) 表头加同比列 & 逐行注入 yoy 单元格 + 达成率改进度条 ---- */
const YOY={
 '其中：个人非存AUM月日均':11.2,'公司-科技企业客群净增余额':9.8,'基石客户':12.4,'代发客户数':8.6,
 '流动性覆盖率':3.2,'资本充足率':0.4,'其中：低成本存款年日均':6.8,'个贷不良率':-0.08,
 '不良资产处置':12.3,'不良资产率':-0.05,'新增有效客户数':9.1,'ROE':0.3,
 '华润燃气存量用户保费占比':2.1,'华润燃气存量用户每年新增客户数':12.8,'香港业务佣金收入':9.8,
 '人工成本':4.1,'成本收入比-拨备前':-1.2,'业绩合同下达成里程碑项目数量':4.5
};
const BU_YOY={
 '华润银行|营业收入':8.2,'华润银行|利润总额':7.1,'华润银行|其中：全行手续费及佣金净收入':5.4,
 '华润保险|营业收入':10.5,'华润保险|利润总额':9.0,'华润保险|EVA':6.2,
 '华润保险|集团及其他产业客户保费规模':13.5,'华润保险|融融业务总中收':8.9,'华润保险|市场业务净收入':7.4,
 '华润保险|产融业务规模':15.4,'华润保险|其中：华润燃气业务保费规模':11.6,
 '华润资产|营业收入':9.2,'华润资产|利润总额':5.2,'华润资产|业绩合同下服务集团退出项目数量':15.0
};
const INV=new Set(['人工成本','成本收入比-拨备前','个贷不良率','不良资产率']);
function yoyCell(nm,bu,unit){
  const key=bu+'|'+nm;
  let p = BU_YOY[key]!==undefined? BU_YOY[key] : YOY[nm];
  if(p===undefined) p = INV.has(nm)? -3.5 : 8.5;
  const cls = p>0?'up':(p<0?'down':'flat');
  const ar = p>0?'▲':(p<0?'▼':'—');
  const isPct = (unit==='%'||nm.includes('率')||nm.includes('占比')||nm==='ROE');
  const suf = isPct? 'pct':'%';
  return '<td class="ko-y '+cls+'">'+ar+' '+Math.abs(p).toFixed(isPct?2:1)+' '+suf+'</td>';
}
{
  const thf='<thead><tr><th>业务单元</th><th>指标名称</th><th>单位</th><th class="num">截止本月末数</th><th class="num">全年预算</th><th class="num">预算达成率</th></tr></thead>';
  const tht='<thead><tr><th>业务单元</th><th>指标名称</th><th>单位</th><th class="num">截止本月末数</th><th class="num">同比</th><th class="num">全年预算</th><th class="num">预算达成率</th></tr></thead>';
  must(h.split(thf).length===2,'表头');
  h=h.replace(thf,tht);
  const rows=[...h.matchAll(/<tr>(<td class="ko-bu" rowspan="\d+">([^<]+)<\/td>)?<td class="ko-nm" title="([^"]+)">[^<]*<\/td><td class="ko-un">([^<]*)<\/td><td class="ko-v">([^<]*)<\/td><td class="ko-b">([^<]*)<\/td><td class="ko-r"><span class="st st-(ok|warn|bad)">([\d.]+)%<\/span><\/td><\/tr>/g)];
  must(rows.length===32,'匹配行数='+rows.length);
  let lastBu=null;
  for(const mt of rows){
    const bu = mt[2] || lastBu || '华润银行';
    if(mt[2]) lastBu=mt[2];
    const [,full,buCell,nm,un,v,b,st,p]=mt;
    const pv=parseFloat(p);
    const w=Math.min(pv,100);
    const nr='<tr>'+(buCell||'')+'<td class="ko-nm" title="'+nm+'">'+nm+'</td><td class="ko-un">'+un+'</td><td class="ko-v">'+v+'</td>'
      +yoyCell(nm,bu,un)
      +'<td class="ko-b">'+b+'</td>'
      +'<td class="ko-r"><span class="ko-gauge" title="时间进度参考线 = 75%（9月末）"><span class="ko-track"><i class="'+st+'" style="width:'+w+'%"></i><u style="left:75%"></u></span><b class="'+st+'">'+p+'%</b></span></td></tr>';
    h=h.replace(full,nr);
  }
}

/* ---- CSS ---- */
{
  const anchor='#moduleLeader .ko-r{text-align:right;white-space:nowrap}\n';
  must(h.split(anchor).length===2,'.ko-r 锚点');
  const css=`#moduleLeader .ko-y{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:600}
#moduleLeader .ko-y.up{color:#ff8d96}
#moduleLeader .ko-y.down{color:#57e8b8}
#moduleLeader .ko-y.flat{color:var(--dim)}
#moduleLeader .ko-gauge{display:inline-flex;align-items:center;gap:8px;justify-content:flex-end;width:100%}
#moduleLeader .ko-track{position:relative;width:96px;height:8px;border-radius:4px;background:rgba(255,255,255,.08);flex:none}
#moduleLeader .ko-track i{display:block;height:100%;border-radius:4px;box-shadow:0 0 6px rgba(55,200,255,.25)}
#moduleLeader .ko-track i.st-ok{background:linear-gradient(90deg,#0fae7c,#2ee6a8)}
#moduleLeader .ko-track i.st-warn{background:linear-gradient(90deg,#c88a1e,#f0b13a)}
#moduleLeader .ko-track i.st-bad{background:linear-gradient(90deg,#c0333f,#ff5d6c)}
#moduleLeader .ko-track u{position:absolute;top:-2px;bottom:-2px;width:2px;background:#f0c060;opacity:.8;border-radius:1px}
#moduleLeader .ko-gauge b{font-size:12.5px;font-variant-numeric:tabular-nums;min-width:52px;text-align:right}
#moduleLeader .ko-gauge b.st-ok{color:#2ee6a8}
#moduleLeader .ko-gauge b.st-warn{color:#f0b13a}
#moduleLeader .ko-gauge b.st-bad{color:#ff5d6c}
`;
  h=h.replace(anchor, anchor+css);
  h=h.replace('#moduleLeader .ko-table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:860px}',
              '#moduleLeader .ko-table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:980px}');
}
fs.writeFileSync(P,h);
const re=/<script>([\s\S]*?)<\/script>/g; let m,i=0;
while((m=re.exec(h))){ i++; try{ new Function(m[1]); }catch(e){ console.log('✗ 脚本语法:'+e.message); process.exit(1);} }
const ta=h.slice(h.indexOf('年度考核指标'), h.indexOf('</table>'));
console.log('✓ 7列表头:', ta.includes('<th class="num">同比</th>'), '| ko-y 行:', (ta.match(/class="ko-y/g)||[]).length, '| 进度条:', (ta.match(/ko-gauge/g)||[]).length, '| 旧徽标残留:', /ko-r"><span class="st /.test(ta), '| 标题:', /<div class="secttl">年度考核指标<\/div>/.test(h));
