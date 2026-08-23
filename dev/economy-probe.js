// 🪙 SIZING A TIME-PENALTY COST: what does a run's economy actually look like?
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 200);
for (const cls of ['mage', 'rogue']) {
  let runs = 0, earned = 0, wheels = 0, upgrades = 0, charms = 0, tp = 0, encounters = 0, endCoins = 0;
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(8200 + i);
    let prevCoins = 0, gained = 0, w = 0, lv0 = null;
    sandbox.RUNSIM.setHook({ onAssign() {
      const S = getS(); if (S.finalMode) return;
      if (lv0 === null) lv0 = [...S.hand,...S.deck,...S.discard].reduce((a,c)=>a+c.level,0);
      const r = sandbox.computeAction(null); if (r) { tp += r.timePenalty || 0; encounters++; }
      if (S.coins > prevCoins) gained += S.coins - prevCoins;
      prevCoins = S.coins;
    } });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
    const S = getS(); runs++; earned += gained; endCoins += S.coins;
    charms += (S.charms||[]).length;
    upgrades += [...S.hand,...S.deck,...S.discard].reduce((a,c)=>a+c.level,0) - (lv0||32);
  }
  const d = n => (n/(runs||1)).toFixed(1);
  console.log(`${cls.padEnd(6)} coins earned/run ${d(earned).padStart(5)} · left over ${d(endCoins)} · ` +
    `charms ${d(charms)} · levels bought ${d(upgrades)} · encounters ${d(encounters)} · Time Penalty ${d(tp)}`);
}
