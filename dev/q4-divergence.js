// 🃏 WHEN DO A WINNER AND A LOSER START LOOKING DIFFERENT?
// Thomas: *"maybe its good that we DON'T die during the run, because you can at least still get
// drops to craft armor."*
//
// 🔑 HE IS RIGHT, AND IT REFRAMES A THING I HAVE BEEN REPORTING AS A PROBLEM. A road that can end
// your run early starves the crafting loop — you would carry out ~4 encounters of materials instead
// of ~13 — and it breaks the recorded rule that **a loss must pay**. The road is the EARNING phase;
// the dragon is the TEST. That is coherent, and "0 of 800 died before the lair" is the design
// working rather than a hole in it.
//
// 🔑 WHICH MOVES THE QUESTION. The road is not stakeless: Q2 measured deck levels at the lair
// mapping to a 13% → 81% win rate. Every card the road costs you is real. **The problem is that
// you cannot SEE it while you are on the road** — the deck is spent against an invisible price.
// So the fix is LEGIBILITY, not danger, which is exactly what Thomas's own framing predicted.
//
// ⚠️ THE THING THAT BLOCKED THAT FIX BEFORE: the 🃏 Standing chip only judges from region 4,
// because the median deck of a future winner and a future loser were **identical until region 3**.
// That was measured before `FOE_ATK_MULT` went to ×1.3. Harder hits should make decks diverge
// sooner — and if they do, the chip can start telling the truth earlier.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();

const RUNS = +(process.argv[2] || 120);
const CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS);
B.RUNSIM.setBankWeight(1.0);

const byFloor = {};   // floor → { win: [], loss: [] }
const haulByFloor = {};
for (let i = 0; i < RUNS; i++) {
  const trace = [];
  B.RUNSIM.setHook({ onMap: () => {
    const s = S();
    const f = (s.map && s.map.pos) ? s.map.pos.f : 0;
    const all = [...s.hand, ...s.deck, ...s.discard];
    trace.push({ f, levels: all.reduce((t, c) => t + c.level, 0),
                 mats: Object.values(s.loot || {}).reduce((t, n) => t + n, 0),
                 xp: s.xpRun || 0 });
  }});
  H.seed(2400 + i);
  let win = null;
  try { const m = B.RUNSIM.autoRun(true); win = !!(m && m.win); } catch (e) {}
  B.RUNSIM.setHook({});
  if (win === null) continue;
  for (const t of trace) {
    const b = byFloor[t.f] || (byFloor[t.f] = { win: [], loss: [] });
    b[win ? 'win' : 'loss'].push(t.levels);
    const h = haulByFloor[t.f] || (haulByFloor[t.f] = { mats: [], xp: [] });
    h.mats.push(t.mats); h.xp.push(t.xp);
  }
}

const med = a => { const x = a.slice().sort((p, q) => p - q); return x.length ? x[Math.floor(x.length / 2)] : 0; };
const mean = a => a.length ? a.reduce((t, x) => t + x, 0) / a.length : 0;

console.log(`Q4 · WHEN DOES A WINNER START LOOKING DIFFERENT — ${CLS}, ${RUNS} runs, ⭐6/🎭3, damage ×${H.getTunable('FOE_ATK_MULT')}\n`);
console.log('  floor   winners   losers   gap    ← the gap is what a display could report');
let firstGap = null;
for (const f of Object.keys(byFloor).map(Number).sort((a, b) => a - b)) {
  const b = byFloor[f];
  if (b.win.length < 5 || b.loss.length < 5) continue;
  const w = med(b.win), l = med(b.loss), g = w - l;
  if (firstGap === null && g >= 2) firstGap = f;
  console.log(`   ${String(f).padStart(2)}      ${String(w).padStart(4)}     ${String(l).padStart(4)}    ${g >= 0 ? '+' : ''}${g}`);
}
console.log(`\n  → the gap first reaches 2 levels at floor ${firstGap === null ? '(never)' : firstGap} of 16`);

console.log(`\n  WHAT THE ROAD HAS ALREADY PAID BY EACH FLOOR (the argument for not dying):`);
for (const f of [2, 5, 8, 11, 14, 15]) {
  const h = haulByFloor[f]; if (!h) continue;
  console.log(`    by floor ${String(f).padStart(2)}  ${mean(h.mats).toFixed(1).padStart(5)} materials · ${mean(h.xp).toFixed(0).padStart(3)} xp`);
}
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
