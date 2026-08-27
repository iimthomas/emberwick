// 🦴 THE DROP ECONOMY, MEASURED — sources vs sinks.
// Thomas: "how did you figure out the economy, whats the math like. are you aiming for a good
// number that keeps the player engaged?"
// 🔑 THE HONEST ANSWER IS THAT NOBODY DESIGNED IT. Every number quoted so far (11.6 materials by
// floor 14, 12.8 a run) is a MEASUREMENT OF WHAT THE CODE HAPPENS TO DO, not a target anybody set.
// This works out what the sinks actually cost in RUNS, which is the only unit an engagement
// target can be written in.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const RUNS = +(process.argv[2] || 120), CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS); B.RUNSIM.setBankWeight(1.0);

const tot = {}, wins = { n: 0, runs: 0 };
for (let i = 0; i < RUNS; i++) {
  H.seed(8200 + i);
  try {
    const m = B.RUNSIM.autoRun(true); if (!m) continue;
    wins.runs++; if (m.win) wins.n++;
    const s = S();
    for (const k in (s.loot || {})) tot[k] = (tot[k] || 0) + s.loot[k];
  } catch (e) {}
}
const per = k => (tot[k] || 0) / wins.runs;
console.log(`\n🦴 THE DROP ECONOMY — ${CLS}, ${wins.runs} runs, win rate ${Math.round(100*wins.n/wins.runs)}%\n`);
console.log('  PER RUN, BY MATERIAL');
for (const m of B.MATERIALS) {
  const v = per(m.id);
  if (v > 0.004) console.log(`    ${m.icon} ${m.name.padEnd(16)} ${v.toFixed(2).padStart(6)}   ${m.from}`);
}
console.log(`\n  RUNS TO FORGE EACH PIECE  (the binding material is the one that takes longest)`);
const rows = [];
for (const id in B.RECIPE) {
  const d = B.ARMOUR.find(a => a.id === id); if (!d) continue;
  let worst = 0, why = '';
  for (const mat in B.RECIPE[id].mats) {
    const need = B.RECIPE[id].mats[mat];
    // partIdOf is a const arrow and never reaches the sandbox - the binding trap again. The key
    // is just 'p:' + name, so build it directly rather than reporting a false "never".
    const rate = per(mat);
    const runs = rate > 0 ? need / rate : Infinity;
    if (runs > worst) { worst = runs; why = `${need}× ${mat}`; }
  }
  rows.push({ name: d.name, rarity: d.rarity, runs: worst, why });
}
rows.sort((a, b) => a.runs - b.runs);
for (const r of rows) console.log(`    ${r.name.padEnd(22)} ${r.rarity.padEnd(9)} ${(r.runs === Infinity ? '  never' : r.runs.toFixed(1)).padStart(7)} runs   bound by ${r.why}`);
const finite = rows.filter(r => r.runs !== Infinity);
console.log(`\n  the whole set, if you chased one piece at a time: ~${Math.round(finite.reduce((t, r) => t + r.runs, 0))} runs`);
console.log(`  ⚠️ a run is ~20 minutes, so that is the number an engagement target has to be written against.`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
