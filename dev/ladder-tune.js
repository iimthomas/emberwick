// 🎯 GET THE LADDER DESCENDING (2026-08-30). Thomas: *"stage 1 being the hardest is weird"*.
// 🔑 THE ROOT CAUSE IS ROAD LENGTH, NOT DRAGONS. Stage 1 is 8 floors and stages 2-4 are 16, so
// stage 1 reaches its dragon on half the income — Cindermaw kills 59% of runs while Fathomdread
// kills 12%. Difficulty was running backwards because the MAP was.
// ⚠️ 16 floors was set when half of all encounters were one-hand journeys. Every encounter is a
// fight now, so the same map is roughly twice the run it used to be.
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 800);

function run(floors, hpAdd) {
  for (const st of [1, 2, 3, 4]) S.STAGE_FLOORS[st] = floors;
  H.setTunable('DRAGON_HP_ADD', hpAdd);
  const t = {}; let stage = null;
  const rs = S.startStage, rd = S.defeat, rv = S.victory;
  S.startStage = function (n) { stage = n; return rs.apply(this, arguments); };
  S.defeat = function (w) { const st = H.getS(); const k = t[stage] = t[stage] || { r: 0, l: 0, w: 0 };
    if (st.finalMode) k.l++; else k.r++; return rd.apply(this, arguments); };
  S.victory = function () { (t[stage] = t[stage] || { r: 0, l: 0, w: 0 }).w++; return rv.apply(this, arguments); };
  H.useClass('mage'); H.seed(20260830);
  const b = S.RUNSIM.batch(true, N);
  S.startStage = rs; S.defeat = rd; S.victory = rv;
  const win = [], road = [];
  for (const s of [1, 2, 3, 4]) { const k = t[s] || { r: 0, l: 0, w: 0 }; const n = Math.max(1, k.r + k.l + k.w);
    win.push(Math.round(100 * k.w / n)); road.push(Math.round(100 * k.r / n)); }
  return { win, road, turns: b.turns };
}

// ⚠️ EQUAL FLOORS DID NOT FIX THE ORDER, it shifted the level: 8 → [21,29,14,24], 12 →
// [31,40,30,46], 16 → [45,64,38,57]. Longer road = higher win, because more encounters means more
// charms and levels at the lair. 🔑 So the ORDERING lives in the dragons, and the floor count is
// just the height of the whole ladder. 12 puts run length back at ~21 turns, which is what the
// game was tuned around before journeys were cut.
const FLOORS = +(process.argv[3] || 12);
for (const spec of (process.argv[4] || '5:4:4:4').split(',')) {
  const [a, b, c, d] = spec.split(':').map(Number);
  const r = run(FLOORS, { 1: a, 2: b, 3: c, 4: d });
  const desc = r.win.every((v, i) => i === 0 || v <= r.win[i - 1]);
  console.log('HP+' + spec.padEnd(12) + 'WIN ' + JSON.stringify(r.win).padEnd(20) +
    (desc ? '✅ descends' : '   ') + '  road ' + JSON.stringify(r.road).padEnd(20) + 'turns ' + r.turns);
}
console.log('\n🎯 DESCENDING is the target — stage 1 easiest, stage 4 hardest.');
console.log('   Recorded band 40/35/30/20 win; Thomas asked ~10 points more failing → about 30/25/20/10.');
