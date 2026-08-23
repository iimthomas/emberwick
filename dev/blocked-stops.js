// ⏳ THE NUMBER THAT MATTERS: what fraction of shop stops are you locked out of?
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 250);
// hook the real gate rather than guessing when a stop happens
const realDone = sandbox.wheelDone;
let stops = 0, blocked = 0;
sandbox.wheelDone = function () { const S = getS(); stops++; if ((S.delayed||0) > 0) blocked++; return realDone.apply(this, arguments); };
for (const mult of [1.0, 1.5, 2.0, 3.0])
for (const cls of ['mage','rogue']) {
  setTunable('TIME_PENALTY_MULT', mult);
  stops = 0; blocked = 0;
  let runs=0, lv=0, tp=0, turns=0;
  for (let i=0;i<N;i++) {
    useClass(cls); seed(8200+i);
    sandbox.RUNSIM.setHook({ onAssign(){ const S=getS(); if(S.finalMode) return;
      const r = sandbox.computeAction(null); if (r) { turns++; tp += r.timePenalty||0; } } });
    try { sandbox.RUNSIM.autoRun(true); } catch(e){}
    const S=getS(); runs++; lv += [...S.hand,...S.deck,...S.discard].reduce((a,c)=>a+c.level,0);
  }
  console.log(`×${mult.toFixed(1)} ${cls.padEnd(6)} shop stops/run ${(stops/runs).toFixed(1)} · ` +
    `🔑 BLOCKED ${Math.round(100*blocked/(stops||1))}% of them (${(blocked/runs).toFixed(1)}/run) · ` +
    `Time Penalty ${(tp/runs).toFixed(1)}/run · deck end ${(lv/runs).toFixed(1)}`);
}
