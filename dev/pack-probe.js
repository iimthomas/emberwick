// 🎯 PACK LETHALITY (2026-09-02): ROAD deaths per run, attributed AT the moment of defeat to the
// fight being fought (pack / plain / duel). `node dev/pack-probe.js N lead:atk:minion,...`
const H = require('./headless.js'); const S = H.sandbox;
const N = +(process.argv[2] || 60);
for (const spec of (process.argv[3] || '0.4:0.6:1').split(',')) {
  const [hp, atk, mhp] = spec.split(':').map(Number);
  H.setTunable('PACK_LEAD_HP', hp); H.setTunable('PACK_LEAD_ATK', atk); H.setTunable('PACK_MINION_HP', mhp);
  const d = { pack: 0, plain: 0, duel: 0 }; let packFights = 0, packTurns = 0, plainFights = 0, plainTurns = 0, aimed = 0, cleaved = 0;
  const rBe = S.beginEncounter, rD = S.defeat, rL = S.foeLandBlow;
  S.beginEncounter = function (e) { const o = rBe.apply(this, arguments); const st = H.getS().foeState; if (st) { if (st.minions && st.minions.length) packFights++; else plainFights++; } return o; };
  S.foeLandBlow = function (r) { const g = H.getS(), st = g.foeState; if (st) { if (st.minions && st.minions.length) { packTurns++; if (g.foeTarget >= 0) aimed++; const rr = r || g.pendingR; if (rr && S.cleavePlan(rr).length > 1) cleaved++; } else plainTurns++; } return rL.apply(this, arguments); };
  S.defeat = function () { const st = H.getS(); const k = st.finalMode ? 'duel' : (st.foeState && st.foeState.minions && st.foeState.minions.length) ? 'pack' : 'plain'; d[k]++; return rD.apply(this, arguments); };
  H.useClass('mage'); H.seed(20260902); S.RUNSIM.batch(true, N);
  S.beginEncounter = rBe; S.defeat = rD; S.foeLandBlow = rL;
  console.log(`lead ×${hp}/${atk} minion ×${mhp}   road deaths/run: pack ${(100 * d.pack / N).toFixed(0)}% · plain ${(100 * d.plain / N).toFixed(0)}%   (duel ${(100 * d.duel / N).toFixed(0)}%)   pack fights/run ${(packFights / N).toFixed(1)} · ${(packTurns / Math.max(1, packFights)).toFixed(1)} turns vs plain ${(plainTurns / Math.max(1, plainFights)).toFixed(1)} · aimed at a minion ${(100 * aimed / Math.max(1, packTurns)).toFixed(0)}% of pack turns · cleaved ${(100 * cleaved / Math.max(1, packTurns)).toFixed(0)}%`);
}
