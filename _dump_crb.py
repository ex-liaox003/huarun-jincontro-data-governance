# -*- coding: utf-8 -*-
import openpyxl, json, io
from collections import Counter
wb=openpyxl.load_workbook('华润金控-战略部指标表.xlsx', data_only=True)
ws=wb['华润银行']
grid=[]
for r in ws.iter_rows(values_only=True):
    grid.append([('' if c is None else str(c).strip()) for c in r])
io.open('_crb.json','w',encoding='utf-8').write(json.dumps(grid,ensure_ascii=False))
c1=Counter()
for r in grid[3:]:
    if len(r)<20 or not r[10]: continue
    c1[(r[6],r[7])]+=1
with io.open('_crb_stat.txt','w',encoding='utf-8') as f:
    f.write('rows %d\n'%len(grid))
    for k,v in sorted(c1.items()):
        f.write('%s | %s = %d\n'%(k[0],k[1],v))
print('ok')
