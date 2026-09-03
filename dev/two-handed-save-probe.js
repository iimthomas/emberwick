// 💾 TWO-HANDED SAVE ROUND-TRIP (build 469). Three snapshots a Two-Handed run can be closed on —
// mid-fight with one hand struck, at the Wheel with two shelves open, and mid-duel — each saved,
// reloaded, and compared field by field against the live run. The failure this hunts is SILENT:
// loadGame() returning false looks exactly like "no save yet".
const H = require('./headless.js');
const S = H.sandbox;
H.useClass('mage'); H.seed(20260902);
const fails = []; const ok = (c, m) => { if (!c) fails.push(m); };
const cardSig = cs => cs.map(c => c.def.name + ':' + c.level + ':' + c.id).join(',');
function snapshot() {
  const s = H.getS(); S.stashHand();
  return { phase: s.phase, idx: s.handIdx, coins: s.coins, foe: s.foeState && s.foeState.hp, duel: s.dragonState && s.dragonState.hp,
    hands: s.hands.map(h => ({ cls: h.cls, struck: h.struck, out: h.out, deck: cardSig(h.deck), hand: cardSig(h.hand), discard: cardSig(h.discard),
      charms: (h.charms || []).join(','), candle: h.candle, wake: h.wake, wheel: h.wheel ? h.wheel.offers.map(o => o.kind + ':' + (o.name || '')).join('|') : null,
      stamina: h.duelStamina0, delayed: h.delayed })) };
}
function roundTrip(label) {
  const before = snapshot();
  S.saveGame();
  const loaded = S.loadGame();
  ok(loaded, label + ': loadGame returned false');
  if (!loaded) return;
  const after = snapshot();
  const a = JSON.stringify(before), b = JSON.stringify(after);
  ok(a === b, label + ': state differs after reload\n  before ' + a.slice(0, 400) + '\n  after  ' + b.slice(0, 400));
  const s = H.getS();
  ok(s.hands[s.handIdx].cls === (s.hand[0] && S.ROGUE.defs.includes(s.hand[0].def) ? 'rogue' : 'mage') || s.hand.length === 0, label + ': loaded hand class disagrees with its cards');
  console.log(`${label}: ${a === b ? '✅ bit-identical' : '🔴 differs'} (phase ${after.phase}, hand ${after.idx})`);
}
const soak = () => { const s = H.getS(); for (let g = 0; g < 8 && s.phase === 'soak'; g++) { const a = S.armourEligible().slice().sort((x, y) => S.armourBlock(y) - S.armourBlock(x))[0]; if (a) { S.soakWithArmour(a.id); continue; } const c = S.soakEligible().slice().sort((x, y) => S.soakValue(y) - S.soakValue(x))[0]; if (c) S.soakWith(c.id); else break; } };
const reveal = () => { const s = H.getS(); for (let g = 0; g < 20 && s.phase === 'reveal'; g++) S.advanceBeat(); };

// 1 · mid-fight, one hand struck
S.setClass(S.MAGE); S.freshGame(1); S.startTwoHanded(1, 'mage', 'rogue');
let s = H.getS();
for (let i = 0; i < 20 && s.phase === 'map'; i++) { const ch = S.mapChoices(s.map); const p = ch.find(n => s.map.floors[n.f][n.c].type === 'normal') || ch[0]; S.takeMapNode(p.f, p.c); if (s.foeState) break; }
ok(!!s.foeState, 'no fight reached');
S.RUNSIM.chooseBest(); S.resolve(); reveal(); soak();
if (s.phase === 'assign' && s.foeState) roundTrip('mid-fight, one hand struck'); else console.log('skip mid-fight (phase ' + s.phase + ')');
s = H.getS();   // ⚠️ loadGame REPLACES S — a stale handle drives the old run
// play the fight out to the Wheel
for (let g = 0; g < 80 && !['wheel', 'defeat', 'map', 'eliteboon'].includes(s.phase); g++) { if (s.phase === 'assign') { S.RUNSIM.chooseBest(); S.resolve(); } reveal(); soak(); }
reveal();
// 2 · at the Wheel with both shelves open
if (s.phase === 'wheel') { S.swapHand(1 - s.handIdx); S.swapHand(1 - s.handIdx); roundTrip('at the Wheel, two shelves'); } else console.log('skip wheel (phase ' + s.phase + ')');
// 3 · mid-duel
S.setClass(S.MAGE); S.freshGame(1); S.startTwoHanded(1, 'mage', 'rogue'); s = H.getS();
s.region = 4; s.turn = 20; S.beginFinalBattle();
S.RUNSIM.chooseBestDuel(); S.resolveDuel(); reveal(); soak();
if (s.phase === 'assign' && s.finalMode) roundTrip('mid-duel, one hand struck'); else console.log('skip duel (phase ' + s.phase + ')');
s = H.getS();
// and it still plays after the reload
S.RUNSIM.chooseBestDuel(); S.resolveDuel(); reveal(); soak();
ok(s.phase === 'assign' || s.phase === 'victory' || s.phase === 'defeat', 'duel did not continue after reload: ' + s.phase);
// 4 · a SOLO save must not grow hands
S.setClass(S.MAGE); S.freshGame(1); s = H.getS(); s.phase = 'map'; S.saveGame(); ok(S.loadGame(), 'solo save failed to load'); ok(!S.isTwoHanded(), 'solo save came back two-handed');
console.log(fails.length ? `🔴 ${fails.length} FAILS\n` + fails.join('\n') : '✅ every round trip held');
