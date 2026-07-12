'use strict';
/* ============================================================
   EMBERWICK solver bot — a TUNING INSTRUMENT, not a game feature.
   Runs in the same global scope as game.js, so it scores plays through
   the REAL computeAction() — the bot and the game can never disagree.

   It brute-forces every role assignment (Wick/Spark/Tinder/Ember +
   boost target) of sampled hands against every encounter, finds the
   optimal play, and aggregates the questions from Solver_Bot.md — above
   all: is the Kindle a genuine CHOICE, or kindled-or-bust?

   Hardships are excluded here — we measure the clean turn puzzle; the
   Hardship axis is separate.
   ============================================================ */

const SOLVER = (() => {
  const NDEF = CARD_DEFS.length;               // 17
  const OUTCOME_RANK = { Complete: 2, Narrow: 1, Loss: 0 };

  // ---- build a hand of distinct card defs at a given level ----
  function mkCard(defIndex, level) {
    const c = newCard(CARD_DEFS[defIndex]);
    c.level = Math.min(level, MAX_LEVEL);
    return c;
  }
  function randomHand(level) {
    const idx = [];
    while (idx.length < HAND_SIZE) {
      const r = Math.floor(Math.random() * NDEF);
      if (!idx.includes(r)) idx.push(r);
    }
    return idx.map(i => mkCard(i, level));
  }

  // ---- score a computeAction result: [outcomeRank, -damage, -loseReserve, value] ----
  function fightScore(r) {
    const dmg = (r.early || 0) + (r.combatDmg || 0) + (r.poison || 0) + (r.stormDmg || 0);
    return [OUTCOME_RANK[r.outcome], -dmg, r.loseReserve ? -1 : 0, r.value];
  }
  function journeyScore(r) {
    const pen = (r.timePenalty || 0) + (r.treacherousDmg || 0) + (r.stormDmg || 0);
    return [OUTCOME_RANK[r.outcome], -pen, r.nightCaught ? -1 : 0, r.value];
  }
  function better(a, b) { // is score a strictly better than b?
    for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] > b[i]; }
    return false;
  }

  // ---- enumerate every play for a hand against one encounter ----
  // Returns [{ r, score, enhUsed, wickName, usedTinder, boostTarget }]
  function enumerate(hand, encounter) {
    const isFight = encounter.type === 'fight';
    const boostTargets = isFight ? ['Attack', 'Initiative'] : ['Move', 'Pace'];
    const scoreOf = isFight ? fightScore : journeyScore;
    const plays = [];
    S = { hand, encounter, assign: {}, boostTarget: 'Attack', hardship: null, rangedDodge: false, fuse: null };

    for (let w = 0; w < hand.length; w++) {
      const rest = hand.filter((_, i) => i !== w);
      // Spark: none, or any non-Wick card
      const sparkOpts = [null, ...rest];
      for (const spark of sparkOpts) {
        const afterSpark = rest.filter(c => c !== spark);
        const tinderOpts = [null, ...afterSpark];
        for (const tinder of tinderOpts) {
          // Ember = the leftover most useful as Reserve (highest boost) — journeys use it
          const leftovers = afterSpark.filter(c => c !== tinder);
          const ember = leftovers.slice().sort((a, b) => eff(b).boost - eff(a).boost)[0] || null;
          for (const bt of boostTargets) {
            S.assign = {
              Spell: hand[w].id,
              Element: spark ? spark.id : null,
              Boost: tinder ? tinder.id : null,
              Reserve: ember ? ember.id : null,
            };
            S.boostTarget = bt;
            const r = computeAction(ember);
            if (!r) continue;
            plays.push({
              r, score: scoreOf(r), enhUsed: !!r.enhUsed,
              wickName: hand[w].def.name, usedTinder: !!tinder, boostTarget: bt,
            });
          }
        }
      }
    }
    return plays;
  }

  function bestOf(plays, filterFn) {
    let best = null;
    for (const p of plays) {
      if (filterFn && !filterFn(p)) continue;
      if (!best || better(p.score, best.score)) best = p;
    }
    return best;
  }

  // ---- analyze one encounter over N sampled hands ----
  function analyzeEncounter(encounter, level, N) {
    const isFight = encounter.type === 'fight';
    const m = {
      name: encounter.name, type: encounter.type, N,
      kindleAvail: 0, bestKindles: 0,
      kindleRequiredTier: 0,   // among kindle-avail: best tier > best-unkindled tier
      kindleOptional: 0,       // among kindle-avail: unkindled reaches same tier
      noKindleLoss: 0,         // among NO-kindle-avail hands: best is a Loss
      noKindleHands: 0,
      tinderPlays: 0, offAxisBoost: 0, // Initiative (fights) / Pace (journeys) chosen at best
      nightCaught: 0,          // journeys only
      wick: {},                // wickName -> count in best play
    };
    for (let h = 0; h < N; h++) {
      const hand = randomHand(level);
      const plays = enumerate(hand, encounter);
      const best = bestOf(plays, null);
      const kindleAvail = plays.some(p => p.enhUsed);
      m.wick[best.wickName] = (m.wick[best.wickName] || 0) + 1;
      if (best.usedTinder && best.boostTarget === (isFight ? 'Initiative' : 'Pace')) m.offAxisBoost++;
      if (best.usedTinder) m.tinderPlays++;
      if (!isFight && best.r.nightCaught) m.nightCaught++;

      if (kindleAvail) {
        m.kindleAvail++;
        if (best.enhUsed) m.bestKindles++;
        const bestUnkindled = bestOf(plays, p => !p.enhUsed);
        const bestTier = best.score[0];
        const unkTier = bestUnkindled ? bestUnkindled.score[0] : -1;
        if (bestTier > unkTier) m.kindleRequiredTier++;   // Kindle buys a whole outcome tier
        else m.kindleOptional++;                          // unkindled reaches the same tier
      } else {
        m.noKindleHands++;
        if (best.score[0] === 0) m.noKindleLoss++;
      }
    }
    return m;
  }

  // ---- run the full sweep ----
  function run(level, N) {
    const perRegion = REGIONS.map(region => ({
      region: region.name,
      encounters: region.encounters.map(e => analyzeEncounter(e, level, N)),
    }));
    return { level, N, perRegion };
  }

  // ---- aggregate the headline kindled-or-bust numbers ----
  function headline(sweep, type) {
    let avail = 0, best = 0, req = 0, opt = 0, noKindle = 0, noKindleLoss = 0, total = 0;
    for (const rg of sweep.perRegion)
      for (const m of rg.encounters) {
        if (m.type !== type) continue;
        total += m.N; avail += m.kindleAvail; best += m.bestKindles;
        req += m.kindleRequiredTier; opt += m.kindleOptional;
        noKindle += m.noKindleHands; noKindleLoss += m.noKindleLoss;
      }
    return {
      total,
      pctAvail: pct(avail, total),
      pctBestKindles: pct(best, avail),
      pctRequired: pct(req, avail),      // OBLIGATION INDEX — high = kindled-or-bust
      pctOptional: pct(opt, avail),      // healthy — kindle is a choice
      pctNoKindle: pct(noKindle, total),
      pctNoKindleLoss: pct(noKindleLoss, noKindle),
    };
  }
  const pct = (n, d) => d ? Math.round((n / d) * 100) : 0;

  return { run, headline, analyzeEncounter, enumerate, randomHand };
})();

