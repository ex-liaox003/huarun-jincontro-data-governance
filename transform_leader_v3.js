/* 战略部数据应用平台.html · 领导驾驶舱二次优化（2026-10-12 v3）：
   1) 右上角删除「报表口径 / 统计频率」，改为「币种：人民币」标识（数据固定合并口径·月度）；
   2) 左上角删除「在线监测」，业务板块页签（总览/银行/…）上移至工具条行，切换联动整页数据；
   3) 「数据截至」改为「数据日期」年-月下拉（2025-01 ~ 2026-09），切换后全页数值联动重算；
   4) 指标卡片重设计：北极星带=光谱顶线+斜切角+雷达底纹+预算条（时间进度刻度）；
      板块 KPI 四联卡=主题色顶线渐变、右上水印大数字、迷你 sparkline 走势。
   作用域仍限 #moduleLeader。备份 .bak_before_leader_v3。 */
const fs = require('fs');
const path = require('path');
const P = path.join(__dirname, '战略部数据应用平台.html');
let html = fs.readFileSync(P, 'utf8');
fs.writeFileSync(P + '.bak_before_leader_v3', html, 'utf8');
const must = (cond, msg) => { if (!cond) throw new Error('中止：' + msg); };
const rep1 = (find, repl, msg) => {
  must(html.split(find).length === 2, msg + '（出现 ' + (html.split(find).length - 1) + ' 次）');
  html = html.replace(find, repl);
};

/* ========== 1) 工具条 HTML：板块页签 + 数据日期下拉 + 币种 ========== */
{
  const hStart = html.indexOf('<header>', html.indexOf('<!-- 模块二：领导驾驶舱'));
  const hEnd = html.indexOf('</header>', hStart);
  must(hStart > 0 && hEnd > hStart, 'header 边界');
  const dateOpts = [];
  { let y = 2026, mo = 9;
    for (let i = 0; i < 21; i++) {
      const v = y + '-' + String(mo).padStart(2, '0');
      dateOpts.push('        <option value="' + v + '"' + (i === 0 ? ' selected' : '') + '>' + v + '</option>');
      if (--mo === 0) { mo = 12; y--; }
    }
  }
  const bar = `<!-- 控制工具条（v3）：业务板块页签 + 数据日期(年-月) + 币种；数据固定合并口径·月度 -->
<header>
  <div class="gq-bar">
    <nav id="tabs">
      <button class="on" data-v="overview" onclick="LeaderApp.go('overview',this)">总览</button>
      <button data-v="bank" onclick="LeaderApp.go('bank',this)">华润银行</button>
      <button data-v="trust" onclick="LeaderApp.go('trust',this)">华润信托</button>
      <button data-v="ins" onclick="LeaderApp.go('ins',this)">华润保险</button>
      <button data-v="asset" onclick="LeaderApp.go('asset',this)">华润资产</button>
      <button data-v="lease" onclick="LeaderApp.go('lease',this)">华润租赁</button>
    </nav>
    <div class="bar-right">
      <label>数据日期</label>
      <select id="dataDate" onchange="LeaderApp.setDate(this.value)">
${dateOpts.join('\n')}
      </select>
      <span class="cur-chip">币种 · 人民币 (CNY)</span>
    </div>
  </div>
</header>`;
  html = html.slice(0, hStart) + bar + html.slice(hEnd + 9);
}
// 1b) 工具条上方旧注释行（在 header 标签范围之外，需单独删除）
rep1('<!-- 紧凑控制工具条：品牌与页面标题由顶部菜单承载，此处仅保留口径/频率/数据截至（2026-10-12 改造） -->\n', '', '旧工具条注释行');

/* ========== 2) 删除下方原页签 nav 块 ========== */
{
  const a = html.indexOf('<!-- 页签 -->');
  must(a >= 0, '页签块起点');
  const b = html.indexOf('</nav>', a);
  must(b > a, '页签块终点');
  html = html.slice(0, a) + html.slice(b + 6);
}
rep1('<!-- ① 金控北极星带（常驻） -->', '<!-- 金控北极星指标带（常驻） -->', '北极星注释');

