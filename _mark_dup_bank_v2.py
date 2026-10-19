# -*- coding: utf-8 -*-
"""金控&银行(风险+战略)(2)：补全同名重复标记 + 同义不同名指标标记。另存新文件。"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import openpyxl

SRC = '金控&银行指标梳理梳理表(金控风险+战略) (2).xlsx'
DST = '金控&银行指标梳理梳理表(金控风险+战略) (2)-重复标记.xlsx'
SHEET = '银行指标'
COL_B, COL_C, COL_J = 2, 3, 10   # 是否重复 / 重复名称 / 指标名称

wb = openpyxl.load_workbook(SRC)
ws = wb[SHEET]

def clean(v):
    s = str(v or '')
    for ch in (' ', '　', '\n', '\r'):
        s = s.replace(ch, '')
    return s

# 1. 同名重复组
groups = {}
for r in range(4, ws.max_row + 1):
    n = clean(ws.cell(r, COL_J).value)
    if n:
        groups.setdefault(n, []).append(r)
dup_groups = {n: rs for n, rs in groups.items() if len(rs) > 1}

same_new = []   # 本次新标的同名行
for n, rs in dup_groups.items():
    for r in rs:
        if str(ws.cell(r, COL_B).value or '').strip() != '是':
            same_new.append(r)
        ws.cell(r, COL_B).value = '是'
        cur = str(ws.cell(r, COL_C).value or '').strip()
        if not cur:                     # 空则填重复名称；已有值(含别名)保留
            ws.cell(r, COL_C).value = n

# 2. 同义不同名（业务含义一致，人工确认后的高置信组）
#    (行A, 行B, A的C值, B的C值)；None 表示只标单向指向
SYNONYMS = [
    (178, None, '营业收入', None),        # 营业额(本月数) = 营业收入(行181,同板块同口径)
    (268, None, '营业收入', None),        # 全行营收(本年累计) = 营业收入(行205)
    (323, None, '存款', None),            # 存款余额（全行）= 存款(行190/248)
    (13, 355, '非同业单一客户集中度', '非同业单一客户贷款集中度'),   # 互为别名
    (186, 290, '资本利润率', 'ROE'),      # ROE = 资本利润率(净利润/平均资本净额)
    (256, 280, '全行非息收入', '非息净收入'),  # 非息净收入 = 全行非息收入(定义一致)
]
syn_new = []
for ra, rb, ca, cb in SYNONYMS:
    ws.cell(ra, COL_B).value = '是'
    if not str(ws.cell(ra, COL_C).value or '').strip():
        ws.cell(ra, COL_C).value = ca
    syn_new.append(ra)
    if rb is not None:
        ws.cell(rb, COL_B).value = '是'
        if not str(ws.cell(rb, COL_C).value or '').strip():
            ws.cell(rb, COL_C).value = cb
        syn_new.append(rb)

wb.save(DST)
total_yes = sum(1 for r in range(4, ws.max_row+1) if str(ws.cell(r, COL_B).value or '').strip() == '是')
print(f'同名重复组: {len(dup_groups)} 组 / {sum(len(v) for v in dup_groups.values())} 行')
print(f'本次新标同名列: {same_new}')
print(f'本次新标同义行: {sorted(syn_new)}')
print(f'B=是 总行数: {total_yes}')