// ============================================================
// report rendering
// ============================================================
function runSolver() {
  const out = document.getElementById('solver');
  out.innerHTML = '<p>Running… brute-forcing every play of thousands of hands…</p>';
  // let the "running" paint before the heavy loop
  setTimeout(() => {
    const N = 400;
    const results = {};
    for (const lvl of [2, 4]) results[lvl] = SOLVER.run(lvl, N);

    const bar = (p, good) => {
      const col = good == null ? '#8a8f98' : good ? '#5a9e6f' : '#c56a5a';
      return `<span class="pctbar"><span style="width:${p}%;background:${col}"></span></span>`;
    };

    let html = `<h1>Solver Report</h1><p class="meta">${N} random hands per encounter · levels 2 (early) &amp; 4 (endgame) · Hardships excluded · scored via the live <code>computeAction()</code></p>`;

    // headline
    html += `<h2>Kindled-or-bust — the core question</h2>`;
    html += `<table class="head"><tr><th>Metric</th><th>Fights L2</th><th>Fights L4</th><th>Journeys L2</th><th>Journeys L4</th><th>Reading</th></tr>`;
    const rows = [
      ['Kindle available in hand', 'pctAvail', 'higher = easy to match'],
      ['Best play Kindles', 'pctBestKindles', 'of hands where it was available'],
      ['⚠️ Kindle REQUIRED for tier', 'pctRequired', 'the OBLIGATION INDEX — high = bust'],
      ['✅ Kindle optional (choice)', 'pctOptional', 'unkindled reaches the same tier'],
      ['No Kindle available', 'pctNoKindle', 'stuck-unkindled hands'],
      ['…and it forces a Loss', 'pctNoKindleLoss', 'of those stuck hands'],
    ];
    const H = {
      f2: SOLVER.headline(results[2], 'fight'), f4: SOLVER.headline(results[4], 'fight'),
      j2: SOLVER.headline(results[2], 'journey'), j4: SOLVER.headline(results[4], 'journey'),
    };
    for (const [label, key, note] of rows) {
      html += `<tr><td>${label}</td>` +
        `<td>${H.f2[key]}%</td><td>${H.f4[key]}%</td><td>${H.j2[key]}%</td><td>${H.j4[key]}%</td>` +
        `<td class="note">${note}</td></tr>`;
    }
    html += `</table>`;

    // interpretation
    html += `<div class="interp"><b>How to read the obligation index:</b> it's the % of hands (where a Kindle was available) in which taking the Kindle buys a whole outcome tier over the best un-Kindled play. ` +
      `<b>&gt;60% ≈ kindled-or-bust</b> (the puzzle is "match or lose"). <b>&lt;25% ≈ healthy</b> (Kindle is optimization you usually could skip). Middle = nuanced.</div>`;

    // secondary forks
    html += `<h2>Secondary — are the forks real?</h2>`;
    html += `<table class="head"><tr><th>Fork</th><th>L2</th><th>L4</th><th>Reading</th></tr>`;
    const offF2 = forkPct(results[2], 'fight'), offF4 = forkPct(results[4], 'fight');
    const offJ2 = forkPct(results[2], 'journey'), offJ4 = forkPct(results[4], 'journey');
    const nightJ2 = nightPct(results[2]), nightJ4 = nightPct(results[4]);
    html += `<tr><td>Boost→Initiative chosen (fights)</td><td>${offF2}%</td><td>${offF4}%</td><td class="note">of best plays that boost; ~0 = Attack-always</td></tr>`;
    html += `<tr><td>Boost→Pace chosen (journeys)</td><td>${offJ2}%</td><td>${offJ4}%</td><td class="note">~0 = Move-always, Pace fork is fake</td></tr>`;
    html += `<tr><td>Nightfall catches you (journeys)</td><td>${nightJ2}%</td><td>${nightJ4}%</td><td class="note">~0 = Nightfall never bites</td></tr>`;
    html += `</table>`;

    // per-region fight detail
    html += `<h2>Per-encounter (level 2)</h2>`;
    for (const rg of results[2].perRegion) {
      html += `<h3>${rg.region}</h3><table><tr><th>Encounter</th><th>Kindle avail</th><th>Best Kindles</th><th>Obligation</th><th>Top Wick</th></tr>`;
      for (const m of rg.encounters) {
        const topWick = Object.entries(m.wick).sort((a, b) => b[1] - a[1])[0];
        const oblig = m.kindleAvail ? Math.round(m.kindleRequiredTier / m.kindleAvail * 100) : 0;
        html += `<tr><td>${m.type === 'fight' ? '⚔️' : '👣'} ${m.name}</td>` +
          `<td>${SOLVER_pct(m.kindleAvail, m.N)}%</td>` +
          `<td>${SOLVER_pct(m.bestKindles, m.kindleAvail)}%</td>` +
          `<td>${oblig}% ${bar(oblig, oblig < 25 ? true : oblig > 60 ? false : null)}</td>` +
          `<td class="note">${topWick ? `${topWick[0]} (${Math.round(topWick[1] / m.N * 100)}%)` : '—'}</td></tr>`;
      }
      html += `</table>`;
    }

    out.innerHTML = html;
    // compact console summary for headless reading
    console.log('SOLVER_HEADLINE', JSON.stringify(H));
    console.log('SOLVER_FORKS', JSON.stringify({ offF2, offF4, offJ2, offJ4, nightJ2, nightJ4 }));
  }, 30);
}

