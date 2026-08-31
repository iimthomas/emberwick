// 🗺️ HOW MANY FLOORS SHOULD STAGE 1 HAVE? (2026-08-30)
// 🔴 Measured cause of stage 1 being the hardest stage: it is SIX floors to everyone else's
// sixteen, so you reach Cindermaw with **2.5 charms against 10-12**. Not a weaker deck — the deck
// is actually BETTER (30.1 levels vs 24) — a missing BUILD. The shop is per encounter.
// 🔑 So the lever is the floor count, and nothing about any dragon has to move.
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 400);

for (const f of (process.argv[3] || '6,8,10,12,16').split(',').map(Number)) {
  S.STAGE_FLOORS[1] = f;                      // const object, mutable contents
  let charms = 0, lairs = 0, road = 0, lair = 0, win = 0;
  const rb = S.beginFinalBattle;
  S.beginFinalBattle = function () { const st = H.getS(); if (st.dragon.stage === 1) { lairs++; charms += (st.charms || []).length; } return rb.apply(this, arguments); };
  const rd = S.defeat; S.defeat = function (w) { const st = H.getS(); if (st.dragon.stage === 1) (st.finalMode ? lair++ : road++); return rd.apply(this, arguments); };
  const rv = S.victory; S.victory = function () { if (H.getS().dragon.stage === 1) win++; return rv.apply(this, arguments); };
  H.useClass('mage'); H.seed(20260830);
  S.RUNSIM.batch(true, N);
  S.beginFinalBattle = rb; S.defeat = rd; S.victory = rv;
  const n = road + lair + win, pc = x => Math.round(100 * x / n) + '%';
  console.log('floors ' + String(f).padStart(2) + ' :  fail ' + pc(road + lair).padStart(4) +
    '  = road ' + pc(road).padStart(4) + ' + dragon ' + pc(lair).padStart(4) +
    '   · charms at the lair ' + (charms / Math.max(1, lairs)).toFixed(1));
}
