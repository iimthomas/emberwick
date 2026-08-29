// 👣 WHY DO JOURNEYS FEEL THE SAME? — 2026-08-28
//
// Thomas: *"still wondering if we can differentiate journies somehow... something about initiative
// mattering more over the spell maybe"*
//
// 🔑 THE THING TO CHECK FIRST IS THAT INITIATIVE ALREADY HAS A JOB THERE. A journey resolves TWO
// independent checks: `value` vs `mpEff` decides Complete/Narrow/Loss, and `pace` vs `nightfall`
// decides whether the night takes your ✦ Arsenal. So the shape he is asking for is half-built —
// which means the interesting question is not "should Initiative matter" but **"does the second
// race ever actually bite, and does it ever CONTEND with the first?"**
//
// A fork only exists if the arrangement that wins the road is sometimes NOT the arrangement that
// beats the dark. With four cards there are 24 ways to fill four slots, so this enumerates all of
// them per journey and asks exactly that. ⚠️ 4 cards → 24 permutations is cheap; this is the same
// "two independent conditions on a 4-card hand" arithmetic that killed the attune/Initiative
// sacrifice twice, and it is worth knowing BEFORE designing rather than after.
//
// ⚠️ NON-INVASIVE. It snapshots S.assign, permutes, calls computeAction(), and restores — it never
// calls render() or normalizeAssign(), because a probe that reseats the arrangement the bot just
// built is not measuring the bot. (That has happened here before.)
'use strict';
const H = require('./headless.js');
const B = H.sandbox;
const RUNS = +(process.argv[2] || 60);
const CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS); B.RUNSIM.setBankWeight(1.0);

const ZONES = ['Spell', 'Element', 'Boost', 'Reserve'];
const perms = (a) => a.length <= 1 ? [a] :
  a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));

let journeys = 0, caught = 0, marginSum = 0;
const margins = [];
let greedyClears = 0,          // the best-value arrangement also beats the night
    forkReal = 0,              // you could beat the night, but only by giving up the road
    nightImpossible = 0,       // no arrangement beats the night at all
    nightFree = 0;             // EVERY arrangement beats the night
let sameAsFight = 0, fightsSeen = 0;
const mps = [], nights = [];

B.RUNSIM.setHook({ onAssign: () => {
  const S = H.getS();
  const e = S.encounter;
  if (!e || e.type !== 'journey' || !S.hand || S.hand.length < 4) return;
  journeys++;
  mps.push(e.mp); nights.push(e.nightfall || 0);

  const snap = Object.assign({}, S.assign);
  const ids = S.hand.map(c => c.id);
  let best = null, anyClear = 0, total = 0, bestClearing = null;
  for (const p of perms(ids)) {
    ZONES.forEach((z, i) => { S.assign[z] = p[i]; });
    let r = null;
    try { r = B.computeAction(B.cardById(S.assign.Reserve)); } catch (err) { continue; }
    if (!r) continue;
    total++;
    const clears = !r.nightCaught;
    if (clears) anyClear++;
    // rank by outcome first, then raw value — the road is what the encounter is FOR
    const rank = { Loss: 0, Narrow: 1, Complete: 2 }[r.outcome] || 0;
    const score = rank * 1000 + r.value;
    if (!best || score > best.score) best = { score, rank, clears, value: r.value };
    if (clears && (!bestClearing || score > bestClearing.score)) bestClearing = { score, rank, value: r.value };
  }
  Object.assign(S.assign, snap);
  if (!best || !total) return;

  const live = B.computeAction(B.cardById(S.assign.Reserve));
  if (live && live.nightCaught) caught++;
  if (live) { margins.push(live.pace - live.nightfall); marginSum += live.pace - live.nightfall; }

  if (anyClear === total) nightFree++;
  else if (anyClear === 0) nightImpossible++;
  else if (best.clears) greedyClears++;
  // 🔑 THE ONE THAT MATTERS: the road-maximising play loses to the dark, and something else
  // would have beaten it. That is the only case where Initiative is a DECISION rather than
  // a consequence.
  else forkReal++;
} });

for (let i = 0; i < RUNS; i++) { H.seed(7700 + i); try { B.RUNSIM.autoRun(true); } catch (e) {} }

const pct = n => (100 * n / (journeys || 1)).toFixed(1) + '%';
const spread = a => { const s = [...a].sort((x, y) => x - y);
  return `${s[0]}–${s[s.length - 1]} · median ${s[Math.floor(s.length / 2)]}`; };

console.log(`\n👣 JOURNEYS — ${CLS}, ${RUNS} runs, ${journeys} journeys, all 24 arrangements each\n`);
console.log(`   🌙 caught by Nightfall            ${pct(caught)}`);
console.log(`   pace − nightfall margin           avg ${(marginSum / (journeys || 1)).toFixed(1)} · ${spread(margins)}`);
console.log('');
console.log('   IS THE SECOND RACE EVER A DECISION?');
console.log(`   every arrangement beats the dark   ${pct(nightFree)}   ← Initiative is decoration`);
console.log(`   the best road play also clears     ${pct(greedyClears)}   ← free, no contention`);
console.log(`   🔑 a REAL fork (road vs dark)      ${pct(forkReal)}`);
console.log(`   no arrangement can clear it        ${pct(nightImpossible)}   ← unavoidable, not a choice`);
console.log('');
console.log(`   MP spread        ${spread(mps)}`);
console.log(`   Nightfall spread ${spread(nights)}`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
