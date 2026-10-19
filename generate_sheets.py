# -*- coding: utf-8 -*-
"""
从 output_utf8.json 读取 Excel 结构，严格按 Excel 的 sheet 名、指标名称、
表头层级生成 sheets_data.js。数据值为合理示例（关键指标保留既定值）。
"""
import json, hashlib, re

with open('output_utf8.json','r',encoding='utf-8') as f:
    DATA = json.load(f)

# 关键指标特殊值: name -> (2025实际, 同比%, 预算率%, 全年预算)
SPECIAL = {
    # 01 资产负债
    "总资产":(12580.00,8.6,91.2,13800.00),
    "贷款":(6850.00,10.3,91.3,7500.00),
    "普通贷款":(6200.00,10.5,91.2,6800.00),
    "贴现":(350.00,5.0,87.5,400.00),
    "票据融资":(300.00,8.0,100.0,300.00),
    "投资性资产":(3200.00,9.0,91.4,3500.00),
    "债券投资":(2100.00,8.0,91.3,2300.00),
    "同业投资":(680.00,6.0,90.7,750.00),
    "理财回表投资":(220.00,10.0,88.0,250.00),
    "其他投资":(200.00,0.0,100.0,200.00),
    "拆出同业":(180.00,5.0,90.0,200.00),
    "买入返售":(120.00,10.0,80.0,150.00),
    "存放央行":(980.00,2.0,98.0,1000.00),
    "总负债":(11620.00,8.2,90.8,12800.00),
    "存款":(8500.00,9.5,92.4,9200.00),
    "应付债券":(1200.00,8.0,92.3,1300.00),
    "同业负债":(680.00,6.0,90.7,750.00),
    "拆入回购":(150.00,5.0,88.0,170.00),
    "向央行借款":(120.00,10.0,85.0,140.00),
    "所有者权益":(960.00,12.4,96.0,1000.00),
    # 02 损益
    "营业收入":(328.50,8.5,90.1,365.00),
    "利息净收入":(268.50,7.2,90.5,296.50),
    "其中：手续费及佣金净收入":(28.60,12.1,91.0,31.40),
    "非利息净收入":(60.00,14.5,88.0,68.20),
    "投资收益":(22.50,18.0,86.0,26.20),
    "公允价值变动净收益":(8.50,25.0,82.0,10.40),
    "业务及管理费":(98.50,5.2,92.0,107.00),
    "税金及附加":(3.80,6.0,90.0,4.20),
    "税前利润":(120.00,9.5,91.0,131.90),
    "减值价值损失":(15.00,-8.0,88.0,17.00),
    "利润总额":(118.00,9.2,90.5,130.40),
    "所得税":(17.50,8.0,90.0,19.40),
    "净利润":(95.00,9.8,91.2,104.10),
    # 03 关键监测
    "流动性覆盖率":(128.50,3.2,98.8,130.00),
    "净稳定资金比率":(115.20,2.5,97.6,118.00),
    "流动性缺口率（90天）":(5.20,-1.2,95.0,5.50),
    "核心负债依存度":(62.50,1.5,96.0,65.20),
    "拨备覆盖率":(185.60,5.2,98.5,188.30),
    "贷款拨备率":(2.85,0.3,95.0,3.00),
    "资产收益率":(0.85,0.05,92.0,0.92),
    "资本收益率":(12.50,0.8,90.0,13.90),
    "风险资产收益率":(1.25,0.1,88.0,1.42),
    "成本收入比":(29.98,-1.2,95.0,31.50),
    "资本净额":(960.00,12.4,96.0,1000.00),
    "资本充足率":(13.85,0.35,98.9,14.00),
    "一级资本净额":(780.00,11.5,96.0,812.50),
    "一级资本充足率":(11.25,0.3,98.5,11.42),
    "核心一级资本净额":(680.00,10.8,96.0,708.30),
    "核心一级资本充足率":(9.82,0.25,98.5,9.97),
    "总杠杆":(5.25,0.15,97.0,5.42),
    "风险加权资产":(6930.00,8.5,92.0,7532.60),
    "房地产贷款集中度":(32.50,-0.8,96.0,33.85),
    "单同业融资客户集中度":(8.20,-0.5,95.0,8.63),
    "单同业授信客户集中度":(6.80,-0.3,95.0,7.16),
    # 04 收入结构
    "全行营业收入":(328.50,8.5,90.1,365.00),
    "公司条线营业收入":(165.20,7.8,89.5,184.50),
    "其中：公司金融-营业收入":(148.50,7.5,89.0,166.85),
    "公司金融-其他营业收入":(16.70,10.2,92.0,18.15),
    "零售条线营业收入":(98.50,9.5,90.0,109.40),
    "其中：零售金融-营业收入":(88.20,9.2,89.5,98.55),
    "金融市场-营业收入":(52.30,10.8,91.0,57.50),
    "其中：金融市场条线营业收入":(52.30,10.8,91.0,57.50),
    "司库营业收入":(12.50,8.0,88.0,14.20),
    "全行利息净收入":(268.50,7.2,90.5,296.50),
    "公司条线利息净收入":(132.50,6.8,90.0,147.20),
    "零售条线利息净收入":(86.30,8.5,91.0,94.80),
    "全行非息收入":(60.00,14.5,88.0,68.20),
    "其中：全行手续费及佣金净收入":(28.60,12.1,91.0,31.40),
    "公司条线非息收入":(15.20,10.5,88.0,17.30),
    "其中：公司金融手续费及佣金净收入":(13.80,10.2,87.5,15.77),
    "零售条线非息收入":(22.50,16.8,89.0,25.30),
    "其中：零售金融手续费及佣金净收入":(14.80,15.5,88.0,16.82),
    "全行投资收益":(22.50,18.0,86.0,26.20),
    "其中：金融市场投资收益":(20.80,17.5,86.0,24.20),
    "公允价值变动":(8.50,25.0,82.0,10.40),
    # 05 成本结构
    "公司条线成本合计":(85.20,5.5,92.0,92.60),
    "其中：公司金融-营业成本":(52.30,5.2,92.5,56.60),
    "公司金融-日常成本":(18.50,4.8,93.0,19.90),
    "公司金融-资本成本":(14.40,6.8,90.0,16.00),
    "公司金融-EVA":(38.50,12.5,88.0,43.75),
    "公司金融-RAROC":(15.20,1.2,90.0,16.90),
    "零售条线成本合计":(48.50,5.8,91.0,53.30),
    "其中：零售金融-营业成本":(28.60,5.5,91.5,31.30),
    "零售金融-日常成本":(12.30,4.2,92.0,13.40),
    "零售金融-资本成本":(7.60,8.5,89.0,8.55),
    "零售金融-EVA":(22.80,15.5,87.0,26.20),
    "零售金融-RAROC":(18.50,1.5,90.0,20.55),
    "金融市场条线成本合计":(22.50,4.2,93.0,24.20),
    "其中：金融市场-营业成本":(13.80,4.0,93.5,14.75),
    "金融市场-日常成本":(5.20,3.5,94.0,5.53),
    "金融市场-资本成本":(3.50,6.2,90.0,3.89),
    "金融市场-EVA":(18.50,18.0,86.0,21.50),
    "金融市场-RAROC":(22.80,2.0,90.0,25.30),
    # 06 存贷结构
    "存款规模（全行）":(8500.00,9.5,92.4,9200.00),
    "公司条存款规模":(5200.00,8.5,92.0,5650.00),
    "公司条定期存款":(2800.00,7.8,91.0,3075.00),
    "个人条存款规模":(3300.00,10.5,93.0,3548.00),
    "个人条定期存款":(1800.00,9.2,92.0,1955.00),
    "全行AUM日均余额":(12000.00,12.5,90.0,13333.00),
    "其中：个人非代AUM日均余额":(6800.00,13.5,89.0,7640.00),
    "代发客户AUM日均余额":(2800.00,15.2,88.0,3182.00),
    "存款日均（全行）":(8400.00,9.2,92.5,9081.00),
    "其中：低成存款日均余额":(3200.00,15.8,88.0,3636.00),
    "公司条线存款日均":(5100.00,8.2,92.0,5543.00),
    "公司条低成存款日均余额":(1850.00,14.5,88.5,2089.00),
    "个人条存款日均":(3300.00,10.8,93.0,3548.00),
    "个人条低成存款日均余额":(1350.00,16.5,87.5,1543.00),
    "公司-贷款投放额":(1850.00,8.5,90.0,2055.00),
    "公司-房地产融资投放额":(320.00,-2.5,85.0,376.00),
    "公司-贸易融资投放":(280.00,6.5,88.0,318.00),
    "公司-小微企业贷款投放额":(450.00,15.5,92.0,489.00),
    "公司-科技企业客群贷款投放额":(380.00,22.0,95.0,400.00),
    "零售-贷款投放额":(980.00,10.2,91.0,1077.00),
    "个人条抵押贷款":(520.00,8.5,90.0,577.00),
    "个人条消费贷":(180.00,18.5,88.0,204.50),
    "个人条经营性贷款":(280.00,15.2,90.0,311.00),
    "其中：经营贷AUM覆盖率达到（百分比）":(45.50,5.2,92.0,49.45),
    "线上平台贷款额":(220.00,28.5,85.0,258.80),
    "票据融资额":(350.00,8.0,100.0,350.00),
    # 07 资产质量结构
    "可交易债券占比":(28.50,1.5,92.0,31.00),
    "可交易债券占比-公募":(18.20,1.2,91.0,20.00),
    "可交易债券占比-私募":(8.50,2.0,93.0,9.15),
    "可交易债券占比-其他":(1.80,0.5,90.0,2.00),
    "债券投资收益率":(3.85,0.15,95.0,4.05),
    "同业资产收益率":(2.95,0.1,94.0,3.14),
    "生息资产收益率":(4.25,0.08,95.0,4.47),
    "存款付息率":(1.92,-0.12,96.0,2.00),
    "存款付息率-公司":(1.85,-0.15,96.0,1.93),
    "存款付息率-个人":(2.05,-0.08,95.0,2.16),
    "应付债券付息率":(2.85,-0.05,94.0,3.03),
    "同业负债付息率":(2.45,-0.08,93.0,2.63),
    "付息负债付息率":(2.10,-0.10,95.0,2.21),
    "存贷款利差":(3.20,0.15,94.0,3.40),
    "净息差":(2.15,0.08,95.0,2.26),
    # 08 客群结构
    "公司条有效授信客户数":(2.85,8.5,92.0,3.10),
    "其中：战略有效授信客户数":(0.85,12.5,88.0,0.97),
    "小企业有效授信客户数":(1.25,15.2,90.0,1.39),
    "钻石客户":(0.45,18.5,87.0,0.52),
    "零售客户数":(380.00,9.5,92.0,413.00),
    "其中：中高端客户数":(45.50,12.8,90.0,50.55),
    "信用卡客户数":(85.20,8.5,91.0,93.60),
    "手机银行客户数":(450.00,15.5,89.0,505.60),
    "掌E贷用户数":(128.50,22.0,86.0,149.40),
    "现金管理客户数":(8.50,10.2,90.0,9.44),
    # 09 资产质量
    "不良贷款余额":(108.20,5.2,92.0,117.60),
    "关注类贷款余额":(142.50,3.8,91.0,156.60),
    "次级类贷款余额":(58.60,4.5,90.0,65.10),
    "可疑类贷款余额":(32.80,2.5,88.0,37.30),
    "损失类贷款余额":(16.80,-1.2,85.0,19.75),
    "减值价值损失":(15.00,-8.0,88.0,17.05),
    "公司条贷款损失准备":(125.50,6.5,90.0,139.40),
    "零售条贷款损失准备":(75.30,5.8,91.0,82.75),
    "不良贷款率":(1.58,-0.07,95.0,1.66),
    "关注贷款率":(2.08,-0.05,93.0,2.24),
    "逾期贷款率":(1.82,-0.08,92.0,1.98),
    "小不不良贷款率":(0.85,-0.05,90.0,0.94),
    "拨备贷款余额":(200.80,6.8,91.0,220.65),
    "拨备覆盖率":(185.60,5.2,98.5,188.30),
}

