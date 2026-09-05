// ⚔️ THE BLOW SWEEP (2026-09-05). Every class after the mage sits under her at stages 2–4 for one
// reason: the dragons' HP was set to her attuned blow, and a smaller blow cannot reach it inside
// the deck's ammunition. This adds +N to the VALUE of each class's blow cards (the ones whose value
// grows with level) at every level, and re-measures.   node dev/blow-sweep.js <class> [N per arm] [arms]
const H = require('./headless.js');
const S = H.sandbox;
const cls = process.argv[2] || 'berserker';
const N = +(process.argv[3] || 160);
const arms = (process.argv[4] || '0,3,4').split(',').map(Number);
H.useClass(cls);
const defs = S.CLASSES[cls].defs;
const blow = defs.filter(d => d.lv[3][0] - d.lv[0][0] >= 6);
const base = defs.map(d => d.lv.map(r => r.slice()));
console.log(`${cls} · blow cards: ${blow.map(d => d.name).join(', ')}`);
for (const add of arms) {
  defs.forEach((d, i) => d.lv.forEach((r, l) => { r[0] = base[i][l][0] + (blow.includes(d) ? add : 0); }));
  H.seed(20260905);
  const b = S.RUNSIM.batch(true, N);
  console.log(`${cls.padEnd(12)} +${add}  duel ${Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/').padEnd(12)} finale ${String(b.finaleWinPct).padStart(2)}%`);
}
