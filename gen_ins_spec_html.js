/* 生成《华润保险-需求规格说明书.html》——整体样式与章节结构与《华润银行-需求规格说明书.html》保持一致。
   数据来源：战略部数据应用平台.html 所用的 insurance_sheets_data.js（INSURANCE_SHEETS），
   指标明细表（表头结构、层级、合并、标签、不适用 ✗ 标记）全部由数据自动构建，与页面实机一致。
   产物为「web 源稿」，再经 gen_ins_req_docx.js → gen_ins_req_docx.ps1 转为交付 Word。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const base = __dirname;

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(base, 'insurance_sheets_data.js'), 'utf8') + '; globalThis.__S = INSURANCE_SHEETS;', sandbox);
const S = sandbox.__S;
const KEYS = ['ins01','ins02','ins03'];
const BANK_CSS = fs.readFileSync(path.join(base, '华润银行-需求规格说明书.html'), 'utf8')
  .match(/<style>[\s\S]*?<\/style>/)[0];

/* ===== 工具 ===== */
const esc = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
/* 时间类型：保险 3 表全部为期间指标（金额类流量/比率类），与页面数值口径一致 */
const TT = '<span class="tt tt-period">期间指标</span>';
/* 指标属性标签渲染：★ → 考核指标蓝标；空 → ✗（明细表中表示该列不适用/无值） */
const tagCell = v => (v === '★' || v === '是') ? '<span class="tag assess">考核指标</span>'
                    : (v === '高质量指标' ? '<span class="tag hq">高质量指标</span>'
                    : (v ? esc(v) : '<span class="xmark">✗</span>'));

/* spans: [{col,row,rs}] → 该 (col,row) 起始单元格的 rowspan 属性；被覆盖的行返回 skip */
function spanMap(spans){
  const m = {};
  (spans||[]).forEach(sp => { m[sp.col + ':' + sp.row] = sp.rs; });
  const covered = {};
  (spans||[]).forEach(sp => { for(let i=1;i<sp.rs;i++) covered[sp.col + ':' + (sp.row+i)] = true; });
  return { start: m, covered };
}

/* ===== 分报表「（4）指标明细说明」明细表 =====
   数据列位（insurance_sheets_data.js）：
   · ins01/ins03（10 列）：0序号 1名称 2单位 3标签 4当月-实际 5当月-环比 6截止-实际 7截止-同比 8预算 9达成率
   · ins02（12 列）：0序号 1分类 2分项 3名称 4单位 5标签 6当月-实际 7当月-环比 8截止-实际 9截止-同比 10预算 11达成率 */
function detailTable(key){
  const s = S[key];
  const twoCol = key === 'ins02';
  const C = twoCol
    ? {name:3, unit:4, tag:5, cur:6, mom:7, bud:10, ach:11}
    : {name:1, unit:2, tag:3, cur:4, mom:5, bud:8,  ach:9};
  const sm = spanMap(s.spans);
  // 表头（两级，还原页面蓝底表头结构）
  let head = '<thead><tr><th rowspan="2">序号</th>';
  if(twoCol){ head += '<th rowspan="2">指标分类</th><th rowspan="2">指标分项</th>'; }
  head += `<th rowspan="2">指标名称</th><th rowspan="2">单位</th><th rowspan="2">指标属性标签</th>
    <th colspan="2">当月值</th><th colspan="2">截止本月末</th>
    <th rowspan="2">全年预算</th><th rowspan="2">预算达成率</th><th rowspan="2" class="ttype">时间类型</th></tr>
    <tr><th class="sub">实际</th><th class="sub">环比</th><th class="sub">实际</th><th class="sub">同比</th></tr></thead>`;
  // 数据行
  let body = '<tbody>';
  s.rows.forEach((r, ri) => {
    const lv = (s.levels && s.levels[ri]) || 0;
    let tr = '<tr>';
    tr += `<td class="c">${esc(r[0])}</td>`;
    if(twoCol){
      [1,2].forEach(c=>{
        if(sm.covered[c+':'+ri]) return;
        const rs = sm.start[c+':'+ri];
        const v = r[c] ? esc(r[c]) : '<span class="ph">--</span>';
        tr += `<td class="c"${rs&&rs>1?` rowspan="${rs}"`:''}>${v}</td>`;
      });
    }
    tr += `<td class="name lv${lv}">${esc(r[C.name])}</td><td class="c">${esc(r[C.unit])}</td><td class="c">${tagCell(r[C.tag])}</td>`;
    const cur = r[C.cur], curMom = r[C.mom];
    const bud = r[C.bud], ach = r[C.ach];
    // 明细说明表不显示具体值：当月值列按数据口径标不适用；预算/达成率按是否含预算标 ✗
    tr += `<td class="c">${cur==='-'?'<span class="xmark">✗</span>':''}</td>`;
    tr += `<td class="c">${curMom==='-'?'<span class="xmark">✗</span>':''}</td>`;
    tr += `<td class="c"></td><td class="c"></td>`;
    tr += `<td class="c">${(bud&&bud!=='-')?'':'<span class="xmark">✗</span>'}</td>`;
    tr += `<td class="c">${(ach&&ach!=='-')?'':'<span class="xmark">✗</span>'}</td>`;
    tr += `<td class="c ttype">${TT}</td></tr>`;
    body += tr;
  });
  body += '</tbody>';
  return `<table class="doc-table rows detail">${head}${body}</table>`;
}

