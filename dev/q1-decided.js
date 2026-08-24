// 🎯 Q1 — WHEN DOES THE RUN BECOME DECIDED?
// Snapshot at each floor, replay K times with a DIFFERENT draw order, and ask how lopsided the
// replays are. Confidence = max(win%, 1−win%). The floor where that crosses ~90% is the floor
// after which nothing the deck does can change the answer.
//
// ⚠️ Built on dev/decided.js, whose snapshot is proven faithful (12/12 restore-and-continue
// replays reproduced their original). Do not lower that bar — a snapshot that loses state produces
// confident nonsense.
'use strict';
const H = require('./headless.js');
const D = require('./decided.js');
const B = H.sandbox, S = () => H.getS();

const RUNS = +(process.argv[2] || 24);
const K = +(process.argv[3] || 12);
const FLOORS = [0, 2, 4, 6, 8, 10, 12, 14, 15];
const CLS = process.argv[4] || 'mage';

H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS);
B.RUNSIM.setBankWeight(1.0);

const acc = {};                       // floor → { n, decided, winish }
for (const f of FLOORS) acc[f] = { n: 0, conf: 0, agree: 0, unan: 0 };
// ⚠️ CONFIDENCE ALONE IS A TRAP AT FLOOR 0. If the base win rate is 26%, then max(rate, 1-rate)
// is already 74% before a single card is played — that is the BASE RATE being lopsided, not the run
// being decided. 🔑 The crisp signal is **UNANIMITY**: the share of snapshots where every replay
// landed the same way. That is literally *"no draw could still change this"*, and at floor 0 it is
// near zero by construction.

for (let i = 0; i < RUNS; i++) {
  // —— play a run, snapshotting at each sampled floor ————————————————
  const shots = {};
  B.RUNSIM.setHook({ onMap: () => {
    const s = S();
    const f = (s.map && s.map.pos) ? s.map.pos.f : 0;
    if (FLOORS.includes(f) && !shots[f]) shots[f] = D.snap();
  }});
  H.seed(4000 + i);
  let truth = null;
  try { const m = B.RUNSIM.autoRun(true); truth = !!(m && m.win); } catch (e) {}
  B.RUNSIM.setHook({});
  if (truth === null) continue;

  // —— from each snapshot, replay K times with fresh draw luck ——————
  for (const f of FLOORS) {
    const sn = shots[f]; if (!sn) continue;
    let wins = 0, n = 0;
    for (let k = 0; k < K; k++) {
      const w = D.replay(sn, 90000 + i * 100 + k, true);
      if (w === null) continue;
      n++; if (w) wins++;
    }
    if (n < 4) continue;
    const rate = wins / n;
    acc[f].n++;
    acc[f].conf += Math.max(rate, 1 - rate);           // how lopsided
    acc[f].agree += ((rate >= 0.5) === truth) ? 1 : 0;  // did the majority match what happened
    acc[f].unan += (wins === 0 || wins === n) ? 1 : 0;  // 🔑 no draw could change it
  }
  if ((i + 1) % 6 === 0) console.error(`  …${i + 1}/${RUNS}`);
}

console.log(`Q1 · WHEN IS THE RUN DECIDED — ${CLS}, ${RUNS} runs, each floor replayed ${K}× with fresh draw luck`);
console.log(`⭐6/🎭3, damage ×${H.getTunable('FOE_ATK_MULT')}\n`);
console.log('  floor   UNANIMOUS   confidence   majority matched   n');
console.log('          (no draw could change it)');

let crossed = null;
for (const f of FLOORS) {
  const a = acc[f]; if (!a.n) continue;
  const c = a.conf / a.n, g = a.agree / a.n;
  const u = a.unan / a.n;
  if (crossed === null && u >= 0.9) crossed = f;
  const bar = '█'.repeat(Math.round(u * 20));
  console.log(`   ${String(f).padStart(2)}      ${(u * 100).toFixed(0).padStart(3)}%  ${bar.padEnd(20)} ${(c * 100).toFixed(0).padStart(3)}%      ${(g * 100).toFixed(0).padStart(3)}%      ${a.n}`);
}
console.log(`\n  → confidence crosses 90% at floor ${crossed === null ? '(never in the sampled floors)' : crossed} of 16`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
