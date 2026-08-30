// 🗡️ DOES ADDED DAMAGE LAND BEFORE OR AFTER THE MULTIPLY? — 2026-08-28
//
// Thomas, after unloading a 24 Emberwake onto a 2-hit card and getting one blow's worth:
// *"we just need to be consistent, if added damage gets added after the multiplying, or before…
// not sure which way to go."*
//
// The switch already exists, so this is a measurement rather than a build:
//   SPLIT_ADDS_PER_HIT = true   AFTER  — the card splits, every bonus lands on EVERY blow.
//                                        Multi-hit multiplies your whole build. VERTICAL.
//   SPLIT_ADDS_PER_HIT = false  BEFORE — everything splits. Total is fixed; hits only change how
//                                        it is delivered. LATERAL.
//
// 🔑 THE COLUMN THAT DECIDES IT IS NOT WIN RATE, IT IS THE SHAPE SIGNATURE. *Lateral power, not
// vertical* is the pillar, and the ● Momentum split was chosen in the first place because it
// measured damage-NEUTRAL while moving 🧱 Guard 26→30% and 🛡️ Armour 20→19% in opposite
// directions. If one order lifts every column at once, it is a power change wearing a
// consistency argument.
//
// ⚠️ The duel is measured separately and on purpose: `duelStrike()` reads `r.value` and subtracts
// armour ONCE, never looking at hits — so a 2-hit card is strictly worse there than a 1-hit card
// of the same value (measured 24 vs 25 on identical numbers). Any duel movement here is the
// SPLIT's rounding, not the order of addition.
'use strict';
const H = require('./headless.js');
const B = H.sandbox;
const RUNS = +(process.argv[2] || 120);

function measure(cls, perHit, wakePerHit) {
  H.setTunable('SPLIT_ADDS_PER_HIT', perHit);
  H.setTunable('WAKE_PER_HIT', !!wakePerHit);
  // 🔴 PIN AT THE CAP, NOT AT 6. The first run of this came back BIT-IDENTICAL for the mage across
  // both settings — and *an A/B that returns the same number to the decimal has measured nothing*.
  // The flag only bites when `added` is non-zero, and the mage's `added` is potions + charmStrike
  // (🎯 Even Keel · 🗡️ Keen Edge · 🩸 Bloodied) — 🗡️ Keen Edge unlocks at level 15. Pinning at 6
  // excluded the very content the measurement was about.
  // 🔑 Same fault as measuring the mage at BANK_WEIGHT 0: the instrument forbade the thing it was
  // there to price.
  H.setTunable('XP_LEVEL_FORCE', +(process.argv[3] || 15)); H.setTunable('CLASS_LEVEL_FORCE', 5);
  H.useClass(cls); B.RUNSIM.setBankWeight(1.0);

  let blow = 0, blows = 0, multi = 0, turns = 0;
  const byShape = {};   // Complete-rate against each creature shape
  B.RUNSIM.setHook({ onAssign: () => {
    const S = H.getS(), e = S.encounter;
    if (!e || !S.hand || S.hand.length < 4) return;
    let r = null;
    try { r = B.computeAction(B.cardById(S.assign.Reserve)); } catch (err) { return; }
    if (!r) return;
    turns++;
    if ((r.hits || 1) > 1) multi++;
    if (e.type === 'fight') { blow += r.value || 0; blows++; }
    const shapes = (B.shapesOf ? B.shapesOf(e) : null) || (e.shape ? [e.shape] : []);
    for (const sh of shapes) {
      const t = byShape[sh] = byShape[sh] || { n: 0, c: 0 };
      t.n++; if (r.outcome === 'Complete') t.c++;
    }
  } });

  let wins = 0, runs = 0;
  const res = { Complete: 0, Narrow: 0, Loss: 0 };
  for (let i = 0; i < RUNS; i++) {
    H.seed(9600 + i);
    try {
      const m = B.RUNSIM.autoRun(true);
      if (m) { runs++; if (m.win) wins++;
        res.Complete += m.res.Complete; res.Narrow += m.res.Narrow; res.Loss += m.res.Loss; }
    } catch (e) {}
  }
  B.RUNSIM.setHook({});
  const enc = res.Complete + res.Narrow + res.Loss || 1;
  const sh = k => byShape[k] ? (100 * byShape[k].c / byShape[k].n) : NaN;
  return { C: 100 * res.Complete / enc, win: 100 * wins / (runs || 1),
           blow: blow / (blows || 1), multi: 100 * multi / (turns || 1),
           armour: sh('armour'), guard: sh('guard'), evasion: sh('evasion') };
}

const f = v => (isNaN(v) ? '   —  ' : v.toFixed(1).padStart(5) + '%');
console.log(`\n🗡️ ADDED DAMAGE: BEFORE OR AFTER THE MULTIPLY — ${RUNS} runs a cell, same seeds\n`);
console.log('   class  order    road C%   stage win   avg blow   multi-hit   vs 🛡️Armour  vs 🧱Guard  vs 🌀Evasion');
for (const cls of ['mage', 'rogue']) {
  for (const [label, v, w] of [['AFTER ', true, false], ['BEFORE', false, false], ['+WAKE ', true, true]]) {
    const r = measure(cls, v, w);
    console.log(`   ${cls.padEnd(6)} ${label}  ${f(r.C)}     ${f(r.win)}      ${r.blow.toFixed(1).padStart(5)}      ${f(r.multi)}      ${f(r.armour)}     ${f(r.guard)}     ${f(r.evasion)}`);
  }
}
H.setTunable('SPLIT_ADDS_PER_HIT', true); H.setTunable('WAKE_PER_HIT', false);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
