'use strict';

/* 🗡️ THE CHAIN WEIGHT — SHARED BY BOTH SCORERS, AND THAT IS THE POINT.
   ------------------------------------------------------------------------------------------------
   ⚠️ THIS FILE CONTAINS TWO INDEPENDENT SCORERS: the analyser's `fightScore`/`journeyScore`, and
   RUNSIM's own `scoreOf`. Putting a scoring term in one of them is how the last THREE bugs in this
   instrument happened — the bot ignoring placement bans (patched twice, because `chooseBest` holds
   a second copy of the arrangement search), and the bot aiming at a cut Emberwake target from a
   stale local enum. The note left after the second said: *if a third is ever needed, EXTRACT IT.*
   This is the third. So it lives up here, once, above both.

   WHY IT EXISTS: the bot scores ONE encounter. The rogue's entire source of power pays off NEXT
   turn — the chain sets both hits and Initiative — so a one-encounter scorer values every chain at
   zero and plays the rogue as a worse mage. Before this, it continued a chain on 17% of turns, by
   pure accident, which makes every rogue number taken that way noise.

   🔑 IT IS A POLICY, NOT A FACT. A bot policy can invert what you measure (the stir-band sweep read
   backwards for exactly this reason), so: one named constant, sitting BELOW outcome and damage in
   the lexicographic order — a chain is never worth losing an encounter for — and any number
   produced with it must be reported alongside the same number at MOMENTUM_WEIGHT = 0.
   ============================================================================================== */
let MOMENTUM_WEIGHT = 1;
function setMomentumWeight(w) { MOMENTUM_WEIGHT = w; }
// what the arrangement LEAVES BEHIND.
// ⚠️ REWRITTEN TWICE WITH THE CLASS. It scored a live CHAIN LINK, then where the METER LANDED, and
// now whether the STREAK SURVIVES — because momentum is no longer a pool that a turn adds to, it is
// a run of turns that cost you nothing, and it breaks the moment one does.
// 🔑 THIS IS EXACTLY THE THING A ONE-ENCOUNTER SCORER IS BLIND TO. The streak pays NEXT turn, in
// cheaper ⚡, so protecting a 4-pip streak reads as pure cost to a bot that stops thinking at the
// end of this encounter — the same blind spot as the Emberwake bank, ✦ Unspent and 🃏 Reversed.
// ⚠️ Which is why it is weighted by how DEEP the streak already is: that is the only way to make
// the instrument prefer keeping a long one, and it is a POLICY, not a fact about the game.
// ⚔️ THE LAST MILE'S APPROACH — hoisted here for the SAME reason chainValue is, and by this
// file's own standing instruction (*if a third is ever needed, EXTRACT IT*). There are two
// scorers in this file; a term that lives in only one of them is how the last three instrument
// bugs happened. The per-hand analyser builds synthetic encounters and never sets `lastMile`
// today, so this reads 0 there — but if it ever does, it is already correct.
//
// ⚠️ POLICY, NOT FACT. Being unseen pays entirely into the DUEL, which a one-encounter scorer
// cannot see at all — the same blind spot as the Emberwake bank and ✦ Unspent. It sits BELOW
// outcome and damage, so the bot never fails the road to arrive quietly, and any number produced
// with it must be reported alongside UNSEEN_WEIGHT = 0.
let UNSEEN_WEIGHT = 3;
function setUnseenWeight(w) { UNSEEN_WEIGHT = w; }
const approachValue = r => (r && r.lastMile === 'unseen' ? UNSEEN_WEIGHT : 0);

// 🔥 CHANNELLING — THE BOT COULD NEVER DO THIS, AND THAT WAS NOT A SMALL GAP (taught 2026-08-22).
//
// ⚠️ THE BOT SCORES ONE ENCOUNTER. Channelling gives up this turn's boost for a bigger Emberwake
// NEXT turn, so to a one-encounter scorer it is *always* strictly negative — it never armed the
// bank, on any turn, ever. 🔑 A NUMBER PRODUCED BY AN INSTRUMENT THAT STRUCTURALLY CANNOT DO THE
// THING IS NOT A MEASUREMENT OF THE THING: this is exactly why the old *"the Emberwake fires on
// 0.8% of turns"* line had to be retracted, after a week of being quoted as evidence.
//
// 🔑 THE POLICY, AND IT IS A POLICY. A banked point is worth less than a point spent now, because
// next turn's hand is unknown and an unspent Emberwake gutters out. So it is credited at
// BANK_WEIGHT < 1 and sits in the LAST term, below outcome, damage and the approach — the bot will
// therefore channel only when doing so costs it nothing it can see. That is deliberately the
// CONSERVATIVE reading: it measures the floor of how often channelling is free, not the ceiling of
// how often a human who can read the candle would want it.
// ⚠️ Every number produced with this must be reported alongside BANK_WEIGHT = 0, which reproduces
// the old never-banks bot exactly.
let MARK_WEIGHT = 1.0;   // 🏹 a Mark is worth this much of what the next blow would lose to the shape
let TAUNT_FREE = 6;
// ⚗️ BOT POLICY: the bot has never priced a consumable; for the Alchemist it drinks every non-targeted brew the moment it can, so a brew counts for SOMETHING rather than nothing
// ⚗️ BOT POLICY (476): a brew is drunk on the TURN IT CHANGES SOMETHING, never on sight. Called AFTER the
// arrangement is chosen, with the resolved turn in hand; returns how many it drank (the caller re-arranges).
//   Quicksilver / Stillwater — only when this turn's race is lost (and the counter would land)
//   Glass / Wildfire / their strong forms / Ashglass — only when they turn the blow into a KILL, or at the lair's end
//   Nightshade / Brimstone / Tar — a fresh creature that will outlive this blow (lasting effects pay over turns), or the dragon's first beats
//   Elixir — whenever a card is lost. Balm is a pick and the bot never targets; it holds it.
function drinkBrews(r) {
  if (!CLASS.brews || !isAssignPhase()) return 0;
  const kit = (S.potions || []).slice(); if (!kit.length) return 0;
  const duel = !!(S.finalMode && S.finalPhase === 'duel');
  const hpLeft = duel ? (S.dragonState ? S.dragonState.hp : 0) : (S.foeState ? S.foeState.hp : 0);
  const fresh = duel ? S.duelBeat <= 2 : !!(S.foeState && S.foeState.turn <= 1);
  const value = r ? r.value : 0, lost = !!(r && r.initLost), early = r ? (r.early || 0) : 0;
  const nearEnd = duel && (S.deck.length <= 6);
  let drank = 0;
  const drink = id => { usePotion(id); drank++; };
  for (const id of kit) {
    const p = potionById(id); if (!p || !p.brew || p.pick || (p.when && !p.when())) continue;
    const bonus = { glass: 8, glass2: 16, wildfire: 4, wildfire2: 8 }[id] || 0;
    if (id === 'quicksilver' || id === 'stillwater') { if (lost && early > 0) drink(id); }
    else if (id === 'glass' || id === 'glass2' || id === 'wildfire' || id === 'wildfire2' || id === 'ashglass') {
      const kills = hpLeft > 0 && value < hpLeft && value + bonus + (id === 'ashglass' ? 4 : 0) >= hpLeft;
      if (kills || nearEnd) drink(id);
    }
    else if (id === 'nightshade' || id === 'nightshade2' || id === 'brimstone' || id === 'brimstone2' || id === 'tar' || id === 'tar2') {
      if (fresh && hpLeft > value * 2) drink(id);
    }
    else if (id === 'elixir') drink(id);
  }
  return drank;
}
let EFFECT_WEIGHT = 1;   // 🏷️ how much the bot values an effect it would leave on the creature (0 = blind, the pre-451 bot)
  let BANK_WEIGHT = 0.6;
