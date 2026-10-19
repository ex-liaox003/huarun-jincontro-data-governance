const fs=require('fs');
const p='d:/LIAOXIA/work-2026/AI-test/华润-战略部数据应用-LAB/战略部数据应用平台.html';
let h=fs.readFileSync(p,'utf8');
const len0=h.length;

// 1. 删除内联 SHEETS 块（从 'const SHEETS = {' 到顶层 '\n};'）
const reSheet=/const SHEETS = \{[\s\S]*?\n\};\n/;
if(!reSheet.test(h)){console.log('ERROR: SHEETS block not matched');process.exit(1);}
h=h.replace(reSheet, '/* SHEETS 数据已抽离至 sheets_data.js（自动生成，严格对齐 Excel）*/\n');

// 2. 在主 <script> 前引入 sheets_data.js（主 script 以 <script> 紧跟 /* ==== 开头）
const reScript=/<script>\n\/\* =====/;
if(!reScript.test(h)){console.log('ERROR: main script tag not matched');process.exit(1);}
h=h.replace(reScript, '<script src="sheets_data.js"></script>\n<script>\n/* =====');

fs.writeFileSync(p,h);
console.log('OK before='+len0+' after='+h.length+' deleted='+(len0-h.length));
