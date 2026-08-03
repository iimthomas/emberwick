'use strict';

/* ============================================================
   EMBERWICK prototype v1 (formerly Spellwick — renamed 2026-07-01)
   All tuning lives in the CONSTANTS + DATA block below.
   ============================================================ */

// ---------- tuning constants (placeholders, see design docs) ----------
const START_LEVEL = 2;
const MAX_LEVEL = 4;
// ✦ how much attuning is worth: value + (level + ATTUNE_BONUS). Swept 2026-07-29.
let ATTUNE_BONUS = 1;
const INIT_FLOOR = 3;      // 💨 no card is ever disqualified from the Catalyst slot
const HAND_SIZE = 4;
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
const MAX_DIVERTS = 2;           // diverts allowed before you must face an encounter

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
  //   Fire hits harder / guards worse .. Water fuels and endures, never fast
  //   Lightning is speed at the cost of guard .. Stone is armour, slow and dry
  // Row = [value, (dead), init, boost, armor, (dead), costToNextLevel]
  { name: 'Emberfall', element: 'Fire', arch: 'FORCE',
    lv: [[5,null,2,2,1,null,2], [7,null,1,1,1,null,3], [9,null,0,1,1,null,4], [11,null,0,1,1,null,null]] },
  { name: 'Firstlight', element: 'Fire', arch: 'SPARK',
    lv: [[4,null,5,3,1,null,2], [3,null,7,2,1,null,3], [2,null,9,1,1,null,4], [2,null,11,1,1,null,null]] },
  { name: 'Bellowsbreath', element: 'Fire', arch: 'FLOW',
    lv: [[4,null,3,3,1,null,2], [3,null,2,5,1,null,3], [2,null,1,7,1,null,4], [2,null,1,9,1,null,null]] },
  { name: 'Hearthwall', element: 'Fire', arch: 'WARD',
    lv: [[4,null,3,2,2,null,2], [3,null,2,1,4,null,3], [2,null,1,1,6,null,4], [2,null,1,1,8,null,null]] },
  { name: 'Tidebreak', element: 'Water', arch: 'FORCE',
    lv: [[3,null,1,3,3,null,2], [5,null,0,2,2,null,3], [7,null,0,1,1,null,4], [9,null,0,1,1,null,null]] },
  { name: 'Riverstep', element: 'Water', arch: 'SPARK',
    lv: [[2,null,4,4,3,null,2], [2,null,6,3,2,null,3], [2,null,8,2,1,null,4], [2,null,10,2,1,null,null]] },
  { name: 'Wellspring', element: 'Water', arch: 'FLOW',
    lv: [[2,null,2,4,3,null,2], [2,null,1,6,2,null,3], [2,null,0,8,1,null,4], [2,null,0,10,1,null,null]] },
  { name: 'Rimeguard', element: 'Water', arch: 'WARD',
    lv: [[2,null,2,3,4,null,2], [2,null,1,2,6,null,3], [2,null,0,1,8,null,4], [2,null,0,1,10,null,null]] },
  { name: 'Sparkstrike', element: 'Lightning', arch: 'FORCE',
    lv: [[4,null,4,2,1,null,2], [6,null,3,1,1,null,3], [8,null,2,1,1,null,4], [10,null,2,1,1,null,null]] },
  { name: 'Quickfire', element: 'Lightning', arch: 'SPARK',
    lv: [[3,null,7,3,1,null,2], [2,null,9,2,1,null,3], [2,null,11,1,1,null,4], [2,null,13,1,1,null,null]] },
  { name: 'Stormglass', element: 'Lightning', arch: 'FLOW',
    lv: [[3,null,5,3,1,null,2], [2,null,4,5,1,null,3], [2,null,3,7,1,null,4], [2,null,3,9,1,null,null]] },
  { name: 'Staticwall', element: 'Lightning', arch: 'WARD',
    lv: [[3,null,5,2,2,null,2], [2,null,4,1,4,null,3], [2,null,3,1,6,null,4], [2,null,3,1,8,null,null]] },
  { name: 'Rockfall', element: 'Stone', arch: 'FORCE',
    lv: [[4,null,1,1,4,null,2], [6,null,0,1,3,null,3], [8,null,0,1,2,null,4], [10,null,0,1,2,null,null]] },
  { name: 'Flintdart', element: 'Stone', arch: 'SPARK',
    lv: [[3,null,4,2,4,null,2], [2,null,6,1,3,null,3], [2,null,8,1,2,null,4], [2,null,10,1,2,null,null]] },
  { name: 'Deepvein', element: 'Stone', arch: 'FLOW',
    lv: [[3,null,2,2,4,null,2], [2,null,1,4,3,null,3], [2,null,0,6,2,null,4], [2,null,0,8,2,null,null]] },
  { name: 'Cairnguard', element: 'Stone', arch: 'WARD',
    lv: [[3,null,2,1,5,null,2], [2,null,1,1,7,null,3], [2,null,0,1,9,null,4], [2,null,0,1,11,null,null]] },
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
  'Ambush':       'Double the Early Damage you suffer this encounter.',
  'Hazards':      'Suffer 1 Time Penalty if you take Early Damage, and 1 more if you take Combat Damage.',
  'Night Travel': "Your Boost is reduced by your Catalyst's Initiative (min 0).",
  'Storm':        'Any Time Penalties this encounter also deal that much damage.',
  // ⚖️ aims straight at the most-solved part of the turn: the Spell is simply your biggest card 83%
  'Dead Weight':  'Your heaviest card cannot be your Spell.',
  // 🐌 the same trick on the race — your fastest card is barred from the Catalyst
  'Mire':         'Your fastest card cannot be your Catalyst.',
  // 🔇 kills the class's combination rule for one encounter. Stated class-blind on purpose: for the
  // mage that means no attuning, for a rogue it would mean no chain.
  'Dead Air':     'Your cards find no accord — nothing attunes this encounter.',
};
const FIGHT_HARDSHIPS = ['Ambush', 'Hazards', 'Night Travel', 'Dead Weight', 'Mire', 'Dead Air'];
const JOURNEY_HARDSHIPS = ['Night Travel', 'Storm', 'Dead Weight', 'Dead Air'];

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
  return null;
}
function slotLegal(id, zone) { return !placementBan(id, zone) && CLASS.canPlace(id, zone); }

const ABILITIES = {
  'Freeze': 'If it deals you Early Damage, you discard your Arsenal in Cleanup.',
  'Poison': 'If it damages you, +1 damage to your next drawn hand (+2 if both Early and Combat).',
  'Ranged': 'It shoots from range — you take Early Damage even when you strike first. Speed cannot save you here.',
};

const PERILS = {
  'Steep':       "The journey's MP is increased by your Arsenal's Boost.",
  'Treacherous': 'Fail to attain Complete Victory → suffer 1 damage after the Time Penalty.',
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
    { type: 'journey', name: 'Highland Pass',  mp: 12, timePenalty: 2, element: 'Lightning', nightfall: 4, xp: 4 },
    { type: 'journey', name: 'Fern Crossing',  mp: 8,  timePenalty: 1, element: 'Water',     nightfall: 3, xp: 2 },
    { type: 'journey', name: 'Sunwarm Trail',  mp: 11, timePenalty: 2, element: 'Fire',      nightfall: 4, xp: 3 },
    { type: 'journey', name: 'Quarry Hollow',    mp: 10, timePenalty: 1, element: 'Stone',    nightfall: 3, xp: 2 },
  ]},
  // 🏹 Wilding Marches — open country full of ambushers and archers: it is about being CAUGHT
  { name: 'Wilding Marches', hardshipChance: 0.35, hardships: ['Ambush', 'Mire', 'Night Travel'], encounters: [
    { type: 'fight',   name: 'Flintwisp',     hp: 9,  init: 4, atk: 2, atkEl: 'Stone',    shape: 'evasion', shapeV: 1,    xp: 4, ability: 'Ranged' },
    { type: 'fight',   name: 'Stormtoad',      hp: 10, init: 6, atk: 2, atkEl: 'Lightning',  xp: 3 },
    { type: 'fight',   name: 'Ashen Boar',     hp: 15, init: 1, atk: 4, atkEl: 'Fire',      shape: 'armour', shapeV: 2,      xp: 6 },
    { type: 'fight',   name: 'Frostbark Elder', hp: 13, init: 4, atk: 3, atkEl: 'Water',    shape: 'evasion', shapeV: 1,     xp: 5, ability: 'Freeze' },
    { type: 'journey', name: 'Mirefen Road',    mp: 10, timePenalty: 2, element: 'Fire',      nightfall: 5, xp: 3, peril: 'Treacherous' },
    { type: 'journey', name: 'Drowned Meadow',  mp: 13, timePenalty: 2, element: 'Water',     nightfall: 4, xp: 5 },
    { type: 'journey', name: 'Stormwash',       mp: 11, timePenalty: 3, element: 'Lightning', nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Scree Track', mp: 9,  timePenalty: 2, element: 'Stone',    nightfall: 4, xp: 3, peril: 'Steep' },
  ]},
  // 🕳️ Deepdark Hollows — close, lightless, smothering: it is about things not WORKING
  { name: 'Deepdark Hollows', hardshipChance: 0.5, hardships: ['Dead Air', 'Hazards', 'Night Travel', 'Storm'], encounters: [
    { type: 'fight',   name: 'Basalt Basilisk', hp: 17, init: 4, atk: 3, atkEl: 'Stone',    shape: 'armour', shapeV: 3,    xp: 6 },
    { type: 'fight',   name: 'Grotto Hydra',   hp: 14, init: 2, atk: 3, atkEl: 'Water',     shape: 'armour', shapeV: 1,     xp: 6 },
    { type: 'fight',   name: 'Sulfur Crawler', hp: 11, init: 4, atk: 2, atkEl: 'Fire',      shape: 'evasion', shapeV: 1,      xp: 5, ability: 'Poison' },
    { type: 'fight',   name: 'Storm Prowler',  hp: 9,  init: 4, atk: 2, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 4, ability: 'Ranged' },
    { type: 'journey', name: 'Sunken Causeway', mp: 14, timePenalty: 2, element: 'Water',     nightfall: 6, xp: 5, peril: 'Steep' },
    { type: 'journey', name: 'Echo Basin',      mp: 12, timePenalty: 3, element: 'Lightning', nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Cinder Ravine',   mp: 10, timePenalty: 3, element: 'Fire',      nightfall: 5, xp: 4, peril: 'Treacherous' },
    { type: 'journey', name: 'Granite Cut',    mp: 11, timePenalty: 2, element: 'Stone',    nightfall: 6, xp: 4 },
  ]},
  // 🐉 The Dragon's Shadow — everything is heavier here: it is about your own strength failing you
  { name: "The Dragon's Shadow", hardshipChance: 0.65, hardships: ['Dead Weight', 'Dead Air', 'Ambush', 'Hazards', 'Storm'], encounters: [
    { type: 'fight',   name: 'Cairntide Warden', hp: 13, init: 5,  atk: 2, atkEl: 'Stone',    shape: 'armour', shapeV: 2,    xp: 5, ability: 'Poison' },
    { type: 'fight',   name: 'Flarecaller',      hp: 9,  init: 5, atk: 3, atkEl: 'Fire',      shape: 'evasion', shapeV: 1,                             xp: 4, ability: 'Ranged' },
    { type: 'fight',   name: 'Stormcrown Stag',  hp: 14, init: 5,  atk: 4, atkEl: 'Lightning', shape: 'evasion', shapeV: 1,  xp: 6, ability: 'Freeze' },
    { type: 'fight',   name: 'Mirewyrm Elder',   hp: 17, init: 5,  atk: 5, atkEl: 'Water',     shape: 'armour', shapeV: 4,    xp: 6 },
    { type: 'journey', name: 'Drowned Vale',   mp: 14, timePenalty: 2, element: 'Water',     nightfall: 7, xp: 5, peril: 'Treacherous' },
    { type: 'journey', name: 'Stoneward Road', mp: 13, timePenalty: 3, element: 'Stone',    nightfall: 6, xp: 4 },
    { type: 'journey', name: 'Emberfall Path', mp: 12, timePenalty: 2, element: 'Fire',      nightfall: 6, xp: 4 },
    { type: 'journey', name: 'Tempest Ridge',  mp: 11, timePenalty: 3, element: 'Lightning', nightfall: 7, xp: 4, peril: 'Steep' },
  ]},
];

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
// BANKS as a token worth half the boost, rounded up. At the start of your next turn you aim that
// token at ⚔️ attack, 💨 initiative or 🛡️ armour.
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
// ✦ THE PRISM (Thomas's design, 2026-07-29)
//
// THE HOLE IT FILLS: 15% of hands hold all four elements and therefore NO PAIR - so they can
// neither attune nor bank, and the turn collapses back to the solved game. Measured: on a rainbow
// hand the naive biggest/fastest/fattest play is already optimal 90% of the time (vs 67% on a
// paired hand), and the average outcome is 1.08 against 1.36. Punished twice - weaker AND boring.
//
// 🔑 THE PROPERTY THAT MAKES IT WORK: a rainbow hand holds all four elements, so ANY card you
// draw is GUARANTEED to pair with something you already hold. The cure cannot fail, and it cannot
// fail *because* the hand is rainbow. So the Prism cures rather than compensates.
//
// THE RULE: draw one, discard one. The hand never leaves four cards - the slot row is four fixed
// positions and a fifth card would have nowhere to stand (that is exactly the bug that made the
// Kiln of Trials unplayable this morning), so the drawn card is held OUTSIDE the hand until you
// place it or refuse it.
//
// WHY THE DISCARD AND NOT THE DECK BOTTOM: a free cure is a button you press every rainbow hand,
// which fixes availability and adds no tension. A discard makes it a real question - is fixing
// this hand worth losing a card for the rest of the region? Sometimes plainly not. It also speaks
// a currency the player already reads every turn, because the Spell says "SPENT, gone for the
// region" in the same words. And it cannot be a punishment for drawing badly, because it is
// OPTIONAL: decline and you are exactly where you were.
//
// ⚠️ NO DECK, NO PRISM. Near the end of a region "gone for the region" is really "gone for the
// run", and deck size is also what ends the region - so with an empty deck the trade stops being
// a choice and becomes a trap. It simply does not appear.
// ============================================================
function prismReady() {
  if (S.prismUsed || S.prism || !isAssignPhase() || S.hand.length < 4) return false;
  if (!S.deck.length) return false;                       // no draw, no Prism
  return new Set(S.hand.map(c => elOf(c))).size >= 4;     // all four elements: no pair anywhere
}
function prismDraw() {
  if (!prismReady()) return;
  S.prism = S.deck.shift();
  S.prismUsed = true;
  log(`✦ The Prism — the circle is complete. You draw ${displayName(S.prism)}.`, 'good');
  render();
}
// take the drawn card INTO a slot; the card it replaces is spent for the region
function prismTake(id) {
  if (!S.prism) return;
  const out = cardById(id); if (!out) return;
  if (elOf(out) === elOf(S.prism)) return;   // would leave you rainbow again — see cardHTML
  const zone = zoneOf(id);
  S.hand = S.hand.filter(c => c.id !== id);
  S.discard.push(out);
  S.hand.push(S.prism);
  if (zone) S.assign[zone] = S.prism.id;
  log(`${displayName(out)} is spent for the region; ${displayName(S.prism)} takes its place.`);
  S.prism = null;
  render();
}
function prismRefuse() {
  if (!S.prism) return;
  S.discard.push(S.prism);
  log(`You let ${displayName(S.prism)} go — spent for the region.`);
  S.prism = null;
  render();
}

function banksNow() {
  const surge = cardById(S.assign.Boost), elem = cardById(S.assign.Element);
  return !!(surge && elem && elOf(surge) === elOf(elem));
}
function bankValueOf(surge) { return surge ? Math.ceil(eff(surge).boost / 2) : 0; }
const WAKE_TARGETS = { atk: '⚔️ attack', init: '💨 initiative', armor: '🛡️ armour' };
// the token is only aimable while you can still see the encounter and change your mind
function wakeReady() { return S.wake > 0 && isAssignPhase(); }
function aimWake(t) { if (!S.wake) return; S.wakeTarget = WAKE_TARGETS[t] ? t : null; render(); }

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
  S.candle = false;
  log(`🕯️ Your candle gutters out — ${why}. You cannot see what is coming.`, 'bad');
}
// what waits after this one, if you can see it
function nextEncounter() {
  if (!S.candle || S.finalMode) return null;
  return S.encounterQueue && S.encounterQueue.length ? S.encounterQueue[0] : null;
}