function setBankWeight(w) { BANK_WEIGHT = w; }
// 🔥 2026-09-01: a bank is a MULTIPLIER on next turn's effects, not deferred damage. Next turn's
// hand is unknown, so it is priced as strength × an expected turn's worth of effects, discounted.
// `EXPECT_EFFECT` is what an average arrangement leaves, in effectValue() units. 📏 Measured
// 2026-09-01 (dev/wake-probe.js, n=120): a plain turn leaves 6.65, and 21% of held wakes gutter
// (kill turn, or nothing at home) → 6.65 × 0.79 ≈ 5.
let EXPECT_EFFECT = 5;
let KNIFE_DUEL_WEIGHT = 6;   // 🔪 what a knife stuck in a dragon is worth to the one-beat duel scorer
// 🎯 WHAT AIMING AT A MINION IS WORTH (2026-09-02). The value term scores r.value the same whoever
// it lands on, so without this the bot would aim by tie-break. A dead minion is two turns of its
// attack you never soak (+ its rule); chip damage on a minion is half wasted.
function targetValue(r) {
  if (typeof cleavePlan !== 'function' || !S.foeState || !S.encounter || !S.encounter.beatFight) return 0;
  // ⚠️ FIRST CUT GRINDED: a kill bonus ON TOP of the blow's value made the bot spend a turn on a
  // minion whenever it could kill one, then pay for the extra turns in cards (pack fights 3 turns,
  // 11-25% of runs dead in them at every dial). Damage that lands on a minion did NOT land on the
  // lead, so it is charged in full; a kill earns back its attack for ~2 turns plus what its rule
  // was costing. A cleave that kills for free still reads as free; a big blow on a whelp does not.
  const lead = S.foeState; let v = 0;
  for (const p of cleavePlan(r)) {
    const b = p.body; if (b === lead) continue;
    v -= p.dmg;
    if (p.dmg >= b.hp) v += 2 * b.atk + (b.rule === 'shield' ? Math.min(6, Math.floor(lead.hp / 2)) : b.rule === 'rally' ? 2 * (PACK_RALLY || 1) : 0);
  }
  return v;
}
const bankValue = r => (r && r.banks ? BANK_WEIGHT * (r.bank || 0) * EXPECT_EFFECT : 0);
// 🏷️ WHAT AN ARRANGEMENT'S EFFECTS ARE WORTH, in the currency the scorer already trusts: damage.
// 🔴 Added 2026-09-01. Until this the bot never valued an effect — not Burn's future damage,
// not Frost's race, not Exposed's next blow, not affinity — so EVERY ladder number since build
// 436 was from a bot that never aimed one, and a blind lead understates the whole layer.
// 🔑 Priced the way the bank was priced: as DEFERRED damage / deferred safety, folded into the
// value term below outcome and below incoming damage. `EFFECT_WEIGHT` is the one dial (0 = the
// old blind bot, for an A/B). Weights are deliberately rough — this is a one-encounter scorer
// and the fight may end before a Burn ticks; the point is that the bot can now SEE the layer.
//   🔥 Burn N   → ~1.5N (halving series ~2N, discounted; lasting → 3N)
//   ❄️ Frost N  → half of what it could save: min(N, its atk) / 2
//   ⚡ Daze N   → the same
//   🪨 Exposed N → N on the next blow, discounted to 0.8N
// Affinity is already inside the preview (a resisted Burn previews as 1, a weak Frost as 4), so
// the bot reads the creature's response for free.
function effectValue(r) {
  if (!EFFECT_WEIGHT || typeof previewMarks !== 'function') return 0;
  const atk = (S.encounter && S.encounter.atk) || 0;
  let v = 0;
  for (const m of previewMarks(r)) {
    if (m.id === 'burn')        v += m.lasting ? 3 * m.n : 1.5 * m.n;
    else if (m.id === 'frost')  v += Math.min(m.n, atk) / 2;
    else if (m.id === 'daze')   v += Math.min(m.n, atk) / 2;
    else if (m.id === 'expose') v += 0.8 * m.n;
    if (m.carry) v += 0.5 * m.n;   // 💨 it lands on the next creature too
  }
  return EFFECT_WEIGHT * v;
}

// ⚠️ 2026-09-02: chainValue moved INTO the value term. As its own tuple slot it outranked damage,
// so with knives a +2 stick beat any blade — 75% tool Strikes, blades paid 3% of turns.
function chainValue(r) {
  // 🔪 2026-09-02: Momentum is gone; the rogue's chain is KNIVES. A stick is worth about a point a
  // blow for two blows (its Armour −1 while it stays in); a rip is already priced in r.value/hits.
  if (!MOMENTUM_WEIGHT || !r || !r.rogue) return 0;
  if (typeof CLASS !== 'undefined' && CLASS.knives) {
    const fx = r.rogue.effect;   // ☠️ poison ≈ 2N (never fades), 🩸 bleed ≈ 1.5N (it usually swings)
    return MOMENTUM_WEIGHT * ((r.rogue.sticks ? 2 : 0) + (fx ? (fx.id === 'poison' ? 2 : 1.5) * fx.n : 0));
  }
  const touched = (r.combatDmg || 0) + (r.early || 0) + (r.timePenalty || 0) > 0;
  const now = r.rogue.streak || 0;
  return touched ? 0 : MOMENTUM_WEIGHT * Math.min(MOMENTUM_CAP, now + 1);
}

/* ============================================================
   EMBERWICK solver bot — a TUNING INSTRUMENT, not a game feature.
   Runs in the same global scope as game.js, so it scores plays through
   the REAL computeAction() — the bot and the game can never disagree.

   It brute-forces every role assignment (Spell/Catalyst/Surge/Arsenal +
   boost target) of sampled hands against every encounter, finds the
   optimal play, and aggregates the questions from Solver_Bot.md — above
   all: is the Attune a genuine CHOICE, or attuned-or-bust?

   Hardships are excluded here — we measure the clean turn puzzle; the
   Hardship axis is separate.
   ============================================================ */

