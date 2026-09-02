// 🔥 THE EMBERWAKE AS AN AMPLIFIER (2026-09-01, build 454) — does it fire, and does the bot use it?
// Counts: turns channelled · turns holding a wake · marks doubled by it · wakes that guttered ·
// and the one rule that is easy to get wrong: a CHANNELLED Surge must leave NO mark of its own.
// Also prices what an average arrangement leaves (the solver's EXPECT_EFFECT calibration).
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 200);
let turns = 0, banked = 0, holding = 0, ampMarks = 0, plainMarks = 0, gutter = 0, boostMarkWhileBanked = 0, bankedWithFlowHome = 0;
let effSum = 0, effTurns = 0, lode = 0;
const ampBy = {};

const rMark = S.markWith;
S.markWith = function (card, r, lvl, dry) {
  const out = rMark.apply(this, arguments);
  if (out && !dry) { if (out.amp > 1) { ampMarks++; ampBy[out.id] = (ampBy[out.id] || 0) + 1; } else plainMarks++; }
  return out;
};
const rApply = S.applyMarks;
S.applyMarks = function (r) {
  const st = H.getS();
  turns++;
  if (st.wake > 0) holding++;
  if (r && r.banks) {
    banked++;
    const c = S.cardById(st.assign.Boost);
    if (S.atHome(c, 'Boost')) bankedWithFlowHome++;
  }
  // 💰 what this arrangement leaves, priced the way solver.js prices it (rough copy)
  const atk = (st.encounter && st.encounter.atk) || 0;
  let v = 0;
  for (const m of S.previewMarks(r)) {
    const n = m.amp > 1 ? m.n / m.amp : m.n;   // un-amplified, so the average is what a plain turn leaves
    if (m.id === 'burn') v += m.lasting ? 3 * n : 1.5 * n;
    else if (m.id === 'frost' || m.id === 'daze') v += Math.min(n, atk) / 2;
    else if (m.id === 'expose') v += 0.8 * n;
    if (m.carry) v += 0.5 * n;
  }
  effSum += v; effTurns++;
  const before = ampMarks;
  const ms = rApply.apply(this, arguments);
  if (r && r.banks) for (const m of ms) if (S.homeSlotOf(m.card) === 'Boost' && m.card.id === st.assign.Boost) { const v = S.verbOf(m.card); if (v && v.name === 'Motherlode') lode++; else boostMarkWhileBanked++; }
  return ms;
};
const rLog = S.log;
S.log = function (t) { if (typeof t === 'string' && t.indexOf('gutters out') >= 0) gutter++; return rLog.apply(this, arguments); };

H.useClass('mage'); H.seed(20260901);
const b = S.RUNSIM.batch(true, N);

const pct = (a, b) => b ? (100 * a / b).toFixed(0) + '%' : '—';
console.log(`runs ${N} · fight turns ${turns}`);
console.log(`⟳ channelled     : ${banked} (${pct(banked, turns)}) · of which the Surge was a FLOW card at home ${bankedWithFlowHome}`);
console.log(`🔥 holding a wake : ${holding} turns (${pct(holding, turns)}) · marks doubled ${ampMarks} vs plain ${plainMarks} · by effect ${JSON.stringify(ampBy)}`);
console.log(`💨 guttered       : ${gutter} (${pct(gutter, banked)} of channels wasted)`);
console.log(`🚫 channelled Surge left a mark: ${boostMarkWhileBanked} ${boostMarkWhileBanked ? '🔴 RULE BROKEN' : '✅ (fires nothing, as the rule says)'} · ✦ Motherlode fired ${lode}`);
console.log(`💰 avg effect value a plain turn leaves: ${(effSum / Math.max(1, effTurns)).toFixed(2)} (solver prices a bank at BANK_WEIGHT × strength × EXPECT_EFFECT)`);
if (b && b.stage) console.log('ladder:', JSON.stringify(b.stage));
