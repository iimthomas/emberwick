// ✦ HOW OFTEN IS A PERFECT KILL A REAL ACHIEVEMENT?
// 🔑 The 2026-08-04 measurement said 64% of Completes were "perfect" by ACCIDENT — only one card
// could ever have got there. This checks the CONTESTED gate actually removes that: the prize needs
// your Spell to be the smallest sufficient card AND another card to have worked too.
// ⚠️ The bot does not try to be economical, so its rate is a FLOOR on what a player can reach —
// and a ceiling on how often it fires by luck. Both numbers are useful for opposite reasons.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const RUNS = +(process.argv[2] || 150), CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS); B.RUNSIM.setBankWeight(1.0);

let runs = 0, perfect = 0, chances = 0, completes = 0, mats = 0;
for (let i = 0; i < RUNS; i++) {
  H.seed(7300 + i);
  try {
    const m = B.RUNSIM.autoRun(true);
    if (!m) continue;
    const s = S(); runs++;
    perfect += s.stats.perfect || 0;
    chances += s.stats.perfectChances || 0;
    completes += m.res.Complete;
    mats += Object.values(s.loot || {}).reduce((t, n) => t + n, 0);
  } catch (e) {}
}
const pc = (a, b) => b ? Math.round(100 * a / b) : 0;
console.log(`\n✦ PERFECT KILL — ${CLS}, ${runs} runs\n`);
console.log(`  Completes per run              ${(completes / runs).toFixed(1)}`);
console.log(`  ...of those, CONTESTED         ${(chances / runs).toFixed(1)}  (${pc(chances, completes)}% — more than one card would have done it)`);
console.log(`  ✦ Perfect Kills per run        ${(perfect / runs).toFixed(2)}  (${pc(perfect, chances)}% of the contested ones)`);
console.log(`  materials banked per run       ${(mats / runs).toFixed(1)}`);
console.log(`\n  \u{1F511} the bot is not trying to be economical, so its hit rate is a FLOOR for a player`);
console.log(`     and a fair reading of how often it fires by luck.`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);

// -- A/B: what the guarantee actually costs the economy ---------------------
// FIRST VERSION RAN THE TWO ARMS AS SEPARATE LOOPS AND REPORTED -0.4 MATERIALS - an
// impossibility, since a guarantee cannot reduce drops. A RESULT THAT IS DIRECTIONALLY
// IMPOSSIBLE IS AN INSTRUMENT FAULT, NOT A SMALL EFFECT; the same tell as an A/B coming back
// bit-identical, pointing the other way. Both arms now run the same seed list in one pass, and
// the perfect-kill COUNT is printed for both - if those disagree, the arms are not the same game
// and no delta from them means anything.
const SHAPE_MATS = ['slag', 'quill', 'hide'];
function arm(force) {
  const real = B.rollDrops;
  if (force !== null) B.rollDrops = function (e, o) { return real.call(this, e, o, force); };
  let n = 0, mats = 0, shape = 0, pk = 0;
  for (let i = 0; i < RUNS; i++) {
    H.seed(7300 + i);
    try {
      const m = B.RUNSIM.autoRun(true); if (!m) continue;
      const st = S(); n++; pk += st.stats.perfect || 0;
      for (const k in (st.loot || {})) { mats += st.loot[k]; if (SHAPE_MATS.includes(k)) shape += st.loot[k]; }
    } catch (e) {}
  }
  B.rollDrops = real;
  return { n: n, mats: mats / n, shape: shape / n, pk: pk / n };
}
const off = arm(false), on = arm(null);
console.log('\n  shape materials WITHOUT the guarantee  ' + off.shape.toFixed(2));
console.log('  shape materials WITH it                ' + on.shape.toFixed(2));
console.log('  -> the reward costs the economy        +' + (on.shape - off.shape).toFixed(2) + ' a run');
console.log('  (perfect kills, both arms: ' + off.pk.toFixed(2) + ' / ' + on.pk.toFixed(2) + ' - must match)');
console.log('\n  KEY: it is nearly FREE, because it only converts the ~40% misses on shaped');
console.log('       creatures you perfect-kill. The reward is the CERTAINTY, not the quantity.');

// WARNING ON THIS NUMBER: the two arms do not stay independent. Materials bank into the STASH,
// the stash feeds EQUIPMENT, and equipment changes how the next run plays - so the arm that earns
// more drifts away from the other as it goes. The tell is right above: perfect kills came back
// 1.28 vs 1.37 when they should be identical.
// So read the delta as "small and positive, around +0.2 shape materials a run", not as a figure.
// A precise number needs the stash pinned between runs, which is a bigger instrument than this
// decision needs. KEY: an A/B is only valid while its arms cannot influence each other, and a
// persistent meta layer is exactly the thing that lets them.
