'use strict';

/* ============================================================
   EMBERWICK prototype v1 (formerly Spellwick — renamed 2026-07-01)
   All tuning lives in the CONSTANTS + DATA block below.
   ============================================================ */

// ---------- tuning constants (placeholders, see design docs) ----------
const START_LEVEL = 2;
const MAX_LEVEL = 4;
// ✦ how much attuning is worth: value + (level + ATTUNE_BONUS). Swept 2026-07-29.
//
// 🔑 RAISED 1 → 3 ON 2026-08-22, from a feel report: *"doing the dragons now with mage and it just
// seems miserable compared to rogue. even on the first one."*
//
// 🔑 THE CAUSE WAS IN THE FORMULA, NOT IN THE CARDS. Compare the two classes' payoff for FULL
// investment, which is the thing a run is spent buying:
//     mage   attuned = value + level + ATTUNE_BONUS        → Lv4: value + 5
//     rogue  paid    = value + paid  + PAID_STEP×(level−1) → Lv4: value + 4 + 6 = value + 10
// **Her return on a fully sharpened card was exactly half the rogue's.** Measured duel blow bore it
// out: ~13.0 against her ~18.0. Sharpening is the only progression system in the game, so a class
// that gets half as much for it is not a harder class, it is a class playing a worse game.
//
// ⚠️ THIS IS NOT THE RETRY THE OTHER NOTE FORBIDS. The 2026-07-29 sweep that says *"measured twice,
// do not retry"* was asking whether a bigger bonus turns the attune/Initiative fork into a
// SACRIFICE — it does not (lv+0→5 moved "paid a lost Initiative to attune" only 3%→8%). That is a
// finding about creating a DILEMMA. This is a POWER change, and Balance_Log's own pre-planned lever
// list for the mage opens with *"bonus → lv+2"*. Different question, same constant.
//
// 📏 Swept +1..+5 (n=320, per stage), BEFORE channelling paid interest:
//     +1  duel 80/41/18/26   +2  94/54/19/36   +3  93/69/41/46   +4  94/85/56/56 (overshoots)
//     rogue control 90/64/49/66 — she is untouched by this constant, having no elements.
//
// ⚠️ RE-TUNED 3 → 2 THE SAME DAY, AND THE MISTAKE IS WORTH KEEPING. ⟳ Channelling landed hours
// later and the two stacked: at +3 with interest she measured **97/77/69/58** and led the rogue at
// three stages out of four. 🔑 I CHANGED TWO VARIABLES BEFORE MEASURING EITHER — which is the one
// thing the tuning process explicitly forbids (*smallest change, one variable at a time*), and the
// result was not attributable to either change.
// ✅ Re-measured with channelling live (n=120/stage): **+2 → 93/68/51/42** against +3's 97/77/69/58.
// 🔑 +2-with-channelling lands on top of +3-without at stages 1, 2 and 4 — but stage 3 is BETTER
// (51 vs 41), i.e. the same total power, concentrated where she was worst, and earned by a decision
// instead of handed over as a flat number.
// 🔑 THE RULE FOR CHOOSING WHICH ONE TO GIVE BACK: **if two buffs overshoot, return the FLAT one
// and keep the CONDITIONAL one.** Flat power answers "miserable"; a recurring decision also answers
// "too simple", and Thomas reported both.
// ⚠️ WATCH TWO THINGS. (1) Stage 1 goes 80 → 93 for the bot, and stage 1 is the ON-RAMP — the bot
// always finds the attuned arrangement and a human misses it about one turn in five, but if it
// reads soft in play, +2 is the fallback rather than a creature nerf. (2) Attune OBLIGATION rises
// 66% → 76% (attuned-when-available), which is further outside the 35–50% band the 16-card brief
// asks for — that band was already blown at +1, but this widens it.
// ✅ The compensating measurement, and the reason this is not simply "make the number bigger":
// **naive=optimal FELL, 73% → 66%.** Playing your biggest card is now right LESS often, because the
// element match is worth more relative to raw size. The turn got slightly less solved, not more.
let ATTUNE_BONUS = 2;
// 🎯 GRANTED MULTI-HIT (2026-08-25, Thomas: *"we should add potions and charms and equipment
// that can give an attack multihit"*).
// 🔑 IT BELONGS TO THE ENGINE, NOT A CLASS. `hits` is an engine concept - the shapes read it
// (🧱 Guard halves your first N HITS, 🛡️ Armour subtracts from EACH) - so potions, charms and
// equipment may all grant it and every class inherits it for free.
// 🔑 AND IT IS THE PUREST LATERAL EFFECT IN THE GAME: a multi-hit card DIVIDES its own value,
// so +1 hit adds **no damage at all**. It changes the SHAPE of the blow - strictly better into
// 🧱 Guard, strictly worse into 🛡️ Armour. *Lateral power, not vertical*, by construction rather
// than by tuning. ⚠️ Which also means it needs no downside written on it: **the downside is the
// hand where you meet Armour.**
function extraHits(isStrike) {
  if (!isStrike) return 0;
  let n = 0;
  if (S.potionFx && S.potionFx.hits) n += S.potionFx.hits;      // 🧪 Splitting Draught
  if (S.splitPending) n += S.splitPending;                      // 🛡️ Twinned Bracers, on its block
  if (hasCharm('forkedstrike') && foeHas(S.encounter, 'guard')) n += 1;   // 🎁 Forked Strike
  return n;
}
// ✦ LOOSE WEAVE's divisor. 2 (a half) → 3 (a third), 2026-08-24. Thomas: *"loose weave might be a
// bit too good... not having to fully attune, and just using the boost card gives a lot of good
// damage."* Measured: the charm took attune availability from **59% → 96%** and 46% of all attunes
// became freebies, and it is worth **+5.0 road Complete** at 10 coins.
// 🔑 THE FAULT IS TEXTURE, NOT POWER. Priced against all 23 charms it ranks FIFTH — ✦ Cold Iron
// (+11.6) at the same rarity and the same 10 coins is more than twice as strong. What makes this
// one felt is that it is the only charm that switches off the mage's SIGNATURE DECISION: pairing
// stops being a question 96% of the time.
// ⚠️ AND IT HAD NO COST. `looseOnly()` returns false whenever the Catalyst really matches, so a
// genuine pair still pays FULL — the charm can never make a turn worse. It is a FLOOR, not the
// trade its `why` line claimed ("ceiling traded for consistency"). A third keeps the floor and
// stops the freebie rivalling the real thing: **+5.0 → +2.0 road Complete**.
// ❌ DO NOT "FIX" THIS BY RAISING ATTUNE_BONUS. A loose attune is a FRACTION of that same
// bonus, so raising it buffs the freebie too — and attune obligation already measures **76%**
// against a design band of 35-50%.
// ❌ AND DO NOT MAKE EVERY ATTUNE HALF WHILE HELD (the "honest trade" the why-line implied):
// measured **-3 road C / -15 stage win**, i.e. strictly worse than not owning it. 🔑 A PRINTED
// COST CAN BE HONEST AND STILL BE A TRAP; this charm is usable precisely because it only ever adds.
let LOOSE_CUT = 3;
// 🔑 THE DISPLAYS READ THE DIAL. Three separate strings said "half" — a hand-written fraction in
// three places is three chances to disagree with the maths the next time the number moves.
function looseWord() { return LOOSE_CUT === 2 ? 'half' : LOOSE_CUT === 3 ? 'a third' : `1/${LOOSE_CUT}`; }
// ⚡ how much PAYING is worth to the rogue: value + (paid + PAID_STEP × levels invested).
// ⚠️ THE STEP EXISTS BECAUSE THE FLAT VERSION SHRANK. Thomas: *"i think attuned and unattuned
// number gap needs to be a bit wider, feels like im pretty happy with unattuned damage, i need to
// feel like attuning is more important."*
// 🔑 THE GAP WAS FLAT WHILE EVERYTHING AROUND IT SCALED. Her blades spike +4 value a level, so
// paying doubled a Lv1 blade (4→8) and added a quarter to a Lv4 one (16→20) - it got steadily
// LESS important exactly as the run went on, and Lv4 arrives around turn 6. Measured flat: paying
// supplied 20% of her damage on 75% of turns.
// 🔑 AND IT WAS BACKWARDS FOR THE CLASS. Paying is the rogue's combination rule, and
// [[Levelling_As_Sharpening]] says a level makes a card MORE ITSELF. A flat gap meant sharpening
// made her blades strong enough UNPAID, which dulls the one rule the class is built on. The spike
// and the payoff have to climb together or the payoff is a Lv1 mechanic you outgrow.
// ⚡ PAID_STEP 2 → 0 (2026-08-22). Thomas: *"things still feel fairly easy across the board...
// i want like 40/35/30/20"*. She was the furthest off BY FAR — 96/69/58/56 against a 40/35/30/20
// target, ~35 points too easy at every rung, while the mage sat at 65/54/33/21.
// ⚠️ THIS REVERSES A CALL OF HIS (*"the wider paid gap was asked for"*), so it is his to overrule.
// What it changes: the paid bonus no longer CLIMBS with the card's level. Paying still pays a flat
// `paid` (6 tool / 4 blade) and a levelled blade still hits harder, because SPIKE_STEP is untouched
// at +3 a level — sharpening still sharpens, it just no longer sharpens twice over.
// 📏 Swept at n=100/stage: PAID 2 → 96/69/58/56 · PAID 1 → 83/48/52/42 · **PAID 0 → 46/29/25/30**.
// ✅ Picked over (SPIKE 2 + PAID 1), which measured 29/28/27/30 — a closer average but it makes
// stage 1 HARDER for her than for the mage, and *a newly unlocked class steamrolling the on-ramp is
// how you FEEL an unlock* (2026-08-21). Her being easiest at stage 1 is design, not slack.
let PAID_STEP = 0;
// 🛤️ the fork can be switched off, so it can be A/B'd against the blind draw it replaced.
// ⚠️ Keep it: the fork changes the RUN ECONOMY (free agency where there was only paid agency
// via ↩️ Divert), so every number taken before it is measured against a different game.
let FORK_ENABLED = true;
// 🛒 does the shop open after EVERY encounter, or only at a 🎰 node?
// ⚠️ A/B toggle, because the answer is measurable and was being argued instead. Thomas:
// *"i think the game is built on being able to upgrade after every encounter. but i wonder how
// itll be if we have to go to a shop to do it... but that might take too long, and youll have
// hoarded a bunch of coin possibly."*
let WHEEL_PER_ENCOUNTER = true;
// ⚔️👣 BLOW AND DISTANCE (prototype, [[Blow_And_Distance]]).
// 'spike'    = the old behaviour - a journey scores exactly like a fight, your Spell alone.
// 'distance' = every card you COMMIT walks. The Spell leads (with your class's technique applied
//              to it, as always) and the Catalyst and Surge add their own value behind it.
//              ⚠️ The ✦ ARSENAL IS EXCLUDED - the card you keep is the progress you did not make.
// ⚠️ This does NOT reopen ONE VALUE PER CARD. No second stat is printed anywhere; the same
// single value is simply READ BY MORE CARDS on a journey than in a fight.
// ❌ DEFAULT BACK TO 'spike' (2026-08-18, same day) - 'distance' is kept only so the measurement
// can be re-run. Thomas, before any number said so: *"do you just add up all the attack values in
// your hand for a journey? that doesn't seem fun, doesn't seem to require any thought, you just
// press resolve journey during a journey then?"*
// 🔑 HE WAS RIGHT, AND THE FAULT IS STRUCTURAL, NOT A TUNING MISS: **A SUM IS
// PERMUTATION-INVARIANT.** Addition does not care about order, so once the score is *add up your
// committed cards*, placement can only matter through the leftover bonuses.
// Measured - with the Arsenal held fixed, permuting the other three cards:
//   journey, spike:    changes the outcome **94%** of the time
//   journey, distance: changes the outcome only **44%** of the time
// ⚠️ MY ACCEPTANCE TEST WAS THE WRONG TEST. It asked *is a journey DIFFERENT from a fight* and
// got a clean pass (65%→29% identical arrangements). It never asked *is a journey INTERESTING*.
// 🔑 TWO PUZZLES CAN BE DIFFERENT AND ONE OF THEM CAN STILL BE A CONTINUE BUTTON. Any future
// "make X different" test must measure DEPTH as well as DIFFERENCE.
// ✅ And the finding that survives: spike-mode journeys were already DEEP (6% flat), just deep in
// the SAME WAY as fights. The problem was never that a journey had no decision - it is that it is
// the same decision. See [[Blow_And_Distance]] for the direction that follows from this.
let JOURNEY_MODE = 'spike';
// ⚠️ MP is multiplied at runtime rather than hand-edited into REGIONS: those rows are
// transcribed from the source tables and are not ours to rewrite for a prototype.
// ⚠️ TUNED BY MEASUREMENT, AND MY FIRST GUESS WAS MILES OUT. I estimated ×2.4 on the reasoning
// that "three cards contribute instead of one" - at which point the mage completed **4%** of
// journeys. 🔑 THE STRIDE IS MUCH SMALLER THAN THE CARD COUNT SUGGESTS, BECAUSE THE CATALYST AND
// SURGE ARE CHOSEN FOR SPEED AND BOOST, NOT FOR VALUE - they are usually the small cards.
// Swept: ×1.3 mage journeys 71% · ×1.5 **55%** · ×1.7 39% · ×2.0 15% · ×2.4 4%.
// ×1.5 holds the mage at her old journey rate (58%) and lifts the rogue's (82% → 92%), which is
// the right way round: her road was never the problem, her duel was.
let JOURNEY_MP_MULT = 1.5;
const INIT_FLOOR = 3;      // 💨 no card is ever disqualified from the Catalyst slot
// 🧱 how much of a blow 🧱 Guard eats. A DIAL, not a wall — see the note in computeAction.
const GUARD_CUT = 0.5;
const HAND_SIZE = 4;
// 🔼 THE COST OF A LEVEL, one ladder for every class (2026-08-18). Thomas: *"we sorta get into
// this loop where we win, and we upgrade to lvl 4, so that makes us win more, and we get more
// gold, and you kinda just keep winning."*
//
// 🔑 MEASURED FIRST, AND IT CHANGED THE FIX. A deck's TOTAL levels barely move across a run -
// 32 -> 37 - because soaking eats almost exactly what sharpening buys. So the runaway is not
// ACCUMULATION, it is CONCENTRATION: the same few levels funnelled into one dominant card. A
// surcharge on a sharp deck would have fired almost never.
// ⚠️ So the fix is the SHAPE of the ladder, not its height. It was a flat 2/3/4, which made the
// last level - the one that creates the runaway - the cheapest thing in the game relative to what
// it buys. Now 2/4/7: the first step is UNCHANGED so the shop stays reachable (the 2026-08-05 fix
// that put the Wheel before the forge), and the climb to Lv4 costs 13 instead of 9.
// ⚠️ Costs are hypersensitive - [[Balance_Log]] records 2/3/4 -> 4/7/10 taking stage 1 from 98%
// to 49%. That change raised the FIRST step; this one deliberately does not.
// 🔑 One constant for both classes: the mage's 16 level tables and ROGUE_COST both carried their
// own copy of this ladder, which is 49 numbers to keep in step for a value that was always shared.
// ⚠️ 2/3/7, not 2/4/7. Raising the MIDDLE step taxed all levelling and cost the mage 11 points
// (51% -> 40%) - too blunt for a complaint that was specifically about Lv4. The first two steps are
// now untouched and only the LAST one bites, which is the level he actually named.
const LEVEL_COST = [2, 3, 7, null];
const POTION_CAP = 3;      // 🧪 ⚠️ read by TUTORIAL's potion lesson, so it must stay ABOVE it
// A region is a FIXED number of encounters (2026-07-26), not "however long the deck lasts".
// Emergent length made runs sprawl to ~29 turns and, worse, made them unpredictable: you could
// not plan when you would reach the dragon. 4 regions x 5 = a 20-turn run you can hold in your
// head. Depth still costs you - pouring deep burns cards, so you arrive at the dragon thinner -
// it just costs SURVIVABILITY rather than time, which is the cleaner of the two.
// 4, not 5: the deck shrinks by the PILE SIZE each turn (poured cards leave, the rest return),
// so ~2.4 cards a turn against a 12-card deck exhausts it in almost exactly 5. Trashed cards
// then compound, and region 4 was collapsing to 2 turns. At 4 the deck covers the region with
// a margin that narrows as the run wears on - an attrition curve, not a cliff.
const REGION_ENCOUNTERS = 4;
const REGION_END_THRESHOLD = 5;  // safety net: a deck this thin can't fill a hand
const KO_DECK_DISCARD = 4;       // knocked out: also discard this many from deck

// BEATS CUT 2026-07-26. A creature is ONE hand again. Per-creature beat counts were arbitrary
// (nothing said a toad took one exchange and an ape took two), and the pile's depth decision
// already carries the turn. What beats existed to protect - the Stack - moved to end-of-turn,
// where it now fires every single turn.

// ---------- starter deck (SOURCE-GRAMMAR RECUT 2026-07-01, from Thomas's transcription) ----------
// Per-level stat tables: lv[level-1] = [value, enhValue, init, boost, armor, (dead), upgradeCostToNext].
// Column 6 held armorEl; DEAD DATA since soak doubling was cut 2026-07-26. Array shape kept so
// the 68 hand-transcribed rows did not need rewriting in the same pass.
// `type` / `enhType` / `enhEl` are DEAD DATA since redesign step 2 (one value per card, and a
// card seeks its own element). Left in place; the whole table is re-authored at step 3.
// (often NOT the card's own element). enhType may DIFFER from type — a Move card can Attune into an Attack.
const CARD_DEFS = [
  // 4 ARCHETYPES x 4 ELEMENTS (2026-07-26). Each card is SPIKY on one axis and poor on the
  // others, so it is the natural occupant of one slot and a visible loss anywhere else - the
  // puzzle is that you never draw one of each. Levelling SHARPENS: the spike rises and the
  // weaknesses fall, so a card becomes more itself, never simply better. Lv1 is the damaged
  // state (soaking softens a card back toward the middle); Lv4 is the extreme.
  //   FORCE -> the Spell   SPARK -> the Catalyst   FLOW -> the Surge   WARD -> soaking
  //
  // 🛡️ ARMOUR IS CAPPED AND THE WARD SPIKE IS +1 A LEVEL (2026-08-23). Thomas: *"there
  // shouldnt be a lvl 2 card that has like 4+ armor."* It was far past that: the WARD spike ran
  // **+3 a level**, so Cairnguard blocked 5 / 8 / 11 / **14** while every other card in the game
  // sat between 1 and 4. 🔑 A Lv2 WARD card blocked FOUR TIMES what a piece of crafted armour does.
  // ✅ WARD armour is now **2 / 3 / 4 / 5** on all four, and the rogue's Shadow Double matches.
  // ⚠️ The four WARD cards no longer differ by armour NUMBER, and that is deliberate — they
  // differ by element (the mage's whole combination rule) and by their Lv4 verb. The 16-card brief
  // asks for one shape per archetype × four elements; it never asked the numbers to differ too.
  //
  // 🔴 THIS IS THE CAUSE THE 2026-08-22 DAMAGE BUFF WAS TREATING AS A SYMPTOM. `FOE_ATK_MULT`
  // went to 1.5 because *one card covered 72% of hits* — but that was true because ONE ARCHETYPE
  // had plates three to five times everyone else's. Fix the plates and the designated victim goes
  // with them. Re-measure the multiplier in the same commit; a workaround outliving its cause is
  // how two dials end up fighting.
  // ⚠️ The standing rule *never hand-edit a level row* still holds. This edits ONE COLUMN across
  // ALL FOUR cards of an archetype, systematically — that is a rule change, not a tweak.
  //   Fire hits harder / guards worse .. Water fuels and endures, never fast
  //   Lightning is speed at the cost of guard .. Stone is armour, slow and dry
  // Row = [value, (dead), init, boost, armor, (dead), costToNextLevel]
  { name: 'Emberfall', element: 'Fire', arch: 'FORCE',
    lv: [[5,null,2,2,1,null,2], [7,null,1,1,1,null,3], [9,null,0,1,1,null,4], [11,null,0,1,1,null,null]] },
  { name: 'Firstlight', element: 'Fire', arch: 'SPARK',
    lv: [[4,null,5,3,1,null,2], [3,null,8,2,1,null,3], [3,null,11,1,1,null,4], [3,null,14,1,1,null,null]] },
  { name: 'Bellowsbreath', element: 'Fire', arch: 'FLOW',
    lv: [[4,null,3,3,1,null,2], [3,null,2,6,1,null,3], [3,null,1,9,1,null,4], [3,null,1,12,1,null,null]] },
  { name: 'Hearthwall', element: 'Fire', arch: 'WARD',
    lv: [[4,null,3,2,2,null,2], [3,null,2,1,3,null,3], [4,null,1,1,4,null,4], [5,null,1,1,5,null,null]] },
  { name: 'Tidebreak', element: 'Water', arch: 'FORCE',
    lv: [[3,null,1,3,3,null,2], [5,null,0,2,2,null,3], [7,null,0,1,1,null,4], [9,null,0,1,1,null,null]] },
  { name: 'Riverstep', element: 'Water', arch: 'SPARK',
    lv: [[2,null,4,4,3,null,2], [2,null,7,3,2,null,3], [2,null,10,2,1,null,4], [2,null,13,2,1,null,null]] },
  { name: 'Wellspring', element: 'Water', arch: 'FLOW',
    lv: [[2,null,2,4,3,null,2], [2,null,1,7,2,null,3], [2,null,0,10,1,null,4], [2,null,0,13,1,null,null]] },
  { name: 'Rimeguard', element: 'Water', arch: 'WARD',
    lv: [[2,null,2,3,2,null,2], [2,null,1,2,3,null,3], [3,null,0,1,4,null,4], [4,null,0,1,5,null,null]] },
  // ⚡ THE ONE MAGE CARD THAT FORKS (2026-08-17, Thomas: *"doesn't feel fair for mage to not have
  // ANY if this is a shape we want to add. maybe its a lightning spell"*). Right, and it is the same
  // argument that softened 🧱 Guard: a shape a class cannot engage with AT ALL is not difficulty.
  // ⚠️ THIS IS NOT THE PILE BY THE BACK DOOR, and the difference is the whole reason it is allowed.
  // The banned thing was ACCUMULATING hits by pouring cards into the Spell — a mechanic. This is a
  // PRINTED PROPERTY of one card in sixteen, like its armour or its initiative. You cannot build
  // toward it, stack it, or choose it; you draw it.
  // 🔑 AND IT COSTS WHAT IT SHOULD: hits divide the blow and 🛡️ Armour is paid on every one, so
  // Sparkstrike is the mage's worst card into armour and her only real answer to a pool. A shaped
  // card, not a better one — which is also the first time an ELEMENT means something in combat
  // beyond its temperament.
  { name: 'Sparkstrike', element: 'Lightning', arch: 'FORCE', hits: 2,
    lv: [[4,null,4,2,1,null,2], [6,null,3,1,1,null,3], [8,null,2,1,1,null,4], [10,null,2,1,1,null,null]] },
  { name: 'Quickfire', element: 'Lightning', arch: 'SPARK',
    lv: [[3,null,7,3,1,null,2], [2,null,10,2,1,null,3], [2,null,13,1,1,null,4], [2,null,16,1,1,null,null]] },
  { name: 'Stormglass', element: 'Lightning', arch: 'FLOW',
    lv: [[3,null,5,3,1,null,2], [2,null,4,6,1,null,3], [2,null,3,9,1,null,4], [2,null,3,12,1,null,null]] },
  { name: 'Staticwall', element: 'Lightning', arch: 'WARD',
    lv: [[3,null,5,2,2,null,2], [2,null,4,1,3,null,3], [3,null,3,1,4,null,4], [4,null,3,1,5,null,null]] },
  { name: 'Rockfall', element: 'Stone', arch: 'FORCE',
    lv: [[4,null,1,1,4,null,2], [6,null,0,1,3,null,3], [8,null,0,1,2,null,4], [10,null,0,1,2,null,null]] },
  { name: 'Flintdart', element: 'Stone', arch: 'SPARK',
    lv: [[3,null,4,2,4,null,2], [2,null,7,1,3,null,3], [2,null,10,1,2,null,4], [2,null,13,1,2,null,null]] },
  { name: 'Deepvein', element: 'Stone', arch: 'FLOW',
    lv: [[3,null,2,2,4,null,2], [2,null,1,5,3,null,3], [2,null,0,8,2,null,4], [2,null,0,11,2,null,null]] },
  { name: 'Cairnguard', element: 'Stone', arch: 'WARD',
    lv: [[3,null,2,1,2,null,2], [2,null,1,1,3,null,3], [3,null,0,1,4,null,4], [4,null,0,1,5,null,null]] },
];

// ---------- modifiers (source rulebook) ----------
// 🔑 A HARDSHIP CHANGES WHICH ARRANGEMENT IS RIGHT — it does not merely raise the price of the
// turn you were going to play anyway (2026-07-29). Three of the original four were pure TAXES:
// Ambush, Hazards and Storm all just make a bad outcome worse. 🌙 Night Travel was the only one
// that met the bar — it makes a FAST Catalyst cost you Surge, so the whole hand rearranges.
// The three added here follow Night Travel, not the taxes.
//
// ⚠️ THE STRUCTURAL HOLE THEY ALSO FILL: every original fight hardship keyed on EARLY DAMAGE or
// low Initiative, which is why a ☠️ Ranged creature (whose Early Damage is certain) could roll none
// at all. None of the three below touch Early Damage.
const HARDSHIPS = {
  'Ambush':       'Early Damage against you is <b>doubled</b>.',
  'Hazards':      'Take Early Damage: <b>+1 Time Penalty</b>. Take Combat Damage: <b>+1 more</b>.',
  // ⚠️ ENGINE TERMS, NOT ONE CLASS'S STAT. "Your Boost" is a mage word, and a hardship that
  // names it is a free ride for every class without a boost - which was literally true for the
  // rogue until 2026-08-18.
  'Night Travel': "Your <b>{slot:Boost}</b> gives its value minus your {slot:Element}'s Initiative (min 0).",
  'Storm':        'Time Penalties also deal <b>that much damage</b>.',
  // ⚖️ aims straight at the most-solved part of the turn: the Spell is simply your biggest card 83%
  'Dead Weight':  'Your <b>heaviest</b> card cannot be your {slot:Spell}.',
  // 🐌 the same trick on the race — your fastest card is barred from the Catalyst
  'Mire':         'Your <b>fastest</b> card cannot be your {slot:Element}.',
  // 🔇 kills the class's combination rule for one encounter. Stated class-blind on purpose: for the
  // mage that means no attuning, for a rogue it would mean no chain.
  // ⚠️ "ACCORD" MEANT NOTHING TO ANYONE (2026-08-22). Thomas: *"what does accord even mean"* —
  // and he is right: it is a word invented so ONE sentence could cover two classes, because the
  // mage ATTUNES and the rogue PAYS and neither word fits both. This one was worse still: it said
  // *"find no accord"* and then *"nothing attunes"* in the same breath, i.e. the invented neutral
  // word AND the mage's word, contradicting its own reason for existing.
  // 🔑 THE FIX IS THE ONE ALREADY BUILT FOR THE GRADE THIS MORNING: **the ENGINE owns the rule,
  // the CLASS owns the noun.** `{gate}` is filled from CLASS.craft.gate — see hardshipText().
  'Dead Air':     'Nothing can <b>{gate}</b> this encounter.',
  // 🌪️ STAGE 2's OWN TWO (2026-08-05). A land should press on the thing its dragon presses on,
  // so Skyrender's country attacks SPEED from both ends — one takes your fast card away from the
  // race, the other makes the race a condition on your class rule.
  //
  // 🔃 Vertigo is the INVERSE of Mire, and that is the point: Mire bars your fastest card from
  // the Catalyst, Vertigo nails it INTO the Spell. Same card, opposite instruction, and both are
  // stated in engine terms (`init`), so a rogue meets them unchanged.
  'Vertigo':      'Your <b>fastest</b> card must be your {slot:Spell}.',
  // ⚡ Squall puts a SECOND condition on the Catalyst, which is the one card already serving two
  // masters. ⚠️ We measured in July that a permanent second condition produces search, not
  // sacrifice — with 12 arrangements you can usually satisfy both. A HARDSHIP is where that
  // finding says the pressure belongs: it is one encounter, so "you cannot have both today" is a
  // problem you solve rather than a tax you route around forever.
  'Squall':       'Cards can only <b>{gate}</b> if you <b>win Initiative</b>.',
  // ⏳ STAGE 3's TWO. Cragmourn's demand is *waste nothing*, so its land takes away the slack
  // you did not know you were relying on.
  // ⚠️ Rationed is a RESOURCE denial, not an option denial — the Surge still goes somewhere, it
  // just pays nothing, so no slot is sealed and no choice is removed (sealed slots shipped once and
  // were killed the same day).
  'Rationed':     'Your <b>{slot:Boost}</b> gives <b>nothing</b>.',
  // ⚖️ Exacting is the mountain's own logic: half-measures are nothing. It is the harshest
  // hardship in the game and it is deliberately confined to late Fellgrind regions.
  'Exacting':     'A <b>Narrow counts as a Loss</b>.',
  // 🌊 STAGE 4's. The Arsenal is the one slot that is identical in every class, and this is the
  // only rule that takes the carry itself — the exam's way of saying *nothing you save is safe*.
  'Riptide':      'Your <b>{slot:Reserve}</b> is <b>spent</b>, not kept.',
};
// 🔑 A HARDSHIP IS STATED IN ENGINE TERMS AND EACH CLASS READS ITS OWN WORD FOR IT.
// `{gate}` becomes "attune" for the mage and "be paid in full" for the rogue — the same rule the
// grade follows, and the same one already written down for hardships: *a rule that names ATTUNING,
// the rogue reads as PAYING.* ⚠️ Every consumer must go through here; a raw HARDSHIPS[x] lookup
// would print the placeholder.
function hardshipText(name) {
  const t = HARDSHIPS[name] || '';
  const gate = (CLASS.craft && CLASS.craft.gate) || 'combine';
  return t
    .replace(/\{gate\}/g, gate)
    .replace(/\{slot:(\w+)\}/g, (_, z) => `<b>${SLOT_LABEL[z] || z}</b>`);
}

const FIGHT_HARDSHIPS = ['Ambush', 'Hazards', 'Night Travel', 'Dead Weight', 'Mire', 'Dead Air', 'Vertigo', 'Squall', 'Rationed', 'Exacting', 'Riptide'];
// ⚠️ Squall is FIGHT-ONLY by construction — a journey has no enemy Initiative to beat, so on the
// road it would either never fire or always fire. A hardship that cannot be answered is weather.
const JOURNEY_HARDSHIPS = ['Night Travel', 'Storm', 'Dead Weight', 'Dead Air', 'Vertigo', 'Rationed', 'Exacting', 'Riptide'];

// 🔑 the placement bans are ENGINE rules, not class rules — they read `value` and `init`, which
// every class has. A class's own canPlace() is consulted separately, so the two never collide.
function heaviestId() {
  let best = null; for (const c of S.hand) if (!best || cardValue(c) > cardValue(best)) best = c;
  return best ? best.id : null;
}
function fastestId() {
  let best = null; for (const c of S.hand) if (!best || eff(c).init > eff(best).init) best = c;
  return best ? best.id : null;
}
// why this card may not go here, or null if it may
function placementBan(id, zone) {
  if (S.hardship === 'Dead Weight' && zone === 'Spell' && id === heaviestId()) return '⚖️ Dead Weight — your heaviest card cannot be your Spell';
  if (S.hardship === 'Mire' && zone === 'Element' && id === fastestId()) return '🐌 Mire — your fastest card cannot be your Catalyst';
  // 🌀 Vertigo pins the fastest card INTO the Spell, so it is barred from everywhere else
  if (S.hardship === 'Vertigo' && zone !== 'Spell' && id === fastestId()) return '🌀 Vertigo — your fastest card must be your Spell';
  return null;
}
function slotLegal(id, zone) { return !placementBan(id, zone) && CLASS.canPlace(id, zone); }

const ABILITIES = {
  'Freeze': 'If it deals you Early Damage, you discard your Arsenal in Cleanup.',
  'Poison': 'If it damages you, +1 damage to your next drawn hand (+2 if both Early and Combat).',
  'Ranged': 'It shoots from range — you take Early Damage even when you strike first. Speed cannot save you here.',
  // 🌬️ WINDSHEAR turns Initiative from a COIN into a GRADIENT. Everywhere else in the game the
  // race is binary — you win or you lose — so a Catalyst one point short costs exactly as much as
  // one six points short, and "fast enough" is the only question. Against this, losing NARROWLY is
  // cheap and losing BADLY is ruinous, which makes the second-fastest card a real answer.
  'Windshear': 'Lose Initiative and its Early Damage grows by how far you were outpaced (up to +3).',
  // 💢 BACKLASH is the answer to the most-solved thing in the game. Sharpening drives
  // "the Spell is simply your biggest card" from 83% toward 94%, because overkill has never cost
  // anything — there has been no reason in twenty turns to hit for exactly enough. Against this,
  // every point past its HP comes back at you. 🔑 It INVERTS Armour: Armour says *bigger*,
  // Backlash says *exact*, and a hand that answers one is wrong for the other.
  'Backlash': 'Strike it harder than it can take and the excess rebounds on you (up to 3).',
};

const PERILS = {
  'Steep':       "The journey's MP is increased by what your Arsenal would have given.",
  'Treacherous': 'Fail to attain Complete Victory → suffer 1 damage after the Time Penalty.',
  // 🏔️ UPDRAFT is the mirror of Steep, and the first peril that PAYS. A road hazard that can
  // only ever cost you makes the peril line something to dread and skim past; one that rewards the
  // stat the land is about makes you read it. It also gives the Catalyst's Initiative a job on a
  // JOURNEY, where the race is otherwise only about Nightfall.
  'Updraft':     "The wind is with you — the journey's MP is reduced by your Catalyst's Initiative.",
  // ⏳ the road that does not forgive: falling short costs twice
  'Toll':        'Fail to Complete and the <b>Time Penalty is doubled</b>.',
};

// ---------- regions (SOURCE-GRAMMAR RECUT 2026-07-01, from Thomas's transcription) ----------
// ⚠️ THE SAME GOES FOR A JOURNEY'S `element` (removed from its panel 2026-07-29). The source game
// paid a bonus for matching your Move's element to the journey's; we cut it 2026-07-26 as the most
// obscure rule in the game — the tell was that Thomas played for months and never once mentioned
// it. It must not come back for the same reason as below: a journey is CONTENT, content is
// class-blind, and a rogue has no element to match with.
//
// ⚠️ `atkEl` ON CREATURES IS DEAD DATA and must NOT be shown (removed from the panel 2026-07-29).
// It stopped doing arithmetic when soak doubling was cut on 2026-07-26, so printing "strikes with
// 💧" advertised a rule that does not exist — a PHANTOM STAT, which is worse than a hidden one:
// the player reasonably assumes anything in the stat line matters and plans around it.
// 🔑 And it must never be given a job again: content is CLASS-BLIND by design, and elements are
// the MAGE's suit. An elemental enemy would re-couple the bestiary to one class's mechanic, which
// is the exact thing shaped defence was built to delete. The rows keep the field only because
// rewriting 16 of them buys nothing; the flavour pass may remove it.
// (historical) Enemy armor is a LIST (R4 creatures shield multiple elements). atkEl = the element its
// damage carries (soak-doubling). Nightfall values are OURS (source has none).
// `beats` = how many exchanges the creature takes (default 2). SKIRMISHERS — low HP, high
// Init — are ONE beat: they're a tempo change, a fight you win or lose in a single breath,
// and they keep the rhythm from flattening. Note a 1-beat creature has no exchange, so no
// STACK either; the deck-scheduling skill belongs to the fights that actually last.
// R4 XP values are INFERRED from the source's XP≈0.6×HP pattern — flag for tuning.
// 🪙 COIN INCOME CUT TO 70% (2026-07-29) after Thomas: "felt like it was easy to get coins to
// upgrade a lot of my cards... less forking, less weighing, usually a correct answer."
// Measured: ~50 coins a run against 7 to take a card Lv2→Lv4 — you could MAX SEVEN CARDS in a
// single run. With no scarcity there is no commitment, and a fully sharpened deck is four
// specialists, so every slot has one obvious occupant and the arrangement stops being a puzzle.
// One change fixed both complaints: scarcity makes it harder AND makes the turn interesting again.
// Swept x1 / x0.7 / x0.5 / x0.4 → stage win rates 100-95-90-90 / 85-75-60-50 / 60-45-45-30 / 60-35-35-0.
const REGIONS = [
  // 🌿 Verdant Edge — no hardships at all; it is where the game teaches itself
  { name: 'Verdant Edge', hardshipChance: 0, hardships: [], encounters: [
    { type: 'fight',   name: 'Spark Kit',  hp: 7,  init: 4, atk: 1, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 3 },
    { type: 'fight',   name: 'Cinder Ape', hp: 11, init: 2, atk: 2, atkEl: 'Fire',            xp: 5 },
    { type: 'fight',   name: 'Mist Crane', hp: 9,  init: 4, atk: 2, atkEl: 'Water',     shape: 'evasion', shapeV: 1,     xp: 4 },
    { type: 'fight',   name: 'Cairnstag',  hp: 13, init: 1, atk: 3, atkEl: 'Stone',    shape: 'armour', shapeV: 1,    xp: 6 },
    { type: 'journey', name: 'Highland Pass',  mp: 12, timePenalty: 1, element: 'Lightning', nightfall: 4, xp: 4 },
    { type: 'journey', name: 'Fern Crossing',  mp: 8,  timePenalty: 2, element: 'Water',     nightfall: 3, xp: 2 },
    { type: 'journey', name: 'Sunwarm Trail',  mp: 11, timePenalty: 3, element: 'Fire',      nightfall: 4, xp: 3 },
    { type: 'journey', name: 'Quarry Hollow',    mp: 10, timePenalty: 2, element: 'Stone',    nightfall: 3, xp: 2 },
  ]},
  // 🏹 Wilding Marches — open country full of ambushers and archers: it is about being CAUGHT
  { name: 'Wilding Marches', hardshipChance: 0.35, hardships: ['Ambush', 'Mire', 'Night Travel'], encounters: [
    { type: 'fight',   name: 'Flintwisp',     hp: 9,  init: 4, atk: 2, atkEl: 'Stone',    shape: 'evasion', shapeV: 1,    xp: 4, ability: 'Ranged' },
    { type: 'fight',   name: 'Stormtoad',      hp: 10, init: 6, atk: 2, atkEl: 'Lightning',  xp: 3 },
    { type: 'fight',   name: 'Ashen Boar',     hp: 15, init: 1, atk: 4, atkEl: 'Fire',      shape: 'armour', shapeV: 2,      xp: 6 },
    { type: 'fight',   name: 'Frostbark Elder', hp: 13, init: 4, atk: 3, atkEl: 'Water',    shape: 'evasion', shapeV: 1,     xp: 5, ability: 'Freeze' },
    { type: 'journey', name: 'Mirefen Road',    mp: 10, timePenalty: 1, element: 'Fire',      nightfall: 5, xp: 3, peril: 'Treacherous' },
    { type: 'journey', name: 'Drowned Meadow',  mp: 13, timePenalty: 2, element: 'Water',     nightfall: 4, xp: 5 },
    { type: 'journey', name: 'Stormwash',       mp: 11, timePenalty: 3, element: 'Lightning', nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Scree Track', mp: 9,  timePenalty: 2, element: 'Stone',    nightfall: 4, xp: 3, peril: 'Steep' },
  ]},
  // 🕳️ Deepdark Hollows — close, lightless, smothering: it is about things not WORKING
  { name: 'Deepdark Hollows', hardshipChance: 0.5, hardships: ['Dead Air', 'Hazards', 'Night Travel', 'Storm'], encounters: [
    { type: 'fight',   name: 'Basalt Basilisk', hp: 17, init: 4, atk: 3, atkEl: 'Stone',    shape: 'armour', shapeV: 3,    xp: 6 },
    { type: 'fight',   name: 'Grotto Hydra',   hp: 9, init: 2, atk: 3, atkEl: 'Water',     shape: 'guard', shapeV: 1,     xp: 6 },
    { type: 'fight',   name: 'Sulfur Crawler', hp: 11, init: 4, atk: 2, atkEl: 'Fire',      shape: 'evasion', shapeV: 1,      xp: 5, ability: 'Poison' },
    { type: 'fight',   name: 'Storm Prowler',  hp: 9,  init: 4, atk: 2, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 4, ability: 'Ranged' },
    { type: 'journey', name: 'Sunken Causeway', mp: 14, timePenalty: 1, element: 'Water',     nightfall: 6, xp: 5, peril: 'Steep' },
    { type: 'journey', name: 'Echo Basin',      mp: 12, timePenalty: 2, element: 'Lightning', nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Cinder Ravine',   mp: 10, timePenalty: 3, element: 'Fire',      nightfall: 5, xp: 4, peril: 'Treacherous' },
    { type: 'journey', name: 'Granite Cut',    mp: 11, timePenalty: 2, element: 'Stone',    nightfall: 6, xp: 4 },
  ]},
  // 🐉 The Dragon's Shadow — everything is heavier here: it is about your own strength failing you
  { name: "The Dragon's Shadow", hardshipChance: 0.65, hardships: ['Dead Weight', 'Dead Air', 'Ambush', 'Hazards', 'Storm'], encounters: [
    { type: 'fight',   name: 'Cairntide Warden', hp: 8, init: 5,  atk: 2, atkEl: 'Stone',    shape: 'guard', shapeV: 1,    xp: 5, ability: 'Poison' },
    { type: 'fight',   name: 'Flarecaller',      hp: 9,  init: 5, atk: 3, atkEl: 'Fire',      shape: 'evasion', shapeV: 1,                             xp: 4, ability: 'Ranged' },
    { type: 'fight',   name: 'Stormcrown Stag',  hp: 14, init: 5,  atk: 4, atkEl: 'Lightning', shape: 'evasion', shapeV: 1,  xp: 6, ability: 'Freeze' },
    { type: 'fight',   name: 'Mirewyrm Elder',   hp: 17, init: 5,  atk: 5, atkEl: 'Water',     shape: 'armour', shapeV: 4,    xp: 6 },
    { type: 'journey', name: 'Drowned Vale',   mp: 14, timePenalty: 1, element: 'Water',     nightfall: 7, xp: 5, peril: 'Treacherous' },
    { type: 'journey', name: 'Stoneward Road', mp: 13, timePenalty: 2, element: 'Stone',    nightfall: 6, xp: 4 },
    { type: 'journey', name: 'Emberfall Path', mp: 12, timePenalty: 3, element: 'Fire',      nightfall: 6, xp: 4 },
    { type: 'journey', name: 'Tempest Ridge',  mp: 11, timePenalty: 2, element: 'Lightning', nightfall: 7, xp: 4, peril: 'Steep' },
  ]},
];


// ============================================================
// 🗺️ THE ROADS (2026-08-05) — one land per dragon
// ============================================================
// Thomas: *"i don't want the same exact runs for stages 2-4, it should be completely different with
// new monsters, new events, new journeys as well… they got different hardships to deal with."*
// Until now every stage walked the SAME four regions and only the dragon at the end changed, so
// stages 2–4 were one road with a harder ending — and the whole difficulty curve lived in the
// last four beats of a twenty-turn run.
//
// 🔑 THE ORGANISING RULE, AND IT IS WHAT STOPS THIS BEING A RESKIN: **a land presses on the same
// thing its dragon presses on.** The mage can answer exactly two creature shapes, so new monsters
// alone would be stage 1's roster with new names. What makes a road genuinely a different problem
// is that its creatures, its hardships and its perils all lean the same way — so the road is the
// dragon's demand met in small, twenty times, before you meet it full size.
//   🛡️ stage 1  Cindermaw   — ARMOUR, hit big     → a land of things that shrug off small blows
//   🌀 stage 2  Skyrender   — EVASION, hit first  → a land that punishes being slow
//   ⏳ stage 3  Cragmourn   — RELENTLESS, waste nothing → a land that takes away your slack
//   🛡️🌀 stage 4  Fathomdread — both, big AND first   → the exam: all three lands at once
//
// ⚠️ A road is CONTENT, and content is CLASS-BLIND. Every stat here is `hp`/`init`/`atk`/`mp`,
// which every class has; nothing on a road may name an element, a pair or a chain.
const ROAD_STORMREACH = [
  // 🍃 Windward Steps — no hardships: the same teaching grace stage 1 opens with. High, open,
  // and mercifully empty; what it teaches is that up here things are FASTER than you.
  { name: 'Windward Steps', hardshipChance: 0, hardships: [], encounters: [
    { type: 'fight',   name: 'Kite Hawk',    hp: 8,  init: 4, atk: 2, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 3 },
    { type: 'fight',   name: 'Gale Colt',    hp: 12, init: 4, atk: 2, atkEl: 'Water',     xp: 4 },
    { type: 'fight',   name: 'Rill Otter',   hp: 10, init: 4, atk: 2, atkEl: 'Water',     shape: 'evasion', shapeV: 1, xp: 4 },
    { type: 'fight',   name: 'Scarp Ram',    hp: 14, init: 2, atk: 3, atkEl: 'Stone',     shape: 'armour', shapeV: 2, xp: 5 },
    { type: 'journey', name: 'Kestrel Stair',   mp: 11, timePenalty: 1, element: 'Lightning', nightfall: 4, xp: 4, peril: 'Updraft' },
    { type: 'journey', name: 'Whistling Gap',   mp: 9,  timePenalty: 2, element: 'Water',     nightfall: 3, xp: 2 },
    { type: 'journey', name: 'Sunlit Terrace',  mp: 12, timePenalty: 3, element: 'Fire',      nightfall: 4, xp: 3 },
    { type: 'journey', name: 'Cloudmere Path',  mp: 10, timePenalty: 2, element: 'Stone',     nightfall: 4, xp: 3 },
  ]},
  // 🦅 The Shrike Downs — hunting country. Everything here reaches you first, and 🌀 Vertigo
  // arrives to take the one card that could have answered that.
  { name: 'The Shrike Downs', hardshipChance: 0.35, hardships: ['Ambush', 'Vertigo', 'Night Travel'], encounters: [
    { type: 'fight',   name: 'Downs Shrike',   hp: 9,  init: 5, atk: 3, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 4, ability: 'Ranged' },
    { type: 'fight',   name: 'Gorse Lurcher',  hp: 13, init: 3, atk: 3, atkEl: 'Stone',     shape: 'armour', shapeV: 2, xp: 5 },
    { type: 'fight',   name: 'Quillback',      hp: 7, init: 4, atk: 2, atkEl: 'Stone',     shape: 'guard', shapeV: 1, xp: 5, ability: 'Windshear' },
    { type: 'fight',   name: 'Thistle Drake',  hp: 13, init: 4, atk: 3, atkEl: 'Fire',      shape: 'evasion', shapeV: 1, xp: 6, ability: 'Freeze' },
    { type: 'journey', name: 'Harrow Ride',      mp: 13, timePenalty: 1, element: 'Fire',      nightfall: 5, xp: 4, peril: 'Updraft' },
    { type: 'journey', name: 'Longbarrow Track', mp: 10, timePenalty: 2, element: 'Stone',     nightfall: 4, xp: 3 },
    { type: 'journey', name: 'Gorsewind Run',    mp: 12, timePenalty: 3, element: 'Lightning', nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Cairn Ladder',     mp: 11, timePenalty: 2, element: 'Water',     nightfall: 4, xp: 3, peril: 'Steep' },
  ]},
  // ⚡ Thunderhead Reach — the storm itself. ⚡ Squall lives here: your cards hold together only
  // if you were fast enough, which is Skyrender's whole demand rehearsed one encounter at a time.
  { name: 'Thunderhead Reach', hardshipChance: 0.5, hardships: ['Squall', 'Storm', 'Night Travel', 'Vertigo'], encounters: [
    { type: 'fight',   name: 'Levinbeast',      hp: 12, init: 5, atk: 3, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 5, ability: 'Windshear' },
    { type: 'fight',   name: 'Anvil Toad',      hp: 18, init: 2, atk: 4, atkEl: 'Stone',     shape: 'armour', shapeV: 3, xp: 6 },
    { type: 'fight',   name: 'Fulgurite Wolf',  hp: 13, init: 4, atk: 3, atkEl: 'Fire',      shape: 'evasion', shapeV: 1, xp: 5, ability: 'Poison' },
    { type: 'fight',   name: 'Skylash Serpent', hp: 13, init: 4, atk: 4, atkEl: 'Water',     shape: 'evasion', shapeV: 1, xp: 6, ability: 'Ranged' },
    { type: 'journey', name: 'Thunder Stair',  mp: 13, timePenalty: 1, element: 'Lightning', nightfall: 5, xp: 5, peril: 'Updraft' },
    { type: 'journey', name: 'Static Flats',   mp: 12, timePenalty: 2, element: 'Stone',     nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Rainshadow',     mp: 11, timePenalty: 3, element: 'Water',     nightfall: 6, xp: 4, peril: 'Treacherous' },
    { type: 'journey', name: 'The Long Gale',  mp: 13, timePenalty: 2, element: 'Fire',      nightfall: 5, xp: 4 },
  ]},
  // 🐉 The Riven Sky — under its wings. Everything is faster than you and the ground is gone.
  { name: 'The Riven Sky', hardshipChance: 0.65, hardships: ['Squall', 'Vertigo', 'Ambush', 'Storm', 'Dead Weight'], encounters: [
    { type: 'fight',   name: 'Riven Hatchling', hp: 12, init: 5, atk: 4, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 5, ability: 'Windshear' },
    { type: 'fight',   name: 'Stormcrown Roc',  hp: 14, init: 5, atk: 4, atkEl: 'Water',     shape: 'evasion', shapeV: 1, xp: 6, ability: 'Ranged' },
    { type: 'fight',   name: 'Riven Warden',    hp: 12, init: 4, atk: 4, atkEl: 'Stone',     shape: 'guard', shapeV: 1, xp: 6 },
    { type: 'fight',   name: 'Tempest Lynx',    hp: 13, init: 5, atk: 4, atkEl: 'Fire',      shape: 'evasion', shapeV: 1, xp: 6, ability: 'Freeze' },
    { type: 'journey', name: 'Skyfall Verge',   mp: 14, timePenalty: 1, element: 'Water',     nightfall: 6, xp: 5, peril: 'Treacherous' },
    { type: 'journey', name: 'The Riven Stair', mp: 13, timePenalty: 2, element: 'Stone',     nightfall: 6, xp: 4, peril: 'Steep' },
    { type: 'journey', name: 'Cloudbreak Run',  mp: 13, timePenalty: 3, element: 'Lightning', nightfall: 6, xp: 5, peril: 'Updraft' },
    { type: 'journey', name: 'Wingshadow Pass', mp: 13, timePenalty: 2, element: 'Fire',      nightfall: 7, xp: 4 },
  ]},
];

// 🗺️ stage → road. ⚠️ A stage with no road of its own FALLS BACK to stage 1's rather than
// crashing or shipping an empty region — stages 3 and 4 are not written yet, and a missing road
// must degrade to "the old run" instead of to a dead end.

// ⏳ THE FELLGRIND (stage 3) — Cragmourn's country. Its demand is **waste nothing**: the breath
// grows every beat, so a long duel is one you have already lost. The road rehearses that by taking
// away slack — ⏳ Rationed pays nothing for your Surge, ⚖️ Exacting gives no half credit, 💢
// Backlash makes overkill rebound, ⏳ Toll doubles the price of falling short.
// 🔑 Backlash is the load-bearing one: it is the first thing in the game that makes the BIGGEST
// card the wrong card, which is the single most-solved decision we have measured.
const ROAD_FELLGRIND = [
  { name: 'The Sloughs', hardshipChance: 0, hardships: [], encounters: [
    { type: 'fight',   name: 'Sump Toad',     hp: 10, init: 3, atk: 2, atkEl: 'Water', xp: 4 },
    { type: 'fight',   name: 'Peat Warden',   hp: 14, init: 2, atk: 3, atkEl: 'Stone', shape: 'armour', shapeV: 2, xp: 5 },
    { type: 'fight',   name: 'Bittern',       hp: 9,  init: 4, atk: 2, atkEl: 'Water', shape: 'evasion', shapeV: 1, xp: 4, ability: 'Backlash' },
    { type: 'fight',   name: 'Fen Ox',        hp: 16, init: 2, atk: 3, atkEl: 'Stone', shape: 'armour', shapeV: 2, xp: 6 },
    { type: 'journey', name: 'The Slow Ford',   mp: 12, timePenalty: 1, element: 'Water',     nightfall: 4, xp: 4 },
    { type: 'journey', name: 'Turfcutter Way',  mp: 10, timePenalty: 2, element: 'Stone',     nightfall: 4, xp: 3 },
    { type: 'journey', name: 'Reedlight Path',  mp: 11, timePenalty: 3, element: 'Fire',      nightfall: 4, xp: 3 },
    { type: 'journey', name: 'The Long Bank',   mp: 13, timePenalty: 2, element: 'Lightning', nightfall: 5, xp: 4 },
  ]},
  { name: 'Grindstone Vale', hardshipChance: 0.35, hardships: ['Rationed', 'Dead Weight', 'Night Travel'], encounters: [
    { type: 'fight',   name: 'Quarry Hound',   hp: 12, init: 4, atk: 3, atkEl: 'Stone', shape: 'evasion', shapeV: 1, xp: 5 },
    { type: 'fight',   name: 'Millstone Crab', hp: 11, init: 2, atk: 3, atkEl: 'Water', shape: 'guard', shapeV: 1, xp: 6, ability: 'Backlash' },
    { type: 'fight',   name: 'Grindtooth',     hp: 14, init: 3, atk: 4, atkEl: 'Fire',  shape: 'armour', shapeV: 2, xp: 6 },
    { type: 'fight',   name: 'Slagmoth',       hp: 11, init: 5, atk: 3, atkEl: 'Fire',  shape: 'evasion', shapeV: 1, xp: 5, ability: 'Poison' },
    { type: 'journey', name: 'The Whetway',     mp: 13, timePenalty: 2, element: 'Stone',     nightfall: 5, xp: 4, peril: 'Toll' },
    { type: 'journey', name: 'Ashfall Steps',   mp: 12, timePenalty: 2, element: 'Fire',      nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Cold Furrow',     mp: 11, timePenalty: 3, element: 'Water',     nightfall: 5, xp: 3 },
    { type: 'journey', name: 'The Iron Cut',    mp: 14, timePenalty: 2, element: 'Lightning', nightfall: 5, xp: 5, peril: 'Steep' },
  ]},
  { name: 'The Unquiet Deep', hardshipChance: 0.5, hardships: ['Rationed', 'Dead Air', 'Night Travel', 'Dead Weight'], encounters: [
    { type: 'fight',   name: 'Deepdelver',     hp: 18, init: 3, atk: 4, atkEl: 'Stone', shape: 'armour', shapeV: 3, xp: 6 },
    { type: 'fight',   name: 'Cavern Shrike',  hp: 12, init: 5, atk: 3, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 5, ability: 'Ranged' },
    { type: 'fight',   name: 'Glasswing Moth', hp: 10, init: 4, atk: 3, atkEl: 'Water', shape: 'evasion', shapeV: 1, xp: 5, ability: 'Backlash' },
    { type: 'fight',   name: 'Hollow Bull',    hp: 17, init: 2, atk: 5, atkEl: 'Fire',  shape: 'armour', shapeV: 3, xp: 7 },
    { type: 'journey', name: 'The Deadfall',    mp: 13, timePenalty: 2, element: 'Stone',     nightfall: 6, xp: 5, peril: 'Toll' },
    { type: 'journey', name: 'Blackwater Run',  mp: 12, timePenalty: 2, element: 'Water',     nightfall: 6, xp: 4, peril: 'Treacherous' },
    { type: 'journey', name: 'The Winding Cut', mp: 14, timePenalty: 3, element: 'Lightning', nightfall: 6, xp: 5 },
    { type: 'journey', name: 'Emberdown',       mp: 12, timePenalty: 2, element: 'Fire',      nightfall: 6, xp: 4 },
  ]},
  { name: "Cragmourn's Shoulder", hardshipChance: 0.6, hardships: ['Exacting', 'Rationed', 'Dead Weight', 'Storm', 'Ambush'], encounters: [
    { type: 'fight',   name: 'Scree Warden',   hp: 12, init: 3, atk: 5, atkEl: 'Stone', shape: 'guard', shapeV: 1, xp: 7 },
    { type: 'fight',   name: 'Fault Lurker',   hp: 14, init: 5, atk: 4, atkEl: 'Water', shape: 'evasion', shapeV: 1, xp: 6, ability: 'Backlash' },
    { type: 'fight',   name: 'Cinderjaw',      hp: 17, init: 4, atk: 5, atkEl: 'Fire',  shape: 'armour', shapeV: 3, xp: 7, ability: 'Freeze' },
    { type: 'fight',   name: 'Stonewake Elk',  hp: 15, init: 5, atk: 4, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 6, ability: 'Windshear' },
    { type: 'journey', name: 'The Grinding Pass', mp: 14, timePenalty: 2, element: 'Stone',     nightfall: 7, xp: 5, peril: 'Toll' },
    { type: 'journey', name: 'Shoulderfall',      mp: 13, timePenalty: 2, element: 'Fire',      nightfall: 6, xp: 5, peril: 'Steep' },
    { type: 'journey', name: 'The Last Furrow',   mp: 14, timePenalty: 3, element: 'Water',     nightfall: 7, xp: 5 },
    { type: 'journey', name: 'Thunderfoot Road',  mp: 13, timePenalty: 2, element: 'Lightning', nightfall: 7, xp: 5, peril: 'Treacherous' },
  ]},
];

// 🌊 THE SUNLESS FATHOM (stage 4) — Fathomdread's country, and the exam. Its demand is **big
// AND first**, which four cards cannot give at once.
// 🔑 THE EXAM IS NOT A NEW RULE, IT IS THE OTHER THREE ARRIVING TOGETHER. Its hardship pool
// draws from all three lands, and its creatures are the first in the game to carry BOTH shapes —
// 🛡️ Armour wants the attuned blow, 🌀 Evasion wants the fast Catalyst, and one card cannot be
// both. That is Fathomdread's whole question, asked twenty times before you meet it.
// ⚠️ DOUBLE-SHAPED CREATURES ARE KEPT SMALL AND SOFT. A creature that is big, armoured, evasive
// AND hits hard is not an exam question, it is a wall — the Stormreach already taught us that a
// shape and a stat enforcing the same thing multiply.
const ROAD_FATHOM = [
  { name: 'The Tidewrack', hardshipChance: 0, hardships: [], encounters: [
    { type: 'fight',   name: 'Wrackling',      hp: 10, init: 4, atk: 3, atkEl: 'Water', shapes: ['armour', 'evasion'], shapeV: 1, xp: 5 },
    { type: 'fight',   name: 'Shoal Drifter',  hp: 15, init: 3, atk: 3, atkEl: 'Water', shape: 'armour', shapeV: 3, xp: 6 },
    { type: 'fight',   name: 'Glass Eel',      hp: 12, init: 5, atk: 3, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 5 },
    { type: 'fight',   name: 'Barnacle Ox',    hp: 12, init: 2, atk: 4, atkEl: 'Stone', shape: 'guard', shapeV: 1, xp: 6, ability: 'Backlash' },
    { type: 'journey', name: 'The Wrackline',   mp: 13, timePenalty: 1, element: 'Water',     nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Saltmarsh Road',  mp: 12, timePenalty: 2, element: 'Stone',     nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Lantern Shallows',mp: 14, timePenalty: 3, element: 'Fire',      nightfall: 5, xp: 5, peril: 'Updraft' },
    { type: 'journey', name: 'The Ebb Path',    mp: 11, timePenalty: 2, element: 'Lightning', nightfall: 6, xp: 4 },
  ]},
  { name: 'Drowned Kell', hardshipChance: 0.35, hardships: ['Riptide', 'Vertigo', 'Rationed', 'Night Travel'], encounters: [
    { type: 'fight',   name: 'Kell Warden',    hp: 12, init: 4, atk: 4, atkEl: 'Water', shapes: ['armour', 'evasion'], shapeV: 1, xp: 6 },
    { type: 'fight',   name: 'Silt Crawler',   hp: 17, init: 2, atk: 4, atkEl: 'Stone', shape: 'armour', shapeV: 3, xp: 7 },
    { type: 'fight',   name: 'Drowned Piper',  hp: 12, init: 5, atk: 4, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 6, ability: 'Ranged' },
    { type: 'fight',   name: 'Anchorback',     hp: 16, init: 3, atk: 4, atkEl: 'Fire',  shape: 'armour', shapeV: 3, xp: 6, ability: 'Backlash' },
    { type: 'journey', name: 'The Kell Stair',  mp: 14, timePenalty: 2, element: 'Water',     nightfall: 6, xp: 5, peril: 'Toll' },
    { type: 'journey', name: 'Bell Causeway',   mp: 13, timePenalty: 2, element: 'Stone',     nightfall: 6, xp: 5, peril: 'Steep' },
    { type: 'journey', name: 'Weedlight Reach', mp: 12, timePenalty: 3, element: 'Fire',      nightfall: 6, xp: 4 },
    { type: 'journey', name: 'The Undertow',    mp: 15, timePenalty: 2, element: 'Lightning', nightfall: 6, xp: 5, peril: 'Updraft' },
  ]},
  { name: 'The Black Shelf', hardshipChance: 0.5, hardships: ['Riptide', 'Squall', 'Dead Air', 'Ambush'], encounters: [
    { type: 'fight',   name: 'Shelf Sentinel', hp: 13, init: 4, atk: 4, atkEl: 'Stone', shapes: ['armour', 'evasion'], shapeV: 2, xp: 7 },
    { type: 'fight',   name: 'Fathom Ray',     hp: 13, init: 6, atk: 4, atkEl: 'Water', shape: 'evasion', shapeV: 1, xp: 6, ability: 'Windshear' },
    { type: 'fight',   name: 'Coldvein Worm',  hp: 12, init: 2, atk: 5, atkEl: 'Stone', shape: 'guard', shapeV: 1, xp: 7 },
    { type: 'fight',   name: 'Lanternjaw',     hp: 14, init: 4, atk: 4, atkEl: 'Fire',  shape: 'evasion', shapeV: 1, xp: 6, ability: 'Backlash' },
    { type: 'journey', name: 'The Shelf Road',  mp: 14, timePenalty: 2, element: 'Stone',     nightfall: 7, xp: 5, peril: 'Toll' },
    { type: 'journey', name: 'Nightcurrent',    mp: 13, timePenalty: 2, element: 'Water',     nightfall: 7, xp: 5, peril: 'Treacherous' },
    { type: 'journey', name: 'The Sounding',    mp: 14, timePenalty: 3, element: 'Lightning', nightfall: 6, xp: 5, peril: 'Updraft' },
    { type: 'journey', name: 'Emberdrown',      mp: 13, timePenalty: 2, element: 'Fire',      nightfall: 7, xp: 5 },
  ]},
  { name: "Fathomdread's Trench", hardshipChance: 0.6, hardships: ['Riptide', 'Exacting', 'Squall', 'Vertigo', 'Dead Weight', 'Rationed'], encounters: [
    { type: 'fight',   name: 'Trench Warden',  hp: 15, init: 5, atk: 5, atkEl: 'Water', shapes: ['armour', 'evasion'], shapeV: 2, xp: 7 },
    { type: 'fight',   name: 'Hadal Serpent',  hp: 15, init: 6, atk: 5, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 7, ability: 'Windshear' },
    { type: 'fight',   name: 'Pressureback',   hp: 19, init: 3, atk: 5, atkEl: 'Stone', shape: 'armour', shapeV: 4, xp: 7, ability: 'Backlash' },
    { type: 'fight',   name: 'The Pale Herald',hp: 14, init: 5, atk: 5, atkEl: 'Fire',  shapes: ['armour', 'evasion'], shapeV: 1, xp: 7, ability: 'Freeze' },
    { type: 'journey', name: 'The Trench Road', mp: 14, timePenalty: 2, element: 'Water',     nightfall: 7, xp: 6, peril: 'Toll' },
    { type: 'journey', name: 'Deadlight Deep',  mp: 14, timePenalty: 2, element: 'Fire',      nightfall: 7, xp: 5, peril: 'Treacherous' },
    { type: 'journey', name: 'The Long Descent',mp: 14, timePenalty: 3, element: 'Stone',     nightfall: 7, xp: 5, peril: 'Steep' },
    { type: 'journey', name: 'Stormfathom',     mp: 14, timePenalty: 2, element: 'Lightning', nightfall: 7, xp: 6, peril: 'Updraft' },
  ]},
];

const ROADS = { 1: REGIONS, 2: ROAD_STORMREACH, 3: ROAD_FELLGRIND, 4: ROAD_FATHOM };
// 🗺️ ⚠️ AT MODULE SCOPE BECAUSE TWO SCREENS NEED IT. It lived inside the Stash renderer as a
// local; the Workshop's hunt line would have been a second copy, and this project has watched the
// arrangement search reach FOUR copies before anyone extracted it. Extract at TWO.
const ROAD_NAME = { 1: 'The Ember Hollow', 2: 'The Stormreach', 3: 'The Fellgrind', 4: 'The Sunless Fathom' };
function roadFor(stage) { return ROADS[stage] || REGIONS; }

const ROLES = ['Spell', 'Element', 'Boost'];
const ZONES = ['Spell', 'Element', 'Boost', 'Reserve'];
// ============================================================
// 🔑 THE CLASS SEAM (2026-07-27). Read this before adding ANYTHING to combat.
//
// THE ENGINE owns, and every class inherits:
//   the four slots and "position is the role" · the Arsenal · deck-as-health and soaking ·
//   the Initiative race · Complete / Narrow / Loss · hardships, perils, Nightfall ·
//   coins, charms, the Wheel · cleanup (spent → discard, the rest → under the deck).
//
// THE CLASS owns exactly one thing: HOW AN ARRANGEMENT BECOMES NUMBERS. It supplies
//   compose()          → { value, element, init, boost, hits, ...display }
//   canPlace(id, slot) → is this placement legal
//   valid()            → can the turn resolve at all
//   spentIds()         → which cards are consumed; everything else slides under the deck
//   multi              → which slot (if any) may hold several cards
// and nothing else in the engine may reach past that.
//
// ⚠️ THE MAGE POURS. Other classes will not. A rogue may chain a sequence and never put two
// cards in one slot; a guardian may spend nothing and pay in damage taken. So:
//   • never assume S.assign.Spell is an array outside the class
//   • enemy defence SHAPES must be stated in engine terms — one big hit / many hits / speed —
//     never as "beaten by a deep pile", or the pile becomes universal through the back door
//   • `hits` exists on compose() for exactly that reason: the mage returns 1 big hit, a rogue
//     would return several, and Armour vs Guard can then read a number both classes produce.
// ============================================================

// ---- THE MAGE: one card per slot. ----
// ❌ THE PILE WAS CUT 2026-07-28. Pouring several cards into the Spell cost you the OTHER SLOTS -
// that was its whole price - so the deeper you poured, the more slots 2-4 stopped existing. Depth
// and "every slot poses a fork" were therefore eating each other, and it could not be patched
// because it is the definition of both. With a FOUR-card hand a pour costs a quarter of your turn,
// so depth was either trivial (lose the Arsenal) or self-defeating (lose everything) - which is
// why it measured as a coin-flip that changed the outcome only 13-20% of the time. The pile is a
// mechanic for a bigger hand. Tension now comes from WHERE each card goes, not how many you burn.
const SLOTS = ['Element', 'Boost', 'Reserve'];
// what a card contributes as the Spell. Kept as a function because the class layer, the card
// face and the level-delta readout all ask the same question.
function cardValue(card) { return card ? eff(card).value : 0; }
// ✦ ATTUNING RESTORED 2026-07-29. Read the block above `elOf` for the rule; read this for WHY.
// With one card per slot and each slot reading a DIFFERENT stat (value / init / boost), the turn
// decomposed into three independent maximisations - biggest, fastest, fattest - and the 4x4 deck
// guaranteed it, because the archetypes deliberately separate exactly those three stats. Tension
// is CONTENTION: a slot has to want a card another slot also wants. Element is the only axis you
// cannot maximise - you can only match it - so it puts the Catalyst back on two incomparable
// axes at once and asks the one question the turn was missing:
//        STRIKE FIRST, OR STRIKE HARD?
// And the enemy's SHAPE answers it differently every fight: Armour eats a flat chunk so it wants
// the attuned hit; Evasion halves you unless you win Initiative so it wants the fast Catalyst.
// The encounter poses the question, the hand constrains the answer.
// ⚠️ CLASS SEAM: this lives entirely inside MAGE.compose(). The engine never sees an element -
// pairing is the MAGE's source of power, and a rogue chains, a guardian retaliates.
// 🔥 THE EMBERWAKE - the Surge's second job (Thomas's design, 2026-07-29).
//
// THE PROBLEM IT SOLVES: a flat +N to a threshold check is worth nothing outside a narrow band.
// Measured over 6400 hands, the Surge changed NOTHING on 30% of turns (9% you lost anyway, 5% you
// had already won, 16% stuck on Narrow either way) - and when it did matter you simply took your
// biggest-boost card 86% of the time. Three turns in ten the slot was dead weight and the other
// seven it was a sort. ❌ Going back to the old Attack-or-Initiative picker was rejected: it
// measured 13%, then 4% after doubling, because Initiative's payoff is CAPPED and Attack's is not.
//
// THE RULE: if your SURGE shares your CATALYST's element, its boost does not fire this turn - it
// BANKS as a token worth the WHOLE boost (it was half until 2026-08-12; see bankValueOf). At the
// start of your next turn you aim that token at ⚔️ attack, 💨 initiative or 🛡️ armour.
//
// 🔑 WHY THIS IS THE GOOD VERSION: you bank BLIND but you spend INFORMED - next turn you can see
// the encounter before choosing where the power lands. And the element pair becomes a currency you
// can only spend ONCE: pair it with the Spell to ATTUNE, or with the Catalyst to BANK. Both at once
// needs three of a kind (11% of hands), so it is a genuine either/or, available 85% of the time,
// and expressed through ARRANGEMENT rather than a button.
// Measured target split at a +3 token: 🛡️ armour 55% · ⚔️ attack 35% · 💨 initiative 7%.
// ⚠️ Initiative reads low and that is NOT this mechanic's fault - only 4 of the 16 cards have init
// 6+, so when you lack a SPARK you are short by 5-9, not 1-3. The gap is a chasm and a token cannot
// bridge a chasm. The fix is a floor under init, and it is deliberately a separate change.
// ============================================================
// ❌ THE PRISM IS CUT (2026-08-05, Thomas). DO NOT REINTRODUCE IT AS A FREE DRAW.
//
// It let an all-four-elements hand (no pair, so nothing can attune) draw one and discard one.
// Thomas: "it feels a bit weird like, you got an unlucky hand that can't fuse, lets help you out
// a little bit. in tcgs, if you get a bad hand, then you get a bad hand."
//
// 🔑 AND THE MEASUREMENT WAS WORSE THAN THE INSTINCT. Over ~4,000 turns, a rainbow hand
// happens on 14% of turns, and with the Prism those turns ended 68C/30N/3L against 60C/36N/4L for
// an ordinary hand. A BAD HAND WAS BETTER THAN A GOOD ONE - you got card SELECTION and then ended
// up with a pair anyway, while a normal hand got the pair and no selection. It did not soften
// variance, it overpaid for it by ~22 points of Complete rate.
//
// With it gone, a rainbow hand lands at 46C/44N/9L - clearly worse, but not a dead turn (you still
// Complete or Narrow 90% of the time). That is a HARD PROBLEM, which is what the compass asks for.
// ⚠️ And the run-level difficulty did not move at all: 61% Complete with it and without it.
// The Prism was never holding the game up; it was moving 14% of turns to best-in-the-game.
//
// ⚠️ IF A RAINBOW HAND EVER FEELS TOO PUNISHING, THE ANSWER IS NOT THIS RULE AGAIN - it is the
// COSTED version parked in 08_Ideas/Prism_Costed.md: draw one, discard one, and the discarded card
// is gone for the RUN rather than the region. Same out, but a price instead of a gift. (Losses on
// rainbow turns do triple, 4% -> 9%, and unlike a TCG you cannot play a bad hand out over several
// turns - one hand IS one creature - so that is the argument to watch for.)
// ============================================================

// 🔥 BANKING IS A CHOICE, NOT A COINCIDENCE (2026-08-12). It used to fire when your Surge shared
// your Catalyst's element — and that gate is what killed the mechanic, for a reason worth keeping:
//
// 🔑 THE TRIGGER WAS RANDOM BUT THE REASON IS SITUATIONAL, AND THEY NEVER LINED UP.
// You want to bank when THIS turn is already decided — measured at 33.7% of turns, where removing
// the boost entirely changes nothing (15.4% stuck on Narrow · 9.4% lost anyway · 8.9% already won).
// That is a property of the ENCOUNTER. You were ALLOWED to bank when the deal handed you two
// same-element cards — a property of the SHUFFLE, ~54% of hands. Independent events. So the option
// appeared when you did not want it and was missing when you did, and it read as a curiosity rather
// than a tool. Thomas: "i feel like i have to choose to do it."
//
// ⚠️ AND AN ELEMENT-GATED RULE CAN NEVER LEAVE THE MAGE. Pairing is the one thing the CLASS owns;
// a rogue has no elements, so an element-gated bank sits in the engine's slot ③ wired to a class
// rule and could never be inherited. As a plain choice it is an ENGINE rule and all eight planned
// classes get it free — the "+1 class = xN content" trade, on a rule-changer that should always
// have been generic.
//
// What makes it HARD is already built: 🕯️ the candle. Lit, you can see the next encounter's HP,
// Initiative and shape, so banking is informed. Out, it is a bet that next turn's problem is bigger
// than this one's. An existing system does the work instead of a new rule.
// ⚠️ EVERY Emberwake consumer asks the CLASS first — it is the mage's slot ③, not the engine's.
function hasEmberwake() { return !!(CLASS && CLASS.emberwake); }
function banksNow() {
  return !!(hasEmberwake() && S.bankArmed && cardById(S.assign.Boost));
}
// ⚠️ ARMED PER TURN, CLEARED WITH THE TURN. Anything that outlived its turn would be a charm.
function toggleBank() {
  if (!hasEmberwake() || !isAssignPhase() || !cardById(S.assign.Boost)) return;
  S.bankArmed = !S.bankArmed;
  render();
}
// 🔥 THE BANK IS THE FULL BOOST (2026-08-12, was ceil(boost/2)). At half, banking paid you back
// 50% for 100% — a 2:1 loss you could only justify if AIMING the token were worth 2×, and the
// measured aim went to ⚔️ attack 100% of the time, i.e. at exactly what the unbanked boost was
// already doing. Worth ~1×. So it was a tax wearing a fork's clothes, taken on 0.8% of turns.
// ⚠️ AND THE ELEMENT GATE WAS NOT THE CAUSE: an arrangement that banks AND still attunes exists
// in 53.6% of hands (combinatorics over all 1820 four-card hands). It was never unavailable —
// it was never worth taking. At full value it is a pure tempo trade: move this boost to next
// turn, and pick its target. Correct on the ~30% of turns the Surge already changes nothing.
// 🔥 CHANNELLING PAYS INTEREST (2026-08-22). Thomas: *"i want the emberwake to be a bigger part of
// her kit.. the way to get it is probably not good enough"* — and then, on the fix:
// *"we can think of it as like.. channeling or charging up which seems to fit lore wise for a mage."*
// ✅ That is the name the original slot-③ proposal used ([[Class_System]]: *"CHANNELLING … banked as
// an Emberwake worth more next turn"*). He arrived back at it independently; the vocabulary is his.
//
// 🔑 THE FAULT WAS THAT THE TRADE WAS BREAK-EVEN BY CONSTRUCTION. You gave up N this turn to get
// exactly N next turn, so the only turn it was ever correct on was one that did not need the boost.
// Measured: a Surge card is seated **100%** of turns — availability was never the problem — but
// banking was FREE on only **47%** (already won 18% · already lost 12% · stuck on Narrow 18%) and
// **cost an outcome tier on 53%**. 🔑 A MECHANIC YOU ONLY USE WHEN THE TURN IS ALREADY DECIDED IS
// A CONSOLATION PRIZE, NOT A KIT — which is exactly the feeling reported.
// ⚠️ And the design always said *worth MORE next turn*; that half simply was never built.
//
// 🔑 PROPORTIONAL, NOT FLAT, AND THE REASON IS THE FORK. Flat interest is proportionally biggest on
// a SMALL boost, so you would dump your junk card into the Surge slot — the slot becomes a bin.
// ×1.5 makes channelling a BIG boost best, so you put a strong card in ③ *in order to* channel it,
// giving up using it as your Spell or Catalyst. **That is contention for one card**, which
// [[The_Arsenal_Question]] records as one of only three fork mechanisms that have ever worked here
// (the others being an enemy shape and a run-layer price; a rule bolted onto a slot has failed 3×).
// 📏 Mean boost is 5.0 (spread 1-13), so an average Emberwake goes 5 → 8 against a duel blow of ~15.
// ⚠️ ✦ Backdraft doubles the result, so it now reads ×3 of the raw boost. Watch it.
// 🔥 BANK_MULT 1.5 → 1.0 (2026-08-22). ⚠️ THIS REVERSES THIS MORNING'S CALL, and the reason
// is that the morning's call was measured against a FINALE THAT THREW THE WAKE AWAY (build 339).
// 🔴 ANY INTEREST RATE ABOVE 1.0 IS UNCONDITIONAL PROFIT IN A DUEL. Against a fixed HP pool,
// delaying damage costs nothing as long as another beat comes — and in the finale it always does.
// So BANK_MULT is not a dial, it is a SWITCH: above 1.0 channelling every beat is simply correct.
// 📏 Measured at a channelling policy (n=100/stage), gain over never channelling:
//     ×1.0 → +2/14/9/10   ×1.1 → +27/33/40/43   ×1.5 → +33/45/64/55
// Thomas, playing it: *"mage starting to feel a bit easy with emberwake making some of my damage
// be like 25+"*. He is describing ×1.5 exactly.
// ✅ AND THE GOOD NEWS THE SWEEP FOUND: at ×1.0 — pure deferral, zero interest — channelling is
// STILL worth +10-15 points, because 🔑 CONCENTRATION beats flat 🛡️ ARMOUR. One big blow loses
// `armour` once; two small ones lose it twice. That is *lateral power, not vertical*: better into
// Armour, neutral into Evasion, and it costs a turn of tempo. The interest was never what made
// channelling good — it was what made it MANDATORY.
// ⚠️ Its DISPLAY had to change with it: "+5 next turn (it was worth +5 now)" reads as a pure
// loss. The reveal now names the real payoff — you carry it, and you choose where it lands.
let BANK_MULT = 1.0;
// 🔥 ×2 while the Emberwake Band is broken this turn. ⚠️ HERE, in the ONE place a bank is
// valued, so the Surge row, the reveal line and the token can never disagree about the number.
function bankValueOf(surge) { return surge ? Math.ceil(eff(surge).boost * BANK_MULT) * (S && S.armourTwin ? 2 : 1) : 0; }
// ⚠️ THE BANK NOW HAS TWO STORIES, SO NOTHING MAY HARD-CODE THE OLD ONE. Banking normally costs
// you the boost this turn, but ✦ Motherlode buys that price off — and three log lines plus a slot
// hint all used to state "feeds nothing now" as a fact. Same trap as ✦ Second Flame: when a second
// way for something to happen appears, every line that explains the FIRST way is now a lie.
// One helper, asked by all four.
function bankCostPhrase(surge) {
  const v = verbOf(surge);
  return (v && v.slot === 'Boost' && v.name === 'Motherlode')
    ? '✦ Motherlode — and it still feeds this turn'
    : 'so it feeds nothing now';
}
// 🔥 TWO TARGETS, NOT THREE (2026-08-12). 🛡️ armour was cut: measured over 3,357 turns at a FULL
// -value token it was chosen 2.3% of the time, and it is the one target 🕯️ the candle cannot
// inform — it prints the next encounter's HP, Initiative and shape, none of which argue for soaking.
// ⚔️/💨 map exactly onto the two defence shapes, so the aim is now "hit harder, or get there first".
//
// 🔑 AND THE REASON 💨 LOOKED DEAD WAS A STALE COMMENT, NOT A DEAD OPTION. The old note here said
// the Initiative gap was "a chasm and a token cannot bridge a chasm" (short by 5-9, not 1-3). It
// asked for a floor under init as a separate change — INIT_FLOOR and creature init -2 SHIPPED, and
// nobody came back to correct the note. Measured now: average deficit 3.0, median 3, and a
// full-boost token (avg 5.9) closes it 84.6% of the time. 💨 reads low only because you lose the
// race on just 16.4% of fights — and the bot aims at the creature in front of it, which is exactly
// the case a human does NOT have: seeing on the candle that the next one is fast and banking for it.
const WAKE_TARGETS = { atk: '⚔️ attack', init: '💨 initiative' };
// the token is only aimable while you can still see the encounter and change your mind
function wakeReady() { return hasEmberwake() && S.wake > 0 && isAssignPhase(); }
// 🎴 AIMED BY TAPPING THE TOKEN ITSELF (2026-08-21). It used to be a labelled row of buttons in
// the controls panel, which meant the Emberwake was drawn in TWO places — a prose line in the
// status bar saying what you held, and a button row somewhere else for doing something with it.
// 🔑 A TOKEN YOU CAN ACT ON IS THE CONTROL. Picking it up and putting it on a target is the
// board-game gesture, and it collapses the two displays into the one object.
// ⚠️ It never cycles back to UNAIMED: an unaimed Emberwake simply gutters out, so "no target" is
// not a choice anyone would make — offering it would be the picker rule again, an option that is
// never correct. First tap aims at ⚔️ attack (indexOf(-1) + 1 === 0), then it toggles.
function cycleWake() {
  if (!wakeReady()) return;
  const keys = Object.keys(WAKE_TARGETS);
  S.wakeTarget = keys[(keys.indexOf(S.wakeTarget) + 1) % keys.length];
  render();
}

// ============================================================
// 🕯️ THE CANDLE (2026-07-29, Thomas). While it is lit you can see the NEXT encounter.
//
// 🔑 WHY FORESIGHT, AND WHY IT MUST BE LOSABLE. Thomas: "theres still a feeling of just finding
// the one best play instead of weighing between 2 or a few plays." The diagnosis: every fork in
// the mage's turn cashes out to the SAME scoreboard - this encounter's outcome - so one option is
// always better and skill is search rather than judgement. The game has a second currency, the
// DECK, and exactly one place they collide: the Spell is SPENT. But nobody can price that trade
// blind, so the rational default is always "win now" (measured: the Spell is your biggest card
// 82-94% of the time). Showing the next encounter makes the price payable:
//     "Complete this with my Hammer - or take the Narrow and still hold it for the Boar."
// Those are not rankable. One buys an outcome, the other buys a future.
//
// 🔑 AND A REVEAL YOU CAN LOSE IS A RESOURCE; ONE YOU ALWAYS HAVE IS A UI FEATURE. Making it
// losable gives you something to protect, turns foresight into a DIAL (the ranger's candle will
// not go out, or sees two ahead - so foreknowledge stays their identity), and hands later stages a
// difficulty lever that is not a bigger number. It also earns the title back: the candle was
// retired from the UI vocabulary in 2026-07-26 and had survived only in the art.
//
// ⚠️ ONLY A COMPLETE KEEPS IT. Outcomes run Complete 62% / Narrow 35% / Loss 3%, so snuffing on
// a Loss alone would put it out 3% of the time - decoration with a nice name. Snuffing on anything
// short of a clean win puts it out about a third of the time, which is a real presence and never a
// spiral, because a single Complete brings it back. It also finally gives NARROW its own identity:
// until now Complete and Narrow differed only by "you take damage". Now the choice between them is
//     "a safe Narrow and eat 2 - or push for the Complete and keep seeing the road"
// which is two currencies that do not convert, on the most common turn in the game.
// 🌙 Nightfall snuffs it too: being caught after dark already takes your Arsenal, and now it
// costs you your footing - the first time your Catalyst's Pace has a consequence outliving its turn.
// ============================================================
function lightCandle(why) {
  if (S.candle) return;
  S.candle = true;
  log(`🕯️ Your candle catches again${why ? ' — ' + why : ''}. You can see the road ahead.`, 'good');
}
function snuffCandle(why) {
  if (!S.candle) return;
  // 🕯️ Deepglass Crown — the legendary version of Farseer's Circlet, which only survives a Narrow.
  if (hasArmourRule('everlit')) { log(`🛡️ <b>Deepglass Crown</b> — the flame does not gutter.`, 'good'); return; }
  // 🧪 Tallow Stub — one turn's insurance on the thing the whole road pays for
  if (S.potionFx && S.potionFx.keepCandle) { log(`🕯️ The tallow holds — your candle survives ${why}.`, 'good'); return; }
  // 🏕️ A Steady Flame — the same insurance, taken at the door instead of bought.
  // ⚠️ It is SPENT here rather than checked, and it is on the status bar until then: *any
  // persistent modifier must be on screen every turn*, and a one-shot that vanishes silently is
  // the Mirror Fen bug in miniature - you would never learn whether it fired.
  if (S.candleGrace > 0) { S.candleGrace--; log(`🕯️ <b>A Steady Flame</b> holds — your candle survives ${why}.`, 'good'); return; }
  S.candle = false;
  log(`🕯️ Your candle gutters out — ${why}. You cannot see what is coming.`, 'bad');
}
// what waits after this one, if you can see it
function nextEncounter() {
  if (!S.candle || S.finalMode) return null;
  // ⚠️ ON THE MAP THERE IS NO SINGLE NEXT ENCOUNTER - there are the roads you can take, and the
  // queue this used to read is not what chooses them any more. Returning a stale queue entry made
  // the status line name a creature that was not coming. 🔑 When a system stops driving something,
  // find every reader that still trusts it.
  if (S.map) return null;
  return S.encounterQueue && S.encounterQueue.length ? S.encounterQueue[0] : null;
}

// ⚡ SQUALL — accord only at speed. Stated class-blind (the ENGINE asks "did you win Initiative",
// the CLASS decides what accord means), so a rogue's chain would be gated the same way.
function squallBlocks() {
  if (S.hardship !== 'Squall' || !S.encounter || S.encounter.type !== 'fight') return false;
  const el = cardById(S.assign.Element);
  return !el || eff(el).init < S.encounter.init;
}
function attunedNow() {
  // ⚠️ PAIRING IS THE MAGE'S RULE AND ONLY THE MAGE'S. Caught by the rogue seam proof: rogue cards
  // carry `element: null`, and the match below is `elOf(c) === elOf(sp)` — so null === null read as
  // ATTUNED and every rogue turn claimed a pair it does not have.
  // 🔑 A CLASS RULE THAT COMPARES TWO FIELDS WILL HAPPILY MATCH TWO ABSENCES. Ask whose rule it is
  // before you ask whether it fired.
  if (!CLASS.pairs) return false;
  if (S.hardship === 'Dead Air') return false;   // 🔇 nothing finds accord
  if (squallBlocks()) return false;              // ⚡ Squall — too slow to hold together
  if (duelFx().noAttune) return false;           // 🐉 Silt — the water dulls everything
  const sp = spellCard(); if (!sp) return false;
  const el = cardById(S.assign.Element);
  const matches = c => !!(c && (c.def.wild || elOf(c) === elOf(sp)));
  // ✦ SECOND FLAME - the Surge becomes a second place a pair can happen, so the Catalyst is free
  // to be chosen purely for speed. Closest thing in the game to playing a different class.
  if (hasCharm('secondflame') && matches(cardById(S.assign.Boost))) return true;
  // ✦ KINDLED ARSENAL — the carried card can be the match too
  if (hasCharm('kindledarsenal') && matches(cardById(S.assign.Reserve))) return true;
  // ✦ LOOSE WEAVE - any Catalyst attunes. The bonus is halved in compose(), so this is a real
  // trade: you attune almost every turn and your ceiling drops.
  if (hasCharm('looseweave') && el) return true;
  return matches(el);
}
// ⚠️ WHICH CARD DID IT. Until Second Flame and Loose Weave existed, "attuned" always meant
// "the Catalyst matched", and three log lines plus the slot hints simply said so. Adding a second
// way to attune CRASHED the reveal (`elem.def` on a null Catalyst) and would have made the Catalyst
// claim credit for the Surge's work. 🔑 The display has to read the same source as the rule -
// so the rule now names its own cause and every line asks for it.
function attunerCard() {
  const sp = spellCard(); if (!sp) return null;
  const matches = c => !!(c && (c.def.wild || elOf(c) === elOf(sp)));
  const el = cardById(S.assign.Element), bo = cardById(S.assign.Boost);
  if (matches(el)) return el;
  if (hasCharm('secondflame') && matches(bo)) return bo;
  if (hasCharm('kindledarsenal') && matches(cardById(S.assign.Reserve))) return cardById(S.assign.Reserve);
  if (hasCharm('looseweave') && el) return el;   // attuned, but only loosely
  return null;
}
// did this attune only because of Loose Weave? (i.e. nothing actually matched)
function looseOnly() {
  if (!hasCharm('looseweave')) return false;
  const sp = spellCard(); if (!sp) return false;
  const matches = c => !!(c && (c.def.wild || elOf(c) === elOf(sp)));
  if (matches(cardById(S.assign.Element))) return false;
  if (hasCharm('secondflame') && matches(cardById(S.assign.Boost))) return false;
  if (hasCharm('kindledarsenal') && matches(cardById(S.assign.Reserve))) return false;
  return true;
}
function spellCard() { return cardById(S.assign.Spell); }
function removeFromZone(id) {
  if (S.assign.Spell === id) S.assign.Spell = null;
  for (const z of SLOTS) if (S.assign[z] === id) S.assign[z] = null;
}

// ✦ the attuned strike, with the mage's two rule-charms folded in. Kept OUT of compose() so the
// arithmetic stays readable: base -> Loose Weave halving -> Three of a Kind doubling.
function mageStrike(spell, attuned, elem, boostC) {
  const st = eff(spell);
  // ✦ COLD IRON — pays you for NOT pairing, which is the only charm that makes a rainbow hand
  // (all four elements, no pair possible) something you wanted. Anti-synergy with every other mage
  // charm by construction, which is exactly what makes choosing it a build rather than a pickup.
  if (!attuned) return st.value + (hasCharm('coldiron') ? 3 : 0);
  // ✦ LOOSE WEAVE: an unmatched pair attunes for only a THIRD of the bonus (was a half,
  // 2026-08-24). ⚙️ LOOSE_CUT is the dial — 2 restores the old half.
  let v = looseOnly() ? st.value + Math.floor((st.attuned - st.value) / LOOSE_CUT) : st.attuned;
  // ✦ THREE OF A KIND: pair attunes, three RESONATES. Requires a genuine match by construction -
  // if all three share an element then the Catalyst matches the Spell, so it can never stack with
  // a Loose Weave freebie.
  if (hasCharm('threekind') && elem && boostC) {
    const e = elOf(spell);
    if (elOf(elem) === e && elOf(boostC) === e) v *= 2;
  }
  return v;
}

const MAGE = {
  id: 'mage',
  mark: '✦',
  multi: null,                          // no slot holds more than one card
  labels: { Spell: 'Spell', Element: 'Catalyst', Boost: 'Surge', Reserve: 'Arsenal' },
  // 🐛 WAS `null` WITH A COMMENT PROMISING IT WOULD BE SET "below" - and nothing ever set it
  // (found 2026-08-18). CARD_DEFS is declared ~700 lines ABOVE this, so the deferral was never
  // needed. ⚠️ `CLASS.defs` is read by SAVE and LOAD to serialise cards by index, so the mage
  // was round-tripping through a null. 🔑 A COMMENT THAT DESCRIBES A FIXUP IS NOT THE FIXUP -
  // I trusted this line's own note instead of checking, and it silently broke a charm filter.
  defs: CARD_DEFS,
  deck() { return shuffle(CARD_DEFS.map(newCard)); },
  pairs: true,                          // ✦ elements agree → the Spell attunes. The mage's one rule.
  boosts: true,                         // ➕ the Surge adds a printed number — the rogue's does not
  // 🔥 THE EMBERWAKE IS THE MAGE'S FILL OF SLOT ③, NOT AN ENGINE RULE (corrected 2026-08-12).
  // ⚠️ I got this backwards earlier the same day. Making banking a plain choice fixed two REAL
  // faults — a trigger that came from the shuffle rather than the encounter, and a 2:1 exchange
  // rate — but I then argued it should therefore be generic "so every class inherits it".
  // 🔑 THAT IS THE ONE SLOT NO RULE MAY BE GENERIC IN. The slot contract says ①②④ each feed an
  // engine system and are therefore constrained, and ③ feeds nothing — which is exactly why it is
  // the free space where a CLASS poses its signature fork. A generic rule sitting in ③ does not
  // give every class a gift; it spends the only room each class had.
  // So: flag it, and gate every consumer. A rogue's ③ is its own (extend the chain, or cycle).
  name: 'Mage',
  emberwake: true,
  // 🎭 THE PASSIVE TRAIT (2026-08-18). Thomas: *"lets give them a passive trait, just so
  // players can see what they do at a glance on the character select screen."*
  // 🔑 A CLASS IS ITS SLOT-③ FORK, AND UNTIL NOW THE ONLY PLACE THAT WAS STATED WAS INSIDE A
  // RUN. [[Class_System]] says a class is *what unlocks a card's big value*; the picker was
  // describing flavour instead. The trait is that fork, named, on the screen where you choose.
  // ⚠️ It is a DESCRIPTION, not a new rule - it names the mechanic that already exists, so it
  // cannot drift from the game as long as it is written from the code.
  trait: { icon: '🔥', name: 'Emberwake',
    text: '<b>Channel</b> your Surge instead of spending it. You carry it into next turn as <b>one bigger blow</b>, aimed at your <b>strike</b> or your <b>speed</b>. One big hit beats 🛡️ Armour, which is only subtracted once.' },
  // 🏅 WHAT THE GRADE CALLS CRAFT — the mage's source of power is PAIRING, so availability is
  // "does this hand hold a same-element pair" and finding it is attuning.
  // ⚠️ THE ENGINE MAY ASK *was your power available, did you use it*; only the CLASS may say
  // what its power IS. This used to live in the engine as a bare element check, which credited
  // the rogue with phantom chances every turn — see the note at the craft tracker.
  // how many blows this card lands as the Spell — the mage never splits.
  // ⚠️ compose() used to compute hits INLINE and this only fed the card face - two readings of
  // one fact, which is how 🃏 the card printed `◆8` while the maths did `◆12×2`. It is the single
  // source now: compose() asks this, so the face and the resolution cannot disagree.
  hitsOf(c, isStrike) { return (c.def.hits || 1) + extraHits(isStrike); },
  // what gets added to EACH blow rather than divided across them — see `added` in computeAction.
  // ⚠️ `card` is the Spell being drawn, because 🗡️ Keen Edge reads ITS level. 💨 Slow
  // Strength is deliberately absent: it depends on Initiative, which the face cannot know - the
  // same precedent as the rogue's blade verb, whose bonus depends on the fuel card.
  perHitBonus(card) { return (S.potionFx ? S.potionFx.value : 0) + charmStrike(card); },
  craft: {
    label: 'attuned', gate: 'attune',
    avail(hand) { const els = hand.map(c => elOf(c)); return els.some((e, i) => els.indexOf(e) !== i); },
    found(r) { return !!r.enhUsed; },
  },
  // 🎴 THE MAGE'S BOARD STATE. The banked Surge is a thing on the table until it is spent or
  // gutters out, and tapping it is how you aim it — see cycleWake().
  // ⚠️ CLASS-OWNED ON PURPOSE. The Emberwake is the mage's slot ③ and a rogue must never inherit
  // it by sharing an array; that is the same mistake as making the rule generic, one layer down.
  tokens() {
    if (!S.wake) return null;
    return [{
      id: 'wake', icon: '🔥', name: 'Emberwake', count: S.wake,
      worth: S.wakeTarget ? `→ <b>${WAKE_TARGETS[S.wakeTarget]}</b>` : '<b>unaimed</b> — tap to aim it',
      // 🔑 EVERY TOKEN SAYS HOW IT DIES, and this one has two deaths — ✦ Deepwell buys it an extra
      // turn, and a note that stated only the usual one would be the ✦ Second Flame trap again:
      // a second way for something to happen, with every line still explaining the first.
      note: S.wakeDeep ? '✦ Deepwell — it survives one unspent turn' : 'spend it or lose it',
      tap: wakeReady() ? 'cycleWake()' : null,
    }];
  },
  canPlace() { return true; },
  valid() { return !!spellCard(); },
  spentIds() { return S.assign.Spell ? [S.assign.Spell] : []; },
  compose() {
    const spell = spellCard();
    if (!spell) return null;
    const elem = cardById(S.assign.Element);
    const boostC = cardById(S.assign.Boost);
    const attuned = attunedNow();
    const st = eff(spell);
    // ✦ Lv4 verbs that shape the strike and the race (see VERBS). Each is checked BY SLOT, so a
    // card carrying one contributes nothing special anywhere else — that is the brake.
    const vSpell = verbOf(spell), vElem = verbOf(elem);
    // 🔥 a banked Surge gives NOTHING this turn - that is the price of aiming it next turn
    const banks = banksNow();
    // ✦ Motherlode pays the bank's PRICE for you · Backdraft doubles what it banks
    const vB = verbOf(boostC);
    let bank = banks ? bankValueOf(boostC) : 0;
    if (banks && vB && vB.slot === 'Boost') {
      if (vB.name === 'Backdraft') bank *= 2;
    }
    // ✦ MOTHERLODE (rewritten 2026-08-12). Its old job — "keeps the FULL boost, not half" — became
    // a no-op the moment the bank went to full value. A verb must name what the rule COSTS you, so
    // it now buys off the one price banking still charges: the boost fires this turn as well.
    const lode = banks && vB && vB.slot === 'Boost' && vB.name === 'Motherlode';
    const w = S.wake || 0, wt = S.wakeTarget;
    return {
      value: Math.max(0, mageStrike(spell, attuned, elem, boostC) + (wt === 'atk' ? w : 0)
        + (attuned && vElem && vElem.name === 'Firstflame' ? 3 : 0)
        + (duelFx().value || 0)),                       // 🐉 Deep Pressure
      element: spell.def.element,
      init: (elem ? eff(elem).init : 0) + (wt === 'init' ? w : 0)
        + (banksNow() && verbOf(boostC) && verbOf(boostC).name === 'Quickspark' ? 3 : 0),
      boost: (banks && !lode) ? 0 : (boostC ? eff(boostC).boost : 0),
      hits: CLASS.hitsOf(spell, true),   // ⚡ a forking card prints its own; grants add to it
      attuned, attBonus: st.attuned - st.value,
      // 🔑 THE BONUS ACTUALLY APPLIED, not the one on the card. ✦ Loose Weave halves it, and the
      // reveal was printing the FULL bonus regardless — see attunedLineText.
      attApplied: attuned ? (looseOnly() ? Math.floor((st.attuned - st.value) / 2) : st.attuned - st.value) : 0,
      cardVal: st.value,
      banks, bank, wake: w, wakeTarget: wt,
      vSpell: vSpell && vSpell.slot === 'Spell' ? vSpell.name : null,
      vElem: vElem && vElem.slot === 'Element' ? vElem.name : null,
      spell, elem, boostC,
      attuner: attunerCard(), loose: looseOnly(),
    };
  },
};

// ============================================================
// ============================================================
// 🗡️ THE ROGUE — ENERGY, THE PAIR, AND MOMENTUM (third design, 2026-08-12).
//
// ⚠️ TWO DESIGNS WERE THROWN AWAY BEFORE THIS ONE AND BOTH FAILURES ARE WORTH KEEPING:
//   v1 THE CHAIN — your Strike had to follow the card you struck with LAST turn. A pair is only
//      four physical cards and the Strike is spent every turn, so the chain consumed the thing that
//      sustained it. Measured average length 1.35: off seven turns in ten.
//      🔑 A CROSS-TURN CONDITION IS A CROSS-TURN COST — you cannot see it or plan around it.
//   v2 BUILDERS / FINISHERS — legible, but the turn was a mode switch rather than a decision, and
//      Thomas simply did not enjoy it. 🔑 A MECHANIC CAN BE PERFECTLY CLEAR AND STILL BE FLAT.
//
// WHAT SURVIVED BOTH: the eight names, the four pairs, 🧱 GUARD, hits-divide-and-Armour-is-paid-
// per-hit, and the class seam. Everything else here is new.
//
// THE TURN ASKS FOUR THINGS, and every one of them is answered by a number printed on a card:
//   ① STRIKE   costs ⚡. Paid in full it deals its ◆ damage; short, it deals its plain ⚔️.
//   ② COMBO    your Initiative — and its PAIR fires that card's VERB.
//   ③ ENERGY   burn a card to pay; it provides its own ⚡.
//   ④ ARSENAL  the card you keep. Identical in every class, as always.
//
// 🔑 SLOT ② IS THE SQUEEZE, AND IT IS THE MAGE'S TENSION REACHED BY ANOTHER ROAD: the card you
// want there for the PAIR is competing with the card you want there for SPEED. The mage's Catalyst
// has exactly that problem via elements; the rogue's has it via names, and the pair pays twice.
//
// ⚠️ THE CARD'S SECOND NUMBER IS BACK, WITH A ROGUE MEANING. ✦ was the mage's attuned value and
// this class cannot attune — but the COLUMN is reused rather than deleted, which is the right way
// round: a rogue card carries five numbers, exactly the density of a mage card, and nothing on it
// belongs to a mechanic it does not have.
// ============================================================
// ● MOMENTUM IS AN UNTOUCHED STREAK (rebuilt 2026-08-17, third design and the first one that is
// not a currency). Thomas: *"i do want to keep these momentum tokens, but i want it feel good
// getting it, and be fun trying to keep up the momentum."*
//
// 🔑 THE MISTAKE IN THE FIRST TWO DESIGNS WAS BUILDING A WALLET AND ASKING WHAT IT BUYS. He never
// once said *spend* — he said *keep up*. If the fun is in maintaining it then the decision lives on
// every turn in between, not at the cash-out, so it must not be a currency at all.
//
// ⚠️ AND THE OLD ONE FAILED TWICE OVER, both faults already named elsewhere in this file:
//   GETTING it felt like nothing — a pip was CHANGE FROM A PURCHASE (surplus ⚡ you overpaid),
//     an accounting remainder rather than an event.
//   SPENDING it was impossible — the two targets were 💨 Initiative, which she already wins on
//     99–100% of turns (`outpace`'s fault: it reprints a freebie), and 🎯 hits, which is correct
//     only against 🧱 Guard and Guard is on no creature (measured dead in every real encounter).
//   Result: earned 0.88 a turn, spent 0.13. 🔑 THE METER WAS NEVER BROKEN. THE SHOP WAS EMPTY.
//   ⚠️ I read that as "players don't engage with meters" for three designs running.
//
// 🔑 DECAY WAS THE OTHER HALF OF THE PROBLEM: losing 1 a turn is EROSION, not pressure. Nothing you
// did caused it, so there was nothing to try at. A streak is fun because BREAKING it is an event
// and the event is your fault.
// ⚠️ `let`, not const — these three define the SHAPE of the streak and the shape is the whole
// question. 📏 Measured 2026-08-22: at a 53% clean-turn rate a reset-on-any-damage streak yields
// **1.13 pips** and reaches a cap of 5 **4.2%** of the time — predicted from p alone, and the game
// measured 1.0 and 4%. 🔑 MOMENTUM IS NOT MISTUNED, IT IS ARITHMETICALLY DETERMINED: expected
// length is p/(1−p) and P(cap) is p^cap, so **no payout tuning can deepen it** — only p, the cap,
// or the reset RULE can. And p just went DOWN, because damage went up.
let MOMENTUM_CAP = 3;
let MOMENTUM_STEP = 1;    // pips earned by a clean turn
let MOMENTUM_BREAK = 1;   // damage of at least this much breaks the streak (1 = any damage)
let MOMENTUM_VALUE = 1;   // strike damage per pip
// ● AT A FULL METER THE STRIKE SPLITS IN TWO. 0 = off · 'add' = an extra hit AND keep the pip
// damage · 'convert' = an extra hit INSTEAD of the pip damage.
// 🔑 WHY LATERAL RATHER THAN BIGGER: every other payout knob on this meter is raw damage, so
// "make Momentum matter" and "do not power-creep the rogue" were the same dial pointing opposite
// ways — pips worth 2 bought a +10/+20/+2/+16 duel swing. **Multi-hit divides the total instead of
// raising it**, so a full meter changes the KIND of your strike: better into 🧱 Guard (fewer blows
// eaten), worse into 🛡️ Armour (subtracted from each). *Lateral power, not vertical.*
// ⚠️ IT ALSO MOVES A CONSTRAINT WRITTEN THIS MORNING: 🧱 Guard must be 1 because the game's hit
// ceiling is 2. At a full meter Second Fang lands THREE — so Guard 2 becomes theoretically
// answerable. Do not act on that until this has been played; one class reaching 3 hits on 12% of
// turns is not the same as the game having a hit ceiling of 3.
let TIME_PENALTY_MULT = 1.0;   // ⏳ scales every encounter's printed Time Penalty
let MOMENTUM_FULL = 'add';
// 🔑 see the note at `added`: a multi-hit card divides its OWN value, never the bonuses on top.
let SPLIT_ADDS_PER_HIT = true;
// ⚡ PITCH — WHAT A CARD GIVES WHEN YOU FEED IT (2026-08-18, Thomas, from Flesh and Blood):
// *"maybe it needs to be, the lower lvl the card, the more energy it gives, kinda like how cards
// work in flesh and blood, blue cards are weaker but they give more pitch."*
//
// 🔑 BEFORE THIS, `energy` WAS ONE NUMBER DOING TWO JOBS — the cost to strike with a card AND
// what it paid as fuel — and it did not vary by level at all. So LEVELLING A CARD HAD NO DOWNSIDE:
// it struck harder and fuelled exactly as well as before. That is the one thing
// [[Levelling_As_Sharpening]] says must never be true: *a level makes a card MORE ITSELF, spike up
// and weakness DOWN.*
//
// Now they are separate. COST is identity and never moves (a heavy blade is always heavy). PITCH
// falls as the card sharpens, so your best strike is your worst fuel.
// 🔑 AND IT DELIVERS A DESIGN GOAL THE VAULT ALREADY WANTED FOR FREE: an all-Lv4 deck becomes
// literally unplayable, because nothing left in it can pay for anything.
// ⚠️ Tools pitch one better than blades at the same level — the fuel/strike split is the roles
// restated in the resource, not a second axis to learn.
// ⚡ WHAT A CARD GIVES WHEN FED: PITCH_BASE − its level. Dropped by 1 on 2026-08-18 as the
// matched half of PAID_STEP. 🔑 A BIGGER PRIZE AND AN EASIER PRICE IS NOT A WIDER GAP, IT IS A
// BIGGER NUMBER - measured, scaling the payoff ALONE took her duel from 71% to 88% and paying rose
// to 81% of turns, so the mechanic got louder AND more automatic at once. Raising the prize while
// tightening the price is what turns a formality into an event: paying fell 76% -> 64% of turns
// while the turns it decided the OUTCOME rose 34% -> 44%, at an unchanged 69% Complete.
// 🔑 And it lands on the right cards. A Lv4 blade now gives ZERO energy - sharpened, it is pure
// payload and cannot fuel anything, exactly as a Lv4 Hammer is actively bad as a Catalyst.
// [[Levelling_As_Sharpening]]: spike up, weakness DOWN.
// ⚠️ ASYMMETRIC, AND THE TOOL SIDE IS A CEILING CONSTRAINT, NOT A TASTE (fixed same day).
// Dropping BOTH to 5/4 made ⚡4 the most any card could ever give - and Ghostblade costs ⚡5, so
// it became UNPAYABLE by any card in the deck at any level. Its ◆27 strike and its verb were
// simply unreachable. Thomas felt the edge before the measurement found it: *"having a card be
// lvl 1 to give 5 energy sounds a bit rough though."*
// 🔑 THE RULE: WITH A SUBTRACTIVE PITCH FORMULA (base − level), A COST EQUAL TO THE GIVE
// CEILING IS PAYABLE BY EXACTLY ONE CARD STATE IN THE DECK - THAT IS NOT A PRICE, IT IS A LOCKOUT.
// Ghostblade sat at 25-30% paid even BEFORE the drop, because only a Lv1 tool could ever cover it.
// A cost ceiling needs at least one level of headroom under the give ceiling to be a real price.
// 🔑 The split is role-honest and does the work the flat drop was meant to do: TOOLS ARE THE
// FUEL, so they stay able to pay at every level; BLADES ARE THE PAYLOAD, so a Lv4 blade gives ⚡0
// and cannot fuel anything, exactly as a Lv4 Hammer is actively bad as a Catalyst.
const PITCH_BASE = { tool: 6, blade: 4 };
function pitchOf(card) {
  if (!card || !card.def) return 0;
  const base = PITCH_BASE[card.def.role] || 5;
  return Math.max(0, base - (card.level || 1));
}
const MOMENTUM_DISCOUNT_CAP = 2;   // ⚠️ DEAD: momentum no longer touches cost. Kept so old saves load.
const SLIP_MARGIN = 4;           // 🌀 beat its Initiative by this and it barely answers
const SLIP_CUT = 0.5;            // 🌀 ...and 'barely' means HALF. ⚠️ It used to mean NOTHING.

// 🔑 ⚡ IS ONE NUMBER DOING TWO JOBS: what a card COSTS as your Strike, and what it PAYS when
// burned for energy. That is the whole resource tension in a single column — your best cards are
// also your best fuel, so a big turn is bought with something you wanted to play.
// 🗡️ THE COMBO VERBS (2026-08-17). A card's verb fires when IT sits in ② beside its partner.
//
// ⚠️ THIS REPLACES "the pair cuts the cost by 1", which Thomas killed as *"a bit too abstract"* —
// and he was right: a discount is bookkeeping, a verb is a thing that HAPPENS. It also gives the
// ② card a job instead of making it a key that fits a lock.
//
// 🔑 THE STRUCTURE IS THE POINT: a pair has two cards, so WHICH VERB YOU GET DEPENDS ON WHICH
// HALF YOU STRIKE WITH. Strike with Lethal Dose and Venom Needle sits in ② (ignore Armour); strike
// with Venom Needle and Lethal Dose sits there instead (its ✦ for free). Eight cards, eight verbs,
// sixteen different turns — and the encounter tells you which way round to play the pair.
//
// ⚠️ A VERB MUST NOT REPEAT ITS OWN CARD'S NUMBERS. Viper Strike is already the fastest card in
// the deck at 💨 7, so giving it "win Initiative" would be free; its partner carries that instead.
// A verb that restates the stat is a verb that never changes a decision.
const ROGUE_VERBS = {
  draw:      'you <b>draw a card</b>',
  // 🗡️ THE BLADE-SIDE VERBS ARE THE BIG ONES, and they have to be (re-dealt 2026-08-17).
  // A verb fires when its card sits in ②, which means STRIKING WITH ITS PARTNER. So a verb printed
  // on a TOOL fires when you strike with the blade — free upside, and those four measured 2–13%.
  // A verb printed on a BLADE fires when you strike with the TOOL, which costs ~9 damage, so it
  // must be worth about a blade or it is never correct. All four measured 0–1%.
  // 🔑 AND TWO OF THEM WERE NOT MERELY SMALL, THEY REPRINTED SOMETHING FREE:
  //   `outpace`  'win Initiative automatically' — she already wins 99–100% of races.
  //   `freepaid` 'deals its ✦ even unpaid'      — it only ever fires on a TOOL strike, and tools
  //              cost ⚡1–2 while any fuel is ⚡2–3, so the cost was already covered.
  // Same fault 🌀 Slipped had. *A verb that restates something you already get for free is not a
  // weak verb, it is an absent one.* Both replaced with verbs that pay about a blade.
  // ⚠️ worded as ADDED DAMAGE, never "strikes again" — 🎯 hits is a real mechanic that DIVIDES
  // the blow, so "again" would promise the wrong thing against 🛡️ Armour and 🧱 Guard.
  fangs:     'your strike gains <b>+its own ⚔️</b>',
  lethal:    'your strike gains <b>+2 damage per ⚡</b> you feed it',
  pierce:    'your strike <b>ignores 🛡️ Armour</b>',
  nocounter: 'it <b>does not counter</b> you',
  cycle2:    'you <b>draw two cards</b>',
  surge:     '<b>+2 ●</b> Momentum',
  unspent:   'your Strike is <b>not spent</b>',
};
// ⚠️ POLARISED 2026-08-17. The pairs used to be roughly symmetric — both halves mid-weight —
// and pairing measured 64% AVAILABLE but only 25% TAKEN, against attuning's 86/66. So the pair was
// not hard to find, it was **not worth what it cost**: slot ② is your Initiative, and a situational
// verb loses to speed you need every single turn.
//
// 🔑 THE FIX IS NOT TO MAKE PAIRING STRONGER, IT IS TO MAKE IT FREE. Each pair is now a BLADE and
// a TOOL, and the tool is the card you wanted in ② anyway:
//     BLADE  heavy ⚔️, expensive ⚡, slow 💨   → it belongs in ①
//     TOOL   light ⚔️, cheap ⚡, FAST 💨         → it belongs in ② whatever you were doing
// So completing a pair stops being a sacrifice and the question moves to a better place: not
// "can I afford to pair?" but "which pair can I complete, and is that the verb this creature wants?"
//
// ⚠️ A TOOL'S VERB IS WHAT FIRES WHEN YOU SWING THE BLADE, so the tools carry the verbs you want
// on a big turn (pierce, draw, +●) and the blades carry the ones you want when you cannot swing.
const ROGUE_SPEC = [
  // ⚠️ RESCALED 2026-08-17. Thomas, two encounters in: *"the rogue's numbers just seem way too
  // high, at lvl 2 cards"* — and the sim agreed at 81% Complete against the mage's 48%.
  // 🔑 THE MISTAKE WAS OVER-PAYING FOR A MISSING SLOT. The rogue has no ➕ Surge, so I lifted her
  // Strike to compensate — and lifted it to the mage's WHOLE TURN. Measured at Lv2 the mage lands
  // 12-17 (⚔️ 5-7 plus ➕ 5-7); a rogue blade was landing 12-13 UNPAID and 15-16 paid, then also
  // taking a verb and 🌀 Slipped on top.
  // The scale now: a PAID blade ≈ a mage turn (14-15), an UNPAID one is a bad turn (9-10). Paying is
  // what buys you parity, which is the whole point of the ⚡ layer.
  // ⚠️ Tools also came UP (3-4 → 5), narrowing the blade:tool gap from ~3x to ~2x, so striking
  // with a tool stays viable — four verbs measured 0% because you never did.
  // ⚡ THE COST LADDER (2026-08-17). Thomas asked for a ⚡5 ceiling; measured, putting THREE cards
  // at ⚡4–5 cost the class ~15 points of run win (52% mage vs 34% rogue at n=240, reproduced) and
  // left stage 3 at 5–8%, which breaks the rule that every class must be able to beat every stage.
  // 🔑 THE FAULT DOES NOT SHOW UP IN "PAID IN FULL", WHICH BARELY MOVED (92% → 89%). Slot ③ takes
  // a whole CARD, so a ⚡5 Strike is paid by burning ANOTHER BLADE as fuel — she still pays, she
  // just spends her best card to do it. *A cost measured only by whether it was met will read as
  // free right up until you ask what met it.*
  // ✅ So the ceiling stays, on exactly ONE card: 🗡️ Ghostblade, the payoff half of the PAYOFF
  // pair. ⚡5 is now aspirational rather than routine — the card you are keeping the streak up FOR.
  // 🔑 THE BASELINE IS DELIBERATELY WEAK (Thomas, 2026-08-17): *"baseline of the hero should be
  // weak, its the charms and the level of the cards that help players get through the stuff."*
  // Measured before this: a Lv1 rogue turn produced 6-12 against a Lv1 MAGE turn of 5-11 — she
  // started where the mage arrived, so nothing the run gave you afterwards felt like it mattered.
  // Blades now open at ⚔️4-5 and climb +3 a level; tools strike for ⚔️4 and are not meant to.
  // ⚠️ HER TRADEOFF IS ARMOUR, AND IT IS ALREADY PRICED: mage cards soak avg 2.9 at Lv2 (WARD cards
  // 5-8), rogue cards 0.9. She takes HALF the damage a mage does (0.70 a turn against 1.46) and
  // still sheds the same 13 levels a run, because every hit costs her more cards.
  // 🔑 So 💨 Initiative may sit a *little* above the mage's — that is what the thin armour buys.
  // pair          name              role     ⚡ pairs with          spike    base [val, init, armor]  ✦  verb
  { pair: 'RUSH',    name: 'Viper Strike',    role: 'tool',  energy: 2, combo: 'Second Fang',     spike: 'init',  base: [4, 6, 1], paid: 3, verb: 'draw' },
  // 🎯 SECOND FANG STRIKES TWICE - the name was describing a mechanic the card did not have.
  // ⚠️ MULTI-HIT IS LATERAL, NEVER MORE DAMAGE: the total is DIVIDED between the blows
  // (`perHit = floor(value / hits)`), so two hits is the same damage delivered differently.
  // 🔑 AND THAT IS WHAT MAKES IT A TRADE - 🧱 Guard eats the first N hits, so splitting means less
  // of your damage is eaten; 🛡️ Armour subtracts PER HIT, so splitting means it comes off twice.
  // **Better into a pool, worse into a wall.** The two shapes are opposites, and this is the first
  // card in the game that has to choose between them.
  { pair: 'RUSH',    name: 'Second Fang',     role: 'blade', energy: 3, combo: 'Viper Strike',    spike: 'value', base: [4, 2, 1], paid: 4, verb: 'fangs', hits: 2 },
  { pair: 'OPENING', name: 'Venom Needle',    role: 'tool',  energy: 1, combo: 'Lethal Dose',     spike: 'init',  base: [4, 5, 2], paid: 3, verb: 'pierce' },
  { pair: 'OPENING', name: 'Lethal Dose',     role: 'blade', energy: 4, combo: 'Venom Needle',    spike: 'value', base: [5, 2, 0], paid: 4, verb: 'lethal'  },
  { pair: 'HOLD',    name: 'Sleight of Hand', role: 'tool',  energy: 2, combo: 'Slow Poison',     spike: 'init',  base: [4, 6, 1], paid: 3, verb: 'cycle2' },
  { pair: 'HOLD',    name: 'Slow Poison',     role: 'blade', energy: 3, combo: 'Sleight of Hand', spike: 'value', base: [4, 2, 3], paid: 4, verb: 'nocounter' },
  { pair: 'PAYOFF',  name: 'Shadow Double',   role: 'tool',  energy: 1, combo: 'Ghostblade',      spike: 'armor', base: [4, 5, 2], paid: 3, verb: 'surge' },
  { pair: 'PAYOFF',  name: 'Ghostblade',      role: 'blade', energy: 5, combo: 'Shadow Double',   spike: 'value', base: [5, 2, 1], paid: 4, verb: 'unspent' },
];
const ROGUE_COST = [2, 3, 4, null];   // ⚠️ dead - eff() reads LEVEL_COST for every class now
// generated from the spec, never hand-authored. Column 1 carries the PAID damage, so the card face
// can print `⚔️ 7 → ✦ 12` off the same row shape every other card in the game uses.
// ⚠️ THE SPIKE STEP IS PER-STAT (2026-08-17). It used to be +3 a level for ANY spike, which was
// right for ⚔️ damage and catastrophic for 💨 Initiative: a tool went 9 → 18, against creatures
// that run 💨 1-6. Thomas, playing stage 1: *"theres a card with 17 initiative, like what... i just
// put the highest one in slot 2."*
// 🔑 A STAT THAT ALWAYS WINS IS NOT A STAT, IT IS A FORMALITY — and it took slot ② with it,
// because pairing costs you the race only if there IS a race. Initiative now steps +1.
// ⚠️ init steps 2, not 1 — and the reason is the gap between the two things Initiative races.
// Road creatures sit at 💨 1-6; DRAGONS sit at 7-10. A flat +1 made her tools top out at 9, so she
// lost the race on every beat of every duel and the stage win rates fell to 16/4/0/0.
// 🔑 SO THE CURVE IS THE POINT: at Lv1 a tool (5-6) races CREATURES and often loses; by Lv4
// (11-12) it contests DRAGONS. Levelling Initiative buys you "I can outrun the boss now" instead of
// buying a number that was already unbeatable at Lv1.
// ⚠️ THE BASE WAS THE BUG, NOT THE STEP — and cutting the step too cost 15 points of run win.
// At base 8-9 a Lv1 tool already beat EVERY creature in the game (they run 💨 1-6), so Initiative
// was decided before you looked at your hand. That is what made slot ② thoughtless.
// But flattening the growth as well took her answer to 🌀 EVASION away, and Evasion halves your
// hit unless you WIN the race — so stages 2 and 4, the Evasion stages, fell from 58%/42% to 27%/7%
// while stages 1 and 3 barely moved. A textbook case of the measurement naming the mechanic.
// 🔑 SO: START CONTESTED, BECOME DOMINANT ONLY THROUGH INVESTMENT. Base 5-6 races creatures at
// Lv1 and loses often; Lv3-4 reaches 12-15 and contests dragons at 7-10. The big number is now the
// REWARD for levelling rather than the state you start in.
// ⚠️ value steps 4, not 3. A weak baseline is only half of Thomas's rule - *"its the charms and
// the LEVEL of the cards that help players get through"* - so if the start comes down the CURVE has
// to come up, or the run has nothing to give you. Dropping the base alone took her to 5% run win:
// weak at Lv1 AND weak at Lv4 is not a tradeoff, it is just weak.
// Lv1 ⚔️4-5 (below the mage's 5-11 turn) climbing to Lv4 ⚔️16-17 / ✦20-21.
// ⚠️ 💨 STEPS 1. Thomas, looking at a Lv2 card sitting on 💨 10: *"lvl 2 cards having
// initiative at 10 is also crazy, why are we doing this?"* There is no good reason, and the
// principle is the keeper:
// 🔑 INITIATIVE IS A THRESHOLD STAT, NOT AN ACCUMULATING ONE. You win the race or you do not.
// Once you are faster than the thing you are racing, MORE SPEED BUYS NOTHING - so scaling it is
// pure inflation, and it inflates against creatures that never scale at all (💨 1-6, fixed).
// Measured at +3 a level: 76% of her races were won by 3 or more, i.e. decided before she looked
// at her hand, average margin +5.1. The mage sits at 48% / +2.6 and her race still reads as a race.
// ⚠️ Kept at 1 rather than 0 so a tool still SHARPENS - but the number now stays legible for
// the whole run instead of running away from the board it is compared against.
// ⚠️ value steps 5. Flattening 💨 to 1 was right for legibility and took her run win to 6%,
// because her duel was being held up ENTIRELY by out-racing the dragon - nothing else she owns
// scales to 50-68 HP over 3-4 beats. Taking that away means the damage has to arrive instead.
// 🔑 This is Thomas's rule applied to BOTH ends: *"baseline of the hero should be weak, its the
// charms and the LEVEL of the cards that help players get through."* Weak at Lv1 (⚔️4-5, under the
// mage's 5-11 turn) and genuinely strong at Lv4 (⚔️19-20 / ✦23-24, against the mage's 20-29).
// A weak baseline is only half the rule; if the curve does not repay it, the run has nothing to give.
// ⚠️ value steps 4, down from 5, because ● MOMENTUM IS DAMAGE NOW and has to be paid for
// somewhere. Thomas: *"it should probably just add to attack instead. and we should probaby lower
// attack across the board because of it."* The streak runs 0-5 and averages ~1.3, so the card
// table gives back roughly what the meter now supplies.
// ⚠️ value 4 → 3 (2026-08-18). Thomas, after playing: *"rogue attack numbers are higher than
// mages… was able to get crazy attack numbers right off the bat with rogue and a few upgrades."*
// 🔑 MEASURED, AND MY FIRST TEST SAID THE OPPOSITE BECAUSE IT WAS THE WRONG TEST. With every card
// at one level the mage LOOKS ahead at Lv4 (18.4 vs 16.1) - because an all-Lv4 rogue deck gives
// ⚡0 energy and cannot pay for itself. **Nobody plays a uniform deck.** Re-run against a real one
// (all Lv2, a few cards pushed to Lv4) and the rogue led by **+3 at every level of investment** and
// hit 20+ roughly **twice as often**.
// 🔑 THE MECHANISM: HER SHARPENING IS MULTIPLICATIVE WITH HER UNSHARPENED CARDS. A low-level card
// is excellent fuel, so upgrading a few blades buys the payload while the rest of the deck still
// pays for it. The mage's attune bonus is level+1 - linear, no synergy.
// Growth Lv1→Lv4, averaged over the deck: mage **+4.4**, rogue **+11.5**; her four blades **+18
// each**. A blade gained +6 a level against the mage's best card at +3 - exactly double.
// Swept on the realistic-deck test: value 4 → gap +3.2 · **value 3 → gap +0.9** · value 2 → −1.1.
// ✅ PAID_STEP stays at 2 - the wider paid gap was asked for and is not the thing that was wrong.
// 🗡️ 3 → 2 (2026-08-23). Thomas: *"rogue should do less damage, combined with momentum,
// rogue is a bit overtuned i think."*
// 🔑 THE REPORT WAS ABOUT DAMAGE AND I SPENT THREE SWEEPS CHASING WIN RATE. On win rate she is
// only over at stages 1 and 4; on DAMAGE he is plainly right — her duel blow is **17-18 against the
// mage's 12-13**, roughly 40% harder for a nearly identical win rate. That is exactly what makes a
// class feel overtuned in the hand while the win column looks fine. **Answer the report that was
// given, not the one the instrument finds easiest to measure.**
// ✅ This is PARITY, not a nerf: her blades grew **+3 a level** against the mage's **+2**, and 2
// puts the two classes on the same growth curve. It also lands where he said it lands — on a
// LEVELLED rogue, not a fresh one. Second Fang goes 4/7/10/13 → 4/6/8/10.
// 📏 Same seeds, ⭐6/🎭3, n=320: rogue 74/31/21/43 → **51/20/8/19** against a mage of
// 50/15/16/25 on those same seeds — +24/+16/+5/+18 becomes +1/+5/−8/−6.
// ⚠️ Cost: she drops BELOW the mage at stages 3 and 4. Watch stage 3 especially.
// ❌ 2.5 was measured and does nothing (69/28/15/40) — the rounding eats it. It is 2 or it is
// nothing.
// ❌ ● MOMENTUM IS UNTOUCHED, deliberately. Cap 3→2 took ten points off stage 2 where she is
// already under target, and the full-meter SPLIT was chosen precisely because it is damage-neutral
// — it makes her hit twice rather than harder. Cutting it removes the interesting half and leaves
// the numbers.
// ❌ AND FATHOMDREAD'S HP WAS TRIED AND REJECTED: +10 moved the rogue 43→29 and the mage
// 26→11, leaving the gap at 17→18. 🔑 **A DRAGON IS CLASS-BLIND, SO IT CAN NEVER CLOSE A CLASS
// GAP** — which this file already said under the class-gap section, and I proposed it anyway.
// ⚠️ STILL A DEAD DIAL FOR SWEEPS: the `const SPIKE_STEP` below copies this at load, before
// ROGUE_DEFS is generated from that copy, so `setTunable` cannot move it. Changing the literal here
// works; a runtime sweep does not.
let SPIKE_STEP_VALUE = 2;   // 🗡️ the rogue's power dial
const SPIKE_STEP = { value: SPIKE_STEP_VALUE, init: 1, armor: 1 };
const ROGUE_DEFS = ROGUE_SPEC.map(s => {
  const idx = { value: 0, init: 1, armor: 2 };
  const step = SPIKE_STEP[s.spike];
  const lv = [0, 1, 2, 3].map(L => {
    const st = s.base.map((v, i) => (i === idx[s.spike] ? v + step * L : (L === 0 ? v : Math.max(0, v - 1))));
    // 🛡️ ARMOUR FLOORS AT 1, NEVER 0 (2026-08-18). Thomas: *"feel like rogue cards shouldn't
    // block 0, like what happens if i take damage and they all don't block?"*
    // Measured: FIVE of her eight cards soaked nothing at Lv2, and 9% of her hands could soak
    // nothing AT ALL - roughly one turn in eleven where any damage at all is an automatic
    // knock-out (every card downgraded plus a deck burn). The mage's floor is 1 on every card at
    // every level; hers had holes.
    // 🔑 DECK-AS-HEALTH MEANS EVERY CARD IS A HIT POINT. A 0-armour card is not a weak card, it
    // is a card that cannot take part in the health system at all - a hole in the health bar, not
    // a thin one. Her tradeoff is meant to be THIN armour (1-4 against the mage's 1-8), and it
    // still is.
    st[idx.armor] = Math.max(1, st[idx.armor]);
    return [st[0], st[0] + s.paid, st[1], null, st[2], null, ROGUE_COST[L]];
  });
  return { name: s.name, element: null, arch: null, pair: s.pair, role: s.role,
           combo: s.combo, energy: s.energy, paid: s.paid, verb: s.verb, hits: s.hits || 1, lv };
});

// ② the pair sits in the COMBO slot — the whole condition, on the table, checkable at a glance.
// 🗡️ Twin Blades lets the ARSENAL complete it instead, which is that slot's job for this class.
function pairedNow() { return !!comboCard(); }
// 🔑 WHICH card is completing the pair — because it is that card's verb that fires, and three
// different lines need to name it. ✦ Second Flame's lesson: the rule must name its own cause.
// 🗡️ Twin Blades lets the ARSENAL complete it instead, which is that slot's job for this class.
function comboCard() {
  const st = spellCard(); if (!st || !st.def.combo) return null;
  const seats = [cardById(S.assign.Element)];
  if (hasCharm('twinblades')) seats.push(cardById(S.assign.Reserve));
  return seats.find(c => c && c.def.name === st.def.combo) || null;
}
function comboVerb() { const c = comboCard(); return c ? c.def.verb : null; }

// 🗡️ THE PAIR MARK. Eight unique sigils told you which card this was — which you already knew
// from its name. One glyph per PAIR tells you the thing you actually need: these two go together,
// visible without reading either name.
const PAIR_SIGIL = { RUSH: '⟡', OPENING: '◈', HOLD: '≈', PAYOFF: '⧉' };

// 🔑 POINT AT THE ANSWER INSTEAD OF LABELLING THE CATEGORY. Whatever sits in ① STRIKE, the card
// that would complete it lights up wherever it is in your hand — the same move fuse-highlighting
// made for the mage.
// ⚠️ Deliberately NOT colour-coded pairs. The mage's colours earn their complexity: an element
// says what a card seeks, what enemy armour checks, and what it fuels — one colour, four meanings.
// A rogue pair means exactly one thing, so wrapping it in a second four-colour language (on the same
// card frames, in the same game, meaning something different) would teach a system to answer a
// yes/no question. A glow is an ANSWER; a colour is a category you have to interpret.
function pairMateId() {
  const st = spellCard();
  if (!st || !st.def.combo) return null;
  if (comboCard()) return null;                       // already paired — nothing to point at
  const m = S.hand.find(c => c.id !== st.id && c.def.name === st.def.combo);
  return m ? m.id : null;
}
// ⚠️ ONE FUNCTION FOR THE WHOLE TURN'S BOOKKEEPING, so the line on screen, the card face and the
// damage in the reveal all read the same source — the `computeAction` rule, applied to a resource.
function rogueMath() {
  const st = spellCard();
  if (!st) return null;
  const verb = comboVerb();
  const paired = !!verb;
  const fuel = cardById(S.assign.Boost);
  // ⚠️ NO MORE PAIR DISCOUNT — the pair pays in a VERB now, not in arithmetic.
  // ● THE STREAK IS THE DISCOUNT. Each pip takes 1 off what your Strike costs, so momentum does not
  // make you hit harder — it makes more ARRANGEMENTS LEGAL. That keeps it inside *lateral power,
  // not vertical*: a five-turn streak does not inflate a number, it lets you swing the ⚡5 card you
  // have been holding. 🔑 And it reads right — the longer you are in rhythm, the more you can pull
  // off. At a full streak every card in the deck costs nothing, which is the payoff for five clean
  // turns and is meant to feel like getting away with something.
  // ⚠️ MOMENTUM NO LONGER TOUCHES COST (2026-08-18). Thomas: *"i feel like momentum takes the
  // fork away, if every card is nearly free, slot 3 is not doing anything for us. it should
  // probably just add to attack instead."*
  // 🔑 He is right and the capped version was worse than either extreme: capped at 2, the meter
  // hit its ceiling on its SECOND pip, so pips 3-5 did literally nothing while still being drawn
  // on screen. A resource that stops paying but keeps counting is a lie told every turn.
  // It adds to the STRIKE now, which cannot dissolve slot ③ — what you feed still has to cover
  // the cost on its own.
  // 🔑 AND THE FAULT IS BIGGER THAN THE NUMBER: ⚡ WAS THE CLASS'S ONE REAL CONSTRAINT, AND
  // MOMENTUM WAS PAYING IT OFF. A reward that removes the constraint it rewards you within does not
  // make the game easier, it DELETES THE DECISION — slot ③ stopped being a choice about which card
  // you can afford and became a formality. *Cheaper costs are not lateral power when the cost WAS
  // the fork.* Worse, a streak is easiest to hold when you are already winning, so the discount
  // arrived exactly when it was least needed.
  // Now: 2 pips buy 1 ⚡, and it never exceeds MOMENTUM_DISCOUNT_CAP — a real help at a long
  // streak, never a bypass.
  const rawCost = st.def.energy || 0;
  // ⚠️ min(cap, streak), NOT floor(streak/2). The halving version starved her exactly where she
  // needed it: at the LAIR her streak averages 1.4-1.9 (the dragon hits every beat), so floor/2
  // paid out ZERO there, her ⚡-paid rate fell 85-94% -> 70-75%, and the duel collapsed to 4/12/4/4.
  // 🔑 THE CAP IS WHAT STOPS THE BYPASS; THE RATE WAS NEVER THE PROBLEM. Capping at 2 keeps
  // slot ③ a real question (a ⚡5 blade never drops below ⚡3) without taxing the one place her
  // streak is hardest to hold.
  const cost = rawCost;
  // ⚠️ THE HARDSHIPS THAT NAMED A MAGE STAT DID NOTHING TO HER (2026-08-18). Thomas, on a
  // journey: *"damn night travel doesn't work against rogue... i suppose we will need hazards and
  // hardships and journies that affect classes."*
  // 🔑 HE IS RIGHT ABOUT THE PROBLEM AND I THINK THE FIX IS THE OTHER WAY ROUND. The ENGINE owns
  // hardships - [[Class_System]]'s seam says so - so a hardship must be stated in ENGINE terms and
  // each CLASS reads what it means for its own maths. Class-SPECIFIC hardships would mean writing
  // every one of them eight times; this way one hardship bites eight classes.
  // The mapping is mechanical once you see it:
  //   a hardship that names the mage's ➕ BOOST  -> the rogue reads her ⚡ ENERGY
  //   a hardship that names ATTUNING              -> the rogue reads PAYING
  // ⚠️ Four were free rides for her: Night Travel, Rationed, Dead Air and Squall, plus the
  // ⛰️ Steep peril. Dead Air and Squall were gated inside attunedNow(), which returns early on
  // `!CLASS.pairs`, so they never even reached her.
  const h = S.hardship;
  const comboCd = cardById(S.assign.Element);
  let paid = pitchOf(fuel);
  if (h === 'Rationed') paid = 0;                                   // ⏳ nothing is spare
  else if (h === 'Night Travel') paid = Math.max(0, paid - (comboCd ? eff(comboCd).init : 0));
  // 🔇 Dead Air / ⚡ Squall gate her combination rule the same way they gate the mage's
  const full = (paid >= cost) && h !== 'Dead Air' && !squallBlocks();
  // 🗡️ THE TWO BIG BLADE-SIDE VERBS, both paid in damage so the tool-strike can compete with the
  // ~9 you gave up by not striking with the blade. They scale off DIFFERENT things on purpose:
  //   Second Fang — the strike's own ⚔️, so it grows as you sharpen that card.
  //   Lethal Dose — what you feed slot ③, so it makes the fuel choice matter beyond "does it cover".
  // ⚠️ `lethal` is +1 per ⚡ now, not +2 — costs run to 5, and +2 on a ⚡5 fuel was +10 on a tool.
  // ● the streak is damage now — one point a pip, the whole meter live all the way to 5
  const verbBonus = verb === 'fangs'  ? eff(st).value
                  : verb === 'lethal' ? paid
                  : 0;
  // ● WHAT ONE PIP IS WORTH. Separated from the cap 2026-08-22 so the two can be traded against
  // each other: a SHORT meter you actually fill, with pips that matter, is a different design from
  // a long meter you never fill. Thomas: *"whats so bad about having a momentum cap of 3? what if
  // we increase what you get as well with a cap of 3"* — that is Design A done properly.
  const atFullNow = MOMENTUM_FULL && (S.momentum || 0) >= MOMENTUM_CAP;
  const streakDmg = (MOMENTUM_FULL === 'convert' && atFullNow) ? 0 : (S.momentum || 0) * MOMENTUM_VALUE;
  const bonus = verbBonus + streakDmg;
  return { paired, verb, rawCost, cost, paid, full, fuel, bonus, verbBonus, streakDmg,
           saved: 0, streak: S.momentum || 0 };
}
// ● spending it is a per-turn choice, and — unlike the mage's bank — it is a POOL, so the question
// is "is this the turn to cash out", not "yes or no".
// ⚠️ DEAD, kept only so an older save's stored target cannot throw. Momentum is not spent any more.
function setMoTarget(t) {
  return;
  render();
}

const ROGUE = {
  id: 'rogue',
  mark: '🗡️',
  multi: null,
  labels: { Spell: 'Strike', Element: 'Combo', Boost: 'Energy', Reserve: 'Arsenal' },
  defs: ROGUE_DEFS,
  deck() { return shuffle(ROGUE_DEFS.concat(ROGUE_DEFS).map(newCard)); },   // 8 x 2
  emberwake: false,        // 🔥 that is the MAGE's slot ③
  pairs: false,            // ✦ no elements, so nothing ever attunes
  boosts: false,           // ➕ no Surge stat either
  energy: true,            // ⚡ the Strike costs, slot ③ pays
  name: 'Rogue',
  momentum: true,          // ● the untouched streak — earned by taking nothing, lost by taking anything
  trait: { icon: '●', name: 'Momentum',
    text: 'Every turn that costs you <b>nothing</b> earns a pip, up to ' + MOMENTUM_CAP +
      '. Each pip adds <b>+1 to your Strike</b>. Take any damage and the whole streak breaks.' },
  // 🏅 WHAT THE GRADE CALLS CRAFT — her source of power is PAYING, so availability is "could any
  // card in this hand have covered another's ⚡ cost" and finding it is striking for the full value.
  // 🔑 THE MAPPING IS THE ONE ALREADY WRITTEN DOWN FOR HARDSHIPS: *a rule that names ATTUNING,
  // the rogue reads as PAYING.* Same sentence, one layer up.
  // ● a FULL meter splits the Strike. Reads the same MOMENTUM_FULL the maths does, so the face and
  // the resolution cannot disagree.
  hitsOf(c, isStrike) {
    const atFull = MOMENTUM_FULL && (S.momentum || 0) >= MOMENTUM_CAP;
    return (c.def.hits || 1) + (isStrike && atFull ? 1 : 0) + extraHits(isStrike);
  },
  // ● pips land on every blow, like a potion does. ⚠️ The blade VERB bonus is not shown here —
  // it depends on the fuel card, which the face cannot know; the reveal still states it.
  perHitBonus(card) {
    return (S.potionFx ? S.potionFx.value : 0) + charmStrike(card)
         + (MOMENTUM_FULL === 'convert' && (S.momentum||0) >= MOMENTUM_CAP ? 0 : (S.momentum || 0) * MOMENTUM_VALUE);
  },
  craft: {
    label: 'paid in full', gate: 'be paid in full',
    avail(hand) {
      return hand.some(f => hand.some(st => st !== f && pitchOf(f) >= (st.def.energy || 0)));
    },
    found(r) { return !!(r.rogue && r.rogue.full); },
  },
  // 🎴 THE ROGUE'S BOARD STATE — and the token that was already almost one. The pips gave it a
  // body in 2026-08-17; this only moves it onto the table where the rest of the board lives.
  // ⚠️ IT SHOWS AT ZERO, ALWAYS. An empty meter is still a thing you are trying to fill — and
  // 🗡️ Lone Fang pays +4 *precisely while the streak is broken*, so hiding an empty token would
  // hide that charm's entire payout. The Mirror Fen rule: show the terms even when they are zero.
  tokens() {
    const now = S.momentum || 0, lone = hasCharm('lonefang');
    return [{
      id: 'mo', icon: '🗡️', name: 'Momentum', count: now, cap: MOMENTUM_CAP,
      // ⚠️ THE TOKEN MUST NAME THE PAYOFF *BEFORE* YOU REACH IT, or filling the meter is a surprise
      // rather than a goal — "be fun trying to keep up the momentum" needs something to aim at.
      worth: (MOMENTUM_FULL && now >= MOMENTUM_CAP)
             ? `<b>+${now}</b> — and your Strike <b>splits in two</b>`
           : now > 0 ? `your Strike hits for <b>+${now}</b>` +
               (MOMENTUM_FULL ? ` <span class="dim">· fill it and the Strike splits</span>` : '')
           : (lone ? 'nothing yet — but <b>Lone Fang</b> gives <b>+4</b>' : 'no bonus yet'),
      note: now > 0
        ? `any damage breaks it${hasCharm('secondnature') ? ' back to 2' : ''}`
        : 'come through a turn untouched to start it',
    }];
  },
  canPlace() { return true; },
  valid() { return !!spellCard(); },
  // ⚠️ ENERGY IS A TEMPO COST, NOT AN ATTRITION ONE (corrected 2026-08-17 by Thomas: *"nah i
  // wasn't thinking the fuel would leave the deck"*). The fuel card slides back UNDER the deck like
  // the Combo card — only the STRIKE is discarded, exactly as the mage's Spell is.
  // 🔑 THE ASYMMETRY THIS KILLS WAS REAL AND UNMEASURED: burning to the discard made the rogue
  // spend TWO cards a turn against the mage's one — 8 cards a region against 4, out of the same
  // 16-card deck — and in a game where the deck IS the health bar that is an enormous hidden tax.
  // The cost of ③ is now what it should be: that card does nothing else this turn, and you will
  // not see it again for a while.
  spentIds() {
    // 🗡️ Ghostblade in ② — the Strike is not spent at all
    if (comboVerb() === 'unspent') return [];
    return S.assign.Spell ? [S.assign.Spell] : [];
  },
  compose() {
    const strike = spellCard();
    if (!strike) return null;
    const combo = cardById(S.assign.Element);
    const st = eff(strike);
    const m = rogueMath();
    // 🔑 PAID IN FULL BUYS THE BIG NUMBER. Short, you still swing — a card that cannot be played
    // is the harshest thing a four-card hand can hold, so underpaying costs power, never the turn.
    const dmg = (m.full ? st.attuned : st.value);
    // 🎯 hits: the 🧱 GUARD ANSWER, AND IT IS HERS AGAIN (2026-08-18).
    // ⚠️ This read `const hits = 1;` under a comment promising hits were *"reachable only through
    // 🎯-granting effects"* - and no such effect existed anywhere. The rogue could never land more
    // than one blow, while the MAGE quietly owned the only multi-hit card in the game
    // (Sparkstrike ×2). 🔑 The class Guard was designed to EXCLUDE could engage with it; the class
    // it was built FOR could not. Thomas found it on meeting his first Guard creature:
    // *"how do i do multiple hits as rogue?"*
    // 🔑 A COMMENT THAT DESCRIBES A SYSTEM IS NOT THE SYSTEM - same fault as `defs: null`.
    // ● A FULL METER SPLITS THE STRIKE — see MOMENTUM_FULL.
    const atFull = MOMENTUM_FULL && (S.momentum || 0) >= MOMENTUM_CAP;
    const hits = CLASS.hitsOf(strike, true);   // ⚠️ her card is `strike`, not `spell`
    return {
      value: Math.max(0, dmg + (duelFx().value || 0)
        + (hasCharm('lonefang') && (S.momentum || 0) === 0 ? 4 : 0)),
      element: null,
      init: combo ? eff(combo).init : 0,
      boost: 0,
      hits,
      attuned: false, attBonus: 0,
      banks: false, bank: 0, wake: 0, wakeTarget: null,
      vSpell: null, vElem: null,
      spell: strike, elem: combo, boostC: cardById(S.assign.Boost),
      attuner: null, loose: false,
      // 🌀 SLIP is stated as a REQUEST, not a verdict — computeAction owns the Initiative race, so
      // it is the only place that knows the margin. The class only says "this class can slip".
      rogue: { cost: m.cost, paid: m.paid, full: m.full, paired: m.paired, verb: m.verb,
               // ⚠️ `gain` was missing here until 2026-08-17, so nothing outside rogueMath() could
               // see momentum EARNED — including the instrument, which read NaN and said so.
               // ⚠️ THE REVEAL CANNOT EXPLAIN A TERM THE PAYLOAD DOES NOT CARRY. `verbBonus`,
               // `streakDmg` and the fuel's name were all missing, so the new rogue action lines
               // would have silently printed "nothing fed" beside a PAID verdict and never once
               // mentioned momentum. 🔑 THAT IS THE THIRD TIME TODAY a class-authored field was
               // computed and not passed through - after `hits` and `gain`. When compose() gains a
               // field, check the payload spread in the same edit.
               bonus: m.bonus, verbBonus: m.verbBonus, streakDmg: m.streakDmg,
               fuelName: m.fuel ? m.fuel.def.name : null,
               rawCost: m.rawCost, saved: m.saved, streak: m.streak, slips: true },
    };
  },
};

const CLASSES = { mage: MAGE, rogue: ROGUE };
let CLASS = MAGE;
function setClass(c) { CLASS = c || MAGE; }

// The candle vocabulary (adopted 2026-07-01) — display names only; internal keys unchanged.
// Spell = your action · Catalyst = ignites it (Initiative) · Surge = fuel (+value) · Arsenal = kept for tomorrow.
// ============================================================
// ✦ LEVEL 4 ABILITIES (2026-07-29) — a card becomes so much itself that it gains a VERB.
//
// 🔑 THE RULE THAT MAKES THIS NOT [[Evolution]]: THE VERB ONLY FIRES IN ONE SLOT.
// Evolution's verbs floated free, so they were true exceptions to the engine. A slot-scoped verb
// is the slot contract getting DEEPER — you read it when the card is in that slot, exactly like
// element disclosure by position, and it enriches the ARRANGEMENT puzzle instead of bolting a
// subsystem beside it. Each archetype's verb fires in its HOME slot:
//     FORCE → Spell   SPARK → Catalyst   FLOW → Surge   WARD → soaking
// so a Lv4 card is the card *becoming fully itself* — levelling-as-sharpening said as a verb
// rather than as a number. Element temperament flavours it: 🔥 swing hard · 💧 survive/set up
// ⚡ go first · 🪨 grind.
//
// ⚠️ THE BRAKE: an all-Lv4 deck must stay UNPLAYABLE. Four Lv4 specialists still cannot fill four
// slots, because every verb is dead in the other three. SHIP TEST for any new verb:
//     "does this card become WORSE to hold in the other three slots?"
// If not, it is a power-up, not sharpening, and it breaks the brake.
//
// ⚠️ YOU LOSE IT IF THE CARD IS SOFTENED BELOW Lv4 (Thomas's call). That is the point — a verb
// you can LOSE is what makes protecting it a decision, and it makes a Lv4 card simultaneously the
// most valuable thing you own and the most expensive thing to soak with.
// ============================================================
const VERBS = {
  // FORCE → SPELL — the one big hit, the 🛡️ Armour answer
  Emberfall:    { slot: 'Spell',   name: 'Overwhelm',  text: 'Your strike ignores 🛡️ Armour entirely.' },
  Tidebreak:    { slot: 'Spell',   name: 'Undertow',   text: 'If this strike does not Complete, you take no Combat Damage.' },
  Sparkstrike:  { slot: 'Spell',   name: 'Thunderhead',text: 'If you win Initiative, this strikes for +4.' },
  Rockfall:     { slot: 'Spell',   name: 'Landslide',  text: '🌀 Evasion cannot halve this strike.' },
  // SPARK → CATALYST — the race, the 🌀 Evasion answer
  Firstlight:   { slot: 'Element', name: 'Firstflame', text: 'When this attunes your Spell, the strike gains a further +3.' },
  Riverstep:    { slot: 'Element', name: 'Slipstream', text: 'Your Initiative counts as +4 higher against 🌀 Evasion.' },
  Quickfire:    { slot: 'Element', name: 'Outpace',    text: 'You win Initiative automatically.' },
  Flintdart:    { slot: 'Element', name: 'Bedrock',    text: 'You take no Early Damage, even when you lose the race.' },
  // FLOW → SURGE — the fork, the 🔥 Emberwake
  Bellowsbreath:{ slot: 'Boost',   name: 'Backdraft',  text: 'Channelling from here DOUBLES the Emberwake.' },
  Wellspring:   { slot: 'Boost',   name: 'Deepwell',   text: 'An Emberwake channelled from here lasts a second turn.' },
  Stormglass:   { slot: 'Boost',   name: 'Quickspark', text: 'Channelling from here also gives +3 Initiative this turn.' },
  Deepvein:     { slot: 'Boost',   name: 'Motherlode', text: 'Channelling from here ALSO fires the boost this turn.' },
  // WARD → SOAKING — keeping cards, the run-level currency
  Hearthwall:   { slot: 'soak',    name: 'Emberguard', text: 'The first time it blocks each encounter, it loses no level.' },
  Rimeguard:    { slot: 'soak',    name: 'Frostbite',  text: 'It blocks 4 more than its armour.' },
  Staticwall:   { slot: 'soak',    name: 'Groundwire', text: 'When it blocks, you gain a 🔥 +2 Emberwake.' },
  Cairnguard:   { slot: 'soak',    name: 'Bulwark',    text: 'When it blocks, it blocks ALL remaining damage.' },
};
// a card only has its verb at Lv4 — soften it and the verb is gone
function verbOf(card) { return card && card.level >= MAX_LEVEL ? VERBS[card.def.name] || null : null; }
// is the named card's verb live RIGHT NOW, i.e. seated in the slot it belongs to?
function verbLive(name, zone) {
  const id = S.assign && S.assign[zone];
  const c = id ? cardById(id) : null;
  return !!(c && c.def.name === name && verbOf(c));
}

// 🔤 SLOT VOCABULARY IS A DISPLAY LAYER AND IT IS PER CLASS — the mage reads Spell/Catalyst/
// Surge/Arsenal, the rogue reads Strike/Combo/Momentum/Arsenal, off identical internal keys.
// ⚠️ THIS WAS A FROZEN CONST AND THE ROGUE INHERITED THE MAGE'S WORDS. Caught by the seam proof:
// the whole point of `CLASS.labels` is that it is the class's, so nothing may keep its own copy.
// A Proxy so every existing `SLOT_LABEL.Spell` call site keeps working unchanged.
const SLOT_LABEL = new Proxy({}, { get: (_, k) => (CLASS.labels || MAGE.labels)[k] });
const slotLabel = zone => SLOT_LABEL[zone.replace(/[AB]$/, '')] + (zone.endsWith('A') ? ' — Set A' : zone.endsWith('B') ? ' — Set B' : '');

// ============================================================
// 🐉 THE STAGES (locked 2026-07-26, BUILT 2026-07-29). Dragons are not random any more.
//
// Stage 1 is ALWAYS the same dragon and is also the tutorial boss. Beating a stage UNLOCKS the
// next WITHOUT removing it — so you pick your stage, and you can always replay an easier one. That is also what makes "add more bosses" scale: a random draw makes a 5th dragon
// more noise, a ladder makes it a destination.
//
// 🔑 EACH STAGE TEACHES ONE DEFENCE SHAPE, and stage 4 is the exam that collides the two you
// learned. The shapes are stated in ENGINE terms (big hit / speed / time), never in mage terms,
// so every future class answers them with whatever it produces:
//     stage 1  🛡️ ARMOUR      flat reduction every beat          → HIT BIG   (so: attune)
//     stage 2  🌀 EVASION     halved unless you win Initiative   → HIT FIRST (so: take the fast Catalyst)
//     stage 3  ⏳ RELENTLESS  its breath GROWS each beat         → HIT WELL, EVERY BEAT (a long duel kills you)
//     stage 4  🛡️🌀 both      you must hit big AND first          → the exam: the one thing you cannot do at once
//
// ❌ 🧱 GUARD is deliberately ABSENT. It wants MANY hits and the mage lands exactly one
// (`compose()` returns hits: 1), so a Guard stage would be unanswerable, not hard. It is the
// ROGUE's stage — and a mage getting stuck on it is precisely the reason to unlock a second class.
// Do not "solve" this by giving the mage extra hits; that is the pile coming back by the door.
//
// ⚠️ The old 85/84/77/71% difficulty order is DEAD DATA — it was measured under the elemental
// shields that no longer exist. Stage order is a design choice now, verified by RUNSIM afterwards.
//
// Stat grammar: `init` is what your Catalyst must beat (it must be BEATABLE on the evasion stages
// or the shape is a flat tax, not a demand). `breath` is the counterstrike base; `shapeV` is the
// armour value. Each shape demands ONE thing and FORGIVES the other — the armour stage hits soft
// so you can afford to be slow; the evasion stage hits hard so being slow is what costs you.
// ============================================================
let RELENTLESS_STEP = 4;   // ⏳ how much the breath grows per duel beat (tuned 2026-07-29)
// 📏 PAR (2026-08-04, measured). `par` is the DECK LEVEL TOTAL at which this dragon becomes a
// coin flip - measured over 1,200 runs by bucketing every lair by its deck's total levels and
// reading the win rate (36-39 / 40-43 / ... ). It climbs 36 → 44 → 48 → 52 across the stages and
// is monotone within every one of them, which is what makes it honest enough to show a player.
//
// 🔑 WHY *TOTAL LEVELS* AND NOT CARD COUNT. Every simple summary of a lair was tested (cards
// left, average level, biggest card, best attuned strike, Lv4 count, damage-per-beat × beats).
// Card count alone barely predicts anything; total levels predicts best and is the most legible -
// it is the same quantity the GRADE already scores as "the deck you kept", and it starts every run
// at exactly 32 (16 cards × Lv2), rises when you upgrade and falls when you soak. It is the run's
// health bar, and it existed all along without ever being shown.
//
// ⚠️ IT IS A GUIDE, NOT A VERDICT. At stage 4, decks below par still win 24% of the time and
// decks above it still lose. Never phrase it as a prediction, and never gate anything on it.
// ⚠️ PAR RE-MEASURED 2026-08-22 (36/44/48/52 → 36/34/34/32) BECAUSE `FOE_ATK_MULT` MOVED.
// 🔑 `par` is a MEASUREMENT, not a design choice — it is *the deck a winner brings to this lair*.
// Harder hits mean fewer levels survive the road, so a stale par would have made the Standing chip
// read `Deck 31 → 48 by the lair` on essentially every run at every stage. **A display that always
// says you are losing is worse than no display** — the exact bug the Standing shipped with.
// 📏 n≈350/stage: winners arrive with 36 / 34 / 34 / 32, losers with 28 / 30 / 30 / 27.
// ⚠️ NOTE THE SHAPE CHANGED, NOT JUST THE NUMBERS. The old pars RISE (36→52) and the new ones are
// flat-to-falling. That is honest: later dragons are not harder because they demand a bigger deck,
// they are harder at the SAME deck — and the later roads take more off you, so you arrive with less.
// 🔑 Par was never a cross-stage difficulty predictor; it judges you against THIS lair, from region
// 4 only, and it remains a pure display — nothing reads it, nothing gates on it.
const DRAGONS = [
  { stage: 1, name: 'Cindermaw', par: 34, element: 'Fire', init: 10, breath: 6, hp: 60,
    shapes: ['armour'], shapeV: 4,
    teaches: 'HIT BIG',
    brief: 'Slag has cooled over every scale. Small blows spatter and die on it — only a fully fuelled strike reaches anything underneath.' },
  { stage: 2, name: 'Skyrender', par: 33, element: 'Lightning', init: 10, breath: 8, hp: 60,
    shapes: ['evasion'], shapeV: 0,
    teaches: 'HIT FIRST',
    brief: 'It is never where you struck. Reach it before it moves and the blow lands whole; arrive late and you catch half a wing.' },
  { stage: 3, name: 'Cragmourn', par: 30, element: 'Stone', init: 7, breath: 5, hp: 68,
    shapes: ['relentless'], shapeV: 0,
    teaches: 'WASTE NOTHING',
    brief: 'The mountain does not tire. Every beat it draws a deeper breath than the last — a long duel is a duel you have already lost.' },
  { stage: 4, name: 'Fathomdread', par: 29, element: 'Water', init: 10, breath: 7, hp: 50,
    shapes: ['armour', 'evasion'], shapeV: 4,
    teaches: 'BIG *AND* FIRST',
    brief: 'Plated as the trench floor and quick as the current over it. It asks for the one thing your four cards cannot give at once.' },
];
// ============================================================
// 🎓 STAGE 0 — THE TUTORIAL (2026-07-29, Thomas: "something separate where it won't break
// when working on the main game").
//
// 🔑 THAT CONSTRAINT IS THE WHOLE DESIGN. A tutorial made of SPECIAL-CASE CODE breaks every
// time the engine changes — it is a second game you have to maintain. This one is pure DATA: two
// gentle regions, one small dragon, a handful of lesson strings. It runs the SAME engine down the
// SAME code path as every other stage, so a new mechanic simply appears in it and nothing to
// break exists. The only thing that can go stale is a lesson's TEXT, which is the phantom-string
// problem — so the lessons deliberately only name things that cannot change: the four slots,
// position-is-the-role, what the Spell costs, and how you lose.
//
// Gentle by construction: low HP, low Initiative, no abilities, no perils, NO HARDSHIPS, and a
// dragon with a quarter of Cindermaw's HP. Nobody should lose this — it is where the game
// teaches itself, and the first three runs decide whether there is a fourth.
// ============================================================
const TUTORIAL = {
  // 🔑 STAGE 0 IS FULLY DETERMINISTIC — same encounters, same order, same opening hands, every
  // single run (Thomas, 2026-07-29). A tutorial that varies cannot TEACH: you can only promise
  // "your first hand holds a pair, so here is what attuning does" if the first hand is known.
  // Deck order is authored so the lessons land where they are meant to: hand 1 has exactly one
  // pair (attuning), and a rainbow hand arrives later (the hand that cannot attune at all).
  fixed: true,
  deckOrder: ['Emberfall', 'Firstlight', 'Riverstep', 'Cairnguard',
              'Bellowsbreath', 'Tidebreak', 'Quickfire', 'Rockfall',
              'Wellspring', 'Staticwall', 'Sparkstrike', 'Rimeguard',
              'Stormglass', 'Flintdart', 'Hearthwall', 'Deepvein'],
  dragon: { stage: 0, name: 'Emberling', element: 'Fire', init: 5, breath: 3, hp: 20,
    shapes: ['armour'], shapeV: 2, teaches: 'HIT BIG',
    brief: 'A young thing, barely scaled — but the scale it has will turn a weak blow. Put your weight behind one strike and it will not hold.' },
  regions: [
    { name: 'The Chandlery Road', hardshipChance: 0, hardships: [], encounters: [
      { type: 'fight',   name: 'Wick Moth',   hp: 5,  init: 1, atk: 1, xp: 4 },
      { type: 'journey', name: 'Lamplit Lane', mp: 5,  nightfall: 1, timePenalty: 1, xp: 4 },
      { type: 'fight',   name: 'Tallow Vole', hp: 6,  init: 2, atk: 1, shape: 'armour', shapeV: 1, xp: 4 },
      { type: 'journey', name: 'The Long Meadow', mp: 6, nightfall: 2, timePenalty: 2, xp: 5 },
    ] },
    { name: 'The Ember Hollow', hardshipChance: 0, hardships: [], encounters: [
      { type: 'fight',   name: 'Sootling',    hp: 8,  init: 4, atk: 1, shape: 'evasion', shapeV: 0, xp: 5 },
      { type: 'journey', name: 'Kilnsmoke Path', mp: 7, nightfall: 3, timePenalty: 3, xp: 5 },
      { type: 'fight',   name: 'Cinder Hound', hp: 10, init: 3, atk: 2, shape: 'armour', shapeV: 2, xp: 6 },
      { type: 'journey', name: 'The Last Rise', mp: 8, nightfall: 3, timePenalty: 2, xp: 6 },
    ] },
  ],
  // 📖 THE OPENING BRIEF — you read these before the first card is dealt. Thomas asked for a
  // paged window you must go through: it is the one place to explain WHAT AN ENCOUNTER IS, which
  // no in-play lesson can do because by then you are already in one.
  intro: [
    { title: 'You are a mage on the road',
      body: 'A dragon waits at the end of the road. Your job is to reach it and kill it.<br><br>You carry <b>sixteen cards</b>. You hold <b>four at a time</b>, and each turn you decide what those four do.' },
    // ⚠️ REWRITTEN 2026-08-12 (Thomas: *"doesn't explain what it does. we gotta explain what things
    // do exactly"*). The old page said "fall short and you lose time" and "the dark catches you" —
    // both name a consequence without defining it, which is the one thing a brief exists to do.
    // 🔑 THE BAR: every stat must say what it SUBTRACTS FROM WHAT. If a sentence could be true of
    // three different rules, it is flavour, not a brief.
    { title: 'A turn is an arrangement',
      body: 'Your four cards sit under four labels. The position is the role. Swap cards to change it.<br><br><b>SPELL</b> — its number is what you deal. It is then spent: it goes to the discard and does not come back until the region ends.<br><br><b>CATALYST</b> — its 💨 Initiative races the enemy\'s. If it also shares your Spell\'s element, the Spell <b>attunes</b> and strikes for the bigger ✦ number on its face.<br><br><b>SURGE</b> — its ➕ is added to your Spell. Or channel it: nothing this turn, and next turn you spend its full value on your strike or your speed.<br><br><b>ARSENAL</b> — the one card you keep for the next hand. Your Catalyst and Surge slide back under your deck.' },
    { title: '⚔️ A fight asks for damage',
      body: 'Your Spell plus your Surge is your blow. Compare it to the creature\'s ❤️ HP:<br><br>• <b>Complete</b> — you meet or beat its HP. It does not touch you.<br>• <b>Narrow</b> — you reach half its HP. You get past it, but it hits you for its ⚔️.<br>• <b>Loss</b> — below half. It hits you and you gain nothing. You still move on; one encounter never ends the run.<br><br>💨 Initiative is separate from damage. If your Catalyst is slower than the creature\'s 💨, it strikes first for its ⚔️, even if your blow then kills it.<br><br>Each creature also has a defence. 🛡️ <b>Armour N</b> takes N off your blow, so it wants one big hit. 🌀 <b>Evasion</b> halves your blow unless you won Initiative, so it wants speed.' },
    { title: '👣 A journey asks for distance',
      body: 'The same cards, measured differently. Your Spell is how far you get, compared to the road\'s <b>MP</b>. Complete, Narrow at half, Loss below.<br><br>⏳ <b>Time Penalty</b> — anything short of a Complete costs you time. You cannot <b>sharpen</b> your cards at the Wheel for this many encounters. A fight costs you cards; a journey costs you growth.<br><br>🌙 <b>Nightfall</b> — your Catalyst\'s 💨 is your Pace. If your Pace is below this number, the card in your <b>ARSENAL</b> is discarded and your 🕯️ candle goes out.' },
    { title: 'Your deck is your health',
      body: 'There is no health bar. You pay damage with cards: you choose which cards <b>block</b> it.<br><br>• A card blocks its printed 🛡️ number and drops one level.<br>• A card showing 🛡️ — cannot block.<br>• A card already at Lv1 does not drop a level. It leaves your deck for the rest of the run.<br>• If your cards cannot cover the whole hit, the run ends.<br><br>So every fight costs you cards, and at the dragon you are racing its HP against how many cards you have left.<br><br>You will lose runs. You keep the materials and the xp, unlock more, and go again.' },
  ],
  // 🎓 REACTIVE LESSONS — the tutorial watches what you DO and speaks to it. Each has a when()
  // exactly like an EVENT does, fires at most once, and may POINT at the thing it is talking
  // about so you are shown rather than told.
  //
  // 🔑 WHY REACTIVE AND NOT SCRIPTED: a scripted "now click the Catalyst" sequence is the most
  // brittle thing you can build — it breaks the moment a slot, a phase or a rule moves, which is
  // exactly what Thomas asked to avoid. A reactive lesson is self-healing: if the player already
  // understands, its when() never returns true and it simply never fires. It also never blocks
  // and never forces a move, so a player who is ahead is never held up.
  lessons: [
    // 🔍 READ THE ENEMY FIRST. These walk the encounter panel chip by chip, ringing each number
    // as it is explained — because the panel is the first thing on screen and the whole turn is an
    // answer to it. They come before the hand lessons for the same reason the layout does:
    // read enemy → arrange cards → confirm.
    { id: 'f-hp', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'fight',
      point: '#encounter-panel .enc-stats span:nth-child(1)',
      text: '❤️ <b>HP</b> is what it takes to put it down. Deal that much for a <b>Complete</b>. Deal <b>half</b> for a <b>Narrow</b> — you get past it, but it hits you back.' },
    { id: 'f-init', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'fight',
      point: '#encounter-panel .enc-stats span:nth-child(2)',
      // ⚠️ initLost is `e.init > init`, so a TIE WINS. "Has to beat" was wrong by one.
      text: '💨 <b>Init</b> is what your Catalyst must match or beat. A tie goes to you. Lose it and the creature strikes first for its ⚔️, even if your blow then kills it.' },
    { id: 'f-atk', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'fight',
      point: '#encounter-panel .enc-stats span:nth-child(3)',
      text: '⚔️ <b>Atk</b> is what it deals to you: once if it strikes first, and again if you fail to Complete. You pay it with cards.' },
    { id: 'f-shape', when: () => isAssignPhase() && S.encounter && S.encounter.shape,
      point: '#encounter-panel .enc-stats span:nth-child(4)',
      text: 'Its defence changes what your blow is worth. 🛡️ <b>Armour N</b> takes N off every hit. 🌀 <b>Evasion</b> halves your hit unless you win Initiative.' },
    // 🛡️ EQUIPMENT (2026-08-23, Thomas: *"we need to teach the equipment(armor) stuff"*).
    // 🔴 The tutorial has dealt you the full Adventurer's set since the day armour shipped and
    // never said a word about it — four pieces on screen, from turn one, unexplained.
    // 🔑 Placed straight after ⚔️ Atk on purpose: that lesson ends *"you pay that in CARDS"*, and
    // this is the answer to it. **Teach the cost, then the thing that absorbs the cost.**
    { id: 'equipment', when: () => isAssignPhase() && (S.armour || []).some(a => armourBlock(a) > 0),
      point: '#armour-rail .eq',
      text: '🛡️ This is your <b>equipment</b>. You choose it before the run and it is not part of your deck. A piece blocks a hit the way a card does, but it costs you no cards — it is spent instead, for the rest of the run.' },
    // 🦴 the carve. Fires the moment loot exists, which in stage 0 is the first fight you win.
    { id: 'carve', when: () => S.phase === 'reveal' && Object.keys(S.loot || {}).length > 0,
      point: '.haul, .pv-carve',
      text: '🦴 Creatures drop <b>materials</b>. You keep them whether you win or lose the run. Spend them at the ⚒️ Workshop to forge equipment for next time.' },
    { id: 'f-coin', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'fight',
      point: '#encounter-panel .enc-stats span:nth-child(5)',
      text: '🪙 What it pays. Coins buy card levels and charms between encounters, and unspent coins carry over.' },
    // 👣 the journey panel asks a different question and gets its own walkthrough
    { id: 'j-mp', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'journey',
      point: '#encounter-panel .enc-stats span:nth-child(1)',
      text: '👣 A journey measures distance instead of damage, using the same cards. Beat its MP to arrive. Reach half and you arrive late.' },
    { id: 'j-night', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'journey',
      point: '#encounter-panel .enc-stats span:nth-child(2)',
      text: '🌙 Nightfall races your Catalyst\'s 💨. If yours is lower, you lose the card in your Arsenal and your candle goes out.' },
    { id: 'j-tp', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'journey',
      point: '#encounter-panel .enc-stats span:nth-child(3)',
      text: '⏳ <b>Time Penalty</b> is what arriving late costs. You cannot <b>sharpen</b> your cards for this many encounters. A fight costs you cards; a journey costs you growth.' },

    { id: 'slots', when: () => isAssignPhase() && (S.encountersDone || 0) === 0,
      point: '#slots-panel',
      text: 'Your four cards sit under four labels. The position is the role. Tap two cards to swap them, or tap a card then tap a label.' },
    { id: 'spent', when: () => isAssignPhase() && (S.encountersDone || 0) === 0,
      point: '.in-Spell',
      text: 'The card under SPELL is your action, and it is spent for the rest of the region. Weigh that before you play your biggest card.' },
    { id: 'arsenal', when: () => isAssignPhase() && (S.encountersDone || 0) === 0,
      point: '.in-Reserve',
      text: '✋ <b>ARSENAL</b> is the one card you keep for next turn. Everything else leaves your hand. Choose it for the hand you want next turn.' },
    // 🕯️ THE CANDLE WAS NEVER TAUGHT (found 2026-08-12) — it is on screen every single turn, it
    // decides whether banking is informed or a bet, and nothing had ever named it.
    // 🗺️ THE MAP ITSELF — the first screen of every run, and it had no lesson because until
    // today the tutorial had no map. ⚠️ FIRST IN THE LIST, because it is the first thing you see.
    // 🔑 The tutorial's map is a SPINE then a FORK: region 1 gives one road so you learn what a node
    // is, region 2 gives two so you learn that the choice is yours. **Teach the noun, then the verb.**
    { id: 'map', when: () => S.phase === 'map',
      point: '.mp',
      text: '🗺️ This is the road ahead. You move up it from the bottom. Each stop is one encounter: ◇ the road, ❓ an event, 🕯️ a hearth. Tap a stop you can reach to take it. Higher up the road forks, so you choose which problem to face.' },
    // 🕯️ REWRITTEN FOR THE MAP (2026-08-23). The old lesson said *"you can see what comes
    // after this — its HP, its speed"*, which was true of the QUEUE. `nextEncounter()` returns null
    // whenever a map exists — its own comment says so — so with the tutorial map this lesson could
    // never fire, and if it had, it would have described a system that no longer chooses anything.
    // 🔑 **When a system stops driving something, find every reader that still trusts it** — including
    // the ones that only teach.
    { id: 'candle', when: () => S.phase === 'map' && S.candle,
      point: '.mp-peek, .mp',
      text: '🕯️ Your <b>candle</b> is lit, so you can read a road before you take it — what waits there and what it asks for. Only a <b>Complete</b> keeps it lit. A Narrow, a loss or nightfall puts it out.' },
    { id: 'candle-out', when: () => isAssignPhase() && !S.candle,
      point: '.candle',
      text: '🕯️ Your candle is out, so you cannot read the roads ahead. Come through an encounter with a <b>Complete</b> to light it again.' },
    { id: 'couldattune', when: () => isAssignPhase() && !attunedNow() && handHasPair(),
      point: () => { const id = pairPartnerId(); return id ? '.in-' + (zoneOf(id) || 'Spell') : null; },
      text: 'Two of your cards share an element. Put the matching one under CATALYST and your Spell attunes: it strikes for the bigger ✦ number on its face.' },
    { id: 'attuned', when: () => isAssignPhase() && attunedNow(),
      point: '.attuned-pair',
      text: '✦ <b>Attuned.</b> Your Catalyst sets your Initiative as well, and the matching card is rarely the fastest one. Pick whichever this encounter needs.' },
    // ⚠️ this used to fire on banksNow(), i.e. only once you had ALREADY banked by accident. Now
    // that banking is a choice, a lesson gated on the choice can never teach that the choice exists.
    { id: 'bank', when: () => hasEmberwake() && isAssignPhase() && !!cardById(S.assign.Boost) && !S.bankArmed,
      point: '.in-Boost',
      text: 'Your <b>SURGE</b> can fire now, or ⟳ <b>channel</b> it: nothing this turn, and next turn you spend its full value on your strike or your speed. A bigger Surge channels for more.' },
    // 🔥 the other half of the Emberwake. The bank lesson teaches the SAVING; nothing taught the
    // SPENDING, so a player who banked met an unexplained row of buttons the following turn.
    // ⚠️ POINTS AT THE TOKEN (2026-08-21). It used to point at `.wake-row`, which no longer
    // exists — a lesson whose target is gone silently rings nothing at all.
    { id: 'aim', when: () => isAssignPhase() && S.wake > 0,
      point: '#field .tok-wake',
      text: '🔥 You are holding an <b>Emberwake</b>. Tap it to aim it at your strike or your speed. 🛡️ Armour wants the bigger hit, 🌀 Evasion wants you to go first. Spend it this turn or lose it.' },
    { id: 'soak', when: () => S.phase === 'soak',
      point: '#slots-panel',
      text: 'Tap a card to <b>block</b>. It blocks its printed 🛡️ number and drops one level. Block the whole hit or the run ends. Your deck is your health.' },
    { id: 'stack', when: () => S.phase === 'stack',
      point: '#slots-panel',
      text: '🃏 Reversed lets you send each returning card to the top of your deck (drawn next hand) or the bottom (much later). Without the charm they slide under in slot order.' },
    // ⚠️ STALE UNTIL 2026-08-12 — this said only "coins buy levels", which described the Wheel from
    // before sharpening was merged onto it. The screen now does BOTH, and the budget split between
    // them is the actual decision, so a lesson naming one half taught the wrong thing.
    { id: 'wheel', when: () => S.phase === 'wheel',
      point: '#controls-panel',
      text: '🎰 <b>The Wheel.</b> One purse, two things to spend it on: sharpen your own cards, or buy from the shelf. A level raises a card\'s best stat and lowers its worst, so a sharpened card is strong in one slot and weak elsewhere. You cannot afford both, so choose.' },
    { id: 'charm', when: () => S.phase === 'wheel' && S.wheel && (S.wheel.offers || []).some(o => o && o.kind === 'charm'),
      point: '#controls-panel',
      text: '🎁 A <b>charm</b> lasts the whole run and changes a rule rather than a number. Everything you carry is listed in the bar at the top.' },
    { id: 'potion', when: () => (S.potions || []).length > 0,
      point: '.kit-row',
      text: '🧪 A <b>potion</b> is one use, spent on a turn you choose, and lasts that turn only. You can carry ' + POTION_CAP + '. Hold one for a turn that needs it.' },
    // ⚠️ CURSES ARE A DIFFERENT LESSON FROM CHARMS. They arrive without being bought, and the whole
    // point of `carried()` is that a run-long penalty must be on screen every turn — so the lesson's
    // job is to send you to the status bar, not to explain the individual curse.
    { id: 'curse', when: () => (S.charms || []).some(id => { const c = charmById(id); return c && c.curse; }),
      point: '#status-bar',
      text: '⚠️ You picked up a <b>curse</b>: a charm that costs you instead of paying you. It sits in the same bar as your charms so you can see it every turn.' },
    { id: 'event', when: () => S.phase === 'event',
      point: '#controls-panel',
      text: '📖 <b>Events</b> happen between encounters. Read the options. Some cost coins or a card, and one is usually to walk on. An option you cannot afford says why.' },
    { id: 'verb', when: () => S.hand.some(c => verbOf(c)),
      point: '#slots-panel',
      text: '✦ A card at Lv4 gains a verb, and it only works in one slot. Move the card to that slot and the verb lights up. Block with the card below Lv4 and the verb is gone.' },
    // ✦ the rainbow hand is now taught as a PROBLEM, not as a thing the game fixes for you
    { id: 'rainbow', when: () => S.phase === 'assign' && S.hand.length >= 4 && new Set(S.hand.map(c => elOf(c))).size >= 4,
      point: '#slots-panel',
      text: 'All four elements, so no two cards pair and nothing can attune this turn. Play the best plain line you have.' },
    // ⚠️ WRITTEN WRONG ONCE (2026-08-12) — the first draft described the press-your-luck "stir band"
    // approach, which was CUT and replaced by this ordinary journey. It was copied out of CLAUDE.md,
    // which still documented the cut version. The lesson must describe LAST_MILE, not the history.
    // ⭐ THE TWO BARS. Every encounter feeds them, win or lose, and nothing on screen said so.
    // ⚠️ Fires at the WHEEL rather than the end screen, because the end screen is the one moment a
    // new player is definitely reading — and a lesson that appears there competes with the grade,
    // the haul and two moving bars for attention. Teach it while it is still quiet.
    { id: 'levels', when: () => S.phase === 'wheel' && (S.xpRun || 0) > 0,
      point: '#status .chip, #controls-panel',
      text: '⭐ Every encounter earns <b>xp</b>. A clean win pays most, a loss still pays. It fills two bars: your <b>account level</b>, which opens charms any class can use, and this <b>character\'s level</b>, which opens hers. Both are shown when the run ends.' },
    { id: 'lastmile', when: () => S.finalMode && S.finalPhase === 'lastmile',
      point: '#encounter-panel',
      text: '⚔️ <b>The Last Mile</b> is one journey before the lair, and it costs you nothing: no Nightfall, no Time Penalty, no hardship. Every card is reshuffled for the duel afterwards, so play everything you have. Arrive with a <b>Complete</b> and the dragon starts wounded.' },
    { id: 'duel', when: () => S.finalMode && S.finalPhase === 'duel',
      point: '#encounter-panel',
      text: 'The duel is a race between two numbers: its HP, and how many cards you have left. You lose when you run out of cards, so every card you block with is stamina you do not get back.' },
  ],
};
// does the hand hold a same-element pair at all, and which card is the partner worth moving?
function handHasPair() {
  const els = S.hand.map(c => elOf(c));
  return els.some((e, i) => els.indexOf(e) !== i);
}
function pairPartnerId() {
  const sp = spellCard(); if (!sp) return null;
  const m = S.hand.find(c => c.id !== sp.id && elOf(c) === elOf(sp));
  return m ? m.id : null;
}
// 🎓 the next thing worth saying: the first untaught lesson whose when() is true
function nextLesson() {
  if (!S || !S.tutorial || S.lessonsOff) return null;
  S.taught = S.taught || [];
  for (const l of TUTORIAL.lessons) {
    if (S.taught.includes(l.id)) continue;
    let ok = false; try { ok = !!l.when(); } catch (e) { ok = false; }
    if (ok) return l;
  }
  return null;
}
function learned(id) { S.taught = [...(S.taught || []), id]; render(); }

// 🔑 ONE ACCESSOR, so the tutorial is a dataset rather than a branch
// 🗺️ the road you are actually walking — the tutorial's, or your stage's
function RUN() {
  if (S && S.tutorial) return TUTORIAL.regions;
  return roadFor(S && S.dragon ? S.dragon.stage : 1);
}

// ============================================================
// 🐉 DRAGON ATTACKS (2026-07-29, Thomas). The duel is the ONLY multi-beat fight in the game —
// everything else is one hand, one problem — so it is the only place where "what happens next"
// can exist at all. Until now the dragon did the same thing every beat, which made extra beats
// the GRINDING that got beats capped in the first place. Varied attacks are what make a multi-beat
// fight worth being multi-beat.
//
// 🔑 EVERY ATTACK IS TELEGRAPHED A BEAT AHEAD. An attack that arrives unannounced is a dice
// roll; an attack you can SEE coming is a problem. Same principle as the candle and the turn-1
// briefing — you arrange this beat knowing what the next one brings, which is *hard-reactive
// turns* and the one place the game is long enough to support planning.
//
// 🔑 AND EACH IS A VARIATION ON THAT DRAGON'S ONE DEMAND, never a grab-bag: the fight teaches
// its shape three ways instead of one. Effects are stated in ENGINE terms (burn a card, dull a
// number, harden the shape) so a rogue meets exactly the same dragon.
// ============================================================
const DRAGON_ATTACKS = {
  Cindermaw: [
    { id: 'slag',   name: 'Slagfall',       tell: 'molten rock sheets off its plates', fx: {} },
    { id: 'forge',  name: 'Bank the Forge', tell: 'it hunkers down and the scales knit — 🛡️ Armour +2', fx: { armour: 2 } },
    { id: 'blast',  name: 'Cinderblast',    tell: 'ash chokes the air — the card you SURGE with will burn up', fx: { burn: 'Boost' } },
  ],
  Skyrender: [
    { id: 'shear',  name: 'Windshear',      tell: 'it wheels for another pass', fx: {} },
    { id: 'stoop',  name: 'Stoop',          tell: 'it climbs to dive — 💨 its Initiative +4', fx: { init: 4 } },
    { id: 'clap',   name: 'Thunderclap',    tell: 'the air splits — the card you CATALYSE with will be struck from your hand', fx: { burn: 'Element' } },
  ],
  Cragmourn: [
    { id: 'grind',  name: 'Grind',          tell: 'it leans into you without hurrying', fx: {} },
    { id: 'settle', name: 'Settle',         tell: 'it draws a longer breath — ⏳ the escalation takes an extra step', fx: { breathStep: 1 } },
    { id: 'bind',   name: 'Rockbind',       tell: 'stone closes on your pack — whatever you hold in ARSENAL will be taken', fx: { burn: 'Reserve' } },
  ],
  Fathomdread: [
    { id: 'under',  name: 'Undertow',       tell: 'the current gathers under you', fx: {} },
    { id: 'silt',   name: 'Silt',           tell: 'the water goes thick and dull — ✦ nothing will attune', fx: { noAttune: true } },
    { id: 'press',  name: 'Deep Pressure',  tell: 'the weight of the trench settles — ⚔️ every card strikes −2', fx: { value: -2 } },
  ],
};
function attacksFor(d) { return DRAGON_ATTACKS[d.name] || [{ id: 'plain', name: 'Breath', tell: 'it draws breath', fx: {} }]; }
// what is in force THIS beat
function duelFx() { return (S.dragonState && S.dragonState.active && S.dragonState.active.fx) || {}; }

const hasShape = sh => !!(S.dragon && S.dragon.shapes.includes(sh));
// the shape, in one phrase — this is the question the whole run is preparing you for
function dragonShapeText(d) {
  const bits = [];
  if (d.shapes.includes('armour')) bits.push(`🛡️ <b>Armour ${d.shapeV}</b>`);
  if (d.shapes.includes('evasion')) bits.push(`🌀 <b>Evasion</b>`);
  if (d.shapes.includes('guard')) bits.push(`🧱 <b>Guard ${d.shapeV}</b>`);
  if (d.shapes.includes('relentless')) bits.push(`⏳ <b>Relentless</b>`);
  return bits.join(' + ') || '— unguarded';
}
function dragonDemand(d) {
  const bits = [];
  if (d.shapes.includes('armour')) bits.push(`it shaves <b>${d.shapeV}</b> off every blow`);
  if (d.shapes.includes('evasion')) bits.push(`it <b>halves</b> any blow it saw coming`);
  if (d.shapes.includes('guard')) bits.push(`its plates <b>halve your first ${d.shapeV} hit${d.shapeV === 1 ? '' : 's'}</b>`);
  if (d.shapes.includes('relentless')) bits.push(`its breath <b>grows +${RELENTLESS_STEP} every beat</b>`);
  return bits.join(' · ');
}

// ============================================================
// 🚚 THE CHANNEL (2026-08-05) — a FROZEN playtest build and a LIVE dev build, one repo
// ============================================================
// Thomas: *"i will continue to develop the game and i don't want my friends to see all the new
// changes in flux either."* A `?dev` flag hides the dev MENU but it cannot hide the GAME — every
// push still lands under the tester's feet, mid-run, with a save that may no longer load.
//
// So the site now serves two builds from one repo:
//   • /emberwick/play/   🔒 FROZEN — what friends bookmark and install. Only changes when
//                          Thomas cuts a drop (`cut-playtest.ps1`), never when he pushes.
//   • /emberwick/        🔧 LIVE — the working build, changes with every push. `?dev` for tools.
//
// 🔑 A DROP IS A COPY, NOT A BRANCH. The frozen build is seven real files sitting in a folder,
// so there is nothing to merge, nothing to rebase, and no second cache-buster to keep in step —
// the snapshot carries whatever ?v= it was cut at, and its own folder makes that a different URL
// from the live one. The dev tools (solver/measure) are deliberately NOT copied.
//
// ⚠️ AND THE TRAP THIS CONSTANT EXISTS FOR: **localStorage is per-ORIGIN, not per-folder.**
// Both builds are github.io, so without a suffix Thomas's in-flux run save would sit in the same
// slot as his friends' — and a card-data change on the live build would silently invalidate the
// frozen build's saves, which is the exact failure the frozen build exists to prevent. The channel
// namespaces all three keys. **Any new persistent key MUST take the suffix too.**
const CHANNEL = (() => {
  try { return /\/play\//.test(location.pathname) ? 'play' : 'dev'; } catch (e) { return 'dev'; }
})();
const KEY_NS = CHANNEL === 'play' ? '-play' : '';   // the live build keeps the original keys

// ---------- THE LADDER'S MEMORY (survives runs; separate key from the run save) ----------
const LADDER_KEY = 'emberwick-ladder-1' + KEY_NS;

// ============================================================
// 🏆 THE WALL (2026-08-05) — the grade, kept.
//
// 🔑 WHY THIS IS THE RETENTION FIX AND NOT A COSMETIC. [[Market_And_Retention]] found that
// Emberwick has no BUILD DISCOVERY by design, so the genre's usual reason to replay is switched
// off — and what replaces it has to be MASTERY. The grade already scores mastery; it just
// evaporated the moment you closed the run. A board you can see is what turns "I beat it" into
// "I beat it with a C", which is the whole of Balatro's 15 decks × 8 stakes in miniature.
//
// ⚠️ IT KEEPS THE BEST, NEVER THE LAST — a wall you can lose progress on is a punishment, and
// the grade already grades a LOSS (a perfect losing run reaches ~75). Its own key, separate from
// the run save, so wiping a run never wipes the record.
const GRADE_KEY = 'emberwick-grades-1' + KEY_NS;
function bestGrades() {
  try { return JSON.parse(localStorage.getItem(GRADE_KEY) || '{}') || {}; } catch (e) { return {}; }
}
// 🏆 THE WALL IS STAGES x CLASSES (2026-08-12) — a grade belongs to the class that earned it.
//
// 🔑 THIS IS WHY CLASSES ARE NOT BALANCED TO EQUAL WIN RATES. A cell only means something if it is
// a real achievement, and the whole point of a second class is that the SAME dragon is a different
// problem: 🛡️ Armour is easy for the mage and murder for the rogue, 🧱 Guard the reverse. Keeping
// one grade per stage would average that away and turn the difference into a balance complaint
// instead of the content it is. See Class_System.md.
//
// ⚠️ BACKWARD COMPATIBLE BY CONSTRUCTION: every grade recorded before today was a mage grade,
// because the rogue did not exist. A bare `"2"` key is therefore read as `"mage:2"`, so nobody
// loses their wall — and this needed no version bump, the same way `par` did not.
function gradeKey(stage, clsId) { return (clsId || CLASS.id) + ':' + String(stage); }
function gradeFor(stage, clsId) {
  const all = bestGrades();
  const id = clsId || CLASS.id;
  return all[gradeKey(stage, id)] || (id === 'mage' ? all[String(stage)] : null) || null;
}
function recordGrade(stage, g, won) {
  if (stage == null) return;
  try {
    const all = bestGrades(), key = gradeKey(stage), prev = gradeFor(stage);
    if (!prev || g.total > prev.total) {
      all[key] = { total: g.total, letter: g.letter, won: !!won };
      localStorage.setItem(GRADE_KEY, JSON.stringify(all));
    }
  } catch (e) {}
}
// the one-line summary of the whole board — what is left to do, not what is done
// ⚠️ THE TUTORIAL IS NOT ON THE WALL (fixed 2026-08-05). It used to be counted here, so the
// Stages line read "0/5 graded" for four stages — a board whose total does not match the number
// of things on it. The tutorial carries its own badge on its own menu button now, which is the
// whole reason it stopped belonging in this total. 🔑 When something moves to a new screen,
// find every count that still includes it.
// ⚠️ THE TOTAL IS NOW STAGES x UNLOCKED CLASSES. Counting only the stages would have reported
// "4 of 4 graded" to someone who has cleared the ladder as the mage and never touched the rogue —
// a board that says you are finished when half of it is blank. Locked classes are excluded, so the
// denominator never counts a cell you cannot reach.
function wallSummary() {
  const stages = DRAGONS.map(d => d.stage);
  const ids = Object.keys(CLASSES).filter(classUnlocked);
  let got = 0, s_ = 0;
  for (const id of ids) for (const n of stages) {
    const g = gradeFor(n, id);
    if (g) { got++; if (g.letter === 'S') s_++; }
  }
  return { graded: got, total: stages.length * ids.length, perfect: s_, classes: ids.length };
}
// ============================================================
// 🗡️ CHOOSING A CLASS (2026-08-12). The rogue opens once you have felled stage 1.
//
// ⚠️ THE "unlock by runs PLAYED, never dragons felled" NOTE DOES NOT APPLY HERE. That rule is
// about CHARM TIERS, which are power — gating power on winning punishes exactly the players who
// need it. A class is lateral CONTENT, and the ladder itself already gates on dragons felled
// (clearing a stage opens the next), so this is the existing pattern rather than a new one.
//
// 🔑 AND STAGE 1 IS THE RIGHT GATE FOR A TEACHING REASON, not just a pacing one. Cindermaw is
// 🛡️ Armour — "hit big" — and the rogue is the class that structurally CANNOT hit big. Handing
// you the many-small-hits class the moment you have internalised big-hits-win is the lesson.
// ============================================================
const CLASS_KEY = 'emberwick-class-1' + KEY_NS;
function classUnlocked(id) { return id === 'mage' || stagesCleared() >= 1; }
function pickedClassId() {
  try { const v = localStorage.getItem(CLASS_KEY); return (v && CLASSES[v] && classUnlocked(v)) ? v : 'mage'; }
  catch (e) { return 'mage'; }
}
function pickClass(id) {
  if (!CLASSES[id] || !classUnlocked(id)) return;
  try { localStorage.setItem(CLASS_KEY, id); } catch (e) {}
  render();
}

function stagesCleared() {
  try { return Math.max(0, Math.min(DRAGONS.length, +localStorage.getItem(LADDER_KEY) || 0)); }
  catch (e) { return 0; }
}
function clearStage(n) {
  try { if (n > stagesCleared()) localStorage.setItem(LADDER_KEY, String(n)); } catch (e) {}
}
// you may always attempt stage 1, and every stage you have cleared, and the next one up
function stageUnlocked(n) { return n <= stagesCleared() + 1; }
function dragonForStage(n) { return DRAGONS.find(d => d.stage === n) || DRAGONS[0]; }

// ⚔️ THE LAST MILE (2026-08-05, Thomas) — one ordinary journey between region 4 and the duel.
//
// 🔑 THE HISTORY MATTERS, BECAUSE TWO CLEVERER THINGS FAILED HERE FIRST.
// The old two-journey APPROACH was cut because its costs were PHANTOM: a Time Penalty burns deck
// and Nightfall takes your Arsenal, and both were re-gathered at the lair a moment later, so
// failing BOTH journeys measured a cost of 0.2 of a card. It printed prices it never charged.
// Then a press-your-luck SNEAK replaced it and was cut in turn, by Thomas, for the only reason
// that matters: *"i still don't understand the mechanics of this thing, i don't think players will
// either, we need something simpler."* It asked you to hold five new ideas — a rolled stir band, a
// floored initiative, a gain table, a four-step ladder, and a failure that paid out in a different
// currency — none of which appear anywhere else in the game.
//
// 🔑 THOMAS'S FIX INVERTED MINE, AND IT IS THE RIGHT WAY ROUND: do not make the cost real,
// DELETE THE PRETENCE OF A COST AND SAY SO ON SCREEN. The Last Mile charges nothing and prints
// that it charges nothing. All of the stake sits in the REWARD.
//
// 🔑 AND THE RESHUFFLE RESTORES WHAT ONE-VALUE-PER-CARD BROKE. The source game's final journey
// worked because MOVE WAS ITS OWN STAT, so the road never competed with the fight for cards.
// Gathering everything fresh afterwards gets the same property by another route: the journey and
// the duel stop sharing a wallet. Which makes this the one turn in the game where you should
// EMPTY THE TANK — nothing is carried, stacked or kept — and that is a feel no other turn has,
// bought with zero new rules.
//
// ⚠️ No Nightfall, no Time Penalty, no hardship, no Stack. Each of those was only ever a cost,
// and a cost that gets refunded four lines later should not be printed.
// 📏 TUNED 2026-08-05 at n=400 per stage. MP 16 makes the reward CONTESTED - 51% Complete /
// 46% Narrow / 3% Loss - which is the point: a bonus earned about half the time and graded the
// rest, instead of the old Approach's all-or-nothing cliff. Dragon HP was retuned with it
// (40/44/56/44 -> 44/47/60/42) to land the curve at 85 / 58 / 48 / 36.
// ⚔️ THE LAST MILE — ONE hand, TWO races (second race added 2026-08-21, Thomas).
//
// 🔑 IT USED TO ASK ONE QUESTION AND PRINT TWO. `nightfall: 0` meant the Pace line on screen was a
// race that COULD NOT BE LOST — a term displayed doing nothing, which is the opposite of legible
// math. Thomas: *"the first MP part, is there only an MP check, nothing else? initiative check
// too, there should be some sort of consequence as well."*
//
// 🔑 AND THE FICTION ALREADY PROMISED IT. *"You fall on it before it stands"* is a claim about
// SPEED, and it was being paid out by a DISTANCE number. So the two races buy two different things:
//   👣 MOVE  vs its MP        → how hurt it starts   (dragon HP — unchanged, already tuned)
//   💨 PACE  vs its INITIATIVE → whether it is ready for you (its SHAPE, and the opening blow)
//
// 🔑 THE BOON HALF IS NOT NEW MACHINERY — IT IS THREE FIELDS THAT HAVE BEEN WIRED TO ZERO SINCE
// 2026-08-05. `dragonState.boon = { armourCut, unseen, calm }` is one softener per defence shape,
// read by duelArmour() / duelStrike() / duelCounter(), with display strings ("cracked", "unseen
// you (N left)") that could never fire. They were the clean-Approach reward, deleted with the
// Approach; the comment left behind said *"a future reward may fill them again."* This is it.
// ⚠️ [[Balance_Log]]: that boon was worth **+41 points at stage 4** and nothing had replaced it.
//
// 🔑 WHY THE PENALTY IS A SOAK, AND WHY THAT IS THE ONLY HONEST COST HERE (Thomas's call):
// everything re-gathers for the duel, so a Time Penalty or a deck-ORDER cost at the lair is
// PHANTOM — which is exactly why the old Approach's costs were deleted rather than tuned. But a
// SOAK downgrades cards permanently and a Lv1 soaked is TRASHED outright, so it carries into the
// duel as lost levels and lost stamina. Measured: 1 card of duel stamina ≈ 8 points of win rate.
// ⚠️ AND IT DOES NOT BREAK THE PROMISE THE LAST MILE MAKES. *"Hold nothing back"* is about what you
// PLAY, and playing still costs nothing — every card you play comes back. Only FAILING costs.
//
// ⚠️ BANDS ARE SET FROM THE MEASUREMENT, NOT THE FICTION (dev/lastmile-probe.js, n=120/class).
// Pace runs a median of 5-6 against a dragon Initiative of 7-10, so "beat its Initiative" is an
// 18%/27% event — right for a top band — and "below half" is 34% mage / 22% rogue.
// 🔑 The mage eats the penalty more BECAUSE SHE IS SLOWER, and that is legitimate class texture:
// classes differ in HOW HARD, never in WHETHER.
const LAST_MILE = {
  mp: 16, hpComplete: 14, hpNarrow: 7,
  // 🌒 what arriving unheard softens — ONE tick of whatever the shape is.
  // ⚠️ Deliberately gentle on first ship. These are the biggest levers in the game; raise them
  // from a measurement, never from an argument.
  armourCut: 2,     // 🛡️ Armour −2
  unseenBeats: 1,   // 🌀 Evasion sleeps this many beats
  calmBeats: 1,     // ⏳ the breath holds steady this many beats
};
// what arriving unheard is actually worth against THIS dragon — read off its shape rather than
// stated in prose, so the briefing can never promise a softening the duel does not grant.
function unseenPromise() {
  const bits = [];
  if (hasShape('armour'))     bits.push(`its plate is not set (<b>Armour −${LAST_MILE.armourCut}</b>)`);
  if (hasShape('evasion'))    bits.push(`<b>Evasion sleeps ${LAST_MILE.unseenBeats}</b> beat${LAST_MILE.unseenBeats === 1 ? '' : 's'}`);
  if (hasShape('relentless')) bits.push(`<b>its breath holds ${LAST_MILE.calmBeats}</b> beat${LAST_MILE.calmBeats === 1 ? '' : 's'}`);
  return bits.length ? bits.join(' and ') + '.' : 'it has nothing to set — this one guards nothing.';
}
// which of the three bands this Pace lands in. ONE place decides, so the briefing, the beat
// display, the resolution and the bot can never disagree about what the race was.
function lastMileApproach(pace) {
  const di = (S.dragon && S.dragon.init) || 0;
  if (!di) return 'even';
  if (pace >= di) return 'unseen';
  if (pace >= Math.ceil(di / 2)) return 'even';
  return 'heard';
}
const ELEMENTS = ['Fire', 'Water', 'Lightning', 'Stone'];
// dragonWeakness CUT 2026-07-29 — "weakness = the elements it does not shield" cannot survive
// the move to shapes, and a shape has no colour. What replaced it is the SHAPE ITSELF: the
// briefing tells you what the dragon demands, and the whole run is your preparation for it.
// how a creature defends, in one phrase — this is the question the encounter is asking you
// 🛡️🌀 A CREATURE MAY CARRY TWO SHAPES (2026-08-10, for stage 4). Fathomdread's demand is
// *big AND first*, which is exactly what four cards cannot give at once — so its land is full of
// small things that ask the same question. 🔑 The exam is not a new rule, it is two old rules
// arriving together, which is the cheapest hard content in the game.
// ⚠️ `shape` (one) stays legal everywhere; `shapes` (many) is the superset. Everything reads
// this helper so no site can be left behind.
const shapesOf = e => (e && e.shapes) || (e && e.shape ? [e.shape] : []);
// ⚠️ named foeHas, not hasShape — hasShape() already exists for the DRAGON and takes one
// argument. Two same-named helpers with different arities is a crash waiting for a rename.
const foeHas = (e, k) => shapesOf(e).includes(k);
function shapeText(e) {
  const bits = [];
  if (foeHas(e, 'armour')) bits.push(`🛡️ <b>Armour ${e.shapeV}</b> — needs one big hit`);
  if (foeHas(e, 'evasion')) bits.push(`🌀 <b>Evasion</b> — halves your hit unless you strike first`);
  // 🧱 states the demand in HITS, because that is the unit it charges in — "absorbs 2 damage" would
  // be a lie about a pool that counts blows, and a shape you misread is a shape you cannot answer.
  if (foeHas(e, 'guard')) bits.push(`🧱 <b>Guard ${e.shapeV}</b> — halves your first ${e.shapeV} hit${e.shapeV === 1 ? '' : 's'}, so it wants MANY`);
  return bits.join(' + ') || '— unguarded';
}

// ============================================================
// CHARMS (2026-07-06) — run-long passives, our answer to Spire's relics. They add NO cards,
// so deck-as-health and legible math survive; they're the prize worth gambling coins for
// (see 08_Ideas/Addiction_Loop.md). Every effect is a plain numeric mod the engine reads,
// so adding a charm is data, not code.
//   mods: armor/atk (optionally element-gated) · init · pace · boost · soak · coin
// ============================================================
const CHARMS = [
  { id: 'emberheart', tier: 1,  name: 'Emberheart',      rarity: 'common', cost: 5,
    text: '🔥 Fire cards gain +1 armour',            mods: { armor: 1, el: 'Fire' } },
  { id: 'tideglass', tier: 1,   name: 'Tideglass Bead',   rarity: 'common', cost: 5,
    text: '💧 Water cards gain +1 armour',           mods: { armor: 1, el: 'Water' } },
  { id: 'stormpin', tier: 1,    name: 'Storm Pin',        rarity: 'common', cost: 6,
    text: '⚡ Lightning cards strike +1',            mods: { atk: 1, el: 'Lightning' } },
  { id: 'nightveil', tier: 1,   name: 'Nightveil',        rarity: 'common', cost: 6,
    text: '🪨 Stone cards strike +1',               mods: { atk: 1, el: 'Stone' } },
  { id: 'swiftwick', tier: 2,   name: 'Swiftwick',        rarity: 'uncommon', cost: 8,
    text: '💨 +1 Initiative every turn',             mods: { init: 1 } },
  // 🔑 THE RUN LAYER OWES YOU INITIATIVE, NOT THE CARD TABLE (Thomas, 2026-08-17): *"right now we
  // don't have something that helps initiative, that would come from potions or charms, and
  // definitely lvling up cards."* Audited on the spot: exactly ONE positive Initiative charm
  // existed in 32 (Swiftwick, +1, tier 2), against three potions - so the only place speed could
  // come from was the printed number, which is precisely why that number had inflated to 18.
  // ⚠️ AND THE SHAPES HAD NO ANSWERS AT ALL: zero charms named 🌀 Evasion, zero named
  // 🛡️ Armour, one named 🧱 Guard. The three defence shapes ARE the combat design, and the
  // run layer could not engage with two of them.
  { id: 'quickwick', tier: 1,   name: 'Quickwick',        rarity: 'uncommon', cost: 9,
    text: '💨 +2 Initiative every turn',             mods: { init: 2 } },
  // 🌀 the first answer to Evasion in the game. Lateral by construction: it adds no damage, it
  // narrows WHEN the shape applies - so a slightly slower card becomes a legal choice, which is a
  // different arrangement rather than a bigger number.
  { id: 'windreader', tier: 2,  name: 'Windreader',       rarity: 'rare', cost: 12, rule: true,
    text: '🌀 <b>Evasion</b> only halves you if it beats your Initiative by <b>3</b>' },
  // 🛡️ and the first answer to Armour. ⚠️ Deliberately flat rather than a multiplier: Armour
  // is subtracted per HIT, so a percentage would swing wildly between a mage (1 hit) and a rogue.
  { id: 'ironsplit', tier: 2,   name: 'Ironsplitter',     rarity: 'uncommon', cost: 10, rule: true,
    text: '🛡️ <b>Armour</b> takes <b>2 less</b> off every hit' },
  { id: 'lanternpace', tier: 2, name: "Lantern-Bearer",   rarity: 'uncommon', cost: 8,
    text: '🌙 +2 Pace against Nightfall',            mods: { pace: 2 } },
  { id: 'tinderbox', tier: 2,   name: 'Deep Tinderbox',   rarity: 'uncommon', cost: 9,
    text: '➕ Your Surge gives +1 more',            mods: { boost: 1 } },
  { id: 'wardstone', tier: 2,   name: 'Wardstone',        rarity: 'uncommon', cost: 9,
    text: '🛡️ Every card blocks +1',                  mods: { soak: 1 } },
  { id: 'coinpurse', tier: 1,   name: "Pilgrim's Purse",  rarity: 'common', cost: 6,
    text: '🪙 +2 coins from every encounter',        mods: { coin: 2 } },
  // ❌ FOUR ARCHETYPE-GATED CHARMS WERE CUT HERE (2026-08-05, Thomas) — see the note above
  // charmMod(). They named FORCE / SPARK / FLOW / WARD, which is printed on nothing.
  { id: 'brightwick', tier: 3,  name: 'Brightwick',       rarity: 'rare', cost: 14,
    text: '⚔️ All cards strike +1',                  mods: { atk: 1 } },
  { id: 'oathstone', tier: 3,   name: 'Oathstone',        rarity: 'rare', cost: 14,
    text: '🛡️ All cards gain +1 armour',              mods: { armor: 1 } },

  // ☠️ CURSES — charms with negative mods. Never sold on the Wheel; you take one as the PRICE of
  // something in an Event. The engine already sums mods, so a negative charm needs no new
  // machinery — which is why this is the cheapest content the game has.
  { id: 'leadenwick',  name: 'Leaden Wick',      rarity: 'curse', curse: true, cost: 0,
    text: '💨 −2 Initiative on every card',          mods: { init: -2 } },
  { id: 'dulledge',    name: 'Dulled Edge',      rarity: 'curse', curse: true, cost: 0,
    text: '⚔️ Every card strikes −1',                 mods: { atk: -1 } },
  { id: 'dampwick',    name: 'Damp Wick',        rarity: 'curse', curse: true, cost: 0,
    text: '➕ Your Surge gives −2',                  mods: { boost: -2 } },
  { id: 'thinplate',   name: 'Thin Plate',       rarity: 'curse', curse: true, cost: 0,
    text: '🛡️ Every card blocks −1',                  mods: { soak: -1 } },
  { id: 'tithe',       name: 'The Tithe',        rarity: 'curse', curse: true, cost: 0,
    text: '🪙 −2 coins from every encounter',        mods: { coin: -2 } },
  { id: 'longshadow',  name: 'Long Shadow',      rarity: 'curse', curse: true, cost: 0,
    text: '🌙 −2 Pace against Nightfall',            mods: { pace: -2 } },
];
// 🔑 RULE-CHANGING CHARMS (2026-08-05). Every charm above modifies a NUMBER; these change a
// RULE. That difference is the whole point - the market research (06_Development/Market_And_Retention.md)
// found BUILD DISCOVERY to be the genre's single largest retention driver, and Balatro's engine is
// literally "each Joker changes one rule". Ours changed integers.
//
// 🔑 AND IT GOES IN THE RUN LAYER ONLY. The 16 cards stay fixed and knowable - that is the
// premise of the puzzle and half the design leans on it (the Stack, the standing, deck-as-health,
// sharpening). A charm is the one place a rule may bend, so a run can differ in its TOOLS without
// the deck differing at all.
//
// TWO BARS, and they are strict:
//   1. Does it make a DIFFERENT ARRANGEMENT correct? If it only makes the same arrangement better,
//      it is a stat wearing a costume - that is what the numeric charms above already are.
//   2. Is there a hand where you would rather NOT have it? Balatro's jokers are lateral and can
//      genuinely hurt you. That is what makes taking one a decision instead of a pickup.
//
// ⚠️ AND THE LEGIBILITY RULE THAT CUT FIVE CHARMS ON 2026-08-05: a charm may only name
// something PRINTED ON THE CARD. Never an archetype (FORCE/SPARK/FLOW/WARD are printed nowhere),
// never the retired elemental cycle. Element is fine - it is on the face.
//
// ⚠️ MOST RULE-CHANGERS ARE GENERIC, and that is not an accident: the ENGINE owns nearly every
// rule (the four slots, the Arsenal, soaking, the Initiative race, cleanup, the Stack, the candle,
// Divert, hardships) while the MAGE owns exactly one - pairing. A generic charm is also rewritten
// free by every class we add; a mage charm dies with the mage.
const RULE_CHARMS = [
  // ---- GENERIC: engine rules, so every future class inherits these unchanged ----
  { id: 'unspent', tier: 4,  name: 'Unspent',       rarity: 'rare', cost: 13, rule: true,
    text: '✦ Complete an encounter and your <b>Spell is not spent</b> — it slides under the deck instead',
    why: 'the smallest sufficient Spell becomes the whole game' },
  { id: 'reversed', tier: 1, name: 'Reversed',      rarity: 'uncommon', cost: 9, rule: true,
    text: '🃏 <b>Choose</b> where your returning cards go — each to the <b>TOP</b> or the <b>BOTTOM</b> of your deck',
    why: 'without it they return in slot order; this is control over your own deck' },
  { id: 'slowfoot', tier: 3, name: 'Slow Strength', rarity: 'uncommon', cost: 10, rule: true,
    text: '💨 <b>Lose Initiative</b> and your strike is <b>+4</b>',
    why: 'a second answer to 🛡️ Armour, and slow hands stop being dead' },
  // ============================================================
  // 🎁 THE ANTI-SYNERGY SET (2026-08-24). Thomas: *"i like anti synergy idea. we need more
  // build variety. thats a big missing thing. runs should hopefully feel different from each
  // other. but right now they feel pretty much the same."*
  // 🔑 THE RULE THEY ARE BUILT ON: charms must not all ADD, or a build is only ever *take the
  // biggest*. These come in OPPOSING PAIRS, so which two you hold decides what a good turn even
  // looks like - and holding both halves of a pair is deliberately close to worthless.
  //   ⚖️ Even Keel  <->  🗡️ Keen Edge   - a FLAT deck against a SHARPENED one
  //   🧱 Ironbound  <->  💔 Glass Heart - KEEP every card against SPEND them for power
  // ⚠️ ALL SIX ARE GENERIC (no `cls`), which is the better investment: +1 class = xN refresh,
  // and the ENGINE owns nearly every rule while the mage owns exactly one. Each names something
  // PRINTED - a value, a level, the 🃏 Standing - never an element or an archetype.
  // ============================================================
  { id: 'evenkeel', tier: 2, name: 'Even Keel', rarity: 'uncommon', cost: 10, rule: true,
    text: '⚖️ If no two cards in hand differ by more than <b>2</b> in value, your strike is <b>+3</b>',
    why: 'pays you for the flat hand - and sharpening is what breaks it' },
  { id: 'keenedge', tier: 2, name: 'Keen Edge', rarity: 'uncommon', cost: 10, rule: true,
    text: '🗡️ Your Spell strikes <b>+2 for every level above Lv2</b>',
    why: 'the opposite bet to Even Keel - sharpen one card and lean on it' },
  { id: 'ironbound', tier: 3, name: 'Ironbound', rarity: 'rare', cost: 12, rule: true,
    text: '🧱 A card that blocks never drops below <b>Lv2</b>',
    why: 'the deck can be bruised but never blunted, and never lost' },
  // 💔 GLASS HEART WAS CUT ON THE DAY IT WAS WRITTEN (2026-08-24). It was meant to be
  // Ironbound's opposite - *spend the deck for power* - and it was measured three times in three
  // shapes, all of which came back three times stronger than the best charm in the game:
  //   +6, cost = the soaking card is DESTROYED        -> **+39.9 road Complete**
  //   +3, cost = the soaking card loses TWO levels    -> **+27.7**
  //   +5, cost = your sharpest card dulls each encounter (unconditional) -> **+34.2**
  // 🔑 THE LAW THIS EARNED, WHICH IS WORTH MORE THAN THE CHARM: **A FLAT, UNCONDITIONAL STRIKE
  // BONUS IS WORTH ROUGHLY +7 ROAD COMPLETE PER POINT.** Every healthy charm in this game is
  // CONDITIONAL - Cold Iron +3 when unattuned reads +12.6, Even Keel +3 on a flat hand reads +9.1 -
  // because the condition is what stops it applying on the turns that were already won.
  // ⚠️ AND NO COST COULD BUY IT BACK. Thirteen deck levels a run - 40% of the starting deck -
  // did not offset five points of strike, because levels are paid at the LAIR while the bonus is
  // collected on every one of ~13 encounters. **A cost denominated in a late resource cannot price
  // a benefit collected early.**
  // ✅ So the template for any future charm is: *a bonus, PLUS the condition that makes it a
  // decision*. A charm with no condition is not a charm, it is a difficulty setting.
  // 🎯 FORKED STRIKE. 🔴 IT FIRST SHIPPED AS *"after you Complete, your next strike splits"* AND
  // MEASURED **+0.4 road C / -3 win** - inert, and slightly a liability.
  // 🔑 THE LESSON, WHICH APPLIES TO ALL THREE OF THESE ITEMS: **A LATERAL EFFECT MUST BE
  // OPTIONAL, OR IT IS A COIN FLIP YOU DID NOT CALL.** A damage bonus can be unconditional because
  // more is always better; splitting a blow is a SHAPE change that is strictly worse into
  // 🛡️ Armour, so forcing it on you is a liability roughly as often as it is a gift.
  // ✅ So it is pointed at the shape it answers instead. 🧪 The POTION keeps the unconditional
  // version because **you choose the turn** - that is the same effect made optional by its
  // delivery, which is the whole distinction.
  // ✅ AND IT FILLS A RECORDED HOLE: charms answer 🌀 Evasion (Windreader) and 🛡️ Armour
  // (Ironsplitter), and **🧱 Guard had none**. Narrow by design, exactly as those two are.
  { id: 'forkedstrike', tier: 3, name: 'Forked Strike', rarity: 'rare', cost: 12, rule: true,
    text: '🎯 Against 🧱 <b>Guard</b>, your strike <b>splits in two</b>',
    why: 'the first charm that answers a breakable pool' },
  { id: 'bloodied', tier: 2, name: 'Bloodied', rarity: 'uncommon', cost: 10, rule: true,
    text: '🃏 While your deck is <b>below par</b>, your strike is <b>+3</b>',
    why: 'the 🃏 Standing stops being a warning and becomes a resource' },
  // 🛡️ BRACE WAS CUT THE DAY IT WAS WRITTEN (2026-08-24) - *one card may soak more than once
  // in the same encounter*. Two independent reasons, either of which was enough:
  //  1. **It measured +4.1 road Complete and MINUS 23 stage win.** It buys the road with the lair:
  //     you drive one card into the ground and arrive with fewer deck levels, which is the single
  //     strongest predictor of the duel. ⚠️ That is the ✦ Held Ember shape - *a charm you should
  //     regret buying* - and the bot makes it worse, because a one-encounter scorer collects the
  //     road benefit and cannot see the bill.
  //  2. 🔴 **IT MADE 🧱 IRONBOUND INFINITE.** Ironbound keyed off `S.downgraded.size === 1`, and
  //     `Set.add` of an id already present leaves the size at 1 - so with both charms held, EVERY
  //     soak for the whole encounter was free, forever.
  // 🔑 THE LESSON IS THE SECOND ONE: **a charm that removes a UNIQUENESS constraint silently
  // rewrites every rule that was counting on it.** `S.downgraded` was doing two jobs - *which cards
  // have soaked* and *how many times has this happened* - and Brace only meant to change the first.
  // Ironbound is stateless now for exactly that reason.
  // ---- MAGE: the one rule this class owns is PAIRING ----
  { id: 'threekind', tier: 4, name: 'Three of a Kind', rarity: 'rare', cost: 14, rule: true, cls: 'mage',
    text: '✦ Spell, Catalyst <i>and</i> Surge sharing an element — your strike <b>doubles</b>',
    why: 'pair attunes, three resonates' },
  { id: 'looseweave', tier: 1, name: 'Loose Weave',  rarity: 'uncommon', cost: 10, rule: true, cls: 'mage',
    text: '✦ <b>Any</b> Catalyst attunes your Spell, but an unmatched one gives only <b>a third</b> of the bonus',
    why: 'no hand is ever dead' },
  { id: 'secondflame', tier: 3, name: 'Second Flame', rarity: 'rare', cost: 13, rule: true, cls: 'mage',
    text: '✦ Your <b>Surge</b> can attune the Spell too — freeing the Catalyst to be pure speed',
    why: 'the Catalyst stops serving two masters' },
  { id: 'coldiron', tier: 3, name: 'Cold Iron',      rarity: 'uncommon', cost: 10, rule: true, cls: 'mage',
    text: '✦ Your <b>unattuned</b> strikes are <b>+3</b>',
    why: 'the anti-pairing build — and it makes a hand with no pair a plan instead of a punishment' },
  { id: 'kindledarsenal', tier: 4, name: 'Kindled Arsenal', rarity: 'rare', cost: 12, rule: true, cls: 'mage',
    text: '✦ Your <b>Arsenal</b> can attune the Spell as well',
    why: 'the one slot with no job in the maths gets one' },
  // 🗡️ THE ROGUE'S SIX. Same bar as the mage's: each must NAME SOMETHING PRINTED ON THE CARD
  // (the combo partner is printed, so the chain is fair game), must make a DIFFERENT arrangement
  // correct, and must still hand you a different hand tomorrow.
  // ⚠️ Gating alone would have EMPTIED 🏕️ Setting Out for the rogue — the phase only starts if the
  // offer list is non-empty, which is exactly how the first charm-tiering silently deleted that
  // whole screen on stage 1. A pool filter without a pool is a missing feature, not a filter.
  { id: 'whetstone', tier: 1, name: 'Whetstone',     rarity: 'uncommon', cost: 9, rule: true, cls: 'rogue',
    // ⚠️ "so a long chain gains the most" was DOUBLY dead: the chain is gone, and the rogue's
    // compose() returns hits: 1 always, so there is never more than one hit to multiply.
    text: '🗡️ Your strike gains <b>+1</b>' },
  // 🔑 THE DELIBERATE ANTI-SYNERGY, and the rogue's Cold Iron: the one charm that makes a BROKEN
  // chain something you wanted. Without it every rogue charm pulls the same way, and a class whose
  // charms all agree has no build to discover.
  // ⚠️ its text still said "while your chain is 1" long after the chain was deleted; the CODE always
  // read momentum === 0. Under a streak that means *just broken*, so it now pays you for the wreck —
  // deliberate anti-synergy with every other rogue charm, the way ✦ Cold Iron is for the mage.
  { id: 'lonefang', tier: 1, name: 'Lone Fang',      rarity: 'uncommon', cost: 9, rule: true, cls: 'rogue',
    text: '🗡️ While your Momentum is <b>0</b>, your strike gains <b>+4</b>' },
  { id: 'twinblades', tier: 2, name: 'Twin Blades',  rarity: 'rare', cost: 12, rule: true, cls: 'rogue',
    // ⚠️ WAS "counts as the previous card" - pure CHAIN language, and the chain was deleted two
    // redesigns ago. The CODE was always fine: it lets the Arsenal complete a pair. Only the
    // sentence was describing a mechanic that no longer exists.
    text: '🗡️ Your <b>Arsenal</b> can complete a pair too — the combo fires from either slot' },
  { id: 'deepcut', tier: 3, name: 'Deep Cut',        rarity: 'rare', cost: 13, rule: true, cls: 'rogue',
    text: '🧱 <b>Guard</b> swallows one fewer hit' },
  // ⚠️ REWRITTEN WITH THE CLASS (2026-08-12). Both of these named the CHAIN, which no longer
  // exists — a charm whose subject has been deleted is worse than a missing charm, because it still
  // takes a slot in the offer and still reads as a rule.
  // 🔑 A FLOOR, NOT AN OFF SWITCH: "Momentum never breaks" would delete the minigame outright.
  // A charm may bend the class's question, never answer it.
  { id: 'secondnature', tier: 4, name: 'Second Nature', rarity: 'rare', cost: 12, rule: true, cls: 'rogue',
    text: '🗡️ When your Momentum breaks it falls to <b>2</b>, not 0' },
  { id: 'deadhand', tier: 4, name: 'Dead Hand',      rarity: 'rare', cost: 14, rule: true, cls: 'rogue',
    text: '🗡️ <b>Complete</b> an encounter and Momentum rises by <b>2</b>' },
  { id: 'heldember', tier: 1, name: 'Held Ember',    rarity: 'uncommon', cost: 9, rule: true, cls: 'mage',
    text: '✦ When you attune, your <b>Catalyst stays in hand</b> instead of sliding under the deck',
    why: 'attuning stops costing you tempo' },
];
CHARMS.push(...RULE_CHARMS);
// (`hasCharm()` already exists further down — every rule below asks it.)

// 🧪 hand over a potion from an Event. Respects the carry cap, and says so rather than
// silently eating it — a reward you cannot take must explain itself.
function evGrantPotion(id) {
  const p = potionById(id);
  if (!p) return 'Nothing comes of it.';
  if ((S.potions || []).length >= POTION_CAP) return `Your kit is full — you leave the ${p.name} where it is.`;
  S.potions.push(id);
  return `🧪 ${p.name} goes in your kit — ${p.text}`;
}
// a random potion you can actually carry, biased to the cheap ones for free gifts
function evRandomPotion(rare) {
  const pool = potionPool().filter(p => rare ? true : p.rarity !== 'rare');
  return pool.length ? evGrantPotion(rand(pool).id) : 'Nothing here suits you.';
}

// grant a charm (or a curse) from an Event. Returns a log line.
function evGrantCharm(id) {
  const c = charmById(id);
  if (!c) return 'Nothing comes of it.';
  if (S.charms.includes(id)) return `You already carry ${c.name}.`;
  S.charms.push(id);
  return c.curse ? `☠️ You take on ${c.name} — ${c.text}` : `🎁 ${c.name} — ${c.text}`;
}
// a curse you don't already carry, for Events that charge one as a price.
// 🔑 It must never be the curse that exactly UNDOES what you were just given: the Mirror Fen could
// roll "+2 Pace on your next journey" and "Long Shadow: -2 Pace" together, so the blessing was
// invisible and the whole event read as "nothing happened, and also you are worse off tomorrow".
// A gamble whose faces silently annihilate each other is not a gamble, it is a non-event.
function randomCurse() {
  // ⚠️ CURSES GO THROUGH THE SAME GATE. 💧 Damp Wick (−2 Surge) was a free pass for any class
  // without a Surge - the rogue simply could not be cursed by it.
  let pool = CHARMS.filter(c => c.curse && charmFitsClass(c) && !(S.charms || []).includes(c.id));
  if (S.paceBless > 0) { const p = pool.filter(c => !(c.mods && c.mods.pace)); if (p.length) pool = p; }
  return pool.length ? rand(pool) : null;
}
// Lift a curse. Curses must have a way OUT or taking one is simply wrong late in a run, and
// the interesting choice ("what will you carry for this?") collapses into "never, thanks".
function evLiftCurse() {
  const held = (S.charms || []).filter(id => (charmById(id) || {}).curse);
  if (!held.length) return 'You carry nothing that needs lifting.';
  const id = rand(held);
  S.charms = S.charms.filter(x => x !== id);
  return `✨ ${charmById(id).name} lifts from you — ${charmById(id).text} is gone.`;
}
function curseCount() { return (S.charms || []).filter(id => (charmById(id) || {}).curse).length; }
// 🔑 GETTING A LOST CARD BACK (2026-07-27). Trashing is permanent and it compounds: measured,
// a sub-optimal player loses 6 of 16 cards a run while an optimal one loses none, and there was
// no way back. Rather than soften the damage curve (a Lv0 floor was considered and dropped -
// blunted cards would soak for free), recovery lives on the RUN layer, where you pay for it.
// A recovered card returns at Lv1: it is back, but it is not what it was.
function evRecoverCard(which) {
  if (!S.trashed.length) return 'Nothing of yours has been lost yet.';
  const i = which === 'first' ? 0 : S.trashed.length - 1;
  const card = S.trashed.splice(i, 1)[0];
  card.level = 1;
  S.deck.push(card);
  return `✨ ${displayName(card)} is yours again — battered, back at Lv1, and now at the bottom of your deck.`;
}
function evRecoverAll() {
  if (!S.trashed.length) return ['Nothing of yours has been lost yet.'];
  const names = S.trashed.map(c => displayName(c));
  for (const c of S.trashed) { c.level = 1; S.deck.push(c); }
  S.trashed = [];
  return [`✨ Everything you lost comes back at Lv1: ${names.join(', ')}.`];
}
function evTakeCurse() {
  const c = randomCurse();
  return c ? evGrantCharm(c.id) : 'The dark has nothing left to take from you.';
}
const charmById = id => CHARMS.find(c => c.id === id);

// ============================================================
// EVOLUTION CUT 2026-07-26 - it solved a symptom (flat/duplicate cards are a DATA problem),
// every verb was an exception fighting the legibility pillar, and at ~10% a spin it was too
// rare to be felt. Replaced by levelling-as-sharpening (02_Progression/).
const displayName = card => card.def.name;
function hasCharm(id) { return !!(S && S.charms && S.charms.includes(id)); }
// ⚠️ A CHARM MAY ONLY NAME SOMETHING PRINTED ON THE CARD (2026-08-05, Thomas: *"you are
// calling them their role, but thats not ever shown to the player"*).
//
// Four charms and a curse used to gate on ARCHETYPE — *"Spell-cards (FORCE) strike +2"*,
// *"Guard-cards (WARD) soak +2"*. FORCE / SPARK / FLOW / WARD are an authoring tool for the 16-card
// brief; they are printed on NOTHING, so the player could not tell which four of their sixteen
// cards a charm even applied to. "Guard-cards" was worse again — not a word the game uses anywhere,
// and it collides with the 🧱 GUARD defence shape.
//
// 🔑 Same rule that governs enemy effects: NEVER STATE A RULE ABOUT AN OBJECT WITHOUT MARKING THE
// OBJECT. The archetype gate is gone entirely rather than left unused, so nobody adds another
// invisible-property charm to it. ELEMENT gating stays — an element is on the card's face.
function charmMod(key, el) {
  if (!S || !S.charms) return 0;
  let t = 0;
  for (const id of S.charms) {
    const c = charmById(id);
    // ⚠️ a RULE-changing charm carries no `mods` at all — it bends an engine rule instead of
    // adding to a number, so it must fall straight through this sum rather than crash it.
    if (!c || !c.mods || c.mods[key] == null) continue;
    if (c.mods.el && c.mods.el !== el) continue;   // element-gated, and an element is PRINTED
    t += c.mods[key];
  }
  return t;
}

// 🎁 THE RULE CHARMS THAT ADD TO A STRIKE, IN ONE PLACE, CALLED FROM BOTH VALUE BRANCHES.
// 🔑 Extracted on the FIRST day it had two callers rather than the fourth - the arrangement
// search reached FOUR copies before anyone pulled it out, and every copy after the first had
// silently missed a rule.
// ⚠️ ENGINE-ONLY BY CONSTRUCTION: it reads a card's LEVEL and VALUE and the 🃏 Standing, all
// printed and class-blind. It must never learn an element or an archetype.
function charmStrike(spell) {
  let t = 0;
  // ⚖️ EVEN KEEL - the flat hand, normally the BAD hand, becomes the plan.
  // 🔑 Its anti-synergy is with the upgrade economy itself: every level you buy widens the
  // spread that switches it off, so holding it makes SHARPENING a decision instead of a default.
  if (hasCharm('evenkeel') && S.hand && S.hand.length > 1) {
    const vals = S.hand.map(c => eff(c).value);
    if (Math.max(...vals) - Math.min(...vals) <= 2) t += 3;   // ⚠️ 5 measured +14.7 road C
  }
  // 🗡️ KEEN EDGE - the exact opposite bet. Holding both is nearly worthless, which is the point.
  if (hasCharm('keenedge') && spell) t += 2 * Math.max(0, spell.level - 2);
  // 🃏 BLOODIED - a comeback rule, and the first thing in the game that READS the Standing.
  // ⚠️ The chip stays a DISPLAY everywhere else; this reads the same two terms it prints, it
  // does not make the chip an input to anything the chip itself reports.
  if (hasCharm('bloodied') && S.dragon && S.dragon.par && deckLevels() < S.dragon.par) t += 3;
  return t;
}

// ============================================================
// state
// ============================================================
let uid = 0;
let S = null;

function newCard(def) { return { id: ++uid, def, level: START_LEVEL }; }

// 🎲 ONE SOURCE OF RANDOMNESS, so Stage 0 can be made identical without touching every site that
// rolls. In a normal run this is just rnd(); in the tutorial it is a seeded generator
// reset at the start, which makes the encounters, the hands, the Wheel offers and the events all
// play out the same way every single time. Patching each call site individually would have meant
// finding them all, and missing one is invisible until someone notices their tutorial differed.
let TSEED = 0;
function rnd() {
  if (!S || !S.tutorial) return Math.random();
  TSEED = (TSEED * 1664525 + 1013904223) >>> 0;
  return TSEED / 4294967296;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- save state (auto-saves every stable phase; survives refresh) ----------
// 🔢 THE BUILD STAMP. Read straight off game.js's own `?v=` query, so it can NEVER drift from the
// cache-bust number — which is the number that actually decides what the browser is running.
// Added 2026-07-29 after a screenshot showed a build two versions stale and it took a browser
// test to work out why a mechanic "wasn't there". index.html has no cache-buster of its own, so
// a phone can happily serve yesterday's HTML (which then requests yesterday's assets).
const BUILD = (() => {
  try { const t = document.querySelector('script[src*="game.js"]'); const m = t && t.src.match(/v=(\d+)/); return m ? m[1] : '?'; }
  catch (e) { return '?'; }
})();

const SAVE_KEY = 'emberwick-save-1' + KEY_NS;
// BUG FOUND 2026-07-29: the writer said `v: 4` while the reader demanded `d.v !== 3`, so EVERY
// load silently failed and every reload started a fresh run. One constant now, used by both - the
// two can never drift again. Bumped to 5 here because dragons changed shape (shields -> SHAPE).
// ⚙️ 6 — 🛡️ armour (2026-08-23). ⚠️ loadGame() failing is SILENT (indistinguishable from
// "no save yet"), so always round-trip a save after touching the schema.
const SAVE_VERSION = 6;

// 🔑 THE KEY IS A PARAMETER SO DEV SLOTS SHARE THIS EXACT SERIALIZER (2026-08-22).
// ⚠️ A second copy of "how a run is written down" would drift the way a forked duel-maths copy did
// in July — and a slot that saved a slightly different shape would load into a subtly wrong run,
// which is the worst possible bug in a TESTING tool: it would make you chase ghosts in the game.
function saveGame(key) {
  if (!S || S.phase === 'reveal') return; // mid-reveal saves would lose the pending resolution
  try {
    const card = c => { // by index — names duplicate across elements. mods (am/at/ee) only when set.
      // ⚠️ INDEXED INTO THE CLASS'S OWN TABLE. Cards are stored by index because names duplicate;
      // now that a second class exists, an index is only meaningful alongside `cls` (written below
      // and restored BEFORE any card is decoded).
      const o = { id: c.id, n: CLASS.defs.indexOf(c.def), lv: c.level };
      return o;
    };
    localStorage.setItem(key || SAVE_KEY, JSON.stringify({
      v: SAVE_VERSION, uid, dragon: S.dragon ? S.dragon.name : null,
      region: S.region, turn: S.turn, regionTurn: S.regionTurn,
      deck: S.deck.map(card), hand: S.hand.map(card),
      discard: S.discard.map(card), trashed: S.trashed.map(card),
      queue: S.encounterQueue.map(e => e.name),
      results: S.results, phase: S.phase,
      // 🔴 SAVE THE BASE NAME, NOT THE DECORATED ONE (fixed 2026-08-23). An elite is a COPY
      // with a changed name ("Mirefen Road, grown bold"), so looking that name up in the region's
      // encounter list on load finds nothing and loadGame() returns false — SILENTLY, which is
      // indistinguishable from "no save yet". Every run that quit during an elite was gone.
      // ⚠️ eliteVersion()'s own comment says *"baseName is what makes an elite RELOADABLE"*, and
      // the save never used it. **A comment that describes a system is not the system.**
      encounter: S.encounter ? (S.encounter.baseName || S.encounter.name) : null,
      encounterElite: !!(S.encounter && S.encounter.elite),
      hardship: S.hardship, rangedDodge: S.rangedDodge, loseReserve: S.loseReserve,
      poison: S.poison, afterSoak: S.afterSoak,
      assign: S.assign, divertsUsed: S.divertsUsed,
      boostTarget: S.boostTarget, coins: S.coins, charms: S.charms, damage: S.damage, damageEl: S.damageEl,
      downgraded: [...S.downgraded], actionSetIds: S.actionSetIds, reserveId: S.reserveId,
      stack: S.stack,
      finalMode: S.finalMode, finalPhase: S.finalPhase, dragonState: S.dragonState,
      lastMileOutcome: S.lastMileOutcome, lastMileApproach: S.lastMileApproach, duelBeat: S.duelBeat, defeatMsg: S.defeatMsg,
      fork: S.fork ? S.fork.map(e => e.name) : null,
      boon: S.boon, boonOwed: S.boonOwed,
      // 🗺️ THE MAP IS THE RUN, SO IT HAS TO BE IN THE SAVE. It was not, and a run left on the
      // map screen came back with nothing to stand on - Thomas: *"if i happen to leave the page when
      // the map is up, when i come back and try to continue, the map isn't there and i can't
      // continue."* 🔑 EVERY NEW PIECE OF RUN STATE NEEDS A LINE HERE; `fork` and `boon` got one
      // the day they were built and the map, which replaced them both, did not.
      // ⚠️ Encounters are stored by NAME and rebuilt, never as objects - a deserialized copy would
      // be a different object from the region's own def, and identity checks elsewhere would miss.
      map: S.map ? {
        pos: S.map.pos, taken: S.map.taken,
        floors: S.map.floors.map(row => row.map(n => n ? {
          t: n.type, k: n.kind, x: n.next, d: n.done,
          e: n.enc ? (n.enc.baseName || n.enc.name) : null,
        } : null)),
      } : null,
      pendingEvent: S.pendingEvent, eventAt: S.eventAt, eventDone: S.eventDone,
      eventTurnPending: S.eventTurnPending, event: S.event,
      eventsSeen: S.eventsSeen, eventFlags: S.eventFlags,
      wake: S.wake, wakeTarget: S.wakeTarget, wakePending: S.wakePending, setout: S.setout, candleGrace: S.candleGrace || 0,
      loot: S.loot, encountersDone: S.encountersDone, runBanked: S.runBanked,
      armour: S.armour, armourStrike: S.armourStrike, armourStrikePending: S.armourStrikePending,
      splitPending: S.splitPending || 0, armourWinInit: !!S.armourWinInit,
      armourPace: S.armourPace, armourPacePending: S.armourPacePending,
      delayed: S.delayed, duelStamina0: S.duelStamina0, stats: S.stats, tutorial: S.tutorial, candle: S.candle, potions: S.potions, contract: S.contract,
      cls: CLASS.id, momentum: S.momentum, drawExtra: S.drawExtra,
      taught: S.taught, lessonsOff: S.lessonsOff,
      curseNextFight: S.curseNextFight, paceBless: S.paceBless, emberShield: S.emberShield,
      logEntries: S.logEntries.slice(0, 40),
    }));
  } catch (err) { /* storage unavailable — play on without saves */ }
}

// 🗺️ rebuild a saved map: node shape back as-is, encounters re-resolved from the band's own
// region by name, and elites rebuilt through eliteVersion() so they cannot drift.
function reviveMap(m) {
  if (!m || !m.floors) return null;
  return {
    pos: m.pos || null,
    taken: m.taken || [],
    floors: m.floors.map((row, f) => row.map((sn, c) => {
      if (!sn) return null;
      // ⚠️ the column comes from the map INDEX, not indexOf - identical node shapes would
      // otherwise all resolve to the first matching column.
      const n = mapNode(f, c);
      n.type = sn.t; n.kind = sn.k || 'fight'; n.next = sn.x || []; n.done = !!sn.d;
      if (sn.e) {
        const region = RUN()[bandOf(f) - 1] || RUN()[0];
        const base = region.encounters.find(e => e.name === sn.e);
        if (base) n.enc = sn.t === 'elite' ? eliteVersion(base) : base;
      }
      return n;
    })),
  };
}

function loadGame(key) {
  try {
    const raw = localStorage.getItem(key || SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (d.v !== SAVE_VERSION) return false;
    // ⚠️ THE CLASS MUST BE RESTORED BEFORE ANY CARD IS DECODED — a card index means nothing without
    // knowing whose table it indexes into. Old saves have no `cls` and are mage runs by definition.
    setClass(CLASSES[d.cls] || MAGE);
    const mk = s => {
      const def = CLASS.defs[s.n];
      if (!def) return null;
      const c = { id: s.id, def, level: s.lv };
      return c;
    };
    const deck = d.deck.map(mk), hand = d.hand.map(mk), discard = d.discard.map(mk), trashed = d.trashed.map(mk);
    if ([...deck, ...hand, ...discard, ...trashed].some(c => !c)) return false; // card data changed since save
    // 🔴 RESOLVE THE SAVED RUN'S OWN ROAD — NEVER `RUN()` (fixed 2026-08-22, found by Thomas:
    // *"don't know if the continue run is working, my run wasn't saved"*).
    // 🐛 `RUN()` reads `S.dragon.stage` — the run currently IN MEMORY — and this line used it to
    // look up an encounter belonging to the run being LOADED. On a cold boot `S` is null, so
    // RUN() fell back to stage 1's road; a save from stages 2-4 hunted its creature in the wrong
    // land, found nothing, and `loadGame` returned false.
    // 🔑 AND THE FAILURE IS SILENT — `loadGame()` returning false is indistinguishable from "no
    // save yet", so it read as a fresh run and the menu simply stopped offering Continue. That is
    // the exact shape of the July save-version bug, which is why this file already says: **always
    // round-trip a save after touching the schema.** It was not the schema this time; it was the
    // ROAD, which is chosen by state that has not been restored yet at this point in the function.
    // ⚠️ Every save from stage 2, 3 or 4 was unresumable after closing the app. Stage 1 worked by
    // pure coincidence — it is what the fallback happens to return.
    const savedDragon = d.dragon ? DRAGONS.find(x => x.name === d.dragon) : null;
    const road = d.tutorial ? TUTORIAL.regions : roadFor(savedDragon ? savedDragon.stage : 1);
    const region = road[d.region - 1];
    if (!region) return false;
    // ⚠️ Try the stored name first so saves written before the fix (which hold the decorated
    // name) are not made worse; then rebuild the elite through the SAME eliteVersion() the fight
    // used, which is the only way the reload cannot drift from the original.
    let encounter = d.encounter ? region.encounters.find(e => e.name === d.encounter) : null;
    if (encounter && d.encounterElite) encounter = eliteVersion(encounter);
    // ⚠️ PHASES THAT LEGITIMATELY HAVE NO ENCOUNTER. 🛤️ 'fork' had to be added the day it was
    // built: during a fork no encounter has been chosen yet, so S.encounter is null, and this
    // guard sent every mid-fork load down the `return false` path.
    // 🔑 AND loadGame() RETURNING FALSE IS INDISTINGUISHABLE FROM "NO SAVE YET" - the failure is
    // SILENT and reads as a fresh run. That is exactly the bug that shipped for weeks in July.
    // **Any new phase that can exist without an encounter belongs in this list.**
    // 🐛 'setout' WAS MISSING AND A RUN SAVED ON IT COULD NEVER BE RELOADED - since the phase
    // shipped on 2026-08-05. It has no encounter yet (the map opens after you choose), so it fell
    // through the "no encounter and not stable" guard and `loadGame` returned false - which is
    // **indistinguishable from "no save yet"**, so it presented as a run that quietly vanished.
    // 🔑 IT SURFACED THE HOUR THE BOT WAS TAUGHT TO WALK THE ENTRY PATH, because safety-audit
    // can only round-trip a situation the bot can reach. **An audit's coverage is bounded by the
    // instrument's reach, and that boundary is invisible from inside the audit.**
    const stable = ['summary', 'defeat', 'victory', 'event', 'wheel', 'fork', 'map', 'hearth', 'hearthpick', 'mendpick', 'eliteboon', 'setout'];
    // ⚠️ A SAVE WRITTEN BEFORE THE MAP WAS SERIALIZED CANNOT BE RESUMED. Builds 287-308 stored a
    // map phase with no map; loading one produces a run standing on nothing. Refuse it here so the
    // menu reports a broken save instead of resuming into a dead screen.
    if (!d.map && MAP_PHASES_NEEDING_MAP.includes(d.phase) && !d.finalMode) return false;
    if (!encounter && !d.finalMode && !stable.includes(d.phase)) return false;
    uid = d.uid;
    S = {
      tutorial: !!d.tutorial, taught: d.taught || [], lessonsOff: !!d.lessonsOff,
      candle: d.candle !== false,
      // 🗡️ absent on any save written before the rogue existed, which is correct — those are
      // mage runs and never read it. feedArmed is per-turn, so it is never restored.
      momentum: d.momentum || 0, moTarget: null, drawExtra: d.drawExtra || 0,
      dragon: (d.tutorial ? TUTORIAL.dragon : DRAGONS.find(x => x.name === d.dragon)) || DRAGONS[0],
      region: d.region, turn: d.turn, regionTurn: d.regionTurn || 0, deck, hand, discard, trashed,
      encounterQueue: d.queue.map(n => region.encounters.find(e => e.name === n)).filter(Boolean),
      results: d.results, phase: d.phase, encounter,
      hardship: d.hardship, rangedDodge: d.rangedDodge, loseReserve: d.loseReserve,
      poison: d.poison, afterSoak: d.afterSoak || 'upgrade',
      assign: d.assign, divertsUsed: d.divertsUsed,
      diverting: false, boostTarget: d.boostTarget, coins: d.coins || 0, charms: d.charms || [], wheel: null,
      damage: d.damage, damageEl: d.damageEl,
      downgraded: new Set(d.downgraded), actionSetIds: d.actionSetIds, reserveId: d.reserveId,
      beats: null, beatIndex: -1, pendingR: null, beatTimer: null, selectedId: null,
      beatResult: null, stack: d.stack || null,
      finalMode: d.finalMode, finalPhase: d.finalPhase || null, dragonState: d.dragonState || null,
      lastMileOutcome: d.lastMileOutcome || null, lastMileApproach: d.lastMileApproach || null, duelBeat: d.duelBeat || 0, duelResult: null,
      defeatMsg: d.defeatMsg,
      // ⚠️ re-resolved from the region by NAME, never stored as objects - a serialized copy
      // would be a DIFFERENT object from the region's own def, and every identity check elsewhere
      // (the queue, beginEncounter, the tutorial's fixed list) compares references.
      fork: d.fork ? d.fork.map(n => region.encounters.find(e => e.name === n)).filter(Boolean) : null,
      boon: d.boon || null, boonOwed: d.boonOwed || false,
      map: reviveMap(d.map),
      pendingEvent: d.pendingEvent || false, eventAt: d.eventAt != null ? d.eventAt : 1,
      eventDone: d.eventDone || false, eventTurnPending: d.eventTurnPending || false, event: d.event || null,
      eventsSeen: d.eventsSeen || [], eventFlags: d.eventFlags || {},
      wake: d.wake || 0, wakeTarget: d.wakeTarget || null, wakePending: d.wakePending || 0,
      // 🛡️ filtered against the live table, so a piece removed in a later build cannot
      // resurrect as `undefined` and throw on armourBlock().
      loot: d.loot || {}, encountersDone: d.encountersDone || 0,
      runBanked: !!d.runBanked,
      armour: (d.armour || []).filter(a => a && armourDef(a.id)).map(a => ({ ...a, uses: a.uses || 0 })),
      armourStrike: d.armourStrike || 0, armourStrikePending: d.armourStrikePending || 0,
      splitPending: d.splitPending || 0, armourWinInit: !!d.armourWinInit,
      armourPace: d.armourPace || 0, armourPacePending: d.armourPacePending || 0,
      duelStamina0: d.duelStamina0 || 0, candleGrace: d.candleGrace || 0,
      // ⚠️ SETTING OUT'S OFFERS CHANGED SHAPE (2026-08-24): they used to be bare charm-id
      // STRINGS and are now objects. A save taken on that one screen would otherwise resolve to
      // three dead buttons. 🔑 Re-rolling is the right repair rather than a SAVE_VERSION bump,
      // because the screen has no state worth preserving — nothing has been chosen yet.
      setout: Array.isArray(d.setout) && d.setout.every(o => o && typeof o === 'object') ? d.setout : null,
      contract: d.contract || null,
      potions: d.potions || [], potionPick: null, potionFx: { init: 0, value: 0, soak: 0, boost: 0, pace: 0, swap: {} },
      upgradePick: null,
      // ⚠️ an older save carries the mage-named fields; map them rather than dropping a run's
      // score on the floor. A missing craft stat reads as 'no chances', which scores 0 — same as
      // before for the mage, and no longer a phantom zero for anyone else.
      delayed: d.delayed || 0,
      stats: migrateStats(d.stats),
      curseNextFight: d.curseNextFight || false, paceBless: d.paceBless || 0, emberShield: d.emberShield || false,
      logEntries: d.logEntries || [],
    };
    if (S.encounterQueue.length === 0) S.encounterQueue = S.tutorial ? region.encounters.slice() : shuffle(region.encounters);
    // the finale's encounter is synthetic (not in the region tables) — rebuild it for the saved beat
    // the finale's encounters are synthetic — not in the region tables, so rebuild them
    if (S.finalMode && S.finalPhase === 'duel') {
      S.encounter = { type: 'fight', name: S.dragon.name, dragon: true, hp: 9999,
        init: S.dragon.init, atk: Math.ceil(S.dragon.breath / 2), atkEl: S.dragon.element, xp: 0, finale: true };
    } else if (S.finalMode && S.finalPhase === 'lastmile') {
      S.encounter = { type: 'journey', name: 'The Last Mile', lastMile: true, finale: true,
        mp: LAST_MILE.mp, timePenalty: 0, nightfall: 0, xp: 0 };
    }
    render();
    return true;
  } catch (err) { return false; }
}

// ============================================================
// 🔧 THE DEV MENU (2026-08-05, Thomas: *"let me teleport to the dragon fight with some sort of
// mediocre deck, so i can test out the dragon. i should be able to do it for any stage, 1-4"*).
//
// 🔑 IT EXISTS BECAUSE THE BOSS IS 20 MINUTES INTO A RUN. Every feel-question about the lair -
// does the Last Mile read, is the duel tense, does a dragon's attack land as a problem or a tax -
// costs a full run to ask ONCE. That is why the finale has been measured far more than it has been
// PLAYED, and the solver cannot answer a feel question at all.
//
// ⚠️ IT BUILDS A REAL RUN AND THEN FAST-FORWARDS IT. Nothing here is a special case the engine
// has to learn: it deals the normal 16 cards, shapes them to a deck total, sets the candle, grants
// a charm, and then calls the SAME beginFinalBattle() a finished run calls. If a dev jump behaves
// differently from a real run, that is a bug in the jump, not a mode.
//
// 🃏 Deck quality is expressed against the dragon's own `par` - the measured deck total at
// which that dragon is a coin flip - so "mediocre" means the same thing at every stage.
// ============================================================
const DEV_DECKS = {
  weak:     { label: 'Weak',     cards: 13, offset: -10, hint: 'a run that went badly' },
  mediocre: { label: 'Mediocre', cards: 15, offset: -2,  hint: 'about par — a coin flip' },
  strong:   { label: 'Strong',   cards: 16, offset: +6,  hint: 'a run that went well' },
};
// 📦 THE STASH — what you own, and where every material comes from.
// 🔑 THE `from` AND THE RATE ARE THE POINT, not the counts. Monster Hunter publishes its drop
// tables, and that is the entire difference between a grind and a fruit machine: a printed rate
// turns *"keep playing and hope"* into *"about five more Evasion creatures"*. A material you own
// none of still has to say where it comes from, or you cannot plan a hunt.
function stashLine() {
  const st = loadStash();
  const kinds = Object.keys(st.mats).filter(k => st.mats[k] > 0).length;
  const shards = st.mats.shard || 0;
  return `🦴 ${shards} Bone Shard · ${kinds} kind${kinds === 1 ? '' : 's'} of material`;
}
function showStash() {
  S = S || {};
  S.phase = 'stash';
  S.encounter = null;
  render();
}
// 🕯️ the shape is what the CANDLE prints, so it is the tag that makes a trophy findable
function shapeTagOf(c) {
  const sh = shapesOf(c) || [];
  const ICON = { armour: '🛡️', evasion: '🌀', guard: '🧱' };
  return sh.length ? ' · ' + sh.map(x => ICON[x] || '').join('') : '';
}
function stashHTML() {
  const st = loadStash();
  // 🔑 TWO SECTIONS, NOT NINE (Thomas: *"the stash probably shouldn't be categorized that
  // specifically as well, its a bit too busy"*). Five material tiers and four road headings meant
  // nine headings over 74 cards, and every card already says where it comes from — the headings
  // were restating what was written six lines below them.
  const rate = m => m.tier === 'shape' ? `${Math.round(DROP_RATE.shape * 100)}% on a clean win · ${Math.round(DROP_RATE.narrowShape * 100)}% on a scrape`
    : m.tier === 'common' ? '2 on a clean win · 1 on a scrape'
    : m.tier === 'elite' ? 'always — if you survive one'
    : m.tier === 'rare' ? `${Math.round(DROP_RATE.heart * 100)}% when a dragon falls`
    : '2 when it falls';
  let body = '';
  {
    const list = MATERIALS;
    body += `<div class="stash-tier">Materials<span class="stash-tally">${list.filter(m => st.mats[m.id] > 0).length}/${list.length}</span></div><div class="stash-grid">` +
      list.map(m => {
        const n = st.mats[m.id] || 0;
        return `<div class="stash-mat${n ? '' : ' is-none'}">` +
          `<div class="stash-head"><span class="stash-icon">${m.icon}</span><span class="stash-n">×${n}</span></div>` +
          `<div class="stash-name">${m.name}</div>` +
          `<div class="stash-from">${m.from}</div>` +
          `<div class="stash-rate">${rate(m)}</div>` +
          // 💰 the release valve, on the object itself — never ask for a choice about a thing
          // without showing the thing.
          (n > 0 && breakValue(m.id) > 0 ? `<button class="stash-sell" onclick="breakMat('${m.id}')">🔨 break 1 → 🦴 ${breakValue(m.id)}</button>` : '') +
          `</div>`;
      }).join('') + `</div>`;
  }
  // 🏆 TROPHIES, GROUPED BY ROAD — and this is the bestiary in its first form. 🔑 Which road a
  // creature lives on is the ONE fact a hunt needs and the game never told you; the candle can
  // only say what is on the next node, which is no use for deciding where to GO.
  {
    const list = Object.values(CREATURE_INDEX).filter(c => c.quarry)
      .sort((a, b) => a.road - b.road);
    const owned = list.filter(c => st.mats[partIdOf(c.name)] > 0).length;
    body += `<div class="stash-tier">🏆 Trophies<span class="stash-tally">${owned}/${list.length}</span></div>` +
      `<div class="stash-grid">` +
      list.map(c => {
        const id = partIdOf(c.name), n = st.mats[id] || 0, d = matDef(id);
        return `<div class="stash-mat${n ? '' : ' is-none'}">` +
          `<div class="stash-head"><span class="stash-icon">🏆</span><span class="stash-n">×${n}</span></div>` +
          `<div class="stash-name">${d.name}</div>` +
          `<div class="stash-from">${c.name}${shapeTagOf(c)}</div>` +
          `<div class="stash-rate">${ROAD_NAME[c.road]} · ${c.region}</div>` +
          (n > 0 ? `<button class="stash-sell" onclick="breakMat('${id}')">🔨 break 1 → 🦴 ${breakValue(id)}</button>` : '') +
          `</div>`;
      }).join('') + `</div>`;
  }
  return `<div class="phase-label">📦 STASH</div>` +
    `<div class="stash"><div class="stash-gold">🦴 <b>${st.mats.shard || 0}</b> Bone Shard` +
    `<span class="dim"> · every recipe wants them, and even a lost encounter carves one</span></div>` +
    body +
    `<p class="dev-note">⚒️ Spend these in <b>The Workshop</b>. A named part GATES a piece; 🦴 Bone Shards pay for it. ` +
    `🔨 Break down anything no recipe wants.</p>` +
    `<button onclick="showMenu()">← Menu</button></div>`;
}

// ⚒️ THE WORKSHOP — where parts become armour, and where you choose what to walk in wearing.
// ⚠️ NOT "the Forge": that name is taken by the sharpening step, which merged into the Wheel in
// August. The Workshop also fits [[Theme_And_Naming]]'s Witch Hat register, where craft is the
// whole world.
// 🔑 A RECIPE YOU CANNOT AFFORD STILL SHOWS ITS SHORTFALL BY NAME. "You need 2 more Windquill"
// is the difference between a disabled button and a disabled button that teaches you where to go
// — and where to go is the only thing this whole layer is for.
function showWorkshop() { S = S || {}; S.phase = 'workshop'; S.encounter = null; render(); }
function workshopLine() {
  const st = loadStash();
  return `🦴 ${st.mats.shard || 0} Bone Shard · ${st.owned.length}/${ARMOUR.length} pieces forged`;
}
function pieceCardHTML(d, st, equipped) {
  const owned = st.owned.includes(d.id);
  const rar = RARITY[d.rarity || 'common'];
  // 🎭 another class's gear is SHOWN, never hidden — you should be able to see what the rogue gets
  // before you unlock her, the same way the Collection states what is not built rather than
  // pretending it does not exist.
  const wrongClass = d.cls && d.cls !== CLASS.id;
  const r = RECIPE[d.id];
  const kind = d.brk === 'worn' ? '🩹 worn — it stays' : '💥 shatters after one block';
  let foot;
  if (wrongClass) {
    foot = `<span class="wk-none">${(CLASSES[d.cls] && CLASSES[d.cls].name) || d.cls} only</span>`;
  } else if (owned) {
    foot = equipped
      ? `<button class="wk-btn on" onclick="unequipPiece('${d.id}')">✓ Worn — remove</button>`
      : `<button class="wk-btn" onclick="equipPiece('${d.id}')">Wear it</button>`;
  } else if (!r) {
    foot = `<span class="wk-none">${d.starter ? 'yours from the start' : 'no recipe yet'}</span>`;
  } else {
    const chk = craftCheck(d.id);
    const cost = Object.keys(r.mats).map(m =>
      `${matDef(m).icon} ${r.mats[m]} ${matDef(m).name}`).join(' · ');
    // 🏹 WHERE THE QUARRY WALKS — measured 2026-08-27 ([[Drop_Economy]]).
    // 🔴 THE SHARD COST BINDS ALMOST NOTHING: shards come in at 8.7 a run, so nine of twelve
    // recipes are gated purely on **whether one named creature turned up**. Runs-to-forge measured
    // 17 / 30 / 60 / 120 for the tail, and one piece went unseen across 120 runs.
    // 🔑 AND `rollDrops` ALREADY CARRIES A COMMENT PROMISING THIS IS A "COUNTABLE PLAN" — the part
    // is certain on a clean kill, but the ENCOUNTER was still a lottery, so nothing was countable.
    // **Removing one of two stacked lotteries leaves a lottery.** This is the other half.
    // ✅ It converts *"keep playing"* into *"three runs down the Fellgrind"* WITHOUT TOUCHING A
    // SINGLE RATE — which is why it is the first lever rather than cheaper recipes.
    // ⚠️ This is DIRECTION, not tactical data. It does not conflict with the map's *"printing every
    // demand is complete optimizable data"* rule, which is about the roads you are choosing between
    // right now; this is which land to set out on, decided before a card is dealt.
    const hunts = Object.keys(r.mats).filter(m => m.startsWith('p:') && !(st.mats[m] > 0))
      .map(m => {
        const c = creatureByName(m.slice(2));
        return c ? `<div class="wk-hunt">🏹 <b>${c.name}</b> — ${ROAD_NAME[c.road]} · ${c.region}</div>` : '';
      }).join('');
    foot = `<div class="wk-cost">${cost}</div>` + hunts + (chk.ok
      ? `<button class="wk-btn craft" onclick="craftPiece('${d.id}')">⚒️ Forge it</button>`
      : `<button class="wk-btn" disabled>Need ${chk.missing.join(', ')}</button>`);
  }
  return `<div class="wk-piece rar-${d.rarity || 'common'}${owned ? ' is-owned' : ''}` +
    `${equipped ? ' is-worn' : ''}${wrongClass ? ' is-locked' : ''}">` +
    `<div class="wk-top"><span class="wk-icon">${ARMOUR_SLOTS[d.slot].icon}</span>` +
    `<span class="wk-name">${d.name}</span>` +
    `<span class="wk-block">${d.block > 0 ? 'blocks ' + d.block : 'no block'}</span></div>` +
    `<div class="wk-kind"><span class="wk-rar">${rar.icon} ${rar.label}</span> · ${kind}</div>` +
    (d.text ? `<div class="wk-text">${d.text}</div>` : `<div class="wk-text dim">no ability</div>`) +
    `<div class="wk-foot">${foot}</div></div>`;
}
// 🛡️ ⚠️ NOTHING EARNS SLOTS ANY MORE, so nothing may claim they can be earned. The old string said
// *"two more to earn"* whenever the count was under 4 and there was no way to earn them — that is
// the promise this file keeps warning about, and the honest version of it is silence.
function nextSlotNote() { return ''; }
function workshopHTML() {
  const st = loadStash(), worn = loadoutIds();
  const slots = Array.from({ length: armourSlotsOpen() }, (_, i) => worn[i] || null);
  let body = `<div class="wk-loadout"><div class="wk-lab">🛡️ YOUR EQUIPMENT` +
    `<span class="dim"> · ${armourSlotsOpen()} slots</span></div>` +
    `<div class="wk-slots">` + slots.map(id => {
      if (!id) return `<div class="wk-slot is-empty">empty</div>`;
      const d = armourDef(id);
      return `<div class="wk-slot">${ARMOUR_SLOTS[d.slot].icon} <b>${d.name}</b>` +
        `<span class="dim">blocks ${d.block}</span></div>`;
    }).join('') + `</div></div>`;
  for (const slot of Object.keys(ARMOUR_SLOTS)) {
    // ⚠️ sorted by rarity so a zone reads as a ladder rather than as the order I typed them in
    const list = ARMOUR.filter(a => a.slot === slot)
      .slice().sort((x, y) => RARITY_ORDER.indexOf(x.rarity || 'common') - RARITY_ORDER.indexOf(y.rarity || 'common'));
    if (!list.length) continue;
    body += `<div class="stash-tier">${ARMOUR_SLOTS[slot].icon} ${ARMOUR_SLOTS[slot].label}` +
      // ⚠️ WAS THE SLOT'S THEME (*"what you can see"*); that was a design heuristic and is not
      // shown any more - see ARMOUR_SLOTS. 🔑 Replaced with a COUNT rather than deleted, because
      // this chip is the only per-zone progress the screen shows and an empty span is a hole where
      // a fact should be: **a heading that stops making a promise should start stating a number.**
      `<span class="stash-tally">${list.filter(d => st.owned.includes(d.id)).length}/${list.length}</span></div>` +
      `<div class="wk-grid">` + list.map(d => pieceCardHTML(d, st, worn.includes(d.id))).join('') + `</div>`;
  }
  return `<div class="phase-label">⚒️ THE WORKSHOP</div>` +
    `<div class="stash"><div class="stash-gold">🦴 <b>${st.mats.shard || 0}</b> Bone Shard` +
    `<span class="dim"> · ${st.owned.length} of ${ARMOUR.length} pieces forged</span></div>` +
    body +
    `<p class="dev-note">🏆 A worn piece needs a part from ONE great beast — that is the reason to ` +
    `go to its region. 🔨 Break down what no recipe wants in the Stash.</p>` +
    `<button onclick="showMenu()">← Menu</button></div>`;
}

function showDev() {
  if (!DEV_ENABLED) return;   // 🔧 not in the playtest build
  S = S || {};
  S.dev = S.dev || { stage: 1, deck: 'mediocre', candle: true, charm: '', arm0: '', arm1: '' };
  S.phase = 'dev';
  S.encounter = null;
  render();
}
// ⭐ SET THE ACCOUNT LEVEL FOR REAL, not via XP_LEVEL_FORCE. A dev tool should produce a state
// the game could actually be in — a forced level is the INSTRUMENT's pin and behaves differently
// (it neither reads nor writes the bar), which is exactly the "a jump behaving differently from a
// real run is a bug in the jump" rule. This writes the same key a run would.
function devLevel(n) {
  ACCOUNT_XP = Math.max(0, (n - 1)) * XP_PER_LEVEL;
  saveXP(ACCOUNT_XP);
  render();
}
// 🎭 and the class bar, separately — the whole point of the hybrid is that they move apart, so a
// dev tool that only moved them together could not reproduce the state it exists to test.
function devClassLevel(n) {
  saveClassXP(CLASS.id, Math.max(0, (n - 1)) * CLASS_XP_PER_LEVEL);
  render();
}
function devSet(k, v) {
  if (!S.dev) return;
  S.dev[k] = (k === 'stage') ? +v : (k === 'candle') ? (v === 'true' || v === true) : v;
  render();
}
// shape the fresh 16 into a deck of `cards` cards totalling `target` levels.
// ⚠️ freshGame() leaves FOUR CARDS ALREADY IN HAND (deck 12, hand 4) - shaping only S.deck
// silently left those four untouched, so every quality came out 16 cards and +8 levels.
function devShapeDeck(cards, target) {
  const all = [...S.hand, ...S.deck];
  while (all.length > cards) S.trashed.push(all.pop());
  all.forEach(c => { c.level = 1; });
  let total = all.length, i = 0, guard = 0;
  while (total < target && guard++ < 800) {
    const c = all[i % all.length];
    if (c.level < MAX_LEVEL) { c.level++; total++; }
    i++;
    if (all.every(x => x.level >= MAX_LEVEL)) break;
  }
  S.hand = []; S.deck = all;   // beginFinalBattle() gathers them anyway
}
// ============================================================
// 💾 DEV SAVE SLOTS (2026-08-22) — Thomas: *"just save, and load, for me, for my own testing
// purposes, so i don't have to replay runs from the beginning."*
//
// 🔑 A TESTING TOOL, NOT A FEATURE. It is gated on DEV_ENABLED like the rest of the dev menu,
// so it exists only at `?dev` and is invisible in the playtest drop. ⚠️ Player-facing save/load
// would delete the genre — deck-as-health, a spent Spell and a blunted card are all permanent by
// design, and a load button makes every one of them optional.
//
// ⚠️ IT REUSES saveGame()/loadGame() BY PASSING A KEY. There is no second serializer, because a
// slot that wrote a slightly different shape would load into a subtly wrong run — and in a tool
// whose whole job is reproducing a situation, that would send you hunting bugs that are not there.
// ⚠️ The slot keys take KEY_NS like every other persistent key, or the live build and the frozen
// playtest build would fight over the same storage.
const DEV_SLOTS = 6;
const devSlotKey = i => `emberwick-devslot-${i}` + KEY_NS;

function devSlotInfo(i) {
  try {
    const d = JSON.parse(localStorage.getItem(devSlotKey(i)) || 'null');
    if (!d) return null;
    const stale = d.v !== SAVE_VERSION;
    const where = d.finalMode ? (d.finalPhase === 'duel' ? `duel beat ${d.duelBeat}` : 'the lair')
                : d.map && d.map.pos ? `floor ${d.map.pos.f + 1}`
                : `region ${d.region}`;
    return { stale, cls: d.cls || 'mage', dragon: d.dragon || '?', where,
             phase: d.phase, turn: d.turn, cards: (d.deck || []).length + (d.hand || []).length };
  } catch (e) { return null; }
}
function devSlotSave(i) {
  if (!DEV_ENABLED) return;
  if (!S || !S.deck) { alert('No run to save — start or continue one first.'); return; }
  // ⚠️ the reveal guard lives inside saveGame(); a mid-reveal slot save would silently write nothing
  if (S.phase === 'reveal') { alert('Finish the reveal first — a mid-reveal state cannot be saved.'); return; }
  saveGame(devSlotKey(i));
  render();
}
function devSlotLoad(i) {
  if (!DEV_ENABLED) return;
  const info = devSlotInfo(i);
  if (!info) return;
  if (info.stale) { alert('That slot was saved by an older build and cannot be loaded.'); return; }
  if (!loadGame(devSlotKey(i))) { alert('That slot would not load — it may predate a save change.'); return; }
  // 🔑 write it straight back to the REAL save too, so a reload after loading a slot resumes
  // the slot rather than whatever run was there before. Without this, testing a slot then reloading
  // silently drops you back into the previous run — exactly the confusion this tool exists to avoid.
  saveGame();
  render();
}
function devSlotClear(i) {
  if (!DEV_ENABLED) return;
  try { localStorage.removeItem(devSlotKey(i)); } catch (e) {}
  render();
}
function devSlotsHTML() {
  if (!DEV_ENABLED) return '';
  const rows = [];
  for (let i = 0; i < DEV_SLOTS; i++) {
    const it = devSlotInfo(i);
    const label = it
      ? (it.stale ? `<span class="dim">slot ${i + 1} — stale build</span>`
        : `<b>${it.cls}</b> · ${it.dragon} · ${it.where} · turn ${it.turn} · ${it.cards} cards <span class="dim">(${it.phase})</span>`)
      : `<span class="dim">slot ${i + 1} — empty</span>`;
    rows.push(`<div class="dev-slot"><span class="dev-slot-lab">${label}</span>` +
      `<button onclick="devSlotSave(${i})">${it ? 'overwrite' : 'save here'}</button>` +
      (it && !it.stale ? `<button class="primary" onclick="devSlotLoad(${i})">load</button>` : '') +
      (it ? `<button onclick="devSlotClear(${i})">✕</button>` : '') + `</div>`);
  }
  return `<div class="dev-slots"><div class="kit-lab">💾 Save slots <span class="dim">— dev only; ` +
    `saving writes the CURRENT run, loading replaces it and becomes your live save.</span></div>` +
    rows.join('') + `</div>`;
}

function devJump() {
  // 🔧 no guard here on purpose — the dev menu exists to jump, and nagging it would be noise.
  const d = S.dev, cfg = DEV_DECKS[d.deck] || DEV_DECKS.mediocre;
  const stage = Math.max(1, Math.min(DRAGONS.length, d.stage));
  freshGame(stage);
  S.dev = d;
  // 🛡️ an explicit dev loadout REPLACES the granted one; leaving every slot 'empty' is how you
  // measure the bare game, which is the state the ladder is tuned at.
  if (Array.from({ length: armourSlotsOpen() }, (_, i) => d['arm' + i]).some(Boolean)) {
    S.armour = Array.from({ length: armourSlotsOpen() }, (_, i) => d['arm' + i])
      .filter(id => id && armourDef(id)).map(id => newArmour(id));
  }
  devShapeDeck(cfg.cards, Math.max(cfg.cards, (S.dragon.par || 44) + cfg.offset));
  S.candle = !!d.candle;
  if (d.charm && charmById(d.charm)) S.charms.push(d.charm);
  S.region = RUN().length;
  S.turn = 20;                    // so the log and the grade read like a real arrival
  S.encounterQueue = [];
  S.coins = 0;
  log(`🔧 DEV — jumped to stage ${stage} (${cfg.label} deck: ${S.deck.length} cards, ${deckLevels()} levels vs par ${S.dragon.par}) · candle ${S.candle ? 'lit' : 'out'}${d.charm ? ' · ' + charmById(d.charm).name : ''}`, 'good');
  beginFinalBattle();
}

// 📖 what the tutorial hands you on to — stage 1, named, with its one demand
function tutorialHandoffHTML() {
  const d = dragonForStage(1);
  if (!d) return `<button class="primary" onclick="showStages()">🗺️ Choose your next stage</button>`;
  return `<div class="handoff">` +
    `<p>That was the shallow end. Everything past here is the same four slots and the same sixteen ` +
    `cards — what changes is <b>what stands in front of you</b>.</p>` +
    // ❌ and no shape here either — the briefing on turn 1 is moments away and it is the
    // designed place to learn what you are walking into.
    `<p><b>${d.name}</b> ${elIcon(d.element)} waits at the end of the first road. ` +
    `You will be told what it is the moment you set out.</p>` +
    `</div>` +
    `<button class="primary" onclick="startStage(1)">⚔️ Set out for the ${d.name} — Stage 1</button>` +
    `<button onclick="showStages()">🗺️ Stages</button>`;
}

// 🏆 the badge on a stage button — your best, and what is still above it
function gradeBadge(stage, clsId) {
  const g = gradeFor(stage, clsId);
  // ⚠️ NOTHING, not a placeholder (2026-08-12). An ungraded stage used to draw a dashed pill with
  // an em-dash in it — and because `.grade-badge.none` inherited the FILLED dark background from
  // the base class, it read as a small black BUTTON rather than an empty slot. Thomas, in play:
  // *"why does the stages and tutorial button have a black button with a dash in it?"*
  // 🔑 A PLACEHOLDER THAT HAS TO BE EXPLAINED IS WORSE THAN AN ABSENCE. Its only explanation was a
  // `title` tooltip, which does not exist on the phone this is played on. The grade now simply
  // appears when it is earned, which nobody has to be taught.
  if (!g) return '';
  return `<span class="grade-badge g-${g.letter}" title="best: ${g.total}/100${g.won ? '' : ' (on a loss)'}">` +
    `${g.letter}<span class="gb-score">${g.total}</span></span>`;
}

// 🏆 one badge per unlocked class, so the WALL shows the difference instead of averaging it away.
// 🔑 Two classes with the same grade on the same stage is the boring case; the interesting one is
// an S as the rogue and a C as the mage on the very same dragon. That is the content, on screen.
// While only the mage is unlocked this is byte-identical to the old single badge.
function stageBadges(stage) {
  const ids = Object.keys(CLASSES).filter(classUnlocked);
  if (ids.length < 2) return gradeBadge(stage, ids[0]);
  return ids.map(id => {
    const g = gradeFor(stage, id);
    if (!g) return '';
    return `<span class="grade-badge g-${g.letter}" title="${id}: ${g.total}/100${g.won ? '' : ' (on a loss)'}">` +
      `${CLASSES[id].mark}${g.letter}</span>`;
  }).join('');
}

// ============================================================
// 🏠 THE MAIN MENU (2026-08-05, Thomas: *"wonder if we should make an actual main menu?
// feels like we will need some sort of placeholder one with all these features coming in,
// especially the charm and banning stuff"*).
//
// 🔑 IT IS A SHELF, NOT A FEATURE. The meta layer has been accumulating with nowhere to live —
// the wall, the charm pool, the dev jump — and all of it was being bolted onto the stages screen,
// which was turning the first thing you see into a junk drawer. A menu is where run-layer things
// (stages) and META-layer things (what you have unlocked) stop competing for the same screen.
//
// ⚠️ CONTINUE COMES FIRST AND IT IS THE DEFAULT. Emberwick is played daily as an installed PWA;
// booting into a menu instead of a run would put a tap between Thomas and the game he opened it
// to play. One tap, top of the list, only shown when a save exists.
// ⚠️ PLACEHOLDERS MUST SAY THEY ARE PLACEHOLDERS. The 🚫 ban list needs the real unlock system
// first ([[Charm_Pools]]); the Collection screen states that outright rather than showing a
// button that lies.
// ⚠️ A SAVE THAT CANNOT LOAD MUST NOT OFFER TO CONTINUE. `hasSave()` used to answer "is there
// a blob?", so a save from an older build (or a corrupt one) put a Continue button on the menu
// that silently dumped you on the stages screen with your run gone and no explanation. That is
// the same silent-failure class as the v:4-vs-v:3 bug of 2026-07-29 — and it will happen to every
// playtester the next time card or dragon data changes. Say it out loud instead.
function saveState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return 'none';
    const d = JSON.parse(raw);
    return (d && d.v === SAVE_VERSION) ? 'ok' : 'stale';
  } catch (e) { return 'stale'; }
}
function hasSave() { return saveState() === 'ok'; }

// 🔧 THE PLAYTEST BUILD IS A URL FLAG, NOT A SECOND PAGE (2026-08-05).
//
// Thomas: *"maybe we need to make a separate build/page for the playtesting build?"* — the need is
// real (a tester who clicks 🔧 Dev jumps straight to a dragon and never sees the run, which wastes
// the whole session), but a second HTML file would mean two cache-busters and two script lists to
// keep in step, and stale HTML has already cost us a debugging session once.
//
// So: `?dev` shows the dev tools, and the bare URL does not.
//   • friends get   https://iimthomas.github.io/emberwick/
//   • Thomas gets   https://iimthomas.github.io/emberwick/?dev
// 🔑 And because it is the START URL that matters for a PWA, installing from the ?dev link keeps
// the tools on his home screen while everyone else's install has none. One build, no drift.
// ⚠️ It is a courtesy, not a lock — anyone can type ?dev. That is fine; the point is that nobody
// stumbles into it.
const DEV_ENABLED = (() => {
  try { return /(^|[?&])dev\b/.test(location.search); } catch (e) { return false; }
})();
function showMenu() {
  S = S || {};
  S.phase = 'menu';
  S.encounter = null;
  render();
}
function resumeRun() { if (loadGame()) render(); else showStages(); }
// 🎁 no argument = the account page; a class id = that character's page.
// ⚠️ `collClass` must be CLEARED on the way in, or arriving from the menu would drop you back on
// whichever character you were last looking at — a screen that remembers a sub-state you did not
// choose is the same class of bug as a stale filter.
function showCollection(cls) {
  S = S || {};
  S.phase = 'collection';
  S.collClass = (cls && CLASSES[cls]) ? cls : null;
  S.encounter = null;
  render();
}

// 🗺️ THE STAGES SCREEN. Not a difficulty menu bolted on the side — the stage IS the difficulty,
// so picking one is the same act as choosing which problem you want to solve tonight.
function showStages() {
  S = S || {};
  S.phase = 'ladder';
  S.encounter = null;
  render();
}
// 🛡️ IS THERE A RUN ON DISK THAT IS STILL BEING PLAYED? (2026-08-22)
// Used to guard everything that calls freshGame(), which DELETES THE SAVE on its first line.
function liveRunSaved() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    return !!(d && d.v === SAVE_VERSION && !['victory', 'defeat'].includes(d.phase));
  } catch (e) { return false; }
}

// 🐛 STARTING A STAGE SILENTLY DESTROYED AN IN-PROGRESS RUN (found in play 2026-08-22).
// Thomas: *"don't know if the continue run is working, my run wasn't saved."*
// It was saving fine — `freshGame()` deletes the save on its FIRST LINE, and the 🗺️ Stages screen
// called `startStage(n)` with no confirmation at all. One tap and the run was gone before anything
// rendered. ⚠️ The Stages button sits directly under ▶ Continue on the menu.
//
// 🔑 THE TELL WAS AN ASYMMETRY: `newGame()` — the ⟳ New Run button — already asked *"This run will
// be lost."* **The same destructive act was guarded in one place and unguarded in the other**, which
// is how a hazard hides: the guarded path teaches you the game asks, so you trust the other one.
// ⚠️ THE GUARD BELONGS IN startStage, NOT AT THE CALL SITES — every future caller inherits it,
// which is the whole reason the Stages screen was missing one.
function startStage(n, confirmed) {
  if (!confirmed && liveRunSaved() && !confirm(
      'You have a run in progress. Starting a stage will END it — your saved run is lost. Start anyway?')) return;

  // ⚠️ THE CLASS MUST BE SET BEFORE freshGame — it is freshGame that deals the deck, and the deck
  // is the class's (16 unique for the mage, 8 x 2 for the rogue).
  // 🎓 Stage 0 is MAGE by construction: its authored deck order names mage cards, and the tutorial
  // teaches the engine through the class you start with.
  setClass(n === 0 ? MAGE : (CLASSES[pickedClassId()] || MAGE));
  freshGame(n);
  // 📖 Stage 0 opens on the brief. You read it before a card is dealt — it is the only place that
  // can explain what an ENCOUNTER is, because every in-play lesson arrives once you are in one.
  if (n === 0) { S.introPage = 0; S.phase = 'intro'; }
  else { S.setout = rollSetout(); if (S.setout.length) S.phase = 'setout'; }
  render();
  // ⚠️ ON A PHONE THE CONTROLS PANEL SITS BELOW THE HAND, so the only thing you can do on this
  // screen starts ~1000px down a stacked layout. Every other phase has cards to read on the way
  // past; this one does not, so scroll to the question.
  if (S.phase === 'setout') { const el = $('controls-panel'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' }); }
}
// 🔴 THE BRIEF USED TO END ON `S.phase = 'assign'` (fixed 2026-08-23, Thomas: *"tutorial still
// broken i think, i think the map isn't showing up or something"* — with a screenshot reading
// **NO ENCOUNTER · This turn has no encounter, which should not happen**).
// That line was correct while the tutorial was a linear queue: `freshGame()` had already dealt an
// encounter, so jumping straight to `assign` landed on it. **The tutorial has a map now**, and a
// map hands out encounters only when you take a node — so the brief dropped the player into a turn
// with nothing in front of them.
//
// 🔑 THIRD TIME TODAY FOR ONE LESSON: **when you replace the thing that generated content, find
// every reader that still trusts the old shape.** The solver's `REGIONS.length`, the map render's
// `MAP_FLOORS`, and now the brief's exit — all three assumed a world that had moved.
//
// 🔴 AND THE AUDIT COULD NOT HAVE CAUGHT IT, WHICH IS THE MORE IMPORTANT HALF: `RUNSIM.autoRun()`
// calls `freshGame(0)` and goes straight to `backToMap()`. **The bot never reads the brief.** So the
// instrument entered the run through a different door than the player, tested that door, and
// reported the tutorial healthy while the player's door opened onto a broken screen.
// ⚠️ **An audit that does not walk the player's entry path has not audited the entry path.**
// `dev/tutorial-audit.js` now steps through the brief first.
function introNext(d) {
  S.introPage = Math.max(0, (S.introPage || 0) + d);
  if (S.introPage < TUTORIAL.intro.length) { render(); return; }
  S.introPage = 0;
  // ✅ hand off to the same function every node return uses, so there is ONE place that decides
  // where a run resumes — map if there is a map, the old linear path if there is not.
  backToMap();
  render();
}

// ============================================================
// 🏕️ SETTING OUT (2026-08-05, Thomas: *"at the beginning of a run, lets also add a thing
// where you pick 1 out of 3 class charm. alot of roguelike games do this, helps make feel every run
// fresh right from the start"*).
//
// 🔑 IT IS THE BUILD-DISCOVERY FIX ARRIVING AT TURN ZERO. The 16 cards are identical every run
// by design, so without this a run's first hour is indistinguishable from its last. One rule-charm,
// chosen before a card is dealt, means you leave the workshop already playing a *different game* -
// and because it is CHOSEN rather than drawn, the run has a direction you picked instead of one
// the shuffle picked for you. That is *soft-directional runs* stated as an opening move.
//
// ⚠️ CLASS charms only. The generic pool is what the Wheel sells; the opening pick is where the
// class shows you what IT can do, so a rogue's three will look nothing like these.
// ⚠️ Not in the tutorial — stage 0 is deterministic and teaches the turn, not the meta.
// 🎭 IS THIS FOR THE CLASS I AM PLAYING? (2026-08-12 — found in play by Thomas: *"with the rogue,
// im starting out, but its giving me mage charms at the start"*.) `rollSetout` asked for MAGE
// charms unconditionally, so the rogue's opening pick was three rules it does not have.
//
// ⚠️ AND THE SECOND HALF IS WORSE, BECAUSE IT IS SILENT: four generic charms are ELEMENT-gated
// (`mods.el`). A rogue buying "⚡ Lightning cards strike +1" gets literally nothing and is never
// told. That is exactly the archetype-gated bug that shipped for months doing invisible arithmetic,
// and the rule it earned holds here: 🔑 A CHARM MAY ONLY NAME SOMETHING PRINTED ON THE CARD.
// An element is printed nowhere on a rogue card, so `CLASS.pairs` gates them out entirely.
function charmForClass(c) {
  if (c.cls && c.cls !== CLASS.id) return false;
  if (c.mods && c.mods.el && !CLASS.pairs) return false;   // an element the class cannot read
  return true;
}
function classCharmPool() { return CHARMS.filter(c => c.cls === CLASS.id && !c.curse && charmUnlocked(c)); }
function rollSetout() {
  const offers = [];
  for (const b of SETOUT_BUCKETS) {
    // ⚠️ A BUCKET THAT CAN PRODUCE NOTHING MUST BE ALLOWED TO PRODUCE NOTHING, not crash and
    // not silently skip the screen. 🔑 The first charm-tiering left stage 1 with ZERO mage charms
    // and SILENTLY SKIPPED this entire phase, because the phase only starts if the list is
    // non-empty - a pool filter deleted a whole screen. Every `pick` may return null; the shuffle
    // walks the bucket until one yields.
    const cands = SETOUT.filter(o => o.bucket === b);
    for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cands[i], cands[j]] = [cands[j], cands[i]]; }
    for (const c of cands) { const o = c.pick(); if (o) { offers.push({ k: c.id, ...o }); break; } }
  }
  return offers;
}
// 💀 THE ELITE BOON — beat a dangerous thing, take one of three charms.
// 🔑 THIS IS WHAT MAKES AN ELITE A DECISION RATHER THAN A TAX. Coins are the reward every node
// pays; a charm is a RULE, and [[Market_And_Retention]] says rule-changers are the game's build
// discovery. Routing toward danger for a rule you choose is the strongest reason the map has to
// exist at all.
// ⚠️ Drawn from the FULL pool (class charms and generic both, tier-gated as ever), so the elite
// is the best charm source in the run and the risk is priced.
// ⚠️ THE KILL IS THE BAR (2026-08-24) — the gate lives in finishResolve(), and so does the
// reasoning. Walking away pays the coins and the materials; only a Complete pays a charm.
// 🔑 This comment stated the OPPOSITE of the code for weeks. A NOTE THAT CONTRADICTS THE RULE IT
// SITS ON IS WORSE THAN NO NOTE: it is the version that gets quoted.
function boonPool() {
  return CHARMS.filter(c => !c.curse && charmUnlocked(c) &&
    (!c.cls || c.cls === CLASS.id) && !S.charms.includes(c.id) && charmFitsClass(c));
}
function rollBoon() {
  const pool = boonPool().slice();
  const offers = [];
  while (offers.length < 3 && pool.length) offers.push(...pool.splice(Math.floor(rnd() * pool.length), 1));
  return offers.map(c => c.id);
}
function pickBoon(id) {
  if (S.phase !== 'eliteboon' || !S.boon || !S.boon.includes(id)) return;
  const c = charmById(id); if (!c) return;
  S.charms.push(id);
  S.boon = null;
  log(`💀 You take <b>${c.name}</b> off the thing you killed — ${c.text}`, 'good');
  backToMap();
}

// 🏕️ SETTING OUT - three offers, ONE FROM EACH BUCKET (2026-08-24).
// Thomas: *"in slay the spire, the starting item, its a selection from starting with extra gold,
// potion, or quest or charm... i don't want players to always pick the same thing every new run,
// or maybe they cancel out and re do a run just to potentially get something they want."*
//
// 🔑 THOSE TWO WORRIES ARE OPPOSITE FAILURE MODES OF ONE DIAL, AND THE FIX SOLVES BOTH AT ONCE:
//   • *always picks the same* happens when the offers are too ALIKE - it used to draw three
//     CLASS CHARMS, three of one kind, so one was simply better and the screen read itself.
//   • *rerolls for a good one* happens when the offers differ too much in VALUE - a jackpot is
//     a thing worth farming for.
// ✅ **VARY THE KIND, NOT THE SIZE.** Different kinds are incomparable, so you choose by what
// THIS run wants; similar weight means there is nothing to reroll toward. That is also the same
// bar the Wheel's shelf and the 💀 elite boon are held to: *if one offer is strictly better than
// another, the player did not choose, they read.*
//
// ⚠️ DECLARATIVE ON PURPOSE - `pick`/`name`/`text`/`apply`, the same shape as EVENTS and POTIONS,
// so the port rewrites a lookup table rather than prose.
// ⚠️ AND THE ROLL IS PER BUCKET, NEVER GLOBAL: a global draw of 3 from 8 would hand you two
// charms and no fuel about a third of the time, which is the old screen again by accident.
const SETOUT = [
  // 🎁 A RULE - the run's direction, and the only bucket that is pure power
  { id: 'classcharm', bucket: 'rule',
    pick: () => { const p = classCharmPool().filter(c => !S.charms.includes(c.id));
                  return p.length ? { c: rand(p).id } : null; },
    name: o => charmById(o.c).name, text: o => charmById(o.c).text,
    why: () => 'your class rule, chosen at the door',
    apply(o) { S.charms.push(o.c); return `🎁 <b>${charmById(o.c).name}</b> — ${charmById(o.c).text}`; } },
  { id: 'genericcharm', bucket: 'rule',
    pick: () => { const p = CHARMS.filter(c => !c.curse && !c.cls && charmUnlocked(c) &&
                    charmFitsClass(c) && !S.charms.includes(c.id));
                  return p.length ? { c: rand(p).id } : null; },
    name: o => charmById(o.c).name, text: o => charmById(o.c).text,
    why: () => 'a rule of the road, not of your craft',
    apply(o) { S.charms.push(o.c); return `🎁 <b>${charmById(o.c).name}</b> — ${charmById(o.c).text}`; } },
  // 🪙 FUEL - spendable, and the bucket that decides how the first shop goes
  { id: 'purse', bucket: 'fuel', pick: () => ({}),
    name: () => 'A Full Purse', text: () => 'Start with <b>12 coins</b>',
    why: () => 'the first Wheel is the one you can never afford',
    apply() { S.coins += 12; return `🪙 Twelve coins, and the first Wheel is suddenly a shop.`; } },
  { id: 'kit', bucket: 'fuel', pick: () => ({}),
    name: () => 'A Packed Kit', text: () => 'Start with <b>two potions</b>',
    why: () => 'two turns, somewhere, go the way you wanted',
    apply() { const a = evRandomPotion(false), b = evRandomPotion(false); return `🧪 ${a} · ${b}`; } },
  { id: 'wellkept', bucket: 'fuel', pick: () => ({}),
    name: () => 'Well-Kept', text: () => '<b>Two cards</b> begin at <b>Lv3</b>',
    why: () => 'three levels you did not have to buy',
    apply() {
      // ⚠️ THE THREE BIGGEST, NOT A PICKER. A card-picker here would be a phase, and a phase
      // before the first card is dealt is a screen between the player and the game. 🔑 It is also
      // the LEVELLING = SHARPENING rule applied honestly: a level makes a card more itself, so
      // sharpening what is already biggest is what a player would have done anyway.
      const all = [...S.hand, ...S.deck, ...S.discard].sort((a, b) => eff(b).value - eff(a).value);
      // ⚠️ TWO, NOT THREE. At three it measured **+7.1 road Complete** against a field running
      // -1.8 to +3.4 - the jackpot this whole screen was rebuilt to avoid. 🔑 No surprise in
      // hindsight: the economy is on record as *very sensitive to upgrade cost*, so free levels
      // are the most concentrated thing that can be handed out at turn zero.
      const got = all.slice(0, 2);
      for (const c of got) if (c.level < MAX_LEVEL) c.level++;
      return `⭐ ${got.map(c => c.def.name).join(', ')} come out of the workshop sharper.`; } },
  // 🗺️ THE ROAD - neither power nor money. 🔑 The bucket that makes the choice INCOMPARABLE,
  // and the only place the META layer pays you before turn one.
  { id: 'steadyflame', bucket: 'road', pick: () => ({}),
    name: () => 'A Steady Flame', text: () => 'Your 🕯️ candle survives your first <b>Narrow</b>',
    why: () => 'one scrape that does not cost you the road ahead',
    apply() { S.candleGrace = 1; return `🕯️ The wick is a good one — the first scrape will not snuff it.`; } },
  { id: 'earlywork', bucket: 'road', pick: () => { const c = rollFreeContract(); return c ? { c } : null; },
    name: () => 'Early Work', text: o => `📜 ${contractById(o.c).name} — ${contractById(o.c).text}, and it pays <b>double</b>`,
    why: () => 'a goal you did not have to buy',
    apply(o) { const c = contractById(o.c);
      S.contract = { id: o.c, n: 0, left: contractWindow(c), x2: true };
      return `📜 <b>${c.name}</b> — ${c.text} within <b>${contractWindow(c)}</b> encounters. Keep it and it pays 🪙 ${c.reward * 2}.`; } },
  { id: 'headstart', bucket: 'road', pick: () => ({}),
    name: () => 'A Head Start', text: () => '<b>3 🦴 Bone Shards</b> toward the Workshop',
    why: () => 'the only offer that outlives the run',
    apply() { S.loot = S.loot || {}; S.loot.shard = (S.loot.shard || 0) + 3;
      return `🦴 Three bone shards, already in the pack — they come home whatever happens.`; } },
];
const SETOUT_BUCKETS = ['rule', 'fuel', 'road'];
// ⚠️ REUSES THE RARITY TINTS AS BUCKET TINTS, so the three offers read as three KINDS at a
// glance rather than three paragraphs. It is the one place colour carries the whole design.
const SETOUT_RARITY = { rule: 'rare', fuel: 'common', road: 'uncommon' };
// ⚠️ A `function` DECLARATION, NOT A `const` ARROW. A top-level const is LEXICAL: it never
// lands on the headless sandbox, so no instrument can ask for it, and it hoists into a temporal
// dead zone for anything evaluated above it. This binding rule has cost this project a load-time
// crash and three silent no-op probes; it is not a style preference.
function setoutById(id) { return SETOUT.find(o => o.id === id) || null; }

// 📜 a contract for the Early Work offer, using the same eligibility the Wheel uses
function rollFreeContract() {
  const fits = CONTRACTS.filter(x => !x.tier || x.tier <= stageTier());
  return fits.length ? rand(fits).id : null;
}

function pickSetout(id) {
  const off = (S.setout || []).find(o => o.k === id);
  if (!off) return;
  const def = setoutById(id); if (!def) return;
  log(def.apply(off), 'good');
  S.setout = null;
  // 🛤️ HAND THE RUN BACK TO THE FORK, NOT TO A TURN THAT HAS NO ENCOUNTER (fixed 2026-08-18).
  // 🐛 `freshGame` runs nextTurn, which now OPENS A FORK - phase 'fork', S.encounter still null.
  // startStage then overwrote that phase with 'setout', orphaning the fork; picking a charm jumped
  // straight to 'assign' with no road chosen, and renderControls threw on `S.encounter.type`.
  // 🔑 THE CRASH PRESENTED AS *"clicking on the charm doesn't do anything"* - because render()
  // does its modal bookkeeping LAST, the throw left the dialog open and the screen frozen mid-update.
  // The charm was actually taken every time; nothing on screen ever said so.
  // ⚠️ THE SAME BUG TWICE IN ONE DAY: this line has to name every way a run can begin. It
  // was written for the fork, and when the map replaced the fork it silently dropped the player
  // onto turn 1 with no road chosen. 🔑 A HANDOFF THAT ENUMERATES DESTINATIONS IS A LINE YOU MUST
  // REVISIT EVERY TIME YOU ADD ONE.
  S.phase = S.map ? 'map' : ((S.fork && S.fork.length) ? 'fork' : 'assign');
  logHeader(`— Turn ${S.turn} (Region ${S.region}) —`);
  // 🐛 THIS LINE STILL NAMED `c`, THE CHARM THE OLD SCREEN ALWAYS HANDED YOU. With three
  // KINDS of offer there is no charm to name, and the handoff threw `c is not defined` — which
  // presented, exactly as this function's own comment predicted a year of bugs ago, as *clicking
  // the offer does nothing*. 🔑 The offer now describes ITSELF: `apply()` returns its own line and
  // pickSetout logs it above, so a new offer can never fall out of step with the sentence.
  if (S.encounter) logChallenge();
  saveGame();
  render();
}

function freshGame(stage) {
  try { localStorage.removeItem(SAVE_KEY); } catch (err) {}
  const tutorialRun = stage === 0;
  TSEED = 20260729;   // 🎲 the tutorial's fixed seed — same run, every time
  // 🎓 the tutorial deals from an authored order; every other run shuffles
  // 🗡️ THE DECK IS THE CLASS'S, not the engine's — the mage deals 16 unique, the rogue 8 x 2.
  // ⚠️ The tutorial's authored order is MAGE-only by construction (it names mage cards), which is
  // correct: stage 0 teaches the engine through the class you start with.
  const cards = tutorialRun
    ? TUTORIAL.deckOrder.map(n => newCard(CARD_DEFS.find(d => d.name === n))).filter(Boolean)
    : (CLASS.deck ? CLASS.deck() : shuffle(CLASS.defs.map(newCard)));
  // no argument (a cold boot, or the bot) → the highest stage you have unlocked, so a returning
  // player lands on the newest problem rather than replaying the tutorial.
  const tutorial = stage === 0;
  const pick = tutorial ? TUTORIAL.dragon
    : stage ? dragonForStage(stage)
    : dragonForStage(Math.min(DRAGONS.length, stagesCleared() + 1));
  S = {
    tutorial, taught: [], lessonsOff: false,
    dragon: pick,
    region: 1,
    turn: 0,
    deck: cards,
    hand: [],
    discard: [],
    trashed: [],
    // ⚠️ S does not exist yet, so RUN() cannot be asked — resolve the road from the picked dragon
    encounterQueue: tutorialRun ? TUTORIAL.regions[0].encounters.slice() : shuffle(roadFor(pick.stage)[0].encounters),
    results: { Complete: 0, Narrow: 0, Loss: 0 },
    setout: null,       // 🏕️ the three class charms offered before turn 1

    phase: null,
    encounter: null,
    hardship: null,      // active Hardship name or null
    rangedDodge: false,  // dead since 2026-07-29 (the dodge was cut); kept so old saves still load
    loseReserve: null,   // reason string — Reserve is discarded in Cleanup
    poison: 0,           // damage owed to the NEXT drawn hand
    afterSoak: 'upgrade', // where the soak phase exits to: 'upgrade' | 'turnEnd'
    assign: { Spell: null, Element: null, Boost: null, Reserve: null }, // card ids
    // ❌ DEAD since 2026-08-23 — ↩️ Divert was deleted (the map made it redundant). Kept in the
    // shape only so a save written before that still loads.
    divertsUsed: 0, diverting: false,
    boostTarget: 'Attack',
    coins: 0,          // ROLLS OVER between encounters — the run-layer currency
    charms: [],        // ids of Charms held this run (run-long passives)
    wheel: null,       // active Wheel offer set { offers, rich, bought }
    // per-encounter:
    damage: 0,
    damageEl: null,
    downgraded: new Set(),
    actionSetIds: [],
    reserveId: null,
    // staged reveal:
    beats: null,
    beatIndex: -1,
    pendingR: null,
    beatTimer: null,
    selectedId: null, // tap-to-place selection (touch)
    contract: null,   // 📜 { id, n } — one at a time, expires at the region break
    potions: [],      // 🧪 carried, max POTION_CAP
    potionPick: null, // 🧪 a targeted potion waiting for a card
    potionFx: { init: 0, value: 0, soak: 0, boost: 0, pace: 0, swap: {} },  // ⚠️ wiped every turn
    upgradePick: null,// 🔼 the card whose upgraded form is being previewed
    stack: null,          // 🃏 mid-exchange: { ids, order } while you stack the deck
    // the Dragon Duel finale:
    finalMode: false,     // true once Region 4 is cleared and the finale begins
    finalPhase: null,     // 'lastmile' | 'duel'
    dragonState: null,    // { hp, maxHp, boon } — the persistent dragon
    lastMileOutcome: null,  // ⚔️ what the run's final journey earned
    lastMileApproach: null, // ⚔️ ...and how loudly it arrived (unseen / even / heard)
    duelBeat: 0,          // duel beat counter (for the log)
    duelResult: null,     // stashed resolution carried across the staged reveal into finishDuel
    defeatMsg: null,
    fork: null,             // ⚠️ dead since the map replaced it; kept so older saves load
    map: null,              // 🗺️ the run's map - floors, edges, and where you stand
    mapPeek: null,          // 🗺️ the node being looked at (hover, or first tap on touch)
    boon: null,             // 💀 three charms offered for a clean elite kill
    boonOwed: false,        // 💀 an elite was beaten; pay it at the next map return
    pendingEvent: false,    // ⚠️ dead since 2026-08-18, kept so older saves load
    eventAt: 1,             // 🏕️ which encounter this region's event follows
    eventDone: false,       // 🏕️ has this region's event been spent
    eventTurnPending: false,// 🏕️ the NEXT turn is the event turn
    event: null,         // active event state { id, step, opt, targetId, wantElement, lines }
    // ---- cross-turn event effects (run layer) ----
    eventsSeen: [],        // ids of events already drawn this run (for `once` events)
    eventFlags: {},        // what you DID in past events, so later ones can react
    // 🔥 THE EMBERWAKE (2026-07-29). `wake` is the token you hold RIGHT NOW and may aim this
    // turn; `wakePending` is what you banked this turn and collect at cleanup. It expires after
    // one turn on purpose - a token that keeps would make farming banks on easy encounters the
    // optimal line, and the run would become savings-account management.
    wake: 0, wakeTarget: null, wakePending: 0,
    // 🛡️ THE LOADOUT. `wear` counts DOWN from the piece's printed wear; at 0 it is battered
    // through for the rest of the run. ⚠️ Nothing here is ever destroyed for good — you forged it,
    // you keep it. What a piece costs is the RUN, and that is the only reason it may exist at all
    // (it is the first thing in the game that adds health from outside the deck).
    // 🔴 EMPTY BY DEFAULT. The granted starter kit was step-1 scaffolding, and the ladder is
    // tuned at an EMPTY loadout — a new player owns nothing and crafts up, which is exactly the
    // curve the measurement assumed. What you wear now comes from the Workshop.
    armour: loadoutIds().map(id => newArmour(id)),
    armourStrike: 0, armourStrikePending: 0, armourPace: 0, armourPacePending: 0,
    splitPending: 0,   // 🎯 granted multi-hit, cleared every turn like potionFx
    armourWinInit: false,   // 👢 Anvil Toad Boots, this turn only
    // 🧰 THE HAUL. Kept on the run so the summary can show it, and banked to the stash when
    // the run ENDS — win or lose. ⚠️ `runBanked` is the guard: a run pays out exactly once.
    loot: {}, encountersDone: 0, runBanked: false, xpRun: 0, xpBefore: 0, clsXpBefore: 0,
    stageOpened: null,               // 🗺️ set by victory() when this run unlocked the next stage
    // 🗡️ MOMENTUM (rogue). Engine state for the same reason `lastAttuned` is: cleanup owns the
    // moment it changes, and cleanup is the engine's. Only the rogue ever reads it.
    // ⚠️ IT IS A STREAK, NOT A POOL: it rises by 1 on any turn that costs you no cards and falls to
    // 0 the moment one does — that reset is the minigame, and it is always your own fault.
    momentum: 0, moTarget: null,     // ● the streak (moTarget is dead, kept for old saves)
    sharpenedVisit: [],              // 🔼 cards already sharpened on THIS visit - one level each
    drawExtra: 0,                    // 🗡️ cards a combo verb owes you next turn
    // 🔥 whether you have ARMED the Surge to bank this turn (2026-08-12 — was an element
    // coincidence, is now a choice). Per-turn; cleared in nextTurn and both finale beat-starts.
    bankArmed: false,
    // 📊 what the GRADE reads. Tracked as you play so a run can report on itself.
    // 🕯️ THE CANDLE. Lit, you can see the next encounter. See lightCandle/snuffCandle.
    candle: true,
    candleGrace: 0,     // 🏕️ A Steady Flame — scrapes this many Narrows survive
    stats: { craftAvail: 0, craftFound: 0, duelDmg: 0, duelBeats: 0, perfect: 0, perfectChances: 0 },
    emberguardUsed: false,   // ✦ Emberguard is once per encounter
    duelStamina0: 0,    // cards you arrived at the lair with — the duel's other health bar
    delayed: 0,            // ⏳ shop stops still owed to a Time Penalty — no sharpening while > 0
    curseNextFight: false, // Cache/Mirror Fen: force a Hardship on the next fight
    paceBless: 0,          // Gray Pilgrim/Mirror Fen: +2 Pace on this many upcoming journeys
    emberShield: false,    // Ember Hollow: your Arsenal survives Nightfall (rest of region)
    logEntries: [], // [{header, lines:[{text, cls}]}], newest first
  };
  scheduleRegionEvent();   // 🏕️ legacy: kept for the tutorial, which does not use the map
  // 🗺️ THE MAP IS THE RUN. ⚠️ Not for the tutorial - stage 0 is deterministic by design, and
  // a route is the one thing a scripted lesson cannot script.
  S.map = S.tutorial ? tutorialMap() : generateMap();
  // ⚠️ ON A MAP RUN THE FIRST HAND IS DEALT WHEN YOU SET OFF, NOT BEFORE. This is the exact case
  // Thomas hit: *"i just started a new game, i see my whole hand, and i see all 3 encounters."*
  // Turn 1 is the one route you take with NO Arsenal, so it is the purest version of the choice -
  // you pick a road knowing only the road.
  if (!S.map) draw(HAND_SIZE);
  // 🗡️ A DRAW IS A SWAP, NEVER AN ADDITION — but you get to SEE the card first, which is why
  // the extra arrives now and is put back at cleanup rather than being a blind exchange.
  // 🔑 The slot row IS the picker: four slots, five cards, and the one you leave unseated slides
  // under the deck. No new phase, no new UI language, and the bot needs teaching nothing — it
  // already searches every arrangement, so it simply searches a bigger hand.
  if (S.drawExtra) { draw(S.drawExtra); S.drawExtra = 0; }
  nextTurn();
  // the Dragon is fully revealed from turn 1 — the run's reference frame
  // 🐉 THE BRIEFING. The dragon is known from turn 1 — and now that it is a STAGE rather than a
  // random draw, the reveal is a briefing rather than a surprise, which is what makes a run
  // soft-directional: everything you level and every card you stack is preparation for a problem
  // you can already name.
  log(`🐉 STAGE ${S.dragon.stage} — beyond Region ${RUN().length} waits <b>${S.dragon.name}</b> ${elIcon(S.dragon.element)}. ${dragonShapeText(S.dragon)}: ${dragonDemand(S.dragon)}. ${S.dragon.brief} <b>It asks one thing of you: ${S.dragon.teaches}.</b>`);
  render();
}

// ============================================================
// 📋 THE REPORT (2026-08-05) — the playtest's only instrument
// ============================================================
// A friend who hits a bug can only tell you *"it broke on the dragon"*, and neither of us can act
// on that. Everything needed to reproduce it — the stage, the turn, the phase, what the deck had
// become, what the log just said — is sitting right there in their browser and has no way out.
//
// 🔑 THIS IS THE SAME PRINCIPLE AS THE GRADE AND THE STANDING: state the TERMS. A playtester
// is an instrument, and an instrument that cannot export a reading is a rumour.
//
// ⚠️ It is deliberately a COPY, not a send. No endpoint, no account, no network — the game
// stays a static page you can open from a file, and the tester chooses what to paste and where.
function reportText() {
  const L = [];
  const p = (k, v) => L.push(k + ': ' + v);
  p('build', BUILD + ' (' + CHANNEL + ')');
  p('url', (() => { try { return location.href; } catch (e) { return '?'; } })());
  p('screen', (() => { try { return innerWidth + 'x' + innerHeight; } catch (e) { return '?'; } })());
  p('agent', (() => { try { return navigator.userAgent; } catch (e) { return '?'; } })());
  if (!S || isShell()) { p('state', 'no run (' + ((S && S.phase) || 'boot') + ')'); return L.join('\n'); }
  p('stage', (S.tutorial ? '0 (tutorial)' : (S.dragon ? S.dragon.stage + ' — ' + S.dragon.name : '?')));
  p('where', S.finalMode ? ('the lair · ' + (S.finalPhase || 'duel')) : ('region ' + S.region + ' · turn ' + S.turn));
  p('phase', S.phase + (S.encounter ? ' · ' + S.encounter.type + ' · ' + S.encounter.name : ''));
  if (S.finalMode && S.dragonState) p('dragon', S.dragonState.hp + ' hp · breath ' + (S.dragonState.breath || '?'));
  p('deck', S.deck.length + ' deck / ' + S.hand.length + ' hand / ' + S.discard.length + ' discard · ' +
      deckLevels() + ' levels' + (S.dragon && S.dragon.par ? ' vs par ' + S.dragon.par : '') +
      ' · lost ' + S.trashed.length);
  p('hand', S.hand.map(c => displayName(c) + ' Lv' + c.level + ' [' + (zoneOf(c.id) || '—') + ']').join(' | ') || 'none');
  p('carried', (carried() || []).map(x => x.name).join(', ') || 'nothing');
  p('potions', (S.potions || []).map(id => (potionById(id) || {}).name || id).join(', ') || 'none');
  p('coins', S.coins + (S.contract ? ' · contract: ' + S.contract.id : ''));
  p('results', 'C' + S.results.Complete + ' N' + S.results.Narrow + ' L' + S.results.Loss +
      ' · candle ' + (S.candle ? 'lit' : 'out'));
  // the last few turns of log, stripped of markup — the single most useful part of the whole report
  const strip = t => String(t).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '');
  L.push('');
  L.push('--- log (most recent last) ---');
  (S.logEntries || []).slice(0, 4).reverse().forEach(e => {
    L.push('[' + strip(e.header) + ']');
    e.lines.forEach(l => L.push('  ' + strip(l.text)));
  });
  return L.join('\n');
}

// ⚠️ THE CLIPBOARD CAN REFUSE and it refuses most often on exactly the devices a playtester
// uses — an insecure origin, an iOS gesture that did not count, a browser that never had the API.
// A copy button that silently fails is worse than none, so a refusal falls back to showing the
// text in a box the tester can select by hand. Never leave them with nothing.
function copyReport() {
  const txt = reportText();
  const done = ok => {
    const b = $('report-btn'); if (!b) return;
    b.textContent = ok ? '✓ Copied' : '📋 Select it';
    setTimeout(() => { b.textContent = '📋 Report'; }, 2200);
    if (!ok) showReportBox(txt);
  };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => done(true), () => done(false));
      return;
    }
  } catch (e) {}
  done(false);
}
function showReportBox(txt) {
  let box = $('report-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'report-box';
    document.body.appendChild(box);
  }
  box.innerHTML = `<div class="rb-inner"><p>Copy this and send it along with what you were doing:</p>` +
    `<textarea readonly></textarea>` +
    `<button onclick="document.getElementById('report-box').remove()">Close</button></div>`;
  const ta = box.querySelector('textarea');
  ta.value = txt; ta.focus(); ta.select();
}

// 🏠 THE WAY OUT (2026-08-05). The header used to hold one button, ⟳ New Run, which quietly
// did neither thing: it dumped you on the menu and abandoned the run. Two buttons now, and each
// does exactly what it says.
//
// 🔑 LEAVING IS NOT LOSING. The run auto-saves at every stable phase, so the menu is a DOOR,
// not a discard — ▶ Continue is waiting on the other side. That is why this one does not ask for
// a confirmation: there is nothing to confirm.
function toMenu() {
  showMenu();   // the last auto-save stands; ▶ Continue picks it back up
}

// ⟳ NEW RUN = the same stage, from the top. Thomas: *"new run should just restart you whatever
// stage you are in."* The old behaviour sent you to the menu to re-pick the stage you were
// already playing, which is three taps to express "again". A stage is a PROBLEM you are trying
// to solve; wanting another go at the same one is the normal case, not the exception.
// ⚠️ This one DOES discard the run (freshGame wipes the save), so it asks first.
function newGame() {
  if (!S || isShell()) { showMenu(); return; }
  const st = S.tutorial ? 0 : (S.dragon && S.dragon.stage) || 1;
  const what = st === 0 ? 'the tutorial' : `stage ${st} — ${S.dragon.name}`;
  if (confirm(`Start ${what} again from the beginning? This run will be lost.`)) startStage(st, true);
}

function nextRegion() {
  if (S.region >= RUN().length) { freshGame(); return; }
  // 📜 a contract CROSSES the region break now — its own encounter window is the bound
  S.regionTurn = 0;
  scheduleRegionEvent();       // 🏕️ one event turn, somewhere in this region
  // reshuffle everything non-trashed, keep levels
  const pool = shuffle([...S.deck, ...S.discard, ...S.hand]);
  S.region++;
  S.deck = pool;
  S.hand = [];
  S.discard = [];
  S.emberShield = false; // the Ember Hollow ward lasts only the region it was banked in
  // 🕯️ Dawnwatch Cap — a fresh region, a fresh light. ⚠️ Placed at the REGION break rather than
  // per encounter on purpose: relighting every turn would delete the candle's whole tension.
  if (hasArmourRule('dawnlit') && !S.candle) lightCandle('Dawnwatch Cap catches the morning');
  S.encounterQueue = S.tutorial ? RUN()[S.region - 1].encounters.slice() : shuffle(RUN()[S.region - 1].encounters);
  draw(HAND_SIZE);
  // 🗡️ A DRAW IS A SWAP, NEVER AN ADDITION — but you get to SEE the card first, which is why
  // the extra arrives now and is put back at cleanup rather than being a blind exchange.
  // 🔑 The slot row IS the picker: four slots, five cards, and the one you leave unseated slides
  // under the deck. No new phase, no new UI language, and the bot needs teaching nothing — it
  // already searches every arrangement, so it simply searches a bigger hand.
  if (S.drawExtra) { draw(S.drawExtra); S.drawExtra = 0; }
  nextTurn();
}

function draw(n) {
  for (let i = 0; i < n && S.deck.length > 0; i++) S.hand.push(S.deck.shift());
}

// effective values come straight from the card's per-level table (source grammar:
// EVERY stat scales with level, non-uniformly, and armor can gain its element late).
function eff(card) {
  const d = card.def;
  const [v, ev, init, boost, armor, armorEl, cost] = d.lv[card.level - 1];
  // run-layer reforge mods (from Events): +armor / −attack, floored at 0. Move is untouched.
  // Charms stack on top, element-gated ones only for cards of that element.
  const am = charmMod('armor', d.element);
  const at = charmMod('atk', d.element);
  const adj = x => x == null ? null : Math.max(0, x + at);
  // ONE VALUE (2026-07-26, redesign step 2). A card no longer prints a separate Attack and
  // Move: it prints how much it ACCOMPLISHES. In a fight that is damage, on a journey it is
  // progress - the fiction changes, the number does not. This deleted the wrong-type rule,
  // cross-type attuning, the second attuned number, and card types altogether.
  // `def.type` / `def.enhType` are now DEAD DATA.
  return {
    value: adj(v),
    // ✦ THE ATTUNED VALUE (2026-07-29). DERIVED, never printed in the table - column 2 (`ev`)
    // stays dead. One rule: +(level + 1). It SHARPENS, so the higher a card is levelled the more
    // it depends on being properly fuelled - a Lv4 Emberfall is enormous attuned and merely large
    // raw, which is the same "more itself" curve every other stat follows.
    // 🐛 ...EXCEPT WHEN THE CLASS AUTHORS IT (found 2026-08-17). The rogue's ✦ is what you get
    // for PAYING a card's ⚡ cost in full, and `ROGUE_SPEC.paid` sets it per card — a cheap tool
    // pays back a little, an expensive blade a lot. That whole column was being overwritten here by
    // the mage's derived rule, so every rogue card paid back a flat +(level+1) and `paid` was DEAD
    // DATA. 🔑 THE SAME SHAPE AS `hits`: a field the class authors and the engine quietly
    // ignores looks exactly like a tuned mechanic right up until you check the number.
    attuned: d.paid != null ? adj(v) + d.paid + PAID_STEP * (card.level - 1)
                            : adj(v) + card.level + ATTUNE_BONUS,
    // `ev` (the old Attuned value, column 2) is DEAD DATA - power comes from pile depth now
    // 💨 THE INITIATIVE FLOOR (2026-07-29). Sharpening drove every non-SPARK card's init to 0-1,
    // so only 4 of the 16 cards could ever contest a race and the deck's MEDIAN init FELL as you
    // levelled (3 → 2 → 1 → 1). Measured: 32% of hands held nothing that could clear the enemy —
    // initiative was weather, not a decision. A card at init 0 isn't sharpened, it's DISQUALIFIED
    // from the Catalyst slot, which breaks the 16-card brief's own test (every card wanted in ≥2
    // slots). The floor keeps SPARK enormously faster (13 vs 3 at Lv4) — it stops the rest being
    // unable to play at all. Paired with a -2 on creature Initiative so the two ranges overlap.
    init: Math.max(INIT_FLOOR, init + charmMod('init', d.element)),
    // ⚠️ cost comes from LEVEL_COST, not the row - column 7 of every level table is now dead data
    boost: boost + charmMod('boost', d.element), armor: Math.max(0, armor + am),
    cost: LEVEL_COST[card.level - 1],
  };
}

function cardById(id) { return S.hand.find(c => c.id === id) || null; }

// What does a level actually BUY? Every stat scales per level, non-uniformly, per card
// (source grammar) — so "→ Lv3" is unpredictable by design and the player was being asked to
// spend coins on a lookup table they can't see. Spell it out: ⚔️ 5→6 · ✨ 8→11 · 🛡️ 2→3.
// This is the "number go up and you know it's good" feedback every other card game has.
function levelDeltaText(card) {
  if (!card || card.level >= MAX_LEVEL) return '';
  const a = eff(card), b = eff({ ...card, level: card.level + 1 });
  const parts = [];
  const cmp = (icon, x, y) => { if (x != null && y != null && y !== x) parts.push(`${icon} ${x}<span class="d-arrow">→</span>${y}`); };
  cmp('⚔️', a.value, b.value);
  cmp('✦', a.attuned, b.attuned);
  cmp('💨', a.init, b.init);
  cmp('➕', a.boost, b.boost);
  cmp('🛡️', a.armor, b.armor);
  if (card.level + 1 >= MAX_LEVEL && VERBS[card.def.name]) parts.push(`<b class="d-verb">✦ ${VERBS[card.def.name].name}</b>`);
  return parts.join(' · ');
}

// ============================================================
// ATTUNING (collapsed to ONE rule 2026-07-26 - redesign step 2)
//     Your CATALYST must share your SPELL's element. That is the whole rule.
// The elemental cycle (a Fire spell seeking Lightning) is gone: it fixed the ARBITRARINESS of
// 17 printed enhEl facts but never the STRANGENESS - a fire spell wanting lightning contradicts
// the only intuition anyone brings to elements, and it made an attuned Fire spell deal Lightning
// damage to armour. Measured best headroom of four candidates (fights obligation 35%, journeys
// 50%, vs 40%/58% for the cycle). Element is now a plain suit: a PAIR attunes.
// `def.enhEl` on every card is now DEAD DATA (cleared wholesale when the deck is re-authored).
// ============================================================
// How much a resonant Surge is worth - the Surge feeding the same element as the pair.
const RESONANCE_MULT = 1.5;

// What a card seeks = its OWN element. Reads the FUSED element, so fusing can change either
function enhElOf(card) { return elOf(card); }

// one action set for every turn — normal turns, the Approach, and the Duel all share it
function activeZones() { return ZONES; }
function isAssignPhase() { return S.phase === 'assign'; }

// ============================================================
// 🧪 POTIONS (2026-08-05, Thomas) — one-time, carried, spent on the turn you need them.
//
// 🔑 WHY THEY DO NOT BREAK *LATERAL POWER, NOT VERTICAL*: a potion is CONSUMED. It cannot
// inflate a run the way a permanent stat would, and it cannot make a card better than it is - it
// buys you ONE turn where the arrangement you wanted is legal. That is the same thing a charm does
// (change what is correct) compressed into a single use, which is why they can be much louder.
//
// 🔑 AND THEY GIVE COINS A THIRD JOB. Coins bought levels and charms - both permanent, both
// bought long before the turn that needs them. A potion is the first thing you can buy NOW and
// spend LATER at a moment of your choosing, which is the only consumable decision in the game.
//
// ⚠️ HOLD THREE. A cap is what stops them becoming a savings account, and three is small enough
// that taking one is a decision rather than an accumulation.
// ⚠️ CLASS-GATED LIKE CHARMS: a potion may only name something PRINTED ON THE CARD, and one that
// names an ELEMENT is a mage potion (`cls: 'mage'`) - a rogue's vial would say something else.
// ⚠️ Every effect lasts THIS TURN only unless it says otherwise, and `S.potionFx` is wiped in
// nextTurn() and in the finale's beat-starts. A potion that outlived its turn would be a charm.
// ============================================================
// 🪙 A COMPLETE PAYS BETTER THAN A NARROW (2026-08-05, Thomas: *"i don't get enough gold to
// both upgrade and or buy charms or potions. wonder if a complete victory should give more gold"*).
//
// ⚠️ Until now they paid EXACTLY THE SAME - the award was gated on `outcome !== 'Loss'` - so a
// Narrow cost you damage and your 🕯️ candle and nothing else. Paying for the clean win is the
// obvious missing incentive, and it raises income without inflating a Loss.
// ⚠️ TRIMMED 3 → 1 on 2026-08-05 after the level-table fix made cards much stronger: Thomas
// reported "charms and potions are really good too, getting completes easy". The clean win still
// pays more than a scrape, which was the point — it just stopped being an income firehose.
// 🪙 COINS ARE THE DIFFICULTY DIAL (2026-07-29), and now there is one knob for it.
// ⚠️ APPLIED AT THE AWARD, exactly once, for the same reason FOE_ATK_MULT is applied at the
// draw: `e.xp` is read in several places and most of them are DISPLAYS. Scale anywhere else and
// the panels print numbers the game does not use.
let COIN_MULT = 1.0;
// 🐉 PER-STAGE HP OFFSET — the instrument for the SHAPE of the ladder, where COIN_MULT is the
// instrument for its HEIGHT. 🔑 1 dragon HP ≈ 2 points of win rate (measured), so this is the
// finest dial in the game. Read at beginFinalBattle(), so a sweep never edits the data table.
let DRAGON_HP_ADD = { 1: 0, 2: 0, 3: 0, 4: 0 };
const COMPLETE_BONUS = 2;
// POTION_CAP moved to the top-of-file constants (2026-08-12): the tutorial's potion lesson names
// it, and TUTORIAL is defined ~1,100 lines earlier, so declaring it here put it in the temporal
// dead zone and threw at load. ⚠️ A `const` read by TUTORIAL's text must live ABOVE TUTORIAL.

// ============================================================
// 📜 QUEST CONTRACTS (2026-08-05, Thomas — from *GuildRun*: *"you could buy some items that
// gives you a quest to complete… win 3 combats, get 25 gold, and it costed like 7 gold"*).
//
// 🔑 YOU SPEND COINS TO BUY A GOAL, AND THE GOAL PAYS OUT IF YOU MEET IT. A shop slot that
// sells not power but **a reason to play the next five turns differently** — which is exactly the
// kind of variety this game is allowed to have: *variety comes from PROBLEMS, never from powers*
// ([[Quest_Contracts]]). A contract is a second, self-imposed problem laid over the encounters you
// were going to face anyway.
//
// 🔑 IT COSTS NO NEW RULES. Every contract reads engine state the engine already tracks —
// outcomes, Initiative, attunement, damage taken. No verb on a card, no exception to the turn.
// ⚠️ ONE AT A TIME, AND IT CARRIES ITS OWN CLOCK (rewritten 2026-08-10, Thomas: *"not liking
// the complete 2 journeys or fights or whatever for THIS region, i think it should carry over"*).
//
// It used to expire at the REGION BREAK, which made the same contract a different bet depending on
// when the wheel happened to offer it — and the region boundary is a bookkeeping line, not
// something the player is thinking about. Now every contract states a **window in encounters** and
// that window crosses region breaks untouched.
//
// 🔑 THE WINDOW STAYS, AND THIS IS WHY: a goal with no deadline cannot be FAILED, only delayed,
// so it stops being a gamble and becomes a slow bonus you always take. The bound is what makes it
// a bet against your own play. What changed is that the bound is now the contract's own, stated on
// the offer, and identical whenever you buy it.
// ⚠️ EVERY WINDOW CARRIES SLACK over its `need` — measured 2026-08-05: at `need === turnsLeft`
// the keep rate was 23%, a coin-flip dressed as a goal.
// ⚠️ NOTHING ASKS FOR FEWER THAN 3 (Thomas: *"2 is maybe too low"*). Two of anything happens by
// accident across six encounters; three is a thing you steered toward.
// ⚠️ Declarative on purpose (`track` + `need` + `window`), so the whole table ports as data and
// only `contractTick()` is behaviour — see the port-ready rule in CLAUDE.md.
const CONTRACTS = [
  { id: 'ledger',  name: 'The Clean Ledger', cost: 7, reward: 22, need: 3, window: 6, track: 'complete',
    text: '⚔️ <b>Complete 3</b> encounters' },
  { id: 'swift',   name: 'Swift Passage',    cost: 6, reward: 18, need: 4, window: 7, track: 'initiative',
    text: '💨 <b>Win Initiative 4</b> times' },
  { id: 'woven',   name: 'The Woven Road',   cost: 6, reward: 18, need: 4, window: 7, track: 'attune',
    text: '✦ <b>Attune 4</b> times' },
  { id: 'untouched', name: 'Untouched',      cost: 8, reward: 26, need: 3, window: 6, track: 'unhurt',
    text: '🛡️ Finish <b>3</b> encounters <b>taking no damage</b>' },
  // 👣 the widest window in the table: only about half of all encounters are journeys, so a
  // 6-encounter window would ask for three of roughly three chances — the 23% trap again.
  { id: 'longwalk', name: 'The Long Walk',   cost: 6, reward: 20, need: 3, window: 9, track: 'journey',
    text: '👣 <b>Complete 3 journeys</b>' },
  // 🗺️ ONE QUEST PER LAND, tiered like the charms (2026-08-10, Thomas: *"each stage should
  // have some new quests and maybe potions to buy as well to help"*).
  // 🔑 Each names the thing ITS land is about, so a quest is a second reason to play the road
  // the way the road already wants — and a stage's whole shop leans the same direction as its
  // dragon. ⚠️ Every track still reads state the engine already records; no new bookkeeping.
  { id: 'fleet',   name: 'The Fleet Ledger', tier: 2, cost: 8, reward: 26, need: 3, window: 7, track: 'cleanfast',
    text: '💨 <b>Complete 3</b> encounters <b>having won Initiative</b>' },
  { id: 'thrift',  name: 'Nothing Spared',   tier: 3, cost: 8, reward: 30, need: 3, window: 8, track: 'thrift',
    text: '⚖️ <b>Complete 3</b> encounters with <b>2 or less to spare</b>' },
  { id: 'deep',    name: 'The Deep Ledger',  tier: 4, cost: 10, reward: 38, need: 3, window: 9, track: 'flawless',
    text: '🌊 <b>Complete 3</b> encounters <b>fast and untouched</b>' },
];
const contractWindow = c => c.window || 6;
const contractById = id => CONTRACTS.find(c => c.id === id) || null;
function activeContract() { return S.contract ? contractById(S.contract.id) : null; }

// 📜 one place reads the turn and moves the counter. Everything else is data.
function contractTick(r) {
  const c = activeContract(); if (!c || !r) return;
  // ⏳ the clock runs on ENCOUNTERS, not regions, so a region break is invisible to it
  S.contract.left = (S.contract.left == null ? contractWindow(c) : S.contract.left) - 1;
  const hurt = (r.early || 0) + (r.combatDmg || 0) + (r.timePenalty || 0) + (r.treacherousDmg || 0);
  let hit = false;
  if (c.track === 'complete')   hit = r.outcome === 'Complete';
  if (c.track === 'initiative') hit = r.type === 'fight' && !r.initLost;
  if (c.track === 'attune')     hit = !!r.enhUsed;
  if (c.track === 'unhurt')     hit = hurt === 0 && r.outcome !== 'Loss';
  if (c.track === 'journey')    hit = r.type === 'journey' && r.outcome === 'Complete';
  // 🗺️ the three land quests — still nothing but fields the turn already produced
  if (c.track === 'cleanfast')  hit = r.outcome === 'Complete' && !r.initLost;
  if (c.track === 'thrift')     hit = r.outcome === 'Complete' && r.target != null && (r.value - r.target) <= 2;
  if (c.track === 'flawless')   hit = r.outcome === 'Complete' && !r.initLost && hurt === 0;
  if (hit) S.contract.n++;
  if (S.contract.n >= c.need) {
    // 🏕️ Early Work doubles it. ⚠️ Read off the CONTRACT OBJECT, not a separate flag on S —
    // one contract is live at a time and it already travels with the run, so the multiplier
    // travels with the thing it multiplies and cannot be left behind by a save.
    S.coins += c.reward * (S.contract && S.contract.x2 ? 2 : 1);
    log(`📜 <b>${c.name}</b> — kept. 🪙 +${c.reward} (you now hold ${S.coins}).`, 'good result');
    S.contract = null;
    return;
  }
  if (S.contract.left <= 0) { expireContract(); return; }
  if (hit) log(`📜 ${c.name}: ${S.contract.n} of ${c.need} · ${S.contract.left} encounters left.`);
}
function expireContract() {
  const c = activeContract(); if (!c) return;
  log(`📜 <b>${c.name}</b> lapses unkept — ${S.contract.n} of ${c.need}. The coin is gone.`, 'bad');
  S.contract = null;
}
// ⚠️ EVERY POTION SAYS "WHEN USED", NEVER "THIS TURN" (2026-08-18). Thomas: *"for potion, it
// should be more clear, instead of saying, this turn, should say when used."*
// 🔑 "This turn" reads as something ALREADY HAPPENING - passive, like a hardship. A potion is
// something you SPEND, on a turn you pick, and the text has to say so at the moment you are
// deciding whether to buy it. The duration is a property of every potion, so it is stated once on
// the carry chip rather than seventeen times in the shop.
const POTIONS = [
  // ---- 🥄 FODDER (2026-08-05, Thomas: *"add some cheap shitty potions too, we need fodder to
  // fill up these things as well"*). Cheap, small, and correct about one turn in five.
  //
  // 🔑 A POOL OF ALL BANGERS HAS NO TEXTURE. Fodder does three jobs at once: it makes the good
  // ones feel rare, it gives a broke player something to actually buy, and it widens the pool so
  // the Wheel stops offering the same three excellent things. It is also the cheapest content in
  // the game - every one of these is a number on an existing hook.
  // ⚠️ THE BAR IS STILL "CORRECT SOMETIME", NOT "USELESS". Every one of these wins a turn you
  // would otherwise have lost by one or two points. A potion that can never be right is litter,
  // and litter in a shop is worse than an empty shelf.
  { id: 'chalkwater', name: 'Chalkwater', cost: 2, rarity: 'common',
    text: '💨 <b>+2 Initiative</b> when used' },
  { id: 'broth',    name: 'Thin Broth',   cost: 2, rarity: 'common',
    text: '⚔️ <b>+2</b> to your action when used' },
  { id: 'grit',     name: 'Grit',         cost: 2, rarity: 'common',
    text: '🛡️ every card <b>blocks +1</b> when used' },
  { id: 'bitterroot', name: 'Bitterroot', cost: 3, rarity: 'common',
    text: '➕ your <b>Surge gives +3</b> more when used' },
  { id: 'roaddust', name: 'Road Dust',    cost: 3, rarity: 'common',
    text: '🌙 <b>+3 Pace</b> against the dark when used' },
  { id: 'tallow',   name: 'Tallow Stub',  cost: 3, rarity: 'common',
    text: '🕯️ your candle <b>cannot be snuffed</b> when used' },
  // ---- generic: every class inherits these unchanged ----
  { id: 'haste',   name: 'Draught of Haste', cost: 6, rarity: 'common',
    text: '💨 <b>+5 Initiative</b> when used' },
  { id: 'ember',   name: 'Emberdraught',     cost: 7, rarity: 'common',
    text: '⚔️ <b>+6</b> to your action when used' },
  { id: 'ironskin',name: 'Ironskin Tonic',   cost: 6, rarity: 'common',
    text: '🛡️ every card <b>blocks +3</b> when used' },
  { id: 'clarity', name: 'Draught of Clarity', cost: 5, rarity: 'uncommon',
    text: '🕯️ <b>relight your candle</b> — see the road ahead again' },
  // 🎯 THE ONE-TURN VERSION OF MULTI-HIT, and the cheapest teacher of it. ⚠️ Deliberately
  // priced as a mid uncommon rather than a banger: it adds **no damage** (a multi-hit strike
  // divides its own value), so its whole value is meeting 🧱 Guard with it in your kit. Against
  // 🛡️ Armour it is actively bad, which is the downside already written into the maths.
  { id: 'splitting', name: 'Splitting Draught', cost: 8, rarity: 'uncommon',
    // ⚠️ IT DOES NOT SAY *"same total"*, WHICH WAS THE FIRST DRAFT AND WAS A LIE. Measured against
    // 🛡️ Armour 1: unsplit 12, split 10 - armour is subtracted from EVERY blow, and an odd value
    // loses one more to rounding. 🔑 That is the mechanic working as designed, so the text must
    // state the RULE rather than a comforting summary of it. *A rules string states the rule.*
    text: '🎯 your strike <b>splits in two</b> this turn — better into 🧱 <b>Guard</b>, worse into 🛡️ <b>Armour</b>' },
  { id: 'salve',   name: 'Mending Salve',    cost: 9, rarity: 'uncommon', pick: true,
    text: '✨ <b>restore a card a level</b> — undo what the road took',
    can: c => c.level < MAX_LEVEL, why: 'already at its brightest' },
  { id: 'nightglass', name: 'Nightglass', cost: 6, rarity: 'common',
    text: '🌙 the dark <b>cannot catch you</b> — for the whole journey' },
  { id: 'breath',  name: 'Second Breath',  cost: 10, rarity: 'rare',
    text: '✦ your <b>Spell is not spent</b> when used' },
  { id: 'quench',  name: 'Quenching Draught', cost: 11, rarity: 'rare',
    text: "🛡️ the enemy's <b>defence does nothing</b> when used" },
  { id: 'gravewax', name: 'Grave Wax',     cost: 8, rarity: 'uncommon',
    when: () => (S.trashed || []).length > 0,
    text: '✨ the last card you <b>lost returns</b>, at Lv1' },
  // ---- mage: it names an ELEMENT, which is the mage's suit ----
  { id: 'prism',   name: 'Prism Vial',       cost: 7, rarity: 'uncommon', cls: 'mage', pick: true,
    text: "✦ one card's <b>element becomes your Spell's</b>",
    can: c => S.assign.Spell && c.id !== S.assign.Spell && elOf(c) !== elOf(spellCard()),
    why: 'nothing to change here' },
  // ---- 🗺️ ONE POTION PER LAND (2026-08-10). Each is the single-turn answer to the thing its
  // road keeps asking, which is what makes a stage's shelf feel like it belongs to that stage.
  // ⚠️ Same gate as always: a potion may only name something PRINTED ON THE CARD or on the foe.
  // ⚠️ And they are CONSUMED, which is why they do not break *lateral power, not vertical* —
  // a potion buys ONE turn where the arrangement you wanted is legal.
  { id: 'skyglass',  name: 'Skyglass',   tier: 2, cost: 5, rarity: 'uncommon',
    text: '🌀 Your blow <b>cannot be halved</b> when used' },
  { id: 'stillwater', name: 'Stillwater', tier: 3, cost: 6, rarity: 'uncommon',
    text: '🛡️ Nothing <b>strikes back</b> at you when used' },
  { id: 'hardtack',  name: 'Hardtack',   tier: 3, cost: 2, rarity: 'common',
    text: '⏳ Any <b>Time Penalty is 1 less</b> when used' },
  { id: 'deepcurrent', name: 'Deepcurrent', tier: 4, cost: 9, rarity: 'rare',
    text: '💨 You <b>win Initiative</b>, whatever it is' },
  { id: 'solvent', name: 'Solvent',           cost: 8, rarity: 'uncommon', cls: 'mage',
    text: '✦ your <b>Catalyst stays in hand</b> instead of going under the deck' },
];
// 🔓 CHARM TIERS — a STAND-IN for meta-progression (2026-08-05, Thomas: *"since we will have
// meta progression to unlock better ones, maybe we can simulate it for now — you'll only have
// crappy ones in the pool in stage 1, but stage 2-4 will have progressively better ones… that way
// when i test the other stages, we will have a somewhat closer representation of difficulty"*).
//
// 🔑 IT FIXES A MEASUREMENT ERROR AS MUCH AS A DESIGN ONE. Every stage number until now was
// measured against the SAME charm pool - so stage 1 was flattered and stage 4 was slandered,
// because a real player reaching stage 4 will have unlocked far more than one on stage 1.
// This is [[Difficulty_Philosophy]]'s own rule finally implemented: *tune stage N assuming ~N
// stages' worth of unlocks* - while never tuning the UNLOCKED state as the baseline, which is how
// a roguelite gets a miserable first ten hours. Stage 1 keeps only the starter pool.
//
// ⚠️ IT IS A SIMULATION, NOT THE UNLOCK SYSTEM. The real one gates on RUNS PLAYED, never on
// dragons felled ([[Charm_Pools]]) - gating behind victories takes options from exactly the player
// who needs more of them. When that ships, this filter is what it replaces.
// ⚠️ Curses carry no tier: you take those as a price, not as a reward.
// ⚠️ AND STAGE 1 MUST HOLD MAGE CHARMS OF ITS OWN. The first tiering gave it none, which
// silently SKIPPED 🏕️ Setting Out on stage 1 - the one screen a new player meets first. Three of
// the mildest rule-changers (Loose Weave, Held Ember, Reversed) live in tier 1 for that reason:
// they are lateral, not powerful, and they teach what a rule-charm even is.
// 🔓 THE UNLOCK LADDER — one level, one named thing.
//
// 🔑 ORDERED LEGIBLE → CONDITIONAL, which is [[Charm_Pools]]'s own answer to the trap Thomas
// spotted there (*"starter charms are super basic and bad, and progressively get better? but yeah
// there would be a lot of slop"*). Slay the Spire's commons are not BAD, they are SIMPLE — so the
// axis that grows is how much the charm asks of you, never how big its number is. Level 2 hands
// you *+2 armour on every card*; level 19 hands you *your Spell is not spent on a Complete*, which
// is worth nothing until you know what to do with it. **Nothing here is ever a dud**, so there is
// no slop to filter past — and that keeps *lateral power, not vertical* true of the meta layer too.
//
// ⚠️ WHAT IS NOT IN THIS TABLE IS A STARTER. The nine charms a level-1 account already holds are
// the current tier-1 set, unchanged, because that pool is what stage 1 is tuned against and it is
// the one pool a new player ever meets. ⚠️ 🏕️ Setting Out only runs if the CLASS list is
// non-empty, so every class must keep at least one charm off this table — the tiering bug that
// silently deleted a whole screen is exactly this mistake made once already.
//
// ⚠️ CLASSES ARE INTERLEAVED ON PURPOSE. A run of four generic levels would read as a dead patch
// to whoever is playing the class that got skipped; alternating keeps both curves moving.
// 🔑 `kind` is here so the table can carry potions and events later without a second system —
// [[Addiction_Loop]]'s meta-progression unlocks CONTENT, and a charm is only the first kind of it.
const UNLOCKS = [
  // ⭐ THE ACCOUNT LADDER — generic charms, engine rules, inherited by every class ever added
  { level: 2,  kind: 'charm', id: 'wardstone' },        // +2 armour on every card. Read once, done.
  { level: 3,  kind: 'charm', id: 'lanternpace' },
  { level: 4,  kind: 'charm', id: 'tinderbox' },
  { level: 5,  kind: 'charm', id: 'swiftwick' },
  { level: 6,  kind: 'charm', id: 'ironsplit' },
  { level: 7,  kind: 'charm', id: 'brightwick' },
  { level: 8,  kind: 'charm', id: 'windreader' },
  { level: 9,  kind: 'charm', id: 'slowfoot' },
  { level: 10, kind: 'charm', id: 'oathstone' },
  { level: 11, kind: 'charm', id: 'unspent' },          // the whole-run rethink
  // 🎁 THE ANTI-SYNERGY SET TAKES THE TOP THREE RUNGS (2026-08-24), which is exactly the job
  // this bar was given: *the shelf where content we have not built yet lands*. 🔴 ALL FOUR ARE ON THE BAR, AND THE
  // FIRST CUT PUT ⚖️ Even Keel and 🗡️ Keen Edge IN THE STARTER POOL to teach the idea early.
  // That was worth **+19/+15/+13/+15 on the ladder at ★1** - because the ladder measures a fresh
  // account, so those two were the ONLY new charms it could ever see, landing in a generic starter
  // pool of nine. 🔑 **A STARTER IS NOT A GENTLER VERSION OF A REWARD - IT IS A DIFFICULTY
  // SETTING FOR THE ON-RAMP**, and stage 1 is the one rung that is already tuned.
  // ⚠️ The teaching argument was real and lost to a measurement, which is the right order.
  { level: 12, kind: 'charm', id: 'bloodied' },
  { level: 13, kind: 'charm', id: 'ironbound' },
  { level: 14, kind: 'charm', id: 'evenkeel' },
  { level: 15, kind: 'charm', id: 'keenedge' },
  // ❌ ARMOUR SLOTS ARE NOT ON THIS LADDER (Thomas, 2026-08-23: *"i don't want to gate armor slots
  // in account level"*). They were, for one build; the argument was that `workshopHTML()` had
  // advertised *"two more to earn"* since it shipped, so the reward already existed.
  // 🔑 THAT ARGUMENT ANSWERED THE WRONG QUESTION. It showed a slot gate was *available*, not that
  // it was *right* — and armour is the one system in the game that is deliberately paid for in
  // MATERIALS, hunted from specific creatures. Putting a second, unrelated gate in front of it
  // makes the Workshop's own currency mean less: you could hold the parts, forge the piece, and
  // still not be allowed to wear it. **Two gates on one system is one gate too many, and the one
  // that has to go is the one that is not the system's own.**
  // ⚠️ The `kind` field stays — the table is still meant to carry things that are not charms. See
  // the account-ladder options in [[Charm_Pools]]; characters are the agreed next one.
  // 🎭 THE CLASS LADDERS — read against that class's OWN level, so each is walked separately and
  // every future class brings its own. ⚠️ Same legible→conditional ordering, in miniature.
  { level: 2,  kind: 'charm', id: 'coldiron' },         // ✦ simplest: unattuned strikes +3
  { level: 3,  kind: 'charm', id: 'secondflame' },      // ✦ the first that changes an arrangement
  { level: 4,  kind: 'charm', id: 'kindledarsenal' },   // ✦
  { level: 5,  kind: 'charm', id: 'threekind' },        // ✦ the payoff
  { level: 2,  kind: 'charm', id: 'twinblades' },       // 🗡️
  { level: 3,  kind: 'charm', id: 'deepcut' },          // 🗡️
  { level: 4,  kind: 'charm', id: 'secondnature' },     // 🗡️
  { level: 5,  kind: 'charm', id: 'deadhand' },         // 🗡️
];
const UNLOCK_AT = {};
for (const u of UNLOCKS) UNLOCK_AT[u.id] = u.level;
// ⚠️ THE ACCOUNT CAP COUNTS GENERIC RUNGS ONLY. Class rungs are numbered 2-5 against a different
// bar entirely, so folding them in would have capped the account ladder at 5 and frozen it there.
const LEVEL_CAP = UNLOCKS.reduce((m, u) => !unlockCls(u) ? Math.max(m, u.level) : m, 1);
// 🐛 A TABLE THAT NAMES A CHARM THAT DOES NOT EXIST IS A LEVEL THAT UNLOCKS NOTHING, silently —
// the player reaches it, the log says nothing, and the pool never grows. Fail at load instead.
for (const u of UNLOCKS) {
  if (u.kind === 'charm' && !CHARMS.some(c => c.id === u.id))
    throw new Error('UNLOCKS names a charm that does not exist: ' + u.id);
  if (u.kind !== 'charm' && !u.label)
    throw new Error('a non-charm unlock needs a label, or the bar promises nothing: level ' + u.level);
}
// ⚠️ A LEVEL NUMBER IS AMBIGUOUS NOW — level 2 exists on three ladders. Every reader must say
// which one it means, or the account bar would promise you the mage's Cold Iron.
function unlocksAt(lv, cls) { return UNLOCKS.filter(u => u.level === lv && unlockCls(u) === (cls || null)); }
function unlockName(u) { return u.label || (CHARMS.find(c => c.id === u.id) || {}).name || u.id; }
// which ladder a row belongs to: a class charm to that class, everything else to the account.
// ⚠️ A `function` DECLARATION, and this one is not a preference — `LEVEL_CAP` calls it at LOAD
// time from further up the file, and a `const` arrow would sit in the temporal dead zone and
// throw before the game ever booted. **Fourth time in three builds that the const/let vs function
// binding rule has cost something.** If a helper is used by anything evaluated at load, declare it.
function unlockCls(u) { const c = u.id && CHARMS.find(x => x.id === u.id); return (c && c.cls) || null; }

// ✅ AND HERE IS WHERE THE SIMULATION ENDS (2026-08-23). The gate above was `c.tier <= stageTier()`
// — the stand-in. It now reads the account level, which is what that note always said it was
// waiting for. `tier` survives as the COMPLEXITY BAND (it is what orders `UNLOCKS`), but it no
// longer gates anything on its own.
// ⚠️ EVERY LADDER NUMBER ON RECORD WAS MEASURED THROUGH THE OLD GATE. 37/35/33/27 was taken with
// `tier <= stage`, i.e. a pool of 9 at stage 1 rising to 23 at stage 4. A max-level account now
// carries all 23 into stage 1. **The stage curve is a BAND now, not a line** — measure it at
// level 1 and at MAX_LEVEL and quote both, because neither one alone is the game.
function stageTier() { return (S && S.dragon && S.dragon.stage) ? Math.max(1, S.dragon.stage) : 1; }
// 🔑 THE WHOLE HYBRID, IN ONE LINE: a charm unlocks on whichever bar owns the rule it names.
function charmUnlocked(c) {
  const at = UNLOCK_AT[c.id];
  return !at || at <= (c.cls ? classLevel(c.cls) : accountLevel());
}
// 🔑 AN ELEMENT GATE IS A CLASS GATE IN DISGUISE (2026-08-18). Thomas, at the Wheel:
// *"i have a charm for fire cards but im playing rogue"* - and 🔥 Emberheart can never once fire
// for her, because every rogue card has `element: null`. Four charms are like this
// (Emberheart, Tideglass Bead, Storm Pin, Nightveil) and all four are marked GENERIC.
// ⚠️ They were correctly generic when only one class existed. *"Generic" meant "not
// class-specific", and an element gate did not look like a class gate until a class without
// elements turned up.* [[Charm_Pools]] even reasoned that element gating was fine "because an
// element is on the card's face" - true, and only true for the mage.
// ⚠️ A dead offer is worse than a missing one: it takes a slot on a three-card shelf and it
// costs a re-spin to clear.
const classHasElements = () => (CLASS.defs || []).some(d => d && d.element);
// ⚠️ TWO GATES, NOT ONE (2026-08-18). Thomas, at the Wheel as the rogue: *"mage charm while
// playing rogue"* - ✦ Loose Weave, which is `cls: 'mage'` and rewrites how ATTUNING works, a rule
// she does not have. 🔑 THE EXPLICIT GATE WAS THE ONE MISSING: three charm pools (the Wheel and
// two event grants) filtered on tier, curse and rarity but never on `cls` at all. `classCharmPool()`
// - used only by 🏕️ Setting Out - was the single place that ever checked it, so the rule
// existed and simply was not applied where charms are actually bought.
// ⚠️ I touched this exact line an hour ago to add the ELEMENT gate and did not notice the class
// gate missing beside it. Fixing one half of a check is how the other half stays broken.
// ⚠️ THREE GATES. The third found two more dead entries after Thomas asked what Twin Blades
// meant and the audit widened: ➕ Deep Tinderbox (+1 Surge) and the 💧 Damp Wick CURSE (−2 Surge)
// both name a stat the rogue does not have. 🔑 THE CURSE IS THE WORSE OF THE TWO - a dead charm
// wastes an offer, a dead CURSE is a free pass, and a run-layer penalty that skips one class is a
// difficulty difference nobody chose.
const charmFitsClass = c =>
  (!c.cls || c.cls === CLASS.id) &&                        // whose charm is it
  (!(c.mods && c.mods.el) || classHasElements()) &&        // can this class use an element gate
  (!(c.mods && c.mods.boost != null) || !!CLASS.boosts);   // does this class even have a ➕ Surge

const potionById = id => POTIONS.find(p => p.id === id) || null;
// 🗺️ tiered like the charms: a land's own potion is not on the shelf before that stage
const potionPool = () => POTIONS.filter(p => (!p.cls || p.cls === CLASS.id) && (!p.when || p.when()) &&
                                             (!p.tier || p.tier <= stageTier()));
function potionCan(p, card) { return !p.pick || !p.can || p.can(card); }
function potionTargets(p) { return S.hand.filter(c => potionCan(p, c)); }

// 🧪 drink it. Untargeted potions fire at once; a `pick` potion arms a card picker.
function usePotion(id) {
  if (!isAssignPhase()) return;
  const p = potionById(id); if (!p || !(S.potions || []).includes(id)) return;
  if (p.pick) {
    if (!potionTargets(p).length) { log(`Nothing in your hand can take the ${p.name}.`, 'bad'); render(); return; }
    S.potionPick = (S.potionPick === id) ? null : id;
    render();
    return;
  }
  spendPotion(id);
  applyPotion(p, null);
  render();
}
function usePotionOn(cardId) {
  const p = potionById(S.potionPick); if (!p) return;
  const card = cardById(cardId); if (!card || !potionCan(p, card)) return;
  S.potionPick = null;
  spendPotion(p.id);
  applyPotion(p, card);
  render();
}
function cancelPotion() { S.potionPick = null; render(); }
function spendPotion(id) {
  const i = (S.potions || []).indexOf(id);
  if (i >= 0) S.potions.splice(i, 1);
}
function applyPotion(p, card) {
  const fx = S.potionFx;
  if (p.id === 'chalkwater'){ fx.init += 2;  log(`🧪 ${p.name} — 💨 +2 Initiative this turn.`, 'good'); }
  if (p.id === 'broth')    { fx.value += 2; log(`🧪 ${p.name} — ⚔️ +2 to your action this turn.`, 'good'); }
  if (p.id === 'grit')     { fx.soak += 1;  log(`🧪 ${p.name} — 🛡️ every card blocks +1 this turn.`, 'good'); }
  if (p.id === 'bitterroot'){ fx.boost += 3; log(`🧪 ${p.name} — ➕ your Surge gives +3 more this turn.`, 'good'); }
  if (p.id === 'roaddust') { fx.pace += 3;  log(`🧪 ${p.name} — 🌙 +3 Pace against the dark.`, 'good'); }
  if (p.id === 'tallow')   { fx.keepCandle = true; log(`🧪 ${p.name} — 🕯️ your candle will hold, whatever happens.`, 'good'); }
  if (p.id === 'haste')    { fx.init += 5;  log(`🧪 ${p.name} — 💨 +5 Initiative this turn.`, 'good'); }
  if (p.id === 'ember')    { fx.value += 6; log(`🧪 ${p.name} — ⚔️ +6 to your action this turn.`, 'good'); }
  if (p.id === 'ironskin') { fx.soak += 3;  log(`🧪 ${p.name} — 🛡️ every card blocks +3 this turn.`, 'good'); }
  // 🎯 SPLITTING DRAUGHT - the one-turn version of the whole idea, and the cheapest teacher of
  // it: you drink it, watch ◆12 become ◆6×2, and learn what multi-hit is for in one encounter.
  if (p.id === 'splitting'){ fx.hits = (fx.hits || 0) + 1; log(`🧪 ${p.name} — 🎯 your strike SPLITS IN TWO this turn.`, 'good'); }
  if (p.id === 'clarity')  { lightCandle('the draught clears your sight'); }
  if (p.id === 'nightglass'){ fx.noNight = true; log(`🧪 ${p.name} — 🌙 the dark cannot catch you this journey.`, 'good'); }
  if (p.id === 'breath')   { fx.unspent = true; log(`🧪 ${p.name} — ✦ your Spell survives this casting.`, 'good'); }
  if (p.id === 'quench')   { fx.noShape = true; log(`🧪 ${p.name} — 🛡️ its guard means nothing this turn.`, 'good'); }
  if (p.id === 'skyglass') { fx.noEvade = true; log(`🧪 ${p.name} — 🌀 it cannot slip your blow this turn.`, 'good'); }
  if (p.id === 'stillwater'){ fx.noCounter = true; log(`🧪 ${p.name} — 🛡️ nothing strikes back this turn.`, 'good'); }
  if (p.id === 'hardtack') { fx.tpCut += 1; log(`🧪 ${p.name} — ⏳ any Time Penalty is 1 lighter.`, 'good'); }
  if (p.id === 'deepcurrent'){ fx.winInit = true; log(`🧪 ${p.name} — 💨 you move first, whatever it is.`, 'good'); }
  if (p.id === 'solvent')  { fx.holdCatalyst = true; log(`🧪 ${p.name} — ✦ your Catalyst stays in hand.`, 'good'); }
  if (p.id === 'gravewax') { log(`🧪 ${p.name} — ` + evRecoverCard('last'), 'good'); }
  if (p.id === 'salve')    { card.level++; log(`🧪 ${p.name} — ${displayName(card)} is mended to Lv${card.level}.`, 'good'); }
  if (p.id === 'prism')    {
    const el = elOf(spellCard());
    fx.swap[card.id] = el;
    log(`🧪 ${p.name} — ${card.def.name} runs ${el} for this turn.`, 'good');
  }
}
function zoneOf(cardId) { return ZONES.find(z => S.assign[z] === cardId) || null; }

// 🧪 a Prism Vial rewrites what a card IS for one turn — and because every element check in
// the game funnels through here (attuning, banking, charms, Three of a Kind), that is the whole
// implementation. One hook, no exceptions scattered through the maths.
function elOf(card) {
  const sw = S.potionFx && S.potionFx.swap;
  if (sw && card && sw[card.id]) return sw[card.id];
  return card.def.element;
}

// ============================================================
// logging
// ============================================================
function logHeader(text) { S.logEntries.unshift({ header: text, lines: [] }); }
// ⚠️ NEVER THROW. log() is called from dozens of places and used to assume a header already
// existed - which was true only because nextTurn() always wrote one first. The map opens the run
// on a screen that is not a turn, so the first log() of a run had no entry to write into and took
// the whole boot down with it.
// 🔑 A LOGGING HELPER THAT CAN CRASH THE CALLER IS WORSE THAN NO LOG.
function log(text, cls = '') {
  if (!S.logEntries) S.logEntries = [];
  if (!S.logEntries[0]) S.logEntries.unshift({ header: '', lines: [] });
  S.logEntries[0].lines.push({ text, cls });
}

// ============================================================
// turn flow
// ============================================================
// ============================================================
// 🗺️ THE MAP (2026-08-18) — Slay the Spire's run layer, adapted.
// Thomas: *"not liking this forking thing, do we just have 2 choices every time? yeah i don't
// like that. was thinking we literally just take slay the spires map run layer."*
//
// 🔑 THE FORK WAS THIN BECAUSE OF NODE VARIETY, NOT BRANCHING. Three node types, two of which
// were "play a hand", makes every choice the same choice. StS's map is interesting because it has
// SIX kinds of room - and three of ours already existed as systems that simply fired automatically
// (the Wheel, the Forge, and the events). **Putting a guaranteed step on the map turns it into a
// choice**, which is this morning's event lesson applied to the shop.
//
// ⚠️ AND A MAP IS PILLAR-LEGAL, WHICH I FIRST GOT WRONG. [[Game_Pillars]] bans *"complete
// optimizable data"* - but StS shows node TYPES, never CONTENTS. You see *elite, then rest*; you
// never see which elite. That is direction, not calculation. The 🕯️ candle still owns contents.
//
// The algorithm (wiki + sts_map_oracle): N paths walked upward through a grid, each step moving
// to col-1/col/col+1, with a no-crossing rule and a unique-destination rule; then room types are
// rolled by weight and re-rolled until every constraint holds.
// ============================================================
// ⚠️ `let`, not `const` - these are TUNING constants and the sweep sets them (same reason
// ATTUNE_BONUS and FORK_ENABLED are let). A const here throws inside the headless harness.
let MAP_FLOORS = 16;          // 4 region bands of 4 - the band decides which pool a node draws from
let MAP_COLS   = 5;           // StS uses 6; we are on a phone and the map is a dialog
let MAP_PATHS  = 6;           // paths walked upward. More paths = wider, more connected map
let MAP_BAND   = 4;           // floors per region band

// ⚠️ WEIGHTS, and they are OURS not StS's - we have no treasure room and two "normal" types.
// 'normal' resolves to a fight or a journey from the band's own pool, so it keeps the 50/50 the
// encounter bag already has.
const MAP_WEIGHTS = [
  { type: 'normal', w: 55 },
  { type: 'event',  w: 20 },
  { type: 'hearth', w: 11 },   // 🕯️ rest: relight the candle
  { type: 'elite',  w: 12 },   // 🐉 a harder creature paying more coins
  // ❌ 🎰 THE WHEEL NODE IS CUT (2026-08-18, measured). It was built on a premise I never
  // checked: that the shop fired at region breaks and the map would turn it into a choice. It does
  // not - **the Wheel has always opened after EVERY encounter** - so the node handed you a screen
  // you would have reached anyway after the next fight, and cost you a floor to do it.
  // 🔑 A NODE THAT GIVES YOU SOMETHING YOU ALREADY GET IS A WASTED FLOOR.
  // ⚠️ And the alternative was measured before it was argued. Making the shop node-ONLY:
  //   shop opens 12.4 -> 1.9 · levels bought 7.5 -> 4.3 · **deck at the lair 35.5 -> 32.0, exactly
  //   where it started** · 🪙 unspent at the lair 4 -> **28** · duel 61% -> 31%.
  // 🔑 THE CONSTRAINT STOPS BEING COINS AND BECOMES SHOP ACCESS - you cannot spend money you
  // cannot reach, so more income cannot fix it. Thomas called this before the measurement did:
  // *"youll have hoarded a bunch of coin possibly."*
  // (`takeMapNode` still handles type 'wheel' so saves made before this still load.)
];
// ⚠️ THE WEIGHTS WERE TUNED AGAINST THE *BEST ROUTE*, NOT THE AVERAGE ONE, AND THAT IS THE WHOLE
// POINT OF A MAP. Measured over 1200 maps at these weights: 🎰 3.2 on the map, **2.1 reachable by a
// player who routes for them, 0.9 by a random walk**; 🐉 2.6 on the map, 1.8 best route, 0.7 random.
// 🔑 THAT GAP *IS* THE DECISION. A node type whose best route and random walk are the same
// number is decoration - you would get it anyway. Tune map content by asking *what can someone who
// WANTS this get*, never by the average.
// ⚠️ Today the Wheel fires 4 times a run, guaranteed. Routing hard now gets ~2, ignoring it ~1,
// so the coin economy is knowingly loosened-then-tightened and MUST be re-measured before it is
// called balanced. 🔑 The Wheel keeps SHARPENING on the same screen - that was a considered call
// (*a budget decision you cannot see both sides of is two guesses*) and the map does not reopen it.

// ⚠️ Floors are 0-indexed here. Constraints mirror StS's, scaled to 16 floors from 15:
//   • nothing but a normal encounter on floor 0        (StS: floor 1 is always an easy fight)
//   • no elite / hearth / wheel below MAP_SPECIAL_FLOOR (StS: nothing special below floor 6)
//   • the last floor is always a 🕯️ hearth              (StS: floor 15 is always a rest)
//   • no hearth on the floor before that                (StS: no rest on floor 14)
//   • elite / wheel / hearth are never CONSECUTIVE along an edge
//   • a node with 2+ exits must have all destinations distinct
let MAP_SPECIAL_FLOOR = 4;
let MAP_STARTS = 3;             // 🗺️ roads leaving the gate, always this many
// 🐉 an elite is the band's own creature, harder and richer. Untuned on purpose - it is a new
// reward channel and the whole coin economy is being re-measured anyway.
// 💀 AN ELITE HAS TO BE WORTH AVOIDING (Thomas: *"i think we should make something hard for
// the elites, and have better rewards for going against an elite node"*).
// ⚠️ At ×1.5 HP and +2 atk it was a slightly bigger creature — a detour with no dread in it.
// The reward is the 💀 BOON below, so the danger has to justify a real prize.
// 🔴 ELITE_HP 2.0 → 1.15 (2026-08-24). ×2.0 put the KILL past any four-card hand — you beat an
// elite 1-3% of the time and lost it 54-65%, so the node had NO WIN STATE and the charm had to be
// paid for merely surviving. 🔑 THE AXES WERE THE WRONG WAY ROUND: an elite was HARD TO BEAT and
// CHEAP TO SURVIVE. It wants to be BEATABLE and EXPENSIVE. ⚠️ **ELITE_ATK IS DELIBERATELY
// UNTOUCHED** — the average hit an elite lands measured 9.5–10.6 (mage) at every HP setting from
// ×2.0 down to ×1.0, because Complete is your damage vs its HP while the hit is its atk.
// **Lowering HP does not make an elite safer, only winnable.**
// ⚠️ `let` — tuning constants, and the sweep sets them (a const throws in the harness).
// 🔴 AND ELITE_ATK +4 → +8 IN THE SAME COMMIT, WHICH IS THE OTHER HALF OF ONE DESIGN, NOT A
// SECOND CHANGE. ⚠️ **Damage only lands on a Narrow or a Loss**, so dropping HP did not just make
// the kill reachable — it turned ~30% of elite encounters from *"took a big hit"* into *"took
// nothing"*, and the ladder rose +10 (mage) / +14 (rogue) on the same seeds. 🔑 I HAD MEASURED
// THE SIZE OF THE HIT AND CONCLUDED ABOUT THE COST: the per-hit figure held at 9.5-10.6 across
// every HP setting, but the number of hits collapsed. *A hit size is not a bill.*
// ✅ +8 buys the difficulty back where the design wants it — an elite hits **14.5 against an
// ordinary creature's 5.8** (mage), 2.5×, which is the dread stated in the one number a player
// watches. ⚠️ FALLBACK: if elites read as muggings rather than as fights, ELITE_ATK goes back to 4
// and the run is simply ~10 points easier. Do NOT answer that by raising HP again — that is the
// change that deletes the win state.
let ELITE_HP = 1.15, ELITE_ATK = 8, ELITE_COIN = 2.5;
// 🐉 one place that makes an elite, so the map's preview and the fight itself cannot disagree.
function eliteVersion(e) {
  if (!e) return e;
  return Object.assign({}, e, {
    // ⚠️ baseName is what makes an elite RELOADABLE. An elite is a modified COPY with a changed
    // name, so it cannot be found again in the region's list - saving the base and rebuilding
    // through this same function is the only way the reload cannot drift from the original.
    name: `${e.name}, grown bold`, baseName: e.name, elite: true,
    hp: e.hp != null ? Math.round(e.hp * ELITE_HP) : e.hp,
    mp: e.mp != null ? Math.round(e.mp * ELITE_HP) : e.mp,
    atk: e.atk != null ? e.atk + ELITE_ATK : e.atk,
    xp: Math.round((e.xp || 0) * ELITE_COIN),
  });
}

// ⚠️ `kind` is fight-or-journey, decided AT GENERATION so the node can advertise it. Without it
// every ordinary node drew ⚔️ and the icon was a lie on the half of them that turned out to be
// journeys. 🔑 A map node's whole job is to state what it is; an icon that is right 50% of the
// time is worse than no icon, because it is trusted.
function mapNode(f, c) { return { f, c, type: 'normal', kind: 'fight', next: [], enc: null, done: false }; }

// 🎓 THE TUTORIAL'S MAP (2026-08-23, Thomas: *"yeah do a tutorial map, with authored encounters"*).
//
// 🔴 THE GAP IT CLOSES: stage 0 was a linear list of eight encounters while every real run OPENS on
// the map screen. A new player was taught a structure the game no longer has, then met the first
// decision of every run with no preparation. The map landed six days after the last tutorial audit
// and nothing connected the two.
//
// 🔑 THE TENSION, AND HOW IT IS RESOLVED: the tutorial is deterministic **on purpose** — fixed
// seed, authored deck order, authored encounter order — so lessons fire in a planned sequence. A
// map introduces choice, which breaks that. So the map is built in two halves:
//   • **Region 1 (floors 0-3) is a SPINE.** One node per floor, no choice. You learn that a node is
//     a thing you tap and that the road runs upward — and the authored teaching order is exact.
//     ⚠️ This deliberately breaks the real map's *"the first floor must be a choice"* rule. That
//     rule exists so a RUN opens on a decision; the tutorial's first floor exists so a PLAYER
//     learns what a node is. **Teach the noun before the verb.**
//   • **Floor 4 is an ❓ EVENT** — a single node, taught where a screen full of reading lands best:
//     after the turn is understood, before the map asks its first question.
//   • **The FORK (floors 5-6).** Two nodes a floor, always a ⚔️ fight and a 👣 journey —
//     the clearest possible statement of what the map is for: *you choose which kind of problem to
//     take.* Both branches rejoin, so no lesson can be missed by routing.
//   • **Floor 7 is the 🕯️ hearth**, mirroring the real map's fixed rest before the lair — which
//     also teaches the hearth, previously untaught anywhere.
//
// 🖼️ THE FORK IS EXACTLY TWO FLOORS BECAUSE THAT IS WHAT THE ART COVERS. A three-floor fork
// needs six encounters in region 2 and there are four; the first cut of this map invented two
// (⚔️ Ashback, 👣 The Guttering Stair) and **silently broke the tutorial's 100% art coverage** —
// on the one screen every player sees first, in the build about to go to friends.
// 🔑 `foeArt()` returning nothing on a miss is correct (*art never blocks design*) and is exactly
// why the hole was invisible from the code. **Content authored without art is content that looks
// broken and reads as finished.** `dev/art-check.js` exists now so this cannot recur quietly.
// ✅ Shrinking the fork was the better fix than commissioning two pictures: no new content, the
// coverage stays complete, and a two-floor fork still means **you genuinely skip half of region 2**,
// which is what makes the choice real and gives the 🕯️ candle something worth reading.
//
// ⚠️ NO `rnd()` ANYWHERE IN HERE. The tutorial's determinism is the thing that makes its lessons
// fire in order; a shuffled tutorial map would quietly reintroduce the problem this solves.
function tutorialMap() {
  const R = TUTORIAL.regions;
  const spine = R[0].encounters;          // 4 — one per floor, no choice
  const fork  = R[1].encounters;          // 4 — a fight and a journey on each of two floors
  const floors = [];
  const C = 2;                            // the tutorial map is two columns wide
  for (let f = 0; f < 8; f++) floors.push(new Array(C).fill(null));
  const put = (f, c, enc, type) => {
    const n = mapNode(f, c);
    n.enc = enc || null;
    n.type = type || 'normal';
    n.kind = enc && enc.type === 'journey' ? 'journey' : 'fight';
    floors[f][c] = n;
    return n;
  };
  // — the spine: floors 0-3, column 0, each pointing at the next
  for (let f = 0; f < 4; f++) put(f, 0, spine[f]).next = [0];
  // — ❓ AN EVENT, floor 4, single node (2026-08-23).
  // 🔴 THE FIRST CUT OF THIS MAP HAD NO EVENT NODE AT ALL, and that was a REGRESSION, not a known
  // gap: the old linear tutorial fired events, and the 2026-08-12 audit is on record saying so
  // (*"the tutorial reaches the Wheel… fires an event, hands you a curse"*). Replacing the queue
  // with a map I built out of `normal` and `hearth` nodes silently deleted both — and the ❓ event
  // and ⚠️ curse lessons went with them.
  // 🔑 **WHEN YOU REPLACE THE THING THAT GENERATED CONTENT, ENUMERATE WHAT IT USED TO GENERATE.**
  // I checked that the lessons still fired and not that the road still contained what they teach.
  // ⚠️ It sits AFTER the spine and BEFORE the fork on purpose: an event is a screen full of reading,
  // and it lands better once the turn is understood and before the map asks its first question.
  put(4, 0, null, 'event').next = [0, 1];
  // — the fork: two floors, a fight on the left and a journey on the right
  for (let f = 5; f < 7; f++) {
    const pair = fork.slice((f - 5) * 2, (f - 5) * 2 + 2);
    const a = put(f, 0, pair.find(e => e.type === 'fight')  || pair[0]);
    const b = put(f, 1, pair.find(e => e.type === 'journey') || pair[1]);
    // ⚠️ both nodes lead to BOTH nodes above, so the branches rejoin every floor and no path can
    // miss a kind of encounter. A tutorial must not let routing hide a lesson.
    const up = f === 6 ? [0] : [0, 1];
    a.next = up.slice(); b.next = up.slice();
  }
  // — the hearth below the lair, exactly as a real map ends
  put(7, 0, null, 'hearth');
  return { floors, pos: null, taken: [] };
}

function generateMap() {
  const floors = [];
  for (let f = 0; f < MAP_FLOORS; f++) floors.push(new Array(MAP_COLS).fill(null));
  const nodeAt = (f, c) => floors[f][c] || (floors[f][c] = mapNode(f, c));

  // —— 1. walk the paths upward
  // ⚠️ the first two paths must START in different columns, or the map opens on a single node
  // and the whole first floor is a non-choice. That is StS's rule and it is load-bearing.
  // 🗺️ EXACTLY MAP_STARTS ROADS OUT OF THE GATE (Thomas: *"slay the spire starts off with
  // like 3 different starts, i think we should just do 3 as well"*).
  // ⚠️ It was 2-5 and usually 4, because starts were rolled per path and collided at random.
  // 🔑 The first choice of a run should be the same SIZE every time - it is the one decision every
  // player makes, and a run that opens on two roads is a different game from one that opens on five.
  const startCols = [];
  { const bag = [];
    for (let c = 0; c < MAP_COLS; c++) bag.push(c);
    while (startCols.length < Math.min(MAP_STARTS, MAP_COLS) && bag.length)
      startCols.push(...bag.splice(Math.floor(rnd() * bag.length), 1));
    startCols.sort((a, b) => a - b); }
  const starts = [];
  for (let p = 0; p < MAP_PATHS; p++) {
    // every path begins on one of the three, so exactly three roads leave the gate
    let c = startCols[p % startCols.length];
    starts.push(c);
    nodeAt(0, c);
    for (let f = 0; f < MAP_FLOORS - 1; f++) {
      const from = nodeAt(f, c);
      // candidate columns, clamped to the grid
      let cand = [c - 1, c, c + 1].filter(x => x >= 0 && x < MAP_COLS);
      // 🔑 NO CROSSING EDGES. If we step right, no node to our right may already run left
      // past us (and vice versa) - two paths swapping columns would draw an X, which reads as a
      // connection that is not there.
      cand = cand.filter(x => {
        if (x === c) return true;
        const side = x > c ? c + 1 : c - 1;
        const sideNode = floors[f][side];
        return !(sideNode && sideNode.next.includes(c));
      });
      if (!cand.length) cand = [c];
      const nc = cand[Math.floor(rnd() * cand.length)];
      if (!from.next.includes(nc)) from.next.push(nc);   // unique destinations, by construction
      nodeAt(f + 1, nc);
      c = nc;
    }
  }

  // —— 2. assign room types
  const pick = () => {
    const tot = MAP_WEIGHTS.reduce((t, x) => t + x.w, 0);
    let r = rnd() * tot;
    for (const x of MAP_WEIGHTS) { r -= x.w; if (r <= 0) return x.type; }
    return 'normal';
  };
  const parentsOf = (f, c) => f === 0 ? []
    : floors[f - 1].filter(n => n && n.next.includes(c));
  const SPECIAL = ['elite', 'wheel', 'hearth'];

  // ⚠️ ONE PREDICATE, USED BY BOTH THE ROLL AND THE FALLBACK. The first version checked the
  // constraints inside the retry loop but then assigned whatever the LAST roll happened to be if
  // all 40 tries failed - so ~1500 maps in 3000 shipped consecutive specials.
  // 🔑 A RETRY LOOP WITHOUT A LEGAL FALLBACK IS NOT A CONSTRAINT, IT IS A PREFERENCE.
  const legal = (t, f, c) => {
    if (!SPECIAL.includes(t)) return true;
    if (f < MAP_SPECIAL_FLOOR) return false;                       // nothing special early
    if (t === 'hearth' && f === MAP_FLOORS - 2) return false;       // no rest right below the fixed rest
    return !parentsOf(f, c).some(pn => SPECIAL.includes(pn.type));  // never consecutive
  };
  // ⚠️ the fixed top-floor rest is assigned FIRST, so the floor below can see it and the
  // "never consecutive" test has something to test against. Assigning it last is what let a
  // 🐉 elite sit directly beneath the guaranteed 🕯️ hearth.
  floors[MAP_FLOORS - 1].forEach(n => { if (n) n.type = 'hearth'; });
  floors[0].forEach(n => { if (n) n.type = 'normal'; });             // the road starts plainly

  for (let f = 1; f < MAP_FLOORS - 1; f++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const n = floors[f][c]; if (!n) continue;
      // ⚠️ a special on the floor below the fixed rest would be consecutive with it
      const touchesTop = f === MAP_FLOORS - 2 && n.next.length > 0;
      let t = 'normal';
      for (let tries = 0; tries < 40; tries++) {
        const r = pick();
        if (legal(r, f, c) && !(touchesTop && SPECIAL.includes(r))) { t = r; break; }
      }
      n.type = t;
    }
  }
  // 🗺️ —— 3. every encounter node gets its ACTUAL encounter now, not on arrival.
  // ⚠️ It has to be decided here or the node cannot advertise what it DEMANDS, and the demand is
  // the only thing that reliably differs between two encounters. Each band draws from its own
  // region's bag, refilled as it empties.
  const bags = {};
  const takeFrom = band => {
    const pool = (RUN()[band - 1] || RUN()[0]).encounters;
    if (!bags[band] || !bags[band].length) bags[band] = shuffle(pool.slice());
    return bags[band].shift();
  };
  for (let f = 0; f < MAP_FLOORS; f++)
    for (let c = 0; c < MAP_COLS; c++) {
      const n = floors[f][c];
      if (!n || (n.type !== 'normal' && n.type !== 'elite')) continue;
      const base = takeFrom(bandOf(f));
      n.enc = n.type === 'elite' ? eliteVersion(base) : base;
      n.kind = n.enc && n.enc.type === 'journey' ? 'journey' : 'fight';
    }
  return { floors, pos: null, taken: [] };
}

// 🗺️ which nodes you may move to right now: floor 0 if you have not started, else the
// current node's `next` on the floor above.
// 🗺️ HOW TALL IS *THIS* MAP. ⚠️ The three readers below asked the global `MAP_FLOORS`, which is
// fine while every map is 16 floors and wrong the moment one is not — the tutorial's is 8, and a
// map whose top the game cannot recognise is a run that never ends.
// 🔑 EXACTLY THE BUG JUST FIXED IN solver.js ONE COMMIT AGO (`REGIONS.length` where `RUN().length`
// was meant), in the same shape: **an object carries the fact, and a reader asks the global
// instead.** The general form is worth stating once: *if the thing in your hand knows, do not ask
// the room.*
const mapFloors = m => (m && m.floors ? m.floors.length : MAP_FLOORS);
function mapChoices(m) {
  if (!m) return [];
  if (!m.pos) return m.floors[0].filter(Boolean);
  const { f, c } = m.pos;
  if (f >= mapFloors(m) - 1) return [];
  const here = m.floors[f][c];
  return (here ? here.next : []).map(x => m.floors[f + 1][x]).filter(Boolean);
}

// 🗺️ the region band a floor belongs to (1-based), so encounter pools and hardship density
// still come from the road's own regions.
// ⚠️ Derived from the ROAD's own region count and the map's own height, so an 8-floor tutorial
// over 2 regions bands correctly (4 floors each) without a branch.
function bandOf(f) {
  const regions = RUN().length;
  const band = Math.max(1, Math.round(mapFloors(S && S.map) / regions));
  return Math.min(regions, Math.floor(f / band) + 1);
}

// ⚠️ EVENT NODES USE ❓, NOT ✦ (2026-08-18). Thomas: *"place on the road should be called an
// event, and with a ? symbol instead of the diamond, too similar with encounter."*
// 🔑 ◇ and ✦ are both small diamonds at 15px - two of the five node types were reading as the
// same glyph, on the one screen whose entire job is telling node types apart. And *"a place on the
// road"* was prose where the map needs a NOUN: every other node says what it IS in one word.
const MAP_LABEL = { normal: 'the road', elite: 'a dangerous thing', event: 'an event',
                    wheel: 'the wheel', hearth: 'a hearth' };
// 🗺️ A NODE ADVERTISES ITS **DEMAND**, NOT ITS GENRE (2026-08-18). Thomas: *"initiative is
// just a number on a card, it doesn't really do anything else. thats why i proposed making an
// encounter node be random between fight and journey, since they are SORTA the same thing."*
// 🔑 HE IS RIGHT ABOUT THE EQUATION AND THE MEASUREMENT AGREES. A fight and a journey score
// `value` with the same line of code; two attempts to split them failed (see [[Blow_And_Distance]]),
// the second structurally. **⚔️ vs 👣 is a distinction without a mechanical difference, and an icon
// that promises a difference the rules do not deliver is worse than no icon.**
// 🔑 BUT THE REAL VARIETY WAS ALREADY THERE, IN THE MODIFIER. Measured over all four roads:
// fights carry a defence SHAPE **88%** of the time (🛡️17 · 🌀30 · 🧱8), journeys carry a PERIL
// only **50%** (⛰️9 · 🕳️9 · 🏔️8 · ⏳9). **The shape is what changes your play; the genre is not.**
// So the map now names what the node DEMANDS, and falls back to a plain road when it demands
// nothing. ⚠️ 31% of encounters demand nothing at all - that is the content gap this exposes, and
// it is the thing worth fixing next.
const DEMAND_ICON = { armour: '🛡️', evasion: '🌀', guard: '🧱',
  Steep: '⛰️', Toll: '⏳', Treacherous: '🕳️', Updraft: '🏔️', Freeze: '❄️' };
const DEMAND_WORD = { armour: 'hit it big', evasion: 'hit it first', guard: 'wear it down',
  Steep: 'the climb takes what you carry', Toll: 'it does not forgive', Treacherous: 'it bites when you fall short',
  Updraft: 'speed shortens it', Freeze: 'it takes your Arsenal' };

function demandOf(n) {
  const e = n.enc;
  if (!e) return null;
  return e.shape || e.shape2 || e.peril || e.ability || null;
}
// ❌ THE MAP DOES NOT SHOW DEMANDS (reverted the same day). Thomas: *"i don't like showing what
// a node demands."* He is right twice over:
// ⚠️ (1) IT IS THE PILLAR. [[Game_Pillars]] is LOCKED on *"hints/direction, not complete
//     optimizable data"* and *"full destination + FUZZY path"*. Every node's demand, visible from
//     floor 0, is a whole run solvable before it starts - the spreadsheet the pillar forbids.
// ⚠️ (2) IT DOUBLE-BOOKS THE 🕯️ CANDLE - the same error I had already found and fixed once. The
//     candle's job is *what is INSIDE the next step*; a map that prints every demand forever
//     leaves it nothing to reveal.
// 🔑 THE DIVISION THAT ACTUALLY WORKS: THE MAP SHOWS THE SHAPE OF THE RUN (types), THE CANDLE
// SHOWS WHAT IS IN THE NEXT STEP. That is what makes a lit candle worth routing toward.
// ✅ And with ⚔️/👣 merged there are exactly four things a node can be, which is a map you can
// read at a glance instead of a wall of symbols.
function mapIcon(n) {
  if (n.type === 'event')  return '❓';
  if (n.type === 'wheel')  return '🎰';
  if (n.type === 'hearth') return '🕯️';
  if (n.type === 'elite')  return '💀';
  return '◇';                                  // an encounter. What kind is the candle's business.
}
function mapTitle(n) {
  if (n.type === 'event' || n.type === 'wheel' || n.type === 'hearth') return MAP_LABEL[n.type];
  if (n.type === 'elite') return 'something dangerous';
  return 'an encounter';
}

// 🕯️ WHAT THE CANDLE BUYS: the nodes you can step to RIGHT NOW give up their contents.
// ⚠️ Only those - a lit candle is one step of sight, not a map key.
// ⚠️ NAMED mapPeek, NOT candleLine - there is already a candleLine() 2,500 lines below, and
// because it is declared later IT WINS. My calls silently invoked the old one, which ignores its
// argument, so every road on the map reported the SAME creature. 🔑 A second function with the
// same name does not error; it just quietly replaces the first.
// 🗺️ which node the pointer (or the first tap) is on
function isPeeked(f, c) { return !!(S.mapPeek && S.mapPeek.f === f && S.mapPeek.c === c); }

// ⚠️ Writes the detail line DIRECTLY rather than calling render(). A full render rebuilds the map
// and re-measures every edge, which would flicker the whole panel on every mouse move.
function peekNode(f, c) {
  S.mapPeek = (f == null) ? null : { f, c };
  const el = document.getElementById('mp-detail');
  if (el) el.innerHTML = peekHTML();
  document.querySelectorAll('#modal-panel .mp-node').forEach(n =>
    n.classList.toggle('is-peek', isPeeked(+n.dataset.f, +n.dataset.c)));
}

function peekHTML() {
  const m = S.map; if (!m) return '';
  const p = S.mapPeek;
  if (!p) return `<span class="dim">${HAS_HOVER ? 'Point at a road to see what is on it.'
    : 'Tap a road to look at it, tap again to take it.'}</span>`;
  const n = m.floors[p.f] && m.floors[p.f][p.c];
  if (!n) return '';
  return mapPeek(n) ||
    `<span class="dim">${mapTitle(n)} — your candle is out, so you cannot see what is on it.</span>`;
}

function mapPeek(n) {
  if (!S.candle || !n.enc) return '';
  const e = n.enc, d = demandOf(n);
  const nums = e.type === 'fight'
    ? `❤️ ${e.hp} · 💨 ${e.init} · ⚔️ ${e.atk} · 🪙 ${e.xp}`
    : `👣 ${e.mp} · 🌙 ${e.nightfall} · ⏳ ${e.timePenalty} · 🪙 ${e.xp}`;
  return `<div class="mp-peek"><b>${e.name}</b> — ${nums}` +
    (d ? ` <span class="mp-dem">${DEMAND_ICON[d] || '◆'} ${DEMAND_WORD[d] || d}</span>` : '') + `</div>`;
}

// ⚠️ `hover: hover` is the honest test - false on a phone, true on a mouse - and it decides
// whether a tap is an inspection or a commitment.
const HAS_HOVER = (() => { try { return window.matchMedia('(hover: hover)').matches; } catch (e) { return true; } })();

// 🗺️ A TAP ON TOUCH LOOKS FIRST AND COMMITS SECOND. On a mouse the hover already showed you
// the road, so the click goes straight through.
// 🔑 NO CAPABILITY TEST AT ALL - the rule is simply *a node you are already looking at is a
// node you may take*. On a mouse, `mouseenter` fires before `click`, so the node is peeked by the
// time the click lands and one click moves you. On touch nothing fires first, so the first tap
// looks and the second takes. Same line of code produces the right behaviour on both.
// ⚠️ The first version branched on `matchMedia('(hover: hover)')`, which reported FALSE on a
// desktop browser here - had that shipped, a mouse user would have needed two clicks per move.
// A CAPABILITY TEST YOU CANNOT VERIFY ON THE TARGET IS A GUESS; derive the behaviour from what
// actually happened instead.
function tapNode(f, c) {
  if (isPeeked(f, c)) { S.mapPeek = null; takeMapNode(f, c); return; }
  peekNode(f, c);
}

// 🗺️ STEP ONTO A NODE. Everything the old fork did, plus the node types the fork never had.
// ⚠️ Crossing a BAND boundary is what a region break used to be: the deck reshuffles and the
// pool changes. That happens here rather than in finishRegionCheck, because the map - not a
// counter - is the run's clock now.
function takeMapNode(f, c) {
  const m = S.map;
  if (!m || S.phase !== 'map') return;
  if (!mapChoices(m).some(n => n.f === f && n.c === c)) return;   // must be reachable from where you stand
  const node = m.floors[f][c];
  const newBand = bandOf(f);
  if (newBand !== S.region) { S.region = newBand; enterBand(); }
  m.pos = { f, c };
  m.taken.push(f + ',' + c);
  node.done = true;
  S.turn++;
  logHeader(`— Turn ${S.turn} (Region ${S.region}) —`);
  // top the hand up on every node - several events and the hearth can thin it
  if (S.hand.length < HAND_SIZE && S.deck.length) draw(HAND_SIZE - S.hand.length);
  S.assign = { Spell: null, Element: null, Boost: null, Reserve: null };
  S.loseReserve = null;
  S.afterSoak = 'upgrade'; S.damage = 0; S.damageEl = null;
  S.emberguardUsed = false;
  S.potionFx = { init: 0, value: 0, soak: 0, boost: 0, pace: 0, tpCut: 0, swap: {} }; S.potionPick = null;
  S.bankArmed = false; S.moTarget = null;
  S.downgraded = new Set(); S.actionSetIds = []; S.reserveId = null;

  if (node.type === 'normal' || node.type === 'elite') {
    // 🗺️ the node already HOLDS its encounter - chosen when the map was drawn, which is what
    // lets it advertise the demand. ⚠️ Falling back to a draw keeps saves made before this working.
    if (node.enc) beginEncounter(node.enc);
    else drawEncounter(null, node.type === 'elite');
    S.phase = 'assign';
    logChallenge();
  } else if (node.type === 'event') {
    S.phase = 'event';
    startEvent();
    return;
  } else if (node.type === 'wheel') {
    S.encounter = null;
    startWheel();
    return;
  } else if (node.type === 'hearth') {
    S.encounter = null;
    S.phase = 'hearth';
    log(`🕯️ A hearth. You stop, and the wick takes light again.`, 'good');
  }
  render();
}

// 🗺️ a band boundary is the old region break: reshuffle everything non-trashed, keep levels.
function enterBand() {
  const pool = shuffle([...S.deck, ...S.discard, ...S.hand]);
  S.deck = pool; S.hand = []; S.discard = [];
  S.encounterQueue = [];
  S.emberShield = false;
  draw(HAND_SIZE);
  log(`— you cross into region ${S.region} —`, 'result');
}

// 🕯️ THE HEARTH IS A CHOICE, NOT A GIFT: take the LIGHT, or work the COALS.
// ⚠️ The first version only relit the candle, which made it the one node with no question in it -
// and it broke the economy besides. The 🔧 Forge lives on the Wheel screen, so putting the Wheel on
// the map cut SHARPENING from 4 guaranteed stops a run to 1.3. Measured: the deck reached the lair
// at **32.3-33.7 total levels against a start of 32 and a par of 36/44/48/52** - it was arriving
// with essentially nothing bought.
// 🔑 StS solved this years ago and the answer was in front of me: its campfire is *Rest OR
// Smith*. One node, two goods, and you cannot have both.
// 🔑 It also passes the slot-③ bar that four in-turn forks have failed: **two answers that are
// each correct in a real situation** - the light when you are walking blind into a hard stretch,
// the level when your deck is falling behind par.
function hearthLight() {
  if (S.phase !== 'hearth') return;
  S.candle = true;
  log(`🕯️ You take the light. The wick burns steady — you can see what lies ahead.`, 'good');
  backToMap();
}
function hearthForge(id) {
  // ⚠️ 'hearthpick', NOT 'hearth' - the picker moves the phase before this is ever called, so
  // guarding on the wrong one made every call a silent no-op. The bot then hammered it **697 times
  // a run**, spinning in the phase until the 800-step guard aborted the run: turns fell 15 → 10,
  // the deck arrived 6 levels lighter and the mage duel read 0%.
  // 🔑 A GATE NAMING THE WRONG PHASE DOES NOT ERROR, IT STALLS - and a stalled bot reports the
  // stall as a BALANCE RESULT. This is the documented RUNSIM failure mode, reached from a new
  // direction: not an untaught phase, but a taught phase whose action refused to fire.
  if (S.phase !== 'hearthpick') return;
  const card = cardById(id);
  if (!card || card.level >= MAX_LEVEL || S.downgraded.has(card.id)) return;
  card.level++;
  log(`🔧 You work the coals — <b>${card.def.name}</b> sharpens to Lv${card.level}.`, 'good');
  backToMap();
}
// ⚠️ the hearth sharpens for FREE and deliberately so: it is the half of the choice you pay for
// with the candle, not with coins. A hearth that charged would just be a small Wheel, and the
// question would collapse back into *do I have money*.
function hearthForgeable() { return S.hand.filter(c => c.level < MAX_LEVEL && !S.downgraded.has(c.id)); }

// 🧵 MEND — take back a card that damage took off you for good (Thomas, 2026-08-18).
// 🔑 THIS IS THE HEAL THE HEARTH WAS MISSING, AND IT IS THE ONLY ONE DECK-AS-HEALTH ALLOWS. In
// StS a campfire is *Rest or Smith* - rest restores HP. Our HP is the deck, so the honest analogue
// is not un-softening a card, it is **getting a lost one back**. Until now damage was strictly
// one-directional: cards left the run and never returned except through one paid event.
// 🔑 AND IT IS WHAT MAKES THE LAST HEARTH A REAL DECISION. 🪙 1 card of duel stamina ≈ 8 points
// of win rate (measured 2026-08-05), so on the eve of the duel *mend* and *sharpen* are two
// genuinely different answers - stamina against power - which is exactly the bar four in-turn
// forks have failed.
// ⚠️ The last card lost, not a chosen one: `evRecoverCard('last')` is the existing precedent
// (the Ashfield event) and it keeps the slot row as the only place a card is ever drawn.
// ⚠️ FREE, like the forge. The price of every hearth option is the other two.
// ⚠️ YOU PICK WHICH ONE, AND YOU SEE THEM (Thomas, 2026-08-18): *"a window should pop up with
// all the cards you lost, and you get to pick 1."*
// 🔑 THE PROJECT'S OWN RULE SAYS THE SAME THING - *never ask for a choice about an object without
// showing the object; pickers belong ON the card.* Taking "the last one lost" was cheap of me: by
// the lair you have usually lost two or three, they are rarely interchangeable, and the whole
// decision is which hole in the deck hurts most.
// ⚠️ These are the ONE set of cards not in your hand, so they render inside the window rather
// than in the slot row - which leaves *the slot row is the only place a HAND card is drawn* intact.
function startMendPick() { if (S.phase === 'hearth' && S.trashed.length) { S.phase = 'mendpick'; render(); } }
function cancelMendPick() { if (S.phase === 'mendpick') { S.phase = 'hearth'; render(); } }
function trashedById(id) { return S.trashed.find(c => c.id === id) || null; }

function hearthMendPick(id) {
  if (S.phase !== 'mendpick') return;
  const i = S.trashed.findIndex(c => c.id === id);
  if (i === -1) return;
  const card = S.trashed.splice(i, 1)[0];
  card.level = 1;
  S.deck.push(card);
  log(`🧵 <b>${displayName(card)}</b> is yours again — battered, back at Lv1, and now at the bottom of your deck.`, 'good');
  backToMap();
}
// ⚠️ THE PICKER IS ON THE CARD, like every other picker in the game - never a list of names.
function startHearthPick() { if (S.phase === 'hearth' && hearthForgeable().length) { S.phase = 'hearthpick'; render(); } }
function cancelHearthPick() { if (S.phase === 'hearthpick') { S.phase = 'hearth'; render(); } }

// 🛤️ THE FORK IN THE ROAD (2026-08-18) - spec in [[The_Fork_In_The_Road]].
// Thomas: *"what if we did it like slay the spire with branching paths that you select where to
// go… to give the player some agency and choice, instead of just being completely random."*
//
// ⚠️ IT IS A FORK, NOT A MAP, AND THAT IS A PILLAR DECISION. [[Game_Pillars]] is LOCKED on
// *"all planning is soft & directional, never hard & calculated… hints/direction, NOT complete
// optimizable data"* and *"full destination + FUZZY path"*. A whole region laid out in advance is
// exactly the spreadsheet that forbids; two nodes at a time is direction without calculation.
//
// 🔑 THE POOL FITS EXACTLY, WHICH IS WHY THIS COSTS NO CONTENT: a region holds 8 encounters and
// spends REGION_ENCOUNTERS (4). Offering 2 a turn consumes all 8 across the region - **you see
// everything the region has and take half of it.**
//
// ⚠️ THE BRANCH NOT TAKEN IS DISCARDED, NOT RETURNED. Putting it back would let the same
// creature be offered three turns running, and the *"i was seeing the same ones a lot"* report is
// about exactly that feeling.
function offerFork() {
  const region = RUN()[S.region - 1];
  const refill = () => S.tutorial ? region.encounters.slice() : shuffle(region.encounters);
  if (S.encounterQueue.length === 0) S.encounterQueue = refill();
  const a = S.encounterQueue.shift();
  if (S.encounterQueue.length === 0) S.encounterQueue = refill();
  // ⚠️ prefer a branch of a DIFFERENT TYPE when the bag allows it. Two fights is a weaker
  // question than a fight against a journey, and the bag is half and half by construction.
  let bi = S.encounterQueue.findIndex(e => e.type !== a.type);
  if (bi === -1) bi = 0;
  const b = S.encounterQueue.splice(bi, 1)[0];
  S.fork = [a, b].filter(Boolean);
  return S.fork;
}

// 🛤️ the player picks a branch; the other is gone.
function takeFork(i) {
  if (S.phase !== 'fork' || !S.fork || !S.fork[i]) return;
  const chosen = S.fork[i];
  const other = S.fork[1 - i];
  S.fork = null;
  log(`🛤️ You take the road toward ${chosen.name}${other ? ` — ${other.name} is left behind` : ''}.`);
  beginEncounter(chosen);
  S.phase = 'assign';
  logChallenge();
  render();
}

// 🐉 `elite` scales the drawn creature rather than needing its own table - a harder version of
// whatever the band offers, paying more. ⚠️ CONTENT IS CLASS-BLIND: hp/init/atk/mp and coins only,
// never an element or a pair.
function drawEncounter(avoidType, elite) {
  const region = RUN()[S.region - 1];
  if (S.encounterQueue.length === 0) S.encounterQueue = S.tutorial ? region.encounters.slice() : shuffle(region.encounters);
  // normal turns take the next in the shuffled bag; a caller may steer toward a DIFFERENT
  // type (its whole purpose) — falling back to next-in-bag only if the bag has no other type left.
  let idx = 0;
  if (avoidType) {
    const diff = S.encounterQueue.findIndex(e => e.type !== avoidType);
    if (diff !== -1) idx = diff;
  }
  let picked = S.encounterQueue.splice(idx, 1)[0];
  if (S.encounterQueue.length === 0) S.encounterQueue = S.tutorial ? region.encounters.slice() : shuffle(region.encounters);
  if (elite && picked) picked = eliteVersion(picked);
  beginEncounter(picked);
}

// 🛤️ EVERYTHING THAT HAPPENS ONCE AN ENCOUNTER IS SETTLED - split out of drawEncounter so the
// ⚠️ Every path into an encounter runs the identical setup — that is the point of this function.
// ⚠️ The hardship is rolled HERE, i.e. AFTER the branch is chosen. Rolling it per-branch at offer
// time would double the rolls and let a player shop for a hardship-free road, which turns a risk
// into a filter - the *"a hardship must stay a risk, not become a tax"* rule, from the other side.
// ⚔️ HOW HARD THE ROAD HITS — the one dial for "does damage matter" (2026-08-22).
//
// Thomas: *"feels like getting damaged has been inconsequential."* 📏 Measured, and he is right in
// a way the raw numbers do not show: **the deck is not a health bar, it is an XP bar with a tax.**
// Across a whole run her total card levels go **32 → 34** — the deepest dip is **1.8 levels out of
// 32**, and 41% of runs never dip below their starting point at all. 🔑 THE CAUSE IS NOT THAT THE
// DAMAGE NUMBERS ARE SMALL — IT IS THAT UPGRADES OUTPACE THEM. You take ~1.7 a turn, soak about
// 0.7 of a card level, and buy back more than that at the Wheel. **The bar only rises.**
// ⚠️ That also explains why a defensive option reads as boring: *you cannot make a defensive choice
// appealing while the thing it defends against is inconsequential.* Fix the damage, and every
// defensive choice in the game gets more interesting for free — none of them need touching.
//
// 🔑 APPLIED HERE, AT THE DRAW, AND NOWHERE ELSE. `e.atk` is read in ten places — two maths sites
// and eight DISPLAYS. Multiplying at the maths sites would make every panel, log line and briefing
// print a number the game does not use. Scaling the encounter as it is drawn keeps one truth.
// ⚠️ CLASS-BLIND BY CONSTRUCTION, which is what makes it a legal dial: it touches `atk` only, never
// an element or a pair, exactly as [[The_Roads]] requires of content.
// ⚠️ AND IT IS COUPLED TO PAR. Harder hits mean fewer levels at the lair, and the lair is measured
// against `dragon.par` (36/44/48/52) — so raising this makes the DRAGONS harder for free. Re-read
// par before blaming a dragon for anything after moving it.
// 🔴 1.5 → 1.0 (2026-08-23) — THE WORKAROUND OUTLIVED ITS CAUSE.
// It was raised to 1.5 because *one card covered 72% of hits* and soaking was a lookup. But that
// was true because ONE ARCHETYPE had plates three to five times everyone else's: the mage's WARD
// spike ran +3 a level, so a Lv2 Cairnguard blocked 8 and a Lv4 blocked 14 while every other card
// in the game sat between 1 and 4. 🔑 The designated victim was a DATA problem wearing a damage
// problem's clothes. WARD armour is 2/3/4/5 now, and the multiplier can go home.
// 📏 Measured against the compressed plates: at ×1.0 one card covers 39% of hits — BETTER than
// the 45% the ×1.5 workaround bought on the old plates, and bought by fixing the cause instead.
// ⚠️ ×1.25 holds an even sharper soak (25%) but reopens a 12-point class gap, because the plate
// compression already fell far harder on the mage (her mean plate 2.9 → 2.1; the rogue's 1.5 → 1.4).
//
// 🔥 1.0 → 1.15 (2026-08-23), AND THIS ONE IS A FEEL-REPORT, NOT A MEASUREMENT.
// Thomas: *"i definitely want damage up, thats sorta how ive been feeling most of the time,
// whenever i tested so far."* Three sweeps looking for a way to break the deck-health/deck-strength
// coupling all landed on the same conclusion: **this is the only lever that moves the thing he is
// describing.** Flattening the level curve made you weaker rather than decoupling anything, and
// making levels COST armour turned out to be a straight buff (the cost lands at Lv4 and a run ends
// holding about one Lv4 card).
//
// 📏 WHY 1.15 AND NOT 1.25 — measured at ⭐6/🎭3, a real player's state, target 40/35/30/20:
//   ×1.00  mage 66/43/26/40 · rogue 68/44/26/45   gap −2/−1/0/−5   ← tightest gap ever recorded
//   ×1.15  mage 66/34/28/28 · rogue 64/39/28/45   gap +2/−5/0/−17
//   ×1.25  mage 61/33/18/29 · rogue 66/31/33/43   gap −5/+2/−15/−14
// ×1.15 is the closest the MAGE has been to target at stages 2-4 (34/28/28 against 35/30/20).
// ⚠️ AND THE COST IS EXACTLY WHAT THE NOTE ABOVE PREDICTED: **the class gap reopens** — 17 points
// at stage 4, from a starting position of 5. 🔑 *A thinner health bar pays more per point of
// damage*, and after the plate compression the mage is the thinner one. **Raising damage will
// always cost class parity in this game; that is structural, not a tuning accident.**
// ⚠️ Held deliberately: the rogue is over target at stage 4 (45% vs 20%) at EVERY setting. That is
// the documented shape issue and damage is not its fix.
// 📏 SETTLED AT 1.30, NOT 1.15 — same seeds at ⭐6/🎭3, and the thing being tuned is
// *"does the deck ever go DOWN"*, not the win rate:
//   dmg     mage never-dips / deepest dip     rogue never-dips / dip
//   ×1.00        28%  /  3.4                      51%  /  2.2
//   ×1.15        21%  /  4.1                      50%  /  2.6
//   ×1.30        14%  /  5.3                      40%  /  3.4
//   ×1.45        14%  /  6.0                      33%  /  3.9
// 🔑 **×1.15 is below the perception threshold** — it moves the mage's deepest dip by less
// than one card, and moves the rogue by nothing at all. A change a playtest cannot FEEL is a
// wasted playtest, and this one exists to answer a feel-report.
// ⚠️ Cost, stated: the mage's win rate at this level goes 38 → 30%, and the class gap widens.
//
// 🔴 AND THE FINDING TO ACT ON LATER: **DAMAGE BARELY TOUCHES THE ROGUE'S SNOWBALL.** Half her
// runs never lose a card at ×1.0 and still half at ×1.15; ×1.45 only reaches 33%. The cause is
// already written down elsewhere in this file — *damage only lands on a Narrow or a Loss, so a
// class that Completes more is simply hit less.* 🔑 **Her problem is the FREQUENCY of being hit,
// not the SIZE of the hit, and no multiplier reaches frequency.** Fixing her needs something that
// costs cards on a *Complete*, or a road that can kill you — not this dial.
let FOE_ATK_MULT = 1.30;
function scaleFoe(e) {
  if (!e || FOE_ATK_MULT === 1.0 || e.atk == null) return e;
  return Object.assign({}, e, { atk: Math.max(1, Math.round(e.atk * FOE_ATK_MULT)) });
}
function beginEncounter(e) {
  const region = RUN()[S.region - 1];
  e = scaleFoe(e);
  S.encounter = e;
  S.boostTarget = S.encounter.type === 'fight' ? 'Attack' : 'Move';
  S.rangedDodge = false;
  // roll a Hardship (density rises with the region)
  let list = S.encounter.type === 'fight' ? FIGHT_HARDSHIPS : JOURNEY_HARDSHIPS;
  // 🔑 A HARDSHIP MUST STAY A RISK, NOT BECOME A TAX (2026-07-29). Hardships change the SHAPE of a
  // turn's danger — you play around them. But ☠️ Ranged makes Early Damage CERTAIN, so every
  // hardship whose condition is "if you take Early Damage" stops being something you can play
  // around and becomes a flat surcharge with extra words:
  //   ⚠️ Hazards — "1 Time Penalty if you take Early Damage" → always. And with Storm's cousin
  //                rules that is a guaranteed chain.
  //   ☠️ Ambush  — "double the Early Damage" → a guaranteed doubling rather than a gamble.
  //   🌙 Night Travel — already excluded (it wants a low-Init Catalyst, which Ranged punishes).
  // ⚠️ This got worse the moment the Ranged dodge was cut, because dodging used to be the out.
  // If a future ability guarantees a condition, exclude the hardships keyed to it HERE.
  // ⚠️ CONSEQUENCE, ACCEPTED FOR NOW: all three FIGHT_HARDSHIPS are keyed to Early Damage or to
  // low Initiative, so a Ranged creature now rolls NO hardship at all. That is defensible —
  // Ranged is its own modifier and doesn't need a surcharge — but it is a real loss of variety,
  // and the honest fix is a fight hardship that isn't about Early Damage (something about the
  // hand, the deck, or the Stack). Until then, Ranged creatures are hardship-free.
  if (S.encounter.ability === 'Ranged') list = list.filter(h => !['Night Travel', 'Hazards', 'Ambush'].includes(h));
  // 🗺️ EACH REGION DRAWS FROM ITS OWN POOL (2026-07-29, Thomas: hardships should fit the
  // monsters of the region). A region may declare `hardships`; without one it gets the full menu.
  // This is also the hook stages will use once they own their own content.
  if (region.hardships) list = list.filter(h => region.hardships.includes(h));
  S.hardship = rnd() < region.hardshipChance ? list[Math.floor(rnd() * list.length)] : null;
  // a Cache/Mirror Fen ward: the next FIGHT carries a Hardship whether the region rolled one or not
  if (S.curseNextFight && S.encounter.type === 'fight') {
    if (!S.hardship) S.hardship = list[Math.floor(rnd() * list.length)];
    S.curseNextFight = false;
  }
}

function logChallenge() {
  const e = S.encounter;
  if (e.type === 'fight') {
    log(`CHALLENGE: Fight — ${e.name} (HP ${e.hp} · Init ${e.init} · Atk ${e.atk} · ${e.shape === 'armour' ? `Armour ${e.shapeV}` : e.shape === 'evasion' ? 'Evasion' : 'unguarded'} · 🪙 ${e.xp})`);
    if (e.ability) log(`ABILITY — ${e.ability}: ${ABILITIES[e.ability]}`, 'bad');
  } else {
    log(`CHALLENGE: Journey — ${e.name} (MP ${e.mp} · Nightfall ${e.nightfall} · Time Penalty ${e.timePenalty} · 🪙 ${e.xp})`);
    if (e.peril) log(`PERIL — ${e.peril}: ${PERILS[e.peril]}`, 'bad');
  }
  if (S.hardship) log(`HARDSHIP — ${S.hardship}: ${hardshipText(S.hardship)}`, 'bad');
}

// 🏕️ WHICH ENCOUNTER THIS REGION'S EVENT FOLLOWS. Rolled once per region rather than
// per turn, so events are SPACED by construction instead of clustering - a cap on a per-turn roll
// still permits two in a row and then a dry region, and the run layer is deliberately predictable.
// ⚠️ Never slot 0: you should meet the road before the road offers you anything.
// 🏕️ is THIS turn the region's event turn (as opposed to an event mid-encounter, which no
// longer happens)? Read it rather than testing `S.phase === 'event'` in display code - the phase is
// also what the tutorial and any future scripted event would use.
function isEventTurn() { return S.phase === 'event' && !S.finalMode; }

function scheduleRegionEvent() {
  // ⚠️ NEVER THE LAST ENCOUNTER. finishTurn() arms the event turn and then finishRegionCheck()
  // runs immediately - so an event scheduled after encounter REGION_ENCOUNTERS is armed and then
  // stepped over by the region break, and nextRegion() clears the flag. Measured: it silently ate
  // one region's event in four (3.1 event turns a run instead of 4.0).
  // 🔑 A FLAG SET IN THE SAME BREATH AS THE CHECK THAT ENDS THE PHASE WILL LOSE THE RACE.
  S.eventAt = 1 + Math.floor(rnd() * (REGION_ENCOUNTERS - 1));   // after encounter 1..N-1
  S.eventDone = false;
  S.eventTurnPending = false;
}

// 🏕️ THE EVENT TURN. No encounter is drawn, no cards are spent, no soak, no deck erosion -
// it is the one beat in the run that asks a question without charging you for the answer.
// 🔑 That is the whole point: [[Tempo_And_The_Watch]] says the run layer is meant to be the
// exhale and cannot be while every second encounter stacks another screen on a combat resolution.
function beginEventTurn() {
  S.eventTurnPending = false;
  S.eventDone = true;
  // ⚠️ top the hand up FIRST - several events take a card, and the next real turn's top-up
  // would otherwise be the only thing standing between you and a short hand.
  if (S.hand.length < HAND_SIZE && S.deck.length) draw(HAND_SIZE - S.hand.length);
  S.assign = { Spell: null, Element: null, Boost: null, Reserve: null };
  S.damage = 0; S.damageEl = null;
  S.downgraded = new Set();
  S.actionSetIds = []; S.reserveId = null;
  logHeader(`— Turn ${S.turn} (Region ${S.region}) —`);
  startEvent();
}

function nextTurn() {
  S.turn++;
  // 🗺️ HAND THE RUN TO THE MAP BEFORE ANY CARDS ARE DEALT.
  // ⚠️ This guard used to sit 25 lines lower, BELOW the hand top-up - so nextTurn dealt you back
  // to four and only then sent you to the map. Gating freshGame's own draw did nothing, because
  // this was the draw that actually fired. 🔑 A GUARD PLACED AFTER THE THING IT MEANS TO PREVENT
  // IS NOT A GUARD; and the fix looked correct in the source while changing nothing on screen,
  // which is why Thomas saw a full hand on a build whose diff says otherwise.
  if (S.map && !S.finalMode) { backToMap(); return; }
  // 🏕️ an event takes the turn INSTEAD of an encounter - see beginEventTurn
  if (S.eventTurnPending) { beginEventTurn(); return; }
  S.regionTurn = (S.regionTurn || 0) + 1;
  // Top the hand up before anything else. Cleanup draws you back to four, but EVENTS run after
  // it and several remove a card from your hand (the Gray Pilgrim takes one, the Toll of Thorns
  // can trash one), which left you starting the next encounter a card short with nothing to
  // refill it. Doing it here covers every path that can ever thin a hand, present or future.
  if (S.hand.length < HAND_SIZE && S.deck.length) {
    const before = S.hand.length;
    draw(HAND_SIZE - before);
    const drawn = S.hand.length - before;
    if (drawn > 0) log(`You draw back up to ${S.hand.length} card${S.hand.length === 1 ? '' : 's'} (+${drawn}).`);
  }
  // 🗡️ THE EXTRA CARDS A COMBO VERB OWES YOU. ⚠️ This has to sit HERE, in nextTurn, and not
  // beside the other draw(HAND_SIZE) calls — nextTurn tops up with `draw(HAND_SIZE - before)` and
  // is the only draw site an ordinary turn ever reaches, so patching the three literal
  // `draw(HAND_SIZE)` calls (freshGame, nextRegion, the finale) left the verb silently inert.
  // 🔑 GREPPING FOR A CALL SHAPE IS NOT THE SAME AS FINDING THE CODE PATH.
  if (S.drawExtra && S.deck.length) {
    const n = Math.min(S.drawExtra, S.deck.length);
    draw(n);
    log(`🗡️ Your combo draws you ${n} extra card${n === 1 ? '' : 's'} — what you leave unseated slides under your deck.`, 'good');
  }
  S.drawExtra = 0;
  // 🗺️ ON THE MAP, takeMapNode() DOES ALL OF THIS - nextTurn is only reached by the tutorial
  // and by legacy saves, which still walk a region counter and a blind draw.
  if (S.tutorial || !FORK_ENABLED) { drawEncounter(); }
  else {
    offerFork();
    S.assign = { Spell: null, Element: null, Boost: null, Reserve: null };
    S.loseReserve = null;
    S.afterSoak = 'upgrade'; S.damage = 0; S.damageEl = null;
    S.emberguardUsed = false;
    S.potionFx = { init: 0, value: 0, soak: 0, boost: 0, pace: 0, tpCut: 0, swap: {} }; S.potionPick = null;
    S.bankArmed = false; S.moTarget = null;
    S.downgraded = new Set(); S.actionSetIds = []; S.reserveId = null;
    S.phase = 'fork';
    logHeader(`— Turn ${S.turn} (Region ${S.region}) —`);
    render();
    return;
  }
  S.assign = { Spell: null, Element: null, Boost: null, Reserve: null };
  S.loseReserve = null;
  S.afterSoak = 'upgrade';
  // coins roll over between turns — deliberately NOT reset
  S.damage = 0;
  S.damageEl = null;
  S.emberguardUsed = false;
  S.potionFx = { init: 0, value: 0, soak: 0, boost: 0, pace: 0, tpCut: 0, swap: {} }; S.potionPick = null;
  S.bankArmed = false;   // 🔥 banking is armed per TURN — anything outliving its turn would be a charm
  S.moTarget = null;     // ● where Momentum goes is chosen per TURN
  S.downgraded = new Set();
  S.actionSetIds = [];
  S.reserveId = null;
  // a creature becomes a persistent foe with an HP pool (the finale runs its own path)
  S.phase = 'assign';
  logHeader(`— Turn ${S.turn} (Region ${S.region}) —`);
  logChallenge();
  render();
}

// ❌ ↩️ DIVERT IS DELETED (2026-08-23, Thomas: *"i think we can remove our divert option
// completely now. it was only because we had no choice in our encounters, its redundant now with
// our new map layer"*).
// 🔑 HE IS EXACTLY RIGHT ABOUT WHY. Divert existed to answer *"this encounter is wrong for my
// hand and I cannot do anything about it"* — a problem that only existed while encounters came out
// of a shuffled bag. The 🗺️ map answers it properly: you now pick your node, seeing its type, with
// the 🕯️ candle telling you what is in reach. **Divert was a paid apology for a choice the player
// did not have, and the map gave them the choice.**
// ⚠️ THE STANDING RULE APPLIES TO THE WHOLE FEATURE, NOT JUST THE BUTTON: *when a rule is cut, the
// same commit removes its display.* So the button, the picker phase, the log line and the how-to
// sentence all go with it. `divertsUsed` / `diverting` survive ONLY in the save schema so older
// saves still load.
// 📏 And it takes MAX_DIVERTS with it — a constant that named a rule nobody can invoke is exactly
// the dead data this project keeps finding.



// ---------- drag & drop assignment ----------
let dragId = null;

function dragStart(ev, cardId) {
  dragId = cardId;
  S.selectedId = null; // dragging cancels any tap-selection
  ev.dataTransfer.setData('text/plain', String(cardId));
  ev.dataTransfer.effectAllowed = 'move';
}

function dragOver(ev) {
  if (!isAssignPhase()) return;
  ev.preventDefault();
  ev.dataTransfer.dropEffect = 'move';
  ev.currentTarget.classList.add('drag-over');
}

function dragLeave(ev) { ev.currentTarget.classList.remove('drag-over'); }

function dropOn(ev, zone) {
  ev.preventDefault();
  ev.currentTarget.classList.remove('drag-over');
  if (!isAssignPhase() || dragId == null) return;
  assignRole(dragId, zone); // swaps with whoever holds that role
  dragId = null;
}

// ---------- the slot row: select a card, then swap it with another (or with a role) ----------
function tapCard(id) {
  if (!isAssignPhase()) return;
  // a card is already picked up → tapping a second card SWAPS the two
  if (S.selectedId != null && S.selectedId !== id) {
    swapCards(S.selectedId, id);
    S.selectedId = null;
    render();
    return;
  }
  S.selectedId = (S.selectedId === id) ? null : id; // toggle
  render();
}

// tapping two cards sends the first to the second's zone; the displaced card is re-seated by
// normalizeAssign. One code path, so the pile's one-element rule is enforced in one place.
function swapCards(idA, idB) {
  const zb = zoneOf(idB);
  if (zb) assignRole(idA, zb);
}

function assignRole(cardId, role) {
  if (!isAssignPhase() || !role) return;
  const ban = placementBan(cardId, role);
  if (ban) { S.selectedId = null; log(ban, 'bad'); render(); return; }
  S.selectedId = null;
  const from = zoneOf(cardId);
  if (from === role && role !== 'Spell') { render(); return; }
  // swap: whoever was there takes the mover's old seat, so the row never has a hole
  const occupant = S.assign[role] || null;
  if (from) S.assign[from] = occupant;
  S.assign[role] = cardId;
  normalizeAssign();
  render();
}
function setBoostTarget(t) { if (S.phase === 'assign') { S.boostTarget = t; render(); } }

function tapZone(zone) {
  if (!isAssignPhase() || S.selectedId == null) return;
  assignRole(S.selectedId, zone);
}

function tapHand() {
  if (!isAssignPhase() || S.selectedId == null) return;
  const id = S.selectedId;
  S.selectedId = null;
  assignToZone(id, null);
}

// zone = 'Spell'|'Element'|'Boost'|'Reserve' or null (back to hand)
function assignToZone(cardId, zone) {
  if (!cardById(cardId)) return;
  const from = zoneOf(cardId);
  if (from) S.assign[from] = null;
  if (zone) S.assign[zone] = cardId; // dropping on an occupied zone sends the occupant back to hand
  render();
}

// auto-slide the last unassigned card into the Reserve zone once the roles are set
// THE SLOT ROW (2026-07-06, Thomas's design): there is no separate hand — every card in hand
// sits in one of the four labelled slots, and the labels never move. POSITION IS THE ROLE, so
// arranging a turn is *swapping cards around*, not placing them into boxes. Saves the whole
// hand region (the space the 16:9 scene needs) and makes every card always visible.
// 🐛 BUG 2026-07-29: this used to bail out unless `isAssignPhase()`, which meant the slot row was
// the ONLY way a card is ever visible but was only ever filled during the assign phase. Every
// card-picking phase (soak / upgrade / stack / the Wheel) happens BEFORE cleanup, so their cards
// were still seated from the turn just played and they all worked. An EVENT is the one thing that
// fires AFTER cleanup - the played cards have left the hand, `S.assign` still points at their now
// dead ids, and the freshly drawn four were never seated. Result: four "— empty —" slots, a real
// hand behind them, and a card-picker with nothing to pick. Seating is purely ADDITIVE (it only
// fills empty slots with unseated cards and never displaces one), so it is safe in every phase.
function normalizeAssign() {
  if (!S || !S.assign || !S.hand) return;
  if (Array.isArray(S.assign.Spell)) S.assign.Spell = S.assign.Spell[0] || null;   // old saves
  for (const z of ZONES) if (S.assign[z] && !cardById(S.assign[z])) S.assign[z] = null;
  // ⚖️🐌 SEATING IS ADDITIVE AND NEVER DISPLACES — which quietly let a BANNED card stay put. A card
  // seated last turn sits where it is, and when the next encounter arrives carrying Dead Weight or
  // Mire its slot has just become illegal with nothing to move it.
  // ⚠️ Evicting alone is not enough: the card then has no seat, and the fallback puts it straight
  // back. A ban has to SWAP it with a slot that can legally hold it, both ways.
  for (const z of ZONES) {
    const id = S.assign[z];
    if (!id || !placementBan(id, z)) continue;
    const to = ZONES.find(o => o !== z && !placementBan(id, o) && (!S.assign[o] || !placementBan(S.assign[o], z)));
    if (to) { const other = S.assign[to]; S.assign[to] = id; S.assign[z] = other || null; }
    else S.assign[z] = null;
  }
  // every card is always seated, left to right — position is the role
  const seated = new Set(ZONES.map(z => S.assign[z]).filter(Boolean));
  for (const card of S.hand) {
    if (seated.has(card.id)) continue;
    // ⚖️🐌 auto-seating must respect a placement ban, or the row would open illegal
    const free = ZONES.find(z => !S.assign[z] && !placementBan(card.id, z));
    if (!free) continue;
    S.assign[free] = card.id;
    seated.add(card.id);
  }
  // anything a ban pushed out still needs a seat — the first slot it is ALLOWED, and only then
  // any slot at all, so a hand can never end up with a card nowhere on the row
  for (const card of S.hand) {
    if (seated.has(card.id)) continue;
    const free = ZONES.find(z => !S.assign[z] && !placementBan(card.id, z)) || ZONES.find(z => !S.assign[z]);
    if (!free) break;
    S.assign[free] = card.id;
    seated.add(card.id);
  }
}

// pull cards leftward so there's no gap mid-row
function compactSlots() {
  const ids = ZONES.map(z => S.assign[z]).filter(Boolean);
  ZONES.forEach((z, i) => { S.assign[z] = ids[i] || null; });
}

// the only requirement is that something is in the pile - empty slots are a legal, costly choice
function rolesValid() { return CLASS.valid(); }

// ---------- action math (pure) ----------
// Computes the current Action Set vs the current encounter. Used by BOTH the
// live preview and resolve() so the two can never disagree.
function computeAction(reserve) {
  const e = S.encounter;
  // ⚠️ THE CLASS SEAM. Everything the arrangement produces comes from CLASS.compose(); the rest
  // of this function is engine and must work for a class that never pours a card.
  const a = CLASS.compose();
  if (!a || !e) return null;
  const { spell, elem, boostC, hits } = a;
  const attuner = a.attuner || null, loose = !!a.loose;
  const spellEl = a.element;
  const pileVal = a.value;
  // enhUsed/isEnh/enhEl are the engine's long-standing "this action was attuned" fields. The mage
  // supplies them from its own pairing rule; a class that has no elements simply leaves them false.
  const enhUsed = !!a.attuned, isEnh = enhUsed, enhEl = spellEl, resonant = false;
  const attBonus = a.attBonus || 0, attApplied = a.attApplied != null ? a.attApplied : attBonus;
  const cardVal = a.cardVal != null ? a.cardVal : null;
  const banks = !!a.banks, bank = a.bank || 0, wake = a.wake || 0, wakeTarget = a.wakeTarget || null;
  // ⚠️ THE CLASS'S OWN PAYLOAD RIDES ALONG UNREAD. computeAction rebuilds its result field by
  // field, so anything a class returns that the engine does not name is silently dropped — which
  // is exactly what happened to `rogue` the first time. The engine never inspects it; cleanup
  // hands it straight back to the class. One line, so a third class needs no change here.
  const classPayload = a.rogue ? { rogue: a.rogue } : null;
  // 🗡️ THE ROGUE'S LIVE COMBO ABILITY, read once here and OR'd into the checks that already exist.
  // 🔑 Deliberately NOT a second system: the verbs answer the same three questions
  // the mage's ✦ Outpace / Overwhelm / Landslide answer, so they hang off the same three lines
  // rather than a parallel set. A class adds an ANSWER, never a new question.
  const rVerb = a.rogue ? a.rogue.verb : null;
  const boostVal = a.boost;

  const h = S.hardship;
  const ability = e.ability || null;
  const elemInit = a.init + (S.potionFx ? S.potionFx.init : 0) + (S.armourPace || 0);   // 🧪 Draught of Haste · 👞 Quickstep
  // Night Travel: Boost reduced by the Catalyst's Initiative, min 0
  const boostRaw = boostVal + (S.potionFx && boostVal > 0 ? S.potionFx.boost : 0);   // 🧪 Bitterroot
  const boostEff = h === 'Rationed' ? 0                                   // ⏳ nothing is spare
    : h === 'Night Travel' ? Math.max(0, boostRaw - elemInit) : boostRaw;
  const nightCut = boostRaw - boostEff;

  if (e.type === 'fight') {
    // ✦ Lv4 CATALYST verbs shape the race itself
    const vS = a.vSpell, vE = a.vElem;
    // 🕯️ Gorsewarden's Hood — seeing it coming IS being ready for it. ⚠️ It couples two systems
    // that never touched, which is the point: the candle stops being purely information.
    const init = elemInit + (S.candle && hasArmourRule('farsight') ? 2 : 0);
    // Slipstream only counts against 🌀 Evasion — it buys you the shape's answer, not the race
    const evInit = init + (vE === 'Slipstream' ? 4 : 0);
    // 🗡️ Viper Strike arrives before they are ready — same answer as ✦ Outpace, different class
    // 👢 Anvil Toad Boots — an active use, so it is spent on a turn YOU choose. (The Twinned
    // Bracers lesson: a lateral effect must be optional, or it is a coin flip you did not call.)
    const initLost = (vE === 'Outpace' || (S.potionFx && S.potionFx.winInit) || S.armourWinInit)
      ? false : e.init > init;
    // Ranged deals Early Damage even when you win Initiative — no opt-out (dodge cut 2026-07-29)
    const rangedHits = ability === 'Ranged' && !initLost;   // it shoots you whether or not you're fast
    let early = initLost || rangedHits ? e.atk : 0;
    // 🌬️ Windshear — the MARGIN matters, not just the verdict. Capped so a very slow hand is
    // punished hard but never arbitrarily; the cap is what keeps it a problem instead of a wall.
    if (ability === 'Windshear' && initLost) early += Math.min(3, Math.max(0, e.init - init));
    if (h === 'Ambush') early *= 2;
    if (vE === 'Bedrock') early = 0;                       // ✦ Bedrock: the early shot never lands
    const wrongType = false;
    // 🗡️ the blade-side verb lands BEFORE the shape does, so 🛡️ Armour is still paid on the total
    // and 🌀 Evasion still halves it. A verb makes the blow bigger; it does not exempt the blow.
    // 🔑 THE CARD SPLITS; WHAT YOU ADD TO IT DOES NOT (Thomas, 2026-08-22):
    // *"if a card does 8x2, any added damage like a +4 potion, will make it 12x2."*
    // That is how anyone reads a card face, and dividing a buff is the surprising answer — so the
    // card's OWN value is what a multi-hit strike divides, and every bonus lands on each blow.
    // ⚠️ It is an ENGINE rule, not a rogue one: 🗡️ Sparkstrike gets it too.
    const added = (S.potionFx ? S.potionFx.value : 0) + (S.armourStrike || 0)   // 🧪 Emberdraught · 🧤 Cinderfist
                  + (a.rogue ? (a.rogue.bonus || 0) : 0)            // ● pips + the blade verb
                  // 🎁 CHARM STRIKE BONUSES BELONG HERE, NOT AFTER THE MULTIPLICATION.
                  // 🔴 They shipped an hour earlier as `value += charmStrike(...)` AFTER `hits` had
                  // already been applied, so a multi-hit strike got them ONCE instead of on every
                  // blow - worth **half** to a rogue and full to a mage, which read as a class
                  // balance fact in the ladder and was a bug in my own arithmetic.
                  // 🔑 Thomas's rule is explicit: *"if a card does 8x2, any added damage like a +4
                  // potion, will make it 12x2."* `added` IS that channel; anything that is "added
                  // damage" goes in it and nothing goes anywhere else.
                  // ⚠️ 💨 SLOW STRENGTH MOVED TOO, and it had the same bug from the day it
                  // shipped - it is listed under the same rule and was simply never revisited when
                  // multi-hit arrived. `initLost` is computed ~17 lines above, so it fits here.
                  + charmStrike(spell)
                  + (initLost && hasCharm('slowfoot') ? 4 : 0);
    const base = pileVal + added;
    const withBoost = base + boostEff;
    // 🔑 SHAPED DEFENCE (2026-07-28). Enemy armour is no longer a COLOUR you had to match with
    // an elemental attack - a rule no non-elemental class could ever join - but a SHAPE, stated
    // in engine terms so every class can answer it with whatever it produces.
    //   🛡️ ARMOUR  flat reduction off every hit -> small hits are eaten, so it wants ONE BIG HIT
    //   🌀 EVASION  your hit is HALVED unless you won Initiative -> it wants SPEED
    // (🧱 GUARD - a breakable pool beaten by MANY hits - is deliberately absent: the mage lands
    //  exactly one hit, so it has nothing to bite on. It is the rogue's lock, not the mage's.)
    // ✦ Overwhelm ignores Armour · Landslide can't be halved · Slipstream beats Evasion's check
    // 🧪 Quenching Draught — the shape simply does not apply this turn
    const quenched = !!(S.potionFx && S.potionFx.noShape);
    // 🌀 SLIPPED (rogue) — beat its Initiative by SLIP_MARGIN and its answer comes in HALF.
    // 🔑 THIS IS WHY THE ROGUE'S METER IS NOT THE MAGE'S: winning the race is BINARY and stops
    // paying the moment you win it (measured twice — the old Attack-or-Initiative fork read 13%,
    // then 4% after doubling). A margin that keeps paying past the win line never plateaus.
    //
    // ⚠️ IT SHIPPED AS A FULL CANCEL AND THAT WAS A PILLAR BUG (fixed 2026-08-17). Measured against
    // the mage over 80 runs: mage countered on 32% of turns for 1.14 cards a turn, rogue countered on
    // — 1% — for 0.04. A 28× reduction. 🔑 THE COUNTER IS THE GAME'S ONLY DAMAGE SOURCE, so a
    // rule that deletes it doesn't make a class evasive, it EXCUSES THE CLASS FROM DECK-AS-HEALTH.
    // She never spent her deck, so she never ran out, and 18 of her 18-point lead over the mage was
    // sitting right here — not in her damage, which measured at parity.
    // 🔑 THE FIX IS THE ONE ALREADY MADE FOR 🧱 GUARD THE SAME WEEK: HALVE, NEVER SWALLOW. A shape
    // that reduces to zero is not a hard problem, it is an absent one — in Guard's case it locked the
    // mage out, here it lets the rogue out. Same cliff, both directions.
    // ⚠️ AND THE FULL CANCEL STILL EXISTS — it is 🗡️ Slow Poison's verb. Slipping is now the
    // cheap, common, partial version; the verb is the rare, chosen, total one. That is the shape a
    // verb should have, and it is why `nocounter` measured 0%: it was reprinting a freebie.
    const slipped = !!(a.rogue && a.rogue.slips && !initLost && (init - e.init) >= SLIP_MARGIN);
    // 🗡️ Venom Needle slips between the plates, exactly as ✦ Overwhelm does
    const armorCut = (!quenched && foeHas(e, 'armour') && vS !== 'Overwhelm' && rVerb !== 'pierce')
      ? Math.max(0, (e.shapeV || 0) - (hasCharm('ironsplit') ? 2 : 0)) : 0;   // 🛡️ Ironsplitter
    // 🧪 Skyglass — the blow simply cannot be halved · 🗡️ Second Fang catches what the first missed
    // 🌀 Windreader widens the margin Evasion needs, so a near-miss on the race still lands full
    const evGrace = hasCharm('windreader') ? 2 : 0;
    const evaded = !quenched && !(S.potionFx && S.potionFx.noEvade) &&
                   foeHas(e, 'evasion') && vS !== 'Landslide' && (e.init > evInit + evGrace);
    // 🗡️ MULTI-HIT — and the rule is that hits do NOT add damage, they DIVIDE it, with 🛡️ Armour
    // paid on EVERY one. That is the entire reason a long chain is a liability against Armour and
    // (once 🧱 GUARD exists) an asset against a breakable pool.
    // ⚠️ `hits` WAS INERT UNTIL 2026-08-12 — computed by the class, passed through computeAction,
    // printed in the reveal, and never once touching a number. The rogue's central mechanic was
    // decoration, which is why teaching the bot to chain moved the win rate by zero.
    // 🔑 A FIELD THE ENGINE CARRIES BUT NEVER READS IS NOT A MECHANIC, IT IS A COMMENT.
    // Mage behaviour is byte-identical: hits === 1 takes the original path.
    // 🧱 GUARD — BUILT 2026-08-12, the third shape, specified at step 5 and deliberately left out
    // until a class existed that could answer it.
    //
    // THE RULE: a pool of N that eats your first N HITS whole. Hits beyond it land in full.
    // So one enormous blow accomplishes NOTHING against Guard 1, and four small ones get through.
    // 🔑 THAT IS THE EXACT INVERSE OF ARMOUR, and it is why the two shapes cannot be answered by
    // the same turn: Armour is paid per hit and wants ONE, Guard consumes hits and wants MANY.
    // ⚠️ IT IS UNANSWERABLE FOR THE MAGE ON PURPOSE. The mage lands exactly one hit, so a mage
    // ⚠️ THE PARAGRAPH THAT USED TO SIT HERE IS DELETED, NOT SOFTENED. It said *"Guard must NOT be
    // added to the existing four roads"* — and Guard was added to all four roads three days later.
    // 🔑 A NOTE THAT THE DATA HAS OVERRULED IS WORSE THAN NO NOTE: it gets believed. Check the data.
    //
    // 🔴 THE HARD CONSTRAINT, MEASURED 2026-08-21 — **GUARD MUST BE 1.**
    // Guard N halves your first N HITS, so it is only answerable if you can bring MORE than N.
    // The whole game's hit ceiling is **2** (🗡️ Sparkstrike for the mage, Second Fang for the
    // rogue — one card each), so at Guard 2 every hit anyone can bring is halved and the shape's
    // own counter-play stops existing. Measured on the three Guard-2 creatures that shipped:
    //     mage 0C/4N/**96L** · rogue 0C/20N/**80L**  — nobody beats it, so it is not a shape.
    // ⚠️ Guard 2 only becomes legal if some class can land THREE hits. Until then it is a wall.
    //
    // 🔴 AND THE PAIRING RULE THAT MADE IT WORSE: the eight Guard creatures averaged 18 HP, the TOP
    // of the range, so a shape that HALVES your damage also carried the BIGGEST health pools.
    // **A shape and a stat that enforce the same thing MULTIPLY, they do not add** — the exact
    // error the Stormreach's first cut made with 🌀 Evasion plus init 5–7 (measured 32%).
    // 🔑 A shape that halves your blow wants BELOW-average HP. Guard creatures now run 7–12
    // against a non-Guard mean of 12.7 (was 11–18), which is the pass that made it playable:
    //     mage 0C/21N/79L → **8C/49N/43L** · rogue 5C/38N/57L → **20C/58N/22L**
    // ...against an ordinary fight's 30C/46N/25L (mage) — so Guard is now the hardest ordinary
    // thing on the road rather than a loss, which is what a shape is supposed to be.
    // 🧱 Deep Cut shaves a hit off the pool · 🗡️ Whetstone sharpens every hit
    const guardPool = (!quenched && foeHas(e, 'guard'))
      ? Math.max(0, (e.shapeV || 0) - (hasCharm('deepcut') ? 1 : 0)) : 0;
    const guarded = Math.min(hits, guardPool);
    const whet = hasCharm('whetstone') ? 1 : 0;
    // ⚠️ ONE PATH, NOT TWO. The single-hit case used to bypass perHit entirely, which meant
    // 🗡️ Whetstone ("every hit strikes +1") did nothing at all on a one-hit turn — a charm that
    // silently does nothing is the exact bug the element gate was just fixed for.
    // 🔑 A SPECIAL CASE FOR THE COMMON PATH IS A PLACE FOR A RULE TO GO MISSING.
    // Mage output is unchanged: hits === 1 and whet === 0 makes this 1 * (withBoost - armorCut).
    // ⚠️ SPLIT ONLY THE CARD. `withBoost` is card + bonuses + Surge; dividing all of it made a
    // +4 potion worth +2 a hit, which is not what the face says.
    const splitBase = withBoost - added;
    const perHit = (hits > 1 && SPLIT_ADDS_PER_HIT
                      ? Math.floor(splitBase / hits) + added
                      : hits > 1 ? Math.floor(withBoost / hits) : withBoost) + whet;
    // 🧱 GUARD REDUCES, IT DOES NOT NULLIFY (softened 2026-08-17, Thomas: *"that doesn't sound
    // fun if a mage literally can't do anything about guard"* / *"i don't want to have to force
    // people to play a different class"*).
    //
    // ⚠️ IT SHIPPED AS A CLIFF: the first N hits were swallowed WHOLE, so a mage — who lands
    // exactly one hit, always — dealt literally ZERO to Guard 1. I built that and then defended it
    // as a feature, when this file's own note had already called it *"unanswerable, not hard"*.
    //
    // 🔑 THE RULE THIS EARNS: **EVERY CLASS MUST BE ABLE TO BEAT EVERY STAGE. Classes differ in
    // how HARD, never in WHETHER.** A shape one class cannot engage with is not difficulty, it is a
    // paywall made of mechanics — and it makes the wall worse too: "S-graded the Guard stage as the
    // mage" is a badge, "the mage cannot enter" is a locked door.
    //
    // So the first N hits are HALVED. The mage is disadvantaged and never excluded; the rogue is
    // still plainly the right tool, which is all the differentiation ever needed to be.
    // ✅ It also dissolves a sharp edge I could not justify: a Lv4 rogue card lands one hit, so
    // under the old rule a fully sharpened rogue ALSO dealt zero to a pool.
    const per = Math.max(0, perHit - armorCut);
    let value = (hits - guarded) * per + guarded * Math.floor(per * GUARD_CUT);
    // 🧱 WHAT THE PLATES ATE — carried so the REVEAL can say so (found 2026-08-21).
    // 🐛 Armour and Evasion each got a line in the beat display and Guard never did, so a blow
    // simply arrived halved with no term accounting for it: the encounter panel promised
    // "halves your first hit" and the resolution never mentioned it again.
    // 🔑 *Never state a rule about an object without marking the object* — and *legible math
    // always* means showing the TERMS, which is exactly what a silent halving is not.
    // ⚠️ This is the payload trap the note on compose() warns about: three bugs this month came
    // from a value being computed and never reaching the reveal. Add the field WITH the rule.
    const guardCut = (hits - guarded) * per + guarded * per - value;
    if (evaded) value = Math.floor(value / 2);
    if (vS === 'Thunderhead' && !initLost) value += 4;      // ✦ strike first, strike harder
    // 💨 SLOW STRENGTH - the mirror. Initiative is currently a race you want to win every time;
    // this makes LOSING it a legitimate plan, which is a whole second answer to 🛡️ Armour and
    // rescues hands whose only fast card is the one they need in the Spell.
    // 'Slow' CUT with the Attack/Move split - it only meant "compare your other value", and
    // there is no other value now. Abilities get revisited wholesale at shaped defence.
    const half = Math.ceil(e.hp / 2);
    let outcome = value >= e.hp ? 'Complete' : value >= half ? 'Narrow' : 'Loss';
    if (h === 'Exacting' && outcome === 'Narrow') outcome = 'Loss';   // ⚖️ no half credit
    // 💢 Backlash — the excess comes back. Note it fires on a CLEAN KILL, which is the point:
    // the only encounter in the game where a bigger blow is worse than a sufficient one.
    const backlash = ability === 'Backlash' ? Math.min(3, Math.max(0, value - e.hp)) : 0;
    // ✦ Undertow: a strike that falls short still costs you nothing in return
    // 🗡️ Slow Poison in ② — it simply does not answer. The one FULL cancel the rogue owns.
    const answers = outcome !== 'Complete' && vS !== 'Undertow' && rVerb !== 'nocounter'
                    && !(S.potionFx && S.potionFx.noCounter);
    // 🌀 a slipping rogue takes the blow at an angle — halved, never skipped
    const combatDmg = answers ? (slipped ? Math.floor(e.atk * SLIP_CUT) : e.atk) : backlash;
    const timePenalty = h === 'Hazards' ? (early > 0 ? 1 : 0) + (combatDmg > 0 ? 1 : 0) : 0;
    const stormDmg = h === 'Storm' ? timePenalty : 0;
    let loseReserve = null;
    // the dodge only costs the Arsenal when it actually cancels the ranged hit (you won initiative)
    if (ability === 'Freeze' && early > 0) loseReserve = 'Frozen (took Early Damage)';
    if (h === 'Riptide') loseReserve = '🌊 dragged under by the Riptide';
    const poison = ability === 'Poison' ? (early > 0 ? 1 : 0) + (combatDmg > 0 ? 1 : 0) : 0;
    return { ...classPayload, slipped, type: 'fight', spell, hits, attBonus, attApplied, cardVal, added, attuner, loose, banks, bank, wake, wakeTarget, vSpell: vS, vElem: vE, shape: e.shape || null, shapes: shapesOf(e), armorCut, evaded, guarded, guardPool, guardCut, elem, boostC, boostVal, boostEff, nightCut, resonant, spellEl, enhEl, isEnh, enhUsed, wrongType,
             base, withBoost, armorCut, value, init, initLost, rangedHits, early, half, outcome,
             combatDmg, timePenalty, stormDmg, loseReserve, poison, ability, backlash, target: e.hp, hardship: h };
  }
  const wrongType = false;
  // ONE VALUE PER CARD, so a blade-side verb reads as PROGRESS here exactly as it reads as damage
  // in a fight. ⚠️ Anything added to `base` in the fight branch must be added here too, or a rule
  // silently applies to half the game — the branches are parallel and neither one warns you.
  const added = (S.potionFx ? S.potionFx.value : 0) + (S.armourStrike || 0) + (a.rogue ? (a.rogue.bonus || 0) : 0);
  const base = pileVal + added;
  const withBoost = base + boostEff;
  // JOURNEY ELEMENT BONUS CUT 2026-07-26 - the most obscure rule in the game (the tell: months
  // of playtesting and Thomas never mentioned it once). Journeys already carry MP, Nightfall,
  // Pace and perils. Kept as a zeroed field so the log/solver result shapes do not change.
  const reserveBonus = 0;
  // 👣 THE STRIDE - what the cards behind the Spell contribute on a journey.
  // 🔑 A FIGHT IS A BLOW: one card lands, the others support it. A JOURNEY IS A DISTANCE: every
  // card you commit covers ground. So the same 16 cards want a SPIKE for a fight and an EVEN hand
  // for a journey, which is the one axis on which nothing else in the game pulls two ways.
  // ⚠️ The class rule still applies to the Spell and nothing else - a journey must not be
  // class-blind, or a mage and a rogue would play 54% of the game identically.
  const strideCards = JOURNEY_MODE === 'distance'
    ? [cardById(S.assign.Element), cardById(S.assign.Boost)].filter(Boolean) : [];
  const stride = strideCards.reduce((t, c) => t + eff(c).value, 0);
  // 🎁 the same four charms pay on a journey. 🔑 THEY MUST, OR THEY ARE HALF A CHARM: journeys
  // are about half of all encounters, and a rule whose TEXT names no encounter type but whose CODE
  // does is exactly the shape of the Slow Strength limitation directly above.
  const value = withBoost + reserveBonus + stride + charmStrike(spell);
  // Pace vs Nightfall: your Catalyst's Initiative (+ Boost if targeted) races the dark
  const paceBless = (S.paceBless || 0) > 0 ? 2 : 0; // Gray Pilgrim / Mirror Fen blessing
  // 🌙 Lanternjaw Greaves — Pace reads your FASTEST card instead of your Catalyst.
  // 🔑 THE BUILD-CHANGER OF THE NINE: the Catalyst currently serves two masters (Initiative and
  // the pair), and Nightfall is a third claim on it. This removes that third claim, so the Catalyst
  // is free to attune while the night is answered by whatever else you happen to be holding.
  const fastest = hasArmourRule('swiftfoot')
    ? Math.max(0, ...S.hand.map(c => eff(c).init)) : 0;
  const pace = Math.max(elemInit, fastest) + paceBless + charmMod('pace') + (S.potionFx ? S.potionFx.pace : 0);   // 🧪 Road Dust
  const nightfall = e.nightfall || 0;
  const nightCaught = nightfall > pace && !(S.potionFx && S.potionFx.noNight);   // 🧪 Nightglass
  // Steep peril: the journey's MP grows by your Arsenal's Boost
  const peril = e.peril || null;
  // ⛰️ Steep raises MP by what your ARSENAL would have given - the mage's ➕ boost, the
  // rogue's ⚡ energy. Reading only `boost` made it a free peril for any class without one.
  const steepAdd = peril === 'Steep' && reserve
    ? (CLASS.boosts ? eff(reserve).boost : pitchOf(reserve)) : 0;
  // 🏔️ Updraft — speed shortens the road (never below 1 MP: a journey you cannot fail is not one)
  const updraftCut = peril === 'Updraft' ? elemInit : 0;
  // ⚠️ the road gets longer when more cards walk it, or a journey becomes free
  const mpBase = JOURNEY_MODE === 'distance' ? Math.round(e.mp * JOURNEY_MP_MULT) : e.mp;
  const mpEff = Math.max(1, mpBase + steepAdd - updraftCut);
  const half = Math.ceil(mpEff / 2);
  let outcome = value >= mpEff ? 'Complete' : value >= half ? 'Narrow' : 'Loss';
  if (h === 'Exacting' && outcome === 'Narrow') outcome = 'Loss';   // ⚖️ no half credit
  // ⏳ Toll — the road that does not forgive. 🧪 Hardtack takes a point back off any penalty.
  let timePenalty = outcome !== 'Complete' ? e.timePenalty * (peril === 'Toll' ? 2 : 1) : 0;
  if (timePenalty && S.potionFx && S.potionFx.tpCut) timePenalty = Math.max(0, timePenalty - S.potionFx.tpCut);
  const stormDmg = h === 'Storm' ? timePenalty : 0;
  const treacherousDmg = peril === 'Treacherous' && outcome !== 'Complete' ? 1 : 0;
  // ⚔️ THE LAST MILE'S SECOND RACE — its INITIATIVE, not Nightfall. See LAST_MILE.
  // 🔑 IT LIVES IN computeAction() FOR THE SAME REASON EVERYTHING ELSE DOES: resolution, the
  // reveal and the bot must share one source. Put the rouse in finishResolve instead and the
  // solver's scorer cannot see it, so the bot would never trade Move for Pace — and every number
  // we then took would say the penalty was unavoidable. *Teach the instrument or it measures a
  // game we are not shipping.*
  const lastMile = e.lastMile ? lastMileApproach(pace) : null;
  const rouse = lastMile === 'heard' ? Math.ceil((S.dragon.breath || 0) / 2) : 0;
  // Ember Hollow wards the Arsenal: you may still be caught, but the night can't snuff your Arsenal
  const emberShielded = nightCaught && reserve && S.emberShield;
  // 🌙 caught after dark: the Arsenal is only half of it
  const loseReserve = h === 'Riptide' ? '🌊 dragged under by the Riptide'
    : nightCaught && reserve && !S.emberShield && !hasArmourRule('nightwise') ? 'caught by Nightfall' : null;
  return { ...classPayload, type: 'journey', spell, hits, attBonus, attApplied, cardVal, added, attuner, loose, banks, bank, wake, wakeTarget, elem, boostC, boostVal, boostEff, nightCut, resonant, spellEl, enhEl, isEnh, enhUsed, wrongType,
           // ⚠️ WHEN compose() GAINS A FIELD, CHECK THE PAYLOAD IN THE SAME EDIT - three separate
           // bugs this month came from a value being computed and then never reaching the reveal.
           stride, strideNames: strideCards.map(c => c.def.name),
           base, withBoost, reserveBonus, value, mpEff, half, outcome, reserve, early: 0, combatDmg: 0,
           pace, nightfall, nightCaught, paceBless, emberShielded, peril, steepAdd, updraftCut, treacherousDmg, target: mpEff,
           lastMile, rouse,
           timePenalty, stormDmg, loseReserve, poison: 0, ability: null, hardship: h };
}

// ---------- Phase 2/3: resolve action, queue penalties ----------
// ✦ PERFECT KILL — you Completed, and no SMALLER card in your hand would also have done it.
// 🔑 NOT exact-lethal: hitting HP precisely with four cards is mostly luck, and **a reward you
// cannot aim for is a slot machine**. *Spend no more than you needed* is checkable, aimable, and
// states in ENGINE terms — a rogue earns one off a chain exactly as a mage earns one off a card.
// ⚠️ CONTESTED IS THE HALF THAT MATTERS. Measured over 1,992 Completes, **64% were already
// perfect by accident**, because only one card could ever have got there. A reward that fires by
// default is not an achievement, so the prize needs BOTH: yours was the smallest sufficient card
// AND another card would also have done it — i.e. you actually chose.
// ⚠️ IT SWAPS `S.assign` AND PUTS IT BACK, which is the *instrument that perturbs what it
// measures* trap. So: synchronous, never renders in between, restores in a `finally`, and runs
// ONCE per encounter from resolve() — in computeAction() it would re-run on every repaint for a
// fact that cannot change mid-turn.
function perfectKillInfo(outcome) {
  const none = { perfect: false, contested: false };
  if (outcome !== 'Complete' || !S.hand) return none;
  const a = S.assign, curId = a.Spell, cur = cardById(curId);
  if (!cur) return none;
  const ZONES = ['Spell', 'Element', 'Boost', 'Reserve'];
  const curVal = eff(cur).value;
  let smallerWorks = false, anyOtherWorks = false;
  for (const c of S.hand) {
    if (c.id === curId) continue;
    const zone = ZONES.find(z => a[z] === c.id);
    if (!zone || zone === 'Spell') continue;
    const prevSpell = a.Spell;
    try {
      a.Spell = c.id; a[zone] = prevSpell;
      const alt = computeAction(cardById(a.Reserve));
      if (alt && alt.outcome === 'Complete') {
        anyOtherWorks = true;
        if (eff(c).value < curVal) smallerWorks = true;
      }
    } catch (err) { /* an illegal arrangement is simply not an alternative */ }
    finally { a[zone] = c.id; a.Spell = prevSpell; }
  }
  return { perfect: !smallerWorks, contested: anyOtherWorks };
}

function resolve() {
  if (!rolesValid()) return;
  const e = S.encounter;
  const spell = spellCard();
  const elem = cardById(S.assign.Element);
  const boostC = cardById(S.assign.Boost);
  S.actionSetIds = [spell, elem, boostC].filter(Boolean).map(c => c.id);
  const reserve = cardById(S.assign.Reserve) || S.hand.find(c => !S.actionSetIds.includes(c.id)) || null;
  S.reserveId = reserve ? reserve.id : null;
  const boostVal = boostC ? eff(boostC).boost : 0;

  const r = computeAction(reserve);
  // ✦ computed here, once, while the hand is still seated exactly as it was played
  const pk = perfectKillInfo(r.outcome);
  r.perfect = pk.perfect && pk.contested;   // the PRIZE needs both
  r.perfectChance = pk.contested;           // ...and this is the grade's denominator

  log(`The weave — Spell: ${displayName(spell)} Lv${spell.level} (${r.spellEl}) = ${r.base}` +
      ` · Catalyst: ${elem ? `${elem.def.name} (${elem.def.wild ? 'Wild' : elOf(elem) || 'colorless'}, Init ${eff(elem).init})` : '—'}` +
      ` · Surge: ${boostC ? `${boostC.def.name} (+${boostVal} → ${S.boostTarget})` : '—'}` +
      ` · Arsenal: ${reserve ? reserve.def.name : '—'}`);

  // ---- build the staged reveal (numbers only appear AFTER you commit) ----
  const L = (text, cls = '') => ({ text, cls });
  const beats = [];

  if (r.type === 'fight') {
    // 🔑 INITIATIVE IS RESOLVED AND SHOWN FIRST (2026-08-17, Thomas: *"initiative should get
    // checked first when resolving. since it says you act first or not"*). It decides WHO MOVES
    // FIRST, so revealing it after the blow told the story backwards — the reader learned the
    // outcome of the exchange and only then who started it.
    // ⚠️ Ordering only. The maths never depended on the order; computeAction resolved the whole
    // turn before a single beat was built. This is the staged reveal reading in causal order.
    const b2 = [];
    if (r.initLost) b2.push(L(`Initiative: yours ${r.init} vs enemy ${e.init} → enemy is faster → Early Damage ${e.atk}`, 'bad'));
    else if (r.rangedHits) b2.push(L(`Initiative: yours ${r.init} vs enemy ${e.init} → you act first, but RANGED hits anyway → Early Damage ${e.atk}`, 'bad'));
    else b2.push(L(`Initiative: yours ${r.init} vs enemy ${e.init} → you act first, no Early Damage`, 'good'));
    if (r.early > 0 && S.hardship === 'Ambush') b2.push(L(`Ambush: Early Damage doubled → ${r.early}`, 'bad'));
    beats.push({ label: '💨 INITIATIVE', big: r.init, vs: `vs ${e.init}`, numCls: r.early ? 'bad' : 'ok', lines: b2 });

    const b1 = [];
    if (r.nightCut > 0) b1.push(L(`Night Travel: Boost reduced by your Catalyst's Initiative (${boostVal} − ${elem ? eff(elem).init : 0}) → +${r.boostEff}`, 'bad'));
    // 🗡️ a rogue turn is not an attunement - it gets its own lines, in its own vocabulary
    if (r.rogue) rogueActionLines(r, spell, L, 'Atk').forEach(x => b1.push(x));
    else if (r.enhUsed) b1.push(L(attunedLineText(r, spell, 'Atk'), 'good'));
    else b1.push(L(`Attack: ${r.base} — unattuned${elem ? ` (${elem.def.name} is ${elOf(elem)}, not ${r.spellEl})` : ' (no Catalyst)'}`));
    // the Surge ALWAYS feeds the action (the Attack/Initiative picker is gone), so this line must
 // never be gated on the retired boostTarget - it was silently adding damage the log didn't show.
    if (r.banks) b1.push(L(`⟳ CHANNELLED — ${boostC.def.name} pours into the Emberwake instead of the strike, ${bankCostPhrase(boostC)}. You carry <b>🔥 ${r.bank}</b> into next turn, to spend on your <b>strike</b> or your <b>speed</b>`, 'good'));
    // ⚠️ the Surge is a MAGE stat - the rogue's slot ③ pays ⚡ and adds no damage, so printing
    // "Surge +0" reported a mechanic she does not have
    else if (boostC && !r.rogue) b1.push(L(`Surge: ${boostC.def.name} +${r.boostEff} → ${r.withBoost}`));
    if (r.wakeTarget === 'atk' && r.wake) b1.push(L(`🔥 Emberwake +${r.wake} spent on the strike`, 'good'));
    // 🗡️ Whetstone was invisible: it added +1 per hit and the log never said so
    if (hasCharm('whetstone')) b1.push(L(`🗡️ Whetstone: +1 on every hit`, 'good'));
    if (r.armorCut) b1.push(L(`🛡️ Armour ${r.armorCut}: it shrugs off all but the heaviest blow → ${r.withBoost} − ${r.armorCut}`, 'bad'));
    // 🧱 GUARD, FINALLY SAID OUT LOUD. It had no line at all, so the blow just arrived smaller.
    // ⚠️ It names the COUNTER-PLAY too, because the shape has one and a single-hit turn should
    // be told what it was: hits beyond the pool land whole.
    if (r.guardCut > 0) b1.push(L(
      `🧱 Guard ${r.guardPool}: ${r.guarded} of your ${r.hits} hit${r.hits === 1 ? '' : 's'} met the plates and was halved — <b>−${r.guardCut}</b>` +
      (r.hits > r.guarded ? ` (the other ${r.hits - r.guarded} landed whole)` : ` · a second hit would have landed whole`), 'bad'));
    if (r.evaded) b1.push(L(`🌀 Evasion: you were too slow — it slips the blow, damage halved → ${r.value}`, 'bad'));
    beats.push({ label: '⚔️ ATTACK', big: r.value, vs: `vs ❤️ ${e.hp} (half ${r.half})`, numCls: r.enhUsed ? 'enh' : '', lines: b1 });

    beats.push({ outcomeBeat: true, final: true, lines: [
      L(`Attack ${r.value} vs HP ${e.hp} (half = ${r.half}) → ${r.outcome.toUpperCase()} ${r.outcome !== 'Loss' ? `· 🪙 +${e.xp}` : ''}${r.outcome !== 'Complete' ? ` · Combat Damage ${e.atk}` : ''}`,
        r.outcome === 'Loss' ? 'bad result' : r.outcome === 'Narrow' ? 'result' : 'good result'),
    ] });
  } else {
    const b1 = [];
    if (r.nightCut > 0) b1.push(L(`Night Travel: Boost reduced by your Catalyst's Initiative (${boostVal} − ${elem ? eff(elem).init : 0}) → +${r.boostEff}`, 'bad'));
    // ⚠️ name the ARSENAL, not the mage's stat - the rogue's Arsenal contributes ⚡ energy
    if (r.stride) b1.push(L(`👣 The road takes all of you — ${r.strideNames.join(' + ')} walk behind your Spell for +${r.stride}`, 'good'));
    if (r.steepAdd) b1.push(L(`Steep: MP raised by what your Arsenal would have given → ${e.mp} + ${r.steepAdd} = ${r.mpEff}`, 'bad'));
    if (r.rogue) rogueActionLines(r, spell, L, 'Move').forEach(x => b1.push(x));
    else if (r.enhUsed) b1.push(L(attunedLineText(r, spell, 'Move'), 'good'));
    else b1.push(L(`Move: ${r.base} — unattuned${elem ? ` (${elem.def.name} is ${elOf(elem)}, not ${r.spellEl})` : ' (no Catalyst)'}`));
    if (r.banks) b1.push(L(`⟳ CHANNELLED — ${boostC.def.name} pours into the Emberwake instead of the strike, ${bankCostPhrase(boostC)}. You carry <b>🔥 ${r.bank}</b> into next turn, to spend on your <b>strike</b> or your <b>speed</b>`, 'good'));
    else if (boostC && !r.rogue) b1.push(L(`Surge: ${boostC.def.name} +${r.boostEff} → ${r.withBoost}`));
    if (r.wakeTarget === 'atk' && r.wake) b1.push(L(`🔥 Emberwake +${r.wake} spent on the strike`, 'good'));

    beats.push({ label: '👣 MOVE', big: r.value, vs: `vs MP ${r.mpEff}${r.steepAdd ? ` (${e.mp}+${r.steepAdd} Steep)` : ''} (half ${r.half})`, numCls: r.enhUsed ? 'enh' : '', lines: b1 });

    const b2 = [];
    if (r.paceBless) b2.push(L(`Gray Pilgrim's blessing: +2 Pace → ${r.pace}`, 'good'));
    // ⚔️ ON THE LAST MILE, PACE RACES THE DRAGON — NOT NIGHTFALL. It used to print
    // "vs Nightfall 0 → home before dark", a race that could not be lost, on the most important
    // turn of the run. 🔑 A term shown doing nothing is worse than no term: it teaches the player
    // that the number does not matter, on the exact turn it matters most.
    if (r.lastMile) {
      const di = S.dragon.init, half = Math.ceil(di / 2);
      if (r.lastMile === 'unseen') b2.push(L(`🌒 Pace ${r.pace} vs its Initiative ${di} → you match it. You come up on the ${S.dragon.name} unheard — ${stripTags(unseenPromise())}`, 'good'));
      else if (r.lastMile === 'heard') b2.push(L(`🐉 Pace ${r.pace} vs its Initiative ${di} (half ${half}) → it hears you coming, and takes the opening blow: ${r.rouse} damage`, 'bad'));
      else b2.push(L(`Pace ${r.pace} vs its Initiative ${di} → you arrive without waking it, but it is set for you. No blow given, none taken.`));
      beats.push({ label: '💨 APPROACH', big: r.pace, vs: `vs 💨 Init ${di} (half ${half})`,
                   numCls: r.lastMile === 'heard' ? 'bad' : r.lastMile === 'unseen' ? 'enh' : 'ok', lines: b2 });
    } else {
    if (r.nightCaught && r.emberShielded) b2.push(L(`Pace: yours ${r.pace} vs Nightfall ${r.nightfall} → caught after dark, but the Ember Hollow wards your Arsenal (${r.reserve.def.name}) — it survives`, 'good'));
    else if (r.nightCaught) b2.push(L(`Pace: yours ${r.pace} vs Nightfall ${r.nightfall} → caught after dark${r.reserve ? ` → the night snuffs your Arsenal (${r.reserve.def.name})` : ' (no Arsenal to lose)'}`, 'bad'));
    else b2.push(L(`Pace: yours ${r.pace} vs Nightfall ${r.nightfall} → home before dark`, 'good'));
    beats.push({ label: '🌙 PACE', big: r.pace, vs: `vs Nightfall ${r.nightfall}`, numCls: r.nightCaught && !r.emberShielded ? 'bad' : 'ok', lines: b2 });
    }

    beats.push({ outcomeBeat: true, final: true, lines: [
      L(`Move ${r.value} vs MP ${r.mpEff} (half = ${r.half}) → ${r.outcome.toUpperCase()} ${r.outcome !== 'Loss' ? `· 🪙 +${e.xp}` : ''}${r.outcome !== 'Complete' ? ` · Time Penalty ${e.timePenalty}` : ''}`,
        r.outcome === 'Loss' ? 'bad result' : r.outcome === 'Narrow' ? 'result' : 'good result'),
    ] });
  }

  // 🧰 THE CARVE IS THE LAST BEAT (2026-08-23, Thomas: *"after that, lets show the drops we got
  // from that encounter"*).
  // 🔑 IT COSTS NO CLICK. Beats auto-advance every 1400ms and only the FINAL one waits — so moving
  // `final` onto the carve makes it play as one more stage of the same reveal rather than a screen
  // you have to dismiss. *A weightless decision is not a rest, it is homework* — this is not a
  // decision at all, it is a beat of pacing, which is the one thing the reveal is FOR.
  // ⚠️ Rolled HERE rather than in finishResolve() so the beat can show it. finishResolve() then
  // banks what was rolled instead of rolling again — two rolls would have shown you one haul and
  // given you another.
  r.drops = rollDrops(S.encounter, r.outcome, r.perfect);
  if (Object.keys(r.drops).length) {
    beats[beats.length - 1].final = false;
    beats.push({ carveBeat: true, final: true, lines: [] });
  }

  S.pendingR = r;
  S.beats = beats;
  S.beatIndex = -1;
  S.phase = 'reveal';
  advanceBeat();
}

// step through the reveal: auto-advances with a delay, click to hurry, outcome waits for a click
// ============================================================
// 💥 IMPACT (2026-07-29). Pure CSS on the two ANIMATION SLOTS - nothing here touches layout
// or logic, so real sprites drop in later without any of it changing.
//
// 🔑 THE REACTION IS THE MECHANIC, NOT DECORATION. Each defence shape gets its OWN reaction,
// so a player learns what a shape DOES by watching it once:
//     🛡️ ARMOUR ate most of it  -> it SHRUGS: sparks skitter, the body barely moves
//     🌀 EVASION slipped you     -> it is NOT THERE: a lateral blur, the blow passes through
//     a clean hit                -> it ROCKS, and harder the bigger the hit
// That is the same argument as the enemy panel naming the shape: teach through what the player
// sees, not through a tutorial line.
//
// Calibration is old-school Pokemon on purpose - a flash, a shake, a knock-back. Cheap, readable,
// and it tells us whether animation is worth the sprite work BEFORE anything is modelled.
const REDUCED = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
function fx(sel, cls, ms) {
  if (REDUCED()) return;
  const el = typeof sel === 'string' ? $(sel) : sel;
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;              // restart the animation if it is already running
  el.classList.add(cls);
  setTimeout(() => el && el.classList.remove(cls), ms);
}
// how hard did that land, as a share of what the target can take
function hitWeight(value, pool) {
  if (!pool || value <= 0) return 0;
  const f = value / pool;
  return f >= 0.30 ? 3 : f >= 0.15 ? 2 : 1;
}
// play whatever this revealed beat earned
function beatFx(beat) {
  const r = S.pendingR;
  if (!r || !beat || !beat.label) return;
  if (beat.label.includes('ATTACK') || beat.label.includes('STRIKE')) {
    if (r.evaded) { fx('foe-slot', 'fx-evade', 480); return; }
    // armour ate the lion's share -> the shrug, which is the shape's whole lesson
    const raw = (r.withBoost || r.value || 0);
    if (r.armorCut && r.value <= raw * 0.55) { fx('foe-slot', 'fx-shrug', 520); return; }
    const pool = S.dragonState ? S.dragonState.maxHp : (S.encounter ? S.encounter.hp : 0);
    const w = hitWeight(r.value, pool);
    if (w) { fx('foe-slot', 'fx-hit-' + w, 520); if (w === 3) fx('scene', 'fx-shake', 380); }
  } else if (beat.label.includes('MOVE')) {
    if (r.outcome === 'Complete') fx('scene', 'fx-surge', 900);
  } else if (beat.label.includes('INITIATIVE')) {
    if (r.early > 0) { fx('mage-slot', 'fx-hurt', 460); fx('scene', 'fx-shake', 300); }
  } else if (beat.label.includes('PACE')) {
    if (r.nightCaught) fx('scene', 'fx-dark', 700);
  }
  if (beat.outcomeBeat && r.combatDmg > 0) { fx('mage-slot', 'fx-hurt', 460); fx('scene', 'fx-shake', 300); }
}

function advanceBeat() {
  if (S.phase !== 'reveal') return;
  if (S.beatTimer) { clearTimeout(S.beatTimer); S.beatTimer = null; }
  S.beatIndex++;
  const beat = S.beats[S.beatIndex];
  if (!beat) {
    if (S.finalPhase === 'duel') finishDuel();
    else finishResolve();
    return;
  }
  for (const l of beat.lines) log(l.text, l.cls);
  if (!beat.final) S.beatTimer = setTimeout(advanceBeat, 1400);
  render();
  beatFx(beat);   // after render, so the slots exist to animate
}

function beatDisplayHTML(beat, isNew) {
  const pop = isNew ? ' beat-pop' : '';
  const r = S.pendingR, e = S.encounter;
  if (beat.outcomeBeat) {
    const subs = [];
    subs.push(r.outcome !== 'Loss' ? `<div class="pv-sub good">🪙 +${e.xp}</div>` : `<div class="pv-sub bad">no coins</div>`);
    // ✦ named where the verdict is, because it IS part of the verdict
    if (r.perfect) subs.push(`<div class="pv-sub good">✦ PERFECT KILL — nothing to spare</div>`);
    const dmg = r.early + r.combatDmg + (r.treacherousDmg || 0) + r.stormDmg;
    if (dmg > 0) subs.push(`<div class="pv-sub bad">damage to block: ${dmg}</div>`);
    if (r.timePenalty > 0) subs.push(`<div class="pv-sub bad">⏳ Time Penalty ${r.timePenalty}</div>`);
    if (r.poison > 0) subs.push(`<div class="pv-sub bad">☠️ Poison: ${r.poison} to your next hand</div>`);
    if (r.loseReserve) subs.push(`<div class="pv-sub bad">your Arsenal is lost — ${r.loseReserve}</div>`);
    return `<div class="pv-result${pop}"><span class="oc oc-${r.outcome}">${r.outcome.toUpperCase()}</span>` +
      `<div class="pv-result-subs">${subs.join('')}</div></div>`;
  }
  if (beat.carveBeat) {
    // 🧰 THE CARVE IS NOT A STAT COLUMN. It used to render `<div class="pv-num">🧰</div>`, an
    // EMOJI in the slot where every sibling beat shows a NUMBER — so the eye read it as a stat that
    // was not one, and the warm box around it competed with the verdict beside it.
    // 🔑 IT IS A LIST OF THINGS YOU GAINED, so it renders as chips on the verdict row instead.
    const ids = Object.keys(r.drops || {});
    // 🦴 ITS OWN SECTION, NOT A TAG ON THE VERDICT ROW (Thomas, 2026-08-26: *"it should be its
    // own section, formatted cleanly and nicely, maybe it should be called like Drops"*).
    // ⚠️ It has now been wrong twice in one day for the same reason: it was a stat column, then it
    // was a chip beside the outcome pill — both times **wedged into a row that was about something
    // else**. 🔑 What you WON and what it COST you are two different statements, and putting them on
    // one line asks the reader to separate them. A heading does that for free.
    // ✅ And it is called DROPS: *carved* is flavour, and this is a list of things you now own.
    return `<div class="pv-drops${pop}">` +
      `<div class="pv-drops-head">\u{1F9B4} DROPS</div>` +
      `<div class="pv-drops-list">` +
      ids.map(id => `<span class="mat-chip">${matDef(id).icon} ${matDef(id).name}` +
        `${r.drops[id] > 1 ? `<b>\u00d7${r.drops[id]}</b>` : ''}</span>`).join('') +
      `</div></div>`;
  }
  return `<div class="pv-stat${pop}"><div class="pv-num ${beat.numCls}">${beat.big}</div>` +
    `<div class="pv-label">${beat.label} ${beat.vs}</div>` +
    beat.lines.map(l => `<div class="pv-sub ${l.cls}">${l.text}</div>`).join('') + `</div>`;
}

// apply the resolution's consequences (runs once the reveal finishes)
function finishResolve() {
  const r = S.pendingR;
  const e = S.encounter;
  S.pendingR = null; S.beats = null; S.beatIndex = -1;
  S.results[r.outcome]++;
  contractTick(r);   // 📜 a contract reads the turn the engine already resolved
  // 💀 remember a clean elite kill; backToMap() pays it
  if (S.map && S.map.pos) {
    const here = S.map.floors[S.map.pos.f][S.map.pos.c];
    // 💀 YOU HAVE TO KILL IT (Thomas 2026-08-24: *"getting a charm for not killing it just
    // feels a bit weird, and easy?"*). A Narrow is `value >= half` — you WOUNDED it and walked
    // away — and yet the boon screen said *"the dangerous thing is dead"* and the log line said
    // *"off the thing you killed"*. 🔑 THE PRIZE TEXT WAS ASSERTING A KILL THAT DID NOT HAPPEN.
    // ⚠️ This gate was tried twice before and failed BOTH times for the same reason — at ELITE_HP
    // ×2.0 a kill fires on 1% (mage) / 3% (rogue) of elites, so it paid 0.02 charms a run, one
    // every forty. 🔑 THE FAULT WAS NEVER THE GATE, IT WAS THAT THE KILL WAS ARITHMETICALLY OUT OF
    // REACH — the 🧱 GUARD 2 shape, a rule gated on an outcome the maths forbids. ELITE_HP came
    // down to ×1.15 in the same commit, which is what makes this line honest rather than dead.
    // 🔑 AND THE TWO DIALS ARE INDEPENDENT: **HP decides whether you can WIN, ATK decides what it
    // COSTS.** ELITE_ATK is untouched at +4, so an elite hits exactly as hard as it always did —
    // measured 9.5–10.6 a hit for the mage at EVERY HP setting from ×2.0 to ×1.0. The dread did
    // not move; only the win state appeared.
    // 🔑 THE PRICE OF AN ELITE IS STILL THE DAMAGE. Walking away pays the coins and the materials
    // (see rollDrops) — it is the CHARM that now costs a kill.
    if (here && here.type === 'elite' && r.outcome === 'Complete') S.boonOwed = true;
  }
  // 🎯 cleanup happens several steps after the reveal, so anything a rule-charm needs to know
  // about the turn just played has to be stashed here rather than recomputed from S.assign.
  // ✦ the run's tally. `perfectChances` is the denominator: encounters where more than one card
  // would have Completed — i.e. where being economical was a DECISION, not the only line.
  if (r.perfectChance) S.stats.perfectChances = (S.stats.perfectChances || 0) + 1;
  if (r.perfect) {
    S.stats.perfect = (S.stats.perfect || 0) + 1;
    log(`✦ <b>PERFECT KILL</b> — no smaller card would have done it. The part is certain.`, 'good');
  }
  S.lastOutcome = r.outcome;
  if (S.finalMode && S.finalPhase === 'lastmile') { S.lastMileOutcome = r.outcome; S.lastMileApproach = r.lastMile; }
  S.lastAttuned = !!r.enhUsed;
  // 🗡️ ADVANCE THE CHAIN. Sits beside lastAttuned/lastOutcome because it is the same kind of thing:
  // a breadcrumb the NEXT turn's class rule reads. The engine records it; only the rogue asks.
  // 🗡️ COMMIT THE METER. compose() already worked out where it lands; cleanup only stores it,
  // so the number the player was shown before Resolve is the number they get. Same discipline as
  // 🗡️ Ghostblade reading the resolved turn rather than recomputing from the arrangement.
  if (r.rogue) {
    // 🗡️ Viper Strike / Sleight of Hand — the extra cards arrive with NEXT turn's hand.
    // ⚠️ THE DRAW CANNOT HAPPEN NOW: the verb only fires because you committed this arrangement,
    // and this turn's four cards are already spoken for. Drawing into a hand that has finished
    // being played is where the card would have nowhere to sit.
    S.drawExtra = r.rogue.verb === 'cycle2' ? 2 : (r.rogue.verb === 'draw' ? 1 : 0);
  }
  // a Gray Pilgrim / Mirror Fen blessing covers a limited number of journeys — spend a charge
  if (r.type === 'journey' && (S.paceBless || 0) > 0) S.paceBless--;
  // in the finale's Approach, each journey-beat's outcome is banked (both Complete → crack a shield)

  // a journey you Complete or Narrow earns an Event at turn's end (the place you arrive) — never in the finale
  // 🏕️ AN EVENT IS ITS OWN TURN, SCHEDULED BY THE REGION (2026-08-18, step 2).
  // Thomas: *"lets do the encounter type change, i think thats how i envisioned it anyways."*
  // 🔑 IT IS NO LONGER EARNED BY A JOURNEY AT ALL. An event used to be a RIDER: a journey
  // resolved, and then a second screen appeared inside the same turn. That made a fight one screen
  // and a journey three, and journeys are 54% of encounters - so the majority encounter type was a
  // compound and the run had no beat that wasn't a question. Scheduling it per region instead
  // makes both encounter types one screen each and gives the event a beat of its own.
  // ⚠️ IT TAKES A TURN BUT NOT AN ENCOUNTER SLOT - `S.regionTurn` is NOT incremented on an
  // event turn. That is deliberate and load-bearing: `REGION_ENCOUNTERS` is the accounting unit for
  // the region clock, the `dry` check, dragon PAR, and 📜 quest-contract windows via `runLeft`.
  // 🔑 Counting an event as an encounter would silently hand every contract a window a quarter
  // of which cannot progress it - the *"never offer one without room to keep it"* trap, arriving
  // through the back door. **An event costs you time, never cards, and never a card encounter.**
  if (r.banks) S.wakePending = r.bank;
  // 🕯️ a clean win keeps your footing; anything less costs it — and the dark takes it regardless
  if (!S.finalMode) {
    if (r.nightCaught) snuffCandle('the dark caught you on the road');
    else if (r.outcome === 'Complete') lightCandle('you come through cleanly');
    else if (r.outcome === 'Narrow' && hasArmourRule('steadyflame')) log(`🛡️ Farseer's Circlet — your candle holds through the scrape.`, 'good');
    else snuffCandle(r.outcome === 'Narrow' ? 'you scraped through' : 'the encounter went badly');
  }
  // 📊 CRAFT: was your class's source of power AVAILABLE in this hand, and did you find it?
  // Availability is a property of the HAND, so the stat measures your play, not your luck.
  //
  // 🐛 THIS WAS A MAGE RULE SITTING IN THE ENGINE (found 2026-08-21, from a screenshot of a
  // winning rogue run reading *"✦ craft — attuned 0 of 15 — 0/20"*). It asked "does this hand
  // hold a same-element pair?", and a rogue card has NO element — so `elOf()` returned null for
  // all four, `indexOf` found a "duplicate" every single turn, and she was credited with 15
  // phantom chances to attune and scored ZERO for missing all of them.
  // 🔑 IT IS NOT A COSMETIC BUG: craft is 20 of 100, so the rogue's ceiling was 80 and she could
  // never earn an S on any stage — which quietly deletes [[The_Wall]], and the wall is the
  // retention answer *stages × classes* was built on.
  // ⚠️ THE CLASS SEAM AGAIN: the engine may ask *"was your power available, did you use it"*;
  // only the CLASS may say what its power IS.
  if (S.stats && CLASS.craft) {
    if (CLASS.craft.avail(S.hand)) S.stats.craftAvail++;
    if (CLASS.craft.found(r)) S.stats.craftFound++;
  }
  // 🪙 COINS CANNOT GO NEGATIVE (fixed 2026-07-29). ☠️ The Tithe takes 2 from every encounter, so a
  // low-XP one — the Approach pays 0 — drove the purse below zero and the Wheel offered prices
  // against a debt. A curse should take what you HAVE, never put you in the red: negative money
  // is a state with no way back, and it silently taxed every future encounter too.
  // The log also printed "+-2 coins", which is its own small lie about what happened.
  // 🦴 CARVE FIRST, THEN THE PURSE — the same order the log reads.
  S.encountersDone = (S.encountersDone || 0) + 1;
  bankDrops(r.drops || rollDrops(S.encounter, r.outcome));
  // ⭐ every encounter moves the bar, however it went
  awardXP((XP_AWARD[r.outcome] || 0) * (S.encounterElite ? XP_AWARD.eliteMult : 1));
  if (r.outcome !== 'Loss') {
    const g = Math.round((e.xp + (r.outcome === 'Complete' ? COMPLETE_BONUS : 0)) * COIN_MULT) + charmMod('coin');
    const got = Math.max(g, -S.coins);          // it can empty your purse, never overdraw it
    S.coins = Math.max(0, S.coins + g);
    if (got >= 0) log(`+${got} coins${r.outcome === 'Complete' ? ` (${e.xp} + ${COMPLETE_BONUS} for the clean win)` : ''} (you now hold ${S.coins})`, 'good');
    else log(`${got} coins — ${e.xp ? `${e.xp} earned, but the Tithe takes its share` : 'the Tithe takes its share'} (you now hold ${S.coins})`, 'bad');
  }
  let damage = r.early + r.combatDmg + (r.treacherousDmg || 0);
  if (r.treacherousDmg) log(`Treacherous: no Complete Victory → +${r.treacherousDmg} damage`, 'bad');
  if (r.stormDmg > 0) { damage += r.stormDmg; log(`Storm: Time Penalties also deal ${r.stormDmg} damage`, 'bad'); }
  // ⚔️ THE LAST MILE — arriving loud. It goes through `damage` rather than getting its own
  // mechanism, so the ordinary soak phase handles it and nothing new had to be built.
  // ⚠️ AND IT MUST SIT ABOVE THE MOMENTUM BLOCK: ● the streak breaks on *any* damage, and being
  // heard by the dragon is damage. That is correct and it is free — one rule, not a special case.
  if (r.rouse > 0) {
    damage += r.rouse;
    log(`🐉 It heard you coming. The ${S.dragon.name} is already up as you reach the mouth, and takes the opening blow — <b>${r.rouse}</b> damage.`, 'bad');
  }
  if (r.loseReserve) S.loseReserve = r.loseReserve;
  if (r.poison > 0) S.poison = r.poison;
  S.damageEl = null;   // dead since soak doubling was cut 2026-07-26; kept in the schema for old saves
  // ⏳ TIME PENALTY = STOPS WITHOUT SHARPENING (2026-08-22). It used to move cards deck → discard,
  // and the MAP DELETED THE CURRENCY THAT COST WAS DENOMINATED IN: nothing ends a region any more,
  // band boundaries reshuffle everything back, and running dry reshuffles and continues. Measured:
  // it landed on 19% of turns, burned 6.4 cards a run, and cost **0.11 points of damage** — the
  // third phantom cost this project has found, and it was announced on the panel as a threat.
  //
  // 🔑 Thomas named the feel he wanted from the old rule: *"you have to end a region short and may
  // not get to upgrade as much as you wanted."* **The consequence he named IS the mechanic now** —
  // no cards are destroyed (*"trashed sounds pretty rough"*), you simply arrive too late to trade.
  //
  // ⚠️ A COUNTDOWN, NOT A METER, AND THE DISTINCTION IS THE WHOLE REASON HE REJECTED THE FIRST
  // VERSION: *"i don't like that it has to fill up, kinda unintuitive."* A meter separates the cause
  // from the cost — fail a journey now, lose a shop three turns later, against a threshold you had
  // to learn. **A countdown puts the cause and the cost in the same event, and the number printed on
  // the encounter says exactly how long it lasts.** Same fault the press-your-luck sneak was cut for.
  //
  // ✅ And it finally makes the NUMBER mean something: `Time Penalty 3` was identical to `2` while
  // both did nothing. It also restores the second thing that separates a journey from a fight —
  // a failed fight costs cards NOW, a failed journey costs GROWTH.
  if (r.timePenalty > 0 && hasArmourRule('surefooted')) log(`🛡️ Quickstep Greaves — you ignore the Time Penalty.`, 'good');
  else if (r.timePenalty > 0) {
    S.delayed = (S.delayed || 0) + Math.max(1, Math.round(r.timePenalty * TIME_PENALTY_MULT));
    log(`⏳ Time Penalty ${r.timePenalty} — the road ran long. No sharpening for your next ` +
        `${S.delayed} encounter${S.delayed === 1 ? '' : 's'}.`, 'bad');
  }
  // ❌ the 🛡️ armour aim was CUT 2026-08-12 (chosen 2.3% of the time, and the one target the
  // candle cannot inform) — its absorption branch goes with it, in the same commit as the rule.
  // ● THE STREAK, SETTLED HERE AND NOWHERE ELSE — because "untouched" is not knowable until every
  // source of damage has been totalled. ⚠️ It must sit BELOW the Time Penalty block: that burns
  // cards straight off the deck without ever passing through `damage`, and a turn that cost you
  // cards is a turn that touched you whatever the variable is called.
  tickMomentum(damage, r);
  S.damage = damage;
  if (damage > 0) { log(`Damage to block: ${damage}`, 'bad'); startSoak(); }
  else startUpgrade();
}

// ============================================================
// 🛡️ ARMOUR — the loadout you bring, spec in `08_Ideas/Armour_And_The_Workshop.md`.
//
// 🔑 IT IS THE ANSWER TO THE BUILD-DISCOVERY GAP, and it pays that debt without spending the
// pillar: the 16 cards stay fixed, the deck still starts at 32 levels, nothing is acquired
// mid-run. What changes is *what you walked in wearing* — a layer OUTSIDE the deck.
//
// 🔴 THE LOAD-BEARING RULE: ARMOUR IS ARMOUR. Its job is to take a hit your DECK would otherwise
// take. Abilities are garnish. A piece whose effect is a number that is always on is the wrong
// piece — four permanent passives is a difficulty curve that inverts the longer you play.
// ✅ ENFORCED BY CONSTRUCTION IN V1: every ability triggers ON BLOCK (`onBlock`). There is no
// field for an always-on effect, so a vertical piece cannot be written.
//
// 🔴 AND THE REASON IT MAY EXIST AT ALL: it is the first thing in the game that adds health from
// OUTSIDE the deck. That is acceptable ONLY because it breaks. Deck-as-health dies the day a
// piece stops running out. Every piece has `wear`, and the field row prints it as pips.
//
// 📦 PORT: `onBlock` is a STRING KEY dispatched by one named helper, deliberately NOT an arrow
// function — this table is pure data and can move to data/*.json whole. Keep it that way.
// ============================================================
// ⚠️ THE PER-SLOT `job` LINE IS GONE FROM THE SCREEN (Thomas, 2026-08-25: *"lets remove the
// text about, what you can see, what you can take. lets keep that hidden from players. lets not
// limit our gear to it, lets use it as a guideline but not 100%"*).
// 🔑 IT WAS A DESIGN NOTE WEARING A UI LABEL. *Head = what you can see* is an authoring heuristic
// that kept the four zones from collapsing into four copies of "+block" - useful to write against,
// and **a promise the moment it is printed.** Printed, it says every Head piece is about
// information, so the first Head piece that is not reads as a mistake rather than as variety.
// 🔑 SAME FAULT AS THE `arch` CHARM GATE, WHICH WAS DELETED FOR IT: FORCE/SPARK/FLOW/WARD is an
// authoring tool printed nowhere, and the moment a rule NAMED it, the rule was doing invisible
// arithmetic. Here it is the inverse - the heuristic was VISIBLE and therefore binding. Either way
// the rule is the same: **an authoring heuristic and a player-facing promise are different
// objects, and one must never be shipped as the other.**
// ✅ The themes survive as a guideline in the comments over ARMOUR, where they belong.
const ARMOUR_SLOTS = {
  Head:  { icon: '🪖', label: 'Head' },
  Chest: { icon: '🥋', label: 'Chest' },
  Arms:  { icon: '🧤', label: 'Arms' },
  Legs:  { icon: '👢', label: 'Legs' },
};
// how many slots you may fill. ⚠️ Thomas's call 2026-08-23: START AT TWO, earn the other two.
// ⚠️ 2 → 4 (2026-08-23). This REVERSES the earlier *"let the armor start off with 2"*, and the
// reason is his own later, more specific instruction: *"you start off with this full set"* — plus
// a mockup drawn with four open zones, not two and two locks.
// 🔴 AND THE LOCKS COULD NOT BE OPENED. Nothing in the game unlocks a slot; there is no
// mechanism, so a new player met two zones marked 🔒 with no way to ever reach them. **A locked
// thing you can see is a goal only if it can be won** — otherwise it is a button that lies, which
// is the exact thing the Collection screen was written to avoid.
// 📏 Measured, and it is why this is safe: the full set at block 1 takes 22-28% of blows and
// moves the duel by +2. Wearing four is a bigger TEACHING surface at almost no power.
// ✅ Slot count remains available as a progression later — it is just not one today, and pretending
// otherwise cost nothing but honesty.
let ARMOUR_SLOTS_OPEN = 4;
// 🛡️ HOW MANY PIECES YOU WEAR. ⚠️ Kept as a function even though it now just reads the constant,
// because every call site was already converted and a slot count is exactly the sort of thing that
// wants a rule again later — but if it does, that rule belongs to the WORKSHOP and its materials,
// not to the account ladder (Thomas, 2026-08-23).
function armourSlotsOpen() { return ARMOUR_SLOTS_OPEN; }

// 🔑 A PIECE HAS ONE NUMBER, AND TWO KINDS (Thomas, 2026-08-23):
//   *"worn 2, blocks for 2, and then doesn't block for anything anymore."*
//   *"shatter should still be there, basic armor pieces will just block once, and disappear.
//    worn will atleast stick around if the armor has an ongoing ability, or an ability that could
//    be used once every encounter."*
//
//     💥 SHATTER — blocks once, then it is GONE from the board. The basic piece.
//     🩹 WORN    — blocks once, but STAYS, because it is still doing something.
//
// ⚠️ I had invented a second number (a block VALUE plus a separate USES count) and it made the
// rule need a sentence: *"turns 4, then 4, then nothing"*. It needs one number.
//   🛡️ Kilnplate — blocks 2. Once. Then it is gone.
// ✅ *Rules text states the rule and nothing else* applies to a rule's SHAPE, not only its wording.
// If it takes a sentence to say, the shape is wrong.
//
// 🔑 WORN HAS TO EARN ITS NAME. A piece that stays on the board with nothing left to do is
// clutter, so `brk: 'worn'` is only legal alongside ONE of:
//     • `ongoing`  — a rule that is live while you wear it
//     • `every: 'encounter'` — its block comes back at every encounter
//     • `uses` + `use` — charges of an activated ability
//
// ⚠️ `ongoing` IS THE ONE DANGEROUS FIELD, because it is the always-on effect this system spent
// three revisions avoiding. It is allowed, under the bar already written for CHARMS and for the
// same reason: 🔴 AN ONGOING ABILITY MUST CHANGE A RULE, NEVER ADD A NUMBER. *"Your candle is not
// snuffed by a Narrow"* is a rule. *"+2 to your strike"* is power creep with a slot on it.
//
// ⚠️ BLOCK CAPS AT 2 FOR NOW — 3 is late gear (stage-4 tier), so the ceiling has somewhere to go.
// 🛡️ And a piece may block nothing at all (`block: 0`): those are pure ability pieces.
const ARMOUR = [
  // ⚪ THE ADVENTURER'S SET — the gear you start in (2026-08-23, Thomas: *"name it like
  // adventurer's hood, adventurer's tunic, gloves, and pants. you know like how an RPG would name
  // their gear. it should have no abilities on it, it just blocks 1 each. and you start off with
  // this full set"*).
  // 🔑 IT REPLACES THE FOUR PLAIN COMMONS RATHER THAN JOINING THEM. Those four (Wayfarer's Hood,
  // Kilnplate, Slagiron Vambrace, Roadworn Boots) were identical to each other except for the zone
  // and to this set except for the name — filler nobody would ever wear once they owned anything
  // else. Deleting them means **every craftable piece now has an ability**, which is a much
  // cleaner ladder: you start in plain cloth and everything you forge DOES something.
  // ⚠️ Blocks 1, no ability, no recipe. It is a teaching object: visible on one blow in seven and
  // worth under a point of win rate. The lesson is the CHOICE, never the number.
  { id: 'a_hood',   slot: 'Head',  name: "Adventurer's Hood",   block: 1, brk: 'shatter', rarity: 'common', starter: true },
  { id: 'a_tunic',  slot: 'Chest', name: "Adventurer's Tunic",  block: 1, brk: 'shatter', rarity: 'common', starter: true },
  { id: 'a_gloves', slot: 'Arms',  name: "Adventurer's Gloves", block: 1, brk: 'shatter', rarity: 'common', starter: true },
  { id: 'a_pants',  slot: 'Legs',  name: "Adventurer's Pants",  block: 1, brk: 'shatter', rarity: 'common', starter: true },
  // ⚠️ THE ZONE THEMES BELOW ARE A GUIDELINE, NOT A RULE (Thomas, 2026-08-25: *"lets use it as a
  // guideline but not 100%"*). They exist so four zones do not collapse into four copies of
  // "+block", and they are the first thing to try when writing a new piece — but a piece that
  // wants to break its zone is allowed to, and that is why the theme is no longer PRINTED.
  // 🔑 A guideline you can depart from is a design tool; the same sentence on screen is a promise
  // the next piece has to keep.
  // 🕶️ HEAD — usually information. The candle's slot.
  { id: 'visor',   slot: 'Head',  name: 'Emberglass Visor',   block: 2, brk: 'shatter', rarity: 'uncommon',
    onBlock: 'relight', text: 'When it blocks, relight your candle.' },
  { id: 'circlet', slot: 'Head',  name: "Farseer's Circlet",  block: 2, brk: 'worn', rarity: 'rare',
    ongoing: 'steadyflame', text: 'Your candle is not snuffed by a Narrow.' },
  // 🧥 CHEST — usually what you can afford to lose.
  { id: 'tithe',   slot: 'Chest', name: 'Tithe Harness',      block: 2, brk: 'shatter', rarity: 'uncommon',
    onBlock: 'coins', text: 'When it blocks, gain 3 coins.' },
  // 🟠 the one piece that measured as a different category of power, now labelled as one
  { id: 'cuirass', slot: 'Chest', name: 'Anvil Cuirass',      block: 2, brk: 'worn', rarity: 'legendary',
    every: 'encounter', text: 'It blocks again every encounter.' },
  // 🧤 ARMS — usually the blow.
  { id: 'bracers', slot: 'Arms',  name: 'Cinderfist Bracers', block: 2, brk: 'shatter', rarity: 'uncommon',
    onBlock: 'strike', text: 'When it blocks, your next strike gets +4.' },
  { id: 'wraps',   slot: 'Arms',  name: 'Emberfist Wraps',    block: 0, brk: 'worn', rarity: 'rare',
    uses: 1, use: 'burst', text: 'Once a run: your strike gets +8 this turn.' },
  // 🎯 The third home for granted multi-hit. ⚠️ On the ARMS zone because that is *usually the
  // blow* - a guideline, not a rule, and this one keeps it.
  // 🔴 IT SHIPPED AS `onBlock` AND THOMAS KILLED IT THE SAME HOUR: *"you get it on your next
  // strike if you block? you wouldn't ever know."* He is right, and it is sharper than my own note
  // that the timing was merely unchosen. 🔑 **THE SPLIT WOULD HAVE LANDED ON A DIFFERENT TURN FROM
  // THE ONE THAT EARNED IT** - you cannot plan around a bonus you did not ask for, arriving after
  // the decision it was supposed to inform. An `onBlock` that pays THIS turn (relight, +4 strike)
  // is a reward; one that pays NEXT turn is a surprise, and a surprise fights *legible math always*.
  // ✅ An active use fixes it completely, and it is the same fix the potion already embodies:
  // **a lateral effect must be OPTIONAL, and the cheapest way to make it optional is to let the
  // player press it.** Modelled on 🔥 Emberfist Wraps, the piece directly above.
  { id: 'twinned', slot: 'Arms',  name: 'Twinned Bracers',    block: 0, brk: 'worn', rarity: 'rare',
    uses: 1, use: 'split', text: 'Once a run: your strike splits in two this turn — better into 🧱 Guard, worse into 🛡️ Armour.' },

  // ============================================================
  // 🏹 NINE PIECES FOR THE NINE UNUSED QUARRIES (2026-08-27).
  // 🔴 MEASURED: 7 of 16 quarries had a recipe. The other NINE dropped a signature part that
  // **nothing in the game wanted** — it landed in the Stash and sat there forever. The quarry system
  // exists to turn *"66 interchangeable stat blocks"* into *"50 fodder and 16 you remember"*, and
  // nine of the sixteen were memorable creatures whose trophy was inert.
  // ⚠️ AND ROAD 4 WAS THE THINNEST — one recipe of four, which is backwards: the hardest road had
  // the least to earn from it. Three of these are Fathom quarries for exactly that reason.
  // ⚠️ SLOTS WERE LOPSIDED TOO: Arms had 3 deep-hunt pieces, Head and Chest had 1 each. **Arms
  // gets none of these**; Head, Chest and Legs get three apiece.
  // 🔑 EVERY ONE CHANGES A RULE RATHER THAN A NUMBER — the charm pass measured rule-changers at the
  // top of the value table and flat numbers at the bottom, and a hardcore TCG player reads filler
  // instantly. ⚠️ And each names something the player can SEE: the candle, Initiative, a card's
  // level, Nightfall, coins.

  // 🕯️ HEAD — information
  { id: 'dawncap',  slot: 'Head',  name: 'Dawnwatch Cap',      block: 1, brk: 'worn', rarity: 'rare',
    ongoing: 'dawnlit', text: 'Your 🕯️ candle is lit again at the start of every region.' },
  { id: 'farhood',  slot: 'Head',  name: "Gorsewarden's Hood", block: 1, brk: 'worn', rarity: 'rare',
    ongoing: 'farsight', text: 'While your 🕯️ candle is lit, your 💨 Initiative is +2.' },
  { id: 'deepglass', slot: 'Head', name: 'Deepglass Crown',    block: 2, brk: 'worn', rarity: 'legendary',
    ongoing: 'everlit', text: 'Your 🕯️ candle never goes out.' },

  // 🧥 CHEST — what you can afford to lose
  { id: 'boarcoat', slot: 'Chest', name: 'Boarhide Coat',      block: 1, brk: 'worn', rarity: 'rare',
    ongoing: 'softfall', text: 'A <b>Lv1</b> card that blocks is not destroyed — it goes to your discard instead.' },
  { id: 'oxharness', slot: 'Chest', name: "Fen Ox Harness",    block: 2, brk: 'worn', rarity: 'rare',
    ongoing: 'ledger', text: 'When a card is destroyed, gain 🪙 <b>8 coins</b>.' },
  { id: 'siltplate', slot: 'Chest', name: 'Siltcrawler Plate', block: 2, brk: 'worn', rarity: 'legendary',
    ongoing: 'tidewall', text: 'Damage is <b>1 less</b> for every card you have already blocked with this encounter.' },

  // 🎭 CLASS GEAR — two per class, and NOT on Arms (2026-08-27).
  // ⚠️ There were only TWO class pieces in the game, ✦ Emberwake Band and 🗡️ Fangcord, and both
  // were Arms, both legendary, both once-a-run actives. So a class's identity showed up in exactly
  // one slot, at the far end of the hunt, in the one form the bot could not even measure.
  // 🔑 EACH OF THESE KEYS OFF THE CLASS'S OWN RULE rather than a generic stat — the mage's is
  // pairing and 🔥 the Emberwake, the rogue's is ● Momentum. That is the class seam expressed in
  // equipment: the ENGINE owns the slot, the CLASS owns what fills it.
  { id: 'wakecowl',  slot: 'Chest', name: 'Emberwake Cowl',   block: 2, brk: 'worn', rarity: 'rare', cls: 'mage',
    ongoing: 'wakeguard', text: '🔥 While you hold an Emberwake, every card <b>blocks +2</b>.' },
  { id: 'slowwick',  slot: 'Legs',  name: 'Slowwick Treads',  block: 1, brk: 'worn', rarity: 'legendary', cls: 'mage',
    ongoing: 'wakekeep', text: '🔥 Your Emberwake <b>does not expire</b> — it keeps until you spend it.' },
  { id: 'bloodcord', slot: 'Chest', name: 'Bloodcord Vest',   block: 2, brk: 'worn', rarity: 'rare', cls: 'rogue',
    ongoing: 'bloodpip', text: '● The <b>first card you block with</b> each encounter gains you a <b>pip</b>.' },
  { id: 'quietstep', slot: 'Legs',  name: 'Quietstep Boots',  block: 1, brk: 'worn', rarity: 'legendary', cls: 'rogue',
    ongoing: 'steadymo', text: '● A <b>Narrow</b> costs you <b>one pip</b> instead of breaking your Momentum.' },

  // 👢 LEGS — speed
  { id: 'toadboots', slot: 'Legs', name: 'Anvil Toad Boots',   block: 1, brk: 'worn', rarity: 'rare',
    uses: 1, use: 'firstlight', text: 'Once a run: you <b>win Initiative</b> this turn, whatever it is.' },
  { id: 'grindshin', slot: 'Legs', name: 'Grindtooth Shins',   block: 2, brk: 'worn', rarity: 'rare',
    ongoing: 'nightwise', text: '🌙 Nightfall no longer takes your <b>Arsenal</b>.' },
  { id: 'lanterngreave', slot: 'Legs', name: 'Lanternjaw Greaves', block: 2, brk: 'worn', rarity: 'legendary',
    ongoing: 'swiftfoot', text: '🌙 Your <b>Pace</b> uses your <b>fastest card</b>, not your Catalyst.' },
  // 🎭 THE FIRST CLASS ARMOUR. Both are Thomas's, both live in ARMS because both spend the class's
  // own power source into the strike — which is exactly what that zone is for.
  // 🔑 A CLASS PIECE MAY NAME THE CLASS'S RULE; a generic piece may not. Same seam as the charms
  // and the grade: the ENGINE owns the slot, the CLASS owns the noun.
  { id: 'wakeband', slot: 'Arms', name: 'Emberwake Band',     block: 0, brk: 'worn', rarity: 'legendary',
    cls: 'mage', uses: 1, use: 'twinflame', consume: true,
    text: 'Break it: this turn, what you channel is DOUBLED.' },
  { id: 'fangcord', slot: 'Arms', name: 'Fangcord',           block: 0, brk: 'worn', rarity: 'legendary',
    cls: 'rogue', uses: 1, use: 'quicken', consume: true,
    text: 'Break it: your ● Momentum fills to full.' },
  // 👞 LEGS — tempo.
  { id: 'sandals', slot: 'Legs',  name: 'Ashstep Sandals',    block: 2, brk: 'shatter', rarity: 'uncommon',
    onBlock: 'dash', text: 'When it blocks, your next turn gets +5 Initiative.' },
  { id: 'greaves', slot: 'Legs',  name: 'Quickstep Greaves',  block: 2, brk: 'worn', rarity: 'rare',
    ongoing: 'surefooted', text: 'You ignore Time Penalties.' },
  // 🔋 A PIECE THAT REWARDS NOT NEEDING IT (Thomas). It is the first armour with a TIMER, which
  // [[Board_State_And_Tokens]] specced and nothing had ever planted. ⚠️ Its payoff is a NUMBER,
  // which this system otherwise bans — legal only because it is bounded to once per five
  // encounters, which makes it potion-shaped rather than a passive.
  // ⚠️ +6, not the +2 first suggested: five encounters is half a run, and a reward you wait half a
  // run for has to be worth a turn's whole plan or the timer is just a wait.
  { id: 'longkiln', slot: 'Legs', name: 'Slowburn Plate',      block: 0, brk: 'worn', rarity: 'legendary',
    charge: 5, use: 'discharge',
    text: 'Gains a mark each encounter. At 5, spend it for +6 strike or +6 Initiative.' },
];
// ⚒️ RECIPES — priced against the MEASURED drop rates, not by feel:
//   🦴 Bone Shard 7.2/run · 🪶 Windquill 1.2 · 🪨 Slagplate 0.6 · 🔩 Prime Sinew 0.4 · 🧱 Wardhide 0.1
//   🏆 a given great beast ~0.7/run when you go to its region · 🔆 Emberheart 0.1 · 💰 ~147 gold/run
//
// 🔑 THE TIERS ARE THE POWER CURVE MEASURED ON 2026-08-23: two 💥 shatter pieces moved the ladder
// by +3/+0, two 🩹 worn pieces by +13/+24. So SHATTER IS CHEAP AND WORN IS THE HUNT — a worn piece
// costs a named part from a specific region, which is the whole reason to go there.
// ⚠️ RECIPE COST IS THE BALANCE DIAL, NOT BLOCK VALUE. Everything blocks 2; what a recipe buys is
// PERSISTENCE, and persistence is what the measurement says is expensive.
const RECIPE = {
  // 💥 basic — one run's worth. The gear you have while you are still learning the road.
  // ⚪ the four commons have NO recipe — you start with them. ⚠️ Deleted rather than left as
  // unreachable prices: a cost you can never pay is dead data pretending to be a goal.
  // 💥 with an ability — two or three runs, and it names a SHAPE, so the candle points at it
  visor:    { mats: { shard: 14, quill: 2 } },
  tithe:    { mats: { shard: 14, slag: 2 } },
  bracers:  { mats: { shard: 14, slag: 2 } },
  sandals:  { mats: { shard: 14, quill: 2 } },
  // 🩹 worn — the hunt. Each names ONE great beast, so each is a reason to go somewhere.
  circlet:  { mats: { shard: 20, quill: 3, 'p:Stormcrown Roc': 1 } },
  // 🎯 a rare ARMS piece needs a rare hunt. ⚠️ Priced beside the other rares rather than cheap:
  // granting a hit is the only `onBlock` in the game that changes the SHAPE of a blow instead of
  // its size, and shape is the scarcer thing.
  twinned:  { mats: { shard: 20, slag: 3 } },
  // ⚠️ ALL NINE ARE RARE OR LEGENDARY, AND THAT IS A RULE NOW: **if a piece is gated on a named
  // creature, it IS a rare.** Three of these shipped as `uncommon` for about ten minutes, and the
  // economy probe caught it immediately - an uncommon measured at **40 runs**, because a quarry
  // gate is a rare's cost whatever the label says.
  // 🔑 THE TIERS MEAN SOMETHING NOW: uncommon = shards and shape parts, countable and cheap;
  // rare and legendary = one named creature, which is the thing you go hunting for. **The rarity
  // label follows the gate rather than fighting it.**
  // 🏹 the nine — costed against the MEASURED rates (8.7 shard, 1.4 quill, 0.6 slag, 0.6 sinew,
  // 0.2 hide a run), so the shard half lands inside the target band and the quarry part is the
  // thing you actually go looking for. ⚠️ Hide is the scarcest at 0.22 a run: never ask for more
  // than 2 of it.
  // 🎭 class gear — priced as its tier, and gated on shape parts rather than a quarry so a class
  // can actually reach its own identity without waiting on one named creature.
  wakecowl:  { mats: { shard: 18, slag: 3 } },
  slowwick:  { mats: { shard: 24, quill: 3, sinew: 2 } },
  bloodcord: { mats: { shard: 18, quill: 3 } },
  quietstep: { mats: { shard: 24, slag: 3, sinew: 2 } },
  dawncap:   { mats: { shard: 14, 'p:Cairnstag': 1 } },
  boarcoat:  { mats: { shard: 14, 'p:Ashen Boar': 1 } },
  toadboots: { mats: { shard: 16, quill: 2, 'p:Anvil Toad': 1 } },
  farhood:   { mats: { shard: 20, quill: 3, 'p:Gorse Lurcher': 1 } },
  oxharness: { mats: { shard: 20, slag: 2, 'p:Fen Ox': 1 } },
  grindshin: { mats: { shard: 20, hide: 1, 'p:Grindtooth': 1 } },
  deepglass: { mats: { shard: 26, quill: 4, sinew: 2, 'p:Shoal Drifter': 1 } },
  siltplate: { mats: { shard: 26, hide: 2, sinew: 2, 'p:Silt Crawler': 1 } },
  lanterngreave: { mats: { shard: 26, quill: 4, sinew: 3, 'p:Lanternjaw': 1 } },
  cuirass:  { mats: { shard: 24, slag: 4, sinew: 2, 'p:Pressureback': 1 } },
  greaves:  { mats: { shard: 20, hide: 1, 'p:Scarp Ram': 1 } },
  wraps:    { mats: { shard: 18, sinew: 2, 'p:Cinderjaw': 1 } },
  // 🟠 legendary — each names a great beast AND wants the rarest thing in the game
  wakeband: { mats: { shard: 26, heart: 1, 'p:Basalt Basilisk': 1 } },
  fangcord: { mats: { shard: 26, heart: 1, 'p:Mirewyrm Elder': 1 } },
  longkiln: { mats: { shard: 30, hide: 2, sinew: 3, 'p:Deepdelver': 1 } },
};
// 🔨 BREAKING DOWN — the release valve, and it pays in the same material every recipe eats.
// 🔑 Monster Hunter needs one for the same reason we do: you will always own piles of things no
// recipe names. Junk you can break down is a consolation; junk you cannot is a longer list.
// ⚠️ It is BREAKING DOWN, not SELLING — there is no merchant in a workshop, and "sell" was the
// last word left implying a second economy.
const BREAK_INTO = { shape: 3, elite: 5, signature: 8, rare: 20, dragon: 10 };
const breakValue = id => { const d = matDef(id); return d && d.tier !== 'common' ? (BREAK_INTO[d.tier] || 0) : 0; };

// ⚒️ can this be made right now, and if not, WHAT is missing? ⚠️ Returns the shortfall rather than
// a boolean — *a picker must never offer what it cannot act on*, and "you need 2 more Windquill"
// is the difference between a disabled button and a disabled button that teaches.
function craftCheck(pieceId) {
  const r = RECIPE[pieceId]; if (!r) return { ok: false, missing: ['no recipe'] };
  const st = loadStash();
  const missing = [];
  for (const m in r.mats) {
    const have = st.mats[m] || 0;
    if (have < r.mats[m]) missing.push(`${matDef(m).icon} ${r.mats[m] - have} more ${matDef(m).name}`);
  }
  return { ok: !missing.length, missing };
}
function craftPiece(pieceId) {
  const r = RECIPE[pieceId]; if (!r || !craftCheck(pieceId).ok) return;
  const st = loadStash();
  if (st.owned.includes(pieceId)) return;      // one of each, for now
  for (const m in r.mats) st.mats[m] -= r.mats[m];
  st.owned.push(pieceId);
  saveStash(st);
  render();
}
function breakMat(id) {
  const st = loadStash();
  const worth = breakValue(id);
  if (!(st.mats[id] > 0) || worth <= 0) return;
  st.mats[id]--; st.mats.shard = (st.mats.shard || 0) + worth;
  saveStash(st);
  render();
}
// 🛡️ THE LOADOUT — what you walk in wearing. ⚠️ It lives in the STASH, not the run: it is chosen
// between runs and survives them, which is the whole point of a loadout.
function loadoutIds() {
  const st = loadStash();
  return (st.loadout || []).filter(id => armourDef(id) && armourFitsClass(armourDef(id)) && st.owned.includes(id)).slice(0, armourSlotsOpen());
}
// ⚠️ ONE PIECE PER SLOT. Equipping a Chest piece replaces the Chest piece you had, never the
// Head one — the four zones are the whole reason the system has zones.
function equipPiece(id) {
  const d = armourDef(id); if (!d || !armourFitsClass(d)) return;
  const st = loadStash();
  if (!st.owned.includes(id)) return;
  let cur = (st.loadout || []).filter(x => armourDef(x) && armourDef(x).slot !== d.slot && x !== id);
  cur.push(id);
  st.loadout = cur.slice(-ARMOUR_SLOTS_OPEN);
  saveStash(st);
  render();
}
function unequipPiece(id) {
  const st = loadStash();
  st.loadout = (st.loadout || []).filter(x => x !== id);
  saveStash(st);
  render();
}

const armourDef = id => ARMOUR.find(a => a.id === id) || null;
// ⚠️ A `function` DECLARATION, NOT A `const` ARROW (2026-08-25). A top-level const is LEXICAL:
// it never lands on the headless sandbox, so no instrument can build a piece to test one.
// 🔑 That binding rule has now cost five probes in a single day — including one that reported a
// variant as BIT-IDENTICAL to baseline, because overriding a const arrow is a silent no-op and
// a silent no-op looks exactly like "no effect". **Prefer a function declaration for anything
// an instrument might reasonably want to call.**
function newArmour(id) {
  return { id, wear: (armourDef(id).block > 0 ? 1 : 0),
           uses: armourDef(id).uses || 0, charge: 0 };
}
// 🎭 A CLASS PIECE IS ONLY WEARABLE BY ITS CLASS. ⚠️ Checked at the point of WEARING, not only in
// the Workshop, because the loadout is stored between runs and you can change class between them.
const armourFitsClass = d => !d || !d.cls || d.cls === CLASS.id;
// 🔑 EVERY piece you brought, spent or not — a battered plate STAYS ON THE BOARD, because
// blocking is only one of the things a piece does and you need to see why you have no plate left.
const armourWorn = () => (S.armour || []);
// what a piece turns aside RIGHT NOW. 'worn' decays: a Worn 3 Kilnplate blocks 4, then 3, then 2.
function armourBlock(a) {
  const d = armourDef(a.id); if (!d || a.wear <= 0) return 0;
  return d.block;
}
function armourUsesLeft(a) { const d = armourDef(a.id); return d && d.use ? (a.uses || 0) : 0; }
function armourEligible() { return armourWorn().filter(a => a.wear > 0 && armourBlock(a) > 0); }
// 🔴 ONE LOOKUP FOR EVERY ONGOING RULE. Ask it by name at the site the rule is about — never
// scatter `S.armour.some(...)` through the engine, which is how a rule ends up half-applied.
function hasArmourRule(key) { return (S.armour || []).some(a => { const d = armourDef(a.id); return d && d.ongoing === key; }); }
function armourMaxSoak() { return armourEligible().reduce((t, a) => t + armourBlock(a), 0); }

// 🔑 ONE NAMED HELPER, dispatched by a string key — see the port note above. Every ability in the
// game that fires when a piece blocks passes through here and nowhere else.
function applyArmourBlock(key, d) {
  if (key === 'relight') { lightCandle(`${d.name} blocks — your candle relights`); }
  else if (key === 'coins') { S.coins += 3; log(`🛡️ ${d.name} — gain 3 coins. (you now hold ${S.coins})`, 'good'); }
  else if (key === 'strike') { S.armourStrikePending = (S.armourStrikePending || 0) + 4; log(`🛡️ ${d.name} — your next strike gets +4.`, 'good'); }
  else if (key === 'dash') { S.armourPacePending = (S.armourPacePending || 0) + 5; log(`🛡️ ${d.name} — your next turn gets +5 Initiative.`, 'good'); }
  else if (key === 'pace') { S.armourPacePending = (S.armourPacePending || 0) + 3; log(`🛡️ ${d.name} — your next turn gets +3 Initiative.`, 'good'); }
}

// 🛡️ THE OTHER HALF: A PIECE YOU USE RATHER THAN ONE THAT TAKES A HIT.
// 🔑 A TOKEN YOU CAN ACT ON IS THE CONTROL — the same rule that deleted the Emberwake's aim row.
// No new phase, no new button: the piece sits on the field and you tap it on the turn you want it.
// ⚠️ Charges are per RUN, not per turn. That is what keeps a 0-block piece from being a passive.
function armourReady(a) {
  const d = armourDef(a.id); if (!d || !d.use) return false;
  return d.charge ? (a.charge || 0) >= d.charge : armourUsesLeft(a) > 0;
}
function useArmour(aid, opt) {
  const a = (S.armour || []).find(x => x.id === aid);
  if (!a || !isAssignPhase() || !armourReady(a)) return;
  const d = armourDef(a.id);
  if (d.charge) a.charge = 0; else a.uses--;
  applyArmourUse(d.use, d, opt);
  // 🔨 "Break it" is literal — a consumed piece leaves the board, the way a shattered one does.
  if (d.consume) S.armour = S.armour.filter(x => x !== a);
  render();
}
function applyArmourUse(key, d, opt) {
  if (key === 'relight') lightCandle(`${d.name} shows you the road ahead`);
  // 🔋 the battery, spent where this encounter actually needs it
  else if (key === 'discharge') {
    if (opt === 'init') { S.armourPace = (S.armourPace || 0) + 6; log(`🛡️ ${d.name} — you spend the mark on speed: +6 Initiative this turn.`, 'good'); }
    else { S.armourStrike = (S.armourStrike || 0) + 6; log(`🛡️ ${d.name} — you spend the mark on the blow: +6 strike this turn.`, 'good'); }
  }
  // 🔥 mage — what you channel this turn is doubled. ⚠️ Read by bankValueOf(), so it lands on the
  // Surge row, the reveal line and the Emberwake alike; a flag consumed anywhere else would show
  // one number and pay another.
  // 🎯 spent on the turn you choose - the whole reason this stopped being an `onBlock`.
  else if (key === 'firstlight') { S.armourWinInit = true; log(`🛡️ ${d.name} — 💨 you take the initiative this turn, whatever it has.`, 'good'); }
  else if (key === 'split') { S.splitPending = (S.splitPending || 0) + 1; log(`🛡️ ${d.name} — 🎯 your strike SPLITS IN TWO this turn.`, 'good'); }
  else if (key === 'twinflame') { S.armourTwin = true; log(`🛡️ ${d.name} breaks — what you channel this turn is DOUBLED.`, 'good'); }
  // ● rogue — the streak is arithmetically hard to fill (12% of turns at cap), so filling it is a
  // legendary-sized effect without being a number.
  else if (key === 'quicken') { S.momentum = MOMENTUM_CAP; log(`🛡️ ${d.name} breaks — ● Momentum fills to ${MOMENTUM_CAP}.`, 'good'); }
  // ⚠️ LIVE THIS TURN, not pending — you tapped it during assign, so it must land on the strike
  // you are arranging right now. rollTurnTokens() wipes it at cleanup, which is exactly right.
  else if (key === 'burst') { S.armourStrike = (S.armourStrike || 0) + 8; log(`🛡️ ${d.name} — your strike gets +8 this turn.`, 'good'); }
}

// 🛡️ SOAK WITH A PIECE INSTEAD OF A CARD. ⚠️ INSTEAD, not before — that is the whole point.
// A buffer that absorbs automatically would just be a bigger health bar; making it a PICK in the
// same phase turns *which card do I least mind blunting* (a lookup — best plate 5.8 vs an average
// hit of 4.6, so one card covered 72% of hits) into *break a piece, or blunt a card?*
function soakWithArmour(aid) {
  const a = (S.armour || []).find(x => x.id === aid);
  if (!a || S.damage <= 0) return;
  const d = armourDef(a.id); const blocked = armourBlock(a);
  if (!d || blocked <= 0) return;
  a.wear--;
  // 💥 the basic piece is GONE from the board, not dimmed. 🩹 a worn one stays, because it is
  // still doing something — that is the whole difference between the two kinds.
  if (d.brk === 'shatter') S.armour = S.armour.filter(x => x !== a);
  log(`🛡️ ${d.name} blocks ${blocked}. ` +
      (d.brk === 'shatter' ? 'It shatters.' : 'It blocks nothing more this run.'), 'bad');
  if (d.onBlock) applyArmourBlock(d.onBlock, d);
  S.damage = Math.max(0, S.damage - blocked);
  if (S.damage <= 0) { log(`All damage blocked.`); exitSoak(); return; }
  log(`${S.damage} damage remaining.`, 'bad');
  const maxSoak = soakEligible().reduce((t, c) => t + soakValue(c), 0) + armourMaxSoak();
  if (maxSoak < S.damage) knockOut(); else render();
}

// ============================================================
// 🦴 MATERIALS AND DROPS — spec in `08_Ideas/Armour_And_The_Workshop.md`.
//
// 🔑 DROPS KEY OFF THE CREATURE'S **SHAPE**, NOT ITS NAME. Three reasons, and the third is the
// one that matters:
//   1. the shape is already in the data, so this needs no new content;
//   2. 66 individual drop tables is unmaintainable, and hunting one creature out of 66 is a slot
//      machine inside a slot machine;
//   3. 🕯️ THE SHAPE IS ALREADY VISIBLE. The candle prints the next encounter's shape and the
//      turn-1 reveal names it — so *"I need Evasion parts"* is a hunt you can actually run, using
//      the mechanism Thomas identified: *"which also lends itself into why you want your candle
//      lit, so you can find that monster you need."*
//
// ⚠️ RANDOM, BUT THE ODDS ARE PRINTED. Monster Hunter publishes its rates, and that is the whole
// difference between a grind and a slot machine: *"I need 3 scales, I get one 60% of the time, so
// that is about five encounters"* is a PLAN. A hidden table is a fruit machine with a 20-minute
// pull. Every rate here is shown in the Stash and on the recipe.
//
// 🔑 AND THE OUTCOME MATTERS, which hands Complete/Narrow/Loss a THIRD consequence beyond coins
// and the candle: a clean win carves the beast, a scrape gets you less, a loss gets you nothing.
// ============================================================
const MATERIALS = [
  { id: 'shard',  icon: '🦴', name: 'Bone Shard',  tier: 'common',   from: 'any creature' },
  { id: 'slag',   icon: '🪨', name: 'Slagplate',   tier: 'shape',    from: '🛡️ Armour creatures' },
  { id: 'quill',  icon: '🪶', name: 'Windquill',   tier: 'shape',    from: '🌀 Evasion creatures' },
  { id: 'hide',   icon: '🧱', name: 'Wardhide',    tier: 'shape',    from: '🧱 Guard creatures' },
  { id: 'sinew',  icon: '🔩', name: 'Prime Sinew', tier: 'elite',    from: '💀 dangerous foes' },
  { id: 'heart',  icon: '🔆', name: 'Emberheart',  tier: 'rare',     from: 'a felled dragon — rarely' },
  { id: 'd1',     icon: '🔥', name: 'Cindermaw Scale',    tier: 'dragon', from: 'felling Cindermaw' },
  { id: 'd2',     icon: '⚡', name: 'Skyrender Pinion',   tier: 'dragon', from: 'felling Skyrender' },
  { id: 'd3',     icon: '🪨', name: 'Cragmourn Core',     tier: 'dragon', from: 'felling Cragmourn' },
  { id: 'd4',     icon: '🌊', name: 'Fathomdread Pearl',  tier: 'dragon', from: 'felling Fathomdread' },
];
// 🏆 AND THE NAMED HALF — a SIGNATURE PART per creature. Thomas: *"i just thought it would be cool
// to further tie into the candle, knowing what monsters you have out there, like you need a mist
// crane wing, and you see that you can fight a mist crane because your candle is lit."*
//
// 🔴 I ARGUED AGAINST THIS AND THE ARGUMENT USED THE WRONG NUMBER. "Hunting one creature out of 66
// is a slot machine" measured at 9% of runs — but a creature lives on ONE road and a run walks ONE
// road, so 9% was really *"you were on the wrong road three times in four."*
// 📏 On the RIGHT road it is 23–55% of runs, median 35%. The Mist Crane is on 55% of stage-1 runs.
//
// 🔑 SO THE STAGE IS THE QUEST BOARD. Picking stage 1 to hunt a Mist Crane is Monster Hunter's
// quest select, and it was already built. The candle then says whether it is on your next node,
// and the Stash says which road it lives on. Every piece of the hunt already existed.
//
// ⚠️ BOTH TIERS, WHICH IS ALSO WHAT MONSTER HUNTER DOES: Bone Shard and the shape materials are
// its Monster Bone Small — they drop from dozens of things and fill the bulk of a recipe. A
// signature part is its Rathalos Scale: one creature, and it is the reason you go there.
//
// 📦 Signature parts are NOT in MATERIALS. There are 66 of them and they are derived, not authored
// — a table entry per creature would be 66 rows of data that the creature list already implies.
// Their ids are `p:<creature name>`, and matDef() resolves them synthetically.
// 🏆 ONE WORD PER GREAT BEAST, AUTHORED. Deriving the body word from the defence shape was the
// right call at 66 creatures and the wrong one at 16: the biggest creature in a region is usually
// an 🛡️ Armour creature, so 14 of the 16 came out "Plate" — Cairnstag Plate, Ashen Boar Plate,
// Basalt Basilisk Plate. 🔑 CUTTING THE LIST TO 16 IS WHAT MADE HAND-WRITING IT CHEAP, and that is
// the whole payoff of the great-beast tier: a roster that reads handmade instead of generated.
// ⚠️ The shape-derived word stays as the FALLBACK, so a roster change can never leave a beast
// nameless — it just reads blander until someone writes it a word.
const BEAST_WORD = {
  // 🕯️ The Ember Hollow
  'Cairnstag': 'Antler', 'Ashen Boar': 'Tusk', 'Basalt Basilisk': 'Scale', 'Mirewyrm Elder': 'Coil',
  // ⚡ The Stormreach
  'Scarp Ram': 'Fleece', 'Gorse Lurcher': 'Claw', 'Anvil Toad': 'Hide', 'Stormcrown Roc': 'Talon',
  // 🪨 The Fellgrind
  'Fen Ox': 'Horn', 'Grindtooth': 'Fang', 'Deepdelver': 'Mandible', 'Cinderjaw': 'Jawbone',
  // 🌊 The Sunless Fathom
  'Shoal Drifter': 'Membrane', 'Silt Crawler': 'Carapace', 'Lanternjaw': 'Lure', 'Pressureback': 'Shell',
};
// 💎 RARITY (2026-08-23, Thomas: *"we should add rarity types to the armor, just so we can
// classify them too"*).
// 🔑 IT ALSO ANSWERS *"anvil cuirass seems a bit too good"* WITHOUT NERFING IT. A piece that blocks
// again EVERY encounter measured at +13/+24 on the ladder — a different CATEGORY of power, not a
// tier of it. Rarity is the word for that. The fix for an outlier is to make it RARE, not weak.
// ⚠️ SO RARITY MUST DESCRIBE WHAT KIND OF THING A PIECE IS, NEVER JUST ITS PRICE — otherwise it is
// a colour on a price tag. Each tier maps to a mechanical property:
//   ⚪ common     — 💥 shatters, no ability. Starter gear, one run's shards.
//   🟢 uncommon   — 💥 shatters, one ON-BLOCK ability.
//   🔵 rare       — 🩹 worn: it stays, because an ONGOING RULE is live while you wear it.
//   🟠 legendary  — it does something no other piece can, and it names a great beast.
// ⚪ THE COMMONS ARE THE TEACHING SET (2026-08-23, Thomas: *"i think you should start off with
// super basic armor. just 1 block on everything. so players can start learning about armor right
// away"*).
// 🔴 THE PROBLEM: the loadout started EMPTY, so a new player never met armour at all until they
// had forged something — about a run's worth of shards. An entire mechanic, and the soak screen's
// only real choice, was invisible for the whole of run one.
// ✅ SO THE FOUR COMMONS ARE OWNED FROM THE START and two of them are already worn. You meet
// "break a piece, or blunt a card?" on your first hit, before you know what a recipe is.
// 🔑 AND THEY BLOCK 1, NOT 2 — which is what makes granting them safe. Two block-2 pieces measured
// +3/+0 on the ladder; at block 1 that is under a point. **A teaching object should be visible and
// almost free**, and the lesson here is the CHOICE, never the number.
// ⚠️ Everything above common still blocks 2, so forging one is a real step up.
// ⚠️ THE WHOLE SET, and worn in every slot that is OPEN — you start dressed, not shopping.
const STARTER_PIECES = ['a_hood', 'a_tunic', 'a_gloves', 'a_pants'];

const RARITY = {
  common:    { label: 'Common',    icon: '⚪' },
  uncommon:  { label: 'Uncommon',  icon: '🟢' },
  rare:      { label: 'Rare',      icon: '🔵' },
  legendary: { label: 'Legendary', icon: '🟠' },
};
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary'];
const PART_WORD = { armour: 'Plate', evasion: 'Plume', guard: 'Hide' };
// ⚠️ A creature with BOTH shapes takes the first — stage 4 stacks them, and a part named after two
// body plans reads like a bug. Shapeless creatures give a Fang.
function partWordFor(e) {
  if (e && BEAST_WORD[e.name]) return BEAST_WORD[e.name];
  const sh = (shapesOf(e) || [])[0];
  return PART_WORD[sh] || 'Fang';
}
const partIdOf = name => 'p:' + name;
const partNameOf = (name, word) => `${name} ${word}`;
// 🔑 ONE RESOLVER. A signature part answers matDef() like anything else, so every consumer — the
// haul, the Stash, and the recipes to come — needs no special case for it.
function matDef(id) {
  const m = MATERIALS.find(x => x.id === id);
  if (m) return m;
  if (typeof id === 'string' && id.startsWith('p:')) {
    const name = id.slice(2);
    const e = creatureByName(name);
    const word = e ? partWordFor(e) : 'Fang';
    return { id, icon: '🏆', name: partNameOf(name, word), tier: 'signature',
             from: name, road: e ? e.road : null };
  }
  return null;
}
// where every creature lives — built once from the roads, so the Stash and the drop table can
// never disagree about which road holds what.
// 🏆 GREAT BEASTS — the 16 creatures that carry a signature part, one per region.
//
// 🔴 THE PROBLEM THIS SOLVES (Thomas, 2026-08-23): *"we have so many monsters though... i don't
// know if we can come up with enough armor to utilize every single monster."* He is right. 66
// signature parts against a realistic ~20 pieces of armour leaves forty kinds of junk, and junk
// that no recipe names is just a longer list.
//
// 🔑 MONSTER HUNTER ALREADY ANSWERED THIS AND WE HAD THE STRUCTURE WITHOUT USING IT: small
// monsters drop generic bits, LARGE monsters carry named parts. There are 4 creatures per region
// and 16 regions, so the biggest in each region is the region's quarry — 16 named parts, which is
// an authorable number of marquee recipes, and the other 50 creatures keep dropping the common and
// shape materials that fill the bulk of every recipe.
//
// ✅ AND IT FIXES SOMETHING ELSE THAT WAS ALREADY WRONG: 66 interchangeable stat blocks becomes
// 50 fodder and 16 you remember. The roster has no hierarchy today — every creature is a name on a
// number. Mirewyrm Elder, Basalt Basilisk, Stormcrown Roc and Pressureback already read like
// things you would go looking for; nothing in the game currently says they are worth more.
//
// ⚠️ DERIVED, NOT AUTHORED — the biggest `hp` in each region, so adding a creature cannot leave
// the quarry list stale. ⚠️ Ties break on list order, deterministically.
const CREATURE_INDEX = (() => {
  const out = {};
  for (const stage of [1, 2, 3, 4]) {
    const road = roadFor(stage);
    for (const region of road) {
      const fights = (region.encounters || []).filter(e => e.type === 'fight');
      let quarry = null;
      for (const e of fights) if (!quarry || (e.hp || 0) > (quarry.hp || 0)) quarry = e;
      for (const e of fights) {
        if (!out[e.name]) out[e.name] = { ...e, road: stage, region: region.name, quarry: e === quarry };
      }
    }
  }
  return out;
})();
const isQuarry = name => !!(CREATURE_INDEX[name] && CREATURE_INDEX[name].quarry);
const creatureByName = n => CREATURE_INDEX[n] || null;

const SHAPE_MAT = { armour: 'slag', evasion: 'quill', guard: 'hide' };
// the published rates. ⚠️ Keep these and the Stash's text in step — a rate the player cannot read
// is the difference between a plan and a fruit machine.
const DROP_RATE = { shape: 0.6, narrowShape: 0.3, heart: 0.2, signature: 1, narrowSignature: 0.4 };

// 🪙 THERE IS ONLY ONE MONEY, AND IT DIES WITH THE RUN (2026-08-23).
// Thomas: *"is it too confusing that you get gold during the run for card upgrades and stuff, but
// also gold for progression"*. Yes — and the fix is deletion, not a rename.
//
// 🔴 THE TWO CURRENCIES DIFFERED ONLY IN A PROPERTY YOU COULD NOT SEE. Both were earned from
// encounters, both were drawn as money, and the one distinction — that one survives the run — is
// invisible at the moment you look at either number. Calling the second "scrip" or "cinders" would
// have been a different word for the same confusion.
//
// 🔑 HADES IS THE MODEL HERE, NOT MONSTER HUNTER. It also has an in-run currency that dies
// (obols), and its meta currencies are deliberately NOT money: Darkness, Keys, Nectar, Titan
// Blood. A different KIND of thing cannot be mistaken for the thing that dies.
//
// ✅ AND WE ALREADY HAD ONE. 🦴 Bone Shard drops ~7 a run from everything and is what every recipe
// wants in bulk — it was always the fee. The meta economy is MATERIALS, full stop: parts gate a
// piece, shards pay for it, and 🪙 coins mean exactly one thing again.

// ⭐ THE ACCOUNT LEVEL — meta-progression, and deliberately a THIRD KIND OF THING (2026-08-23).
// Thomas: *"we should start building the charm meta progression stuff. i feel like we need to do
// account wide exp for that or something. so like different charms unlocks at different levels…
// i imagine you would get a certain amount of exp per kill, elite kill, boss kill, etc."*
//
// 🔑 A BAR, NEVER A PURSE. This is the same trap meta-gold fell into this morning, one step later:
// two things you SPEND are two budgets, and the player cannot see which purse a number came from.
// So the meta layer has exactly one shop and the level is not in it:
//   🪙 coins      — earned and spent inside a run, then gone
//   🦴 materials  — earned across runs, SPENT at the Workshop
//   ⭐ level      — earned across runs, spent NOWHERE; it only widens what the game may offer
// Reaching a level is not a decision, which is precisely why it cannot be confused with one.
//
// 🔑 AND THE REWARD IS THE NAMED CHARM, NOT THE NUMBER. `UNLOCKS` is an ordered table: one level,
// one named thing. *"Cold Iron unlocked"* is a moment; *"you are level 7"* is a progress bar for
// its own sake. It also buys [[Charm_Pools]]'s answer to the "basic and bad" slop problem for
// free — the table is ordered **LEGIBLE → CONDITIONAL**, so early levels hand out charms you can
// read at a glance and later ones hand out the rule-changers that ask you to aim them. Nothing in
// the pool is ever bad; later charms simply ask more of you.
//
// ⚠️ ONE BAR FOR THE WHOLE ACCOUNT, NOT ONE PER CLASS — and the reason is [[Addiction_Loop]]'s
// own retention bet: *you switch class because the problem told you to*. Per-class XP would mean
// the class you switch TO is a thinner game than the one you left, punishing exactly the move the
// design wants. A fresh rogue on a level-12 account gets her charms up to level 12 immediately.
// Mastering a class is what [[The_Wall]] and the grade are for; do not build it twice.
const XP_KEY = 'emberwick-xp-1' + KEY_NS;
let XP_PER_LEVEL = 60;                 // flat, and flat on purpose: *legible math always*
// 🔑 A LOSS MUST PAY, AND THIS IS THE RULE NOT THE GENEROSITY. [[Charm_Pools]]: *a player who is
// losing must not get a thinner pool* — gating unlocks behind victories takes options away from
// exactly the player who needs more of them, and turns a bad run into a worse next one.
// ⚠️ So "exp per kill" is the one part of the brief I have not built literally: every encounter
// pays, a clean one pays triple a lost one. Same shape `rollDrops` already uses for shards.
// ⚠️ ELITES MULTIPLY RATHER THAN ADD, so that losing an elite can never out-earn winning an
// ordinary fight — an additive bonus would have made 💀 Loss (1+5) beat ◇ Complete (3).
const XP_AWARD = { Complete: 3, Narrow: 2, Loss: 1, eliteMult: 2, lair: 8, dragon: 15, dragonStep: 5 };
// 🎭 AND A SECOND BAR, ONE PER CLASS (2026-08-23, Thomas: *"class level makes sense for class charm
// unlocks, or do we just lump everything into the main account level?"*).
//
// 🔑 THE RULE IS ALREADY PRINTED ON THE CHARM: **a charm unlocks on whichever bar owns the rule it
// names.** A generic charm touches an engine rule → the account level. A class charm touches the
// class's own rule → that class's level. No new field, no table of exceptions — `charmUnlocked()`
// just asks `c.cls`. It is the [[Charm_Pools]] split test doing a second job for free.
//
// ⚠️ THIS REVERSES MY OWN CALL FROM ONE BUILD AGO, and the reversal is the honest part. I argued
// one bar on the grounds that per-class XP makes the class you switch TO a thinner game than the
// one you left. **I never measured it.** Measured: a veteran on a level-12 account picking up an
// untouched class loses **2 charms** (mage 18→16, rogue 14→12). That is noise, not an argument.
//
// 🔑 AND THE CASE ONE BAR CANNOT HANDLE, WHICH I HAD NOT CONSIDERED AT ALL: with one bar, **every
// class after the first arrives FULLY UNLOCKED.** Ship the Illusionist to a maxed account and all
// six of her charms appear the instant she does — no arc, no on-ramp, a dump. With eight classes
// planned and *"the other planned classes"* stated as priority #1, that is the whole roster's
// progression deleted in advance. The hybrid gives every future class its own small ladder for
// free: **+1 class = ×N content** applies to the meta layer too, but only if the meta layer is
// per class.
//
// ⚠️ THE CLASS LADDER IS AN ON-RAMP, NOT A GRIND — 4 rungs at a cheaper 50 xp, so it opens over
// about five runs of that class. A new class should feel like it is blooming; starving it for
// twenty runs would re-create the exact switching penalty the measurement just cleared.
const CLASS_XP_KEY = cls => 'emberwick-xp-' + cls + '-1' + KEY_NS;
let CLASS_XP_PER_LEVEL = 50;
// 🔧 a sweep pins BOTH levels so a measurement is reproducible — see the band note in Balance_Log
let XP_LEVEL_FORCE = 0;
let CLASS_LEVEL_FORCE = 0;
function loadXP() { try { const n = parseInt(localStorage.getItem(XP_KEY), 10); return n > 0 ? n : 0; } catch (e) { return 0; } }
function saveXP(n) { try { localStorage.setItem(XP_KEY, String(n)); } catch (e) {} }
// ⚠️ CACHED, not read per call — `charmUnlocked()` runs once per Wheel offer and RUNSIM rolls
// thousands of them. The cache is refreshed at the one place the number can change.
let ACCOUNT_XP = loadXP();
// ⚠️ CACHED PER CLASS for the same reason the account bar is: `charmUnlocked()` runs once per Wheel
// offer, and the Collection asks it for every charm of every class on one render.
const CLASS_XP = {};
function loadClassXP(cls) {
  if (cls in CLASS_XP) return CLASS_XP[cls];
  let n = 0;
  try { const v = parseInt(localStorage.getItem(CLASS_XP_KEY(cls)), 10); if (v > 0) n = v; } catch (e) {}
  return (CLASS_XP[cls] = n);
}
function saveClassXP(cls, n) { CLASS_XP[cls] = n; try { localStorage.setItem(CLASS_XP_KEY(cls), String(n)); } catch (e) {} }
// ⚠️ CLAMPED AT THE CAP, and that is a design call not a tidy-up: a bar that keeps filling and
// resetting while unlocking NOTHING is precisely the empty progress bar this system was built to
// avoid. The number stops where the content stops.
// 🔑 And the XP is not thrown away — it keeps banking. Add charms, the cap rises, and the levels
// already earned are simply revealed. Nobody is ever punished for having played early.
function levelFor(xp) { return Math.min(LEVEL_CAP, 1 + Math.floor(xp / XP_PER_LEVEL)); }
function accountLevel() { return XP_LEVEL_FORCE || levelFor(ACCOUNT_XP); }
// each class's ladder is only as tall as its own rungs — a bar must never outlast its content
// ⚠️ A `function` DECLARATION, NOT A `const` ARROW, AND DELIBERATELY. A top-level `const` in a vm
// script is lexical, so it never lands on the headless sandbox and every probe that needs it has
// to be remembered in the EXPORTS list. A function declaration lands there by itself. **That is
// the third time in two builds this binding rule has cost something** — prefer the declaration for
// anything an instrument might reasonably want to ask.
function classCap(cls) { return UNLOCKS.reduce((m, u) => unlockCls(u) === cls ? Math.max(m, u.level) : m, 1); }
function classLevelFor(cls, xp) { return Math.min(classCap(cls), 1 + Math.floor(xp / CLASS_XP_PER_LEVEL)); }
function classLevel(cls) { return CLASS_LEVEL_FORCE || classLevelFor(cls, loadClassXP(cls)); }
function awardXP(n) { if (n > 0 && S) S.xpRun = (S.xpRun || 0) + n; }

// 📦 THE STASH — everything that survives a run. Its own key, like the ladder and the grades.
const STASH_KEY = 'emberwick-stash-1' + KEY_NS;
function loadStash() {
  try {
    const d = JSON.parse(localStorage.getItem(STASH_KEY) || 'null');
    if (!d || typeof d !== 'object') throw 0;
    // 🐛 EVERY FIELD MUST BE LISTED HERE OR IT IS SILENTLY DROPPED. `loadout` was written by
    // equipPiece() and thrown away by the very next read, so equipping a second piece started from
    // an empty loadout and a fresh run wore nothing — with no error anywhere.
    // 🔑 A whitelisting reader is the right shape (it is what keeps a corrupt stash from
    // crashing the menu), but it means ADDING A FIELD IS TWO EDITS, and the second one is silent.
    return seedStarter({ mats: d.mats || {},
             owned: Array.isArray(d.owned) ? d.owned : [],
             loadout: Array.isArray(d.loadout) ? d.loadout : [],
             seeded: !!d.seeded });
  } catch (e) { return seedStarter({ mats: {}, owned: [], loadout: [], seeded: false }); }
}
function saveStash(st) { try { localStorage.setItem(STASH_KEY, JSON.stringify(st)); } catch (e) {} }
// ⚪ THE STARTER SET IS A FLOOR, NOT A ONE-TIME GIFT (fixed 2026-08-23).
//
// 🔴 THE BUG, reported in play: *"just started a new run, but i don't see the starting armor in my
// slots, its empty."* Build 356 seeded the old commons (`kiln`/`hood`/`vambrace`/`boots`) and set
// `seeded: true`. Build 361 DELETED those four pieces and replaced them with the Adventurer's set
// — so an existing stash owned four ids that no longer resolve, `loadoutIds()` filtered every one
// of them out, and the seeding that would have fixed it returned early because the flag said the
// job was already done.
// 🔑 A ONE-TIME MIGRATION FLAG IS A LOCK ON THE ONLY CODE THAT COULD REPAIR THE DATA. Whatever the
// starter set becomes next, this must survive it — so ownership is now RESTATED every load rather
// than granted once. It cannot go stale because it is not a memory, it is a floor.
//
// ⚠️ THE LOADOUT KEEPS ITS GUARD, and the distinction is the delicate part: an empty loadout
// because the PLAYER stripped it must stay empty (otherwise deliberate choices get silently
// undone), but an empty loadout because pieces were DELETED under them is damage and gets
// repaired. `lostToMigration` is exactly that difference.
function seedStarter(st) {
  // 🧹 drop ids that no longer resolve, so a removed piece cannot linger as a ghost you own
  const wornBefore = st.loadout.length;
  st.owned = st.owned.filter(id => armourDef(id));
  st.loadout = st.loadout.filter(id => armourDef(id));
  const lostToMigration = st.loadout.length < wornBefore;

  let changed = !st.seeded || lostToMigration;
  for (const id of STARTER_PIECES) if (!st.owned.includes(id)) { st.owned.push(id); changed = true; }
  if (!st.seeded || lostToMigration) {
    if (!st.loadout.length) st.loadout = STARTER_PIECES.slice(0, ARMOUR_SLOTS_OPEN);
  }
  st.seeded = true;
  if (changed) saveStash(st);
  return st;
}

// 🦴 WHAT THIS ENCOUNTER DROPPED. Returns a { matId: qty } bag; the caller banks it.
// ⚠️ PURE-ISH BY DESIGN — it reads the encounter and rolls, and touches no screen. The rules layer
// stays detachable, which is the whole insurance policy for the Godot port.
function rollDrops(e, outcome, perfect) {
  const bag = {};
  if (!e) return bag;
  const add = (id, n) => { if (n > 0) bag[id] = (bag[id] || 0) + n; };
  const clean = outcome === 'Complete';
  if (e.dragon) {
    // 🐉 the dragon is the hunt. Its part is certain; the rare is the thing you come back for.
    const d = DRAGONS.find(x => x.name === e.name);
    if (d) add('d' + d.stage, 2);
    if (rnd() < DROP_RATE.heart) add('heart', 1);
    return bag;
  }
  if (e.type !== 'fight') return bag;                // a road is walked, not carved
  // 🔑 EVEN A LOSS CARVES ONE, and that single number carries the whole "a loss must pay"
  // principle: if a bad run yields nothing, losing is wasted time and the grind punishes whoever
  // needs it most. ⚠️ It is what replaces the flat per-run gold that used to guarantee a floor.
  add('shard', clean ? 2 : 1);
  if (outcome === 'Loss') return bag;                // ...but nothing else — no shape part, no trophy
  // 🏆 the signature part — the reason to come to THIS region for THIS beast.
  // 🔑 CERTAIN ON A CLEAN KILL, and that is the design, not generosity: there is one quarry per
  // region, so *"I need 3 Mist Crane Plumes, so that is 3 clean kills"* is a COUNTABLE plan. A
  // random roll on top of "did the beast even turn up" is two lotteries stacked, and the whole
  // reason the rates are printed is that a plan beats a fruit machine.
  const base = e.baseName || e.name;
  if (isQuarry(base) && (clean || rnd() < DROP_RATE.narrowSignature)) add(partIdOf(base), 1);
  const shapes = shapesOf(e) || [];
  for (const sh of shapes) {
    const mat = SHAPE_MAT[sh];
    // ✦ A PERFECT KILL DOES NOT ADD A DROP — IT GUARANTEES ONE. The shape part rolls at 60% on a
    // clean win; kill with nothing to spare and the roll becomes a certainty.
    // 🔑 WHY THIS IS THE RIGHT REWARD: it prints no new currency, so it cannot move the Workshop
    // economy the way a bonus material would — and **it removes a die roll by playing precisely**,
    // which is what this game is about. Nothing else here lets skill delete randomness.
    // ⚠️ Self-limiting: only shaped creatures, only a Complete, at most +0.4 over the base rate.
    // 🔴 THE ROLL ALWAYS HAPPENS, EVEN WHEN THE GUARANTEE MAKES IT IRRELEVANT. Short-circuiting
    // it (`(clean && perfect) || rnd() < rate`) SKIPS an `rnd()` call, which shifts the random
    // stream for the whole rest of the run — so a same-seed A/B of this feature compared two
    // different games and came back at **-0.3 materials**, an impossibility.
    // 🔑 AN EFFECT THAT CHANGES AN OUTCOME MUST NOT CHANGE THE RANDOM STREAM. Same lesson as the
    // snapshot work (*state AND rng position*), and it is correctness before it is instrumentation:
    // in a game whose identity is deterministic and measurable, a rule that silently re-seeds
    // everything downstream is a bug even when nobody is measuring.
    const rolled = rnd() < (clean ? DROP_RATE.shape : DROP_RATE.narrowShape);
    if (mat && ((clean && perfect) || rolled)) add(mat, 1);
  }
  // 💀 MATERIALS ARE THE SURVIVAL TIER, THE CHARM IS THE KILL TIER (2026-08-24). These stay on
  // survival deliberately: gating Prime Sinew on Complete dropped it exactly zero times in twelve
  // runs, and ⚠️ an accidental ultra-rare is worse than a designed one — it makes a recipe that
  // names it uncraftable without anyone deciding that.
  // 🔑 SO AN ELITE PAYS TWICE AND THE TIERS SAY DIFFERENT THINGS: **you walked away** → the coins
  // (×2.5) and the materials · **you killed it** → one of three charms. That is the two-tier reward
  // the survive-gate was flattening into one.
  if (e.elite) { add('sinew', 1); add('shard', 1); }
  return bag;
}
// 🎒 the run's haul, kept on S so the summary can show it and a LOSS still banks it.
// ⚠️ TAKES AN ALREADY-ROLLED BAG. The reveal rolls it so the carve beat can show it, and this
// banks that same bag — rolling again here would have shown you one haul and given you another.
function bankDrops(bag) {
  const got = [];
  for (const id in bag) {
    S.loot[id] = (S.loot[id] || 0) + bag[id];
    got.push(`${matDef(id).icon} ${matDef(id).name} ×${bag[id]}`);
  }
  if (got.length) log(`🧰 Carved: ${got.join(' · ')}`, 'good');
}
// 💰 banked when the run ENDS, however it ends. ⚠️ Called from victory() and defeat() — the two
// places a run can stop — never from cleanup, or a quit mid-run would pay nothing.
function bankRun(won) {
  if (S.runBanked) return;                            // a run banks exactly once
  S.runBanked = true;
  const st = loadStash();
  for (const id in (S.loot || {})) st.mats[id] = (st.mats[id] || 0) + S.loot[id];
  saveStash(st);
  // ⭐ THE LEVEL BAR BANKS WHERE THE LOOT BANKS, and that is the whole reason it is safe: this
  // function is already the single place a run pays out, already guarded to fire exactly once,
  // and already called from BOTH victory() and defeat(). A second payout site is how the finale
  // froze the Emberwake — a per-run total belongs in a function every ending calls.
  if (won) awardXP(XP_AWARD.dragon + XP_AWARD.dragonStep * Math.max(0, (S.dragon && S.dragon.stage || 1) - 1));
  S.xpBefore = ACCOUNT_XP;                            // so the summary can draw the bar moving
  // 🔬 A PINNED LEVEL IS NOT A REAL ACCOUNT, so it neither reads nor writes one.
  // 🔴 THE TRAP THIS CLOSES, and it would have been invisible: RUNSIM calls bankRun() on every
  // single run, so a 200-run sweep would have climbed from level 1 to the cap *inside the
  // measurement* — run 1 played a 9-charm pool and run 200 a 23-charm one, and the average would
  // have described a game nobody plays. **An instrument that PROGRESSES is not an instrument.**
  // ⚠️ It would also have written the bot's XP into the player's own bar in the browser.
  // ⚠️ BOTH BARS BANK HERE, at the one site a run pays out. A second payout site is how the
  // finale froze the Emberwake; a second bar is twice the chance of making that mistake again.
  S.clsXpBefore = loadClassXP(CLASS.id);
  if (XP_LEVEL_FORCE || CLASS_LEVEL_FORCE) return;   // a pinned bar is not a real account
  ACCOUNT_XP += (S.xpRun || 0);
  saveXP(ACCOUNT_XP);
  saveClassXP(CLASS.id, S.clsXpBefore + (S.xpRun || 0));
}

// ---------- Phase 3: soak damage by downgrading ----------
function soakValue(card) {
  // SOAK DOUBLING CUT 2026-07-26 - an element check in the most stressful phase in the game,
  // and a rule no non-elemental class could ever join. Armour simply soaks its printed value.
  const armor = eff(card).armor || 0;
  if (armor <= 0) return 0;
  const v = verbOf(card);
  const frost = v && v.name === 'Frostbite' ? 4 : 0;      // ✦ Frostbite soaks well beyond its plate
  // 🔥 Emberwake Cowl — the token you were saving for the blow also braces you for one.
  const wakeGuard = (hasArmourRule('wakeguard') && (S.wake || 0) > 0) ? 2 : 0;
  return armor + frost + wakeGuard + charmMod('soak', card.def.element) + (S.potionFx ? S.potionFx.soak : 0);   // 🧪 Ironskin
}

function soakEligible() { return S.hand.filter(c => !S.downgraded.has(c.id)); }

function startSoak() {
  S.phase = 'soak';
  // 🛡️ armour counts toward what you CAN cover, or a knock-out would fire while you still had
  // a plate on. A rule the engine enforces only for cards is a rule the player cannot use.
  const maxSoak = soakEligible().reduce((t, c) => t + soakValue(c), 0) + armourMaxSoak();
  if (maxSoak < S.damage) knockOut();
  else render();
}

function downgrade(card, why) {
  S.downgraded.add(card.id);
  // ● Bloodcord Vest — what the road takes off you feeds the streak.
  // 🔴 ONCE PER ENCOUNTER. Per-block measured **+6.7 road C / +35 win**, because a run blocks
  // several times an encounter and the meter simply never emptied. ⚠️ `S.downgraded` is already
  // per-encounter state, so "first" costs no new field - the same trick 🧱 Ironbound uses.
  if (hasArmourRule('bloodpip') && CLASS.id === 'rogue' && S.downgraded.size === 1) {
    S.momentum = Math.min(MOMENTUM_CAP, (S.momentum || 0) + 1);
    log(`🛡️ <b>Bloodcord Vest</b> — ● the blow feeds the streak (${S.momentum}/${MOMENTUM_CAP}).`, 'good');
  }
  // 🧱 IRONBOUND - the deck can be bruised, never blunted.
  // ⚠️ TWO EARLIER VERSIONS FAILED AND BOTH ARE INSTRUCTIVE. *Never destroyed* measured **+0.7
  // road C**, i.e. inert: only a **Lv1** card is destroyed and a run destroys ~3.6 cards, so the
  // rule named a real event that almost never happens. 🔑 **A charm must name something FREQUENT
  // as well as something PRINTED** - the second half of that bar had never been written down.
  // Then *the first soak each encounter is free* keyed off `S.downgraded.size`, which 🛡️ Brace
  // silently broke - see the cut note on Brace. **This version holds no state at all**, which is
  // also why it cannot be broken by a charm written next year.
  // ✅ And it is denominated in LEVELS, the resource that actually predicts the duel.
  if (hasCharm('ironbound') && card.level <= 2) {
    log(`${card.def.name} takes the blow — 🧱 <b>Ironbound</b> holds it at Lv${card.level}`, 'good');
    return;
  }
  if (card.level <= 1) {
    // 🧥 Boarhide Coat — a Lv1 card that blocks is not LOST, only spent. ⚠️ It still leaves your
    // hand, so the encounter still costs you; what it does not do is take the card out of the run.
    if (hasArmourRule('softfall')) {
      S.hand = S.hand.filter(c => c.id !== card.id);
      S.discard.push(card);
      if (S.actionSetIds.includes(card.id)) S.actionSetIds = S.actionSetIds.filter(id => id !== card.id);
      if (S.reserveId === card.id) S.reserveId = null;
      log(`🛡️ <b>Boarhide Coat</b> — ${card.def.name} would have been lost; it goes to the discard instead.`, 'good');
      return;
    }
    S.hand = S.hand.filter(c => c.id !== card.id);
    S.trashed.push(card);
    // 🧥 Fen Ox Harness — a destroyed card at least pays for itself. ⚠️ Coins die with the run, so
    // this cannot compound into the meta layer; it buys you a charm on the way down.
    if (hasArmourRule('ledger')) { S.coins += 8; log(`🛡️ <b>Fen Ox Harness</b> — 🪙 +8 coins for what you lost. (you hold ${S.coins})`, 'good'); }
    if (S.actionSetIds.includes(card.id)) S.actionSetIds = S.actionSetIds.filter(id => id !== card.id);
    if (S.reserveId === card.id) S.reserveId = null;
    log(`${card.def.name} was Lv1 → it LEAVES YOUR DECK for the rest of the run${why}`, 'bad');
  } else {
    card.level--;
    log(`${card.def.name} downgraded to Lv${card.level}${why}`, 'bad');
  }
}

function soakWith(cardId) {
  const card = cardById(cardId);
  if (!card || S.downgraded.has(card.id) || S.damage <= 0) return;
  // 🧥 Siltcrawler Plate — every card you have already fed makes the rest cheaper, so SPREADING
  // the hit beats feeding one card. ⚠️ Deliberately the opposite of the designated-victim pattern
  // the soak measurement found (best plate 5.8 vs an average hit of 4.6, WARD pays 74%).
  if (hasArmourRule('tidewall') && S.downgraded.size > 0) {
    const cut = Math.min(S.damage, S.downgraded.size);
    S.damage -= cut;
    log(`🛡️ <b>Siltcrawler Plate</b> — the blow spends itself: ${cut} less to block.`, 'good');
    if (S.damage <= 0) { log(`All damage blocked.`); exitSoak(); return; }
  }
  // ✦ Lv4 WARD verbs, all of them about KEEPING CARDS — the run-level currency
  const v = verbOf(card);
  const bulwark = v && v.name === 'Bulwark';             // soaks everything still coming
  const guarded = v && v.name === 'Emberguard' && !S.emberguardUsed;  // takes the hit, keeps its level
  const soak = bulwark ? S.damage : soakValue(card);
  if (guarded) {
    S.emberguardUsed = true;
    S.downgraded.add(card.id);                            // spent for the encounter, but NOT blunted
    log(`✦ Emberguard — ${displayName(card)} takes ${soak} and holds its edge.`, 'good');
  } else {
    downgrade(card, `, blocking ${soak}${bulwark ? ' — ✦ Bulwark turns aside everything' : ''}`);
  }
  if (v && v.name === 'Groundwire') { S.wakePending = (S.wakePending || 0) + 2; log(`✦ Groundwire — the blow earns you a 🔥 +2 Emberwake.`, 'good'); }
  S.damage = Math.max(0, S.damage - soak);
  if (S.damage <= 0) {
    log(`All damage blocked.`);
    exitSoak();
  } else {
    log(`${S.damage} damage remaining.`, 'bad');
    const maxSoak = soakEligible().reduce((t, c) => t + soakValue(c), 0) + armourMaxSoak();
    if (maxSoak < S.damage) knockOut();
    else render();
  }
}

function knockOut() {
  // being knocked out mid-fight ENDS the fight — you're in no shape to keep swinging
  log(`Cannot block all the damage → KNOCKED OUT`, 'bad result');
  // 🛡️ the armour goes with it. A knock-out that leaves a plate intact reads as the game
  // declining to use something you were wearing.
  for (const a of armourEligible()) { const d = armourDef(a.id); a.wear = 0; log(`🛡️ ${d.name} — spent in the knock-out.`, 'bad'); }
  for (const card of soakEligible()) downgrade(card, ' (knock-out)');
  const n = Math.min(KO_DECK_DISCARD, S.deck.length);
  if (n > 0) {
    const burned = S.deck.splice(0, n);
    S.discard.push(...burned);
    log(`Knock-out: discarded ${n} from top of deck (${burned.map(c => c.def.name).join(', ')})`, 'bad');
  }
  S.damage = 0;
  exitSoak();
}

function exitSoak() {
  const dest = S.afterSoak;
  S.afterSoak = 'upgrade';
  if (dest === 'turnEnd') finishTurn();
  else if (dest === 'duelNext') duelCleanupAndNext();
  else startUpgrade();
}

// ============================================================
// THE WHEEL (2026-07-06) — replaces the old spend-XP-on-a-menu step with a slot pull at
// the same point in the loop. Three offers, buy what you can afford, REROLL for coins, and
// bank the rest (coins roll over). The gambling lives here, in the acquisition layer —
// never in the turn itself (Addiction_Loop.md). Camp = the same wheel, richer pool.
// ============================================================
const REROLL_COST = 3;
// The Wheel draws from EVERY card you own, not just your hand: it means any of your 17 can be
// improved, and — because the pool is 17 wide rather than 4 — rolling the same card twice is
// genuinely uncommon (~17%), which is what makes the match jackpot feel like a hit.
function ownedCards() { return [...S.hand, ...S.deck, ...S.discard]; }
function anyCardById(id) { return ownedCards().find(c => c.id === id) || null; }

// 🔑 ONE LEVEL PER CARD PER VISIT (2026-08-18). Thomas: *"i usually upgrade a card straight
// away to lvl 4, and it starts making the run feel easy. lvl 4 cards just have a lot of stats."*
// Measured before this: the first Lv4 arrived on turn 5.9 of ~20, in 99% of runs, for BOTH classes.
// ⚠️ THE FAULT WAS THAT NOTHING SPACED THE LEVELS OUT. Free choice replaced the Wheel's random
// offers, and the note left at the time said the randomness had been *"a soft brake on always
// sharpening your best card"* with nothing put back. With enough coins you could walk a single card
// 1 -> 4 in one sitting, and [[Levelling_As_Sharpening]]'s whole premise - that a level is a
// COMMITMENT, and knowing when to stop is the skill - never gets asked.
// 🔑 A cap per VISIT is the smallest possible brake: it never takes the choice away (his rule
// from the free-choice change), it only makes you come back. The cost curve is untouched.
const sharpenedHere = id => !!(S.sharpenedVisit && S.sharpenedVisit.includes(id));
function upgradable(card) {
  const cost = eff(card).cost;
  return card.level < MAX_LEVEL && !S.downgraded.has(card.id) && !sharpenedHere(card.id)
    && cost != null && cost <= S.coins;
}

// build one offer; `rich` (camp) leans rarer
// 🔑 THE WHEEL SELLS WHAT ONLY A SHOP CAN SELL. Card levels moved out on 2026-08-05 - you now
// choose those freely in the 🔼 upgrade phase - so what is left here is 🎁 CHARMS (permanent rule
// changes) and 🧪 POTIONS (one-time, carried, spent when you decide). That is a cleaner division
// than "three random things": the shop sells POWER, and sharpening your own deck is not shopping.
function rollOffer(rich) {
  const held = S.charms || [];
  const charmPool = CHARMS.filter(c => !held.includes(c.id) && !c.curse && charmUnlocked(c) && charmFitsClass(c) && (rich ? true : c.rarity !== 'rare'));
  const potPool = potionPool();
  const roomForPotion = (S.potions || []).length < POTION_CAP;
  const mkCharm = () => { const c = rand(charmPool);
    return { kind: 'charm', id: c.id, name: c.name, text: c.text, rarity: c.rarity, cost: c.cost }; };
  // 🥄 WEIGHTED: commons show up three times as often as rares, so the shelf reads like a
  // shop — mostly cheap things, occasionally something you actually want.
  const weight = p => p.rarity === 'common' ? 3 : p.rarity === 'uncommon' ? 2 : 1;
  const mkPotion = () => {
    const bag = [];
    for (const p of potPool) for (let k = 0; k < weight(p); k++) bag.push(p);
    const p = rand(bag);
    return { kind: 'potion', id: p.id, name: p.name, text: p.text, rarity: p.rarity, cost: p.cost }; };
  // 📜 a contract only appears when you have none. ⚠️ IT NO LONGER NEEDS THE REGION-TIME GATE
  // — a contract carries its OWN window now and crosses region breaks, so "will it fit before the
  // region ends" is not a question any more. What replaced the gate is the check below: there must
  // be enough RUN left to keep it. An offer you cannot act on is a trap, not a gamble, and that
  // stays true whether the wall is the region or the lair.
  const runLeft = Math.max(0, (RUN().length - (S.region || 1)) * REGION_ENCOUNTERS +
                             (REGION_ENCOUNTERS - (S.regionTurn || 0)));
  if (!S.contract && !rich && rnd() < 0.28) {
    // 🗺️ a land's own quest only appears from that stage on — same simulated unlock as charms
    const fits = CONTRACTS.filter(x => (!x.tier || x.tier <= stageTier()) &&
                                       Math.min(contractWindow(x), runLeft) > x.need);
    if (!fits.length) return mkCharmOrPotion();
    const c = rand(fits);
    return { kind: 'contract', id: c.id, name: c.name, text: c.text +
      `<div class="wo-delta">🪙 pays <b>${c.reward}</b> · within <b>${contractWindow(c)}</b> encounters · carries across regions</div>`,
      rarity: 'uncommon', cost: c.cost };
  }
  return mkCharmOrPotion();

  function mkCharmOrPotion() {
    const wantPotion = roomForPotion && potPool.length && rnd() < (rich ? 0.45 : 0.55);
    if (wantPotion) return mkPotion();
    if (charmPool.length) return mkCharm();
    if (roomForPotion && potPool.length) return mkPotion();
    return { kind: 'none', name: 'Nothing here', text: 'Nothing to be had this spin', rarity: 'common', cost: 0 };
  }
}

function spinWheel(rich) {
  const offers = [];
  const taken = new Set();
  for (let i = 0; i < 3; i++) {
    let o = null;
    for (let tries = 0; tries < 12; tries++) {
      o = rollOffer(rich);
      if (!o.id || !taken.has(o.id)) break;
    }
    if (o && o.id) taken.add(o.id);
    offers.push(o);
  }
  return offers;
}

// 🎰 NO SHOP ONCE THE BOSS FIGHT HAS BEGUN (2026-07-29, Thomas). The Approach and the Duel are
// one continuous confrontation — you are on the dragon's road and then in its lair, and there is
// nobody out there selling you anything. Mechanically it matters too: the duel is a race between
// its HP and your remaining cards, and a shop mid-race lets you buy your way out of the very
// pressure the fight is made of. Coins keep, so nothing is lost — you spend them next run.
// 🔼 UPGRADING IS A FREE CHOICE AGAIN (2026-08-05, Thomas: *"i want you to pick whatever card
// you want to upgrade in your hand like the original game"*).
//
// The Wheel had been rolling three random offers, one of which might be an upgrade. That made the
// purchase tangible (it offered cards from your hand rather than names in a list) but it also made
// it a LOTTERY: the card you wanted to sharpen simply might not appear. Choosing is the older,
// better version - and it leaves the Wheel to do the thing only a shop can do, which is sell you
// 🎁 charms and 🧪 potions.
//
// ⚠️ THE COST OF THE CHANGE, STATED: the Wheel's randomness was a soft brake on always sharpening
// your best card. Free choice removes it, so *sharpening solves the Spell slot* (biggest-card-is-
// correct rises with deck level) gets slightly worse. Watch it; the answer if it bites is a
// steeper cost curve, never taking the choice back.
function startUpgrade() {
  // ⚠️ the two finale phases resume differently: the Approach runs the normal turn tail, the Duel
  // sequences its own beats. Sending the Duel through finishTurn() would stall the fight outright.
  if (S.finalMode) {
    if (S.finalPhase === 'duel') duelCleanupAndNext(); else finishTurn();
    return;
  }
  // 🔑 THE WHEEL COMES FIRST, AND THAT IS THE REAL FIX (2026-08-05). Measured: the bot spent
  // **93% of all income on card levels** (54 of 58 coins a run) and bought 0.1 charms. Not because
  // charms are bad - because SHARPENING RAN FIRST and had no budget. A level costs 3-4 and is
  // always affordable, so the purse was always empty by the time the shop opened.
  // Opening the shop first makes the money a CHOICE: this charm, or three levels?
  // 🗺️ with the shop as a map NODE, the per-encounter opening is what makes that node worthless -
  // it hands you a screen you would have reached anyway after the next fight.
  if (!WHEEL_PER_ENCOUNTER && S.map && !S.finalMode) { finishTurn(); return; }
  startWheel(false);
  // ⚠️ A SHOP WHERE NOTHING IS AFFORDABLE IS NOT A DECISION, IT IS A CONFIRM BUTTON. The shop
  // opening after every encounter is what keeps the deck growing (measured above), but it is also
  // ~12 screens a run - and [[Tempo_And_The_Watch]] is explicit that *a weightless decision is not
  // a rest, it is homework*. When you can afford nothing on the shelf AND nothing in hand, walk on.
  // ⚠️ never in the tutorial: stage 0 has a lesson that rings the Wheel, and a screen that
  // skips itself is a screen the lesson can never fire on.
  if (!S.tutorial && S.phase === 'wheel' && wheelIsEmptyHanded()) {
    log(`🛒 Nothing here you can afford — you walk on.`);
    wheelDone();
  }
}
// 🛒 ONE SHOP (2026-08-10, Thomas: *"lets make it be the upgrading at the same time too, so i
// can spend all my money at once and see all my options at once"*).
//
// The Wheel and the forge were two screens in a row, and that split the purse into two blind
// halves: you priced a charm without knowing what a level would cost, then priced levels with
// whatever survived. 🔑 A BUDGET DECISION YOU CANNOT SEE BOTH SIDES OF IS NOT A DECISION — it
// is two guesses. Ordering them (shop first, 2026-08-05) fixed which half got starved; putting
// them on ONE screen removes the starving.
//
// ⚠️ The `'upgrade'` phase is kept, unentered, so a save written mid-forge by an older build
// still loads. It is dead code the day save version 5 stops mattering.
function startSharpen() { doneUpgrades(); }
// 🔼 ...and ⏳ A TIME PENALTY IS WHAT SHUTS IT (2026-08-22). See `delayed` in finishResolve.
const canSharpenNow = () => (S.phase === 'upgrade' || S.phase === 'wheel') && !(S.delayed > 0);

// 🔼 tap a card to see what it BECOMES; tap again to buy it
function pickUpgrade(id) {
  if (!canSharpenNow()) return;
  S.upgradePick = (S.upgradePick === id) ? null : id;
  render();
}
function buyUpgrade(id) {
  if (!canSharpenNow()) return;
  const card = cardById(id); if (!card || !upgradable(card)) return;
  const cost = eff(card).cost;
  S.coins -= cost;
  card.level++;
  (S.sharpenedVisit = S.sharpenedVisit || []).push(card.id);
  log(`🔼 ${card.def.name} sharpens to Lv${card.level} (−${cost} coins, ${S.coins} left).` +
      (card.level >= MAX_LEVEL && VERBS[card.def.name] ? ` ✦ It gains <b>${VERBS[card.def.name].name}</b>.` : ''), 'good result');
  S.upgradePick = null;
  render();
}
function doneUpgrades() { S.sharpenedVisit = []; endTurn(); }

function startWheel(rich) {
  S.wheel = { offers: spinWheel(rich), rich: !!rich, bought: [] };
  S.phase = 'wheel';
  render();
}

function wheelBuy(i) {
  const w = S.wheel; if (!w) return;
  const o = w.offers[i];
  if (!o || o.kind === 'none' || o.bought || o.cost > S.coins) return;
  if (o.kind === 'potion' && (S.potions || []).length >= POTION_CAP) {
    log(`You can carry only ${POTION_CAP} potions.`, 'bad'); render(); return;
  }
  S.coins -= o.cost;
  if (o.kind === 'charm') {
    S.charms.push(o.id);
    log(`🎁 ${o.name} — ${o.text} (−${o.cost} coins)`, 'good result');
  } else if (o.kind === 'contract') {
    const c = contractById(o.id);
    S.contract = { id: o.id, n: 0, left: contractWindow(c) };
    log(`📜 You take on <b>${c.name}</b> — ${c.text} within <b>${contractWindow(c)} encounters</b> (−${o.cost} coins). Keep it and it pays 🪙 ${c.reward}.`, 'good result');
  } else if (o.kind === 'potion') {
    S.potions.push(o.id);
    log(`🧪 ${o.name} goes in your kit — ${o.text} (−${o.cost} coins)`, 'good result');
  }
  o.bought = true;
  saveGame();
  render();
}

// ⚠️ "empty-handed" means BOTH halves of the screen are out of reach - the shelf and the forge.
// Checking only one would skip a screen where the other still had something to offer.
function wheelIsEmptyHanded() {
  const offers = (S.wheel && S.wheel.offers) || [];
  // ⚠️ `kind: 'none'` is an empty slot on the shelf, not a free item - counting it as buyable
  // would keep the screen open on a shop with literally nothing in it.
  const canBuy = offers.some(o => o && o.kind !== 'none' && !o.bought && o.cost != null && o.cost <= S.coins);
  const canSharpen = S.hand.some(c => upgradable(c));
  return !canBuy && !canSharpen;
}

function wheelDone() {
  const camp = S.wheel && S.wheel.rich;
  // ⏳ THE COUNTDOWN TICKS HERE, AND FINDING OUT WHERE "HERE" IS TOOK TWO TRIES.
  // 🐛 I moved it to nextTurn() on the strength of a probe that showed the delay never being
  // spent — and nextTurn fires **ONCE PER RUN**, because the map replaced it. Instrumented:
  // over a 14-encounter run, nextTurn 1 · wheelDone 14 · endTurn 14 · finishTurn 15.
  // 🔑 A COUNTDOWN MUST TICK ON SOMETHING THAT HAPPENS EVERY ENCOUNTER, and on a map run that is
  // wheelDone/endTurn, NOT nextTurn. ⚠️ The same class of mistake as the six-build cleanup bug:
  // *a function whose name says "turn" stopped being the per-turn function when the map landed.*
  if (S.delayed > 0) {
    S.delayed--;
    log(S.delayed > 0
      ? `⏳ Still behind — ${S.delayed} more encounter${S.delayed === 1 ? '' : 's'} before you can sharpen.`
      : `⏳ You have made the time back up. You can sharpen again.`, S.delayed > 0 ? 'bad' : 'good');
  }
  S.wheel = null;
  S.upgradePick = null;
  if (camp) { S.phase = 'summary'; render(); return; }   // camp sits on the region break
  // 🐛 THIS BRANCH SKIPPED CLEANUP ENTIRELY AND SHIPPED FOR SIX BUILDS (fixed 2026-08-18).
  // It read: `if (S.map) { backToMap(); return; }` - written when the Wheel was briefly a map NODE
  // that ended a turn which never had an encounter. The node was cut the same day; the shortcut was
  // not, and it bypassed doneUpgrades() -> endTurn(), which IS cleanup.
  // ⚠️ CONSEQUENCE: on every map turn the Spell was never spent, the Catalyst and Surge never slid
  // under the deck, and **THE HAND NEVER CHANGED BETWEEN ENCOUNTERS.** Measured after the fact:
  // `endTurn` fired **0 times across 5 encounters**, and the deck lost one card in total - to a
  // Time Penalty, not to play. Thomas found it from the outside: *"i see my whole hand"* - the hand
  // was full because it was the SAME hand.
  // 🔑 A SHORTCUT ADDED FOR A FEATURE MUST BE REMOVED WITH THAT FEATURE. Cutting the wheel node
  // left a return path that quietly deleted the most important step in the turn.
  // ⚠️ And every map measurement taken before this is suspect - they were played with a static hand.
  doneUpgrades();   // 🛒 sharpening happened right here; there is no second screen
}

// kept as an alias so the solver/older callers still work — coins now simply roll over
function doneUpgrading() { if (S.phase === 'upgrade') { doneUpgrades(); return; } wheelDone(); }

// ---------- Phase 5: cleanup (automatic — the Reserve is always kept) ----------
// 🔑 CLEANUP (2026-07-26). What you POURED INTO THE SPELL is spent - discarded, gone for the
// region. Everything else slides back UNDER THE DECK in an order YOU choose.
//   - Commitment now costs at the RUN level, not just the turn: pouring deep burns more deck,
//     and the deck is both your health and your clock. Deep play shortens your run.
//   - The Stack fires EVERY turn instead of only inside multi-beat fights.
// which cards the turn CONSUMES. Engine-side this is just "ask the class".
function pouredIds() { return CLASS.spentIds(); }

// 🔥 THE EMBERWAKE ROLLS OVER — what you banked arrives, what you were holding expires.
//
// 🔐 EXTRACTED 2026-08-22 BECAUSE THE FINALE IS A THIRD TURN LOOP AND NEVER RAN IT.
// Thomas: *"i channeled +20 for next turn, but i only got 2 emberwake, what happened"*. Nothing
// happened — that is the bug. `startLastMile()` and `startDuelBeat()` both carry the warning
// *"THE FINALE NEVER CALLS nextTurn(), so anything reset there has to be reset here too"*, and both
// obeyed it. But this block lived in **endTurn()**, which the finale never calls either, and no
// comment said so. Measured over 211 duel beats: the wake changed value **zero times**, and 14
// Last Mile banks were still sitting in `wakePending` when the duel began.
// So in the finale a channelled Emberwake was announced (*"+9 for next beat"*) and then silently
// discarded, while whatever you walked in holding was spent free, every beat, forever.
// ⚠️ THE INSTRUMENT COULD NOT HAVE CAUGHT THIS: solver.js states in its own comment that the
// bot never banks — it scores one encounter, so channelling always reads as a loss. 0 banks in
// 466 duel beats. *A number produced by an instrument that structurally cannot do the thing is not
// a measurement of the thing* — the same trap, now twice on the same mechanic.
// 🔑 THE RULE: a per-turn TOKEN belongs in a function all three turn loops call, never inline
// in one of them. Anything added here is inherited by the road, the Last Mile and the duel at once.
// ● THE STREAK IS JUDGED — did this turn cost you cards?
// 🔑 ONE DEFINITION, THE SAME ONE THE HEALTH BAR USES. Extracted alongside rollWake() and for
// the same reason: the finale is a third turn loop, and a class token that cannot move during the
// boss fight is a token the boss fight does not have.
function tickMomentum(damage, r) {
  if (!r || !r.rogue) return;
  // 🔑 WHAT COUNTS AS "TOUCHED" IS THE ONLY LEVER THAT CHANGES THE STREAK'S SHAPE.
  // At MOMENTUM_BREAK = 1 this is the original rule: *any* damage shatters it. Raising it means
  // a graze no longer breaks your rhythm but a real blow does — which is the one change that
  // lifts p without touching how often you get hit.
  // ⚠️ A TIME PENALTY NO LONGER BREAKS THE STREAK (2026-08-22), and the reason is this block's
  // own stated definition: *did this turn cost you cards?* Since Time Penalty stopped touching
  // the deck it costs GROWTH, not cards — so leaving it here would have been a rule outliving
  // the thing it was about. ⚠️ It is a buff to her; measured alongside the change, not assumed.
  // ● Quietstep Boots — only a LOSS breaks the streak. 🔑 Aimed squarely at her measured problem:
  // losing Initiative breaks it 0-3% of the time and FAILING TO COMPLETE does it 77-92%, so this
  // is the one piece that touches the thing actually shortening her streaks.
  // 🔴 SHIPPED AS FULL IMMUNITY AND MEASURED **+14.0 road C / +25 win** - four times the
  // strongest generic piece, and a straight buff to the class already ahead at three stages.
  // 🔑 A FLOOR, NOT AN OFF SWITCH - the same correction 🗡️ Second Nature already carries. Immunity
  // to the thing that breaks a streak 77-92% of the time is not a piece of gear, it is a different
  // class.
  const softened = hasArmourRule('steadymo') && r.outcome !== 'Loss';
  const touched = damage >= MOMENTUM_BREAK;
  const before = S.momentum || 0;
  if (touched) {
    // 🗡️ Second Nature catches you at 2 instead of 0 — a FLOOR, never an off switch.
    S.momentum = softened ? Math.max(0, before - 1)
      : hasCharm('secondnature') ? Math.min(before, 2) : 0;
    if (before > 0) log(`● Momentum broken — ${before} → ${S.momentum}`, 'bad');
  } else {
    // 🗡️ Dead Hand doubles the step on a clean kill · 🗡️ Shadow Double's verb adds its burst.
    // Read here, not in compose(), because THIS turn's outcome does not exist until now — the
    // same reason ✦ Unspent reads S.lastOutcome instead of predicting it.
    const step = MOMENTUM_STEP + (hasCharm('deadhand') && r.outcome === 'Complete' ? 1 : 0)
                   + (r.rogue.verb === 'surge' ? 2 : 0);
    S.momentum = Math.min(MOMENTUM_CAP, before + step);
    if (S.momentum > before) log(`● Untouched — Momentum ${before} → ${S.momentum}`, 'good');
  }
}

// 🛡️ ...and armour's on-block effects roll here too, for exactly the same reason. A piece that
// says *"your next strike hits for 4 more"* is granted during SOAK, at the end of one turn, and
// must survive into the next one — which is the same shape as the Emberwake and therefore the same
// trap. Anything per-turn added here is inherited by the road, the Last Mile and the duel at once.
function rollTurnTokens() {
  S.armourTwin = false;   // 🔥 a doubled channel lasts exactly the turn you broke the band on
  S.armourStrike = S.armourStrikePending || 0; S.armourStrikePending = 0;
  // 🎯 granted multi-hit is a THIS-TURN token now (🛡️ Twinned Bracers is an active use, not an
  // `onBlock`), so it is cleared here rather than rolled forward.
  // ⚠️ A per-turn token must be cleared where EVERY turn loop reaches - this project has lost two
  // mechanics to being reset in only one of the three (🔥 the Emberwake and ● Momentum both froze
  // for an entire finale). Beside the effect it copies is how it stays found.
  S.splitPending = 0;
  S.armourWinInit = false;   // 👢 Anvil Toad Boots — this turn only, like every other turn token
  // 🩹 a worn piece marked `every: 'encounter'` gets its block back. ⚠️ Here rather than in one
  // turn loop, for the build-339 reason: the finale is a third turn loop and would have skipped it.
  for (const a of (S.armour || [])) {
    const d = armourDef(a.id);
    if (d && d.every === 'encounter' && d.block > 0) a.wear = 1;
    if (d && d.every === 'encounter' && d.uses) a.uses = d.uses;
    // 🔋 a charge piece gains a mark. ⚠️ HERE rather than in one turn loop, for the build-339
    // reason: the finale is a third turn loop and would have skipped it entirely.
    if (d && d.charge) a.charge = Math.min(d.charge, (a.charge || 0) + 1);
  }
  S.armourPace = S.armourPacePending || 0;     S.armourPacePending = 0;
  // ✦ Deepwell — a wake banked from a Lv4 Wellspring survives one more turn
  if (S.wake > 0 && !S.wakeTarget && S.wakeDeep) { S.wakeDeep = false; log(`✦ Deepwell — your Emberwake holds another turn.`, 'good'); S.wakePending = Math.max(S.wakePending || 0, S.wake); }
  // 🔥 Slowwick Treads — it does not gutter. ⚠️ Hooked HERE, in rollTurnTokens(), which is the
  // one function all three turn loops call: the Emberwake froze for an entire finale once because
  // its rollover lived in endTurn() alone, and this piece would have inherited that bug exactly.
  else if (S.wake > 0 && !S.wakeTarget && hasArmourRule('wakekeep')) {
    S.wakePending = Math.max(S.wakePending || 0, S.wake);
    log(`🛡️ <b>Slowwick Treads</b> — 🔥 your Emberwake holds.`, 'good');
  }
  else if (S.wake > 0 && !S.wakeTarget) log(`Your Emberwake gutters out unspent.`, 'bad');
  S.wakeDeep = verbLive('Wellspring', 'Boost') && banksNow();
  S.wake = S.wakePending || 0;
  S.wakePending = 0;
  S.wakeTarget = null;
}

function endTurn() {
  rollTurnTokens();
  let spentIds = pouredIds();
  // ✦ UNSPENT - a clean win costs you nothing. The Spell is the only card the turn CONSUMES, so
  // this is the biggest rule in the game to bend: it turns "what is my biggest card" into "what is
  // the smallest card that still Completes", which is exactly the decision the Spell slot has
  // never had (measured: the biggest card is correct 78% of the time).
  // 🧪 Second Breath — the one-shot Unspent, and it does not need a Complete
  if (S.potionFx && S.potionFx.unspent && spentIds.length) {
    const saved = S.hand.filter(c => spentIds.includes(c.id));
    if (saved.length) log(`✦ Second Breath — ${saved.map(c => displayName(c)).join(', ')} survives the casting.`, 'good');
    spentIds = [];
  }
  if (hasCharm('unspent') && S.lastOutcome === 'Complete' && spentIds.length) {
    const saved = S.hand.filter(c => spentIds.includes(c.id));
    if (saved.length) log(`✦ Unspent — ${saved.map(c => displayName(c)).join(', ')} survives the casting.`, 'good');
    spentIds = [];
  }
  const poured = S.hand.filter(c => spentIds.includes(c.id));
  S.hand = S.hand.filter(c => !poured.includes(c));
  S.discard.push(...poured);
  // 🔑 THE ARSENAL IS THE CARD YOU KEEP. It stays in hand and is never stacked - otherwise the
  // slot has no job at all and its own label lies. This also makes the row a real fork: a card
  // you KEEP is certain but unscheduled; a card you send under the deck you get to ORDER but
  // must live without now. Certainty versus control, every turn.
  let kept = cardById(S.assign.Reserve) || null;
  if (kept && S.loseReserve) {
    S.hand = S.hand.filter(c => c !== kept);
    S.discard.push(kept);
    log(`Your Arsenal ${displayName(kept)} is lost — ${S.loseReserve}`, 'bad');
    kept = null;
  }
  // ✦ HELD EMBER - attuning normally costs you the Catalyst for a while. This makes the pair
  // free, so you stop weighing "can I afford to spend this card as fuel" and start hunting matches.
  const held = ((hasCharm('heldember') && S.lastAttuned) || (S.potionFx && S.potionFx.holdCatalyst))
    ? cardById(S.assign.Element) : null;   // 🧪 Solvent is the one-shot Held Ember
  if (held && held !== kept && S.hand.includes(held))
    log(`✦ Held Ember — ${displayName(held)} stays in your hand.`, 'good');
  const returning = S.hand.filter(c => c !== kept && c !== held);
  // ⚠️ NO STACK ON THE LAST MILE. Everything is re-gathered a moment later, so ordering the
  // returning cards is a question with no possible answer - exactly the weightless decision the
  // tempo doc warns about ("a weightless decision is not a rest, it is homework").
  const noStack = S.finalMode && S.finalPhase === 'lastmile';
  // 🃏 THE STACK IS NO LONGER A PHASE BY DEFAULT (2026-08-05). Thomas: *"the reordering of the
  // 2 cards in hand is still an annoying step at the end"* — and the measurement had already said
  // exactly that: the Stack spans **2 points** of Complete rate across a whole run, and it fired on
  // **94% of turns**. For a human all four slots are always filled, so the returning set is almost
  // always exactly TWO cards: a two-option choice, every single turn, worth almost nothing.
  //
  // 🔑 That is the definition of the thing [[Tempo_And_The_Watch]] warns about — *a weightless
  // decision is not a rest, it is homework*. So the default is now automatic (cards return in SLOT
  // ORDER, left to right, which you already chose when you arranged the row), and 🃏 REVERSED is
  // what brings the phase back.
  //
  // 🔑 AND THAT MAKES REVERSED A BETTER CHARM: it is no longer "the same decision, relocated" —
  // it is *the charm that gives you control over your deck order at all*. The phase only exists
  // when you bought the right to it.
  if (hasCharm('reversed') && returning.length && !noStack) {
    startStack(returning, poured.length, kept); return;
  }
  finishCleanup(returning, poured.length, false, kept);
}

// 🃏 THE STACK - you choose the order your returning cards come back in, so you aren't dealt
// next turn's hand, you write it.
function startStack(cards, spentCount, kept) {
  // 🃏 `dest` only exists under 🃏 Reversed — without it every card goes to the bottom as always
  S.stack = { ids: cards.map(c => c.id), order: [], dest: {}, spent: spentCount, keptId: kept ? kept.id : null };
  S.phase = 'stack';
  render();
}
// 🃏 `where` is 'top' | 'bottom', and only 🃏 Reversed ever passes it.
function stackPick(id, where) {
  const st = S.stack; if (!st) return;
  if (!st.ids.includes(id) || st.order.includes(id)) return;
  st.order.push(id);
  if (where === 'top') st.dest[id] = 'top';
  if (st.order.length >= st.ids.length) { finishStack(); return; }
  render();
}
function stackClear() { if (S.stack) { S.stack.order = []; render(); } }
function finishStack() {
  const st = S.stack; if (!st) return;
  const rest = st.ids.filter(id => !st.order.includes(id));
  const seq = [...st.order, ...rest];
  const ordered = seq.map(id => cardById(id)).filter(Boolean);
  // 🃏 the cards you sent UP, in the order you sent them
  const top = seq.filter(id => st.dest[id] === 'top').map(id => cardById(id)).filter(Boolean);
  const spent = st.spent || 0;
  const kept = st.keptId ? cardById(st.keptId) : null;
  S.stack = null;
  finishCleanup(ordered, spent, true, kept, top);
}

function finishCleanup(returning, spentCount, ordered, kept, topList) {
  // 🃏 with no Stack phase, the row you arranged IS the order — Catalyst returns before Surge.
  // Position is already the role; now it is the schedule too, at no extra tap.
  if (!ordered) {
    const seat = c => { const z = zoneOf(c.id); const i = ZONES.indexOf(z); return i < 0 ? 99 : i; };
    returning = returning.slice().sort((a, b) => seat(a) - seat(b));
  }
  S.hand = S.hand.filter(c => !returning.includes(c));
  // 🃏 REVERSED (rewritten 2026-08-05, Thomas: *"that + arsenal, every hand will look the same
  // pretty much? maybe the charm gives you a choice to put that card at the top or bottom"*).
  //
  // ⚠️ HE IS RIGHT, AND THE FIRST VERSION WAS ACTIVELY BAD. Sending EVERY returning card to the
  // top meant your next hand was: the Arsenal you kept + the Catalyst + the Surge + one new card.
  // Three of four cards the same, every single turn - and because you never cycle past them, the
  // rest of the deck stops arriving at all. A charm that makes the hand REPEAT is the exact
  // opposite of "variety comes from the problems and the hand".
  //
  // 🔑 So it is a CHOICE PER CARD now, which also fixes the other thing measurement complained
  // about: the Stack was worth ~2 points of Complete rate, i.e. nearly weightless homework.
  // Two axes - the order AND how soon - is a real decision, and "send everything up" is still
  // available but self-punishing, which is what makes picking correctly a skill.
  const up = (topList || []).filter(c => returning.includes(c));
  const down = returning.filter(c => !up.includes(c));
  if (up.length) S.deck.unshift(...up);
  if (down.length) S.deck.push(...down);
  // 🗺️ THE HAND IS DEALT AFTER YOU CHOOSE THE ROAD, NOT BEFORE (2026-08-18).
  // Thomas: *"i see my whole hand, and i see all 3 encounters and what they do. doesn't seem right
  // that i have knowledge of my whole hand before picking an encounter."*
  // 🔑 HE IS RIGHT AND IT WAS THE PILLAR AGAIN. Knowing your whole hand AND every road's contents
  // makes routing a solved matching problem - *complete optimizable data*, the thing
  // [[Game_Pillars]] forbids. Measured: **92% of map screens showed a full four-card hand.**
  // ✅ AND IT IS THE BIGGEST JOB THE ✦ ARSENAL HAS EVER HAD. The card you carry is now the ONLY
  // thing you know about yourself when you choose where to go - *what am I bringing into a decision
  // I have not made yet*. [[The_Arsenal_Question]] records three failed attempts to make that slot
  // matter from the inside; this makes it matter from the OUTSIDE, which is where forks have
  // actually worked here.
  // ⚠️ Only when a map is driving the run - the tutorial and the finale still deal at cleanup.
  const holdDraw = !!S.map && !S.finalMode;
  const before = S.hand.length;
  if (!holdDraw) draw(HAND_SIZE - S.hand.length);
  log(`Cleanup: ${spentCount} spent on the spell — gone. ` +
      (returning.length ? `${returning.map(c => displayName(c)).join(', ')} slide under the deck` +
        `${ordered && returning.length > 1 ? ' in your order' : ''}. ` : '') +
      (kept ? `Your Arsenal ${displayName(kept)} stays in hand. ` : '') +
      (holdDraw ? `You will draw the rest once you have chosen your road.`
                : `Drew ${S.hand.length - before} (deck ${S.deck.length}, discard ${S.discard.length})`));

  // Poison lands on the freshly drawn hand, before the next encounter
  if (S.poison > 0 && S.hand.length > 0) {
    log(`Poison strikes the new hand: ${S.poison} damage to block`, 'bad');
    S.damage = S.poison;
    S.poison = 0;
    S.damageEl = null;
    S.downgraded = new Set(); // per rulebook these cards can still be downgraded/upgraded next encounter (nextTurn resets again)
    S.afterSoak = 'turnEnd';
    startSoak();
    return;
  }
  finishTurn();
}

function finishTurn() {
  // the finale runs its own beat sequencing (Approach beats → Duel), not region flow
  if (S.finalMode) { finaleAfterTurn(); return; }
  backToMap();
}

// 🗺️ EVERY NODE ENDS BY RETURNING TO THE MAP. ⚠️ The old `regionTurn >= REGION_ENCOUNTERS`
// clock is gone - the map IS the clock now, and the run ends when you step off its top floor.
// 🔑 The `dry` check survives, because running out of cards must still end the road: the deck is
// the health bar, and a map with floors left does not change that.
function backToMap() {
  const m = S.map;
  if (!m) { finishRegionCheck(); return; }                    // tutorial / legacy runs
  // 💀 a dangerous thing you KILLED gives up a charm. ⚠️ Paid HERE, at the one place every
  // node returns through, rather than in the encounter branch - a boon owed after a soak or an
  // event would otherwise be stepped over.
  if (S.boonOwed) {
    S.boonOwed = false;
    const offers = rollBoon();
    if (offers.length) { S.boon = offers; S.phase = 'eliteboon'; render(); return; }
  }
  // 🗺️ THE MAP IS THE CLOCK, SO ONLY THE TOP FLOOR ENDS THE ROAD.
  // ⚠️ Running dry used to end a REGION, and the region break reshuffled your discard back in
  // and carried on. Ported straight across it ended the whole RUN - a bad patch in band 2 would
  // teleport you to the lair with eight floors unwalked, which is far harsher than the old rule
  // and looks like a bug from the inside. Thomas spotted the shape of it: *"some regions could be
  // short if you did bad."*
  // 🔑 A CONDITION THAT USED TO END A CHAPTER MUST NOT BE PORTED AS ONE THAT ENDS THE BOOK.
  // Going dry now does what a region break did: gather everything up and keep walking. The cost is
  // already paid and permanent - the cards you LOST at Lv1 are gone, so the deck you reshuffle is
  // thinner every time, which is the deck-as-health pressure doing its job without a cliff.
  const dry = S.hand.length + S.deck.length < REGION_END_THRESHOLD;
  const atTop = m.pos && m.pos.f >= mapFloors(m) - 1;
  if (atTop) {
    log(`The road runs out. THE ${S.dragon.name.toUpperCase()} AWAITS.`, 'result');
    S.phase = 'summary';
    render();
    return;
  }
  if (dry && S.discard.length) {
    const pool = shuffle([...S.deck, ...S.discard]);
    S.deck = pool; S.discard = [];
    if (S.hand.length < HAND_SIZE && S.deck.length) draw(HAND_SIZE - S.hand.length);
    log(`You gather up what you have dropped and go on — ${S.deck.length + S.hand.length} cards left.`, 'bad');
  }
  S.phase = 'map';
  render();
}

function finishRegionCheck() {
  const done = S.regionTurn >= REGION_ENCOUNTERS;
  const dry = S.hand.length + S.deck.length < REGION_END_THRESHOLD;
  if (done || dry) {
    const why = done ? `${REGION_ENCOUNTERS} encounters crossed` : `too few cards left to go on`;
    if (S.region >= RUN().length) log(`${why} → REGION ${RUN().length} CLEARED. THE ${S.dragon.name.toUpperCase()} AWAITS.`, 'result');
    else log(`${why} → END OF REGION ${S.region}`, 'result');
    S.phase = 'summary';
    render();
    return;
  }
  nextTurn();
}

// ============================================================
// EVENTS — the run layer (fires after a Complete/Narrow journey).
// Every event has a free opt-out; negatives only sit behind a telegraphed,
// opt-in choice. Design + pool: 03_Content/Events.md. All outcomes are
// existing engine verbs (level, reforge stat, rewire enhEl).
// ============================================================
// 🔑 EVENTS SOFTEN, THEY NEVER DELETE (2026-07-29, Thomas). A card can still leave your deck for
// good — but only ever as a consequence of DAMAGE, which is the deck-as-health system doing its
// job. It must never be the price of a choice you made at a campfire: an option that permanently
// costs you a card is one nobody sensible takes, so it isn't a decision, it's a trap. Lv1 is the
// floor here; the card just stays Lv1.
function evLevel(card, delta) {
  if (delta > 0) {
    if (card.level >= MAX_LEVEL) return `${card.def.name} already burns as bright as it can — nothing changes.`;
    card.level++; return `${card.def.name} brightens to Lv${card.level}.`;
  }
  if (card.level <= 1) return `${card.def.name} is already as dull as it gets — it takes no more harm.`;
  card.level--;
  return `${card.def.name} dims to Lv${card.level}.${card.level === 3 ? ' Its Lv4 edge is gone.' : ''}`;
}
// evReforge / evRewire CUT 2026-07-26 - permanently rewriting a card makes it stop being the
// card you learned. Events that only change LEVEL survive (Chandler, Kiln, Toll).
// upgrade up to n random still-upgradeable hand cards (a "windfall"/"chunk of XP" expressed as levels)
function evUpgradeRandom(n, excludeId) {
  const pool = shuffle(S.hand.filter(c => c.level < MAX_LEVEL && c.id !== excludeId));
  const picks = pool.slice(0, n);
  if (!picks.length) return ['Nothing here can burn any brighter — the windfall is wasted.'];
  return picks.map(c => evLevel(c, +1));
}
function evCurseNextFight() { S.curseNextFight = true; return 'A ward bites — your next fight will carry a Hardship.'; }
const rand = arr => arr[Math.floor(rnd() * arr.length)];

const EVENTS = [
  // ============================================================
  // 🗺️ REGION-FLAVOURED AND POTION-BEARING EVENTS (added 2026-08-05, Thomas: *"add more
  // events as well, that may give out potions. im already tired of seeing the same events"*).
  //
  // 🔑 THE PROBLEM WAS ARITHMETIC, NOT WRITING. The pool held TEN events and a run draws six or
  // seven — so you saw most of the game's writing every single run. Doubling the pool roughly
  // halves the repetition; REGION gating does the rest, because a Wilding Marches event simply
  // cannot appear on the Verdant Edge road.
  // ⚠️ Every option still pays in a DIFFERENT currency (travel · deck · coins · kit · nothing),
  // and any option needing a card declares `pick` + `pickNote` — a picker must never offer what
  // it cannot act on.
  // ============================================================
  { id: 'glassblower', name: "The Glassblower's Wagon",
    flavor: "A wagon with its side folded down into a counter, and a woman inside blowing something small and violently orange. She does not look up. 'Two minutes. Don't breathe on it.'",
    options: [
      { label: '🪙 −7 — buy whatever she has finished', need: 'none',
        when: () => S.coins >= 7,
        apply: () => { S.coins -= 7; return [`You put the coins on the counter (−7, ${S.coins} left).`, evRandomPotion(true)]; } },
      { label: 'Hold the bellows for her — a card you choose DIMS a level, and she pays you in glass', need: 'card',
        pick: c => c.level > 1, pickNote: 'already Lv1 — nothing to give up',
        apply: ({ card }) => ['You work the bellows until your arms shake — ' + evLevel(card, -1), evRandomPotion(true), evRandomPotion(false)] },
      { label: 'Watch her work and move on', need: 'none',
        apply: () => ['You watch the glass go from orange to gold to nothing at all. She still does not look up.'] },
    ] },

  { id: 'rainbarrel', name: 'The Rain-Barrel',
    flavor: "Someone has left a barrel at the crossroads with a tin cup chained to it, and a note: FOR THE ROAD. NOT FOR THE GREEDY.",
    options: [
      { label: 'Take one cup, as asked', need: 'none',
        apply: () => [evRandomPotion(false), 'You hang the cup back on its chain.'] },
      { label: 'Take three', need: 'none',
        apply: () => [evRandomPotion(true), evRandomPotion(true), 'Something in the water disagrees with you.', evTakeCurse()] },
      { label: 'Fill the barrel instead — 🪙 −4, and the road remembers it', need: 'none',
        when: () => S.coins >= 4,
        apply: () => { S.coins -= 4; S.paceBless = 2; return [`You pay a carter to top it up (−4 coins, ${S.coins} left).`, 'The road ahead is kind to you — +2 Pace on your next two journeys.']; } },
    ] },

  { id: 'lamplighter', name: 'The Last Lamplighter',
    flavor: "An old man on a ladder, working along a road with no lamps left on it. He is lighting the brackets anyway.",
    options: [
      { label: 'Light one with him — 🕯️ your candle catches', need: 'none',
        apply: () => { const was = S.candle; lightCandle('you lit one together'); return [was ? 'Your candle was already lit; you light his instead, and he lets you.' : 'He cups his hand around yours until it takes.']; } },
      { label: 'Ask why he bothers — he gives you something for the dark', need: 'none',
        apply: () => ['"Somebody comes after," he says, as though that settled it.', evGrantPotion('nightglass')] },
      { label: 'Take the oil from his can — 🪙 +9, and he says nothing at all', need: 'none',
        apply: () => { S.coins += 9; return [`You take what is left in the can (+9 coins, ${S.coins}).`, 'He goes on lighting brackets behind you.', evTakeCurse()]; } },
    ] },

  { id: 'saltline', name: 'The Salt Line',
    when: () => curseCount() > 0,
    flavor: "A line of coarse salt poured across the road, ankle to ankle, still white. Someone drew it recently, and from this side.",
    options: [
      { label: 'Step across and leave something behind', need: 'none',
        apply: () => ['You step over. Something does not follow.', evLiftCurse()] },
      { label: 'Gather the salt — 🪙 +7, and whatever it was kept out is now walking with you', need: 'none',
        apply: () => { S.coins += 7; return [`Good salt sells (+7 coins, ${S.coins}).`, evTakeCurse()]; } },
      { label: 'Go the long way around', need: 'none',
        apply: () => ['It costs you an hour and nothing else.'] },
    ] },

  { id: 'sunkenbell', name: 'The Sunken Bell', region: [2, 3],
    flavor: "A bell-tower up to its shoulders in the marsh. The bell is still in it, and the water is still moving.",
    options: [
      { label: 'Ring it once — every card you hold rings with it (a card BRIGHTENS)', need: 'card',
        pick: c => c.level < MAX_LEVEL, pickNote: 'already Lv4 — nothing to brighten',
        apply: ({ card }) => ['The note goes out flat across the water — ' + evLevel(card, +1), 'Something a long way off stops moving to listen.', evCurseNextFight()] },
      { label: 'Dive for what people threw in — 🪙 +11', need: 'none',
        apply: () => { S.coins += 11; return [`You come up with a fistful of wishes (+11 coins, ${S.coins}).`]; } },
      { label: 'Leave the bell alone', need: 'none',
        apply: () => ['You walk past it. It rings anyway, once, behind you.'] },
    ] },

  { id: 'stormcrow', name: 'The Stormcrow', region: [3, 4],
    flavor: "A bird the size of a dog on a milestone, entirely uninterested in you, watching the weather come.",
    options: [
      { label: 'Read the weather off it — 🕯️ you can see the road ahead again', need: 'none',
        apply: () => { lightCandle('the bird shows you where the sky breaks'); return ['It tilts its head at the horizon, and you follow the line of its beak.']; } },
      { label: 'Trade it your supper — 🪙 −5 for something it has been keeping', need: 'none',
        when: () => S.coins >= 5,
        apply: () => { S.coins -= 5; return [`It takes the bread with terrible dignity (−5 coins, ${S.coins} left).`, evRandomPotion(true)]; } },
      { label: 'Throw a stone at it', need: 'none',
        apply: () => ['It does not move. You feel worse about it than you expected.', evTakeCurse()] },
    ] },

  { id: 'quietforge', name: 'The Quiet Forge', region: [1, 2],
    flavor: "A smithy with a cold fire and every tool hung exactly where it belongs. A slate by the door reads: BACK SOON — HELP YOURSELF, HONESTLY.",
    options: [
      { label: 'Do the work yourself — TWO cards brighten, and you arrive tired (Hardship next fight)', need: 'none',
        apply: () => [...evUpgradeRandom(2), 'You leave the fire banked and your hands black.', evCurseNextFight()] },
      { label: 'Leave honest payment — 🪙 −10, and take a finished piece', need: 'none',
        when: () => S.coins >= 10,
        apply: () => { S.coins -= 10; return [`You leave the coins on the slate (−10, ${S.coins} left).`, ...evUpgradeRandom(1), evRandomPotion(false)]; } },
      { label: 'Take a tool and go', need: 'none',
        apply: () => { S.coins += 8; return [`It is worth something to someone (+8 coins, ${S.coins}).`, 'The slate is still there when you look back.', evTakeCurse()]; } },
    ] },

  { id: 'longtable', name: 'The Long Table', region: [2, 3, 4],
    flavor: "Twenty feet of trestle table in the middle of nowhere, laid for a great many people, none of whom are here. The food is warm.",
    options: [
      { label: 'Sit down and eat properly', need: 'none',
        apply: () => ['You eat like someone who has been walking for a week, which you have.', evRandomPotion(false), ...evUpgradeRandom(1)] },
      { label: 'Fill your pockets and keep walking', need: 'none',
        apply: () => { S.coins += 6; return [`You take what will travel (+6 coins, ${S.coins}).`, evRandomPotion(false)]; } },
      { label: 'Lay a place for whoever is late', need: 'none',
        apply: () => { S.emberShield = true; S.paceBless = 2; return ['You set out one more cup and go.', 'The road treats you as one of its own — +2 Pace, and the night cannot take your Arsenal in this region.']; } },
    ] },

  { id: 'beggarking', name: 'The Beggar King', region: [3, 4],
    flavor: "A man in the ruin of something that was once extremely expensive, holding out a hand with genuine authority.",
    options: [
      { label: 'Pay what he asks — 🪙 −12', need: 'none',
        when: () => S.coins >= 12,
        apply: () => { S.coins -= 12; return [`You put it in his hand (−12, ${S.coins} left).`, '"Good," he says, as if you had passed something.', ...evUpgradeRandom(2), evRandomPotion(true)]; } },
      { label: 'Ask what he is king of', need: 'none',
        apply: () => { const d = S.dragon ? S.dragon.name : 'it'; return [`"This road," he says. "All of it. Right up to where the ${d} starts being king instead."`, evRandomPotion(false)]; } },
      { label: 'Walk past', need: 'none',
        apply: () => ['He watches you the whole way, without resentment.'] },
    ] },

  { id: 'ashfall', name: 'Ashfall', region: [4],
    flavor: "It has been snowing grey since noon and it is not snow. It settles on your shoulders and your pack and the road, and it is warm.",
    options: [
      { label: 'Push through it — a card DIMS, but you make up the ground (+2 Pace, next two journeys)', need: 'card',
        pick: c => c.level > 1, pickNote: 'already Lv1 — nothing left to give',
        apply: ({ card }) => { S.paceBless = 2; return ['You go on through it — ' + evLevel(card, -1), 'and come out ahead of where you should be.']; } },
      { label: 'Shelter until it passes — rest, and drink something warm', need: 'none',
        apply: () => ['You get under an overhang and wait it out.', evRandomPotion(false), evGrantPotion('clarity')] },
      { label: 'Fill a jar with it — 🪙 +10 from someone who wants it', need: 'none',
        apply: () => { S.coins += 10; return [`Someone always wants a jar of the mountain (+10 coins, ${S.coins}).`]; } },
    ] },

  { id: 'apothecary', name: 'The Roadside Apothecary',
    flavor: "A shopfront built into the side of a hill, all little drawers, and a boy of about eleven minding it who clearly knows exactly what everything does.",
    options: [
      { label: 'Buy the good stuff — 🪙 −9', need: 'none',
        when: () => S.coins >= 9,
        apply: () => { S.coins -= 9; return [`He wraps it without being asked (−9 coins, ${S.coins} left).`, evRandomPotion(true)]; } },
      { label: 'Trade a page of your book for two — a card you choose DIMS', need: 'card',
        pick: c => c.level > 1, pickNote: 'already Lv1 — he cannot use it',
        apply: ({ card }) => ['He reads it twice and copies nothing, which you appreciate — ' + evLevel(card, -1), evRandomPotion(false), evRandomPotion(false)] },
      { label: 'Ask what he would take for the whole hill', need: 'none',
        apply: () => { S.coins += 5; return ['"You could not," he says, "but here," and gives you back your own coin plus interest.', `(+5 coins, ${S.coins}.)`]; } },
    ] },

  { id: 'wayshrine', name: 'The Guttered Wayshrine',
    flavor: "A pilgrim's candle-shrine, long cold. Relight the wick and the old craft repays the warmth — though a greedy flame may draw it from somewhere else.",
    options: [
      { label: 'Relight it — a card brightens (a greedy flame might dim another)', need: 'none',
        apply: () => { const up = rand(S.hand); const lines = [evLevel(up, +1)];
          if (rnd() < 0.35 && S.hand.length > 1) { const dn = rand(S.hand.filter(c => c.id !== up.id)); lines.push('The flame takes its due — ' + evLevel(dn, -1)); }
          return lines; } },
      { label: 'Swear to tend it — take a CHARM, and a CURSE to carry with it', need: 'none',
        apply: () => { const good = CHARMS.filter(c => !c.curse && charmUnlocked(c) && charmFitsClass(c) && !S.charms.includes(c.id));
          return [good.length ? evGrantCharm(rand(good).id) : 'The shrine has no gift left.', evTakeCurse()]; } },
      { label: 'Take the oil instead — 🪙 +6 coins, the shrine stays cold', need: 'none',
        apply: () => { S.coins += 6; return [`You pocket the oil — +6 coins (you now hold ${S.coins}).`]; } },
      { label: 'Leave it dark — nothing', need: 'none', apply: () => ['You leave the wick cold and travel on.'] },
    ] },
  { id: 'chandler', name: "The Chandler's Rest",
    flavor: "A woodcutter's hut, the hearth still warm. A night here is enough to mend a frayed tool.",
    options: [
      { label: 'Mend one carefully — a card you choose gains +1 level', need: 'card', pick: c => c.level < MAX_LEVEL, pickNote: 'already Lv4 — nothing to brighten', apply: ({ card }) => evLevel(card, +1) },
      { label: 'Work through the night — +1 level on TWO cards, but you arrive tired (Hardship next fight)', need: 'none',
        apply: () => [...evUpgradeRandom(2), evCurseNextFight()] },
      { label: 'Ask after what you have lost — a broken card returns at Lv1', need: 'none',
        when: () => S.trashed.length > 0,
        apply: () => ['He works in silence for an hour and hands it back.', evRecoverCard('last')] },
      { label: 'Sell him your spare wax — 🪙 +7 coins', need: 'none',
        apply: () => { S.coins += 7; return [`The chandler pays well for good wax — +7 coins (you now hold ${S.coins}).`]; } },
    ] },
  { id: 'kiln', name: 'The Kiln of Trials',
    flavor: "An old firing-kiln, its coals banked low. Temper a card here and it comes out changed — hardened, or cracked.",
    options: [
      { label: 'Temper a card — likely +1 level; it might crack (−1)', need: 'card',
        apply: ({ card }) => rnd() < 0.7 ? ('It hardens. ' + evLevel(card, +1)) : ('It cracks! ' + evLevel(card, -1)) },
      { label: 'Fire it hot — a card you choose gains +2 levels, or cracks for −1 (even odds)', need: 'card',
        apply: ({ card }) => rnd() < 0.5
          ? ('The kiln roars. ' + evLevel(card, +1) + ' ' + evLevel(card, +1))
          : ('Too hot — it cracks. ' + evLevel(card, -1)) },
      { label: 'Leave it cold — nothing', need: 'none', apply: () => ['You bank the coals and travel on.'] },
    ] },
  { id: 'cache', name: 'The Buried Cache',
    flavor: "A cartographer's mark scratched on a stone — someone buried something here, and warded it.",
    options: [
      { label: 'Dig it up — a charm lies buried, but the ward may cling to you', need: 'none',
        apply: () => { const good = CHARMS.filter(c => !c.curse && charmUnlocked(c) && charmFitsClass(c) && !S.charms.includes(c.id));
          const lines = good.length ? [evGrantCharm(rand(good).id)] : evUpgradeRandom(2);
          if (rnd() < 0.4) lines.push(evTakeCurse());
          return lines; } },
      { label: 'Mark it and move on — a small, safe find', need: 'none', apply: () => evUpgradeRandom(1) },
      { label: 'Sell the location at the next town — 🪙 +10 coins, nothing dug', need: 'none',
        apply: () => { S.coins += 10; return [`Someone else can risk the ward — +10 coins (you now hold ${S.coins}).`]; } },
    ] },
  { id: 'pilgrim', name: 'The Gray Pilgrim',
    flavor: "A hooded traveler shares your fire. He asks for a page of your book, and blesses the road ahead.",
    options: [
      // ⚠️ REWRITTEN 2026-07-29. The old first option TRASHED a card for the whole run, and both
      // paying options gave +2 Pace — so the "choice" was one currency at two prices. These three
      // now pay in three different currencies: travel · deck power · coins.
      { label: 'Let him read a page — a card you choose DIMS one level; the road ahead is blessed (+2 Pace, next two journeys)', need: 'card', pick: c => c.level > 1, pickNote: 'already Lv1 — nothing to give up', 
        apply: ({ card }) => { const t = evLevel(card, -1); S.paceBless = 2; S.eventFlags.pilgrim = 'gave';
          return [t, 'The road ahead is blessed — +2 Pace on your next two journeys.', 'He reads it once, closes your book gently, and hands it back. "I will know you again."']; } },
      { label: 'Share your supper — 🪙 −8 coins, and he tends your kit: a card you choose BRIGHTENS a level', need: 'card', pick: c => c.level < MAX_LEVEL, pickNote: 'already Lv4 — nothing to brighten', when: () => S.coins >= 8,
        apply: ({ card }) => { if (S.coins < 8) return ['You have nothing to share; he wishes you well anyway.'];
          S.coins -= 8; S.eventFlags.pilgrim = 'fed';
          return [`You share what you have (−8 coins, ${S.coins} left).`, 'He works at it by the fire without being asked — ' + evLevel(card, +1), 'He eats every scrap and says nothing, which from him is thanks.']; } },
      { label: 'Keep your book — nothing', need: 'none',
        apply: () => { S.eventFlags.pilgrim = 'refused'; return ['You keep your pages close and travel on.', 'He nods, unoffended. "A careful sort. The road likes those, sometimes."']; } },
    ] },
  // ⤷ CONDITIONAL: there is nothing here to find until you have actually lost something.
  { id: 'ashfield', name: 'The Ashfield',
    when: () => S.trashed.length > 0,
    flavor: "A slope of grey cinders where the mountain puts everything it has finished with. Somewhere in it is your handwriting.",
    options: [
      { label: 'Dig for the last thing you dropped — 🪙 −6, it returns at Lv1', need: 'none',
        when: () => S.coins >= 6, whenNote: () => `you have only 🪙 ${S.coins} of 6`,
        apply: () => { if (S.coins < 6) return ['You have nothing to trade the ashfield, and it does not give on credit.'];
          S.coins -= 6; return [`You dig until your hands are black (−6 coins, ${S.coins} left).`, evRecoverCard('last')]; } },
      { label: 'Take back EVERYTHING you have lost — and a CURSE for the presumption', need: 'none',
        apply: () => [...evRecoverAll(), 'Something notices how much you took.', evTakeCurse()] },
      { label: 'Let the ash keep it', need: 'none',
        apply: () => ['You leave your losses where they fell. The slope does not thank you either way.'] },
    ] },
  // ⤷ CALLBACK: only appears if you have already met him, and he remembers which you were.
  { id: 'pilgrim2', name: 'The Gray Pilgrim, Again', once: true,
    when: () => !!S.eventFlags.pilgrim,
    flavor: "The same hooded traveler, further along a road he has no business being further along. He is already boiling water for two.",
    options: [
      { label: 'Ask him to lift what you are carrying', need: 'none',
        apply: () => { if (!curseCount()) return ['"You carry nothing that needs my hands," he says, faintly disappointed.'];
          if (S.eventFlags.pilgrim === 'gave') return ['"You gave without asking what it bought," he says. "Sit."', evLiftCurse()];
          if (S.eventFlags.pilgrim === 'fed') return ['"You fed me once. That is a kind of coin."', evLiftCurse()];
          if (S.coins < 12) return ['"You kept your pages then, and your coin now." He shrugs. "So do I."'];
          S.coins -= 12; return [`He holds out a hand until you fill it (−12 coins, ${S.coins} left).`, evLiftCurse()]; } },
      { label: 'Ask what he is walking toward', need: 'none',
        apply: () => { const d = S.dragon ? S.dragon.name : 'the thing at the end';
          return [`"Same as you," he says, and does not look up. "${d} was not always a dragon, you know. That is the sad part."`, ...evUpgradeRandom(1)]; } },
      { label: 'Walk on before he starts talking', need: 'none',
        apply: () => ['You are past the fire before he can offer you tea. Behind you, he pours two cups anyway.'] },
    ] },
  { id: 'hollow', name: 'The Ember Hollow',
    flavor: "A hollow where one coal never dies. Bank your light here and the dark can't take it.",
    options: [
      { label: 'Bank your Arsenal — the night cannot snuff it for the rest of this region', need: 'none',
        apply: () => { S.emberShield = true; return [`Your Arsenal is warded — Nightfall cannot take it for the rest of ${RUN()[S.region - 1].name}.`]; } },
      { label: 'Take the coal with you — a card you choose gains +1 level, the ward is spent', need: 'card', pick: c => c.level < MAX_LEVEL, pickNote: 'already Lv4 — nothing to brighten', 
        apply: ({ card }) => ['You lift the everburning coal — ' + evLevel(card, +1)] },
      { label: 'Bargain with what sleeps here — 🪙 +14 coins, and a CURSE', need: 'none',
        apply: () => { S.coins += 14; return [`Something in the dark pays generously — +14 coins (you now hold ${S.coins}).`, evTakeCurse()]; } },
      { label: 'Leave the coal — nothing', need: 'none', apply: () => ['You leave the coal banked and travel on.'] },
    ] },
  { id: 'toll', name: 'The Toll of Thorns',
    flavor: "A bramble-wall across the path. Force through and it takes something; or spend the time to find a way around.",
    options: [
      { label: 'Cut through — a card you choose loses a level, but two others brighten', need: 'card', pick: c => c.level > 1, pickNote: 'already Lv1 — nothing to give up', 
        apply: ({ card }) => { const lines = ['You force the thorns — ' + evLevel(card, -1)]; lines.push('but win through to easier ground:', ...evUpgradeRandom(2, card.id)); return lines; } },
      { label: 'Pay the toll in coin — 🪙 −9 coins, pass untouched', need: 'none',
        when: () => S.coins >= 9, whenNote: () => `you have only 🪙 ${S.coins} of 9`,
        apply: () => { if (S.coins < 9) return ['You cannot pay; the thorns let nothing through for free.'];
          S.coins -= 9; return [`You pay the bramble-keeper (−9 coins, ${S.coins} left) and pass untouched.`]; } },
      { label: 'Turn back, find another way — nothing lost, nothing gained', need: 'none', apply: () => ['You take the long way around, unscathed.'] },
    ] },
  { id: 'mirror', name: 'The Mirror Fen',
    flavor: "The fen shows things that aren't there yet — you can't tell if it's a gift or a warning.",
    options: [
      { label: 'Look into the fen — something happens (you cannot tell what)', need: 'none',
        apply: () => mirrorGlimpse(Math.floor(rnd() * 4)) },
      // TWO glimpses must be two DIFFERENT glimpses - the same face twice is either a shrug or a
      // double curse, and neither is what "stare until it answers" promises.
      { label: 'Stare until it answers — TWO glimpses, and they will not be the same', need: 'none',
        apply: () => shuffle([0, 1, 2, 3]).slice(0, 2).flatMap(mirrorGlimpse) },
      { label: 'Look away — nothing', need: 'none', apply: () => ['You look away before it shows you too much.'] },
    ] },
];
// one face of the Mirror Fen, factored out so the one-glimpse and two-glimpse options can never
// drift apart - they were two hand-copied roll tables before
function mirrorGlimpse(face) {
  if (face === 0) return ['The fen gives.', ...evUpgradeRandom(2)];
  if (face === 1) return ['The fen takes. ' + evTakeCurse()];
  if (face === 2) return ['The fen gives, a little.', ...evUpgradeRandom(1)];
  S.paceBless = 1;
  return ['A glimpse of the road ahead — +2 Pace on your next journey.'];
}
function currentEventDef() { return EVENTS.find(e => e.id === S.event.id); }

// 🔑 EVENTS REMEMBER (2026-07-27). An event may declare `when()` to gate itself on what has
// already happened, and `once: true` to fire at most one time a run. Options record what you
// chose in S.eventFlags. That is the whole machinery behind recurring characters and callbacks
// — the run gets a story instead of a series of unrelated screens, and it costs one filter.
function eventPool() {
  const seen = S.eventsSeen || [];
  // 🗺️ an event may belong to a REGION (a number or a list). This is the cheap half of
  // "stages are places" — the road through the Wilding Marches stops offering you the same
  // wayshrine you saw in the Verdant Edge, at the cost of one field per event.
  const here = e => !e.region || (Array.isArray(e.region) ? e.region.includes(S.region) : e.region === S.region);
  const live = EVENTS.filter(e => !(e.once && seen.includes(e.id)) && (!e.when || e.when()) && here(e));
  return live.length ? live : EVENTS.filter(e => !(e.once && seen.includes(e.id)) && (!e.when || e.when()));
}
function startEvent() {
  if (S.hand.length === 0) { finishRegionCheck(); return; } // nothing to act on
  const pool = eventPool();
  if (!pool.length) { finishRegionCheck(); return; }
  const def = rand(pool);
  S.eventsSeen = [...(S.eventsSeen || []), def.id];
  S.event = { id: def.id, step: 'options', opt: null, targetId: null, wantElement: false, lines: null };
  S.phase = 'event';
  logHeader(`✦ ${def.name}`);
  log(def.flavor);
  render();
}
// 🚧 WHY AN EVENT OPTION IS CLOSED TO YOU — or null if it is open. **One predicate, three
// callers**: the buttons grey themselves with it, `eventChoose()` refuses with it, and the bot
// picks with it.
//
// 🔴 IT EXISTED IN TWO PLACES AND THE BOT HAD NEITHER (found 2026-08-23 while checking the end
// screen listed every material). `renderControls` computed availability inline to grey a button,
// `eventChoose` re-checked only the card half, and `solver.js` just called `eventChoose(0)`.
// On ⏳ The Toll of Thorns option 0 needs a card above Lv1 — so with an all-Lv1 hand the bot
// chose it, could not complete it, cancelled, chose it again, and **spun until the turn guard
// killed the run**. Measured at **1 run in 25**, and a stalled run banks NOTHING: no materials,
// no xp, no grade. Every number quoted from a batch has been ~4% garbage.
// 🔑 THE RULE THIS EARNS, and it is the arrangement-search lesson one screen over: **a predicate
// the UI uses to DISABLE something is a rule, and the bot must ask the same one.** A button the
// player cannot press must be a button the bot cannot choose — otherwise the instrument is playing
// a game with different legal moves.
function eventOptionBlocked(o) {
  if (!o) return 'no such choice';
  if (o.when && !o.when()) return o.whenNote ? o.whenNote() : 'you cannot afford this';
  if (o.need === 'card' && !eventPickable(o).length)
    return S.hand.length ? 'no card in hand can take this' : 'no cards in hand';
  return null;
}
function eventChoose(i) {
  const opt = currentEventDef().options[i];
  // never ask for something you cannot possibly give — the player would be stuck on a picker with
  // nothing to pick and only a "back" button to explain it
  const shut = eventOptionBlocked(opt);
  if (shut) {
    log(`${shut.charAt(0).toUpperCase()}${shut.slice(1)} — that road is closed to you.`, 'bad');
    render();
    return;
  }
  S.event.opt = i;
  if (opt.need === 'card') { S.event.step = 'pickCard'; render(); return; }
  resolveEvent(opt, null, null);
}
// ⚠️ A PICKER MUST NEVER OFFER WHAT IT CANNOT ACT ON (bug found in play 2026-08-05, Thomas:
// *"during the gray pilgrim event, i picked to level up a card, and a lvl 4 card was able to be
// chosen, i clicked it and it didn't do anything"*).
//
// `need: 'card'` only ever said "this option wants a card" — never WHICH cards. So every hand card
// got a Choose button, and picking an ineligible one resolved the event for nothing. On the
// Pilgrim's supper it was worse than nothing: it charged 8 coins and then reported that the Lv4
// card "already burns as bright as it can".
//
// 🔑 Two halves, and both are needed: an option now declares `pick` (which cards it can act on)
// and `pickNote` (why the others cannot) — so the ineligible cards are still SHOWN and still say
// why, rather than vanishing. Same rule as the barred card under ⚖️ Dead Weight: never state a
// rule about an object without marking the object.
function eventCanPick(opt, card) { return !opt || !opt.pick || opt.pick(card); }
function eventPickable(opt) { return S.hand.filter(c => eventCanPick(opt, c)); }
function eventPickCard(id) {
  const card = cardById(id); if (!card) return;
  const opt = currentEventDef().options[S.event.opt];
  if (!eventCanPick(opt, card)) return;   // belt and braces — the button is not drawn either
  S.event.targetId = id;
  resolveEvent(opt, card, null);
}
function eventCancelPick() { S.event.step = 'options'; S.event.opt = null; S.event.wantElement = false; render(); }
function resolveEvent(opt, card, el) {
  const out = opt.apply({ card, element: el });
  const arr = Array.isArray(out) ? out : [out];
  for (const l of arr) log(l, 'good result');
  S.event.lines = arr;
  S.event.step = 'done';
  render();
}
// 🗺️ an event is a NODE now, so it hands you back to the road.
function eventContinue() { S.event = null; if (S.map && !S.finalMode) { backToMap(); return; } finishRegionCheck(); }

// ============================================================
// rendering
// ============================================================
const $ = id => document.getElementById(id);

// iconography (2026-07-01): ⚔️ Attack · 👣 Move · 💨 Initiative · ➕ Boost · 🛡️ Armor · ✨ Enhanced · ⭐ XP · ❤️ HP · ⏳ Time Penalty
const EL_ICON = { Fire: '🔥', Water: '💧', Lightning: '⚡', Stone: '🪨' };
const elIcon = el => EL_ICON[el] || '';

function elChip(el) {
  return el ? `<span class="el el-${el}">${elIcon(el)} ${el}</span>` : `<span class="el el-none">—</span>`;
}


// ============================================================
// THE SCENE (2026-07-06) — layout Concept 1 "Over the Shoulder", clean-band variant:
// art on top, the card row in a clean band below. See 00_Overview/Animation_Direction.md.
// Every figure here is a PLACEHOLDER SILHOUETTE occupying the slot that pre-rendered
// 3D animation frames will replace: #mage-slot and #foe-slot. Swap the innerHTML for an
// <img>/<canvas> playing a sprite sequence and the layout does not change.
// ============================================================
// ⚠️ VIEWBOX GOTCHA (2026-07-29): each of these viewBoxes used to be far larger than the art
// drawn inside it, and `preserveAspectRatio="... meet"` scales to fit the WHOLE viewBox - empty
// margins included. So the containers could be sized correctly in CSS and the art would still
// render small. Keep every viewBox cropped to the drawing's actual bounding box.
const ART = {
  // 🔄 THE TURN (2026-07-29, layout concept 5). The mage was back-to-camera; now she is turned
  // THREE-QUARTERS into the room. Same staging - large in the near foreground, foe higher and
  // further - because that depth is what makes the scene feel dynamic and flat side-on duel
  // layouts throw it away. What changed is that you can see a PERSON.
  // 🔑 Why it matters more than it looks: the roster is planned at up to eight classes, and the
  // player character is the biggest identity carrier in the game. From behind, eight classes are
  // eight coats. In three-quarter view they are eight silhouettes. The hat still reads, so the
  // brand mark from the old framing survives.
  // The two ember strokes are the candle catching her leading edge - they are what says "there is
  // a face on this side" while everything is still a placeholder silhouette.
  // ⚠️ The raised arm must stay in the UPPER half of the figure. Drawn reaching ACROSS (as in the
  // mockup) it lands behind the slot row and is completely occluded - the scene is full-bleed
  // BEHIND the UI, so anything below ~40% of the mage's height is hidden by cards. Reaching UP and
  // right is also better composition: the foe sits higher in frame, so the gesture points at it.
  // 🎨 PROPORTIONS MATCHED TO THOMAS'S MAYA MOCK (2026-07-29). The first placeholder had a modest
  // brim ~1.3x shoulder width; his design is nearer 2.4x, with a tall rounded crown and the face
  // visible beneath it. That matters because the layout is verified against this silhouette - a
  // placeholder with the wrong proportions means measuring a composition nobody is building.
  // Cropped at the waist, as in the mock: good framing AND half a body you never have to animate.
  mage: `<svg viewBox="30 14 500 420" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <path d="M186 208 C174 140 196 74 248 44 C298 20 332 48 332 98 C332 142 320 180 308 210 Z"/>
    <ellipse cx="248" cy="214" rx="212" ry="44" transform="rotate(-7 248 214)"/>
    <path d="M212 220 C212 264 238 292 266 292 C294 292 318 264 318 222 Z"/>
    <path d="M194 430 C202 364 226 320 266 304 C308 320 332 364 340 430 Z"/>
    <path d="M320 342 C378 318 440 270 488 206 L520 232 C474 302 400 358 336 384 Z"/>
    <path d="M300 60 C266 96 246 152 244 208" fill="none" stroke="#e8913c" stroke-width="8" stroke-linecap="round" opacity=".45"/>
    <path d="M290 306 C320 326 336 372 342 424" fill="none" stroke="#e8913c" stroke-width="8" stroke-linecap="round" opacity=".45"/>
    <circle cx="506" cy="220" r="18" fill="#e8913c" opacity=".8"/>
  </svg>`,
  dragon: `<svg viewBox="84 94 636 390" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <defs><radialGradient id="dEye"><stop offset="0%" stop-color="#fff3d0"/>
      <stop offset="45%" stop-color="#ffb547"/><stop offset="100%" stop-color="#e8913c" stop-opacity="0"/></radialGradient></defs>
    <path d="M400 300 L140 120 L200 210 L90 180 L190 280 L120 300 L400 340 Z"/>
    <path d="M400 300 L660 120 L600 210 L710 180 L610 280 L680 300 L400 340 Z"/>
    <path d="M330 480 L360 330 Q400 300 440 330 L470 480 Z"/>
    <path d="M362 180 Q320 120 274 100 Q312 140 336 196 Z"/>
    <path d="M438 180 Q480 120 526 100 Q488 140 464 196 Z"/>
    <path d="M400 150 C360 150 336 180 333 220 C330 262 352 300 400 326 C448 300 470 262 467 220 C464 180 440 150 400 150 Z"/>
    <ellipse cx="372" cy="222" rx="12" ry="8" fill="url(#dEye)"/>
    <ellipse cx="428" cy="222" rx="12" ry="8" fill="url(#dEye)"/>
  </svg>`,
  // a generic beast for ordinary fights (per-creature art comes much later)
  beast: `<svg viewBox="146 86 310 338" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <defs><radialGradient id="bEye"><stop offset="0%" stop-color="#fff3d0"/>
      <stop offset="50%" stop-color="#ffb547"/><stop offset="100%" stop-color="#e8913c" stop-opacity="0"/></radialGradient></defs>
    <path d="M150 420 C160 330 200 280 300 272 C400 280 440 330 450 420 Z"/>
    <path d="M300 272 C250 268 224 232 228 196 C232 162 264 140 300 140 C336 140 368 162 372 196 C376 232 350 268 300 272 Z"/>
    <path d="M240 156 Q214 108 190 92 Q214 126 228 172 Z"/>
    <path d="M360 156 Q386 108 410 92 Q386 126 372 172 Z"/>
    <ellipse cx="278" cy="198" rx="10" ry="7" fill="url(#bEye)"/>
    <ellipse cx="322" cy="198" rx="10" ry="7" fill="url(#bEye)"/>
  </svg>`,
};

// ============================================================
// 🌄 EVERY JOURNEY IS A PLACE (2026-07-29). Journeys all rendered identically, so arriving
// somewhere new looked like not having moved. Each palette is AUTHORED (not randomised) and
// chosen by hashing the encounter's NAME — so a place always looks like itself, and two
// different journeys never look the same. Warm-but-somber throughout: Witch Hat register.
//
// 🔑 And the darkness is not decoration — it IS the Nightfall you are racing. A journey with a
// deep dark literally looks darker before you have read a single number. Legible math, drawn.
// ============================================================
const SCENES = [
  { key: 'moor',   sky: '#0b0d16', mid: '#141826', ground: '#241f1a', glow: '150,140,220', gx: 66, gy: 38 },
  { key: 'pines',  sky: '#070d0b', mid: '#0f1a16', ground: '#1c2018', glow: '120,190,160', gx: 56, gy: 44 },
  { key: 'ash',    sky: '#0f0b09', mid: '#1a120d', ground: '#2a1c12', glow: '232,145,60',  gx: 74, gy: 40 },
  { key: 'ford',   sky: '#080e13', mid: '#0f1a22', ground: '#1a2128', glow: '127,176,196', gx: 60, gy: 48 },
  { key: 'pass',   sky: '#0c1016', mid: '#161c24', ground: '#232a30', glow: '200,220,240', gx: 72, gy: 30 },
  { key: 'canyon', sky: '#130b08', mid: '#20120c', ground: '#31190f', glow: '208,96,58',   gx: 62, gy: 42 },
];
// fights get a per-REGION tint for the same reason — four regions should not be one room
const REGION_TINT = ['232,145,60', '150,190,140', '127,176,196', '190,130,200'];
function hashStr(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return Math.abs(h); }
// ⚠️ A HASH IS ARBITRARY, AND ARBITRARY READS AS WRONG. Hashing alone put "Mirefen Road" on a
// cold mountain pass and "Sunwarm Trail" on a river. Match the fiction first; hash only decides
// the names no keyword claims, so every journey still gets a place and most get the RIGHT one.
// (Same lesson the elemental cycle taught: derived-but-arbitrary is worse than plainly authored.)
// ⚠️ ORDER MATTERS — first match wins, so the STRONGER signal goes higher. And keep the keywords
// long: bare 'ash' matched "Stormw-ash" and bare 'sun' matched "Sun-ken Causeway", both of which
// are water. Substring matching on three-letter words is a trap.
const SCENE_WORDS = {
  moor:   ['fen', 'mire', 'meadow', 'moor', 'marsh', 'bog', 'vale', 'shroud', 'wither'],
  ash:    ['ashen', 'ember', 'cinder', 'kiln', 'forge', 'scorch', 'char', 'sunwarm', 'flare'],
  canyon: ['quarry', 'hollow', 'canyon', 'stone', 'rock', 'gorge', 'cairn', 'granite', 'scree', 'slate', 'grit', ' cut'],
  pines:  ['fern', 'wood', 'forest', 'pine', 'thicket', 'grove', 'green', 'moss', 'briar', 'track'],
  ford:   ['ford', 'river', 'cross', 'tide', 'lake', 'brook', 'stream', 'well', 'rain', 'wash', 'causeway', 'sunken', 'basin', 'drown'],
  pass:   ['pass', 'highland', 'ridge', 'peak', 'crest', 'mount', 'cliff', 'tempest', 'storm', 'wind', 'echo'],
};
function sceneFor(name) {
  const low = (name || '').toLowerCase();
  for (const key in SCENE_WORDS) {
    if (SCENE_WORDS[key].some(w => low.includes(w))) return SCENES.find(p => p.key === key);
  }
  return SCENES[hashStr(low || 'road') % SCENES.length];
}
function sceneVars(e, isFight) {
  if (isFight) {
    const tint = REGION_TINT[(S.region - 1) % REGION_TINT.length];
    return `--glow:${tint}; --gx:74%; --gy:44%; --night:0;`;
  }
  const p = sceneFor(e && e.name);
  const night = Math.min(.42, ((e && e.nightfall) || 0) / 26);
  return `--sky:${p.sky}; --mid:${p.mid}; --ground:${p.ground}; --glow:${p.glow};` +
         ` --gx:${p.gx}%; --gy:${p.gy}%; --night:${night.toFixed(3)};`;
}

// 🖼️ ART BY NAME (2026-08-10) — a foe wears its own picture the moment the file exists.
//
// 🔑 THE WHOLE POINT IS THAT NOTHING BREAKS WHILE THE FOLDER IS EMPTY. There are 69 creatures
// and they arrive one at a time over days; a build that needs all of them, or that shows a broken
// image icon for the 68 that have not been drawn yet, would make the art a blocking dependency.
// So: the silhouette renders as it always did, an <img> is laid over it, and the picture only
// takes over `onload`. A miss removes itself and you never see that it tried.
//
// 🗝️ REAL ALPHA (2026-08-10). The plates are drawn on flat #000000 and `art/keyalpha.ps1`
// keys that to true transparency, so a creature is a genuine cutout rather than a dark rectangle
// feathered into a dark scene. ⚠️ IT FLOOD-FILLS FROM THE BORDER, IT DOES NOT THRESHOLD BRIGHTNESS
// — these creatures are deliberately dark, so "anything black becomes transparent" would dissolve
// the armour and leave floating ember veins. Only black CONNECTED to the edge is background.
//
// ⚠️ These are PLACEHOLDERS, and the standing rule still holds — we are not building
// presentation. What makes this the exception is that a PNG is an ASSET, not a system: it ports to
// Godot unchanged, the same way the numbers in Balance_Log transfer. `#foe-slot` was always
// specified as the animation slot; this is that slot doing its job a little early.
const artSlug = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// 🎭 THE MAGE. Same mechanism as a foe, its own folder, because she is not content - she is
// the CLASS, and a rogue will drop `art/hero/rogue.png` beside her without touching this code.
// ⚠️ Her art obeys the layout rule from July: hat, face and casting arm must live in the UPPER
// HALF of the plate, because the scene is full-bleed BEHIND the UI and the card row occludes
// everything below roughly 40% of her height.
// 🚶 SHE HAS TWO POSES, AND THE SCENE PICKS ONE. A fighting stance is wrong on an empty road:
// a journey is travel, not a duel, and the mage throwing a fireball at a hillside says the scene
// does not know what is happening in it. `cast` for anything with a foe, `walk` for the road.
// ⚠️ Poses are per CLASS, so a rogue needs rogue-cast.png and rogue-walk.png and no code.
function heroPose() {
  if (S.finalMode) return 'cast';
  return (S.encounter && S.encounter.type === 'journey') ? 'walk' : 'cast';
}
function heroArt() {
  return `<img class="mage-img" alt="" src="art/hero/${CLASS.id}-${heroPose()}.png?v=${BUILD}" ` +
    `onload="this.parentNode.classList.add('has-art'); stageFloor();" onerror="this.remove()">`;
}
// 🗺️ A PLACE, NOT A THING (2026-08-10). A creature is an object IN the scene; a journey IS
// the scene. So a journey's art is a BACKDROP behind everything rather than a cutout in a slot -
// which also fixes the emptiest screen in the game, since a journey has no foe to look at and
// draws nothing but a road-glow today.
//
// ⚠️ NO KEYING, and it must stay DARK. The UI floats directly on the scene, so a bright or busy
// backdrop costs legibility on every phase - the art is generated dusk-lit, dimmed further in CSS,
// and the existing vignette sits on top of it.
function placeArt(name) {
  if (!name) return '';
  return `<img class="place-img" alt="" src="art/places/${artSlug(name)}.jpg?v=${BUILD}" ` +
    // ⚠️ the scrim must die WITH the image. Left behind on its own it would darken the plain
    // gradient scene of every place that has no painting yet, i.e. almost all of them.
    `onerror="var s=this.nextElementSibling; if(s&&s.className==='place-scrim')s.remove(); this.remove();">` +
    `<div class="place-scrim"></div>`;
}
function foeArt(name) {
  if (!name) return '';
  // ⚠️ THE ART URL MUST CARRY THE BUILD. Everything else here is versioned - style.css,
  // game.js, and index.html revalidates - but an image filename never changes, so a browser that
  // cached cindermaw.png once will serve that copy forever. Re-keying the alpha and re-deploying
  // looked exactly like the key had failed, because the old picture kept arriving. Third time this
  // project has lost time to a cache: HTML, then the PWA, now assets.
  return `<img class="foe-img" alt="" src="art/foes/${artSlug(name)}.png?v=${BUILD}" ` +
    `onload="this.parentNode.classList.add('has-art')" onerror="this.remove()">`;
}

function renderScene() {
  const el = $('scene');
  if (!el) return;
  if (S.phase === 'summary' || S.phase === 'defeat' || S.phase === 'victory') {
    el.innerHTML = ''; el.hidden = true; el.dataset.sceneKey = ''; return;
  }
  el.hidden = false;
  const e = S.encounter;
  const duel = S.finalMode && S.finalPhase === 'duel';
  const isFight = duel || (e && e.type === 'fight');
  let foe;
  // 🐉 THE DRAGON IS ON SCREEN FOR THE WHOLE FINALE, not just the duel beats (2026-08-10).
  // The Last Mile is a JOURNEY, so it used to draw the empty road - while the enemy panel showed
  // "Cindermaw 52/52" and the log said the lair was in sight. Three parts of the UI describing the
  // same moment, one of them saying nothing is there.
  // 🔑 The scene must agree with the panel. You are at the lair mouth; the thing is right there.
  if (S.finalMode) foe = `<div class="foe foe-dragon" id="foe-slot" data-anim="dragon">${ART.dragon}${foeArt(S.dragon.name)}</div>`;
  else if (isFight) foe = `<div class="foe foe-beast" id="foe-slot" data-anim="creature">${ART.beast}${foeArt(e.name)}</div>`;
  else foe = `<div class="foe foe-road" id="foe-slot" data-anim="none"></div>`; // journeys: the road ahead
  // 🔁 REBUILD ONLY WHEN THE SCENE ACTUALLY CHANGED (2026-08-12).
  //
  // 🐛 THE BUG, reported in play: "in the tutorial, everytime i click next, it flashes the images".
  // `render()` runs on EVERY interaction — dismissing a lesson, swapping two cards, arming the
  // bank — and this function rebuilt `innerHTML` each time. That destroys the <img> elements and
  // creates new ones, so `.has-art` is gone until `onload` fires again and the opacity fade
  // replays from zero. The art was re-decoding several times a turn and strobing every time.
  //
  // 🔑 A FADE-IN THAT IS KEYED TO ELEMENT CREATION BECOMES A FLICKER THE MOMENT ANYTHING
  // RE-RENDERS. Either the element must survive the render, or the transition must not exist.
  // Keeping the element is the right half: the picture is the same picture.
  //
  // The key covers everything that can change what is DRAWN — never anything that merely changes
  // as you play a turn, or we are back to rebuilding constantly.
  // ✅ Bonus fix: `fx()` puts transient classes on #scene (e.g. fx-dark on Nightfall) and the
  // `el.className =` below used to wipe them on any render inside the animation's window.
  const cls = isFight ? 'is-fight' : 'is-journey';
  const style = sceneVars(e, isFight);
  const key = [cls, style, S.finalMode ? 1 : 0, S.finalPhase || '',
               S.dragon && S.dragon.name, e && e.name, e && e.type, heroPose()].join('|');
  if (el.dataset.sceneKey === key) { stageFloor(); return; }   // layout can still shift under it
  el.dataset.sceneKey = key;
  el.className = cls;
  el.setAttribute('style', style);
  el.innerHTML =
    // 🗺️ WHAT PLACE ARE WE IN?
    //   JOURNEY  its own painting - a journey IS a place, and travelling is what you are doing
    //   FINALE   the dragon's lair - the one fight that has earned a stage
    //   FIGHT    nothing. The dark.
    //
    // ⚠️ CREATURE FIGHTS GET NO BACKDROP, and that is a considered reversal (2026-08-11). Region
    // paintings were built and tried, and they read WORSE: a creature is a cutout dropped onto a
    // photographic-depth painting, so the composite fights itself - two different spaces claiming
    // to be one. Against the plain dark the creature is simply the thing you are facing.
    // 🔑 A place is for TRAVELLING THROUGH or ARRIVING AT. A fight is not somewhere, it is
    // something. The dragons keep their lairs because arriving at one is the whole point of a run.
    // ⚠️ The four region paintings are KEPT on disk, unused, rather than deleted - this is a
    // feel judgement and feel judgements get revisited.
    placeArt(S.finalMode ? S.dragon.name + ' lair'
      : (e && e.type === 'journey') ? e.name
      : null) +
    `<div class="scene-glow"></div><div class="scene-floor"></div><div class="scene-night"></div>` +
    foe +
    `<div class="mage" id="mage-slot" data-anim="mage">${ART.mage}${heroArt()}</div>` +
    `<div class="scene-name">${S.finalMode ? S.dragon.name : e ? e.name : ''}</div>` +
    `<div class="scene-vig"></div>`;
  stageFloor();
}

// 📏 WHERE THE VISIBLE STAGE ACTUALLY ENDS (2026-08-10).
//
// The scene is full-bleed BEHIND the UI, so the bottom of `#scene` and the bottom of what you can
// SEE are different lines - separated by the height of the card row. That gap is a few hundred
// pixels and it changes with every viewport, so no percentage in the stylesheet can express it:
// bottom-anchoring the mage to the scene buried her face behind the cards on a tall window, and
// top-anchoring left her floating in mid-air with dead space underneath on a short one.
//
// 🔑 So measure it once per render and hand CSS the number. The mage then stands on the
// VISIBLE floor at every size, with her legs running down behind the cards where they belong.
// ⚠️ Layout only - nothing here feeds the rules, and it is the first thing Godot replaces.
// 🎭 WHERE THE CARD ROW CUTS HER. Thomas: *"cut her at the waist"* - she should loom in the
// near foreground with the cards crossing her mid-body, not stand whole on a shelf.
// ⚠️ This CANNOT be a CSS percentage. `bottom: N%` resolves against the container's HEIGHT, but
// how far she must drop depends on how TALL SHE IS DRAWN - and a 2:3 plate in her box fits by
// WIDTH, so her drawn height tracks the scene's width. The two are unrelated. Measure instead.
const MAGE_CUT = 0.55;   // fraction of the plate left ABOVE the cards (0.55 ~ her waist)
function stageFloor() {
  const sc = $('scene'), cards = $('slots-panel');
  if (!sc || !cards) return;
  const s = sc.getBoundingClientRect(), c = cards.getBoundingClientRect();
  const hidden = Math.max(0, Math.round(s.bottom - c.top));
  sc.style.setProperty('--stage-floor', hidden + 'px');

  const box = $('mage-slot'), img = box && box.querySelector('.mage-img');
  if (!img || !img.naturalWidth) return;
  const b = box.getBoundingClientRect();
  // replicate object-fit: contain to find how tall she is actually painted
  const scale = Math.min(b.width / img.naturalWidth, b.height / img.naturalHeight);
  const drawn = img.naturalHeight * scale;
  sc.style.setProperty('--mage-drop', Math.round((1 - MAGE_CUT) * drawn) + 'px');
}
try { addEventListener('resize', () => { if (typeof S !== 'undefined' && S && !isShell()) stageFloor(); }); } catch (e) {}

// 🏠 THE SHELL — screens that exist OUTSIDE a run and must not assume one.
// ⚠️ The stages screen only ever worked because boot used to call freshGame() first, so `S`
// always held a run even on a menu. Booting to a real menu broke that assumption immediately
// (`renderStatus` reads `S.deck[0]`). Anything reachable before a run starts belongs in here.
// 🧰 WHAT YOU CARRIED OUT. ⚠️ Shown on a DEFEAT as loudly as on a victory — a loss that pays
// is only worth anything if you can SEE that it paid, in the same breath as being told you died.
// ⭐ ONE BAR, DRAWN IN ONE PLACE. The summary and the Collection show the same thing, so they ask
// the same function — the `computeAction()` rule applied to a display: two copies drift.
// ⚠️ ONE COMPONENT, TWO LADDERS — `cls` picks which. Writing a second bar function is how the two
// would drift, and this screen's whole job is that the two bars read as the same KIND of thing.
// `from` (optional) is where the bar STARTS. Given one, the bar renders at the old position and
// carries the target in data-* for animateXPBars() to walk. Without one it just draws the truth.
function xpBarHTML(cls, note, from) {
  const xp = cls ? loadClassXP(cls) : ACCOUNT_XP;
  const per = cls ? CLASS_XP_PER_LEVEL : XP_PER_LEVEL;
  const cap = cls ? classCap(cls) : LEVEL_CAP;
  const lv = cls ? classLevelFor(cls, xp) : levelFor(xp);
  const into = xp % per, pct = Math.round(100 * into / per);
  const capped = lv >= cap;
  const up = capped ? [] : unlocksAt(lv + 1, cls);
  const next = capped ? '' : (up.length ? `next: <b>${up.map(unlockName).join(', ')}</b>` : `next at level ${lv + 1}`);
  // ⚠️ BOTH BARS SAY "LEVEL" AGAIN — REVERTED 2026-08-23 (Thomas: *"lets just change mastery back
  // to level. might be too confusing being a different word"*), reversing his own suggestion of a
  // few hours earlier and mine of implementing it.
  // 🔑 AND THE REVERT IS CHEAP NOW FOR A REASON WORTH KEEPING: the rename was doing disambiguation
  // work that **the two-screen split now does better**. When both bars sat on one page, only the
  // noun told you they were different things. Now ⭐ Level lives on the account page and 🎭 Mage
  // Level lives on hers, so the SCREEN says which one you are looking at and the word is free to
  // be the plain, expected one.
  // 🔑 **A word invented to carry structure can be retired once the structure carries itself.**
  // ⚠️ The bars are still two different things and the hint text still says so in one line each —
  // that is the part that must never be dropped, whatever the noun is.
  const name = cls ? `${(CLASSES[cls] && CLASSES[cls].name) || cls} Level` : 'Level';
  const end = capped ? 100 : pct;
  // 🎞️ THE ONE PIECE OF PRESENTATION THIS PROTOTYPE BUILDS ON PURPOSE, and the exception is
  // narrow enough to state: **here the movement IS the information.** A number (+47 xp) tells you
  // the amount; a bar travelling from where you started to where you ended tells you *how much of
  // a level that was*, which is the only question anyone asks at the end of a run. That is
  // *legible math always* in the one place a still frame cannot say it.
  // ⚠️ It is not a licence for juice generally — the portrait fade was correctly deleted twice.
  // The test that separates them: **does it carry a fact you could not read otherwise?**
  const anim = (from === undefined || from === xp) ? '' : (() => {
    const fLv = cls ? classLevelFor(cls, from) : levelFor(from);
    const fPct = (fLv >= cap) ? 100 : Math.round(100 * (from % per) / per);
    return ` data-from="${fPct}" data-to="${end}" data-rolls="${Math.max(0, lv - fLv)}" data-lv="${fLv}"`;
  })();
  const startLv = anim ? (cls ? classLevelFor(cls, from) : levelFor(from)) : lv;
  const startPct = anim ? Number(anim.match(/data-from="(\d+)"/)[1]) : end;
  return `<div class="xp${cls ? ' is-cls' : ''}"><div class="xp-top">` +
    `<b><span class="xp-lv">${cls ? '🎭' : '⭐'} ${name} ${startLv}</span></b>` +
    `<span class="xp-num">${capped ? 'every charm unlocked' : `${into} / ${per} xp`}</span></div>` +
    `<div class="xp-bar"${anim}><i style="width:${startPct}%"></i></div>` +
    (note || next ? `<div class="xp-next">${note || next}</div>` : '') + `</div>`;
}

// 🎞️ WALK EVERY BAR THAT DECLARED A JOURNEY. A level-up is `data-rolls` fills to 100 followed by a
// snap back to 0 — **the roll-over is the whole point**, because a bar that merely jumps to 30%
// while the number quietly changes never shows you that you crossed anything.
// ⚠️ prefers-reduced-motion jumps straight to the end. The file already honours it elsewhere.
// ⚠️ Called from render()'s `finally`, so it runs even if a panel threw — same reasoning as
// applyModal(): a half-drawn screen must not also be a half-animated one.
function animateXPBars() {
  const bars = document.querySelectorAll('.xp-bar[data-to]');
  if (!bars.length) return;
  let still = false;
  try { still = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  bars.forEach(bar => {
    const fill = bar.querySelector('i'), to = +bar.dataset.to;
    const rolls = +bar.dataset.rolls || 0;
    const label = bar.parentNode.querySelector('.xp-lv');
    let lv = +bar.dataset.lv;
    bar.removeAttribute('data-to');                 // fire once, never on a re-render
    if (still) { fill.style.width = to + '%'; if (label) label.textContent = label.textContent.replace(/\d+$/, lv + rolls); return; }
    const bump = () => { if (label) label.textContent = label.textContent.replace(/\d+$/, ++lv); };
    const steps = [];
    for (let i = 0; i < rolls; i++) steps.push(100);
    steps.push(to);
    let i = 0;
    // 🐛 setTimeout, NOT requestAnimationFrame — and this is a correctness fix, not a style one.
    // **rAF DOES NOT FIRE IN A HIDDEN TAB.** Scheduled on rAF, a run finished on a backgrounded tab
    // would leave the bar frozen at where it STARTED and the label showing the OLD level — the
    // screen would be quietly lying about your progress until the next render.
    // 🔑 AN ANIMATION MAY NEVER BE THE ONLY THING THAT WRITES THE TRUTH. setTimeout is throttled in
    // a background tab but it still runs, so the last step always lands.
    const next = () => {
      if (i >= steps.length) return;
      const v = steps[i++];
      fill.style.width = v + '%';
      setTimeout(() => {
        if (v === 100 && i < steps.length) {
          bump();
          fill.style.transition = 'none'; fill.style.width = '0%';
          // one tick with the transition off, so the snap back to empty is not itself animated
          setTimeout(() => { fill.style.transition = ''; setTimeout(next, 30); }, 30);
        } else next();
      }, 620);
    };
    setTimeout(next, 40);   // one beat at the start position, so there is something to travel from
  });
}
// 🔑 THE LEVEL-UP IS THE MOMENT, so it is NAMED. A run that ends "+47 xp" is a number; one that
// ends "Cold Iron unlocked" is a reason to start another. ⚠️ Reads the span the run crossed, not
// just the final level — a very good run can cross two.
// 🔑 THE CLASS BAR IS SHOWN FIRST, because it is the one tied to what you just played — the run
// was a mage run, so the mage's ladder is the closer story.
// ⚠️ IT IS ITS OWN BLOCK ON THE END SCREEN NOW, not a footnote inside 🧰 CARRIED OUT. The xp is
// the run's other reward and it was rendering below a list of bone shards.
function xpGainedHTML(animate) {
  const gained = S.xpRun || 0;
  if (!gained) return '';
  const opened = (before, cls) => {
    const per = cls ? CLASS_XP_PER_LEVEL : XP_PER_LEVEL, out = [];
    const at = x => cls ? classLevelFor(cls, x) : levelFor(x);
    for (let lv = at(before) + 1; lv <= at(before + gained); lv++)
      for (const u of unlocksAt(lv, cls)) out.push(`<span class="xp-got">🔓 ${unlockName(u)}</span>`);
    return out;
  };
  const cls = CLASS.id;
  const c = opened(S.clsXpBefore || 0, cls), a = opened(S.xpBefore || 0, null);
  const cFrom = animate ? (S.clsXpBefore || 0) : undefined;
  const aFrom = animate ? (S.xpBefore || 0) : undefined;
  return xpBarHTML(cls, `<b>+${gained} xp</b>${c.length ? ' · ' + c.join(' ') : ''}`, cFrom) +
         xpBarHTML(null, `<b>+${gained} xp</b>${a.length ? ' · ' + a.join(' ') : ''}`, aFrom);
}
// 🏁 THE END OF A RUN — ONE SCREEN, TWO ENDINGS (2026-08-23, Thomas: *"lets make sure we got a cool
// like summary screen. have a nice window at the end, our grade and all those stats"*).
//
// 🔑 VICTORY AND DEFEAT WERE TWO SEPARATE BLOCKS OF MARKUP THAT HAPPENED TO AGREE. They are one
// function now, because the only real difference between them is the headline and one paragraph —
// and two copies of a screen drift exactly the way two copies of the arrangement search did. The
// win got a card table the loss never had, and the loss got a reason-you-died line the win never
// needed; both are `won ? … : …` here instead of two files' worth of divergence.
//
// 🔑 AND THE ORDER IS THE ARGUMENT: **verdict → what it cost you → what you take away.**
//   ① the grade      — the judgement, and the biggest thing on screen
//   ② the run        — turns, outcomes, what your deck lost
//   ③ ⭐ the xp       — the bars, moving
//   ④ 🧰 the haul     — materials, which are the OTHER thing you carry out
//   ⑤ ⚒️ the door     — the Workshop, because *the instant you see the haul is the instant you
//                       want to spend it* (Hades and Monster Hunter both put the meta screen
//                       directly in the death flow, for this reason).
// ⚠️ The xp block sits ABOVE the haul deliberately: materials are a shopping list, the bars are
// the reward. The old screen had the bars underneath a list of bone shards.
function runEndHTML(won) {
  const survivors = [...S.hand, ...S.deck, ...S.discard];
  const r = S.results;
  const lost = S.trashed.length;
  return `<div class="phase-label">${won ? `🏆 THE ${S.dragon.name.toUpperCase()} FALLS` : '💀 DEFEAT'}</div>` +
    `<div class="runend">` +
      gradeHTML(gradeRun(won), won) +
      (won ? '' : `<p class="runend-why">${S.defeatMsg}</p>`) +
      `<div class="runend-stats">` +
        `<span><b>${S.turn}</b> turns</span>` +
        `<span class="g-good"><b>${r.Complete}</b> clean</span>` +
        `<span><b>${r.Narrow}</b> narrow</span>` +
        `<span class="g-bad"><b>${r.Loss}</b> lost</span>` +
        `<span><b>${survivors.length}</b> cards left</span>` +
        `<span class="${lost ? 'g-bad' : ''}"><b>${lost}</b> destroyed</span>` +
      `</div>` +
      (lost ? `<p class="runend-lost">Gone for good: ${S.trashed.map(c => c.def.name).join(' · ')}</p>` : '') +
      // 🗺️ the door this run opened — above the xp and the loot, because it is the biggest of the
      // three and the only one that changes what you can do NEXT.
      (won && S.stageOpened ? (S.stageOpened === 'all'
        ? `<div class="runend-open"><b>🪜 Every stage stands open</b><span>take whichever you like</span></div>`
        : `<div class="runend-open"><b>🗺️ Stage ${S.stageOpened.stage} — the ${S.stageOpened.name} — is open to you</b>` +
          `<span>${S.stageOpened.brief}</span></div>`) : '') +
      runXPHTML() +
      haulHTML() +
    `</div>` +
    // 📖 THE HANDOFF (2026-08-05). Finishing the tutorial is the moment a new player either becomes
    // a player or closes the tab, and it used to end on the same generic stage picker a returning
    // player gets. A picker is a question; what someone just taught needs is the NEXT THING, named.
    // ⚠️ Not in the tutorial — that ending has one job and a second button is a question where a
    // direction belongs.
    ((won && S.tutorial) ? tutorialHandoffHTML()
      : `<button class="primary" onclick="showWorkshop()">⚒️ The Workshop</button>` +
        `<button onclick="showStages()">🗺️ ${won ? 'Choose your next stage' : 'Choose a stage'}</button>`);
}

// 🏁 the end-of-run xp block: a heading and the two bars, so it reads as a reward and not as an
// appendix to the loot list.
function runXPHTML() {
  const inner = xpGainedHTML(true);
  return inner ? `<div class="endxp"><div class="endxp-lab">⭐ WHAT THE ROAD TAUGHT YOU</div>${inner}</div>` : '';
}

function haulHTML() {
  const ids = Object.keys(S.loot || {});
  // ⚠️ The xp block is separate now (runXPHTML), so this may bail again when nothing was carved —
  // a bad run still gets told it paid, just in its own block rather than inside the loot list.
  if (!ids.length) return '';
  const rows = ids.map(id => {
    const m = matDef(id); if (!m) return '';
    return `<span class="haul-mat">${m.icon} ${m.name} <b>×${S.loot[id]}</b></span>`;
  }).join('');
  return `<div class="haul"><div class="haul-lab">🧰 CARRIED OUT</div>` +
    `<div class="haul-gold">${S.encountersDone} encounter${S.encountersDone === 1 ? '' : 's'} walked` +
      `${S.phase === 'victory' ? ' · and the beast felled' : ''}</div>` +
    (rows ? `<div class="haul-mats">${rows}</div>` : `<div class="haul-none">nothing carved</div>`) +
    `<div class="haul-note">it is in your 📦 Stash</div></div>`;
}

const SHELL_PHASES = ['menu', 'collection', 'ladder', 'dev', 'stash', 'workshop'];
const isShell = () => SHELL_PHASES.includes(S && S.phase);

// 🚪 WHICH PHASES TAKE THE MIDDLE OF THE SCREEN. A phase belongs here when it is a DECISION
// you stop and make, rather than something you do to the cards in front of you.
// ⚠️ 'assign' and 'soak' stay inline on purpose - they ARE the cards, and a dialog over them
// would be a dialog about the thing it was covering.
// ⚠️ phases that cannot exist without a map behind them
const MAP_PHASES_NEEDING_MAP = ['map', 'hearth', 'hearthpick', 'mendpick', 'eliteboon'];
// 🚪 'reveal' JOINED THE LIST 2026-08-23 (Thomas: *"the resolving happens in another window, and
// then the wheel comes up in another window. lets combine them"*). Resolving used to draw inline
// while the Wheel popped up over it, so finishing an encounter threw you between two different
// windows for one continuous moment. They are one panel now: strike → outcome → 🧰 carve → the
// Wheel, all in the same frame.
// ⚠️ It is safe here for the reason the panel is top-anchored in the first place: the reveal
// animates the SLOT ROW (`beatFx`), and the modal never covers the hand.
// 🐛 'victory' AND 'defeat' WERE MISSING (Thomas, 2026-08-25: *"the summary is still in the
// corner, i wanted to take up the middle, kinda like how the map does it"*). `runEndHTML()` is a
// full-page document - the grade, the run in numbers, both xp bars, the haul, the Workshop - and it
// was rendering into `#controls-panel` at its normal size in the bottom-right corner, on a scene
// with nothing left in it. 🔑 THE BIGGEST SCREEN IN THE GAME WAS IN THE SMALLEST BOX.
// ⚠️ 'summary' was on this list and the end screen is NOT the summary - a phase whose NAME sounds
// like another phase is how a list like this gets a hole in it.
const MODAL_PHASES = ['reveal', 'wheel', 'event', 'setout', 'fork', 'summary', 'map', 'hearth', 'hearthpick', 'mendpick', 'eliteboon', 'victory', 'defeat'];
// 🔑 THE ONE PLACE THE HAND DOES NOT NEED PROTECTING. Every other modal is top-anchored so it
// can never cover the cards, because pickers live ON them - but the run is OVER here and there is
// nothing to read underneath. These get the whole layer.
const END_PHASES = ['victory', 'defeat'];
function isModalPhase() { return !isShell() && MODAL_PHASES.includes(S.phase); }

// 🔑 THE CHEAPEST POSSIBLE IMPLEMENTATION, AND DELIBERATELY SO: renderControls() is not
// touched at all. It writes the phase body where it always did, and this RELOCATES that markup
// into the centred panel. Every handler in this codebase is an inline `onclick` string, so moving
// innerHTML carries the behaviour with it - nothing has to be re-bound.
// ⚠️ Which means a new modal phase needs NO render code: add it to MODAL_PHASES and it moves.
function applyModal() {
  const panel = $('modal-panel'), ctrl = $('controls-panel');
  if (!panel || !ctrl) return;
  if (!isModalPhase()) {
    // ⚠️ ALWAYS CLEAR, not only when the class was still set. Guarding the clear behind the
    // class meant a second render left the old dialog's markup sitting in a hidden layer - invisible
    // to a player, but it makes every DOM assertion read the PREVIOUS screen.
    document.body.classList.remove('modal-open');
    if (panel.innerHTML) panel.innerHTML = '';
    return;
  }
  document.body.classList.add('modal-open');
  panel.innerHTML = ctrl.innerHTML;
  ctrl.innerHTML = '';
  sizeModal(panel);
  drawMapEdges();
}

// 🗺️ Draw one line per edge, measured from the nodes as they actually landed.
// ⚠️ Must run AFTER applyModal has moved the markup into the panel and AFTER sizeModal has set
// the height - measuring before either gives positions from a box that is about to change.
function drawMapEdges() {
  const svg = document.querySelector('#modal-panel .mp-lines');
  if (!svg || !S.map) return;
  const wrap = svg.parentElement;
  const box = wrap.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${Math.round(box.width)} ${Math.round(box.height)}`);
  svg.setAttribute('width', Math.round(box.width));
  svg.setAttribute('height', Math.round(box.height));
  const centre = (f, c) => {
    const el = wrap.querySelector(`[data-f="${f}"][data-c="${c}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
  };
  const here = S.map.pos;
  const parts = [];
  for (let f = 0; f < mapFloors(S.map) - 1; f++) {
    for (let c = 0; c < S.map.floors[f].length; c++) {
      const n = S.map.floors[f][c]; if (!n) continue;
      const a = centre(f, c); if (!a) continue;
      for (const nc of n.next) {
        const b = centre(f + 1, nc); if (!b) continue;
        // 🔑 the roads you could take RIGHT NOW are lit; everything else is the shape of the map
        const live = here && here.f === f && here.c === c;
        parts.push(`<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" ` +
          `x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" class="${live ? 'mp-live' : 'mp-link'}"/>`);
      }
    }
  }
  svg.innerHTML = parts.join('');
}

// 📏 THE PANEL IS MEASURED, NOT GUESSED (2026-08-18, found in play).
// Thomas: *"clicking something on the setting out page isn't doing anything."*
// 🐛 It was the THIRD option. A fixed `max-height: 52vh` clipped it: the panel scrolled, nothing
// on screen said so, and a tap on the half-visible option passed straight through to the card row
// behind it - `elementFromPoint` on that button returned #slots-panel.
// 🔑 A PANEL THAT SILENTLY CLIPS A BUTTON IS A BUTTON THAT DOES NOTHING. And it only appeared
// with THREE offers; every test I ran had drawn two, which is why it shipped.
// The cap is now the real constraint - *the distance to the top of the hand* - so the panel always
// uses every pixel it may have, and says so when there is still more below.
function sizeModal(panel) {
  const layer = $('modal-layer'), slots = $('slots-panel');
  if (!layer || !slots) return;
  // ⚠️ measure from the PANEL's own top, not the layer's - the layer carries padding-top, so
  // using its top overshot by exactly that padding and the panel overlapped the hand by 2px.
  panel.style.maxHeight = '';
  const top = panel.getBoundingClientRect().top;
  // 🏁 an end screen measures to the bottom of the layer instead of the top of the hand.
  const handTop = END_PHASES.includes(S.phase)
    ? layer.getBoundingClientRect().bottom
    : slots.getBoundingClientRect().top;
  // ⚠️ the hand can sit ABOVE the layer's top on a stacked phone layout mid-scroll; never go
  // negative, and never shrink below something readable.
  const avail = Math.round(handTop - top - 14);
  panel.style.maxHeight = Math.max(200, avail) + 'px';
  // ⚠️ MEASURE WITH THE CUE OFF. The "▾ more below" cue is in flow, so it adds height - and a
  // panel measured WITH it showing can be scrollable *because* of it. That is a self-fulfilling
  // loop: the fork, with two branches and room to spare, was advertising more below itself.
  // 🔑 An indicator that changes the thing it indicates has to be removed before you measure.
  panel.classList.remove('is-scrollable');
  panel.classList.toggle('is-scrollable', panel.scrollHeight > panel.clientHeight + 2);
}

function render() {
  if (isShell()) {
    document.body.className = 'phase-' + S.phase + ' shell';
    $('turn-indicator').textContent = `build ${BUILD}`;
    $('status-bar').innerHTML = '';
    $('encounter-panel').innerHTML = ''; $('encounter-panel').className = '';
    $('slots-panel').innerHTML = '';
    renderField();          // 🎴 clears the board — a shell screen is outside any run
    renderArmourRail();
    const sc = $('scene'); if (sc) sc.innerHTML = '';
    renderControls();
    applyModal();    // 🚪 isShell() is false-y for modals, so this CLOSES one left open
    // ⚠️ the log belongs to a RUN. On the shell there may be no run at all, so show the last
    // one's entries if they exist and nothing if they don't — never assume the array is there.
    if (S.logEntries) renderLog(); else $('log').innerHTML = '';
    return;
  }
  normalizeAssign();
  saveGame();
  // ⚠️ NOTHING TO DRAW WITHOUT STATE. The Workshop and the Stash are SHELL screens whose
  // buttons (forge, sell, wear) re-render — and they are reachable before any run exists. Boot
  // happens to call freshGame() first, so `S` is non-null in practice, but a shell action that
  // crashes when it is the first thing you touch is a bug waiting for a different boot order.
  if (!S) return;
  document.body.className = 'phase-' + S.phase;   // lets CSS emphasise per phase (e.g. armor during soak)
  $('turn-indicator').textContent = (S.finalMode ? `🐉 THE FINAL BATTLE` : `Region ${S.region} · Turn ${S.turn}`) + ` · build ${BUILD}`;
  try {
  renderStatus();
  renderScene();
  renderEncounter();
  renderControls();
  renderField();
  renderArmourRail();
  renderSlots();
  renderLog();
  } finally {
    // 🔑 THE MODAL BOOKKEEPING RUNS EVEN IF A PANEL THREW. applyModal() used to be the LAST
    // call in render(), so any exception above it left the dialog open over a half-updated screen -
    // which is why a hard crash read as *"clicking does nothing"* instead of as a crash.
    // ⚠️ The error is NOT swallowed; it still propagates. This only guarantees the UI ends in a
    // consistent state on the way out.
    // 🎓 BEFORE applyModal(), which RELOCATES the panel's markup into the centred dialog —
    // inject afterwards and the row lands in an element that has just been emptied.
    injectLesson($('controls-panel'));
    applyModal();
    animateXPBars();
  }
  pointAtLesson();
}

// 🎓 SHOW, DON'T TELL. The lesson puts a ring around the thing it describes — the slot row, the
// card that would attune, the enemy panel. This is the interactive half: you read a sentence and
// the screen tells you where to look.
// ⚠️ MADE LOUDER 2026-08-12 (Thomas: *"can we make it more obvious somehow?"*). The ring was a
// 2px outline with a faint pulse, and it had two separate problems:
//   1. it was quiet against a busy dark UI, and
//   2. 🔑 ON A PHONE THE THING BEING POINTED AT IS OFTEN NOT ON SCREEN AT ALL. The layout stacks
//      — enemy panel, then cards, then controls — so a lesson in the controls can ring a stat chip
//      a thousand pixels above it. **No amount of brightness fixes a highlight you cannot see**,
//      which is why the scroll matters more than the styling did.
// The ring itself is now a heavy double ring + glow (see .lesson-point), and it re-plays its
// attention animation whenever the TARGET changes — `lessonPointed` is what stops it restarting
// on every unrelated render, which is the same flicker class as the scene rebuild.
let lessonPointed = null;
function pointAtLesson() {
  document.querySelectorAll('.lesson-point').forEach(el => el.classList.remove('lesson-point', 'lesson-point-in'));
  const L = nextLesson();
  if (!L || !L.point) { lessonPointed = null; return; }
  let sel = L.point; if (typeof sel === 'function') { try { sel = sel(); } catch (e) { sel = null; } }
  if (!sel) { lessonPointed = null; return; }
  const el = document.querySelector(sel);
  if (!el) { lessonPointed = null; return; }
  el.classList.add('lesson-point');
  const key = L.id + '|' + sel;
  if (lessonPointed === key) return;      // same target as last render — don't restart anything
  lessonPointed = key;
  el.classList.add('lesson-point-in');    // the one-shot "look here" pop
  // bring it into view, centred, but never fight a scroll the player is already making
  try { if (el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' }); }
  catch (e) { try { el.scrollIntoView(); } catch (e2) {} }
}

// 🔑 EVERYTHING CURRENTLY MODIFYING YOUR MATHS, NAMED AND SIGNED (2026-07-29). Curses were
// shown on the Wheel screen and NOWHERE else, so for the rest of a run the player did arithmetic
// against a number they could not see. "Legible math always" does not only mean show the working
// - it means show the TERMS. Temporary blessings lived as bare counters and were just as invisible.
// The NAME is flavour; the EFFECT is the maths. They're separate spans so a phone can drop the
// name and still show you every term you're calculating against.
// ============================================================
// 🎴 THE FIELD — persistent state as OBJECTS instead of counters (2026-08-21, Thomas)
//
// > *"thats how i envisioned tokens, like emberwake, and momentum. they are token cards that stay
// >  out on the field until removed. boardstate. and yeah i want to dive into more boardstate
// >  stuff because it feels more boardgamey, and it can open up gameplay a lot."*
//
// 🔑 THE INSIGHT IS THAT WE ALREADY HAD BOARD STATE AND WERE DRAWING IT AS ARITHMETIC. 🔥 the
// Emberwake, ● Momentum, an Ember Hollow shield, a Glimpse, a curse — every one is an object with
// a lifetime: it appears, it persists, something removes it. They READ as numbers because they
// were BUILT as numbers, one variable at a time, in five unrelated places.
//
// ⚠️ THIS CHANGES NO RULE, AND WAS CHECKED AS ONE: same seed, same run, turn by turn, before and
// after (scratchpad/identity.js). 🔑 A PURE REFACTOR HAS NO NUMBER TO MOVE, so "the win rate did
// not change" would have proved nothing at n=200 — the noise band is wider than most real changes.
// The provable claim is *did the same seed play the same game*, and that is what the test asks.
//
// 🔑 WHY BUILD IT BEFORE ANY CLASS NEEDS IT: the Engineer's turret, the Forager's planted seed and
// the Mason's standing work are ONE system with three fillings if the field exists, and three
// bespoke features if it does not. See [[Board_State_And_Tokens]].
//
// 🔑 AND IT IS THE MOAT ARGUMENT EXACTLY — a counter is a number, a token is a THING, and things
// can be animated, thrown, shattered and swept off a table. ⚠️ WHICH IS PRECISELY WHY NONE OF THAT
// IS BUILT HERE. The row is deliberately plain: staging is the engine's job, and building juice in
// the prototype is the one category that is 100% throwaway.
//
// ⚠️ THE RULE THAT MATTERS MOST: THE FIELD *REPLACES* carried()'s HALF OF THIS — IT MUST NEVER SIT
// BESIDE IT. `carried()` exists because of the Mirror Fen bug: a run-long −2 Pace that was
// invisible because only one screen drew it. Two ledgers for persistent state is that same bug in
// a new coat, so everything that moved here came OUT of carried() in the same edit.
//
// THE LINE BETWEEN THE TWO: the field holds what a TURN creates and a turn consumes — one-shot,
// expiring, breakable. The status bar keeps what you OWN for the run: charms, a contract, the
// Standing. In board terms, tokens on the table versus cards in your play area.
//
// 🌱 DELIBERATELY NOT BUILT: timers and removal. `timer` is in the shape so a planted token FITS,
// but nothing counts down and no creature can break anything, because nothing plants yet. Build
// the machinery when a class needs it — speculative generality is how a seam rots.
//
// THE SHAPE OF A TOKEN:
//   id     stable handle — the CSS/animation hook, and what a tutorial lesson points at
//   icon   one glyph; the thing you actually recognise it by across the table
//   name   what it is called
//   count  optional number carried ON the token
//   cap    optional — with a count, draws PIPS instead of a numeral (● Momentum)
//   worth  what it is doing RIGHT NOW. ⚠️ THE TERMS, NEVER A VERDICT.
//   note   what takes it away. 🔑 EVERY TOKEN SAYS HOW IT DIES — that is what makes it an object
//          with a lifetime rather than a stat, and it is the half a bare counter never showed.
//   bane   true when it is working against you
//   tap    optional handler. 🔑 A TOKEN YOU CAN ACT ON *IS* THE CONTROL — see 🔥 below.
//   timer  reserved. Nothing reads it yet.
//
// ⚠️ THE CLASS OWNS ITS OWN TOKENS (`CLASS.tokens()`); the ENGINE owns the rest and owns the row.
// Same split that already works for compose(): the engine draws, saves and expires them, the class
// decides what its tokens MEAN. A rogue must never inherit the mage's Emberwake by sharing an
// array — that is the slot-③ mistake in a new place.
// ============================================================
function fieldTokens() {
  const out = [];
  if (CLASS && CLASS.tokens) { const t = CLASS.tokens(); if (t) out.push(...t.filter(Boolean)); }
  // ---- ENGINE TOKENS: the one-shot boons and banes the road hands you ----
  if (S.paceBless > 0) out.push({ id: 'glimpse', icon: '🌙', name: 'Glimpse',
    worth: '<b>+2</b> Pace', note: 'on your next journey' });
  if (S.emberShield) out.push({ id: 'hollow', icon: '🔥', name: 'Ember Hollow',
    worth: 'your <b>Arsenal</b> survives Nightfall', note: 'once, then it is gone' });
  if (S.curseNextFight) out.push({ id: 'followed', icon: '☠️', name: 'Followed', bane: true,
    worth: 'your next <b>fight</b> carries a Hardship', note: 'until it lands' });
  // ⏳ the countdown, on screen the whole time it runs. ⚠️ This is the token that makes it a
  // COUNTDOWN rather than a hidden state — the cost has to be visible while you are paying it,
  // or it is a punishment you only notice at the shop.
  if (S.delayed > 0) out.push({ id: 'delayed', icon: '⏳', name: 'Delayed', bane: true,
    count: S.delayed, timer: S.delayed,
    worth: 'you cannot <b>sharpen</b>', note: `${S.delayed} more encounter${S.delayed === 1 ? '' : 's'}` });
  return out;
}

const stripTags = s => String(s).replace(/<[^>]*>/g, '');
// 🛡️ THE EQUIPMENT RAIL — Flesh and Blood's zone layout, which is worth copying exactly:
//     HEAD across the top · CHEST and ARMS side by side · LEGS below.
// 🔑 SEPARATE FROM #field ON PURPOSE, and the line is clean: the FIELD holds what a TURN creates
// and a turn consumes; the RAIL holds what you WEAR for the whole run. Two clocks, two places.
// ⚠️ That does NOT reintroduce the two-ledger bug the field was built to kill — armour moved
// wholesale, it is not drawn in both. Nothing here is duplicated anywhere else.
// ⚠️ A zone you have not unlocked reads LOCKED, never empty. A locked thing you can see is a goal;
// an empty box is a bug you go looking for.
const RAIL_ORDER = ['Head', 'Chest', 'Arms', 'Legs'];
function renderArmourRail() {
  const el = $('armour-rail');
  if (!el) return;
  if (isShell() || !S || !S.deck) { el.className = ''; el.innerHTML = ''; return; }
  const worn = {};
  for (const a of (S.armour || [])) {
    const d = armourDef(a.id); if (d) worn[d.slot] = a;
  }
  const openSlots = armourSlotsOpen();
  let i = 0;
  el.className = 'has-rail';
  el.innerHTML = RAIL_ORDER.map(slot => {
    const sl = ARMOUR_SLOTS[slot], a = worn[slot], open = i++ < openSlots;
    if (!open) return `<div class="eq eq-${slot.toLowerCase()} is-locked">` +
      `<div class="eq-zone">${sl.label}</div><div class="eq-lock">🔒</div></div>`;
    if (!a) return `<div class="eq eq-${slot.toLowerCase()} is-empty">` +
      `<div class="eq-zone">${sl.label}</div></div>`;
    const d = armourDef(a.id), live = armourBlock(a), charges = armourUsesLeft(a);
    const charging = !!d.charge;
    const canBlock = S.phase === 'soak' && S.damage > 0 && a.wear > 0 && live > 0;
    const canUse = isAssignPhase() && armourReady(a);
    const n = charging ? (a.charge || 0) : d.block > 0 ? a.wear : charges;
    const cap = charging ? d.charge : d.block > 0 ? 1 : (d.uses || 0);
    const acts = (canUse && d.use === 'discharge')
      ? `<div class="eq-acts"><button class="tok-act" onclick="useArmour('${a.id}','atk')">⚔️ +6</button>` +
        `<button class="tok-act" onclick="useArmour('${a.id}','init')">💨 +6</button></div>` : '';
    const tap = canBlock ? `soakWithArmour('${a.id}')` : (canUse && d.use !== 'discharge') ? `useArmour('${a.id}')` : null;
    return `<div class="eq eq-${slot.toLowerCase()} rar-${d.rarity || 'common'}` +
      `${tap ? ' is-ready' : ''}${(d.block > 0 && a.wear <= 0 && !charging) ? ' is-spent' : ''}"` +
      (tap ? ` onclick="${tap}" role="button" tabindex="0"` : '') +
      ` title="${stripTags(d.name + ' — ' + (d.text || 'no ability'))}">` +
      `<div class="eq-zone">${sl.label}</div>` +
      `<div class="eq-name">${d.name}</div>` +
      `<div class="eq-block">${d.block > 0 ? 'blocks <b>' + d.block + '</b>' : '<span class="dim">no block</span>'}</div>` +
      (cap ? `<div class="eq-pips">${pips(n, cap)}</div>` : '') +
      (canBlock ? `<div class="eq-cue">tap to block</div>` : canUse && !acts ? `<div class="eq-cue">tap to use</div>` : '') +
      acts +
    `</div>`;
  }).join('');
}

function renderField() {
  const el = $('field');
  if (!el) return;
  // ⚠️ a shell screen has no run, so it has no board either — and S may be a stale run object.
  const toks = (!isShell() && S && S.deck) ? fieldTokens() : [];
  el.className = toks.length ? 'has-tokens' : '';
  if (!toks.length) { el.innerHTML = ''; return; }
  el.innerHTML = toks.map(t => {
    const body = (t.cap != null && t.count != null)
      ? `<span class="tok-pips">${pips(t.count, t.cap)}</span>`
      : (t.count != null ? `<span class="tok-count">${t.count}</span>` : '');
    return `<div class="tok tok-${t.id}${t.bane ? ' is-bane' : ''}${t.tap ? ' is-tappable' : ''}` +
      `${t.armour ? ' is-armour' : ''}${t.spent ? ' is-spent' : ''}${t.ready ? ' is-ready' : ''}"` +
      (t.tap ? ` onclick="${t.tap}" role="button" tabindex="0"` : '') +
      ` title="${stripTags(t.name + ' — ' + t.worth + ' · ' + t.note)}">` +
      `<div class="tok-head"><span class="tok-icon">${t.icon}</span>${body}</div>` +
      `<div class="tok-name">${t.name}</div>` +
      `<div class="tok-worth">${t.worth}</div>` +
      `<div class="tok-note">${t.note}</div>` +
      // 🔑 a token with more than one thing to do carries its own buttons. Same principle as one
      // tap: a token you can act on IS the control — there is just more than one act.
      (t.acts ? `<div class="tok-acts">` + t.acts.map(x =>
        `<button class="tok-act" onclick="${x.call}">${x.label}</button>`).join('') + `</div>` : '') +
    `</div>`;
  }).join('');
}

// 🧾 WHAT YOU OWN FOR THE RUN — charms and a contract. ⚠️ Everything ONE-SHOT or breakable moved
// to the field above; do not add it back here, and do not add a token there without taking it out
// of here. Two ledgers is the Mirror Fen bug again.
function carried() {
  const out = [];
  for (const id of S.charms) { const c = charmById(id); if (c) out.push({ curse: !!c.curse, name: c.name, text: c.text }); }
  // 📜 a contract is a run-layer promise with a deadline — exactly the thing the 2026-07-29
  // rule says must be on screen every turn, with its PROGRESS, not just its name
  const ct = activeContract();
  if (ct) out.push({ curse: false, name: ct.name,
    text: `📜 ${S.contract.n}/${ct.need} · ${S.contract.left != null ? S.contract.left + ' left · ' : ''}pays 🪙 ${ct.reward}` });
  return out;
}
// 📋 EVERYTHING YOU ARE CARRYING, AS OBJECTS (2026-08-22). Thomas, on the event screen:
// *"wish this could be more clear on what im getting, what i have or whatever."*
//
// 🐛 The old screen ran the whole inventory together as one prose sentence separated by "·", and
// it left POTIONS OUT ENTIRELY — so an event could say *"Tallow Stub goes in your kit"* and then
// print a "You now carry:" line that did not contain it. **You were told you gained a thing and
// then shown a list without the thing in it.**
//
// 🔑 THE FIX IS THE FIELD'S LESSON APPLIED ONE SCREEN OVER: do not describe state in a sentence,
// SHOW THE OBJECTS. Three labelled rows, each item its own chip, in the same visual language the
// status bar already uses — so a charm looks like a charm wherever you meet it.
// ⚠️ It reads carried() and S.potions rather than keeping its own list: two ledgers for the same
// state is the Mirror Fen bug, and this screen is exactly where that would hide.
function carriedPanelHTML(heading) {
  const rows = [];
  const kit = S.potions || [];
  if (kit.length) rows.push(`<div class="carry-row"><span class="carry-row-lab">🧪 Kit</span>` +
    kit.map(x => { const d = potionById(x.id) || x;
      return `<span class="carry-chip" title="${stripTags(d.text || '')}">${d.name}</span>`; }).join('') +
    `<span class="dim carry-row-note">${kit.length}/${POTION_CAP} · one use each, the turn you drink it</span></div>`);
  const items = carried();
  const charms = items.filter(x => !x.text.startsWith('📜'));
  const quest  = items.filter(x =>  x.text.startsWith('📜'));
  if (charms.length) rows.push(`<div class="carry-row"><span class="carry-row-lab">🎁 Charms</span>` +
    charms.map(x => `<span class="carry-chip${x.curse ? ' is-curse' : ''}" title="${stripTags(x.text)}">` +
      `${x.curse ? '☠️ ' : ''}${x.name}</span>`).join('') + `</div>`);
  if (quest.length) rows.push(`<div class="carry-row"><span class="carry-row-lab">📜 Contract</span>` +
    quest.map(x => `<span class="carry-chip">${x.name} <span class="dim">${stripTags(x.text).replace('📜 ', '')}</span></span>`).join('') + `</div>`);
  if (!rows.length) return `<p class="event-carry">You carry nothing that changes your maths.</p>`;
  return `<div class="carry-panel"><div class="carry-head">${heading}</div>${rows.join('')}</div>`;
}
const carryLine = x => `${x.curse ? '☠️' : '🎁'} ${x.name}: ${x.text}`;
function carriedText() {
  const c = carried();
  if (!c.length) return '';
  return c.map(x => `<span class="carry-chip${x.curse ? ' is-curse' : ''}" title="${carryLine(x)}">` +
    `<b class="carry-name">${x.curse ? '☠️' : '🎁'} ${x.name}</b><span class="carry-eff">${x.text}</span></span>`).join('');
}

// 📏 THE STANDING (2026-08-04). Measured: half of all stage-4 defeats were ALREADY UNWINNABLE
// when the player reached the lair - and the game never said so, so four beats were spent
// discovering a result decided on the road. That is not unfair (only 11% of losses were variance);
// it is a TELEGRAPH failure, and "unannounced = dice roll" is a claim about the player's
// INFORMATION, not about the RNG.
//
// 🔑 So this is the one term "legible math always" never showed: the price you are paying at the
// RUN level. Every other number on screen is about this turn. Soaking a card, taking a Narrow and
// buying a level are all decisions whose real cost lands at the lair, and until now the ledger was
// invisible while you were writing in it.
// ⚠️ It is a DISPLAY, not a rule - nothing reads it, nothing gates on it. If it ever becomes an
// input to the maths it stops being information and starts being a stat.
function deckLevels() { return [...S.hand, ...S.deck, ...S.discard].reduce((t, c) => t + c.level, 0); }
function standingText() {
  if (!S.dragon || !S.dragon.par) return '';
  const have = deckLevels(), par = S.dragon.par;
  // ⚠️ IT IS A TARGET, NOT A VERDICT, AND FOR MOST OF THE RUN IT CANNOT BE ONE (measured
  // 2026-08-04 over 2,000 runs). The median deck level of a run that goes on to WIN and one that
  // goes on to LOSE are: region 1 -> 35 vs 35 · region 2 -> 40 vs 39 · region 3 -> 44 vs 42
  // · region 4 -> 47 vs 45. 🔑 THEY ARE IDENTICAL UNTIL REGION 3. There is nothing to warn
  // about early, because nothing has gone wrong yet - the road's debt is contracted late.
  // So: show the TERMS the whole way (a target you are travelling toward, which is information),
  // and only pass judgement from region 4, where the numbers actually separate.
  const judge = S.finalMode || S.region >= 4;
  const cls = !judge ? '' : have >= par ? 'good' : have >= par - 4 ? '' : 'bad';
  return `<span class="standing" title="Your deck's total card levels, against the total this dragon usually asks for by the lair. A target, not a prediction — measured over 2,000 runs. Levelling raises it; blocking lowers it.">` +
    `🃏 Deck <b class="${cls}">${have}</b> → <b>${par}</b> by the lair</span>`;
}

function renderStatus() {
  const key = S.deck[0];
  $('status-bar').innerHTML =
    `<span>🐉 <b>${S.dragon.name}</b> ${elIcon(S.dragon.element)} · stage ${S.dragon.stage} · ${dragonShapeText(S.dragon)}</span>` +
    (S.finalMode ? '' : `<span>🗺️ <b>${RUN()[S.region - 1].name}</b> (${S.region}/${RUN().length})</span>`) +
    `<span>Deck: <b>${S.deck.length}</b></span>` +
    `<span>Discard: <b>${S.discard.length}</b></span>` +
    `<span title="cards that have left your deck for the rest of this run">Lost: <b>${S.trashed.length}</b></span>` +
    `<span>Next draw: <b>${key ? `${key.def.name} Lv${key.level}` : '—'}</b></span>` +
    `<span>🪙 <b style="color:#c9b458">${S.coins}</b></span>` +
    `<span>Results: <b class="good">${S.results.Complete}C</b> / <b>${S.results.Narrow}N</b> / <b>${S.results.Loss}L</b></span>` +
    standingText() +
    carriedText();
}

// 🗡️ THE MOMENTUM METER — PIPS, NOT PROSE (2026-08-17).
//
// ⚠️ THIRD ATTEMPT AT EXPLAINING THIS CLASS, AND THE FIRST TWO WERE BOTH WORDS. Thomas, after
// two rewrites of the slot hints: *"finisher says spend 1, spend 1 what?"* / *"i don't get what
// builder vs finisher is at a glance"*.
//
// 🔑 THE PROBLEM WAS NEVER THE WORDING, IT WAS THAT THE RESOURCE HAD NO BODY. Momentum was a
// number inside a sentence, sitting among other sentences — nothing to look at, nothing to count.
// WoW puts combo points on the target as pips and never explains them in a tooltip, because you
// COUNT them. So: one glyph, ●, used in the meter, on the cards, and in every hint. A card that
// says "+1 ●" next to a bar reading "●●○○○" needs no sentence at all.
//
// ⚠️ AND NEVER PRINT A BARE NUMBER AGAIN. "spends 1" was literally unanswerable — one what?
// Every quantity in this class is written with its glyph attached.
const PIP_ON = '●', PIP_OFF = '○';
function pips(n, cap) {
  const full = Math.max(0, Math.min(cap, n | 0));
  return `<span class="pip-on">${PIP_ON.repeat(full)}</span><span class="pip-off">${PIP_OFF.repeat(cap - full)}</span>`;
}
// 🎴 THE STATUS-BAR CHIP IS GONE (2026-08-21) — Momentum is a TOKEN now and lives on the field.
// It was already most of the way there: the 2026-08-17 pips fix gave it a glyph and a body, which
// is exactly what separated it from the 🔥 Emberwake (a number inside a sentence, in two places at
// once). All that was left was to move it onto the table. See ROGUE.tokens().
// ⚠️ Its chip was DELETED in the same edit rather than left beside the token — when a display
// moves, the old one goes with it, or the next persistent modifier gets added to the wrong ledger.

// 🕯️ what you can see of the road ahead — and, when the candle is out, that you cannot.
function candleLine() {
  if (S.finalMode) return '';
  const n = nextEncounter();
  if (!S.candle) return `<div class="candle out">🕯️ <b>Your candle is out.</b> You cannot see what waits beyond this. <span class="dim">Complete an encounter to relight it.</span></div>`;
  // 🗺️ with a map, what the candle buys is stated on the map itself, road by road
  if (S.map) return `<div class="candle lit">🕯️ <b>Lit.</b> <span class="dim">On the map you can read what waits down each road you could take.</span></div>`;
  if (!n) return `<div class="candle lit">🕯️ <b>Lit.</b> <span class="dim">Nothing more on this road — the region ends after this.</span></div>`;
  const what = n.type === 'fight'
    ? `⚔️ <b>${n.name}</b> · ❤️ ${n.hp} · 💨 ${n.init} · ${n.shape === 'armour' ? `🛡️ Armour ${n.shapeV}` : n.shape === 'evasion' ? '🌀 Evasion' : 'unguarded'}`
    : `👣 <b>${n.name}</b> · MP ${n.mp} · 🌙 ${n.nightfall}`;
  return `<div class="candle lit">🕯️ <span class="dim">by candlelight you can make out</span> ${what}</div>`;
}

function renderEncounter() {
  const e = S.encounter;
  const panel = $('encounter-panel');
  // 🏕️ ON AN EVENT TURN THERE IS NO ENCOUNTER. `S.encounter` still holds the LAST one, so
  // the panel was presenting a live journey - MP, Nightfall, a Time Penalty - that you could not
  // play and would never resolve. Found by looking at the screen, not by a test: every number on
  // it was correct and every one of them was about a turn that had already happened.
  // 🔑 A PANEL THAT DESCRIBES THE PREVIOUS TURN IS WORSE THAN AN EMPTY ONE.
  // ⚠️ The SLOT ROW deliberately stays - event pickers live ON the cards, and it is the only
  // place a card is ever drawn.
  if (isEventTurn()) {
    panel.innerHTML = `<div class="enc-title">❓ AN EVENT</div>` +
      `<div class="enc-sub">Region ${S.region} · no encounter this turn</div>` +
      `<div class="hint">You spend no cards here. Your hand carries on to the next encounter.</div>`;
    return;
  }
  if (S.finalMode && S.phase !== 'defeat' && S.phase !== 'victory') {
    const ds = S.dragonState;
    const hpPct = ds ? Math.max(0, Math.round(100 * ds.hp / ds.maxHp)) : 100;
    const dragonBar =
      `<div class="dragon-hp"><div class="dragon-hp-fill" style="width:${hpPct}%"></div>` +
      `<span class="dragon-hp-label">🐉 ${S.dragon.name} — ${ds ? ds.hp : S.dragon.hp} / ${ds ? ds.maxHp : S.dragon.hp} HP</span></div>` +
      `<div class="dragon-shields">${ds ? shapeStateText() : dragonShapeText(S.dragon)}` +
      ` <span class="dim">· 💨 Init ${S.dragon.init} · breath ${S.dragon.breath}</span></div>` +
      (S.finalPhase === 'duel' ? staminaBar() + telegraph() : '');
    if (S.finalPhase === 'duel') {
      panel.className = 'fight';
      panel.innerHTML =
        `<div class="enc-type">🐉 THE DUEL — beat ${S.duelBeat}</div>` + dragonBar +
        `<div class="enc-hint">${dragonDemand(S.dragon)} — <b>${S.dragon.teaches}</b>.</div>`;
      return;
    }
    // ⚔️ THE LAST MILE — the box states the whole deal, because the deal IS the mechanic.
    panel.className = 'journey';
    panel.innerHTML =
      `<div class="enc-type">⚔️ THE LAST MILE</div>` + dragonBar +
      // ⚔️ TWO RACES, STATED AS TWO. Both targets are printed as numbers, in the same grammar as
      // every other encounter, because the whole point of the second race is that it is a race
      // you can SEE yourself winning or losing while you arrange.
      `<div class="enc-stats">` +
        `<span>👣 MP <b>${LAST_MILE.mp}</b> (half ${Math.ceil(LAST_MILE.mp / 2)})</span>` +
        `<span>💨 vs Init <b>${S.dragon.init}</b> (half ${Math.ceil(S.dragon.init / 2)})</span>` +
      `</div>` +
      `<div class="enc-mod lastmile-deal">` +
        `<b>👣 How hard you arrive</b> — how hurt it starts.<br>` +
        `<b>Complete it</b> and you fall on the ${S.dragon.name} before it stands — <b>−${LAST_MILE.hpComplete} HP</b>.<br>` +
        `<b>Fall short</b> (half MP) and you land one blow as it turns — <b>−${LAST_MILE.hpNarrow} HP</b>.<br>` +
        `<b>Fail</b> and it meets you whole.` +
      `</div>` +
      `<div class="enc-mod lastmile-deal">` +
        `<b>💨 How quietly you arrive</b> — whether it is ready for you.<br>` +
        `<b>Match its Initiative</b> and it never hears you — ${unseenPromise()}<br>` +
        `<b>Below half</b> and it is already up: it takes the opening blow, <b>${Math.ceil(S.dragon.breath / 2)} damage</b>, and you block it with your deck.` +
      `</div>` +
      // ⚠️ THIS LINE USED TO SAY "NOTHING HERE COSTS YOU CARDS", FULL STOP, AND THAT IS NOW FALSE.
      // 🔑 The promise it was making is still kept, though, and it is worth keeping precisely:
      // what you PLAY costs nothing — every card comes back. Only FAILING costs. When a rule gains
      // an exception, the line that states the rule has to gain it in the same edit.
      `<div class="enc-hint">🔄 <b>Nothing you play here costs you cards.</b> Spent, stacked or kept — you gather your whole deck for the duel either way, so <b>hold nothing back</b>. Only arriving <i>loud</i> costs you: that blow is soaked, and blunted cards stay blunted.</div>`;
    return;
  }
  if (S.phase === 'intro' || S.phase === 'summary' || S.phase === 'defeat' || S.phase === 'victory' || !e) { panel.innerHTML = ''; panel.className = ''; return; }
  panel.className = e.type;
  const modLines =
    (e.ability ? `<div class="enc-mod">☠️ <b>${e.ability}</b> — ${ABILITIES[e.ability]}</div>` : '') +
    (e.peril ? `<div class="enc-mod">⛰️ <b>${e.peril}</b> — ${PERILS[e.peril]}</div>` : '') +
    (S.hardship ? `<div class="enc-mod">⚠️ <b>${S.hardship}</b> — ${hardshipText(S.hardship)}</div>` : '');
  if (e.type === 'fight') {
    panel.innerHTML =
      `<div class="enc-type">FIGHT — ${RUN()[S.region - 1].name}</div><div class="enc-name">${e.name}</div>` +
      `<div class="enc-stats"><span>❤️ HP <b>${e.hp}</b> (half ${Math.ceil(e.hp / 2)})</span>` +
      `<span>💨 Init <b>${e.init}</b></span><span>⚔️ Atk <b>${e.atk}</b></span>` +
      `<span>${shapeText(e)}</span>` +

      `<span>🪙 <b>${e.xp}</b></span></div>` + modLines + candleLine();
  } else {
    panel.innerHTML =
      `<div class="enc-type">JOURNEY — ${RUN()[S.region - 1].name}</div><div class="enc-name">${e.name}</div>` +
      `<div class="enc-stats"><span>👣 MP <b>${e.mp}</b> (half ${Math.ceil(e.mp / 2)})</span>` +
      `<span>🌙 Nightfall <b>${e.nightfall}</b></span>` +
      `<span>⏳ Time Penalty <b>${e.timePenalty}</b></span>` +
      `<span>🪙 <b>${e.xp}</b></span></div>` +
      candleLine() +
      modLines;
  }
}

// 🛤️ WHAT A BRANCH SHOWS. 🕯️ THE CANDLE DECIDES HOW MUCH YOU SEE - lit, you read what is IN
// each road; out, you read only its SHAPE and choose on that.
// 🔑 This is the candle's PROMOTION, not its replacement. Its old job (*"see the next
// encounter"*) was measured to change the Spell only 7% of the time; deciding how much of a fork
// you can read is worth far more, and it makes *keep the candle lit* a directional goal.
// ⚠️ Even UNLIT a branch always states its shape, so the ✦ Arsenal always has something to aim
// at - which is the whole reason the fork rescues that slot ([[The_Arsenal_Question]] §reopened).
function forkBranchHTML(e, i) {
  const lit = S.candle;
  const isFight = e.type === 'fight';
  const shape = shapeText(e);
  const known = lit
    ? (isFight ? `❤️ HP ${e.hp} · 💨 Init ${e.init} · ⚔️ Atk ${e.atk} · 🪙 ${e.xp}`
               : `👣 MP ${e.mp} · 🌙 Nightfall ${e.nightfall} · ⏳ TP ${e.timePenalty} · 🪙 ${e.xp}`)
    : `<span class="dim">by dark you can make out only its shape</span>`;
  const extra = lit && (e.ability || e.peril)
    ? `<div class="fork-extra">${e.ability ? `⚠️ ${e.ability}` : `⚠️ ${e.peril}`}</div>` : '';
  return `<button class="fork-branch" onclick="takeFork(${i})">` +
    `<span class="fork-kind">${isFight ? '⚔️ FIGHT' : '👣 JOURNEY'}</span>` +
    `<span class="fork-name">${lit ? e.name : (isFight ? 'something in the way' : 'a road onward')}</span>` +
    `<span class="fork-shape">${shape || '<span class="dim">unguarded</span>'}</span>` +
    `<span class="fork-stats">${known}</span>${extra}</button>`;
}

// 🗺️ THE MAP, DRAWN AS FLOORS FROM THE TOP DOWN - the dragon is up there, so the map reads
// upward the way the run does. ⚠️ Node TYPES only, never contents: that is what keeps a map on the
// legal side of *"hints and direction, not complete optimizable data"*, and it is why the 🕯️ candle
// still matters - it tells you what is INSIDE the step you are about to take.
function mapHTML() {
  const m = S.map; if (!m) return '';
  const reach = mapChoices(m).map(n => n.f + ',' + n.c);
  const rows = [];
  // ⚠️ THE MAP'S OWN HEIGHT AND WIDTH, never the globals. The tutorial's map is 8x2 while
  // MAP_FLOORS/MAP_COLS say 16x5 — reading the globals walked off the end of every row and threw
  // before a single node was drawn. **Third reader of this same mistake in one session.**
  for (let f = mapFloors(m) - 1; f >= 0; f--) {
    const band = bandOf(f);
    const cells = [];
    for (let c = 0; c < m.floors[f].length; c++) {
      const n = m.floors[f][c];
      if (!n) { cells.push('<span class="mp-gap"></span>'); continue; }
      const key = f + ',' + c;
      const here = m.pos && m.pos.f === f && m.pos.c === c;
      const can = reach.includes(key);
      const past = m.taken.includes(key);
      const cls = 'mp-node' + (here ? ' is-here' : '') + (can ? ' is-open' : '') + (past ? ' is-past' : '');
      // ⚠️ data-f/data-c are what the edge layer measures against - the lines are drawn from the
      // real rendered positions rather than computed geometry, so they cannot drift from the grid.
      const at = `data-f="${f}" data-c="${c}"`;
      // 🗺️ HOVER READS THE NODE. Thomas: *"is it possible to see the encounter info on the map
      // on mouseover? instead of a list at the bottom of the map."*
      // ⚠️ Hover does not exist on a phone, and this game is played on one daily - so on touch a
      // tap SELECTS and the second tap moves. Not a workaround bolted on: the nodes are 30px and
      // routing is irreversible, so a confirm step is worth having there anyway.
      const hov = `onmouseenter="peekNode(${f},${c})" onfocus="peekNode(${f},${c})"`;
      cells.push(can
        ? `<button class="${cls}${isPeeked(f, c) ? ' is-peek' : ''}" ${at} ${hov} ` +
          `onclick="tapNode(${f},${c})" title="${mapTitle(n)}">${mapIcon(n)}</button>`
        : `<span class="${cls}" ${at} title="${mapTitle(n)}">${mapIcon(n)}</span>`);
    }
    // 🐛 THE BAND DIVIDER WAS ONE ROW TOO HIGH (fixed 2026-08-22, Thomas: *"why are the region
    // lines not lining up with the region numbers"*). The rule was `f % MAP_BAND === 0`, which is
    // true for floors 12/8/4/0 — but rows render TOP-DOWN, so those are the LAST floor of each
    // band, and `border-top` then drew the line *inside* the band rather than between two.
    // 🔑 The band changes between f and f-1 when `bandOf(f) !== bandOf(f-1)`, i.e. on the FIRST
    // row of the lower band reading downward: floors 11/7/3. ⚠️ And never above the top row.
    const bandStart = f % MAP_BAND === MAP_BAND - 1 && f !== MAP_FLOORS - 1;
    rows.push(`<div class="mp-row${bandStart ? ' mp-band' : ''}">` +
      `<span class="mp-f">${f === mapFloors(m) - 1 ? '▲' : 'r' + band}</span>` + cells.join('') + `</div>`);
  }
  // 🗺️ THE LINES ARE THE MAP. Without them this is a grid of icons where the game decides
  // where you may go for reasons you cannot see - Thomas, pointing at an unreachable neighbour:
  // *"why can't i go to the left node here?"* The node was real, his node simply did not link to
  // it, and nothing on screen said so.
  // 🔑 AND WITHOUT EDGES THERE IS NO ROUTING AT ALL. You cannot plan toward an elite three floors
  // up if you cannot trace a path to it, which is the entire reason the map replaced the fork.
  return `<div class="mp"><svg class="mp-lines" aria-hidden="true"></svg>${rows.join('')}</div>`;
}

function renderControls() {
  const c = $('controls-panel');
  if (S.phase === 'map') {
    const opts = mapChoices(S.map);
    c.innerHTML =
      `<div class="phase-label">🗺️ THE ROAD TO ${S.dragon.name.toUpperCase()}</div>` +
      `<div class="hint">${S.map && S.map.pos ? 'Choose where to go next.' : 'Choose where to begin.'} ` +
      `<b>You are carrying ${S.hand.length === 0 ? 'nothing' :
        S.hand.map(c => displayName(c)).join(', ')}</b> — the rest of your hand is dealt once you set off. ` +
      (S.candle ? '🕯️ Your candle is lit — you can see what waits at the next step.'
                : '<b>Your candle is out</b> — you can read the road, but not what is on it.') +
      `</div>` + mapHTML() +
      `<div class="mp-legend">◇ an encounter · 💀 dangerous · ❓ an event · 🕯️ a hearth</div>` +
      // 🔑 ONE line that follows the pointer, instead of a list of every road at once. A list
      // states three things you did not ask about; a hover states the one you are considering.
      `<div class="mp-detail" id="mp-detail">${peekHTML()}</div>` +
      (opts.length ? '' : `<div class="hint">No road left — the lair is ahead.</div>`);
    return;
  }
  if (S.phase === 'hearth') {
    const forgeable = hearthForgeable();
    // ⚠️ THE LAST HEARTH HAS NO ROAD AFTER IT, SO THE LIGHT HAS NOTHING TO SHOW. The top floor
    // is always a hearth (StS's floor-15 rest), and the candle reveals the NEXT ENCOUNTER - after
    // the top floor there is only the duel, and the dragon is fully revealed from turn 1 by design.
    // 🔑 So the option is DISABLED AND SAYS WHY rather than quietly being a trap - the same rule
    // as every other picker here. ⚠️ It is still a half-dead node: this makes the last hearth
    // honest, it does not make it a decision. The real fix is a second option that means something
    // on the eve of a duel (duel stamina and the dragon's opening HP are both already priced) -
    // that is a design call, not a patch.
    const lastHearth = !!(S.map && S.map.pos && S.map.pos.f >= MAP_FLOORS - 1);
    c.innerHTML =
      `<div class="phase-label">🕯️ A HEARTH</div>` +
      `<div class="event-flavor">Someone kept this fire and moved on. The coals are still warm — warm enough ` +
      `to take a wick from, or to work a blade in. Not both; they will be grey by morning.</div>` +
      `<div class="event-opts">` +
      `<button ${lastHearth ? 'disabled ' : ''}onclick="${lastHearth ? '' : 'hearthLight()'}">` +
        `🕯️ <b>Take the light</b>` +
        `<span class="opt-why">${lastHearth
          ? 'there is no more road to read — only the dragon'
          : (S.candle ? 'your candle is already lit — this does nothing for you'
                      : 'see what waits at each step until it gutters')}</span></button>` +
      `<button ${forgeable.length ? '' : 'disabled '}onclick="${forgeable.length ? 'startHearthPick()' : ''}">` +
        `🔧 <b>Work the coals</b>` +
        `<span class="opt-why">${forgeable.length ? 'sharpen one card a level, free'
          : 'nothing in hand can be sharpened'}</span></button>` +
      `<button ${S.trashed.length ? '' : 'disabled '}onclick="${S.trashed.length ? 'startMendPick()' : ''}">` +
        `🧵 <b>Mend what you lost</b>` +
        `<span class="opt-why">${S.trashed.length
          ? `choose one of the ${S.trashed.length} card${S.trashed.length === 1 ? '' : 's'} damage took — it returns at Lv1`
          : 'nothing of yours has been lost yet'}</span></button>` +
      `</div>`;
    return;
  }
  if (S.phase === 'eliteboon') {
    const offers = (S.boon || []).map(id => charmById(id)).filter(Boolean);
    c.innerHTML =
      `<div class="phase-label">💀 SOMETHING WORTH TAKING</div>` +
      `<div class="event-flavor">The dangerous thing is dead, and it was carrying something. ` +
      `Whatever it was doing out here, it was not doing it unprepared.</div>` +
      `<div class="setout">` +
      offers.map(o => `<button class="setout-offer r-${o.rarity}" onclick="pickBoon('${o.id}')">` +
        `<b>${o.name}</b><span class="setout-text">${o.text}</span>` +
        (o.why ? `<span class="setout-why">${o.why}</span>` : '') + `</button>`).join('') +
      `</div>`;
    return;
  }
  if (S.phase === 'mendpick') {
    c.innerHTML =
      `<div class="phase-label">🧵 MEND WHAT YOU LOST</div>` +
      `<div class="hint">Everything damage has taken from you this run. One comes back — at <b>Lv1</b>, ` +
      `at the bottom of your deck.</div>` +
      `<div class="mend-row">${S.trashed.map(t => cardHTML(t)).join('')}</div>` +
      `<button onclick="cancelMendPick()">← back to the hearth</button>`;
    return;
  }
  if (S.phase === 'hearthpick') {
    c.innerHTML =
      `<div class="phase-label">🔧 WORK THE COALS</div>` +
      `<div class="hint">Tap a card to sharpen it a level. ⚠️ The candle stays as it is.</div>` +
      `<button onclick="cancelHearthPick()">← back to the hearth</button>`;
    return;
  }
  if (S.phase === 'fork') {
    const f = S.fork || [];
    c.innerHTML =
      `<div class="phase-label">🛤️ THE ROAD FORKS</div>` +
      `<div class="hint">Choose where to go. ${S.candle
        ? 'Your candle is lit — you can see what waits down each road.'
        : '<b>Your candle is out</b> — you can read only the shape of what waits.'}</div>` +
      `<div class="fork-row">${f.map((e, i) => forkBranchHTML(e, i)).join('')}</div>`;
    return;
  }
  // ⚠️ A TURN WITHOUT AN ENCOUNTER IS A BUG, BUT IT MUST NOT BE A BLANK SCREEN. Reading
  // `S.encounter.type` blind is what turned one sequencing slip into a frozen game.
  if (S.phase === 'assign' && !S.encounter) {
    c.innerHTML = `<div class="phase-label">⚠️ NO ENCOUNTER</div>` +
      `<div class="hint">This turn has no encounter, which should not happen. ` +
      `Use 📋 Report to copy the state, then ⟳ New Run.</div>`;
    return;
  }
  if (S.phase === 'assign') {
    const isFight = S.encounter.type === 'fight';
    // The "no card has an Attack/Move value" escape-hatch warning is GONE with the Attack/Move
    // split (redesign step 2) — every card always has its one value, so a hand can never be
    // wrong-typed and there is nothing to warn about. (It was also silently firing every turn:
    // it probed eff(c).atk, which no longer exists, so the check read false for every card.)
    // the Surge target now lives ON the Surge card (see boostPicker in cardHTML) — no radio row
    // ☠️ THE RANGED DODGE IS CUT (2026-07-29). It was the last decision in the game that wasn't
    // on a card — a bare checkbox — AND a pre-commitment (decide before you know whether you even
    // win Initiative) AND a fake choice, since paying your whole Arsenal to avoid ~2 damage is
    // almost never right. Same disease as the old Attack-or-Initiative fork.
    // 🔑 What Ranged IS now: Early Damage regardless of Initiative. One sentence, no toggle. And
    // it gives the ability a real job in the current vocabulary — it switches OFF the Initiative
    // half of the Catalyst fork, so against a Ranged creature speed buys you nothing and your
    // Catalyst is free to ATTUNE instead. An ability that redirects the turn's question.
    const boostRow = '';
    const duel = S.finalPhase === 'duel';
    const phaseLabel = S.finalMode
      ? (duel ? `🐉 THE DUEL — beat ${S.duelBeat}` : `🐉 THE LAIR`)
      : `PHASE 2 — ACTION`;
    const resolveBtn = duel
      ? `<button class="primary" onclick="resolveDuel()" ${rolesValid() ? '' : 'disabled'}>Strike the ${S.dragon.name}</button>`
      : `<button class="primary" onclick="resolve()" ${rolesValid() ? '' : 'disabled'}>Resolve ${isFight ? 'Fight' : 'Journey'}</button>`;
    // 👁️ WHAT YOU ARE FACING, RESTATED AT THE BUTTON (2026-08-18).
    // Thomas: *"the encounter info also seems small in the top left. since my gaze is always at my
    // hand, and the resolve button is near my hand. thats where im looking at, and i don't see the
    // encounter info. and sometimes i click resolve journey without even seeing the encounter
    // info."*
    // 🔑 MEASURED, AND IT IS A LAYOUT FAULT RATHER THAN CARELESSNESS: the encounter panel
    // centres at (156,221) in 11px type, the Resolve button at (543,388), the hand at (509,673).
    // The information and the decision sit 422px apart in opposite corners, so you cannot read the
    // terms while looking at the control you are about to press.
    // 🔑 THE RULE: PUT THE TERMS WHERE THE DECISION IS - a restatement beside the button, not a
    // bigger panel on the far side of the screen.
    // ⚠️ TERMS ONLY, NEVER THE OUTCOME. Live preview was removed deliberately and stays removed:
    // this says what the encounter DEMANDS, never what your arrangement would do about it.

    // the how-to text is tucked into a collapsed toggle at the bottom — out of the way each turn,
    // still one tap away. The actionable "you're not stuck" warning stays inline.
    // 🔥 AIM THE EMBERWAKE. It sits above Resolve because you bank BLIND and spend INFORMED —
    // the whole point is that you choose with the encounter in front of you.
    // 🎓 driven by nextLesson() — reactive, never scripted
    const L = nextLesson();
    const lessonRow = L
      ? `<div class="lesson-row"><span>🎓 ${L.text}</span>` +
        `<span class="lesson-btns"><button class="primary" onclick="learned('${L.id}')">got it</button>` +
        `<button onclick="S.lessonsOff=true;render()">hide tips</button></span></div>`
      : '';
    // 🧪 YOUR KIT. Potions are useless if you forget you have them, so they sit ON the turn
    // screen with their full text, not behind a menu.
    const kit = (S.potions || []).map(id => potionById(id)).filter(Boolean);
    // ⚠️ THREE POTIONS DROPPED THE PHRASE ENTIRELY rather than take it mid-sentence: *"You win
// Initiative WHEN USED, whatever it is"* and *"your Catalyst stays in hand WHEN USED instead of
// going under the deck"* both read worse than what they replaced. 🔑 A CLARIFICATION THAT HAS TO
// BE WEDGED INTO THE MIDDLE OF A SENTENCE IS NOT CLARIFYING IT - the kit line below carries the
// rule for all of them, so a text that reads cleanly without it simply goes without.
// ⚠️ THE DURATION IS STATED HERE, ONCE. Every potion lasts exactly the turn you drink it,
    // so repeating that on all seventeen of them is noise in a shop - the card text says WHAT it
    // does and that you choose when; this line says how long it lasts.
    const potionRow = kit.length
      ? `<div class="kit-row"><div class="kit-lab">🧪 Your kit — tap one to drink it. ` +
        `<span class="dim">Each is one use, and lasts only the turn you drink it.</span></div>` +
        kit.map((p, i) =>
          `<button class="kit-potion${S.potionPick === p.id ? ' arming' : ''}" onclick="usePotion('${p.id}')">` +
          `<b>🧪 ${p.name}</b><span class="kit-text">${p.text}</span></button>`).join('') +
        (S.potionPick ? `<div class="kit-ask">Tap a card to use the <b>${potionById(S.potionPick).name}</b> on it — ` +
          `<button onclick="cancelPotion()">cancel</button></div>` : '') +
        `</div>`
      : '';
    // 🎴 the Emberwake's aim row is GONE — the token on the field is the control now (cycleWake).
    const howto =
      `<details class="howto"><summary>How to play</summary><div class="hint">` +
      `Your cards sit under the four roles — <b>Spell</b> (your action), <b>Catalyst</b> (casts it), <b>Surge</b> (fuel), <b>Arsenal</b> (the card you keep). <b>Position is the role</b>, so you rearrange by swapping: tap two cards to trade places, or tap a card then tap a role. (Desktop can drag too.)` +
      `` +
      ` <b>Where cards go:</b> the card you cast as your <b>Spell</b> is <b>spent</b> — discarded, gone for the rest of the region. Your Catalyst and Surge slide back <b>under your deck</b> in an order you choose, and your <b>Arsenal</b> stays in hand. So each turn asks not only which card wins this fight, but which card you can afford to lose.`
      + ` <b>✦ Attuning:</b> if your <b>Catalyst</b> shares your <b>Spell's</b> element, the Spell is <b>attuned</b> and strikes for the bigger ✦ number on its face. But the Catalyst is also where your <b>Initiative</b> comes from — and your fastest card is rarely the one that matches. <b>Strike first, or strike hard?</b> Look at what you're facing: 🛡️ <b>Armour</b> shaves a flat amount off every blow, so it wants the attuned hit; 🌀 <b>Evasion</b> halves you unless you act first, so it wants speed.` +
      `` +
      `</div></details>`;
    c.innerHTML =
      `<div class="phase-label">${phaseLabel}</div>` +
      lessonRow +
      potionRow +
      bankRowHTML() +
      strikePromptHTML() +
      boostRow +
      resolveBtn +
      howto;
  } else if (S.phase === 'reveal') {
    const beat = S.beats[S.beatIndex];
    c.innerHTML =
      `<div class="phase-label">RESOLVING — ${S.beatIndex + 1} / ${S.beats.length}</div>` +
      // 🔑 TWO ZONES, NOT ONE FLAT ROW. Every beat used to be an equal box in a single wrapping
      // flex line, so the VERDICT — the one thing you are waiting for — was just the third card
      // along. The arithmetic goes on top as a sequence; the verdict and what you gained get their
      // own row underneath, separated by a rule. *Hierarchy is legibility, not decoration.*
      (() => {
        // 🔑 THREE ZONES: the working → the verdict → what you got. Each answers a different
        // question, so each gets its own band rather than sharing a row.
        const shown = S.beats.slice(0, S.beatIndex + 1);
        const cell = (b) => beatDisplayHTML(b, b === S.beats[S.beatIndex]);
        const work = shown.filter(b => !b.outcomeBeat && !b.carveBeat).map(cell).join('');
        const verdict = shown.filter(b => b.outcomeBeat).map(cell).join('');
        const drops = shown.filter(b => b.carveBeat).map(cell).join('');
        return `<div class="preview-bar beat-bar" onclick="advanceBeat()" title="click to continue">` +
          `<div class="pv-work">${work}</div>` +
          (verdict ? `<div class="pv-verdict">${verdict}</div>` : '') +
          (drops ? drops : '') +
          `</div>`;
      })() +
      (beat.final
        ? `<button class="primary" onclick="advanceBeat()">Continue</button>`
        : `<div class="hint">click to hurry…</div>`);
  } else if (S.phase === 'stack') {
    const st = S.stack || { ids: [], order: [] };
    const left = st.ids.length - st.order.length;
    c.innerHTML =
      `<div class="phase-label">🃏 STACK THE DECK</div>` +
      (hasCharm('reversed')
        ? `<div class="hint">🃏 <b>Reversed</b> — send each card to the <b>↑ top</b> (you will draw it next hand) or the <b>↓ bottom</b> (much later). ` +
          `⚠️ Send everything up and you stop seeing the rest of your deck. `
        : `<div class="hint">Your spent cards slide back <b>under the deck</b>. Tap them in the order you want to <b>draw them again</b> — ① comes back soonest. `) +
      `<b>${left}</b> left to place. <span class="note">(${S.deck.length} cards ahead of them` +
      `${st.keptId ? ` — your Arsenal ${displayName(cardById(st.keptId))} stays in hand` : ''})</span></div>` +
      // There must ALWAYS be a way forward. Without this the phase had no button at all, so a
      // player who didn't realise every card must be tapped was simply stuck mid-fight.
      `<button class="primary" onclick="finishStack()">${st.order.length ? 'Done — slide them under' : 'Skip — leave the order as it is'}</button>` +
      (st.order.length ? `<button onclick="stackClear()">↺ start over</button>` : '');
  } else if (S.phase === 'soak') {
    c.innerHTML =
      `<div class="phase-label">PHASE 3 — PENALTY</div>` +
      // ⚠️ THE THIRD PHANTOM ELEMENT (removed 2026-07-29). `damageEl` stopped mattering when soak
      // doubling was cut on 2026-07-26 — armour soaks its printed value, full stop — so naming the
      // damage's colour advertised a rule that isn't there, exactly like the creature's `atkEl`
      // and the journey's `element`. Vocabulary fixed too: "Trashed" was retired for the plain
      // statement of what actually happens.
      `<div class="hint">Damage to block: <b style="color:#e08a7a">${S.damage}</b>` +
      `. Tap a card to block with — it blocks its 🛡️ number and drops a level. ` +
      `<b>A Lv1 card LEAVES YOUR DECK for the rest of the run.</b></div>`;
    } else if (S.phase === 'setout') {
    // 🔑 SHOW THE OBJECT. Same rule as every other picker in the game — the choice is between
    // three RULES, so all three rules are on screen in full, with what each one is FOR underneath.
    const offers = (S.setout || []).map(o => ({ o, d: setoutById(o.k) })).filter(x => x.d);
    c.innerHTML =
      `<div class="phase-label">SETTING OUT</div>` +
      `<div class="setout">` +
      `<p class="setout-story">The workshop door closes behind you and the latch settles. ` +
      `Four regions of road, and then <b>${S.dragon.name}</b> at the end of them — ` +
      `everything you will have out there, you are carrying now.</p>` +
      `<p class="setout-ask">One last thing goes in the pack.</p>` +
      offers.map(({ o, d }) => `<button class="setout-offer r-${SETOUT_RARITY[d.bucket]}" onclick="pickSetout('${d.id}')">` +
        `<b>${d.name(o)}</b><span class="setout-text">${d.text(o)}</span>` +
        `<span class="setout-why">${d.why(o)}</span></button>`).join('') +
      `</div>`;
  } else if (S.phase === 'upgrade') {
    const can = S.hand.filter(c => upgradable(c));
    const cheapest = S.hand.filter(c => c.level < MAX_LEVEL && !S.downgraded.has(c.id))
      .map(c => eff(c).cost).filter(x => x != null).sort((a, b) => a - b)[0];
    c.innerHTML =
      `<div class="phase-label">🔼 SHARPEN — 🪙 ${S.coins}</div>` +
      `<div class="hint">Tap any card to see <b>exactly what it becomes</b>, then sharpen it. ` +
      (can.length ? `` : cheapest != null ? `You need <b>🪙 ${cheapest}</b> for the cheapest. ` : `Nothing here can be sharpened. `) +
      `A level makes a card <b>more itself</b> — its best stat rises and its worst falls.</div>` +
      `<button class="primary" onclick="doneUpgrades()">Done sharpening →</button>`;
  } else if (S.phase === 'wheel') {
    if (!S.wheel) S.wheel = { offers: spinWheel(false), rich: false, bought: [] };  // e.g. restored from a save
    const w = S.wheel;
    const canReroll = S.coins >= REROLL_COST;
    // 🔼 the forge half of the same purse — stated here so both prices are on one screen
    const canUp = S.hand.filter(cc => upgradable(cc));
    const cheapUp = S.hand.filter(cc => cc.level < MAX_LEVEL && !S.downgraded.has(cc.id))
      .map(cc => eff(cc).cost).filter(x => x != null).sort((a, b) => a - b)[0];
    const sharpenLine = canUp.length
      ? `🔼 <b>${canUp.length}</b> of your cards can be sharpened now — tap one below to see exactly what it becomes.`
      : cheapUp != null ? `🔼 Sharpening the cheapest card below needs <b>🪙 ${cheapUp}</b>.`
      : `🔼 Nothing in hand can be sharpened.`;
    const offers = w.offers.map((o, i) => {
      const afford = o.cost <= S.coins && o.kind !== 'none';
      const cls = `wheel-offer r-${o.rarity}${o.bought ? ' bought' : ''}`;
      return `<div class="${cls}">` +
        // 🏷️ every kind names ITSELF. Potions and contracts both fell through to the word
        // "UPGRADE" — left over from when the Wheel sold card levels — so the shop labelled three
        // different things with the name of a fourth that is no longer sold here.
        `<div class="wo-rar">${o.kind === 'charm' ? 'CHARM · ' + o.rarity
          : o.kind === 'potion' ? 'POTION · ' + o.rarity
          : o.kind === 'contract' ? '📜 QUEST'
          : o.kind === 'repair' ? 'MEND'
          : o.kind === 'none' ? '—' : String(o.kind).toUpperCase()}` +
        `</div>` +
        `<div class="wo-name">${o.name}</div><div class="wo-text">${o.text}</div>` +
        (o.bought ? `<div class="wo-taken">taken</div>`
          : o.kind === 'none' ? `<div class="wo-taken">—</div>`
          : `<button class="wo-buy" onclick="wheelBuy(${i})" ${afford ? '' : 'disabled'}>🪙 ${o.cost}${afford ? '' : ' — short'}</button>`) +
        `</div>`;
    }).join('');
    c.innerHTML =
      `<div class="phase-label">${w.rich ? '🔥 CAMP — THE LONG WHEEL' : '🎰 THE WHEEL'} — 🪙 ${S.coins}</div>` +
      `<div class="hint">You hold <b style="color:#c9b458">🪙 ${S.coins}</b> — and coins keep. ` +
      `Buy from the wheel, <b>sharpen your own cards below</b>, or bank it for a bigger pull later.` +
      (sharpenLine ? `<br>${sharpenLine}` : '') + `</div>` +
      `<div class="wheel-row">${offers}</div>` +
      `<button onclick="wheelReroll()" ${canReroll ? '' : 'disabled'}>🎲 Re-spin — 🪙 ${REROLL_COST}${canReroll ? '' : ' (short)'}</button>` +
      `<button class="primary" onclick="wheelDone()">${w.rich ? 'Break camp' : 'Move on'}</button>` +
      (S.charms.length ? `<div class="charm-tray">${S.charms.map(id => { const ch = charmById(id);
        return `<span class="charm-chip r-${ch.rarity}" title="${ch.text}">${ch.name}</span>`; }).join('')}</div>` : '');
  } else if (S.phase === 'event') {
    const def = currentEventDef();
    const ev = S.event;
    let body;
    if (ev.step === 'done') {
      // 🔑 The Mirror Fen could roll "+2 Pace" AND "-2 Pace" in one breath. Both lines were true,
      // both printed, and neither said they touched the same number - so working out that it had
      // cancelled was left to the player. An event must state where it LEFT you.
      const now = carried();
      // ⚠️ `now` is still read so the carried() call cannot drift out of this screen's dependencies.
      body = `<div class="summary">` +
        `<div class="event-outcome">${ev.lines.map(l => `<p>${l}</p>`).join('')}</div>` +
        carriedPanelHTML('You are carrying') + `</div>` +
        `<button class="primary" onclick="eventContinue()">Continue</button>`;
    } else if (ev.step === 'pickCard') {
      // the choice is made ON the cards below — this panel just states the deal
      body = `<div class="hint"><b>${def.options[ev.opt].label}</b><br>Pick the card from your hand below — its stats are right there on it.</div>` +
        `<button onclick="eventCancelPick()">← back</button>`;
    } else {
      // ⚠️ AN UNAFFORDABLE OPTION IS DISABLED AND SAYS WHY - IT IS NOT HIDDEN (2026-08-18).
      // Thomas, on the Toll of Thorns: *"i didn't have enough to pay, so i guess it didn't do
      // anything? confused"* - and he was right to be. The option was offered at full strength, he
      // spent his one event choice on it, and `apply()` checked the price only AFTER committing.
      // 🔑 SAME BUG AS THE 2026-08-05 PICKER FIX, IN A DIFFERENT CURRENCY. That one made
      // ineligible CARDS stay visible and say why; the coin cost never got the same treatment.
      // ⚠️ And `when` HID the option, which is worse than disabling for a price you might soon
      // afford: you learn neither that the option exists nor that you were short. Hiding is right
      // for a whole EVENT (a pool filter); it is wrong for one option on a screen you are reading.
      body = `<div class="event-flavor">${def.flavor}</div>` +
        `<div class="event-opts">` + def.options.map((o, i) => {
          // ⚠️ ASKS THE SAME FUNCTION THE RULE USES. This block held its own copy of the test,
          // which is how the bot came to be allowed a move the button had greyed out.
          const why = eventOptionBlocked(o);
          return `<button onclick="eventChoose(${i})"${why ? ` disabled title="${why}"` : ''}>${o.label}` +
            (why ? `<span class="opt-why">${why}</span>` : '') + `</button>`;
        }).join('') + `</div>`;
    }
    // ⚠️ THE LINE USED TO SAY "as the journey ends" AND THE RULE MOVED OUT FROM UNDER IT
    // (2026-08-18). Events are scheduled by the region now and follow a FIGHT about half the time.
    // 🔑 When a trigger changes, every sentence that described the old one is now a lie -
    // the fifth time this exact shape has bitten in one day.
    c.innerHTML = `<div class="phase-label">✦ EVENT — ${def.name}</div><div class="hint">The road gives you a moment. Nothing here costs you a card.</div>` + body;
  } else if (S.phase === 'defeat') {
    c.innerHTML = runEndHTML(false);
  } else if (S.phase === 'intro') {
    const i = Math.min(S.introPage || 0, TUTORIAL.intro.length - 1), pg = TUTORIAL.intro[i];
    const last = i === TUTORIAL.intro.length - 1;
    c.innerHTML =
      `<div class="phase-label">🎓 BEFORE YOU BEGIN</div>` +
      `<div class="intro">` +
        `<div class="intro-dots">${TUTORIAL.intro.map((_, n) => `<i class="${n === i ? 'on' : n < i ? 'seen' : ''}"></i>`).join('')}` +
          `<span class="intro-count">${i + 1} / ${TUTORIAL.intro.length}</span></div>` +
        `<h3>${pg.title}</h3><p>${pg.body}</p>` +
        `<div class="intro-nav">` +
          (i > 0 ? `<button onclick="introNext(-1)">← back</button>` : `<span></span>`) +
          `<button class="primary" onclick="introNext(1)">${last ? 'Begin ▸' : 'Next ▸'}</button>` +
        `</div>` +
      `</div>`;
  } else if (S.phase === 'menu') {
    const w = wallSummary();
    const cleared = stagesCleared();
    c.innerHTML =
      `<div class="menu">` +
      `<p class="menu-tag">A candle, sixteen cards, and something old at the end of the road.</p>` +
      (saveState() === 'ok'
        ? `<button class="primary menu-item" onclick="resumeRun()"><b>▶ Continue</b>` +
          `<span>pick up the run you left</span></button>`
        : saveState() === 'stale'
        ? `<div class="menu-note">⚠️ Your last run can't be restored — the game changed underneath it. ` +
          `Your cleared stages and grades are safe.</div>`
        : '') +
      // 📖 the tutorial gets its own door. It used to be the first button on the STAGES screen,
      // which meant a new player had to go looking for the thing that teaches them the game.
      `<button class="${(hasSave() || cleared) ? '' : 'primary '}menu-item" onclick="startStage(0)">` +
        `<b>📖 Tutorial</b>${gradeBadge(0, 'mage')}` +
        `<span>learn the game in one short run · always open</span></button>` +
      // ⚔️ "NEW GAME", not "Stages" (2026-08-23, Thomas). It is the door into a RUN, and a menu
      // should name what is behind a door in the player's words rather than the designer's. "Stages"
      // is our word for how the content is organised; "New Game" is what you are about to do.
      `<button class="menu-item" onclick="showStages()"><b>⚔️ New Game</b>` +
        `<span>${cleared ? `${cleared} of ${DRAGONS.length} felled` : 'four dragons, one at a time'} · 🏆 ${w.graded}/${w.total} graded</span></button>` +
      `<button class="menu-item" onclick="showWorkshop()"><b>⚒️ The Workshop</b>` +
        `<span>${workshopLine()}</span></button>` +
      `<button class="menu-item" onclick="showStash()"><b>📦 Stash</b>` +
        `<span>${stashLine()}</span></button>` +
      `<button class="menu-item" onclick="showCollection()"><b>🎁 Collection</b>` +
        `<span>the charms and potions you can be offered</span></button>` +
      (DEV_ENABLED ? `<button class="menu-item quiet" onclick="showDev()"><b>🔧 Dev</b>` +
        `<span>jump straight to a dragon</span></button>` : '') +
      // 🏷️ the stamp. A playtester's bug report is worth far more when it names a build, and
      // the status bar's copy only appears once a run is underway — too late to read on a crash.
      `<div class="menu-stamp">${CHANNEL === 'play' ? 'playtest build' : 'dev build'} ${BUILD}` +
        `${CHANNEL === 'play' ? ' · <b>found a bug?</b> say what the build number was' : ''}</div>` +
      `</div>`;
  } else if (S.phase === 'workshop') {
    c.innerHTML = workshopHTML();
  } else if (S.phase === 'stash') {
    c.innerHTML = stashHTML();
  } else if (S.phase === 'collection') {
    // 🔑 THE COLLECTION IS AN HONEST SHELF. It shows what CAN be offered and when — and says
    // plainly what is not built yet, rather than showing a button that lies.
    //
    // 🗂️ TWO SCREENS, NOT ONE SCROLL (2026-08-23, Thomas: *"lets have it show our account level and
    // exp bar, generic charms we have unlocked. and then be able to click on our characters, which
    // leads to a page where it shows our character level and exp bar, and charms we have unlocked
    // for that character"*).
    // 🔑 IT IS THE SAME SPLIT THE RULE ALREADY MAKES. One screen was showing three bars and four
    // lists stacked, which reads as *"a lot of charms"* rather than as **two ladders that mean
    // different things** — the very confusion renaming Mastery was meant to end. A screen per bar
    // states the rule by its shape: ⭐ what is open to everyone here, 🎭 what is open to HER there.
    // ⚠️ `S.collClass` is a SUB-STATE, not a new phase, deliberately — a new shell phase has to be
    // remembered in SHELL_PHASES or it crashes before a run exists, and that has bitten once.
    //
    // ⚠️ LOCKED THINGS ARE SHOWN, WITH THEIR LEVEL (Thomas: *"probably so players know what to
    // grind for"* — and he is right). It is this file's own rule: **a goal you cannot see is not a
    // goal**, and a locked charm shows its FULL text because *a goal you cannot read* is not one
    // either. This is the screen whose entire job is to be wanted.
    // ⚠️ It does NOT contradict the map's *"printing every demand is complete optimizable data"* —
    // that is about tactical information inside a run, which a player could solve against. A grind
    // target is the opposite: it is only worth anything if you can see it.
    const byId = id => CHARMS.find(x => x.id === id);
    const charmRow = (x, at, open) => `<div class="coll-row${at && !open ? ' is-locked' : ''}">` +
      `<b>${x.name}</b>` + (at && !open ? `<span class="coll-lock">${x.cls ? '🎭' : '⭐'} ${at}</span>` : '') +
      `<span class="coll-text">${x.text}</span></div>`;
    // ⚠️ A ROW MAY NOT BE A CHARM. `byId(u.id).cls` threw on the slot rungs the moment they were
    // added — the list had silently assumed its own contents for exactly one build.
    const rungs = cls => UNLOCKS.filter(u => unlockCls(u) === (cls || null)).map(u => {
      const open = u.level <= (cls ? classLevel(cls) : accountLevel());
      if (u.kind !== 'charm') return `<div class="coll-row is-boon${open ? '' : ' is-locked'}">` +
        `<b>${u.label}</b>` + (open ? '' : `<span class="coll-lock">⭐ ${u.level}</span>`) +
        `<span class="coll-text">${u.note || ''}</span></div>`;
      return charmRow(byId(u.id), u.level, open);
    });
    const starters = cls => CHARMS.filter(x => !x.curse && !UNLOCK_AT[x.id] && (x.cls || null) === (cls || null));
    const block = (head, list) => list.length
      ? `<div class="coll-tier"><h4>${head} <span class="dim">· ${list.length}</span></h4>${list.join('')}</div>` : '';
    // how many of a ladder you hold — the one number that says "keep going"
    const tally = cls => {
      const all = CHARMS.filter(x => !x.curse && (x.cls || null) === (cls || null));
      return `<b>${all.filter(charmUnlocked).length}</b> of ${all.length}`;
    };

    if (S.collClass) {
      // ── 🎭 A CHARACTER'S PAGE ────────────────────────────────────────────────
      const k = S.collClass, cls = CLASSES[k], t = cls && cls.trait;
      const open = classUnlocked(k);
      c.innerHTML =
        `<div class="phase-label">🎭 ${(cls && cls.name) || k}</div>` +
        // 🖼️ same contract as everywhere else: found by NAME, and a miss removes itself
        `<div class="coll-hero"><img alt="" src="art/classes/${k}.jpg?v=${BUILD}" onerror="this.remove()">` +
          `<div class="coll-hero-txt">` +
            (t ? `<b>${t.icon} ${t.name}</b><span>${t.text}</span>` : '') +
            (open ? '' : `<span class="dim">🔒 fell a dragon to unlock her</span>`) +
          `</div></div>` +
        xpBarHTML(k) +
        `<div class="hint">🎭 Her <b>level</b> rises only on runs you play as her. It opens the ` +
        `charms that name <b>her own rule</b> — nobody else can use them. You hold ${tally(k)}.</div>` +
        `<div class="coll">` +
          block('hers from the start', starters(k).map(x => charmRow(x))) +
          block('earned by playing her', rungs(k)) +
        `</div>` +
        `<button class="primary" onclick="showCollection()">← Collection</button>`;
    } else {
      // ── ⭐ THE ACCOUNT PAGE ──────────────────────────────────────────────────
      // 🎭 the roster reads as a shelf of characters, and every one of them is a door.
      const pickable = Object.keys(CLASSES).filter(k => rungs(k).length || starters(k).length);
      c.innerHTML =
        `<div class="phase-label">🎁 COLLECTION</div>` +
        `<div class="hint">Every encounter you walk earns xp on <b>both</b> bars, win or lose.<br>` +
        `⭐ <b>Level</b> opens the charms <b>any</b> class can use.<br>` +
        `🎭 A <b>character's level</b> opens what <b>she</b> can do — tap a character to see hers.</div>` +
        xpBarHTML(null) +
        `<div class="coll-cast">` + pickable.map(k => {
          const cls = CLASSES[k], t = cls && cls.trait, shut = !classUnlocked(k);
          return `<button class="cast${shut ? ' locked' : ''}" onclick="showCollection('${k}')">` +
            `<span class="cast-em">${(cls && cls.mark) || '✦'}</span>` +
            `<b>${(cls && cls.name) || k}</b>` +
            `<span class="cast-lv">🎭 ${classLevel(k)}<i>/${classCap(k)}</i></span>` +
            `<span class="cast-n">${tally(k)} charms</span>` +
            (shut ? `<span class="cast-lock">🔒 locked</span>` : '') + `</button>`;
        }).join('') + `</div>` +
        `<div class="coll">` +
          block('yours from the start', starters(null).map(x => charmRow(x))) +
          block('⭐ earned by playing at all', rungs(null)) +
        `</div>` +
        `<div class="coll-soon">🚧 <b>Not built yet:</b> the 🚫 <b>ban list</b> — one charm disabled ` +
        `per five unlocked, so you shape the pool without pre-solving the run.</div>` +
        `<div class="coll-soon">🧪 <b>${POTIONS.length} potions</b> in the shop pool, weighted toward the cheap ones.</div>` +
        `<button class="primary" onclick="showMenu()">← Back</button>`;
    }
  } else if (S.phase === 'dev') {
    const d = S.dev;
    const dragon = DRAGONS.find(x => x.stage === d.stage) || DRAGONS[0];
    const cfg = DEV_DECKS[d.deck];
    const pick = (k, val, label, on) =>
      `<button class="dev-pick${on ? ' on' : ''}" onclick="devSet('${k}','${val}')">${label}</button>`;
    c.innerHTML =
      `<div class="phase-label">🔧 DEV — JUMP TO THE LAIR</div>` +
      `<div class="dev">` +
      `<div class="dev-row"><span>Stage</span><div>` +
        DRAGONS.map(x => pick('stage', x.stage, `${x.stage} · ${x.name}`, d.stage === x.stage)).join('') +
      `</div></div>` +
      `<div class="dev-row"><span>Deck</span><div>` +
        Object.keys(DEV_DECKS).map(k => pick('deck', k, DEV_DECKS[k].label, d.deck === k)).join('') +
      `</div></div>` +
      `<div class="dev-row"><span>🕯️ Candle</span><div>` +
        pick('candle', 'true', 'Lit', d.candle) + pick('candle', 'false', 'Out', !d.candle) +
      `</div></div>` +
      // ⭐ the charm pool the run will draw from. ⚠️ Applies immediately and persists — it is the
      // real bar, not a pin, so a jump made here is the game a player at that level would get.
      `<div class="dev-row"><span>⭐ Account</span><div>` +
        [1, 3, 6, 9, LEVEL_CAP].map(n =>
          `<button class="dev-pick${accountLevel() === n ? ' on' : ''}" onclick="devLevel(${n})">` +
          `${n}${n === LEVEL_CAP ? ' (max)' : ''}</button>`).join('') +
      `</div></div>` +
      `<div class="dev-row"><span>🎭 ${CLASS.name}</span><div>` +
        Array.from({ length: classCap(CLASS.id) }, (_, i) => i + 1).map(n =>
          `<button class="dev-pick${classLevel(CLASS.id) === n ? ' on' : ''}" onclick="devClassLevel(${n})">` +
          `${n}${n === classCap(CLASS.id) ? ' (max)' : ''}</button>`).join('') +
      `</div></div>` +
      // 🛡️ one row per OPEN slot. ⚠️ A dev tool, and dev tools port last if ever — the real
      // picker is the Workshop, and this row is deleted the day it lands.
      Array.from({ length: armourSlotsOpen() }, (_, i) =>
        `<div class="dev-row"><span>🛡️ Slot ${i + 1}</span><div>` +
        pick('arm' + i, '', 'empty', !d['arm' + i]) +
        ARMOUR.map(x => pick('arm' + i, x.id, `${ARMOUR_SLOTS[x.slot].icon} ${x.name}`, d['arm' + i] === x.id)).join('') +
        `</div></div>`).join('') +
      `<div class="dev-row"><span>Charm</span><div>` +
        pick('charm', '', 'none', !d.charm) +
        CHARMS.filter(x => x.cls === CLASS.id).map(x => pick('charm', x.id, x.name, d.charm === x.id)).join('') +
      `</div></div>` +
      `<p class="dev-note">${dragon.name} — ${dragon.hp} HP · ${dragonShapeText(dragon)} · par <b>${dragon.par}</b>. ` +
      `<b>${cfg.label}</b>: ${cfg.cards} cards, about ${(dragon.par || 44) + cfg.offset} levels — <i>${cfg.hint}</i>.</p>` +
      `<button class="primary" onclick="devJump()">🐉 Jump to the lair</button>` +
      devSlotsHTML() +
      `<button onclick="showMenu()">← Menu</button>` +
      `</div>`;
  } else if (S.phase === 'ladder') {
    const cleared = stagesCleared();
    c.innerHTML =
      // ✍️ NO DESIGNER TALK ON A SCREEN THE PLAYER READS (2026-08-23, Thomas: *"no talk about
      // questions or shapes or any of that please"*).
      // 🔑 "Each stage is a different QUESTION, not simply a bigger number" and "the same dragon is
      // a different PROBLEM" are things WE say to each other about why the game is built this way.
      // They are the design's justification, not the player's information — and a menu is not the
      // place to argue for the design. **The stages are a list; the list says what it is.**
      // ⚠️ Same rule as the hardship rewrite: a rules string states the rule and nothing else.
      // Flavour belongs where it is read once, and a menu is read every single session.
      `<div class="phase-label">🗺️ THE STAGES</div>` +
      (() => { const w = wallSummary();
        return `<div class="wall-line">🏆 <b>${w.graded}</b> of ${w.total} graded` +
          (w.perfect ? ` · <b class="g-S">${w.perfect}</b> perfect` : '') + `</div>`; })() +
      // 🗡️ WHO ARE YOU TAKING? Sits ABOVE the stages because it changes what every one of them
      // means — the same dragon is a different problem to a different class, which is the whole
      // economy: +1 class = ×N content.
      // ⚠️ SHOWN FROM THE FIRST SECOND, even on a fresh account (2026-08-23, Thomas: *"even if its
      // a fresh account or w/e, we should show the character selector"*). It used to be hidden
      // entirely until the rogue was earned, on the reasoning that *a locked door you cannot read
      // is a tease* — but that reasoning was wrong for the ROSTER, because the roster is the single
      // best thing this game has to show a new player. Hiding it meant run one looked like a game
      // with one character.
      // 🔑 The Collection's own rule settles it: an HONEST SHELF beats an empty room. A locked class
      // that tells you its source of power and how to unlock it is an advertisement; a hidden one
      // is nothing at all.
      (() => {
        const picked = pickedClassId();
        // ⚠️ THE ROGUE'S OLD LINE WAS FALSE: *"strikes chain — many small ones"*. Her compose()
        // returns `hits: 1` - she lands ONE blow exactly like the mage. That text is left over from
        // when she was planned as a multi-hit class, and it promised the one thing she cannot do.
        // 🔑 A CLASS DESCRIPTION IS A PROMISE ABOUT THE RULES; this one would have sold a player
        // the answer to 🧱 Guard, which is precisely what she does not have.
        const row = (id, name, line) => {
          const cls = CLASSES[id], t = cls && cls.trait, open = classUnlocked(id);
          return `<button class="class-pick${picked === id ? ' on' : ''}${open ? '' : ' locked'}"` +
            (open ? ` onclick="pickClass('${id}')"` : ' disabled') + `>` +
            `<b>${name}</b>` +
            // 🎭 HER OWN LADDER, ON HER OWN CARD. The picker is where you choose who to play, so it
            // is the one screen where "how far along am I with her" is the deciding fact.
            (open && classCap(id) > 1
              ? `<span class="class-lv">🎭 ${classLevel(id)}<i>/${classCap(id)}</i></span>` : '') +
            `<span class="class-line">${line}</span>` +
            (t ? `<span class="class-trait"><b>${t.icon} ${t.name}</b> ${t.text}</span>` : '') +
            (open ? '' : `<span class="class-trait dim">🔒 fell a dragon to unlock her</span>`) +
            `</button>`;
        };
        // 🎭 THE PLANNED ROSTER, SHOWN LOCKED (2026-08-23, Thomas: *"i also want to add the classes
        // to our character selector, just to add some excitement about my ambitions for the future
        // of the game"*).
        // 🔑 EACH LINE IS ITS SOURCE OF POWER, because that is what a class IS here — the rule that
        // unlocks a card's big value. Never a matchup, never a stat: three defence shapes only
        // permit ~6 profiles, and a roster designed from its matchup table becomes reskins.
        // ⚠️ AN HONEST SHELF, the same rule the Collection follows: it says plainly that these are
        // not built rather than showing a button that lies. A locked thing you can SEE is a goal.
        // ✍️ FLAVOUR, NOT MECHANICS (2026-08-23, Thomas: *"lets make the description cooler. no em
        // dashes. straight to the point. like just give the flavor of the class, concise"*).
        // 🔑 These lines used to name each class's SOURCE OF POWER — "retaliation", "foreknowledge",
        // "declaration". That is the vocabulary from Class_System, and it is how WE tell the classes
        // apart while designing them. It is not what makes someone want to play one.
        // ⚠️ The old note said *a class description is a promise about the rules* (written after the
        // rogue's line promised multi-hit she did not have). That still holds for the TRAIT row,
        // which states the actual mechanic. A flavour line promises nothing, so it cannot lie.
        // ⚠️ "not built yet" is gone at his request; the dimmed, dashed, disabled styling carries it.
        // 🎭 the icon is its own element so the tile can lead with it — see .class-row.is-soon
        const soon = (icon, name, line) =>
          `<button class="class-pick locked" disabled><span class="soon-icon">${icon}</span>` +
          `<b>${name}</b><span class="class-line">${line}</span></button>`;
        // 🖼️ THE PORTRAIT — big, and it is the point of the screen.
        // 🔑 SAME CONTRACT AS foeArt(): found by NAME, and NOTHING BREAKS WHILE THE FOLDER IS
        // EMPTY. A miss removes itself and the frame falls back to the class emblem, so art never
        // blocks design and the screen is finished before a single picture exists.
        // ⚠️ The URL carries ?v=BUILD. An unversioned image cached once serves forever and looks
        // exactly like a failed render — this project has lost time to a cache three times.
        const hero = (() => {
          const cls = CLASSES[picked], t = cls && cls.trait;
          return `<div class="hero-art" id="hero-art">` +
            // ⚠️ .jpg, not .png. Key art has a solid dark ground and needs no alpha, and the PNG
            // was 2.2 MB against 197 KB for a JPEG at q90 — eleven times the weight for a channel
            // nothing uses. The FOE plates stay PNG because their transparency is the whole point.
            //
            // 🐛 NO `onload` GATE HERE, AND THAT IS THE FIX. It used to add a `has-art` class that
            // CSS faded the picture in with — and A CACHED IMAGE MAY NEVER FIRE `onload`, because
            // it can already be complete by the time the handler is attached. Result: the art was
            // fully downloaded, sitting at opacity 0, with the emblem showing over it. It worked
            // the first time and broke on every revisit, which is the worst way for a bug to
            // behave. (Same family as the 2026-08-12 scene flicker: a fade keyed to element
            // creation is a lie the moment anything re-renders.)
            // 🔑 THE PICTURE IS VISIBLE BY DEFAULT AND THE EMBLEM SITS BEHIND IT. A missing file
            // still removes itself via `onerror`, so the emblem shows through exactly as before —
            // the fallback is now a matter of STACKING, not of a class that has to be applied.
            `<img class="hero-img" alt="" src="art/classes/${picked}.jpg?v=${BUILD}" ` +
              `onerror="this.remove()">` +
            `<div class="hero-fallback">${(CLASSES[picked] && CLASSES[picked].mark) || '✦'}</div>` +
            `<div class="hero-cap"><b>${picked === 'rogue' ? '🗡️ The Rogue' : '✦ The Mage'}</b>` +
            `<span>${picked === 'rogue' ? 'cards pay for cards' : 'elements agree'}</span></div>` +
          `</div>`;
        })();
        // 🖼️ ART LEFT, ROSTER RIGHT — the classic character-select layout, and the panel was already
        // 1180px wide while the portrait sat at 313. Stacking them wasted two thirds of the screen
        // on empty margin and made the art small, which is the one thing it must not be.
        return `<div class="wall-line">🎭 <b>Character</b></div>` +
          `<div class="picker-split">` + hero + `<div class="picker-list">` +
          `<div class="class-row">` +
          row('mage', '✦ The Mage', 'A travelling spellcaster who draws her power from the elements.') +
          row('rogue', '🗡️ The Rogue', 'A duellist who fights with a pair of poisoned blades.') +
          `</div>` +
          `<div class="class-row is-soon">` +
          // 🔑 **TEN VISIBLE, AND THAT IS THE POINT** (Thomas, 2026-08-25). A roster is a promise,
          // and a promise gets less credible the longer it runs — twelve names with two playable
          // reads as a wish list, ten with two playable reads as a plan.
          // ❌ CUT 2026-08-25, PARKED NOT KILLED: ⚖️ the Paladin (declaration) and 🕯️ the Warlock
          // (sacrifice). Their source-of-power entries stay in [[Class_System]] — **the roster is a
          // shipping list, the axis table is a design space, and they are allowed to differ.**
          // ❌ 🧱 THE MASON IS GONE OUTRIGHT (Thomas: *"i don't know how the mason got into the
          // classes"*). Fair — I added it off Euro_Classes two days ago, and it never passed the
          // roster's own bar: *"a stoneworker whose work stays standing"* is 🏗️ the Engineer's
          // constructions with a different noun. 🔑 A class must fill slots ①②③ differently, and
          // if you cannot say how in one line each it is a re-skin. **Finding a name in a design
          // doc is not the same as that name having earned a slot.**
          // ❌ Euro_Classes' 🪵 Forager stays out for the same reason it always did — the doc calls
          // it "the re-skin the axis exists to prevent", because the Merchant already claims *a
          // resource you hold and spend*.
          soon('🎭', 'The Illusionist', 'A conjurer who fights from behind a wall of illusions.') +
          soon('⚗️', 'The Alchemist', 'A brewer who makes her own answers before she needs them.') +
          soon('🎲', 'The Berserker', 'A reckless fighter who leaves everything to chance.') +
          soon('🪙', 'The Merchant', 'A trader who pays for every blow out of her own purse.') +
          soon('🏗️', 'The Engineer', 'A builder who leaves working machines behind on the road.') +
          soon('🛡️', 'The Guardian', 'A heavy defender who turns every blow back on its owner.') +
          soon('🏹', 'The Ranger', 'A hunter who always knows what is coming next.') +
          soon('⚔️', 'The Knight', 'A disciplined fighter who shifts between combat stances.') +
          `</div></div></div>`;
      })() +
      // 📖 the tutorial lives on the MENU now — one door per thing

      DRAGONS.map(d => {
        const open = stageUnlocked(d.stage), done = d.stage <= cleared;
        return `<button class="${d.stage === Math.min(DRAGONS.length, cleared + 1) ? 'primary' : ''} stage${open ? '' : ' locked'}"` +
          (open ? ` onclick="startStage(${d.stage})"` : ' disabled') + `>` +
          `<b>${done ? '✔ ' : ''}Stage ${d.stage}: ${open ? d.name : '???'}</b>${open ? stageBadges(d.stage) : ''}` +
          // ❌ THE PICKER DOES NOT SPOIL THE DRAGON (2026-08-05, Thomas: *"lets remove what the
          // boss does, don't think we really need to show that off"*). It used to print the SHAPE
          // and the demand on every stage button.
          // 🔑 The turn-1 BRIEFING is where that belongs, and it is a designed moment: the run is
          // *soft-directional* because you learn the problem the instant it starts and then spend
          // twenty turns preparing for it. Printing the same facts on the menu spends the reveal
          // before the run exists, and turns choosing a stage into reading a stat block.
          // What the button says instead is about YOU — what you have done here, not what it does.
          `<span class="stage-shape">${!open ? 'Clear stage ' + (d.stage - 1) + ' to open.'
            : done ? 'Felled. Go again for a better grade.'
            : 'not yet felled'}</span>` +
          `</button>`;
      }).join('') +
      `<button class="dev-open" onclick="showMenu()">← Menu</button>`;
  } else if (S.phase === 'victory') {
    c.innerHTML = runEndHTML(true);
  } else if (S.phase === 'summary') {
    const survivors = [...S.hand, ...S.deck, ...S.discard];
    const score = survivors.reduce((t, c) => t + c.level, 0);
    const runDone = S.region >= RUN().length;
    c.innerHTML =
      `<div class="phase-label">${runDone ? `REGION ${RUN().length} CLEARED — THE ${S.dragon.name.toUpperCase()} AWAITS` : `END OF REGION ${S.region} — ${RUN()[S.region - 1].name}`}</div>` +
      `<div class="summary">` +
      `<p>Turns played: <b>${S.turn}</b> — Complete <b>${S.results.Complete}</b> · Narrow <b>${S.results.Narrow}</b> · Loss <b>${S.results.Loss}</b></p>` +
      `<p>Score so far (sum of surviving card levels): <b>${score}</b> · Lost from your deck: <b>${S.trashed.length}</b>${S.trashed.length ? ` (${S.trashed.map(c => c.def.name).join(', ')})` : ''}</p>` +
      `<table><tr><th>Card</th><th>Level</th></tr>` +
      survivors.sort((a, b) => b.level - a.level).map(c => `<tr><td>${c.def.name}</td><td>Lv${c.level}</td></tr>`).join('') +
      `</table></div>` +
      `<button onclick="startWheel(true)">🔥 Make camp — the long wheel (🪙 ${S.coins})</button>` +
      (runDone
        ? `<button class="primary" onclick="beginFinalBattle()">🐉 Face the ${S.dragon.name} — the Dragon Duel</button>` +
          `<button onclick="showStages()">Restart from scratch</button>`
        : `<button class="primary" onclick="nextRegion()">Enter ${RUN()[S.region].name} (Region ${S.region + 1}) — reshuffle, keep levels</button>` +
          `<button onclick="showStages()">Restart from scratch</button>`);
  }

  // 🎓 THE LESSON ROW BELONGS TO EVERY PHASE, NOT JUST `assign` (fixed 2026-08-23).
  //
  // 🔴 IT WAS BUILT IN EXACTLY ONE BRANCH while **nine lessons are gated on other phases** —
  // 🗺️ map, 🕯️ candle, 🦴 carve, soak, stack, wheel, charm, ⭐ levels and event. Every one
  // of them passed `nextLesson()` and **never reached the screen**, because whatever was rendering
  // at that moment did not draw a lesson row at all.
  //
  // 🔑 THIS IS *"A RULE THAT FIRES WITHOUT APPEARING"* — the same shape as the Guard reveal, the
  // multi-hit card face and the Momentum split. And my own tutorial audit walked straight past it,
  // because **it asked the RULE (does `nextLesson()` return something) and never asked the SCREEN.**
  // An audit that checks the model and not the view finds exactly the bugs it was built to find,
  // and no others.
  //
  // ⚠️ NOT CALLED HERE — see render(). This function has SEVEN early returns (map, hearth,
  // eliteboon, mendpick, hearthpick, fork, and assign-without-an-encounter), and every one of them
  // is a phase with a lesson. An injection at the bottom reaches none of them.
  // 🔑 The fix belongs one level up, for the same reason applyModal() lives in render()'s
  // `finally`: **a step that must happen for every phase cannot live inside a function that
  // returns early for half of them.**
}

// 🎓 put the lesson under the phase label of whatever screen is showing.
// ⚠️ Skips the shell (menu / Collection / Workshop): those exist outside a run, and a tutorial
// tip on the main menu would be pointing at nothing.
function injectLesson(c) {
  if (!c || isShell() || (S && S.lessonsOff)) return;
  if (c.querySelector && c.querySelector('.lesson-row')) return;   // the assign branch built its own
  const L = nextLesson();
  if (!L) return;
  const row = `<div class="lesson-row"><span>🎓 ${L.text}</span>` +
    `<span class="lesson-btns"><button class="primary" onclick="learned('${L.id}')">got it</button>` +
    `<button onclick="S.lessonsOff=true;render()">hide tips</button></span></div>`;
  const label = c.querySelector && c.querySelector('.phase-label');
  if (label && label.insertAdjacentHTML) label.insertAdjacentHTML('afterend', row);
  else c.innerHTML = row + c.innerHTML;
}

// hint shown under each zone label
// 🔑 EVERY SLOT STATES WHERE ITS CARD ENDS UP (2026-07-28). The Spell is SPENT - gone for the
// region - and nothing said so, which hid the best fork the turn already had: win comfortably
// with your Hammer, or scrape through with a lesser card and still have the Hammer at the
// dragon's door. Measured, the optimal Spell is simply your biggest-value card 89% of the time,
// because that choice is made without ever seeing its price. The solver cannot see it either -
// it optimises one encounter at a time and never pays the future cost.
// one line, three places (fight / journey / duel). It names the card that ACTUALLY attuned, which
// is the Catalyst normally, the Surge under ✦ Second Flame, and a non-matching Catalyst under
// ✦ Loose Weave - where it says so, because a half bonus with no explanation reads as a bug.
// 🗡️ THE ROGUE'S OWN ACTION LINES (2026-08-18). Found in play by Thomas, who screenshotted
// a reveal reading *"Attack: 12 - unattuned (Viper Strike is null, not null)"* above a big
// — 13 — and asked, reasonably: *"how did i do 13 dmg, why is it attuned, and what is viper
// strike is null not null"*. Three separate faults in one panel:
//   1. The whole beat was written in MAGE. `unattuned` interpolates ELEMENT names, and a rogue card
//      has `element: null`, so it printed "is null, not null".
//   2. `Surge: Viper Strike +0 → 12` - she has no ➕ Surge at all. Slot ③ is ENERGY and adds
//      nothing; the line was pure noise reporting a mage stat she does not own.
//   3. 🗡️ Whetstone silently added the missing +1. It appeared TWICE in 6,500 lines - its
//      definition and the one place it is applied - and NOWHERE in the reveal.
// 🔑 THE THIRD ONE IS THE REAL BUG: THE ARITHMETIC ON SCREEN DID NOT ADD UP TO THE NUMBER ON
// SCREEN. *Legible math always* is the project's first pillar, and a hidden charm term breaks it
// more completely than any wrong number would - a wrong number is a bug, an unexplained number is
// a game you cannot learn.
// ⚠️ The rule this earns: A CHARM THAT TOUCHES THE MATHS MUST APPEAR IN THE REVEAL. Same
// discipline as the 🧾 status-bar chips - if it changes a term, it says so.
function rogueActionLines(r, spell, L, verb) {
  const out = [];
  const rg = r.rogue || {};
  const fed = rg.fuelName ? `${rg.fuelName} paid ⚡${rg.paid}` : 'nothing paid';
  if (rg.full) out.push(L(`⚡ PAID — ${spell.def.name} strikes for its full ◆ ` +
    `${eff(spell).attuned} (${fed} against ⚡${rg.cost})`, 'good'));
  else out.push(L(`⚡ UNPAID — ${fed} against ⚡${rg.cost}, so ${spell.def.name} ` +
    `strikes for only ⚔️ ${eff(spell).value}`, 'bad'));
  if (rg.verbBonus) out.push(L(`🗡️ its combo adds +${rg.verbBonus}`, 'good'));
  if (rg.streakDmg) out.push(L(`● Momentum ${rg.streakDmg} — +${rg.streakDmg} to the strike`, 'good'));
  return out;
}
// 🐛 THIS LINE PRINTED A BREAKDOWN THAT DID NOT MATCH THE MATHS (found in play 2026-08-22).
// Thomas: *"this doesn't seem right, i used a potion, i shouldve done 13 dmg."* The DAMAGE was
// right — 10 — but the explanation read *"Atk 5 + 5 = 10"* when the real sum was **2 (card) + 2
// (half of 5) + 6 (potion)**. Two faults in one line:
//   1. it used `attBonus`, the bonus PRINTED ON THE CARD, even when ✦ Loose Weave had halved it;
//   2. it folded the potion silently into the left-hand number, so +6 vanished from view.
// 🔑 Both numbers were wrong and the total was right, which is the worst combination — the sum
// checks out, so nothing looks broken, and *legible math always* quietly stops being true.
// ⚠️ IT NOW ALWAYS ADDS UP BY CONSTRUCTION: anything the named terms do not account for is shown
// as a remainder rather than hidden, so this can never silently drift again.
function attunedLineText(r, spell, verb) {
  const src = r.attuner;
  const nm = src ? src.def.name : 'your Catalyst';
  const parts = [];
  const cv = r.cardVal != null ? r.cardVal : (r.base - r.attBonus);
  parts.push(`${cv}`);
  if (r.attApplied) parts.push(`+ ${r.attApplied}` +
    (r.loose ? ` <span class="dim">(half of ${r.attBonus})</span>` : ''));
  if (r.added) parts.push(`+ ${r.added} <span class="dim">🧪</span>`);
  const rest = r.base - cv - (r.attApplied || 0) - (r.added || 0);
  if (rest) parts.push(`${rest > 0 ? '+' : '−'} ${Math.abs(rest)}`);
  const sums = `${verb} ${parts.join(' ')} = ${r.base}`;
  if (r.loose) return `✦ ATTUNED loosely — ${nm} is not ${r.spellEl}, so Loose Weave gives ${looseWord()} → ${sums}`;
  return `✦ ATTUNED — ${nm} is ${src ? elOf(src) : r.spellEl} like ${spell.def.name} → ${sums}`;
}
// 🔑 THE SLOT HINT IS THE MOST-READ TEXT IN THE GAME — it is the one line under each label that
// says what THAT card will do THIS turn. It was written entirely in mage: the Combo slot offered to
// attune, and the Momentum slot offered to bank an Emberwake. Found in play 2026-08-17: *"the combo
// slot description doesn't make sense either, same with momentum"*.
// ⚠️ SLOT VOCABULARY WAS ALWAYS PER CLASS; THE SLOT'S EXPLANATION HAS TO BE TOO. Renaming
// Surge -> Momentum and leaving the sentence underneath is worse than not renaming it.
function zoneHint(zone) {
  const isFight = S.encounter && S.encounter.type === 'fight';
  if (CLASS.id === 'rogue') return rogueZoneHint(zone, isFight);
  switch (zone) {
    case 'Spell': return (isFight ? 'your Attack' : 'your Move') +
      (hasCharm('unspent') ? ' — ✦ SPENT only if you fall short' : ' — SPENT, gone for the region');
    case 'Element': {
      const sp = spellCard();
      if (!sp) return 'Initiative — returns to your deck';
      // ⚠️ the Catalyst may no longer be the thing that attuned — say who did
      const src = attunerCard(), here = cardById(S.assign.Element);
      if (!attunedNow()) return `Initiative — a ${elOf(sp)} card here would ATTUNE your Spell`;
      if (looseOnly()) return `✦ ATTUNED loosely — ${looseWord()} bonus · Initiative`;
      if (src && here && src !== here) return `Initiative — your Surge attuned the Spell`;
      return `✦ ATTUNED — ${elOf(sp)} matches · Initiative`;
    }
    case 'Boost': {
      const sc = cardById(S.assign.Boost), el = cardById(S.assign.Element);
      // ✦ Second Flame gives the Surge a second job — name it here or the slot lies about itself
      if (hasCharm('secondflame') && sc && spellCard() && attunerCard() === sc)
        return `✦ ATTUNES the Spell · +power now`;
      if (sc && S.bankArmed)
        return `🔥 CHANNELS — 🔥 ${bankValueOf(sc)} carried to next turn instead, ${bankCostPhrase(sc)}`;
      if (sc) return `+power now — or 🔥 bank it for next turn`;
      return '+power — returns to your deck';
    }
    case 'Reserve': return 'kept in hand for next turn';
  }
}

// 🗡️ The rogue's four lines. Every one names the MOMENTUM consequence, because that is the
// only thing this class's turn is about — and the arithmetic is stated, never implied.
function rogueZoneHint(zone, isFight) {
  const st = spellCard();
  const m = rogueMath();
  switch (zone) {
    case 'Spell': {
      if (!st) return isFight ? 'your Attack' : 'your Move';
      const e = eff(st);
      const disc = m.streakDmg ? ` <span class="good">(+${m.streakDmg} from ●)</span>` : '';
      return m.full
        ? `PAID — strikes for its full <b>◆ ${e.attuned}</b>${disc} · spent, gone for the region`
        : `costs <b>⚡ ${m.cost}</b>${disc}, paid <b>${m.paid}</b> — strikes for only <b>⚔️ ${e.value}</b>`;
    }
    case 'Element': {
      if (!st) return 'your Initiative — returns to your deck';
      // 🔑 name the VERB, not the fact that a verb happened. "PAIRED" tells you nothing.
      if (m.verb) return `🗡️ COMBO — ${ROGUE_VERBS[m.verb]} · and your Initiative`;
      return `your Initiative — <b>${st.def.combo}</b> here would fire its combo`;
    }
    case 'Boost': {
      const fuel = cardById(S.assign.Boost);
      if (!st) return 'a card here pays for your Strike';
      if (m.cost === 0) return `nothing to pay — this card simply returns to your deck`;
      if (!fuel) return `your Strike costs <b>⚡ ${m.cost}</b> — put a card here to pay it`;
      // ⚠️ NAME THE LEVEL, because the level IS the rule now. A card pitches LESS as it sharpens,
      // and a player not told that reads a low fuel number as a bad card rather than a sharp one.
      // ⚠️ "gives", not "pitches" - the player-facing word is ⚡ energy everywhere now
      const lvNote = ` <span class="dim">(Lv${fuel.level} · less energy as it sharpens)</span>`;
      return m.full
        ? `<b>⚡ ${m.paid}</b> energy — your Strike costs <b>${m.cost}</b>${lvNote} · returns to your deck`
        : `only <b>⚡ ${m.paid}</b> energy — your Strike costs <b>${m.cost}</b>${lvNote} · returns to your deck`;
    }
    case 'Reserve': return hasCharm('twinblades')
      ? 'kept — 🗡️ Twin Blades: it can pair too'
      : 'kept in hand for next turn';
  }
}

// 🔥 ARM THE BANK. It sits in the controls with the Emberwake's AIM row rather than on the Surge
// card, so the whole mechanic reads in one place: arm it here, aim it here next turn.
// ⚠️ It was drafted into the Surge slot's head first (the "decision belongs on the object" rule)
// and pulled back out: `.slot-head` is a FIXED 46px on purpose — a taller head staggers the whole
// four-slot row — so a button there needs a layout pass, not a guess. The Surge's slot hint still
// states what will happen to that card, which is the part that must live on the object.
// 🗡️ THE MOMENTUM ROW — the minigame, on screen.
// ⚠️ WHAT BREAKS THE STREAK MUST BE STATED BEFORE YOU COMMIT or it is a trap rather than a puzzle.
// Same treatment as the 🏃 Standing chip: show the TERMS and let the player do the arithmetic.
// 🔑 It reads off rogueMath(), the same function the damage does, so the number you are shown and
// the number you get cannot drift.
// 🎴 WAS momentumRowHTML(). Everything it said about the streak — what it is worth and what takes
// it away — is on the ● token now, so all that is left here is the PROMPT: the rogue's maths needs
// a Strike before it can say anything at all.
// ⚠️ RENAMED RATHER THAN GUTTED IN PLACE. A function still called momentumRowHTML that no longer
// draws momentum is the "a comment that describes a system is not the system" trap, one level down.
function strikePromptHTML() {
  if (!CLASS.momentum || !isAssignPhase()) return '';
  if (rogueMath()) return '';
  return `<div class="wake-row bank-row"><span class="wake-lab">🗡️ Put a card under <b>STRIKE</b>.</span></div>`;
}

function bankRowHTML() {
  if (!hasEmberwake() || !isAssignPhase()) return '';
  const sc = cardById(S.assign.Boost);
  if (!sc) return '';
  // 🔑 SHOW BOTH TERMS. The whole point of channelling is that it pays MORE than it costs, and a
  // trade whose two sides are not on screen together is not a decision — it is a guess.
  // 🐛 This line used to print `+${bankValueOf(sc)} power now`, i.e. the BANKED figure labelled as
  // the spent one. Harmless while the two were equal; the moment interest existed it would have
  // been a straight lie about the cheaper half. *When a value gains a modifier, find every line
  // that prints the unmodified one.*
  const now = eff(sc).boost, later = bankValueOf(sc);
  const on = !!S.bankArmed;
  return `<div class="wake-row bank-row"><span class="wake-lab">🔥 Your <b>Surge</b> — ` +
    (on ? `channelling: <b>+${later}</b> next turn <span class="dim">(instead of +${now} now)</span>`
        : `<b>+${now}</b> now <span class="dim">— or <b>+${later}</b> channelled</span>`) + `</span>` +
    `<button class="wake-btn${on ? ' on' : ''}" onclick="toggleBank()">` +
    (on ? 'spend it now instead' : `⟳ channel it`) + `</button>` +
    // ⚠️ STATE THE RULE, NOT A COMPUTED RATIO. This read `worth ${later/now}×`, which prints
    // "2.0×" on a Surge worth 1 (ceil rounds it up) and "1.5×" on a big one — technically true and
    // exactly backwards as a teaching line, since the point of a proportional bonus is that the
    // BIG Surge is the one worth channelling. The two numbers are already on screen above; this
    // slot should say WHEN, not restate WHAT.
    `<span class="wake-note">${on ? 'nothing this turn' : 'one bigger blow next turn — and 🛡️ Armour only subtracts once'}</span></div>`;
}

// a one-word mark of the card's fate, shown on the card itself during the action phase
// ⚠️ ASK THE CLASS WHAT IT IS ABOUT TO EAT (2026-08-17). This read the ZONE alone, so a rogue's
// ⚡ Energy card — which is burned to pay for the Strike — sat there promising "↻ returns" right
// up until it was destroyed. 🔑 Never state a rule about an object without marking the object,
// and never let the object state the WRONG rule about itself.
function fateOf(zone, id) {
  if (id != null && CLASS.spentIds && CLASS.spentIds().includes(id) && zone !== 'Spell')
    return { cls: 'fate-spent', text: '🔥 burned' };
  if (zone === 'Spell') return { cls: 'fate-spent', text: '⊘ spent' };
  if (zone === 'Reserve') return { cls: 'fate-kept', text: '✋ kept' };
  if (zone) return { cls: 'fate-return', text: '↻ returns' };
  return null;
}

// ONE row, four fixed labels, cards swap between them. Replaces the old zones + hand panels.
function renderSlots() {
  const panel = $('slots-panel');
  if (S.phase === 'summary' || S.phase === 'defeat' || S.phase === 'victory') { panel.innerHTML = ''; return; }
  const dnd = isAssignPhase();
  panel.innerHTML = ZONES.map(zone => {
    const cards = [cardById(S.assign[zone])].filter(Boolean);
    const head = `<div class="slot-head"><span class="slot-name">${SLOT_LABEL[zone].toUpperCase()}` +
      `</span><span class="slot-hint">${zoneHint(zone)}</span></div>`;
    return `<div class="slot slot-${zone} ${cards.length ? 'filled' : ''}"` +
      (dnd ? ` ondragover="dragOver(event)" ondragleave="dragLeave(event)" ondrop="dropOn(event, '${zone}')" onclick="tapZone('${zone}')"` : '') +
      `>` + head +
      (cards.length ? `<div class="pile">${cards.map(cardHTML).join('')}</div>`
                    : `<div class="slot-empty">— empty —</div>`) +
      `</div>`;
  }).join('') + spareRowHTML();
}

// 🗡️ THE SPARE. With five cards and four slots, one card has no seat — and
// `normalizeAssign` promises every card is "always slotted and visible", which it cannot keep.
// ⚠️ AN INVISIBLE CARD IS A CARD YOU CANNOT CHOOSE, so the extra is shown here instead, and
// tapping it swaps it into the row through the same path every other card uses.
// 🔑 IT SLIDES UNDER THE DECK AT CLEANUP FOR FREE — `returning` already sweeps everything that
// is not kept or held, so the spare needed no new rule at all.
function spareRowHTML() {
  if (!isAssignPhase()) return '';
  const seated = new Set(ZONES.map(z => S.assign[z]).filter(Boolean));
  const spare = S.hand.filter(c => !seated.has(c.id));
  if (!spare.length) return '';
  // ⚠️ SAY THE ACTUAL GESTURE. It read "tap to swap one in", but this is the row's usual TWO-tap
  // swap: the drawn card, then the card it replaces. A label that describes a gesture the player
  // does not have is the picker rule again - offering something you cannot act on.
  return `<div class="spare-row"><div class="spare-lab">🗡️ drawn — tap one, then tap the card ` +
    `it replaces · ${spare.length > 1 ? 'the rest slide' : 'the other slides'} under your deck</div>` +
    `<div class="pile">${spare.map(cardHTML).join('')}</div></div>`;
}

// Per-card visual identity (2026-07-06): each card wears its own arcane SIGIL — a mage's mark,
// magic-as-craft — as a faint watermark, tinted by the element it SEEKS to Attune (its aura hints
// what it becomes when attuned). Witch Hat register: crafted wonder, restrained. See Card_Identity_And_Attachment.
// 🗡️ the rogue's eight. ⚠️ Without these the watermark falls back to '✦' — the MAGE's attune
// glyph — on every rogue card, which is a third of the reason Thomas asked "why is there still a
// star". A default that belongs to one class is not a default.
const SIGIL = {
  'Viper Strike': '➤',
  'Second Fang': '⋀',
  'Venom Needle': '⌇',
  'Lethal Dose': '◈',
  'Slow Poison': '≈',
  'Sleight of Hand': '⤨',
  'Shadow Double': '⧉',
  'Ghostblade': '◊',

  'Emberfall': '✷',
  'Firstlight': '☀',
  'Bellowsbreath': '≋',
  'Hearthwall': '⌂',
  'Tidebreak': '≈',
  'Riverstep': '➶',
  'Wellspring': '❋',
  'Rimeguard': '❈',
  'Sparkstrike': '✦',
  'Quickfire': '⚡',
  'Stormglass': '◈',
  'Staticwall': '⌗',
  'Rockfall': '⁂',
  'Flintdart': '➹',
  'Deepvein': '⬗',
  'Cairnguard': '⬢',
};
const ACCENT = { Fire: '#ff9e7a', Water: '#9ecfff', Lightning: '#fff29e', Stone: '#cdbe98' };

// role buttons shown on a tapped card — the easy path: tap card → tap a role (no hunting for zones)
const ROLE_BTNS = [['Spell', 'Spell'], ['Element', 'Catalyst'], ['Boost', 'Surge'], ['Reserve', 'Arsenal']];
function roleButtons(card) {
  const cur = zoneOf(card.id);
  const btns = ROLE_BTNS.map(([role, label]) => {
    const active = cur === role;
    return `<button class="rolebtn r-${role} ${active ? 'active' : ''}" onclick="event.stopPropagation(); assignRole(${card.id}, '${role}')">${label}${active ? ' ✓' : ''}</button>`;
  }).join('');
  return `<div class="role-bar">${btns}</div>`;
}

function cardHTML(card) {
  // 🔼 THE UPGRADE PREVIEW. Thomas: *"it should basically look like the card but in its upgraded
  // form. i don't want to just see text saying what number changes to what number."*
  // 🔑 So we render THE SAME CARD RENDERER against a card one level higher. A hand-written preview
  // could drift from the real thing; this one cannot, by construction - it is the real thing.
  const real = card;
  const previewing = canSharpenNow() && S.upgradePick === card.id && card.level < MAX_LEVEL;
  if (previewing) card = { ...card, level: card.level + 1 };
  const v = eff(card);
  const d = card.def;
  const wasDowngraded = S.downgraded.has(card.id);
  const dnd = isAssignPhase();
  const shownEl = d.element;

  // the Attuned line shows what the card becomes when its element is matched
  // No attuned line any more - a card has one value, and pouring it into the pile is what
  const contributes = cardValue(card);
  // ✦ the attuned value sits beside the raw one on EVERY card, because you have to be able to
  // price the trade before you place anything. It lights up only on the pair that is live.
  const attV = eff(card).attuned;
  const attLive = attunedNow() && (zoneOf(card.id) === 'Spell' || zoneOf(card.id) === 'Element');
  // 🐛 A LOOSE ATTUNE LOOKED EXACTLY LIKE A FULL ONE (found in play 2026-08-22). ✦ Loose Weave
  // makes ANY Catalyst attune, so `attunedNow()` is true either way — and the card lit the same
  // gold "✦ attuned!" glow whether you had earned the whole bonus or half of it.
  // 🔑 Thomas: *"the stone and lightning color are too similar, i got that mixed up, i thought it
  // was a full atune."* The colours are half the story; the other half is that **the game
  // confirmed his misreading.** A signal that fires identically for two different outcomes is not
  // a signal. Same class as 🧱 Guard having no reveal line — the rule fired, nothing marked it.
  const looseLive = attLive && looseOnly();
  const enhLine = d.wild ? '🌈 Wild' : '';
  const forged = '';

  let action = '';
  if (isAssignPhase() && S.potionPick) {
    // ⚠️ A PICKER MUST NEVER OFFER WHAT IT CANNOT ACT ON — same rule the event pickers learned.
    const p = potionById(S.potionPick);
    action = potionCan(p, card)
      ? `<div class="card-action"><button onclick="usePotionOn(${card.id})">🧪 Use the ${p.name} here</button></div>`
      : `<div class="card-action muted">${p.why || 'not this one'}</div>`;
  } else if (isAssignPhase() && S.selectedId === card.id) {
    action = roleButtons(card);
  }
  if (S.phase === 'stack') {
    const st = S.stack;
    if (st && st.ids.includes(card.id)) {
      const pos = st.order.indexOf(card.id);
      const rev = hasCharm('reversed');
      if (pos >= 0) {
        const where = st.dest[card.id] === 'top' ? '↑ top of the deck' : '↓ under the deck';
        action = `<div class="card-action muted">${'①②③④'[pos]} · ${rev ? where : (pos === 0 ? 'returns first' : pos === st.ids.length - 1 ? 'returns last' : 'returns next')}</div>`;
      } else if (rev) {
        // 🃏 the charm's whole decision, on the card it is about
        action = `<div class="card-action stack-two">` +
          `<button onclick="stackPick(${card.id},'top')">↑ Top — next hand</button>` +
          `<button onclick="stackPick(${card.id},'bottom')">↓ Bottom — much later</button></div>`;
      } else {
        action = `<div class="card-action"><button onclick="stackPick(${card.id})">Place ${'①②③④'[st.order.length]} — draw this back ${st.order.length === 0 ? 'soonest' : 'after'}</button></div>`;
      }
    } else {
      action = `<div class="card-action muted">stays in hand</div>`;
    }
  } else if (S.phase === 'mendpick') {
    action = `<div class="card-action"><button class="primary" onclick="hearthMendPick(${card.id})">` +
      `🧵 Take this one back</button></div>`;
  } else if (S.phase === 'hearthpick') {
    // 🔧 the hearth's forge. ⚠️ Same rule as every picker here: it lives ON the card, and a
    // card that cannot take it stays VISIBLE and says why.
    const can = card.level < MAX_LEVEL && !wasDowngraded;
    action = can
      ? `<div class="card-action"><button class="primary" onclick="hearthForge(${card.id})">` +
        `🔧 Sharpen → Lv${card.level + 1}</button></div>`
      : `<div class="card-action muted">${card.level >= MAX_LEVEL ? 'already at Lv' + MAX_LEVEL : 'softened this turn'}</div>`;
  } else if (S.phase === 'soak') {
    if (!wasDowngraded) {
      const soak = soakValue(card);
      action = `<div class="card-action"><button onclick="soakWith(${card.id})">Block ${soak} — drops a level${card.level === 1 ? ' ⚠️ Lv1: LEAVES YOUR DECK' : ''}</button></div>`;
    } else {
      action = `<div class="card-action muted">already downgraded</div>`;
    }
  } else if (S.phase === 'event' && S.event && S.event.step === 'pickCard') {
    // Events used to pick a target from a list of bare NAMES — you couldn't see the stats you
    // were about to change, which on the Rewiring Pool means you couldn't see what the card
    // already seeks. Choose on the card itself, like soak/stack/upgrade already do.
    const opt = currentEventDef().options[S.event.opt];
    action = eventCanPick(opt, card)
      ? `<div class="card-action"><button onclick="eventPickCard(${card.id})">Choose this one</button></div>`
      : `<div class="card-action muted">${opt.pickNote || 'not this one'}</div>`;
  // ⏳ THE SHOP MUST SAY WHY IT IS SHUT. Without this the card simply offers no sharpen button at
  // a Wheel and the player is left to guess — *never state a rule about an object without marking
  // the object*, and a cost you cannot see being charged is the phantom problem in reverse.
  } else if ((S.phase === 'upgrade' || S.phase === 'wheel') && S.delayed > 0) {
    action = `<div class="card-action muted">⏳ you arrived too late to sharpen — ` +
      `${S.delayed} more encounter${S.delayed === 1 ? '' : 's'}</div>`;
  } else if (canSharpenNow()) {
    // ⚠️ every number here reads off `real`, never the previewed copy — the cost of the NEXT
    // level is not the cost printed by the level you are looking at.
    if (real.level >= MAX_LEVEL) {
      action = `<div class="card-action muted">already at Lv${MAX_LEVEL}</div>`;
    } else if (S.downgraded.has(real.id)) {
      action = `<div class="card-action muted">blocked this turn — cannot sharpen</div>`;
    } else {
      const cost = eff(real).cost;
      const ok = cost <= S.coins;
      // ⚠️ A GATE MUST SAY WHY. One level per card per visit is invisible unless the card
      // announces it - and a button that simply stops working reads as a bug, not a rule.
      // Same discipline as the event pickers: ineligible stays VISIBLE and states its reason.
      if (sharpenedHere(real.id)) {
        action = `<div class="card-action"><button disabled>` +
          `🔼 sharpened — one level per visit</button></div>`;
      } else action = previewing
        ? `<div class="card-action"><button class="primary" onclick="buyUpgrade(${real.id})" ${ok ? '' : 'disabled'}>` +
          `Sharpen to Lv${real.level + 1} — 🪙 ${cost}${ok ? '' : ' (not enough)'}</button>` +
          `<button onclick="pickUpgrade(${real.id})">back</button></div>`
        : `<div class="card-action"><button onclick="pickUpgrade(${real.id})">See Lv${real.level + 1} — 🪙 ${cost}</button></div>`;
    }
  }

  // 🗡️ is THIS card's ✦ live right now? Only meaningful while it is the Strike.
  const paidLive = !CLASS.pairs && zoneOf(card.id) === 'Spell' && (() => { const m = rogueMath(); return !!(m && m.full); })();
  // ⚠️ DECLARED ABOVE ITS USE, DELIBERATELY. It was below, and `vals` reads it — a temporal dead
  // zone that threw on every card render. Exactly the POTION_CAP bug: a `const` used earlier in the
  // file than it is declared is not a warning, it is a blank screen.
  // Attack/Move centerpiece: always two rows, consistent across all cards.
  // Each stat is TAGGED so CSS can quiet whatever this encounter/slot doesn't use — the
  // numbers never leave (legible math), they just stop shouting all at once.
  // ONE value: the encounter decides whether it reads as damage or as progress.
  const valIcon = (S.encounter && S.encounter.type === 'journey') ? '👣' : '⚔️';
  // ⚠️ THE ✦ ATTUNED NUMBER IS A MAGE FACT AND MUST NOT BE PRINTED FOR A CLASS THAT CANNOT
  // ATTUNE (found in play 2026-08-17, Thomas: *"why is there still a attune number with a star"*).
  // 🔑 I GATED THE RULE AND LEFT ITS DISPLAY BEHIND — exactly what "when a rule is cut, the same
  // commit removes its display" exists to prevent. The rogue was showing a second number for a
  // mechanic it does not have, which is worse than a missing number: it invites a wrong theory.
  // A rogue card instead prints the one word that decides its whole turn.
  // 🎯 A CARD THAT STRIKES TWICE HAS TO SAY SO. Sparkstrike has landed two blows since it was
  // written and its face never mentioned it - a rule the card does not print, the same fault as the
  // archetype-gated charms.
  // ⚠️ Printed PER-HIT × COUNT, not total × count. The total is SPLIT, so "23×2" would promise
  // 46; "11×2" is what actually lands - and it is the number that matters against 🛡️ Armour,
  // because armour comes off each blow separately.
  // 🔑 ASK THE CLASS HOW MANY BLOWS THIS CARD WOULD LAND, rather than reading `d.hits` off the def.
  // ● a full Momentum meter splits the rogue's Strike in two, and reading the DEF meant that never
  // appeared on the card — the rule fired and the face said nothing. Same class of bug as 🧱 Guard
  // having no reveal line and the Surge row printing the banked figure: *a rule that fires without
  // appearing.* ⚠️ The split applies only in the STRIKE slot, so the slot has to be passed in.
  const isStrike = !!(S.assign && S.assign.Spell === real.id);
  const nHits = CLASS.hitsOf ? CLASS.hitsOf(card, isStrike) : (d.hits || 1);
  // 🔑 AND THE BONUSES LAND ON EACH BLOW, SO THE FACE MUST SAY SO. Thomas: *"if a card does 8x2,
  // any added damage like a +4 potion, will make it 12x2."* That is a statement about what the
  // CARD READS, so showing 8x2 while the maths does 12x2 would be the same bug as 🧱 Guard having
  // no reveal line — a rule that fires without appearing, for the fourth time today.
  const perAdd = (isStrike && SPLIT_ADDS_PER_HIT && CLASS.perHitBonus) ? CLASS.perHitBonus(card) : 0;
  const per = n => nHits > 1 ? `${Math.floor(n / nHits) + perAdd}<span class="v-x">×${nHits}</span>` : `${n + perAdd}`;
  const vals = `<div class="card-val v-one">${valIcon} ${per(contributes)}` +
    (CLASS.pairs
      // ⚠️ AND THE NUMBER MUST BE THE ONE THIS ARRANGEMENT ACTUALLY GIVES. It printed the card's
      // full attuned value even while Loose Weave was halving it — so the card promised 13 and the
      // charm quietly delivered 10, which is precisely the misread above.
      ? `<span class="v-att${attLive ? ' att-live' : ''}${looseLive ? ' is-loose' : ''}" title="${looseLive
            ? looseWord() + ' of the bonus — your Catalyst does not share its element (✦ Loose Weave)'
            : 'its value when the Catalyst shares its element'}">✦${per(looseLive
            ? v.value + Math.floor((attV - v.value) / 2) : attV)}</span>`
      // ⚠️ ◆, NOT ✦. ✦ is the MAGE's attune star and it was doing rogue duty for "paid
      // damage" - the same borrowed-vocabulary fault as the reveal printing "unattuned" at her.
      // 🔑 ◆ is the DAMAGE you get once the energy is paid — a different kind of number from
      // ⚡ itself, so it keeps its own mark. ✦ is the mage's again.
      : (d.energy ? `<span class="v-att${paidLive ? ' att-live' : ''}" title="its damage when its ⚡ cost is paid in full">◆${per(v.attuned)}</span>` : '')) +
    `</div>`;

  const slot = zoneOf(card.id);
  const verb = verbOf(card);
  const verbLit = !!(verb && (verb.slot === 'soak' ? S.phase === 'soak' : slot === verb.slot));
  const fate = (isAssignPhase() && slot) ? fateOf(slot, card.id) : null;
  // ⚖️🐌🌀 name the barred card outright — "your heaviest" is not something you can read off a row.
  //
  // 🐛 THIS SAID THE WRONG RULE, AND SAID IT ABOUT A CARD THAT WAS CORRECTLY PLACED (2026-08-22,
  // found in play). It hard-coded 🐌 Mire's wording for ANY ban on the Catalyst — so under
  // 🌀 Vertigo, which bars the fastest card from every slot EXCEPT the Spell, the card sitting
  // happily in the Spell announced *"too fast for the CATALYST"*. Two faults at once:
  //   1. it stated Mire's rule while Vertigo was the one in force, and
  //   2. it warned about a card that was exactly where the hardship wanted it.
  // 🔑 A MARKER EXISTS TO TELL YOU SOMETHING YOU NEED. One that fires on a correct placement reads
  // as an error and teaches the player to ignore the label — worse than no label at all.
  // ⚠️ So it asks which zones are ACTUALLY banned right now and phrases from that, rather than
  // guessing the hardship from a single probe.
  const barred = (() => {
    if (!isAssignPhase() || !S.hardship) return null;
    const banned = ZONES.filter(z => placementBan(card.id, z));
    if (!banned.length) return null;
    const here = zoneOf(card.id);
    // pinned to one slot (🌀 Vertigo) — say nothing once it is there; there is nothing to warn about
    const allowed = ZONES.filter(z => !banned.includes(z));
    if (allowed.length === 1) return here === allowed[0] ? null : `🌀 must be your ${SLOT_LABEL[allowed[0]].toUpperCase()}`;
    if (banned.includes('Spell')) return '⚖️ too heavy for the SPELL';
    if (banned.includes('Element')) return `🐌 too fast for the ${SLOT_LABEL.Element.toUpperCase()}`;
    return `⚠️ barred from the ${SLOT_LABEL[banned[0]].toUpperCase()}`;
  })();
  const ctx = (S.encounter && S.encounter.type === 'journey') ? 'ctx-journey' : 'ctx-fight';
  const isMate = pairMateId() === card.id;
  const slotCls = (slot ? `in-${slot}` : '') + (attLive ? (looseLive ? ' attuned-pair is-loose' : ' attuned-pair') : '') +
    (previewing ? ' card-preview' : '') + (isMate ? ' pair-mate' : '');
  const resoOn = false;   // resonance is gone - depth replaced it
  const boostPicker = '';

  const tint = d.wild ? 'card-el-wild' : shownEl ? `card-el-${shownEl}` : 'card-el-none';
  // sigil watermark + seek-element accent glow (wild gets its own prismatic aura via .card-el-wild)
  // 🗡️ a rogue card wears its PAIR's mark; a mage card keeps its own.
  const sigil = (!CLASS.pairs && d.pair && PAIR_SIGIL[d.pair]) || SIGIL[d.name] || '✦';
  const accent = d.wild ? null : (ACCENT[enhElOf(card)] || '#cfc9ba');
  const sigilStyle = accent ? `--accent:${accent};` : '';
  // while fuse is armed, highlight the valid partners you can tap

  return `<div class="card ${tint} ${ctx} ${slotCls} ${wasDowngraded ? 'downgraded' : ''} ${dnd ? 'grabbable' : ''} ${S.selectedId === card.id ? 'selected' : ''}" style="${sigilStyle}"` +
    (dnd ? ` draggable="true" ondragstart="dragStart(event, ${card.id})"` +
           ` onclick="event.stopPropagation(); tapCard(${card.id})"` +
           `` : '') + `>` +
    `<div class="card-sigil" aria-hidden="true">${sigil}</div>` +
    `<div class="card-head"><span class="card-name">${displayName(card)}${forged}</span><span class="card-level">Lv${card.level}</span></div>` +
    // ⚠️ THE MAGE'S ELEMENT CHIP IS GONE FROM THE TOP - the type line at the foot now carries
    // it, and printing it twice is the "symbol soup" the element-disclosure rule exists to stop.
    // 🔑 `elChip` had NO slot logic: it rendered what the card IS, unconditionally, so it was
    // saying exactly what the foot says. And the card's TINT already encodes the element, which is
    // why the vault's note says the dimmed half is never deleted - the colour keeps carrying it.
    (CLASS.pairs ? (d.hits > 1 ? `<div class="el-identity"><span class="fork-tag">⚡ ${d.hits} hits</span></div>` : '')
                 // ⚠️ LABELLED, NOT JUST GLYPHED (2026-08-18). Thomas, reading a reveal:
                 // *"how was second fang paid, it costs 3, viper strike has 2 energy to pay"* -
                 // and he was reading the card exactly as it was written. ⚡2 is what Viper Strike
                 // costs to STRIKE WITH; ◇4 is what it PAYS as fuel. Two bare numbers side by side
                 // with no words, and 🔑 THE INTUITIVE READ IS THE WRONG ONE, because ⚡ is the
                 // cost glyph everywhere else in the game, so it looks like the number that pays.
                 // ⚠️ The old version explained itself in `title=` attributes. This is played daily
                 // on a phone, WHERE TOOLTIPS DO NOT EXIST - so the explanation was invisible to the
                 // only player it had. Three characters of label beat any hover text.
                 // 🔑 DISCLOSURE BY POSITION - the rule this game already uses for the mage's two
                 // element facts, applied to the rogue's two energy facts. Thomas: *"ah the energy
                 // and pitch can't be 1 number?"* They cannot (the level tradeoff needs them moving
                 // in opposite directions), but only ONE of them is ever being read:
                 //   ① STRIKE  -> its COST is what matters. Dim the other.
                 //   ③ ENERGY  -> its ENERGY is what matters. Dim the other.
                 // ⚠️ COST / ENERGY, not NEEDS / GIVES (2026-08-18). Thomas asked for "energy" to
                 // match the slot name and I invented a verb pair instead - which read as two new
                 // words to learn rather than one word already on the screen. The slot is ENERGY,
                 // so the number it reads is ENERGY, and the other one is what the card COSTS.
                 // ⚠️ ONE GLYPH, ONE WORD (2026-08-18). Thomas: *"maybe it should be called energy
                 // instead of fuel, the slot is called energy anyways, would make it match."*
                 // 🔑 AND IT GOES FURTHER THAN A RENAME: IT IS NOT TWO RESOURCES, IT IS ONE
                 // RESOURCE ASKED TWICE. ⚡ energy is what a card NEEDS to be struck with and what it
                 // GIVES when fed. Printing them as ⚡ and ◇ taught two symbols for one thing, which
                 // is the same vocabulary sprawl that had the rogue reading the mage's ✦.
                 // That is also the honest answer to "can't it be 1 number?" - it IS one number.
                 // ⚠️ DIMMED, NEVER DELETED - same as the element rule. The number is still there
                 // when you go looking; it just stops competing for the glance.
                 : (() => {
                     const reads = slot === 'Boost' ? 'pitch' : slot === 'Spell' ? 'cost' : null;
                     const cD = reads === 'pitch' ? ' num-dim' : '';
                     const pD = reads === 'cost'  ? ' num-dim' : '';
                     return `<div class="el-identity pair-identity">` +
                       `<b class="rg-energy${cD}">⚡${d.energy}<span class="nlab">cost</span></b>` +
                       `<b class="rg-pitch${pD}">⚡${pitchOf(card)}<span class="nlab">energy</span></b>`;
                   })() +
                   // ⚠️ the role moved to the TYPE LINE at the foot - it was appearing inline
                   // here between the energy numbers and the pair, which is three different kinds
                   // of fact in one run-on row.
                   ` · pairs with <b>${d.combo || '—'}</b></div>`) +
    // 🗡️ the verb is printed ON the card, and lights up when it is actually firing — the same
    // treatment ✦ Lv4 verbs get, for the same reason: a rule you must remember is a rule you misplay.
    (d.verb ? `<div class="card-verb${comboCard() && comboCard().id === card.id ? ' verb-live' : (isMate ? ' verb-offer' : '')}">` +
      `<b>🗡️ ${isMate ? 'Move me to COMBO' : 'Combo'}</b><span>${ROGUE_VERBS[d.verb]}</span></div>` : '') +
    `<div class="card-row"><span class="s-init">💨 ${v.init}</span>` +
    // ⚠️ ➕ IS THE MAGE'S SURGE STAT. A rogue card has no boost, so printing "➕ 0" on all sixteen
    // of them is a number that means nothing — same fault as the ✦ attuned value, same fix.
    (CLASS.boosts
      ? `<span class="s-boost${resoOn ? ' resonating' : ''}"${resoOn ? ' title="Resonates — it feeds what the Spell seeks"' : ''}>` +
        `➕ ${v.boost}${resoOn ? ` ${elIcon(wantEl)}✦` : ''}</span>`
      : '') + `</div>` +
    `<div class="card-vals">${vals}</div>` +
    (verb ? `<div class="card-verb${verbLit ? ' verb-live' : ''}" title="${verb.text}">` +
      `<b>✦ ${verb.name}</b><span>${verbLit ? verb.text : (verb.slot === 'soak' ? 'fires when it blocks' : 'fires in ' + SLOT_LABEL[verb.slot])}</span></div>` : '') +
    (barred ? `<div class="card-barred">${barred}</div>` : '') +
    (fate ? `<div class="card-fate ${fate.cls}">${fate.text}</div>` : '') +
    `<div class="card-row card-foot">` +
      `<span class="card-type">${typeLine(d)}</span>` +
      (enhLine ? `<span class="card-enh">${enhLine}</span>` : '') +
      `<span class="s-armor">🛡️ ${v.armor > 0 ? v.armor : '—'}</span></div>` +
    action + `</div>`;
}

// 🏷️ THE TYPE LINE (2026-08-18). Thomas: *"card classification should go like on the bottom
// somewhere, kinda like how other tcg's do it... mage fire cards should say fire in that
// classification slot. our rogue cards would say tool or blade in that slot i guess."*
// 🔑 EVERY CLASS ALREADY HAS A CLASSIFICATION - it was just printed in a different place, in a
// different shape, per class: the mage's element sat in a coloured chip at the top, the rogue's
// role was jammed inline between her energy numbers and her pair. One fixed slot, bottom-left,
// same position on every card in the game, is what makes a card scannable at a glance.
// ⚠️ Deliberately NOT the archetype (FORCE/SPARK/FLOW/WARD). Those are an authoring tool and
// [[Market_And_Retention]] already recorded the cost of surfacing them: five charms shipped for
// months gating on a word printed nowhere on the card.
function typeLine(d) {
  if (CLASS.pairs) return d.wild ? 'WILD' : (d.element || '').toUpperCase();
  return d.role ? d.role.toUpperCase() : '';
}

function renderLog() {
  $('log').innerHTML = S.logEntries.map(e =>
    `<div class="log-turn"><div class="log-turn-header">${e.header}</div>` +
    e.lines.map(l => `<div class="log-line ${l.cls}">${l.text}</div>`).join('') + `</div>`).join('');
}

// ============================================================
// THE DRAGON DUEL (redesigned 2026-07-06) — one-set turns all the way:
// THE APPROACH (2 journey-beats; Complete both → crack the weakest shield)
// → THE DUEL (one-set fight-beats vs a persistent HP+shields dragon).
// Reuses the normal turn loop (computeAction / resolve / reveal / soak); see 03_Content/Dragons.md.
// ============================================================
function beginFinalBattle() {
  // ⭐ arriving at the lair pays whether or not you leave it — reaching the dragon IS the run
  awardXP(XP_AWARD.lair);
  S.finalMode = true;
  S.finalPhase = 'lastmile';
  S.duelBeat = 0;
  // the dragon becomes a persistent enemy: one HP pool + its armor list as breakable shields
  // 🐉 the dragon becomes a persistent enemy: an HP pool plus its SHAPE. `boon` is what a
  // the boon fields survive the Approach's deletion because the duel maths reads them.
  const dhp = Math.max(10, S.dragon.hp + (DRAGON_HP_ADD[S.dragon.stage] || 0));
  S.dragonState = {
    hp: dhp, maxHp: dhp,
    // ⚠️ the clean-Approach boon is GONE with the Approach (2026-08-05). The fields stay at 0
    // because duelArmour()/duelStrike() read them; a future reward may fill them again.
    boon: { armourCut: 0, unseen: 0, calm: 0 },
    active: null, next: null,   // 🐉 what it is doing now, and what it has telegraphed
  };
  S.deck = S.tutorial ? [...S.deck, ...S.discard, ...S.hand] : shuffle([...S.deck, ...S.discard, ...S.hand]); // gather all non-trashed, keep levels
  S.hand = []; S.discard = [];
  draw(HAND_SIZE);
  // 🗡️ A DRAW IS A SWAP, NEVER AN ADDITION — but you get to SEE the card first, which is why
  // the extra arrives now and is put back at cleanup rather than being a blind exchange.
  // 🔑 The slot row IS the picker: four slots, five cards, and the one you leave unseated slides
  // under the deck. No new phase, no new UI language, and the bot needs teaching nothing — it
  // already searches every arrangement, so it simply searches a bigger hand.
  if (S.drawExtra) { draw(S.drawExtra); S.drawExtra = 0; }
  S.hardship = null;
  S.downgraded = new Set();
  S.damage = 0; S.poison = 0; S.loseReserve = null; S.afterSoak = 'upgrade';
  log(`Region 4 is behind you. One stretch of road remains.`);
  startLastMile();
}

// ---------- ⚔️ THE LAST MILE ----------
function startLastMile() {
  S.finalPhase = 'lastmile';
  S.encounter = { type: 'journey', name: 'The Last Mile', lastMile: true, finale: true,
    mp: LAST_MILE.mp, timePenalty: 0, nightfall: 0, xp: 0 };
  S.assign = { Spell: null, Element: null, Boost: null, Reserve: null };
  S.boostTarget = 'Move';
  S.hardship = null; S.rangedDodge = false;
  S.loseReserve = null; S.afterSoak = 'upgrade';
  S.damage = 0; S.damageEl = null;
  // ⚠️ THE FINALE NEVER CALLS nextTurn(), so anything reset there has to be reset here too.
  S.emberguardUsed = false;
  S.potionFx = { init: 0, value: 0, soak: 0, boost: 0, pace: 0, tpCut: 0, swap: {} }; S.potionPick = null;
  S.bankArmed = false;   // 🔥 banking is armed per TURN — anything outliving its turn would be a charm
  S.moTarget = null;     // ● where Momentum goes is chosen per TURN
  S.downgraded = new Set(); S.actionSetIds = []; S.reserveId = null;
  S.phase = 'assign';
  logHeader(`— ⚔️ THE LAST MILE —`);
  log(`The lair is in sight. Everything you have left is in your hands — and whatever happens here, you gather your whole deck for the duel. Hold nothing back.`);
  logChallenge();
  render();
}

function finishLastMile() {
  const out = S.lastMileOutcome || 'Loss';
  const cut = out === 'Complete' ? LAST_MILE.hpComplete : out === 'Narrow' ? LAST_MILE.hpNarrow : 0;
  logHeader(`— 🐉 The lair of the ${S.dragon.name} —`);
  if (cut > 0) {
    S.dragonState.hp = Math.max(1, S.dragonState.hp - cut);
    log(out === 'Complete'
      ? `You come over the last rise at a run and fall on it before it stands — <b>−${cut} HP</b>. The ${S.dragon.name} rises already bleeding: ${S.dragonState.hp} of ${S.dragonState.maxHp}.`
      : `You arrive late, but not spent, and land one blow as it turns — <b>−${cut} HP</b>. ${S.dragonState.hp} of ${S.dragonState.maxHp} remain.`, 'good result');
  } else {
    log(`You come to the lair mouth with nothing left in you. The ${S.dragon.name} meets you whole.`, 'bad');
  }
  // 🌒 THE SECOND RACE PAYS INTO THE SHAPE, NOT INTO HP — two races, two currencies, so neither
  // is a bigger version of the other. Arriving unheard means it is not set for you yet.
  // ⚠️ The blow for arriving LOUD was already taken on the road (see r.rouse) — it went through
  // the ordinary soak, so those levels are gone before the duel begins. Nothing to apply here.
  if (S.lastMileApproach === 'unseen' && S.dragonState) {
    const b = S.dragonState.boon, bits = [];
    if (hasShape('armour'))     { b.armourCut = LAST_MILE.armourCut;  bits.push(`🛡️ its plate is not set — Armour <b>−${LAST_MILE.armourCut}</b>`); }
    if (hasShape('evasion'))    { b.unseen    = LAST_MILE.unseenBeats; bits.push(`🌀 it has not seen you — Evasion sleeps <b>${LAST_MILE.unseenBeats}</b> beat${LAST_MILE.unseenBeats === 1 ? '' : 's'}`); }
    if (hasShape('relentless')) { b.calm      = LAST_MILE.calmBeats;   bits.push(`⏳ it has not drawn breath — the breath holds <b>${LAST_MILE.calmBeats}</b> beat${LAST_MILE.calmBeats === 1 ? '' : 's'}`); }
    // ⚠️ an unshaped dragon exists (stage 0), and a reward that silently pays NOTHING is worse
    // than one that says so — never print a boon you did not actually grant.
    if (bits.length) log(`🌒 You came up on it unheard: ${bits.join(' · ')}.`, 'good result');
  }
  startDuel();
}

// called from finishTurn() after the Last Mile's cleanup. The Duel sequences its own beats.
function finaleAfterTurn() {
  if (S.finalPhase === 'lastmile') finishLastMile();
}

// ---------- THE DUEL: one-set fight-beats vs the persistent dragon ----------
// 🐉 SHAPED DEFENCE AT BOSS SCALE (2026-07-29). Elemental shields are gone; a dragon defends with
// the same vocabulary a creature does, so nothing here is a special case the engine has to learn.
// The difference is only that a dragon persists across beats — which is what makes RELENTLESS
// possible at all, and why it is a boss-only shape.
function duelArmour() {
  if (!hasShape('armour')) return 0;
  return Math.max(0, S.dragon.shapeV - (S.dragonState.boon.armourCut || 0));
}
// what a strike is actually worth once the shape has had its say
function duelStrike(r) {
  const quenched = !!(S.potionFx && S.potionFx.noShape);   // 🧪 Quenching Draught works on a dragon too
  const armour = quenched ? 0 : Math.max(0, duelArmour() + (duelFx().armour || 0) - (hasCharm('ironsplit') ? 2 : 0));   // 🐉 Bank the Forge · 🛡️ Ironsplitter
  // a clean Approach means it hasn't seen you yet — evasion sleeps for the first `unseen` beats
  // 🌀 Windreader applies at the lair too - a dragon is where Evasion actually decides runs.
  // ⚠️ The duel only knows initLost (a boolean), so the margin is re-read from the same terms
  // computeAction used, rather than inventing a second notion of "close".
  const evMargin = (S.dragon && S.dragon.init != null) ? (S.dragon.init - (r.init || 0)) : 99;
  const evaded = !quenched && hasShape('evasion') && r.initLost
                 && !(hasCharm('windreader') && evMargin <= 2)
                 && !(S.dragonState.boon.unseen > 0);
  let toHp = Math.max(0, r.value - armour);
  if (evaded) toHp = Math.floor(toHp / 2);
  return { toHp, armour, evaded };
}
// ⏳ RELENTLESS inverts the normal counterstrike: instead of SHRINKING as the dragon weakens, its
// breath GROWS every beat. That turns the duel into a race, which is a demand no card stat answers
// — you answer it by not wasting beats, which is a run-long skill.
function duelCounter(hpAfter) {
  const ds = S.dragonState;
  if (hasShape('relentless')) {
    const b = Math.max(0, S.duelBeat - 1 - (ds.boon.calm || 0));
    return S.dragon.breath + (b + (duelFx().breathStep || 0)) * RELENTLESS_STEP;   // 🐉 Settle
  }
  return Math.ceil(S.dragon.breath * hpAfter / ds.maxHp);
}
function shapeStateText() {
  const bits = [];
  const a = duelArmour();
  if (hasShape('armour')) bits.push(`🛡️ ${a}${a < S.dragon.shapeV ? ' (cracked)' : ''}`);
  if (hasShape('evasion')) bits.push(S.dragonState.boon.unseen > 0 ? `🌀 unseen you (${S.dragonState.boon.unseen} left)` : '🌀 Evasion');
  if (hasShape('relentless')) bits.push(`⏳ next breath ${duelCounter(S.dragonState.hp)}`);
  return bits.join(' · ') || 'unguarded';
}

// 🃏 YOUR HALF OF THE RACE. The dragon's bar is its HP; this is yours — the cards you have left.
// No reshuffle in a duel, so every card you block with is stamina you never get back.
// 🐉 WHAT IT IS DOING NOW, AND WHAT IT WILL DO NEXT. The telegraph is the whole point — an attack
// you can see coming is a problem, one that arrives unannounced is a dice roll.
function telegraph() {
  const ds = S.dragonState; if (!ds) return '';
  const now = ds.active, next = ds.next;
  const plain = attacksFor(S.dragon)[0];
  return (now && now.id !== plain.id
      ? `<div class="tg now">🐉 <b>NOW — ${now.name}:</b> ${now.tell}</div>` : '') +
    (next ? `<div class="tg next">👁️ <b>NEXT BEAT — ${next.name}:</b> ${next.tell}</div>` : '');
}

function staminaBar() {
  const left = S.deck.length + S.hand.length;
  const pct = S.duelStamina0 ? Math.max(0, Math.round(100 * left / S.duelStamina0)) : 100;
  return `<div class="stamina"><div class="stamina-fill" style="width:${pct}%"></div>` +
    `<span class="stamina-label">🃏 your cards — ${left} / ${S.duelStamina0}</span></div>` +
    `<div class="stamina-note">🔑 <b>You lose when your cards run out</b> — every card you block with is stamina you never get back.</div>`;
}

function startDuel() {
  S.finalPhase = 'duel';
  S.duelBeat = 0;
  rollTurnTokens();   // 🔥 the Last Mile was a turn too — collect what it banked before the deck is gathered

  // steel yourself at the lair's mouth: gather every card you still hold (spent-set and all)
  // into a fresh deck — this is your finite duel stamina. Only cards TRASHED on the approach
  // (Lv1 soak losses) are gone; a clean approach preserves your full hand AND cracked a shield.
  // 🔄 THE RESHUFFLE IS THE POINT (2026-08-05). Everything comes back - spent, stacked, kept -
  // so the Last Mile and the duel never compete for the same cards. That is what the source game
  // got from Move being its own stat, recovered without a second stat, and it is why the Last Mile
  // can honestly print "nothing here costs you cards".
  S.deck = S.tutorial ? [...S.deck, ...S.discard, ...S.hand] : shuffle([...S.deck, ...S.discard, ...S.hand]);
  S.hand = []; S.discard = [];
  // 🔑 THE DUEL IS A RACE AND THE PLAYER COULDN'T SEE IT (2026-07-29). You lose when your CARDS
  // RUN OUT, not when a health bar empties — the single most important fact about the fight, and
  // nothing on screen said it. Remember what you arrived with so the race can be drawn.
  S.duelStamina0 = S.deck.length;
  log(`The ${S.dragon.name} rears — ${S.dragonState.hp} HP. ${shapeStateText()}. You steel yourself: ${S.deck.length} cards for the duel. It asks one thing of you: ${S.dragon.teaches}. Fell it before your cards run dry.`);
  startDuelBeat();
}

function startDuelBeat() {
  // DECK-AS-HEALTH, finite (no reshuffle — deliberate, see Dragons.md): each beat spends its
  // set and soaks from the same dwindling pool. The deck visibly drains; you win by felling the
  // dragon before it runs dry. A duel that outlasts your cards is the legible, developed loss.
  if (S.hand.length < HAND_SIZE) draw(HAND_SIZE - S.hand.length);
  if (S.hand.length === 0) { // deck and hand both spent — the loss has developed over the duel
    defeat(`Your cards are spent — the ${S.dragon.name} still stands at ${S.dragonState.hp} of ${S.dragonState.maxHp} HP. You wounded it, but the deck ran dry first.`);
    return;
  }
  S.duelBeat++;
  // 🐉 last beat's telegraph becomes this beat's reality, then it tells you the next one.
  // Beat 1 is deliberately plain — you have not been given a chance to react to anything yet.
  const atks = attacksFor(S.dragon);
  S.dragonState.active = S.dragonState.next || atks[0];
  S.dragonState.next = atks[Math.floor(rnd() * atks.length)];
  if (S.dragonState.active && S.dragonState.active.id !== atks[0].id)
    log(`🐉 ${S.dragon.name} — <b>${S.dragonState.active.name}</b>: ${S.dragonState.active.tell}.`, 'bad');
  // synthetic persistent enemy: armor [] so computeAction returns the RAW strike; shields are applied here.
  // atk = the Early bite (ceil breath/2) so losing Initiative stings without doubling the breath;
  // the counterstrike (full breath, HP-scaled) is the main threat. hp huge so computeAction never "wins" — we judge HP.
  // synthetic persistent enemy. NO `shape` field: computeAction must return the RAW strike, because
  // the dragon's shape is applied in duelStrike() where the boon and the beat counter live.
  S.encounter = { type: 'fight', name: S.dragon.name, dragon: true, hp: 9999,
    init: S.dragon.init, atk: Math.ceil(S.dragon.breath / 2), atkEl: S.dragon.element, xp: 0, finale: true };
  S.assign = { Spell: null, Element: null, Boost: null, Reserve: null };
  S.boostTarget = 'Attack'; S.hardship = null; S.rangedDodge = false;
  S.loseReserve = null; S.afterSoak = 'upgrade';
  S.damage = 0; S.damageEl = null;
  // ⚠️ THE FINALE NEVER CALLS nextTurn(), so anything reset there had to be reset here too.
  // The Emberguard is once-per-TURN, and without this it was once per BOSS BATTLE.
  S.emberguardUsed = false;
  S.potionFx = { init: 0, value: 0, soak: 0, boost: 0, pace: 0, tpCut: 0, swap: {} }; S.potionPick = null;
  S.bankArmed = false;   // 🔥 banking is armed per TURN — anything outliving its turn would be a charm
  S.moTarget = null;     // ● where Momentum goes is chosen per TURN
  S.downgraded = new Set(); S.actionSetIds = []; S.reserveId = null;
  S.phase = 'assign';
  logHeader(`— 🐉 Duel · beat ${S.duelBeat} —`);
  log(`${S.dragon.name}: ${S.dragonState.hp}/${S.dragonState.maxHp} HP · ${shapeStateText()}`);
  render();
}

function resolveDuel() {
  if (!rolesValid()) return;
  const spell = spellCard();
  const elem = cardById(S.assign.Element);
  const boostC = cardById(S.assign.Boost);
  S.actionSetIds = [spell, elem, boostC].filter(Boolean).map(c => c.id);
  const reserve = cardById(S.assign.Reserve) || S.hand.find(c => !S.actionSetIds.includes(c.id)) || null;
  S.reserveId = reserve ? reserve.id : null;

  const r = computeAction(reserve); // the encounter carries no shape, so r.value is the RAW strike
  const ds = S.dragonState;
  const atk = r.value;

  // --- the SHAPE has its say, then HP ---
  const hpBefore = ds.hp;
  const st = duelStrike(r);
  const toHp = st.toHp;
  ds.hp = Math.max(0, ds.hp - toHp);
  if (S.stats) { S.stats.duelDmg += toHp; S.stats.duelBeats = S.duelBeat; }
  const kill = ds.hp <= 0;

  const counter = kill ? 0 : duelCounter(ds.hp);
  const early = kill ? 0 : r.early; // r.early = the bite when you lose Initiative, else 0
  const damage = early + counter;
  if (ds.boon.unseen > 0) ds.boon.unseen--;   // the surprise lasts a fixed number of beats
  // 🐉 A DENIAL SHOULD COST A CARD, NOT A TURN (2026-07-29, Thomas: "blocking slots might be too
  // much... you can't really do anything about it"). He is right, and the reason is the telegraph:
  // you can SEE a seal coming and there is nothing to do about it, so it removes a turn rather
  // than posing a problem. Burning the card you USED keeps the whole turn intact, costs you in the
  // currency the game actually runs on (the deck), and — because it is announced a beat early —
  // makes the telegraph ACTIONABLE: you arrange this beat around the card you are about to lose.
  const burn = duelFx().burn;
  if (burn && S.assign[burn]) {
    const gone = cardById(S.assign[burn]);
    if (gone) {
      S.hand = S.hand.filter(c => c.id !== gone.id);
      S.discard.push(gone);
      if (S.reserveId === gone.id) S.reserveId = null;
      S.actionSetIds = S.actionSetIds.filter(id => id !== gone.id);
      log(`🐉 ${ds.active.name} takes ${displayName(gone)} — it is gone for the rest of the duel.`, 'bad');
    }
  }
  // 🔥 the finale never reaches finishResolve(), so the bank is collected here instead.
  if (r.banks) S.wakePending = r.bank;
  S.duelResult = { atk, toHp, kill, early, counter, damage, armour: st.armour, evaded: st.evaded };

  log(`The weave — Spell: ${displayName(spell)} Lv${spell.level} (${r.spellEl}) = ${r.base}` +
      ` · Catalyst: ${elem ? `${elem.def.name} (${elem.def.wild ? 'Wild' : elOf(elem) || 'colorless'}, Init ${eff(elem).init})` : '—'}` +
      ` · Surge: ${boostC ? `${boostC.def.name} (+${r.boostEff} → ${S.boostTarget})` : '—'}`);

  // --- staged reveal (mirrors the normal fight) ---
  const L = (text, cls = '') => ({ text, cls });
  const beats = [];
  // 🔑 INITIATIVE FIRST HERE TOO — the duel mirrors the fight, so it must read in the same causal
  // order: who moved first, then what the blow did. ⚠️ `kill` is computed above, so the beat's own
  // !kill guard still works unmoved: kill the dragon and there was no bite to describe.
  if (!kill) {
    const b2 = [];
    if (r.initLost) b2.push(L(`Initiative: yours ${r.init} vs ${S.dragon.init} → the ${S.dragon.name} strikes first → Early Damage ${early}`, 'bad'));
    else b2.push(L(`Initiative: yours ${r.init} vs ${S.dragon.init} → you strike first — no Early Damage`, 'good'));
    if (hasShape('relentless')) b2.push(L(`⏳ It draws a deeper breath — counterstrike ${counter}${S.duelBeat > 1 ? ` (was ${counter - RELENTLESS_STEP})` : ''}`, 'bad'));
    beats.push({ label: '💨 INITIATIVE', big: r.init, vs: `vs ${S.dragon.init}`, numCls: early ? 'bad' : 'ok', lines: b2 });
  }

  const b1 = [];
  if (r.enhUsed) b1.push(L(attunedLineText(r, spell, 'strike'), 'good'));
  else if (r.rogue) rogueActionLines(r, spell, L, 'Strike').forEach(x => b1.push(x));
  else b1.push(L(`Strike ${r.base} — unattuned${elem ? ` (${elem.def.name} is ${elOf(elem)}, not ${r.spellEl})` : ''}`));
  if (r.banks) b1.push(L(`⟳ CHANNELLED — ${boostC.def.name} pours into the Emberwake instead of the strike, ${bankCostPhrase(boostC)}. You carry <b>🔥 ${r.bank}</b> into the next beat, to spend on your <b>strike</b> or your <b>speed</b>`, 'good'));
  else if (boostC) b1.push(L(`Surge: ${boostC.def.name} +${r.boostEff} → ${r.withBoost}`));
  if (r.wakeTarget === 'atk' && r.wake) b1.push(L(`🔥 Emberwake +${r.wake} spent on the strike`, 'good'));
  if (st.armour) b1.push(L(`🛡️ Armour ${st.armour}: the slag turns all but the heaviest blow → ${r.withBoost} − ${st.armour}`, 'bad'));
  if (st.evaded) b1.push(L(`🌀 Evasion: it saw you coming — half the blow finds nothing → ${toHp}`, 'bad'));
  if (hasShape('evasion') && r.initLost && ds.boon.unseen > 0) b1.push(L(`🌀 It has not seen you yet — the blow lands whole despite your pace`, 'good'));
  b1.push(L(`🐉 ${S.dragon.name}: ${hpBefore} → ${ds.hp} HP`, ds.hp < hpBefore ? 'good' : ''));
  beats.push({ label: '⚔️ STRIKE', big: toHp, vs: `to HP · 🐉 ${hpBefore}→${ds.hp}`, numCls: r.enhUsed ? 'enh' : '', lines: b1 });

  beats.push({ outcomeBeat: true, final: true, duel: true, lines: [] });

  S.pendingR = r;
  S.beats = beats;
  S.beatIndex = -1;
  S.phase = 'reveal';
  advanceBeat();
}

// runs when the duel reveal finishes (dispatched from advanceBeat)
function finishDuel() {
  const dr = S.duelResult;
  const rr = S.pendingR;
  S.pendingR = null; S.beats = null; S.beatIndex = -1;
  if (dr.kill) { victory(); return; }
  // ● the streak is judged on the RAW blow, before you soak it — same order as the road
  tickMomentum(dr.damage, rr);
  if (dr.damage <= 0) { log(`No counterstrike lands — press the assault.`); duelCleanupAndNext(); return; }
  log(`The ${S.dragon.name} strikes back for ${dr.damage}${dr.early ? ` (Early ${dr.early} + Counter ${dr.counter})` : ''} — block it with your remaining cards.`, 'bad');
  S.damage = dr.damage;
  S.damageEl = null;   // dead — see above; a dragon's breath has no colour the maths reads
  S.downgraded = new Set();
  S.afterSoak = 'duelNext';
  startSoak(); // soakable → player downgrades; else knockout (downgrade all + burn deck) then continue
}

function duelCleanupAndNext() {
  rollTurnTokens();   // 🔥 end of a beat IS end of a turn — before the set leaves the hand, so Deepwell can still read it
  const setCards = S.hand.filter(c => S.actionSetIds.includes(c.id));
  S.hand = S.hand.filter(c => !S.actionSetIds.includes(c.id));
  S.discard.push(...setCards);
  log(`You regroup — spent set to the discard; ${S.hand.length} card${S.hand.length === 1 ? '' : 's'} still in hand, ${S.deck.length} in deck.`);
  startDuelBeat();
}

function defeat(msg) {
  log(`💀 DEFEAT — ${msg}`, 'bad result');
  // 🏆 a graded loss still goes on the wall — death is part of the game, not a blank
  if (S.dragon) recordGrade(S.dragon.stage, gradeRun(false), false);
  // 🔴 A LOSS STILL PAYS. This is the whole point of the meta layer: if unlocks came only
  // from winning, a lost run is wasted time and the grind punishes the players who need it most.
  bankRun(false);
  S.defeatMsg = msg;
  S.phase = 'defeat';
  render();
}

// ============================================================
// 🏅 THE GRADE (2026-07-29). Two jobs that look unrelated but are the same feature.
//
// 1. IT GIVES A FINITE LADDER UNLIMITED HEADROOM. Four stages is a CAMPAIGN — you beat it and
//    you're done. A grade means every stage keeps something in it: you cleared Cindermaw with a
//    C, and there is still an S in there. Content you PRACTISE instead of content you consume,
//    at almost no cost because the stages already exist.
//
// 2. IT MAKES LOSING TEACH. "Death is part of the game" only works if you leave knowing what to
//    do differently, and today a loss says only "your cards ran dry". A graded loss says you
//    averaged 9 damage a beat and needed 14 — which is a PLAN for the next run. ⏳ Relentless in
//    particular is invisible without this: you don't feel the escalation, you just die late.
//
// ⚠️ PEOPLE PLAY FOR THE GRADE, SO IT TEACHES WHATEVER IT MEASURES. Grade the wrong thing and
// you actively make the game worse. Hence: NOT total damage (rewards hoarding), NOT raw turn
// count (punishes careful play). Only the four things this game is actually about —
//     🃏 the deck you kept  ⚔️ how cleanly you solved hands  ✦ craft  🐉 the kill.
// A perfect losing run still reaches ~75, which is a B — death is part of the game, not a zero.
// ============================================================
// 📦 SAVE MIGRATION for the craft stat (2026-08-21). The counters were named for the mage's rule
// (`attuneAvail`/`attuned`); they are class-neutral now.
function migrateStats(d) {
  const base = { craftAvail: 0, craftFound: 0, duelDmg: 0, duelBeats: 0 };
  if (!d) return base;
  return {
    craftAvail: d.craftAvail != null ? d.craftAvail : (d.attuneAvail || 0),
    craftFound: d.craftFound != null ? d.craftFound : (d.attuned || 0),
    duelDmg: d.duelDmg || 0, duelBeats: d.duelBeats || 0,
  };
}
const GRADE_BANDS = [[85, 'S'], [70, 'A'], [55, 'B'], [40, 'C'], [0, 'D']];
// the grade names the mechanic in the CLASS's own word — 'attuned' for a mage, 'paid in full'
// for a rogue. ⚠️ Never hard-code it here: a score line that describes the wrong mechanic is
// how the rogue came to be told she had missed 15 attunes she was never offered.
const craftLabel = () => (CLASS.craft && CLASS.craft.label) || 'found';
function gradeRun(won) {
  const st = S.stats || { craftAvail: 0, craftFound: 0, duelDmg: 0, duelBeats: 0 };
  const survivors = [...S.hand, ...S.deck, ...S.discard];
  const levels = survivors.reduce((t, c) => t + c.level, 0);
  const res = S.results, encounters = res.Complete + res.Narrow + res.Loss;

  // 🃏 THE DECK YOU KEPT — deck-as-health is the pillar, so it is the biggest single share
  const deck = Math.round(30 * Math.min(1, levels / 40));
  // ⚔️ HOW CLEANLY YOU SOLVED HANDS — a Narrow counts, but only a third as much
  const exec = encounters ? Math.round(25 * Math.min(1, (res.Complete + res.Narrow / 3) / encounters)) : 0;
  // ✦ CRAFT — of the hands where your CLASS's source of power was available, how many did you
  // find? Measures play, not luck. ⚠️ Class-owned since 2026-08-21: it asked a mage question of
  // every class, and a rogue scored a guaranteed 0/20 for failing to do a thing she cannot do.
  const craft = st.craftAvail ? Math.round(20 * (st.craftFound / st.craftAvail)) : 0;
  // 🐉 THE KILL — felling it is most of it; felling it FAST is the rest (⏳ Relentless's demand)
  const kill = won ? 25 - Math.max(0, Math.min(8, (st.duelBeats - 3) * 2)) : 0;

  const total = deck + exec + craft + kill;
  const letter = (GRADE_BANDS.find(b => total >= b[0]) || GRADE_BANDS[GRADE_BANDS.length - 1])[1];
  return { total, letter, deck, exec, craft, kill, levels, st, encounters };
}
// the one line that turns a defeat into a next attempt
function lossDiagnosis() {
  const st = S.stats, ds = S.dragonState;
  if (!ds || !st || !st.duelBeats) return 'You never reached the lair — the road took you first.';
  const per = st.duelDmg / st.duelBeats;
  const needed = ds.maxHp / st.duelBeats;
  return `You averaged <b>${per.toFixed(1)}</b> damage a beat over ${st.duelBeats}. ` +
    `Felling it in that time needed <b>${needed.toFixed(1)}</b>.` +
    (hasShape('relentless') ? ` ⏳ Its breath had grown to <b>${duelCounter(ds.hp)}</b> — a long duel is one you have already lost.` : '');
}
function gradeHTML(g, won) {
  const bar = (label, got, max) =>
    `<div class="g-row"><span class="g-lab">${label}</span>` +
    `<span class="g-bar"><i style="width:${Math.round(100 * got / max)}%"></i></span>` +
    `<span class="g-num">${got}<span class="dim">/${max}</span></span></div>`;
  return `<div class="grade"><div class="g-letter g-${g.letter}">${g.letter}</div>` +
    `<div class="g-total">${g.total}<span class="dim"> / 100</span></div>` +
    `<div class="g-rows">` +
    bar('🃏 the deck you kept', g.deck, 30) +
    bar('⚔️ hands solved', g.exec, 25) +
    bar(`✦ craft <span class="dim">(${craftLabel()} ${g.st.craftFound} of ${g.st.craftAvail})</span>`, g.craft, 20) +
    bar(won ? `🐉 the kill <span class="dim">(${g.st.duelBeats} beats)</span>` : '🐉 the kill', g.kill, 25) +
    `</div>` + (won ? '' : `<p class="g-diag">${lossDiagnosis()}</p>`) + `</div>`;
}

function victory() {
  const survivors = [...S.hand, ...S.deck, ...S.discard];
  const score = survivors.reduce((t, c) => t + c.level, 0);
  const was = stagesCleared();
  clearStage(S.dragon.stage);
  recordGrade(S.dragon.stage, gradeRun(true), true);
  const next = dragonForStage(S.dragon.stage + 1);
  log(`🏆 THE ${S.dragon.name.toUpperCase()} FALLS! Final score: ${score}`, 'good result');
  // 🗺️ AND THE SCREEN HAS TO SAY IT, not just the log. Clearing a stage OPENS THE NEXT ONE, which
  // is the largest thing a victory gives you — larger than any material — and it was living in a
  // scrolling side panel while the summary listed bone shards.
  // 🔑 Same rule the field row and the status chips were built on: **if it changed, it belongs on
  // screen.** A reward announced only in the log is a reward most players never read.
  if (next && S.dragon.stage > was) {
    S.stageOpened = next;
    log(`🗺️ Stage ${S.dragon.stage} cleared — STAGE ${next.stage}, the ${next.name}, is open to you. ${next.brief}`, 'good result');
  }
  else if (!next) { S.stageOpened = 'all'; log(`🪜 Every stage stands open — take whichever you like.`, 'good result'); }
  // 🐉 the hunt's prize, and the run's pay. ⚠️ Both go through the same helpers the road uses,
  // so a dragon is not a special case — it is an encounter with a better table.
  bankDrops(rollDrops({ dragon: true, name: S.dragon.name, type: 'fight' }, 'Complete'));
  bankRun(true);
  S.phase = 'victory';
  render();
}

// go — restore a saved run if one exists, else start fresh
// 🏠 boot to the menu. A saved run is offered, never forced — and never silently discarded.
showMenu();
