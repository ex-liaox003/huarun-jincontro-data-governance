// 验证：03-关键监测指标 更新频率=季度、数据日期下拉为 Q1~Q4（最小 DOM 桩 + vm 跑页面脚本）
const fs = require('fs'), vm = require('vm');
const dir = __dirname;

function makeEl(tag) {
  const el = {
    tagName: tag, dataset: {}, children: [], style: {},
    innerHTML: '', textContent: '', type: '', value: '', parentNode: null, disabled: false,
    classList: {
      _s: new Set(),
      add(...cs) { cs.forEach(c => this._s.add(c)); },
      remove(...cs) { cs.forEach(c => this._s.delete(c)); },
      toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; },
      contains(c) { return this._s.has(c); }
    },
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    addEventListener() {},
    setAttribute(k, v) { (this._attrs || (this._attrs = {}))[k] = String(v); },
    getAttribute(k) { return this._attrs && k in this._attrs ? this._attrs[k] : null; },
    getBoundingClientRect() { return { top: 0 }; },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  return el;
}
const registry = {};
const document = {
  getElementById: id => registry[id] || (registry[id] = makeEl('div')),
  createElement: t => makeEl(t),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  body: makeEl('body')
};
const window = { scrollTo() {}, pageYOffset: 0, innerWidth: 1400, innerHeight: 900 };
const ctx = { document, window, console, setTimeout, clearTimeout };
vm.createContext(ctx);
['sheets_data.js', 'asset_sheets_data.js', 'trust_sheets_data.js', 'insurance_sheets_data.js',
 'lease_sheets_data.js', 'cockpit_data.js', 'indicator_standard_data.js']
  .forEach(f => vm.runInContext(fs.readFileSync(dir + '/' + f, 'utf8'), ctx));
const html = fs.readFileSync(dir + '/战略部数据应用平台.html', 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
vm.runInContext(script, ctx);

let fail = 0;
const check = (name, ok, extra) => { console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  [' + extra + ']' : '')); if (!ok) fail++; };

const p03 = registry['content'].children.find(c => c.id === 'panel-03');
const p01 = registry['content'].children.find(c => c.id === 'panel-01');
const h03 = p03 ? p03.innerHTML : '';
const h01 = p01 ? p01.innerHTML : '';
const freq03 = (h03.match(/query-freq-value">([^<]+)</) || [])[1];
const freq01 = (h01.match(/query-freq-value">([^<]+)</) || [])[1];
const month03 = (h03.match(/data-part="month"[^>]*>(.*?)<\/select>/) || [])[1] || '';
const month01 = (h01.match(/data-part="month"[^>]*>(.*?)<\/select>/) || [])[1] || '';
const opts03 = (month03.match(/>(Q\d|\d+月)</g) || []).map(s => s.slice(1, -1));
const opts01 = (month01.match(/>(Q\d|\d+月)</g) || []).map(s => s.slice(1, -1));

check('03 更新频率显示「季度」', freq03 === '季度', String(freq03));
check('03 数据日期下拉为 Q1~Q4', JSON.stringify(opts03) === JSON.stringify(['Q1', 'Q2', 'Q3', 'Q4']), opts03.join(','));
check('03 季度取值=季末月(3/6/9/12) 且默认 Q4', /value="3"/.test(month03) && /value="6"/.test(month03) && /value="9"/.test(month03) && /value="12" selected/.test(month03));
check('01 仍为月度+1~12月（未受影响）', freq01 === '月度' && opts01.length === 12 && opts01[0] === '1月', freq01 + ' ' + opts01.length + '项');
process.exit(fail ? 1 : 0);
