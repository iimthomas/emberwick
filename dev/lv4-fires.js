// ✦ HOW OFTEN DOES A Lv4 ABILITY ACTUALLY FIRE? (2026-08-30)
// Thomas, proposing element statuses: *"i don't know if these will be on all of the cards, or if
// they will be the lvl 4 powers. or maybe we remove lvl 4 powers and replace with these."*
// 🔑 That is answerable. Sixteen verbs were authored, each firing in ONE slot at Lv4 — so the
// question is not whether they are good, it is whether anyone ever sees one.
const H = require('./headless.js');
const S = H.sandbox;
let turns = 0, lv4InHand = 0, lv4Seated = 0, fired = 0, runs = 0, runsWithAFire = 0;
let thisRun = 0;
const SLOT_OF = { FORCE: 'Spell', SPARK: 'Element', FLOW: 'Boost', WARD: 'soak' };

const rf = S.freshGame;
S.freshGame = function () { if (thisRun) runsWithAFire++; thisRun = 0; runs++; return rf.apply(this, arguments); };

const rr = S.resolve;
S.resolve = function () {
  const st = H.getS();
  if (st && st.encounter && st.hand) {
    turns++;
    const four = st.hand.filter(c => c.level >= 4);
    if (four.length) lv4InHand++;
    // seated in its OWN slot is what makes a verb fire
    for (const c of four) {
      const want = SLOT_OF[c.def.arch];
      if (!want) continue;
      if (want === 'soak') continue;                 // fires during the soak phase, not here
      if (st.assign[want] === c.id) { lv4Seated++; fired++; thisRun++; break; }
    }
  }
  return rr.apply(this, arguments);
};

H.useClass('mage'); H.seed(20260830);
S.RUNSIM.batch(true, 400);
const pc = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '—';
console.log('turns played                :', turns);
console.log('turns holding ANY Lv4 card  :', lv4InHand, pc(lv4InHand, turns));
console.log('turns a Lv4 verb FIRED      :', fired, pc(fired, turns));
console.log('runs                        :', runs);
console.log('runs where a verb fired ONCE:', runsWithAFire, pc(runsWithAFire, runs));
console.log('verb firings per run        :', (fired / runs).toFixed(2));