def gen_val(name, unit):
    """返回 (actual, trend, rate, year_budget)"""
    if name in SPECIAL:
        a,t,r,yb = SPECIAL[name]
        return a,t,r,yb
    h = int(hashlib.md5(name.encode('utf-8')).hexdigest(),16)
    if unit == "亿元":
        actual = round(50 + (h % 5000) + (h%100)/100, 2)
    elif unit == "%":
        actual = round(1 + (h % 28) + (h%100)/100, 2)
    elif unit in ("万户","万"):
        actual = round(5 + (h % 400) + (h%100)/100, 2)
    else:
        actual = round(50 + (h % 1000), 2)
    trend = round(-8 + (h % 23) + (h%10)/10, 1)
    rate = round(80 + (h % 25), 1)
    year_budget = round(actual / rate * 100, 2)
    return actual, trend, rate, year_budget

def fmt_num(v, unit):
    """格式化数值显示"""
    if isinstance(v, str): return v
    if unit == "亿元":
        return f"{v:,.2f}"
    if unit == "%":
        return f"{v:.2f}"
    if unit in ("万户","万"):
        return f"{v:,.2f}"
    return f"{v:,.2f}"

# 每张表配置
CONFIG = {
    "01":{
        "sheet":"01-资产负债简表(20个)","title":"资产负债简表","subtitle":"",
        "start":3,
        "cols":{"no":0,"name":1,"unit":2,"kaohe":None,"jianguan":None,"lei":None,"xiang":None},
        "order":["no","name","unit","actual","budget_actual","trend","rate","year_budget","progress"],
        "kpi":[0,13,14,19],
        "chart":{"type":"composition","title":"资产结构占比","data":[
            {"name":"贷款","ref":"贷款"},
            {"name":"投资性资产","ref":"投资性资产"},
            {"name":"存放央行","ref":"存放央行"},
            {"name":"其他","ref":"其他投资"}]},
        "chart2":{"type":"bar","title":"主要资产负债规模(亿元)","data":[
            {"name":"总资产","ref":"总资产"},
            {"name":"总负债","ref":"总负债"},
            {"name":"贷款","ref":"贷款"},
            {"name":"存款","ref":"存款"},
            {"name":"投资性资产","ref":"投资性资产"}]}
    },
    "02":{
        "sheet":"02-损益简表(14个)","title":"损益简表","subtitle":"主要经营监管指标",
        "start":4,
        "cols":{"no":0,"name":1,"unit":2,"kaohe":3,"jianguan":None,"lei":None,"xiang":None},
        "order":["no","name","unit","kaohe","actual","budget_actual","trend","rate","year_budget","progress"],
        "kpi":[0,9,11,13],
        "chart":{"type":"composition","title":"收入结构占比","data":[
            {"name":"利息净收入","ref":"利息净收入"},
            {"name":"投资收益","ref":"投资收益"},
            {"name":"公允价值变动净收益","ref":"公允价值变动净收益"},
            {"name":"手续费佣金","ref":"其中：手续费及佣金净收入"},
            {"name":"其他","ref":"非利息净收入"}]},
        "chart2":{"type":"waterfall","title":"利润形成路径(亿元)","data":[
            {"name":"营业收入","ref":"营业收入"},
            {"name":"业务及管理费","ref":"业务及管理费","neg":True},
            {"name":"减值损失","ref":"减值价值损失","neg":True},
            {"name":"税前利润","ref":"税前利润"},
            {"name":"所得税","ref":"所得税","neg":True},
            {"name":"净利润","ref":"净利润"}]}
    },
    "03":{
        "sheet":"03-关键监测指标(21个)","title":"关键监测指标","subtitle":"主要经营监管指标",
        "start":4,
        "cols":{"no":1,"name":2,"unit":3,"kaohe":4,"jianguan":5,"lei":0,"xiang":None},
        "order":["lei","no","name","unit","kaohe","jianguan","actual","budget_actual","trend","rate","year_budget","progress"],
        "kpi":[11,4,5,9],
        "chart":{"type":"gauge","title":"资本充足率(监管线≥10.5%)","ref":"资本充足率","min":8,"max":16,"threshold":10.5},
        "chart2":{"type":"bar","title":"监管指标达标对比(实际 vs 监管要求)","data":[
            {"name":"流动性覆盖率","ref":"流动性覆盖率","threshold":100},
            {"name":"拨备覆盖率","ref":"拨备覆盖率","threshold":150},
            {"name":"资本充足率","ref":"资本充足率","threshold":10.5},
            {"name":"一级资本充足率","ref":"一级资本充足率","threshold":8.5},
            {"name":"核心一级资本充足率","ref":"核心一级资本充足率","threshold":7.5}]}
    },
    "04":{
        "sheet":"04-收入结构（21个）","title":"收入结构","subtitle":"主要经营监管指标",
        "start":4,
        "cols":{"no":2,"name":3,"unit":4,"kaohe":5,"jianguan":None,"lei":0,"xiang":1},
        "order":["lei","xiang","no","name","unit","kaohe","actual","budget_actual","trend","rate","year_budget","progress"],
        "kpi":[0,9,12,18],
        "chart":{"type":"composition","title":"条线营业收入占比","data":[
            {"name":"公司条线","ref":"公司条线营业收入"},
            {"name":"零售条线","ref":"零售条线营业收入"},
            {"name":"金融市场","ref":"金融市场-营业收入"},
            {"name":"司库","ref":"司库营业收入"}]},
        "chart2":{"type":"bar","title":"条线营业收入对比(亿元)","data":[
            {"name":"公司条线","ref":"公司条线营业收入"},
            {"name":"零售条线","ref":"零售条线营业收入"},
            {"name":"金融市场","ref":"金融市场-营业收入"},
            {"name":"司库","ref":"司库营业收入"}]}
    },
    "05":{
        "sheet":"05-成本结构（18个）","title":"成本结构","subtitle":"",
        "start":3,
        "cols":{"no":2,"name":3,"unit":4,"kaohe":None,"jianguan":None,"lei":0,"xiang":1},
        "order":["lei","xiang","no","name","unit","actual","budget_actual","trend","rate","year_budget","progress"],
        "kpi":[0,6,12,4],
        "chart":{"type":"composition","title":"条线成本占比","data":[
            {"name":"公司条线","ref":"公司条线成本合计"},
            {"name":"零售条线","ref":"零售条线成本合计"},
            {"name":"金融市场","ref":"金融市场条线成本合计"}]},
        "chart2":{"type":"bar","title":"条线EVA对比(亿元)","data":[
            {"name":"公司金融-EVA","ref":"公司金融-EVA"},
            {"name":"零售金融-EVA","ref":"零售金融-EVA"},
            {"name":"金融市场-EVA","ref":"金融市场-EVA"}]}
    },
    "06":{
        "sheet":"06-存贷结构(26个)","title":"存贷结构","subtitle":"主要经营监管指标",
        "start":4,
        "cols":{"no":2,"name":3,"unit":4,"kaohe":5,"jianguan":None,"lei":0,"xiang":1},
        "order":["lei","xiang","no","name","unit","kaohe","actual","budget_actual","trend","rate","year_budget","progress"],
        "kpi":[0,5,8,14],
        "chart":{"type":"composition","title":"存款结构占比","data":[
            {"name":"公司条存款","ref":"公司条存款规模"},
            {"name":"个人条存款","ref":"个人条存款规模"},
            {"name":"其他","ref":"存款规模（全行）"}]},
        "chart2":{"type":"bar","title":"存贷规模对比(亿元)","data":[
            {"name":"存款规模","ref":"存款规模（全行）"},
            {"name":"AUM日均","ref":"全行AUM日均余额"},
            {"name":"存款日均","ref":"存款日均（全行）"},
            {"name":"公司贷款投放","ref":"公司-贷款投放额"},
            {"name":"零售贷款投放","ref":"零售-贷款投放额"}]}
    },
    "07":{
        "sheet":"07-资产质量结构(15个)","title":"资产质量结构","subtitle":"",
        "start":3,
        "cols":{"no":2,"name":3,"unit":4,"kaohe":None,"jianguan":None,"lei":0,"xiang":1},
        "order":["lei","xiang","no","name","unit","actual","budget_actual","trend","rate","year_budget","progress"],
        "kpi":[6,12,13,14],
        "chart":{"type":"trend","title":"收益率与付息率趋势(%)","categories":["Q1","Q2","Q3","Q4"],
            "series":[
                {"name":"生息资产收益率","base":4.25},
                {"name":"付息负债付息率","base":2.10},
                {"name":"净息差","base":2.15}]},
        "chart2":{"type":"bar","title":"利差与收益率对比(%)","data":[
            {"name":"生息资产收益率","ref":"生息资产收益率"},
            {"name":"付息负债付息率","ref":"付息负债付息率"},
            {"name":"存贷款利差","ref":"存贷款利差"},
            {"name":"净息差","ref":"净息差"},
            {"name":"存款付息率","ref":"存款付息率"}]}
    },
    "08":{
        "sheet":"08-客群结构(10个)","title":"客群结构","subtitle":"主要经营监管指标",
        "start":4,
        "cols":{"no":2,"name":3,"unit":4,"kaohe":5,"jianguan":None,"lei":0,"xiang":1},
        "order":["lei","xiang","no","name","unit","kaohe","actual","budget_actual","trend","rate","year_budget","progress"],
        "kpi":[0,4,7,8],
        "chart":{"type":"composition","title":"客群结构占比","data":[
            {"name":"零售客户","ref":"零售客户数"},
            {"name":"手机银行","ref":"手机银行客户数"},
            {"name":"掌E贷用户","ref":"掌E贷用户数"},
            {"name":"信用卡客户","ref":"信用卡客户数"}]},
        "chart2":{"type":"bar","title":"客群规模对比(万)","data":[
            {"name":"零售客户","ref":"零售客户数"},
            {"name":"手机银行","ref":"手机银行客户数"},
            {"name":"掌E贷用户","ref":"掌E贷用户数"},
            {"name":"信用卡客户","ref":"信用卡客户数"}]}
    },
    "09":{
        "sheet":"09-资产质量(14个)","title":"资产质量","subtitle":"主要经营监管指标",
        "start":4,
        "cols":{"no":1,"name":2,"unit":3,"kaohe":4,"jianguan":None,"lei":0,"xiang":None},
        "order":["lei","no","name","unit","kaohe","actual","budget_actual","trend","rate","year_budget","progress"],
        "kpi":[0,8,12,13],
        "chart":{"type":"trend","title":"不良率与拨备覆盖率趋势(%)","categories":["Q1","Q2","Q3","Q4"],
            "series":[
                {"name":"不良贷款率","base":1.58},
                {"name":"拨备覆盖率","base":185.6}]},
        "chart2":{"type":"bar","title":"资产质量指标对比","data":[
            {"name":"不良贷款率","ref":"不良贷款率"},
            {"name":"关注贷款率","ref":"关注贷款率"},
            {"name":"逾期贷款率","ref":"逾期贷款率"},
            {"name":"小不不良贷款率","ref":"小不不良贷款率"}]}
    },
}

