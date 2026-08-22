'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
let turns = 0, held = 0, sum = 0, atCap = 0, broke = 0, prev = 0;
for (let i = 0; i < 150; i++) {
  useClass('rogue'); seed(6100 + i); prev = 0;
  sandbox.RUNSIM.setHook({ onAssign() {
    const S = getS(); if (S.finalMode) return;
    turns++; const m = S.momentum || 0;
    if (m > 0) held++; sum += m;
    if (m >= sandbox.MOMENTUM_CAP) atCap++;
    if (m < prev) broke++; prev = m;
  } });
  try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
}
console.log(`rogue ● Momentum over ${turns} turns:`);
console.log(`  holding at least one pip: ${Math.round(100*held/turns)}%`);
console.log(`  average pips:             ${(sum/turns).toFixed(1)} of ${sandbox.MOMENTUM_CAP}`);
console.log(`  at full cap:              ${Math.round(100*atCap/turns)}%`);
console.log(`  broke this turn:          ${Math.round(100*broke/turns)}%`);
