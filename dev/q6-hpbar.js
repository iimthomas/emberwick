// ❤️ HOW BIG WOULD AN HP BAR HAVE TO BE, AND WOULD IT EVER KILL YOU?
// Thomas: *"i imagine each equipment would have a sort of health pool, and all those added up would
// be your health bar."*
//
// 🔴 FIRST, A CORRECTION TO MY OWN PROPOSAL. I suggested a "cheap version": flip the starter set to
// refresh every encounter and see if the road gets dangerous. **That tests the wrong thing.** The
// knockout fires when nothing can cover the hit — so refreshing equipment RAISES what you can cover
// and makes the road *safer*, the opposite of what was asked. Refreshing gear is a BUFFER, not a
// death condition. ⚠️ Two designs were hiding under one word:
//   • **Model A — refresh:** gear absorbs per encounter, deck is the reserve. Safer. Not his idea.
//   • **Model B — a pool:** gear carries total HP for the run; empty means the run ends. His idea,
//     and the one that needs the redesign.
//
// 🔑 SO THIS MEASURES MODEL B WITHOUT BUILDING IT. Record the RAW damage a run throws at you, floor
// by floor, and then ask arithmetic: *given a pool of N, when would it have run out?* That answers
// "is the redesign worth it" with no game change at all — and if the answer is "a pool big enough to
// be fair never empties", the idea dies for free.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();

const RUNS = +(process.argv[2] || 150);
const CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS);
B.RUNSIM.setBankWeight(1.0);

// ── capture every incoming hit, with the floor it landed on ────────────────
// ⚠️ Hooked at `startSoak`, which is the one place a hit is about to be paid for. `S.damage` there
// is the RAW number before equipment or cards touch it — exactly what a pool would have to absorb.
const runs = [];
let cur = null;
const realSoak = B.startSoak;
B.startSoak = function () {
  const s = S();
  if (cur && s.damage > 0) {
    const f = (s.map && s.map.pos) ? s.map.pos.f : (s.finalMode ? 16 : 0);
    cur.hits.push({ f, d: s.damage, duel: !!s.finalMode });
  }
  return realSoak.apply(this, arguments);
};
for (let i = 0; i < RUNS; i++) {
  cur = { hits: [] };
  H.seed(3100 + i);
  let win = null;
  try { const m = B.RUNSIM.autoRun(true); win = !!(m && m.win); } catch (e) {}
  if (win !== null) { cur.win = win; runs.push(cur); }
}
B.startSoak = realSoak;

const mean = (a, f) => a.length ? a.reduce((t, x) => t + f(x), 0) / a.length : 0;
const totalRoad = r => r.hits.filter(h => !h.duel).reduce((t, h) => t + h.d, 0);
const totalDuel = r => r.hits.filter(h => h.duel).reduce((t, h) => t + h.d, 0);

console.log(`Q6 · WOULD AN HP BAR EVER EMPTY? — ${CLS}, ${runs.length} runs, ⭐6/🎭3, damage ×${H.getTunable('FOE_ATK_MULT')}\n`);
console.log(`  raw damage thrown at you per run:`);
console.log(`    on the road : ${mean(runs, totalRoad).toFixed(1)}   over ${mean(runs, r => r.hits.filter(h => !h.duel).length).toFixed(1)} hits`);
console.log(`    in the duel : ${mean(runs, totalDuel).toFixed(1)}   over ${mean(runs, r => r.hits.filter(h => h.duel).length).toFixed(1)} hits`);
console.log(`    biggest single hit on the road: ${Math.max(...runs.flatMap(r => r.hits.filter(h => !h.duel).map(h => h.d)))}`);

// ── the arithmetic: for a pool of N, when does it empty? ───────────────────
console.log(`\n  IF EQUIPMENT WERE A POOL OF N, SPENT ON ROAD DAMAGE ONLY:`);
console.log('    pool   runs that empty it   median floor when it empties   reach the dragon');
for (const N of [8, 12, 16, 20, 24, 30, 40]) {
  let died = 0; const floors = [];
  for (const r of runs) {
    let left = N, out = null;
    for (const h of r.hits) {
      if (h.duel) break;
      left -= h.d;
      if (left <= 0) { out = h.f; break; }
    }
    if (out !== null) { died++; floors.push(out); }
  }
  floors.sort((a, b) => a - b);
  const med = floors.length ? floors[Math.floor(floors.length / 2)] : null;
  console.log(`    ${String(N).padStart(4)}      ${String(Math.round(100 * died / runs.length)).padStart(3)}%` +
    `                ${med === null ? '  —' : String(med).padStart(3)}                     ${String(100 - Math.round(100 * died / runs.length)).padStart(3)}%`);
}
console.log(`\n  for reference — total block a set carries today: starter 4, four best crafted 8`);
console.log(`  (so a "pool" made of today's numbers would be 4–8, and the road throws ${mean(runs, totalRoad).toFixed(0)} at you)`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
