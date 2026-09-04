// ⭐ THE META LADDER (2026-09-04). A class's win rate per stage at account levels 1 / 4 / 8 / 12 / max,
// then max WITH the full stash. The table Thomas's intent is measured against: a fresh account should
// hit a wall at stage 1 and the meta layer should be what breaks it.
//   node dev/meta-ladder.js [N per row] [class]
// ⚠️ Pins XP_LEVEL_FORCE directly — RUNSIM.setLevel() only applies inside run(), not batch().
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 120);
const cls = process.argv[3] || 'mage';
H.useClass(cls);
const cap = S.LEVEL_CAP;
const rows = [1, 4, 8, 12, cap].filter((v, i, a) => a.indexOf(v) === i);
function measure(label) {
  let charms = 0, runs = 0, lvSeen = null;
  S.RUNSIM.setHook({ onLair: () => { const s = H.getS(); charms += s.charms.length; runs++; lvSeen = S.accountLevel(); } });
  H.seed(20260904);
  const b = S.RUNSIM.batch(true, N);
  console.log(`${label.padEnd(24)} (reads ⭐${lvSeen})  duel ${Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/').padEnd(12)} finale ${String(b.finaleWinPct).padStart(3)}% · charms at the lair ${(charms / Math.max(1, runs)).toFixed(1)}`);
}
console.log(`${cls} · n=${N} per row (${N / 4} per stage) · account cap ⭐${cap}`);
for (const lv of rows) {
  H.setTunable('XP_LEVEL_FORCE', lv); H.setTunable('CLASS_LEVEL_FORCE', Math.min(lv, S.classCap(cls)));
  measure(`⭐${lv}${lv === cap ? ' (max)' : ''}`);
}
S.devUnlockAll();
H.setTunable('XP_LEVEL_FORCE', cap); H.setTunable('CLASS_LEVEL_FORCE', S.classCap(cls));
measure(`⭐${cap} + full stash`);
