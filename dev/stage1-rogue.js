// 🗡️ "MY FIRST FULL RUN FOR STAGE 1 AS ROGUE — IT WAS PRETTY EASY, I NEVER REALLY GOT HIT."
// Diagnose before touching anything: WHY was he never hit, and is it stage 1 or the class?
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');

const S0 = sandbox;
const N = +(process.argv[2] || 150);

// --- 1. the grade's craft term, for a class with no elements -------------------
useClass('rogue'); S0.freshGame(1); S0.draw(4);
const els = getS().hand.map(c => S0.elOf(c));
const counts = els.some((e, i) => els.indexOf(e) !== i);
console.log('=== the grade ===');
console.log('  rogue card elements:', JSON.stringify(els));
console.log('  attuneAvail would increment this turn:', counts,
            counts ? ' ⚠️ EVERY TURN — phantom availability' : '');

// --- 2. stage-1 difficulty, both classes --------------------------------------
function stage1(cls) {
  const res = { Complete: 0, Narrow: 0, Loss: 0 };
  let runs = 0, wins = 0, duels = 0, lostCards = 0, lairLv = 0, charms = 0,
      untouched = 0, encounters = 0, beats = 0, par = 0;
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(4200 + i);
    const S = () => getS();
    let lair = null, touchedTurns = 0, turns = 0;
    S0.RUNSIM.setHook({
      onLair(m) { const s = S(); lair = [...s.hand, ...s.deck, ...s.discard].reduce((a, c) => a + c.level, 0); },
      onAssign() { turns++; },
    });
    // force stage 1 only: autoRun round-robins the ladder, so run it and skip other rungs
    let m; try { m = S0.RUNSIM.autoRun(true); } catch (e) { continue; }
    if (m.dragon !== 'Cindermaw') continue;
    runs++;
    res.Complete += m.res.Complete; res.Narrow += m.res.Narrow; res.Loss += m.res.Loss;
    encounters += m.res.Complete + m.res.Narrow + m.res.Loss;
    const s = S();
    lostCards += s.trashed.length;
    charms += (s.charms || []).length;
    if (lair) { lairLv += lair; }
    par = s.dragon.par;
    if (m.win !== null) { duels++; if (m.win) wins++; beats += m.duelBeats; }
  }
  const tot = res.Complete + res.Narrow + res.Loss || 1;
  return {
    runs,
    C: Math.round(100 * res.Complete / tot), N: Math.round(100 * res.Narrow / tot),
    L: Math.round(100 * res.Loss / tot),
    duel: duels ? Math.round(100 * wins / duels) : 0,
    beats: duels ? +(beats / duels).toFixed(1) : 0,
    lostCards: runs ? +(lostCards / runs).toFixed(2) : 0,
    charms: runs ? +(charms / runs).toFixed(1) : 0,
    lairLevels: runs ? Math.round(lairLv / runs) : 0,
    par,
    encPerRun: runs ? +(encounters / runs).toFixed(1) : 0,
  };
}

console.log('\n=== stage 1 (Cindermaw, par 36) ===');
for (const cls of ['rogue', 'mage']) {
  const b = stage1(cls);
  console.log(`  ${cls.padEnd(6)} n=${b.runs}  road ${b.C}C/${b.N}N/${b.L}L over ${b.encPerRun} encounters`);
  console.log(`         duel ${b.duel}% in ${b.beats} beats · cards LOST ${b.lostCards}/run · charms ${b.charms}`);
  console.log(`         deck at the lair ${b.lairLevels} vs par ${b.par}  (${b.lairLevels - b.par >= 0 ? '+' : ''}${b.lairLevels - b.par})`);
}
