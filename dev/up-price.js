// ⚒️ WHAT IS A STEP ON THE +N LADDER WORTH? — 2026-08-28
//
// 🔑 The ladder is the game's FIRST DELIBERATE VERTICAL AXIS, and *lateral power, not vertical* is
// a pillar — so the one number that matters is how much of the game a fully upgraded set buys.
// [[Equipment_Upgrades]] §3 argues it is safe because a consumable scales to a CAP (four pieces ×
// a small integer of blows) rather than continuously like a pool. **This is that argument checked
// rather than asserted.**
//
// ⚠️ IT FORCES A KNOWN CRAFTED LOADOUT. RUNSIM builds its loadout from the PLAYER'S stash, so
// without this a sweep silently measures whatever Thomas happens to have forged that week — and
// the starter set has no ladder at all, so an unforced run would move by exactly zero and read
// as "the ladder does nothing".
// ⚠️ Δ road C% is the sound column (~1500 encounters a row). Δ win divides by four stages and is
// DIRECTIONAL at this n — the documented floor is 60 runs per stage.
'use strict';
const H = require('./headless.js');
const B = H.sandbox;
const RUNS = +(process.argv[2] || 100);
const CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS); B.RUNSIM.setBankWeight(1.0);

// one crafted, upgradable piece per zone, so every step of the ladder has somewhere to land
const SET = [];
for (const slot of ['Head', 'Chest', 'Arms', 'Legs']) {
  const d = B.ARMOUR.find(a => a.slot === slot && !a.starter && (!a.cls || a.cls === CLS));
  if (d) SET.push(d.id);
}
console.log(`\n⚒️ THE +N LADDER — ${CLS}, ${RUNS} runs a row, same seeds`);
console.log(`   forced set: ${SET.map(id => B.ARMOUR.find(a => a.id === id).name).join(' · ')}\n`);

const realFresh = B.freshGame;
function measure(up) {
  H.setTunable('ARMOUR_UP_FORCE', up);
  B.freshGame = function () {
    const r = realFresh.apply(this, arguments);
    const s = H.getS();
    if (s) s.armour = SET.map(id => B.newArmour(id));
    return r;
  };
  let wins = 0, runs = 0, blocks = 0, atLair = 0;
  const res = { Complete: 0, Narrow: 0, Loss: 0 };
  for (let i = 0; i < RUNS; i++) {
    H.seed(9400 + i);
    try {
      const m = B.RUNSIM.autoRun(true);
      if (m) {
        runs++; if (m.win) wins++;
        res.Complete += m.res.Complete; res.Narrow += m.res.Narrow; res.Loss += m.res.Loss;
        const s = H.getS();
        // 🔑 the number the ladder was actually built to move: *pieces able to block at the lair*,
        // on record at 0.03 and the reason "uses" beat "points" in the first place.
        atLair += (s.armour || []).filter(a => a.wear > 0 && B.armourBlock(a) > 0).length;
        blocks += SET.length ? (s.armour || []).reduce((t, a) => t + (B.armourMaxWear(a) - a.wear), 0) : 0;
      }
    } catch (e) {}
  }
  B.freshGame = realFresh;
  const enc = res.Complete + res.Narrow + res.Loss || 1;
  return { C: 100 * res.Complete / enc, win: 100 * wins / (runs || 1),
           lair: atLair / (runs || 1), used: blocks / (runs || 1) };
}

const rows = [];
for (let up = 0; up <= H.getTunable('ARMOUR_UP_MAX'); up++) rows.push([up, measure(up)]);
H.setTunable('ARMOUR_UP_FORCE', -1);

console.log('   step   road C%   stage win   blocks spent/run   pieces live at the lair');
const base = rows[0][1];
for (const [up, r] of rows) {
  console.log(`   +${up}     ${r.C.toFixed(1)}      ${r.win.toFixed(0)}%` +
    `         ${r.used.toFixed(2)}` +
    `               ${r.lair.toFixed(2)}` +
    (up ? `     (Δ C ${(r.C - base.C >= 0 ? '+' : '') + (r.C - base.C).toFixed(1)}` +
          ` · Δ win ${(r.win - base.win >= 0 ? '+' : '') + (r.win - base.win).toFixed(0)})` : ''));
}
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
