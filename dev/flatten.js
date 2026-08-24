// 🧪 WHAT IF ENEMIES HIT HARDER **AND** A LEVEL IS WORTH LESS?
// Thomas: *"wondering what happens if we increase damage, but also decrease the stats of cards
// between levels."*
//
// 🔑 THE IDEA IS A DECOUPLER, WHICH IS WHY IT IS WORTH TESTING. Deck-as-health welds two jobs to
// one pile of cards: your health bar and your damage. Flattening the VALUE curve while leaving the
// ARMOUR curve alone makes a level worth less as *damage* and exactly as much as *health* — so the
// two jobs come apart a little. That is a different kind of fix from any dial we have.
//
// ⚠️ It only decouples if the flattening is on VALUE ONLY. Flatten armour too and nothing comes
// apart; everything just gets smaller.
//
// ⚠️ HOW THIS FLATTENS, and the care it needs: [[Levelling_As_Sharpening]] says a level raises the
// SPIKE and drops the WEAKNESSES. A card whose value FALLS across levels is a card whose value is
// its weakness (Firstlight 4/3/3/3) — touching that would flatten the wrong half. So this only
// rescales rows where value RISES, and leaves Lv1 where it is.
//
// ⚠️ Data-only. It rewrites level tables in the sandbox and restores them between cells; it never
// changes a rule. And `SPIKE_STEP_VALUE` could not be used for the rogue — see the note below.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const N = +(process.argv[2] || 120);

// 🐛 `SPIKE_STEP_VALUE` IS A DEAD DIAL. game.js declares it `let` with the comment "so a sweep can
// move it", then immediately does `const SPIKE_STEP = { value: SPIKE_STEP_VALUE, … }`, which COPIES
// it at load — and ROGUE_DEFS is generated from that copy before any sweep could run. Moving the
// `let` changes nothing. Flagged, not fixed here.
const DEFS = () => [].concat(B.CARD_DEFS || [], B.ROGUE_DEFS || []);

function snapshot() { return DEFS().map(d => d.lv.map(row => row.slice())); }
function restore(snap) { DEFS().forEach((d, i) => { d.lv = snap[i].map(r => r.slice()); }); }

// rescale the VALUE column so each level gains `step` instead of whatever it gained
function flattenTo(step) {
  for (const d of DEFS()) {
    const v = d.lv.map(r => r[0]);
    if (!(v[v.length - 1] > v[0])) continue;         // value is this card's weakness — leave it
    for (let L = 1; L < d.lv.length; L++) d.lv[L][0] = v[0] + step * L;
  }
}
const currentStep = () => {
  const rises = DEFS().map(d => d.lv.map(r => r[0])).filter(v => v[v.length - 1] > v[0]);
  return rises.reduce((t, v) => t + (v[v.length - 1] - v[0]) / (v.length - 1), 0) / rises.length;
};

function cell(cls, atk, step, snap) {
  restore(snap);
  if (step !== null) flattenTo(step);
  H.setTunable('FOE_ATK_MULT', atk);
  H.useClass(cls);
  let won = 0, never = 0, net = 0, lo = 0, n = 0, lvlSpend = 0, purse = 0;
  for (let i = 0; i < N; i++) {
    H.seed(7700 + i);
    let start = null, low = Infinity;
    B.RUNSIM.setHook({ onAssign: () => {
      const s = S();
      const v = [...s.hand, ...s.deck, ...s.discard].reduce((t, c) => t + c.level, 0);
      if (start === null) start = v;
      if (v < low) low = v;
    }});
    try { B.RUNSIM.autoRun(true); } catch (e) {}
    B.RUNSIM.setHook({});
    const s = S();
    if (start === null) continue;
    const end = [...s.hand, ...s.deck, ...s.discard].reduce((t, c) => t + c.level, 0);
    if (s.phase === 'victory') won++;
    if (low >= start) never++;
    net += end - start; lo += start - low; n++;
  }
  return { win: Math.round(100 * won / n), never: Math.round(100 * never / n),
           net: +(net / n).toFixed(1), dip: +(lo / n).toFixed(1) };
}

const snap = snapshot();
console.log(`current average value gain per level: ${currentStep().toFixed(2)}  (n=${N}/cell, fresh account)\n`);
H.setTunable('XP_LEVEL_FORCE', 1); H.setTunable('CLASS_LEVEL_FORCE', 1);
console.log('  dmg  step   class    win%   never dipped   deepest dip   net deck');
for (const atk of [1.0, 1.4]) {
  for (const step of [null, 2, 1]) {
    for (const cls of ['mage', 'rogue']) {
      const r = cell(cls, atk, step, snap);
      const lab = step === null ? 'now ' : `+${step}  `;
      console.log(`  ×${atk.toFixed(1)}  ${lab}  ${cls.padEnd(6)}   ${String(r.win).padStart(3)}%      ` +
                  `${String(r.never).padStart(3)}%           ${String(r.dip).padStart(4)}        ${r.net > 0 ? '+' : ''}${r.net}`);
    }
  }
  console.log('');
}
restore(snap);
H.setTunable('FOE_ATK_MULT', 1.0);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
