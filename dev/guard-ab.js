// 🧱 ISOLATE GUARD. Same creatures, same seeds — Guard ON vs Guard OFF.
// ⚠️ The confound is that Guard creatures might simply have more HP. This removes it: the ONLY
// difference between the two columns is whether the plates bite.
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(DIR, 'game.js'), 'utf8');

function run(disableGuard) {
  // patch one constant in a COPY, load through the normal harness path
  const tmp = path.join(__dirname, '.guard-tmp.js');
  fs.writeFileSync(tmp, src.replace('const GUARD_CUT = 0.5;', `const GUARD_CUT = ${disableGuard ? 1.0 : 0.5};`));
  const bak = path.join(__dirname, '.game-bak.js');
  fs.copyFileSync(path.join(DIR, 'game.js'), bak);
  fs.copyFileSync(tmp, path.join(DIR, 'game.js'));
  let out;
  try {
    delete require.cache[require.resolve('./headless.js')];
    const { sandbox, seed, useClass, getS } = require('./headless.js');
    out = {};
    for (const cls of ['mage', 'rogue']) {
      const g = { n: 0, C: 0, Nw: 0, L: 0, raw: 0, hp: 0 };
      for (let i = 0; i < 250; i++) {
        useClass(cls); seed(2400 + i);
        sandbox.RUNSIM.setHook({ onAssign() {
          const S = getS(); const e = S.encounter;
          if (S.finalMode || !e || e.type !== 'fight') return;
          if (!(e.shape === 'guard' || (e.shapes || []).includes('guard'))) return;
          const r = sandbox.computeAction(null); if (!r) return;
          g.n++; g[r.outcome === 'Complete' ? 'C' : r.outcome === 'Narrow' ? 'Nw' : 'L']++;
          g.raw += r.value; g.hp += e.hp;
        } });
        try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
      }
      out[cls] = g;
    }
  } finally {
    fs.copyFileSync(bak, path.join(DIR, 'game.js'));
    fs.unlinkSync(bak); fs.unlinkSync(tmp);
  }
  return out;
}

const on = run(false), off = run(true);
console.log('the SAME eight Guard creatures, same seeds — plates biting vs plates off:\n');
for (const cls of ['mage', 'rogue']) {
  const a = on[cls], b = off[cls];
  const p = (o, k) => Math.round(100 * o[k] / (o.n || 1));
  console.log(`${cls}  (avg creature HP ${(a.hp / (a.n||1)).toFixed(1)})`);
  console.log(`   GUARD ON   ${p(a,'C')}C/${p(a,'Nw')}N/${p(a,'L')}L   avg blow ${(a.raw/(a.n||1)).toFixed(1)}`);
  console.log(`   GUARD OFF  ${p(b,'C')}C/${p(b,'Nw')}N/${p(b,'L')}L   avg blow ${(b.raw/(b.n||1)).toFixed(1)}`);
  console.log(`   🔑 Guard itself costs ${p(b,'C') - p(a,'C')} points of Complete\n`);
}
