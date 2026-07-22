const { chromium } = require('playwright');
const { spawn } = require('child_process');
const APPDIR='/home/user/Fried.zookie/astrology'; const PORT=8931;
const EXE='/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
(async()=>{
  const srv=spawn('python3',['-m','http.server',String(PORT)],{cwd:APPDIR,stdio:'ignore'});
  await new Promise(r=>setTimeout(r,1300));
  const browser=await chromium.launch({executablePath:EXE});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(`http://127.0.0.1:${PORT}/index.html`,{waitUntil:'load'}); await page.waitForTimeout(700);
  const r = await page.evaluate(()=>{
    var fails=[];
    var L = APP.dignityLedger; if (!L) return {err:'dignityLedger not exposed'};
    // MC 28 Aries (lon 28), day -> Sun almuten (dom mars5, exalt sun4, tripl sun3, bound saturn2, face venus1) => Sun 7
    var a = L(28, true); // sign 0 (Aries) deg 28
    var scoreA = {}; function add(o,k,v){ if(k) o[k]=(o[k]||0)+v; }
    add(scoreA,a.domicile,5); add(scoreA,a.exaltation,4); add(scoreA,a.triplicity,3); add(scoreA,a.bound,2); add(scoreA,a.face,1);
    if (!(scoreA.sun===7)) fails.push('MC 28 Aries: expected sun=7, got '+JSON.stringify(scoreA)+' ledger='+JSON.stringify(a));
    // H12 19 Cancer (lon 90+19=109), day -> Jupiter almuten (moon5, jup4+2=6, venus3, mercury1)
    var b = L(109, true); // sign 3 (Cancer) deg 19
    var scoreB={}; add(scoreB,b.domicile,5); add(scoreB,b.exaltation,4); add(scoreB,b.triplicity,3); add(scoreB,b.bound,2); add(scoreB,b.face,1);
    if (!(scoreB.jupiter===6)) fails.push('H12 19 Cancer: expected jupiter=6, got '+JSON.stringify(scoreB)+' ledger='+JSON.stringify(b));
    // terms use only 5 non-luminaries: scan all 360 degrees, bound must never be sun/moon
    for (var d=0; d<360; d++){ var lg=L(d,true); if (lg.bound==='sun'||lg.bound==='moon') { fails.push('term at '+d+' is luminary: '+lg.bound); break; } }
    // faces DO include luminaries somewhere
    var faceHasLum=false; for (var d2=0; d2<360; d2+=1){ var lg2=L(d2,true); if (lg2.face==='sun'||lg2.face==='moon'){faceHasLum=true;break;} }
    if(!faceHasLum) fails.push('faces never include a luminary (should)');
    // dignityLedger at 0 Leo (lon 120): domicile sun, at 0 Leo exalt none, tripl fire day sun
    var c0=L(120,true); if(c0.domicile!=='sun') fails.push('0 Leo domicile != sun: '+c0.domicile);
    return {fails:fails, mcAries:a, h12Cancer:b};
  });
  if (r.err){ console.log('ERROR:', r.err); }
  else if (r.fails.length){ console.log('DOCTRINE FAILURES:'); r.fails.forEach(function(f){console.log('  - '+f);}); }
  else { console.log('DOCTRINE CHECK: ALL PASS'); console.log('  MC 28 Aries ledger:', JSON.stringify(r.mcAries)); console.log('  H12 19 Cancer ledger:', JSON.stringify(r.h12Cancer)); }
  await browser.close(); srv.kill();
})().catch(e=>{console.error(e);process.exit(1);});
