// 🎁 WHAT IS A CHARM WORTH? — the scale that "too good" has to be judged against.
// 🐛 THE FIRST VERSION OF THIS PROBE PRICED ONLY HALF THE CHARMS. It forced a charm by wrapping
// `hasCharm()`, and 13 of 23 charms came back at exactly +0/+0 — because a NUMERIC charm never
// calls hasCharm(); `charmMod()` walks `S.charms` directly. 🔑 A UNIFORM ZERO ACROSS A WHOLE
// CATEGORY IS AN INSTRUMENT FAULT, NOT A FINDING. Forcing now writes into `S.charms`, which is the
// one place BOTH readers agree on.
// ⚠️ Δ road C% is the trustworthy column (~1500 encounters a row). Δ stage win divides by four
// stages and is DIRECTIONAL ONLY at this n — the documented floor is 60 runs per stage.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const RUNS = +(process.argv[2] || 120);
const CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS); B.RUNSIM.setBankWeight(1.0);

const realFresh = B.freshGame;
function measure(force) {
  B.freshGame = function () {
    const r = realFresh.apply(this, arguments);
    const s = S();
    if (force && s && s.charms && !s.charms.includes(force)) s.charms.push(force);
    return r;
  };
  let wins = 0, runs = 0; const res = { Complete: 0, Narrow: 0, Loss: 0 };
  for (let i = 0; i < RUNS; i++) {
    H.seed(6400 + i);
    try { const m = B.RUNSIM.autoRun(true); if (m) { runs++; if (m.win) wins++;
      res.Complete += m.res.Complete; res.Narrow += m.res.Narrow; res.Loss += m.res.Loss; } } catch (e) {}
  }
  B.freshGame = realFresh;
  const enc = res.Complete + res.Narrow + res.Loss || 1;
  return { C: 100 * res.Complete / enc, win: 100 * wins / (runs || 1) };
}
const base = measure(null);
const list = B.CHARMS.filter(c => !c.curse && (!c.cls || c.cls === CLS));
console.log(`\n\u{1F381} WHAT EACH CHARM IS WORTH — ${CLS}, ${RUNS} runs a row, same seeds`);
console.log(`   baseline: road C ${base.C.toFixed(0)}% · stage win ${base.win.toFixed(0)}%`);
console.log(`   ⚠️ Δ road C% is the sound column; Δ win is directional at this n.\n`);
const rows = list.map(c => { const r = measure(c.id);
  return { n: c.name, cost: c.cost, rar: c.rarity, rule: !!c.rule, cls: c.cls ? '✦' : ' ', dC: r.C - base.C, dW: r.win - base.win }; });
rows.sort((a, b) => b.dC - a.dC);
console.log('   charm                    rarity      cost  rule   Δ road C%   Δ win');
for (const r of rows) console.log(`  ${r.cls}${r.n.padEnd(24)}${(r.rar||'').padEnd(11)}${String(r.cost).padStart(4)}   ${r.rule?'📜':'  '}   ${((r.dC>=0?'+':'')+r.dC.toFixed(1)).padStart(7)}   ${((r.dW>=0?'+':'')+r.dW.toFixed(0)).padStart(5)}`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
