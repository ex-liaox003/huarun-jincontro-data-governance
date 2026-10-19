/* 华润银行 tab 按 华润金控-战略部指标表.xlsx「华润银行」sheet 重设计（2026-10-12）：
   领导视角叙事：核心指标 → ① 经营效益(赚多少) → ② 规模与结构(靠什么) →
   ③ 价与成本(值多少) → ④ 风险与监管红线(安全吗) → ⑤ 客群基本盘(后劲如何)
   全部指标名称取自表内（损益简表/收入结构/资产负债简表/存贷结构/利率结构/成本结构/风险/关键监测指标/客群结构） */
const fs=require('fs');
const P='战略部数据应用平台.html';
let h=fs.readFileSync(P,'utf8');
const must=(c,m)=>{ if(!c){ console.log('✗ '+m); process.exit(1);} };

/* ========== 1) v-bank DOM 整段替换 ========== */
{
  const a=h.indexOf('<!-- ============ 银行 ============ -->');
  const b=h.indexOf('<!-- ============ 信托 ============ -->');
  must(a>0 && b>a, 'bank DOM 边界');
  const dom=`<!-- ============ 银行 ============ -->
<section class="view" id="v-bank">
  <div class="secttl">华润银行核心指标 <span class="lite">—— 效益 · 质量 · 安全</span></div>
  <div class="bukpis" id="kpi-bank"></div>

  <div class="secttl">① 经营效益 <span class="lite">—— 赚多少｜损益简表 · 收入结构</span></div>
  <div class="grid g2 row">
    <div class="card"><div class="chd">损益瀑布 <span class="tag">亿元 · 本年累计数</span></div><div class="cbd"><div class="chartbox"><canvas id="c-bk-pl"></canvas></div></div></div>
    <div class="card"><div class="chd">条线考核营收 <span class="tag">亿元 · 本年累计数</span></div><div class="cbd"><div class="chartbox"><canvas id="c-bk-line"></canvas></div></div></div>
  </div>
  <div class="card row"><div class="chd">效益与成本监测 <span class="tag">关键监测指标 · 本月末</span></div><div class="cbd">
    <div class="chips">
      <span class="chip">资产利润率 <b>0.73%</b></span><span class="chip">资本利润率 <b>9.8%</b></span>
      <span class="chip">拨备前利润 <b>52.9 亿</b></span><span class="chip">成本收入比 <b>37.7%</b></span>
      <span class="chip">风险资产利润率 <b>1.02%</b></span><span class="chip">信用减值损失 <b>23.4 亿</b></span>
    </div>
  </div></div>

  <div class="secttl">② 规模与结构 <span class="lite">—— 靠什么｜资产负债简表 · 存贷结构</span></div>
  <div class="grid g2 row">
    <div class="card"><div class="chd">资产负债核心科目 <span class="tag">亿元 · 本月末数</span></div><div class="cbd"><div class="chartbox"><canvas id="c-bk-bs"></canvas></div></div></div>
    <div class="card"><div class="chd">贷款结构 <span class="tag">亿元 · 本月末数</span></div><div class="cbd"><div class="chartbox"><canvas id="c-bk-loan"></canvas></div></div></div>
  </div>
  <div class="card row"><div class="chd">存款与负债成本 <span class="tag">存贷结构 · 利率结构</span></div><div class="cbd">
    <div class="chips">
      <span class="chip">存款余额（全行） <b>3,586 亿</b></span><span class="chip">存款年日均（全行） <b>3,420 亿</b></span>
      <span class="chip">其中：低成本存款年日均 <b>2,080 亿</b></span><span class="chip">低成本存款占比 <b>58.2%</b></span>
      <span class="chip">公司存款年日均 <b>1,420 亿</b></span><span class="chip">个人存款年日均 <b>2,000 亿</b></span>
      <span class="chip">存款对客付息率 <b>2.41%</b></span><span class="chip">付息负债付息率 <b>2.61%</b></span>
    </div>
  </div></div>

  <div class="secttl">③ 价与成本 <span class="lite">—— 值多少｜利率结构 · 成本结构</span></div>
  <div class="grid g2 row">
    <div class="card"><div class="chd">收益率 vs 付息率 <span class="tag">%</span></div><div class="cbd"><div class="chartbox"><canvas id="c-bk-rate"></canvas></div></div></div>
    <div class="card"><div class="chd">条线成本与回报 <span class="tag">运营+风险+资本成本 → EVA / RAROC</span></div><div class="cbd">
      <div class="grid g3" style="gap:10px" id="bk-eva"></div>
    </div></div>
  </div>

  <div class="secttl">④ 风险与监管红线 <span class="lite">—— 安全吗｜风险 · 关键监测指标</span></div>
  <div class="grid g2 row">
    <div class="card"><div class="chd">贷款五级分类 <span class="tag">亿元 · 本月末数</span></div><div class="cbd"><div class="chartbox"><canvas id="c-bk-risk"></canvas></div></div></div>
    <div class="card"><div class="chd">核心监管指标 <span class="tag">对红线 · 例外管理</span></div><div class="cbd">
      <div class="riskrow"><span>资本充足率</span><div class="meter"><i style="width:88%;background:var(--down)"></i><span class="limit" style="left:70%"></span></div><span class="num">13.1%</span><span class="lim">红线10.5%</span><span class="st st-ok">● 达标</span></div>
      <div class="riskrow"><span>拨备覆盖率</span><div class="meter"><i style="width:82%;background:var(--down)"></i><span class="limit" style="left:60%"></span></div><span class="num">205%</span><span class="lim">红线150%</span><span class="st st-ok">● 达标</span></div>
      <div class="riskrow"><span>流动性覆盖率</span><div class="meter"><i style="width:85%;background:var(--down)"></i><span class="limit" style="left:60%"></span></div><span class="num">142%</span><span class="lim">红线100%</span><span class="st st-ok">● 达标</span></div>
      <div class="riskrow"><span>净稳定资金比例</span><div class="meter"><i style="width:72%;background:var(--down)"></i><span class="limit" style="left:60%"></span></div><span class="num">118%</span><span class="lim">红线100%</span><span class="st st-ok">● 达标</span></div>
      <div class="riskrow"><span>房地产贷款集中度</span><div class="meter"><i style="width:100%;background:var(--warn)"></i><span class="limit" style="left:100%"></span></div><span class="num">27.5%</span><span class="lim">红线27.5%</span><span class="st st-warn">● 关注</span></div>
    </div></div>
  </div>
  <div class="card row"><div class="chd">资产质量监测 <span class="tag">风险 · 考核指标</span></div><div class="cbd">
    <div class="chips">
      <span class="chip">不良贷款率 <b>1.32%</b></span><span class="chip">个贷不良率 <b>0.86%</b></span>
      <span class="chip">不良资产率 <b>1.41%</b></span><span class="chip">不良资产处置 <b>18.2 亿</b></span>
      <span class="chip">小额不良生成率 <b>0.95%</b></span><span class="chip">贷款拨备率 <b>2.71%</b></span>
      <span class="chip">对公新增风险管控额 <b>5.2 亿</b></span>
    </div>
  </div></div>

  <div class="secttl">⑤ 客群基本盘 <span class="lite">—— 后劲如何｜客群结构 · 存贷结构</span></div>
  <div class="card row"><div class="cbd">
    <div class="chips">
      <span class="chip">个人AUM月日均 <b>2,860 亿</b></span><span class="chip">其中：个人非存AUM月日均 <b>1,120 亿</b></span>
      <span class="chip">零售客户数 <b>612 万户</b></span><span class="chip">零售中高端客户数 <b>28.4 万户</b></span>
      <span class="chip">零售高净值客户数 <b>3.2 万户</b></span><span class="chip">代发客户数 <b>96.2 万户</b></span>
      <span class="chip">新增有效客户数 <b>28.4 万户</b></span><span class="chip">公司有效授信客户数 <b>4,820 户</b></span>
      <span class="chip">其中：大中有效授信客户数 <b>1,260 户</b></span><span class="chip">基石客户 <b>186 户</b></span>
      <span class="chip">手机银行客户数 <b>528 万户</b></span><span class="chip">产融协同客户数 <b>236 户</b></span>
      <span class="chip">公司-科技企业客群净增余额 <b>+38.6 亿</b></span><span class="chip">绿色金融余额 <b>312 亿</b></span>
    </div>
  </div></div>
</section>

`;
  h=h.slice(0,a)+dom+h.slice(b);
}