/* ===== 分报表「（2）指标概览卡片」 ===== */
function kpiSection(key){
  const s = S[key];
  if(!s.kpi || !s.kpi.length)
    return '<p>本报表未配置核心 KPI，页面<b>不渲染指标概览模块</b>（无折叠条与 KPI 卡片），面板头下直接为明细表。</p>';
  const cards = s.kpi.map((k,i)=>`<li><b>卡片${i+1}·${esc(k.label)}</b>：展示<b>截止本月末</b>（单位：${esc(k.unit)}）、<b>同比</b>；本报表卡片不显示「较年初」行。</li>`).join('');  return `<p>面板顶部共 <b>${s.kpi.length} 张</b>指标概览卡片（淡蓝/淡金/淡绿/淡粉四色轮排），各卡片的指标与展示内容如下：</p><ul class="tight">${cards}</ul>`;
}

/* ===== 分报表章节 ===== */
function sheetSection(idx, key){
  const s = S[key];
  const no = '2.1.2.' + (idx+1);
  const menu = s.name;                              // 01-财务指标
  const title = s.title;                            // 财务指标
  const cols = key==='ins02' ? 12 : 10;              // 明细表页面列数（含结构列）
  const cardCnt = s.kpi && s.kpi.length ? s.kpi.length + ' 张' : '无';
  const nameNoPrefix = menu;
  return `
<section id="sheet-${key}">
  <h5>${no}　${menu}　<span class="cnt">${s.rows.length} 项指标</span></h5>
  <h6>（1）报表基本信息</h6>
  <table class="doc-table kv"><tbody>
    <tr><th>左侧菜单名称</th><td>${menu}</td><th>页面标题</th><td>${title}</td></tr>
    <tr><th>更新频率</th><td>月度（数据日期下拉为 1~12 月）</td>
        <th>指标行数</th><td>${s.rows.length} 行</td></tr>
    <tr><th>指标概览</th><td>${cardCnt}</td>
        <th>明细表列数</th><td>${cols} 列（含指标名称等结构列）</td></tr>
    <tr><th>数据起始期间</th><td>2023 ～ 当前年度，默认选中当前年度</td>
        <th>导出</th><td>面板右上角「📥 导出」按钮</td></tr>
  </tbody></table>
  <h6>（2）指标概览卡片</h6>
  ${kpiSection(key)}
  <h6>（3）导出说明</h6>
  <ul class="tight">
    <li><b>导出样式</b>：导出表头与数据展示保持和系统页面一致；</li>
    <li><b>导出文件名称</b>：统一为<span class="hl-exp">「华润保险-报表名称-数据期间.xlsx」</span>；月度报表数据期间为「年-月」（如 <span class="hl-exp">华润保险-${menu}-2026-08.xlsx</span>）。</li>
  </ul>
  <h6>（4）指标明细说明</h6>
  <p class="tip">下表展示本报表页面的全部表头与对应指标清单，不显示具体指标值：指标在当前列不适用时，对应单元格以 <span class="xmark">×</span> 标记；空白单元格表示该指标在对应列有数值；</p>
  ${key==='ins02' ? '<p class="tip"><b>指标分类筛选条</b>：表头上方设「指标分类：全部 / 保费规模 / 佣金收入」筛选按钮组，点击按分类过滤明细行（序号 1~23=保费规模、24~46=佣金收入）；筛选状态在期间查询重渲染后保持。</p>' : ''}
  ${detailTable(key)}
  <h6>（5）系统原型示意图</h6>
  <p class="tip">以下截图取自<b>当前系统页面实机界面</b>（演示数据；下拉、按钮等控件为页面原样，Word 内不可交互）。</p>
  ${shotImg('ins_fix'+'0'+(idx+1)+'.png')}
</section>`;
}