function attunedNow() {
  if (S.hardship === 'Dead Air') return false;   // 🔇 nothing finds accord
  const sp = spellCard(), el = cardById(S.assign.Element);
  return !!(sp && el && (el.def.wild || elOf(el) === elOf(sp)));
}
function spellCard() { return cardById(S.assign.Spell); }
function removeFromZone(id) {
  if (S.assign.Spell === id) S.assign.Spell = null;
  for (const z of SLOTS) if (S.assign[z] === id) S.assign[z] = null;
}

const MAGE = {
  id: 'mage',
  multi: null,                          // no slot holds more than one card
  labels: { Spell: 'Spell', Element: 'Catalyst', Boost: 'Surge', Reserve: 'Arsenal' },
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
    // ✦ Motherlode banks the FULL boost · Backdraft doubles what it banks
    const vB = verbOf(boostC);
    let bank = banks ? bankValueOf(boostC) : 0;
    if (banks && vB && vB.slot === 'Boost') {
      if (vB.name === 'Motherlode') bank = eff(boostC).boost;
      if (vB.name === 'Backdraft') bank *= 2;
    }
    const w = S.wake || 0, wt = S.wakeTarget;
    return {
      value: (attuned ? st.attuned : st.value) + (wt === 'atk' ? w : 0)
        + (attuned && vElem && vElem.name === 'Firstflame' ? 3 : 0),
      element: spell.def.element,
      init: (elem ? eff(elem).init : 0) + (wt === 'init' ? w : 0)
        + (banksNow() && verbOf(boostC) && verbOf(boostC).name === 'Quickspark' ? 3 : 0),
      boost: banks ? 0 : (boostC ? eff(boostC).boost : 0),
      hits: 1,
      attuned, attBonus: st.attuned - st.value,
      banks, bank, wake: w, wakeTarget: wt,
      vSpell: vSpell && vSpell.slot === 'Spell' ? vSpell.name : null,
      vElem: vElem && vElem.slot === 'Element' ? vElem.name : null,
      spell, elem, boostC,
    };
  },
};
let CLASS = MAGE;

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
  Bellowsbreath:{ slot: 'Boost',   name: 'Backdraft',  text: 'Banking from here DOUBLES the Emberwake.' },
  Wellspring:   { slot: 'Boost',   name: 'Deepwell',   text: 'An Emberwake banked from here lasts a second turn.' },
  Stormglass:   { slot: 'Boost',   name: 'Quickspark', text: 'Banking from here also gives +3 Initiative this turn.' },
  Deepvein:     { slot: 'Boost',   name: 'Motherlode', text: 'Banking from here keeps the FULL boost, not half.' },
  // WARD → SOAKING — keeping cards, the run-level currency
  Hearthwall:   { slot: 'soak',    name: 'Emberguard', text: 'The first time it soaks each encounter, it loses no level.' },
  Rimeguard:    { slot: 'soak',    name: 'Frostbite',  text: 'It soaks 4 more than its armour.' },
  Staticwall:   { slot: 'soak',    name: 'Groundwire', text: 'When it soaks, you gain a 🔥 +2 Emberwake.' },
  Cairnguard:   { slot: 'soak',    name: 'Bulwark',    text: 'When it soaks, it soaks ALL remaining damage.' },
};
// a card only has its verb at Lv4 — soften it and the verb is gone
function verbOf(card) { return card && card.level >= MAX_LEVEL ? VERBS[card.def.name] || null : null; }
// is the named card's verb live RIGHT NOW, i.e. seated in the slot it belongs to?
function verbLive(name, zone) {
  const id = S.assign && S.assign[zone];
  const c = id ? cardById(id) : null;
  return !!(c && c.def.name === name && verbOf(c));
}

const SLOT_LABEL = { Spell: 'Spell', Element: 'Catalyst', Boost: 'Surge', Reserve: 'Arsenal' };
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
const DRAGONS = [
  { stage: 1, name: 'Cindermaw', element: 'Fire', init: 10, breath: 6, hp: 40,
    shapes: ['armour'], shapeV: 4,
    teaches: 'HIT BIG',
    brief: 'Slag has cooled over every scale. Small blows spatter and die on it — only a fully fuelled strike reaches anything underneath.' },
  { stage: 2, name: 'Skyrender', element: 'Lightning', init: 10, breath: 8, hp: 44,
    shapes: ['evasion'], shapeV: 0,
    teaches: 'HIT FIRST',
    brief: 'It is never where you struck. Reach it before it moves and the blow lands whole; arrive late and you catch half a wing.' },
  { stage: 3, name: 'Cragmourn', element: 'Stone', init: 7, breath: 5, hp: 56,
    shapes: ['relentless'], shapeV: 0,
    teaches: 'WASTE NOTHING',
    brief: 'The mountain does not tire. Every beat it draws a deeper breath than the last — a long duel is a duel you have already lost.' },
  { stage: 4, name: 'Fathomdread', element: 'Water', init: 10, breath: 7, hp: 44,
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
  // pair (attuning), and a rainbow hand arrives later (the Prism).
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
      { type: 'journey', name: 'The Long Meadow', mp: 6, nightfall: 2, timePenalty: 1, xp: 5 },
    ] },
    { name: 'The Ember Hollow', hardshipChance: 0, hardships: [], encounters: [
      { type: 'fight',   name: 'Sootling',    hp: 8,  init: 4, atk: 1, shape: 'evasion', shapeV: 0, xp: 5 },
      { type: 'journey', name: 'Kilnsmoke Path', mp: 7, nightfall: 3, timePenalty: 1, xp: 5 },
      { type: 'fight',   name: 'Cinder Hound', hp: 10, init: 3, atk: 2, shape: 'armour', shapeV: 2, xp: 6 },
      { type: 'journey', name: 'The Last Rise', mp: 8, nightfall: 3, timePenalty: 2, xp: 6 },
    ] },
  ],
  // 📖 THE OPENING BRIEF — you read these before the first card is dealt. Thomas asked for a
  // paged window you must go through: it is the one place to explain WHAT AN ENCOUNTER IS, which
  // no in-play lesson can do because by then you are already in one.
  intro: [
    { title: 'You are a mage on the road',
      body: 'There is a dragon at the end of the road, and you are what stands between it and everyone behind you.<br><br>' +
            'You carry <b>sixteen cards</b> — the whole of your craft. You will hold <b>four at a time</b>, ' +
            'and every turn you decide what those four are for.' },
    { title: 'A turn is an arrangement',
      body: 'Your four cards sit under four labels, and <b>position is the role</b> — you rearrange by swapping.<br><br>' +
            '<b>SPELL</b> is your action. It is <b>spent</b> afterwards, gone for the rest of the region.<br>' +
            '<b>CATALYST</b> decides who strikes first — and if it shares your Spell\'s element, the Spell <b>attunes</b> and hits far harder.<br>' +
            '<b>SURGE</b> adds its power now, or <b>banks</b> it for next turn.<br>' +
            '<b>ARSENAL</b> is the one card you keep.' },
    { title: 'Two kinds of encounter',
      body: '⚔️ A <b>FIGHT</b> asks for damage. Beat its <b>HP</b> outright to <b>Complete</b> it; reach half for a <b>Narrow</b>, and it hits you back. ' +
            'Each creature defends with a <b>shape</b> — 🛡️ <b>Armour</b> shaves a flat amount off any blow, so it wants one big hit; ' +
            '🌀 <b>Evasion</b> halves you unless you strike first.<br><br>' +
            '👣 A <b>JOURNEY</b> asks for distance. Beat its <b>MP</b> to arrive; fall short and you lose time. ' +
            'It also has a <b>🌙 Nightfall</b> — if your Catalyst is too slow, the dark catches you.<br><br>' +
            'Same four cards, two completely different questions.' },
    { title: 'Your deck is your health',
      body: 'There is no health bar. When something damages you, you <b>blunt your own cards</b> to absorb it — each drops a level, and a card at Lv1 <b>leaves your deck for good</b>.<br><br>' +
            'So every fight costs you something real, and the dragon at the end is a race between <b>its HP</b> and <b>how many cards you have left</b>.<br><br>' +
            'You will lose runs. That is the game working — you learn the shapes, unlock more, and come back.' },
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
      text: '❤️ <b>HP</b> is what it takes to put it down. Deal that much and you <b>Complete</b> the fight. ' +
            'Reach the <b>half</b> and it is a <b>Narrow</b> — you win through, but it still hits you back.' },
    { id: 'f-init', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'fight',
      point: '#encounter-panel .enc-stats span:nth-child(2)',
      text: '💨 <b>Init</b> is the number your <b>Catalyst</b> has to beat. Beat it and you strike first; fail and it gets a hit in before you swing.' },
    { id: 'f-atk', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'fight',
      point: '#encounter-panel .enc-stats span:nth-child(3)',
      text: '⚔️ <b>Atk</b> is what it does to you — once if it strikes first, and again if you fail to Complete. ' +
            'You pay that in <b>cards</b>, so a small number is not a small thing.' },
    { id: 'f-shape', when: () => isAssignPhase() && S.encounter && S.encounter.shape,
      point: '#encounter-panel .enc-stats span:nth-child(4)',
      text: 'Its <b>shape</b> is how it defends. 🛡️ <b>Armour</b> shaves a flat amount off <i>any</i> blow, so it wants <b>one big hit</b>. ' +
            '🌀 <b>Evasion</b> halves you unless you <b>strike first</b>. The shape decides what your turn should be.' },
    { id: 'f-coin', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'fight',
      point: '#encounter-panel .enc-stats span:nth-child(5)',
      text: '🪙 What it pays. Coins buy levels between encounters — and they <b>keep</b>, so you can save for something better.' },
    // 👣 the journey panel asks a different question and gets its own walkthrough
    { id: 'j-mp', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'journey',
      point: '#encounter-panel .enc-stats span:nth-child(1)',
      text: '👣 A journey wants <b>distance</b>, not damage — the same cards, read a different way. Beat its <b>MP</b> to arrive; reach half and you get there late.' },
    { id: 'j-night', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'journey',
      point: '#encounter-panel .enc-stats span:nth-child(2)',
      text: '🌙 <b>Nightfall</b> races your <b>Catalyst</b>. If its Initiative is lower than this, the dark catches you and takes the card in your <b>Arsenal</b>.' },
    { id: 'j-tp', when: () => isAssignPhase() && S.encounter && S.encounter.type === 'journey',
      point: '#encounter-panel .enc-stats span:nth-child(3)',
      text: '⏳ <b>Time Penalty</b> is what arriving late costs — cards burned off the top of your deck. On a journey you lose <b>time</b>, not blood.' },

    { id: 'slots', when: () => S.turn === 1 && isAssignPhase(),
      point: '#slots-panel',
      text: 'Your four cards sit under four labels — <b>position is the role</b>. Tap two cards to swap them, or tap a card then tap a label.' },
    { id: 'spent', when: () => S.turn === 1 && isAssignPhase(),
      point: '.in-Spell',
      text: 'The card under <b>SPELL</b> is your action — and it is <b>spent</b>, gone for the rest of the region. The biggest card is not always the one you can afford to lose.' },
    { id: 'couldattune', when: () => isAssignPhase() && !attunedNow() && handHasPair(),
      point: () => { const id = pairPartnerId(); return id ? '.in-' + (zoneOf(id) || 'Spell') : null; },
      text: 'Two of your cards share an element. Put the matching one under <b>CATALYST</b> and your Spell <b>attunes</b> — it strikes for the bigger ✦ number on its face.' },
    { id: 'attuned', when: () => isAssignPhase() && attunedNow(),
      point: '.attuned-pair',
      text: '✦ <b>Attuned.</b> But your Catalyst is also your <b>Initiative</b> — and your fastest card is rarely the one that matches. <b>Strike first, or strike hard?</b>' },
    { id: 'bank', when: () => isAssignPhase() && banksNow(),
      point: '.in-Boost',
      text: 'Your <b>SURGE</b> matches your Catalyst, so it will <b>bank</b> instead of firing — nothing now, but next turn you aim it at attack, initiative or armour.' },
    { id: 'soak', when: () => S.phase === 'soak',
      point: '#slots-panel',
      text: 'Damage is soaked by <b>blunting your own cards</b> — tap one and it drops a level. <b>Your deck is your health</b>, so every fight costs you something real.' },
    { id: 'stack', when: () => S.phase === 'stack',
      point: '#slots-panel',
      text: 'Your spent cards slide back <b>under your deck</b> — and you choose the order. Tap them in the order you want to see them again.' },
    { id: 'wheel', when: () => S.phase === 'wheel',
      point: '#controls-panel',
      text: 'Coins buy levels. A level makes a card <b>more itself</b> — its best stat rises and its worst falls, so a sharpened card is superb in one slot and poor everywhere else.' },
    { id: 'verb', when: () => S.hand.some(c => verbOf(c)),
      point: '#slots-panel',
      text: '✦ A card at <b>Lv4</b> gains a <b>verb</b> — but only in one slot. Move it there and the verb lights up. Blunt it below Lv4 and the verb is gone.' },
    { id: 'prism', when: () => prismReady(),
      point: '.prism-row',
      text: 'All four elements, so nothing can pair. <b>The Prism</b> lets you draw one and discard one — any card you draw is guaranteed to match something you hold.' },
    { id: 'duel', when: () => S.finalMode && S.finalPhase === 'duel',
      point: '#encounter-panel',
      text: 'The duel is a <b>race</b>. Two bars: its HP, and your remaining cards. <b>You lose when your cards run out</b>, so every card you soak with is stamina you never get back.' },
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
function RUN() { return S && S.tutorial ? TUTORIAL.regions : REGIONS; }

const hasShape = sh => !!(S.dragon && S.dragon.shapes.includes(sh));
// the shape, in one phrase — this is the question the whole run is preparing you for
function dragonShapeText(d) {
  const bits = [];
  if (d.shapes.includes('armour')) bits.push(`🛡️ <b>Armour ${d.shapeV}</b>`);
  if (d.shapes.includes('evasion')) bits.push(`🌀 <b>Evasion</b>`);
  if (d.shapes.includes('relentless')) bits.push(`⏳ <b>Relentless</b>`);
  return bits.join(' + ') || '— unguarded';
}
function dragonDemand(d) {
  const bits = [];
  if (d.shapes.includes('armour')) bits.push(`it shaves <b>${d.shapeV}</b> off every blow`);
  if (d.shapes.includes('evasion')) bits.push(`it <b>halves</b> any blow it saw coming`);
  if (d.shapes.includes('relentless')) bits.push(`its breath <b>grows +${RELENTLESS_STEP} every beat</b>`);
  return bits.join(' · ');
}

// ---------- THE LADDER'S MEMORY (survives runs; separate key from the run save) ----------
const LADDER_KEY = 'emberwick-ladder-1';
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

// THE APPROACH — two ordinary journey-beats racing to the lair (element = the dragon's
// weakness, so you can Attune toward the crack). Complete both → shatter its weakest shield.
const APPROACH = { mp: 13, timePenalty: 2, nightfall: 6 };
const ELEMENTS = ['Fire', 'Water', 'Lightning', 'Stone'];
// dragonWeakness CUT 2026-07-29 — "weakness = the elements it does not shield" cannot survive
// the move to shapes, and a shape has no colour. What replaced it is the SHAPE ITSELF: the
// briefing tells you what the dragon demands, and the whole run is your preparation for it.
// how a creature defends, in one phrase — this is the question the encounter is asking you
function shapeText(e) {
  if (e.shape === 'armour') return `🛡️ <b>Armour ${e.shapeV}</b> — needs one big hit`;
  if (e.shape === 'evasion') return `🌀 <b>Evasion</b> — halves your hit unless you strike first`;
  return '— unguarded';
}

