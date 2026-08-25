// 💀 AT WHAT HP MULTIPLIER DOES A CLEAN ELITE KILL BECOME POSSIBLE AT ALL?
// 🔑 A gate on an outcome the arithmetic forbids is not a hard gate, it is a dead one — the same
// shape as 🧱 Guard 2 (halves your first N hits when the game's hit ceiling is 2). Before asking
// whether the charm SHOULD need a Complete, ask whether a Complete is reachable.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const RUNS = +(process.argv[2] || 100);
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
B.RUNSIM.setBankWeight(1.0);

const real = B.finishResolve;
function measure(cls, hp) {
  H.useClass(cls);
  H.setTunable('ELITE_HP', hp);
  const t = { Complete: 0, Narrow: 0, Loss: 0 };
  let runs = 0;
  B.finishResolve = function () {
    const s = S();
    if (s.pendingR && s.map && s.map.pos) {
      const here = s.map.floors[s.map.pos.f][s.map.pos.c];
      if (here && here.type === 'elite') t[s.pendingR.outcome]++;
    }
    return real.apply(this, arguments);
  };
  for (let i = 0; i < RUNS; i++) { H.seed(7700 + i); try { if (B.RUNSIM.autoRun(true)) runs++; } catch (e) {} }
  B.finishResolve = real;
  const n = t.Complete + t.Narrow + t.Loss || 1;
  return { c: Math.round(100 * t.Complete / n), nw: Math.round(100 * t.Narrow / n),
           l: Math.round(100 * t.Loss / n), per: (t.Complete / (runs || 1)).toFixed(2) };
}
console.log(`\n💀 ELITE_HP SWEEP — ${RUNS} runs each, ⭐6/🎭3, damage ×${H.getTunable('FOE_ATK_MULT')}\n`);
console.log('  class   ×HP    Complete  Narrow  Loss    charms/run if Complete-only');
for (const cls of ['mage', 'rogue']) {
  for (const hp of [2.0, 1.7, 1.4, 1.2]) {
    const r = measure(cls, hp);
    console.log(`  ${cls.padEnd(6)}  ${hp.toFixed(1)}    ${String(r.c).padStart(6)}%  ${String(r.nw).padStart(5)}%  ${String(r.l).padStart(4)}%          ${r.per}`);
  }
  console.log('');
}
H.setTunable('ELITE_HP', 2.0);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