/* ===== 系统原型示意图（实机截图，源头：战略部数据应用平台.html） ===== */
const shotImg = f => `<p align="center" style="margin:8pt 0"><img src="shots_ins/${f}" width="620" style="width:100%;max-width:100%;border:0.5pt solid #7F7F7F;"/></p>`;
function ledgerShots(){
  return KEYS.map((k,i)=>`
  <h5>${S[k].name}台账</h5>
  ${shotImg('ins_led'+'0'+(i+1)+'.png')}`).join('');
}

/* ===== 报表清单行 ===== */
function invRows(){
  return KEYS.map((k,i)=>{
    const s = S[k];
    return `<tr><td class="c">${'0'+(i+1)}</td><td><a href="#sheet-${k}">${s.name}</a></td><td class="c">月度</td><td class="c">${s.rows.length}</td><td class="c">${s.kpi&&s.kpi.length? s.kpi.length+' 张':'无'}</td><td class="c">有</td><td class="c"><span class="ph">无</span></td><td class="c">有</td><td class="c">有</td></tr>`;
  }).join('');
}

/* ===== 全文装配 ===== */
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>需求文档 · 华润保险模块（数据应用）</title>
${BANK_CSS.replace('需求文档 · 华润银行模块','需求文档 · 华润保险模块')}
</head>
<body>
<div class="page">

<div class="cover">
  <h1>华润保险模块 · 数据应用需求文档</h1>
  <div class="sub">金控指标体系数据应用平台 —— 固定报表管理 / 华润保险（3 张报表）</div>
  <div class="meta">
    <span>版本：V1.4</span><span>编制日期：2026-10-10</span>
  </div>
</div>

<div class="body">

<h2 id="toc">目录</h2>
<ul class="toc">
  <li><a href="#intro">一、引言</a></li>
  <li><a href="#func">二、功能需求</a></li>
  <li><a href="#part-fixed">2.1　固定报表需求说明</a></li>
  <li><a href="#common">2.1.1　通用需求（3 张报表共用）</a></li>
  <li><a href="#sheet-ins01">2.1.2.1　01-财务指标</a></li><li><a href="#sheet-ins02">2.1.2.2　02-业务指标</a></li><li><a href="#sheet-ins03">2.1.2.3　03-关键管理指标</a></li>
  <li><a href="#ledger">2.2　报表台账管理需求说明</a></li>
  <li><a href="#perm">三、权限说明</a></li>
  <li><a href="#confirm">四、业务确认</a></li>
</ul>

