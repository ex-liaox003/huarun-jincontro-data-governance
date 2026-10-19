/* ============================================================
   驾驶舱管理配置（领导层视角）
   说明：驾驶舱不复制数据，全部以引用方式从各公司固定报表实时取值，
   引用格式：
     KPI  {s:数据源名, k:报表key, kpi:该报表kpi数组下标}
     仪表 {s, k, gauge:true}        → 取该报表 chart(gauge) 的监测值
     图表 {s, k, c:'chart'|'chart2'} → 渲染该报表的 chart/chart2
   数据源名：SHEETS(华润银行) / ASSET_SHEETS(华润资产) / TRUST_SHEETS(华润信托)
            / INSURANCE_SHEETS(华润保险) / LEASE_SHEETS(华润租赁)
   ============================================================ */
const COCKPITS = [
  {
    key:'group', name:'集团总览',
    desc:'站在集团领导层视角，一屏总览五家核心企业的关键经营指标（数据基准 2025年12月）',
    /* 每家公司一个模块（华润资产居首）；picks 仅展示驾驶舱指标 */
    companies:[
      {company:'华润资产', groups:[
        /* 模块顺序（2026-09 调整）：服务集团退出 → 风险指标 → 收入结构 → 业务结构；标题不带序号 */
        {title:'服务集团退出', picks:[
          /* 2026-09-04 调整：业绩合同两项移至存续数量之前 */
          {s:'ASSET_SHEETS', k:'asset02', row:'业绩合同下服务集团退出项目数量'},
          {s:'ASSET_SHEETS', k:'asset02', row:'业绩合同下达成里程碑项目数量'},
          /* 存续数量与普通卡片同排展示，置于累计新增之前；数值标签为「本月末」；卡底附近12月趋势区域图 */
          {s:'ASSET_SHEETS', k:'asset02', row:'本月末服务集团退出项目存续数量', valLabel:'本月末', trend12:true},
          {s:'ASSET_SHEETS', k:'asset02', row:'本月末累计新增服务集团退出项目数量', trend12:true},
          {s:'ASSET_SHEETS', k:'asset02', row:'本月末累计退出的服务集团退出项目数量', trend12:true}
        ]},
        {title:'风险指标', picks:[
          /* rowwide → 独占整行：左指标数值 + 右近12月柱状+趋势组合图；标签「本月末」 */
          {s:'ASSET_SHEETS', k:'asset03', row:'不良资产率', valLabel:'本月末', rowwide:true},
          {s:'ASSET_SHEETS', k:'asset03', row:'不良资产总额', valLabel:'本月末', rowwide:true},
          {s:'ASSET_SHEETS', k:'asset03', row:'关注类资产总额', valLabel:'本月末', rowwide:true}
        ]},
        /* calSwitch → 组上方渲染口径页签，切换时卡片显示对应口径的值 */
        {title:'收入结构', calSwitch:true, picks:[
          /* 2026-09-04 调整顺序：成本收入比-拨备前 → 营业收入 → 利润总额 → 营业成本 → 人工成本 */
          {s:'ASSET_SHEETS', k:'asset01', row:'成本收入比-拨备前'},
          {s:'ASSET_SHEETS', k:'asset01', row:'营业收入'},
          {s:'ASSET_SHEETS', k:'asset01', row:'利润总额'},
          {s:'ASSET_SHEETS', k:'asset01', row:'营业成本'},
          {s:'ASSET_SHEETS', k:'asset01', row:'人工成本'}
        ]},
        /* 2026-09-04：产融业务两指标并入业务结构行（分类条同栏显示「业务结构 ｜ 产融业务」） */
        {title:'业务结构', title2:'产融业务', picks:[
          /* mcals → 卡片内嵌口径切换（各指标口径集合不同，独立切换） */
          {s:'ASSET_SHEETS', k:'asset02', row:'生息资产规模', valLabel:'本月末', mcals:[
            {cal:'资产本部及渝康合并口径', short:'合并'},
            {cal:'资产本部口径', short:'本部'},
            {cal:'渝康单体口径', short:'渝康'}
          ]},
          {s:'ASSET_SHEETS', k:'asset02', row:'新增自有出资规模', mcals:[
            {cal:'资产单体口径', short:'资产单体'},
            {cal:'渝康单体口径', short:'渝康'}
          ]},
          {s:'ASSET_SHEETS', k:'asset02', row:'退出自有出资规模', mcals:[
            {cal:'资产单体口径', short:'资产单体'},
            {cal:'渝康单体口径', short:'渝康'}
          ]},
          /* 产融业务分类（04-产融业务表），与业务结构同排展示；季度更新指标，卡内「当月值」标签显示为「当季值」 */
          {s:'ASSET_SHEETS', k:'asset04', row:'产融协同项目规模', mvalLabel:'当季值', tip:'【季度指标】本季度未报送时，展示上季度数据'},
          {s:'ASSET_SHEETS', k:'asset04', row:'产融协同营业收入', mvalLabel:'当季值', tip:'【季度指标】本季度未报送时，展示上季度数据'}
        ]}
      ]},
      {company:'华润银行', picks:[
        {s:'SHEETS', k:'01', kpi:0},   // 总资产
        {s:'SHEETS', k:'02', kpi:3},   // 净利润
        {s:'SHEETS', k:'09', kpi:0}    // 不良贷款率
      ]},
      {company:'华润信托', picks:[
        /* 2026-09-23：风险指标页(原trust02)已删除，全口径不良率仪表引用同步移除 */
        {s:'TRUST_SHEETS', k:'trust01', kpi:0},  // 总收入（含国信）
        {s:'TRUST_SHEETS', k:'trust04', kpi:0}   // 信托管理规模
      ]},
      {company:'华润保险', picks:[
        {s:'INSURANCE_SHEETS', k:'ins02', kpi:0},  // 保费规模
        {s:'INSURANCE_SHEETS', k:'ins02', kpi:2}   // 佣金收入（2026-09-15 卡片重排后索引 1→2）
      ]},
      {company:'华润租赁', picks:[
        {s:'LEASE_SHEETS', k:'lease01', kpi:0},  // 营业收入
        {s:'LEASE_SHEETS', k:'lease01', kpi:1},  // 利润总额
        {s:'LEASE_SHEETS', k:'lease04', kpi:0}   // 不良资产率
      ]},
      {company:'华润金融', overview:true}  // 合并金融板块：五家核心企业指标一览表
    ]
  },
  {
    key:'bank', name:'华润银行',
    desc:'规模·盈利·资本·质量四维总览',
    kpis:[
      {s:'SHEETS', k:'01', kpi:0}, {s:'SHEETS', k:'01', kpi:2},
      {s:'SHEETS', k:'02', kpi:0}, {s:'SHEETS', k:'02', kpi:3},
      /* 2026-09-23 关键监测指标卡片重排（流动性覆盖率/拨备覆盖率/资本充足率/房地产贷款集中度）：资本充足率下标 0→2，拨备覆盖率仍为 1 */
      {s:'SHEETS', k:'03', kpi:2}, {s:'SHEETS', k:'03', kpi:1},
      {s:'SHEETS', k:'09', kpi:0}, {s:'SHEETS', k:'09', kpi:2}
    ],
    charts:[
      {s:'SHEETS', k:'01', c:'chart2'},  // 主要资产负债规模(bar)
      {s:'SHEETS', k:'01', c:'chart'},   // 资产结构占比(composition)
      {s:'SHEETS', k:'03', c:'chart'},   // 资本充足率(gauge)
      {s:'SHEETS', k:'09', c:'chart2'}   // 不良率与拨备覆盖率趋势(trend)
    ]
  },
  {
    key:'asset', name:'华润资产',
    desc:'特殊资产经营与产融协同总览',
    /* 数据文件 04-产融业务已不再提供指标概览，KPI 改引用 02-业务结构的概览卡片 */
    kpis:[
      {s:'ASSET_SHEETS', k:'asset02', kpi:0}, // 本月末累计新增服务集团退出项目数量（合并口径）
      {s:'ASSET_SHEETS', k:'asset02', kpi:1}, // 本月末累计退出的服务集团退出项目数量（合并口径）
      {s:'ASSET_SHEETS', k:'asset02', kpi:2}, // 业绩合同下服务集团退出项目数量（合并口径）
      {s:'ASSET_SHEETS', k:'asset02', kpi:3}  // 业绩合同下达成里程碑项目数量（合并口径）
    ],
    charts:[
      {s:'ASSET_SHEETS', k:'asset01', c:'chart'},  // 营业收入结构(composition)
      {s:'ASSET_SHEETS', k:'asset02', c:'chart'},  // 自有出资规模结构(composition)
      {s:'ASSET_SHEETS', k:'asset03', c:'chart'},  // 风险资产分布(composition)
      {s:'ASSET_SHEETS', k:'asset04', c:'chart'}   // 产融协同业务构成(composition)
    ]
  },
  {
    key:'trust', name:'华润信托',
    desc:'收益·规模监测总览',
    /* 2026-09-23：风险指标页(原trust02)已删除，全口径不良率仪表/监测图引用同步移除 */
    kpis:[
      {s:'TRUST_SHEETS', k:'trust01', kpi:0}, {s:'TRUST_SHEETS', k:'trust01', kpi:2},
      {s:'TRUST_SHEETS', k:'trust04', kpi:0}, {s:'TRUST_SHEETS', k:'trust04', kpi:1}
    ],
    charts:[
      {s:'TRUST_SHEETS', k:'trust01', c:'chart'},  // 收入结构分布(composition)
      {s:'TRUST_SHEETS', k:'trust04', c:'chart'}   // 信托管理规模结构(composition)
    ]
  },
  {
    key:'ins', name:'华润保险',
    desc:'保费规模与业务结构总览',
    kpis:[
      {s:'INSURANCE_SHEETS', k:'ins02', kpi:0}, {s:'INSURANCE_SHEETS', k:'ins02', kpi:1},
      {s:'INSURANCE_SHEETS', k:'ins02', kpi:2}, {s:'INSURANCE_SHEETS', k:'ins02', kpi:3}
    ],
    charts:[
      {s:'INSURANCE_SHEETS', k:'ins02', c:'chart'},  // 保费规模结构(composition)
      {s:'INSURANCE_SHEETS', k:'ins01', c:'chart'},  // 财务指标结构(composition)
      {s:'INSURANCE_SHEETS', k:'ins03', c:'chart2'}  // 关键管理指标实际vs预算(bar)
    ]
  },
  {
    key:'lease', name:'华润租赁',
    desc:'盈利·业务·融资·质量·回报五维总览',
    kpis:[
      {s:'LEASE_SHEETS', k:'lease01', kpi:0}, {s:'LEASE_SHEETS', k:'lease01', kpi:1},
      {s:'LEASE_SHEETS', k:'lease03', kpi:0}, {s:'LEASE_SHEETS', k:'lease04', kpi:0},
      {s:'LEASE_SHEETS', k:'lease04', kpi:1}, {s:'LEASE_SHEETS', k:'lease05', kpi:0},
      {s:'LEASE_SHEETS', k:'lease05', kpi:1}
    ],
    charts:[
      {s:'LEASE_SHEETS', k:'lease01', c:'chart'},  // 收入结构分布(composition)
      {s:'LEASE_SHEETS', k:'lease03', c:'chart'},  // 业务规模行业分布(composition)
      {s:'LEASE_SHEETS', k:'lease02', c:'chart'},  // 融资渠道结构(composition)
      {s:'LEASE_SHEETS', k:'lease04', c:'chart'}   // 不良资产率监测(gauge)
    ]
  }
];
