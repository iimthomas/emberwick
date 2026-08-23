// ⏳ HOW OFTEN ARE YOU LOCKED OUT OF SHARPENING, AND WHAT DOES IT COST?
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 250);
for (const cls of ['mage', 'rogue']) {
  let runs=0, stops=0, blocked=0, lv0=0, lvLair=0, mo=0, moT=0, maxD=0, dSum=0, tSum=0;
  for (let i=0;i<N;i++) {
    useClass(cls); seed(8200+i);
    let s0=null, lair=null, mx=0;
    const lv=()=>{const S=getS();return [...S.hand,...S.deck,...S.discard].reduce((a,c)=>a+c.level,0);};
    sandbox.RUNSIM.setHook({
      onAssign(){ const S=getS(); if(S.finalMode) return; if(s0===null) s0=lv();
        if((S.delayed||0)>mx) mx=S.delayed;
        dSum += (S.delayed||0); tSum++;
        if (cls==='rogue'){ moT++; if((S.momentum||0)>0) mo++; } },
      onLair(){ lair=lv(); },
      onWheel(){ } });
    try { sandbox.RUNSIM.autoRun(true); } catch(e){}
    const S=getS(); runs++; lv0 += s0||32; lvLair += lair||lv(); maxD = Math.max(maxD, mx);
  }
  console.log(`${cls.padEnd(6)} deck at lair ${(lvLair/runs).toFixed(1)} (from ${(lv0/runs).toFixed(0)}) · ` +
    `avg ⏳ carried ${(dSum/tSum).toFixed(2)} · worst seen ${maxD}` +
    (cls==='rogue' ? ` · holding ● ${Math.round(100*mo/moT)}%` : ''));
}