<h2 id="intro">一、引言</h2>
<h3>1、需求背景</h3>
<p>金控集团战略部推进指标体系数据化应用，在金控指标体系之上建设「数据应用」，以「固定报表管理、报表台账管理」模块将各业务板块指标体系固化为线上报表，替代线下 Excel 报送与查阅，实现指标展示口径的统一与实时化。</p>
<p>本文档为平台<b>华润保险模块</b>的需求说明：围绕 3 张固定报表，定义页面框架、指标清单、层级与标签、展示与取值规则，作为开发实现与业务核对的依据。文档中指标名称、单位、层级与列结构均与指标体系梳理结果一致。</p>
<h3>2、术语与定义</h3>
<table class="doc-table">
  <thead><tr><th style="width:160px;">术语/列名</th><th>口径说明</th></tr></thead>
  <tbody>
    <tr><td>当月值-实际</td><td>当月单月发生数（流量指标）；比率类指标（ROE、华润燃气存量用户保费占比）不适用时置 --</td></tr>
    <tr><td>当月值-环比</td><td>当月较上月变动幅度（%）；比率类为百分点差（ppt）；指标当月值不适用时置 --</td></tr>
    <tr><td>截止本月末-实际</td><td>本年累计发生数（流量），以各指标口径为准</td></tr>
    <tr><td>同比</td><td>较上年同期变动幅度（%）；比率类指标为百分点差（ppt）</td></tr>
    <tr><td>全年预算 / 预算达成率</td><td>全年预算来源于业务在通用报送平台的维护数据；达成率 =（截止本月末实际 ÷ 全年预算）× 100%（含进度条分色：≥95% 绿、85~95 黄、&lt;85% 红）；详见 <a href="#budget-rule">2.1.1.8</a></td></tr>
    <tr><td>考核指标</td><td>纳入绩效考核的指标，蓝色标签；唯一有权显示预算/达成率的行</td></tr>
    <tr><td>高质量指标</td><td>高质量发展监测指标，绿色标签；可与考核指标双标签并存</td></tr>
    <tr><td>ppt</td><td>percentage point，百分点：两个百分比数值的算术差（如 12.50%→11.70% 为 +0.8ppt）</td></tr>
    <tr><td>N/A 与 --</td><td>N/A=所选期间无历史数据（灰）；--=该指标此列不适用/无值（灰色加粗）</td></tr>
  </tbody>
</table>
<h3>3、需求范围</h3>
<p><b>入口路径</b>：平台顶部导航「数据应用」→ 左侧菜单「固定报表管理 → 华润保险」→ 点击报表名称进入对应页面；报表台账入口为「报表台账管理 → 华润保险」。</p>
<p><b>范围内</b>：①<b>固定报表需求说明（2.1）</b>：华润保险 3 张固定报表的通用展示需求（2.1.1）与分报表差异化需求（2.1.2），含页面框架、数据日期与期间查询、指标概览卡片、明细表结构与取值口径、预算一致性与单元格合并规则；②<b>报表台账管理需求说明（2.2）</b>：平台「报表台账管理」菜单下华润保险 3 张报表台账的页面结构、取数与展示规则。</p>
<p><b>范围外</b>：数据接口与 ETL 实现、通用报送平台的预算维护功能、平台权限体系实现（权限需求见第三章）。</p>
<p><b>报表清单</b>（共 3 张）：</p>
<table class="doc-table">
  <thead><tr><th>编号</th><th>报表名称</th><th>更新频率</th><th>指标行数</th><th>指标概览卡片</th><th>当月值列组</th><th>较年初列</th><th>全年预算列</th><th>指标属性标签列</th></tr></thead>
  <tbody>
  ${invRows()}
  </tbody>
</table>
<p class="tip">注：华润保险 3 张表均无「较年初」列（2026-09-15 按要求删除，表头与全部明细行同步移除）；3 张表表头统一两级结构——「当月值」分组（实际/环比）、「截止本月末」分组（实际/同比）。</p>

<h2 id="func">二、功能需求</h2>
<h3 id="part-fixed">2.1　固定报表需求说明</h3>
<p class="brief">本节约定华润保险 3 张固定报表的通用展示与取值规则（2.1.1），以及每张报表的差异化需求（2.1.2）；报表台账管理需求见 2.2。</p>
<h4 id="common">2.1.1　通用需求（3 张报表共用）</h4>

<h5>2.1.1.1　页面框架</h5>
<p>每张报表页面自上而下由三部分组成（02-业务指标含 ②，01/03 表无概览区，仅 ①③）：</p>
<ol class="toc" style="list-style:decimal;margin-left:24px;">
  <li><b>面板头</b>：左侧页面标题；右侧依次为「更新频率」块（月度）、「📅 数据日期」年+月双下拉、「📥 导出」按钮。</li>
  <li><b>指标概览</b>（仅 02-业务指标）：折叠条（「指标概览」，默认展开，可点击收起）+ 4 张 KPI 卡片（淡蓝/淡金/淡绿/淡粉四色轮排）；卡片含 指标名、数值+单位、同比行（本报表卡片不显示较年初行）。</li>
  <li><b>明细表</b>：白底卡片内两级表头 + 全量指标行；表头吸顶、超高滚动（最大高度约 600px）。</li>
