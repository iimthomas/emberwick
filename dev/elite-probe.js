// 💀 WHAT IS AN ELITE, ACTUALLY? — before deciding whether it should be two beats.
//
// Thomas: *"what do you think about elite monsters potentially having multiple beats, maybe 2 max?
// so its like a mini boss."*
//
// ⚠️ Multi-beat has been cut TWICE and *one hand, one encounter* is on the inviolable list. The
// recorded objection is **problems per decision** (3-turn fights = a third of the puzzles for the
// same playtime) and **grinding** (a bigger pool over more beats moves attrition, not difficulty).
// 🔑 But an elite is already ×2.0 HP fought with ONE hand. If that means it is unkillable by
// construction, then it is a TOLL rather than a fight — and two beats would convert it back into
// a puzzle rather than adding grind. That is the thing to measure.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 250);

function survey(cls) {
  const el = { n: 0, C: 0, Nw: 0, L: 0, blow: 0, hp: 0, dmg: 0 };
  const nm = { n: 0, C: 0, Nw: 0, L: 0, blow: 0, hp: 0, dmg: 0 };
  let runs = 0, elitesSeen = 0, encounters = 0;
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(1700 + i);
    let seen = 0, enc = 0;
    sandbox.RUNSIM.setHook({
      onAssign() {
        const S = getS(), e = S.encounter;
        if (S.finalMode || !e || e.type !== 'fight') return;
        const r = sandbox.computeAction(null); if (!r) return;
        enc++;
        const b = e.elite ? el : nm;
        if (e.elite) seen++;
        b.n++; b[r.outcome === 'Complete' ? 'C' : r.outcome === 'Narrow' ? 'Nw' : 'L']++;
        b.blow += r.value; b.hp += e.hp;
        b.dmg += (r.early || 0) + (r.combatDmg || 0);
      },
    });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
    runs++; elitesSeen += seen; encounters += enc;
  }
  return { el, nm, runs, elitesSeen, encounters };
}

for (const cls of ['mage', 'rogue']) {
  const { el, nm, runs, elitesSeen, encounters } = survey(cls);
  const p = (b, k) => Math.round(100 * b[k] / (b.n || 1));
  const av = (b, k) => (b[k] / (b.n || 1)).toFixed(1);
  console.log(`\n=== ${cls} ===`);
  console.log(`  elites fought: ${(elitesSeen / runs).toFixed(2)} per run  (of ${(encounters / runs).toFixed(1)} fights)`);
  console.log(`  💀 ELITE   ${p(el,'C')}C/${p(el,'Nw')}N/${p(el,'L')}L   HP ${av(el,'hp')} vs your blow ${av(el,'blow')}   dmg taken ${av(el,'dmg')}`);
  console.log(`  ordinary   ${p(nm,'C')}C/${p(nm,'Nw')}N/${p(nm,'L')}L   HP ${av(nm,'hp')} vs your blow ${av(nm,'blow')}   dmg taken ${av(nm,'dmg')}`);
  console.log(`  🔑 blow as a share of elite HP: ${Math.round(100 * (el.blow/(el.n||1)) / (el.hp/(el.n||1)))}%  ` +
              `(ordinary: ${Math.round(100 * (nm.blow/(nm.n||1)) / (nm.hp/(nm.n||1)))}%)`);
}
