// 🪙 THE MERCHANT'S FIRST NUMBERS (build 484). RUNSIM solo at ⭐1: pays, coins spent per run,
// the custom bonus at the lair, her ladder. ⚠️ The bot never bribes (no policy).
//   node dev/merchant-probe.js [N]
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 120);
H.useClass('merchant');
const defs = S.MERCHANT.defs;
console.log('profiles distinct:', new Set(defs.map(d => d.lv.map(r => r.join('/')).join('|'))).size, 'of', defs.length);
let turns = 0, pays = 0, paid = 0, bonusAtLair = 0, spentAtLair = 0, runs = 0, coinsAtLair = 0;
S.RUNSIM.setHook({
  onAssign: () => { const st = H.getS(); if (!st.foeState || !st.assign.Boost) return; turns++; if (st.forkOn) { pays++; const c = S.cardById(st.assign.Boost); paid += c ? S.eff(c).boost : 0; } },
  onLair: () => { const st = H.getS(); runs++; bonusAtLair += S.purseBonus(); spentAtLair += (st.k && st.k.spent) || 0; coinsAtLair += st.coins; },
});
H.seed(20260904);
const b = S.RUNSIM.batch(true, N);
const pct = (a, c) => c ? (100 * a / c).toFixed(0) + '%' : '—';
console.log(`runs ${N} · Purse turns ${turns} · paid for ${pct(pays, turns)} (avg price ${(paid / Math.max(1, pays)).toFixed(1)}) · at the lair: spent ${(spentAtLair / Math.max(1, runs)).toFixed(0)} coins → Strike +${(bonusAtLair / Math.max(1, runs)).toFixed(1)}, ${(coinsAtLair / Math.max(1, runs)).toFixed(0)} coins in hand`);
if (b && b.perDragon) console.log('ladder (duel win %):', Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/'), '· finale', b.finaleWinPct + '% · road complete', b.completePct + '%');
