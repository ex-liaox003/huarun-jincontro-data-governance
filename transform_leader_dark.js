/* 战略部数据应用平台.html · 领导驾驶舱模块改造（2026-10-12）：
   1) 删除内嵌页顶部「华润金控｜领导驾驶舱」品牌行（顶部菜单栏已承载），
      口径 / 统计频率 / 数据截至 保留为一条紧凑工具条；
   2) 模块整体换装「深蓝科技大屏」风格：深空渐变底 + 细网格 + 玻璃卡片 + 青金发光描边；
      图表配色同步为深底提亮版（文字/网格/提示框/环图描边）。
   作用域仍限 #moduleLeader，不影响数据应用 / 驾驶舱两模块。
   原文件备份为 .bak_before_leader_dark。 */
const fs = require('fs');
const path = require('path');
const P = path.join(__dirname, '战略部数据应用平台.html');
let html = fs.readFileSync(P, 'utf8');
fs.writeFileSync(P + '.bak_before_leader_dark', html, 'utf8');
const must = (cond, msg) => { if (!cond) throw new Error('中止：' + msg); };
const rep1 = (find, repl, msg) => {
  must(html.split(find).length === 2, msg + '（出现 ' + (html.split(find).length - 1) + ' 次）');
  html = html.replace(find, repl);
};

/* ========== 1) 内嵌页顶部行 → 紧凑工具条 ========== */
{
  const mIdx = html.indexOf('<!-- 模块二：领导驾驶舱');
  must(mIdx >= 0, '模块二注释起点');
  const hStart = html.indexOf('<header>', mIdx);
  const hEnd = html.indexOf('</header>', hStart);
  must(mIdx < hStart && hStart < hEnd, 'header 边界');
  const toolbar = `<!-- 紧凑控制工具条：品牌与页面标题由顶部菜单承载，此处仅保留口径/频率/数据截至（2026-10-12 改造） -->
<header>
  <div class="gq-bar">
    <span class="live-tag"><i class="ld-dot"></i>在线监测</span>
    <span class="asof">📅 数据截至 <b id="asof">2026-09-30</b></span>
    <div class="bar-right">
      <label>报表口径</label>
      <select id="caliber" onchange="LeaderApp.setCaliber(this.value)">
        <option value="0">合并报表口径</option>
        <option value="1">单体报表口径</option>
        <option value="2">考核口径</option>
      </select>
      <label>统计频率</label>
      <div class="seg" id="freqSeg">
        <button class="on" onclick="LeaderApp.setFreq(0,this)">月度</button>
        <button onclick="LeaderApp.setFreq(1,this)">季度</button>
        <button onclick="LeaderApp.setFreq(2,this)">本年累计</button>
      </div>
    </div>
  </div>
</header>`;
  html = html.slice(0, hStart) + toolbar + html.slice(hEnd + '</header>'.length);
}
rep1('<!-- 模块二：领导驾驶舱（内容内嵌自 驾驶舱文件/华润金控领导驾驶舱.html，2026-10-12；样式作用域 #moduleLeader，脚本 IIFE 暴露 window.LeaderApp） -->',
  '<!-- 模块二：领导驾驶舱（内嵌自 华润金控领导驾驶舱.html；2026-10-12 改造：顶部品牌行移除仅留控制条，整体深蓝大屏风格；样式作用域 #moduleLeader，脚本 IIFE 暴露 window.LeaderApp） -->',
  '模块二注释');

