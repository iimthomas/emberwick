// 🏹 THE RANGER, first measurement (build 478). RUNSIM solo at ⭐1: mark vs loose rate, marks laid,
// certain blows landed (and what they saved), her sight, and her ladder. Plus the 8-profile check.
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 120);
H.useClass('ranger'); H.seed(+(process.argv[3] || 20260903));

const defs = S.RANGER.defs;
const prof = defs.map(d => d.lv.map(r => [r[0], r[2], r[3], r[4]].join('/')).join(' · '));
console.log('profiles distinct:', new Set(prof).size, 'of', defs.length);
defs.forEach((d, i) => console.log(`  ${d.name.padEnd(13)} ${d.role.padEnd(8)} ${prof[i]}`));

let turns = 0, marks = 0, looses = 0, certain = 0, savedArmour = 0, marksVsArmour = 0, marksVsEvasion = 0, marksVsNone = 0;
S.RUNSIM.setHook({ onAssign: () => {
  const st = H.getS();
  if (!st.encounter || st.encounter.type !== 'fight' || !st.assign.Boost) return;
  turns++;
  if (st.markArmed) { marks++; const e = st.encounter; if (e.shape === 'armour') marksVsArmour++; else if (e.shape === 'evasion') marksVsEvasion++; else marksVsNone++; }
  else looses++;
  if (S.statusN('mark') > 0) { certain++; if (st.encounter.shape === 'armour') savedArmour += st.encounter.shapeV || 0; }
} });
const b = S.RUNSIM.batch(true, N);
const pct = (a, c) => c ? (100 * a / c).toFixed(0) + '%' : '—';
console.log(`runs ${N} · Quiver turns ${turns} · marked ${pct(marks, turns)} / loosed ${pct(looses, turns)} · marks vs Armour ${marksVsArmour} / Evasion ${marksVsEvasion} / unguarded ${marksVsNone} · blows made certain ${certain} (Armour saved ${savedArmour})`);
console.log('sight with candle lit (solo):', (() => { S.freshGame(1); return S.partySight(); })());
if (b && b.perDragon) console.log('ladder (duel win %):', Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/'), '· finale', b.finaleWinPct + '% · road complete', b.completePct + '%');
