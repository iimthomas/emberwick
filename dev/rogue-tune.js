// 🗡️ IS THE ROGUE OVERTUNED, AND WHICH DIAL FIXES IT?
// Thomas: *"rogue should do less damage, combined with momentum, rogue is a bit overtuned i think."*
//
// 🐛 THE FIRST VERSION OF THIS PROBE MEASURED THE MAGE WRONG, and it is the trap `ladder.js` warns
// about in its own header: **she must be measured at BANK_WEIGHT 1.0**, channelling whenever that
// is not strictly worse, because that is how a human plays her. At weight 0 she never channels and
// reads ~12 points low — *"quoting only the 0 column is what hid her real strength for a week."*
// A baseline taken at the wrong weight makes every comparison against it a fiction.
//
// ⚠️ `SPIKE_STEP.value` cannot be swept: game.js declares `let SPIKE_STEP_VALUE` "so a sweep can
// move it" and the next line copies it into a `const` at load, before ROGUE_DEFS is generated. The
// blade curve is rescaled in the DATA here, the same way dev/flatten.js does it.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const N = +(process.argv[2] || 200);
const TARGET = [40, 35, 30, 20];

const snapshot = () => B.ROGUE_DEFS.map(d => d.lv.map(r => r.slice()));
const restore = s => B.ROGUE_DEFS.forEach((d, i) => { d.lv = s[i].map(r => r.slice()); });
const blades = () => B.ROGUE_DEFS.filter(d => d.lv[3][0] > d.lv[0][0]);
function bladeSpike(step) {
  for (const d of blades()) {
    const v0 = d.lv[0][0];
    for (let L = 1; L < d.lv.length; L++) d.lv[L][0] = Math.round(v0 + step * L);
  }
}

function ladder(cls) {
  H.useClass(cls);
  // 🔑 the mage channels; the rogue has no equivalent and is unaffected by this weight.
  B.RUNSIM.setBankWeight(1.0);
  const st = {};
  for (let i = 0; i < N; i++) {
    H.seed(6600 + i);
    let m; try { m = B.RUNSIM.autoRun(true); } catch (e) { continue; }
    const s = S(), k = s.dragon.stage;
    const o = st[k] || (st[k] = { n: 0, w: 0 });
    o.n++; if (m.win) o.w++;
  }
  return [1, 2, 3, 4].map(k => st[k] ? Math.round(100 * st[k].w / st[k].n) : 0);
}
const vs = a => a.map((v, i) => `${String(v).padStart(2)}${v - TARGET[i] >= 0 ? '+' : '−'}${String(Math.abs(v - TARGET[i])).padStart(2)}`).join('  ');

H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
const snap = snapshot();
const HP0 = JSON.parse(JSON.stringify(H.getTunable('DRAGON_HP_ADD')));

console.log(`n=${N}, ⭐6/🎭3, damage ×${H.getTunable('FOE_ATK_MULT')}, mage at BANK_WEIGHT 1.0`);
console.log(`target                    ${TARGET.map(t => String(t).padStart(2) + '   ').join('  ')}\n`);
console.log(`mage                      ${vs(ladder('mage'))}\n`);

// ⚠️ TRIMMED TO THE CASES STILL ALIVE, so this can run at n=320 (80/stage, the documented floor).
// ❌ Fathomdread HP is OUT: it is class-blind, so it moved the mage's stage 4 from 26 → 11 while
// moving the rogue's 43 → 29. The gap stayed 17→18. **A dragon cannot close a class gap.**
const CASES = [
  ['rogue, now              ', () => {}],
  ['  blade spike 3 → 2     ', () => bladeSpike(2)],
  ['  blade spike 3 → 2.5   ', () => bladeSpike(2.5)],
];
for (const [lab, apply] of CASES) {
  restore(snap);
  H.setTunable('MOMENTUM_CAP', 3); H.setTunable('DRAGON_HP_ADD', JSON.parse(JSON.stringify(HP0)));
  apply();
  console.log(`${lab}  ${vs(ladder('rogue'))}`);
}
restore(snap);
H.setTunable('MOMENTUM_CAP', 3); H.setTunable('DRAGON_HP_ADD', HP0);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
