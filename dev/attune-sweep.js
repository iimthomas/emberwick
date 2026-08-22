// ✦ BUFFING THE MAGE — sweep ATTUNE_BONUS, the one constant that is hers.
//
// Thomas, playing the dev jumps: *"doing the dragons now with mage and it just seems miserable
// compared to rogue. even on the first one."*
//
// 🔑 THE ASYMMETRY IS IN THE FORMULA, NOT IN THE CARDS:
//     mage   attuned = value + level + ATTUNE_BONUS        → Lv4: value + 5
//     rogue  paid    = value + paid + PAID_STEP×(level-1)  → Lv4: value + 4 + 6 = value + 10
// Her payoff for full investment is exactly HALF the rogue's.
//
// ⚠️ THE RECORDED "MEASURED TWICE, DO NOT RETRY" ON THIS CONSTANT IS A DIFFERENT QUESTION.
// It says raising the bonus does not turn the attune/Initiative fork into a SACRIFICE (lv+0→5 moved
// "paid a lost Initiative to attune" only 3%→8%). That is a finding about creating a DILEMMA, not
// about POWER — and Balance_Log's own pre-planned lever list for the mage opens with "bonus → lv+2".
// This is the planned lever, not a retry. ⚠️ Say so in the write-up so nobody re-reads it as one.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 320);   // ⚠️ round-robin divides by four — read n PER STAGE

function measure(cls) {
  const st = {};
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(6100 + i);
    let blow = 0, beats = 0;
    sandbox.RUNSIM.setHook({ onDuelAssign() {
      const r = sandbox.computeAction(null); if (r) { blow += r.value; beats++; }
    } });
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS(), k = S.dragon.stage;
    const o = st[k] || (st[k] = { n: 0, duels: 0, wins: 0, C: 0, tot: 0, blow: 0, beats: 0 });
    o.n++; o.C += m.res.Complete; o.tot += m.res.Complete + m.res.Narrow + m.res.Loss;
    o.blow += blow; o.beats += beats;
    if (m.win !== null) { o.duels++; if (m.win) o.wins++; }
  }
  return st;
}
const win = (st, k) => st[k] && st[k].duels ? Math.round(100 * st[k].wins / st[k].duels) : 0;
const sum = (st, k) => [1,2,3,4].reduce((t, s) => t + (st[s] ? st[s][k] : 0), 0);

// the rogue never sees ATTUNE_BONUS (no elements), so she is the fixed control — measure once.
setTunable('ATTUNE_BONUS', 1);
const rogue = measure('rogue');
console.log(`rogue control (unmoved by this constant): duel ${[1,2,3,4].map(k => win(rogue,k)).join('/')}\n`);

console.log('ATTUNE  mage duel 1/2/3/4      gap vs rogue         road C%   duel blow');
for (const b of [1, 2, 3, 4, 5]) {
  setTunable('ATTUNE_BONUS', b);
  const m = measure('mage');
  const duel = [1,2,3,4].map(k => String(win(m,k)).padStart(3)).join('/');
  const gap  = [1,2,3,4].map(k => String(win(rogue,k) - win(m,k)).padStart(3)).join('/');
  console.log(`  +${b}    ${duel}     ${gap}      ${String(Math.round(100*sum(m,'C')/(sum(m,'tot')||1))).padStart(3)}%     ` +
              `${(sum(m,'blow')/(sum(m,'beats')||1)).toFixed(1)}`);
}
setTunable('ATTUNE_BONUS', 1);
console.log('\nrogue road C% for reference: ' + Math.round(100*sum(rogue,'C')/(sum(rogue,'tot')||1)) +
            '%   ·   rogue duel blow ' + (sum(rogue,'blow')/(sum(rogue,'beats')||1)).toFixed(1));