function forkPct(sweep, type) {
  let off = 0, tind = 0;
  for (const rg of sweep.perRegion) for (const m of rg.encounters) {
    if (m.type !== type) continue; off += m.offAxisBoost; tind += m.tinderPlays;
  }
  return tind ? Math.round(off / tind * 100) : 0;
}
function nightPct(sweep) {
  let n = 0, tot = 0;
  for (const rg of sweep.perRegion) for (const m of rg.encounters) {
    if (m.type !== 'journey') continue; n += m.nightCaught; tot += m.N;
  }
  return tot ? Math.round(n / tot * 100) : 0;
}
function SOLVER_pct(n, d) { return d ? Math.round(n / d * 100) : 0; }

// ============================================================
// RUN SIMULATOR — a headless optimal-play bot that plays whole runs, for
// RUN-LEVEL balance (power inflation, win rates) that the turn-solver can't see.
// A/Bs events on vs off so we can isolate the run-layer's difficulty impact.
// Caveats surfaced in the report: optimal play = difficulty ceiling; bot never Diverts.
// ============================================================
const RUNSIM = (() => {
  const OUT = { Complete: 2, Narrow: 1, Loss: 0 };
  const scoreOf = r => r.type === 'fight'
    ? [OUT[r.outcome], -((r.early || 0) + (r.combatDmg || 0) + (r.poison || 0)), r.value]
    : [OUT[r.outcome], -((r.timePenalty || 0) + (r.treacherousDmg || 0) + (r.stormDmg || 0)), r.value];
  const better = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] > b[i]; } return false; };
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

  // pick + assign the best play for the current encounter (mutates S.assign/boostTarget only)
  function chooseBest() {
    const hand = S.hand, isFight = S.encounter.type === 'fight';
    const bts = isFight ? ['Attack', 'Initiative'] : ['Move', 'Pace'];
    const full = hand.length >= 3; // rolesValid: ≥3 cards must fill all 3 roles
    let best = null;
    for (let w = 0; w < hand.length; w++) {
      const rest = hand.filter((_, i) => i !== w);
      for (const spark of (full ? rest : [null, ...rest])) {
        const after = rest.filter(c => c !== spark);
        for (const tinder of (full ? after : [null, ...after])) {
          const left = after.filter(c => c !== tinder);
          const ember = left.slice().sort((a, b) => eff(b).boost - eff(a).boost)[0] || null;
          for (const bt of bts) {
            S.assign = { Spell: hand[w].id, Element: spark ? spark.id : null, Boost: tinder ? tinder.id : null, Reserve: ember ? ember.id : null };
            S.boostTarget = bt;
            const r = computeAction(ember); if (!r) continue;
            const sc = scoreOf(r);
            if (!best || better(sc, best.sc)) best = { assign: { ...S.assign }, bt, sc };
          }
        }
      }
    }
    if (best) { S.assign = best.assign; S.boostTarget = best.bt; }
  }

  // ---- duel play evaluation: computeAction gives the raw strike (dragon armor []),
  // so we simulate resolveDuel's shield/HP math here WITHOUT mutating dragonState ----
  function evalDuelPlay(r) {
    const ds = S.dragonState, atk = r.value;
    let toHp = 0, chip = 0;
    if (r.enhUsed) {
      const shield = ds.shields.find(s => s.el === r.enhEl && s.strength > 0);
      if (shield) { chip = Math.min(atk, shield.strength); toHp = atk - chip; }
      else toHp = atk;
    } else toHp = atk;
    const hpAfter = Math.max(0, ds.hp - toHp);
    const kill = hpAfter <= 0;
    const counter = kill ? 0 : Math.ceil(S.dragon.breath * hpAfter / ds.maxHp);
    const incoming = kill ? 0 : (r.early || 0) + counter;
    // progress = HP damage + half-credit for shield chipped (breaks enable future full hits)
    return [kill ? 1 : 0, toHp + chip * 0.5, -incoming];
  }
  function chooseBestDuel() {
    const hand = S.hand, full = hand.length >= 3;
    let best = null;
    for (let w = 0; w < hand.length; w++) {
      const rest = hand.filter((_, i) => i !== w);
      for (const spark of (full ? rest : [null, ...rest])) {
        const after = rest.filter(c => c !== spark);
        for (const tinder of (full ? after : [null, ...after])) {
          const left = after.filter(c => c !== tinder);
          const ember = left.slice().sort((a, b) => eff(b).boost - eff(a).boost)[0] || null;
          for (const bt of ['Attack', 'Initiative']) {
            S.assign = { Spell: hand[w].id, Element: spark ? spark.id : null, Boost: tinder ? tinder.id : null, Reserve: ember ? ember.id : null };
            S.boostTarget = bt;
            const r = computeAction(ember); if (!r) continue;
            const sc = evalDuelPlay(r);
            if (!best || better(sc, best.sc)) best = { assign: { ...S.assign }, bt, sc };
          }
        }
      }
    }
    if (best) { S.assign = best.assign; S.boostTarget = best.bt; }
  }
  const allCards = () => [...S.hand, ...S.deck, ...S.discard];

  function autoRun(withEvents) {
    freshGame();
    const m = { turns: 0, firstL4: null, events: 0, regionAvg: [], regionMax: [],
                win: null, dragon: null, duelBeats: 0, approachClean: false, dragonHPleft: null };
    let g = 0;
    while (g++ < 800) {
      const p = S.phase;
      if (p === 'assign') {
        if (S.finalMode && S.finalPhase === 'duel') { chooseBestDuel(); resolveDuel(); }
        else { chooseBest(); resolve(); }
        m.turns++;
      }
      else if (p === 'reveal') advanceBeat();
      else if (p === 'soak') { const c = soakEligible().slice().sort((a, b) => soakValue(b) - soakValue(a))[0]; if (c) soakWith(c.id); else break; }
      else if (p === 'upgrade') { const up = S.hand.filter(c => upgradable(c)).sort((a, b) => b.level - a.level)[0]; if (up) upgrade(up.id); else doneUpgrading(); }
      else if (p === 'event') {
        if (!withEvents) { S.event = null; finishRegionCheck(); continue; }
        const ev = S.event;
        if (ev.step === 'done') { m.events++; eventContinue(); }
        else if (ev.step === 'pickCard') {
          const sacrifice = ev.id === 'pilgrim' || ev.id === 'toll'; // these SPEND a card — give up the weakest
          const t = S.hand.slice().sort((a, b) => sacrifice ? a.level - b.level : b.level - a.level)[0];
          eventPickCard(t.id);
        }
        else if (ev.step === 'pickElement') eventPickElement(dragonWeakness(S.dragon)[0] || 'Fire');
        else eventChoose(0);
      }
      else if (p === 'summary') {
        const lv = allCards().map(c => c.level);
        m.regionAvg.push(mean(lv)); m.regionMax.push(Math.max(...lv));
        if (S.region >= REGIONS.length) beginFinalBattle(); // enter the Dragon Duel
        else nextRegion();
      }
      else if (p === 'victory') { m.win = true; break; }
      else if (p === 'defeat') { m.win = false; break; }
      else break;
      if (!m.firstL4 && allCards().some(c => c.level >= 4)) m.firstL4 = S.turn;
    }
    m.dragon = S.dragon.name;
    m.duelBeats = S.duelBeat;
    m.approachClean = (S.approachOutcomes || []).length >= 2 && S.approachOutcomes.every(o => o === 'Complete');
    m.dragonHPleft = S.dragonState ? S.dragonState.hp : null;
    m.res = { ...S.results };
    return m;
  }

  function batch(withEvents, N) {
    let C = 0, Nn = 0, L = 0, l4sum = 0, l4n = 0, ev = 0, tn = 0;
    const regA = [0, 0, 0, 0], regCount = [0, 0, 0, 0];
    let finaleN = 0, finaleWins = 0, beatsSum = 0, cleanN = 0;
    const perDragon = {}; // name -> { runs, wins, beatsSum, hpLeftSum }
    for (let i = 0; i < N; i++) {
      const m = autoRun(withEvents);
      C += m.res.Complete; Nn += m.res.Narrow; L += m.res.Loss; ev += m.events; tn += m.turns;
      if (m.firstL4) { l4sum += m.firstL4; l4n++; }
      m.regionAvg.forEach((a, r) => { if (r < 4) { regA[r] += a; regCount[r]++; } });
      if (m.win !== null) {
        finaleN++; if (m.win) finaleWins++; beatsSum += m.duelBeats; if (m.approachClean) cleanN++;
        const d = perDragon[m.dragon] || (perDragon[m.dragon] = { runs: 0, wins: 0, beatsSum: 0, hpLeftSum: 0 });
        d.runs++; if (m.win) d.wins++; d.beatsSum += m.duelBeats; d.hpLeftSum += (m.win ? 0 : (m.dragonHPleft || 0));
      }
    }
    const tot = C + Nn + L || 1;
    return {
      completePct: Math.round(C / tot * 100), narrowPct: Math.round(Nn / tot * 100), lossPct: Math.round(L / tot * 100),
      regionAvg: regA.map((a, r) => regCount[r] ? +(a / regCount[r]).toFixed(2) : 0),
      firstL4: l4n ? +(l4sum / l4n).toFixed(1) : null, reachedL4pct: Math.round(l4n / N * 100),
      events: +(ev / N).toFixed(1), turns: +(tn / N).toFixed(1),
      finaleWinPct: finaleN ? Math.round(finaleWins / finaleN * 100) : 0,
      avgDuelBeats: finaleN ? +(beatsSum / finaleN).toFixed(1) : 0,
      cleanApproachPct: finaleN ? Math.round(cleanN / finaleN * 100) : 0,
      perDragon,
    };
  }

  function run(N) {
    const _r = window.render, _s = window.saveGame;
    window.render = () => {}; window.saveGame = () => {}; // stub DOM/storage for speed
    let on, off;
    try { on = batch(true, N); off = batch(false, N); }
    finally { window.render = _r; window.saveGame = _s; try { localStorage.removeItem('emberwick-save-1'); } catch (e) {} }
    return { N, on, off };
  }
  return { run };
})();

