// ⚔️ what a class actually brings to the duel: avg blow per duel turn, turns fought, Initiative won, and the deck at the end
//   node dev/duel-blow.js <class> [N]
const H = require('./headless.js');
const S = H.sandbox;
const cls = process.argv[2] || 'ranger', N = +(process.argv[3] || 80);
H.useClass(cls);
let turns = 0, blow = 0, won = 0, fights = 0, ends = 0, deckAtEnd = 0, forks = 0;
S.RUNSIM.setHook({ onDuelAssign: () => { const st = H.getS(); if (!(st.finalMode && st.finalPhase === 'duel')) return; const r = S.computeAction(S.cardById(st.assign.Reserve)); if (!r) return; turns++; blow += r.value + (r.boost || 0); if (st.forkOn || st.markArmed || st.stillArmed || st.guardStance === 'taunt') forks++; const ds = st.dragonState; if (ds && r.init >= (ds.init || 0)) won++; } });
H.seed(20260905);
const b = S.RUNSIM.batch(true, N);
console.log(`${cls.padEnd(12)} duel turns ${turns} · avg blow+boost ${(blow / Math.max(1, turns)).toFixed(1)} · fork used ${(100 * forks / Math.max(1, turns)).toFixed(0)}% · race won ${(100 * won / Math.max(1, turns)).toFixed(0)}% · ladder ${Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/')} · finale ${b.finaleWinPct}%`);
