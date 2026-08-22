// 🗡️ WHAT ACTUALLY SCALES WITH A SPLIT STRIKE?
// perHit = floor(withBoost / hits) + whet   →   the TOTAL is divided, but `whet` is added PER HIT.
// So a flat damage bonus is diluted by the split; a per-hit bonus is doubled by it.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 200);
function run(full, charm) {
  sandbox.setTunable('MOMENTUM_FULL', full);
  let turns = 0, blow = 0, atFullBlow = 0, atFullN = 0;
  for (let i = 0; i < N; i++) {
    useClass('rogue'); seed(6100 + i);
    sandbox.RUNSIM.setHook({ onAssign() {
      const S = getS(); if (S.finalMode) return;
      if (charm && !S.charms.includes(charm)) S.charms.push(charm);
      const r = sandbox.computeAction(null); if (!r) return;
      turns++; blow += r.value;
      if ((S.momentum||0) >= 3) { atFullBlow += r.value; atFullN++; }
    } });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
  }
  return { blow: (blow/turns).toFixed(1), full: (atFullBlow/(atFullN||1)).toFixed(1) };
}
console.log('                          avg blow   blow AT FULL METER');
for (const [f, c, label] of [
  [0, null,        'no split, no charm'],
  ['add', null,    'split, no charm'],
  [0, 'whetstone', 'no split + Whetstone (+1/hit)'],
  ['add','whetstone','split + Whetstone  ← the synergy'],
  [0, 'lonefang',  'no split + Lone Fang (+4 at ZERO)'],
  ['add','lonefang','split + Lone Fang'] ]) {
  const r = run(f, c);
  console.log(`${label.padEnd(32)} ${r.blow.padStart(5)}      ${r.full.padStart(5)}`);
}
sandbox.setTunable('MOMENTUM_FULL', 'add');
