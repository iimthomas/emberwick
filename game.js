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
    lv: [[4,null,5,3,1,null,2], [3,null,8,2,1,null,3], [3,null,11,1,1,null,4], [3,null,14,1,1,null,null]] },
  { name: 'Bellowsbreath', element: 'Fire', arch: 'FLOW',
    lv: [[4,null,3,3,1,null,2], [3,null,2,6,1,null,3], [3,null,1,9,1,null,4], [3,null,1,12,1,null,null]] },
  { name: 'Hearthwall', element: 'Fire', arch: 'WARD',
    lv: [[4,null,3,2,2,null,2], [3,null,2,1,5,null,3], [4,null,1,1,8,null,4], [5,null,1,1,11,null,null]] },
  { name: 'Tidebreak', element: 'Water', arch: 'FORCE',
    lv: [[3,null,1,3,3,null,2], [5,null,0,2,2,null,3], [7,null,0,1,1,null,4], [9,null,0,1,1,null,null]] },
  { name: 'Riverstep', element: 'Water', arch: 'SPARK',
    lv: [[2,null,4,4,3,null,2], [2,null,7,3,2,null,3], [2,null,10,2,1,null,4], [2,null,13,2,1,null,null]] },
  { name: 'Wellspring', element: 'Water', arch: 'FLOW',
    lv: [[2,null,2,4,3,null,2], [2,null,1,7,2,null,3], [2,null,0,10,1,null,4], [2,null,0,13,1,null,null]] },
  { name: 'Rimeguard', element: 'Water', arch: 'WARD',
    lv: [[2,null,2,3,4,null,2], [2,null,1,2,7,null,3], [3,null,0,1,10,null,4], [4,null,0,1,13,null,null]] },
  { name: 'Sparkstrike', element: 'Lightning', arch: 'FORCE',
    lv: [[4,null,4,2,1,null,2], [6,null,3,1,1,null,3], [8,null,2,1,1,null,4], [10,null,2,1,1,null,null]] },
  { name: 'Quickfire', element: 'Lightning', arch: 'SPARK',
    lv: [[3,null,7,3,1,null,2], [2,null,10,2,1,null,3], [2,null,13,1,1,null,4], [2,null,16,1,1,null,null]] },
  { name: 'Stormglass', element: 'Lightning', arch: 'FLOW',
    lv: [[3,null,5,3,1,null,2], [2,null,4,6,1,null,3], [2,null,3,9,1,null,4], [2,null,3,12,1,null,null]] },
  { name: 'Staticwall', element: 'Lightning', arch: 'WARD',
    lv: [[3,null,5,2,2,null,2], [2,null,4,1,5,null,3], [3,null,3,1,8,null,4], [4,null,3,1,11,null,null]] },
  { name: 'Rockfall', element: 'Stone', arch: 'FORCE',
    lv: [[4,null,1,1,4,null,2], [6,null,0,1,3,null,3], [8,null,0,1,2,null,4], [10,null,0,1,2,null,null]] },
  { name: 'Flintdart', element: 'Stone', arch: 'SPARK',
    lv: [[3,null,4,2,4,null,2], [2,null,7,1,3,null,3], [2,null,10,1,2,null,4], [2,null,13,1,2,null,null]] },
  { name: 'Deepvein', element: 'Stone', arch: 'FLOW',
    lv: [[3,null,2,2,4,null,2], [2,null,1,5,3,null,3], [2,null,0,8,2,null,4], [2,null,0,11,2,null,null]] },
  { name: 'Cairnguard', element: 'Stone', arch: 'WARD',
    lv: [[3,null,2,1,5,null,2], [2,null,1,1,8,null,3], [3,null,0,1,11,null,4], [4,null,0,1,14,null,null]] },
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
  // 🌪️ STAGE 2's OWN TWO (2026-08-05). A land should press on the thing its dragon presses on,
  // so Skyrender's country attacks SPEED from both ends — one takes your fast card away from the
  // race, the other makes the race a condition on your class rule.
  //
  // 🔃 Vertigo is the INVERSE of Mire, and that is the point: Mire bars your fastest card from
  // the Catalyst, Vertigo nails it INTO the Spell. Same card, opposite instruction, and both are
  // stated in engine terms (`init`), so a rogue meets them unchanged.
  'Vertigo':      'The ground falls away — your <b>fastest</b> card must be your <b>Spell</b>.',
  // ⚡ Squall puts a SECOND condition on the Catalyst, which is the one card already serving two
  // masters. ⚠️ We measured in July that a permanent second condition produces search, not
  // sacrifice — with 12 arrangements you can usually satisfy both. A HARDSHIP is where that
  // finding says the pressure belongs: it is one encounter, so "you cannot have both today" is a
  // problem you solve rather than a tax you route around forever.
  'Squall':       'The air will not hold — your cards find accord <b>only if you win Initiative</b>.',
  // ⏳ STAGE 3's TWO. Cragmourn's demand is *waste nothing*, so its land takes away the slack
  // you did not know you were relying on.
  // ⚠️ Rationed is a RESOURCE denial, not an option denial — the Surge still goes somewhere, it
  // just pays nothing, so no slot is sealed and no choice is removed (sealed slots shipped once and
  // were killed the same day).
  'Rationed':     'Nothing is spare here — your <b>Surge adds nothing</b> this encounter.',
  // ⚖️ Exacting is the mountain's own logic: half-measures are nothing. It is the harshest
  // hardship in the game and it is deliberately confined to late Fellgrind regions.
  'Exacting':     'It gives no half credit — a <b>Narrow counts as a Loss</b>.',
  // 🌊 STAGE 4's. The Arsenal is the one slot that is identical in every class, and this is the
  // only rule that takes the carry itself — the exam's way of saying *nothing you save is safe*.
  'Riptide':      'The current takes what you held — your <b>Arsenal is spent</b>, not kept.',
};
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
  'Steep':       "The journey's MP is increased by your Arsenal's Boost.",
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
    { type: 'journey', name: 'Kestrel Stair',   mp: 11, timePenalty: 2, element: 'Lightning', nightfall: 4, xp: 4, peril: 'Updraft' },
    { type: 'journey', name: 'Whistling Gap',   mp: 9,  timePenalty: 1, element: 'Water',     nightfall: 3, xp: 2 },
    { type: 'journey', name: 'Sunlit Terrace',  mp: 12, timePenalty: 2, element: 'Fire',      nightfall: 4, xp: 3 },
    { type: 'journey', name: 'Cloudmere Path',  mp: 10, timePenalty: 1, element: 'Stone',     nightfall: 4, xp: 3 },
  ]},
  // 🦅 The Shrike Downs — hunting country. Everything here reaches you first, and 🌀 Vertigo
  // arrives to take the one card that could have answered that.
  { name: 'The Shrike Downs', hardshipChance: 0.35, hardships: ['Ambush', 'Vertigo', 'Night Travel'], encounters: [
    { type: 'fight',   name: 'Downs Shrike',   hp: 9,  init: 5, atk: 3, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 4, ability: 'Ranged' },
    { type: 'fight',   name: 'Gorse Lurcher',  hp: 13, init: 3, atk: 3, atkEl: 'Stone',     shape: 'armour', shapeV: 2, xp: 5 },
    { type: 'fight',   name: 'Quillback',      hp: 11, init: 4, atk: 2, atkEl: 'Stone',     shape: 'evasion', shapeV: 1, xp: 5, ability: 'Windshear' },
    { type: 'fight',   name: 'Thistle Drake',  hp: 13, init: 4, atk: 3, atkEl: 'Fire',      shape: 'evasion', shapeV: 1, xp: 6, ability: 'Freeze' },
    { type: 'journey', name: 'Harrow Ride',      mp: 13, timePenalty: 2, element: 'Fire',      nightfall: 5, xp: 4, peril: 'Updraft' },
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
    { type: 'journey', name: 'Thunder Stair',  mp: 13, timePenalty: 3, element: 'Lightning', nightfall: 5, xp: 5, peril: 'Updraft' },
    { type: 'journey', name: 'Static Flats',   mp: 12, timePenalty: 2, element: 'Stone',     nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Rainshadow',     mp: 11, timePenalty: 3, element: 'Water',     nightfall: 6, xp: 4, peril: 'Treacherous' },
    { type: 'journey', name: 'The Long Gale',  mp: 13, timePenalty: 2, element: 'Fire',      nightfall: 5, xp: 4 },
  ]},
  // 🐉 The Riven Sky — under its wings. Everything is faster than you and the ground is gone.
  { name: 'The Riven Sky', hardshipChance: 0.65, hardships: ['Squall', 'Vertigo', 'Ambush', 'Storm', 'Dead Weight'], encounters: [
    { type: 'fight',   name: 'Riven Hatchling', hp: 12, init: 5, atk: 4, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 5, ability: 'Windshear' },
    { type: 'fight',   name: 'Stormcrown Roc',  hp: 14, init: 5, atk: 4, atkEl: 'Water',     shape: 'evasion', shapeV: 1, xp: 6, ability: 'Ranged' },
    { type: 'fight',   name: 'Riven Warden',    hp: 18, init: 4, atk: 4, atkEl: 'Stone',     shape: 'armour', shapeV: 3, xp: 6 },
    { type: 'fight',   name: 'Tempest Lynx',    hp: 13, init: 5, atk: 4, atkEl: 'Fire',      shape: 'evasion', shapeV: 1, xp: 6, ability: 'Freeze' },
    { type: 'journey', name: 'Skyfall Verge',   mp: 14, timePenalty: 3, element: 'Water',     nightfall: 6, xp: 5, peril: 'Treacherous' },
    { type: 'journey', name: 'The Riven Stair', mp: 13, timePenalty: 3, element: 'Stone',     nightfall: 6, xp: 4, peril: 'Steep' },
    { type: 'journey', name: 'Cloudbreak Run',  mp: 13, timePenalty: 2, element: 'Lightning', nightfall: 6, xp: 5, peril: 'Updraft' },
    { type: 'journey', name: 'Wingshadow Pass', mp: 13, timePenalty: 3, element: 'Fire',      nightfall: 7, xp: 4 },
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
    { type: 'journey', name: 'The Slow Ford',   mp: 12, timePenalty: 2, element: 'Water',     nightfall: 4, xp: 4 },
    { type: 'journey', name: 'Turfcutter Way',  mp: 10, timePenalty: 2, element: 'Stone',     nightfall: 4, xp: 3 },
    { type: 'journey', name: 'Reedlight Path',  mp: 11, timePenalty: 2, element: 'Fire',      nightfall: 4, xp: 3 },
    { type: 'journey', name: 'The Long Bank',   mp: 13, timePenalty: 2, element: 'Lightning', nightfall: 5, xp: 4 },
  ]},
  { name: 'Grindstone Vale', hardshipChance: 0.35, hardships: ['Rationed', 'Dead Weight', 'Night Travel'], encounters: [
    { type: 'fight',   name: 'Quarry Hound',   hp: 12, init: 4, atk: 3, atkEl: 'Stone', shape: 'evasion', shapeV: 1, xp: 5 },
    { type: 'fight',   name: 'Millstone Crab', hp: 17, init: 2, atk: 3, atkEl: 'Water', shape: 'armour', shapeV: 3, xp: 6, ability: 'Backlash' },
    { type: 'fight',   name: 'Grindtooth',     hp: 14, init: 3, atk: 4, atkEl: 'Fire',  shape: 'armour', shapeV: 2, xp: 6 },
    { type: 'fight',   name: 'Slagmoth',       hp: 11, init: 5, atk: 3, atkEl: 'Fire',  shape: 'evasion', shapeV: 1, xp: 5, ability: 'Poison' },
    { type: 'journey', name: 'The Whetway',     mp: 13, timePenalty: 3, element: 'Stone',     nightfall: 5, xp: 4, peril: 'Toll' },
    { type: 'journey', name: 'Ashfall Steps',   mp: 12, timePenalty: 2, element: 'Fire',      nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Cold Furrow',     mp: 11, timePenalty: 2, element: 'Water',     nightfall: 5, xp: 3 },
    { type: 'journey', name: 'The Iron Cut',    mp: 14, timePenalty: 3, element: 'Lightning', nightfall: 5, xp: 5, peril: 'Steep' },
  ]},
  { name: 'The Unquiet Deep', hardshipChance: 0.5, hardships: ['Rationed', 'Dead Air', 'Night Travel', 'Dead Weight'], encounters: [
    { type: 'fight',   name: 'Deepdelver',     hp: 18, init: 3, atk: 4, atkEl: 'Stone', shape: 'armour', shapeV: 3, xp: 6 },
    { type: 'fight',   name: 'Cavern Shrike',  hp: 12, init: 5, atk: 3, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 5, ability: 'Ranged' },
    { type: 'fight',   name: 'Glasswing Moth', hp: 10, init: 4, atk: 3, atkEl: 'Water', shape: 'evasion', shapeV: 1, xp: 5, ability: 'Backlash' },
    { type: 'fight',   name: 'Hollow Bull',    hp: 17, init: 2, atk: 5, atkEl: 'Fire',  shape: 'armour', shapeV: 3, xp: 7 },
    { type: 'journey', name: 'The Deadfall',    mp: 13, timePenalty: 3, element: 'Stone',     nightfall: 6, xp: 5, peril: 'Toll' },
    { type: 'journey', name: 'Blackwater Run',  mp: 12, timePenalty: 3, element: 'Water',     nightfall: 6, xp: 4, peril: 'Treacherous' },
    { type: 'journey', name: 'The Winding Cut', mp: 14, timePenalty: 2, element: 'Lightning', nightfall: 6, xp: 5 },
    { type: 'journey', name: 'Emberdown',       mp: 12, timePenalty: 3, element: 'Fire',      nightfall: 6, xp: 4 },
  ]},
  { name: "Cragmourn's Shoulder", hardshipChance: 0.6, hardships: ['Exacting', 'Rationed', 'Dead Weight', 'Storm', 'Ambush'], encounters: [
    { type: 'fight',   name: 'Scree Warden',   hp: 18, init: 3, atk: 5, atkEl: 'Stone', shape: 'armour', shapeV: 3, xp: 7 },
    { type: 'fight',   name: 'Fault Lurker',   hp: 14, init: 5, atk: 4, atkEl: 'Water', shape: 'evasion', shapeV: 1, xp: 6, ability: 'Backlash' },
    { type: 'fight',   name: 'Cinderjaw',      hp: 17, init: 4, atk: 5, atkEl: 'Fire',  shape: 'armour', shapeV: 3, xp: 7, ability: 'Freeze' },
    { type: 'fight',   name: 'Stonewake Elk',  hp: 15, init: 5, atk: 4, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 6, ability: 'Windshear' },
    { type: 'journey', name: 'The Grinding Pass', mp: 14, timePenalty: 3, element: 'Stone',     nightfall: 7, xp: 5, peril: 'Toll' },
    { type: 'journey', name: 'Shoulderfall',      mp: 13, timePenalty: 3, element: 'Fire',      nightfall: 6, xp: 5, peril: 'Steep' },
    { type: 'journey', name: 'The Last Furrow',   mp: 14, timePenalty: 2, element: 'Water',     nightfall: 7, xp: 5 },
    { type: 'journey', name: 'Thunderfoot Road',  mp: 13, timePenalty: 3, element: 'Lightning', nightfall: 7, xp: 5, peril: 'Treacherous' },
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
    { type: 'fight',   name: 'Barnacle Ox',    hp: 18, init: 2, atk: 4, atkEl: 'Stone', shape: 'armour', shapeV: 3, xp: 6, ability: 'Backlash' },
    { type: 'journey', name: 'The Wrackline',   mp: 13, timePenalty: 2, element: 'Water',     nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Saltmarsh Road',  mp: 12, timePenalty: 2, element: 'Stone',     nightfall: 5, xp: 4 },
    { type: 'journey', name: 'Lantern Shallows',mp: 14, timePenalty: 2, element: 'Fire',      nightfall: 5, xp: 5, peril: 'Updraft' },
    { type: 'journey', name: 'The Ebb Path',    mp: 11, timePenalty: 3, element: 'Lightning', nightfall: 6, xp: 4 },
  ]},
  { name: 'Drowned Kell', hardshipChance: 0.35, hardships: ['Riptide', 'Vertigo', 'Rationed', 'Night Travel'], encounters: [
    { type: 'fight',   name: 'Kell Warden',    hp: 12, init: 4, atk: 4, atkEl: 'Water', shapes: ['armour', 'evasion'], shapeV: 1, xp: 6 },
    { type: 'fight',   name: 'Silt Crawler',   hp: 17, init: 2, atk: 4, atkEl: 'Stone', shape: 'armour', shapeV: 3, xp: 7 },
    { type: 'fight',   name: 'Drowned Piper',  hp: 12, init: 5, atk: 4, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 6, ability: 'Ranged' },
    { type: 'fight',   name: 'Anchorback',     hp: 16, init: 3, atk: 4, atkEl: 'Fire',  shape: 'armour', shapeV: 3, xp: 6, ability: 'Backlash' },
    { type: 'journey', name: 'The Kell Stair',  mp: 14, timePenalty: 3, element: 'Water',     nightfall: 6, xp: 5, peril: 'Toll' },
    { type: 'journey', name: 'Bell Causeway',   mp: 13, timePenalty: 2, element: 'Stone',     nightfall: 6, xp: 5, peril: 'Steep' },
    { type: 'journey', name: 'Weedlight Reach', mp: 12, timePenalty: 3, element: 'Fire',      nightfall: 6, xp: 4 },
    { type: 'journey', name: 'The Undertow',    mp: 15, timePenalty: 2, element: 'Lightning', nightfall: 6, xp: 5, peril: 'Updraft' },
  ]},
  { name: 'The Black Shelf', hardshipChance: 0.5, hardships: ['Riptide', 'Squall', 'Dead Air', 'Ambush'], encounters: [
    { type: 'fight',   name: 'Shelf Sentinel', hp: 13, init: 4, atk: 4, atkEl: 'Stone', shapes: ['armour', 'evasion'], shapeV: 2, xp: 7 },
    { type: 'fight',   name: 'Fathom Ray',     hp: 13, init: 6, atk: 4, atkEl: 'Water', shape: 'evasion', shapeV: 1, xp: 6, ability: 'Windshear' },
    { type: 'fight',   name: 'Coldvein Worm',  hp: 18, init: 2, atk: 5, atkEl: 'Stone', shape: 'armour', shapeV: 4, xp: 7 },
    { type: 'fight',   name: 'Lanternjaw',     hp: 14, init: 4, atk: 4, atkEl: 'Fire',  shape: 'evasion', shapeV: 1, xp: 6, ability: 'Backlash' },
    { type: 'journey', name: 'The Shelf Road',  mp: 14, timePenalty: 3, element: 'Stone',     nightfall: 7, xp: 5, peril: 'Toll' },
    { type: 'journey', name: 'Nightcurrent',    mp: 13, timePenalty: 3, element: 'Water',     nightfall: 7, xp: 5, peril: 'Treacherous' },
    { type: 'journey', name: 'The Sounding',    mp: 14, timePenalty: 2, element: 'Lightning', nightfall: 6, xp: 5, peril: 'Updraft' },
    { type: 'journey', name: 'Emberdrown',      mp: 13, timePenalty: 3, element: 'Fire',      nightfall: 7, xp: 5 },
  ]},
  { name: "Fathomdread's Trench", hardshipChance: 0.6, hardships: ['Riptide', 'Exacting', 'Squall', 'Vertigo', 'Dead Weight', 'Rationed'], encounters: [
    { type: 'fight',   name: 'Trench Warden',  hp: 15, init: 5, atk: 5, atkEl: 'Water', shapes: ['armour', 'evasion'], shapeV: 2, xp: 7 },
    { type: 'fight',   name: 'Hadal Serpent',  hp: 15, init: 6, atk: 5, atkEl: 'Lightning', shape: 'evasion', shapeV: 1, xp: 7, ability: 'Windshear' },
    { type: 'fight',   name: 'Pressureback',   hp: 19, init: 3, atk: 5, atkEl: 'Stone', shape: 'armour', shapeV: 4, xp: 7, ability: 'Backlash' },
    { type: 'fight',   name: 'The Pale Herald',hp: 14, init: 5, atk: 5, atkEl: 'Fire',  shapes: ['armour', 'evasion'], shapeV: 1, xp: 7, ability: 'Freeze' },
    { type: 'journey', name: 'The Trench Road', mp: 14, timePenalty: 3, element: 'Water',     nightfall: 7, xp: 6, peril: 'Toll' },
    { type: 'journey', name: 'Deadlight Deep',  mp: 14, timePenalty: 3, element: 'Fire',      nightfall: 7, xp: 5, peril: 'Treacherous' },
    { type: 'journey', name: 'The Long Descent',mp: 14, timePenalty: 3, element: 'Stone',     nightfall: 7, xp: 5, peril: 'Steep' },
    { type: 'journey', name: 'Stormfathom',     mp: 14, timePenalty: 2, element: 'Lightning', nightfall: 7, xp: 6, peril: 'Updraft' },
  ]},
];

const ROADS = { 1: REGIONS, 2: ROAD_STORMREACH, 3: ROAD_FELLGRIND, 4: ROAD_FATHOM };
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
function bankValueOf(surge) { return surge ? eff(surge).boost : 0; }
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
  // 🧪 Tallow Stub — one turn's insurance on the thing the whole road pays for
  if (S.potionFx && S.potionFx.keepCandle) { log(`🕯️ The tallow holds — your candle survives ${why}.`, 'good'); return; }
  S.candle = false;
  log(`🕯️ Your candle gutters out — ${why}. You cannot see what is coming.`, 'bad');
}
// what waits after this one, if you can see it
function nextEncounter() {
  if (!S.candle || S.finalMode) return null;
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
  // ✦ LOOSE WEAVE: an unmatched pair attunes for only half the bonus
  let v = looseOnly() ? st.value + Math.floor((st.attuned - st.value) / 2) : st.attuned;
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
  multi: null,                          // no slot holds more than one card
  labels: { Spell: 'Spell', Element: 'Catalyst', Boost: 'Surge', Reserve: 'Arsenal' },
  defs: null,                           // set to CARD_DEFS below — the table is declared above it
  deck() { return shuffle(CARD_DEFS.map(newCard)); },
  pairs: true,                          // ✦ elements agree → the Spell attunes. The mage's one rule.
  // 🔥 THE EMBERWAKE IS THE MAGE'S FILL OF SLOT ③, NOT AN ENGINE RULE (corrected 2026-08-12).
  // ⚠️ I got this backwards earlier the same day. Making banking a plain choice fixed two REAL
  // faults — a trigger that came from the shuffle rather than the encounter, and a 2:1 exchange
  // rate — but I then argued it should therefore be generic "so every class inherits it".
  // 🔑 THAT IS THE ONE SLOT NO RULE MAY BE GENERIC IN. The slot contract says ①②④ each feed an
  // engine system and are therefore constrained, and ③ feeds nothing — which is exactly why it is
  // the free space where a CLASS poses its signature fork. A generic rule sitting in ③ does not
  // give every class a gift; it spends the only room each class had.
  // So: flag it, and gate every consumer. A rogue's ③ is its own (extend the chain, or cycle).
  emberwake: true,
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
      hits: 1,
      attuned, attBonus: st.attuned - st.value,
      banks, bank, wake: w, wakeTarget: wt,
      vSpell: vSpell && vSpell.slot === 'Spell' ? vSpell.name : null,
      vElem: vElem && vElem.slot === 'Element' ? vElem.name : null,
      spell, elem, boostC,
      attuner: attunerCard(), loose: looseOnly(),
    };
  },
};
// ============================================================
// 🗡️ THE ROGUE — step 8 of the master plan, and the proof the CLASS SEAM is real.
//
// 🔑 ITS SOURCE OF POWER IS **SEQUENCE**, where the mage's is PAIRING. The mage asks a question
// about the hand in front of you ("do two of these agree?"); the rogue asks one about the turn you
// just played ("does one of these follow what I struck with?"). Different axis, so the two classes
// can never collapse into each other — which is the whole point of the source-of-power rule.
//
// ⚠️ NO ELEMENTS ANYWHERE. Elements are the mage's one rule. A rogue card must not even be NAMED
// for one, or a player would reasonably expect it to pair with something.
//
// THE DECK IS 8 CARDS x 2 COPIES, not 16 unique (Thomas, 2026-08-12). "16 unique" was the MAGE's
// acceptance test, never an engine law. Duplicates are what make a NAME-matched combo possible at
// all: a specific named card sits in a 4-card hand 25% of the time at one copy and 45% at two.
// 🔑 And a sequence class can afford a smaller pool, because its variety comes from the CHAIN
// rather than the deal — the same eight cards mean different things at different chain positions.
//
// THE COMBO: four MUTUAL PAIRS. Each card combos off its partner, so a chain alternates A,B,A,B
// and is learnable as four two-beat moves instead of a graph. Each pair answers a different
// problem, so which line you commit to is a real choice the encounter judges.
// ============================================================
MAGE.defs = CARD_DEFS;   // declared here because CARD_DEFS is defined far above MAGE