</ol>

<h5>2.1.1.2　数据日期与期间查询</h5>
<ul class="tight">
  <li><b>年份下拉</b>：可选范围 <b>2023 ～ 当前年度</b>，默认选中<b>当前年度</b>。</li>
  <li><b>月份下拉</b>：可选范围为所选年份的 1~12 月，默认选中<b>日历上月</b>（有数据）；若当前为 1 月，则默认选中<b>上一年 12 月</b>（年份随之联动为上一年）。</li>
  <li>切换年/月后<b>自动查询</b>并重渲染页面，右上角 toast 提示「已加载 XXXX 年 X 月 数据 · 报表名」。</li>
  <li><b>查询加载后无数据</b>：保留表头、指标行结构（及 KPI 卡片，如有），数值显示灰色 <code>N/A</code>，toast 提示「无历史数据，仅显示报表结构」。</li>
</ul>

<h5>2.1.1.3　指标名称层级样式</h5>
<ul class="tight">
  <li><b>01-财务指标 / 03-关键管理指标</b>：单层结构，统一一级样式（加粗、深蓝色、左对齐顶格）。</li>
  <li><b>02-业务指标（四级层级，仅本报表生效）</b>：<b>一级（lv0）</b>=保费规模/佣金收入（序号 1/24），加粗靠左；<b>二级（lv1）</b>=机构/产融/香港/市场化业务 8 个合计（序号 2/5/16/20/25/28/39/43），半粗、深蓝、靠左；<b>三级（lv2）</b>=各业务明细指标，黑体、靠右；<b>四级（lv3）</b>=「其中：」明细，浅灰、靠右。</li>
</ul>

<h5>2.1.1.4　指标属性标签列（含该列的报表）</h5>
<ol class="tight">
  <li>蓝色标签「考核指标」；绿色标签「高质量指标」。</li>
  <li>无标签 → 灰色占位 <span class="ph">--</span>。</li>
  <li>指标属性标签取值逻辑：根据指标编号从指标台账中获取。</li>
</ol>

<h5>2.1.1.5　数值与涨跌显示规范</h5>
<ol class="tight">
  <li>数值列：数值展示采用千分位格式，保留 2 位小数。</li>
  <li>涨跌规范：正增长<b>红色 ▲</b>、负增长<b>绿色 ▼</b>、零值灰色无箭头（金融业惯例：红涨绿跌）。</li>
  <li>同比/环比/较年初：列表头不带 (%) 后缀，单位随数值单元格自带（% 或 ppt），保留 2 位小数。</li>
  <li>占位符统一：数据级占位 - → 灰色加粗 <span class="ph">--</span>；取不到数据 → 灰色 <code>N/A</code>。</li>
  <li>比率类指标（单位 %）的变动值用 ppt（百分点），金额/数量类用 %。</li>
</ol>

<h5>2.1.1.6　指标取值说明（当月值、截止本月末）</h5>
<ol class="tight">
  <li><b>当月值</b>：适用于<b>期间指标</b>，同指标分组编码下，取时间维度为【本月数】；金额类指标当月值为当月单月发生数（演示数据=截止本月末÷12），比例类指标当月值不适用时置 --（如 ROE、华润燃气存量用户保费占比）。</li>
  <li><b>截止本月末</b>：<b>期间指标</b>取时间维度为【本年累计数】；<b>时点指标</b>取时间维度为【本月末】。</li>
</ol>
<div class="dev-box"><b>特别说明（开发人员）</b>：报表页面<b>前端不展示</b><code>指标标准编号</code>、<code>指标分组编号</code>，<b>底层表必须包含该两个字段</b>，编号需与<b>指标标准台账</b>保持一致，否则无法实现指标落标。</div>

