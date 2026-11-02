const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
let src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
src = src.replace(
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>',
  '<script src="_chart_umd.js"></script>'
);
const probe = `<script>
window.addEventListener('load',function(){
  try{ switchModule('leader'); }catch(e){}
});
</script>`;
const tmp = path.join(__dirname, "_shot_fin_v31.html");
fs.writeFileSync(tmp, src.replace(/<\/body>/i, probe + "</body>"), "utf8");
const shot = process.argv[2] || "_fin_v31_full.png";
execFileSync(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox",
  "--window-size=1500,4200", "--hide-scrollbars", "--virtual-time-budget=9000",
  "--screenshot=" + path.join(__dirname, shot),
  "file:///" + tmp.split(path.sep).join("/")
], { stdio: "inherit", timeout: 60000 });
fs.unlinkSync(tmp);
console.log("shot done:", shot);
