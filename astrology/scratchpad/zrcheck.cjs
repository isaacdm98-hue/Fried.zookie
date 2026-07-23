const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const GOLDEN = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'golden.json'), 'utf8')).charts;
const PORT = 8937;
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage();
  const perr = []; pg.on('pageerror', e => perr.push(e.message.slice(0,200)));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3000);
  const out = await pg.evaluate((GOLDEN) => {
    const res = {};
    for (const id of Object.keys(GOLDEN)) {
      const bb = GOLDEN[id].birth; if(!bb.timeKnown){res[id]='(no time)';continue;}
      APP.STATE.birth=bb; const c=APP.compute(bb,APP.STATE.settings); APP.STATE.chart=c;
      const z = APP.zodiacalReleasing(c,bb); if(!z){res[id]='null';continue;}
      // verify subs span-sum equals L1 span, in months
      const spanM = z.l1.years*12;
      const sumM = z.subs.reduce((a,s)=>a+(s.endAge-s.startAge)*12,0);
      const lb = z.subs.filter(s=>s.lb).map(s=>s.signName);
      res[id] = { spirit:z.spiritSignName, fortune:z.l1.fromFortune, l1:z.l1.signName+' ('+z.l1.years+'y) peak='+z.l1.peak, l2:z.l2.signName+' peak='+z.l2.peak+(z.l2.lb?' [LB]':''), subCount:z.subs.length, spanCheck:Math.abs(sumM-spanM)<0.01?'OK':('MISMATCH '+sumM+' vs '+spanM), lbFired:lb };
    }
    return res;
  }, GOLDEN);
  console.log('pageerrors:', perr.length ? perr : 'none');
  console.log(JSON.stringify(out,null,2));
  await b.close(); srv.kill();
})();