<h5>2.1.1.7　指标计算公式说明</h5>
<table class="doc-table">
  <thead>
    <tr><th colspan="2">时间类型</th><th colspan="2">当月值</th><th colspan="3">截止本月末</th></tr>
    <tr><th class="sub">时间类型</th><th class="sub">举例</th><th class="sub">实际</th><th class="sub">环比</th><th class="sub">实际</th><th class="sub">同比</th><th class="sub">较年初</th></tr>
  </thead>
  <tbody>
    <tr><td class="c"><span class="tt tt-period">期间值</span></td><td><b>金额类</b>（保费、收入、利润）</td><td>截止本月累计-截止上月累计</td><td>(本月当月值-上月当月值)/上月当月值【%】</td><td>本年累计数</td><td>(本年累计-去年同月累计)/去年同月累计【%】</td><td>不适用</td></tr>
    <tr><td class="c"><span class="tt tt-point">时点值</span></td><td><b>金额类</b>（余额、规模）</td><td>不适用</td><td>不适用</td><td>本月末余额</td><td>(本月末余额-去年同月末余额)/去年同月末余额【%】</td><td>(本月末余额-年初余额)/年初余额【%】</td></tr>
    <tr><td class="c"><span class="tt tt-period">期间值</span></td><td><b>比率类</b>（ROE、新增不良率）</td><td>不适用</td><td>不适用</td><td>本月末数</td><td>本期比率-去年同期比率【百分点】</td><td>不适用</td></tr>
    <tr><td class="c"><span class="tt tt-point">时点值</span></td><td><b>比率类</b>（不良率、占比、覆盖率）</td><td>不适用</td><td>不适用</td><td>本月末数</td><td>本期比率-去年同期比率【百分点】</td><td>本期比率-年初比率【百分点】</td></tr>
  </tbody>
</table>

<h5 id="budget-rule">2.1.1.8　预算一致性规则</h5>
<ul class="tight">
  <li>业务在<b>通用报送平台</b>维护了全年预算的指标，则显示「全年预算」「预算达成率」值；否则两列一律 <span class="ph">--</span>。</li>
  <li>预算达成率 = （截止本月末实际值 ÷ 全年预算）× 100%，单元格内含进度条：≥95% 绿色、85%~95% 黄色、&lt;85% 红色。</li>
  <li>华润保险模块<b>无净增量口径例外指标</b>；当前演示数据中含预算的指标为：01 表 4 项（营业收入、利润总额、ROE、EVA）、03 表 6 项（全部）、02 表 2 项（华润燃气业务保费规模、香港业务佣金收入，均为考核指标）。</li>
</ul>
<div class="dev-box"><b>特别说明</b>：<b>全年预算值</b>为<b>年度维度数据</b>：获取全年预算值时，依据 <code>指标标准编号 + 对应年度</code> 作为<b>联合主键</b>，读取该指标的全年预算值。</div>

<h5>2.1.1.9　单元格合并</h5>
<p>「指标分类」「指标分项」列，单元格按相同分类规则纵向合并（仅 02-业务指标使用）：指标分类 序号 1~23=保费规模、24~46=佣金收入；指标分项合并区间见本报表原型样式；</p>

<h4 id="perrep">2.1.2　分报表需求</h4>
${KEYS.map((k,i)=>sheetSection(i,k)).join('\n')}

<h3 id="ledger">2.2　报表台账管理需求说明</h3>
<p class="brief">本节约定平台「报表台账管理」一级菜单下华润保险 3 张报表台账的页面结构、取数与展示规则。台账与固定报表同源取数，按年度横向展开各月末值，供业务逐年回溯核对。</p>
<h4>2.2.1　模块定位与入口</h4>
<ul class="tight">
  <li><b>菜单层级</b>：「报表台账管理」为一级菜单，与「固定报表管理」同级；结构为 报表台账管理 → 公司分组（华润保险）→ 各报表台账，菜单名 = 报表名称 +「台账」（如「01-财务指标台账」）。</li>
  <li><b>菜单样式</b>：台账菜单采用金色主题；一级菜单固定展开、不可收起（与固定报表管理一致）。</li>
</ul>
<h4>2.2.2　台账页面结构</h4>
<ul class="tight">
  <li><b>台账头部</b>：面板标题为「报表名称 · 年度台账」；右侧为更新频率块（月度）、📅 数据年度下拉、「📥 导出」按钮。</li>
  <li><b>台账表格</b>：<b>单级表头</b> = 结构列（01/03 表：序号、指标名称、单位；02 表：序号、指标分类、指标分项、指标名称、单位；<b>不显示指标属性标签列</b>）+ 各月「N月末」单列；<b>不设同比列</b>。</li>
  <li><b>结构列合并</b>：02 表的指标分类/指标分项沿用固定报表的 rowspan 纵向合并规则（仅保留结构列内的合并）。</li>
  <li><b>无指标概览</b>：台账页面移除 KPI 卡片，仅保留台账表格。</li>
