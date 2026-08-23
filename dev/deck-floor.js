// 🃏 CAN DECK-AS-HEALTH ACTUALLY REACH ZERO? The run has exactly one failure point — the duel —
// and 0 of 800 runs died before it. If the road can never kill you, the whole run before the lair
// is a resource warm-up, which is what "no highs and lows" means structurally.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 300);
for (const cls of ['mage', 'rogue']) {
  const atLair = [], lowest = [];
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(5200 + i);
    let low = 99, lair = null;
    sandbox.RUNSIM.setHook({
      onAssign() { const S = getS(); if (!S.finalMode) low = Math.min(low, S.hand.length + S.deck.length + S.discard.length); },
      onLair() { const S = getS(); lair = S.hand.length + S.deck.length + S.discard.length; },
    });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    if (lair != null) { atLair.push(lair); lowest.push(low); }
  }
  const pct = (a, p) => a.slice().sort((x,y)=>x-y)[Math.floor(a.length*p)];
  const under = (a, n) => Math.round(100 * a.filter(x => x < n).length / a.length);
  console.log(`\n${cls.toUpperCase()} (${atLair.length} runs) — CARDS you still own`);
  console.log(`  at the lair:  min ${Math.min(...atLair)} · p10 ${pct(atLair,.1)} · median ${pct(atLair,.5)} · max ${Math.max(...atLair)}`);
  console.log(`  lowest ever:  min ${Math.min(...lowest)} · p10 ${pct(lowest,.1)} · median ${pct(lowest,.5)}`);
  console.log(`  runs that ever fell below  8 cards: ${under(lowest,8)}%  ·  below 6: ${under(lowest,6)}%  ·  below 4: ${under(lowest,4)}%`);
}
