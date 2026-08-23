// 🕯️ ...AND THE SAME QUESTION ASKED PER ROAD. A creature lives on ONE road and a run walks ONE
// road, so a flat "9% of runs" is really "you were on the wrong road 3 times in 4".
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 240);
const met = {}, runsOnStage = {};
for (let i = 0; i < N; i++) {
  useClass(i % 2 ? 'rogue' : 'mage'); seed(2200 + i);
  const thisRun = new Set();
  sandbox.RUNSIM.setHook({ onAssign() {
    const e = getS().encounter;
    if (e && e.type === 'fight' && !e.dragon) thisRun.add(e.baseName || e.name);
  } });
  try { sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
  const st = getS().dragon.stage;
  runsOnStage[st] = (runsOnStage[st] || 0) + 1;
  for (const n of thisRun) { met[n] = met[n] || {}; met[n][st] = (met[n][st] || 0) + 1; }
}
console.log('If you go to the RIGHT road, how often do you meet a given creature?\n');
const rows = [];
for (const n of Object.keys(met)) {
  const best = Object.keys(met[n]).sort((a, b) => met[n][b] - met[n][a])[0];
  rows.push({ n, stage: best, pct: Math.round(100 * met[n][best] / runsOnStage[best]) });
}
rows.sort((a, b) => a.stage - b.stage || b.pct - a.pct);
for (const st of [1, 2, 3, 4]) {
  const r = rows.filter(x => +x.stage === st);
  if (!r.length) continue;
  const p = r.map(x => x.pct);
  console.log(`stage ${st} (${runsOnStage[st]} runs) — ${r.length} creatures · met-per-run: ` +
    `min ${Math.min(...p)}% · median ${p.slice().sort((a,b)=>a-b)[Math.floor(p.length/2)]}% · max ${Math.max(...p)}%`);
  console.log('   ' + r.slice(0, 6).map(x => `${x.n} ${x.pct}%`).join(' · '));
}
