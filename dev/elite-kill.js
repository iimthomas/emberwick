// 💀 WHAT HP MULTIPLIER MAKES AN ELITE A FIGHT YOU CAN WIN?
// Thomas: *"getting a charm for not killing it just feels a bit weird, and easy?"* — correct, and
// the log line already says *"off the thing you killed"* on a Narrow, which is a kill that did not
// happen. \U0001f511 THE AXES ARE THE WRONG WAY ROUND TODAY: an elite is HARD TO BEAT and CHEAP TO
// SURVIVE. It wants to be BEATABLE and EXPENSIVE — the dread in the damage (ELITE_ATK), the prize
// on the kill (ELITE_HP low enough that a kill exists).
// ⚠️ ELITE_ATK does not touch Complete% at all — Complete is your damage vs its HP. So the two
// dials are independent: HP decides whether you can win, ATK decides what it costs.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const RUNS = +(process.argv[2] || 120);
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
B.RUNSIM.setBankWeight(1.0);

const realFin = B.finishResolve, realSoak = B.startSoak;
function measure(cls, hp, atk) {
  H.useClass(cls); H.setTunable('ELITE_HP', hp); H.setTunable('ELITE_ATK', atk);
  const t = { Complete: 0, Narrow: 0, Loss: 0 };
  let runs = 0, dmg = 0, hits = 0, onElite = false;
  B.startSoak = function () {
    const s = S();
    if (onElite && s.damage > 0) { dmg += s.damage; hits++; }
    return realSoak.apply(this, arguments);
  };
  B.finishResolve = function () {
    const s = S();
    if (s.pendingR && s.map && s.map.pos) {
      const here = s.map.floors[s.map.pos.f][s.map.pos.c];
      if (here && here.type === 'elite') t[s.pendingR.outcome]++;
    }
    return realFin.apply(this, arguments);
  };
  // damage is soaked during the elite's own turn; flag it from the map hook
  B.RUNSIM.setHook({ onAssign: () => {
    const s = S(), p = s.map && s.map.pos;
    onElite = !!(p && s.map.floors[p.f][p.c] && s.map.floors[p.f][p.c].type === 'elite');
  }});
  for (let i = 0; i < RUNS; i++) { H.seed(7700 + i); try { if (B.RUNSIM.autoRun(true)) runs++; } catch (e) {} }
  B.RUNSIM.setHook({}); B.finishResolve = realFin; B.startSoak = realSoak;
  const n = t.Complete + t.Narrow + t.Loss || 1;
  return { c: Math.round(100 * t.Complete / n), l: Math.round(100 * t.Loss / n),
           per: t.Complete / (runs || 1), hit: hits ? dmg / hits : 0, n };
}
console.log(`\n\u{1F480} MAKING THE KILL POSSIBLE — ${RUNS} runs a cell, ★6/\u{1F3AD}3, damage ×${H.getTunable('FOE_ATK_MULT')}`);
console.log(`   (ELITE_ATK held at +4 throughout — the dread stays where it is)\n`);
console.log('  class   ×HP    you KILL it   you lose   charm/run (kill-gated)   avg hit taken');
for (const cls of ['mage', 'rogue']) {
  for (const hp of [2.0, 1.5, 1.3, 1.15, 1.0]) {
    const r = measure(cls, hp, 4);
    console.log(`  ${cls.padEnd(6)}  ${hp.toFixed(2)}   ${String(r.c).padStart(9)}%  ${String(r.l).padStart(8)}%   ${r.per.toFixed(2).padStart(18)}   ${r.hit.toFixed(1).padStart(11)}`);
  }
  console.log('');
}
H.setTunable('ELITE_HP', 2.0); H.setTunable('ELITE_ATK', 4);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