// ============================================================
// CHARMS (2026-07-06) — run-long passives, our answer to Spire's relics. They add NO cards,
// so deck-as-health and legible math survive; they're the prize worth gambling coins for
// (see 08_Ideas/Addiction_Loop.md). Every effect is a plain numeric mod the engine reads,
// so adding a charm is data, not code.
//   mods: armor/atk (optionally element-gated) · init · pace · boost · soak · coin
// ============================================================
const CHARMS = [
  { id: 'emberheart',  name: 'Emberheart',      rarity: 'common', cost: 5,
    text: '🔥 Fire cards gain +1 armor',            mods: { armor: 1, el: 'Fire' } },
  { id: 'tideglass',   name: 'Tideglass Bead',   rarity: 'common', cost: 5,
    text: '💧 Water cards gain +1 armor',           mods: { armor: 1, el: 'Water' } },
  { id: 'stormpin',    name: 'Storm Pin',        rarity: 'common', cost: 6,
    text: '⚡ Lightning cards strike +1',            mods: { atk: 1, el: 'Lightning' } },
  { id: 'nightveil',   name: 'Nightveil',        rarity: 'common', cost: 6,
    text: '🌑 Stone cards strike +1',               mods: { atk: 1, el: 'Stone' } },
  { id: 'swiftwick',   name: 'Swiftwick',        rarity: 'uncommon', cost: 8,
    text: '💨 +1 Initiative every turn',             mods: { init: 1 } },
  { id: 'lanternpace', name: "Lantern-Bearer",   rarity: 'uncommon', cost: 8,
    text: '🌙 +2 Pace against Nightfall',            mods: { pace: 2 } },
  { id: 'tinderbox',   name: 'Deep Tinderbox',   rarity: 'uncommon', cost: 9,
    text: '➕ Your Surge gives +1 more',            mods: { boost: 1 } },
  { id: 'wardstone',   name: 'Wardstone',        rarity: 'uncommon', cost: 9,
    text: '🛡️ Every card soaks +1',                  mods: { soak: 1 } },
  { id: 'coinpurse',   name: "Pilgrim's Purse",  rarity: 'common', cost: 6,
    text: '🪙 +2 coins from every encounter',        mods: { coin: 2 } },
  { id: 'forgemark',   name: 'Forge Mark',       rarity: 'common', cost: 6,
    text: '⚔️ Spell-cards (FORCE) strike +2',        mods: { atk: 2, arch: 'FORCE' } },
  { id: 'quickbrand',  name: 'Quickbrand',       rarity: 'common', cost: 6,
    text: '💨 Catalyst-cards (SPARK) +2 Initiative', mods: { init: 2, arch: 'SPARK' } },
  { id: 'wellstone',   name: 'Wellstone',        rarity: 'common', cost: 6,
    text: '➕ Surge-cards (FLOW) give +2 more',      mods: { boost: 2, arch: 'FLOW' } },
  { id: 'bulwarkpin',  name: 'Bulwark Pin',      rarity: 'common', cost: 6,
    text: '🛡️ Guard-cards (WARD) soak +2',           mods: { soak: 2, arch: 'WARD' } },
  { id: 'brightwick',  name: 'Brightwick',       rarity: 'rare', cost: 14,
    text: '⚔️ All cards strike +1',                  mods: { atk: 1 } },
  { id: 'oathstone',   name: 'Oathstone',        rarity: 'rare', cost: 14,
    text: '🛡️ All cards gain +1 armor',              mods: { armor: 1 } },

  // ☠️ CURSES — charms with negative mods. Never sold on the Wheel; you take one as the PRICE of
  // something in an Event. The engine already sums mods, so a negative charm needs no new
  // machinery — which is why this is the cheapest content the game has.
  { id: 'leadenwick',  name: 'Leaden Wick',      rarity: 'curse', curse: true, cost: 0,
    text: '💨 −2 Initiative on every card',          mods: { init: -2 } },
  { id: 'dulledge',    name: 'Dulled Edge',      rarity: 'curse', curse: true, cost: 0,
    text: '⚔️ Spell-cards (FORCE) strike −2',        mods: { atk: -2, arch: 'FORCE' } },
  { id: 'dampwick',    name: 'Damp Wick',        rarity: 'curse', curse: true, cost: 0,
    text: '➕ Your Surge gives −2',                  mods: { boost: -2 } },
  { id: 'thinplate',   name: 'Thin Plate',       rarity: 'curse', curse: true, cost: 0,
    text: '🛡️ Every card soaks −1',                  mods: { soak: -1 } },
  { id: 'tithe',       name: 'The Tithe',        rarity: 'curse', curse: true, cost: 0,
    text: '🪙 −2 coins from every encounter',        mods: { coin: -2 } },
  { id: 'longshadow',  name: 'Long Shadow',      rarity: 'curse', curse: true, cost: 0,
    text: '🌙 −2 Pace against Nightfall',            mods: { pace: -2 } },
];
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
  let pool = CHARMS.filter(c => c.curse && !(S.charms || []).includes(c.id));
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
// sum a mod across held charms; `el` restricts element-gated charms to matching cards
// 🔑 TWO CLASSIFICATION AXES. A charm can be gated by ELEMENT (Fire cards...) or by ARCHETYPE
// (all your Spell cards...). The archetype gate is the one that PORTS ACROSS CLASSES - every
// class has a FORCE/SPARK/FLOW/WARD shape even when it calls them something else, whereas only
// the mage has Fire cards. Ungated "all cards" charms stay rare and expensive: with the deck at
// 4 of each element and 4 of each archetype, a gate hits exactly a quarter of your 16 cards, so
// an ungated charm is worth four times as much and should cost like it.
function charmMod(key, el, arch) {
  if (!S || !S.charms) return 0;
  let t = 0;
  for (const id of S.charms) {
    const c = charmById(id);
    if (!c || c.mods[key] == null) continue;
    if (c.mods.el && c.mods.el !== el) continue;       // element-gated, this card doesn't match
    if (c.mods.arch && c.mods.arch !== arch) continue; // archetype-gated, ditto
    t += c.mods[key];
  }
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

const SAVE_KEY = 'emberwick-save-1';
// BUG FOUND 2026-07-29: the writer said `v: 4` while the reader demanded `d.v !== 3`, so EVERY
// load silently failed and every reload started a fresh run. One constant now, used by both - the
// two can never drift again. Bumped to 5 here because dragons changed shape (shields -> SHAPE).
const SAVE_VERSION = 5;

function saveGame() {
  if (!S || S.phase === 'reveal') return; // mid-reveal saves would lose the pending resolution
  try {
    const card = c => { // by index — names duplicate across elements. mods (am/at/ee) only when set.
      const o = { id: c.id, n: CARD_DEFS.indexOf(c.def), lv: c.level };
      return o;
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      v: SAVE_VERSION, uid, dragon: S.dragon ? S.dragon.name : null,
      region: S.region, turn: S.turn, regionTurn: S.regionTurn,
      deck: S.deck.map(card), hand: S.hand.map(card),
      discard: S.discard.map(card), trashed: S.trashed.map(card),
      queue: S.encounterQueue.map(e => e.name),
      results: S.results, phase: S.phase,
      encounter: S.encounter ? S.encounter.name : null,
      hardship: S.hardship, rangedDodge: S.rangedDodge, loseReserve: S.loseReserve,
      poison: S.poison, afterSoak: S.afterSoak,
      assign: S.assign, divertsUsed: S.divertsUsed,
      boostTarget: S.boostTarget, coins: S.coins, charms: S.charms, damage: S.damage, damageEl: S.damageEl,
      downgraded: [...S.downgraded], actionSetIds: S.actionSetIds, reserveId: S.reserveId,
      stack: S.stack,
      finalMode: S.finalMode, finalPhase: S.finalPhase, dragonState: S.dragonState,
      approachOutcomes: S.approachOutcomes, duelBeat: S.duelBeat, defeatMsg: S.defeatMsg,
      pendingEvent: S.pendingEvent, event: S.event,
      eventsSeen: S.eventsSeen, eventFlags: S.eventFlags,
      wake: S.wake, wakeTarget: S.wakeTarget, wakePending: S.wakePending, prismUsed: S.prismUsed,
      duelStamina0: S.duelStamina0, stats: S.stats, tutorial: S.tutorial, candle: S.candle,
      taught: S.taught, lessonsOff: S.lessonsOff,
      curseNextFight: S.curseNextFight, paceBless: S.paceBless, emberShield: S.emberShield,
      logEntries: S.logEntries.slice(0, 40),
    }));
  } catch (err) { /* storage unavailable — play on without saves */ }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (d.v !== SAVE_VERSION) return false;
    const mk = s => {
      const def = CARD_DEFS[s.n];
      if (!def) return null;
      const c = { id: s.id, def, level: s.lv };
      return c;
    };
    const deck = d.deck.map(mk), hand = d.hand.map(mk), discard = d.discard.map(mk), trashed = d.trashed.map(mk);
    if ([...deck, ...hand, ...discard, ...trashed].some(c => !c)) return false; // card data changed since save
    const region = RUN()[d.region - 1];
    if (!region) return false;
    const encounter = d.encounter ? region.encounters.find(e => e.name === d.encounter) : null;
    const stable = ['summary', 'defeat', 'victory', 'event', 'wheel'];
    if (!encounter && !d.finalMode && !stable.includes(d.phase)) return false;
    uid = d.uid;
    S = {
      tutorial: !!d.tutorial, taught: d.taught || [], lessonsOff: !!d.lessonsOff,
      candle: d.candle !== false,
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
      approachOutcomes: d.approachOutcomes || [], duelBeat: d.duelBeat || 0, duelResult: null,
      defeatMsg: d.defeatMsg,
      pendingEvent: d.pendingEvent || false, event: d.event || null,
      eventsSeen: d.eventsSeen || [], eventFlags: d.eventFlags || {},
      wake: d.wake || 0, wakeTarget: d.wakeTarget || null, wakePending: d.wakePending || 0,
      prism: null, prismUsed: d.prismUsed || false, duelStamina0: d.duelStamina0 || 0,
      stats: d.stats || { attuneAvail: 0, attuned: 0, duelDmg: 0, duelBeats: 0 },
      curseNextFight: d.curseNextFight || false, paceBless: d.paceBless || 0, emberShield: d.emberShield || false,
      logEntries: d.logEntries || [],
    };
    if (S.encounterQueue.length === 0) S.encounterQueue = S.tutorial ? region.encounters.slice() : shuffle(region.encounters);
    // the finale's encounter is synthetic (not in the region tables) — rebuild it for the saved beat
    if (S.finalMode) {
      if (S.finalPhase === 'duel') {
        S.encounter = { type: 'fight', name: S.dragon.name, dragon: true, hp: 9999,
          init: S.dragon.init, atk: Math.ceil(S.dragon.breath / 2), atkEl: S.dragon.element, xp: 0, finale: true };
      } else {
        const weak = S.dragon.element;
        const beat = (S.approachOutcomes.length || 0) + 1;
        S.encounter = { type: 'journey', name: `Approach to the ${S.dragon.name} · ${beat}/2`,
          mp: APPROACH.mp, timePenalty: APPROACH.timePenalty, nightfall: APPROACH.nightfall,
          element: weak, xp: 0, finale: true };
      }
    }
    render();
    return true;
  } catch (err) { return false; }
}

// 🗺️ THE STAGES SCREEN. Not a difficulty menu bolted on the side — the stage IS the difficulty,
// so picking one is the same act as choosing which problem you want to solve tonight.
function showStages() {
  S = S || {};
  S.phase = 'ladder';
  S.encounter = null;
  render();
}
function startStage(n) {
  freshGame(n);
  // 📖 Stage 0 opens on the brief. You read it before a card is dealt — it is the only place that
  // can explain what an ENCOUNTER is, because every in-play lesson arrives once you are in one.
  if (n === 0) { S.introPage = 0; S.phase = 'intro'; }
  render();
}
function introNext(d) {
  S.introPage = Math.max(0, (S.introPage || 0) + d);
  if (S.introPage >= TUTORIAL.intro.length) { S.introPage = 0; S.phase = 'assign'; }
  render();
}

function freshGame(stage) {
  try { localStorage.removeItem(SAVE_KEY); } catch (err) {}
  const tutorialRun = stage === 0;
  TSEED = 20260729;   // 🎲 the tutorial's fixed seed — same run, every time
  // 🎓 the tutorial deals from an authored order; every other run shuffles
  const cards = tutorialRun
    ? TUTORIAL.deckOrder.map(n => newCard(CARD_DEFS.find(d => d.name === n))).filter(Boolean)
    : shuffle(CARD_DEFS.map(newCard));
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
    encounterQueue: tutorialRun ? TUTORIAL.regions[0].encounters.slice() : shuffle(REGIONS[0].encounters),
    results: { Complete: 0, Narrow: 0, Loss: 0 },
    phase: null,
    encounter: null,
    hardship: null,      // active Hardship name or null
    rangedDodge: false,  // dead since 2026-07-29 (the dodge was cut); kept so old saves still load
    loseReserve: null,   // reason string — Reserve is discarded in Cleanup
    poison: 0,           // damage owed to the NEXT drawn hand
    afterSoak: 'upgrade', // where the soak phase exits to: 'upgrade' | 'turnEnd'
    assign: { Spell: null, Element: null, Boost: null, Reserve: null }, // card ids
    divertsUsed: 0,   // resets every time an encounter is actually faced
    diverting: false, // true while choosing which hand card to discard
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
    stack: null,          // 🃏 mid-exchange: { ids, order } while you stack the deck
    // the Dragon Duel finale:
    finalMode: false,     // true once Region 4 is cleared and the finale begins
    finalPhase: null,     // 'approach' | 'duel'
    dragonState: null,    // { hp, maxHp, boon } — the persistent dragon
    approachOutcomes: [], // outcome of each of the 2 approach beats (both Complete → a boon)
    duelBeat: 0,          // duel beat counter (for the log)
    duelResult: null,     // stashed resolution carried across the staged reveal into finishDuel
    defeatMsg: null,
    pendingEvent: false, // a Complete/Narrow journey owes an Event this turn
    event: null,         // active event state { id, step, opt, targetId, wantElement, lines }
    // ---- cross-turn event effects (run layer) ----
    eventsSeen: [],        // ids of events already drawn this run (for `once` events)
    eventFlags: {},        // what you DID in past events, so later ones can react
    // 🔥 THE EMBERWAKE (2026-07-29). `wake` is the token you hold RIGHT NOW and may aim this
    // turn; `wakePending` is what you banked this turn and collect at cleanup. It expires after
    // one turn on purpose - a token that keeps would make farming banks on easy encounters the
    // optimal line, and the run would become savings-account management.
    wake: 0, wakeTarget: null, wakePending: 0,
    // 📊 what the GRADE reads. Tracked as you play so a run can report on itself.
    // 🕯️ THE CANDLE. Lit, you can see the next encounter. See lightCandle/snuffCandle.
    candle: true,
    stats: { attuneAvail: 0, attuned: 0, duelDmg: 0, duelBeats: 0 },
    emberguardUsed: false,   // ✦ Emberguard is once per encounter
    duelStamina0: 0,    // cards you arrived at the lair with — the duel's other health bar
    prism: null,        // ✦ the drawn card, held OUTSIDE the hand until you place or refuse it
    prismUsed: false,   // once per turn
    curseNextFight: false, // Cache/Mirror Fen: force a Hardship on the next fight
    paceBless: 0,          // Gray Pilgrim/Mirror Fen: +2 Pace on this many upcoming journeys
    emberShield: false,    // Ember Hollow: your Arsenal survives Nightfall (rest of region)
    logEntries: [], // [{header, lines:[{text, cls}]}], newest first
  };
  draw(HAND_SIZE);
  nextTurn();
  // the Dragon is fully revealed from turn 1 — the run's reference frame
  // 🐉 THE BRIEFING. The dragon is known from turn 1 — and now that it is a STAGE rather than a
  // random draw, the reveal is a briefing rather than a surprise, which is what makes a run
  // soft-directional: everything you level and every card you stack is preparation for a problem
  // you can already name.
  log(`🐉 STAGE ${S.dragon.stage} — beyond Region ${RUN().length} waits <b>${S.dragon.name}</b> ${elIcon(S.dragon.element)}. ${dragonShapeText(S.dragon)}: ${dragonDemand(S.dragon)}. ${S.dragon.brief} <b>It asks one thing of you: ${S.dragon.teaches}.</b>`);
  render();
}

// always-available restart (header button) — guarded so a run isn't wiped by a mis-tap
function newGame() {
  if (confirm('Start a new run? Your current run will be lost.')) showStages();
}

