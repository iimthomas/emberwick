// 🛡️ WHAT IS EACH PIECE OF EQUIPMENT WORTH?
// Thomas: "some of them might be too strong, don't know. we don't want any of them to invalidate
// and make stage 5+ runs too easy."
// 🔑 The right question is not "does it feel strong" but "where does it sit against its peers" —
// the charm table settled the same worry about Loose Weave by showing it ranked FIFTH.
// ⚠️ Forced into the loadout for every run and compared to the same seeds with nothing forced.
// This prices the RULE, not how often the Workshop can afford it.
// ⚠️ Δ road C% is the sound column (~1500 encounters a row). Δ win divides by four stages and is
// DIRECTIONAL at this n — the documented floor is 60 runs per stage.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const RUNS = +(process.argv[2] || 100);
const CLS = process.argv[3] || 'mage';
const ONLY = (process.argv[4] || '').split(',').filter(Boolean);
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS); B.RUNSIM.setBankWeight(1.0);

const realFresh = B.freshGame;
function measure(id) {
  B.freshGame = function () {
    const r = realFresh.apply(this, arguments);
    const s = S();
    // 🔑 REPLACES the starter piece in that slot rather than joining it — you wear four things, and
    // a fifth would price the piece AND an extra block together.
    if (id && s && s.armour) {
      const d = B.ARMOUR.find(a => a.id === id);
      if (d) { s.armour = s.armour.filter(a => (B.ARMOUR.find(x => x.id === a.id) || {}).slot !== d.slot);
               s.armour.push(B.newArmour(id)); }
    }
    return r;
  };
  let wins = 0, runs = 0; const res = { Complete: 0, Narrow: 0, Loss: 0 };
  for (let i = 0; i < RUNS; i++) {
    H.seed(9400 + i);
    try { const m = B.RUNSIM.autoRun(true); if (m) { runs++; if (m.win) wins++;
      res.Complete += m.res.Complete; res.Narrow += m.res.Narrow; res.Loss += m.res.Loss; } } catch (e) {}
  }
  B.freshGame = realFresh;
  const enc = res.Complete + res.Narrow + res.Loss || 1;
  return { C: 100 * res.Complete / enc, win: 100 * wins / (runs || 1) };
}

const base = measure(null);
const list = B.ARMOUR.filter(a => !a.starter && (!a.cls || a.cls === CLS) && (!ONLY.length || ONLY.includes(a.id)));
console.log(`\n\u{1F6E1}️ WHAT EACH PIECE IS WORTH — ${CLS}, ${RUNS} runs a row, same seeds`);
console.log(`   baseline (starter set): road C ${base.C.toFixed(1)}% · stage win ${base.win.toFixed(0)}%\n`);
const rows = list.map(d => { const r = measure(d.id);
  return { n: d.name, s: d.slot, rar: d.rarity || 'common', dC: r.C - base.C, dW: r.win - base.win }; });
rows.sort((a, b) => b.dC - a.dC);
console.log('   piece                     slot    rarity      Δ road C%   Δ win');
for (const r of rows) console.log(`   ${r.n.padEnd(24)}${r.s.padEnd(8)}${r.rar.padEnd(11)}${((r.dC >= 0 ? '+' : '') + r.dC.toFixed(1)).padStart(7)}   ${((r.dW >= 0 ? '+' : '') + r.dW.toFixed(0)).padStart(5)}`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