/* ========== 3) CSS 改造（顺序：工具条 → 北极星 → 原页签行 → KPI 卡） ========== */
// 3a) 旧控制条样式段 → 新工具条样式（页签/下拉/币种；live 标签、频率分段、asof 移除）
{
  const a = html.indexOf('/* ---- 控制工具条（原品牌行已移除） ---- */');
  const b = html.indexOf('/* ---- 北极星指标带 ---- */');
  must(a >= 0 && b > a, '工具条 CSS 段边界');
  const newBarCss = `/* ---- 控制工具条（v3：板块页签 + 数据日期 + 币种；随模块 static 展示，平台 header 常驻其上） ---- */
#moduleLeader header{position:static;
  background:linear-gradient(90deg,rgba(6,16,36,.95),rgba(14,42,86,.92) 50%,rgba(6,16,36,.95));
  border-bottom:1px solid var(--line);box-shadow:0 6px 18px rgba(2,10,26,.55)}
#moduleLeader .gq-bar{display:flex;align-items:center;gap:14px;padding:0 26px;min-height:52px;flex-wrap:wrap}
#moduleLeader header nav{display:flex;gap:4px;flex-wrap:wrap}
#moduleLeader header nav button{font-family:inherit;font-size:13.5px;padding:15px 18px 13px;cursor:pointer;letter-spacing:1px;
  border:none;border-bottom:2px solid transparent;background:transparent;color:var(--dim2);transition:color .16s,border-color .16s}
#moduleLeader header nav button:hover{color:var(--blue2)}
#moduleLeader header nav button.on{color:#fff;font-weight:700;border-bottom-color:var(--cyan);
  text-shadow:0 0 10px rgba(92,194,255,.55)}
#moduleLeader .bar-right{display:flex;align-items:center;gap:10px;margin-left:auto;flex-wrap:wrap}
#moduleLeader .bar-right label{font-size:12px;color:var(--dim2)}
#moduleLeader select{font-family:inherit;font-size:12.5px;border:1px solid var(--line);color:var(--text);
  background:rgba(10,30,62,.85);border-radius:4px;padding:6px 10px;cursor:pointer;outline:none;
  box-shadow:0 0 8px rgba(30,100,200,.15);font-variant-numeric:tabular-nums}
#moduleLeader select:focus{border-color:var(--line2)}
#moduleLeader select option{background:#0d2a52;color:#d8e8fc}
#moduleLeader .cur-chip{font-size:12px;color:#ffe3a0;letter-spacing:.5px;background:rgba(240,192,96,.10);
  border:1px solid rgba(240,192,96,.38);border-radius:4px;padding:5px 11px;white-space:nowrap}
`;
  html = html.slice(0, a) + newBarCss + html.slice(b);
}
// 3b) 北极星卡片整段替换（结束于原「页签」注释段之前）
{
  const a = html.indexOf('/* ---- 北极星指标带 ---- */');
  const b = html.indexOf('/* ---- 页签 ---- */', a);
  must(a >= 0 && b > a, '北极星 CSS 段边界');
  const northCss = `/* ---- 北极星指标带（v3：光谱顶线 + 斜切角 + 雷达底纹 + 预算条） ---- */
#moduleLeader #north{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;padding:16px 26px 0}
#moduleLeader .nk{position:relative;overflow:hidden;padding:13px 15px;
  background:linear-gradient(160deg,rgba(20,54,108,.78),rgba(8,24,50,.62));
  border:1px solid var(--line);border-radius:2px 14px 2px 2px;
  clip-path:polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%);
  box-shadow:0 4px 16px rgba(2,10,26,.5), inset 0 0 18px rgba(55,140,245,.06);
  transition:transform .2s,box-shadow .2s,border-color .2s}
#moduleLeader .nk::before{content:'';position:absolute;left:0;right:0;top:0;height:2px;
  background:linear-gradient(90deg,#0d6ef0,#37c8ff 55%,#f0c060);box-shadow:0 0 10px rgba(55,200,255,.65)}
#moduleLeader .nk::after{content:'';position:absolute;right:-34px;bottom:-34px;width:104px;height:104px;border-radius:50%;
  background:repeating-radial-gradient(circle at center,transparent 0 10px,rgba(92,194,255,.09) 10px 11px);
  opacity:.65;pointer-events:none}
#moduleLeader .nk:hover{transform:translateY(-3px);border-color:var(--line2);
  box-shadow:0 10px 26px rgba(2,10,26,.62),0 0 20px rgba(55,200,255,.16)}
#moduleLeader .nk .l{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:12px;color:var(--dim2)}
#moduleLeader .nk .l .no{font-size:10px;color:var(--gold);letter-spacing:1.5px;opacity:.85;white-space:nowrap}
#moduleLeader .nk .v{margin:5px 0 1px;display:flex;align-items:baseline;gap:3px;font-variant-numeric:tabular-nums}
#moduleLeader .nk .v b{font-size:26px;font-weight:800;line-height:1.15;letter-spacing:.5px;
  background:linear-gradient(135deg,#6cc6ff,#a8e6ff 65%,#fff);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 9px rgba(70,170,255,.4))}
#moduleLeader .nk .v small{font-size:11.5px;color:var(--dim);font-weight:500}
#moduleLeader .nk .d{font-size:12px;color:var(--text)}
#moduleLeader .nk .f{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:10.5px;color:var(--dim)}
#moduleLeader .nk .f .pct{color:var(--gold);font-weight:800;font-size:12.5px;font-variant-numeric:tabular-nums}
#moduleLeader .barg{position:relative;flex:1;height:6px;border-radius:3px;overflow:hidden;
  background:rgba(255,255,255,.08)}
#moduleLeader .barg i{display:block;height:100%;border-radius:3px;
  background:linear-gradient(90deg,#0d6ef0,#37c8ff);box-shadow:0 0 8px rgba(55,200,255,.55)}
#moduleLeader .barg u{position:absolute;top:-2px;bottom:-2px;width:2px;background:var(--gold);opacity:.75}
#moduleLeader .up{color:var(--up);font-weight:600}
#moduleLeader .down{color:var(--down);font-weight:600}
#moduleLeader .flat{color:var(--dim)}
`;
  html = html.slice(0, a) + northCss + html.slice(b);
}
// 3c) 原独立页签行样式删除（选择器已改挂 header nav；保留 main 与 .view 规则）
{
  const a = html.indexOf('/* ---- 页签 ---- */');
  const b = html.indexOf('/* ---- 卡片 ---- */', a);
  must(a >= 0 && b > a, '页签 CSS 段边界');
  const seg = html.slice(a, b);
  const mainRule = seg.match(/#moduleLeader main\{[^}]*\}/);
  const viewRule = seg.match(/#moduleLeader \.view\{[^}]*\}/);
  const viewOnRule = seg.match(/#moduleLeader \.view\.on\{[^}]*\}/);
  must(mainRule && viewRule && viewOnRule, 'main/.view 规则丢失');
  html = html.slice(0, a) + [mainRule[0], viewRule[0], viewOnRule[0]].join('\n') + '\n' + html.slice(b);
}
// 3d) 板块 KPI 四联卡整段替换（主题色 + 水印 + sparkline）
{
  const a = html.indexOf('/* ---- 板块 KPI 四联卡 ---- */');
  const b = html.indexOf('/* ---- 小节标题 / 指标胶囊 ---- */', a);
  must(a >= 0 && b > a, 'KPI 卡 CSS 段边界');
  const kpiCss = `/* ---- 板块 KPI 四联卡（v3：主题顶线渐变 + 水印数字 + 迷你走势） ---- */
#moduleLeader .bukpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px}
#moduleLeader .bukpi{position:relative;overflow:hidden;border-radius:10px;padding:13px 15px;
  border:1px solid var(--line);border-top:3px solid;
  box-shadow:0 4px 14px rgba(2,10,26,.45);transition:transform .22s,box-shadow .22s}
#moduleLeader .bukpi:hover{transform:translateY(-3px);box-shadow:0 10px 24px rgba(2,10,26,.6),0 0 14px rgba(55,200,255,.12)}
#moduleLeader .bukpi.c0{border-top-color:#4d9dff;background:linear-gradient(150deg,rgba(30,80,160,.5),rgba(10,30,62,.5))}
#moduleLeader .bukpi.c1{border-top-color:#f0c060;background:linear-gradient(150deg,rgba(140,100,32,.42),rgba(40,30,12,.4))}
#moduleLeader .bukpi.c2{border-top-color:#2ee6a8;background:linear-gradient(150deg,rgba(20,110,82,.45),rgba(8,40,32,.4))}
#moduleLeader .bukpi.c3{border-top-color:#ff5d6c;background:linear-gradient(150deg,rgba(150,50,64,.42),rgba(50,18,24,.4))}
#moduleLeader .bukpi .watermark{position:absolute;right:10px;top:6px;font-size:54px;font-weight:800;line-height:1;
  color:rgba(130,180,255,.09);pointer-events:none;font-variant-numeric:tabular-nums;letter-spacing:-2px}
#moduleLeader .bukpi .l{font-size:12px;color:var(--dim2);margin-bottom:5px;position:relative;z-index:1}
#moduleLeader .bukpi .v{display:flex;align-items:baseline;gap:3px;font-variant-numeric:tabular-nums;position:relative;z-index:1}
#moduleLeader .bukpi .v b{font-size:25px;font-weight:800}
#moduleLeader .bukpi.c0 .v b{color:#7db8ff;text-shadow:0 0 14px rgba(77,157,255,.35)}
#moduleLeader .bukpi.c1 .v b{color:#f0c060;text-shadow:0 0 14px rgba(240,192,96,.3)}
#moduleLeader .bukpi.c2 .v b{color:#2ee6a8;text-shadow:0 0 14px rgba(46,230,168,.3)}
#moduleLeader .bukpi.c3 .v b{color:#ff8d96;text-shadow:0 0 14px rgba(255,93,108,.3)}
#moduleLeader .bukpi .v small{font-size:11px;color:var(--dim);font-weight:500}
#moduleLeader .bukpi .foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;position:relative;z-index:1}
#moduleLeader .bukpi .d{font-size:12px}
#moduleLeader .bukpi.c0 .spark{color:#4d9dff}
#moduleLeader .bukpi.c1 .spark{color:#f0c060}
#moduleLeader .bukpi.c2 .spark{color:#2ee6a8}
#moduleLeader .bukpi.c3 .spark{color:#ff5d6c}
#moduleLeader .bukpi .spark{width:64px;height:18px;opacity:.9;flex:none}
`;
  html = html.slice(0, a) + kpiCss + html.slice(b);
}

/* ========== 4) JS 改造 ========== */
{
  const s = html.indexOf('/* 领导驾驶舱模块脚本');
  const e = html.indexOf('</script>', s);
  must(s >= 0 && e > s, 'leader 脚本边界');
  let js = html.slice(s, e);
  const repJ = (find, repl, msg) => {
    must(js.split(find).length === 2, msg + '（' + (js.split(find).length - 1) + ' 次）');
    js = js.split(find).join(repl);
  };

  // 4a) 口径常量 → 固定合并；注入数据日期系数
  repJ('var CAL_MULT = [1, 0.93, 1.04];            // 合并 / 单体 / 考核',
       'var CAL = 1;                                // 数据固定合并口径（v3 起控件精简，不再切换）\n' +
       '/* 数据日期（年-月）下拉：全页数值 = 基准(2026-09) × 月度系数（原型样例联动示意） */\n' +
       'var MFACT = [.941,.944,.947,.950,.953,.956,.960,.964,.968,.972,.976,.980,.984,.987,.990,.993,.996,.998,1];\n' +
       'var selDate = "2026-09";\n' +
       'function dateFactor(){ var y=+selDate.slice(0,4), mo=+selDate.slice(5,7);\n' +
       '  var idx = (y-2025)*12 + (mo-1);\n' +
       '  return MFACT[Math.max(0, Math.min(MFACT.length-1, idx))]; }',
       'CAL_MULT 定义');
  const repAll = (find, repl, n, msg) => {
    must(js.split(find).length === n + 1, msg + '（期望 ' + n + ' 处，实际 ' + (js.split(find).length - 1) + '）');
    js = js.split(find).join(repl);
  };
  repAll('CAL_MULT[caliber]', 'CAL*dateFactor()', 4, 'CAL_MULT 引用');

  // 4b) 状态与 m()
  repJ('var caliber = 0, freq = 0;\nfunction m(x){ return x*CAL*dateFactor()*(freq===2?9:freq===1?3:1); }',
       'function m(x){ return x*dateFactor(); }', 'm() 定义');

  // 4c) LeaderApp：setCaliber/setFreq → setDate；页签查询限定 header
  repJ("  setCaliber:function(v){ caliber=+v; renderNorth(); this.refresh(); },\n" +
       "  setFreq:function(v,el){ freq=+v; document.querySelectorAll('#moduleLeader #freqSeg button').forEach(function(b){b.classList.remove('on')});\n" +
       "    el.classList.add('on'); document.getElementById('asof').textContent = freq===2?'2026-09-30（累计）':(freq===1?'2026-Q3末':'2026-09-30'); renderNorth(); this.refresh(); },",
       '  setDate:function(v){ selDate=v; renderNorth(); this.refresh(); },',
       'setCaliber/setFreq');
  repJ("go:function(id,el){ curView=id;\n    document.querySelectorAll('#moduleLeader nav button')",
       "go:function(id,el){ curView=id;\n    document.querySelectorAll('#moduleLeader header nav button')", 'go() 页签查询');
  repJ("bu:function(id){ this.go(id, document.querySelector('[data-v='+id+']')); },",
       "bu:function(id){ this.go(id, document.querySelector('#moduleLeader header [data-v='+id+']')); },", 'bu() 页签查询');

  // 4d) renderNorth：编号角标 + 预算条（金色刻度 = 时间进度 90%）
  repJ("function renderNorth(){\n" +
       "  document.getElementById('north').innerHTML = NORTH.map(function(k){\n" +
       '    var v = k.pct? k.v*CAL*dateFactor() : m(k.v);\n' +
       "    var ycls = k.yoy>0?'up':(k.yoy<0?'down':'flat'), tcls = k.ytd>0?'up':(k.ytd<0?'down':'flat');\n" +
       "    return '<div class=\"nk\"><div class=\"l\">'+k.l+'</div><div class=\"v\"><b>'+fmt(v,k.raw)+'</b><small>'+k.u+'</small></div>'+\n" +
       "      '<div class=\"d\">'+delta(k,k.yoy)+' · <span class=\"'+tcls+'\">'+(k.ytd>0?'▲':'▼')+'较年初</span></div>'+\n" +
       '      \'<div class="dbar" title="预算完成率 \'+k.budget+\'%"><i style="width:\'+k.budget+\'%"></i></div></div>\';\n' +
       "  }).join('');\n" +
       '}',
       "function renderNorth(){\n" +
       "  document.getElementById('north').innerHTML = NORTH.map(function(k, i){\n" +
       '    var v = k.pct? k.v*CAL*dateFactor() : m(k.v);\n' +
       "    var ycls = k.yoy>0?'up':(k.yoy<0?'down':'flat'), tcls = k.ytd>0?'up':(k.ytd<0?'down':'flat');\n" +
       '    var w = Math.min(k.budget,100);\n' +
       '    return \'<div class="nk"><div class="l"><span>\'+k.l+\'</span><span class="no">A\'+(i+1)+\' 北极星</span></div>\'+\n' +
       "      '<div class=\"v\"><b>'+fmt(v,k.raw)+'</b><small>'+k.u+'</small></div>'+\n" +
       "      '<div class=\"d\">'+delta(k,k.yoy)+' · <span class=\"'+tcls+'\">'+(k.ytd>0?'▲':'▼')+'较年初</span></div>'+\n" +
       '      \'<div class="f" title="预算完成率 \'+k.budget+\'%（金色刻度 = 时间进度 90%）"><span class="barg"><i style="width:\'+w+\'%"></i><u style="left:90%"></u></span>' +
       '<span class="pct">\'+k.budget+\'%</span></div></div>\';\n' +
       "  }).join('');\n" +
       '}',
       'renderNorth');

  // 4e) renderBuKpi：主题色类 + 水印 + sparkline
  repJ("function renderBuKpi(bid){\n" +
       "  var el=document.getElementById('kpi-'+bid); if(!el) return;\n" +
       "  el.innerHTML = BUKPI[bid].map(function(k){\n" +
       "    var v=k.pct?k.v:m(k.v);\n" +
       "    var good = k.invert? k.yoy<0 : k.yoy>0;\n" +
       "    return '<div class=\"bukpi\"><div class=\"l\">'+k.l+'</div><div class=\"v\"><b>'+fmt(v,k.raw)+'</b><small>'+k.u+'</small></div>'+\n" +
       "      '<div class=\"d '+(good?'up':'down')+'\">'+(k.yoy>0?'▲':'▼')+' '+Math.abs(k.yoy).toFixed(2)+(k.pct?'pct':'%')+' 同比</div></div>';\n" +
       "  }).join('');\n" +
       '}',
       "function spark(seed, dir){\n" +
       "  var pts=[];\n" +
       "  for(var t=0;t<8;t++){ var ph=Math.sin(t*1.3+seed)*0.32 + Math.sin(t*2.9+seed*2)*0.18;\n" +
       "    var y = 15.5 - (3.5 + (dir>=0? t/7*9.5 : (7-t)/7*9.5) + ph*4.2);\n" +
       "    pts.push((2.5+t*8.4).toFixed(1)+','+Math.max(1.5,Math.min(16.5,y)).toFixed(1)); }\n" +
       "  return '<svg class=\"spark\" viewBox=\"0 0 66 18\" preserveAspectRatio=\"none\"><polyline points=\"'+pts.join(' ')+'\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>';\n" +
       "}\n" +
       "function renderBuKpi(bid){\n" +
       "  var el=document.getElementById('kpi-'+bid); if(!el) return;\n" +
       "  el.innerHTML = BUKPI[bid].map(function(k,i){\n" +
       "    var v=k.pct?k.v:m(k.v);\n" +
       "    var good = k.invert? k.yoy<0 : k.yoy>0;\n" +
       '    return \'<div class="bukpi c\'+i+\'">\'+\n' +
       '      \'<span class="watermark">\'+Math.round(k.v)+\'</span>\'+\n' +
       "      '<div class=\"l\">'+k.l+'</div><div class=\"v\"><b>'+fmt(v,k.raw)+'</b><small>'+k.u+'</small></div>'+\n" +
       "      '<div class=\"foot\"><span class=\"d '+(good?'up':'down')+'\">'+(k.yoy>0?'▲':'▼')+' '+Math.abs(k.yoy).toFixed(2)+(k.pct?'pct':'%')+' 同比</span>'+\n" +
       '      spark(i+1, k.yoy)+\'</div></div>\';\n' +
       "  }).join('');\n" +
       '}',
       'renderBuKpi');

  html = html.slice(0, s) + js + html.slice(e);
}

/* ========== 5) 页脚说明同步 ========== */
rep1('口径切换消费指标表 O 列（合并报表 / 单体报表 / 考核）；',
     '数据固定合并口径 · 月度（2026-10-12 起控件精简，币种为人民币）；数据日期切换按月度系数联动示意；',
     '页脚口径说明');

/* ========== 6) 自检 ========== */
{
  const gone = ['freqSeg', 'id="caliber"', 'setFreq', 'setCaliber', 'live-tag', '在线监测', '数据截至',
                'class="asof"', '报表口径', '统计频率', 'CAL_MULT', 'var caliber', 'class="dbar"', 'A1 北极星'];
  const leaks = gone.filter(k => html.includes(k));
  if (leaks.length) leaks.forEach(k => { let i = -1; while ((i = html.indexOf(k, i + 1)) >= 0) console.log('LEAK[' + k + '] …' + html.slice(Math.max(0, i - 60), i + 40).replace(/\n/g, '⏎')); });
  must(leaks.length === 0, '残留引用: ' + leaks.join(','));
  must(html.includes('id="dataDate"'), '数据日期下拉缺失');
  must(html.includes('币种 · 人民币 (CNY)'), '币种标识缺失');
  must(html.includes('LeaderApp.setDate'), 'setDate 绑定缺失');
  must(html.includes('class="watermark"') || html.includes("'watermark'"), '水印渲染缺失');
  must(html.includes('function spark'), 'sparkline 函数缺失');
  must(html.includes('.bukpi.c0{border-top-color:#4d9dff'), 'KPI 主题卡样式缺失');
  must(html.includes('no">A\'+(i+1)+\' 北极星') || html.includes(' 北极星</span>'), '北极星编号缺失');
  must(html.split('data-v="overview"').length === 2, '页签重复');
  must((html.match(/LeaderApp/g) || []).length >= 10, 'LeaderApp 绑定异常');
  must(html.includes('#moduleLeader .view.on{display:block}'), '.view 规则丢失');
  must(html.includes('#moduleLeader main{'), 'main 规则丢失');
}
fs.writeFileSync(P, html, 'utf8');
console.log('✓ v3：页签上移工具条 / 数据日期下拉 / 币种标识 / 指标卡重设计（备份 .bak_before_leader_v3）');
console.log('  新文件大小:', (html.length / 1024).toFixed(0), 'KB');
