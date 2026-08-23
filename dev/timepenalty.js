// ⏳ DOES TIME PENALTY DO ANYTHING?
// It moves cards deck → DISCARD (not destroyed). The map is the clock now, band boundaries
// reshuffle everything back, and running dry reshuffles and continues. So the only REAL cost is
// the overflow case: penalty larger than the deck, where the remainder becomes damage.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 250);
for (const cls of ['mage', 'rogue']) {
  let runs = 0, turns = 0, tpTurns = 0, tpTotal = 0, overflow = 0, overflowTurns = 0;
  let deckAtTP = 0, dryReshuffles = 0, journeys = 0;
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(8200 + i);
    sandbox.RUNSIM.setHook({ onAssign() {
      const S = getS(); if (S.finalMode) return;
      const r = sandbox.computeAction(null); if (!r) return;
      turns++;
      if (r.type === 'journey') journeys++;
      const tp = r.timePenalty || 0;
      if (tp > 0) {
        tpTurns++; tpTotal += tp; deckAtTP += S.deck.length;
        const over = Math.max(0, tp - S.deck.length);
        if (over > 0) { overflow += over; overflowTurns++; }
      }
    } });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
    runs++;
  }
  console.log(`\n=== ${cls} · ${runs} runs, ${turns} turns (${Math.round(100*journeys/turns)}% journeys) ===`);
  console.log(`  turns that took a Time Penalty: ${Math.round(100*tpTurns/turns)}%  ·  total TP per run: ${(tpTotal/runs).toFixed(1)} cards`);
  console.log(`  deck size when it landed:       ${(deckAtTP/(tpTurns||1)).toFixed(1)} cards`);
  console.log(`  🔑 turns where it OVERFLOWED into real damage: ${Math.round(100*overflowTurns/(tpTurns||1))}% of TP turns` +
              `  (${(overflow/runs).toFixed(2)} points per run)`);
}
console.log(`\n⏳ everything that does NOT overflow goes deck → discard, and every band boundary`);
console.log(`   (4 floors) reshuffles it all back in. So it costs card ORDER, not cards.`);
