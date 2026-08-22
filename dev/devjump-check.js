// 🔧 does the dev lair-jump still work after today's three changes (field / Last Mile / grade)?
// It is the tool for the actual next step — Thomas has played stage 1 and needs 2, 3, 4 without
// spending 20 minutes of road each time.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
for (const cls of ['mage', 'rogue']) {
  for (const stage of [1, 2, 3, 4]) {
    useClass(cls); seed(500 + stage);
    const S = getS;
    try {
      sandbox.freshGame(stage);
      S().dev = { stage, deck: 'mediocre', candle: true, charm: null };
      sandbox.devJump();
      const s = S();
      // walk the Last Mile the way a player would, then check the duel actually starts
      let g = 0, reached = false;
      while (g++ < 40) {
        if (s.finalPhase === 'duel') { reached = true; break; }
        if (s.phase === 'assign') { sandbox.RUNSIM.chooseBest(); sandbox.resolve(); }
        else if (s.phase === 'reveal') sandbox.advanceBeat();
        else if (s.phase === 'soak') { const e = sandbox.soakEligible(); if (e.length) sandbox.soakWith(e[0].id); else break; }
        else if (s.phase === 'upgrade') sandbox.skipUpgrade();
        else break;
      }
      console.log(`${cls.padEnd(6)} stage ${stage}  ${s.dragon.name.padEnd(12)} ` +
        `deck ${s.deck.length}c/${sandbox.deckLevels()}lv vs par ${s.dragon.par} · ` +
        `approach=${s.lastMileApproach} · duel reached: ${reached} · ` +
        `dragon ${s.dragonState.hp}/${s.dragonState.maxHp} · ${sandbox.shapeStateText()}`);
    } catch (e) { console.log(`${cls} stage ${stage}  THREW ${e.message}`); }
  }
}
