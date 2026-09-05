// 🌊 SURGE CUT A/B (2026-09-04): does the mage lose anything when a FLOW card at home in the Surge
// no longer leaves its effect? Same seeds, n per arm; effects per turn and the ladder.
//   node dev/surge-cut.js [N]
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 240);
H.useClass('mage');
function arm(label, v) {
  H.setTunable('SURGE_MARKS', v);
  let turns = 0, fx = 0, three = 0, chan = 0;
  S.RUNSIM.setHook({ onAssign: () => {
    const st = H.getS(); if (!st.foeState) return;
    turns++; const m = S.previewMarks({ banks: st.bankArmed }).length; fx += m; if (m >= 3) three++; if (st.bankArmed) chan++;
  } });
  H.seed(20260904);
  const b = S.RUNSIM.batch(true, N);
  console.log(`${label.padEnd(14)} duel ${Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/').padEnd(12)} finale ${b.finaleWinPct}% · road complete ${b.completePct}% · effects/turn ${(fx / turns).toFixed(2)} · 3-effect turns ${(100 * three / turns).toFixed(0)}% · channelled ${(100 * chan / turns).toFixed(0)}%`);
}
arm('Surge fires', 1);
arm('Surge cut', 0);
// third arm: the Surge still fires, but its effect fades like the others (no "never fades")
S.ARCH_MARK.FLOW.lasting = false;
arm('Surge fades', 1);