function runSimulator() {
  const out = document.getElementById('solver');
  out.innerHTML = '<p>Simulating full runs (optimal-play bot, events on vs off)…</p>';
  setTimeout(() => {
    const N = 60;
    const { on, off } = RUNSIM.run(N);
    const d = (a, b) => { const x = b - a; return `<span class="note">(${x >= 0 ? '+' : ''}${+x.toFixed(2)})</span>`; };
    let html = `<h1>Run Simulator</h1><p class="meta">${N} optimal-play runs per condition · events ON vs OFF · rendering stubbed for speed. ⚠️ optimal play = the <b>easiest</b> the game gets (a human plays worse); the bot never Diverts.</p>`;
    html += `<h2>Difficulty — events on vs off</h2>`;
    html += `<table class="head"><tr><th>Metric</th><th>Events OFF</th><th>Events ON</th><th>Δ (events)</th></tr>`;
    const rows = [
      ['Complete rate', off.completePct + '%', on.completePct + '%', d(off.completePct, on.completePct)],
      ['Narrow rate', off.narrowPct + '%', on.narrowPct + '%', d(off.narrowPct, on.narrowPct)],
      ['Loss rate', off.lossPct + '%', on.lossPct + '%', d(off.lossPct, on.lossPct)],
      ['Turn a card first hits L4', off.firstL4 ?? '—', on.firstL4 ?? '—', on.firstL4 && off.firstL4 ? d(off.firstL4, on.firstL4) : ''],
      ['Runs reaching L4', off.reachedL4pct + '%', on.reachedL4pct + '%', ''],
      ['Events taken / run', off.events, on.events, ''],
      ['Turns to reach dragon', off.turns, on.turns, ''],
    ];
    for (const [l, a, b, dd] of rows) html += `<tr><td>${l}</td><td>${a}</td><td>${b}</td><td>${dd}</td></tr>`;
    html += `</table>`;
    html += `<h2>Deck power by region (avg card level)</h2>`;
    html += `<table class="head"><tr><th></th><th>R1</th><th>R2</th><th>R3</th><th>R4</th></tr>` +
      `<tr><td>Events OFF</td>${off.regionAvg.map(v => `<td>${v}</td>`).join('')}</tr>` +
      `<tr><td>Events ON</td>${on.regionAvg.map(v => `<td>${v}</td>`).join('')}</tr></table>`;

    // ---- the Dragon Duel finale ----
    html += `<h2>🐉 The Dragon Duel</h2>`;
    html += `<table class="head"><tr><th>Metric</th><th>Events OFF</th><th>Events ON</th></tr>`;
    const frows = [
      ['Duel win rate', off.finaleWinPct + '%', on.finaleWinPct + '%'],
      ['Avg duel beats', off.avgDuelBeats, on.avgDuelBeats],
      ['Clean approach (both Complete)', off.cleanApproachPct + '%', on.cleanApproachPct + '%'],
    ];
    for (const [l, a, b] of frows) html += `<tr><td>${l}</td><td>${a}</td><td>${b}</td></tr>`;
    html += `</table>`;
    // per-dragon win rate (events ON — the finished-game condition)
    const dragons = Object.keys(on.perDragon).sort();
    if (dragons.length) {
      html += `<table class="head"><tr><th>Dragon (events ON)</th><th>Runs</th><th>Win %</th><th>Avg beats</th><th>Avg HP left on loss</th></tr>`;
      for (const name of dragons) {
        const d = on.perDragon[name];
        const losses = d.runs - d.wins;
        html += `<tr><td>${name}</td><td>${d.runs}</td><td>${Math.round(d.wins / d.runs * 100)}%</td>` +
          `<td>${(d.beatsSum / d.runs).toFixed(1)}</td><td>${losses ? (d.hpLeftSum / losses).toFixed(1) : '—'}</td></tr>`;
      }
      html += `</table>`;
    }
    html += `<div class="interp"><b>Reading the duel:</b> aim for a win rate that's <b>winnable-but-tense</b> — this is the <i>optimal-play ceiling</i>, so a human wins less; target ~60–80% here. A dragon near 100% is a pushover; near 0% (or avg beats ≤ 2) is unfair. <b>Avg HP left on loss</b> shows how close losses are — a large number means the dragon is out of reach (raise player power or lower HP/breath); a small number means losses are heartbreakers (fine). Tune per-dragon <code>hp</code> / <code>breath</code> in <code>DRAGONS</code>.</div>`;
    html += `<div class="interp"><b>Reading:</b> events should raise the Complete rate and deck level somewhat — that's the run layer working. Watch for <b>runaway</b>: if Complete climbs toward ~70%+ or Loss falls near 0 with events, or deck level inflates far past the off-baseline, the pool is over-rewarding and enemies need a difficulty bump (or events need costs). The current event pool is <b>positive-skewed</b> (downside/gamble events not built yet), so today's gap overstates the finished game's easing.</div>`;
    out.innerHTML = html;
    console.log('RUNSIM', JSON.stringify({ on, off }));
  }, 30);
}

document.addEventListener('DOMContentLoaded', runSolver);