const ROGUE_ABILITIES = {
  outpace:  'you win Initiative automatically',
  unhalved: 'this strike cannot be halved by 🌀 Evasion',
  pierce:   'this strike ignores 🛡️ Armour',
  onehit:   'this strike lands as ONE hit instead of several',
  persist:  'the chain does not break next turn',
  cycle:    'cycle a card without losing the chain',
  unspent:  'this Strike is not spent — it returns to your hand',
  doubled:  'your ARSENAL also counts as the previous card',
};

// 🔑 GENERATED FROM A RULE, NEVER HAND-AUTHORED — the same discipline the mage's level tables were
// put back on after 12 of 16 cards were found to have a FLAT attuned strike. `base` is Lv1
// [value, init, boost, armor]; the SPIKE rises +3 a level and every weakness drops ONCE (Lv1->Lv2)
// then holds. Edit the spec, never a row.
// ⚠️ THE NUMBERS BELOW ARE PLACEHOLDERS. They exist so the class can RUN and be measured; they are
// not tuned and must not be quoted as balance until the bot can price a chain (see solver.js).
const ROGUE_SPEC = [
  // pair            name              combos off        ability     spike    base [val,init,boost,armor]
  { pair: 'RUSH',    name: 'Viper Strike',   combo: 'Second Fang',    ability: 'outpace',  spike: 'init',  base: [3, 6, 2, 1] },
  { pair: 'RUSH',    name: 'Second Fang',    combo: 'Viper Strike',   ability: 'unhalved', spike: 'boost', base: [4, 4, 3, 1] },
  { pair: 'OPENING', name: 'Venom Needle',   combo: 'Lethal Dose',    ability: 'pierce',   spike: 'armor', base: [3, 3, 2, 3] },
  { pair: 'OPENING', name: 'Lethal Dose',    combo: 'Venom Needle',   ability: 'onehit',   spike: 'value', base: [6, 2, 2, 1] },
  { pair: 'HOLD',    name: 'Slow Poison',    combo: 'Sleight of Hand',ability: 'persist',  spike: 'boost', base: [4, 3, 3, 1] },
  { pair: 'HOLD',    name: 'Sleight of Hand',combo: 'Slow Poison',    ability: 'cycle',    spike: 'init',  base: [3, 5, 2, 2] },
  { pair: 'PAYOFF',  name: 'Ghostblade',     combo: 'Shadow Double',  ability: 'unspent',  spike: 'value', base: [6, 2, 1, 2] },
  { pair: 'PAYOFF',  name: 'Shadow Double',  combo: 'Ghostblade',     ability: 'doubled',  spike: 'armor', base: [3, 3, 2, 3] },
];
const ROGUE_COST = [2, 3, 4, null];      // to next level, as the mage's
const ROGUE_DEFS = ROGUE_SPEC.map(s => {
  const idx = { value: 0, init: 1, boost: 2, armor: 3 };
  const lv = [0, 1, 2, 3].map(L => {
    const st = s.base.map((v, i) => {
      if (i === idx[s.spike]) return v + 3 * L;           // the spike rises every level
      return L === 0 ? v : Math.max(0, v - 1);            // every weakness drops ONCE, then holds
    });
    return [st[0], null, st[1], st[2], st[3], null, ROGUE_COST[L]];
  });
  return { name: s.name, element: null, arch: null, pair: s.pair,
           combo: s.combo, ability: s.ability, lv };
});

