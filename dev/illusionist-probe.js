// 🎭 THE ILLUSIONIST'S FIRST NUMBERS (build 483). RUNSIM solo at ⭐1: summons, illusions standing,
// hits absorbed, illusions fallen, cards returned softened/lost, her ladder.   node dev/illusionist-probe.js [N]
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 120);
H.useClass('illusionist');
const defs = S.ILLUSIONIST.defs;
console.log('profiles distinct:', new Set(defs.map(d => d.lv.map(r => r.join('/')).join('|') + (d.body || ''))).size, 'of', defs.length, '· every card blocks', [...new Set(defs.flatMap(d => d.lv.map(r => r[4])))].join('/'));
let turns = 0, summons = 0, standing = 0, blow = 0, init = 0, kinds = {};
S.RUNSIM.setHook({ onAssign: () => {
  const st = H.getS(); if (!st.foeState || !st.assign.Boost) return;
  turns++; const ill = (st.k && st.k.illusions) || []; standing += ill.length;
  blow += ill.filter(i => i.kind === 'blow').length; init += ill.filter(i => i.kind === 'init').length;
  if (st.forkOn) { summons++; const c = S.cardById(st.assign.Boost); if (c && c.def.kind) kinds[c.def.name] = (kinds[c.def.name] || 0) + 1; }
} });
let absorbed = 0, fallen = 0, softened = 0, lost = 0;
const sh = S.ILLUSIONIST.shield;
S.ILLUSIONIST.shield = function (n) { const st = H.getS(); const before = ((st.k && st.k.illusions) || []).length, d0 = st.discard.length, t0 = st.trashed.length; const left = sh.call(this, n); absorbed += n - left; const after = ((st.k && st.k.illusions) || []).length; fallen += before - after; softened += st.discard.length - d0; lost += st.trashed.length - t0; return left; };
H.seed(20260904);
const b = S.RUNSIM.batch(true, N);
const pct = (a, c) => c ? (100 * a / c).toFixed(0) + '%' : '—';
console.log(`runs ${N} · Veil turns ${turns} · summoned ${pct(summons, turns)} ${JSON.stringify(kinds)} · illusions standing avg ${(standing / Math.max(1, turns)).toFixed(2)} (blow ${(blow / Math.max(1, turns)).toFixed(2)} / swift ${(init / Math.max(1, turns)).toFixed(2)}) · damage absorbed ${absorbed} · fallen ${fallen} (cards back ${softened}, lost ${lost})`);
if (b && b.perDragon) console.log('ladder (duel win %):', Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/'), '· finale', b.finaleWinPct + '% · road complete', b.completePct + '%');
