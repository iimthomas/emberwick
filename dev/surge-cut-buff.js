// 🌊 SURGE CUT + WHERE THE VALUE GOES BACK (2026-09-04). Surge fires nothing; the arms move the
// lost value into a legible home. Same seeds, n per arm.   node dev/surge-cut-buff.js [N]
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 240);
H.useClass('mage');
function arm(label, setup) {
  S.ARCH_MARK.FORCE.mult = 2; S.ARCH_MARK.FORCE.lasting = false; S.ARCH_MARK.SPARK.lasting = false;
  H.setTunable('ATTUNE_BONUS', 2); H.setTunable('SURGE_MARKS', 0);
  setup();
  let turns = 0, fx = 0;
  S.RUNSIM.setHook({ onAssign: () => { const st = H.getS(); if (!st.foeState) return; turns++; fx += S.previewMarks({ banks: st.bankArmed }).length; } });
  H.seed(20260904);
  const b = S.RUNSIM.batch(true, N);
  console.log(`${label.padEnd(34)} duel ${Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/').padEnd(12)} finale ${String(b.finaleWinPct).padStart(2)}% · effects/turn ${(fx / turns).toFixed(2)}`);
}
arm('shipped (Surge fires, lasting)', () => H.setTunable('SURGE_MARKS', 1));
arm('cut, nothing back', () => {});
arm('cut · Spell effect lasts (×2 kept)', () => { S.ARCH_MARK.FORCE.lasting = true; });
arm('cut · Spell lasts instead of ×2', () => { S.ARCH_MARK.FORCE.lasting = true; S.ARCH_MARK.FORCE.mult = 1; });
arm('cut · Spell ×3', () => { S.ARCH_MARK.FORCE.mult = 3; });
arm('cut · Catalyst effect lasts', () => { S.ARCH_MARK.SPARK.lasting = true; });
arm('cut · ATTUNE_BONUS 3', () => H.setTunable('ATTUNE_BONUS', 3));
arm('cut · ATTUNE_BONUS 4', () => H.setTunable('ATTUNE_BONUS', 4));
if (process.argv[3] === 'stack') {
  arm('cut · Spell lasts ×2 · ATTUNE 3', () => { S.ARCH_MARK.FORCE.lasting = true; H.setTunable('ATTUNE_BONUS', 3); });
  arm('cut · Spell lasts ×3', () => { S.ARCH_MARK.FORCE.lasting = true; S.ARCH_MARK.FORCE.mult = 3; });
  arm('cut · Spell lasts ×2 · Catalyst lasts', () => { S.ARCH_MARK.FORCE.lasting = true; S.ARCH_MARK.SPARK.lasting = true; });
}
