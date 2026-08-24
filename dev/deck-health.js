// 🃏 WHERE DECK-AS-HEALTH ACTUALLY SITS. The pillar couples three things most games separate:
// your health bar, your damage, and your progression currency. So one lever moves all three, and
// the instrument has already watched it fail in BOTH directions:
//   • SNOWBALL — 41% of runs never dipped below their start (upgrades outpaced damage)
//   • SPIRAL   — 50% of stage-4 losses were unwinnable on arrival, discovered four beats late
// This reads the current tuning against both.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const N = +(process.argv[2] || 60);
H.setTunable('XP_LEVEL_FORCE', 1); H.setTunable('CLASS_LEVEL_FORCE', 1);

const levels = () => {
  const s = S();
  return [...s.hand, ...s.deck, ...s.discard].reduce((t, c) => t + c.level, 0);
};

for (const cls of ['mage', 'rogue']) {
  H.useClass(cls);
  const rows = [];
  for (let i = 0; i < N; i++) {
    H.seed(4400 + i);
    let lo = Infinity, start = null;
    B.RUNSIM.setHook({ onAssign: () => {
      const v = levels();
      if (start === null) start = v;
      if (v < lo) lo = v;
    }});
    try { B.RUNSIM.autoRun(true); } catch (e) {}
    B.RUNSIM.setHook({});
    const s = S();
    const end = levels();
    if (start === null) continue;
    rows.push({ start, lo, end, won: s.phase === 'victory',
                destroyed: (s.trashed || []).length, par: s.dragon && s.dragon.par });
  }
  const avg = f => (rows.reduce((t, r) => t + f(r), 0) / rows.length);
  const pct = f => Math.round(100 * rows.filter(f).length / rows.length);
  console.log(`\n${cls.toUpperCase()}  (n=${rows.length}, fresh account)`);
  console.log(`  start ${avg(r => r.start).toFixed(1)}  →  lowest held ${avg(r => r.lo).toFixed(1)}  →  end ${avg(r => r.end).toFixed(1)}`);
  console.log(`  net change            ${(avg(r => r.end - r.start) >= 0 ? '+' : '') + avg(r => r.end - r.start).toFixed(1)}`);
  console.log(`  deepest dip           ${avg(r => r.start - r.lo).toFixed(1)} of ${avg(r => r.start).toFixed(0)}`);
  console.log(`  🔴 never dipped        ${pct(r => r.lo >= r.start)}%   ← snowball signature`);
  console.log(`  cards destroyed       ${avg(r => r.destroyed).toFixed(1)}`);
  console.log(`  arrived at/above par  ${pct(r => r.par && r.end >= r.par)}%   (par ${rows[0] && rows[0].par})`);
  const w = rows.filter(r => r.won), l = rows.filter(r => !r.won);
  if (w.length && l.length)
    console.log(`  deck at the end — winners ${(w.reduce((t,r)=>t+r.end,0)/w.length).toFixed(1)} vs losers ${(l.reduce((t,r)=>t+r.end,0)/l.length).toFixed(1)}`);
}
