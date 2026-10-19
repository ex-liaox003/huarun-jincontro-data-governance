/* 战略部数据应用平台.html · 领导驾驶舱 v4（2026-10-12）：
   1) 北极星「合并营业收入」→「营业收入」；
   2) 删除北极星卡片 A1~A6 编号角标；
   3) 总览页删除「点击进入板块页」bucard 五卡（顶部页签已可切换板块），
      连同 BU 数据 / LeaderApp.bu / bucard 与 alerts 样式一并清理；
   4) 总览页删除「规模全景 · 本年累计」卡片及 c-ov-scale 图表。
   备份 .bak_before_leader_v4。 */
const fs = require('fs');
const path = require('path');
const P = path.join(__dirname, '战略部数据应用平台.html');
let html = fs.readFileSync(P, 'utf8');
fs.writeFileSync(P + '.bak_before_leader_v4', html, 'utf8');
const must = (cond, msg) => { if (!cond) throw new Error('中止：' + msg); };
const rep1 = (find, repl, msg) => {
  must(html.split(find).length === 2, msg + '（出现 ' + (html.split(find).length - 1) + ' 次）');
  html = html.replace(find, repl);
};

/* ========== 1) 合并营业收入 → 营业收入 ========== */
rep1("{l:'合并营业收入', u:'亿元', v:152.3", "{l:'营业收入', u:'亿元', v:152.3", '北极星标签');

/* ========== 2) 删除 A1~A6 北极星角标 ========== */
rep1(`.nk .l{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:12px;color:var(--dim2)}
#moduleLeader .nk .l .no{font-size:10px;color:var(--gold);letter-spacing:1.5px;opacity:.85;white-space:nowrap}`,
     `.nk .l{font-size:12px;color:var(--dim2)}`, '角标 CSS');
rep1(`return '<div class="nk"><div class="l"><span>'+k.l+'</span><span class="no">A'+(i+1)+' 北极星</span></div>'+`,
     `return '<div class="nk"><div class="l">'+k.l+'</div>'+`, '角标 JS');
// renderNorth 回调用不到 i 了，签名还原
rep1("NORTH.map(function(k, i){", "NORTH.map(function(k){", 'renderNorth 形参');
// 注释头去掉角标描述
rep1('/* ---- 北极星指标带（v3：光谱顶线 + 斜切角 + 雷达底纹 + 预算条） ---- */',
     '/* ---- 北极星指标带（光谱顶线 + 斜切角 + 雷达底纹 + 预算条） ---- */', '北极星注释');

/* ========== 3) 总览删除 bucard 五卡 ========== */
rep1('  <div id="buGrid"></div>\n  <div class="grid g2 row" style="margin-top:14px">',
     '  <div class="grid g2 row">', '总览 buGrid DOM');
