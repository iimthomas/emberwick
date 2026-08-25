// 🛡️ IF EQUIPMENT UPGRADES, WHICH NUMBER SHOULD GO UP — THE POINTS OR THE USES?
// Thomas: *"we can have more block, if the later stages do much more damage. right? a stage could
// eventually do more than 30.1 damage a run."*
//
// 🔑 THE ARITHMETIC SAYS HIS INSTINCT IS RIGHT AND THE REASON IS INVERTED. `block` absorbs a FLAT
// N off one blow, so as hits get bigger a fixed block covers a SMALLER fraction — flat reduction
// is regressive, the same finding as 🛡️ Armour costing the mage 30-32% of her blow and the rogue
// only 21-23%. So more damage does not make block more valuable; it makes block scaling
// NECESSARY TO STAND STILL. That reframes +block as maintenance rather than power, which is a
// much safer thing to put on a ladder.
//
// 🔑 BUT THERE IS A SECOND DIMENSION AND THE MEASUREMENT SAYS IT IS THE BINDING ONE. Every
// blocking piece is created with `wear: 1` — **four pieces, four blocks, one run** — against 5.3
// damaging hits, and equipment measured 4.00 blocking pieces at the start falling to 0.03 by the
// lair. You do not run out of block POINTS, you run out of PIECES.
//
// This measures both, on the same seeds: does doubling the points or doubling the uses do more?
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();

const RUNS = +(process.argv[2] || 150);
const CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS);
B.RUNSIM.setBankWeight(1.0);

// 🐛 `newArmour` IS A `const` ARROW, SO OVERRIDING IT ON THE SANDBOX IS A SILENT NO-OP - the
// first cut of this probe reported the uses variant as BIT-IDENTICAL to baseline, which is what a
// no-op looks like when you are hoping for "no effect". 🔑 An A/B that returns the SAME number to
// four decimal places has not measured a small effect, it has measured nothing. Wear is bumped
// through `freshGame`, a function declaration, after the loadout exists.
const realFresh = B.freshGame, realBlock = B.armourBlock, realSoak = B.soakWithArmour;
function measure(mode) {
  // POINTS: every piece blocks twice as much.  USES: every piece blocks twice as often.
  B.armourBlock = function (a) {
    const v = realBlock.apply(this, arguments);
    return mode === 'points' ? v * 2 : v;
  };
  B.freshGame = function () {
    const r = realFresh.apply(this, arguments);
    if (mode === 'uses') for (const a of (S().armour || [])) if (a.wear > 0) a.wear = 2;
    return r;
  };
  // 🔴 AND `wear` IS DEAD ON A `shatter` PIECE - soakWithArmour decrements wear and then
  // REMOVES the piece outright, so raising wear on the starter set (all shatter) changes nothing.
  // That is why the first two runs of this probe came back bit-identical. 🔑 **The natural meaning
  // of +N is "it blocks N+1 times before it is gone", and the engine cannot express that today** -
  // so the uses variant has to put the piece back while wear remains.
  B.soakWithArmour = function (aid) {
    const a = (S().armour || []).find(x => x.id === aid);
    const r = realSoak.apply(this, arguments);
    if (mode === 'uses' && a && a.wear > 0 && !(S().armour || []).includes(a)) S().armour.push(a);
    return r;
  };
  let wins = 0, runs = 0, blocked = 0, absorbed = 0, lairLevels = 0, lairPieces = 0;
  const res = { Complete: 0, Narrow: 0, Loss: 0 };
  B.RUNSIM.setHook({ onLair: () => {
    const s = S();
    lairLevels += [...s.hand, ...s.deck, ...s.discard].reduce((t, c) => t + c.level, 0);
    lairPieces += (s.armour || []).filter(a => a.wear > 0 && B.armourBlock(a) > 0).length;
  }});
  for (let i = 0; i < RUNS; i++) {
    H.seed(8800 + i);
    try {
      const m = B.RUNSIM.autoRun(true);
      if (m) { runs++; if (m.win) wins++; res.Complete += m.res.Complete; res.Narrow += m.res.Narrow; res.Loss += m.res.Loss; }
    } catch (e) {}
  }
  B.RUNSIM.setHook({}); B.freshGame = realFresh; B.armourBlock = realBlock; B.soakWithArmour = realSoak;
  const enc = res.Complete + res.Narrow + res.Loss || 1;
  return { C: 100 * res.Complete / enc, win: 100 * wins / (runs || 1),
           lairLv: lairLevels / (runs || 1), lairPc: lairPieces / (runs || 1) };
}

const rows = [['as shipped', null], ['×2 BLOCK POINTS', 'points'], ['×2 USES (wear 1→2)', 'uses']];
console.log(`\n\u{1F6E1}️ WHICH AXIS SHOULD AN UPGRADE MOVE? — ${CLS}, ${RUNS} runs a row, same seeds\n`);
console.log('   variant                road C%   stage win   deck levels at lair   blocking pieces at lair');
const base = measure(null);
for (const [label, mode] of rows) {
  const r = mode === null ? base : measure(mode);
  const d = mode === null ? '' : `   (${(r.C - base.C >= 0 ? '+' : '') + (r.C - base.C).toFixed(1)} C)`;
  console.log(`   ${label.padEnd(22)}${r.C.toFixed(1).padStart(6)}%   ${r.win.toFixed(0).padStart(7)}%   ${r.lairLv.toFixed(1).padStart(17)}   ${r.lairPc.toFixed(2).padStart(20)}${d}`);
}
console.log(`\n   \u{1F511} "blocking pieces at lair" is the one to watch — it is 0.03 on record, and an`);
console.log(`      upgrade that does not move it has not fixed the thing that was wrong.`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