/* ========== 2) 作用域 CSS 整块重写：深蓝科技大屏风 ========== */
{
  const marker = '/* ===== 模块二：领导驾驶舱';
  const i = html.indexOf(marker);
  must(i >= 0, 'leader CSS 起点');
  const j = html.indexOf('</style>', i);
  must(j > i, 'leader CSS 终点');
  const newCss = `/* ===== 模块二：领导驾驶舱（深蓝科技大屏风 · 2026-10-12 改造，作用域 #moduleLeader） ===== */
#moduleLeader{
  --blue:#39a1f7; --blue2:#5cc2ff; --cyan:#37c8ff;
  --gold:#f0c060; --gold-light:#ffe3a0;
  --card:rgba(13,36,72,.66); --line:rgba(74,155,245,.25); --line2:rgba(92,194,255,.55);
  --text:#d8e8fc; --dim:#7d9cc9; --dim2:#9dbae0;
  --up:#ff5d6c; --down:#2ee6a8; --warn:#f0b13a;
  --ok-bg:rgba(46,230,168,.10); --ok-fg:#2ee6a8; --ok-line:rgba(46,230,168,.35);
  --warn-bg:rgba(240,177,58,.10); --warn-fg:#f0b13a; --warn-line:rgba(240,177,58,.35);
  --bad-bg:rgba(255,93,108,.10); --bad-fg:#ff5d6c; --bad-line:rgba(255,93,108,.4);
  font-family:"Microsoft YaHei","PingFang SC","Helvetica Neue",Arial,sans-serif;
  background:
    linear-gradient(rgba(92,194,255,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(92,194,255,.04) 1px,transparent 1px),
    radial-gradient(1100px 460px at 50% -140px,rgba(37,116,220,.4),rgba(0,0,0,0) 62%),
    linear-gradient(180deg,#061228 0%,#081a38 46%,#0a2149 100%);
  background-size:36px 36px,36px 36px,auto,auto;
  color:var(--text);font-size:14px;line-height:1.6;min-height:calc(100vh - 64px)}
/* ---- 控制工具条（原品牌行已移除） ---- */
#moduleLeader header{position:static;
  background:linear-gradient(90deg,rgba(6,16,36,.92),rgba(14,42,86,.88) 50%,rgba(6,16,36,.92));
  border-bottom:1px solid var(--line);box-shadow:0 6px 18px rgba(2,10,26,.5)}
#moduleLeader .gq-bar{display:flex;align-items:center;gap:12px;padding:8px 26px;min-height:44px;flex-wrap:wrap}
#moduleLeader .live-tag{font-size:12px;color:var(--down);letter-spacing:1px;display:flex;align-items:center;gap:6px;
  background:var(--ok-bg);border:1px solid var(--ok-line);border-radius:4px;padding:4px 10px;white-space:nowrap}
#moduleLeader .ld-dot{width:8px;height:8px;border-radius:50%;background:var(--down);box-shadow:0 0 8px var(--down);animation:ldPulse 2s ease-in-out infinite}
@keyframes ldPulse{0%,100%{opacity:1}50%{opacity:.35}}
#moduleLeader .bar-right{display:flex;align-items:center;gap:10px;margin-left:auto;flex-wrap:wrap}
#moduleLeader .bar-right label{font-size:12px;color:var(--dim2)}
#moduleLeader select{font-family:inherit;font-size:12.5px;border:1px solid var(--line);color:var(--text);
  background:rgba(10,30,62,.85);border-radius:4px;padding:6px 10px;cursor:pointer;outline:none;
  box-shadow:0 0 8px rgba(30,100,200,.15)}
#moduleLeader select:focus{border-color:var(--line2)}
#moduleLeader select option{background:#0d2a52;color:#d8e8fc}
#moduleLeader .seg{display:flex}
#moduleLeader .seg button{font-family:inherit;font-size:12px;border:1px solid var(--line);background:rgba(10,30,62,.85);
  color:var(--dim2);padding:6px 13px;cursor:pointer;border-radius:0;margin-left:-1px}
#moduleLeader .seg button:first-child{border-radius:4px 0 0 4px;margin-left:0}
#moduleLeader .seg button:last-child{border-radius:0 4px 4px 0}
#moduleLeader .seg button:hover{border-color:var(--line2);color:var(--blue2)}
#moduleLeader .seg button.on{background:linear-gradient(90deg,#0d6ef0,#37c8ff);border-color:transparent;color:#fff;
  font-weight:600;box-shadow:0 0 12px rgba(55,200,255,.4)}
#moduleLeader .asof{font-size:12px;color:#cfe6ff;background:rgba(55,120,220,.16);border:1px solid var(--line);
  border-radius:4px;padding:5px 11px;display:flex;align-items:center;gap:6px;white-space:nowrap}
#moduleLeader .asof b{color:#fff;font-variant-numeric:tabular-nums}
/* ---- 北极星指标带 ---- */
#moduleLeader #north{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;padding:18px 26px 0}
#moduleLeader .nk{background:linear-gradient(160deg,rgba(18,48,96,.78),rgba(9,26,54,.6));border:1px solid var(--line);
  border-radius:10px;padding:13px 15px;box-shadow:0 4px 16px rgba(2,10,26,.5),inset 0 0 16px rgba(55,140,245,.06);
  position:relative;overflow:hidden;transition:transform .2s,box-shadow .2s,border-color .2s}
#moduleLeader .nk:hover{transform:translateY(-3px);border-color:var(--line2);
  box-shadow:0 10px 26px rgba(2,10,26,.6),0 0 18px rgba(55,200,255,.15)}
#moduleLeader .nk::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;
  background:linear-gradient(180deg,var(--cyan),#0d6ef0);box-shadow:0 0 10px rgba(55,200,255,.6)}
#moduleLeader .nk .l{font-size:12px;color:var(--dim2)}
#moduleLeader .nk .v{margin:5px 0 1px;display:flex;align-items:baseline;gap:3px;font-variant-numeric:tabular-nums}
#moduleLeader .nk .v b{font-size:25px;font-weight:800;line-height:1.1;
  background:linear-gradient(135deg,#5cc2ff,#9be2ff);-webkit-background-clip:text;background-clip:text;color:transparent}
#moduleLeader .nk .v small{font-size:11.5px;color:var(--dim);font-weight:500}
#moduleLeader .nk .d{font-size:12px;color:var(--text)}
#moduleLeader .dbar{height:5px;background:rgba(255,255,255,.09);border-radius:3px;margin-top:9px;overflow:hidden}
#moduleLeader .dbar i{display:block;height:100%;border-radius:3px;
  background:linear-gradient(90deg,#0d6ef0,var(--cyan));box-shadow:0 0 8px rgba(55,200,255,.55)}
#moduleLeader .up{color:var(--up);font-weight:600}
#moduleLeader .down{color:var(--down);font-weight:600}
#moduleLeader .flat{color:var(--dim)}
/* ---- 页签 ---- */
#moduleLeader nav{display:flex;gap:8px;padding:16px 26px 2px;flex-wrap:wrap}
#moduleLeader nav button{font-family:inherit;font-size:13px;padding:7px 20px;border-radius:18px;cursor:pointer;letter-spacing:1px;
  border:1px solid var(--line);background:rgba(10,28,58,.65);color:var(--dim2);transition:all .16s}
#moduleLeader nav button:hover{border-color:var(--line2);color:var(--blue2)}
#moduleLeader nav button.on{color:#fff;border-color:transparent;font-weight:600;
  background:linear-gradient(90deg,#0d6ef0,#37c8ff);box-shadow:0 0 14px rgba(55,200,255,.45)}
#moduleLeader main{padding:12px 26px 26px}
#moduleLeader .view{display:none}
#moduleLeader .view.on{display:block}
/* ---- 卡片 ---- */
#moduleLeader .card{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;
  box-shadow:0 6px 18px rgba(2,10,26,.45),inset 0 0 22px rgba(45,120,220,.05)}
#moduleLeader .chd{display:flex;align-items:center;gap:8px;padding:9px 14px;
  background:linear-gradient(90deg,rgba(20,90,190,.35),rgba(20,90,190,.06) 60%,transparent);
  border-bottom:1px solid var(--line);color:#eaf4ff;font-size:13.5px;font-weight:700;letter-spacing:.5px}
#moduleLeader .chd::before{content:'';width:4px;height:14px;border-radius:2px;flex:none;
  background:linear-gradient(180deg,var(--cyan),#0d6ef0);box-shadow:0 0 8px rgba(55,200,255,.75)}
#moduleLeader .chd .tag{margin-left:auto;font-size:11px;color:var(--dim);font-weight:400;letter-spacing:0}
#moduleLeader .cbd{padding:13px 15px}
#moduleLeader .chartbox{position:relative;height:242px}
#moduleLeader .chartbox.tall{height:300px}
#moduleLeader .grid{display:grid;gap:12px}
#moduleLeader .g2{grid-template-columns:1fr 1fr}
#moduleLeader .g3{grid-template-columns:repeat(3,1fr)}
#moduleLeader .row{margin-bottom:12px}
#moduleLeader .row:last-child{margin-bottom:0}
/* ---- 板块卡片（总览） ---- */
#moduleLeader #buGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
#moduleLeader .bucard{background:linear-gradient(165deg,rgba(18,48,96,.75),rgba(9,26,54,.55));border:1px solid var(--line);
  border-radius:10px;padding:14px;cursor:pointer;box-shadow:0 4px 16px rgba(2,10,26,.5);
  transition:transform .2s,box-shadow .2s,border-color .2s;position:relative}
#moduleLeader .bucard:hover{transform:translateY(-3px);border-color:var(--line2);
  box-shadow:0 10px 26px rgba(2,10,26,.6),0 0 16px rgba(55,200,255,.12)}
#moduleLeader .bucard .topstrip{height:5px;border-radius:6px 6px 0 0;margin:-14px -14px 12px}
#moduleLeader .bucard .nm{font-size:14px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:7px}
#moduleLeader .bucard .dot{width:10px;height:10px;border-radius:3px;display:inline-block;flex:none}
#moduleLeader .bucard .star{font-size:12px;color:var(--dim2);margin-top:7px}
#moduleLeader .bucard .val{margin-top:4px;display:flex;align-items:baseline;gap:3px;font-variant-numeric:tabular-nums}
#moduleLeader .bucard .val b{font-size:24px;font-weight:800;line-height:1.1}
#moduleLeader .bucard .val small{font-size:11.5px;color:var(--dim);font-weight:500}
#moduleLeader .bucard .yoy{font-size:12px;margin-top:3px}
#moduleLeader .bucard .drill{font-size:11px;color:var(--dim);margin-top:8px}
#moduleLeader .bucard .drill:hover{color:var(--blue2)}
#moduleLeader .alerts{position:absolute;top:13px;right:14px;font-size:11px;padding:2px 9px;border-radius:10px;font-weight:600}
#moduleLeader .al-ok{background:var(--ok-bg);color:var(--ok-fg);border:1px solid var(--ok-line)}
#moduleLeader .al-warn{background:var(--warn-bg);color:var(--warn-fg);border:1px solid var(--warn-line)}
#moduleLeader .al-bad{background:var(--bad-bg);color:var(--bad-fg);border:1px solid var(--bad-line)}
/* ---- 板块 KPI 四联卡 ---- */
#moduleLeader .bukpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px}
#moduleLeader .bukpi{border-radius:10px;padding:13px 15px;border-left:4px solid;position:relative;overflow:hidden;
  box-shadow:0 4px 14px rgba(2,10,26,.45);transition:transform .22s,box-shadow .22s}
#moduleLeader .bukpi:hover{transform:translateY(-3px)}
#moduleLeader .bukpi:nth-child(1){border-left-color:#4d9dff;background:linear-gradient(150deg,rgba(26,68,138,.6),rgba(13,42,84,.4))}
#moduleLeader .bukpi:nth-child(2){border-left-color:var(--gold);background:linear-gradient(150deg,rgba(122,92,30,.45),rgba(66,48,16,.35))}
#moduleLeader .bukpi:nth-child(3){border-left-color:#2ee6a8;background:linear-gradient(150deg,rgba(18,96,72,.5),rgba(10,48,38,.35))}
#moduleLeader .bukpi:nth-child(4){border-left-color:#ff5d6c;background:linear-gradient(150deg,rgba(138,44,58,.45),rgba(74,24,32,.35))}
#moduleLeader .bukpi .l{font-size:12px;color:var(--dim2);margin-bottom:5px}
#moduleLeader .bukpi .v{display:flex;align-items:baseline;gap:3px;font-variant-numeric:tabular-nums}
#moduleLeader .bukpi .v b{font-size:24px;font-weight:800}
#moduleLeader .bukpi:nth-child(1) .v b{color:#7db8ff}
#moduleLeader .bukpi:nth-child(2) .v b{color:#f0c060}
#moduleLeader .bukpi:nth-child(3) .v b{color:#2ee6a8}
#moduleLeader .bukpi:nth-child(4) .v b{color:#ff8d96}
#moduleLeader .bukpi .v small{font-size:11px;color:var(--dim);font-weight:500}
#moduleLeader .bukpi .d{font-size:12px;margin-top:4px}
/* ---- 小节标题 / 指标胶囊 ---- */
#moduleLeader .secttl{display:flex;align-items:center;justify-content:center;gap:14px;
  background:linear-gradient(90deg,rgba(13,110,240,.14),rgba(13,110,240,.05));
  border:1px solid var(--line);border-radius:6px;padding:8px 12px;margin:16px 0 12px;
  color:var(--blue2);font-size:15px;font-weight:800;letter-spacing:2px;text-shadow:0 0 12px rgba(92,194,255,.35)}
#moduleLeader .secttl::before{content:'»';color:var(--cyan);font-size:14px}
#moduleLeader .secttl::after{content:'«';color:var(--cyan);font-size:14px}
#moduleLeader .secttl .lite{font-weight:400;font-size:12px;color:var(--dim);letter-spacing:0;text-shadow:none}
#moduleLeader .chips{display:flex;flex-wrap:wrap;gap:7px}
#moduleLeader .chip{font-size:12px;color:#bcd6f6;background:rgba(13,42,84,.55);border:1px solid var(--line);border-radius:14px;padding:4px 12px}
#moduleLeader .chip b{color:var(--blue2);font-weight:700;margin-left:6px;font-variant-numeric:tabular-nums}
/* ---- 监管红线 / 进度 ---- */
#moduleLeader .riskrow{display:grid;grid-template-columns:150px 1fr 72px 96px 74px;gap:12px;align-items:center;
  padding:9px 0;border-bottom:1px dashed rgba(92,160,230,.18);font-size:13px}
#moduleLeader .riskrow:last-child{border-bottom:none}
#moduleLeader .meter{height:10px;background:rgba(255,255,255,.08);border-radius:5px;position:relative;overflow:hidden}
#moduleLeader .meter i{position:absolute;left:0;top:0;bottom:0;border-radius:5px;box-shadow:0 0 6px rgba(55,200,255,.25)}
#moduleLeader .meter .limit{position:absolute;top:-2px;bottom:-2px;width:2px;background:#9fc3ea;opacity:.6}
#moduleLeader .riskrow .num{font-variant-numeric:tabular-nums;text-align:right;font-weight:600}
#moduleLeader .riskrow .lim{color:var(--dim);text-align:right;font-size:12px;white-space:nowrap}
#moduleLeader .st{font-size:12px;padding:2px 9px;border-radius:10px;text-align:center;white-space:nowrap;font-weight:600}
#moduleLeader .st-ok{background:var(--ok-bg);color:var(--ok-fg);border:1px solid var(--ok-line)}
#moduleLeader .st-warn{background:var(--warn-bg);color:var(--warn-fg);border:1px solid var(--warn-line)}
#moduleLeader .st-bad{background:var(--bad-bg);color:var(--bad-fg);border:1px solid var(--bad-line)}
#moduleLeader .prog{margin-top:12px}
#moduleLeader .prog .pl{display:flex;justify-content:space-between;font-size:12px;color:var(--dim2);margin-bottom:5px}
#moduleLeader .prog .pl span:last-child{color:var(--text);font-variant-numeric:tabular-nums;font-weight:600}
#moduleLeader .prog .pb{height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden}
#moduleLeader .prog .pb i{display:block;height:100%;border-radius:4px;
  background:linear-gradient(90deg,#d9a531,#ffe3a0);box-shadow:0 0 8px rgba(240,192,96,.5)}
#moduleLeader .kv-big{font-size:22px;font-weight:800;display:flex;align-items:baseline;gap:4px;font-variant-numeric:tabular-nums;
  background:linear-gradient(135deg,#5cc2ff,#9be2ff);-webkit-background-clip:text;background-clip:text;color:transparent}
#moduleLeader .kv-big small{font-size:11px;color:var(--dim);font-weight:500}
#moduleLeader .kl{font-size:12px;color:var(--dim2)}
#moduleLeader footer{padding:6px 26px 28px;font-size:12px;color:var(--dim);line-height:1.9;
  border-top:1px solid var(--line);margin-top:6px}
#moduleLeader footer b{color:var(--text);font-weight:600}
@media(max-width:1150px){
#moduleLeader #north{grid-template-columns:repeat(3,1fr)}
#moduleLeader #buGrid{grid-template-columns:repeat(2,1fr)}
#moduleLeader .g2,#moduleLeader .g3{grid-template-columns:1fr}
#moduleLeader .bukpis{grid-template-columns:repeat(2,1fr)}
#moduleLeader .riskrow{grid-template-columns:120px 1fr 60px 80px 66px}
}

`;
  html = html.slice(0, i) + newCss + html.slice(j);
}

