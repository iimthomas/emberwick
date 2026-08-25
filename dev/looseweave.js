// ✦ IS LOOSE WEAVE TOO GOOD — OR DOES IT DELETE THE PUZZLE?
// Thomas: *"mage loose weave might be a bit too good i think, especially with some boost cards,
// not having to fully attune, and just using the boost card gives a lot of good damage, wondering
// if attuning needs to give a bit more damage"*
//
// 🔑 TWO DIFFERENT FAULTS HIDE IN "TOO GOOD", AND THEY WANT OPPOSITE FIXES:
//   • **too STRONG** — it wins more than a 10-coin uncommon should. Fix: the halving, or the cost.
//   • **too SOLVING** — it removes the CONTENTION attuning was invented to create, so the turn
//     goes back to "biggest / fastest / fattest". Fix: nothing about Loose Weave; the attune
//     bonus is too small relative to the Surge, which is what he is actually asking.
// The recorded baseline is the tell: before attuning existed the naive arrangement was optimal
// **92%** of the time; attuning at +2 took it to **66%**. If Loose Weave puts it back near 90 it
// is not a strong charm, it is an OFF SWITCH for the mage's one rule.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const RUNS = +(process.argv[2] || 150);
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass('mage');
B.RUNSIM.setBankWeight(1.0);

const realHas = B.hasCharm;
function measure(force) {
  // force: true = always on, false = always off, null = whatever the run bought
  B.hasCharm = function (id) {
    if (id === 'looseweave' && force !== null) return force;
    return realHas.apply(this, arguments);
  };
  let turns = 0, naive = 0, attuned = 0, loose = 0, strike = 0, wins = 0, runs = 0;
  const res = { Complete: 0, Narrow: 0, Loss: 0 };
  B.RUNSIM.setHook({ onAssign: () => {
    const s = S();
    if (!s.hand || s.hand.length < 2) return;
    turns++;
    // 🔑 THE NAIVE ARRANGEMENT: biggest → Spell, fastest → Catalyst, fattest → Surge. No element
    // reasoning at all. If the bot's chosen arrangement equals this, the turn solved itself.
    const val = c => B.eff(c).value, ini = c => B.eff(c).init, bst = c => B.eff(c).boost;
    const pool = s.hand.slice();
    const sp = pool.slice().sort((a, b) => val(b) - val(a))[0];
    const rest = pool.filter(c => c !== sp);
    const el = rest.slice().sort((a, b) => ini(b) - ini(a))[0];
    const bo = rest.filter(c => c !== el).sort((a, b) => bst(b) - bst(a))[0];
    if (s.assign.Spell === (sp && sp.id) && s.assign.Element === (el && el.id) &&
        s.assign.Boost === (bo && bo.id)) naive++;
    if (B.attunedNow && B.attunedNow()) { attuned++; if (B.looseOnly()) loose++; }
    const a = B.computeAction && B.computeAction();
    if (a && a.value != null) strike += a.value;
  }});
  for (let i = 0; i < RUNS; i++) {
    H.seed(6400 + i);
    try { const m = B.RUNSIM.autoRun(true); if (m) { runs++; if (m.win) wins++;
      res.Complete += m.res.Complete; res.Narrow += m.res.Narrow; res.Loss += m.res.Loss; } } catch (e) {}
  }
  B.RUNSIM.setHook({}); B.hasCharm = realHas;
  const enc = res.Complete + res.Narrow + res.Loss || 1;
  return { naive: 100 * naive / (turns || 1), att: 100 * attuned / (turns || 1),
           loose: 100 * loose / (attuned || 1), strike: strike / (turns || 1),
           win: 100 * wins / (runs || 1), C: 100 * res.Complete / enc };
}
console.log(`\n✦ LOOSE WEAVE — mage, ${RUNS} runs a row, ★6/🎭3, ATTUNE_BONUS ${H.getTunable('ATTUNE_BONUS')}\n`);
console.log('                     naive=optimal   attuned   of which loose   avg strike   road C%   stage win');
for (const [label, f] of [['OFF (never)', false], ['ON  (always)', true]]) {
  const r = measure(f);
  console.log(`  ${label.padEnd(18)} ${r.naive.toFixed(0).padStart(9)}%  ${r.att.toFixed(0).padStart(7)}%   ${r.loose.toFixed(0).padStart(12)}%   ${r.strike.toFixed(1).padStart(10)}   ${r.C.toFixed(0).padStart(5)}%   ${r.win.toFixed(0).padStart(7)}%`);
}
console.log(`\n  \u{1F511} the recorded baseline: naive was optimal 92% BEFORE attuning existed, 66% after.`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
