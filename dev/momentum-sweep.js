// ● THREE SHAPES FOR THE STREAK. Expected length is p/(1-p) and P(cap) is p^cap, so payout tuning
// cannot deepen it — only p (the break rule), the cap, or the earn STEP can.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 200);
function run(cap, step, brk) {
  setTunable('MOMENTUM_CAP', cap); setTunable('MOMENTUM_STEP', step); setTunable('MOMENTUM_BREAK', brk);
  let turns = 0, held = 0, sum = 0, atCap = 0, broke = 0, prev = 0, dmgTurns = 0;
  const st = {}; 
  for (let i = 0; i < N; i++) {
    useClass('rogue'); seed(6100 + i); prev = 0;
    sandbox.RUNSIM.setHook({ onAssign() {
      const S = getS(); if (S.finalMode) return;
      const r = sandbox.computeAction(null); if (!r) return;
      turns++; const m = S.momentum || 0;
      if (m > 0) held++; sum += m;
      if (m >= cap) atCap++;
      if (m < prev) broke++; prev = m;
      if ((r.early||0)+(r.combatDmg||0) > 0) dmgTurns++;
    } });
    let mm; try { mm = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS(), k = S.dragon.stage;
    const o = st[k] || (st[k] = { d:0, w:0 });
    if (mm.win !== null) { o.d++; if (mm.win) o.w++; }
  }
  const duel = [1,2,3,4].map(k => st[k] && st[k].d ? Math.round(100*st[k].w/st[k].d) : 0).join('/');
  return { held: Math.round(100*held/turns), avg: (sum/turns).toFixed(1),
           cap: Math.round(100*atCap/turns), broke: Math.round(100*broke/turns), duel };
}
console.log('cap step break   holding  avg pips  at cap  breaks/turn   duel 1/2/3/4   what it is');
const rows = [
  [5,1,1,'TODAY — any damage shatters it'],
  [3,1,1,'lower the cap so it is reachable'],
  [5,2,1,'a clean turn earns TWO'],
  [5,1,3,'a GRAZE does not break your rhythm'],
  [5,1,4,'...only a real blow does'],
  [3,1,3,'lower cap + graze rule'],
];
for (const [c,s2,b,label] of rows) {
  const r = run(c,s2,b);
  console.log(` ${c}   ${s2}    ${b}     ${String(r.held).padStart(3)}%     ${r.avg.padStart(4)}     ${String(r.cap).padStart(3)}%      ${String(r.broke).padStart(3)}%      ${r.duel.padEnd(14)} ${label}`);
}
setTunable('MOMENTUM_CAP',5); setTunable('MOMENTUM_STEP',1); setTunable('MOMENTUM_BREAK',1);
