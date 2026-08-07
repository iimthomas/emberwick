'use strict';
/* ============================================================
   EMBERWICK — THE MEASUREMENT ROUND (2026-08-04)

   ⚠️ THIS FILE ANSWERS QUESTIONS. IT DOES NOT PROPOSE MECHANICS.
   Written deliberately as measurements, not features: the standing failure mode on this project
   is designing a fix and then evaluating the fix instead of the data (sealed slots shipped and
   died the same day for exactly that reason). Every number here is something we were previously
   guessing at.

   It attaches to RUNSIM's own loop via setHook() rather than forking it — a forked copy of the
   run loop drifts, and then the instrument reports a game we are not shipping.

   THE FOUR QUESTIONS
   1. 🐉 STAGE 4 — is 40% a HARD PROBLEM or a DICE ROLL? Every stage-4 loss is replayed from the
      lair with reshuffled draw order. If no reshuffle can win, the loss was decided on the road
      (accumulated blunting). If most reshuffles win, it was draw variance — which would violate
      our own telegraph rule.
   2. 🕯️ THE CANDLE — does seeing the next encounter change what you PLAY? Compares the greedy
      best arrangement against a one-encounter-lookahead best. If they pick the same Spell every
      time, the candle is decoration.
   3. ✦ PERFECT KILL — on every Complete, would a SMALLER Spell also have done it? This is the
      headroom for [[Perfect_Kill]]. If most Completes are already minimal, the idea dies cheap.
   4. 🃏 THE STACK & 🔥 THE EMBERWAKE — does the order you return cards in move a run-level
      number, and does aiming a banked Surge ever land anywhere but Attack?

   ⚠️ CAVEATS THAT MUST BE PRINTED WITH THE NUMBERS
   - This is the OPTIMAL-PLAY ceiling. A human plays worse, so every rate here is generous.
   - The bot can never BANK an Emberwake (it scores one encounter), so bank RATE is unmeasurable
     here by construction. Only the AIM is measured.
   - The lookahead assumes no soak between the two encounters and ignores the next turn's
     hardship roll (unknowable in advance — a player can't see it either).
   ============================================================ */