// what the STRIKE played last turn was named, and how long the chain is (see nextTurn)
function chainPartnerOf(card) { return card && card.def.combo ? card.def.combo : null; }
function comboLive(card) {
  if (!card || !card.def.combo) return false;
  if (S.chainPersist) return true;                       // ✦ Slow Poison held it open
  if (S.lastStrike && card.def.combo === S.lastStrike) return true;
  // ✦ Shadow Double: the card you HELD also counts as what you played
  return !!(S.doubledStrike && card.def.combo === S.doubledStrike);
}

const ROGUE = {
  id: 'rogue',
  multi: null,
  labels: { Spell: 'Strike', Element: 'Combo', Boost: 'Momentum', Reserve: 'Arsenal' },
  defs: ROGUE_DEFS,
  deck() { return shuffle(ROGUE_DEFS.concat(ROGUE_DEFS).map(newCard)); },   // 8 x 2
  emberwake: false,                     // 🔥 that is the MAGE's slot ③. The rogue's is extend-or-cycle.
  pairs: false,                         // ✦ no elements, so nothing ever attunes
  cycles: true,                         // 🗡️ slot ③: fix your hand, or keep your momentum
  canPlace() { return true; },
  valid() { return !!spellCard(); },
  spentIds() { return S.assign.Spell ? [S.assign.Spell] : []; },
  compose() {
    const strike = spellCard();
    if (!strike) return null;
    const combo = cardById(S.assign.Element), momentum = cardById(S.assign.Boost);
    const st = eff(strike);
    const lv4 = strike.level >= MAX_LEVEL;
    // ✦ Lv4 = a FINISHER. The ability fires without the setup, but the card no longer continues
    // the chain. 🔑 That is what keeps an all-Lv4 deck BAD — eight finishers cannot chain at all,
    // so knowing when to stop sharpening stays the skill, exactly as it is for the mage.
    const linked = comboLive(strike);
    const fires = linked || lv4;
    const ab = fires ? strike.def.ability : null;
    const chain = linked && !lv4 ? (S.chain || 1) + 1 : 1;
    // 🔑 HITS COME FROM THE CHAIN. This is the rogue's answer to 🧱 GUARD (a pool that wants many
    // hits) and its weakness against 🛡️ Armour (which subtracts from EVERY hit) — the shape of the
    // enemy decides whether your momentum is an asset or a liability, which is the class's fork.
    const hits = ab === 'onehit' ? 1 : Math.max(1, chain);
    return {
      value: Math.max(0, st.value + (momentum ? eff(momentum).boost : 0) + (duelFx().value || 0)),
      element: null,
      // momentum is speed: a long chain arrives before they are ready
      init: (combo ? eff(combo).init : 0) + (chain - 1) * 2,
      boost: momentum ? eff(momentum).boost : 0,
      hits,
      attuned: false, attBonus: 0,
      banks: false, bank: 0, wake: 0, wakeTarget: null,
      vSpell: null, vElem: null,
      spell: strike, elem: combo, boostC: momentum,
      attuner: null, loose: false,
      // rogue-only, read by resolveAction and by nextTurn
      rogue: { linked, lv4, ability: ab, chain, pair: strike.def.pair },
    };
  },
};

