// 🛡️ CAN A RUN BREAK? — a stress audit, not a reassurance.
//
// Four things that would each be fatal in a way a player could not recover from:
//   1. a MAP that cannot be walked (an unreachable node, a dead end, no start)
//   2. a run that THROWS or STALLS mid-way
//   3. a deck that empties or goes negative on the road
//   4. a SAVE that will not reload, at any phase a run can be left in
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 400);
let fail = 0;
const bad = (what, detail) => { fail++; console.log(`  ❌ ${what}` + (detail ? ` — ${detail}` : '')); };

// ---------- 1. MAP STRUCTURE ----------
console.log('1. MAP STRUCTURE');
let maps = 0, starts = {}, orphan = 0, deadend = 0, badEdge = 0;
for (let i = 0; i < N * 5; i++) {
  sandbox.setClass(sandbox.MAGE);
  const m = sandbox.generateMap(); maps++;
  const F = m.floors.length, C = m.floors[0].length;
  const live = [];
  for (let f = 0; f < F; f++) for (let c = 0; c < C; c++) if (m.floors[f][c]) live.push(m.floors[f][c]);
  const s = m.floors[0].filter(Boolean).length;
  starts[s] = (starts[s] || 0) + 1;
  // reachability from floor 0 upward
  let front = m.floors[0].filter(Boolean);
  const seen = new Set(front.map(n => n.f + ',' + n.c));
  while (front.length) {
    const nxt = [];
    for (const n of front) for (const k of (n.next || [])) {
      const t = m.floors[n.f + 1] && m.floors[n.f + 1][k];
      if (!t) { badEdge++; continue; }
      const id = t.f + ',' + t.c;
      if (!seen.has(id)) { seen.add(id); nxt.push(t); }
    }
    front = nxt;
  }
  for (const n of live) {
    if (!seen.has(n.f + ',' + n.c)) orphan++;                       // cannot be reached
    if (n.f < F - 1 && (!n.next || !n.next.length)) deadend++;       // cannot go on
  }
}
console.log(`   ${maps} maps · starts seen: ${JSON.stringify(starts)}`);
if (orphan) bad('unreachable nodes', orphan); else console.log('   ✅ every node reachable from a start');
if (deadend) bad('dead-end nodes below the top floor', deadend); else console.log('   ✅ every node below the top has an exit');
if (badEdge) bad('edges pointing at nothing', badEdge); else console.log('   ✅ every edge lands on a real node');

// ---------- 2/3. RUNS: throws, stalls, deck ----------
console.log('\n2. RUNS — throws, stalls, deck');
let runs = 0, threw = 0, stalled = 0, minDeck = 99, negative = 0, ended = {};
for (const cls of ['mage', 'rogue']) {
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(11000 + i);
    let turns = 0;
    sandbox.RUNSIM.setHook({ onAssign() {
      const S = getS(); turns++;
      const tot = S.hand.length + S.deck.length + S.discard.length;
      if (tot < minDeck) minDeck = tot;
      if (tot < 0 || S.deck.length < 0 || Number.isNaN(tot)) negative++;
    } });
    try { sandbox.RUNSIM.autoRun(true); runs++; }
    catch (e) { threw++; if (threw <= 2) bad('run threw', e.message); continue; }
    const S = getS();
    ended[S.phase] = (ended[S.phase] || 0) + 1;
    if (turns >= 700) stalled++;
  }
}
console.log(`   ${runs} runs completed · threw ${threw} · stalled ${stalled}`);
console.log(`   runs ended in: ${JSON.stringify(ended)}`);
console.log(`   smallest total deck seen: ${minDeck} of 16`);
if (threw) bad('runs threw', threw);
if (stalled) bad('runs hit the 800-step guard', stalled);
if (negative) bad('deck went negative or NaN', negative);
if (!threw && !stalled && !negative) console.log('   ✅ no throws, no stalls, deck never went negative');

// ---------- 4. SAVE / LOAD at every phase a run can be left in ----------
// 🔑 Hook render(), which fires on EVERY phase change. The first version of this test used
// an onAssign hook, so it only ever saw 'assign' and passed VACUOUSLY — a test that exercises one
// case out of fifteen is not a pass, it is a blind spot with a tick next to it.
console.log('\n4. SAVE ROUND-TRIP, at every phase a run actually enters');
const phases = new Set(); let saved = 0; const failed = new Set();
const realRender = sandbox.render;
sandbox.render = function () {
  const st = getS();
  // 🔴 SAMPLE EVERY DISTINCT SITUATION, NOT THE FIRST OF EACH PHASE (fixed 2026-08-23).
  // Keying on phase alone meant ONE save per phase across 160 runs — and it hid a real bug for
  // weeks: EVERY ELITE ENCOUNTER WAS UNRESUMABLE, because the save stored the decorated name
  // ("Mirefen Road, grown bold"), which exists in no region list, so loadGame() returned false
  // — silently, which is indistinguishable from "no save yet". The first 'soak' this sampled
  // just happened to be an ordinary creature nearly every time.
  // 🔑 A TEST THAT EXERCISES ONE CASE PER CATEGORY IS A BLIND SPOT WITH A TICK NEXT TO IT.
  const e = st && st.encounter;
  const key = st && st.phase
    ? st.phase + '|' + (e ? (e.elite ? 'elite' : e.dragon ? 'dragon' : e.type) : 'none')
    : null;
  if (key && st.deck && !phases.has(key)) {
    phases.add(key);
    try {
      sandbox.saveGame(); saved++;
      if (!sandbox.loadGame()) failed.add(key);
    } catch (err) { failed.add(key + ' (threw: ' + err.message + ')'); }
  }
  return realRender.apply(this, arguments);
};
for (const cls of ['mage', 'rogue']) for (let i = 0; i < 80; i++) {
  useClass(cls); seed(12000 + i);
  sandbox.RUNSIM.setHook({});
  try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
}
sandbox.render = realRender;
console.log('   situations exercised (' + phases.size + '): ' + [...phases].sort().join(', '));
if (failed.size) bad('situations that would NOT reload', [...failed].join(', '));
else console.log('   \u2705 ' + saved + ' saves round-tripped across ' + phases.size + ' distinct situations');

console.log(`\n${fail === 0 ? '✅ NO FAILURES' : '❌ ' + fail + ' FAILURE(S)'}`);