</ul>
<h4>2.2.3　台账取数与展示规则</h4>
<ul class="tight">
  <li><b>取数列</b>：取固定报表「截止本月末-实际」列作为各月末台账值；与固定报表同源取数（指标、维度与数据模型复用原固定报表）。</li>
  <li><b>年度范围</b>：可选范围 2023 ～ 当前年度，默认选中当前年度。</li>
  <li><b>月份列展示</b>：当前年度展示 1 月至本月；历史年度展示 1—12 月。</li>
  <li><b>月内数值推算</b>：累计流量类指标 = 年末值 × m/12；存量/比率类指标年内缓变（12 月 = 原值）。</li>
  <li><b>缺数口径</b>：台账口径下所有指标均应有月末值；仅个别月份未取到数（源值空、-、非数值）→ 统一 <code>N/A</code>，<b>不用 --</b>。</li>
</ul>
<h4>2.2.4　台账查询与导出</h4>
<ul class="tight">
  <li><b>年度查询</b>：仅年度下拉（无月份）；切换年度仅重渲染当前台账面板，toast 提示「已加载 YYYY 年 1—M 月台账 · 报表标题」。</li>
  <li><b>导出</b>：台账头部「📥 导出」按钮导出当前年度台账表（演示占位，正式环境对接导出接口）。</li>
  <li><b>导出样式</b>：导出表头与数据展示保持和系统页面一致（结构列 + 各月「N月末」单列，不含同比列与指标属性标签列）；</li>
  <li><b>导出文件名称</b>：统一为<span class="hl-exp">「华润保险-报表名称台账-数据年度年.xlsx」</span>；数据年度为当前所选台账年度（如 <span class="hl-exp">华润保险-01-财务指标台账-2026年.xlsx</span>）。</li>
</ul>
<h4>2.2.5　系统原型示意图</h4>
<p class="tip">以下截图取自<b>当前系统页面实机界面</b>（演示数据；下拉、按钮等控件为页面原样，Word 内不可交互）。</p>
${ledgerShots()}

<h2 id="perm">三、权限说明</h2>
<ul class="tight">
  <li><b>菜单权限</b>：华润保险报表挂接于平台「数据应用 → 固定报表管理」菜单下，其对应报表台账挂接于一级菜单「报表台账管理」下（与固定报表管理同级，结构为 报表台账管理 → 公司分组 → 各报表台账）；两者查看权限均遵循平台统一的角色-菜单权限管理，用户获授「固定报表管理 → 华润保险」「报表台账管理 → 华润保险」菜单权限后方可进入查看。为全体战略部人员开放固定报表管理与报表台账管理模块权限。</li>
  <li><b>数据范围</b>：报表数据为华润保险全量指标体系范围，暂不划分数据范围。</li>
  <li><b>功能权限</b>：支持战略部全体人员筛选和导出功能。</li>
  <li><b>维护权限</b>：全年预算等报送类数据由业务人员在通用报送平台维护，本模块只读展示，不提供数据维护入口。</li>
</ul>

<h2 id="confirm">四、业务确认</h2>
<table class="doc-table">
  <thead><tr><th style="width:150px;">确认角色</th><th style="width:180px;">公司-部门</th><th style="width:140px;">确认人（签字）</th><th style="width:120px;">日期</th><th>确认意见</th></tr></thead>
  <tbody>
    <tr><td>需求提出负责人</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>需求开发负责人</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>需求设计负责人</td><td></td><td></td><td></td><td></td></tr>
  </tbody>
</table>

</div>
<div class="footer">华润保险模块 · 数据应用需求文档 V1.4 ｜ 生成日期 2026-10-10</div>
</div>
</body>
</html>`;

fs.writeFileSync(path.join(base, '华润保险-需求规格说明书.html'), html, 'utf8');
console.log('✓ 已生成 华润保险-需求规格说明书.html （' + (html.length/1024).toFixed(0) + ' KB）');
