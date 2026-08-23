// 🛡️ THE PLATES WERE COMPRESSED — is FOE_ATK_MULT still the right size?
// ⚠️ It went to 1.5 because "one card covered 72% of hits". That was true because ONE ARCHETYPE
// had plates 3-5× everyone else's. Fix the plates and the multiplier may be treating a symptom
// that no longer exists. A workaround outliving its cause is how two dials end up fighting.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 200);
const MULTS = (process.argv[3] || '1.5,1.25,1.0,0.85').split(',').map(Number);

console.log('ATK   class   avg hit  best plate  one card covers   cards lost/run   deck at lair   duel win');
for (const m of MULTS) {
  setTunable('FOE_ATK_MULT', m);
  for (const cls of ['mage', 'rogue']) {
    let hits = 0, dmg = 0, best = 0, covered = 0, trashed = 0, runs = 0, lair = 0, lairN = 0, win = 0, duels = 0;
    const realStart = sandbox.startSoak;
    sandbox.startSoak = function () {
      const S = getS();
      if (S.damage > 0) {
        hits++; dmg += S.damage;
        const b = Math.max(0, ...S.hand.map(c => sandbox.soakValue(c)));
        best += b; if (b >= S.damage) covered++;
      }
      return realStart.apply(this, arguments);
    };
    for (let i = 0; i < N; i++) {
      useClass(cls); seed(4100 + i);
      sandbox.RUNSIM.setHook({ onLair() { const S = getS(); lair += S.hand.length + S.deck.length + S.discard.length; lairN++; } });
      let r; try { r = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
      const S = getS(); runs++; trashed += S.trashed.length;
      if (r.win !== null) { duels++; if (r.win) win++; }
    }
    sandbox.startSoak = realStart;
    console.log(`${String(m).padEnd(5)} ${cls.padEnd(7)} ${(dmg/hits).toFixed(1).padStart(6)}  ${(best/hits).toFixed(1).padStart(9)}  ` +
      `${String(Math.round(100*covered/hits)+'%').padStart(13)}  ${(trashed/runs).toFixed(1).padStart(13)}  ` +
      `${(lair/Math.max(1,lairN)).toFixed(1).padStart(11)}  ${String(Math.round(100*win/Math.max(1,duels))+'%').padStart(8)}`);
  }
}
setTunable('FOE_ATK_MULT', 1.5);
