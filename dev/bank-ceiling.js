// 🔥 HOW STRONG IS THE MAGE WHEN SHE ACTUALLY CHANNELS?
// The bot's default policy (BANK_WEIGHT 0.6 × BANK_MULT 1.5 = 0.9 < 1) can NEVER prefer banking
// on a live turn, so every mage number ever recorded is her WITHOUT her slot ③. Thomas plays it.
// ⚠️ Reported against BANK_WEIGHT = 0 per the standing rule.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 400);
const WEIGHTS = (process.argv[3] || '0,0.6,0.8,1.0,1.3').split(',').map(Number);

console.log('BANK_W   banks/turn   duel win by stage        avg duel blow');
for (const w of WEIGHTS) {
  sandbox.setBankWeight(w);
  const st = {}; let turns = 0, banks = 0, blow = 0, blowN = 0;
  sandbox.RUNSIM.setHook({ onResolve(r) { turns++; if (r && r.banks) banks++; } });
  for (let i = 0; i < N; i++) {
    useClass('mage'); seed(8800 + i);
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS(), k = S.dragon.stage;
    const o = st[k] || (st[k] = { n: 0, win: 0 });
    o.n++; if (m.win) o.win++;
    if (S.stats && S.stats.duelBeats) { blow += S.stats.duelDmg / S.stats.duelBeats; blowN++; }
  }
  const row = [1,2,3,4].map(k => st[k] ? String(Math.round(100*st[k].win/st[k].n)).padStart(3) : ' --').join(' / ');
  console.log(`${String(w).padEnd(7)} ${String(Math.round(1000*banks/Math.max(1,turns))/10).padStart(6)}%      ${row}        ${(blow/Math.max(1,blowN)).toFixed(1)}`);
}
sandbox.setBankWeight(0.6);
