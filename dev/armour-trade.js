// 🛡️ WHAT IF LEVELLING A CARD COSTS IT ARMOUR?
// Thomas: *"increase damage but also as you level up cards, its armor value goes down as a trade
// off."*
//
// 🔑 THIS IS THE REAL DECOUPLER, and it is what [[Levelling_As_Sharpening]] already says out loud:
// *a level raises the SPIKE and drops the WEAKNESSES.* If a level buys damage and SPENDS health,
// then upgrading stops being pure gain — and the snowball (upgrade → tankier → upgrade more)
// cannot happen by construction.
//
// 🔴 BUT THE IDEA IS ALREADY HALF-BUILT AND THE OTHER HALF HAS NOWHERE TO GO. Armour already falls
// with level on 💧 Water (3/2/1/1) and 🪨 Stone (4/3/2/2) — that is the ELEMENT temperament. 🔥 Fire
// and ⚡ Lightning sit at **1/1/1/1**, and so do six of the rogue's eight cards. **The floor is 1**
// (Thomas, 2026-08-18: *"rogue cards shouldn't block 0"* — a 0-armour card is a hole in the health
// bar, not a thin one). So there is nothing left to take away.
//
// ✅ To make the trade real, cards have to START tankier. That is the interesting version: a fresh
// deck is DURABLE BUT WEAK, a levelled deck is DEADLY BUT FRAGILE.
// ⚠️ Cost, stated up front: it flattens an element identity. 💧 Water endures and 🪨 Stone is armour
// — those temperaments ARE their armour curves. Give Fire the same curve and one of the four
// elements stops being distinguishable on that axis.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const N = +(process.argv[2] || 120);

const DEFS = () => [].concat(B.CARD_DEFS || [], B.ROGUE_DEFS || []);
const snapshot = () => DEFS().map(d => d.lv.map(r => r.slice()));
const restore = s => DEFS().forEach((d, i) => { d.lv = s[i].map(r => r.slice()); });
// a WARD card is one whose armour RISES — that is its spike, and it must keep it
const isWard = d => d.lv[d.lv.length - 1][4] > d.lv[0][4];

// give every non-WARD card `curve` as its armour, so a level SPENDS armour
function setCurve(curve) {
  for (const d of DEFS()) {
    if (isWard(d)) continue;
    d.lv.forEach((r, L) => { r[4] = curve[Math.min(L, curve.length - 1)]; });
  }
}

function cell(cls, atk, curve, snap) {
  restore(snap);
  if (curve) setCurve(curve);
  H.setTunable('FOE_ATK_MULT', atk);
  H.useClass(cls);
  let won = 0, never = 0, net = 0, dip = 0, n = 0, lv4 = 0;
  for (let i = 0; i < N; i++) {
    H.seed(3300 + i);
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
    const all = [...s.hand, ...s.deck, ...s.discard];
    const end = all.reduce((t, c) => t + c.level, 0);
    if (s.phase === 'victory') won++;
    if (low >= start) never++;
    // ⚠️ does upgrading still LOOK worth it to the bot? If the trade is too steep it stops buying,
    // and a progression system nobody uses is worse than one that snowballs.
    lv4 += all.filter(c => c.level >= 4).length;
    net += end - start; dip += start - low; n++;
  }
  return { win: Math.round(100 * won / n), never: Math.round(100 * never / n),
           net: +(net / n).toFixed(1), dip: +(dip / n).toFixed(1), lv4: +(lv4 / n).toFixed(1) };
}

const snap = snapshot();
H.setTunable('XP_LEVEL_FORCE', 1); H.setTunable('CLASS_LEVEL_FORCE', 1);
const CURVES = [
  ['now     ', null],
  ['3/2/1/1 ', [3, 2, 1, 1]],
  ['4/3/2/1 ', [4, 3, 2, 1]],
];
console.log(`n=${N}/cell, fresh account. "Lv4 cards" = how many the bot ended up buying —\n` +
            `a trade too steep shows up as it refusing to upgrade at all.\n`);
console.log('  dmg   armour     class    win%   never dipped   deepest dip   net deck   Lv4 cards');
for (const atk of [1.0, 1.3]) {
  for (const [lab, curve] of CURVES) {
    for (const cls of ['mage', 'rogue']) {
      const r = cell(cls, atk, curve, snap);
      console.log(`  ×${atk.toFixed(1)}  ${lab}  ${cls.padEnd(6)}   ${String(r.win).padStart(3)}%      ` +
        `${String(r.never).padStart(3)}%          ${String(r.dip).padStart(4)}       ` +
        `${(r.net > 0 ? '+' : '') + r.net}      ${r.lv4}`);
    }
  }
  console.log('');
}
restore(snap);
H.setTunable('FOE_ATK_MULT', 1.0);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