function nextRegion() {
  if (S.region >= RUN().length) { freshGame(); return; }
  S.regionTurn = 0;
  // reshuffle everything non-trashed, keep levels
  const pool = shuffle([...S.deck, ...S.discard, ...S.hand]);
  S.region++;
  S.deck = pool;
  S.hand = [];
  S.discard = [];
  S.emberShield = false; // the Ember Hollow ward lasts only the region it was banked in
  S.encounterQueue = S.tutorial ? RUN()[S.region - 1].encounters.slice() : shuffle(RUN()[S.region - 1].encounters);
  draw(HAND_SIZE);
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
  const am = charmMod('armor', d.element, d.arch);
  const at = charmMod('atk', d.element, d.arch);
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
    attuned: adj(v) + card.level + ATTUNE_BONUS,
    // `ev` (the old Attuned value, column 2) is DEAD DATA - power comes from pile depth now
    // 💨 THE INITIATIVE FLOOR (2026-07-29). Sharpening drove every non-SPARK card's init to 0-1,
    // so only 4 of the 16 cards could ever contest a race and the deck's MEDIAN init FELL as you
    // levelled (3 → 2 → 1 → 1). Measured: 32% of hands held nothing that could clear the enemy —
    // initiative was weather, not a decision. A card at init 0 isn't sharpened, it's DISQUALIFIED
    // from the Catalyst slot, which breaks the 16-card brief's own test (every card wanted in ≥2
    // slots). The floor keeps SPARK enormously faster (13 vs 3 at Lv4) — it stops the rest being
    // unable to play at all. Paired with a -2 on creature Initiative so the two ranges overlap.
    init: Math.max(INIT_FLOOR, init + charmMod('init', d.element, d.arch)),
    boost: boost + charmMod('boost', d.element, d.arch), armor: Math.max(0, armor + am), cost,
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
function zoneOf(cardId) { return ZONES.find(z => S.assign[z] === cardId) || null; }

function elOf(card) { return card.def.element; }

// ============================================================
// logging
// ============================================================
function logHeader(text) { S.logEntries.unshift({ header: text, lines: [] }); }
function log(text, cls = '') { S.logEntries[0].lines.push({ text, cls }); }

// ============================================================
// turn flow
// ============================================================
function drawEncounter(avoidType) {
  const region = RUN()[S.region - 1];
  if (S.encounterQueue.length === 0) S.encounterQueue = S.tutorial ? region.encounters.slice() : shuffle(region.encounters);
  // normal turns take the next in the shuffled bag; Divert steers toward a DIFFERENT
  // type (its whole purpose) — falling back to next-in-bag only if the bag has no other type left.
  let idx = 0;
  if (avoidType) {
    const diff = S.encounterQueue.findIndex(e => e.type !== avoidType);
    if (diff !== -1) idx = diff;
  }
  S.encounter = S.encounterQueue.splice(idx, 1)[0];
  if (S.encounterQueue.length === 0) S.encounterQueue = S.tutorial ? region.encounters.slice() : shuffle(region.encounters);
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
  if (S.hardship) log(`HARDSHIP — ${S.hardship}: ${HARDSHIPS[S.hardship]}`, 'bad');
}

function nextTurn() {
  S.turn++;
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
  drawEncounter();
  S.assign = { Spell: null, Element: null, Boost: null, Reserve: null };
  S.divertsUsed = 0;
  S.diverting = false;
  S.loseReserve = null;
  S.afterSoak = 'upgrade';
  // coins roll over between turns — deliberately NOT reset
  S.damage = 0;
  S.damageEl = null;
  S.prism = null; S.prismUsed = false; S.emberguardUsed = false;
  S.downgraded = new Set();
  S.actionSetIds = [];
  S.reserveId = null;
  // a creature becomes a persistent foe with an HP pool (the finale runs its own path)
  S.phase = 'assign';
  logHeader(`— Turn ${S.turn} (Region ${S.region}) —`);
  logChallenge();
  render();
}

// ---------- Divert (Challenge Phase, optional) ----------
function canDivert() {
  return S.phase === 'assign' && !S.finalMode && S.divertsUsed < MAX_DIVERTS && S.deck.length > 0;
}

function beginDivert() { if (canDivert()) { S.diverting = true; render(); } }
function cancelDivert() { S.diverting = false; render(); }

function divertWith(cardId) {
  if (!S.diverting || !canDivert()) return;
  const card = cardById(cardId);
  if (!card) return;
  for (const z of ZONES) if (S.assign[z] === cardId) S.assign[z] = null;
  S.assign.Reserve = null; // hand shrank — reserve re-normalizes (or is gone)
  S.hand = S.hand.filter(c => c.id !== cardId);
  S.discard.push(card);
  const key = S.deck.shift();
  S.discard.push(key);
  S.divertsUsed++;
  S.diverting = false;
  const skipped = S.encounter.name;
  const skippedType = S.encounter.type;
  drawEncounter(skippedType); // steer toward a different encounter type
  const swapped = S.encounter.type !== skippedType;
  log(`DIVERT: skipped ${skipped} — burned ${key.def.name} off the top of the deck + ${card.def.name} from hand → ${swapped ? `now a ${S.encounter.type}` : `still a ${S.encounter.type} (no other type left in this stretch)`} (${MAX_DIVERTS - S.divertsUsed} divert${MAX_DIVERTS - S.divertsUsed === 1 ? '' : 's'} left)`, 'bad');
  logChallenge();
  render();
}

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
  if (!isAssignPhase() || S.diverting) return;
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
  const spellEl = a.element;
  const pileVal = a.value;
  // enhUsed/isEnh/enhEl are the engine's long-standing "this action was attuned" fields. The mage
  // supplies them from its own pairing rule; a class that has no elements simply leaves them false.
  const enhUsed = !!a.attuned, isEnh = enhUsed, enhEl = spellEl, resonant = false;
  const attBonus = a.attBonus || 0;
  const banks = !!a.banks, bank = a.bank || 0, wake = a.wake || 0, wakeTarget = a.wakeTarget || null;
  const boostVal = a.boost;

  const h = S.hardship;
  const ability = e.ability || null;
  const elemInit = a.init;
  // Night Travel: Boost reduced by the Catalyst's Initiative, min 0
  const boostEff = h === 'Night Travel' ? Math.max(0, boostVal - elemInit) : boostVal;
  const nightCut = boostVal - boostEff;

  if (e.type === 'fight') {
    // ✦ Lv4 CATALYST verbs shape the race itself
    const vS = a.vSpell, vE = a.vElem;
    const init = elemInit;   // Initiative belongs to the Catalyst alone (charms apply in eff)
    // Slipstream only counts against 🌀 Evasion — it buys you the shape's answer, not the race
    const evInit = init + (vE === 'Slipstream' ? 4 : 0);
    const initLost = vE === 'Outpace' ? false : e.init > init;
    // Ranged deals Early Damage even when you win Initiative — no opt-out (dodge cut 2026-07-29)
    const rangedHits = ability === 'Ranged' && !initLost;   // it shoots you whether or not you're fast
    let early = initLost || rangedHits ? e.atk : 0;
    if (h === 'Ambush') early *= 2;
    if (vE === 'Bedrock') early = 0;                       // ✦ Bedrock: the early shot never lands
    const wrongType = false;
    const base = pileVal;
    const withBoost = base + boostEff;
    // 🔑 SHAPED DEFENCE (2026-07-28). Enemy armour is no longer a COLOUR you had to match with
    // an elemental attack - a rule no non-elemental class could ever join - but a SHAPE, stated
    // in engine terms so every class can answer it with whatever it produces.
    //   🛡️ ARMOUR  flat reduction off every hit -> small hits are eaten, so it wants ONE BIG HIT
    //   🌀 EVASION  your hit is HALVED unless you won Initiative -> it wants SPEED
    // (🧱 GUARD - a breakable pool beaten by MANY hits - is deliberately absent: the mage lands
    //  exactly one hit, so it has nothing to bite on. It is the rogue's lock, not the mage's.)
    // ✦ Overwhelm ignores Armour · Landslide can't be halved · Slipstream beats Evasion's check
    const armorCut = (e.shape === 'armour' && vS !== 'Overwhelm') ? (e.shapeV || 0) : 0;
    const evaded = e.shape === 'evasion' && vS !== 'Landslide' && (e.init > evInit);
    let value = Math.max(0, withBoost - armorCut);
    if (evaded) value = Math.floor(value / 2);
    if (vS === 'Thunderhead' && !initLost) value += 4;      // ✦ strike first, strike harder
    // 'Slow' CUT with the Attack/Move split - it only meant "compare your other value", and
    // there is no other value now. Abilities get revisited wholesale at shaped defence.
    const half = Math.ceil(e.hp / 2);
    const outcome = value >= e.hp ? 'Complete' : value >= half ? 'Narrow' : 'Loss';
    // ✦ Undertow: a strike that falls short still costs you nothing in return
    const combatDmg = (outcome !== 'Complete' && vS !== 'Undertow') ? e.atk : 0;
    const timePenalty = h === 'Hazards' ? (early > 0 ? 1 : 0) + (combatDmg > 0 ? 1 : 0) : 0;
    const stormDmg = h === 'Storm' ? timePenalty : 0;
    let loseReserve = null;
    // the dodge only costs the Arsenal when it actually cancels the ranged hit (you won initiative)
    if (ability === 'Freeze' && early > 0) loseReserve = 'Frozen (took Early Damage)';
    const poison = ability === 'Poison' ? (early > 0 ? 1 : 0) + (combatDmg > 0 ? 1 : 0) : 0;
    return { type: 'fight', spell, hits, attBonus, banks, bank, wake, wakeTarget, vSpell: vS, vElem: vE, shape: e.shape || null, armorCut, evaded, elem, boostC, boostVal, boostEff, nightCut, resonant, spellEl, enhEl, isEnh, enhUsed, wrongType,
             base, withBoost, armorCut, value, init, initLost, rangedHits, early, half, outcome,
             combatDmg, timePenalty, stormDmg, loseReserve, poison, ability, hardship: h };
  }
  const wrongType = false;
  const base = pileVal;
  const withBoost = base + boostEff;
  // JOURNEY ELEMENT BONUS CUT 2026-07-26 - the most obscure rule in the game (the tell: months
  // of playtesting and Thomas never mentioned it once). Journeys already carry MP, Nightfall,
  // Pace and perils. Kept as a zeroed field so the log/solver result shapes do not change.
  const reserveBonus = 0;
  const value = withBoost + reserveBonus;
  // Pace vs Nightfall: your Catalyst's Initiative (+ Boost if targeted) races the dark
  const paceBless = (S.paceBless || 0) > 0 ? 2 : 0; // Gray Pilgrim / Mirror Fen blessing
  const pace = elemInit + paceBless + charmMod('pace');   // Pace belongs to the Catalyst alone
  const nightfall = e.nightfall || 0;
  const nightCaught = nightfall > pace;
  // Steep peril: the journey's MP grows by your Arsenal's Boost
  const peril = e.peril || null;
  const steepAdd = peril === 'Steep' && reserve ? eff(reserve).boost : 0;
  const mpEff = e.mp + steepAdd;
  const half = Math.ceil(mpEff / 2);
  const outcome = value >= mpEff ? 'Complete' : value >= half ? 'Narrow' : 'Loss';
  const timePenalty = outcome !== 'Complete' ? e.timePenalty : 0;
  const stormDmg = h === 'Storm' ? timePenalty : 0;
  const treacherousDmg = peril === 'Treacherous' && outcome !== 'Complete' ? 1 : 0;
  // Ember Hollow wards the Arsenal: you may still be caught, but the night can't snuff your Arsenal
  const emberShielded = nightCaught && reserve && S.emberShield;
  // 🌙 caught after dark: the Arsenal is only half of it
  const loseReserve = nightCaught && reserve && !S.emberShield ? 'caught by Nightfall' : null;
  return { type: 'journey', spell, hits, attBonus, banks, bank, wake, wakeTarget, elem, boostC, boostVal, boostEff, nightCut, resonant, spellEl, enhEl, isEnh, enhUsed, wrongType,
           base, withBoost, reserveBonus, value, mpEff, half, outcome, reserve, early: 0, combatDmg: 0,
           pace, nightfall, nightCaught, paceBless, emberShielded, peril, steepAdd, treacherousDmg,
           timePenalty, stormDmg, loseReserve, poison: 0, ability: null, hardship: h };
}

