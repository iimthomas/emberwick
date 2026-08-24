// 🎯 WHEN DOES A RUN BECOME DECIDED?
// Thomas: *"Have the solver play from mid-run states and report, per floor, how accurately it can
// predict the stage outcome. You want the floor where confidence crosses ~90%. If that's floor 6
// of 16, ten floors are theatre — and the fix is legibility, not danger."*
//
// 🔑 THE METHOD: snapshot the run at a floor, then replay from there K times with a different draw
// order. If every replay lands the same way, the outcome was already fixed and the remaining floors
// only *revealed* it. Confidence = how lopsided the replays are.
//
// ⚠️ WHAT IT MEASURES AND WHAT IT DOES NOT. A fresh shuffle isolates DRAW LUCK; it does not isolate
// player skill, because the bot plays its own policy every time. So "decided" here means *no draw
// could still change this* — the honest reading of the question, and a LOWER bound on how early a
// human's run is settled.
//
// 🔴 measure.js's `cloneS` COULD NOT BE REUSED. It deep-copies twelve named fields and shallow-
// copies the rest — and `map`, `armour`, `loot`, `trashed`, `potions`, `eventFlags` and six more
// have been added to the state since it was written. Every one would be SHARED BY REFERENCE, so a
// replay would mutate the snapshot it came from. 🔑 **A clone with a hand-maintained field list is
// a clone that silently rots.**
//
// 🔑 AND THE REPLAY DOES NOT FORK THE RUN LOOP. `measure.js` drives its own `while` loop, which is
// the thing this project has been burned by four times (four copies of the arrangement search).
// Instead the snapshot is restored *through* `freshGame`, so `RUNSIM.autoRun()` runs verbatim.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();

// ─── a faithful snapshot ────────────────────────────────────────────────────
// ⚠️ A SNAPSHOT IS STATE **AND** RANDOMNESS. `seed()` rewinds the stream to its start, so a
// replay that only restores `S` plays a different game from the same board — measured at 4 of 12
// divergences before the RNG position was captured too.
const snap = () => ({
  s: JSON.parse(JSON.stringify(S(), (k, v) => (v instanceof Set ? { __set: [...v] } : v))),
  rng: H.getRng(),
});
function restore(sn) {
  const o = JSON.parse(JSON.stringify(sn.s));
  (function fix(obj) {
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (v && typeof v === 'object') { if (v.__set) obj[k] = new Set(v.__set); else fix(v); }
    }
  })(o);
  // ⚠️ re-point `dragon` at the real DRAGONS row — the engine compares dragons by name in places
  // and the save layer re-resolves them; keeping one identity avoids a class of subtle drift.
  if (o.dragon) o.dragon = B.DRAGONS.find(d => d.name === o.dragon.name) || o.dragon;
  H.setS(o);
  H.setRng(sn.rng);
  return o;
}

// replay a snapshot to the end. `reshuffle` decides whether draw luck is re-rolled.
function replay(sn, seed, reshuffle) {
  const realFresh = B.freshGame;
  B.freshGame = () => {
    if (reshuffle) H.seed(seed);        // a DIFFERENT draw order: re-roll the stream
    const s = restore(sn);
    if (reshuffle) { H.setRng(seed);; s.deck = B.shuffle(s.deck.slice()); }
  };
  let win = null;
  try { const m = B.RUNSIM.autoRun(true); win = !!(m && m.win); }
  catch (e) { win = null; }
  finally { B.freshGame = realFresh; }
  return win;
}

module.exports = { snap, restore, replay };

// ═══ FIDELITY TEST — run this file directly ═════════════════════════════════
// 🔑 NOTHING BUILT ON A SNAPSHOT IS WORTH ANYTHING UNTIL THE SNAPSHOT IS PROVEN FAITHFUL. The test
// is the one this project already uses for refactors: **same seed, same game?** Snapshot mid-run,
// restore, replay WITHOUT reshuffling, and the outcome must match the original every time. If it
// does not, the clone is losing state and every number downstream is fiction.
if (require.main === module) {
  H.useClass('mage');
  let same = 0, diff = 0, err = 0;
  for (let i = 0; i < 12; i++) {
    // play a run, snapshotting partway
    let mid = null, floorAt = 0;
    const realFresh = B.freshGame;
    B.RUNSIM.setHook({ onMap: () => {
      const s = S();
      const f = (s.map && s.map.pos) ? s.map.pos.f : 0;
      if (!mid && f >= 6) { mid = snap(); floorAt = f; }
    }});
    H.seed(700 + i);
    let truth = null;
    try { const m = B.RUNSIM.autoRun(true); truth = !!(m && m.win); } catch (e) { truth = null; }
    B.RUNSIM.setHook({});
    B.freshGame = realFresh;
    if (!mid || truth === null) { err++; continue; }
    // restore and continue with NO reshuffle — must reproduce the same ending
    const again = replay(mid, 700 + i, false);
    if (again === null) err++;
    else if (again === truth) same++;
    else { diff++; console.log(`  🔴 seed ${700 + i}: original ${truth ? 'win' : 'loss'} at floor ${floorAt}, replay ${again ? 'win' : 'loss'}`); }
  }
  console.log(`\nSNAPSHOT FIDELITY — restore + replay with no reshuffle must reproduce the run`);
  console.log(`  reproduced : ${same}`);
  console.log(`  DIVERGED   : ${diff}${diff ? '  🔴 the clone is losing state — do not trust anything built on it' : '  ✅'}`);
  console.log(`  errored    : ${err}`);
}
