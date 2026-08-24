// 🃏 IS `par` STILL TRUE? par is *the deck a winner brings TO THE LAIR*, and the record says every
// power change invalidates it. The xp gate changed available power and par was never re-measured.
// ⚠️ The Standing chip prints `Deck N → par` on every run; a par nobody reaches is a display that
// always says you are losing, which the record calls worse than no display at all.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const N = +(process.argv[2] || 80);

function sweep(lv, clsLv) {
  H.setTunable('XP_LEVEL_FORCE', lv); H.setTunable('CLASS_LEVEL_FORCE', clsLv);
  const out = {};
  for (const cls of ['mage', 'rogue']) {
    H.useClass(cls);
    const rows = [];
    for (let i = 0; i < N; i++) {
      H.seed(5500 + i);
      let atLair = null;
      B.RUNSIM.setHook({ onLair: () => {
        const s = S();
        atLair = [...s.hand, ...s.deck, ...s.discard].reduce((t, c) => t + c.level, 0);
      }});
      try { B.RUNSIM.autoRun(true); } catch (e) {}
      B.RUNSIM.setHook({});
      const s = S();
      if (atLair !== null) rows.push({ atLair, won: s.phase === 'victory', stage: s.dragon.stage, par: s.dragon.par });
    }
    const med = a => { const x = a.slice().sort((p, q) => p - q); return x.length ? x[Math.floor(x.length / 2)] : 0; };
    out[cls] = [1, 2, 3, 4].map(st => {
      const r = rows.filter(x => x.stage === st);
      const w = r.filter(x => x.won).map(x => x.atLair), l = r.filter(x => !x.won).map(x => x.atLair);
      return { st, par: r[0] && r[0].par, winners: med(w), losers: med(l), n: r.length, winPct: r.length ? Math.round(100*w.length/r.length) : 0 };
    });
  }
  H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
  return out;
}

for (const [lab, lv, cl] of [['fresh account  ⭐1/🎭1', 1, 1], ['maxed account  ⭐11/🎭5', 11, 5]]) {
  const r = sweep(lv, cl);
  console.log(`\n═══ ${lab} ═══`);
  console.log('        stage  par   winners bring   losers bring   win%');
  for (const cls of ['mage', 'rogue'])
    r[cls].forEach(x => console.log(`  ${cls.padEnd(6)}  ${x.st}     ${String(x.par).padStart(2)}        ${String(x.winners).padStart(3)}            ${String(x.losers).padStart(3)}        ${x.winPct}%`));
}
