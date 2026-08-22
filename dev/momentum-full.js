// ● DOES A SPLIT STRIKE AT FULL METER PAY LATERALLY RATHER THAN VERTICALLY?
// 🔑 The test is NOT "did her win rate go up" — it is "did it go up LESS than a damage buff of the
// same excitement would have, and did it move differently against different SHAPES."
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 320);
function run(full, val) {
  setTunable('MOMENTUM_CAP', 3); setTunable('MOMENTUM_VALUE', val);
  setTunable('MOMENTUM_BREAK', 1); setTunable('MOMENTUM_STEP', 1);
  sandbox.setTunable('MOMENTUM_FULL', full);
  const st = {}; let turns = 0, atFull = 0, multi = 0, blow = 0;
  const shape = { armour: {n:0,C:0}, evasion: {n:0,C:0}, guard: {n:0,C:0}, none: {n:0,C:0} };
  for (let i = 0; i < N; i++) {
    useClass('rogue'); seed(6100 + i);
    sandbox.RUNSIM.setHook({ onAssign() {
      const S = getS(), e = S.encounter; if (S.finalMode || !e) return;
      const r = sandbox.computeAction(null); if (!r) return;
      turns++; blow += r.value;
      if ((S.momentum||0) >= 3) atFull++;
      if ((r.hits||1) > 1) multi++;
      if (e.type === 'fight') {
        const sh = (e.shapes && e.shapes[0]) || e.shape || 'none';
        const b = shape[sh] || shape.none; b.n++; if (r.outcome === 'Complete') b.C++;
      }
    } });
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS(), k = S.dragon.stage;
    const o = st[k] || (st[k] = { d:0, w:0 }); if (m.win !== null) { o.d++; if (m.win) o.w++; }
  }
  const duel = [1,2,3,4].map(k => st[k]&&st[k].d ? Math.round(100*st[k].w/st[k].d) : 0);
  const sh = k => shape[k].n ? Math.round(100*shape[k].C/shape[k].n) : 0;
  return { atFull: Math.round(100*atFull/turns), multi: Math.round(100*multi/turns),
           blow: (blow/turns).toFixed(1), duel,
           byShape: `armour ${sh('armour')}% · evasion ${sh('evasion')}% · guard ${sh('guard')}% · open ${sh('none')}%` };
}
console.log('config                       at full  multi-hit  blow   duel 1/2/3/4        Complete% by enemy shape');
for (const [f,v,label] of [
  [0,1,'cap 3, pips +1 (baseline)'],
  [0,2,'cap 3, pips +2 (the damage buff)'],
  ['add',1,'+1 hit at full, keep pips'],
  ['convert',1,'+1 hit at full INSTEAD of pips'] ]) {
  const r = run(f,v);
  console.log(`${label.padEnd(30)} ${String(r.atFull).padStart(3)}%     ${String(r.multi).padStart(3)}%    ${r.blow.padStart(4)}   ${r.duel.join('/').padEnd(16)}  ${r.byShape}`);
}
sandbox.setTunable('MOMENTUM_FULL', 0); setTunable('MOMENTUM_VALUE', 1);
