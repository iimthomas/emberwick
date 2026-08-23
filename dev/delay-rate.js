// ⏳ measured at the ASSIGN phase, which fires exactly once per encounter and cannot be missed.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 250);
console.log('×TP   class    encounters/run   entered while DELAYED   ended run delayed   deck at end');
for (const mult of [1.0, 2.0, 3.0]) {
  setTunable('TIME_PENALTY_MULT', mult);
  for (const cls of ['mage','rogue']) {
    let runs=0, enc=0, del=0, endDel=0, lv=0;
    for (let i=0;i<N;i++) {
      useClass(cls); seed(8200+i);
      sandbox.RUNSIM.setHook({ onAssign(){ const S=getS(); if(S.finalMode) return;
        enc++; if((S.delayed||0)>0) del++; } });
      try { sandbox.RUNSIM.autoRun(true); } catch(e){}
      const S=getS(); runs++; endDel += (S.delayed||0);
      lv += [...S.hand,...S.deck,...S.discard].reduce((a,c)=>a+c.level,0);
    }
    console.log(`×${mult.toFixed(1)} ${cls.padEnd(7)} ${(enc/runs).toFixed(1).padStart(6)}        ` +
      `${String(Math.round(100*del/enc)).padStart(3)}%                  ${(endDel/runs).toFixed(1).padStart(4)}          ${(lv/runs).toFixed(1)}`);
  }
}
setTunable('TIME_PENALTY_MULT', 1.0);
