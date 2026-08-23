// ✦ HELD EMBER — does it change game LENGTH, and (the recorded test) does it make the HAND REPEAT?
//
// 🔑 [[Charm_Pools]]: 🃏 Reversed's first version sent every returning card to the TOP and measured
// **4.0 of 4 cards repeating every turn** — "a charm that makes the hand REPEAT fails the pillar it
// was meant to serve", and the charm bar gained a third question: *does it still hand you a
// different HAND tomorrow?* Held Ember keeps a card IN HAND, which is the same shape of risk.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 250);
function run(force) {
  let runs=0, enc=0, deck=0, deckN=0, repeat=0, repN=0, dry=0, attuned=0, turns=0;
  for (let i=0;i<N;i++) {
    useClass('mage'); seed(13000+i);
    let prevHand = null;
    sandbox.RUNSIM.setHook({ onAssign(){
      const S = getS(); if (S.finalMode) return;
      // force the charm on or strip it, so the only difference is the charm
      const has = S.charms.includes('heldember');
      if (force && !has) S.charms.push('heldember');
      if (!force && has) S.charms = S.charms.filter(c => c !== 'heldember');
      enc++; turns++;
      deck += S.deck.length; deckN++;
      if (S.deck.length === 0) dry++;
      const now = S.hand.map(c => c.id).sort().join(',');
      if (prevHand !== null) {
        const a = new Set(prevHand.split(',')), b = S.hand.map(c=>c.id);
        repeat += b.filter(x => a.has(String(x))).length; repN++;
      }
      prevHand = now;
      const r = sandbox.computeAction(null); if (r && r.enhUsed) attuned++;
    } });
    sandbox.RUNSIM.autoRun(true);
    runs++;
  }
  return { enc:(enc/runs).toFixed(1), deck:(deck/deckN).toFixed(1),
           repeat:(repeat/(repN||1)).toFixed(2), dry:Math.round(100*dry/deckN),
           attuned:Math.round(100*attuned/turns) };
}
console.log('                  encounters/run   avg deck   cards REPEATING turn-to-turn   deck empty   attuned%');
for (const [f,label] of [[false,'without Held Ember'],[true,'WITH Held Ember   ']]) {
  const r = run(f);
  console.log(`${label}   ${r.enc.padStart(6)}        ${r.deck.padStart(5)}          ${r.repeat} of 4                ${String(r.dry).padStart(3)}%       ${String(r.attuned).padStart(3)}%`);
}
