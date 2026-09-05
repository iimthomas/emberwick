// 🏗️ THE ENGINEER'S FIRST NUMBERS (build 485). RUNSIM solo at ⭐1: builds, turret level at arrange,
// turret damage per blow, decay events, his ladder. ⚠️ The bot never sets a snare (no policy).
//   node dev/engineer-probe.js [N]
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 120);
H.useClass('engineer');
const defs = S.ENGINEER.defs;
console.log('profiles distinct:', new Set(defs.map(d => d.lv.map(r => r.join('/')).join('|'))).size, 'of', defs.length);
let turns = 0, builds = 0, lvSum = 0, dmgSum = 0, standing = 0;
S.RUNSIM.setHook({ onAssign: () => { const st = H.getS(); if (!st.foeState || !st.assign.Boost) return; turns++; if (st.forkOn) builds++; const lv = S.turretLv(); lvSum += lv; if (lv) standing++; dmgSum += S.turretDmg(); } });
H.seed(20260904);
const b = S.RUNSIM.batch(true, N);
const pct = (a, c) => c ? (100 * a / c).toFixed(0) + '%' : '—';
console.log(`runs ${N} · Workbench turns ${turns} · built ${pct(builds, turns)} · a turret standing on ${pct(standing, turns)} of turns · avg Lv ${(lvSum / Math.max(1, turns)).toFixed(2)} · avg +${(dmgSum / Math.max(1, turns)).toFixed(2)} to the Blow`);
if (b && b.perDragon) console.log('ladder (duel win %):', Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/'), '· finale', b.finaleWinPct + '% · road complete', b.completePct + '%');
