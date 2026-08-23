// 🔥 WHAT IS CHANNELLING WORTH? Swept at the policy a HUMAN plays (BANK_WEIGHT 1.0 — a banked point is worth a damage point, because in a duel the next beat is
// near-certain. At that setting the bot banks iff BANK_MULT > 1, so the sweep moves the PAYOFF and
// not the bot's own threshold — at a fixed lower weight the threshold sits at WEIGHT×MULT = 1 and
// contaminates the result. It channels
// whenever that is not strictly worse), reported against BANK_WEIGHT 0 (the old never-banks bot).
// 🔑 The spread between the two columns IS the mechanic's power. At BANK_MULT 1.5 it is the
// strongest thing in the game and every mage number ever recorded was taken with it switched off.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 320);
const MULTS = (process.argv[3] || '1.0,1.15,1.25,1.4,1.5').split(',').map(Number);

function run(cls, w) {
  sandbox.setBankWeight(w);
  const st = {}; let blow = 0, bn = 0;
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(9100 + i);
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS(), k = S.dragon.stage;
    const o = st[k] || (st[k] = { n:0, win:0 }); o.n++; if (m.win) o.win++;
    if (S.stats && S.stats.duelBeats) { blow += S.stats.duelDmg / S.stats.duelBeats; bn++; }
  }
  return { row: [1,2,3,4].map(k => st[k] ? Math.round(100*st[k].win/st[k].n) : 0),
           blow: blow / Math.max(1, bn) };
}
const fmt = r => r.map(x => String(x).padStart(3)).join('/');
console.log('BANK_MULT   never channels        channels well        gain      blow');
for (const mlt of MULTS) {
  setTunable('BANK_MULT', mlt);
  const off = run('mage', 0), on = run('mage', 1.0);
  const gain = on.row.map((x, i) => x - off.row[i]);
  console.log(`  ${String(mlt).padEnd(9)} ${fmt(off.row)}          ${fmt(on.row)}      ` +
              `${fmt(gain)}   ${off.blow.toFixed(1)}→${on.blow.toFixed(1)}`);
}
setTunable('BANK_MULT', 1.5); sandbox.setBankWeight(0.6);
