// 🐉 Q2 — WHAT ACTUALLY KILLS YOU AT THE DRAGON?
// Thomas: *"Classify final-dragon losses: unwinnable from the arrival deck (no line exists given
// what you brought), versus winnable-but-misplayed… Pair it with the arrival state — deck size,
// average level, equipment remaining — so you can see which arrival conditions are already fatal."*
//
// 🔑 THE CLASSIFIER: snapshot at the lair, replay the duel K times with fresh draw luck.
//   • 0 of K won  → **DEAD ON ARRIVAL.** No draw wins from that deck. The ROAD lost it.
//   • some won    → **WINNABLE.** The deck held a line and this attempt missed it.
//
// ⚠️ ONE HONEST LIMIT, STATED UP FRONT: the bot plays one policy, so "winnable" here means *"some
// draw order wins with THIS policy"*. It cannot separate "the player misplayed" from "the draw was
// unkind" — a human might find a line the bot never tries, which makes the dead-on-arrival share a
// slight OVER-count. What it does separate cleanly is *the road already lost it* from *the exam is
// hard*, which is the question asked.
//
// ⚠️ Built on dev/decided.js, whose snapshot is proven faithful (12/12 restore-and-continue replays
// reproduced their original, once the RNG stream position was captured alongside the state).
'use strict';
const H = require('./headless.js');
const D = require('./decided.js');
const B = H.sandbox, S = () => H.getS();

const RUNS = +(process.argv[2] || 60);
const K = +(process.argv[3] || 15);
const CLS = process.argv[4] || 'mage';

H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS);
B.RUNSIM.setBankWeight(1.0);

const rows = [];
for (let i = 0; i < RUNS; i++) {
  let lair = null, arrive = null;
  B.RUNSIM.setHook({ onLair: () => {
    const s = S();
    const all = [...s.hand, ...s.deck, ...s.discard];
    arrive = {
      cards: all.length,
      levels: all.reduce((t, c) => t + c.level, 0),
      avg: all.length ? all.reduce((t, c) => t + c.level, 0) / all.length : 0,
      // 🛡️ equipment still able to block — the half of your health that is not your deck
      equip: (s.armour || []).filter(a => B.armourBlock(a) > 0).length,
      charms: (s.charms || []).length,
      stage: s.dragon.stage, par: s.dragon.par,
    };
    lair = D.snap();
  }});
  H.seed(6000 + i);
  let truth = null;
  try { const m = B.RUNSIM.autoRun(true); truth = !!(m && m.win); } catch (e) {}
  B.RUNSIM.setHook({});
  if (!lair || truth === null) continue;

  let wins = 0, n = 0;
  for (let k = 0; k < K; k++) {
    const w = D.replay(lair, 70000 + i * 100 + k, true);
    if (w === null) continue;
    n++; if (w) wins++;
  }
  if (n < 5) continue;
  rows.push({ ...arrive, truth, wins, n, rate: wins / n });
  if ((i + 1) % 10 === 0) console.error(`  …${i + 1}/${RUNS}`);
}

const losses = rows.filter(r => !r.truth);
const dead = losses.filter(r => r.wins === 0);
const winnable = losses.filter(r => r.wins > 0);
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const mean = (a, f) => a.length ? (a.reduce((t, r) => t + f(r), 0) / a.length) : 0;

console.log(`\nQ2 · WHAT KILLS YOU AT THE DRAGON — ${CLS}, ${rows.length} runs reaching the lair, each replayed ${K}×`);
console.log(`⭐6/🎭3, damage ×${H.getTunable('FOE_ATK_MULT')}\n`);
console.log(`  reached the lair : ${rows.length}   won ${rows.filter(r => r.truth).length}   lost ${losses.length}`);
console.log(`\n  OF THE LOSSES (${losses.length}):`);
console.log(`    💀 dead on arrival (0 of ${K} replays won) : ${dead.length}  (${pct(dead.length, losses.length)}%)  ← the ROAD lost it`);
console.log(`    ⚔️ winnable, this attempt did not          : ${winnable.length}  (${pct(winnable.length, losses.length)}%)  ← the exam`);

console.log(`\n  ARRIVAL STATE — what you walked in with:`);
const show = (lab, set) => console.log(
  `    ${lab.padEnd(22)} deck ${mean(set, r => r.cards).toFixed(1).padStart(5)} cards · ` +
  `${mean(set, r => r.levels).toFixed(1).padStart(5)} levels (avg ${mean(set, r => r.avg).toFixed(2)}) · ` +
  `${mean(set, r => r.equip).toFixed(1)} equipment · ${mean(set, r => r.charms).toFixed(1)} charms`);
show('winners', rows.filter(r => r.truth));
show('winnable losses', winnable);
show('💀 dead on arrival', dead);

// 🔑 WHICH ARRIVAL CONDITIONS ARE ALREADY FATAL — bucket by deck levels and read the replay rate.
console.log(`\n  BY DECK LEVELS AT THE LAIR (par ${rows[0] ? rows[0].par : '?'}):`);
const buckets = [[0, 24], [24, 28], [28, 32], [32, 36], [36, 99]];
for (const [lo, hi] of buckets) {
  const b = rows.filter(r => r.levels >= lo && r.levels < hi);
  if (!b.length) continue;
  const winRate = mean(b, r => r.rate);
  const deadShare = pct(b.filter(r => r.wins === 0).length, b.length);
  console.log(`    ${String(lo).padStart(2)}–${String(hi === 99 ? '+' : hi).padEnd(3)} n=${String(b.length).padStart(3)}  ` +
    `replay win ${(winRate * 100).toFixed(0).padStart(3)}%   ${deadShare}% of them unwinnable`);
}
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
