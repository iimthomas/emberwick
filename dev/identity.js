// 🧪 THE IDENTITY TEST — for a refactor that is supposed to change NO RULE.
//
// 🔑 WHY THIS AND NOT RUNSIM PERCENTAGES: a pure refactor has no number to move, so "56C before,
// 56C after" proves nothing at n=200 — the noise band is wider than most real changes. What CAN
// be proved exactly is: *given the same seed, did the same run happen, turn by turn?* One
// differing fingerprint means the refactor changed a rule, and that is a bug, not a balance find.
//
// ⚠️ render() and saveGame() are deliberately NOT stubbed. RUNSIM.run() stubs them for speed, but
// then the new render path never executes and the test would pass over the code it exists to test.
//
// 📏 It hooks RUNSIM rather than forking autoRun — same rule the measurement instrument follows.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const crypto = require('crypto');

const RUNS = +(process.argv[2] || 60);
const DUMP = process.argv.includes('--dump');
const lines = [];

// per-TURN state, so a divergence shows up on the turn it happens rather than at the end of a run
let turnTrace = [];
sandbox.RUNSIM.setHook({
  onAssign(m) {
    const S = getS();
    turnTrace.push([
      m.turns, S.phase, S.region, S.coins,
      S.hand.map(c => c.def.name + c.level).join(''),
      Object.values(S.assign).join(','),
      S.momentum, S.wake, S.wakeTarget || '-', S.bankArmed ? 1 : 0,
      S.paceBless, S.emberShield ? 1 : 0, S.curseNextFight ? 1 : 0,
      (S.potions || []).map(p => p.id).join('+'),
    ].join('|'));
  },
});

for (const cls of ['mage', 'rogue']) {
  for (let i = 0; i < RUNS; i++) {
    useClass(cls);
    seed(1000 + i);
    turnTrace = [];
    let m;
    try { m = sandbox.RUNSIM.autoRun(true); }
    catch (e) { lines.push(`${cls}#${i} THREW ${e && e.message}`); continue; }
    const S = getS();
    lines.push([
      cls, i, m.dragon, m.turns, m.events,
      m.res.Complete, m.res.Narrow, m.res.Loss,
      m.win, m.duelBeats, m.dragonHPleft, m.firstL4,
      (m.regionAvg || []).join('/'),
      S.coins, S.deck.length, S.discard.length, S.trashed.length,
      (S.charms || []).join(','),
      // the per-turn trace, folded in — this is what makes the test sharp
      crypto.createHash('sha1').update(turnTrace.join('\n')).digest('hex').slice(0, 12),
      turnTrace.length,
    ].join('|'));
  }
}

const body = lines.join('\n');
if (DUMP) console.log(body);
const threw = lines.filter(l => l.includes('THREW'));
if (threw.length) console.log(`⚠️  ${threw.length} run(s) threw — first: ${threw[0]}`);
console.log(`runs=${lines.length}  fingerprint=${crypto.createHash('sha256').update(body).digest('hex').slice(0, 16)}`);
