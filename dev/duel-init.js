// 🌀 WHY IS STAGE 4 THE ROGUE'S THIRD-EASIEST STAGE?
// Hypothesis: Evasion halves your blow unless you WIN Initiative, and the rogue nearly always
// does — so a shape that is half of Fathomdread's exam barely engages her, while its HP was cut
// to 50 (the lowest of the four) to compensate for a DUAL shape.
// ⚠️ Check it. The Initiative hypothesis was already wrong once today on the road.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 480);

function survey(cls) {
  const out = {};
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(8800 + i);
    sandbox.RUNSIM.setHook({
      onDuelAssign() {
        const S = getS();
        const r = sandbox.computeAction(null);
        if (!r) return;
        const k = S.dragon.stage;
        const o = out[k] || (out[k] = { beats: 0, lost: 0, evaded: 0, name: S.dragon.name,
                                        shapes: S.dragon.shapes.join('+'), init: S.dragon.init });
        o.beats++;
        if (r.initLost) o.lost++;
        // the blow is halved only when Evasion is live AND you lost the race
        if (r.initLost && S.dragon.shapes.includes('evasion')) o.evaded++;
      },
    });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
  }
  return out;
}

const m = survey('mage'), r = survey('rogue');
console.log('duel beats — how often does the dragon win Initiative (i.e. Evasion bites)?\n');
console.log('stage  dragon        shape            mage lost   rogue lost');
for (const k of [1, 2, 3, 4]) {
  const a = m[k], b = r[k];
  if (!a || !b) continue;
  const p = o => Math.round(100 * o.lost / (o.beats || 1));
  const ev = o => o.name && o.shapes.includes('evasion') ? `${Math.round(100 * o.evaded / (o.beats || 1))}% halved` : '—';
  console.log(`  ${k}    ${a.name.padEnd(12)}  ${a.shapes.padEnd(15)}  ${String(p(a)).padStart(3)}%        ${String(p(b)).padStart(3)}%    ` +
              `  mage ${ev(a)} · rogue ${ev(b)}`);
}
