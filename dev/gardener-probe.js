// 🌱 THE GARDENER'S FIRST NUMBERS (build 486). RUNSIM solo at ⭐1: plants, harvests, the store,
// builds by tier at the lair, her ladder. The bot builds on the stated policy (BOT_POLICY).
//   node dev/gardener-probe.js [N]
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 120);
H.useClass('gardener');
const defs = S.GARDENER.defs;
console.log('profiles distinct:', new Set(defs.map(d => d.lv.map(r => r.join('/')).join('|') + (d.crop || ''))).size, 'of', defs.length);
let turns = 0, plants = 0, growing = 0, runs = 0, builds = { hedge: 0, hive: 0, mill: 0, bramble: 0 }, harvested = 0;
S.RUNSIM.setHook({
  onAssign: () => { const st = H.getS(); if (!st.foeState || !st.assign.Boost) return; turns++; if (st.forkOn) plants++; growing += ((st.k && st.k.plots) || []).length; },
  onLair: () => { const st = H.getS(); runs++; const b = (st.k && st.k.builds) || {}; for (const k of Object.keys(builds)) builds[k] += b[k] || 0; const r = (st.k && st.k.res) || {}; harvested += Object.values(r).reduce((a, c) => a + c, 0); },
});
H.seed(20260904);
const b = S.RUNSIM.batch(true, N);
const pct = (a, c) => c ? (100 * a / c).toFixed(0) + '%' : '—';
console.log(`runs ${N} · Plot turns ${turns} · planted ${pct(plants, turns)} · plots growing avg ${(growing / Math.max(1, turns)).toFixed(2)} · builds at the lair (avg tiers): ${Object.entries(builds).map(([k, v]) => k + ' ' + (v / Math.max(1, runs)).toFixed(2)).join(' · ')} · unspent crops at the lair ${(harvested / Math.max(1, runs)).toFixed(1)}`);
if (b && b.perDragon) console.log('ladder (duel win %):', Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/'), '· finale', b.finaleWinPct + '% · road complete', b.completePct + '%');
