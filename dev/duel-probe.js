// 🐉 THE DUEL, PER BEAT, PER CLASS — `node dev/duel-probe.js N` (N runs per class, round-robin stages)
const H = require('./headless.js'); const S = H.sandbox;
const N = +(process.argv[2] || 80);
for (const cls of ['mage', 'rogue']) {
  let duels = 0, wins = 0, beats = 0, toHp = 0, incoming = 0, raceLost = 0, big = 0, rips = 0, sticks = 0, deckCards = 0, deckLv = 0, dry = 0;
  const rS = S.duelStrike, rC = S.duelCounter, rSt = S.startDuel, rV = S.victory, rD = S.defeat;
  let inDuel = false, live = false;
  const rR = S.resolveDuel; S.resolveDuel = function () { live = true; try { return rR.apply(this, arguments); } finally { live = false; } };
  S.startDuel = function () { const o = rSt.apply(this, arguments); const g = H.getS(); duels++; inDuel = true; deckCards += g.deck.length + g.hand.length; deckLv += [...g.deck, ...g.hand].reduce((a, c) => a + c.level, 0); return o; };
  S.duelStrike = function (r) { const st = rS.apply(this, arguments); if (inDuel && live && r) { beats++; toHp += st.toHp || 0; if (r.initLost) raceLost++; if (r.enhUsed || (r.rogue && r.rogue.full)) big++; if (r.rogue && r.rogue.rips) rips++; if (r.rogue && r.rogue.sticks) sticks++; incoming += (r.early || 0); } return st; };
  S.duelCounter = function () { const c = rC.apply(this, arguments); if (inDuel && live) incoming += c || 0; return c; };
  S.victory = function () { if (inDuel) wins++; inDuel = false; return rV.apply(this, arguments); };
  S.defeat = function (w) { if (inDuel) { if (/spent/i.test(String(w))) dry++; } inDuel = false; return rD.apply(this, arguments); };
  H.useClass(cls); H.seed(20260902); S.RUNSIM.batch(true, N);
  S.duelStrike = rS; S.duelCounter = rC; S.startDuel = rSt; S.victory = rV; S.defeat = rD; S.resolveDuel = rR;
  console.log(`${cls.padEnd(6)} duels ${duels} · win ${(100 * wins / Math.max(1, duels)).toFixed(0)}% · beats/duel ${(beats / Math.max(1, duels)).toFixed(1)} · to HP/beat ${(toHp / Math.max(1, beats)).toFixed(1)} · incoming/beat ${(incoming / Math.max(1, beats)).toFixed(1)} · race lost ${(100 * raceLost / Math.max(1, beats)).toFixed(0)}% · big-value ${(100 * big / Math.max(1, beats)).toFixed(0)}% · deck at lair ${(deckCards / Math.max(1, duels)).toFixed(1)} cards / ${(deckLv / Math.max(1, duels)).toFixed(0)} levels · lost by running dry ${dry}` + (cls === 'rogue' ? ` · sticks ${sticks} rips ${rips}` : ''));
}
