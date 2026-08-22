// 🧱 CAN THE MAGE ANSWER GUARD AT ALL?
//
// Thomas: *"should there be one? might be too hard, since we don't have that many multihit cards."*
// Guard halves your first N HITS, so it asks for MANY. The mage's compose() always returns
// hits: 1, and exactly ONE card in the game is multi-hit (🗡️ Second Fang). So the question is
// whether Guard poses her a QUESTION or simply subtracts.
//
// ⚠️ Measure it on the eight creatures that already carry Guard, rather than reasoning about it —
// two hypotheses died today from reasoning.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 300);

function survey(cls) {
  const g = { n: 0, C: 0, Nw: 0, L: 0, lost: 0, raw: 0 };
  const o = { n: 0, C: 0, Nw: 0, L: 0, raw: 0 };
  let hitsSeen = {};
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(2400 + i);
    sandbox.RUNSIM.setHook({
      onAssign() {
        const S = getS();
        if (S.finalMode || !S.encounter || S.encounter.type !== 'fight') return;
        const r = sandbox.computeAction(null);
        if (!r) return;
        hitsSeen[r.hits] = (hitsSeen[r.hits] || 0) + 1;
        // ⚠️ foeHas is a top-level const — lexical, so invisible outside the sandbox. Read the data.
        const e = S.encounter;
        const isGuard = e.shape === 'guard' || (e.shapes || []).includes('guard');
        const b = isGuard ? g : o;
        b.n++; b[r.outcome === 'Complete' ? 'C' : r.outcome === 'Narrow' ? 'Nw' : 'L']++;
        b.raw += r.value;
        // what the guard plates actually ate this turn
        if (isGuard && r.hits > 1) g.lost++;   // turns where a multi-hit card was actually played into it
      },
    });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
  }
  return { g, o, hitsSeen };
}

for (const cls of ['mage', 'rogue']) {
  const { g, o, hitsSeen } = survey(cls);
  const p = (b, k) => Math.round(100 * b[k] / (b.n || 1));
  console.log(`\n=== ${cls} ===`);
  console.log(`  hits per turn: ${JSON.stringify(hitsSeen)}`);
  console.log(`  multi-hit played INTO guard: ${g.lost} of ${g.n} guard turns`);
  console.log(`  vs 🧱 GUARD    n=${g.n}  ${p(g,'C')}C/${p(g,'Nw')}N/${p(g,'L')}L   avg blow ${(g.raw/(g.n||1)).toFixed(1)}`);
  console.log(`  vs everything else n=${o.n}  ${p(o,'C')}C/${p(o,'Nw')}N/${p(o,'L')}L   avg blow ${(o.raw/(o.n||1)).toFixed(1)}`);
  console.log(`  🔑 Complete rate drop against Guard: ${p(o,'C') - p(g,'C')} points`);
}
