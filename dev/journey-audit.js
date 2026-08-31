// 👣 WHAT WOULD DELETING JOURNEYS ACTUALLY COST? (2026-08-30)
// Thomas: *"what if we just removed the journeys, i don't know what point they have anymore."*
// 🔑 A call this size gets measured, not argued. Three questions: how much of a run are they,
// what content is journey-ONLY, and what rules would have nowhere left to live.
const H = require('./headless.js');
const S = H.sandbox;

// ── content audit ─────────────────────────────────────────────────────────
const seen = new Set(); let J = 0, F = 0;
const perils = new Set();
for (const rk of Object.keys(S.ROADS)) for (const ri of Object.keys(S.ROADS[rk])) {
  for (const e of (S.ROADS[rk][ri].encounters || [])) {
    if (seen.has(e.name)) continue; seen.add(e.name);
    if (e.type === 'journey') { J++; if (e.peril) perils.add(e.peril); } else F++;
  }
}
console.log('CONTENT   journeys authored:', J, '· fight creatures:', F);
console.log('          journey-only perils in use:', [...perils].join(', ') || '(none)');
console.log('          PERILS table size:', Object.keys(S.PERILS || {}).length);

// ── run audit ─────────────────────────────────────────────────────────────
const t = { journey: 0, fight: 0, event: 0 };
const out = { C: 0, N: 0, L: 0 };
let tp = 0, tpHits = 0, nightCaught = 0, jTurns = 0, fTurns = 0;

const rr = S.resolve;
S.resolve = function () {
  const st = H.getS(), e = st.encounter;
  if (e && !st.finalMode) { if (e.type === 'journey') jTurns++; else fTurns++; }
  return rr.apply(this, arguments);
};
const rf = S.finishResolve;
S.finishResolve = function () {
  const st = H.getS(), r = st.pendingR, e = st.encounter;
  if (r && e && !st.finalMode) {
    t[e.type === 'journey' ? 'journey' : 'fight']++;
    if (e.type === 'journey') {
      out[r.outcome === 'Complete' ? 'C' : r.outcome === 'Narrow' ? 'N' : 'L']++;
      if (r.timePenalty > 0) { tp += r.timePenalty; tpHits++; }
      if (r.nightCaught) nightCaught++;
    }
  }
  return rf.apply(this, arguments);
};

H.useClass('mage'); H.seed(20260830);
S.RUNSIM.batch(true, 200);
const runs = 200;
console.log('');
console.log('PER RUN   journeys', (t.journey / runs).toFixed(1), '· fight ENCOUNTERS', (t.fight / runs).toFixed(1));
console.log('PER RUN   turns spent on journeys', (jTurns / runs).toFixed(1), '· on fights', (fTurns / runs).toFixed(1),
            '→ journeys are', Math.round(100 * jTurns / (jTurns + fTurns)) + '% of turns played');
console.log('');
console.log('JOURNEY OUTCOMES  C', out.C, '/ N', out.N, '/ L', out.L,
            '→ Narrow fires', Math.round(100 * out.N / (out.C + out.N + out.L)) + '% of journeys');
console.log('⏳ Time Penalty   fired on', tpHits, 'journeys ·', (tp / runs).toFixed(1), 'penalty per run');
console.log('🌙 caught by Nightfall on', nightCaught, 'journeys');