# 表头定义：headers = [level1, level2]; 每个 cell {l:label, r:rowspan, c:colspan}
HEADERS = {
    "01":[
        [{"l":"序号","r":2},{"l":"指标名称","r":2},{"l":"单位","r":2},{"l":"2025年实际","r":2},{"l":"预算末","c":3},{"l":"全年预算","r":2},{"l":"预算进度","r":2}],
        [{"l":"实际"},{"l":"同比(%)"},{"l":"预算率(%)"}]
    ],
    "02":[
        [{"l":"序号","r":2},{"l":"指标名称","r":2},{"l":"单位","r":2},{"l":"是否考核","r":2},{"l":"2025年实际","r":2},{"l":"预算末","c":3},{"l":"全年预算","r":2},{"l":"预算进度","r":2}],
        [{"l":"实际"},{"l":"同比(%)"},{"l":"预算率(%)"}]
    ],
    "03":[
        [{"l":"指标类","r":2},{"l":"序号","r":2},{"l":"指标名称","r":2},{"l":"单位","r":2},{"l":"是否考核","r":2},{"l":"监管要求","r":2},{"l":"2025年实际","r":2},{"l":"预算末","c":3},{"l":"全年预算","r":2},{"l":"预算进度","r":2}],
        [{"l":"实际"},{"l":"同比(%)"},{"l":"预算率(%)"}]
    ],
    "04":[
        [{"l":"指标类","r":2},{"l":"指标项","r":2},{"l":"序号","r":2},{"l":"指标名称","r":2},{"l":"单位","r":2},{"l":"是否考核","r":2},{"l":"2025年实际","r":2},{"l":"预算末","c":3},{"l":"全年预算","r":2},{"l":"预算进度","r":2}],
        [{"l":"实际"},{"l":"同比(%)"},{"l":"预算率(%)"}]
    ],
    "05":[
        [{"l":"指标类","r":2},{"l":"指标项","r":2},{"l":"序号","r":2},{"l":"指标名称","r":2},{"l":"单位","r":2},{"l":"2025年实际","r":2},{"l":"预算末","c":3},{"l":"全年预算","r":2},{"l":"预算进度","r":2}],
        [{"l":"实际"},{"l":"同比(ppt)"},{"l":"预算率(ppt)"}]
    ],
    "06":[
        [{"l":"指标类","r":2},{"l":"指标项","r":2},{"l":"序号","r":2},{"l":"指标名称","r":2},{"l":"单位","r":2},{"l":"是否考核","r":2},{"l":"2025年实际","r":2},{"l":"预算末","c":3},{"l":"全年预算","r":2},{"l":"预算进度","r":2}],
        [{"l":"实际"},{"l":"同比(%)"},{"l":"预算率(%)"}]
    ],
    "07":[
        [{"l":"指标类","r":2},{"l":"指标项","r":2},{"l":"序号","r":2},{"l":"指标名称","r":2},{"l":"单位","r":2},{"l":"2025年实际","r":2},{"l":"预算末","c":3},{"l":"全年预算","r":2},{"l":"预算进度","r":2}],
        [{"l":"实际"},{"l":"同比(ppt)"},{"l":"预算率(ppt)"}]
    ],
    "08":[
        [{"l":"指标类","r":2},{"l":"指标项","r":2},{"l":"序号","r":2},{"l":"指标名称","r":2},{"l":"单位","r":2},{"l":"是否考核","r":2},{"l":"2025年实际","r":2},{"l":"预算末","c":3},{"l":"全年预算","r":2},{"l":"预算进度","r":2}],
        [{"l":"实际"},{"l":"同比(%)"},{"l":"预算率(%)"}]
    ],
    "09":[
        [{"l":"指标类","r":2},{"l":"序号","r":2},{"l":"指标名称","r":2},{"l":"单位","r":2},{"l":"是否考核","r":2},{"l":"2025年实际","r":2},{"l":"预算末","c":3},{"l":"全年预算","r":2},{"l":"预算进度","r":2}],
        [{"l":"实际"},{"l":"同比(%)"},{"l":"预算率(%)"}]
    ],
}

