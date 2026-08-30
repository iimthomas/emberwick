// 🔴 CATCH THE INCONSISTENT STATE ITSELF (2026-08-30, from a screenshot: an Ashen Boar panel
// showing "turn 1 · par 3" — so S.foeState exists — beside a reveal reading "vs ❤️ 26 (half 13)"
// and LOSS, which is the NON-beat path. That combination should be impossible.
// 🔑 Assert the invariant at every resolve rather than guessing which caller broke it.
const H = require('./headless.js');
const S = H.sandbox;
const bad = [];

const realResolve = S.resolve;
S.resolve = function () {
  const st = H.getS();
  if (st && st.foeState && st.encounter && !st.encounter.beatFight) {
    bad.push({ foe: st.foeBase && st.foeBase.name, encName: st.encounter.name,
               encHp: st.encounter.hp, turn: st.foeState.turn, phase: st.phase,
               region: st.region, finale: !!st.finalMode });
  }
  return realResolve.apply(this, arguments);
};

// who last wrote S.encounter?
let lastWriter = '(none)';
const realBegin = S.beginEncounter;
S.beginEncounter = function (e) { lastWriter = 'beginEncounter:' + (e && e.name); return realBegin.apply(this, arguments); };
const realStartBeat = S.startFoeBeat;
S.startFoeBeat = function () { lastWriter = 'startFoeBeat'; return realStartBeat.apply(this, arguments); };

H.useClass('mage');
H.seed(31337);
S.RUNSIM.batch(true, 25);

console.log('resolves with foeState but NO beatFight:', bad.length);
bad.slice(0, 8).forEach(b => console.log('   ', JSON.stringify(b)));
console.log('last S.encounter writer at end:', lastWriter);
