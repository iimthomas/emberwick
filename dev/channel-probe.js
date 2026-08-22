// 🔥 CAN THE BOT CHANNEL NOW, AND HOW OFTEN IS IT FREE?
// ⚠️ Reported at BANK_WEIGHT 0.6 AND 0 — 0 reproduces the old never-banks bot exactly, so the
// difference between the columns IS the policy, and can never be mistaken for a fact about the game.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 200);

function run(weight, mult) {
  sandbox.RUNSIM.setBankWeight(weight);
  setTunable('BANK_MULT', mult);
  let turns = 0, channelled = 0, wakeSpent = 0, wakeHeld = 0, bankSum = 0;
  const st = {};
  for (let i = 0; i < N; i++) {
    useClass('mage'); seed(4400 + i);
    sandbox.RUNSIM.setHook({ onAssign() {
      const S = getS(); if (S.finalMode) return;
      const r = sandbox.computeAction(null); if (!r) return;
      turns++;
      if (r.banks) { channelled++; bankSum += r.bank || 0; }
      if (S.wake > 0) { wakeHeld++; if (r.wakeTarget) wakeSpent++; }
    } });
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS(), k = S.dragon.stage;
    const o = st[k] || (st[k] = { duels: 0, wins: 0 });
    if (m.win !== null) { o.duels++; if (m.win) o.wins++; }
  }
  const w = k => st[k] && st[k].duels ? Math.round(100 * st[k].wins / st[k].duels) : 0;
  return { pct: Math.round(100 * channelled / (turns || 1)),
           held: Math.round(100 * wakeHeld / (turns || 1)),
           spent: wakeHeld ? Math.round(100 * wakeSpent / wakeHeld) : 0,
           size: (bankSum / (channelled || 1)).toFixed(1),
           duel: [1,2,3,4].map(w).join('/') };
}

console.log('BANK_WEIGHT  BANK_MULT   channelled%  avg size  holding a wake%  spent it%  duel 1/2/3/4');
for (const [w, m] of [[0, 1.5], [0.6, 1.0], [0.6, 1.5], [0.6, 2.0]]) {
  const r = run(w, m);
  console.log(`   ${w.toFixed(1)}         ×${m.toFixed(1)}        ${String(r.pct).padStart(3)}%       ${r.size.padStart(4)}       ${String(r.held).padStart(3)}%          ${String(r.spent).padStart(3)}%     ${r.duel}`);
}
sandbox.RUNSIM.setBankWeight(0.6); setTunable('BANK_MULT', 1.5);