def js_str(s):
    return '"' + s.replace('\\','\\\\').replace('"','\\"').replace('\n','\\n') + '"'

def build_rows(key, cfg):
    """解析 Excel 行，生成 rows（含示例数据值）和 indicators 索引"""
    sheet_data = DATA[cfg["sheet"]]
    raw = sheet_data["rows"]
    start = cfg["start"]
    cols = cfg["cols"]
    order = cfg["order"]
    indicators = []  # [{name, unit, actual, trend, rate, year_budget, ...}]
    rows = []
    for r in raw[start:]:
        # 跳过全空行
        if not any((c or '').strip() for c in r):
            continue
        name = (r[cols["name"]] or '').strip() if cols.get("name") is not None else ''
        if not name:
            continue
        no = (r[cols["no"]] or '').strip() if cols.get("no") is not None else str(len(indicators)+1)
        unit = (r[cols["unit"]] or '').strip() if cols.get("unit") is not None else ''
        kaohe = (r[cols["kaohe"]] or '').strip() if cols.get("kaohe") is not None else ''
        jianguan = (r[cols["jianguan"]] or '').strip() if cols.get("jianguan") is not None else ''
        lei = (r[cols["lei"]] or '').strip() if cols.get("lei") is not None else ''
        xiang = (r[cols["xiang"]] or '').strip() if cols.get("xiang") is not None else ''
        # 清理 \n
        for v in [no,name,unit,kaohe,jianguan,lei,xiang]:
            pass
        kaohe = kaohe.replace('\n','')
        jianguan = jianguan.replace('\n','')
        actual, trend, rate, year_budget = gen_val(name, unit)
        budget_actual = actual
        progress = rate
        actual_s = fmt_num(actual, unit)
        budget_actual_s = fmt_num(budget_actual, unit)
        year_budget_s = fmt_num(year_budget, unit)
        trend_s = f"{trend:+.1f}%"
        rate_s = f"{rate:.1f}%"
        progress_s = f"{progress:.1f}%"
        # 按 order 组装行
        row = []
        for col in order:
            if col == "no": row.append(no)
            elif col == "name": row.append(name)
            elif col == "unit": row.append(unit)
            elif col == "kaohe": row.append(kaohe)
            elif col == "jianguan": row.append(jianguan)
            elif col == "lei": row.append(lei)
            elif col == "xiang": row.append(xiang)
            elif col == "actual": row.append(actual_s)
            elif col == "budget_actual": row.append(budget_actual_s)
            elif col == "trend": row.append(trend_s)
            elif col == "rate": row.append(rate_s)
            elif col == "year_budget": row.append(year_budget_s)
            elif col == "progress": row.append(progress_s)
        rows.append(row)
        indicators.append({
            "name":name,"unit":unit,"kaohe":kaohe,"jianguan":jianguan,
            "actual":actual,"trend":trend,"rate":rate,"year_budget":year_budget,
            "actual_s":actual_s,"trend_s":trend_s,"rate_s":rate_s,
            "year_budget_s":year_budget_s
        })
    return rows, indicators

