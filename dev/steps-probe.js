// 🚪 HOW MANY STEPS DOES A RESOLUTION TAKE? (2026-08-30)
// Thomas: *"no more step by step resolving"*. A fight should open exactly ONE popup, on the turn
// it ends, and that popup should have exactly ONE beat. Journeys keep their staging.
const H = require('./headless.js');
const S = H.sandbox;
const seen = {};

const realAdvance = S.advanceBeat;
S.advanceBeat = function () {
  const st = H.getS();
  if (st && st.beatIndex === -1 && st.beats) {
    const e = st.encounter;
    // the FINALE keeps its staging on purpose - it is one fight a run and the whole point of it
    const key = st.finalMode ? 'finale' : (e && e.type === 'fight' ? 'fight' : 'journey');
    (seen[key] = seen[key] || []).push(st.beats.length);
  }
  return realAdvance.apply(this, arguments);
};

H.useClass('mage'); H.seed(5150);
S.RUNSIM.batch(true, 20);

const tally = a => a.reduce((o, n) => (o[n] = (o[n] || 0) + 1, o), {});
for (const k of ['fight', 'journey', 'finale']) {
  const a = seen[k] || [];
  console.log((k + '        ').slice(0, 8), 'popups:', String(a.length).padStart(4), '· beats per popup:', JSON.stringify(tally(a)));
}
const allOne = (seen.fight || []).every(n => n === 1);
console.log(allOne ? '\n✅ every fight resolves in ONE step' : '\n🔴 a fight is still stepping');