/* ========== 3) 图表脚本：深底提亮配色 ========== */
{
  const s = html.indexOf('/* 领导驾驶舱模块脚本');
  const e = html.indexOf('window.LeaderApp = LeaderApp;');
  must(s >= 0 && e > s, 'leader 脚本边界');
  let js = html.slice(s, e);
  const R = [
    // 全局色板与 Chart.js 默认
    ["/* 板块色：白底经 validate_palette 校验通过（#0d6ef0,#1baf7a,#c8962e,#2e9bc0,#e86a2a） */\nvar BU_COLORS = { bank:'#0d6ef0', trust:'#1baf7a', ins:'#c8962e', asset:'#2e9bc0', lease:'#e86a2a' };\nvar T2='#33475f', T3='#8aa2bd', BLUE='#0d6ef0', BLUE2='#39a1f7', GOLD='#c8962e', GOLD2='#f8d488';",
     "/* 板块色：深蓝大屏底经对比度校验的提亮版（蓝/翠绿/暖金/天青/橘橙）；仅用于业务身份 */\nvar BU_COLORS = { bank:'#4d9dff', trust:'#2fd6a0', ins:'#f0c060', asset:'#41c0e8', lease:'#ff8a4d' };\nvar T2='#c8dcf7', T3='#7d9cc9', BLUE='#4d9dff', BLUE2='#5cc2ff', GOLD='#f0c060', GOLD2='#ffe3a0';"],
    ["Chart.defaults.borderColor = 'rgba(13,110,240,0.10)';",
     "Chart.defaults.borderColor = 'rgba(120,180,255,0.14)';"],
    ["Chart.defaults.plugins.tooltip.backgroundColor = '#0f2847';\nChart.defaults.plugins.tooltip.borderColor = '#39a1f7';",
     "Chart.defaults.plugins.tooltip.backgroundColor = '#081c3c';\nChart.defaults.plugins.tooltip.borderColor = '#37c8ff';"],
    ["Chart.defaults.plugins.tooltip.bodyColor = '#dfeaff';",
     "Chart.defaults.plugins.tooltip.bodyColor = '#cfe6ff';"],
    ["var GRID={color:'rgba(13,110,240,0.08)'}",
     "var GRID={color:'rgba(120,180,255,0.10)'}"],
    // 总览
    ["borderColor:BLUE,backgroundColor:'rgba(13,110,240,0.10)',fill:true",
     "borderColor:BLUE,backgroundColor:'rgba(77,157,255,0.16)',fill:true"],
    // 银行
    ["backgroundColor:['#0d6ef0','#4a93f5','#8ab8fa','#b9d4f8']",
     "backgroundColor:['#4d9dff','#74b6ff','#a3d2ff','#cfe6ff']"],
    ["var wfColors=[BU_COLORS.trust,BU_COLORS.ins,T3,'#e86a2a','#b76e00',BLUE];",
     "var wfColors=[BU_COLORS.trust,BU_COLORS.ins,T3,'#ff8a4d','#e0a53a',BLUE];"],
    ["backgroundColor:['#0d6ef0','#c8962e',BLUE,BLUE,'#4a93f5','#4a93f5']",
     "backgroundColor:['#4d9dff','#f0c060',BLUE,BLUE,'#74b6ff','#74b6ff']"],
    ["{n:'公司条线',c:'#0d6ef0'", "{n:'公司条线',c:'#4d9dff'"],
    ["{n:'零售条线',c:'#4a93f5'", "{n:'零售条线',c:'#74b6ff'"],
    ["{n:'金融市场',c:T3", "{n:'金融市场',c:'#93b4dc'"],
    ["border:1px solid #cfe0f4;border-radius:8px;padding:11px;background:#f4f9ff",
     "border:1px solid rgba(74,155,245,.25);border-radius:8px;padding:11px;background:rgba(13,42,84,.5)"],
    ["backgroundColor:['#1baf7a','#c8962e','#e8743a','#e5484d','#9e2f4a']",
     "backgroundColor:['#2fd6a0','#f0c060','#ff8a4d','#ff5d6c','#d64256']"],
    // 信托
    ["backgroundColor:['#1baf7a','#34c489','#62d3a3','#92e2bf','#127f57','#179869','#0b5c3f',T3]",
     "backgroundColor:['#2fd6a0','#4fe0b0','#78e9c4','#a4f0d6','#1fb884','#28cc94','#57e8b8',T3]"],
    ["backgroundColor:['#1baf7a','#34c489','#62d3a3','#92e2bf',T3,T3,'#e5484d']",
     "backgroundColor:['#2fd6a0','#4fe0b0','#78e9c4','#a4f0d6',T3,T3,'#ff5d6c']"],
    // 保险
    ["backgroundColor:['#9a6b17','#c8962e','#e0b35a','#c8962e','#e0b35a','#f0ca7c','#f0ca7c','#b0761d',T3]",
     "backgroundColor:['#c89630','#f0c060','#f8d488','#f0c060','#f8d488','#ffe3a0','#ffe3a0','#e0a53a',T3]"],
    ["backgroundColor:['#c8962e','#f0ca7c','#2e9bc0',T3],borderColor:'#fff'",
     "backgroundColor:['#f0c060','#ffe3a0','#41c0e8','#7d9cc9'],borderColor:'#0a1f42'"],
    // 资产
    ["backgroundColor:[T3,'#2e9bc0','#c9d8ea','#1baf7a']",
     "backgroundColor:[T3,'#41c0e8','#8fa9c9','#2fd6a0']"],
    ["backgroundColor:['#2e9bc0','#5db4d1','#5db4d1','#5db4d1','#5db4d1','#1baf7a','#c8962e','#c8962e','#0d8a68']",
     "backgroundColor:['#41c0e8','#6fd0f0','#6fd0f0','#6fd0f0','#6fd0f0','#2fd6a0','#f0c060','#f0c060','#2ee6a8']"],
    ["backgroundColor:['#2e9bc0','#5db4d1','#1baf7a','#34c489']",
     "backgroundColor:['#41c0e8','#6fd0f0','#2fd6a0','#4fe0b0']"],
    // 租赁
    ["{label:'新增投放',data:[18,16,6,7,10,9,8,5,12,4,3,9].map(function(x){return +m(x).toFixed(0)}),backgroundColor:'#f2a15e'",
     "{label:'新增投放',data:[18,16,6,7,10,9,8,5,12,4,3,9].map(function(x){return +m(x).toFixed(0)}),backgroundColor:'#ffb87a'"],
    ["backgroundColor:['#e86a2a','#f28a52','#f8ac80'],borderColor:'#fff'",
     "backgroundColor:['#ff8a4d','#ffa874','#ffc59e'],borderColor:'#0a1f42'"],
    ["{label:'收益率',data:[4.62,4.85,3.92],backgroundColor:'#1baf7a'",
     "{label:'收益率',data:[4.62,4.85,3.92],backgroundColor:'#2fd6a0'"],
    ["{label:'融资成本率',data:[2.84,2.76,3.05],backgroundColor:'#c8962e'",
     "{label:'融资成本率',data:[2.84,2.76,3.05],backgroundColor:'#f0c060'"],
    ["backgroundColor:['#2e9bc0','#5db4d1',T3,'#f2a15e','#e86a2a']",
     "backgroundColor:['#41c0e8','#6fd0f0',T3,'#ffb87a','#ff8a4d']"],
  ];
  R.forEach(function(p, idx){
    must(js.split(p[0]).length === 2, '图表配色替换 #' + idx + '：' + p[0].slice(0, 48));
    js = js.split(p[0]).join(p[1]);
  });
  html = html.slice(0, s) + js + html.slice(e);
}

