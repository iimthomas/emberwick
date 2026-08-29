// 🧩 THE ROAD SHAPES, AGAINST THE TWO TESTS DECIDED IN ADVANCE — 2026-08-28
//
// [[Blow_And_Distance]] exists because `distance` mode PASSED its acceptance test and was still
// bad. 🔑 **Two puzzles can be different and one of them can still be a continue button.** So this
// runs both halves, and the second is the one that killed the last attempt:
//
//   ① DIFFERENCE — does a journey want a different arrangement from a fight, for the SAME hand?
//      Baseline on record: identical-best-arrangement 68%, identical-Spell 91%.
//
//   ② DEPTH — hold the ✦ Arsenal fixed and permute the other three. If the outcome rarely moves,
//      the decision is not there. Baseline on record: journeys 6% flat (deep), `distance` 56% flat.
//
//   ③ COVERAGE — ~90% of roads carry a shape, or it is still trivia.
//
// ⚠️ Non-invasive: snapshots S.assign, permutes, restores. Never calls render()/normalizeAssign().
// 🔴 THE FEATURE THIS TESTS WAS BUILT ON 2026-08-28 AND REVERTED THE SAME DAY, because it failed
// all three tests below. The file is kept, and kept RUNNABLE, for the reason `JOURNEY_MODE`
// keeps 'distance': **the measurement has to be re-runnable or the next attempt starts blind.**
// It says so and exits rather than crashing when the feature is absent.
'use strict';
const H = require('./headless.js');
const B = H.sandbox;
if (typeof B.roadShape !== 'function') {
  console.log('road shapes are not built (reverted 2026-08-28 - see Blow_And_Distance).');
  console.log('Rebuild them and re-run this unchanged; the three tests are the agreed bar.');
  process.exit(0);
}
const RUNS = +(process.argv[2] || 60);
const CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS); B.RUNSIM.setBankWeight(1.0);

const ZONES = ['Spell', 'Element', 'Boost', 'Reserve'];
const perms = a => a.length <= 1 ? [a] :
  a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));

// score an arrangement the way the game decides it: outcome first, then the road's own number
const rank = r => ({ Loss: 0, Narrow: 1, Complete: 2 }[r.outcome] || 0);
const num = r => (r.progress != null ? r.progress : r.value) || 0;

let hands = 0, sameArr = 0, sameSpell = 0;          // ① difference
const diff = {}, pair = {};
let jn = 0, flat = 0;                                // ② depth
let shaped = 0, jTotal = 0;                          // ③ coverage
const byShape = {};

function bestFor(S, enc) {
  const snap = Object.assign({}, S.assign), realEnc = S.encounter;
  S.encounter = enc;
  let best = null;
  for (const p of perms(S.hand.map(c => c.id))) {
    ZONES.forEach((z, i) => { S.assign[z] = p[i]; });
    let r = null;
    try { r = B.computeAction(B.cardById(S.assign.Reserve)); } catch (e) { continue; }
    if (!r) continue;
    const sc = rank(r) * 1000 + num(r);
    if (!best || sc > best.sc) best = { sc, arr: p.join(','), spell: p[0] };
  }
  Object.assign(S.assign, snap); S.encounter = realEnc;
  return best;
}

