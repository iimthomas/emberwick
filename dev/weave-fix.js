// ✦ THREE VERSIONS OF LOOSE WEAVE, MEASURED
//   A · SHIPPED — any Catalyst attunes; only an UNMATCHED one is halved. A real pair still pays
//       full, so the charm can never make a turn worse: it is a FLOOR, not a trade.
//   B · THE HONEST TRADE — any Catalyst attunes, and EVERY attune is halved while you hold it.
//       This is what the card's own `why` ("ceiling traded for consistency") has always claimed:
//       you attune nearly every turn and you never attune for full.
//   C · SMALLER FREEBIE — as shipped, but the unmatched attune pays a THIRD instead of a half.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const RUNS = +(process.argv[2] || 150);
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass('mage'); B.RUNSIM.setBankWeight(1.0);

const realHas = B.hasCharm, realLoose = B.looseOnly, realStrike = B.mageStrike;
function measure(mode) {
  B.hasCharm = function (id) { return id === 'looseweave' ? (mode !== 'none') : realHas.apply(this, arguments); };
  if (mode === 'B') B.looseOnly = function () { return realHas.call(null, 'looseweave') || true; };
  else B.looseOnly = realLoose;
  if (mode === 'C') {
    B.mageStrike = function (spell, attuned, elem, boostC) {
      const st = B.eff(spell);
      if (!attuned) return st.value + (B.hasCharm('coldiron') ? 3 : 0);
      let v = B.looseOnly() ? st.value + Math.floor((st.attuned - st.value) / 3) : st.attuned;
      if (B.hasCharm('threekind') && elem && boostC) {
        const e = B.elOf(spell);
        if (B.elOf(elem) === e && B.elOf(boostC) === e) v *= 2;
      }
      return v;
    };
  } else B.mageStrike = realStrike;
  let wins = 0, runs = 0, strike = 0, t = 0;
  const res = { Complete: 0, Narrow: 0, Loss: 0 };
  B.RUNSIM.setHook({ onAssign: () => { const a = B.computeAction && B.computeAction();
    if (a && a.value != null) { strike += a.value; t++; } } });
  for (let i = 0; i < RUNS; i++) {
    H.seed(6400 + i);
    try { const m = B.RUNSIM.autoRun(true); if (m) { runs++; if (m.win) wins++;
      res.Complete += m.res.Complete; res.Narrow += m.res.Narrow; res.Loss += m.res.Loss; } } catch (e) {}
  }
  B.RUNSIM.setHook({}); B.hasCharm = realHas; B.looseOnly = realLoose; B.mageStrike = realStrike;
  const enc = res.Complete + res.Narrow + res.Loss || 1;
  return { C: 100 * res.Complete / enc, win: 100 * wins / (runs || 1), s: strike / (t || 1) };
}
console.log(`\n✦ LOOSE WEAVE, THREE WAYS — mage, ${RUNS} runs a row, same seeds\n`);
console.log('                                      road C%   stage win   avg strike   worth vs no charm');
const base = measure('none');
console.log(`  no charm at all                      ${base.C.toFixed(0).padStart(5)}%   ${base.win.toFixed(0).padStart(7)}%   ${base.s.toFixed(1).padStart(10)}          —`);
for (const [lab, m] of [['A · shipped (unmatched halved)', 'A'], ['B · honest trade (always halved)', 'B'], ['C · unmatched pays a THIRD', 'C']]) {
  const r = measure(m);
  console.log(`  ${lab.padEnd(35)}${r.C.toFixed(0).padStart(5)}%   ${r.win.toFixed(0).padStart(7)}%   ${r.s.toFixed(1).padStart(10)}      ${(r.C - base.C >= 0 ? '+' : '')}${(r.C - base.C).toFixed(0)} C / ${(r.win - base.win >= 0 ? '+' : '')}${(r.win - base.win).toFixed(0)} win`);
}
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
