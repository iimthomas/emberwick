// ✦ WHAT IS THE PAIR WORTH NEXT TO THE SURGE — AND WHAT DOES LOOSE WEAVE ACTUALLY COST YOU?
// Thomas: *"just using the boost card gives a lot of good damage."*
// 🔑 AND THE STRUCTURAL CHECK: `looseOnly()` returns FALSE whenever the Catalyst really matches, so
// a real pair still pays FULL. That means the charm never takes anything away on a turn you could
// have attuned properly — it only adds half a bonus on turns you could not. If that is true, the
// card's own `why` ("ceiling traded for consistency") describes a trade that never happens.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const RUNS = +(process.argv[2] || 150);
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass('mage'); B.RUNSIM.setBankWeight(1.0);

const realHas = B.hasCharm;
function measure(force) {
  B.hasCharm = function (id) { return (id === 'looseweave' && force !== null) ? force : realHas.apply(this, arguments); };
  let t = 0, boost = 0, bonusFull = 0, nFull = 0, bonusLoose = 0, nLoose = 0, lostCeiling = 0;
  B.RUNSIM.setHook({ onAssign: () => {
    const s = S(); if (!s.hand || s.hand.length < 2) return; t++;
    const sp = B.cardById(s.assign.Spell), bo = B.cardById(s.assign.Boost);
    if (bo) boost += B.eff(bo).boost;
    if (sp && B.attunedNow()) {
      const e = B.eff(sp), full = e.attuned - e.value;
      if (B.looseOnly()) { bonusLoose += Math.floor(full / 2); nLoose++; }
      else { bonusFull += full; nFull++; }
    }
    // 🔑 THE TRADE THE CARD CLAIMS: a turn where a REAL pair existed but the charm made us settle
    // for half. If this is ~0, the printed cost never fires.
    if (force && B.looseOnly()) {
      const el = B.cardById(s.assign.Element);
      const match = c => !!(c && sp && (c.def.wild || B.elOf(c) === B.elOf(sp)));
      if (s.hand.some(c => c !== sp && c !== el && match(c))) lostCeiling++;
    }
  }});
  for (let i = 0; i < RUNS; i++) { H.seed(6400 + i); try { B.RUNSIM.autoRun(true); } catch (e) {} }
  B.RUNSIM.setHook({}); B.hasCharm = realHas;
  return { t, boost: boost / (t || 1), full: bonusFull / (nFull || 1), fullPc: 100 * nFull / (t || 1),
           loose: bonusLoose / (nLoose || 1), loosePc: 100 * nLoose / (t || 1), lost: 100 * lostCeiling / (t || 1) };
}
console.log(`\n✦ THE PAIR vs THE SURGE — mage, ${RUNS} runs, ATTUNE_BONUS ${H.getTunable('ATTUNE_BONUS')}\n`);
for (const [lab, f] of [['Loose Weave OFF', false], ['Loose Weave ON ', true]]) {
  const r = measure(f);
  console.log(`  ${lab}   ➕ Surge boost ${r.boost.toFixed(1)}   ✦ full pair +${r.full.toFixed(1)} on ${r.fullPc.toFixed(0)}% of turns` +
    (f ? `   ✦ loose +${r.loose.toFixed(1)} on ${r.loosePc.toFixed(0)}%` : ''));
  if (f) console.log(`\n  ⚠️ turns where a real pair was SITTING IN HAND and the charm settled for half: ${r.lost.toFixed(1)}%`);
}
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