const MEASURE = (() => {
  const OUT = { Complete: 2, Narrow: 1, Loss: 0 };
  const scoreOf = r => r.type === 'fight'
    ? [OUT[r.outcome], -((r.early || 0) + (r.combatDmg || 0) + (r.poison || 0)), r.value]
    : [OUT[r.outcome], -((r.timePenalty || 0) + (r.treacherousDmg || 0) + (r.stormDmg || 0)), r.value];
  const better = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] > b[i]; } return false; };
  const pct = (n, d) => d ? Math.round(n / d * 100) : 0;

  // ---- state snapshot. Card objects are copied but keep their `def` BY REFERENCE (a JSON round
  // trip would clone CARD_DEFS entries and quietly break every identity check downstream). ----
  function cloneS(s) {
    const cl = a => (a || []).map(c => ({ ...c }));
    const o = { ...s };
    o.hand = cl(s.hand); o.deck = cl(s.deck); o.discard = cl(s.discard);
    o.assign = { ...s.assign };
    o.results = { ...s.results };
    o.charms = (s.charms || []).slice();
    o.sneak = s.sneak ? { ...s.sneak } : null;
    o.encounterQueue = (s.encounterQueue || []).slice();
    o.downgraded = new Set(s.downgraded || []);
    o.stats = { ...s.stats };
    o.dragonState = s.dragonState ? JSON.parse(JSON.stringify(s.dragonState)) : null;
    o.stack = s.stack ? JSON.parse(JSON.stringify(s.stack)) : null;
    return o;
  }

  // ---- every arrangement of the current hand against the current encounter ----
  function arrangements(fullOnly) {
    const hand = S.hand, isFight = S.encounter.type === 'fight';
    const bts = isFight ? ['Attack', 'Initiative'] : ['Move', 'Pace'];
    const out = [];
    for (let w = 0; w < hand.length; w++) {
      const spell = hand[w], rest = hand.filter((_, i) => i !== w);
      const opts = fullOnly ? rest : [null, ...rest];
      for (const spark of opts) {
        for (const tinder of opts) {
          if (tinder && tinder === spark) continue;
          for (const ember of opts) {
            if (ember && (ember === spark || ember === tinder)) continue;
            for (const bt of bts) out.push({
              Spell: spell.id, Element: spark ? spark.id : null,
              Boost: tinder ? tinder.id : null, Reserve: ember ? ember.id : null, bt,
            });
          }
        }
      }
    }
    return out;
  }
  function evalArr(a) {
    S.assign = { Spell: a.Spell, Element: a.Element, Boost: a.Boost, Reserve: a.Reserve };
    S.boostTarget = a.bt;
    return computeAction(cardById(a.Reserve));
  }
  // best achievable score for a hypothetical hand against a hypothetical encounter
  function bestFor(handCards, encounter) {
    const k = { hand: S.hand, enc: S.encounter, hard: S.hardship, as: S.assign, bt: S.boostTarget, w: S.wake, wt: S.wakeTarget };
    S.hand = handCards; S.encounter = encounter; S.hardship = null; S.wake = 0; S.wakeTarget = null;
    let best = null;
    for (const a of arrangements(false)) {
      const r = evalArr(a); if (!r) continue;
      const sc = scoreOf(r); if (!best || better(sc, best)) best = sc;
    }
    S.hand = k.hand; S.encounter = k.enc; S.hardship = k.hard; S.assign = k.as; S.boostTarget = k.bt; S.wake = k.w; S.wakeTarget = k.wt;
    return best || [-1, 0, 0];
  }

  // ============================================================
  // per-turn accumulators
  // ============================================================
  function freshAcc() {
    return {
      turns: 0,
      // ✦ Perfect Kill
      completes: 0, perfect: 0, smallerExisted: 0, wasteSum: 0,
      fCompletes: 0, fPerfect: 0, jCompletes: 0, jPerfect: 0,
      // 🕯️ the candle
      lookElig: 0, lookDiffSpell: 0, lookDiffAny: 0, lookSavesNext: 0,
      greedyBiggest: 0, lookBiggest: 0,
      // 🔥 the Emberwake
      wakeTurns: 0, wakeOffAtk: 0,
    };
  }

  function onAssign(A) {
    if (S.finalMode) return;                    // road turns only — the duel is its own instrument
    const chosen = { ...S.assign, bt: S.boostTarget };
    const r = computeAction(cardById(S.assign.Reserve));
    if (!r) return;
    A.turns++;
    const isFight = r.type === 'fight';
    if ((S.wake || 0) > 0) { A.wakeTurns++; if (S.wakeTarget !== 'atk') A.wakeOffAtk++; }

    // ---- ✦ PERFECT KILL: was there a SMALLER Spell that also Completes? ----
    if (r.outcome === 'Complete') {
      A.completes++; if (isFight) A.fCompletes++; else A.jCompletes++;
      const chosenVal = eff(cardById(chosen.Spell)).value;
      let minVal = Infinity;
      for (const a of arrangements(false)) {
        const r2 = evalArr(a); if (!r2 || r2.outcome !== 'Complete') continue;
        const v = eff(cardById(a.Spell)).value;
        if (v < minVal) minVal = v;
      }
      if (minVal < chosenVal) { A.smallerExisted++; A.wasteSum += chosenVal - minVal; }
      else { A.perfect++; if (isFight) A.fPerfect++; else A.jPerfect++; }
    }

    // ---- 🕯️ THE CANDLE: greedy vs one-encounter lookahead ----
    const nextEnc = S.encounterQueue && S.encounterQueue[0];
    if (nextEnc && S.deck.length >= 4) {
      A.lookElig++;
      // the next hand depends ONLY on which card is the Arsenal (Spell → discard, Catalyst and
      // Surge go UNDER the deck, so they can't come back in the next four) — so memoise on it.
      const memo = {};
      const nextScore = (reserveId, lost) => {
        const key = reserveId + '|' + (lost ? 1 : 0);
        if (memo[key] !== undefined) return memo[key];
        const keep = lost ? null : cardById(reserveId);
        const need = keep ? 3 : 4;
        const nh = (keep ? [{ ...keep }] : []).concat(S.deck.slice(0, need).map(c => ({ ...c })));
        return (memo[key] = bestFor(nh, nextEnc));
      };
      let greedy = null, look = null;
      for (const a of arrangements(true)) {
        const r2 = evalArr(a); if (!r2) continue;
        const cur = scoreOf(r2);
        if (!greedy || better(cur, greedy.sc)) greedy = { a, sc: cur, cur };
        const nx = nextScore(a.Reserve, !!r2.loseReserve);
        const combo = [cur[0], nx[0], cur[1], cur[2]];
        if (!look || better(combo, look.sc)) look = { a, sc: combo, cur, nx };
      }
      if (greedy && look) {
        if (greedy.a.Spell !== look.a.Spell) A.lookDiffSpell++;
        if (greedy.a.Spell !== look.a.Spell || greedy.a.Reserve !== look.a.Reserve) A.lookDiffAny++;
        // did the lookahead trade nothing away this turn and still buy a better next turn?
        const gNext = nextScore(greedy.a.Reserve, false);
        if (look.nx && look.nx[0] > gNext[0] && look.cur[0] === greedy.cur[0]) A.lookSavesNext++;
        const biggest = S.hand.slice().sort((x, y) => eff(y).value - eff(x).value)[0];
        if (biggest) {
          if (greedy.a.Spell === biggest.id) A.greedyBiggest++;
          if (look.a.Spell === biggest.id) A.lookBiggest++;
        }
      }
    }

    // put the bot's own choice back — we only observed, we never decide
    S.assign = { Spell: chosen.Spell, Element: chosen.Element, Boost: chosen.Boost, Reserve: chosen.Reserve };
    S.boostTarget = chosen.bt;
  }

  // ============================================================
  // 🐉 STAGE 4 — replay each loss from the lair with a different draw order
  // ============================================================
  function replayDuel(sn) {
    S = cloneS(sn);
    S.deck = shuffle(S.deck);
    let g = 0;
    while (g++ < 400) {
      const p = S.phase;
      if (p === 'assign') { RUNSIM.chooseBestDuel(); resolveDuel(); }
      else if (p === 'reveal') advanceBeat();
      else if (p === 'stack') {
        const st = S.stack;
        const pool = st.ids.filter(id => !st.order.includes(id)).map(id => cardById(id)).filter(Boolean);
        const next = pool.sort((a, b) => RUNSIM.bigness(b) - RUNSIM.bigness(a))[0];
        if (next) stackPick(next.id); else return false;
      }
      else if (p === 'soak') { const c = soakEligible().slice().sort((a, b) => soakValue(b) - soakValue(a))[0]; if (c) soakWith(c.id); else return false; }
      else if (p === 'upgrade') doneUpgrading();
      else if (p === 'wheel') wheelDone();
      else if (p === 'victory') return true;
      else if (p === 'defeat') return false;
      else return false;
    }
    return false;
  }

  // ============================================================
  // the round
  // ============================================================
  function round(N, K) {
    const _r = window.render, _s = window.saveGame, _f = window.freshGame;
    window.render = () => {}; window.saveGame = () => {};
    const A = freshAcc();
    const stage4 = { runs: 0, wins: 0, losses: 0, reachedLair: 0,
                     dead: 0, unlikely: 0, live: 0, coinflip: 0,
                     liveSum: 0, hpLeftSum: 0, lairDeckSum: 0, lairLevelSum: 0 };
    let lair = null;
    try {
      // ---- pass 1: every run is STAGE 4, instrumented ----
      window.freshGame = () => _f(4);
      RUNSIM.setHook({
        onAssign: () => onAssign(A),
        onLair: () => { lair = cloneS(S); },
      });
      for (let i = 0; i < N; i++) {
        lair = null;
        const m = RUNSIM.autoRun(true);
        stage4.runs++;
        if (lair) {
          stage4.reachedLair++;
          stage4.lairDeckSum += lair.deck.length + lair.hand.length;
          stage4.lairLevelSum += [...lair.deck, ...lair.hand].reduce((t, c) => t + c.level, 0);
        }
        if (m.win) { stage4.wins++; continue; }
        if (m.win === false) {
          stage4.losses++;
          stage4.hpLeftSum += (m.dragonHPleft || 0);
          if (!lair) continue;
          // 🔑 THE CLASSIFIER: replay the same lair K times with a different shuffle.
          let w = 0;
          RUNSIM.setHook({});                          // no instrumentation inside replays
          for (let k = 0; k < K; k++) if (replayDuel(lair)) w++;
          RUNSIM.setHook({ onAssign: () => onAssign(A), onLair: () => { lair = cloneS(S); } });
          const f = w / K;
          stage4.liveSum += f;
          if (w === 0) stage4.dead++;
          else if (f <= 0.25) stage4.unlikely++;
          else if (f <= 0.5) stage4.live++;
          else stage4.coinflip++;
        }
      }
      // ---- pass 2: 🃏 does the STACK order move anything? (all stages, round-robin) ----
      window.freshGame = _f;
      RUNSIM.setHook({ stackPolicy: 'big' });
      const stBig = RUNSIM.batch(true, N);
      RUNSIM.setHook({ stackPolicy: 'random' });
      const stRnd = RUNSIM.batch(true, N);
      RUNSIM.setHook({ stackPolicy: 'small' });
      const stSml = RUNSIM.batch(true, N);
      RUNSIM.setHook({});
      return { N, K, A, stage4, stack: { big: stBig, random: stRnd, small: stSml } };
    } finally {
      window.render = _r; window.saveGame = _s; window.freshGame = _f;
      RUNSIM.setHook({});
      try { localStorage.removeItem('emberwick-save-1'); } catch (e) {}
    }
  }

  return { round, pct, onAssign, freshAcc, cloneS, replayDuel };
})();

