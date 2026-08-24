// 🗡️ Q3 — WHERE DOES THE ROGUE'S 16-POINT VARIANCE LIVE?
// Thomas: *"Break her swing down by stage, and inside a stage, by cause: how often does Momentum
// break, at which floors, and what breaks it. If it concentrates on Skyrender and Fathomdread, her
// power is gated by the initiative race rather than by player decisions, and that's a class-design
// finding, not a tuning one."*
//
// 🔑 THE HYPOTHESIS: ● Momentum breaks on any turn that costs cards, and a turn costs cards when
// you lose the Initiative race or fail to Complete. If breaks concentrate on the two dragons whose
// roads press on SPEED (🌀 Skyrender, and Fathomdread carrying Evasion as half its shape), her
// ceiling is set by a race she often cannot win — not by what she decides.
//
// 🔑 THE INSTRUMENT: wrap `tickMomentum(damage, r)` itself. That is the exact line where the streak
// lives or dies, and `r` still carries WHY — `initLost` and `outcome`. ⚠️ A RUNSIM hook cannot do
// this: `onAssign` fires between chooseBest() and resolve(), so the cause has not happened yet.
// **Instrument the moment the thing occurs, not the moment before it.**
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();

const RUNS = +(process.argv[2] || 200);
const BASES = [1000, 5000, 9100];
const CAP = H.getTunable('MOMENTUM_CAP');

H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass('rogue');
B.RUNSIM.setBankWeight(1.0);

// ── 1 · the spread, per stage, across independent seed bases ───────────────
const perBase = [];
for (const base of BASES) {
  const st = {};
  for (let i = 0; i < RUNS; i++) {
    H.seed(base + i);
    let m; try { m = B.RUNSIM.autoRun(true); } catch (e) { continue; }
    const s = S(), k = s.dragon.stage;
    const o = st[k] || (st[k] = { n: 0, w: 0 });
    o.n++; if (m.win) o.w++;
  }
  perBase.push([1, 2, 3, 4].map(k => st[k] ? Math.round(100 * st[k].w / st[k].n) : 0));
}

// ── 2 · every streak tick, with its cause ──────────────────────────────────
const A = {};
for (const st of [1, 2, 3, 4]) A[st] = {
  road: { turns: 0, breaks: 0, byInit: 0, byOutcome: 0, byBoth: 0, pipSum: 0, atCap: 0 },
  duel: { turns: 0, breaks: 0, byInit: 0, byOutcome: 0, byBoth: 0, pipSum: 0, atCap: 0 },
};
const realTick = B.tickMomentum;
B.tickMomentum = function (damage, r) {
  const s = S();
  if (s && r && r.rogue) {
    const a = A[s.dragon.stage][s.finalMode ? 'duel' : 'road'];
    a.turns++;
    a.pipSum += (s.momentum || 0);
    if ((s.momentum || 0) >= CAP) a.atCap++;
    if (damage >= H.getTunable('MOMENTUM_BREAK')) {
      a.breaks++;
      const lostRace = !!r.initLost;
      const missed = r.outcome && r.outcome !== 'Complete';
      if (lostRace && missed) a.byBoth++;
      else if (lostRace) a.byInit++;
      else if (missed) a.byOutcome++;
    }
  }
  return realTick.apply(this, arguments);
};
for (let i = 0; i < RUNS; i++) {
  H.seed(1000 + i);
  try { B.RUNSIM.autoRun(true); } catch (e) {}
}
B.tickMomentum = realTick;

// ── report ─────────────────────────────────────────────────────────────────
const p = (a, b) => (b ? Math.round(100 * a / b) : 0);
console.log(`Q3 · THE ROGUE'S VARIANCE — ${RUNS} runs/base, ⭐6/🎭3, damage ×${H.getTunable('FOE_ATK_MULT')}, cap ${CAP}\n`);
console.log('  per-stage win%, three independent seed bases:');
perBase.forEach((r, i) => console.log(`    seeds ${String(BASES[i]).padStart(4)}   ${r.map(x => String(x).padStart(3)).join(' /')}`));
const spread = [0, 1, 2, 3].map(i => Math.max(...perBase.map(r => r[i])) - Math.min(...perBase.map(r => r[i])));
console.log(`    SPREAD        ${spread.map(x => String(x).padStart(3)).join(' /')}   ← points of swing on luck alone`);

for (const where of ['road', 'duel']) {
  console.log(`\n  ● MOMENTUM ON THE ${where.toUpperCase()}:`);
  console.log('    stage   avg pips   at cap   breaks   ── cause of break ──');
  console.log('                                          lost race   missed   both');
  for (const st of [1, 2, 3, 4]) {
    const a = A[st][where]; if (!a.turns) continue;
    console.log(`      ${st}      ${(a.pipSum / a.turns).toFixed(2)}      ${String(p(a.atCap, a.turns)).padStart(2)}%     ${String(p(a.breaks, a.turns)).padStart(2)}%` +
      `        ${String(p(a.byInit, a.breaks)).padStart(3)}%     ${String(p(a.byOutcome, a.breaks)).padStart(3)}%   ${String(p(a.byBoth, a.breaks)).padStart(3)}%`);
  }
}
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
