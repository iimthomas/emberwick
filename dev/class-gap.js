// ⚖️ IS THE CLASS GAP FLAT, OR DOES IT NARROW?
//
// Thomas's call (2026-08-21): the rogue being easy on STAGE 1 is fine — you clear stage 1 as the
// mage, that unlocks her, and replaying old content with a new class *should* feel powerful.
// 🔑 That reasoning is about stage 1. It does NOT automatically hold at stage 4, which is the exam
// and currently the last rung — a victory lap over the on-ramp is a reward, a victory lap over
// the exam is the ladder ending early. So: measure the gap per stage, not in aggregate.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 480);   // ⚠️ the round-robin divides by four — read n PER STAGE

function perStage(cls) {
  const out = {};
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(6100 + i);
    let lair = null;
    sandbox.RUNSIM.setHook({
      onLair() { const s = getS(); lair = [...s.hand, ...s.deck, ...s.discard].reduce((a, c) => a + c.level, 0); },
    });
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const s = getS();
    const k = s.dragon.stage;
    const o = out[k] || (out[k] = { n: 0, C: 0, tot: 0, duels: 0, wins: 0, beats: 0,
                                    lair: 0, lairN: 0, par: s.dragon.par, name: s.dragon.name });
    o.n++;
    o.C += m.res.Complete; o.tot += m.res.Complete + m.res.Narrow + m.res.Loss;
    if (m.win !== null) { o.duels++; if (m.win) o.wins++; o.beats += m.duelBeats; }
    if (lair) { o.lair += lair; o.lairN++; }
  }
  return out;
}

const a = perStage('mage'), b = perStage('rogue');
console.log('stage  dragon        mage duel   rogue duel   GAP    mage C%  rogue C%   lair vs par');
for (const k of [1, 2, 3, 4]) {
  const m = a[k], r = b[k];
  if (!m || !r) { console.log(`  ${k}  (no samples)`); continue; }
  const dw = o => o.duels ? Math.round(100 * o.wins / o.duels) : 0;
  const cp = o => Math.round(100 * o.C / (o.tot || 1));
  const lv = o => (o.lairN ? Math.round(o.lair / o.lairN) : 0);
  console.log(
    `  ${k}    ${m.name.padEnd(12)}  ${String(dw(m)).padStart(3)}% (n${m.duels})  ` +
    `${String(dw(r)).padStart(3)}% (n${r.duels})   ${String(dw(r) - dw(m)).padStart(4)}   ` +
    `${String(cp(m)).padStart(3)}%    ${String(cp(r)).padStart(3)}%     ` +
    `par ${m.par}: mage ${lv(m)} / rogue ${lv(r)}`);
}
