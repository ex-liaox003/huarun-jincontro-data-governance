import openpyxl
wb = openpyxl.load_workbook('金控战略部银行指标体系模板.xlsx', data_only=True)
print('sheets:', wb.sheetnames)
# show first 4 rows of sheet 04 (收入结构) and 01 to see column order
for sn in wb.sheetnames[:4]:
    ws = wb[sn]
    print('====', repr(sn))
    for i, row in enumerate(ws.iter_rows(min_row=1, max_row=5, values_only=True)):
        vals = [('' if v is None else str(v).replace('\n','\\n')) for v in row[:14]]
        print(i+1, vals)
