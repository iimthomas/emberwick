// 🏕️ IS ANY SETTING-OUT OFFER A JACKPOT?
// Thomas: *"i don't want players to always pick the same thing every new run, or maybe they cancel
// out and re do a run just to potentially get something they want."*
//
// 🔑 THE REROLL PROBLEM HAS A MEASURABLE ANSWER. Rerolling is only worth doing if some option is
// much better than the others. So force each option in turn, on the same seeds, and read the
// spread. **If every option lands in the same band there is no jackpot, and quitting to re-roll
// buys nothing.** That is a guarantee rather than a hope.
//
// ⚠️ TWO OPTIONS ARE STRUCTURALLY UNMEASURABLE HERE AND THAT IS NOT A FAULT IN THEM:
//   • 🦴 A Head Start pays in MATERIALS, which never touch the run — its whole value is at the
//     Workshop afterwards. It should read ~0 in-run BY CONSTRUCTION. Reporting it as "weak" would
//     be the recorded mistake of quoting a number about a thing the instrument cannot see.
//   • 🧪 A Packed Kit hands you potions, and the bot is a poor potion player.
// Read this table as *is anything runaway*, never as *which is best*.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();

const RUNS = +(process.argv[2] || 150);
const CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS);
B.RUNSIM.setBankWeight(1.0);

const realRoll = B.rollSetout;
function measure(only) {
  // force the screen to offer exactly one thing, which is also the one the bot takes (it takes [0])
  B.rollSetout = function () {
    if (!only) return [];
    const d = B.setoutById(only);
    const o = d && d.pick();
    return o ? [{ k: only, ...o }] : [];
  };
  let wins = 0, runs = 0;
  const res = { Complete: 0, Narrow: 0, Loss: 0 };
  for (let i = 0; i < RUNS; i++) {
    H.seed(4400 + i);
    try {
      const m = B.RUNSIM.autoRun(true);
      if (m) { runs++; if (m.win) wins++; res.Complete += m.res.Complete; res.Narrow += m.res.Narrow; res.Loss += m.res.Loss; }
    } catch (e) {}
  }
  B.rollSetout = realRoll;
  const enc = res.Complete + res.Narrow + res.Loss || 1;
  return { C: 100 * res.Complete / enc, win: 100 * wins / (runs || 1) };
}

const base = measure(null);
console.log(`\n\u{1F3D5}️ SETTING OUT — IS ANYTHING A JACKPOT? — ${CLS}, ${RUNS} runs a row, same seeds`);
console.log(`   baseline (no offer at all): road C ${base.C.toFixed(1)}% · stage win ${base.win.toFixed(0)}%\n`);
console.log('   bucket  offer                     Δ road C%   Δ win');
const rows = [];
for (const b of B.SETOUT_BUCKETS) {
  for (const d of B.SETOUT.filter(o => o.bucket === b)) {
    const r = measure(d.id);
    rows.push({ b, id: d.id, dC: r.C - base.C, dW: r.win - base.win });
    console.log(`   ${b.padEnd(7)} ${d.id.padEnd(24)} ${((r.C - base.C >= 0 ? '+' : '') + (r.C - base.C).toFixed(1)).padStart(7)}   ${((r.win - base.win >= 0 ? '+' : '') + (r.win - base.win).toFixed(0)).padStart(5)}`);
  }
}
const cs = rows.map(r => r.dC);
console.log(`\n   SPREAD across all offers: ${(Math.max(...cs) - Math.min(...cs)).toFixed(1)} points of road Complete`);
console.log(`   \u{1F511} a small spread is the whole design — nothing to reroll toward.`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