def find_indicator(indicators, name):
    for ind in indicators:
        if ind["name"] == name:
            return ind
    return None

def build_chart(chart_cfg, indicators):
    """根据 chart 配置生成实际 chart 对象（值从 indicators 取）"""
    t = chart_cfg["type"]
    if t == "composition":
        data = []
        for d in chart_cfg["data"]:
            ind = find_indicator(indicators, d["ref"])
            v = ind["actual"] if ind else 0
            data.append({"name":d["name"],"value":round(v,2)})
        return {"type":"composition","title":chart_cfg["title"],"data":data}
    if t == "bar":
        data = []
        for d in chart_cfg["data"]:
            ind = find_indicator(indicators, d["ref"])
            v = ind["actual"] if ind else 0
            item = {"name":d["name"],"value":round(v,2)}
            if "threshold" in d:
                item["threshold"] = d["threshold"]
            data.append(item)
        return {"type":"bar","title":chart_cfg["title"],"data":data}
    if t == "gauge":
        ind = find_indicator(indicators, chart_cfg["ref"])
        v = ind["actual"] if ind else 0
        return {"type":"gauge","title":chart_cfg["title"],"value":round(v,2),
                "min":chart_cfg["min"],"max":chart_cfg["max"],"threshold":chart_cfg["threshold"]}
    if t == "waterfall":
        data = []
        for d in chart_cfg["data"]:
            ind = find_indicator(indicators, d["ref"])
            v = ind["actual"] if ind else 0
            item = {"name":d["name"],"value":round(v,2)}
            if d.get("neg"): item["isIntermediate"]=True
            data.append(item)
        # 最后一个标记为 total
        if data:
            data[-1]["isTotal"]=True
            for d in data[:-1]:
                if "isIntermediate" not in d:
                    d["isIntermediate"]=True
        return {"type":"waterfall","title":chart_cfg["title"],"data":data}
    if t == "trend":
        series = []
        for s in chart_cfg["series"]:
            base = s["base"]
            data = [round(base*(0.95+0.02*i)+(i*0.03-0.04),2) for i in range(4)]
            series.append({"name":s["name"],"data":data})
        return {"type":"trend","title":chart_cfg["title"],"categories":chart_cfg["categories"],"series":series}
    return chart_cfg