/* ========== 4) 页脚说明同步 ========== */
rep1('板块五色经色盲可辨识度校验，仅用于业务身份',
     '板块五色为深蓝大屏底经对比度校验的提亮版，仅用于业务身份', '页脚说明');

/* ========== 5) 自检 ========== */
{
  must(!html.includes('bar-title'), '旧品牌标题行仍残留');
  must(!html.includes('brand-t'), '旧品牌行 CSS/HTML 残留');
  must(html.includes('id="asof"'), 'asof 控件丢失');
  must(html.includes('id="caliber"'), '口径下拉丢失');
  must(html.includes('id="freqSeg"'), '频率分段丢失');
  must(html.includes('data-module="leader"'), '顶导航 leader 按钮丢失');
  must(html.includes('linear-gradient(160deg,rgba(18,48,96,.78)'), '深蓝底卡片样式缺失');
  must(!html.includes('#moduleLeader .bar-title'), 'bar-title CSS 残留');
  const leaderCss = html.slice(html.indexOf('/* ===== 模块二：领导驾驶舱'), html.indexOf('</style>'));
  must(!/(^|\n)(body|header|nav|main|footer)\s*\{/m.test(leaderCss.replace(/#moduleLeader header\{/, '')), 'CSS 存在未作用域选择器');
  const ls = html.slice(html.indexOf('/* 领导驾驶舱模块脚本'), html.indexOf('</html>'));
  must(!ls.includes("borderColor:'#fff'"), '图表仍有白底环图描边');
  must(!ls.includes('#0d6ef0'), '图表仍有浅底深蓝主色残留');
  must((html.match(/LeaderApp/g) || []).length >= 10, 'LeaderApp 绑定异常');
}
fs.writeFileSync(P, html, 'utf8');
console.log('✓ 领导驾驶舱：品牌行已移除（保留控制条），整体换装深蓝科技大屏风（备份 .bak_before_leader_dark）');
console.log('  新文件大小:', (html.length / 1024).toFixed(0), 'KB');
