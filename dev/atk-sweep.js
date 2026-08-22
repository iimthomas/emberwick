// ⚔️ HOW MUCH HARDER SHOULD THE ROAD HIT? Watch BOTH halves: does the deck become a bar, and
// what does it do to arrival vs par (which is the dragons' difficulty, for free).
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 160);
function run(mult, cls) {
  setTunable('FOE_ATK_MULT', mult);
  let runs = 0, start = 0, minS = 0, lair = 0, trash = 0, dip = 0, C = 0, tot = 0, duels = 0, wins = 0;
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(5100 + i);
    let s0 = null, mn = 1e9, lairLv = null;
    const lv = () => { const S = getS(); return [...S.hand, ...S.deck, ...S.discard].reduce((a,c)=>a+c.level,0); };
    sandbox.RUNSIM.setHook({
      onAssign() { const S = getS(); if (S.finalMode) return; if (s0===null) s0=lv(); const n=lv(); if(n<mn) mn=n; },
      onLair() { lairLv = lv(); } });
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS(); runs++; start += s0||32; minS += mn===1e9?(s0||32):mn; lair += lairLv||lv();
    trash += S.trashed.length; if (mn < (s0||32)) dip++;
    C += m.res.Complete; tot += m.res.Complete+m.res.Narrow+m.res.Loss;
    if (m.win !== null) { duels++; if (m.win) wins++; }
  }
  const d = n => n/(runs||1);
  return { start: d(start).toFixed(0), min: d(minS).toFixed(1), lair: d(lair).toFixed(1),
           net: (d(lair)-d(start)).toFixed(1), trash: d(trash).toFixed(1),
           dip: Math.round(100*dip/(runs||1)), C: Math.round(100*C/(tot||1)),
           duel: duels?Math.round(100*wins/duels):0 };
}
console.log('ATK    class   deck: start → lowest → lair    net    ever dipped   destroyed   road C%   duel%');
for (const m of [1.0, 1.3, 1.6, 2.0]) {
  for (const cls of ['mage','rogue']) {
    const r = run(m, cls);
    console.log(`×${m.toFixed(1)}  ${cls.padEnd(6)}  ${r.start} → ${r.min.padStart(4)} → ${r.lair.padStart(4)}          ${r.net.padStart(5)}    ${String(r.dip).padStart(3)}%        ${r.trash.padStart(4)}      ${String(r.C).padStart(3)}%     ${String(r.duel).padStart(3)}%`);
  }
}
setTunable('FOE_ATK_MULT', 1.0);
