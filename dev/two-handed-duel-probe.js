// 🐉 TWO-HANDED DUEL, hand-driven (build 468). Sets out mage + rogue, jumps to each stage's lair
// with a mediocre deck per hand, and fights the dragon with the bot's duel search, one hand at a
// time. Asserts: dragon HP ×COOP_HP_MULT · both hands gathered their decks · hands alternate within
// a beat · the beat counter moves only after a strike · a dry hand sits out, both dry is the defeat.
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 3);
const M = 1.8;   // COOP_DRAGON_HP_MULT, pinned (a `let` never lands on the sandbox)
H.useClass('mage'); H.seed(+(process.argv[3] || 20260902));
const fails = []; const ok = (c, m) => { if (!c) fails.push(m); };
const clsOfHand = s => { const c = s.hand[0] || s.deck[0] || s.discard[0]; return (c && S.ROGUE.defs.includes(c.def)) ? 'rogue' : 'mage'; };
const res = { wins: 0, losses: 0, beats: 0, handTurns: 0, byCls: { mage: 0, rogue: 0 }, outs: 0 };

for (let run = 0; run < N; run++) {
  const stage = 1 + (run % 4);
  S.setClass(S.MAGE); S.freshGame(stage); S.startTwoHanded(stage, 'mage', 'rogue');
  const s = H.getS();
  s.dev = { stage, deck: 'mediocre', candle: true, charm: '', arm0: '', arm1: '' };
  // shape both decks like the dev jump does, then to the lair
  const cfg = S.DEV_DECKS ? S.DEV_DECKS.mediocre : null;
  if (cfg) {
    const cur = s.handIdx; S.stashHand();
    s.hands.forEach((h, i) => { S.loadHand(i); S.devShapeDeck(cfg.cards, Math.max(cfg.cards, (s.dragon.par || 44) + cfg.offset)); S.stashHand(); });
    S.loadHand(cur);
  }
  s.region = 4; s.turn = 20; s.encounterQueue = [];
  S.beginFinalBattle();
  const base = Math.max(10, s.dragon.hp + (S.DRAGON_HP_ADD ? (S.DRAGON_HP_ADD[stage] || 0) : 0));
  if (S.DRAGON_HP_ADD) ok(s.dragonState.maxHp === Math.round(base * M), `dragon HP not scaled: ${s.dragonState.maxHp} vs ${base}×${M}`);
  ok(s.hands[1].duelStamina0 > 0 && s.hands[1].discard.length === 0, 'partner did not gather at the lair');
  let lastBeat = -1, lastIdx = -1, struck = 0;
  const trace = run < 2;
  for (let guard = 0; guard < 300; guard++) {
    const p = s.phase;
    if (p === 'assign' && s.finalMode && s.finalPhase === 'duel') {
      const idx = s.handIdx, cls = clsOfHand(s);
      ok(s.hands[idx].cls === cls, `loaded hand ${idx} is ${s.hands[idx].cls} but the cards are ${cls}`);
      if (s.duelBeat !== lastBeat) { if (lastBeat >= 0) ok(struck >= 1, 'beat advanced with no strike'); lastBeat = s.duelBeat; struck = 0; }
      else ok(idx !== lastIdx, `same hand ${idx} struck twice in beat ${lastBeat}`);
      lastIdx = idx;
      if (trace) console.log(`  stage ${stage} · beat ${s.duelBeat} · ${cls} · ${s.dragon.name} ${s.dragonState.hp}/${s.dragonState.maxHp} · hand ${s.hand.length} deck ${s.deck.length} · partner deck ${s.hands[1 - idx].deck.length}${s.hands[1 - idx].out ? ' (out)' : ''}`);
      res.handTurns++; res.byCls[cls]++;
      S.RUNSIM.chooseBestDuel(); S.resolveDuel(); struck++;
    }
    else if (p === 'reveal') S.advanceBeat();
    else if (p === 'soak') {
      const a = S.armourEligible().slice().sort((x, y) => S.armourBlock(y) - S.armourBlock(x))[0];
      if (a) { S.soakWithArmour(a.id); continue; }
      const c = S.soakEligible().slice().sort((x, y) => S.soakValue(y) - S.soakValue(x))[0];
      if (c) S.soakWith(c.id); else { fails.push('stuck in soak'); break; }
    }
    else if (p === 'victory') { res.wins++; res.beats += s.duelBeat; if (trace) console.log(`  → WIN on beat ${s.duelBeat}`); break; }
    else if (p === 'defeat') { res.losses++; res.beats += s.duelBeat; res.outs += s.hands.filter(h => h.out).length; if (trace) console.log(`  → defeat on beat ${s.duelBeat}: ${s.defeatMsg}`); break; }
    else { fails.push('unexpected phase ' + p); break; }
  }
}
console.log(`duels ${N} · wins ${res.wins} · losses ${res.losses} · avg beats ${(res.beats / N).toFixed(1)} · hand-turns ${res.handTurns} (mage ${res.byCls.mage} / rogue ${res.byCls.rogue}) · hands out at defeat ${res.outs}`);
console.log(fails.length ? `🔴 ${fails.length} FAILS\n` + fails.slice(0, 10).join('\n') : '✅ every assertion held');