B.RUNSIM.setHook({ onAssign: () => {
  const S = H.getS(), e = S.encounter;
  if (!e || !S.hand || S.hand.length < 4) return;

  if (e.type === 'journey') {
    jTotal++;
    const k = B.roadShape(e);
    if (k) { shaped++; byShape[k] = (byShape[k] || 0) + 1; }

    // ② DEPTH — Arsenal fixed, permute the other three
    jn++;
    const snap = Object.assign({}, S.assign);
    const res = S.assign.Reserve;
    const rest = S.hand.map(c => c.id).filter(id => id !== res);
    const outs = new Set();
    for (const p of perms(rest)) {
      S.assign.Spell = p[0]; S.assign.Element = p[1]; S.assign.Boost = p[2]; S.assign.Reserve = res;
      try { const r = B.computeAction(B.cardById(res)); if (r) outs.add(r.outcome); } catch (err) {}
    }
    Object.assign(S.assign, snap);
    if (outs.size <= 1) flat++;
  }

  // ① DIFFERENCE — the same hand, scored against a real fight AND EVERY KIND OF ROAD.
  // 🔴 THE FIRST CUT OF THIS TOOK `pool.find(journey)` — the FIRST journey in the road — and the
  // shape cycle puts 🪨 Long first in every one of them. So it compared a fight against exactly the
  // shape that cannot fork, reported 68.1%, and looked like the whole design had failed.
  // 🔑 **An instrument that samples one case cannot measure a system of three.** It reports per
  // shape now, because "did the design work" is four different questions.
  const road = B.ROADS[S.stage || 1] || B.REGIONS;
  const pool = [];
  for (const band of road) for (const enc of (band.encounters || [])) pool.push(enc);
  const f = pool.find(x => x.type === 'fight');
  if (!f) return;
  const bf = bestFor(S, f);
  if (!bf) return;
  const roadBest = {};
  for (const kind of ['long', 'dark', 'steep', 'bare']) {
    const j = pool.find(x => x.type === 'journey' && (B.roadShape(x) || 'bare') === kind);
    if (!j) continue;
    const bj = bestFor(S, j);
    if (!bj) continue;
    diff[kind] = diff[kind] || { n: 0, arr: 0, spell: 0 };
    diff[kind].n++;
    if (bf.arr === bj.arr) diff[kind].arr++;
    if (bf.spell === bj.spell) diff[kind].spell++;
    hands++;
    if (bf.arr === bj.arr) sameArr++;
    if (bf.spell === bj.spell) sameSpell++;
    roadBest[kind] = bj;
  }
  // (1b) DO ROADS DIFFER FROM EACH OTHER? A separate question, and the other half of the recorded
  // diagnosis: the Balance_Log measured that journeys "resemble EACH OTHER, not just fights"
  // (MP 85% inside 11-14, Nightfall 77% inside 4-6). Shapes could fail the fight comparison and
  // still fix this one, so it must be asked BEFORE anything is reverted.
  const kinds = Object.keys(roadBest);
  for (let i = 0; i < kinds.length; i++) for (let k = i + 1; k < kinds.length; k++) {
    const key = kinds[i] + ' vs ' + kinds[k];
    pair[key] = pair[key] || { n: 0, same: 0 };
    pair[key].n++;
    if (roadBest[kinds[i]].arr === roadBest[kinds[k]].arr) pair[key].same++;
  }
} });

for (let i = 0; i < RUNS; i++) { H.seed(9100 + i); try { B.RUNSIM.autoRun(true); } catch (e) {} }

const p = (n, d) => (100 * n / (d || 1)).toFixed(1) + '%';
const on = H.getTunable('ROAD_SHAPES_ON');
console.log(`\n🧩 ROAD SHAPES ${on ? 'ON' : 'OFF'} — ${CLS}, ${RUNS} runs\n`);
console.log(`   ① DIFFERENCE   (n=${hands} hands, same hand vs a real fight and a real road)`);
console.log(`      identical best arrangement   ${p(sameArr, hands)}   ← baseline 68%, must fall well below`);
console.log(`      identical Spell              ${p(sameSpell, hands)}   ← baseline 91%, must fall well below`);
for (const k of ['long', 'dark', 'steep', 'bare']) {
  const d = diff[k]; if (!d) continue;
  console.log(`      vs ${k.padEnd(6)} (n=${String(d.n).padStart(4)})  same arrangement ${p(d.arr, d.n).padStart(6)}  ·  same Spell ${p(d.spell, d.n).padStart(6)}`);
}
console.log(`
   (1b) DO ROADS DIFFER FROM EACH OTHER?`);
for (const k of Object.keys(pair).sort()) console.log(`      ${k.padEnd(18)} same arrangement ${p(pair[k].same, pair[k].n).padStart(6)}`);
console.log(`\n   ② DEPTH        (n=${jn} journeys, Arsenal fixed, other three permuted)`);
console.log(`      rearranging changes NOTHING  ${p(flat, jn)}   ← baseline 6%; 'distance' failed at 56%`);
console.log(`\n   ③ COVERAGE     ${p(shaped, jTotal)} of ${jTotal} roads carry a shape   ← target ~90%`);
console.log(`      ${JSON.stringify(byShape)}`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
