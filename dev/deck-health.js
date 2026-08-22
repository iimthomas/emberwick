// 🃏 IS THE DECK ACTUALLY A HEALTH BAR?
//
// Thomas: *"feels like getting damaged has been inconsequential."*
// **Deck-as-health is a PILLAR.** If the deck only ever goes UP across a run, then it is not a
// health bar at all — it is an XP bar with a small tax, and every defensive choice in the game is
// boring for that reason rather than on its own merits.
//
// Tracks the ONE number the grade and the Standing already use: total card levels.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 200);

for (const cls of ['mage', 'rogue']) {
  let runs = 0, start = 0, lair = 0, trashed = 0, dipped = 0, minSum = 0;
  let soakLevels = 0, upgrades = 0, turns = 0, dmgSum = 0;
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(5100 + i);
    let s0 = null, lo = null, mn = 1e9, lairLv = null;
    const lv = () => { const S = getS(); return [...S.hand, ...S.deck, ...S.discard].reduce((a, c) => a + c.level, 0); };
    sandbox.RUNSIM.setHook({
      onAssign() {
        const S = getS(); if (S.finalMode) return;
        if (s0 === null) s0 = lv();
        const now = lv(); if (now < mn) mn = now;
        const r = sandbox.computeAction(null);
        if (r) { turns++; dmgSum += (r.early || 0) + (r.combatDmg || 0); }
      },
      onLair() { lairLv = lv(); },
    });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS();
    runs++; start += (s0 || 32); lair += (lairLv || lv()); trashed += S.trashed.length;
    minSum += mn === 1e9 ? (s0 || 32) : mn;
    if (mn < (s0 || 32)) dipped++;
  }
  const d = n => (n / (runs || 1)).toFixed(1);
  console.log(`\n=== ${cls} · ${runs} runs ===`);
  console.log(`  deck levels: start ${d(start)}  →  LOWEST point in the run ${d(minSum)}  →  at the lair ${d(lair)}`);
  console.log(`  🔑 net change across the whole run: ${(lair / runs - start / runs >= 0 ? '+' : '')}${(lair / runs - start / runs).toFixed(1)} levels`);
  console.log(`  runs that EVER dipped below where they started: ${Math.round(100 * dipped / (runs || 1))}%`);
  console.log(`  cards destroyed outright (Lv1 soaked): ${d(trashed)} of 16`);
  console.log(`  damage taken per turn: ${(dmgSum / (turns || 1)).toFixed(2)}`);
}
console.log(`\n⚠️ deck-as-health is the pillar. A bar that only rises is not a bar.`);