def build_kpi(cfg, indicators):
    kpi = []
    for idx in cfg["kpi"]:
        if idx >= len(indicators): continue
        ind = indicators[idx]
        trend_dir = "up" if ind["trend"] > 0 else ("down" if ind["trend"]<0 else "flat")
        # 比率类指标方向特殊处理：不良率下降为好，但这里统一按数值方向
        kpi.append({
            "label":ind["name"],
            "value":ind["actual_s"],
            "unit":ind["unit"],
            "trend":ind["trend_s"],
            "dir":trend_dir,
            "type":""
        })
    return kpi

# 生成 JS
out = []
out.append("/* 自动生成 - 严格对齐 Excel sheet 名与指标名称 */")
out.append("const SHEETS = {")
for key, cfg in CONFIG.items():
    rows, indicators = build_rows(key, cfg)
    kpi = build_kpi(cfg, indicators)
    chart = build_chart(cfg["chart"], indicators)
    chart2 = build_chart(cfg["chart2"], indicators)
    headers = HEADERS[key]
    # subtitle 标签
    tag = cfg["subtitle"] if cfg["subtitle"] else "指标体系"
    out.append(f'  {js_str(key)}:{{')
    out.append(f'    name:{js_str(cfg["sheet"])},')
    out.append(f'    title:{js_str(cfg["title"])},')
    out.append(f'    subtitle:{js_str(cfg["subtitle"])},')
    out.append(f'    tag:{js_str(tag)},')
    out.append(f'    count:{len(indicators)},')
    # kpi
    kpi_js = ",".join(
        '{label:'+js_str(k["label"])+',value:'+js_str(k["value"])+',unit:'+js_str(k["unit"])+
        ',trend:'+js_str(k["trend"])+',dir:'+js_str(k["dir"])+',type:'+js_str(k["type"])+'}'
        for k in kpi)
    out.append(f'    kpi:[{kpi_js}],')
    # headers
    def hdr_js(h):
        parts = ['l:'+js_str(h["l"])]
        if "r" in h: parts.append(f'r:{h["r"]}')
        if "c" in h: parts.append(f'c:{h["c"]}')
        return '{'+','.join(parts)+'}'
    h_js = ",".join("["+",".join(hdr_js(h) for h in lvl)+"]" for lvl in headers)
    out.append(f'    headers:[{h_js}],')
    # rows
    rows_js = ",".join("["+",".join(js_str(c) for c in row)+"]" for row in rows)
    out.append(f'    rows:[{rows_js}],')
    # chart
    def chart_js(ch):
        parts = ['type:'+js_str(ch["type"]),'title:'+js_str(ch["title"])]
        if ch["type"]=="composition":
            parts.append('data:['+",".join('{name:'+js_str(d["name"])+',value:'+str(d["value"])+'}' for d in ch["data"])+']')
        elif ch["type"]=="bar":
            ditems=[]
            for d in ch["data"]:
                it='{name:'+js_str(d["name"])+',value:'+str(d["value"])
                if "threshold" in d: it+=',threshold:'+str(d["threshold"])
                it+='}'
                ditems.append(it)
            parts.append('data:['+",".join(ditems)+']')
        elif ch["type"]=="gauge":
            parts.append('value:'+str(ch["value"]))
            parts.append('min:'+str(ch["min"]))
            parts.append('max:'+str(ch["max"]))
            parts.append('threshold:'+str(ch["threshold"]))
        elif ch["type"]=="waterfall":
            ditems=[]
            for d in ch["data"]:
                it='{name:'+js_str(d["name"])+',value:'+str(d["value"])
                if d.get("isIntermediate"): it+=',isIntermediate:true'
                if d.get("isTotal"): it+=',isTotal:true'
                it+='}'
                ditems.append(it)
            parts.append('data:['+",".join(ditems)+']')
        elif ch["type"]=="trend":
            parts.append('categories:['+",".join(js_str(c) for c in ch["categories"])+']')
            sitems=[]
            for s in ch["series"]:
                sitems.append('{name:'+js_str(s["name"])+',data:['+",".join(str(x) for x in s["data"])+']}')
            parts.append('series:['+",".join(sitems)+']')
        return '{'+",".join(parts)+'}'
    out.append(f'    chart:{chart_js(chart)},')
    out.append(f'    chart2:{chart_js(chart2)}')
    out.append('  },')
out.append("};")

result = "\n".join(out)
with open('sheets_data.js','w',encoding='utf-8') as f:
    f.write(result)
print("Generated sheets_data.js, length:", len(result))
print("Sheets:", len(CONFIG))
