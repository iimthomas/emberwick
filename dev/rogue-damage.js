// 🗡️ "I NEVER REALLY GOT HIT" — where does the rogue's damage actually come from?
// Early damage only lands when you LOSE the Initiative race. If she almost never loses it, her
// only damage source is losing an encounter outright — and deck-as-health goes inert on the road.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 150);

function survey(cls) {
  let turns = 0, initLost = 0, early = 0, combat = 0, tp = 0, cleanTurns = 0;
  const byOutcome = { Complete: 0, Narrow: 0, Loss: 0 };
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(7700 + i);
    sandbox.RUNSIM.setHook({
      onAssign() {
        const S = getS();
        if (S.finalMode) return;
        const r = sandbox.computeAction(null);
        if (!r) return;
        turns++;
        byOutcome[r.outcome]++;
        if (r.type === 'fight' && r.initLost) initLost++;
        const e = r.early || 0, c = r.combatDmg || 0, t = r.timePenalty || 0;
        early += e; combat += c; tp += t;
        if (e + c + t === 0) cleanTurns++;
      },
    });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
  }
  const p = n => Math.round(100 * n / (turns || 1));
  return {
    turns, initLostPct: p(initLost), cleanPct: p(cleanTurns),
    early: +(early / turns).toFixed(2), combat: +(combat / turns).toFixed(2), tp: +(tp / turns).toFixed(2),
    outcome: `${p(byOutcome.Complete)}C/${p(byOutcome.Narrow)}N/${p(byOutcome.Loss)}L`,
  };
}

console.log('per non-finale turn, over full runs:\n');
for (const cls of ['rogue', 'mage']) {
  const s = survey(cls);
  console.log(`${cls.padEnd(6)} n=${s.turns} turns · ${s.outcome}`);
  console.log(`       lost the Initiative race: ${s.initLostPct}% of fights-worth of turns`);
  console.log(`       🔑 turns that cost NOTHING at all: ${s.cleanPct}%`);
  console.log(`       avg per turn — early ${s.early} · combat ${s.combat} · time penalty ${s.tp}\n`);
}
