// ✦ DOES A BIGGER BONUS MAKE ATTUNING OBLIGATORY? The acceptance test on file is
// "attune availability 75-85%, obligation 35-50%" — a buff that pushes obligation to ~100%
// makes her turn MORE solved, which is the opposite of what a "too simple" report wants.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 120);
console.log('ATTUNE  turns  attuned%  avail%  obligation%(attuned when available)  naive=optimal%');
for (const b of [1, 2, 3, 4]) {
  setTunable('ATTUNE_BONUS', b);
  let turns = 0, attuned = 0, avail = 0, naive = 0;
  for (let i = 0; i < N; i++) {
    useClass('mage'); seed(6100 + i);
    sandbox.RUNSIM.setHook({ onAssign() {
      const S = getS(); if (S.finalMode) return;
      const r = sandbox.computeAction(null); if (!r) return;
      turns++;
      const els = S.hand.map(c => sandbox.elOf(c));
      const can = els.some((e, i2) => els.indexOf(e) !== i2);
      if (can) avail++;
      if (r.enhUsed) attuned++;
      // naive = is the Spell simply the biggest-value card in hand?
      const big = S.hand.slice().sort((a, c) => sandbox.eff(c).value - sandbox.eff(a).value)[0];
      if (big && S.assign.Spell === big.id) naive++;
    } });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
  }
  const p = n => String(Math.round(100 * n / (turns || 1))).padStart(3);
  console.log(`  +${b}    ${String(turns).padStart(5)}   ${p(attuned)}%     ${p(avail)}%      ` +
              `${String(Math.round(100 * attuned / (avail || 1))).padStart(3)}%                        ${p(naive)}%`);
}
setTunable('ATTUNE_BONUS', 1);
