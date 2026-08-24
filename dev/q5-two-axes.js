// 🃏 DOES DECK-AS-HEALTH ACTUALLY HAVE ONLY ONE AXIS?
// Thomas: *"i just don't think its possible with your deck being your HP, and how well you do, we
// would have to decouple it, and have your own HP bar."*
//
// 🔑 THE CONSTRAINT HE HAS IDENTIFIED IS REAL: if one resource measures both *how well you are
// doing* and *how close you are to dying*, then any road danger is also a capability nerf, and the
// spiral is structural. That is a correct reading and it is the game's hardest problem.
//
// 🔑 BUT THE DECK MAY ALREADY BE TWO NUMBERS, NOT ONE:
//   • **LEVELS** = capability. Soaking with a Lv2+ card drops a level; the card survives.
//   • **CARD COUNT** = life. Only a Lv1 card is destroyed, and only that reduces the count.
// If those move independently, road danger can be denominated in COUNT while capability stays on
// LEVELS — a second axis on one resource, instead of a second resource.
// ⚠️ On record, count is currently a DEAD axis: *lowest ever held is 7 cards (mage) / 3 (rogue),
// and 0% of runs ever fall below 8.* This measures whether that is still true, and how far apart
// the two axes actually travel.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();

const RUNS = +(process.argv[2] || 120);
const CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS);
B.RUNSIM.setBankWeight(1.0);

const rows = [];
for (let i = 0; i < RUNS; i++) {
  let minCards = 99, minLevels = 999, startCards = 0, startLevels = 0;
  const path = [];
  B.RUNSIM.setHook({ onAssign: () => {
    const s = S();
    const all = [...s.hand, ...s.deck, ...s.discard];
    const c = all.length, l = all.reduce((t, x) => t + x.level, 0);
    if (!startCards) { startCards = c; startLevels = l; }
    if (c < minCards) minCards = c;
    if (l < minLevels) minLevels = l;
    path.push([c, l]);
  }});
  H.seed(5200 + i);
  let win = null;
  try { const m = B.RUNSIM.autoRun(true); win = !!(m && m.win); } catch (e) {}
  B.RUNSIM.setHook({});
  if (win === null || !startCards) continue;
  const s = S(), all = [...s.hand, ...s.deck, ...s.discard];
  rows.push({ win, minCards, minLevels, startCards, startLevels,
              endCards: all.length, endLevels: all.reduce((t, x) => t + x.level, 0),
              destroyed: (s.trashed || []).length, path });
}

const mean = f => rows.reduce((t, r) => t + f(r), 0) / rows.length;
const pct = f => Math.round(100 * rows.filter(f).length / rows.length);
console.log(`Q5 · ARE LEVELS AND CARD COUNT TWO AXES? — ${CLS}, ${rows.length} runs, ⭐6/🎭3, damage ×${H.getTunable('FOE_ATK_MULT')}\n`);
console.log(`  START           ${mean(r => r.startCards).toFixed(1)} cards · ${mean(r => r.startLevels).toFixed(1)} levels`);
console.log(`  LOWEST HELD     ${mean(r => r.minCards).toFixed(1)} cards · ${mean(r => r.minLevels).toFixed(1)} levels`);
console.log(`  END             ${mean(r => r.endCards).toFixed(1)} cards · ${mean(r => r.endLevels).toFixed(1)} levels`);
console.log(`  cards destroyed ${mean(r => r.destroyed).toFixed(1)}`);
console.log(`\n  HOW FAR EACH AXIS TRAVELS (as a share of where it started):`);
console.log(`    levels fall   ${(100 * (1 - mean(r => r.minLevels) / mean(r => r.startLevels))).toFixed(0)}%`);
console.log(`    count falls   ${(100 * (1 - mean(r => r.minCards) / mean(r => r.startCards))).toFixed(0)}%   ← the axis that could carry a death condition`);

console.log(`\n  IS THE COUNT AXIS LIVE?`);
for (const t of [12, 10, 8, 6, 4, 2]) console.log(`    ever held ≤ ${String(t).padStart(2)} cards : ${pct(r => r.minCards <= t)}%`);

// 🔑 do the two axes actually move apart, or is count just levels/2?
const late = rows.map(r => r.path[Math.floor(r.path.length * 0.8)] || r.path[r.path.length - 1]).filter(Boolean);
const cs = late.map(p => p[0]), ls = late.map(p => p[1]);
const m = a => a.reduce((t, x) => t + x, 0) / a.length;
const mc = m(cs), ml = m(ls);
const cov = late.reduce((t, p) => t + (p[0] - mc) * (p[1] - ml), 0) / late.length;
const sd = a => Math.sqrt(a.reduce((t, x) => t + (x - m(a)) ** 2, 0) / a.length);
const r = cov / (sd(cs) * sd(ls) || 1);
console.log(`\n  CORRELATION between card count and levels, late in the run: r = ${r.toFixed(2)}`);
console.log(`    (1.00 would mean they are the same number wearing two hats;`);
console.log(`     lower means there is genuinely a second axis to denominate danger in)`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
