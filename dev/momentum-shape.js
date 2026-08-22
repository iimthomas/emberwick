// ● A SHORT METER YOU FILL vs A LONG ONE YOU DO NOT. Same question, two designs.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 200);
function run(cap, val, brk) {
  setTunable('MOMENTUM_CAP', cap); setTunable('MOMENTUM_VALUE', val); setTunable('MOMENTUM_BREAK', brk);
  setTunable('MOMENTUM_STEP', 1);
  let turns = 0, held = 0, pips = 0, bonus = 0, atCap = 0, atZero = 0;
  const st = {};
  for (let i = 0; i < N; i++) {
    useClass('rogue'); seed(6100 + i);
    sandbox.RUNSIM.setHook({ onAssign() {
      const S = getS(); if (S.finalMode) return;
      const r = sandbox.computeAction(null); if (!r) return;
      turns++; const m = S.momentum || 0;
      pips += m; bonus += m * val;
      if (m > 0) held++; else atZero++;
      if (m >= cap) atCap++;
    } });
    let mm; try { mm = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS(), k = S.dragon.stage;
    const o = st[k] || (st[k] = { d:0, w:0 }); if (mm.win !== null) { o.d++; if (mm.win) o.w++; }
  }
  const duel = [1,2,3,4].map(k => st[k]&&st[k].d ? Math.round(100*st[k].w/st[k].d) : 0).join('/');
  return { held: Math.round(100*held/turns), empty: Math.round(100*atZero/turns),
           pips: (pips/turns).toFixed(1), bonus: (bonus/turns).toFixed(1),
           cap: Math.round(100*atCap/turns), max: cap*val, duel };
}
console.log('cap ×val break  meter empty  at FULL  avg pips  avg +dmg  ceiling  duel 1/2/3/4');
for (const [c,v,b,label] of [
  [5,1,1,'TODAY'], [3,1,1,'cap 3, same pips'], [3,2,1,'cap 3, pips worth 2'],
  [3,3,1,'cap 3, pips worth 3'], [5,1,4,'cap 5 + graze rule'], [3,2,4,'cap 3 ×2 + graze rule'] ]) {
  const r = run(c,v,b);
  console.log(` ${c}   ${v}    ${b}      ${String(r.empty).padStart(3)}%     ${String(r.cap).padStart(3)}%     ${r.pips.padStart(4)}      ${r.bonus.padStart(4)}      +${String(r.max).padStart(2)}     ${r.duel.padEnd(14)} ${label}`);
}
setTunable('MOMENTUM_CAP',5); setTunable('MOMENTUM_VALUE',1); setTunable('MOMENTUM_BREAK',1);
