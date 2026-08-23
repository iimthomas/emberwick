// 🛡️ DID ARMOUR ACTUALLY CHANGE THE SOAK, OR JUST PAD IT?
// Step 1 exists to answer one question: does a piece of armour take blows a CARD used to take,
// and by how much does that move deck-as-health? ⚠️ Reported next to the no-armour build.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
if (process.argv[3]) setTunable('ARMOUR_SLOTS_OPEN', Number(process.argv[3]));
const N = +(process.argv[2] || 300);

for (const cls of ['mage', 'rogue']) {
  let runs = 0, trashed = 0, deckAtLair = 0, lairN = 0, win = 0, duels = 0;
  let armourBlows = 0, cardBlows = 0, spentPieces = 0, piecesN = 0, ko = 0, hits = 0;
  const realArm = sandbox.soakWithArmour, realCard = sandbox.soakWith, realStart = sandbox.startSoak;
  sandbox.soakWithArmour = function () { armourBlows++; return realArm.apply(this, arguments); };
  sandbox.soakWith = function () { cardBlows++; return realCard.apply(this, arguments); };
  sandbox.startSoak = function () { hits++; return realStart.apply(this, arguments); };
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(3300 + i);
    sandbox.RUNSIM.setHook({ onLair() { const S = getS(); deckAtLair += S.hand.length + S.deck.length + S.discard.length; lairN++; } });
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS(); runs++;
    trashed += S.trashed.length;
    if (m.win !== null) { duels++; if (m.win) win++; }
    for (const a of (S.armour || [])) { piecesN++; if (a.wear <= 0) spentPieces++; }
  }
  sandbox.soakWithArmour = realArm; sandbox.soakWith = realCard; sandbox.startSoak = realStart;
  const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
  console.log(`\n${cls.toUpperCase()} — ${runs} runs, ${hits} damaging turns`);
  console.log(`  blows taken by ARMOUR ${armourBlows} · by CARDS ${cardBlows}  →  armour takes ${pct(armourBlows, armourBlows + cardBlows)}% of them`);
  console.log(`  cards destroyed per run: ${(trashed / runs).toFixed(1)}`);
  console.log(`  cards still owned at the lair: ${(deckAtLair / Math.max(1, lairN)).toFixed(1)} of 16`);
  console.log(`  pieces battered through by run's end: ${pct(spentPieces, piecesN)}%`);
  console.log(`  duel win: ${pct(win, duels)}%`);
}
