// 🌊 SURGE CUT + THE NUMBERS ON THE CARDS (2026-09-04, Thomas: "when i meant buff, i meant the
// numbers on the cards, like attack, initiative, boost numbers"). Surge fires no effect; each arm
// adds a flat amount to one printed stat on every mage card at every level. Same seeds.
//   node dev/surge-cut-stats.js [N]
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 240);
H.useClass('mage');
const COL = { value: 0, init: 2, boost: 3, armour: 4 };
const base = S.CARD_DEFS.map(d => d.lv.map(r => r.slice()));
function arm(label, surge, deltas) {
  S.CARD_DEFS.forEach((d, i) => d.lv.forEach((r, l) => { for (let k = 0; k < r.length; k++) r[k] = base[i][l][k]; }));
  H.setTunable('SURGE_MARKS', surge);
  for (const [stat, dv] of Object.entries(deltas)) S.CARD_DEFS.forEach(d => d.lv.forEach(r => { r[COL[stat]] += dv; }));
  let turns = 0, fx = 0;
  S.RUNSIM.setHook({ onAssign: () => { const st = H.getS(); if (!st.foeState) return; turns++; fx += S.previewMarks({ banks: st.bankArmed }).length; } });
  H.seed(20260904);
  const b = S.RUNSIM.batch(true, N);
  console.log(`${label.padEnd(30)} duel ${Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/').padEnd(12)} finale ${String(b.finaleWinPct).padStart(2)}% · road ${b.completePct}% · effects/turn ${(fx / turns).toFixed(2)}`);
}
arm('shipped', 1, {});
arm('cut', 0, {});
arm('cut · attack +1', 0, { value: 1 });
arm('cut · attack +2', 0, { value: 2 });
arm('cut · boost +1', 0, { boost: 1 });
arm('cut · boost +2', 0, { boost: 2 });
arm('cut · initiative +1', 0, { init: 1 });
arm('cut · initiative +2', 0, { init: 2 });
arm('cut · attack +1 · boost +1', 0, { value: 1, boost: 1 });
arm('cut · attack +1 · initiative +1', 0, { value: 1, init: 1 });