// ---------- Phase 2/3: resolve action, queue penalties ----------
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

  log(`The weave — Spell: ${displayName(spell)} Lv${spell.level} (${r.spellEl}) = ${r.base}` +
      ` · Catalyst: ${elem ? `${elem.def.name} (${elem.def.wild ? 'Wild' : elOf(elem) || 'colorless'}, Init ${eff(elem).init})` : '—'}` +
      ` · Surge: ${boostC ? `${boostC.def.name} (+${boostVal} → ${S.boostTarget})` : '—'}` +
      ` · Arsenal: ${reserve ? reserve.def.name : '—'}`);

  // ---- build the staged reveal (numbers only appear AFTER you commit) ----
  const L = (text, cls = '') => ({ text, cls });
  const beats = [];

  if (r.type === 'fight') {
    const b1 = [];
    if (r.nightCut > 0) b1.push(L(`Night Travel: Boost reduced by your Catalyst's Initiative (${boostVal} − ${elem ? eff(elem).init : 0}) → +${r.boostEff}`, 'bad'));
    if (r.enhUsed) b1.push(L(`✦ ATTUNED — ${elem.def.name} is ${elOf(elem)} like ${spell.def.name} → Atk ${r.base - r.attBonus} + ${r.attBonus} = ${r.base}`, 'good'));
    else b1.push(L(`Attack: ${r.base} — unattuned${elem ? ` (${elem.def.name} is ${elOf(elem)}, not ${r.spellEl})` : ' (no Catalyst)'}`));
    // the Surge ALWAYS feeds the action (the Attack/Initiative picker is gone), so this line must
 // never be gated on the retired boostTarget - it was silently adding damage the log didn't show.
    if (r.banks) b1.push(L(`🔥 BANKED — ${boostC.def.name} is ${elOf(boostC)} like your Catalyst, so it feeds nothing now: +${r.bank} Emberwake for next turn`, 'good'));
    else if (boostC) b1.push(L(`Surge: ${boostC.def.name} +${r.boostEff} → ${r.withBoost}`));
    if (r.wakeTarget === 'atk' && r.wake) b1.push(L(`🔥 Emberwake +${r.wake} spent on the strike`, 'good'));
    if (r.armorCut) b1.push(L(`🛡️ Armour ${r.armorCut}: it shrugs off all but the heaviest blow → ${r.withBoost} − ${r.armorCut}`, 'bad'));
    if (r.evaded) b1.push(L(`🌀 Evasion: you were too slow — it slips the blow, damage halved → ${r.value}`, 'bad'));
    beats.push({ label: '⚔️ ATTACK', big: r.value, vs: `vs ❤️ ${e.hp} (half ${r.half})`, numCls: r.enhUsed ? 'enh' : '', lines: b1 });

    const b2 = [];
    if (r.initLost) b2.push(L(`Initiative: yours ${r.init} vs enemy ${e.init} → enemy is faster → Early Damage ${e.atk}`, 'bad'));
    else if (r.rangedHits) b2.push(L(`Initiative: yours ${r.init} vs enemy ${e.init} → you act first, but RANGED hits anyway → Early Damage ${e.atk}`, 'bad'));
    else b2.push(L(`Initiative: yours ${r.init} vs enemy ${e.init} → you act first, no Early Damage`, 'good'));
    if (r.early > 0 && S.hardship === 'Ambush') b2.push(L(`Ambush: Early Damage doubled → ${r.early}`, 'bad'));
    beats.push({ label: '💨 INITIATIVE', big: r.init, vs: `vs ${e.init}`, numCls: r.early ? 'bad' : 'ok', lines: b2 });

    beats.push({ outcomeBeat: true, final: true, lines: [
      L(`Attack ${r.value} vs HP ${e.hp} (half = ${r.half}) → ${r.outcome.toUpperCase()} ${r.outcome !== 'Loss' ? `· 🪙 +${e.xp}` : ''}${r.outcome !== 'Complete' ? ` · Combat Damage ${e.atk}` : ''}`,
        r.outcome === 'Loss' ? 'bad result' : r.outcome === 'Narrow' ? 'result' : 'good result'),
    ] });
  } else {
    const b1 = [];
    if (r.nightCut > 0) b1.push(L(`Night Travel: Boost reduced by your Catalyst's Initiative (${boostVal} − ${elem ? eff(elem).init : 0}) → +${r.boostEff}`, 'bad'));
    if (r.steepAdd) b1.push(L(`Steep: MP raised by your Arsenal's Boost → ${e.mp} + ${r.steepAdd} = ${r.mpEff}`, 'bad'));
    if (r.enhUsed) b1.push(L(`✦ ATTUNED — ${elem.def.name} is ${elOf(elem)} like ${spell.def.name} → Move ${r.base - r.attBonus} + ${r.attBonus} = ${r.base}`, 'good'));
    else b1.push(L(`Move: ${r.base} — unattuned${elem ? ` (${elem.def.name} is ${elOf(elem)}, not ${r.spellEl})` : ' (no Catalyst)'}`));
    if (r.banks) b1.push(L(`🔥 BANKED — ${boostC.def.name} is ${elOf(boostC)} like your Catalyst, so it feeds nothing now: +${r.bank} Emberwake for next turn`, 'good'));
    else if (boostC) b1.push(L(`Surge: ${boostC.def.name} +${r.boostEff} → ${r.withBoost}`));
    if (r.wakeTarget === 'atk' && r.wake) b1.push(L(`🔥 Emberwake +${r.wake} spent on the strike`, 'good'));

    beats.push({ label: '👣 MOVE', big: r.value, vs: `vs MP ${r.mpEff}${r.steepAdd ? ` (${e.mp}+${r.steepAdd} Steep)` : ''} (half ${r.half})`, numCls: r.enhUsed ? 'enh' : '', lines: b1 });

    const b2 = [];
    if (r.paceBless) b2.push(L(`Gray Pilgrim's blessing: +2 Pace → ${r.pace}`, 'good'));
    if (r.nightCaught && r.emberShielded) b2.push(L(`Pace: yours ${r.pace} vs Nightfall ${r.nightfall} → caught after dark, but the Ember Hollow wards your Arsenal (${r.reserve.def.name}) — it survives`, 'good'));
    else if (r.nightCaught) b2.push(L(`Pace: yours ${r.pace} vs Nightfall ${r.nightfall} → caught after dark${r.reserve ? ` → the night snuffs your Arsenal (${r.reserve.def.name})` : ' (no Arsenal to lose)'}`, 'bad'));
    else b2.push(L(`Pace: yours ${r.pace} vs Nightfall ${r.nightfall} → home before dark`, 'good'));
    beats.push({ label: '🌙 PACE', big: r.pace, vs: `vs Nightfall ${r.nightfall}`, numCls: r.nightCaught && !r.emberShielded ? 'bad' : 'ok', lines: b2 });

    beats.push({ outcomeBeat: true, final: true, lines: [
      L(`Move ${r.value} vs MP ${r.mpEff} (half = ${r.half}) → ${r.outcome.toUpperCase()} ${r.outcome !== 'Loss' ? `· 🪙 +${e.xp}` : ''}${r.outcome !== 'Complete' ? ` · Time Penalty ${e.timePenalty}` : ''}`,
        r.outcome === 'Loss' ? 'bad result' : r.outcome === 'Narrow' ? 'result' : 'good result'),
    ] });
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
    const dmg = r.early + r.combatDmg + (r.treacherousDmg || 0) + r.stormDmg;
    if (dmg > 0) subs.push(`<div class="pv-sub bad">damage to soak: ${dmg}</div>`);
    if (r.timePenalty > 0) subs.push(`<div class="pv-sub bad">⏳ Time Penalty ${r.timePenalty}</div>`);
    if (r.poison > 0) subs.push(`<div class="pv-sub bad">☠️ Poison: ${r.poison} to your next hand</div>`);
    if (r.loseReserve) subs.push(`<div class="pv-sub bad">your Arsenal is lost — ${r.loseReserve}</div>`);
    return `<div class="pv-stat pv-result${pop}"><span class="oc oc-${r.outcome}">${r.outcome.toUpperCase()}</span>${subs.join('')}</div>`;
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
  // a Gray Pilgrim / Mirror Fen blessing covers a limited number of journeys — spend a charge
  if (r.type === 'journey' && (S.paceBless || 0) > 0) S.paceBless--;
  // in the finale's Approach, each journey-beat's outcome is banked (both Complete → crack a shield)
  if (S.finalMode && S.finalPhase === 'approach') S.approachOutcomes.push(r.outcome);
  // a journey you Complete or Narrow earns an Event at turn's end (the place you arrive) — never in the finale
  else if (r.type === 'journey' && r.outcome !== 'Loss') S.pendingEvent = true;
  if (r.banks) S.wakePending = r.bank;
  // 🕯️ a clean win keeps your footing; anything less costs it — and the dark takes it regardless
  if (!S.finalMode) {
    if (r.nightCaught) snuffCandle('the dark caught you on the road');
    else if (r.outcome === 'Complete') lightCandle('you come through cleanly');
    else snuffCandle(r.outcome === 'Narrow' ? 'you scraped through' : 'the encounter went badly');
  }
  // 📊 CRAFT: could this hand have attuned at all, and did you find it? Availability is a
  // property of the HAND (any same-element pair), so the stat measures your play, not your luck.
  if (S.stats) {
    const els = S.hand.map(c => elOf(c));
    if (els.some((e, i) => els.indexOf(e) !== i)) S.stats.attuneAvail++;
    if (r.enhUsed) S.stats.attuned++;
  }
  // 🪙 COINS CANNOT GO NEGATIVE (fixed 2026-07-29). ☠️ The Tithe takes 2 from every encounter, so a
  // low-XP one — the Approach pays 0 — drove the purse below zero and the Wheel offered prices
  // against a debt. A curse should take what you HAVE, never put you in the red: negative money
  // is a state with no way back, and it silently taxed every future encounter too.
  // The log also printed "+-2 coins", which is its own small lie about what happened.
  if (r.outcome !== 'Loss') {
    const g = e.xp + charmMod('coin');
    const got = Math.max(g, -S.coins);          // it can empty your purse, never overdraw it
    S.coins = Math.max(0, S.coins + g);
    if (got >= 0) log(`+${got} coins (you now hold ${S.coins})`, 'good');
    else log(`${got} coins — ${e.xp ? `${e.xp} earned, but the Tithe takes its share` : 'the Tithe takes its share'} (you now hold ${S.coins})`, 'bad');
  }
  let damage = r.early + r.combatDmg + (r.treacherousDmg || 0);
  if (r.treacherousDmg) log(`Treacherous: no Complete Victory → +${r.treacherousDmg} damage`, 'bad');
  if (r.stormDmg > 0) { damage += r.stormDmg; log(`Storm: Time Penalties also deal ${r.stormDmg} damage`, 'bad'); }
  if (r.loseReserve) S.loseReserve = r.loseReserve;
  if (r.poison > 0) S.poison = r.poison;
  S.damageEl = null;   // dead since soak doubling was cut 2026-07-26; kept in the schema for old saves
  if (r.timePenalty > 0) {
    if (r.type === 'fight') log(`Hazards: ${r.timePenalty} Time Penalt${r.timePenalty === 1 ? 'y' : 'ies'} (early/combat damage suffered)`, 'bad');
    const fromDeck = Math.min(r.timePenalty, S.deck.length);
    const burned = S.deck.splice(0, fromDeck);
    if (fromDeck > 0) {
      S.discard.push(...burned);
      log(`Time Penalty: discarded ${fromDeck} from top of deck (${burned.map(c => c.def.name).join(', ')})`, 'bad');
    }
    const overflow = r.timePenalty - fromDeck;
    if (overflow > 0) {
      damage += overflow;
      log(`Deck is empty — remaining Time Penalty ${overflow} becomes damage`, 'bad');
    }
  }
  // 🛡️ an Emberwake aimed at armour simply takes the hit for you
  if (S.wakeTarget === 'armor' && S.wake > 0 && damage > 0) {
    const stop = Math.min(damage, S.wake);
    damage -= stop;
    log(`🔥 Emberwake holds — ${stop} damage turned aside`, 'good');
  }
  S.damage = damage;
  if (damage > 0) { log(`Damage to soak: ${damage}`, 'bad'); startSoak(); }
  else startUpgrade();
}

// ---------- Phase 3: soak damage by downgrading ----------
function soakValue(card) {
  // SOAK DOUBLING CUT 2026-07-26 - an element check in the most stressful phase in the game,
  // and a rule no non-elemental class could ever join. Armour simply soaks its printed value.
  const armor = eff(card).armor || 0;
  if (armor <= 0) return 0;
  const v = verbOf(card);
  const frost = v && v.name === 'Frostbite' ? 4 : 0;      // ✦ Frostbite soaks well beyond its plate
  return armor + frost + charmMod('soak', card.def.element, card.def.arch);
}

function soakEligible() { return S.hand.filter(c => !S.downgraded.has(c.id)); }

function startSoak() {
  S.phase = 'soak';
  const maxSoak = soakEligible().reduce((t, c) => t + soakValue(c), 0);
  if (maxSoak < S.damage) knockOut();
  else render();
}

function downgrade(card, why) {
  S.downgraded.add(card.id);
  if (card.level <= 1) {
    S.hand = S.hand.filter(c => c.id !== card.id);
    S.trashed.push(card);
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
    downgrade(card, `, soaking ${soak}${bulwark ? ' — ✦ Bulwark turns aside everything' : ''}`);
  }
  if (v && v.name === 'Groundwire') { S.wakePending = (S.wakePending || 0) + 2; log(`✦ Groundwire — the blow earns you a 🔥 +2 Emberwake.`, 'good'); }
  S.damage = Math.max(0, S.damage - soak);
  if (S.damage <= 0) {
    log(`All damage soaked.`);
    exitSoak();
  } else {
    log(`${S.damage} damage remaining.`, 'bad');
    const maxSoak = soakEligible().reduce((t, c) => t + soakValue(c), 0);
    if (maxSoak < S.damage) knockOut();
    else render();
  }
}

