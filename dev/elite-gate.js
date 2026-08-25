// 💀 SHOULD THE ELITE CHARM NEED A COMPLETE, OR IS SURVIVING ENOUGH?
// Thomas: *"for an elite, should you only get a charm if you complete it, and not just narrow"*
//
// 🔑 THE QUESTION IS NOT WHICH RULE IS FAIRER — IT IS HOW OFTEN THE REWARD EXISTS AT ALL. A prize
// almost nobody ever sees cannot be the reason to route toward danger, which is the elite's whole
// job on the map. Complete-only was measured once before and rejected on exactly that ground; this
// re-measures it at build 397, because damage went ×1.30 since and the note may be stale.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();

const RUNS = +(process.argv[2] || 150);
const CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS);
B.RUNSIM.setBankWeight(1.0);

// hook the one site that already knows both facts: the outcome and the node under your feet
const tally = { elite: { Complete: 0, Narrow: 0, Loss: 0 }, road: { Complete: 0, Narrow: 0, Loss: 0 } };
let runsSeen = 0;
const real = B.finishResolve;
B.finishResolve = function () {
  const s = S();
  if (s.pendingR && s.map && s.map.pos) {
    const here = s.map.floors[s.map.pos.f][s.map.pos.c];
    const box = (here && here.type === 'elite') ? tally.elite : tally.road;
    box[s.pendingR.outcome]++;
  }
  return real.apply(this, arguments);
};
for (let i = 0; i < RUNS; i++) {
  H.seed(7700 + i);
  try { const m = B.RUNSIM.autoRun(true); if (m) runsSeen++; } catch (e) {}
}
B.finishResolve = real;

const pc = (n, d) => d ? Math.round(100 * n / d) : 0;
const show = (name, t) => {
  const n = t.Complete + t.Narrow + t.Loss;
  console.log(`  ${name.padEnd(12)} ${String(n).padStart(4)} fought   ` +
    `Complete ${String(pc(t.Complete, n)).padStart(3)}%  ` +
    `Narrow ${String(pc(t.Narrow, n)).padStart(3)}%  ` +
    `Loss ${String(pc(t.Loss, n)).padStart(3)}%`);
};
console.log(`\n💀 ELITE OUTCOMES — ${CLS}, ${runsSeen} runs, ⭐6/🎭3, damage ×${H.getTunable('FOE_ATK_MULT')}\n`);
show('elite', tally.elite);
show('ordinary', tally.road);
const e = tally.elite, n = e.Complete + e.Narrow + e.Loss;
console.log(`\n  elites fought per run          ${(n / runsSeen).toFixed(2)}`);
console.log(`\n  CHARMS PAID PER RUN:`);
console.log(`    survive  (today)             ${((e.Complete + e.Narrow) / runsSeen).toFixed(2)}`);
console.log(`    Complete only (proposed)     ${(e.Complete / runsSeen).toFixed(2)}`);
console.log(`\n  for scale — a run buys ~6 charms at the Wheel`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
