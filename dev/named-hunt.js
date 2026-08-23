// 🕯️ CAN YOU ACTUALLY HUNT A NAMED CREATURE?
// Thomas: "you need a mist crane wing, and you see that you can fight a mist crane because your
// candle is lit". Better fantasy than shape-keyed drops — but it only works if a NAMED creature
// turns up often enough to be a target rather than a lottery. That is the whole question.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 300);
const seen = {}, runsWith = {};
let runs = 0, fights = 0;
for (let i = 0; i < N; i++) {
  useClass(i % 2 ? 'rogue' : 'mage'); seed(2200 + i);
  const thisRun = new Set();
  sandbox.RUNSIM.setHook({ onAssign() {
    const e = getS().encounter;
    if (!e || e.type !== 'fight' || e.dragon) return;
    const n = e.baseName || e.name; fights++;
    seen[n] = (seen[n] || 0) + 1; thisRun.add(n);
  } });
  try { sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
  runs++;
  for (const n of thisRun) runsWith[n] = (runsWith[n] || 0) + 1;
}
const names = Object.keys(seen).sort((a, b) => seen[b] - seen[a]);
console.log(`${runs} runs · ${fights} creature fights · ${names.length} distinct creatures seen\n`);
console.log('creature'.padEnd(20), 'times', ' per run', ' % of runs you meet it');
for (const n of names) {
  console.log(n.padEnd(20), String(seen[n]).padStart(5),
    (seen[n] / runs).toFixed(2).padStart(8), String(Math.round(100 * runsWith[n] / runs) + '%').padStart(10));
}
const pcts = names.map(n => 100 * runsWith[n] / runs);
console.log('\nmet-in-a-run rate: min', Math.round(Math.min(...pcts)) + '%',
            '· median', Math.round(pcts.slice().sort((a,b)=>a-b)[Math.floor(pcts.length/2)]) + '%',
            '· max', Math.round(Math.max(...pcts)) + '%');