// ============================================================
// 🗡️ SLOT ③ FOR THE ROGUE — THE CYCLE. Its signature fork, and the mirror of the mage's bank.
//
//   fix your hand, or keep your momentum. Never both.
//
// 🔑 IT MUST COST SOMETHING, and the price is the chain. The ❌ Prism was cut because a FREE fix
// for a bad hand measured as better than a good hand, and the rule that earned is: **a
// compensation for bad luck must leave you WORSE OFF than good luck.** Breaking the chain does
// exactly that — you are never punished into a dead end, but you never profit from the bad draw.
// ⚠️ The discarded card goes UNDER THE DECK, never out of the game: deck-as-health is untouched,
// and the cost is TIME (you will not see it again this region), which is the currency the Time
// Penalty already charges. Nothing new to teach.
// ✦ Sleight of Hand's combo grants `freeCycle` for the NEXT turn — the one time you get both.
// ============================================================
function canCycle() {
  return !!(CLASS.cycles && isAssignPhase() && !S.cycled && S.hand.length && S.deck.length);
}
function armCycle() {
  if (!canCycle()) return;
  S.cyclePick = !S.cyclePick;
  S.selectedId = null;
  render();
}
function cycleCard(id) {
  S.cyclePick = false;
  if (!canCycle()) { render(); return; }
  const card = S.hand.find(c => c.id === id);
  if (!card) { render(); return; }
  S.hand = S.hand.filter(c => c.id !== id);
  S.deck.push(card);                                  // under the deck, not out of the run
  const drawn = S.deck.shift();
  if (drawn) S.hand.push(drawn);
  S.cycled = true;
  if (S.freeCycle) {
    S.freeCycle = false;
    log(`🗡️ Sleight of Hand — ${displayName(card)} goes under the deck for ${drawn ? displayName(drawn) : 'nothing'}, and the chain holds.`, 'good');
  } else {
    S.lastStrike = null; S.chain = 1; S.chainPersist = false; S.doubledStrike = null;
    log(`🗡️ You cycle ${displayName(card)} under the deck for ${drawn ? displayName(drawn) : 'nothing'} — the chain breaks.`, 'bad');
  }
  normalizeAssign();
  saveGame();
  render();
}

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
  Bellowsbreath:{ slot: 'Boost',   name: 'Backdraft',  text: 'Banking from here DOUBLES the Emberwake.' },
  Wellspring:   { slot: 'Boost',   name: 'Deepwell',   text: 'An Emberwake banked from here lasts a second turn.' },
  Stormglass:   { slot: 'Boost',   name: 'Quickspark', text: 'Banking from here also gives +3 Initiative this turn.' },
  Deepvein:     { slot: 'Boost',   name: 'Motherlode', text: 'Banking from here ALSO fires the boost this turn.' },
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
const DRAGONS = [
  { stage: 1, name: 'Cindermaw', par: 36, element: 'Fire', init: 10, breath: 6, hp: 52,
    shapes: ['armour'], shapeV: 4,
    teaches: 'HIT BIG',
    brief: 'Slag has cooled over every scale. Small blows spatter and die on it — only a fully fuelled strike reaches anything underneath.' },
  { stage: 2, name: 'Skyrender', par: 44, element: 'Lightning', init: 10, breath: 8, hp: 55,
    shapes: ['evasion'], shapeV: 0,
    teaches: 'HIT FIRST',
    brief: 'It is never where you struck. Reach it before it moves and the blow lands whole; arrive late and you catch half a wing.' },
  { stage: 3, name: 'Cragmourn', par: 48, element: 'Stone', init: 7, breath: 5, hp: 68,
    shapes: ['relentless'], shapeV: 0,
    teaches: 'WASTE NOTHING',
    brief: 'The mountain does not tire. Every beat it draws a deeper breath than the last — a long duel is a duel you have already lost.' },
  { stage: 4, name: 'Fathomdread', par: 52, element: 'Water', init: 10, breath: 7, hp: 50,
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
    // ⚠️ REWRITTEN 2026-08-12 (Thomas: *"doesn't explain what it does. we gotta explain what things
    // do exactly"*). The old page said "fall short and you lose time" and "the dark catches you" —
    // both name a consequence without defining it, which is the one thing a brief exists to do.
    // 🔑 THE BAR: every stat must say what it SUBTRACTS FROM WHAT. If a sentence could be true of
    // three different rules, it is flavour, not a brief.
    { title: 'A turn is an arrangement',
      body: 'Your four cards sit under four labels, and <b>position is the role</b> — you rearrange by swapping.<br><br>' +
            '<b>SPELL</b> — its number is what you deal. Afterwards it is <b>spent</b>: into the discard, and you will not see it again until the region ends.<br>' +
            '<b>CATALYST</b> — its <b>💨 Initiative</b> races the enemy\'s. And if it shares your Spell\'s element, the Spell <b>attunes</b> and strikes for the bigger <b>✦</b> number on its face instead.<br>' +
            '<b>SURGE</b> — its <b>➕</b> is added to your Spell. Or <b>bank</b> it: nothing this turn, and next turn you spend its full value on your strike or your speed.<br>' +
            '<b>ARSENAL</b> — the one card you <b>keep</b> into the next hand. Your Catalyst and Surge slide back under your deck.' },
    { title: '⚔️ A fight asks for damage',
      body: 'Your <b>Spell</b> (plus your Surge) is your blow, measured against its <b>❤️ HP</b>:<br><br>' +
            '• <b>Complete</b> — you meet or beat its HP. It never touches you.<br>' +
            '• <b>Narrow</b> — you reach <b>half</b> its HP. You still get past it, but it <b>hits back for its ⚔️</b>.<br>' +
            '• <b>Loss</b> — below half. It hits back and you gain nothing. <i>You still move on</i> — an encounter is never the end of your run.<br><br>' +
            '<b>💨 And the race is separate.</b> If your Catalyst is slower than its 💨, it <b>bites first for its ⚔️</b> — even if your blow then kills it. Speed is not damage; it is whether you get hurt on the way in.<br><br>' +
            'Each creature also defends with a <b>shape</b>: 🛡️ <b>Armour N</b> subtracts N from your blow, so it wants <b>one big hit</b>. 🌀 <b>Evasion</b> <b>halves</b> your blow unless you won the race, so it wants <b>speed</b>.' },
    { title: '👣 A journey asks for distance',
      body: 'The same cards, read a different way. Your <b>Spell</b> is how far you get, measured against its <b>MP</b> — <b>Complete</b>, <b>Narrow</b> at half, <b>Loss</b> below.<br><br>' +
            '<b>⏳ Time Penalty</b> — anything short of Complete costs you this many cards, <b>burned off the top of your deck</b> into the discard. You do not bleed; you lose the cards you were about to draw. <i>(Only if your deck is already empty does it become damage.)</i><br><br>' +
            '<b>🌙 Nightfall</b> — your <b>Catalyst\'s 💨</b> is your <b>Pace</b>. If your Pace is <b>below</b> this number the dark catches you: the card in your <b>ARSENAL</b> is discarded, and your 🕯️ candle goes out.<br><br>' +
            'So a fight punishes you in <b>blood</b> and a journey punishes you in <b>cards and time</b>.' },
    { title: 'Your deck is your health',
      body: 'There is no health bar. When something damages you, you <b>blunt your own cards</b> to absorb it.<br><br>' +
            '• Each card you blunt <b>drops one level</b> and soaks its printed <b>🛡️ armour</b>.<br>' +
            '• A card showing <b>🛡️ —</b> cannot soak at all.<br>' +
            '• A card already at <b>Lv1</b> does not drop — it <b>leaves your deck for the rest of the run</b>.<br>' +
            '• If your cards cannot absorb it all, <b>the run ends there</b>.<br><br>' +
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
      // ⚠️ initLost is `e.init > init`, so a TIE WINS. "Has to beat" was wrong by one.
      text: '💨 <b>Init</b> is what your <b>Catalyst</b> must <b>match or beat</b> — a tie goes to you. ' +
            'Win and it never touches you on the way in; lose and it <b>bites first for its ⚔️</b>, even if your blow then kills it.' },
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
    { id: 'arsenal', when: () => S.turn === 1 && isAssignPhase(),
      point: '.in-Reserve',
      text: '✋ <b>ARSENAL</b> is the one card you <b>keep</b> into next turn — everything else leaves your hand. ' +
            'It is the only slot that works the same way for every class, so it is the one anchor that never moves.' },
    // 🕯️ THE CANDLE WAS NEVER TAUGHT (found 2026-08-12) — it is on screen every single turn, it
    // decides whether banking is informed or a bet, and nothing had ever named it.
    { id: 'candle', when: () => isAssignPhase() && S.candle && !!nextEncounter(),
      point: '.candle',
      text: '🕯️ Your <b>candle</b> is lit, so you can see what comes <b>after</b> this — its HP, its speed and its shape. ' +
            'Plan two encounters, not one.' },
    { id: 'candle-out', when: () => isAssignPhase() && !S.candle,
      point: '.candle',
      text: '🕯️ It went out. Only a <b>Complete</b> keeps it lit — a Narrow or a loss snuffs it, and you travel blind until you come through one cleanly. ' +
            '<b>That is what a Narrow really costs you.</b>' },
    { id: 'couldattune', when: () => isAssignPhase() && !attunedNow() && handHasPair(),
      point: () => { const id = pairPartnerId(); return id ? '.in-' + (zoneOf(id) || 'Spell') : null; },
      text: 'Two of your cards share an element. Put the matching one under <b>CATALYST</b> and your Spell <b>attunes</b> — it strikes for the bigger ✦ number on its face.' },
    { id: 'attuned', when: () => isAssignPhase() && attunedNow(),
      point: '.attuned-pair',
      text: '✦ <b>Attuned.</b> But your Catalyst is also your <b>Initiative</b> — and your fastest card is rarely the one that matches. <b>Strike first, or strike hard?</b>' },
    // ⚠️ this used to fire on banksNow(), i.e. only once you had ALREADY banked by accident. Now
    // that banking is a choice, a lesson gated on the choice can never teach that the choice exists.
    { id: 'bank', when: () => hasEmberwake() && isAssignPhase() && !!cardById(S.assign.Boost) && !S.bankArmed,
      point: '.in-Boost',
      text: 'Your <b>SURGE</b> can fire now — or <b>bank</b> instead: nothing this turn, but next turn you aim its full power at your <b>strike</b> or your <b>speed</b>. ' +
            'Worth it when this turn is already decided. 🕯️ Your candle shows you what is coming.' },
    // 🔥 the other half of the Emberwake. The bank lesson teaches the SAVING; nothing taught the
    // SPENDING, so a player who banked met an unexplained row of buttons the following turn.
    { id: 'aim', when: () => isAssignPhase() && S.wake > 0,
      point: '.wake-row:not(.bank-row)',
      text: '🔥 You are holding an <b>Emberwake</b>. Aim it at your <b>strike</b> or your <b>speed</b> — whichever this encounter actually asks for ' +
            '(🛡️ Armour wants the bigger hit, 🌀 Evasion wants you first). <b>Spend it or lose it</b>: it does not keep.' },
    { id: 'soak', when: () => S.phase === 'soak',
      point: '#slots-panel',
      text: 'Damage is soaked by <b>blunting your own cards</b> — tap one and it drops a level. <b>Your deck is your health</b>, so every fight costs you something real.' },
    { id: 'stack', when: () => S.phase === 'stack',
      point: '#slots-panel',
      text: '🃏 <b>Reversed</b> lets you choose where each returning card goes — the <b>top</b> of your deck (you will draw it next hand) or the <b>bottom</b> (much later). Without the charm they simply slide under in slot order.' },
    // ⚠️ STALE UNTIL 2026-08-12 — this said only "coins buy levels", which described the Wheel from
    // before sharpening was merged onto it. The screen now does BOTH, and the budget split between
    // them is the actual decision, so a lesson naming one half taught the wrong thing.
    { id: 'wheel', when: () => S.phase === 'wheel',
      point: '#controls-panel',
      text: '🎰 <b>The Wheel.</b> One screen, one purse: <b>sharpen</b> your own cards, or <b>buy</b> what is on the shelf. ' +
            'A level makes a card <b>more itself</b> — its best stat rises and its worst falls, so a sharpened card is superb in one slot and poor everywhere else. ' +
            '<b>Deciding between the two IS the shop</b>, so spend knowing you cannot have both.' },
    { id: 'charm', when: () => S.phase === 'wheel' && S.wheel && (S.wheel.offers || []).some(o => o && o.kind === 'charm'),
      point: '#controls-panel',
      text: '🎁 A <b>charm</b> lasts the whole run and <b>changes a rule</b> rather than a number — so it can make a different arrangement correct. ' +
            'Everything you are carrying is shown in the bar at the top, always.' },
    { id: 'potion', when: () => (S.potions || []).length > 0,
      point: '.kit-row',
      text: '🧪 A <b>potion</b> is one use, spent on a turn <b>you</b> choose, and it lasts that turn only. You can carry ' + POTION_CAP + '. ' +
            'It buys you a single turn where the arrangement you wanted is legal — so hold it for the turn that needs it.' },
    // ⚠️ CURSES ARE A DIFFERENT LESSON FROM CHARMS. They arrive without being bought, and the whole
    // point of `carried()` is that a run-long penalty must be on screen every turn — so the lesson's
    // job is to send you to the status bar, not to explain the individual curse.
    { id: 'curse', when: () => (S.charms || []).some(id => { const c = charmById(id); return c && c.curse; }),
      point: '#status-bar',
      text: '⚠️ You picked up a <b>curse</b> — a charm that costs you instead of paying you. It sits in the same bar as your boons, ' +
            'because a penalty you cannot see is one you cannot play around.' },
    { id: 'event', when: () => S.phase === 'event',
      point: '#controls-panel',
      text: '📖 The road throws things at you between encounters. Read the options — some cost coins or a card, and one is usually just <b>walk on</b>. ' +
            'An option you cannot afford says so instead of hiding.' },
    { id: 'verb', when: () => S.hand.some(c => verbOf(c)),
      point: '#slots-panel',
      text: '✦ A card at <b>Lv4</b> gains a <b>verb</b> — but only in one slot. Move it there and the verb lights up. Blunt it below Lv4 and the verb is gone.' },
    // ✦ the rainbow hand is now taught as a PROBLEM, not as a thing the game fixes for you
    { id: 'rainbow', when: () => S.phase === 'assign' && S.hand.length >= 4 && new Set(S.hand.map(c => elOf(c))).size >= 4,
      point: '#slots-panel',
      text: 'All four elements, so <b>nothing can pair</b> — no Spell will attune this turn. Some hands simply cannot. Play the best plain line you have, and keep your best card for a hand that can.' },
    // ⚠️ WRITTEN WRONG ONCE (2026-08-12) — the first draft described the press-your-luck "stir band"
    // approach, which was CUT and replaced by this ordinary journey. It was copied out of CLAUDE.md,
    // which still documented the cut version. The lesson must describe LAST_MILE, not the history.
    { id: 'lastmile', when: () => S.finalMode && S.finalPhase === 'lastmile',
      point: '#encounter-panel',
      text: '⚔️ <b>The Last Mile</b> — one journey between you and the lair, and it <b>costs you nothing</b>: no Nightfall, no Time Penalty, no hardship, nothing kept. ' +
            'Everything is reshuffled for the duel afterwards, so this is the one turn in the game where you should <b>empty the tank</b>. ' +
            'Arrive cleanly and the ' + '<b>dragon starts wounded</b>; scrape in and it starts a little wounded.' },
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
  if (d.shapes.includes('guard')) bits.push(`its plates <b>swallow your first ${d.shapeV} hit${d.shapeV === 1 ? '' : 's'} whole</b>`);
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
function recordGrade(stage, g, won) {
  if (stage == null) return;
  try {
    const all = bestGrades(), key = String(stage), prev = all[key];
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
function wallSummary() {
  const all = bestGrades();
  const stages = DRAGONS.map(d => d.stage);
  const got = stages.filter(n => all[String(n)]).length;
  const s_ = stages.filter(n => all[String(n)] && all[String(n)].letter === 'S').length;
  return { graded: got, total: stages.length, perfect: s_ };
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
const LAST_MILE = { mp: 16, hpComplete: 14, hpNarrow: 7 };
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
  if (foeHas(e, 'guard')) bits.push(`🧱 <b>Guard ${e.shapeV}</b> — swallows your first ${e.shapeV} hit${e.shapeV === 1 ? '' : 's'} whole; needs MANY`);
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
    text: '🔥 Fire cards gain +1 armor',            mods: { armor: 1, el: 'Fire' } },
  { id: 'tideglass', tier: 1,   name: 'Tideglass Bead',   rarity: 'common', cost: 5,
    text: '💧 Water cards gain +1 armor',           mods: { armor: 1, el: 'Water' } },
  { id: 'stormpin', tier: 1,    name: 'Storm Pin',        rarity: 'common', cost: 6,
    text: '⚡ Lightning cards strike +1',            mods: { atk: 1, el: 'Lightning' } },
  { id: 'nightveil', tier: 1,   name: 'Nightveil',        rarity: 'common', cost: 6,
    text: '🪨 Stone cards strike +1',               mods: { atk: 1, el: 'Stone' } },
  { id: 'swiftwick', tier: 2,   name: 'Swiftwick',        rarity: 'uncommon', cost: 8,
    text: '💨 +1 Initiative every turn',             mods: { init: 1 } },
  { id: 'lanternpace', tier: 2, name: "Lantern-Bearer",   rarity: 'uncommon', cost: 8,
    text: '🌙 +2 Pace against Nightfall',            mods: { pace: 2 } },
  { id: 'tinderbox', tier: 2,   name: 'Deep Tinderbox',   rarity: 'uncommon', cost: 9,
    text: '➕ Your Surge gives +1 more',            mods: { boost: 1 } },
  { id: 'wardstone', tier: 2,   name: 'Wardstone',        rarity: 'uncommon', cost: 9,
    text: '🛡️ Every card soaks +1',                  mods: { soak: 1 } },
  { id: 'coinpurse', tier: 1,   name: "Pilgrim's Purse",  rarity: 'common', cost: 6,
    text: '🪙 +2 coins from every encounter',        mods: { coin: 2 } },
  // ❌ FOUR ARCHETYPE-GATED CHARMS WERE CUT HERE (2026-08-05, Thomas) — see the note above
  // charmMod(). They named FORCE / SPARK / FLOW / WARD, which is printed on nothing.
  { id: 'brightwick', tier: 3,  name: 'Brightwick',       rarity: 'rare', cost: 14,
    text: '⚔️ All cards strike +1',                  mods: { atk: 1 } },
  { id: 'oathstone', tier: 3,   name: 'Oathstone',        rarity: 'rare', cost: 14,
    text: '🛡️ All cards gain +1 armor',              mods: { armor: 1 } },

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
    text: '🛡️ Every card soaks −1',                  mods: { soak: -1 } },
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
  // ---- MAGE: the one rule this class owns is PAIRING ----
  { id: 'threekind', tier: 4, name: 'Three of a Kind', rarity: 'rare', cost: 14, rule: true, mage: true,
    text: '✦ Spell, Catalyst <i>and</i> Surge sharing an element — your strike <b>doubles</b>',
    why: 'pair attunes, three resonates' },
  { id: 'looseweave', tier: 1, name: 'Loose Weave',  rarity: 'uncommon', cost: 10, rule: true, mage: true,
    text: '✦ <b>Any</b> Catalyst attunes your Spell, but an unmatched one gives only <b>half</b> the bonus',
    why: 'ceiling traded for consistency' },
  { id: 'secondflame', tier: 3, name: 'Second Flame', rarity: 'rare', cost: 13, rule: true, mage: true,
    text: '✦ Your <b>Surge</b> can attune the Spell too — freeing the Catalyst to be pure speed',
    why: 'the Catalyst stops serving two masters' },
  { id: 'coldiron', tier: 3, name: 'Cold Iron',      rarity: 'uncommon', cost: 10, rule: true, mage: true,
    text: '✦ Your <b>unattuned</b> strikes are <b>+3</b>',
    why: 'the anti-pairing build — and it makes a hand with no pair a plan instead of a punishment' },
  { id: 'kindledarsenal', tier: 4, name: 'Kindled Arsenal', rarity: 'rare', cost: 12, rule: true, mage: true,
    text: '✦ Your <b>Arsenal</b> can attune the Spell as well',
    why: 'the one slot with no job in the maths gets one' },
  { id: 'heldember', tier: 1, name: 'Held Ember',    rarity: 'uncommon', cost: 9, rule: true, mage: true,
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
const SAVE_VERSION = 5;

function saveGame() {
  if (!S || S.phase === 'reveal') return; // mid-reveal saves would lose the pending resolution
  try {
    const card = c => { // by index — names duplicate across elements. mods (am/at/ee) only when set.
      // ⚠️ INDEXED INTO THE CLASS'S OWN TABLE. Cards are stored by index because names duplicate;
      // now that a second class exists, an index is only meaningful alongside `cls` (written below
      // and restored BEFORE any card is decoded).
      const o = { id: c.id, n: CLASS.defs.indexOf(c.def), lv: c.level };
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
      lastMileOutcome: S.lastMileOutcome, duelBeat: S.duelBeat, defeatMsg: S.defeatMsg,
      pendingEvent: S.pendingEvent, event: S.event,
      eventsSeen: S.eventsSeen, eventFlags: S.eventFlags,
      wake: S.wake, wakeTarget: S.wakeTarget, wakePending: S.wakePending, setout: S.setout,
      duelStamina0: S.duelStamina0, stats: S.stats, tutorial: S.tutorial, candle: S.candle, potions: S.potions, contract: S.contract,
      cls: CLASS.id, lastStrike: S.lastStrike, chain: S.chain, doubledStrike: S.doubledStrike,
      chainPersist: S.chainPersist, lastAbility: S.lastAbility, freeCycle: S.freeCycle, cycled: S.cycled,
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
    const region = RUN()[d.region - 1];
    if (!region) return false;
    const encounter = d.encounter ? region.encounters.find(e => e.name === d.encounter) : null;
    const stable = ['summary', 'defeat', 'victory', 'event', 'wheel'];
    if (!encounter && !d.finalMode && !stable.includes(d.phase)) return false;
    uid = d.uid;
    S = {
      tutorial: !!d.tutorial, taught: d.taught || [], lessonsOff: !!d.lessonsOff,
      candle: d.candle !== false,
      // 🗡️ the chain. Absent on any save written before the rogue existed, which is correct —
      // those are mage runs and never read them.
      lastStrike: d.lastStrike || null, chain: d.chain || 1, doubledStrike: d.doubledStrike || null,
      chainPersist: !!d.chainPersist, lastAbility: d.lastAbility || null,
      freeCycle: !!d.freeCycle, cycled: !!d.cycled, cyclePick: false,
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
      lastMileOutcome: d.lastMileOutcome || null, duelBeat: d.duelBeat || 0, duelResult: null,
      defeatMsg: d.defeatMsg,
      pendingEvent: d.pendingEvent || false, event: d.event || null,
      eventsSeen: d.eventsSeen || [], eventFlags: d.eventFlags || {},
      wake: d.wake || 0, wakeTarget: d.wakeTarget || null, wakePending: d.wakePending || 0,
      duelStamina0: d.duelStamina0 || 0, setout: d.setout || null,
      contract: d.contract || null,
      potions: d.potions || [], potionPick: null, potionFx: { init: 0, value: 0, soak: 0, boost: 0, pace: 0, swap: {} },
      upgradePick: null,
      stats: d.stats || { attuneAvail: 0, attuned: 0, duelDmg: 0, duelBeats: 0 },
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
function showDev() {
  if (!DEV_ENABLED) return;   // 🔧 not in the playtest build
  S = S || {};
  S.dev = S.dev || { stage: 1, deck: 'mediocre', candle: true, charm: '' };
  S.phase = 'dev';
  S.encounter = null;
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
function devJump() {
  const d = S.dev, cfg = DEV_DECKS[d.deck] || DEV_DECKS.mediocre;
  const stage = Math.max(1, Math.min(DRAGONS.length, d.stage));
  freshGame(stage);
  S.dev = d;
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
function gradeBadge(stage) {
  const g = bestGrades()[String(stage)];
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
function showCollection() { S = S || {}; S.phase = 'collection'; S.encounter = null; render(); }

// 🗺️ THE STAGES SCREEN. Not a difficulty menu bolted on the side — the stage IS the difficulty,
// so picking one is the same act as choosing which problem you want to solve tonight.
function showStages() {
  S = S || {};
  S.phase = 'ladder';
  S.encounter = null;
  render();
}
function startStage(n) {
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
function introNext(d) {
  S.introPage = Math.max(0, (S.introPage || 0) + d);
  if (S.introPage >= TUTORIAL.intro.length) { S.introPage = 0; S.phase = 'assign'; }
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
function mageCharmPool() { return CHARMS.filter(c => c.mage && !c.curse && charmUnlocked(c)); }
function rollSetout() {
  const pool = mageCharmPool().slice();
  const offers = [];
  while (offers.length < 3 && pool.length) offers.push(...pool.splice(Math.floor(rnd() * pool.length), 1));
  return offers.map(c => c.id);
}
function pickSetout(id) {
  if (!S.setout || !S.setout.includes(id)) return;
  const c = charmById(id); if (!c) return;
  S.charms.push(id);
  S.setout = null;
  S.phase = 'assign';
  logHeader(`— Turn ${S.turn} (Region ${S.region}) —`);
  log(`🏕️ You set out carrying <b>${c.name}</b> — ${c.text}`, 'good');
  logChallenge();
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
    // 🗡️ THE CHAIN (rogue). `lastStrike` is the NAME of the card struck with last turn — the thing
    // a combo checks against — and `chain` is how many links deep you are. Both are engine state
    // rather than class state for the same reason `lastAttuned` and `lastOutcome` are: cleanup owns
    // the moment they change, and cleanup is the engine's.
    // ⚠️ `doubledStrike` is ✦ Shadow Double only: a SECOND name that also counts as "what you
    // played". Same trap as ✦ Second Flame — the moment two things can satisfy one rule, every
    // line that explains the rule has to ask, not assume.
    lastStrike: null, chain: 1, doubledStrike: null, chainPersist: false,
    lastAbility: null,                  // the combo that actually RESOLVED, read by endTurn
    cycled: false, cyclePick: false, freeCycle: false,   // 🗡️ slot ③, once per turn
    // 🔥 whether you have ARMED the Surge to bank this turn (2026-08-12 — was an element
    // coincidence, is now a choice). Per-turn; cleared in nextTurn and both finale beat-starts.
    bankArmed: false,
    // 📊 what the GRADE reads. Tracked as you play so a run can report on itself.
    // 🕯️ THE CANDLE. Lit, you can see the next encounter. See lightCandle/snuffCandle.
    candle: true,
    stats: { attuneAvail: 0, attuned: 0, duelDmg: 0, duelBeats: 0 },
    emberguardUsed: false,   // ✦ Emberguard is once per encounter
    duelStamina0: 0,    // cards you arrived at the lair with — the duel's other health bar
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
  if (confirm(`Start ${what} again from the beginning? This run will be lost.`)) startStage(st);
}

function nextRegion() {
  if (S.region >= RUN().length) { freshGame(); return; }
  // 📜 a contract CROSSES the region break now — its own encounter window is the bound
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
    attuned: adj(v) + card.level + ATTUNE_BONUS,
    // `ev` (the old Attuned value, column 2) is DEAD DATA - power comes from pile depth now
    // 💨 THE INITIATIVE FLOOR (2026-07-29). Sharpening drove every non-SPARK card's init to 0-1,
    // so only 4 of the 16 cards could ever contest a race and the deck's MEDIAN init FELL as you
    // levelled (3 → 2 → 1 → 1). Measured: 32% of hands held nothing that could clear the enemy —
    // initiative was weather, not a decision. A card at init 0 isn't sharpened, it's DISQUALIFIED
    // from the Catalyst slot, which breaks the 16-card brief's own test (every card wanted in ≥2
    // slots). The floor keeps SPARK enormously faster (13 vs 3 at Lv4) — it stops the rest being
    // unable to play at all. Paired with a -2 on creature Initiative so the two ranges overlap.
    init: Math.max(INIT_FLOOR, init + charmMod('init', d.element)),
    boost: boost + charmMod('boost', d.element), armor: Math.max(0, armor + am), cost,
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
// names an ELEMENT is a mage potion (`mage: true`) - a rogue's vial would say something else.
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
    S.coins += c.reward;
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
    text: '💨 <b>+2 Initiative</b> this turn' },
  { id: 'broth',    name: 'Thin Broth',   cost: 2, rarity: 'common',
    text: '⚔️ <b>+2</b> to your action this turn' },
  { id: 'grit',     name: 'Grit',         cost: 2, rarity: 'common',
    text: '🛡️ every card <b>soaks +1</b> this turn' },
  { id: 'bitterroot', name: 'Bitterroot', cost: 3, rarity: 'common',
    text: '➕ your <b>Surge gives +3</b> more this turn' },
  { id: 'roaddust', name: 'Road Dust',    cost: 3, rarity: 'common',
    text: '🌙 <b>+3 Pace</b> against the dark this turn' },
  { id: 'tallow',   name: 'Tallow Stub',  cost: 3, rarity: 'common',
    text: '🕯️ your candle <b>cannot be snuffed</b> this turn' },
  // ---- generic: every class inherits these unchanged ----
  { id: 'haste',   name: 'Draught of Haste', cost: 6, rarity: 'common',
    text: '💨 <b>+5 Initiative</b> this turn' },
  { id: 'ember',   name: 'Emberdraught',     cost: 7, rarity: 'common',
    text: '⚔️ <b>+6</b> to your action this turn' },
  { id: 'ironskin',name: 'Ironskin Tonic',   cost: 6, rarity: 'common',
    text: '🛡️ every card <b>soaks +3</b> this turn' },
  { id: 'clarity', name: 'Draught of Clarity', cost: 5, rarity: 'uncommon',
    text: '🕯️ <b>relight your candle</b> — see the road ahead again' },
  { id: 'salve',   name: 'Mending Salve',    cost: 9, rarity: 'uncommon', pick: true,
    text: '✨ <b>restore a card a level</b> — undo what the road took',
    can: c => c.level < MAX_LEVEL, why: 'already at its brightest' },
  { id: 'nightglass', name: 'Nightglass', cost: 6, rarity: 'common',
    text: '🌙 the dark <b>cannot catch you</b> this journey' },
  { id: 'breath',  name: 'Second Breath',  cost: 10, rarity: 'rare',
    text: '✦ your <b>Spell is not spent</b> this turn' },
  { id: 'quench',  name: 'Quenching Draught', cost: 11, rarity: 'rare',
    text: "🛡️ the enemy's <b>defence does nothing</b> this turn" },
  { id: 'gravewax', name: 'Grave Wax',     cost: 8, rarity: 'uncommon',
    when: () => (S.trashed || []).length > 0,
    text: '✨ the last card you <b>lost returns</b>, at Lv1' },
  // ---- mage: it names an ELEMENT, which is the mage's suit ----
  { id: 'prism',   name: 'Prism Vial',       cost: 7, rarity: 'uncommon', mage: true, pick: true,
    text: "✦ one card's <b>element becomes your Spell's</b>, this turn",
    can: c => S.assign.Spell && c.id !== S.assign.Spell && elOf(c) !== elOf(spellCard()),
    why: 'nothing to change here' },
  // ---- 🗺️ ONE POTION PER LAND (2026-08-10). Each is the single-turn answer to the thing its
  // road keeps asking, which is what makes a stage's shelf feel like it belongs to that stage.
  // ⚠️ Same gate as always: a potion may only name something PRINTED ON THE CARD or on the foe.
  // ⚠️ And they are CONSUMED, which is why they do not break *lateral power, not vertical* —
  // a potion buys ONE turn where the arrangement you wanted is legal.
  { id: 'skyglass',  name: 'Skyglass',   tier: 2, cost: 5, rarity: 'uncommon',
    text: '🌀 Your blow <b>cannot be halved</b> this turn' },
  { id: 'stillwater', name: 'Stillwater', tier: 3, cost: 6, rarity: 'uncommon',
    text: '🛡️ Nothing <b>strikes back</b> at you this turn' },
  { id: 'hardtack',  name: 'Hardtack',   tier: 3, cost: 2, rarity: 'common',
    text: '⏳ Any <b>Time Penalty is 1 less</b> this turn' },
  { id: 'deepcurrent', name: 'Deepcurrent', tier: 4, cost: 9, rarity: 'rare',
    text: '💨 You <b>win Initiative</b> this turn, whatever it is' },
  { id: 'solvent', name: 'Solvent',           cost: 8, rarity: 'uncommon', mage: true,
    text: '✦ your <b>Catalyst stays in hand</b> this turn instead of going under the deck' },
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
function stageTier() { return (S && S.dragon && S.dragon.stage) ? Math.max(1, S.dragon.stage) : 1; }
function charmUnlocked(c) { return !c.tier || c.tier <= stageTier(); }

const potionById = id => POTIONS.find(p => p.id === id) || null;
// 🗺️ tiered like the charms: a land's own potion is not on the shelf before that stage
const potionPool = () => POTIONS.filter(p => (!p.mage || CLASS.id === 'mage') && (!p.when || p.when()) &&
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
  if (p.id === 'grit')     { fx.soak += 1;  log(`🧪 ${p.name} — 🛡️ every card soaks +1 this turn.`, 'good'); }
  if (p.id === 'bitterroot'){ fx.boost += 3; log(`🧪 ${p.name} — ➕ your Surge gives +3 more this turn.`, 'good'); }
  if (p.id === 'roaddust') { fx.pace += 3;  log(`🧪 ${p.name} — 🌙 +3 Pace against the dark.`, 'good'); }
  if (p.id === 'tallow')   { fx.keepCandle = true; log(`🧪 ${p.name} — 🕯️ your candle will hold, whatever happens.`, 'good'); }
  if (p.id === 'haste')    { fx.init += 5;  log(`🧪 ${p.name} — 💨 +5 Initiative this turn.`, 'good'); }
  if (p.id === 'ember')    { fx.value += 6; log(`🧪 ${p.name} — ⚔️ +6 to your action this turn.`, 'good'); }
  if (p.id === 'ironskin') { fx.soak += 3;  log(`🧪 ${p.name} — 🛡️ every card soaks +3 this turn.`, 'good'); }
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
  S.emberguardUsed = false;
  S.potionFx = { init: 0, value: 0, soak: 0, boost: 0, pace: 0, tpCut: 0, swap: {} }; S.potionPick = null;
  S.bankArmed = false;   // 🔥 banking is armed per TURN — anything outliving its turn would be a charm
  S.cycled = false; S.cyclePick = false;   // 🗡️ the cycle is once per turn (freeCycle is NOT reset — it is earned for next turn)
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
  if (S.cyclePick) { cycleCard(id); return; }   // 🗡️ armed to cycle — the tap picks the card to lose
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
  const attBonus = a.attBonus || 0;
  const banks = !!a.banks, bank = a.bank || 0, wake = a.wake || 0, wakeTarget = a.wakeTarget || null;
  // ⚠️ THE CLASS'S OWN PAYLOAD RIDES ALONG UNREAD. computeAction rebuilds its result field by
  // field, so anything a class returns that the engine does not name is silently dropped — which
  // is exactly what happened to `rogue` the first time. The engine never inspects it; cleanup
  // hands it straight back to the class. One line, so a third class needs no change here.
  const classPayload = a.rogue ? { rogue: a.rogue } : null;
  // 🗡️ THE ROGUE'S LIVE COMBO ABILITY, read once here and OR'd into the checks that already exist.
  // 🔑 Deliberately NOT a second system: outpace/pierce/unhalved answer the same three questions
  // the mage's ✦ Outpace / Overwhelm / Landslide answer, so they hang off the same three lines
  // rather than a parallel set. A class adds an ANSWER, never a new question.
  const rAb = a.rogue ? a.rogue.ability : null;
  const boostVal = a.boost;

  const h = S.hardship;
  const ability = e.ability || null;
  const elemInit = a.init + (S.potionFx ? S.potionFx.init : 0);   // 🧪 Draught of Haste
  // Night Travel: Boost reduced by the Catalyst's Initiative, min 0
  const boostRaw = boostVal + (S.potionFx && boostVal > 0 ? S.potionFx.boost : 0);   // 🧪 Bitterroot
  const boostEff = h === 'Rationed' ? 0                                   // ⏳ nothing is spare
    : h === 'Night Travel' ? Math.max(0, boostRaw - elemInit) : boostRaw;
  const nightCut = boostRaw - boostEff;

  if (e.type === 'fight') {
    // ✦ Lv4 CATALYST verbs shape the race itself
    const vS = a.vSpell, vE = a.vElem;
    const init = elemInit;   // Initiative belongs to the Catalyst alone (charms apply in eff)
    // Slipstream only counts against 🌀 Evasion — it buys you the shape's answer, not the race
    const evInit = init + (vE === 'Slipstream' ? 4 : 0);
    // 🗡️ Viper Strike arrives before they are ready — same answer as ✦ Outpace, different class
    const initLost = (vE === 'Outpace' || rAb === 'outpace' || (S.potionFx && S.potionFx.winInit)) ? false : e.init > init;
    // Ranged deals Early Damage even when you win Initiative — no opt-out (dodge cut 2026-07-29)
    const rangedHits = ability === 'Ranged' && !initLost;   // it shoots you whether or not you're fast
    let early = initLost || rangedHits ? e.atk : 0;
    // 🌬️ Windshear — the MARGIN matters, not just the verdict. Capped so a very slow hand is
    // punished hard but never arbitrarily; the cap is what keeps it a problem instead of a wall.
    if (ability === 'Windshear' && initLost) early += Math.min(3, Math.max(0, e.init - init));
    if (h === 'Ambush') early *= 2;
    if (vE === 'Bedrock') early = 0;                       // ✦ Bedrock: the early shot never lands
    const wrongType = false;
    const base = pileVal + (S.potionFx ? S.potionFx.value : 0);   // 🧪 Emberdraught
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
    // 🗡️ Venom Needle slips between the plates, exactly as ✦ Overwhelm does
    const armorCut = (!quenched && foeHas(e, 'armour') && vS !== 'Overwhelm' && rAb !== 'pierce') ? (e.shapeV || 0) : 0;
    // 🧪 Skyglass — the blow simply cannot be halved · 🗡️ Second Fang catches what the first missed
    const evaded = !quenched && !(S.potionFx && S.potionFx.noEvade) && rAb !== 'unhalved' &&
                   foeHas(e, 'evasion') && vS !== 'Landslide' && (e.init > evInit);
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
    // facing Guard is stuck — and being stuck is the stated reason to go and unlock the rogue.
    // Which is also why Guard must NOT be added to the existing four roads: content is class-blind,
    // and a shape only one class can answer belongs on the stage built for that class.
    const guardPool = (!quenched && foeHas(e, 'guard')) ? (e.shapeV || 0) : 0;
    const landed = Math.max(0, hits - guardPool);
    const perHit = hits > 1 ? Math.floor(withBoost / hits) : withBoost;
    let value = guardPool
      ? landed * Math.max(0, perHit - armorCut)
      : (hits > 1 ? hits * Math.max(0, perHit - armorCut) : Math.max(0, withBoost - armorCut));
    if (evaded) value = Math.floor(value / 2);
    if (vS === 'Thunderhead' && !initLost) value += 4;      // ✦ strike first, strike harder
    // 💨 SLOW STRENGTH - the mirror. Initiative is currently a race you want to win every time;
    // this makes LOSING it a legitimate plan, which is a whole second answer to 🛡️ Armour and
    // rescues hands whose only fast card is the one they need in the Spell.
    if (initLost && hasCharm('slowfoot')) value += 4;
    // 'Slow' CUT with the Attack/Move split - it only meant "compare your other value", and
    // there is no other value now. Abilities get revisited wholesale at shaped defence.
    const half = Math.ceil(e.hp / 2);
    let outcome = value >= e.hp ? 'Complete' : value >= half ? 'Narrow' : 'Loss';
    if (h === 'Exacting' && outcome === 'Narrow') outcome = 'Loss';   // ⚖️ no half credit
    // 💢 Backlash — the excess comes back. Note it fires on a CLEAN KILL, which is the point:
    // the only encounter in the game where a bigger blow is worse than a sufficient one.
    const backlash = ability === 'Backlash' ? Math.min(3, Math.max(0, value - e.hp)) : 0;
    // ✦ Undertow: a strike that falls short still costs you nothing in return
    const combatDmg = (outcome !== 'Complete' && vS !== 'Undertow') ? e.atk
      : (S.potionFx && S.potionFx.noCounter) ? 0 : backlash;
    const timePenalty = h === 'Hazards' ? (early > 0 ? 1 : 0) + (combatDmg > 0 ? 1 : 0) : 0;
    const stormDmg = h === 'Storm' ? timePenalty : 0;
    let loseReserve = null;
    // the dodge only costs the Arsenal when it actually cancels the ranged hit (you won initiative)
    if (ability === 'Freeze' && early > 0) loseReserve = 'Frozen (took Early Damage)';
    if (h === 'Riptide') loseReserve = '🌊 dragged under by the Riptide';
    const poison = ability === 'Poison' ? (early > 0 ? 1 : 0) + (combatDmg > 0 ? 1 : 0) : 0;
    return { ...classPayload, type: 'fight', spell, hits, attBonus, attuner, loose, banks, bank, wake, wakeTarget, vSpell: vS, vElem: vE, shape: e.shape || null, shapes: shapesOf(e), armorCut, evaded, elem, boostC, boostVal, boostEff, nightCut, resonant, spellEl, enhEl, isEnh, enhUsed, wrongType,
             base, withBoost, armorCut, value, init, initLost, rangedHits, early, half, outcome,
             combatDmg, timePenalty, stormDmg, loseReserve, poison, ability, backlash, target: e.hp, hardship: h };
  }
  const wrongType = false;
  const base = pileVal + (S.potionFx ? S.potionFx.value : 0);   // 🧪 Emberdraught
  const withBoost = base + boostEff;
  // JOURNEY ELEMENT BONUS CUT 2026-07-26 - the most obscure rule in the game (the tell: months
  // of playtesting and Thomas never mentioned it once). Journeys already carry MP, Nightfall,
  // Pace and perils. Kept as a zeroed field so the log/solver result shapes do not change.
  const reserveBonus = 0;
  const value = withBoost + reserveBonus;
  // Pace vs Nightfall: your Catalyst's Initiative (+ Boost if targeted) races the dark
  const paceBless = (S.paceBless || 0) > 0 ? 2 : 0; // Gray Pilgrim / Mirror Fen blessing
  const pace = elemInit + paceBless + charmMod('pace') + (S.potionFx ? S.potionFx.pace : 0);   // 🧪 Road Dust
  const nightfall = e.nightfall || 0;
  const nightCaught = nightfall > pace && !(S.potionFx && S.potionFx.noNight);   // 🧪 Nightglass
  // Steep peril: the journey's MP grows by your Arsenal's Boost
  const peril = e.peril || null;
  const steepAdd = peril === 'Steep' && reserve ? eff(reserve).boost : 0;
  // 🏔️ Updraft — speed shortens the road (never below 1 MP: a journey you cannot fail is not one)
  const updraftCut = peril === 'Updraft' ? elemInit : 0;
  const mpEff = Math.max(1, e.mp + steepAdd - updraftCut);
  const half = Math.ceil(mpEff / 2);
  let outcome = value >= mpEff ? 'Complete' : value >= half ? 'Narrow' : 'Loss';
  if (h === 'Exacting' && outcome === 'Narrow') outcome = 'Loss';   // ⚖️ no half credit
  // ⏳ Toll — the road that does not forgive. 🧪 Hardtack takes a point back off any penalty.
  let timePenalty = outcome !== 'Complete' ? e.timePenalty * (peril === 'Toll' ? 2 : 1) : 0;
  if (timePenalty && S.potionFx && S.potionFx.tpCut) timePenalty = Math.max(0, timePenalty - S.potionFx.tpCut);
  const stormDmg = h === 'Storm' ? timePenalty : 0;
  const treacherousDmg = peril === 'Treacherous' && outcome !== 'Complete' ? 1 : 0;
  // Ember Hollow wards the Arsenal: you may still be caught, but the night can't snuff your Arsenal
  const emberShielded = nightCaught && reserve && S.emberShield;
  // 🌙 caught after dark: the Arsenal is only half of it
  const loseReserve = h === 'Riptide' ? '🌊 dragged under by the Riptide'
    : nightCaught && reserve && !S.emberShield ? 'caught by Nightfall' : null;
  return { ...classPayload, type: 'journey', spell, hits, attBonus, attuner, loose, banks, bank, wake, wakeTarget, elem, boostC, boostVal, boostEff, nightCut, resonant, spellEl, enhEl, isEnh, enhUsed, wrongType,
           base, withBoost, reserveBonus, value, mpEff, half, outcome, reserve, early: 0, combatDmg: 0,
           pace, nightfall, nightCaught, paceBless, emberShielded, peril, steepAdd, updraftCut, treacherousDmg, target: mpEff,
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
    if (r.enhUsed) b1.push(L(attunedLineText(r, spell, 'Atk'), 'good'));
    else b1.push(L(`Attack: ${r.base} — unattuned${elem ? ` (${elem.def.name} is ${elOf(elem)}, not ${r.spellEl})` : ' (no Catalyst)'}`));
    // the Surge ALWAYS feeds the action (the Attack/Initiative picker is gone), so this line must
 // never be gated on the retired boostTarget - it was silently adding damage the log didn't show.
    if (r.banks) b1.push(L(`🔥 BANKED — ${boostC.def.name} is ${elOf(boostC)} like your Catalyst, ${bankCostPhrase(boostC)}: +${r.bank} Emberwake for next turn`, 'good'));
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
    if (r.enhUsed) b1.push(L(attunedLineText(r, spell, 'Move'), 'good'));
    else b1.push(L(`Move: ${r.base} — unattuned${elem ? ` (${elem.def.name} is ${elOf(elem)}, not ${r.spellEl})` : ' (no Catalyst)'}`));
    if (r.banks) b1.push(L(`🔥 BANKED — ${boostC.def.name} is ${elOf(boostC)} like your Catalyst, ${bankCostPhrase(boostC)}: +${r.bank} Emberwake for next turn`, 'good'));
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
  contractTick(r);   // 📜 a contract reads the turn the engine already resolved
  // 🎯 cleanup happens several steps after the reveal, so anything a rule-charm needs to know
  // about the turn just played has to be stashed here rather than recomputed from S.assign.
  S.lastOutcome = r.outcome;
  if (S.finalMode && S.finalPhase === 'lastmile') S.lastMileOutcome = r.outcome;
  S.lastAttuned = !!r.enhUsed;
  // 🗡️ ADVANCE THE CHAIN. Sits beside lastAttuned/lastOutcome because it is the same kind of thing:
  // a breadcrumb the NEXT turn's class rule reads. The engine records it; only the rogue asks.
  if (r.rogue) {
    S.chain = r.rogue.chain;
    S.lastStrike = r.spell ? r.spell.def.name : null;
    S.lastAbility = r.rogue.ability;      // read by endTurn (🗡️ Ghostblade) — finishResolve runs first
    // ✦ Sleight of Hand — next turn's cycle is free, i.e. it does not break the chain
    S.freeCycle = r.rogue.ability === 'cycle';
    // ✦ Slow Poison — the chain does not break next turn WHATEVER you play. A flag, not a fiddle
    // with lastStrike: the name you struck with is a fact, and faking it would make every line
    // that reads it lie. Re-set every rogue turn, so it can never outlive the turn that bought it.
    S.chainPersist = r.rogue.ability === 'persist';
    // ✦ Shadow Double — next turn your ARSENAL also counts as "what you played".
    const held = cardById(S.assign.Reserve);
    S.doubledStrike = (r.rogue.ability === 'doubled' && held) ? held.def.name : null;
  }
  // a Gray Pilgrim / Mirror Fen blessing covers a limited number of journeys — spend a charge
  if (r.type === 'journey' && (S.paceBless || 0) > 0) S.paceBless--;
  // in the finale's Approach, each journey-beat's outcome is banked (both Complete → crack a shield)

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
    const g = e.xp + charmMod('coin') + (r.outcome === 'Complete' ? COMPLETE_BONUS : 0);
    const got = Math.max(g, -S.coins);          // it can empty your purse, never overdraw it
    S.coins = Math.max(0, S.coins + g);
    if (got >= 0) log(`+${got} coins${r.outcome === 'Complete' ? ` (${e.xp} + ${COMPLETE_BONUS} for the clean win)` : ''} (you now hold ${S.coins})`, 'good');
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
  // ❌ the 🛡️ armour aim was CUT 2026-08-12 (chosen 2.3% of the time, and the one target the
  // candle cannot inform) — its absorption branch goes with it, in the same commit as the rule.
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
  return armor + frost + charmMod('soak', card.def.element) + (S.potionFx ? S.potionFx.soak : 0);   // 🧪 Ironskin
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
// 🔑 THE WHEEL SELLS WHAT ONLY A SHOP CAN SELL. Card levels moved out on 2026-08-05 - you now
// choose those freely in the 🔼 upgrade phase - so what is left here is 🎁 CHARMS (permanent rule
// changes) and 🧪 POTIONS (one-time, carried, spent when you decide). That is a cleaner division
// than "three random things": the shop sells POWER, and sharpening your own deck is not shopping.
function rollOffer(rich) {
  const held = S.charms || [];
  const charmPool = CHARMS.filter(c => !held.includes(c.id) && !c.curse && charmUnlocked(c) && (rich ? true : c.rarity !== 'rare'));
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
  startWheel(false);
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
const canSharpenNow = () => S.phase === 'upgrade' || S.phase === 'wheel';

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
  log(`🔼 ${card.def.name} sharpens to Lv${card.level} (−${cost} coins, ${S.coins} left).` +
      (card.level >= MAX_LEVEL && VERBS[card.def.name] ? ` ✦ It gains <b>${VERBS[card.def.name].name}</b>.` : ''), 'good result');
  S.upgradePick = null;
  render();
}
function doneUpgrades() { endTurn(); }

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

function wheelDone() {
  const camp = S.wheel && S.wheel.rich;
  S.wheel = null;
  S.upgradePick = null;
  if (camp) { S.phase = 'summary'; render(); return; }   // camp sits on the region break
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

function endTurn() {
  // 🔥 the token you banked this turn arrives now; the one you were holding expires, spent or not
  // ✦ Deepwell — a wake banked from a Lv4 Wellspring survives one more turn
  if (S.wake > 0 && !S.wakeTarget && S.wakeDeep) { S.wakeDeep = false; log(`✦ Deepwell — your Emberwake holds another turn.`, 'good'); S.wakePending = Math.max(S.wakePending || 0, S.wake); }
  else if (S.wake > 0 && !S.wakeTarget) log(`Your Emberwake gutters out unspent.`, 'bad');
  S.wakeDeep = verbLive('Wellspring', 'Boost') && banksNow();
  S.wake = S.wakePending || 0;
  S.wakePending = 0;
  S.wakeTarget = null;
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
  // 🗡️ GHOSTBLADE — the same bend, bought by the chain instead of by a charm. ⚠️ It reads the
  // ability off the RESOLVED turn (`S.lastAbility`), not off the arrangement: by the time cleanup
  // runs the player may have been shown three beats, and recomputing would ask a question whose
  // answer has already been printed.
  if (S.lastAbility === 'unspent' && spentIds.length) {
    const saved = S.hand.filter(c => spentIds.includes(c.id));
    if (saved.length) log(`🗡️ Ghostblade — ${saved.map(c => displayName(c)).join(', ')} never left your hand.`, 'good');
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
        apply: () => { const good = CHARMS.filter(c => !c.curse && charmUnlocked(c) && !S.charms.includes(c.id));
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
        apply: () => { const good = CHARMS.filter(c => !c.curse && charmUnlocked(c) && !S.charms.includes(c.id));
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
function eventChoose(i) {
  const opt = currentEventDef().options[i];
  // never ask for a card you cannot possibly give - the player would be stuck on a picker with
  // nothing to pick and only a "back" button to explain it
  if (opt.need === 'card' && !eventPickable(opt).length) {
    log(S.hand.length
      ? `Nothing in your hand can take that — that road is closed to you.`
      : `You have no cards in hand to offer — that road is closed to you.`, 'bad');
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
const SHELL_PHASES = ['menu', 'collection', 'ladder', 'dev'];
const isShell = () => SHELL_PHASES.includes(S && S.phase);

function render() {
  if (isShell()) {
    document.body.className = 'phase-' + S.phase + ' shell';
    $('turn-indicator').textContent = `build ${BUILD}`;
    $('status-bar').innerHTML = '';
    $('encounter-panel').innerHTML = ''; $('encounter-panel').className = '';
    $('slots-panel').innerHTML = '';
    const sc = $('scene'); if (sc) sc.innerHTML = '';
    renderControls();
    // ⚠️ the log belongs to a RUN. On the shell there may be no run at all, so show the last
    // one's entries if they exist and nothing if they don't — never assume the array is there.
    if (S.logEntries) renderLog(); else $('log').innerHTML = '';
    return;
  }
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
function carried() {
  const out = [];
  for (const id of S.charms) { const c = charmById(id); if (c) out.push({ curse: !!c.curse, name: c.name, text: c.text }); }
  if (hasEmberwake() && S.wake > 0) out.push({ curse: false, name: 'Emberwake',
    text: S.wakeTarget ? `🔥 +${S.wake} → ${WAKE_TARGETS[S.wakeTarget]}` : `🔥 +${S.wake} — unaimed` });
  if (S.paceBless > 0) out.push({ curse: false, name: 'Glimpse', text: '🌙 +2 Pace, next journey' });
  if (S.emberShield) out.push({ curse: false, name: 'Ember Hollow', text: '🔥 Arsenal survives Nightfall' });
  if (S.curseNextFight) out.push({ curse: true, name: 'Followed', text: '⚠️ next fight carries a Hardship' });
  // 📜 a contract is a run-layer promise with a deadline — exactly the thing the 2026-07-29
  // rule says must be on screen every turn, with its PROGRESS, not just its name
  const ct = activeContract();
  if (ct) out.push({ curse: false, name: ct.name,
    text: `📜 ${S.contract.n}/${ct.need} · ${S.contract.left != null ? S.contract.left + ' left · ' : ''}pays 🪙 ${ct.reward}` });
  return out;
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
  return `<span class="standing" title="Your deck's total card levels, against the total this dragon usually asks for by the lair. A target, not a prediction — measured over 2,000 runs. Levelling raises it; soaking lowers it.">` +
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
      `<div class="enc-stats"><span>👣 MP <b>${LAST_MILE.mp}</b> (half ${Math.ceil(LAST_MILE.mp / 2)})</span></div>` +
      `<div class="enc-mod lastmile-deal">` +
        `<b>Complete it</b> and you fall on the ${S.dragon.name} before it stands — it begins the duel <b>−${LAST_MILE.hpComplete} HP</b>.<br>` +
        `<b>Fall short</b> (half MP) and you land one blow as it turns — <b>−${LAST_MILE.hpNarrow} HP</b>.<br>` +
        `<b>Fail</b> and it meets you whole.` +
      `</div>` +
      `<div class="enc-hint">🔄 <b>Nothing here costs you cards.</b> Spent, stacked or kept — you gather your whole deck for the duel either way. <b>Hold nothing back.</b></div>`;
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
      ? (duel ? `🐉 THE DUEL — beat ${S.duelBeat}` : `🐉 THE LAIR`)
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
    const potionRow = kit.length
      ? `<div class="kit-row">` + kit.map((p, i) =>
          `<button class="kit-potion${S.potionPick === p.id ? ' arming' : ''}" onclick="usePotion('${p.id}')">` +
          `<b>🧪 ${p.name}</b><span class="kit-text">${p.text}</span></button>`).join('') +
        (S.potionPick ? `<div class="kit-ask">Tap a card to use the <b>${potionById(S.potionPick).name}</b> on it — ` +
          `<button onclick="cancelPotion()">cancel</button></div>` : '') +
        `</div>`
      : '';
    const wakeRow = hasEmberwake() && S.wake > 0
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
      potionRow +
      wakeRow +
      bankRowHTML() +
      cycleRowHTML() +
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
      `<div class="hint">Damage to soak: <b style="color:#e08a7a">${S.damage}</b>` +
      `. Tap a card to blunt it — it soaks its 🛡️ armour value. ` +
      `<b>A Lv1 card LEAVES YOUR DECK for the rest of the run.</b></div>`;
    } else if (S.phase === 'setout') {
    // 🔑 SHOW THE OBJECT. Same rule as every other picker in the game — the choice is between
    // three RULES, so all three rules are on screen in full, with what each one is FOR underneath.
    const offers = (S.setout || []).map(id => charmById(id)).filter(Boolean);
    c.innerHTML =
      `<div class="phase-label">SETTING OUT</div>` +
      `<div class="setout">` +
      `<p class="setout-story">The workshop door closes behind you and the latch settles. ` +
      `Four regions of road, and then <b>${S.dragon.name}</b> at the end of them — ` +
      `everything you will have out there, you are carrying now.</p>` +
      `<p class="setout-ask">One last thing goes in the pack.</p>` +
      offers.map(o => `<button class="setout-offer r-${o.rarity}" onclick="pickSetout('${o.id}')">` +
        `<b>${o.name}</b><span class="setout-text">${o.text}</span>` +
        (o.why ? `<span class="setout-why">${o.why}</span>` : '') + `</button>`).join('') +
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
            ? (() => { const blocked = o.need === 'card' && !eventPickable(o).length;
                return `<button onclick="eventChoose(${i})"${blocked ? ` disabled title="${S.hand.length ? 'no card in hand can take this' : 'no cards in hand'}"` : ''}>${o.label}</button>`; })()
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
        `<b>📖 Tutorial</b>${gradeBadge(0)}` +
        `<span>learn the game in one short run · always open</span></button>` +
      `<button class="menu-item" onclick="showStages()"><b>🗺️ Stages</b>` +
        `<span>${cleared ? `${cleared} of ${DRAGONS.length} felled` : 'the real thing — four dragons, one at a time'} · 🏆 ${w.graded}/${w.total} graded</span></button>` +
      `<button class="menu-item" onclick="showCollection()"><b>🎁 Collection</b>` +
        `<span>the charms and potions you can be offered</span></button>` +
      (DEV_ENABLED ? `<button class="menu-item quiet" onclick="showDev()"><b>🔧 Dev</b>` +
        `<span>jump straight to a dragon</span></button>` : '') +
      // 🏷️ the stamp. A playtester's bug report is worth far more when it names a build, and
      // the status bar's copy only appears once a run is underway — too late to read on a crash.
      `<div class="menu-stamp">${CHANNEL === 'play' ? 'playtest build' : 'dev build'} ${BUILD}` +
        `${CHANNEL === 'play' ? ' · <b>found a bug?</b> say what the build number was' : ''}</div>` +
      `</div>`;
  } else if (S.phase === 'collection') {
    // 🔑 THE COLLECTION IS AN HONEST SHELF. It shows what CAN be offered and when — which is
    // the only meta fact the player currently has — and says plainly that unlocking and banning
    // are not built yet, rather than showing a button that lies.
    const tierName = t => ['', 'stage 1+', 'stage 2+', 'stage 3+', 'stage 4'][t] || 'always';
    const group = t => CHARMS.filter(x => !x.curse && (x.tier || 1) === t);
    const rows = [1, 2, 3, 4].map(t => {
      const list = group(t); if (!list.length) return '';
      return `<div class="coll-tier"><h4>${tierName(t)} <span class="dim">· ${list.length}</span></h4>` +
        list.map(x => `<div class="coll-row${x.mage ? ' is-mage' : ''}">` +
          `<b>${x.name}</b>${x.mage ? '<span class="coll-tag">mage</span>' : ''}` +
          `<span class="coll-text">${x.text}</span></div>`).join('') + `</div>`;
    }).join('');
    c.innerHTML =
      `<div class="phase-label">🎁 COLLECTION</div>` +
      `<div class="hint">Charms are offered by <b>stage</b> for now — a stand-in for unlocking them by play. ` +
      `Deeper stages draw from a wider pool, so later dragons are met by a stronger mage.</div>` +
      `<div class="coll">${rows}</div>` +
      `<div class="coll-soon">🚧 <b>Not built yet:</b> unlocking charms by <b>runs played</b>, and the ` +
      `🚫 <b>ban list</b> — one charm disabled per five unlocked, so you shape the pool without ` +
      `pre-solving the run. Both wait on the real unlock system.</div>` +
      `<div class="coll-soon">🧪 <b>${POTIONS.length} potions</b> in the shop pool, weighted toward the cheap ones.</div>` +
      `<button class="primary" onclick="showMenu()">← Back</button>`;
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
      `<div class="dev-row"><span>Charm</span><div>` +
        pick('charm', '', 'none', !d.charm) +
        CHARMS.filter(x => x.mage).map(x => pick('charm', x.id, x.name, d.charm === x.id)).join('') +
      `</div></div>` +
      `<p class="dev-note">${dragon.name} — ${dragon.hp} HP · ${dragonShapeText(dragon)} · par <b>${dragon.par}</b>. ` +
      `<b>${cfg.label}</b>: ${cfg.cards} cards, about ${(dragon.par || 44) + cfg.offset} levels — <i>${cfg.hint}</i>.</p>` +
      `<button class="primary" onclick="devJump()">🐉 Jump to the lair</button>` +
      `<button onclick="showMenu()">← Menu</button>` +
      `</div>`;
  } else if (S.phase === 'ladder') {
    const cleared = stagesCleared();
    c.innerHTML =
      `<div class="phase-label">🗺️ THE STAGES</div>` +
      `<div class="summary"><p>Each stage is a different <b>question</b>, not simply a bigger number. ` +
      `Beat one and the next opens — but every stage you have cleared stays open, so you can always go back.</p></div>` +
      (() => { const w = wallSummary();
        return `<div class="wall-line">🏆 <b>${w.graded}</b> of ${w.total} stages graded` +
          (w.perfect ? ` · <b class="g-S">${w.perfect}</b> perfect` : '') +
          `<span class="dim"> — every stage keeps its best grade, win or lose</span></div>`; })() +
      // 🗡️ WHO ARE YOU TAKING? Sits ABOVE the stages because it changes what every one of them
      // means — the same dragon is a different problem to a different class, which is the whole
      // economy: +1 class = xN content. Hidden entirely until it is earned, rather than shown
      // greyed-out: a locked door you cannot read is a tease, and the Collection already states
      // what is not built. Once open it is two buttons, and the game says what each one IS.
      (() => {
        if (!classUnlocked('rogue')) return '';
        const picked = pickedClassId();
        const row = (id, name, line) =>
          `<button class="class-pick${picked === id ? ' on' : ''}" onclick="pickClass('${id}')">` +
          `<b>${name}</b><span class="class-line">${line}</span></button>`;
        return `<div class="wall-line">🎭 <b>Who walks the road?</b><span class="dim"> — the same dragon is a different problem</span></div>` +
          `<div class="class-row">` +
          row('mage', '✦ The Mage', 'elements agree — one big blow') +
          row('rogue', '🗡️ The Rogue', 'strikes chain — many small ones') +
          `</div>`;
      })() +
      // 📖 the tutorial lives on the MENU now — one door per thing

      DRAGONS.map(d => {
        const open = stageUnlocked(d.stage), done = d.stage <= cleared;
        return `<button class="${d.stage === Math.min(DRAGONS.length, cleared + 1) ? 'primary' : ''} stage${open ? '' : ' locked'}"` +
          (open ? ` onclick="startStage(${d.stage})"` : ' disabled') + `>` +
          `<b>${done ? '✔ ' : ''}Stage ${d.stage} — ${open ? d.name : '???'}</b>${open ? gradeBadge(d.stage) : ''}` +
          // ❌ THE PICKER DOES NOT SPOIL THE DRAGON (2026-08-05, Thomas: *"lets remove what the
          // boss does, don't think we really need to show that off"*). It used to print the SHAPE
          // and the demand on every stage button.
          // 🔑 The turn-1 BRIEFING is where that belongs, and it is a designed moment: the run is
          // *soft-directional* because you learn the problem the instant it starts and then spend
          // twenty turns preparing for it. Printing the same facts on the menu spends the reveal
          // before the run exists, and turns choosing a stage into reading a stat block.
          // What the button says instead is about YOU — what you have done here, not what it does.
          `<span class="stage-shape">${!open ? 'locked — clear stage ' + (d.stage - 1) + ' to open'
            : done ? 'felled — go again for a better grade'
            : 'not yet felled'}</span>` +
          `</button>`;
      }).join('') +
      `<button class="dev-open" onclick="showMenu()">← Menu</button>`;
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
      // 📖 THE HANDOFF (2026-08-05). Finishing the tutorial is the moment a new player either
      // becomes a player or closes the tab, and it used to end on the same generic stage picker a
      // returning player gets. A picker is a question; what someone who has just been taught needs
      // is the NEXT THING, named. So the tutorial's victory screen points at stage 1 by name, with
      // the one demand it makes — the same briefing language the run itself uses.
      (S.tutorial ? tutorialHandoffHTML()
        : `<button class="primary" onclick="showStages()">🗺️ Choose your next stage</button>`);
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
// one line, three places (fight / journey / duel). It names the card that ACTUALLY attuned, which
// is the Catalyst normally, the Surge under ✦ Second Flame, and a non-matching Catalyst under
// ✦ Loose Weave - where it says so, because a half bonus with no explanation reads as a bug.
function attunedLineText(r, spell, verb) {
  const src = r.attuner;
  const nm = src ? src.def.name : 'your Catalyst';
  const sums = `${verb} ${r.base - r.attBonus} + ${r.attBonus} = ${r.base}`;
  if (r.loose) return `✦ ATTUNED loosely — ${nm} is not ${r.spellEl}, so Loose Weave gives half → ${sums}`;
  return `✦ ATTUNED — ${nm} is ${src ? elOf(src) : r.spellEl} like ${spell.def.name} → ${sums}`;
}
function zoneHint(zone) {
  const isFight = S.encounter && S.encounter.type === 'fight';
  switch (zone) {
    case 'Spell': return (isFight ? 'your Attack' : 'your Move') +
      (hasCharm('unspent') ? ' — ✦ SPENT only if you fall short' : ' — SPENT, gone for the region');
    case 'Element': {
      const sp = spellCard();
      if (!sp) return 'Initiative — returns to your deck';
      // ⚠️ the Catalyst may no longer be the thing that attuned — say who did
      const src = attunerCard(), here = cardById(S.assign.Element);
      if (!attunedNow()) return `Initiative — a ${elOf(sp)} card here would ATTUNE your Spell`;
      if (looseOnly()) return `✦ ATTUNED loosely — half bonus · Initiative`;
      if (src && here && src !== here) return `Initiative — your Surge attuned the Spell`;
      return `✦ ATTUNED — ${elOf(sp)} matches · Initiative`;
    }
    case 'Boost': {
      const sc = cardById(S.assign.Boost), el = cardById(S.assign.Element);
      // ✦ Second Flame gives the Surge a second job — name it here or the slot lies about itself
      if (hasCharm('secondflame') && sc && spellCard() && attunerCard() === sc)
        return `✦ ATTUNES the Spell · +power now`;
      if (sc && S.bankArmed)
        return `🔥 BANKS — +${bankValueOf(sc)} Emberwake next turn, ${bankCostPhrase(sc)}`;
      if (sc) return `+power now — or 🔥 bank it for next turn`;
      return '+power — returns to your deck';
    }
    case 'Reserve': return 'kept in hand for next turn';
  }
}
// 🔥 ARM THE BANK. It sits in the controls with the Emberwake's AIM row rather than on the Surge
// card, so the whole mechanic reads in one place: arm it here, aim it here next turn.
// ⚠️ It was drafted into the Surge slot's head first (the "decision belongs on the object" rule)
// and pulled back out: `.slot-head` is a FIXED 46px on purpose — a taller head staggers the whole
// four-slot row — so a button there needs a layout pass, not a guess. The Surge's slot hint still
// states what will happen to that card, which is the part that must live on the object.
// 🗡️ THE CYCLE ROW — the rogue's slot ③, sitting exactly where the mage's bank row does, because
// they are the same kind of decision: the one thing this class does with the free slot.
function cycleRowHTML() {
  if (!CLASS.cycles || !isAssignPhase()) return '';
  const free = !!S.freeCycle;
  if (S.cycled) return `<div class="wake-row bank-row"><span class="wake-lab">🗡️ You have already cycled this turn.</span></div>`;
  if (!S.deck.length) return '';
  return `<div class="wake-row bank-row"><span class="wake-lab">🗡️ Chain <b>${S.chain || 1}</b>` +
    (S.lastStrike ? ` — follow <b>${S.lastStrike}</b>` : ' — no chain yet') + `</span>` +
    `<button class="wake-btn${S.cyclePick ? ' on' : ''}" onclick="armCycle()">` +
    (S.cyclePick ? 'tap a card to cycle it' : 'cycle a card') + `</button>` +
    `<span class="wake-note">${free ? '✦ Sleight of Hand — this one is free' : 'it goes under your deck, and the chain breaks'}</span></div>`;
}

function bankRowHTML() {
  if (!hasEmberwake() || !isAssignPhase()) return '';
  const sc = cardById(S.assign.Boost);
  if (!sc) return '';
  const v = bankValueOf(sc);
  const on = !!S.bankArmed;
  return `<div class="wake-row bank-row"><span class="wake-lab">🔥 Your <b>Surge</b> — ` +
    (on ? `<b>banking +${v}</b> for next turn` : `+${v} power now`) + `</span>` +
    `<button class="wake-btn${on ? ' on' : ''}" onclick="toggleBank()">` +
    (on ? 'spend it now instead' : `bank it for next turn`) + `</button>` +
    `<span class="wake-note">${on ? 'nothing this turn' : 'worth it when this turn is already decided'}</span></div>`;
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
  const enhLine = d.wild ? '🌈 Wild' : '';
  const forged = '';

  let action = '';
  if (S.diverting) {
    action = `<div class="card-action"><button onclick="divertWith(${card.id})">Discard (Divert)</button></div>`;

    } else if (isAssignPhase() && S.potionPick) {
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
    const opt = currentEventDef().options[S.event.opt];
    action = eventCanPick(opt, card)
      ? `<div class="card-action"><button onclick="eventPickCard(${card.id})">Choose this one</button></div>`
      : `<div class="card-action muted">${opt.pickNote || 'not this one'}</div>`;
  } else if (canSharpenNow()) {
    // ⚠️ every number here reads off `real`, never the previewed copy — the cost of the NEXT
    // level is not the cost printed by the level you are looking at.
    if (real.level >= MAX_LEVEL) {
      action = `<div class="card-action muted">already at Lv${MAX_LEVEL}</div>`;
    } else if (S.downgraded.has(real.id)) {
      action = `<div class="card-action muted">blunted this turn — can't sharpen</div>`;
    } else {
      const cost = eff(real).cost;
      const ok = cost <= S.coins;
      action = previewing
        ? `<div class="card-action"><button class="primary" onclick="buyUpgrade(${real.id})" ${ok ? '' : 'disabled'}>` +
          `Sharpen to Lv${real.level + 1} — 🪙 ${cost}${ok ? '' : ' (not enough)'}</button>` +
          `<button onclick="pickUpgrade(${real.id})">back</button></div>`
        : `<div class="card-action"><button onclick="pickUpgrade(${real.id})">See Lv${real.level + 1} — 🪙 ${cost}</button></div>`;
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
  const slotCls = (slot ? `in-${slot}` : '') + (attLive ? ' attuned-pair' : '') + (previewing ? ' card-preview' : '');
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
  S.finalPhase = 'lastmile';
  S.duelBeat = 0;
  // the dragon becomes a persistent enemy: one HP pool + its armor list as breakable shields
  // 🐉 the dragon becomes a persistent enemy: an HP pool plus its SHAPE. `boon` is what a
  // the boon fields survive the Approach's deletion because the duel maths reads them.
  S.dragonState = {
    hp: S.dragon.hp, maxHp: S.dragon.hp,
    // ⚠️ the clean-Approach boon is GONE with the Approach (2026-08-05). The fields stay at 0
    // because duelArmour()/duelStrike() read them; a future reward may fill them again.
    boon: { armourCut: 0, unseen: 0, calm: 0 },
    active: null, next: null,   // 🐉 what it is doing now, and what it has telegraphed
  };
  S.deck = S.tutorial ? [...S.deck, ...S.discard, ...S.hand] : shuffle([...S.deck, ...S.discard, ...S.hand]); // gather all non-trashed, keep levels
  S.hand = []; S.discard = [];
  draw(HAND_SIZE);
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
  S.divertsUsed = 0; S.diverting = false;
  S.loseReserve = null; S.afterSoak = 'upgrade';
  S.damage = 0; S.damageEl = null;
  // ⚠️ THE FINALE NEVER CALLS nextTurn(), so anything reset there has to be reset here too.
  S.emberguardUsed = false;
  S.potionFx = { init: 0, value: 0, soak: 0, boost: 0, pace: 0, tpCut: 0, swap: {} }; S.potionPick = null;
  S.bankArmed = false;   // 🔥 banking is armed per TURN — anything outliving its turn would be a charm
  S.cycled = false; S.cyclePick = false;   // 🗡️ the cycle is once per turn (freeCycle is NOT reset — it is earned for next turn)
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
  const armour = quenched ? 0 : duelArmour() + (duelFx().armour || 0);   // 🐉 Bank the Forge
  // a clean Approach means it hasn't seen you yet — evasion sleeps for the first `unseen` beats
  const evaded = !quenched && hasShape('evasion') && r.initLost && !(S.dragonState.boon.unseen > 0);
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
// No reshuffle in a duel, so every card you soak with is stamina you never get back.
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
    `<div class="stamina-note">🔑 <b>You lose when your cards run out</b> — every card you soak with is stamina you never get back.</div>`;
}

function startDuel() {
  S.finalPhase = 'duel';
  S.duelBeat = 0;

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
  S.divertsUsed = 0; S.diverting = false;
  S.loseReserve = null; S.afterSoak = 'upgrade';
  S.damage = 0; S.damageEl = null;
  // ⚠️ THE FINALE NEVER CALLS nextTurn(), so anything reset there had to be reset here too.
  // The Emberguard is once-per-TURN, and without this it was once per BOSS BATTLE.
  S.emberguardUsed = false;
  S.potionFx = { init: 0, value: 0, soak: 0, boost: 0, pace: 0, tpCut: 0, swap: {} }; S.potionPick = null;
  S.bankArmed = false;   // 🔥 banking is armed per TURN — anything outliving its turn would be a charm
  S.cycled = false; S.cyclePick = false;   // 🗡️ the cycle is once per turn (freeCycle is NOT reset — it is earned for next turn)
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
  S.duelResult = { atk, toHp, kill, early, counter, damage, armour: st.armour, evaded: st.evaded };

  log(`The weave — Spell: ${displayName(spell)} Lv${spell.level} (${r.spellEl}) = ${r.base}` +
      ` · Catalyst: ${elem ? `${elem.def.name} (${elem.def.wild ? 'Wild' : elOf(elem) || 'colorless'}, Init ${eff(elem).init})` : '—'}` +
      ` · Surge: ${boostC ? `${boostC.def.name} (+${r.boostEff} → ${S.boostTarget})` : '—'}`);

  // --- staged reveal (mirrors the normal fight) ---
  const L = (text, cls = '') => ({ text, cls });
  const beats = [];
  const b1 = [];
  if (r.enhUsed) b1.push(L(attunedLineText(r, spell, 'strike'), 'good'));
  else b1.push(L(`Strike ${r.base} — unattuned${elem ? ` (${elem.def.name} is ${elOf(elem)}, not ${r.spellEl})` : ''}`));
  if (r.banks) b1.push(L(`🔥 BANKED — ${boostC.def.name} is ${elOf(boostC)} like your Catalyst, ${bankCostPhrase(boostC)}: +${r.bank} Emberwake for next beat`, 'good'));
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
  // 🏆 a graded loss still goes on the wall — death is part of the game, not a blank
  if (S.dragon) recordGrade(S.dragon.stage, gradeRun(false), false);
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
  recordGrade(S.dragon.stage, gradeRun(true), true);
  const next = dragonForStage(S.dragon.stage + 1);
  log(`🏆 THE ${S.dragon.name.toUpperCase()} FALLS! Final score: ${score}`, 'good result');
  if (next && S.dragon.stage > was) log(`🗺️ Stage ${S.dragon.stage} cleared — STAGE ${next.stage}, the ${next.name}, is open to you. ${next.brief}`, 'good result');
  else if (!next) log(`🪜 Every stage stands open — take whichever you like.`, 'good result');
  S.phase = 'victory';
  render();
}

// go — restore a saved run if one exists, else start fresh
// 🏠 boot to the menu. A saved run is offered, never forced — and never silently discarded.
showMenu();
