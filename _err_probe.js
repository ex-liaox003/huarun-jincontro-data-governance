/* 捕获页面加载期 JS 错误（head 内 error 监听器） */
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
let src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
src = src.replace(
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>',
  '<script>window.Chart=function(el,cfg){this.canvas=el;this.config=cfg;this.data=cfg.data;this.destroy=function(){};};Chart.instances={};</script>'
);
const errTrap = "<script>window.__LERR=[];window.addEventListener('error',function(e){" +
  "document.title='LOADERR::'+e.message+' @ '+(e.filename||'').split('/').pop()+':'+e.lineno;" +
  "},true);</script>";
src = src.replace("</head>", errTrap + "</head>");
const tmp = path.join(__dirname, "_err_probe.html");
fs.writeFileSync(tmp, src, "utf8");
const out = execFileSync(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--virtual-time-budget=5000",
  "--timeout=20000", "--dump-dom", "file:///" + tmp.split(path.sep).join("/")
], { encoding: "utf8", maxBuffer: 268435456, timeout: 60000 });
const m = out.match(/<title>(LOADERR::[^<]*)<\/title>/);
console.log(m ? m[1].replace(/&amp;/g, "&") : "NO LOAD ERROR");
fs.unlinkSync(tmp);
