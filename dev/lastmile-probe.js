// ⚔️ WHAT DOES THE LAST MILE ACTUALLY ASK? — the distribution of both races, measured.
// The MP race is tuned; the Pace race is printed against Nightfall 0, so nobody knows what
// Pace is even worth there. Before proposing a threshold, look at the spread.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');

const rows = { mage: [], rogue: [] };
for (const cls of ['mage', 'rogue']) {
  for (let i = 0; i < 120; i++) {
    useClass(cls); seed(5000 + i);
    let captured = null;
    sandbox.RUNSIM.setHook({
      onAssign() {
        const S = getS();
        if (S.finalPhase !== 'lastmile' || captured) return;
        const r = sandbox.computeAction(null);
        if (r) captured = { move: r.value, pace: r.pace != null ? r.pace : r.init,
                            init: r.init, mp: S.encounter.mp, dinit: S.dragon.init,
                            dragon: S.dragon.name, out: r.outcome };
      },
    });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    if (captured) rows[cls].push(captured);
  }
}

const pct = (a, f) => a.length ? Math.round(100 * a.filter(f).length / a.length) : 0;
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

for (const cls of ['mage', 'rogue']) {
  const a = rows[cls];
  if (!a.length) { console.log(cls, 'no samples'); continue; }
  const paces = a.map(r => r.pace), inits = a.map(r => r.init), moves = a.map(r => r.move);
  console.log(`\n=== ${cls} · n=${a.length} ===`);
  console.log(`  MOVE   median ${med(moves)}  (MP ${a[0].mp}, half ${Math.ceil(a[0].mp / 2)})`);
  console.log(`  outcome today:  Complete ${pct(a, r => r.out === 'Complete')}%  Narrow ${pct(a, r => r.out === 'Narrow')}%  Loss ${pct(a, r => r.out === 'Loss')}%`);
  console.log(`  PACE   median ${med(paces)}   min ${Math.min(...paces)}  max ${Math.max(...paces)}`);
  console.log(`  INIT   median ${med(inits)}   min ${Math.min(...inits)}  max ${Math.max(...inits)}`);
  console.log(`  dragon Init median ${med(a.map(r => r.dinit))}`);
  // the GAP is the thing to band on: pace minus the dragon it is racing
  const gaps = a.map(r => r.pace - r.dinit).sort((x, y) => x - y);
  const q = p => gaps[Math.min(gaps.length - 1, Math.floor(p * gaps.length))];
  console.log(`  GAP (pace - dragonInit) percentiles: 10%=${q(.1)} 25%=${q(.25)} 50%=${q(.5)} 75%=${q(.75)} 90%=${q(.9)}`);
  for (const d of [0, -1, -2, -3, -4, -5, -6, -7]) {
    console.log(`    gap >= ${d}: ${pct(a, r => r.pace - r.dinit >= d)}%   ·   gap <= ${d}: ${pct(a, r => r.pace - r.dinit <= d)}%`);
  }
}