// ============================================================
// report
// ============================================================
function runMeasure() {
  const out = document.getElementById('solver');
  out.innerHTML = '<p>Measuring… stage-4 loss replays are the slow part (each loss is re-fought from the lair).</p>';
  setTimeout(() => {
    // ⚠️ n≥60 is the floor for a per-dragon number (at n=20 two identical configs read 85% and
    // 100%). The loss CLASSIFIER needs more than that again, because it only sees the losses.
    const N = 200, K = 25;
    const res = MEASURE.round(N, K);
    const { A, stage4, stack } = res;
    const p = MEASURE.pct;

    let html = `<h1>Measurement Round</h1><p class="meta">${N} stage-4 runs · each loss replayed ${K}× from the lair · plus ${N} runs per Stack policy. ` +
      `⚠️ optimal-play ceiling — a human does worse than every number here.</p>`;

    // 1. stage 4
    const L = stage4.losses || 1;
    html += `<h2>🐉 1 · Is stage 4 a hard problem or a dice roll?</h2>`;
    html += `<table class="head"><tr><th>Reading</th><th>Value</th><th>Meaning</th></tr>`;
    html += `<tr><td>Stage-4 win rate</td><td>${p(stage4.wins, stage4.runs)}%</td><td class="note">${stage4.wins}/${stage4.runs}</td></tr>`;
    html += `<tr><td>Reached the lair</td><td>${p(stage4.reachedLair, stage4.runs)}%</td><td class="note">the road itself rarely ends a run</td></tr>`;
    html += `<tr><td>Cards at the lair</td><td>${(stage4.lairDeckSum / (stage4.reachedLair || 1)).toFixed(1)}</td><td class="note">avg total levels ${(stage4.lairLevelSum / (stage4.reachedLair || 1)).toFixed(1)}</td></tr>`;
    html += `<tr><td>Avg dragon HP left on a loss</td><td>${(stage4.hpLeftSum / L).toFixed(1)}</td><td class="note">small = heartbreaker, large = out of reach</td></tr>`;
    html += `</table>`;
    html += `<h3>Every loss, replayed ${K}× from the lair with a different draw order</h3>`;
    html += `<table class="head"><tr><th>Class</th><th>Share of losses</th><th>What it means</th></tr>`;
    const rows = [
      ['💀 Dead on arrival (0 replays won)', stage4.dead, 'the run was already lost when you got there — the ROAD decided it, not the dragon'],
      ['🥀 Live but unlikely (≤25% won)', stage4.unlikely, 'a real line existed and you needed the draw — hard problem'],
      ['⚖️ Live (26–50% won)', stage4.live, 'genuinely close'],
      ['🎲 Coin-flip lost (>50% won)', stage4.coinflip, 'the same lair usually WINS — this loss was draw variance'],
    ];
    for (const [l, v, note] of rows) html += `<tr><td>${l}</td><td>${p(v, stage4.losses)}%</td><td class="note">${note} <b>(${v})</b></td></tr>`;
    html += `<tr><td>Avg winnability of a lost lair</td><td>${Math.round((stage4.liveSum / L) * 100)}%</td><td class="note">0% = structurally decided · 50%+ = a dice roll</td></tr>`;
    html += `</table>`;

    // 2. the candle
    html += `<h2>🕯️ 2 · Does seeing the next encounter change the play?</h2>`;
    html += `<table class="head"><tr><th>Reading</th><th>Value</th><th>Meaning</th></tr>`;
    html += `<tr><td>Turns measured</td><td>${A.lookElig}</td><td class="note">road turns with a known next encounter and a full deck</td></tr>`;
    html += `<tr><td><b>Lookahead picks a DIFFERENT Spell</b></td><td><b>${p(A.lookDiffSpell, A.lookElig)}%</b></td><td class="note">the headline — 0% means the candle changes nothing</td></tr>`;
    html += `<tr><td>…a different Spell or Arsenal</td><td>${p(A.lookDiffAny, A.lookElig)}%</td><td class="note">the Arsenal is the other card foresight should move</td></tr>`;
    html += `<tr><td>Free improvement (same outcome now, better next)</td><td>${p(A.lookSavesNext, A.lookElig)}%</td><td class="note">foresight that costs you nothing — pure information value</td></tr>`;
    html += `<tr><td>Spell = biggest card · greedy</td><td>${p(A.greedyBiggest, A.lookElig)}%</td><td class="note">⚠️ not the same measure as the 82→94% figure in the vault, which was a Lv1-vs-Lv4 sweep of fights only — this is every road turn at whatever level the run has reached</td></tr>`;
    html += `<tr><td>Spell = biggest card · <b>with lookahead</b></td><td><b>${p(A.lookBiggest, A.lookElig)}%</b></td><td class="note">if this doesn't drop, the candle does not fix the Spell slot</td></tr>`;
    html += `</table>`;

    // 3. perfect kill
    html += `<h2>✦ 3 · Perfect Kill — how much overkill is there?</h2>`;
    html += `<table class="head"><tr><th>Reading</th><th>Value</th><th>Meaning</th></tr>`;
    html += `<tr><td>Completes measured</td><td>${A.completes}</td><td class="note">over ${A.turns} road turns</td></tr>`;
    html += `<tr><td><b>Already a Perfect Kill</b></td><td><b>${p(A.perfect, A.completes)}%</b></td><td class="note">no smaller Spell would have done it</td></tr>`;
    html += `<tr><td>A smaller Spell would have done it</td><td>${p(A.smallerExisted, A.completes)}%</td><td class="note">the headroom the idea has to work with</td></tr>`;
    html += `<tr><td>Avg strike wasted when it wasn't perfect</td><td>${(A.wasteSum / (A.smallerExisted || 1)).toFixed(1)}</td><td class="note">difference in printed value between the card played and the smallest that works</td></tr>`;
    html += `<tr><td>⚔️ fights perfect / 👣 journeys perfect</td><td>${p(A.fPerfect, A.fCompletes)}% / ${p(A.jPerfect, A.jCompletes)}%</td><td class="note">if these differ a lot, the reward should be fight-only</td></tr>`;
    html += `</table>`;

    // 4. stack + emberwake
    html += `<h2>🃏 4 · The Stack and 🔥 the Emberwake</h2>`;
    html += `<table class="head"><tr><th>Stack policy</th><th>Complete %</th><th>Loss %</th><th>Finale win %</th><th>Turns</th></tr>`;
    for (const [name, r] of [['Biggest back first (bot default)', stack.big], ['Random order', stack.random], ['Smallest back first', stack.small]])
      html += `<tr><td>${name}</td><td>${r.completePct}%</td><td>${r.lossPct}%</td><td>${r.finaleWinPct}%</td><td>${r.turns}</td></tr>`;
    html += `</table>`;
    html += `<div class="interp">If these three rows are within noise of each other, <b>the Stack is decoration</b> — the order you return cards in is not moving a run-level number, and either it needs teeth or it needs cutting.</div>`;
    html += `<table class="head"><tr><th>Emberwake</th><th>Value</th><th>Meaning</th></tr>`;
    html += `<tr><td>Turns holding a banked Surge</td><td>${A.wakeTurns}</td><td class="note">⚠️ the bot can never CHOOSE to bank — it only aims what a verb banked for it</td></tr>`;
    html += `<tr><td>Aimed somewhere other than ⚔️ Attack</td><td>${p(A.wakeOffAtk, A.wakeTurns)}%</td><td class="note">~0% = the aim fork is fake</td></tr>`;
    html += `</table>`;

    html += `<div class="interp"><b>⚠️ Read all of this as a ceiling.</b> The bot always finds the attuned arrangement and always plays the best line it can see one encounter ahead. A human misses both. Nothing here should be used to make the game <i>harder</i>; it is for deciding which systems are real.</div>`;

    out.innerHTML = html;
    console.log('MEASURE', JSON.stringify({ A, stage4, stack: { big: stack.big.completePct, random: stack.random.completePct, small: stack.small.completePct } }));
  }, 30);
}
