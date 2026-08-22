// 🃏 "one card soaks the whole thing" — at what damage level does that stop being true?
// 🔑 The crux: the BEST plate in a 4-card hand (5.8) is bigger than the average hit (4.8).
// One card covers everything by construction. Invert that and soaking becomes a multi-card
// decision instead of a lookup.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 120);
console.log('ATK   class    avg hit   best plate   one card covers it   cards destroyed/run   net deck');
for (const m of [1.0, 1.3, 1.5, 1.8]) {
  setTunable('FOE_ATK_MULT', m);
  for (const cls of ['mage', 'rogue']) {
    let hits = 0, one = 0, dmg = 0, best = 0, runs = 0, trash = 0, start = 0, lair = 0;
    for (let i = 0; i < N; i++) {
      useClass(cls); seed(5100 + i);
      let s0 = null, lairLv = null;
      const lv = () => { const S = getS(); return [...S.hand,...S.deck,...S.discard].reduce((a,c)=>a+c.level,0); };
      sandbox.RUNSIM.setHook({
        onAssign() {
          const S = getS(); if (S.finalMode) return; if (s0===null) s0 = lv();
          const r = sandbox.computeAction(null); if (!r) return;
          const d = (r.early||0)+(r.combatDmg||0); if (d<=0) return;
          hits++; dmg += d;
          const b = Math.max(...S.hand.map(c => sandbox.soakValue(c)));
          best += b; if (b >= d) one++;
        },
        onLair() { lairLv = lv(); } });
      try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
      const S = getS(); runs++; trash += S.trashed.length; start += s0||32; lair += lairLv||lv();
    }
    console.log(`×${m.toFixed(1)} ${cls.padEnd(7)}  ${(dmg/(hits||1)).toFixed(1).padStart(4)}      ${(best/(hits||1)).toFixed(1).padStart(4)}          ` +
      `${String(Math.round(100*one/(hits||1))).padStart(3)}%              ${(trash/(runs||1)).toFixed(1)}             ${((lair-start)/(runs||1)).toFixed(1)}`);
  }
}
setTunable('FOE_ATK_MULT', 1.0);