/* ========== 2) BUKPI.bank：改用表内核心考核指标 ========== */
{
  const f="  bank:[{l:'营业收入',u:'亿元',v:86.4,yoy:8.2},{l:'净利润',u:'亿元',v:21.3,yoy:7.1},{l:'总资产',u:'亿元',v:5820,yoy:5.6,raw:1},{l:'不良贷款率',u:'%',v:1.32,yoy:-0.05,pct:1}],";
  must(h.split(f).length===2,'BUKPI.bank');
  h=h.replace(f,"  bank:[{l:'营业收入',u:'亿元',v:86.4,yoy:8.2},{l:'净利润',u:'亿元',v:21.3,yoy:7.1},{l:'不良贷款率',u:'%',v:1.32,yoy:-0.05,pct:1},{l:'资本充足率',u:'%',v:13.1,yoy:0.4,pct:1}],");
}

/* ========== 3) drawBank 重写（真实科目命名 + 新增资产负债图 c-bk-bs） ========== */
{
  const a=h.indexOf('/* ---- 银行 ---- */');
  const b=h.indexOf('/* ---- 信托 ---- */');
  must(a>0&&b>a,'drawBank 边界');
  const js=`/* ---- 银行（指标名称对齐 华润金控-战略部指标表.xlsx · 华润银行 sheet） ---- */
function drawBank(){
  renderBuKpi('bank');
  /* ① 经营效益：损益瀑布（损益简表） */
  var wf=[[0,86.4],[53.8,86.4],[52.9,53.8],[29.5,52.9],[21.3,29.5],[21.3,0]];
  var wfLabels=['营业收入','业务及管理费','税金及附加','信用减值损失','所得税','净利润'];
  var wfColors=[BLUE,'#c8962e',T3,'#ff8a4d','#e0a53a','#2fd6a0'];
  mk('c-bk-pl',{type:'
