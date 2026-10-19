/* panelName 测试：面板标题去「01-」前缀，菜单名保留数字前缀 */
const fs = require('fs');
const dir = 'd:/LIAOXIA/work-2026/AI-test/华润-战略部数据应用-LAB/';
const html = fs.readFileSync(dir + '战略部数据应用平台.html', 'utf8');
global.eval(fs.readFileSync(dir + 'sheets_data.js', 'utf8').replace(/\bconst\s+SHEETS\b/, 'var SHEETS'));

function sliceFn(name){
  const start = html.indexOf('function ' + name + '(');
  if(start < 0) throw new Error('not found: ' + name);
  let i = html.indexOf('{', start), depth = 0, j = i;
  for(; j < html.length; j++){
    if(html[j] === '{') depth++;
    else if(html[j] === '}'){ depth--; if(depth === 0) break; }
  }
  return html.slice(start, j + 1);
}
global.eval(sliceFn('menuName'));
global.eval(sliceFn('panelName'));

let pass = 0, fail = 0;
function check(name, cond, detail){
  if(cond){ pass++; console.log('  ✓ ' + name + ' -> ' + detail); }
  else{ fail++; console.log('  ✗ ' + name + ' -> ' + detail); }
}

console.log('=== panelName / menuName 测试 ===');
Object.keys(SHEETS).forEach(key=>{
  const s = SHEETS[key];
  const menu = menuName(s), panel = panelName(s);
  check(
    key + ' 面板标题无前缀数字 & 菜单保留数字',
    /^\d/.test(menu) && !/^\d/.test(panel) && panel.length > 0 && menu.indexOf(panel) >= 0,
    '菜单[' + menu + '] 面板[' + panel + ']'
  );
});
console.log('');
console.log(fail === 0 ? '=== 全部 ' + pass + ' 项测试通过 ===' : '=== ' + fail + ' 项失败 ===');
process.exit(fail === 0 ? 0 : 1);
