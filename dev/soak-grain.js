// 🃏 IS DAMAGE EVEN DENOMINATED IN ANYTHING?
// Soak is QUANTISED — any damage costs a whole card level. If typical damage is smaller than one
// card's armour, then every damaging turn costs exactly ONE level and the SIZE of the hit is
// irrelevant. That would make damage inconsequential no matter how big the number on the creature.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 150);
for (const mult of [1.0, 1.6]) {
  setTunable('FOE_ATK_MULT', mult);
  for (const cls of ['mage', 'rogue']) {
    const cost = {}; let hit = 0, armSum = 0, armN = 0, dmgSum = 0;
    for (let i = 0; i < N; i++) {
      useClass(cls); seed(5100 + i);
      sandbox.RUNSIM.setHook({ onAssign() {
        const S = getS(); if (S.finalMode) return;
        const r = sandbox.computeAction(null); if (!r) return;
        for (const c of S.hand) { armSum += sandbox.soakValue(c); armN++; }
        const d = (r.early || 0) + (r.combatDmg || 0);
        if (d <= 0) return;
        hit++; dmgSum += d;
        // greedily soak with the hand, biggest plate first — how many card LEVELS does it cost?
        const plates = S.hand.map(c => sandbox.soakValue(c)).sort((a, b) => b - a);
        let left = d, n = 0;
        for (const p of plates) { if (left <= 0) break; left -= p; n++; }
        if (left > 0) n += left;   // nothing left to soak with — the rest destroys
        cost[n] = (cost[n] || 0) + 1;
      } });
      try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
    }
    const ks = Object.keys(cost).map(Number).sort((a,b)=>a-b);
    console.log(`×${mult.toFixed(1)} ${cls.padEnd(6)} avg card plate ${(armSum/(armN||1)).toFixed(1)} · avg hit ${(dmgSum/(hit||1)).toFixed(1)} · ` +
      `cost in cards: ${ks.map(k => `${k}:${Math.round(100*cost[k]/hit)}%`).join(' ')}`);
  }
}
setTunable('FOE_ATK_MULT', 1.0);
