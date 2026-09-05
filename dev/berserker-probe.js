// 🎲 THE BERSERKER'S FIRST NUMBERS (build 482). RUNSIM solo at ⭐1: opening die, reckless rate,
// explosions, stumbles, Rage, her ladder — and her SPREAD (win-rate variance across seeds), because
// a class whose power is variance can be noisy without being hard.   node dev/berserker-probe.js [N]
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 120);
H.useClass('berserker');
const defs = S.BERSERKER.defs;
const prof = defs.map(d => d.lv.map(r => [r[0], r[2], r[3], r[4]].join('/')).join(' | '));
console.log('profiles distinct:', new Set(prof).size, 'of', defs.length);
let turns = 0, reckless = 0, dieSum = 0, dieN = 0, explode = 0, stumble = 0, rageSum = 0, gambleSum = 0, gambleN = 0;
S.RUNSIM.setHook({ onAssign: () => {
  const st = H.getS(); if (!st.foeState || !st.assign.Boost) return;
  turns++; const k = st.k || {};
  if (k.die > 0) { dieSum += k.die; dieN++; }
  rageSum += k.rage || 0;
  if (st.forkOn) reckless++;
} });
const origAfter = S.BERSERKER.afterBlow;
S.BERSERKER.afterBlow = function (r, body) { if (r && r.klass && r.klass.reckless) { gambleN++; gambleSum += r.klass.gamble || 0; if (r.klass.exploded) explode++; if (r.klass.gamble && r.init === 0) stumble++; } return origAfter.call(this, r, body); };
H.seed(20260904);
const b = S.RUNSIM.batch(true, N);
const pct = (a, c) => c ? (100 * a / c).toFixed(0) + '%' : '—';
console.log(`runs ${N} · Gamble turns ${turns} · reckless ${pct(reckless, turns)} · opening die avg ${(dieSum / Math.max(1, dieN)).toFixed(2)} · Rage at arrange avg ${(rageSum / Math.max(1, turns)).toFixed(2)} · reckless die avg ${(gambleSum / Math.max(1, gambleN)).toFixed(2)} · exploded ${explode} · stumbled ${stumble}`);
if (b && b.perDragon) console.log('ladder (duel win %):', Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/'), '· finale', b.finaleWinPct + '% · road complete', b.completePct + '%');