const SOLVER = (() => {
  // ⚠️ THE CLASS'S OWN TABLE, not CARD_DEFS. This only feeds the per-hand analyser (RUNSIM deals
  // real decks), but a second stale copy of "what a card is" is exactly the bug that let the bot
  // ignore placement bans and keep aiming at a cut Emberwake target. One source, always.
  const DEFS = () => CLASS.defs || CARD_DEFS;
  const NDEF = () => DEFS().length;
  const OUTCOME_RANK = { Complete: 2, Narrow: 1, Loss: 0 };

  // ---- build a hand of distinct card defs at a given level ----
  function mkCard(defIndex, level) {
    const c = newCard(DEFS()[defIndex]);
    c.level = Math.min(level, MAX_LEVEL);
    return c;
  }
  function randomHand(level) {
    const idx = [];
    while (idx.length < HAND_SIZE) {
      const r = Math.floor(Math.random() * NDEF());
      if (!idx.includes(r)) idx.push(r);
    }
    return idx.map(i => mkCard(i, level));
  }

  // 🗡️ TEACHING THE BOT TO VALUE A CHAIN (2026-08-12) — and this is a POLICY, not a fact.
  //
  // ⚠️ THE PROBLEM IT SOLVES IS FATAL WITHOUT IT. This bot scores ONE encounter. The rogue's whole
  // source of power pays off NEXT turn (the chain sets hits and Initiative), so a one-encounter
  // scorer values every chain at exactly zero and plays the rogue as a worse mage. Measured before
  // this existed: it continued a chain on 17% of turns, entirely by accident. Every rogue number
  // taken that way is noise, which is why this had to come before any tuning.
  //
  // 🔑 BUT A BOT POLICY CAN INVERT WHAT YOU MEASURE (the 2026-08-05 stir-band lesson: a sweep read
  // backwards purely because of how the bot picked). So the weight is ONE named constant, it sits
  // BELOW outcome and damage in the lexicographic order — a chain is never worth losing an
  // encounter for — and every number produced with it must be reported alongside MOMENTUM_WEIGHT = 0.
  // (MOMENTUM_WEIGHT and chainValue live at the TOP of this file — see the note there. There are two
  // scorers in here and putting it in one of them is how the last three of these bugs happened.)

  // ---- score a computeAction result: [outcomeRank, -damage, -loseReserve, chain, value] ----
  function fightScore(r) {
    const dmg = (r.early || 0) + (r.combatDmg || 0) + (r.poison || 0) + (r.stormDmg || 0);
    return [OUTCOME_RANK[r.outcome], -dmg, r.loseReserve ? -1 : 0, r.value + effectValue(r) + chainValue(r)];
  }
  function journeyScore(r) {
    const pen = (r.timePenalty || 0) + (r.treacherousDmg || 0) + (r.stormDmg || 0);
    return [OUTCOME_RANK[r.outcome], -pen, r.nightCaught ? -1 : 0, chainValue(r), r.value];
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

    // One card per slot: every choice of Spell x every arrangement of the rest. `enhUsed` is
    // read straight off the result, so the attune metrics below (availability, obligation,
    // "does attuning buy a whole outcome tier") come back to life with the rule itself.
    // 🔍 the one search; the analyser keeps EVERY play, not just the best
    searchArrangements({ hand, legal: false, duel: false, boostTargets, arms: [undefined], score: scoreOf, better,
      collect: e => plays.push({ r: e.r, score: e.sc, enhUsed: !!e.r.enhUsed,
                                 wickName: e.spell.def.name, usedTinder: !!e.tinder, boostTarget: e.bt }) });
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
      attuneAvail: 0, bestAttunes: 0,
      attuneRequiredTier: 0,   // among attune-avail: best tier > best-unattuned tier
      attuneOptional: 0,       // among attune-avail: unattuned reaches same tier
      noAttuneLoss: 0,         // among NO-attune-avail hands: best is a Loss
      noAttuneHands: 0,
      tinderPlays: 0, offAxisBoost: 0, // Initiative (fights) / Pace (journeys) chosen at best
      nightCaught: 0,          // journeys only
      wick: {},                // wickName -> count in best play
    };
    for (let h = 0; h < N; h++) {
      const hand = randomHand(level);
      const plays = enumerate(hand, encounter);
      const best = bestOf(plays, null);
      const attuneAvail = plays.some(p => p.enhUsed);
      m.wick[best.wickName] = (m.wick[best.wickName] || 0) + 1;
      if (best.usedTinder && best.boostTarget === (isFight ? 'Initiative' : 'Pace')) m.offAxisBoost++;
      if (best.usedTinder) m.tinderPlays++;
      if (!isFight && best.r.nightCaught) m.nightCaught++;

      if (attuneAvail) {
        m.attuneAvail++;
        if (best.enhUsed) m.bestAttunes++;
        const bestUnattuned = bestOf(plays, p => !p.enhUsed);
        const bestTier = best.score[0];
        const unkTier = bestUnattuned ? bestUnattuned.score[0] : -1;
        if (bestTier > unkTier) m.attuneRequiredTier++;   // Attune buys a whole outcome tier
        else m.attuneOptional++;                          // unattuned reaches the same tier
      } else {
        m.noAttuneHands++;
        if (best.score[0] === 0) m.noAttuneLoss++;
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

  // ---- aggregate the headline attuned-or-bust numbers ----
  function headline(sweep, type) {
    let avail = 0, best = 0, req = 0, opt = 0, noAttune = 0, noAttuneLoss = 0, total = 0;
    for (const rg of sweep.perRegion)
      for (const m of rg.encounters) {
        if (m.type !== type) continue;
        total += m.N; avail += m.attuneAvail; best += m.bestAttunes;
        req += m.attuneRequiredTier; opt += m.attuneOptional;
        noAttune += m.noAttuneHands; noAttuneLoss += m.noAttuneLoss;
      }
    return {
      total,
      pctAvail: pct(avail, total),
      pctBestAttunes: pct(best, avail),
      pctRequired: pct(req, avail),      // OBLIGATION INDEX — high = attuned-or-bust
      pctOptional: pct(opt, avail),      // healthy — attune is a choice
      pctNoAttune: pct(noAttune, total),
      pctNoAttuneLoss: pct(noAttuneLoss, noAttune),
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
    html += `<h2>Attuned-or-bust — the core question</h2>`;
    html += `<table class="head"><tr><th>Metric</th><th>Fights L2</th><th>Fights L4</th><th>Journeys L2</th><th>Journeys L4</th><th>Reading</th></tr>`;
    const rows = [
      ['Attune available in hand', 'pctAvail', 'higher = easy to match'],
      ['Best play Attunes', 'pctBestAttunes', 'of hands where it was available'],
      ['⚠️ Attune REQUIRED for tier', 'pctRequired', 'the OBLIGATION INDEX — high = bust'],
      ['✅ Attune optional (choice)', 'pctOptional', 'unattuned reaches the same tier'],
      ['No Attune available', 'pctNoAttune', 'stuck-unattuned hands'],
      ['…and it forces a Loss', 'pctNoAttuneLoss', 'of those stuck hands'],
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
    html += `<div class="interp"><b>How to read the obligation index:</b> it's the % of hands (where a Attune was available) in which taking the Attune buys a whole outcome tier over the best un-Attuned play. ` +
      `<b>&gt;60% ≈ attuned-or-bust</b> (the puzzle is "match or lose"). <b>&lt;25% ≈ healthy</b> (Attune is optimization you usually could skip). Middle = nuanced.</div>`;

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
      html += `<h3>${rg.region}</h3><table><tr><th>Encounter</th><th>Attune avail</th><th>Best Attunes</th><th>Obligation</th><th>Top Spell</th></tr>`;
      for (const m of rg.encounters) {
        const topWick = Object.entries(m.wick).sort((a, b) => b[1] - a[1])[0];
        const oblig = m.attuneAvail ? Math.round(m.attuneRequiredTier / m.attuneAvail * 100) : 0;
        html += `<tr><td>${m.type === 'fight' ? '⚔️' : '👣'} ${m.name}</td>` +
          `<td>${SOLVER_pct(m.attuneAvail, m.N)}%</td>` +
          `<td>${SOLVER_pct(m.bestAttunes, m.attuneAvail)}%</td>` +
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
// ══════════════════════════════════════════════════════════════════════════════════════════
// 🔍 THE ONE ARRANGEMENT SEARCH (extracted 2026-09-02). There were FOUR copies of this loop —
// the analyser's `enumerate`, RUNSIM's `pickArrangement` (dead), `chooseBestOnce` (the road) and
// `chooseBestDuel` (the finale) — and every rule that had to reach the bot was patched into them
// one at a time: the placement bans twice, the Arsenal three times, `bankArmed` never reached the
// duel at all while the mage's numbers were quoted as measurements of her. 🔑 A rule the search
// cannot see is a rule the instrument cannot measure — so the search is ONE function now, and
// packs + targeting (the next dimension) get added HERE and nowhere else.
//
// ⚠️ IDENTITY-PRESERVING: each caller's enumeration ORDER and SET are exactly what its copy did,
// so ties fall the same way and `dev/identity.js` is bit-identical. Two shapes remain:
//   road  — spell × spark × tinder × ember over [null, ...rest], placement bans optional, every
//           slot the hand can fill must be filled (a player cannot decline the Arsenal)
//   duel  — spark/tinder drawn from what is left, the Arsenal is the best-boost leftover (not
//           enumerated), no bans. ⚠️ A quirk kept deliberately for identity; normalising it is a
//           measured change, not a refactor.
function forEachArrangement(hand, o, fn) {
  const ok = (c, z) => !o.legal || !c || slotLegal(c.id, z);
  const n = hand.length;
  for (let w = 0; w < n; w++) {
    const spell = hand[w], rest = hand.filter((_, i) => i !== w);
    if (!ok(spell, 'Spell')) continue;
    if (o.duel) {
      const full = n >= 3;
      for (const spark of (full ? rest : [null, ...rest])) {
        const after = rest.filter(c => c !== spark);
        for (const tinder of (full ? after : [null, ...after])) {
          const left = after.filter(c => c !== tinder);
          const ember = left.slice().sort((a, b) => eff(b).boost - eff(a).boost)[0] || null;
          fn(spell, spark, tinder, ember);
        }
      }
      continue;
    }
    const opts = [null, ...rest];
    for (const spark of opts) for (const tinder of opts) {
      if (tinder && tinder === spark) continue;
      if (!ok(spark, 'Element') || !ok(tinder, 'Boost')) continue;
      for (const ember of opts) {
        if (ember && (ember === spark || ember === tinder)) continue;
        if (!ok(ember, 'Reserve')) continue;
        // 🔑 A BOT THAT CAN DECLINE A RULE THE PLAYER CANNOT DECLINE IS NOT PLAYING THE GAME —
        // every slot the hand can fill is filled (the empty-Arsenal blind spot, 2026-08-18).
        if ([spell, spark, tinder, ember].filter(Boolean).length < Math.min(4, n)) continue;
        fn(spell, spark, tinder, ember);
      }
    }
  }
}
// o = { hand, legal, duel, boostTargets, arms, score(r), better(a, b), collect?(entry) }
// `arms` carries `S.bankArmed` as a DIMENSION (per-turn state, not part of the arrangement — the
// option is unreachable however it is scored unless the search walks it); `undefined` leaves it.
// Returns the best entry; `collect` sees every one (the analyser wants the whole distribution).
function searchArrangements(o) {
  let best = null;
  forEachArrangement(o.hand, o, (spell, spark, tinder, ember) => {
    for (const bt of o.boostTargets) for (const arm of o.arms) for (const t of (o.targets || [undefined])) for (const rip of (o.rips || [undefined])) for (const stance of (o.stances || [undefined])) for (const fk of (o.forks || [undefined])) for (const brew of (o.brews || [undefined])) for (const mk of (o.marks || [undefined])) {
      S.assign = { Spell: spell.id, Element: spark ? spark.id : null,
                   Boost: tinder ? tinder.id : null, Reserve: ember ? ember.id : null };
      S.boostTarget = bt; if (arm !== undefined) S.bankArmed = arm;
      if (t !== undefined) S.foeTarget = t;       // 🎯 packs: which body the Spell is aimed at
      if (rip !== undefined) S.ripArmed = rip;    // 🔪 the rogue: rip the knives out, or leave them
      if (stance !== undefined) S.guardStance = stance;   // 🛡️ the Guardian: brace or taunt
      if (brew !== undefined) S.stillArmed = brew;         // ⚗️ the Alchemist: fire it or throw it in
      if (mk !== undefined) S.markArmed = mk;              // 🏹 the Ranger: loose it or mark with it
      if (fk !== undefined) S.forkOn = fk;                 // 🎲 the generic fork (Berserker and every class after)
      const r = computeAction(ember); if (!r) continue;
      const sc = o.score(r);
      if (o.collect) o.collect({ r, sc, spell, spark, tinder, ember, bt, arm, t, rip, stance, brew, mk, fk });
      if (!best || o.better(sc, best.sc)) best = { assign: { ...S.assign }, bt, arm, t, rip, stance, brew, mk, fk, sc };
    }
  });
  return best;
}

const RUNSIM = (() => {
  const OUT = { Complete: 2, Narrow: 1, Loss: 0 };
  // 🗡️ chainValue() is shared with the analyser's scorer — see the note at the top of this file.
  // ⚔️ THE LAST MILE'S SECOND RACE (2026-08-21). ⚠️ TEACH IT OR THE MEASUREMENT IS A LIE: the bot
  // scores ONE encounter, and the Approach band pays entirely into the DUEL — a softened shape and
  // an opening blow it will never see from here. Left untaught, the bot maximises Move alone,
  // always arrives loud, and every number we then took would report the penalty as unavoidable
  // and the boon as unreachable. Same class of error as the bot that never carried an Arsenal.
  //
  // 🔑 The terms are stated in the currencies this file already trusts: the rouse is DAMAGE (it is
  // soaked, exactly like combat damage, so it belongs in the existing penalty term), and being
  // unseen is one rank below that. approachValue/UNSEEN_WEIGHT live at the TOP of this file.
  const scoreOf = r => r.type === 'fight'
    ? [OUT[r.outcome], -((r.early || 0) + (r.combatDmg || 0) + (r.poison || 0) + guardDmg(r)), r.value + bankValue(r) + effectValue(r) + targetValue(r) + chainValue(r) + brewValue(r) + markValue(r) + forkValue(r)]
    : [OUT[r.outcome], -((r.timePenalty || 0) + (r.treacherousDmg || 0) + (r.stormDmg || 0) + (r.rouse || 0)),
       approachValue(r), r.value + bankValue(r) + chainValue(r)];
  // 🏹 the Ranger prices a Mark honestly: what the NEXT blow would have lost to the shape (a bot that scores one encounter still sees this, because the creature is the same creature next turn)
  const markValue = r => (r.ranger && r.ranger.marks && !r.ranger.onMark) ? MARK_WEIGHT * (r.ranger.worth || 0) : 0;
  // 🎲 a class after the Ranger states its own price for its fork (the Berserker: the race it may lose)
  const forkValue = r => (r.klass && r.klass.botValue) || 0;
  // ⚗️ the Alchemist prices a reagent thrown in: BREW_WEIGHT, doubled when it completes a brew (the bot cannot price the potion itself — it DRINKS every brew at once, see drinkBrews)
  const brewValue = r => (r.alchemist && r.alchemist.throws) ? BREW_WEIGHT * (r.alchemist.brews ? 2 : 1) : 0;
  // 🛡️ the Guardian prices her fork: a brace TURNS damage, a taunt FEEDS it (WRATH_WEIGHT of it comes back as a blow)
  const guardDmg = r => !r.guardian ? 0 : r.guardian.taunt ? -Math.min(r.early || 0, TAUNT_FREE) : -Math.min(r.early || 0, r.guardian.brace || 0);
  const better = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] > b[i]; } return false; };
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

  // pick + assign the best play for the current encounter (mutates S.assign/boostTarget only)
  // the arrangement search, factored out so anything can ask "how good is this hand?" — its only
  // caller (the Prism's bot policy) went with the rule on 2026-08-05, but it stays exported
  // because "score this hand" is the question every future card-selection experiment starts from
  // ❌ pickArrangement() deleted 2026-09-02 — it had no callers and was the second copy of the search.

  // 🗺️ ROUTE VALUE. What a node is worth to a route, in the crude terms a bot can price.
  // ⚠️ The bot still cannot price the FUTURE well (it scores one encounter at a time), so these
  // are deliberately blunt: a shop is worth a lot, a hearth is worth a lot when the candle is out,
  // an elite is worth its coins minus the risk of the deck it costs.
  function nodeValue(n) {
    if (n.type === 'wheel')  return S.coins >= 6 ? 9 : 4;
    if (n.type === 'hearth') return S.candle ? 1 : 6;
    if (n.type === 'elite')  return (S.hand.length + S.deck.length) > 9 ? 4 : 0;
    if (n.type === 'event')  return 2;
    return 2.2;                                   // a normal encounter still pays coins
  }

  // 🗺️ best route from each reachable node to the top, by dynamic programming up the floors.
  // Returns the immediate step that begins the best route.
  function mapRoute(m, opts) {
    if (typeof revealMap === 'function') revealMap();   // 🕯️ what the party can see from here
    // ⚠️ THE MAP'S OWN HEIGHT AND WIDTH, never the globals — the tutorial's map is 8×2 while
    // MAP_FLOORS/MAP_COLS say 16×5, and `F[f][c]` on a floor that does not exist throws before the
    // bot has routed a single node. **Fourth reader of this same mistake today** (solver's
    // `REGIONS.length`, the map render's two, and now this).
    // 🔑 THE RULE, STATED ONCE PROPERLY: **if the object in your hand knows its own size, never
    // ask the global.** Every one of these was invisible until something stopped being the default
    // shape — which is exactly when a hardcoded default is most expensive.
    const F = m.floors, best = {};
    for (let f = F.length - 1; f >= 0; f--) {
      for (let c = 0; c < F[f].length; c++) {
        const n = F[f][c]; if (!n) continue;
        let onward = 0;
        for (const nc of n.next) {
          const t = F[f + 1] && F[f + 1][nc];
          if (t && best[t.f + ',' + t.c] > onward) onward = best[t.f + ',' + t.c];
        }
        // 🕯️ THE BOT SEES ONLY WHAT A PLAYER COULD (build 467): an unseen node is worth a plain encounter
        best[f + ',' + c] = ((typeof nodeSeen === 'function' && !nodeSeen(n)) ? nodeValue({ type: 'normal', kind: 'fight', next: [], enc: null }) : nodeValue(n)) + onward;
      }
    }
    return opts.slice().sort((a2, b2) =>
      (best[b2.f + ',' + b2.c] || 0) - (best[a2.f + ',' + a2.c] || 0))[0];
  }

  // ⚠️ how many of the four slots this arrangement actually fills

  function chooseBestOnce() {
    // 🔥 aim any Emberwake we're holding. ⚠️ The bot can never BANK one: it scores a single
    // encounter, so giving up boost now for a token later is always negative to it — exactly the
    // blind spot it has about the Spell being spent. Banking rates from RUNSIM are therefore
    // meaningless; only a human can price the future.
    // ❌ the Prism's bot policy was deleted with the rule (2026-08-05) — a rainbow hand is now
    // simply a hand that cannot attune, and the bot plays it the same way it plays any other.
    const isFight = S.encounter.type === 'fight';
    const best = searchArrangements({ hand: S.hand, legal: true, duel: false,
      boostTargets: isFight ? ['Attack', 'Initiative'] : ['Move', 'Pace'],
      arms: CLASS.emberwake ? [false, true] : [false], score: scoreOf, better,
      targets: (typeof packTargets === 'function') ? packTargets() : [undefined],
      rips: CLASS.knives ? [false, true] : [undefined], stances: CLASS.stances ? ['taunt', 'brace'] : [undefined], brews: CLASS.brews ? [false, true] : [undefined], forks: CLASS.fork ? [false, true] : [undefined], marks: CLASS.marks ? [false, true] : [undefined] });
    S.ripArmed = false;
    if (best && best.t !== undefined) S.foeTarget = best.t;
    if (best && best.rip !== undefined) S.ripArmed = !!best.rip;
    if (best && best.stance !== undefined) S.guardStance = best.stance;
    if (best && best.brew !== undefined) S.stillArmed = !!best.brew;
    if (best && best.mk !== undefined) S.markArmed = !!best.mk;
    if (best && best.fk !== undefined) S.forkOn = !!best.fk;
    S.bankArmed = false;
    if (best) { S.assign = best.assign; S.boostTarget = best.bt; S.bankArmed = !!best.arm; }
    return best ? best.sc : null;
  }

  // 🗡️ THE ROGUE'S MOMENTUM POLICY (rewritten 2026-08-17 with the streak).
  //
  // ⚠️ THE TARGET LOOP IS GONE BECAUSE THE SPEND IS GONE. It used to run the whole search once per
  // spend target (null / 💨 / 🎯) because the target changed Initiative and therefore changed which
  // arrangement was best at all. Momentum is not spent any more — it is a passive ⚡ discount that
  // `rogueMath()` already reads off S.momentum — so a single search is correct again.
  //
  // ⚠️ KEEP THE HISTORY, because the lesson outlived the code: setMoTarget() was a UI call, so the
  // bot could never spend, and it reported HELD on 100% of turns for a week. That was the THIRD
  // confident number this instrument produced about something it structurally could not do, after
  // the Emberwake bank and the placement bans.
  // 🔑 BEFORE QUOTING HOW OFTEN THE BOT DOES A THING, CHECK THAT IT CAN.
  //
  // ⚠️ And the discount reaches the search for free ONLY because it lives in rogueMath() rather
  // than in a UI handler — the same reason `slotLegal` had to move before the bans could be seen.
  function chooseBest() { chooseBestOnce(); }

  // ---- duel play evaluation: computeAction gives the raw strike (dragon armor []),
  // so we simulate resolveDuel's shield/HP math here WITHOUT mutating dragonState ----
  function evalDuelPlay(r) {
    const ds = S.dragonState;
    // reuse the GAME's own shape math rather than restating it - the 2026-07-06 lesson was that a
    // forked copy of the duel maths drifts, and the bot then reports a game we are not shipping.
    const st = duelStrike(r);
    const hpAfter = Math.max(0, ds.hp - st.toHp);
    const kill = hpAfter <= 0;
    const counter = kill ? 0 : duelCounter(hpAfter);
    const incoming = kill ? 0 : (r.early || 0) + counter;
    // 🔥 CHANNELLING IS WORTH MOST HERE AND THE BOT COULD NOT DO IT (fixed 2026-08-22).
    // A banked Emberwake is dead weight to a scorer that only looks at THIS beat — but the duel is
    // the one fight long enough to cash it, so omitting it did not just under-rate the option, it
    // deleted the mage's entire slot ② from the only fight that decides a run.
    // The bank term sits BELOW kill and damage, so it is a tie-break: channel when this beat is
    // already decided. ⚠️ Report any number produced with it alongside BANK_WEIGHT = 0.
    // 🔑 IN A DUEL A BANKED WAKE **IS** DEFERRED DAMAGE, so it belongs INSIDE the damage term,
    // not as a tie-break below it. Next beat is guaranteed here in a way the road's next encounter
    // never is — that is the whole reason channelling is worth more in the finale, and a
    // lexicographic tie-break could only ever find it on an exact tie (1 beat in 278, measured).
    // 🔪 A STICK IN THE DUEL IS DEFERRED VALUE — the next beat is guaranteed, so a knife (Armour −1,
    // Initiative −1, for the rest of the fight) is priced INSIDE the damage term like the bank, or
    // the one-beat scorer never opens with a tool (measured: 0.6 sticks a duel, race lost 74%).
    const knifeDuel = (r.rogue && r.rogue.sticks && !kill) ? KNIFE_DUEL_WEIGHT : 0;
    return [kill ? 1 : 0, st.toHp + bankValue(r) + effectValue(r) + knifeDuel, -incoming];
  }
  // 🚨 THIS IS THE **FOURTH** COPY OF THE ARRANGEMENT SEARCH, and it is the one that proves the
  // point the other three keep making. It silently omitted `bankArmed` AND the wake's aim, so the
  // mage fought every dragon in the game without her slot ② while her numbers were quoted as
  // measurements of her. 🔑 EXTRACT THESE FOUR. Until then: anything added to the search must
  // be added HERE TOO.
  function chooseBestDuel() {
    const best = searchArrangements({ hand: S.hand, legal: false, duel: true,
      boostTargets: ['Attack', 'Initiative'], arms: CLASS.emberwake ? [false, true] : [false],
      rips: CLASS.knives ? [false, true] : [undefined], forks: CLASS.fork ? [false, true] : [undefined], score: evalDuelPlay, better });
    S.ripArmed = false;
    if (best && best.rip !== undefined) S.ripArmed = !!best.rip;
    if (best && best.stance !== undefined) S.guardStance = best.stance;
    if (best && best.brew !== undefined) S.stillArmed = !!best.brew;
    if (best && best.mk !== undefined) S.markArmed = !!best.mk;
    if (best && best.fk !== undefined) S.forkOn = !!best.fk;
    S.bankArmed = false;
    if (best) { S.assign = best.assign; S.boostTarget = best.bt; S.bankArmed = !!best.arm; }
  }
  const allCards = () => [...S.hand, ...S.deck, ...S.discard];
  // crude "how much card is this" for the stack heuristic — its best single number
  const bigness = c => { const e = eff(c); return Math.max(e.attuned || 0, e.value || 0); };

  // 📏 MEASUREMENT HOOKS. measure.js attaches here rather than forking autoRun — the 2026-07-06
  // lesson (a forked copy of the duel maths drifts, and then the bot reports a game we are not
  // shipping) applies just as hard to a forked copy of the RUN loop.
  let HOOK = {};
  function setHook(h) { HOOK = h || {}; }

  // 🛡️ THE BOT NEVER PRESSED AN ACTIVE PIECE (fixed 2026-08-27). `useArmour` appeared NOWHERE in
  // this file, so 🔥 Emberfist Wraps, ✦ Emberwake Band, 🗡️ Fangcord, 🎯 Twinned Bracers and
  // 👢 Anvil Toad Boots were all measured as PURE BLOCK LOSS — they carry block 0 or trade a
  // starter's block for an effect the bot could not use.
  // 🔑 SAME FAULT, FOURTH TIME: the ✦ Arsenal it never carried, the 🔥 Emberwake it could never
  // bank, the class it silently reset. **Check the bot is ALLOWED to do a thing before reporting
  // how often it does it** — and a piece scored at 0 by a bot that cannot press it is not weak,
  // it is unmeasured.
  // ⚠️ THE POLICY IS DELIBERATELY SIMPLE AND STATED: press an active only when it IMPROVES THIS
  // ENCOUNTER'S OUTCOME. That makes every active measurable, and it is still a FLOOR — a human
  // saving a once-a-run effect for the dragon is doing something this cannot model, exactly as
  // with the Emberwake.
  function useArmourActives() {
    const rank = { Loss: 0, Narrow: 1, Complete: 2 };
    let guard = 0;
    for (;;) {
      if (guard++ > 4) break;
      const before = computeAction(cardById(S.assign.Reserve));
      const now = before ? (rank[before.outcome] || 0) : 0;
      let best = null;
      for (const a of (S.armour || [])) {
        const d = armourDef(a.id);
        if (!d || !d.use || !armourReady(a)) continue;
        const snap = { strike: S.armourStrike, pace: S.armourPace, split: S.splitPending,
                       win: S.armourWinInit, twin: S.armourTwin, mo: S.momentum };
        useArmour(a.id);
        const after = computeAction(cardById(S.assign.Reserve));
        const gain = after ? (rank[after.outcome] || 0) - now : -1;
        // put it back unless it earned its place — armourReady() reads uses, so restore those too
        if (gain > 0) { best = a.id; break; }
        S.armourStrike = snap.strike; S.armourPace = snap.pace; S.splitPending = snap.split;
        S.armourWinInit = snap.win; S.armourTwin = snap.twin; S.momentum = snap.mo;
        if (d.charge) a.charge = 1; else a.uses++;
        if (d.consume && !S.armour.includes(a)) S.armour.push(a);
      }
      if (!best) break;
    }
  }

  let rungCursor = 0;
  function autoRun(withEvents) {
    // dragons are a LADDER now, so a random draw would under-sample the hard rungs. Round-robin
    // every rung so perDragon is an even read on all four.
    rungCursor = (rungCursor % DRAGONS.length) + 1;
    // 🔴 WALK THE PLAYER'S ENTRY PATH (fixed 2026-08-24). This called `freshGame()` directly,
    // which lands on the MAP - so 🏕️ SETTING OUT, which `startStage()` opens, was never reached.
    // Measured: rollSetout 0 times and pickSetout 0 times across five runs. **The first screen of
    // every run has been invisible to the instrument since it shipped on 2026-08-05**, and the
    // 'setout' branch below has never once executed.
    // 🔑 THIRD TIME FOR THIS EXACT SHAPE: the tutorial brief (`introNext`), the ✦ Arsenal the bot
    // never carried, and now the opening pick. **A phase that only the real entry path creates is
    // invisible to a bot that starts further in** - and it always looks like the phase is fine,
    // because nothing errors. ⚠️ *An audit that does not walk the player's entry path has not
    // audited it* was written for the tutorial; it is a rule about every entry point.
    // ⚠️ startStage() calls render(), which RUNSIM.run() stubs; it is a no-op here either way.
    if (typeof startStage === 'function') startStage(rungCursor); else freshGame(rungCursor);
    const m = { turns: 0, firstL4: null, events: 0, regionAvg: [], regionMax: [],
                win: null, dragon: null, duelBeats: 0, approachClean: false, dragonHPleft: null };
    let g = 0;
    while (g++ < 800) {
      const p = S.phase;
      // 📏 the LAIR — the deck you actually fight the dragon with, after the road has taken its cut
      if (HOOK.onLair && S.finalMode && S.finalPhase === 'duel' && !m._lair) { m._lair = true; HOOK.onLair(m); }
      if (p === 'assign') {
        if (S.finalMode && S.finalPhase === 'duel') {
          chooseBestDuel();
          if (drinkBrews(computeAction(cardById(S.assign.Reserve)))) chooseBestDuel();   // ⚗️ a brew changed the turn — arrange again
          if (HOOK.onDuelAssign) HOOK.onDuelAssign(m); resolveDuel();
        }
        else {
          chooseBest();
          if (drinkBrews(computeAction(cardById(S.assign.Reserve)))) chooseBest();
          useArmourActives(); if (HOOK.onAssign) HOOK.onAssign(m); resolve();
        }
        m.turns++;
      }
      else if (p === 'reveal') advanceBeat();
      // 🃏 THE STACK — order the spent set under the deck. Bot heuristic: send the BIGGEST
      // cards back first so they return soonest (a human stacks for a plan; this is the
      // simplest defensible proxy, and it at least beats leaving the order to chance).
      else if (p === 'stack') {
        const st = S.stack;
        const pool = st.ids.filter(id => !st.order.includes(id)).map(id => cardById(id)).filter(Boolean);
        // 📏 the stack POLICY is switchable so measure.js can A/B it. If ordering the returned
        // cards never moves a run-level number, the Stack is decoration and should be told so.
        // 🃏 under Reversed the Stack has a SECOND axis. Bot policy: send the biggest card up
        // (it wants it again next hand) and everything else down — a plausible human split, and
        // one that never degenerates into "all top", which is the trap the charm now allows.
        const rev = hasCharm('reversed');
        const pol = HOOK.stackPolicy || 'big';
        const next = pol === 'random' ? pool[Math.floor(Math.random() * pool.length)]
          : pol === 'small' ? pool.slice().sort((a, b) => bigness(a) - bigness(b))[0]
          : pool.slice().sort((a, b) => bigness(b) - bigness(a))[0];
        if (!next) break;
        if (rev) stackPick(next.id, st.order.length === 0 ? 'top' : 'bottom');
        else stackPick(next.id);
      }
      // 🛡️ SOAK: ARMOUR FIRST, THEN THE FATTEST CARD.
      // ⚠️ A BOT THAT CANNOT USE A THING THE PLAYER CAN IS NOT PLAYING THE GAME — the mirror of
      // the 2026-08-10 finding that a bot which could DECLINE a rule the player cannot made
      // ⛰️ Steep, 🌙 Nightfall and ❄️ Freeze all measure as free. Leave armour out of this line and
      // every plate in the game measures as decoration.
      // 🔑 THE POLICY, AND IT IS A POLICY: armour before cards, because a card blunted is a
      // permanent loss of deck-health and a piece spent only costs this run. Reported against the
      // no-armour build. It is deliberately the SIMPLE reading — a human weighing *break a piece or
      // blunt a card* against the encounters still to come is doing something this cannot model.
      else if (p === 'soak') {
        const a = armourEligible().slice().sort((x, y) => armourBlock(y) - armourBlock(x))[0];
        if (a) { soakWithArmour(a.id); continue; }
        const c = soakEligible().slice().sort((x, y) => soakValue(y) - soakValue(x))[0];
        if (c) soakWith(c.id); else break;
      }
      // 🔼 SHARPEN — free choice from hand now (the Wheel stopped selling levels 2026-08-05).
      // Bot policy: buy the most expensive card it can afford, i.e. sharpen the sharpest, then stop.
      else if (p === 'upgrade') {
        const up = S.hand.filter(c => upgradable(c)).sort((a, b) => eff(b).cost - eff(a).cost)[0];
        if (up) buyUpgrade(up.id); else doneUpgrades();
      }
      // THE WHEEL (replaced the upgrade menu). Bot policy: never re-spin (coins bank fine),
      // buy the best affordable offer — upgrade > repair > charm — then close.
      else if (p === 'wheel') {
        const w = S.wheel;
        // ⚠️ the Wheel now sells CHARMS and POTIONS only. The bot never DRINKS a potion (it
        // scores one encounter and cannot price a saved consumable), so potion buys are noise to it.
        // ⚠️ THE BOT NEVER BUYS A 📜 CONTRACT. It scores one encounter and cannot price a promise
        // about the next three, so it bought 6 a run and kept 1.4 — pure noise that dragged every
        // stage number down by ~8 points. Same blind spot as the Emberwake bank and Unspent:
        // anything paying off in the FUTURE reads as a cost to it. Contract value is a feel
        // question and only a human answers it.
        const rank = { charm: 3, potion: 1 };
        const buyable = w.offers
          .map((o, i) => ({ o, i }))
          .filter(x => x.o && x.o.kind !== 'none' && !x.o.bought && x.o.cost <= S.coins)
          .filter(x => x.o.kind !== 'potion' || (S.potions || []).length < POTION_CAP)
          .filter(x => x.o.kind !== 'contract')
          .sort((a, b) => (rank[b.o.kind] || 0) - (rank[a.o.kind] || 0));
        if (buyable.length) { m.buys = (m.buys || 0) + 1; wheelBuy(buyable[0].i); }
        else {
          // 🛒 ONE SHOP (2026-08-10) — sharpening happens on this screen now, not on a second one
          // after it. ⚠️ The 'upgrade' phase no longer fires, so a bot that only sharpened there
          // would silently stop buying levels entirely and report a game nobody plays. Same policy
          // as before: buy the most expensive card it can afford, then close.
          // 🐛 ...AND IT MUST ASK WHETHER SHARPENING IS EVEN OPEN (fixed 2026-08-22, same day it
          // broke). ⏳ A Time Penalty now shuts the forge, so `buyUpgrade` began silently
          // returning early — the bot never reached wheelDone(), the phase never advanced, and the
          // run spun until the 800-step guard killed it. Measured: **489 of 600 runs ended in the
          // 'wheel' phase**, and every run-level number taken between the two changes was noise.
          // 🔑 A PLAYER WAS NEVER STUCK — the Wheel's "Move on" button is unconditional. This is
          // the bot-only half of the same bug class as the never-carried Arsenal: *a rule the
          // engine enforces silently is a rule the instrument cannot see it has hit.*
          const up = canSharpenNow()
            ? S.hand.filter(cc => upgradable(cc)).sort((a, b) => eff(b).cost - eff(a).cost)[0]
            : null;
          if (up) buyUpgrade(up.id);
          else {
            // 🙌 TWO-HANDED: this shelf is done — step the other character up before Move on, once
            if (typeof isTwoHanded === 'function' && isTwoHanded()) {
              S.wheel.botSeen = true;
              const other = S.hands.findIndex((h, i) => i !== S.handIdx && !(h.wheel && h.wheel.botSeen));
              if (other >= 0) { swapHand(other); continue; }
            }
            wheelDone();
          }
        }
      }
      // 🗺️ THE MAP. ⚠️ Same rule as every other phase: teach it or autoRun silently breaks.
      // Bot policy: a greedy one-step preference over node TYPES, which is all a node advertises.
      // ⚠️ IT IS A FLOOR, NOT A CEILING, AND THE GAP MATTERS MORE HERE THAN ANYWHERE ELSE. A map's
      // whole value is ROUTING - looking 15 floors ahead and planning - and a one-step greedy bot
      // cannot route at all. Measured separately: a player who routes for the Wheel reaches ~2.1 a
      // run against a random walk's 0.9. **Whatever this bot scores, a human who plans scores more,
      // so treat every map number as a LOWER bound.**
      else if (p === 'map') {
        const opts = mapChoices(S.map);
        if (!opts.length) { backToMap(); continue; }
        // 🔑 THE BOT ROUTES. Its first version picked the best NEXT node, which is not what a map
        // asks - and it measured what a random walk gets (🎰 0.9 a run) rather than what a player
        // who plans gets (2.1). Every map number taken with it was ~9 points too low.
        // ⚠️ THE THIRD TIME TODAY: an instrument that cannot DO the thing cannot measure it.
        // This walks the whole map with a DP, maximising the value of the route ahead, then takes
        // the first step of the best route - recomputed every step, so it re-plans as it learns.
        const best = mapRoute(S.map, opts);
        if (HOOK.onMap) HOOK.onMap(m, opts, best);
        takeMapNode(best.f, best.c);
      }
      // 🕯️ THE HEARTH FORK. Bot policy: take the LIGHT when the candle is out and the road
      // ahead still matters, otherwise work the coals. ⚠️ It cannot price information well - the
      // candle pays off a step later and this bot scores one encounter - so it will UNDER-take the
      // light. Same blind spot as the Emberwake bank and 🃏 Unspent.
      else if (p === 'hearth') {
        const forgeable = hearthForgeable();
        const last = S.map && S.map.pos && S.map.pos.f >= MAP_FLOORS - 1;
        const thin = (S.deck.length + S.hand.length + S.discard.length) < 12;
        // 🧵 a lost card is worth ~8 points of duel win rate, so take it back before the lair or
        // whenever the deck is getting thin; otherwise light the way, otherwise sharpen.
        if (S.trashed.length && (last || thin)) startMendPick();
        else if (!S.candle && !last && S.map && S.map.pos && S.map.pos.f < MAP_FLOORS - 3) hearthLight();
        else if (forgeable.length) startHearthPick();
        else if (S.trashed.length) startMendPick();
        else hearthLight();
      }
      // 🧵 which lost card to take back: the biggest, as a blunt proxy for "the hole that hurts
      // most". ⚠️ They all return at Lv1, so this is a choice about the CARD, not about levels.
      // 💀 the elite's charm. ⚠️ Teach it or autoRun breaks on the phase.
      // The bot cannot price a RULE change (it scores one encounter), so it takes the rarest on
      // offer as a blunt proxy - and every boon number it reports is therefore a floor.
      else if (p === 'eliteboon') {
        const offers = (S.boon || []).map(id => charmById(id)).filter(Boolean);
        if (!offers.length) { S.boon = null; backToMap(); continue; }
        const rank = { rare: 3, uncommon: 2, common: 1 };
        pickBoon(offers.slice().sort((x, y) => (rank[y.rarity] || 0) - (rank[x.rarity] || 0))[0].id);
      }
      else if (p === 'mendpick') {
        const pool = S.trashed.slice();
        if (!pool.length) { cancelMendPick(); }
        else hearthMendPick(pool.sort((a2, b2) => bigness(b2) - bigness(a2))[0].id);
      }
      else if (p === 'hearthpick') {
        // sharpen the card that is furthest from its ceiling and biggest - a blunt but defensible proxy
        const pool = hearthForgeable();
        if (!pool.length) { cancelHearthPick(); }
        else hearthForge(pool.slice().sort((a2, b2) => bigness(b2) - bigness(a2))[0].id);
      }
      // 🛤️ THE FORK. ⚠️ A NEW PHASE MUST BE TAUGHT HERE OR autoRun SILENTLY BREAKS - this
      // loop `break`s on an unknown phase and the run reports garbage. It has happened with
      // 'wheel', with 'setout', and it is the first thing to check when a run-level number looks
      // impossible.
      // Bot policy: take the branch it scores better by playing BOTH out against the current hand
      // and comparing outcomes. ⚠️ That makes the bot a CEILING, not a player - it sees each road
      // perfectly whether the candle is lit or not, where a human unlit reads only the shape. Any
      // measured gain from the fork is therefore an OVER-estimate of what a person gets.
      else if (p === 'fork') {
        const f = S.fork || [];
        if (!f.length) { takeFork(0); continue; }
        // 🕯️ THE BOT MUST OBEY THE CANDLE. Its first version evaluated both roads perfectly
        // whether the candle was lit or not - which is not the rule a human plays by, and it is the
        // same class of error as the placement bans the bot could not see and the Emberwake it
        // structurally could not bank.
        // 🔑 BEFORE QUOTING WHAT AN OPTION IS WORTH, CHECK THE BOT IS ALLOWED TO SEE IT.
        // Unlit, a player reads only the SHAPE, so the bot chooses at random - a deliberate FLOOR.
        // Lit, it chooses the better road - the CEILING. Reality sits between them.
        if (!S.candle) { takeFork(Math.floor(Math.random() * f.length)); continue; }
        let best = 0, bestSc = null;
        const saveAssign = { ...S.assign }, saveHardship = S.hardship, saveEnc = S.encounter;
        for (let i = 0; i < f.length; i++) {
          beginEncounter(f[i]);
          const sc = chooseBestOnce();
          if (sc && (!bestSc || better(sc, bestSc))) { bestSc = sc; best = i; }
        }
        S.encounter = saveEnc; S.hardship = saveHardship; S.assign = saveAssign;
        if (HOOK.onFork) HOOK.onFork(m, f, best);
        takeFork(best);
      }
      else if (p === 'event') {
        if (!withEvents) { S.event = null; finishRegionCheck(); continue; }
        const ev = S.event;
        if (ev.step === 'done') { m.events++; eventContinue(); }
        else if (ev.step === 'pickCard') {
          // ⚠️ PICK FROM WHAT THE OPTION CAN ACTUALLY ACT ON (2026-08-05). Options now declare a
          // `pick` predicate, and eventPickCard() ignores an ineligible id — so a bot that still
          // chose "highest level" would hand a Lv4 card to a BRIGHTEN option, get silently refused,
          // and spin in this phase until the guard broke the run.
          const opt = currentEventDef().options[ev.opt];
          const pool = eventPickable(opt);
          if (!pool.length) { eventCancelPick(); }
          else {
            const sacrifice = ev.id === 'pilgrim' || ev.id === 'toll'; // these SPEND a card — give up the weakest
            const t = pool.slice().sort((a, b) => sacrifice ? a.level - b.level : b.level - a.level)[0];
            eventPickCard(t.id);
          }
        }
        // ⚠️ THE FIRST OPTION THE BOT CAN ACTUALLY COMPLETE, not simply the first one.
        // `eventChoose(0)` stalled the whole run on any event whose first option was gated —
        // ⏳ The Toll of Thorns with an all-Lv1 hand, measured at 1 run in 25, and a stalled run
        // banks nothing at all. 🔑 It asks the ENGINE's own predicate rather than re-deriving
        // eligibility here; a second copy is what caused this.
        else {
          const opts = currentEventDef().options;
          let pick = -1;
          for (let n = 0; n < opts.length; n++) if (!eventOptionBlocked(opts[n])) { pick = n; break; }
          // ⚠️ every event must keep at least one ungated option, or this breaks out loudly
          // rather than spinning — a stall that reports nothing is worse than a stall that does.
          if (pick < 0) { m.stuck = (m.stuck || 0) + 1; break; }
          eventChoose(pick);
        }
      }
      // 🏕️ SETTING OUT — the opening class-charm pick. ⚠️ Every new PHASE must be taught to
      // this loop or autoRun silently breaks out and reports garbage (it happened with 'wheel').
      // Bot policy: take the first offer. It cannot price a rule-change across a whole run, so the
      // CHOICE is meaningless to it — what these runs measure is that each charm is survivable.
      // 🏕️ SETTING OUT now offers one from each BUCKET, so the offers are objects and the
      // bot has to name one. ⚠️ It takes the FIRST, which is always the 🎁 rule bucket - a
      // deliberate, stated bias, because a one-encounter scorer cannot price coins, potions or
      // materials against a rule and would otherwise choose by accident. 🔑 So the bot measures
      // ONE column of this screen; the spread between the three is a question for a player, and
      // any bot number quoted about it is a number about the charm option alone.
      else if (p === 'setout') { const o = (S.setout || [])[0]; if (o) pickSetout(o.k); else break; }
      // ⚔️ THE LAST MILE is an ordinary journey turn — the 'assign' branch above already plays it,
      // which is the whole point of Thomas's design: no new phase for the bot OR the player to learn.
      else if (p === 'summary') {
        const lv = allCards().map(c => c.level);
        m.regionAvg.push(mean(lv)); m.regionMax.push(Math.max(...lv));
        // 🐛 `RUN().length`, NOT `REGIONS.length` (fixed 2026-08-23). `RUN()` exists precisely so
        // *"the tutorial is a dataset rather than a branch"* — it returns the tutorial's 2 regions or
        // the real 4. This line asked the global, so in stage 0 the bot waited for region 4 on a road
        // that stops at 2 and **looped until the 800-iteration guard killed the run**.
        // 🔑 THE TUTORIAL HAS THEREFORE NEVER BEEN BOT-PLAYABLE — which is why the one screen every
        // new player meets first is the one screen the instrument has never audited.
        // ⚠️ A second reader of a fact that already has an accessor is the same drift as a second
        // copy of the arrangement search. **If there is a RUN(), nothing may read REGIONS directly.**
        if (S.region >= RUN().length) beginFinalBattle(); // enter the Dragon Duel
        else nextRegion();
      }
      else if (p === 'victory') { m.win = true; break; }
      else if (p === 'defeat') { m.win = false; break; }
      else break;
      if (!m.firstL4 && allCards().some(c => c.level >= 4)) m.firstL4 = S.turn;
    }
    m.dragon = S.dragon.name;
    m.duelBeats = S.duelBeat;
    m.lastMile = S.lastMileOutcome || null;
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

  // ⭐ THE POOL THE BOT PLAYS AGAINST, PINNED. Defaults to 1 — a fresh account — because that is
  // the only level every player passes through. ⚠️ The stage curve is a BAND now: measure at
  // SIM_LEVEL 1 and again at the cap and quote both, exactly as the old tier gate forced us to
  // quote per stage. Quoting one number for "the mage at stage 2" is quoting half a game.
  // ⚠️ BOTH BARS, or the pin is half a pin: class charms read the CLASS ladder, so pinning only
  // the account level would leave the bot levelling its own class pool mid-sweep — the same
  // "an instrument that progresses is not an instrument" bug, one bar over.
  let SIM_LEVEL = 1, SIM_CLASS_LEVEL = 1;
  function setLevel(lv, clsLv) {
    SIM_LEVEL = Math.max(1, lv | 0);
    SIM_CLASS_LEVEL = Math.max(1, (clsLv === undefined ? lv : clsLv) | 0);
  }

  function run(N) {
    const _r = window.render, _s = window.saveGame;
    window.render = () => {}; window.saveGame = () => {}; // stub DOM/storage for speed
    let on, off;
    const _xp = XP_LEVEL_FORCE, _cxp = CLASS_LEVEL_FORCE;
    XP_LEVEL_FORCE = SIM_LEVEL; CLASS_LEVEL_FORCE = SIM_CLASS_LEVEL;
    try { on = batch(true, N); off = batch(false, N); }
    finally { window.render = _r; window.saveGame = _s;
              XP_LEVEL_FORCE = _xp; CLASS_LEVEL_FORCE = _cxp;
              try { localStorage.removeItem('emberwick-save-1'); } catch (e) {} }
    return { N, on, off };
  }
  return { run, batch, autoRun, chooseBest, chooseBestDuel, setHook, bigness, scoreOf, better, setMomentumWeight,
           setUnseenWeight, setBankWeight, setLevel };
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