// CSS：#buGrid + bucard 全家族 + alerts（板块卡专用）+ 媒体查询中的 buGrid 断点
{
  const a = html.indexOf('/* ---- 板块卡片（总览） ---- */');
  const b = html.indexOf('/* ---- 板块 KPI 四联卡', a);
  must(a >= 0 && b > a, 'bucard CSS 段边界');
  html = html.slice(0, a) + html.slice(b);
}
rep1('#moduleLeader #buGrid{grid-template-columns:repeat(2,1fr)}\n', '', '媒体查询 buGrid');
{
  const s = html.indexOf('/* 领导驾驶舱模块脚本');
  const e = html.indexOf('</script>', s);
  let js = html.slice(s, e);
  const repJ = (find, repl, msg) => {
    must(js.split(find).length === 2, msg + '（' + (js.split(find).length - 1) + ' 次）');
    js = js.split(find).join(repl);
  };
  // BU 数据整块删除（bank..lease 五卡数据，仅 bucard 消费）
  {
    const a = js.indexOf('var BUS = [');
    const b = js.indexOf('];', a);
    must(a >= 0 && b > a, 'BUS 数据边界');
    js = js.slice(0, a) + '/* 板块卡数据已随总览板块卡移除（2026-10-12 v4） */\n' + js.slice(b + 2);
  }
  // LeaderApp.bu 删除
  repJ("  bu:function(id){ this.go(id, document.querySelector('#moduleLeader header [data-v='+id+']')); },\n", '', 'LeaderApp.bu');
  // drawOverview 的 buGrid 渲染块删除（保留 names/BUS 供图表的引用修正）
  {
    const a = js.indexOf("  document.getElementById('buGrid').innerHTML = BUS.map(function(b){");
    must(a >= 0, 'buGrid 渲染块起点');
    const b = js.indexOf("  }).join('');\n", a);
    must(b > a, 'buGrid 渲染块终点');
    js = js.slice(0, a) + js.slice(b + "  }).join('');\n".length);
  }
  // 板块营收贡献图表名仍用 BUS 简名 → 改内联数组
  repJ("  var names=BUS.map(function(b){return b.nm.replace('华润','')});",
       "  var names=['银行','信托','保险','资产','租赁'];", 'names 引用');
  repJ("backgroundColor:BUS.map(function(b){return BU_COLORS[b.id]}),borderRadius:4}]},",
       "backgroundColor:[BU_COLORS.bank,BU_COLORS.trust,BU_COLORS.ins,BU_COLORS.asset,BU_COLORS.lease],borderRadius:4}]},", '图表板块色');
  html = html.slice(0, s) + js + html.slice(e);
}

/* ========== 4) 删除规模全景 · 本年累计 ========== */
rep1('  <div class="card row"><div class="chd">规模全景 · 本年累计 <span class="tag">亿元</span></div><div class="cbd"><div class="chartbox"><canvas id="c-ov-scale"></canvas></div></div></div>\n', '', '规模全景 DOM');
{
  const a = html.indexOf("  mk('c-ov-scale',{type:'bar'");
  must(a >= 0, 'c-ov-scale 起点');
  // mk 调用括号配平至行尾分号
  let end = a, depth = 0, seen = false;
  for (let k = a; k < html.length; k++) {
    const ch = html[k];
    if (ch === '{' || ch === '[' || ch === '(') { depth++; seen = true; }
    else if (ch === '}' || ch === ']' || ch === ')') { depth--; }
    else if (ch === ';' && seen && depth === 0) { end = k + 1; break; }
  }
  must(end > a && html[end] === '\n', 'c-ov-scale 终点');
  html = html.slice(0, a) + html.slice(end + 1);
}

/* ========== 5) 自检 ========== */
{
  const gone = ['合并营业收入', 'A\'+(i+1)+\' 北极星', 'class="no"', 'buGrid', 'bucard', 'LeaderApp.bu', 'var BUS =', 'c-ov-scale', '规模全景', 'drill'];
  const leaks = gone.filter(k => html.includes(k));
  if (leaks.length) leaks.forEach(k => { const i = html.indexOf(k); console.log('LEAK[' + k + '] …' + html.slice(Math.max(0, i - 50), i + 40).replace(/\n/g, '⏎')); });
  must(leaks.length === 0, '残留引用: ' + leaks.join(','));
  must(html.includes("{l:'营业收入', u:'亿元', v:152.3"), '营业收入改名缺失');
  must(html.includes('.barg'), '预算条保留');
  must(html.includes('板块营收贡献'), '板块营收贡献图保留');
  must(html.includes("id=\"tabs\""), '顶部页签保留');
  // 脚本语法
  const re = /<script>([\s\S]*?)<\/script>/g; let m, i = 0;
  while ((m = re.exec(html))) { i++; try { new Function(m[1]); } catch (err) { throw new Error('脚本块#' + (i + 1) + ' 语法错误: ' + err.message); } }
}
fs.writeFileSync(P, html, 'utf8');
console.log('✓ v4：营业收入改名 / 角标删除 / 板块卡与规模全景删除（备份 .bak_before_leader_v4）');
console.log('  新文件大小:', (html.length / 1024).toFixed(0), 'KB');