function knockOut() {
  // being knocked out mid-fight ENDS the fight — you're in no shape to keep swinging
  log(`Cannot soak all the damage → KNOCKED OUT`, 'bad result');
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

function upgradable(card) {
  const cost = eff(card).cost;
  return card.level < MAX_LEVEL && !S.downgraded.has(card.id) && cost != null && cost <= S.coins;
}

// build one offer; `rich` (camp) leans rarer
function rollOffer(rich) {
  const roll = rnd();
  const heldCharms = S.charms || [];
  const pool = CHARMS.filter(c => !heldCharms.includes(c.id) && !c.curse &&
    (rich ? true : c.rarity !== 'rare'));
  // a Charm shows up more often at camp
  if (pool.length && roll < (rich ? 0.5 : 0.28)) {
    const c = rand(pool);
    return { kind: 'charm', id: c.id, name: c.name, text: c.text, rarity: c.rarity, cost: c.cost };
  }
  // 🔑 CARD OFFERS COME FROM YOUR HAND ONLY (2026-07-26). Upgrading a name in a list you haven't
  // seen for five turns is abstract and unsatisfying - you buy without knowing what you bought.
  // Offering the four cards in front of you makes the purchase tangible, and it interlocks with
  // the Stack: to sharpen a particular card, STACK IT TO RETURN SOON and buy it when it lands.
  // The timing is already right - the Wheel fires before Cleanup, so you can still see which
  // cards you poured into the spell (leaving for the region) and which are sliding back under
  // the deck (returning soon). That is the decision: invest in later, or in sooner.
  const owned = S.hand.slice();
  const hurt = owned.filter(c => c.level < MAX_LEVEL && c.level <= 2);
  if (hurt.length && roll < (rich ? 0.62 : 0.42)) {
    const c = rand(hurt);
    return { kind: 'repair', cardId: c.id, name: c.def.name,
             text: `Mend ${c.def.name} → Lv${c.level + 1}<div class="wo-delta">${levelDeltaText(c)}</div>`, rarity: 'common', cost: Math.max(2, c.level) };
  }
  // 🔑 YOU MAY NOT UPGRADE WHAT YOU JUST BLUNTED (bug fixed 2026-07-29). The old upgrade menu
  // enforced this via upgradable(); the Wheel replaced that menu and never inherited the check,
  // so you could be KNOCKED OUT, have four cards downgraded, and buy one straight back up in the
  // same breath. Damage has to stick for at least the turn or coins are an undo button.
  // ⚠️ This matters far more once Lv4 abilities land: losing a verb and re-buying it in the same
  // shop would gut the whole "a verb you can LOSE is what makes protecting it a decision".
  // `repair` offers are the sanctioned way to mend damage — deliberately a separate, priced kind.
  const up = owned.filter(c => c.level < MAX_LEVEL && !S.downgraded.has(c.id));
  if (!up.length) return { kind: 'none', name: 'Nothing here', text: 'Nothing to be had this spin', rarity: 'common', cost: 0 };
  const c = rand(up);
  return { kind: 'upgrade', cardId: c.id, name: c.def.name,
           text: `${c.def.name} → Lv${c.level + 1}<div class="wo-delta">${levelDeltaText(c)}</div>`, rarity: 'common', cost: eff(c).cost || 2 };
}

// ONE OFFER PER CARD (2026-07-26). The match jackpot - the same card twice at half price - made
// sense when offers came from all 17 owned cards and a repeat was a rare windfall. Now that they
// come from a 4-card hand, repeats are common and the "jackpot" is just a way to buy two levels
// at once: a Lv2 card could reach Lv4 in a single shop, skipping the whole progression arc. The
// second offer's printed delta was stale too (it still showed Lv2->Lv3 while selling Lv3->Lv4).
function spinWheel(rich) {
  const offers = [];
  const taken = new Set();
  for (let i = 0; i < 3; i++) {
    let o = null;
    for (let tries = 0; tries < 12; tries++) {
      o = rollOffer(rich);
      if (!o.cardId || !taken.has(o.cardId)) break;
    }
    if (o && o.cardId) taken.add(o.cardId);
    offers.push(o);
  }
  return offers;
}

// 🎰 NO SHOP ONCE THE BOSS FIGHT HAS BEGUN (2026-07-29, Thomas). The Approach and the Duel are
// one continuous confrontation — you are on the dragon's road and then in its lair, and there is
// nobody out there selling you anything. Mechanically it matters too: the duel is a race between
// its HP and your remaining cards, and a shop mid-race lets you buy your way out of the very
// pressure the fight is made of. Coins keep, so nothing is lost — you spend them next run.
function startUpgrade() {
  // ⚠️ the two finale phases resume differently: the Approach runs the normal turn tail, the Duel
  // sequences its own beats. Sending the Duel through finishTurn() would stall the fight outright.
  if (S.finalMode) {
    if (S.finalPhase === 'duel') duelCleanupAndNext(); else finishTurn();
    return;
  }
  startWheel(false);
}

function startWheel(rich) {
  S.wheel = { offers: spinWheel(rich), rich: !!rich, bought: [] };
  S.phase = 'wheel';
  render();
}

function wheelBuy(i) {
  const w = S.wheel; if (!w) return;
  const o = w.offers[i];
  if (!o || o.kind === 'none' || o.bought || o.cost > S.coins) return;
  // The match jackpot deliberately offers the SAME card twice — buying both would push it past
  // Lv4 and off the end of its level table. Validate BEFORE the coins leave your hand.
  if (o.kind === 'upgrade' || o.kind === 'repair') {
    const c = anyCardById(o.cardId);
    if (!c || c.level >= MAX_LEVEL) { o.bought = true; log(`${o.name} is already at its peak — nothing to buy.`); render(); return; }
  }
  S.coins -= o.cost;
  if (o.kind === 'charm') {
    S.charms.push(o.id);
    log(`🎁 ${o.name} — ${o.text} (−${o.cost} coins)`, 'good result');
  } else {
    const card = anyCardById(o.cardId);
    if (!card) return;
    card.level++;
    log(`${o.kind === 'repair' ? 'Mended' : 'Upgraded'} ${card.def.name} to Lv${card.level} (−${o.cost} coins)`, 'good');
  }
  o.bought = true;
  render();
}

function wheelReroll() {
  if (!S.wheel || S.coins < REROLL_COST) return;
  S.coins -= REROLL_COST;
  S.wheel.offers = spinWheel(S.wheel.rich);
  log(`Re-spun the wheel (−${REROLL_COST} coins, ${S.coins} left)`);
  render();
}

function wheelDone() {
  const camp = S.wheel && S.wheel.rich;
  S.wheel = null;
  if (camp) { S.phase = 'summary'; render(); return; }   // camp sits on the region break
  endTurn();
}

// kept as an alias so the solver/older callers still work — coins now simply roll over
function doneUpgrading() { wheelDone(); }

// ---------- Phase 5: cleanup (automatic — the Reserve is always kept) ----------
// 🔑 CLEANUP (2026-07-26). What you POURED INTO THE SPELL is spent - discarded, gone for the
// region. Everything else slides back UNDER THE DECK in an order YOU choose.
//   - Commitment now costs at the RUN level, not just the turn: pouring deep burns more deck,
//     and the deck is both your health and your clock. Deep play shortens your run.
//   - The Stack fires EVERY turn instead of only inside multi-beat fights.
// which cards the turn CONSUMES. Engine-side this is just "ask the class".
function pouredIds() { return CLASS.spentIds(); }

function endTurn() {
  // 🔥 the token you banked this turn arrives now; the one you were holding expires, spent or not
  // ✦ Deepwell — a wake banked from a Lv4 Wellspring survives one more turn
  if (S.wake > 0 && !S.wakeTarget && S.wakeDeep) { S.wakeDeep = false; log(`✦ Deepwell — your Emberwake holds another turn.`, 'good'); S.wakePending = Math.max(S.wakePending || 0, S.wake); }
  else if (S.wake > 0 && !S.wakeTarget) log(`Your Emberwake gutters out unspent.`, 'bad');
  S.wakeDeep = verbLive('Wellspring', 'Boost') && banksNow();
  S.wake = S.wakePending || 0;
  S.wakePending = 0;
  S.wakeTarget = null;
  const spentIds = pouredIds();
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
  const returning = S.hand.filter(c => c !== kept);
  if (returning.length > 1) { startStack(returning, poured.length, kept); return; }
  finishCleanup(returning, poured.length, false, kept);
}

// 🃏 THE STACK - you choose the order your returning cards come back in, so you aren't dealt
// next turn's hand, you write it.
function startStack(cards, spentCount, kept) {
  S.stack = { ids: cards.map(c => c.id), order: [], spent: spentCount, keptId: kept ? kept.id : null };
  S.phase = 'stack';
  render();
}
function stackPick(id) {
  const st = S.stack; if (!st) return;
  if (!st.ids.includes(id) || st.order.includes(id)) return;
  st.order.push(id);
  if (st.order.length >= st.ids.length) { finishStack(); return; }
  render();
}
function stackClear() { if (S.stack) { S.stack.order = []; render(); } }
function finishStack() {
  const st = S.stack; if (!st) return;
  const rest = st.ids.filter(id => !st.order.includes(id));
  const ordered = [...st.order, ...rest].map(id => cardById(id)).filter(Boolean);
  const spent = st.spent || 0;
  const kept = st.keptId ? cardById(st.keptId) : null;
  S.stack = null;
  finishCleanup(ordered, spent, true, kept);
}

function finishCleanup(returning, spentCount, ordered, kept) {
  S.hand = S.hand.filter(c => !returning.includes(c));
  S.deck.push(...returning);
  const before = S.hand.length;
  draw(HAND_SIZE - S.hand.length);
  log(`Cleanup: ${spentCount} spent on the spell — gone. ` +
      (returning.length ? `${returning.map(c => displayName(c)).join(', ')} slide under the deck` +
        `${ordered && returning.length > 1 ? ' in your order' : ''}. ` : '') +
      (kept ? `Your Arsenal ${displayName(kept)} stays in hand. ` : '') +
      `Drew ${S.hand.length - before} (deck ${S.deck.length}, discard ${S.discard.length})`);

  // Poison lands on the freshly drawn hand, before the next encounter
  if (S.poison > 0 && S.hand.length > 0) {
    log(`Poison strikes the new hand: ${S.poison} damage to soak`, 'bad');
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
  // a completed/narrowed journey earns an EVENT (the place you arrive) before the turn ends
  if (S.pendingEvent) { S.pendingEvent = false; startEvent(); return; }
  finishRegionCheck();
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
  { id: 'wayshrine', name: 'The Guttered Wayshrine',
    flavor: "A pilgrim's candle-shrine, long cold. Relight the wick and the old craft repays the warmth — though a greedy flame may draw it from somewhere else.",
    options: [
      { label: 'Relight it — a card brightens (a greedy flame might dim another)', need: 'none',
        apply: () => { const up = rand(S.hand); const lines = [evLevel(up, +1)];
          if (rnd() < 0.35 && S.hand.length > 1) { const dn = rand(S.hand.filter(c => c.id !== up.id)); lines.push('The flame takes its due — ' + evLevel(dn, -1)); }
          return lines; } },
      { label: 'Swear to tend it — take a CHARM, and a CURSE to carry with it', need: 'none',
        apply: () => { const good = CHARMS.filter(c => !c.curse && !S.charms.includes(c.id));
          return [good.length ? evGrantCharm(rand(good).id) : 'The shrine has no gift left.', evTakeCurse()]; } },
      { label: 'Take the oil instead — 🪙 +6 coins, the shrine stays cold', need: 'none',
        apply: () => { S.coins += 6; return [`You pocket the oil — +6 coins (you now hold ${S.coins}).`]; } },
      { label: 'Leave it dark — nothing', need: 'none', apply: () => ['You leave the wick cold and travel on.'] },
    ] },
  { id: 'chandler', name: "The Chandler's Rest",
    flavor: "A woodcutter's hut, the hearth still warm. A night here is enough to mend a frayed tool.",
    options: [
      { label: 'Mend one carefully — a card you choose gains +1 level', need: 'card', apply: ({ card }) => evLevel(card, +1) },
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
        apply: () => { const good = CHARMS.filter(c => !c.curse && !S.charms.includes(c.id));
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
      { label: 'Let him read a page — a card you choose DIMS one level; the road ahead is blessed (+2 Pace, next two journeys)', need: 'card',
        apply: ({ card }) => { const t = evLevel(card, -1); S.paceBless = 2; S.eventFlags.pilgrim = 'gave';
          return [t, 'The road ahead is blessed — +2 Pace on your next two journeys.', 'He reads it once, closes your book gently, and hands it back. "I will know you again."']; } },
      { label: 'Share your supper — 🪙 −8 coins, and he tends your kit: a card you choose BRIGHTENS a level', need: 'card',
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
      { label: 'Take the coal with you — a card you choose gains +1 level, the ward is spent', need: 'card',
        apply: ({ card }) => ['You lift the everburning coal — ' + evLevel(card, +1)] },
      { label: 'Bargain with what sleeps here — 🪙 +14 coins, and a CURSE', need: 'none',
        apply: () => { S.coins += 14; return [`Something in the dark pays generously — +14 coins (you now hold ${S.coins}).`, evTakeCurse()]; } },
      { label: 'Leave the coal — nothing', need: 'none', apply: () => ['You leave the coal banked and travel on.'] },
    ] },
  { id: 'toll', name: 'The Toll of Thorns',
    flavor: "A bramble-wall across the path. Force through and it takes something; or spend the time to find a way around.",
    options: [
      { label: 'Cut through — a card you choose loses a level, but two others brighten', need: 'card',
        apply: ({ card }) => { const lines = ['You force the thorns — ' + evLevel(card, -1)]; lines.push('but win through to easier ground:', ...evUpgradeRandom(2, card.id)); return lines; } },
      { label: 'Pay the toll in coin — 🪙 −9 coins, pass untouched', need: 'none',
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
  return EVENTS.filter(e => !(e.once && seen.includes(e.id)) && (!e.when || e.when()));
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
function eventChoose(i) {
  const opt = currentEventDef().options[i];
  // never ask for a card you cannot possibly give - the player would be stuck on a picker with
  // nothing to pick and only a "back" button to explain it
  if (opt.need === 'card' && S.hand.length === 0) {
    log(`You have no cards in hand to offer — that road is closed to you.`, 'bad');
    render();
    return;
  }
  S.event.opt = i;
  if (opt.need === 'card') { S.event.step = 'pickCard'; render(); return; }
  resolveEvent(opt, null, null);
}
function eventPickCard(id) {
  const card = cardById(id); if (!card) return;
  S.event.targetId = id;
  resolveEvent(currentEventDef().options[S.event.opt], card, null);
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
function eventContinue() { S.event = null; finishRegionCheck(); }

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

function renderScene() {
  const el = $('scene');
  if (!el) return;
  if (S.phase === 'summary' || S.phase === 'defeat' || S.phase === 'victory') {
    el.innerHTML = ''; el.hidden = true; return;
  }
  el.hidden = false;
  const e = S.encounter;
  const duel = S.finalMode && S.finalPhase === 'duel';
  const isFight = duel || (e && e.type === 'fight');
  let foe;
  if (duel) foe = `<div class="foe foe-dragon" id="foe-slot" data-anim="dragon">${ART.dragon}</div>`;
  else if (isFight) foe = `<div class="foe foe-beast" id="foe-slot" data-anim="creature">${ART.beast}</div>`;
  else foe = `<div class="foe foe-road" id="foe-slot" data-anim="none"></div>`; // journeys: the road ahead
  el.className = isFight ? 'is-fight' : 'is-journey';
  el.setAttribute('style', sceneVars(e, isFight));
  el.innerHTML =
    `<div class="scene-glow"></div><div class="scene-floor"></div><div class="scene-night"></div>` +
    foe +
    `<div class="mage" id="mage-slot" data-anim="mage">${ART.mage}</div>` +
    `<div class="scene-name">${duel ? S.dragon.name : e ? e.name : ''}</div>` +
    `<div class="scene-vig"></div>`;
}

function render() {
  normalizeAssign();
  saveGame();
  document.body.className = 'phase-' + S.phase;   // lets CSS emphasise per phase (e.g. armor during soak)
  $('turn-indicator').textContent = (S.finalMode ? `🐉 THE FINAL BATTLE` : `Region ${S.region} · Turn ${S.turn}`) + ` · build ${BUILD}`;
  renderStatus();
  renderScene();
  renderEncounter();
  renderControls();
  renderSlots();
  renderLog();
  pointAtLesson();
}

// 🎓 SHOW, DON'T TELL. The lesson puts a ring around the thing it describes — the slot row, the
// card that would attune, the enemy panel. This is the interactive half: you read a sentence and
// the screen tells you where to look.
function pointAtLesson() {
  document.querySelectorAll('.lesson-point').forEach(el => el.classList.remove('lesson-point'));
  const L = nextLesson(); if (!L || !L.point) return;
  let sel = L.point; if (typeof sel === 'function') { try { sel = sel(); } catch (e) { sel = null; } }
  if (!sel) return;
  const el = document.querySelector(sel);
  if (el) el.classList.add('lesson-point');
}

// 🔑 EVERYTHING CURRENTLY MODIFYING YOUR MATHS, NAMED AND SIGNED (2026-07-29). Curses were
// shown on the Wheel screen and NOWHERE else, so for the rest of a run the player did arithmetic
// against a number they could not see. "Legible math always" does not only mean show the working
// - it means show the TERMS. Temporary blessings lived as bare counters and were just as invisible.
// The NAME is flavour; the EFFECT is the maths. They're separate spans so a phone can drop the
// name and still show you every term you're calculating against.
function carried() {
  const out = [];
  for (const id of S.charms) { const c = charmById(id); if (c) out.push({ curse: !!c.curse, name: c.name, text: c.text }); }
  if (S.wake > 0) out.push({ curse: false, name: 'Emberwake',
    text: S.wakeTarget ? `🔥 +${S.wake} → ${WAKE_TARGETS[S.wakeTarget]}` : `🔥 +${S.wake} — unaimed` });
  if (S.paceBless > 0) out.push({ curse: false, name: 'Glimpse', text: '🌙 +2 Pace, next journey' });
  if (S.emberShield) out.push({ curse: false, name: 'Ember Hollow', text: '🔥 Arsenal survives Nightfall' });
  if (S.curseNextFight) out.push({ curse: true, name: 'Followed', text: '⚠️ next fight carries a Hardship' });
  return out;
}
const carryLine = x => `${x.curse ? '☠️' : '🎁'} ${x.name}: ${x.text}`;
function carriedText() {
  const c = carried();
  if (!c.length) return '';
  return c.map(x => `<span class="carry-chip${x.curse ? ' is-curse' : ''}" title="${carryLine(x)}">` +
    `<b class="carry-name">${x.curse ? '☠️' : '🎁'} ${x.name}</b><span class="carry-eff">${x.text}</span></span>`).join('');
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
    carriedText();
}

// 🕯️ what you can see of the road ahead — and, when the candle is out, that you cannot.
function candleLine() {
  if (S.finalMode) return '';
  const n = nextEncounter();
  if (!S.candle) return `<div class="candle out">🕯️ <b>Your candle is out.</b> You cannot see what waits beyond this. <span class="dim">Complete an encounter to relight it.</span></div>`;
  if (!n) return `<div class="candle lit">🕯️ <b>Lit.</b> <span class="dim">Nothing more on this road — the region ends after this.</span></div>`;
  const what = n.type === 'fight'
    ? `⚔️ <b>${n.name}</b> · ❤️ ${n.hp} · 💨 ${n.init} · ${n.shape === 'armour' ? `🛡️ Armour ${n.shapeV}` : n.shape === 'evasion' ? '🌀 Evasion' : 'unguarded'}`
    : `👣 <b>${n.name}</b> · MP ${n.mp} · 🌙 ${n.nightfall}`;
  return `<div class="candle lit">🕯️ <span class="dim">by candlelight you can make out</span> ${what}</div>`;
}

function renderEncounter() {
  const e = S.encounter;
  const panel = $('encounter-panel');
  if (S.finalMode && S.phase !== 'defeat' && S.phase !== 'victory') {
    const ds = S.dragonState;
    const hpPct = ds ? Math.max(0, Math.round(100 * ds.hp / ds.maxHp)) : 100;
    const dragonBar =
      `<div class="dragon-hp"><div class="dragon-hp-fill" style="width:${hpPct}%"></div>` +
      `<span class="dragon-hp-label">🐉 ${S.dragon.name} — ${ds ? ds.hp : S.dragon.hp} / ${ds ? ds.maxHp : S.dragon.hp} HP</span></div>` +
      `<div class="dragon-shields">${ds ? shapeStateText() : dragonShapeText(S.dragon)}` +
      ` <span class="dim">· 💨 Init ${S.dragon.init} · breath ${S.dragon.breath}</span></div>` +
      (S.finalPhase === 'duel' ? staminaBar() : '');
    if (S.finalPhase === 'duel') {
      panel.className = 'fight';
      panel.innerHTML =
        `<div class="enc-type">🐉 THE DUEL — beat ${S.duelBeat}</div>` + dragonBar +
        `<div class="enc-hint">${dragonDemand(S.dragon)} — <b>${S.dragon.teaches}</b>.</div>`;
      return;
    }
    // THE APPROACH — an ordinary journey-beat, with the dragon looming
    const e = S.encounter;
    const beatTag = e ? (e.name.split('· ')[1] || '') : '';
    panel.className = 'journey';
    panel.innerHTML =
      `<div class="enc-type">🐉 THE APPROACH${beatTag ? ` — beat ${beatTag}` : ''}</div>` + dragonBar +
      (e ? `<div class="enc-stats"><span>👣 MP <b>${e.mp}</b> (half ${Math.ceil(e.mp / 2)})</span>` +
        `<span>🌙 Nightfall <b>${e.nightfall}</b></span><span>⏳ Time Penalty <b>${e.timePenalty}</b></span>` +
        `</div>` +
        `<div class="enc-hint">Complete BOTH approach beats and you arrive with the advantage — its guard softened before a blow is struck.</div>` : '');
    return;
  }
  if (S.phase === 'intro' || S.phase === 'summary' || S.phase === 'defeat' || S.phase === 'victory' || !e) { panel.innerHTML = ''; panel.className = ''; return; }
  panel.className = e.type;
  const modLines =
    (e.ability ? `<div class="enc-mod">☠️ <b>${e.ability}</b> — ${ABILITIES[e.ability]}</div>` : '') +
    (e.peril ? `<div class="enc-mod">⛰️ <b>${e.peril}</b> — ${PERILS[e.peril]}</div>` : '') +
    (S.hardship ? `<div class="enc-mod">⚠️ <b>${S.hardship}</b> — ${HARDSHIPS[S.hardship]}</div>` : '');
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

function renderControls() {
  const c = $('controls-panel');
  if (S.phase === 'assign' && S.diverting) {
    c.innerHTML =
      `<div class="phase-label">PHASE 1 — CHALLENGE · DIVERT</div>` +
      `<div class="hint">Choose a hand card to discard. The top of the deck (<b>${S.deck[0].def.name}</b>) burns with it, and a new encounter — of a <b>different type</b> (${S.encounter.type === 'fight' ? 'a journey' : 'a fight'}, if one remains) — is revealed.</div>` +
      `<button onclick="cancelDivert()">Cancel — face ${S.encounter.name}</button>`;
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
      ? (duel ? `🐉 THE DUEL — beat ${S.duelBeat}` : `🐉 THE APPROACH — beat ${S.approachOutcomes.length + 1} of 2`)
      : `PHASE 2 — ACTION`;
    const resolveBtn = duel
      ? `<button class="primary" onclick="resolveDuel()" ${rolesValid() ? '' : 'disabled'}>Strike the ${S.dragon.name}</button>`
      : `<button class="primary" onclick="resolve()" ${rolesValid() ? '' : 'disabled'}>Resolve ${isFight ? 'Fight' : 'Journey'}</button>`;
    // Divert only makes sense before the first blow is struck
    const divertBtn = S.finalMode ? '' :
      `<button onclick="beginDivert()" ${canDivert() ? '' : 'disabled'} title="Burn the top deck card + 1 hand card to swap this encounter for one of a different type">` +
      `Divert to a ${S.encounter.type === 'fight' ? 'journey' : 'fight'} (${MAX_DIVERTS - S.divertsUsed} left${S.deck.length === 0 ? ' — deck empty' : ` — burns ${S.deck[0].def.name}`})</button>`;
    // the how-to text is tucked into a collapsed toggle at the bottom — out of the way each turn,
    // still one tap away. The actionable "you're not stuck" warning stays inline.
    // 🔥 AIM THE EMBERWAKE. It sits above Resolve because you bank BLIND and spend INFORMED —
    // the whole point is that you choose with the encounter in front of you.
    // ✦ the Prism: an offer above the row, answered by tapping the card you're willing to lose
    // 🔑 SHOW THE OBJECT. Naming the drawn card is not enough — its value, attuned value, init,
    // boost, armour and ELEMENT are the entire basis of the decision, and the element decides
    // which cards you're even allowed to replace. Same rule the Rewiring Pool taught us.
    // 🎓 driven by nextLesson() — reactive, never scripted
    const L = nextLesson();
    const lessonRow = L
      ? `<div class="lesson-row"><span>🎓 ${L.text}</span>` +
        `<span class="lesson-btns"><button class="primary" onclick="learned('${L.id}')">got it</button>` +
        `<button onclick="S.lessonsOff=true;render()">hide tips</button></span></div>`
      : '';
    const prismRow = S.prism
      ? `<div class="prism-row prism-open"><span class="prism-lab">✦ You drew — tap a card in the row below to put it in that card's place (<b>that card is spent for the region</b>)</span>` +
        `<div class="prism-card">${cardHTML(S.prism)}</div>` +
        `<button onclick="prismRefuse()">Let it go instead</button></div>`
      : (prismReady()
        ? `<div class="prism-row"><span class="prism-lab">✦ <b>The Prism</b> — all four elements, so no pair. Draw one, discard one?</span>` +
          `<button class="prism-go" onclick="prismDraw()">Draw a card</button></div>`
        : '');
    const wakeRow = S.wake > 0
      ? `<div class="wake-row"><span class="wake-lab">🔥 Emberwake <b>+${S.wake}</b> — aim it:</span>` +
        Object.keys(WAKE_TARGETS).map(k =>
          `<button class="wake-btn${S.wakeTarget === k ? ' on' : ''}" onclick="aimWake('${k}')">${WAKE_TARGETS[k]}</button>`).join('') +
        `<span class="wake-note">spend it or lose it</span></div>`
      : '';
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
      prismRow +
      wakeRow +
      boostRow +
      resolveBtn +
      divertBtn +
      howto;
  } else if (S.phase === 'reveal') {
    const beat = S.beats[S.beatIndex];
    c.innerHTML =
      `<div class="phase-label">RESOLVING — ${S.beatIndex + 1} / ${S.beats.length}</div>` +
      `<div class="preview-bar beat-bar" onclick="advanceBeat()" title="click to continue">` +
      S.beats.slice(0, S.beatIndex + 1).map((b, i) => beatDisplayHTML(b, i === S.beatIndex)).join('') +
      `</div>` +
      (beat.final
        ? `<button class="primary" onclick="advanceBeat()">Continue</button>`
        : `<div class="hint">click to hurry…</div>`);
  } else if (S.phase === 'stack') {
    const st = S.stack || { ids: [], order: [] };
    const left = st.ids.length - st.order.length;
    c.innerHTML =
      `<div class="phase-label">🃏 STACK THE DECK</div>` +
      `<div class="hint">Your spent cards slide back <b>under the deck</b>. Tap them in the order you want to <b>draw them again</b> — ① comes back soonest. ` +
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
      `<div class="hint">Damage to soak: <b style="color:#e08a7a">${S.damage}</b>` +
      `. Tap a card to blunt it — it soaks its 🛡️ armour value. ` +
      `<b>A Lv1 card LEAVES YOUR DECK for the rest of the run.</b></div>`;
  } else if (S.phase === 'wheel') {
    if (!S.wheel) S.wheel = { offers: spinWheel(false), rich: false, bought: [] };  // e.g. restored from a save
    const w = S.wheel;
    const canReroll = S.coins >= REROLL_COST;
    const offers = w.offers.map((o, i) => {
      const afford = o.cost <= S.coins && o.kind !== 'none';
      const cls = `wheel-offer r-${o.rarity}${o.bought ? ' bought' : ''}`;
      return `<div class="${cls}">` +
        `<div class="wo-rar">${o.kind === 'charm' ? 'CHARM · ' + o.rarity : o.kind === 'repair' ? 'MEND' : o.kind === 'none' ? '—' : 'UPGRADE'}` +
        `</div>` +
        `<div class="wo-name">${o.name}</div><div class="wo-text">${o.text}</div>` +
        (o.bought ? `<div class="wo-taken">taken</div>`
          : o.kind === 'none' ? `<div class="wo-taken">—</div>`
          : `<button class="wo-buy" onclick="wheelBuy(${i})" ${afford ? '' : 'disabled'}>🪙 ${o.cost}${afford ? '' : ' — short'}</button>`) +
        `</div>`;
    }).join('');
    c.innerHTML =
      `<div class="phase-label">${w.rich ? '🔥 CAMP — THE LONG WHEEL' : '🎰 THE WHEEL'}</div>` +
      `<div class="hint">You hold <b style="color:#c9b458">🪙 ${S.coins}</b> — and coins keep. Buy what's worth it, re-spin for something better, or bank it all for a bigger pull later.</div>` +
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
      body = `<div class="summary">${ev.lines.map(l => `<p>${l}</p>`).join('')}` +
        (now.length
          ? `<p class="event-carry"><b>You now carry:</b> ${now.map(x => `<span class="${x.curse ? 'bad' : 'good'}">${carryLine(x)}</span>`).join(' · ')}</p>`
          : `<p class="event-carry">You carry nothing that changes your maths.</p>`) + `</div>` +
        `<button class="primary" onclick="eventContinue()">Continue</button>`;
    } else if (ev.step === 'pickCard') {
      // the choice is made ON the cards below — this panel just states the deal
      body = `<div class="hint"><b>${def.options[ev.opt].label}</b><br>Pick the card from your hand below — its stats are right there on it.</div>` +
        `<button onclick="eventCancelPick()">← back</button>`;
    } else {
      // an OPTION may gate itself with when(), the same way a whole event can
      body = `<div class="event-flavor">${def.flavor}</div>` +
        `<div class="event-opts">` + def.options.map((o, i) =>
          (!o.when || o.when())
            ? `<button onclick="eventChoose(${i})"${o.need === 'card' && !S.hand.length ? ' disabled title="no cards in hand"' : ''}>${o.label}</button>`
            : '').join('') + `</div>`;
    }
    c.innerHTML = `<div class="phase-label">✦ EVENT — ${def.name}</div><div class="hint">You arrive somewhere as the journey ends.</div>` + body;
  } else if (S.phase === 'defeat') {
    const survivors = [...S.hand, ...S.deck, ...S.discard];
    c.innerHTML =
      `<div class="phase-label">💀 DEFEAT</div>` +
      gradeHTML(gradeRun(false), false) +
      `<div class="summary"><p>${S.defeatMsg}</p>` +
      `<p>Turns: <b>${S.turn}</b> — Complete <b>${S.results.Complete}</b> · Narrow <b>${S.results.Narrow}</b> · Loss <b>${S.results.Loss}</b> · surviving cards <b>${survivors.length}</b>, lost from your deck <b>${S.trashed.length}</b></p></div>` +
      `<button class="primary" onclick="showStages()">🗺️ Choose a stage</button>`;
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
  } else if (S.phase === 'ladder') {
    const cleared = stagesCleared();
    c.innerHTML =
      `<div class="phase-label">🗺️ THE STAGES</div>` +
      `<div class="summary"><p>Each stage is a different <b>question</b>, not simply a bigger number. ` +
      `Beat one and the next opens — but every stage you have cleared stays open, so you can always go back.</p></div>` +
      `<button class="primary stage" onclick="startStage(0)"><b>🎓 Stage 0 — the Emberling</b>` +
      `<span class="stage-shape">a short, gentle run that teaches the game · always open</span></button>` +
      DRAGONS.map(d => {
        const open = stageUnlocked(d.stage), done = d.stage <= cleared;
        return `<button class="${d.stage === Math.min(DRAGONS.length, cleared + 1) ? 'primary' : ''} stage${open ? '' : ' locked'}"` +
          (open ? ` onclick="startStage(${d.stage})"` : ' disabled') + `>` +
          `<b>${done ? '✔ ' : ''}Stage ${d.stage} — ${open ? d.name : '???'}</b>` +
          `<span class="stage-shape">${open ? dragonShapeText(d) + ' · <b>' + d.teaches + '</b>' : 'locked — clear stage ' + (d.stage - 1) + ' to open'}</span>` +
          `</button>`;
      }).join('');
  } else if (S.phase === 'victory') {
    const survivors = [...S.hand, ...S.deck, ...S.discard];
    const score = survivors.reduce((t, c) => t + c.level, 0);
    c.innerHTML =
      `<div class="phase-label">🏆 THE ${S.dragon.name.toUpperCase()} FALLS — VICTORY</div>` +
      gradeHTML(gradeRun(true), true) +
      `<div class="summary">` +
      `<p>Turns: <b>${S.turn}</b> — Complete <b>${S.results.Complete}</b> · Narrow <b>${S.results.Narrow}</b> · Loss <b>${S.results.Loss}</b> · Lost from your deck: <b>${S.trashed.length}</b>${S.trashed.length ? ` (${S.trashed.map(c => c.def.name).join(', ')})` : ''}</p>` +
      `<table><tr><th>Card</th><th>Level</th></tr>` +
      survivors.sort((a, b) => b.level - a.level).map(c => `<tr><td>${c.def.name}</td><td>Lv${c.level}</td></tr>`).join('') +
      `</table></div>` +
      `<button class="primary" onclick="showStages()">🗺️ Choose your next stage</button>`;
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
}

// hint shown under each zone label
// 🔑 EVERY SLOT STATES WHERE ITS CARD ENDS UP (2026-07-28). The Spell is SPENT - gone for the
// region - and nothing said so, which hid the best fork the turn already had: win comfortably
// with your Hammer, or scrape through with a lesser card and still have the Hammer at the
// dragon's door. Measured, the optimal Spell is simply your biggest-value card 89% of the time,
// because that choice is made without ever seeing its price. The solver cannot see it either -
// it optimises one encounter at a time and never pays the future cost.
function zoneHint(zone) {
  const isFight = S.encounter && S.encounter.type === 'fight';
  switch (zone) {
    case 'Spell': return (isFight ? 'your Attack' : 'your Move') + ' — SPENT, gone for the region';
    case 'Element': {
      const sp = spellCard();
      if (!sp) return 'Initiative — returns to your deck';
      return attunedNow()
        ? `✦ ATTUNED — ${elOf(sp)} matches · Initiative`
        : `Initiative — a ${elOf(sp)} card here would ATTUNE your Spell`;
    }
    case 'Boost': {
      const sc = cardById(S.assign.Boost), el = cardById(S.assign.Element);
      if (sc && el && elOf(sc) === elOf(el))
        return `🔥 BANKS — +${bankValueOf(sc)} Emberwake next turn, nothing now`;
      if (el) return `+power now — or match ${elOf(el)} to BANK it`;
      return '+power — returns to your deck';
    }
    case 'Reserve': return 'kept in hand for next turn';
  }
}
// a one-word mark of the card's fate, shown on the card itself during the action phase
function fateOf(zone) {
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
  }).join('');
}

// Per-card visual identity (2026-07-06): each card wears its own arcane SIGIL — a mage's mark,
// magic-as-craft — as a faint watermark, tinted by the element it SEEKS to Attune (its aura hints
// what it becomes when attuned). Witch Hat register: crafted wonder, restrained. See Card_Identity_And_Attachment.
const SIGIL = {
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
  const enhLine = d.wild ? '🌈 Wild' : '';
  const forged = '';

  let action = '';
  if (S.diverting) {
    action = `<div class="card-action"><button onclick="divertWith(${card.id})">Discard (Divert)</button></div>`;

  } else if (S.prism && card.id === S.prism.id) {
    action = `<div class="card-action muted">the card you drew</div>`;
  } else if (S.prism) {
    // ⚠️ THE GUARANTEE ONLY HOLDS IF YOU DON'T DISCARD THE COLOUR YOU JUST DREW. Replacing the
    // Stone card with a Stone card leaves you rainbow again — you'd have paid a card for nothing.
    // That's a pure gotcha rather than a decision, so the engine simply won't let you do it.
    action = elOf(card) === elOf(S.prism)
      ? `<div class="card-action muted">same ${elOf(card)} — replacing this leaves you with no pair</div>`
      : `<div class="card-action"><button onclick="prismTake(${card.id})">Replace this one — it is spent</button></div>`;
  } else if (isAssignPhase() && S.selectedId === card.id) {
    action = roleButtons(card);
  }
  if (S.phase === 'stack') {
    const st = S.stack;
    if (st && st.ids.includes(card.id)) {
      const pos = st.order.indexOf(card.id);
      action = pos >= 0
        ? `<div class="card-action muted">${'①②③④'[pos]} returns ${pos === 0 ? 'first' : pos === st.ids.length - 1 ? 'last' : 'next'}</div>`
        : `<div class="card-action"><button onclick="stackPick(${card.id})">Place ${'①②③④'[st.order.length]} — draw this back ${st.order.length === 0 ? 'soonest' : 'after'}</button></div>`;
    } else {
      action = `<div class="card-action muted">stays in hand</div>`;
    }
  } else if (S.phase === 'soak') {
    if (!wasDowngraded) {
      const soak = soakValue(card);
      action = `<div class="card-action"><button onclick="soakWith(${card.id})">Downgrade — soak ${soak}${card.level === 1 ? ' ⚠️ Lv1: LEAVES YOUR DECK' : ''}</button></div>`;
    } else {
      action = `<div class="card-action muted">already downgraded</div>`;
    }
  } else if (S.phase === 'event' && S.event && S.event.step === 'pickCard') {
    // Events used to pick a target from a list of bare NAMES — you couldn't see the stats you
    // were about to change, which on the Rewiring Pool means you couldn't see what the card
    // already seeks. Choose on the card itself, like soak/stack/upgrade already do.
    action = `<div class="card-action"><button onclick="eventPickCard(${card.id})">Choose this one</button></div>`;
  } else if (S.phase === 'upgrade') {
    // show the cost on EVERY card so the economy is visible, greyed out when blocked
    if (card.level >= MAX_LEVEL) {
      action = `<div class="card-action muted">max level</div>`;
    } else if (wasDowngraded) {
      action = `<div class="card-action muted">downgraded — can't upgrade</div>`;
    } else {
      const cost = eff(card).cost;
      const ok = cost <= S.coins;
      action = `<div class="card-action"><button onclick="upgrade(${card.id})" ${ok ? '' : 'disabled'}>Upgrade to Lv${card.level + 1} — 🪙 ${cost}${ok ? '' : ' (not enough)'}</button>` +
        `<div class="wo-delta">${levelDeltaText(card)}</div></div>`;
    }
  }

  // Attack/Move centerpiece: always two rows, consistent across all cards.
  // Each stat is TAGGED so CSS can quiet whatever this encounter/slot doesn't use — the
  // numbers never leave (legible math), they just stop shouting all at once.
  // ONE value: the encounter decides whether it reads as damage or as progress.
  const valIcon = (S.encounter && S.encounter.type === 'journey') ? '👣' : '⚔️';
  const vals = `<div class="card-val v-one">${valIcon} ${contributes}` +
    `<span class="v-att${attLive ? ' att-live' : ''}" title="its value when the Catalyst shares its element">✦${attV}</span></div>`;

  const slot = zoneOf(card.id);
  const verb = verbOf(card);
  const verbLit = !!(verb && (verb.slot === 'soak' ? S.phase === 'soak' : slot === verb.slot));
  const fate = (isAssignPhase() && slot) ? fateOf(slot) : null;
  // ⚖️🐌 name the barred card outright — "your heaviest" is not something you can read off a row
  const barred = isAssignPhase() && S.hardship
    ? (placementBan(card.id, 'Spell') ? '⚖️ too heavy for the SPELL'
      : placementBan(card.id, 'Element') ? '🐌 too fast for the CATALYST' : null)
    : null;
  const ctx = (S.encounter && S.encounter.type === 'journey') ? 'ctx-journey' : 'ctx-fight';
  const slotCls = (slot ? `in-${slot}` : '') + (attLive ? ' attuned-pair' : '');
  const resoOn = false;   // resonance is gone - depth replaced it
  const boostPicker = '';

  const tint = d.wild ? 'card-el-wild' : shownEl ? `card-el-${shownEl}` : 'card-el-none';
  // sigil watermark + seek-element accent glow (wild gets its own prismatic aura via .card-el-wild)
  const sigil = SIGIL[d.name] || '✦';
  const accent = d.wild ? null : (ACCENT[enhElOf(card)] || '#cfc9ba');
  const sigilStyle = accent ? `--accent:${accent};` : '';
  // while fuse is armed, highlight the valid partners you can tap

  return `<div class="card ${tint} ${ctx} ${slotCls} ${wasDowngraded ? 'downgraded' : ''} ${dnd ? 'grabbable' : ''} ${S.selectedId === card.id ? 'selected' : ''}" style="${sigilStyle}"` +
    (dnd ? ` draggable="true" ondragstart="dragStart(event, ${card.id})"` +
           ` onclick="event.stopPropagation(); tapCard(${card.id})"` +
           `` : '') + `>` +
    `<div class="card-sigil" aria-hidden="true">${sigil}</div>` +
    `<div class="card-head"><span class="card-name">${displayName(card)}${forged}</span><span class="card-level">Lv${card.level}</span></div>` +
    `<div class="el-identity">${elChip(shownEl)}</div>` +
    `<div class="card-row"><span class="s-init">💨 ${v.init}</span>` +
    `<span class="s-boost${resoOn ? ' resonating' : ''}"${resoOn ? ' title="Resonates — it feeds what the Spell seeks"' : ''}>` +
    `➕ ${v.boost}${resoOn ? ` ${elIcon(wantEl)}✦` : ''}</span></div>` +
    `<div class="card-vals">${vals}</div>` +
    (verb ? `<div class="card-verb${verbLit ? ' verb-live' : ''}" title="${verb.text}">` +
      `<b>✦ ${verb.name}</b><span>${verbLit ? verb.text : (verb.slot === 'soak' ? 'fires when it soaks' : 'fires in ' + SLOT_LABEL[verb.slot])}</span></div>` : '') +
    (barred ? `<div class="card-barred">${barred}</div>` : '') +
    (fate ? `<div class="card-fate ${fate.cls}">${fate.text}</div>` : '') +
    `<div class="card-row card-foot"><span class="card-enh">${enhLine}</span>` +
    `<span class="s-armor">🛡️ ${v.armor > 0 ? v.armor : '—'}</span></div>` +
    action + `</div>`;
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
  S.finalMode = true;
  S.finalPhase = 'approach';
  S.approachOutcomes = [];
  S.duelBeat = 0;
  // the dragon becomes a persistent enemy: one HP pool + its armor list as breakable shields
  // 🐉 the dragon becomes a persistent enemy: an HP pool plus its SHAPE. `boon` is what a
  // clean Approach buys — one tick of the shape softened for the whole duel (see finishApproach).
  S.dragonState = {
    hp: S.dragon.hp, maxHp: S.dragon.hp,
    boon: { armourCut: 0, unseen: 0, calm: 0 },
  };
  S.deck = S.tutorial ? [...S.deck, ...S.discard, ...S.hand] : shuffle([...S.deck, ...S.discard, ...S.hand]); // gather all non-trashed, keep levels
  S.hand = []; S.discard = [];
  draw(HAND_SIZE);
  S.hardship = null;
  S.downgraded = new Set();
  S.damage = 0; S.poison = 0; S.loseReserve = null; S.afterSoak = 'upgrade';
  logHeader(`— 🐉 THE ${S.dragon.name.toUpperCase()}: THE APPROACH —`);
  log(`Region 4 is behind you. Two hard journeys race to the lair — Complete BOTH and you arrive with the advantage, softening its guard before a blow is struck. Then the duel begins.`);
  startApproachBeat();
}

// ---------- THE APPROACH: two ordinary journey-beats ----------
function startApproachBeat() {
  if (S.hand.length === 0) { finishApproach(); return; } // nothing left to travel with → straight to the lair
  const beat = S.approachOutcomes.length + 1;
  const weak = S.dragon.element; // the approach carries the dragon's own colour — flavour only
  S.encounter = { type: 'journey', name: `Approach to the ${S.dragon.name} · ${beat}/2`,
    mp: APPROACH.mp, timePenalty: APPROACH.timePenalty, nightfall: APPROACH.nightfall,
    element: weak, xp: 0, finale: true };
  S.assign = { Spell: null, Element: null, Boost: null, Reserve: null };
  S.boostTarget = 'Move'; S.hardship = null; S.rangedDodge = false;
  S.divertsUsed = 0; S.diverting = false;
  S.loseReserve = null; S.afterSoak = 'upgrade';
  S.damage = 0; S.damageEl = null;
  // ⚠️ THE FINALE NEVER CALLS nextTurn(), so anything reset there had to be reset here too. The
  // Prism and Emberguard are once-per-TURN, and without this they were once per BOSS BATTLE —
  // enter the Approach having used a Prism and it never appeared again for the whole fight.
  S.prism = null; S.prismUsed = false; S.emberguardUsed = false;
  S.downgraded = new Set(); S.actionSetIds = []; S.reserveId = null;
  S.phase = 'assign';
  logHeader(`— 🐉 The Approach · beat ${beat} of 2 —`);
  logChallenge();
  render();
}

// called from finishTurn() after each finale beat's cleanup
function finaleAfterTurn() {
  if (S.finalPhase !== 'approach') return; // the Duel sequences its own beats
  if (S.approachOutcomes.length >= 2) finishApproach();
  else startApproachBeat();
}

function finishApproach() {
  const outcomes = S.approachOutcomes;
  const bothComplete = outcomes.length >= 2 && outcomes.every(o => o === 'Complete');
  logHeader(`— 🐉 The lair of the ${S.dragon.name} —`);
  // A clean Approach softens ONE TICK of whatever the dragon's shape is — so the reward always
  // speaks the same language as the problem, whichever stage you are on.
  if (bothComplete) {
    const b = S.dragonState.boon, said = [];
    if (hasShape('armour')) { b.armourCut = 2; said.push(`you found where the slag has split — 🛡️ Armour ${S.dragon.shapeV} → ${duelArmour()}`); }
    if (hasShape('evasion')) { b.unseen = 2; said.push(`you come out of the dark unseen — 🌀 its Evasion sleeps for 2 beats`); }
    if (hasShape('relentless')) { b.calm = 2; said.push(`you arrive rested — ⏳ its breath holds steady for 2 beats before it starts to grow`); }
    log(`A clean approach: ${said.join(' · ')}.`, 'good result');
  } else {
    log(`You reach the lair battered and late — the ${S.dragon.name} meets you at its full strength.`);
  }
  startDuel();
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
  const armour = duelArmour();
  // a clean Approach means it hasn't seen you yet — evasion sleeps for the first `unseen` beats
  const evaded = hasShape('evasion') && r.initLost && !(S.dragonState.boon.unseen > 0);
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
    return S.dragon.breath + b * RELENTLESS_STEP;
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
// No reshuffle in a duel, so every card you soak with is stamina you never get back.
function staminaBar() {
  const left = S.deck.length + S.hand.length;
  const pct = S.duelStamina0 ? Math.max(0, Math.round(100 * left / S.duelStamina0)) : 100;
  return `<div class="stamina"><div class="stamina-fill" style="width:${pct}%"></div>` +
    `<span class="stamina-label">🃏 your cards — ${left} / ${S.duelStamina0}</span></div>` +
    `<div class="stamina-note">🔑 <b>You lose when your cards run out</b> — every card you soak with is stamina you never get back.</div>`;
}

function startDuel() {
  S.finalPhase = 'duel';
  S.duelBeat = 0;
  // steel yourself at the lair's mouth: gather every card you still hold (spent-set and all)
  // into a fresh deck — this is your finite duel stamina. Only cards TRASHED on the approach
  // (Lv1 soak losses) are gone; a clean approach preserves your full hand AND cracked a shield.
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
  // synthetic persistent enemy: armor [] so computeAction returns the RAW strike; shields are applied here.
  // atk = the Early bite (ceil breath/2) so losing Initiative stings without doubling the breath;
  // the counterstrike (full breath, HP-scaled) is the main threat. hp huge so computeAction never "wins" — we judge HP.
  // synthetic persistent enemy. NO `shape` field: computeAction must return the RAW strike, because
  // the dragon's shape is applied in duelStrike() where the boon and the beat counter live.
  S.encounter = { type: 'fight', name: S.dragon.name, dragon: true, hp: 9999,
    init: S.dragon.init, atk: Math.ceil(S.dragon.breath / 2), atkEl: S.dragon.element, xp: 0, finale: true };
  S.assign = { Spell: null, Element: null, Boost: null, Reserve: null };
  S.boostTarget = 'Attack'; S.hardship = null; S.rangedDodge = false;
  S.divertsUsed = 0; S.diverting = false;
  S.loseReserve = null; S.afterSoak = 'upgrade';
  S.damage = 0; S.damageEl = null;
  // ⚠️ THE FINALE NEVER CALLS nextTurn(), so anything reset there had to be reset here too. The
  // Prism and Emberguard are once-per-TURN, and without this they were once per BOSS BATTLE —
  // enter the Approach having used a Prism and it never appeared again for the whole fight.
  S.prism = null; S.prismUsed = false; S.emberguardUsed = false;
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
  S.duelResult = { atk, toHp, kill, early, counter, damage, armour: st.armour, evaded: st.evaded };

  log(`The weave — Spell: ${displayName(spell)} Lv${spell.level} (${r.spellEl}) = ${r.base}` +
      ` · Catalyst: ${elem ? `${elem.def.name} (${elem.def.wild ? 'Wild' : elOf(elem) || 'colorless'}, Init ${eff(elem).init})` : '—'}` +
      ` · Surge: ${boostC ? `${boostC.def.name} (+${r.boostEff} → ${S.boostTarget})` : '—'}`);

  // --- staged reveal (mirrors the normal fight) ---
  const L = (text, cls = '') => ({ text, cls });
  const beats = [];
  const b1 = [];
  if (r.enhUsed) b1.push(L(`✦ ATTUNED — ${elem.def.name} is ${elOf(elem)} like ${spell.def.name} → strike ${r.base - r.attBonus} + ${r.attBonus} = ${r.base}`, 'good'));
  else b1.push(L(`Strike ${r.base} — unattuned${elem ? ` (${elem.def.name} is ${elOf(elem)}, not ${r.spellEl})` : ''}`));
  if (r.banks) b1.push(L(`🔥 BANKED — ${boostC.def.name} is ${elOf(boostC)} like your Catalyst: +${r.bank} Emberwake for next beat`, 'good'));
  else if (boostC) b1.push(L(`Surge: ${boostC.def.name} +${r.boostEff} → ${r.withBoost}`));
  if (r.wakeTarget === 'atk' && r.wake) b1.push(L(`🔥 Emberwake +${r.wake} spent on the strike`, 'good'));
  if (st.armour) b1.push(L(`🛡️ Armour ${st.armour}: the slag turns all but the heaviest blow → ${r.withBoost} − ${st.armour}`, 'bad'));
  if (st.evaded) b1.push(L(`🌀 Evasion: it saw you coming — half the blow finds nothing → ${toHp}`, 'bad'));
  if (hasShape('evasion') && r.initLost && ds.boon.unseen > 0) b1.push(L(`🌀 It has not seen you yet — the blow lands whole despite your pace`, 'good'));
  b1.push(L(`🐉 ${S.dragon.name}: ${hpBefore} → ${ds.hp} HP`, ds.hp < hpBefore ? 'good' : ''));
  beats.push({ label: '⚔️ STRIKE', big: toHp, vs: `to HP · 🐉 ${hpBefore}→${ds.hp}`, numCls: r.enhUsed ? 'enh' : '', lines: b1 });

  if (!kill) {
    const b2 = [];
    if (r.initLost) b2.push(L(`Initiative: yours ${r.init} vs ${S.dragon.init} → the ${S.dragon.name} strikes first → Early Damage ${early}`, 'bad'));
    else b2.push(L(`Initiative: yours ${r.init} vs ${S.dragon.init} → you strike first — no Early Damage`, 'good'));
    if (hasShape('relentless')) b2.push(L(`⏳ It draws a deeper breath — counterstrike ${counter}${S.duelBeat > 1 ? ` (was ${counter - RELENTLESS_STEP})` : ''}`, 'bad'));
    beats.push({ label: '💨 INITIATIVE', big: r.init, vs: `vs ${S.dragon.init}`, numCls: early ? 'bad' : 'ok', lines: b2 });
  }

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
  S.pendingR = null; S.beats = null; S.beatIndex = -1;
  if (dr.kill) { victory(); return; }
  if (dr.damage <= 0) { log(`No counterstrike lands — press the assault.`); duelCleanupAndNext(); return; }
  log(`The ${S.dragon.name} strikes back for ${dr.damage}${dr.early ? ` (Early ${dr.early} + Counter ${dr.counter})` : ''} — soak it with your remaining cards.`, 'bad');
  S.damage = dr.damage;
  S.damageEl = null;   // dead — see above; a dragon's breath has no colour the maths reads
  S.downgraded = new Set();
  S.afterSoak = 'duelNext';
  startSoak(); // soakable → player downgrades; else knockout (downgrade all + burn deck) then continue
}

function duelCleanupAndNext() {
  const setCards = S.hand.filter(c => S.actionSetIds.includes(c.id));
  S.hand = S.hand.filter(c => !S.actionSetIds.includes(c.id));
  S.discard.push(...setCards);
  log(`You regroup — spent set to the discard; ${S.hand.length} card${S.hand.length === 1 ? '' : 's'} still in hand, ${S.deck.length} in deck.`);
  startDuelBeat();
}

function defeat(msg) {
  log(`💀 DEFEAT — ${msg}`, 'bad result');
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
const GRADE_BANDS = [[85, 'S'], [70, 'A'], [55, 'B'], [40, 'C'], [0, 'D']];
function gradeRun(won) {
  const st = S.stats || { attuneAvail: 0, attuned: 0, duelDmg: 0, duelBeats: 0 };
  const survivors = [...S.hand, ...S.deck, ...S.discard];
  const levels = survivors.reduce((t, c) => t + c.level, 0);
  const res = S.results, encounters = res.Complete + res.Narrow + res.Loss;

  // 🃏 THE DECK YOU KEPT — deck-as-health is the pillar, so it is the biggest single share
  const deck = Math.round(30 * Math.min(1, levels / 40));
  // ⚔️ HOW CLEANLY YOU SOLVED HANDS — a Narrow counts, but only a third as much
  const exec = encounters ? Math.round(25 * Math.min(1, (res.Complete + res.Narrow / 3) / encounters)) : 0;
  // ✦ CRAFT — of the hands that COULD attune, how many did you find? Measures play, not luck.
  const craft = st.attuneAvail ? Math.round(20 * (st.attuned / st.attuneAvail)) : 0;
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
    bar(`✦ craft <span class="dim">(attuned ${g.st.attuned} of ${g.st.attuneAvail})</span>`, g.craft, 20) +
    bar(won ? `🐉 the kill <span class="dim">(${g.st.duelBeats} beats)</span>` : '🐉 the kill', g.kill, 25) +
    `</div>` + (won ? '' : `<p class="g-diag">${lossDiagnosis()}</p>`) + `</div>`;
}

function victory() {
  const survivors = [...S.hand, ...S.deck, ...S.discard];
  const score = survivors.reduce((t, c) => t + c.level, 0);
  const was = stagesCleared();
  clearStage(S.dragon.stage);
  const next = dragonForStage(S.dragon.stage + 1);
  log(`🏆 THE ${S.dragon.name.toUpperCase()} FALLS! Final score: ${score}`, 'good result');
  if (next && S.dragon.stage > was) log(`🗺️ Stage ${S.dragon.stage} cleared — STAGE ${next.stage}, the ${next.name}, is open to you. ${next.brief}`, 'good result');
  else if (!next) log(`🪜 Every stage stands open — take whichever you like.`, 'good result');
  S.phase = 'victory';
  render();
}

// go — restore a saved run if one exists, else start fresh
if (!loadGame()) freshGame();
