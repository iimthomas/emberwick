// 🙌 TWO-HANDED, hand-driven (2026-09-02, build 464). Sets out with a mage + rogue on stage 1's
// road and plays ordinary fights with the bot's own arrangement search, one hand at a time.
// Asserts the rules: creature HP ×COOP_HP_MULT · the hands alternate within a creature turn ·
// the creature's turn counter moves only after a strike · each hand's deck drains on its own.
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 3);
const M = 1.8;   // COOP_HP_MULT, pinned (a `let` never lands on the sandbox)
H.useClass('mage'); H.seed(+(process.argv[3] || 20260902));

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let wheelBuys = 0, boons = 0;
let fights = 0, handTurns = 0, byCls = { mage: 0, rogue: 0 }, deaths = 0, kills = 0, turnsSum = 0, outs = 0;
const clsOfHand = s => { const c = s.hand[0] || s.deck[0] || s.discard[0]; return (c && S.ROGUE.defs.includes(c.def)) ? 'rogue' : 'mage'; };

function driveFight(trace) {
  const s = H.getS();
  const base = s.foeBase, st = s.foeState;
  ok(st.maxHp === Math.round(base.hp * M), `HP not scaled: ${st.maxHp} vs ${base.hp}×${M}`);
  let lastTurn = -1, struckThisTurn = 0, lastIdx = -1;
  for (let guard = 0; guard < 400; guard++) {
    const p = s.phase;
    if (p === 'assign' && s.foeState) {
      const idx = s.handIdx, cls = clsOfHand(s);
      ok(s.hands[idx].cls === cls, `loaded hand ${idx} says ${s.hands[idx].cls} but the cards are ${cls}`);
      if (s.foeState.turn !== lastTurn) {
        if (lastTurn >= 0) ok(struckThisTurn >= 1, `turn advanced with ${struckThisTurn} strikes`);
        lastTurn = s.foeState.turn; struckThisTurn = 0;
      } else ok(idx !== lastIdx, `same hand ${idx} arranged twice in turn ${lastTurn}`);
      lastIdx = idx;
      if (trace) console.log(`  turn ${s.foeState.turn} · ${cls} arranges · ${base.name} ${s.foeState.hp}/${s.foeState.maxHp} · hand ${s.hand.length} deck ${s.deck.length} · partner deck ${s.hands[1 - idx].deck.length}`);
      byCls[cls]++; handTurns++;
      S.RUNSIM.chooseBest(); S.resolve(); struckThisTurn++;
    }
    else if (p === 'reveal') S.advanceBeat();
    else if (p === 'soak') {
      const a = S.armourEligible().slice().sort((x, y) => S.armourBlock(y) - S.armourBlock(x))[0];
      if (a) { S.soakWithArmour(a.id); continue; }
      const c = S.soakEligible().slice().sort((x, y) => S.soakValue(y) - S.soakValue(x))[0];
      if (c) S.soakWith(c.id); else return 'stuck-soak';
    }
    else if (p === 'defeat') { deaths++; turnsSum += st.turn; return 'defeat'; }
    else if (!s.foeState || s.foeState.hp <= 0) { kills++; turnsSum += st.turn; return 'kill'; }
    else return 'phase:' + p;
  }
  return 'guard';
}

for (let run = 0; run < N; run++) {
  S.setClass(S.MAGE);
  S.freshGame(1);
  S.startTwoHanded(1, 'mage', 'rogue');
  const s = H.getS();
  ok(s.hands && s.hands.length === 2, 'two hands not set');
  ok(s.hands[0].cls === 'mage' && s.hands[1].cls === 'rogue', 'hand classes wrong');
  const trace = run === 0;
  let fightsThisRun = 0;
  for (let step = 0; step < 40 && fightsThisRun < 6; step++) {
    if (s.phase !== 'map') { if (trace) console.log('  stopped in phase', s.phase); break; }
    const ch = S.mapChoices(s.map);
    const pick = ch.find(n => ['normal', 'elite'].includes(s.map.floors[n.f][n.c].type));
    if (!pick) break;
    S.takeMapNode(pick.f, pick.c);
    if (!s.foeState) break;
    fights++; fightsThisRun++;
    const r = driveFight(trace);
    if (trace) console.log(`  → ${r} on turn ${s.foeState ? s.foeState.turn : '?'}`);
    outs += s.hands.filter(h => h.out).length;
    if (r === 'defeat') break;
    let wheelSwapped = false;
    for (let k = 0; k < 30 && s.phase !== 'map' && s.phase !== 'defeat'; k++) {
      const p = s.phase;
      if (p === 'reveal') S.advanceBeat();
      else if (p === 'wheel') {
        // 🛒 the road: step the OTHER character up to the Wheel, check it rolled them their own shelf
        if (!wheelSwapped) {
          wheelSwapped = true;
          const other = 1 - s.handIdx, before = s.handIdx;
          S.swapHand(other);
          ok(s.handIdx === other, 'swap on the Wheel refused');
          ok(s.wheel && s.wheel.offers && s.wheel.offers.length > 0, 'no shelf rolled for the other character');
          ok(clsOfHand(s) === s.hands[other].cls, 'Wheel swap loaded the wrong cards');
          const up = s.hand.filter(c => S.upgradable(c))[0];
          if (up && s.coins >= S.eff(up).cost) { const lv = up.level; S.buyUpgrade(up.id); ok(up.level === lv + 1, 'sharpen on the swapped hand did not land'); wheelBuys++; }
          S.swapHand(before);
          ok(s.handIdx === before && s.wheel, 'swap back lost the first shelf');
        }
        S.wheelDone();
        ok(s.hands.every(h => !h.wheel), 'a shelf stayed open after Move on');
      }
      else if (p === 'eliteboon') {
        const charms0 = s.hands.map((h, i) => (i === s.handIdx ? s.charms : h.charms).length);
        let g2 = 0;
        while (s.phase === 'eliteboon' && g2++ < 4) { const b = s.boon || []; if (b.length) S.pickBoon(b[0]); else { s.boon = null; S.backToMap(); } }
        const charms1 = s.hands.map((h, i) => (i === s.handIdx ? s.charms : h.charms).length);
        boons += charms1.reduce((t, n, i) => t + (n - charms0[i]), 0);
        ok(charms1.every((n, i) => n === charms0[i] + 1), `elite charm not picked for both: ${charms0} → ${charms1}`);
      }
      else if (p === 'upgrade') S.doneUpgrades();
      else break;
    }
  }
}
console.log(`runs ${N} · fights ${fights} · hand-turns ${handTurns} (mage ${byCls.mage} / rogue ${byCls.rogue}) · kills ${kills} · defeats ${deaths} · avg turns ${(turnsSum / Math.max(1, kills + deaths)).toFixed(1)} · hands out ${outs} · sharpened on the swapped hand ${wheelBuys} · elite charms picked ${boons}`);
console.log(fails.length ? `🔴 ${fails.length} FAILS\n` + fails.slice(0, 12).join('\n') : '✅ every assertion held');
