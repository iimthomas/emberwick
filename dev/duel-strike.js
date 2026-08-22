// 🛡️ IS FLAT ARMOUR REGRESSIVE? A flat subtraction costs a SMALL hitter proportionally more.
// If the rogue's duel blow is much bigger than the mage's, Armour 4 taxes her less — and
// Fathomdread's HP was cut to 50 (lowest of four) to pay for a DUAL shape she only half feels.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 480);
function survey(cls) {
  const out = {};
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(8800 + i);
    sandbox.RUNSIM.setHook({
      onDuelAssign() {
        const S = getS(); const r = sandbox.computeAction(null); if (!r) return;
        const k = S.dragon.stage;
        const o = out[k] || (out[k] = { n: 0, raw: 0, name: S.dragon.name, armour: S.dragon.shapes.includes('armour') ? S.dragon.shapeV : 0 });
        o.n++; o.raw += r.value;
      },
    });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
  }
  return out;
}
const m = survey('mage'), r = survey('rogue');
console.log('stage  dragon        armour   mage blow   rogue blow   armour costs mage / rogue');
for (const k of [1,2,3,4]) {
  const a = m[k], b = r[k]; if (!a || !b) continue;
  const av = o => o.raw / (o.n || 1);
  const tax = o => o.armour ? Math.round(100 * o.armour / av(o)) + '%' : '—';
  console.log(`  ${k}    ${a.name.padEnd(12)}  ${String(a.armour).padStart(3)}      ${av(a).toFixed(1).padStart(5)}       ${av(b).toFixed(1).padStart(5)}        ${tax(a).padStart(4)} / ${tax(b)}`);
}
