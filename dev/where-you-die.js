// 💀 WHERE DOES A RUN ACTUALLY END? Thomas: "feels like there isn't much dying or failing part
// to the game. not feeling tension." A win-rate number cannot answer that — WHERE the loss
// happens is the question, because a road that cannot kill you is a warm-up, not a run.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 400);

for (const cls of ['mage', 'rogue']) {
  const st = {};
  let roadDeaths = 0, lairReached = 0, runs = 0;
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(7700 + i);
    let sawLair = false;
    sandbox.RUNSIM.setHook({ onLair() { sawLair = true; } });
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS(); runs++;
    const k = S.dragon.stage;
    const o = st[k] || (st[k] = { n:0, win:0, dieDuel:0, dieRoad:0, minDeck:99, beats:0 });
    o.n++;
    if (sawLair) lairReached++;
    if (m.win === true) o.win++;
    else if (sawLair) o.dieDuel++;
    else { o.dieRoad++; roadDeaths++; }
    o.beats += m.duelBeats || 0;
  }
  console.log(`\n${cls.toUpperCase()}  (${runs} runs)`);
  console.log('  stage   RUN WIN%   died in the duel   died on the ROAD   avg beats');
  for (const k of [1,2,3,4]) {
    const o = st[k]; if (!o) continue;
    console.log(`    ${k}      ${String(Math.round(100*o.win/o.n)).padStart(3)}%          ` +
      `${String(Math.round(100*o.dieDuel/o.n)).padStart(3)}%              ` +
      `${String(Math.round(100*o.dieRoad/o.n)).padStart(3)}%            ${(o.beats/o.n).toFixed(1)}`);
  }
  console.log(`  reached the lair: ${Math.round(100*lairReached/runs)}% of runs · road deaths total ${roadDeaths}`);
}
