// ⚔️ THE LAST MILE'S SECOND RACE — what did it actually cost, per class?
// Reports the band split, the duel win rate, and (⚠️ required) the same run at UNSEEN_WEIGHT = 0,
// because a bot policy can invert what you measure.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');

const N = +(process.argv[2] || 120);

function batch(cls, weight) {
  // tolerate the pre-change build so a before/after runs the same script
  if (sandbox.RUNSIM.setUnseenWeight) sandbox.RUNSIM.setUnseenWeight(weight);
  const band = { unseen: 0, even: 0, heard: 0 }, res = { Complete: 0, Narrow: 0, Loss: 0 };
  let duels = 0, wins = 0, beats = 0, rouseDmg = 0, reached = 0;
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(9000 + i);
    let lm = null;
    sandbox.RUNSIM.setHook({
      onAssign() {
        const S = getS();
        if (S.finalPhase !== 'lastmile' || lm) return;
        const r = sandbox.computeAction(null);
        if (r) lm = { band: r.lastMile || 'even', rouse: r.rouse || 0 };
      },
    });
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    res.Complete += m.res.Complete; res.Narrow += m.res.Narrow; res.Loss += m.res.Loss;
    if (lm) { reached++; band[lm.band]++; rouseDmg += lm.rouse; }
    if (m.win !== null) { duels++; if (m.win) wins++; beats += m.duelBeats; }
  }
  const tot = res.Complete + res.Narrow + res.Loss || 1;
  const rb = n => reached ? Math.round(100 * n / reached) : 0;
  return {
    C: Math.round(100 * res.Complete / tot), L: Math.round(100 * res.Loss / tot),
    duel: duels ? Math.round(100 * wins / duels) : 0,
    beats: duels ? +(beats / duels).toFixed(1) : 0,
    bands: `unseen ${rb(band.unseen)}% · even ${rb(band.even)}% · heard ${rb(band.heard)}%`,
    avgRouse: reached ? +(rouseDmg / reached).toFixed(1) : 0,
    reachedLair: Math.round(100 * reached / N),
  };
}

for (const cls of ['mage', 'rogue']) {
  for (const w of [3, 0]) {
    const b = batch(cls, w);
    console.log(`${cls.padEnd(6)} UNSEEN_WEIGHT=${w}  ${b.C}C ${b.L}L · duel ${b.duel}% (${b.beats} beats) · reached lair ${b.reachedLair}%`);
    console.log(`       ${b.bands}   avg rouse dmg ${b.avgRouse}`);
  }
}
