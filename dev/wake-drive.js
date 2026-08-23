// 🔥 DRIVE A DUEL BY HAND AND CHANNEL EVERY BEAT — the bot never banks, so only a hand-driven
// probe can see whether a channelled Emberwake actually arrives.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
useClass('mage'); seed(777);
sandbox.freshGame();
getS().dev = { stage: 1, deck: 'strong', candle: true, charm: '' };
sandbox.devJump();

// walk the Last Mile with a channel armed, then three duel beats the same way
function playTurn(label) {
  const S = getS();
  sandbox.normalizeAssign();
  const h = S.hand.slice(0, 4);
  S.assign = { Spell: h[0] && h[0].id, Element: h[1] && h[1].id, Boost: h[2] && h[2].id, Reserve: h[3] && h[3].id };
  const wakeIn = S.wake || 0;
  S.bankArmed = true;
  const armed = sandbox.banksNow();
  const willBank = armed ? sandbox.bankValueOf(sandbox.cardById(S.assign.Boost)) : 0;
  if (S.finalPhase === 'duel') sandbox.resolveDuel(); else sandbox.resolve();
  // click through the staged reveal
  let guard = 0;
  while (S.phase === 'reveal' && guard++ < 20) sandbox.advanceBeat();
  // soak whatever landed, cheapest-first, then move on
  guard = 0;
  while (S.phase === 'soak' && guard++ < 30) {
    const c = S.hand.find(x => !S.downgraded.has(x.id));
    if (!c) break;
    sandbox.soakWith(c.id);
  }
  guard = 0;
  while (['upgrade', 'wheel', 'event', 'stack'].includes(S.phase) && guard++ < 10) {
    if (S.phase === 'wheel' || S.phase === 'upgrade') sandbox.wheelDone();
    else break;
  }
  console.log(`${label.padEnd(14)} wake in ${String(wakeIn).padStart(3)} · armed ${armed ? 'yes' : 'no '} · ` +
              `channelled +${String(willBank).padStart(2)} · wake now ${String(getS().wake || 0).padStart(3)} · phase ${getS().phase}/${getS().finalPhase}`);
}

console.log('phase at jump:', getS().phase, getS().finalPhase);
playTurn('LAST MILE');
for (let i = 1; i <= 4; i++) {
  if (getS().finalPhase !== 'duel') { console.log('  (not in the duel — ' + getS().phase + ')'); break; }
  playTurn('duel beat ' + i);
}
