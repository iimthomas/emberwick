// 🔥 DOES THE EMBERWAKE (and ● MOMENTUM) SURVIVE THE FINALE?
// Thomas: "i channeled +20 for next turn, but i only got 2 emberwake, what happened"
// The finale never calls endTurn(), which is where the wake rolls over and the streak is judged.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 60);

for (const cls of ['mage', 'rogue']) {
  let duels = 0, beats = 0, banked = 0, bankedVal = 0, collected = 0;
  let wakeFrozen = 0, wakeMoved = 0, moFrozen = 0, moMoved = 0, pendingStranded = 0;
  const realStart = sandbox.startDuelBeat;
  const realFinish = sandbox.finishDuel;
  let prevWake = null, prevMo = null, sawBankThisBeat = false, bankAmt = 0;

  sandbox.startDuelBeat = function () {
    const S = getS();
    if (S.duelBeat >= 1) {                        // not the first entry
      if (sawBankThisBeat) {
        banked++; bankedVal += bankAmt;
        if ((S.wake || 0) >= bankAmt && bankAmt > 0) collected++;
      }
      if (prevWake !== null) { if ((S.wake||0) === prevWake) wakeFrozen++; else wakeMoved++; }
      if (prevMo   !== null) { if ((S.momentum||0) === prevMo) moFrozen++; else moMoved++; }
      if ((S.wakePending || 0) > 0) pendingStranded++;
    }
    const out = realStart.apply(this, arguments);
    const S2 = getS();
    prevWake = S2.wake || 0; prevMo = S2.momentum || 0;
    sawBankThisBeat = false; bankAmt = 0;
    beats++;
    return out;
  };
  sandbox.finishDuel = function () {
    const S = getS();
    if (S.pendingR && S.pendingR.banks) { sawBankThisBeat = true; bankAmt = S.pendingR.bank || 0; }
    return realFinish.apply(this, arguments);
  };

  for (let i = 0; i < N; i++) {
    useClass(cls); seed(4400 + i);
    prevWake = null; prevMo = null;
    try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
    if (getS().duelBeat > 0) duels++;
  }
  sandbox.startDuelBeat = realStart;
  sandbox.finishDuel = realFinish;

  console.log(`\n${cls.toUpperCase()} — ${duels} duels reached, ${beats} beats`);
  console.log(`  channelled in the duel: ${banked} times, +${bankedVal} total  →  ARRIVED next beat: ${collected}`);
  console.log(`  🔥 wake unchanged between beats: ${wakeFrozen} · changed: ${wakeMoved}`);
  console.log(`  ● momentum unchanged between beats: ${moFrozen} · changed: ${moMoved}`);
  console.log(`  wakePending still stranded at a beat start: ${pendingStranded}`);
}
