// 💀 IF AN ELITE STAYS ONE HAND, WHAT SHOULD ITS HP BE?
//
// Multi-beat is the DRAGON's identity (⏳ Relentless is boss-only by construction), so elites keep
// one hand — Thomas, 2026-08-22. But the measured problem stands: at ELITE_HP 2.0 the mage's blow
// is 36% of an elite's HP, so Complete is arithmetically out of reach and an elite is a TOLL.
// This sweeps the one constant that fixes it.
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(DIR, 'game.js'), 'utf8');
const N = +(process.argv[2] || 200);

function run(mult) {
  const bak = path.join(__dirname, '.game-bak.js');
  fs.copyFileSync(path.join(DIR, 'game.js'), bak);
  fs.writeFileSync(path.join(DIR, 'game.js'),
    SRC.replace(/let ELITE_HP = [0-9.]+,/, `let ELITE_HP = ${mult},`));
  let out = {};
  try {
    delete require.cache[require.resolve('./headless.js')];
    const { sandbox, seed, useClass, getS } = require('./headless.js');
    for (const cls of ['mage', 'rogue']) {
      const b = { n: 0, C: 0, Nw: 0, L: 0, hp: 0, blow: 0, dmg: 0 };
      for (let i = 0; i < N; i++) {
        useClass(cls); seed(1700 + i);
        sandbox.RUNSIM.setHook({ onAssign() {
          const S = getS(), e = S.encounter;
          if (S.finalMode || !e || e.type !== 'fight' || !e.elite) return;
          const r = sandbox.computeAction(null); if (!r) return;
          b.n++; b[r.outcome === 'Complete' ? 'C' : r.outcome === 'Narrow' ? 'Nw' : 'L']++;
          b.hp += e.hp; b.blow += r.value; b.dmg += (r.early || 0) + (r.combatDmg || 0);
        } });
        try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
      }
      out[cls] = b;
    }
  } finally {
    fs.copyFileSync(bak, path.join(DIR, 'game.js'));
    fs.unlinkSync(bak);
  }
  return out;
}

console.log('ELITE_HP   mage                          rogue');
console.log('           C/N/L      HP  blow  dmg      C/N/L      HP  blow  dmg');
for (const m of [2.0, 1.8, 1.6, 1.4, 1.2]) {
  const o = run(m);
  const fmt = b => {
    const p = k => String(Math.round(100 * b[k] / (b.n || 1))).padStart(2);
    return `${p('C')}/${p('Nw')}/${p('L')}  ${(b.hp/(b.n||1)).toFixed(1).padStart(4)} ${(b.blow/(b.n||1)).toFixed(1).padStart(5)} ${(b.dmg/(b.n||1)).toFixed(1).padStart(4)}`;
  };
  console.log(`  ×${m.toFixed(1)}     ${fmt(o.mage)}     ${fmt(o.rogue)}`);
}
console.log('\nfor reference, an ORDINARY fight: mage 31/48/22 (HP 12.5, blow 9.4, dmg 3.2)');
console.log('                                  rogue 51/43/ 6 (HP 12.5, blow 12.0, dmg 1.8)');
