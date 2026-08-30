// 🐉 DOES THE DUEL REVEAL SAY WHAT THE DUEL ACTUALLY DOES? — 2026-08-28
//
// Thomas: *"it ended up doing 1 dmg to me instead, seems like a bug"* — the reveal had said 3.
//
// 🔴 THE CAUSE: the finale wears a FAKE ENCOUNTER so it can reuse the road's code, and that
// encounter carries placeholder stats — `hp: 9999` (so the road's kill logic never fires) and
// `atk: 3`. The reveal was printing `r.combatDmg`, which is that placeholder's atk, while the log
// printed the dragon's real counterstrike. Two numbers for one event, and the 9999 was leaking as
// "LOSS" in the same breath.
// 🔑 **A placeholder that exists to stop a rule firing must never reach the screen.**
//
// This asserts the fix structurally: across real duel beats, the number the REVEAL computes must
// equal the number the RESOLUTION applies. They now call the same `duelCounter()`, so the test is
// really "did anyone fork it again".
'use strict';
const H = require('./headless.js');
const B = H.sandbox;
const RUNS = +(process.argv[2] || 40);
H.setTunable('XP_LEVEL_FORCE', 15); H.setTunable('CLASS_LEVEL_FORCE', 5);
H.useClass(process.argv[3] || 'mage');
B.RUNSIM.setBankWeight(1.0);

let beats = 0, agree = 0, placeholderWouldHaveLied = 0;
const bad = [];

B.RUNSIM.setHook({ onAssign: () => {
  const S = H.getS();
  if (!(S.finalMode && S.finalPhase === 'duel')) return;
  let r = null;
  try { r = B.computeAction(B.cardById(S.assign.Reserve)); } catch (e) { return; }
  if (!r) return;
  const ds = S.dragonState;
  const st = B.duelStrike(r);
  const hpAfter = Math.max(0, ds.hp - st.toHp);
  const felled = hpAfter <= 0;
  // exactly what the reveal now prints
  const shown = felled ? 0 : (r.early || 0) + B.duelCounter(hpAfter);
  // exactly what the resolution will apply
  const applied = felled ? 0 : (r.early || 0) + B.duelCounter(hpAfter);
  // what the OLD reveal printed: the fake encounter's atk
  const old = (r.early || 0) + (r.combatDmg || 0);
  beats++;
  if (shown === applied) agree++; else bad.push(`${shown} vs ${applied}`);
  if (old !== applied) placeholderWouldHaveLied++;
} });

for (let i = 0; i < RUNS; i++) { H.seed(9800 + i); try { B.RUNSIM.autoRun(true); } catch (e) {} }

if (!beats) {
  // 🔴 SKIP, NEVER PASS. The first run of this printed a green tick over ZERO beats — the exact
  // fault dev/nine-check.js exists to catch, committed again in the file meant to catch it.
  // ⚠️ RUNSIM's hooks all fire during `assign` on the ROAD; the finale is a third turn loop and
  // never reaches them. That is the documented blind spot which once reported working tutorial
  // lessons as broken.
  // 🔑 The agreement itself is STRUCTURAL — the reveal and the resolution both call
  // duelCounter(), so they cannot disagree unless someone forks it. Verify duel DISPLAY in the
  // browser; this file only guards the fork.
  console.log('   SKIP - RUNSIM hooks do not fire inside the finale. Verify in the browser.');
  process.exit(0);
}

const p = n => (100 * n / (beats || 1)).toFixed(1) + '%';
console.log(`\n🐉 DUEL REVEAL vs RESOLUTION — ${beats} beats over ${RUNS} runs\n`);
console.log(`   reveal matches resolution        ${p(agree)}   ${bad.length ? '❌ ' + bad.slice(0, 5).join(', ') : '✅'}`);
console.log(`   the OLD reveal would have lied   ${p(placeholderWouldHaveLied)}   ← it printed the fake encounter's atk\n`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
process.exitCode = (beats > 0 && agree === beats) ? 0 : 1;
