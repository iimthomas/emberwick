'use strict';

/* ============================================================
   EMBERWICK prototype v1 (formerly Spellwick — renamed 2026-07-01)
   All tuning lives in the CONSTANTS + DATA block below.
   ============================================================ */

// ---------- tuning constants (placeholders, see design docs) ----------
const START_LEVEL = 2;
const MAX_LEVEL = 4;
const HAND_SIZE = 4;
const REGION_END_THRESHOLD = 5;  // fewer than this many cards (hand+deck) => region ends
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
  { name: 'Flicker',       element: 'Lightning', type: 'hybrid', enhType: 'hybrid', enhEl: 'Stone',
    lv: [[2,3,2,2,1,null,2],[3,5,3,3,2,null,3],[4,7,4,4,3,null,4],[6,9,4,5,3,'Stone',null]] },
  { name: 'Sparkstrike',   element: 'Lightning', type: 'attack', enhType: 'attack', enhEl: 'Fire',
    lv: [[3,6,2,1,2,null,1],[5,8,3,1,2,null,3],[6,11,3,2,3,null,4],[7,14,4,3,5,null,null]] },
  { name: 'Stormstep',     element: 'Lightning', type: 'move',   enhType: 'move',   enhEl: 'Lightning',
    lv: [[3,5,5,1,2,null,2],[5,9,5,2,3,null,4],[6,11,6,4,3,'Lightning',6],[8,14,7,5,4,'Lightning',null]] },
  { name: 'Streamdart',    element: 'Lightning', type: 'move',   enhType: 'move',   enhEl: 'Water',
    lv: [[2,4,5,1,2,null,2],[3,6,6,2,2,null,4],[5,9,8,3,5,null,5],[8,12,9,5,5,'Water',null]] },
  { name: 'Unmaking',      element: 'Water',     type: 'attack', enhType: 'attack', enhEl: 'Fire',
    lv: [[2,6,1,1,1,null,2],[3,8,1,2,1,null,4],[5,10,2,2,2,'Fire',5],[6,13,3,3,3,'Fire',null]] },
  { name: 'Rimeguard',     element: 'Water',     type: 'attack', enhType: 'attack', enhEl: 'Water',
    lv: [[2,3,4,1,3,null,1],[3,5,5,2,4,'Water',3],[4,7,6,4,4,'Water',4],[6,10,7,5,6,'Water',null]] },
  { name: 'Headlong',      element: 'Water',     type: 'move',   enhType: 'attack', enhEl: 'Stone',
    lv: [[2,4,1,2,1,null,1],[3,5,1,3,2,null,3],[5,9,2,4,2,'Stone',4],[6,11,3,5,3,'Stone',null]] },
  { name: 'Stormglass',    element: 'Water',     type: 'attack', enhType: 'attack', enhEl: 'Lightning',
    lv: [[2,4,4,2,1,null,2],[3,6,6,2,2,null,3],[4,7,8,3,3,null,4],[6,10,10,4,4,null,null]] },
  { name: 'Stonemarch',    element: 'Stone',    type: 'attack', enhType: 'move',   enhEl: 'Stone',
    lv: [[3,5,2,2,2,null,2],[4,7,3,3,3,null,3],[5,9,4,5,3,null,5],[5,12,5,6,4,'Stone',null]] },
  { name: 'Shalewake',     element: 'Stone',    type: 'move',   enhType: 'move',   enhEl: 'Water',
    lv: [[2,4,5,1,2,null,2],[3,6,6,2,2,null,4],[5,9,8,3,5,null,5],[8,12,9,5,5,'Water',null]] },
  { name: 'Flintdart',      element: 'Stone',    type: 'move',   enhType: 'move',   enhEl: 'Lightning',
    lv: [[3,5,5,1,2,null,2],[5,6,5,2,3,null,4],[6,11,6,4,3,'Lightning',6],[8,14,7,5,4,'Lightning',null]] },
  { name: 'Rockfall',       element: 'Stone',    type: 'attack', enhType: 'attack', enhEl: 'Fire',
    lv: [[3,6,2,1,2,null,1],[5,8,3,1,2,null,3],[6,11,3,2,3,null,4],[7,14,4,3,5,null,null]] },
  { name: 'Trailblaze',    element: 'Fire',      type: 'move',   enhType: 'move',   enhEl: 'Fire',
    lv: [[2,4,1,1,1,null,2],[3,5,1,2,1,null,4],[4,7,2,2,2,'Fire',5],[5,9,3,3,3,'Fire',null]] },
  { name: 'Hearthwall',    element: 'Fire',      type: 'attack', enhType: 'attack', enhEl: 'Water',
    lv: [[2,3,4,1,3,null,1],[3,5,5,2,4,'Water',3],[4,7,6,4,4,'Water',4],[6,10,7,5,6,'Water',null]] },
  { name: 'Updraft',       element: 'Fire',      type: 'move',   enhType: 'move',   enhEl: 'Lightning',
    lv: [[2,4,4,1,2,null,1],[4,8,5,2,2,'Lightning',3],[5,10,7,3,3,'Lightning',4],[6,12,9,5,5,'Lightning',null]] },
  { name: 'Smoulder',      element: 'Fire',      type: 'hybrid', enhType: 'hybrid', enhEl: 'Stone',
    lv: [[2,3,2,2,1,null,2],[3,5,3,3,2,null,3],[4,7,4,4,3,null,4],[6,9,4,5,3,'Stone',null]] },
  // OURS — colorless wildcard; matches ANY enhEl when played as the Catalyst (stats synthesized in-grammar)
  { name: 'Wander Light',     element: null, wild: true, type: 'hybrid', enhType: null, enhEl: null,
    lv: [[2,null,2,3,1,null,2],[3,null,3,4,2,null,3],[4,null,4,5,2,null,4],[5,null,5,6,3,null,null]] },
];

// ---------- modifiers (source rulebook) ----------
const HARDSHIPS = {
  'Ambush':       'Double the Early Damage you suffer this encounter.',
  'Hazards':      'Suffer 1 Time Penalty if you take Early Damage, and 1 more if you take Combat Damage.',
  'Night Travel': "Your Boost is reduced by your Catalyst's Initiative (min 0).",
  'Storm':        'Any Time Penalties this encounter also deal that much damage.',
};
const FIGHT_HARDSHIPS = ['Ambush', 'Hazards', 'Night Travel'];
const JOURNEY_HARDSHIPS = ['Night Travel', 'Storm'];

const ABILITIES = {
  'Freeze': 'If it deals you Early Damage, you discard your Arsenal in Cleanup.',
  'Poison': 'If it damages you, +1 damage to your next drawn hand (+2 if both Early and Combat).',
  'Ranged': 'Deals Early Damage even if you win Initiative — unless you discard your Arsenal in Cleanup (decide now).',
};

const PERILS = {
  'Steep':       "The journey's MP is increased by your Arsenal's Boost.",
  'Treacherous': 'Fail to attain Complete Victory → suffer 1 damage after the Time Penalty.',
};

// ---------- regions (SOURCE-GRAMMAR RECUT 2026-07-01, from Thomas's transcription) ----------
// Enemy armor is a LIST (R4 creatures shield multiple elements). atkEl = the element its
// damage carries (soak-doubling). Nightfall values are OURS (source has none).
// `beats` = how many exchanges the creature takes (default 2). SKIRMISHERS — low HP, high
// Init — are ONE beat: they're a tempo change, a fight you win or lose in a single breath,
// and they keep the rhythm from flattening. Note a 1-beat creature has no exchange, so no
// STACK either; the deck-scheduling skill belongs to the fights that actually last.
// R4 XP values are INFERRED from the source's XP≈0.6×HP pattern — flag for tuning.
const REGIONS = [
  { name: 'Verdant Edge', hardshipChance: 0, encounters: [
    { type: 'fight',   name: 'Spark Kit',  hp: 7,  init: 8, atk: 1, atkEl: 'Lightning', armor: [{ el: 'Lightning', v: 1 }], xp: 4 },
    { type: 'fight',   name: 'Cinder Ape', hp: 11, init: 4, atk: 2, atkEl: 'Fire',      armor: [{ el: 'Fire', v: 1 }],      xp: 7 },
    { type: 'fight',   name: 'Mist Crane', hp: 9,  init: 6, atk: 2, atkEl: 'Water',     armor: [{ el: 'Water', v: 2 }],     xp: 5 },
    { type: 'fight',   name: 'Cairnstag',  hp: 13, init: 2, atk: 3, atkEl: 'Stone',    armor: [{ el: 'Stone', v: 3 }],    xp: 8 },
    { type: 'journey', name: 'Highland Pass',  mp: 12, timePenalty: 2, element: 'Lightning', nightfall: 4, xp: 5 },
    { type: 'journey', name: 'Fern Crossing',  mp: 8,  timePenalty: 1, element: 'Water',     nightfall: 3, xp: 3 },
    { type: 'journey', name: 'Sunwarm Trail',  mp: 11, timePenalty: 2, element: 'Fire',      nightfall: 4, xp: 4 },
    { type: 'journey', name: 'Quarry Hollow',    mp: 10, timePenalty: 1, element: 'Stone',    nightfall: 3, xp: 3 },
  ]},
  { name: 'Wilding Marches', hardshipChance: 0.35, encounters: [
    { type: 'fight',   name: 'Flintwisp',     hp: 9,  init: 6, atk: 2, atkEl: 'Stone',    armor: [{ el: 'Stone', v: 1 }],    xp: 5, ability: 'Ranged' },
    { type: 'fight',   name: 'Stormtoad',      hp: 10, init: 8, atk: 2, atkEl: 'Lightning', armor: [{ el: 'Lightning', v: 1 }], xp: 4 },
    { type: 'fight',   name: 'Ashen Boar',     hp: 15, init: 2, atk: 4, atkEl: 'Fire',      armor: [{ el: 'Fire', v: 3 }],      xp: 8 },
    { type: 'fight',   name: 'Frostbark Elder', hp: 13, init: 6, atk: 3, atkEl: 'Water',    armor: [{ el: 'Water', v: 2 }],     xp: 7, ability: 'Freeze' },
    { type: 'journey', name: 'Mirefen Road',    mp: 10, timePenalty: 2, element: 'Fire',      nightfall: 5, xp: 4, peril: 'Treacherous' },
    { type: 'journey', name: 'Drowned Meadow',  mp: 13, timePenalty: 2, element: 'Water',     nightfall: 4, xp: 7 },
    { type: 'journey', name: 'Stormwash',       mp: 11, timePenalty: 3, element: 'Lightning', nightfall: 5, xp: 5 },
    { type: 'journey', name: 'Scree Track', mp: 9,  timePenalty: 2, element: 'Stone',    nightfall: 4, xp: 4, peril: 'Steep' },
  ]},
  { name: 'Deepdark Hollows', hardshipChance: 0.5, encounters: [
    { type: 'fight',   name: 'Basalt Basilisk', hp: 17, init: 6, atk: 3, atkEl: 'Stone',    armor: [{ el: 'Stone', v: 3 }],    xp: 9 },
    { type: 'fight',   name: 'Grotto Hydra',   hp: 14, init: 4, atk: 3, atkEl: 'Water',     armor: [{ el: 'Water', v: 3 }],     xp: 8 },
    { type: 'fight',   name: 'Sulfur Crawler', hp: 11, init: 7, atk: 2, atkEl: 'Fire',      armor: [{ el: 'Fire', v: 2 }],      xp: 7, ability: 'Poison' },
    { type: 'fight',   name: 'Storm Prowler',  hp: 9,  init: 7, atk: 2, atkEl: 'Lightning', armor: [{ el: 'Lightning', v: 2 }], xp: 5, ability: 'Ranged' },
    { type: 'journey', name: 'Sunken Causeway', mp: 14, timePenalty: 2, element: 'Water',     nightfall: 6, xp: 7, peril: 'Steep' },
    { type: 'journey', name: 'Echo Basin',      mp: 12, timePenalty: 3, element: 'Lightning', nightfall: 5, xp: 6 },
    { type: 'journey', name: 'Cinder Ravine',   mp: 10, timePenalty: 3, element: 'Fire',      nightfall: 5, xp: 5, peril: 'Treacherous' },
    { type: 'journey', name: 'Granite Cut',    mp: 11, timePenalty: 2, element: 'Stone',    nightfall: 6, xp: 5 },
  ]},
  { name: "The Dragon's Shadow", hardshipChance: 0.65, encounters: [
    { type: 'fight',   name: 'Cairntide Warden', hp: 13, init: 7,  atk: 2, atkEl: 'Stone',    armor: [{ el: 'Stone', v: 3 }, { el: 'Water', v: 2 }],    xp: 7, ability: 'Poison' },
    { type: 'fight',   name: 'Flarecaller',      hp: 9,  init: 10, atk: 3, atkEl: 'Fire',      armor: [{ el: 'Fire', v: 1 }],                             xp: 5, ability: 'Ranged' },
    { type: 'fight',   name: 'Stormcrown Stag',  hp: 14, init: 8,  atk: 4, atkEl: 'Lightning', armor: [{ el: 'Lightning', v: 2 }, { el: 'Fire', v: 2 }],  xp: 8, ability: 'Freeze' },
    { type: 'fight',   name: 'Mirewyrm Elder',   hp: 17, init: 7,  atk: 5, atkEl: 'Water',     armor: [{ el: 'Water', v: 3 }, { el: 'Stone', v: 2 }],    xp: 9 },
    { type: 'journey', name: 'Drowned Vale',   mp: 14, timePenalty: 2, element: 'Water',     nightfall: 7, xp: 7, peril: 'Treacherous' },
    { type: 'journey', name: 'Stoneward Road', mp: 13, timePenalty: 3, element: 'Stone',    nightfall: 6, xp: 6 },
    { type: 'journey', name: 'Emberfall Path', mp: 12, timePenalty: 2, element: 'Fire',      nightfall: 6, xp: 5 },
    { type: 'journey', name: 'Tempest Ridge',  mp: 11, timePenalty: 3, element: 'Lightning', nightfall: 7, xp: 5, peril: 'Steep' },
  ]},
];

const ROLES = ['Spell', 'Element', 'Boost'];
const ZONES = ['Spell', 'Element', 'Boost', 'Reserve'];
// 🔑 THE PILE (2026-07-26 redesign). The Spell is no longer a seat, it is a PILE: it holds one
// card or several, and every card you pour in is a slot left empty. All cards in the pile must
// share an element. That single rule is the brain-burner - power vs speed vs what you carry,
// out of the same four cards, EVERY turn instead of only when you happen to hold a pair.
// S.assign.Spell is an ARRAY of ids; Element/Boost/Reserve stay single ids.
const SLOTS = ['Element', 'Boost', 'Reserve'];   // the single-card slots
function pileIds() { return (S.assign.Spell || []).filter(id => cardById(id)); }
function pileCards() { return pileIds().map(cardById); }
function pileElement() { const p = pileCards(); return p.length ? p[0].def.element : null; }
function canPour(id) {
  const c = cardById(id); if (!c) return false;
  const pe = pileElement();
  return pe == null || c.def.element === pe || pileIds().includes(id);
}
// a card's contribution: its own value, plus anything buried under it by a Fuse
function cardValue(card) {
  if (!card) return 0;
  const buried = (S.fuse && S.fuse.topId === card.id) ? cardById(S.fuse.bottomId) : null;
  return eff(card).value + (buried ? eff(buried).value : 0);
}
function removeFromZone(id) {
  S.assign.Spell = pileIds().filter(i => i !== id);
  for (const z of SLOTS) if (S.assign[z] === id) S.assign[z] = null;
}

// The candle vocabulary (adopted 2026-07-01) — display names only; internal keys unchanged.
// Spell = your action · Catalyst = ignites it (Initiative) · Surge = fuel (+value) · Arsenal = kept for tomorrow.
const SLOT_LABEL = { Spell: 'Spell', Element: 'Catalyst', Boost: 'Surge', Reserve: 'Arsenal' };
const slotLabel = zone => SLOT_LABEL[zone.replace(/[AB]$/, '')] + (zone.endsWith('A') ? ' — Set A' : zone.endsWith('B') ? ' — Set B' : '');

// ---------- the Dragons (spec §8; all four from the source, transcribed 2026-07-01) ----------
// One is drawn at random per run and FULLY REVEALED from turn 1. Armor is a LIST — a dragon
// can shield several elements; its "weakness" is simply every element it does NOT shield.
// Better tiers = less punishment (tp / counterstrike shrink as your total grows).
// THE DRAGON DUEL (redesigned 2026-07-06, see 03_Content/Dragons.md): each dragon is a
// PERSISTENT enemy — an HP pool + breakable elemental shields (its armor list). `breath` is
// the counterstrike base (was the old Early value); the per-beat counter shrinks as HP falls.
// hp starting values from the old top HP-tier. All OURS to tune with the Run Simulator.
const DRAGONS = [
  { name: 'Cindermaw',  element: 'Fire',      init: 9,  breath: 8, hp: 44, armor: [{ el: 'Fire', v: 4 }] },
  { name: 'Skyrender',  element: 'Lightning', init: 13, breath: 7, hp: 40, armor: [{ el: 'Lightning', v: 4 }, { el: 'Fire', v: 1 }] },
  { name: 'Fathomdread', element: 'Water',    init: 10, breath: 6, hp: 44, armor: [{ el: 'Water', v: 5 }, { el: 'Lightning', v: 3 }, { el: 'Stone', v: 2 }] },
  { name: 'Cragmourn', element: 'Stone',    init: 12, breath: 7, hp: 42, armor: [{ el: 'Stone', v: 4 }, { el: 'Water', v: 3 }] },
];
// THE APPROACH — two ordinary journey-beats racing to the lair (element = the dragon's
// weakness, so you can Attune toward the crack). Complete both → shatter its weakest shield.
const APPROACH = { mp: 13, timePenalty: 2, nightfall: 6 };
const ELEMENTS = ['Fire', 'Water', 'Lightning', 'Stone'];
const dragonWeakness = d => ELEMENTS.filter(el => !d.armor.some(a => a.el === el));
const armorText = list => list.map(a => `${a.v} ${elIcon(a.el)}`).join(' · ');

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
  { id: 'brightwick',  name: 'Brightwick',       rarity: 'rare', cost: 14,
    text: '⚔️ All cards strike +1',                  mods: { atk: 1 } },
  { id: 'oathstone',   name: 'Oathstone',        rarity: 'rare', cost: 14,
    text: '🛡️ All cards gain +1 armor',              mods: { armor: 1 } },
];
const charmById = id => CHARMS.find(c => c.id === id);

// ============================================================
// EVOLUTION CUT 2026-07-26 - it solved a symptom (flat/duplicate cards are a DATA problem),
// every verb was an exception fighting the legibility pillar, and at ~10% a spin it was too
// rare to be felt. Replaced by levelling-as-sharpening (02_Progression/).
const displayName = card => card.def.name;
function hasCharm(id) { return !!(S && S.charms && S.charms.includes(id)); }
// sum a mod across held charms; `el` restricts element-gated charms to matching cards
function charmMod(key, el) {
  if (!S || !S.charms) return 0;
  let t = 0;
  for (const id of S.charms) {
    const c = charmById(id);
    if (!c || c.mods[key] == null) continue;
    if (c.mods.el && c.mods.el !== el) continue;   // element-gated and this card doesn't match
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

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- save state (auto-saves every stable phase; survives refresh) ----------
const SAVE_KEY = 'emberwick-save-1';

function saveGame() {
  if (!S || S.phase === 'reveal') return; // mid-reveal saves would lose the pending resolution
  try {
    const card = c => { // by index — names duplicate across elements. mods (am/at/ee) only when set.
      const o = { id: c.id, n: CARD_DEFS.indexOf(c.def), lv: c.level };
      return o;
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      v: 4, uid, dragon: S.dragon ? S.dragon.name : null,
      region: S.region, turn: S.turn,
      deck: S.deck.map(card), hand: S.hand.map(card),
      discard: S.discard.map(card), trashed: S.trashed.map(card),
      queue: S.encounterQueue.map(e => e.name),
      results: S.results, phase: S.phase,
      encounter: S.encounter ? S.encounter.name : null,
      hardship: S.hardship, rangedDodge: S.rangedDodge, loseReserve: S.loseReserve,
      poison: S.poison, afterSoak: S.afterSoak,
      assign: S.assign, fuse: S.fuse, divertsUsed: S.divertsUsed,
      boostTarget: S.boostTarget, coins: S.coins, charms: S.charms, damage: S.damage, damageEl: S.damageEl,
      downgraded: [...S.downgraded], actionSetIds: S.actionSetIds, reserveId: S.reserveId,
      stack: S.stack,
      finalMode: S.finalMode, finalPhase: S.finalPhase, dragonState: S.dragonState,
      approachOutcomes: S.approachOutcomes, duelBeat: S.duelBeat, defeatMsg: S.defeatMsg,
      pendingEvent: S.pendingEvent, event: S.event,
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
    if (d.v !== 3) return false;
    const mk = s => {
      const def = CARD_DEFS[s.n];
      if (!def) return null;
      const c = { id: s.id, def, level: s.lv };
      return c;
    };
    const deck = d.deck.map(mk), hand = d.hand.map(mk), discard = d.discard.map(mk), trashed = d.trashed.map(mk);
    if ([...deck, ...hand, ...discard, ...trashed].some(c => !c)) return false; // card data changed since save
    const region = REGIONS[d.region - 1];
    if (!region) return false;
    const encounter = d.encounter ? region.encounters.find(e => e.name === d.encounter) : null;
    const stable = ['summary', 'defeat', 'victory', 'event', 'wheel'];
    if (!encounter && !d.finalMode && !stable.includes(d.phase)) return false;
    uid = d.uid;
    S = {
      dragon: DRAGONS.find(x => x.name === d.dragon) || DRAGONS[0],
      region: d.region, turn: d.turn, deck, hand, discard, trashed,
      encounterQueue: d.queue.map(n => region.encounters.find(e => e.name === n)).filter(Boolean),
      results: d.results, phase: d.phase, encounter,
      hardship: d.hardship, rangedDodge: d.rangedDodge, loseReserve: d.loseReserve,
      poison: d.poison, afterSoak: d.afterSoak || 'upgrade',
      assign: d.assign, fuse: d.fuse, divertsUsed: d.divertsUsed,
      diverting: false, boostTarget: d.boostTarget, coins: d.coins || 0, charms: d.charms || [], wheel: null,
      damage: d.damage, damageEl: d.damageEl,
      downgraded: new Set(d.downgraded), actionSetIds: d.actionSetIds, reserveId: d.reserveId,
      beats: null, beatIndex: -1, pendingR: null, beatTimer: null, selectedId: null,
      beatResult: null, stack: d.stack || null,
      finalMode: d.finalMode, finalPhase: d.finalPhase || null, dragonState: d.dragonState || null,
      approachOutcomes: d.approachOutcomes || [], duelBeat: d.duelBeat || 0, duelResult: null,
      defeatMsg: d.defeatMsg,
      pendingEvent: d.pendingEvent || false, event: d.event || null,
      curseNextFight: d.curseNextFight || false, paceBless: d.paceBless || 0, emberShield: d.emberShield || false,
      logEntries: d.logEntries || [],
    };
    if (S.encounterQueue.length === 0) S.encounterQueue = shuffle(region.encounters);
    // the finale's encounter is synthetic (not in the region tables) — rebuild it for the saved beat
    if (S.finalMode) {
      if (S.finalPhase === 'duel') {
        S.encounter = { type: 'fight', name: S.dragon.name, dragon: true, hp: 9999,
          init: S.dragon.init, atk: S.dragon.breath, atkEl: S.dragon.element, armor: [], xp: 0, finale: true };
      } else {
        const weak = dragonWeakness(S.dragon)[0] || S.dragon.element;
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

function freshGame() {
  try { localStorage.removeItem(SAVE_KEY); } catch (err) {}
  const cards = shuffle(CARD_DEFS.map(newCard));
  S = {
    dragon: DRAGONS[Math.floor(Math.random() * DRAGONS.length)],
    region: 1,
    turn: 0,
    deck: cards,
    hand: [],
    discard: [],
    trashed: [],
    encounterQueue: shuffle(REGIONS[0].encounters),
    results: { Complete: 0, Narrow: 0, Loss: 0 },
    phase: null,
    encounter: null,
    hardship: null,      // active Hardship name or null
    rangedDodge: false,  // vs Ranged: commit now to discard Reserve in Cleanup
    loseReserve: null,   // reason string — Reserve is discarded in Cleanup
    poison: 0,           // damage owed to the NEXT drawn hand
    afterSoak: 'upgrade', // where the soak phase exits to: 'upgrade' | 'turnEnd'
    assign: { Spell: null, Element: null, Boost: null, Reserve: null }, // card ids
    fuse: null, // { topId, bottomId, element } — once per encounter
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
    fuseArm: false,   // after tapping the Fuse button: next same-element card completes the fuse
    stack: null,          // 🃏 mid-exchange: { ids, order } while you stack the deck
    // the Dragon Duel finale:
    finalMode: false,     // true once Region 4 is cleared and the finale begins
    finalPhase: null,     // 'approach' | 'duel'
    dragonState: null,    // { hp, maxHp, shields:[{el,strength}] } — the persistent dragon
    approachOutcomes: [], // outcome of each of the 2 approach beats (both Complete → crack a shield)
    duelBeat: 0,          // duel beat counter (for the log)
    duelResult: null,     // stashed resolution carried across the staged reveal into finishDuel
    defeatMsg: null,
    pendingEvent: false, // a Complete/Narrow journey owes an Event this turn
    event: null,         // active event state { id, step, opt, targetId, wantElement, lines }
    // ---- cross-turn event effects (run layer) ----
    curseNextFight: false, // Cache/Mirror Fen: force a Hardship on the next fight
    paceBless: 0,          // Gray Pilgrim/Mirror Fen: +2 Pace on this many upcoming journeys
    emberShield: false,    // Ember Hollow: your Arsenal survives Nightfall (rest of region)
    logEntries: [], // [{header, lines:[{text, cls}]}], newest first
  };
  draw(HAND_SIZE);
  nextTurn();
  // the Dragon is fully revealed from turn 1 — the run's reference frame
  log(`🐉 Beyond Region 4 waits ${S.dragon.name} — ${S.dragon.element}, armored ${S.dragon.armor.map(a => `${a.v} ${a.el}`).join(' / ')}, unarmored against ${dragonWeakness(S.dragon).join(' & ')}.`);
  render();
}

// always-available restart (header button) — guarded so a run isn't wiped by a mis-tap
function newGame() {
  if (confirm('Start a new run? Your current run will be lost.')) freshGame();
}

function nextRegion() {
  if (S.region >= REGIONS.length) { freshGame(); return; }
  // reshuffle everything non-trashed, keep levels
  const pool = shuffle([...S.deck, ...S.discard, ...S.hand]);
  S.region++;
  S.deck = pool;
  S.hand = [];
  S.discard = [];
  S.emberShield = false; // the Ember Hollow ward lasts only the region it was banked in
  S.encounterQueue = shuffle(REGIONS[S.region - 1].encounters);
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
    // `ev` (the old Attuned value, column 2) is DEAD DATA - power comes from pile depth now
    init, boost: boost + charmMod('boost', d.element), armor: Math.max(0, armor + am), cost,
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
  cmp('💨', a.init, b.init);
  cmp('➕', a.boost, b.boost);
  cmp('🛡️', a.armor, b.armor);
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
// side of the pair: fuse your Spell to want what you hold, or fuse a card to become the match.
function enhElOf(card) { return elOf(card); }

// one action set for every turn — normal turns, the Approach, and the Duel all share it
function activeZones() { return ZONES; }
function isAssignPhase() { return S.phase === 'assign'; }
function zoneOf(cardId) {
  if (pileIds().includes(cardId)) return 'Spell';
  return SLOTS.find(z => S.assign[z] === cardId) || null;
}

// fusing no longer changes an element - it buries a card's VALUE under another (see canFuse)
function elOf(card) { return card.def.element; }
function isFuseBottom(cardId) { return !!(S.fuse && S.fuse.bottomId === cardId); }

// ============================================================
// logging
// ============================================================
function logHeader(text) { S.logEntries.unshift({ header: text, lines: [] }); }
function log(text, cls = '') { S.logEntries[0].lines.push({ text, cls }); }

// ============================================================
// turn flow
// ============================================================
function drawEncounter(avoidType) {
  const region = REGIONS[S.region - 1];
  if (S.encounterQueue.length === 0) S.encounterQueue = shuffle(region.encounters);
  // normal turns take the next in the shuffled bag; Divert steers toward a DIFFERENT
  // type (its whole purpose) — falling back to next-in-bag only if the bag has no other type left.
  let idx = 0;
  if (avoidType) {
    const diff = S.encounterQueue.findIndex(e => e.type !== avoidType);
    if (diff !== -1) idx = diff;
  }
  S.encounter = S.encounterQueue.splice(idx, 1)[0];
  if (S.encounterQueue.length === 0) S.encounterQueue = shuffle(region.encounters);
  S.boostTarget = S.encounter.type === 'fight' ? 'Attack' : 'Move';
  S.rangedDodge = false;
  // roll a Hardship (density rises with the region)
  let list = S.encounter.type === 'fight' ? FIGHT_HARDSHIPS : JOURNEY_HARDSHIPS;
  // Night Travel (wants low-Init Catalysts) never pairs with Ranged (punishes low Init
  // twice: early hit + dodge only works when winning initiative) — lose-lose, no puzzle
  if (S.encounter.ability === 'Ranged') list = list.filter(h => h !== 'Night Travel');
  S.hardship = Math.random() < region.hardshipChance ? list[Math.floor(Math.random() * list.length)] : null;
  // a Cache/Mirror Fen ward: the next FIGHT carries a Hardship whether the region rolled one or not
  if (S.curseNextFight && S.encounter.type === 'fight') {
    if (!S.hardship) S.hardship = list[Math.floor(Math.random() * list.length)];
    S.curseNextFight = false;
  }
}

function logChallenge() {
  const e = S.encounter;
  if (e.type === 'fight') {
    log(`CHALLENGE: Fight — ${e.name} (HP ${e.hp} · Init ${e.init} · Atk ${e.atk} ${e.atkEl} · Armor ${e.armor.length ? e.armor.map(a => `${a.v} ${a.el}`).join(' / ') : '—'} · XP ${e.xp})`);
    if (e.ability) log(`ABILITY — ${e.ability}: ${ABILITIES[e.ability]}`, 'bad');
  } else {
    log(`CHALLENGE: Journey — ${e.name} (MP ${e.mp} · Nightfall ${e.nightfall} · Time Penalty ${e.timePenalty} · Element ${e.element || '—'} · XP ${e.xp})`);
    if (e.peril) log(`PERIL — ${e.peril}: ${PERILS[e.peril]}`, 'bad');
  }
  if (S.hardship) log(`HARDSHIP — ${S.hardship}: ${HARDSHIPS[S.hardship]}`, 'bad');
}

function nextTurn() {
  S.turn++;
  drawEncounter();
  S.assign = { Spell: null, Element: null, Boost: null, Reserve: null };
  S.fuse = null;
  S.divertsUsed = 0;
  S.diverting = false;
  S.loseReserve = null;
  S.afterSoak = 'upgrade';
  // coins roll over between turns — deliberately NOT reset
  S.damage = 0;
  S.damageEl = null;
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
  // the discarded card leaves any role/fuse it was part of
  for (const z of ZONES) if (S.assign[z] === cardId) S.assign[z] = null;
  S.assign.Reserve = null; // hand shrank — reserve re-normalizes (or is gone)
  if (S.fuse && (S.fuse.topId === cardId || S.fuse.bottomId === cardId)) S.fuse = null;
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
  if (zone === 'Reserve' && S.fuse) { dragId = null; return; } // fusing consumes the would-be Reserve
  assignRole(dragId, zone); // swaps with whoever holds that role
  dragId = null;
}

// ---------- fusing: BURY one card under another ----------
// The top card keeps everything it is - element, Initiative, Boost, armour - and gains the buried
// card's VALUE. So a fuse smuggles an off-element card's value into the pile, once per encounter.
// No element requirement any more: that rule existed when fusing CHANGED an element, and under the
// pile it would forbid the only use fusing has. It self-limits - burying two same-element cards is
// strictly worse than pouring both into the pile, so the maths makes this a cross-element tool.
function canFuse(bottomId, topId) {
  if (S.phase !== 'assign' || S.fuse || bottomId === topId) return false;
  return !!(cardById(bottomId) && cardById(topId));
}

function fuseOver(ev, topId) {
  if (dragId == null || !canFuse(dragId, topId)) return;
  ev.preventDefault();
  ev.stopPropagation();
  ev.currentTarget.classList.add('fuse-over');
}

function fuseLeave(ev) { ev.currentTarget.classList.remove('fuse-over'); }

function fuseDrop(ev, topId) {
  if (dragId == null || !canFuse(dragId, topId)) return;
  ev.preventDefault();
  ev.stopPropagation();
  S.fuse = { topId, bottomId: dragId };
  dragId = null;
  normalizeAssign(); compactSlots(); // the consumed card frees its slot; close the gap
  render();
}

function unfuse() { if (S.phase === 'assign') { S.fuse = null; render(); } }

// ---------- the slot row: select a card, then swap it with another (or with a role) ----------
function tapCard(id) {
  if (!isAssignPhase() || S.diverting) return;
  // fuse mode (armed via the Fuse button): the next card tapped is buried under this one
  if (S.fuseArm && S.selectedId != null && S.selectedId !== id && canFuse(S.selectedId, id)) {
    S.fuse = { topId: id, bottomId: S.selectedId };
    S.selectedId = null; S.fuseArm = false;
    normalizeAssign(); compactSlots(); // the consumed card frees its slot; close the gap
    render();
    return;
  }
  S.fuseArm = false;
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
  S.selectedId = null; S.fuseArm = false;
  const from = zoneOf(cardId);
  if (from === role && role !== 'Spell') { render(); return; }
  if (role === 'Spell') {
    if (from === 'Spell' || !canPour(cardId)) { render(); return; }  // the pile is one element
    removeFromZone(cardId);
    S.assign.Spell.push(cardId);
  } else {
    const occupant = S.assign[role] || null;
    removeFromZone(cardId);
    S.assign[role] = cardId;
    // the displaced card takes the mover's old seat if it had one, else normalizeAssign re-seats it
    if (occupant && occupant !== cardId) {
      if (from && from !== 'Spell') S.assign[from] = occupant;
      else removeFromZone(occupant);
    }
  }
  normalizeAssign();
  render();
}
function setBoostTarget(t) { if (S.phase === 'assign') { S.boostTarget = t; render(); } }
function armFuse(cardId) { if (isAssignPhase()) { S.selectedId = cardId; S.fuseArm = true; render(); } }
function cancelFuseArm() { S.fuseArm = false; S.selectedId = null; render(); }

function tapZone(zone) {
  if (!isAssignPhase() || S.selectedId == null) return;
  if (zone === 'Reserve' && S.fuse) return;
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
function normalizeAssign() {
  if (!isAssignPhase()) return;
  if (!Array.isArray(S.assign.Spell)) S.assign.Spell = S.assign.Spell ? [S.assign.Spell] : [];
  S.assign.Spell = pileIds().filter(id => !isFuseBottom(id));
  for (const z of SLOTS) if (S.assign[z] && (!cardById(S.assign[z]) || isFuseBottom(S.assign[z]))) S.assign[z] = null;
  // default seating is WIDE: one card in the pile, the rest across the slots. Pouring deeper
  // is always the player's deliberate act, never something the layout does for them.
  const seated = new Set([...pileIds(), ...SLOTS.map(z => S.assign[z]).filter(Boolean)]);
  for (const card of S.hand) {
    if (seated.has(card.id) || isFuseBottom(card.id)) continue;
    seated.add(card.id);
    if (!S.assign.Spell.length) { S.assign.Spell = [card.id]; continue; }
    const free = SLOTS.find(z => !S.assign[z]);
    if (free) S.assign[free] = card.id;
    else if (canPour(card.id)) S.assign.Spell.push(card.id);
  }
}

// pull the single-slot cards leftward so there's no gap mid-row
function compactSlots() {
  const ids = SLOTS.map(z => S.assign[z]).filter(Boolean);
  SLOTS.forEach((z, i) => { S.assign[z] = ids[i] || null; });
}

// the only requirement is that something is in the pile - empty slots are a legal, costly choice
function rolesValid() { return pileIds().length > 0; }

// ---------- action math (pure) ----------
// Computes the current Action Set vs the current encounter. Used by BOTH the
// live preview and resolve() so the two can never disagree.
function computeAction(reserve) {
  const e = S.encounter;
  const pile = pileCards();
  if (!pile.length || !e) return null;
  const spell = pile[0];                       // names the spell; the pile's element is its verb
  const elem = cardById(S.assign.Element);
  const boostC = cardById(S.assign.Boost);
  const spellEl = pileElement();
  // ATTUNING / RESONANCE are GONE. Power comes from DEPTH: every card poured into the pile adds
  // its value, and a poured card is a slot left empty. That is the whole decision.
  const depth = pile.length;
  const pileVal = pile.reduce((t, c) => t + cardValue(c), 0);
  const enhEl = spellEl, isEnh = false, enhUsed = false, resonant = false;
  const boostVal = boostC ? eff(boostC).boost : 0;

  const h = S.hardship;
  const ability = e.ability || null;
  const elemInit = elem ? eff(elem).init : 0;
  // Night Travel: Boost reduced by the Catalyst's Initiative, min 0
  const boostEff = h === 'Night Travel' ? Math.max(0, boostVal - elemInit) : boostVal;
  const nightCut = boostVal - boostEff;

  if (e.type === 'fight') {
    const init = elemInit + charmMod('init');   // Initiative belongs to the Catalyst alone
    const initLost = e.init > init;
    // Ranged deals Early Damage even when you win initiative, unless dodged (Arsenal cost)
    const rangedHits = ability === 'Ranged' && !initLost && !S.rangedDodge;
    let early = initLost || rangedHits ? e.atk : 0;
    if (h === 'Ambush') early *= 2;
    const wrongType = false;
    const base = pileVal;
    const withBoost = base + boostEff;
    // enemy armor is a LIST of elements; it bites the element your PILE is made of
    const armorHit = (e.armor || []).find(a => a.el === spellEl);
    const armorCut = armorHit ? armorHit.v : 0;
    let value = Math.max(0, withBoost - armorCut);
    // 'Slow' CUT with the Attack/Move split - it only meant "compare your other value", and
    // there is no other value now. Abilities get revisited wholesale at shaped defence.
    const half = Math.ceil(e.hp / 2);
    const outcome = value >= e.hp ? 'Complete' : value >= half ? 'Narrow' : 'Loss';
    const combatDmg = outcome !== 'Complete' ? e.atk : 0;
    const timePenalty = h === 'Hazards' ? (early > 0 ? 1 : 0) + (combatDmg > 0 ? 1 : 0) : 0;
    const stormDmg = h === 'Storm' ? timePenalty : 0;
    let loseReserve = null;
    // the dodge only costs the Arsenal when it actually cancels the ranged hit (you won initiative)
    if (ability === 'Ranged' && S.rangedDodge && !initLost) loseReserve = 'dodged the Ranged attack';
    if (ability === 'Freeze' && early > 0) loseReserve = 'Frozen (took Early Damage)';
    const poison = ability === 'Poison' ? (early > 0 ? 1 : 0) + (combatDmg > 0 ? 1 : 0) : 0;
    return { type: 'fight', spell, pile, depth, elem, boostC, boostVal, boostEff, nightCut, resonant, spellEl, enhEl, isEnh, enhUsed, wrongType,
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
  const loseReserve = nightCaught && reserve && !S.emberShield ? 'caught by Nightfall' : null;
  return { type: 'journey', spell, pile, depth, elem, boostC, boostVal, boostEff, nightCut, resonant, spellEl, enhEl, isEnh, enhUsed, wrongType,
           base, withBoost, reserveBonus, value, mpEff, half, outcome, reserve, early: 0, combatDmg: 0,
           pace, nightfall, nightCaught, paceBless, emberShielded, peril, steepAdd, treacherousDmg,
           timePenalty, stormDmg, loseReserve, poison: 0, ability: null, hardship: h };
}

// ---------- Phase 2/3: resolve action, queue penalties ----------
function resolve() {
  if (!rolesValid()) return;
  const e = S.encounter;
  const pile = pileCards();
  const spell = pile[0];
  const elem = cardById(S.assign.Element);
  const boostC = cardById(S.assign.Boost);
  S.actionSetIds = [...pile, elem, boostC].filter(Boolean).map(c => c.id);
  if (S.fuse) {
    const top = cardById(S.fuse.topId), bottom = cardById(S.fuse.bottomId);
    S.actionSetIds.push(S.fuse.bottomId); // the fused bottom is spent with the Action Set
    log(`Fused: ${bottom.def.name} slid behind ${top.def.name} → ${top.def.name} counts as ${S.fuse.element} this encounter. No Reserve this turn.`);
  }
  const reserve = S.fuse ? null : (cardById(S.assign.Reserve) || S.hand.find(c => !S.actionSetIds.includes(c.id)) || null);
  S.reserveId = reserve ? reserve.id : null;
  const boostVal = boostC ? eff(boostC).boost : 0;

  const r = computeAction(reserve);

  log(`The weave — Spell: ${r.spellEl} ×${r.depth} (${r.pile.map(x => displayName(x)).join(' + ')}) = ${r.base}` +
      ` · Catalyst: ${elem ? `${elem.def.name} (${elem.def.wild ? 'Wild' : elOf(elem) || 'colorless'}, Init ${eff(elem).init})` : '—'}` +
      ` · Surge: ${boostC ? `${boostC.def.name} (+${boostVal} → ${S.boostTarget})` : '—'}` +
      ` · Arsenal: ${reserve ? reserve.def.name : '—'}`);

  // ---- build the staged reveal (numbers only appear AFTER you commit) ----
  const L = (text, cls = '') => ({ text, cls });
  const beats = [];

  if (r.type === 'fight') {
    const b1 = [];
    if (r.nightCut > 0) b1.push(L(`Night Travel: Boost reduced by your Catalyst's Initiative (${boostVal} − ${elem ? eff(elem).init : 0}) → +${r.boostEff}`, 'bad'));
    if (r.enhUsed) b1.push(L(`Attack: Catalyst ${elem.def.wild ? `(Wild) supplies ${r.enhEl}` : `${elOf(elem)} matches`} → ${spell.def.name} ATTUNES: ${r.enhEl} Atk ${r.base}`, 'good'));
    else b1.push(L(`Attack: basic Atk ${r.base}`));
    if (S.boostTarget === 'Attack' && boostC) b1.push(L(`Boost: +${r.boostEff} → Attack ${r.withBoost}`));
    if (r.armorCut) b1.push(L(`Armor: it shields ${r.enhEl} — your Attuned strike is turned → −${r.armorCut} = ${r.value}`, 'bad'));
    beats.push({ label: '⚔️ ATTACK', big: r.value, vs: `vs ❤️ ${e.hp} (half ${r.half})`, numCls: r.enhUsed ? 'enh' : '', lines: b1 });

    const b2 = [];
    if (r.initLost) b2.push(L(`Initiative: yours ${r.init} vs enemy ${e.init} → enemy is faster → Early Damage ${e.atk}`, 'bad'));
    else if (r.rangedHits) b2.push(L(`Initiative: yours ${r.init} vs enemy ${e.init} → you act first, but RANGED hits anyway → Early Damage ${e.atk}`, 'bad'));
    else b2.push(L(`Initiative: yours ${r.init} vs enemy ${e.init} → you act first, no Early Damage${e.ability === 'Ranged' && S.rangedDodge ? ' (Ranged dodged — your Arsenal will be discarded)' : ''}`, 'good'));
    if (r.early > 0 && S.hardship === 'Ambush') b2.push(L(`Ambush: Early Damage doubled → ${r.early}`, 'bad'));
    beats.push({ label: '💨 INITIATIVE', big: r.init, vs: `vs ${e.init}`, numCls: r.early ? 'bad' : 'ok', lines: b2 });

    beats.push({ outcomeBeat: true, final: true, lines: [
      L(`Attack ${r.value} vs HP ${e.hp} (half = ${r.half}) → ${r.outcome.toUpperCase()} ${r.outcome !== 'Loss' ? `· +${e.xp} XP` : ''}${r.outcome !== 'Complete' ? ` · Combat Damage ${e.atk}` : ''}`,
        r.outcome === 'Loss' ? 'bad result' : r.outcome === 'Narrow' ? 'result' : 'good result'),
    ] });
  } else {
    const b1 = [];
    if (r.nightCut > 0) b1.push(L(`Night Travel: Boost reduced by your Catalyst's Initiative (${boostVal} − ${elem ? eff(elem).init : 0}) → +${r.boostEff}`, 'bad'));
    if (r.steepAdd) b1.push(L(`Steep: MP raised by your Arsenal's Boost → ${e.mp} + ${r.steepAdd} = ${r.mpEff}`, 'bad'));
    if (r.enhUsed) b1.push(L(`Move: Catalyst ${elem.def.wild ? `(Wild) supplies ${r.enhEl}` : `${elOf(elem)} matches`} → ${spell.def.name} ATTUNES: Move ${r.base}`, 'good'));
    else b1.push(L(`Move: basic Move ${r.base}`));
    if (boostC && S.boostTarget === 'Move') b1.push(L(`Boost: +${r.boostEff} → Move ${r.withBoost}`));

    beats.push({ label: '👣 MOVE', big: r.value, vs: `vs MP ${r.mpEff}${r.steepAdd ? ` (${e.mp}+${r.steepAdd} Steep)` : ''} (half ${r.half})`, numCls: r.enhUsed ? 'enh' : '', lines: b1 });

    const b2 = [];
    if (r.paceBless) b2.push(L(`Gray Pilgrim's blessing: +2 Pace → ${r.pace}`, 'good'));
    if (r.nightCaught && r.emberShielded) b2.push(L(`Pace: yours ${r.pace} vs Nightfall ${r.nightfall} → caught after dark, but the Ember Hollow wards your Arsenal (${r.reserve.def.name}) — it survives`, 'good'));
    else if (r.nightCaught) b2.push(L(`Pace: yours ${r.pace} vs Nightfall ${r.nightfall} → caught after dark${r.reserve ? ` → the night snuffs your Arsenal (${r.reserve.def.name})` : ' (no Arsenal to lose)'}`, 'bad'));
    else b2.push(L(`Pace: yours ${r.pace} vs Nightfall ${r.nightfall} → home before dark`, 'good'));
    beats.push({ label: '🌙 PACE', big: r.pace, vs: `vs Nightfall ${r.nightfall}`, numCls: r.nightCaught && !r.emberShielded ? 'bad' : 'ok', lines: b2 });

    beats.push({ outcomeBeat: true, final: true, lines: [
      L(`Move ${r.value} vs MP ${r.mpEff} (half = ${r.half}) → ${r.outcome.toUpperCase()} ${r.outcome !== 'Loss' ? `· +${e.xp} XP` : ''}${r.outcome !== 'Complete' ? ` · Time Penalty ${e.timePenalty}` : ''}`,
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
}

function beatDisplayHTML(beat, isNew) {
  const pop = isNew ? ' beat-pop' : '';
  const r = S.pendingR, e = S.encounter;
  if (beat.outcomeBeat) {
    const subs = [];
    subs.push(r.outcome !== 'Loss' ? `<div class="pv-sub good">⭐ +${e.xp} XP</div>` : `<div class="pv-sub bad">no XP</div>`);
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
  if (r.outcome !== 'Loss') { const g = e.xp + charmMod('coin'); S.coins += g; log(`+${g} coins (you now hold ${S.coins})`, 'good'); }
  let damage = r.early + r.combatDmg + (r.treacherousDmg || 0);
  if (r.treacherousDmg) log(`Treacherous: no Complete Victory → +${r.treacherousDmg} damage`, 'bad');
  if (r.stormDmg > 0) { damage += r.stormDmg; log(`Storm: Time Penalties also deal ${r.stormDmg} damage`, 'bad'); }
  if (r.loseReserve) S.loseReserve = r.loseReserve;
  if (r.poison > 0) S.poison = r.poison;
  S.damageEl = r.type === 'fight' ? e.atkEl : null; // its damage carries its attack element (source data)
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
  return armor + charmMod('soak', card.def.element);
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
    log(`${card.def.name} was Level 1 → TRASHED (gone for the game)${why}`, 'bad');
  } else {
    card.level--;
    log(`${card.def.name} downgraded to Lv${card.level}${why}`, 'bad');
  }
}

function soakWith(cardId) {
  const card = cardById(cardId);
  if (!card || S.downgraded.has(card.id) || S.damage <= 0) return;
  const soak = soakValue(card);
  const armor = eff(card).armor || 0;
  const doubled = soak > armor;
  downgrade(card, `, soaking ${soak}${doubled ? ` (armor ${armor} ×2 — its element matches the enemy attack)` : ''}`);
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
  const roll = Math.random();
  const heldCharms = S.charms || [];
  const pool = CHARMS.filter(c => !heldCharms.includes(c.id) &&
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
  const up = owned.filter(c => c.level < MAX_LEVEL);
  if (!up.length) return { kind: 'none', name: 'Nothing here', text: 'Nothing to be had this spin', rarity: 'common', cost: 0 };
  const c = rand(up);
  return { kind: 'upgrade', cardId: c.id, name: c.def.name,
           text: `${c.def.name} → Lv${c.level + 1}<div class="wo-delta">${levelDeltaText(c)}</div>`, rarity: 'common', cost: eff(c).cost || 2 };
}

function spinWheel(rich) {
  const offers = [rollOffer(rich), rollOffer(rich), rollOffer(rich)];
  // 🎰 THE MATCH JACKPOT (Thomas's idea): the same card twice in one spin = half price
  const seen = {};
  for (const o of offers) if (o.cardId) seen[o.cardId] = (seen[o.cardId] || 0) + 1;
  for (const o of offers) {
    if (o.cardId && seen[o.cardId] > 1) { o.match = true; o.cost = Math.max(1, Math.floor(o.cost / 2)); }
  }
  return offers;
}

function startUpgrade() { startWheel(false); }

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
    log(`${o.kind === 'repair' ? 'Mended' : 'Upgraded'} ${card.def.name} to Lv${card.level}${o.match ? ' (matched pair — half price!)' : ''} (−${o.cost} coins)`, 'good');
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
function pouredIds() {
  const ids = pileIds().slice();
  if (S.fuse && ids.includes(S.fuse.topId)) ids.push(S.fuse.bottomId);
  return ids;
}

function endTurn() {
  const spentIds = pouredIds();
  const poured = S.hand.filter(c => spentIds.includes(c.id));
  S.hand = S.hand.filter(c => !poured.includes(c));
  S.discard.push(...poured);
  const returning = S.hand.slice();
  if (returning.length > 1) { startStack(returning, poured.length); return; }
  finishCleanup(returning, poured.length, false);
}

// 🃏 THE STACK - you choose the order your returning cards come back in, so you aren't dealt
// next turn's hand, you write it.
function startStack(cards, spentCount) {
  S.stack = { ids: cards.map(c => c.id), order: [], spent: spentCount };
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
  S.stack = null;
  finishCleanup(ordered, spent, true);
}

function finishCleanup(returning, spentCount, ordered) {
  S.hand = S.hand.filter(c => !returning.includes(c));
  S.deck.push(...returning);
  const before = S.hand.length;
  draw(HAND_SIZE - S.hand.length);
  log(`Cleanup: ${spentCount} spent on the spell — gone. ` +
      (returning.length ? `${returning.map(c => displayName(c)).join(', ')} slide under the deck` +
        `${ordered && returning.length > 1 ? ' in your order' : ''}. ` : '') +
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
  // end of region?
  if (S.hand.length + S.deck.length < REGION_END_THRESHOLD) {
    if (S.region >= REGIONS.length) log(`Fewer than ${REGION_END_THRESHOLD} Mage Cards remain → REGION 4 CLEARED. THE ${S.dragon.name.toUpperCase()} AWAITS.`, 'result');
    else log(`Fewer than ${REGION_END_THRESHOLD} Mage Cards remain → END OF REGION ${S.region}`, 'result');
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
function evLevel(card, delta) {
  if (delta > 0) {
    if (card.level >= MAX_LEVEL) return `${card.def.name} already burns as bright as it can — nothing changes.`;
    card.level++; return `${card.def.name} brightens to Lv${card.level}.`;
  }
  if (card.level <= 1) { // Lv1 downgrade = burned out
    S.hand = S.hand.filter(c => c.id !== card.id);
    S.trashed.push(card);
    return `${card.def.name} was Lv1 — it gutters out and is lost.`;
  }
  card.level--; return `${card.def.name} dims to Lv${card.level}.`;
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
function evTrashCard(card) { // "give a page of your book" — permanent deck-thinning
  S.hand = S.hand.filter(c => c.id !== card.id);
  S.trashed.push(card);
  return `${card.def.name} is given away — gone from your book (your deck is thinner).`;
}
const rand = arr => arr[Math.floor(Math.random() * arr.length)];

const EVENTS = [
  { id: 'wayshrine', name: 'The Guttered Wayshrine',
    flavor: "A pilgrim's candle-shrine, long cold. Relight the wick and the old craft repays the warmth — though a greedy flame may draw it from somewhere else.",
    options: [
      { label: 'Relight it — a card brightens (a greedy flame might dim another)', need: 'none',
        apply: () => { const up = rand(S.hand); const lines = [evLevel(up, +1)];
          if (Math.random() < 0.35 && S.hand.length > 1) { const dn = rand(S.hand.filter(c => c.id !== up.id)); lines.push('The flame takes its due — ' + evLevel(dn, -1)); }
          return lines; } },
      { label: 'Leave it dark — nothing', need: 'none', apply: () => ['You leave the wick cold and travel on.'] },
    ] },
  { id: 'chandler', name: "The Chandler's Rest",
    flavor: "A woodcutter's hut, the hearth still warm. A night here is enough to mend a frayed tool.",
    options: [
      { label: 'Mend a card — +1 level', need: 'card', apply: ({ card }) => evLevel(card, +1) },
    ] },
  { id: 'kiln', name: 'The Kiln of Trials',
    flavor: "An old firing-kiln, its coals banked low. Temper a card here and it comes out changed — hardened, or cracked.",
    options: [
      { label: 'Temper a card — likely +1 level; it might crack (−1)', need: 'card',
        apply: ({ card }) => Math.random() < 0.7 ? ('It hardens. ' + evLevel(card, +1)) : ('It cracks! ' + evLevel(card, -1)) },
      { label: 'Leave it cold — nothing', need: 'none', apply: () => ['You bank the coals and travel on.'] },
    ] },
  { id: 'cache', name: 'The Buried Cache',
    flavor: "A cartographer's mark scratched on a stone — someone buried something here, and warded it.",
    options: [
      { label: 'Dig it up — likely a windfall, but the ward may bite your next fight', need: 'none',
        apply: () => { const lines = evUpgradeRandom(2); if (Math.random() < 0.35) lines.push(evCurseNextFight()); return lines; } },
      { label: 'Mark it and move on — a small, safe find', need: 'none', apply: () => evUpgradeRandom(1) },
    ] },
  { id: 'pilgrim', name: 'The Gray Pilgrim',
    flavor: "A hooded traveler shares your fire. He asks for a page of your book, and blesses the road ahead.",
    options: [
      { label: 'Give a card — +2 Pace on your next two journeys (the card is gone for good)', need: 'card',
        apply: ({ card }) => { const t = evTrashCard(card); S.paceBless = 2; return [t, 'The road ahead is blessed — +2 Pace on your next two journeys.']; } },
      { label: 'Keep your book — nothing', need: 'none', apply: () => ['You keep your pages close and travel on.'] },
    ] },
  { id: 'hollow', name: 'The Ember Hollow',
    flavor: "A hollow where one coal never dies. Bank your light here and the dark can't take it.",
    options: [
      { label: 'Bank your Arsenal — the night cannot snuff it for the rest of this region', need: 'none',
        apply: () => { S.emberShield = true; return [`Your Arsenal is warded — Nightfall cannot take it for the rest of ${REGIONS[S.region - 1].name}.`]; } },
      { label: 'Leave the coal — nothing', need: 'none', apply: () => ['You leave the coal banked and travel on.'] },
    ] },
  { id: 'toll', name: 'The Toll of Thorns',
    flavor: "A bramble-wall across the path. Force through and it takes something; or spend the time to find a way around.",
    options: [
      { label: 'Cut through — a card you choose loses a level, but two others brighten', need: 'card',
        apply: ({ card }) => { const lines = ['You force the thorns — ' + evLevel(card, -1)]; lines.push('but win through to easier ground:', ...evUpgradeRandom(2, card.id)); return lines; } },
      { label: 'Turn back, find another way — nothing lost, nothing gained', need: 'none', apply: () => ['You take the long way around, unscathed.'] },
    ] },
  { id: 'mirror', name: 'The Mirror Fen',
    flavor: "The fen shows things that aren't there yet — you can't tell if it's a gift or a warning.",
    options: [
      { label: 'Look into the fen — something happens (you cannot tell what)', need: 'none',
        apply: () => { const roll = Math.floor(Math.random() * 4);
          if (roll === 0) return ['The fen gives.', ...evUpgradeRandom(2)];
          if (roll === 1) return ['The fen takes. ' + evCurseNextFight()];
          if (roll === 2) return ['The fen gives, a little.', ...evUpgradeRandom(1)];
          S.paceBless = 1; return ['A glimpse of the road ahead — +2 Pace on your next journey.']; } },
      { label: 'Look away — nothing', need: 'none', apply: () => ['You look away before it shows you too much.'] },
    ] },
];
function currentEventDef() { return EVENTS.find(e => e.id === S.event.id); }

function startEvent() {
  if (S.hand.length === 0) { finishRegionCheck(); return; } // nothing to act on
  const def = rand(EVENTS);
  S.event = { id: def.id, step: 'options', opt: null, targetId: null, wantElement: false, lines: null };
  S.phase = 'event';
  logHeader(`✦ ${def.name}`);
  log(def.flavor);
  render();
}
function eventChoose(i) {
  const opt = currentEventDef().options[i];
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
const ART = {
  // the mage, seen from behind — the pointed hat is the readable shape (and the brand)
  mage: `<svg viewBox="0 0 500 400" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <path d="M330 40 C280 110 250 175 238 232 L142 232 C158 160 210 80 330 40 Z"/>
    <ellipse cx="196" cy="238" rx="128" ry="27"/>
    <path d="M60 400 C78 320 130 268 196 268 C262 268 314 320 332 400 Z"/>
  </svg>`,
  dragon: `<svg viewBox="0 0 800 480" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
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
  beast: `<svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
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
  el.innerHTML =
    `<div class="scene-glow"></div><div class="scene-floor"></div>` +
    foe +
    `<div class="mage" id="mage-slot" data-anim="mage">${ART.mage}</div>` +
    `<div class="scene-name">${duel ? S.dragon.name : e ? e.name : ''}</div>` +
    `<div class="scene-vig"></div>`;
}

function render() {
  normalizeAssign();
  saveGame();
  document.body.className = 'phase-' + S.phase;   // lets CSS emphasise per phase (e.g. armor during soak)
  $('turn-indicator').textContent = S.finalMode ? `🐉 THE FINAL BATTLE` : `Region ${S.region} · Turn ${S.turn}`;
  renderStatus();
  renderScene();
  renderEncounter();
  renderControls();
  renderSlots();
  renderLog();
}

function renderStatus() {
  const key = S.deck[0];
  $('status-bar').innerHTML =
    `<span>🐉 <b>${S.dragon.name}</b> ${elIcon(S.dragon.element)} · 🛡️ ${armorText(S.dragon.armor)} · unarmored vs ${dragonWeakness(S.dragon).map(elIcon).join('')}</span>` +
    (S.finalMode ? '' : `<span>🗺️ <b>${REGIONS[S.region - 1].name}</b> (${S.region}/${REGIONS.length})</span>`) +
    `<span>Deck: <b>${S.deck.length}</b></span>` +
    `<span>Discard: <b>${S.discard.length}</b></span>` +
    `<span>Trashed: <b>${S.trashed.length}</b></span>` +
    `<span>Next draw: <b>${key ? `${key.def.name} Lv${key.level}` : '—'}</b></span>` +
    `<span>🪙 <b style="color:#c9b458">${S.coins}</b></span>` +
    (S.charms.length ? `<span>🎁 <b>${S.charms.length}</b></span>` : '') +
    `<span>Results: <b class="good">${S.results.Complete}C</b> / <b>${S.results.Narrow}N</b> / <b>${S.results.Loss}L</b></span>`;
}

function renderEncounter() {
  const e = S.encounter;
  const panel = $('encounter-panel');
  if (S.finalMode && S.phase !== 'defeat' && S.phase !== 'victory') {
    const ds = S.dragonState;
    const hpPct = ds ? Math.max(0, Math.round(100 * ds.hp / ds.maxHp)) : 100;
    const shieldChips = ds && ds.shields.length
      ? ds.shields.map(s => `<span class="dshield el el-${s.el} ${s.strength === 0 ? 'broken' : ''}">${elIcon(s.el)} ${s.strength > 0 ? s.strength : '✗'}</span>`).join(' ')
      : '<span class="dim">unshielded</span>';
    const dragonBar =
      `<div class="dragon-hp"><div class="dragon-hp-fill" style="width:${hpPct}%"></div>` +
      `<span class="dragon-hp-label">🐉 ${S.dragon.name} — ${ds ? ds.hp : S.dragon.hp} / ${ds ? ds.maxHp : S.dragon.hp} HP</span></div>` +
      `<div class="dragon-shields">🛡️ ${shieldChips} <span class="dim">· 💨 Init ${S.dragon.init} · breath ${S.dragon.breath} (unarmored vs ${dragonWeakness(S.dragon).map(elIcon).join('')})</span></div>`;
    if (S.finalPhase === 'duel') {
      panel.className = 'fight';
      panel.innerHTML =
        `<div class="enc-type">🐉 THE DUEL — beat ${S.duelBeat}</div>` + dragonBar +
        `<div class="enc-hint">Attune INTO a live shield to crack it (overflow wounds HP); an unshielded or broken element takes the full strike; unattuned bypasses shields for a small sure hit.</div>`;
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
        `<span>Element ${elChip(e.element)}</span></div>` +
        `<div class="enc-hint">Complete BOTH approach beats to shatter the ${S.dragon.name}'s weakest shield before the duel begins.</div>` : '');
    return;
  }
  if (S.phase === 'summary' || S.phase === 'defeat' || S.phase === 'victory' || !e) { panel.innerHTML = ''; panel.className = ''; return; }
  panel.className = e.type;
  const modLines =
    (e.ability ? `<div class="enc-mod">☠️ <b>${e.ability}</b> — ${ABILITIES[e.ability]}</div>` : '') +
    (e.peril ? `<div class="enc-mod">⛰️ <b>${e.peril}</b> — ${PERILS[e.peril]}</div>` : '') +
    (S.hardship ? `<div class="enc-mod">⚠️ <b>${S.hardship}</b> — ${HARDSHIPS[S.hardship]}</div>` : '');
  if (e.type === 'fight') {
    panel.innerHTML =
      `<div class="enc-type">FIGHT — ${REGIONS[S.region - 1].name}</div><div class="enc-name">${e.name}</div>` +
      `<div class="enc-stats"><span>❤️ HP <b>${e.hp}</b> (half ${Math.ceil(e.hp / 2)})</span>` +
      `<span>💨 Init <b>${e.init}</b></span><span>⚔️ Atk <b>${e.atk}</b></span>` +
      `<span>🛡️ ${e.armor.length ? armorText(e.armor) : '—'}</span>` +
      `<span>strikes with ${elIcon(e.atkEl)}</span>` +
      `<span>⭐ XP <b>${e.xp}</b></span></div>` + modLines;
  } else {
    panel.innerHTML =
      `<div class="enc-type">JOURNEY — ${REGIONS[S.region - 1].name}</div><div class="enc-name">${e.name}</div>` +
      `<div class="enc-stats"><span>👣 MP <b>${e.mp}</b> (half ${Math.ceil(e.mp / 2)})</span>` +
      `<span>🌙 Nightfall <b>${e.nightfall}</b></span>` +
      `<span>⏳ Time Penalty <b>${e.timePenalty}</b></span>` +
      `<span>Element ${elChip(e.element)}</span><span>⭐ XP <b>${e.xp}</b></span></div>` +
      (e.element
        ? `<div class="enc-hint">💡 A Attuned ${elIcon(e.element)} ${e.element} Move also adds your Arsenal's Boost.</div>`
        : `<div class="enc-hint">No element — no Arsenal bonus here.</div>`) +
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
    let boostRow = '';
    if (S.encounter.ability === 'Ranged') {
      boostRow += `<div style="margin:6px 0"><label class="radio"><input type="checkbox" ${S.rangedDodge ? 'checked' : ''} ` +
        `onchange="S.rangedDodge=this.checked; render()"> ☠️ Dodge the Ranged attack — your Arsenal is discarded in Cleanup</label></div>`;
    }
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
    const howto =
      `<details class="howto"><summary>How to play</summary><div class="hint">` +
      `Your cards sit under the four roles — <b>Spell</b> (your action), <b>Catalyst</b> (casts it), <b>Surge</b> (fuel), <b>Arsenal</b> (the card you keep). <b>Position is the role</b>, so you rearrange by swapping: tap two cards to trade places, or tap a card then tap a role. (Desktop can drag too.)` +
      ` <b>The Spell is a pile:</b> pour in as many cards as you like, but they must all share an <b>element</b>, and every card you pour in is a slot left empty. Deep = a huge hit and no defence; wide = safe and small.` +
      ` A creature takes several <b>beats</b>: between them your spent cards slide back under the deck and you draw fresh, so the Arsenal is the one card you carry into the next exchange — and you choose the <b>order</b> the spent cards return in.` +
      ` <b>Fuse</b> (once per encounter): tap a card, tap <b>Fuse</b>, then tap any other card — the first is buried under the second, which keeps its own element and gains the buried card's value. That is how an off-element card gets into your pile.` +
      `</div></details>`;
    c.innerHTML =
      `<div class="phase-label">${phaseLabel}</div>` +
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
      `<b>${left}</b> left to place. <span class="note">(${S.deck.length} cards ahead of them)</span></div>` +
      // There must ALWAYS be a way forward. Without this the phase had no button at all, so a
      // player who didn't realise every card must be tapped was simply stuck mid-fight.
      `<button class="primary" onclick="finishStack()">${st.order.length ? 'Done — slide them under' : 'Skip — leave the order as it is'}</button>` +
      (st.order.length ? `<button onclick="stackClear()">↺ start over</button>` : '');
  } else if (S.phase === 'soak') {
    c.innerHTML =
      `<div class="phase-label">PHASE 3 — PENALTY</div>` +
      `<div class="hint">Damage to soak: <b style="color:#e08a7a">${S.damage}</b>` +
      (S.damageEl ? ` (${elChip(S.damageEl)} damage)` : '') +
      `. Click a card to Downgrade it (soaks its Armor value). Level 1 cards are Trashed.</div>`;
  } else if (S.phase === 'wheel') {
    if (!S.wheel) S.wheel = { offers: spinWheel(false), rich: false, bought: [] };  // e.g. restored from a save
    const w = S.wheel;
    const canReroll = S.coins >= REROLL_COST;
    const offers = w.offers.map((o, i) => {
      const afford = o.cost <= S.coins && o.kind !== 'none';
      const cls = `wheel-offer r-${o.rarity}${o.bought ? ' bought' : ''}${o.match ? ' matched' : ''}`;
      return `<div class="${cls}">` +
        `<div class="wo-rar">${o.kind === 'charm' ? 'CHARM · ' + o.rarity : o.kind === 'repair' ? 'MEND' : o.kind === 'none' ? '—' : 'UPGRADE'}` +
        `${o.match ? ' · 🎰 MATCHED' : ''}</div>` +
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
      body = `<div class="summary">${ev.lines.map(l => `<p>${l}</p>`).join('')}</div>` +
        `<button class="primary" onclick="eventContinue()">Continue</button>`;
    } else if (ev.step === 'pickCard') {
      // the choice is made ON the cards below — this panel just states the deal
      body = `<div class="hint"><b>${def.options[ev.opt].label}</b><br>Pick the card from your hand below — its stats are right there on it.</div>` +
        `<button onclick="eventCancelPick()">← back</button>`;
    } else {
      body = `<div class="event-flavor">${def.flavor}</div>` +
        `<div class="event-opts">` + def.options.map((o, i) => `<button onclick="eventChoose(${i})">${o.label}</button>`).join('') + `</div>`;
    }
    c.innerHTML = `<div class="phase-label">✦ EVENT — ${def.name}</div><div class="hint">You arrive somewhere as the journey ends.</div>` + body;
  } else if (S.phase === 'defeat') {
    const survivors = [...S.hand, ...S.deck, ...S.discard];
    c.innerHTML =
      `<div class="phase-label">💀 DEFEAT</div>` +
      `<div class="summary"><p>${S.defeatMsg}</p>` +
      `<p>Turns: <b>${S.turn}</b> — Complete <b>${S.results.Complete}</b> · Narrow <b>${S.results.Narrow}</b> · Loss <b>${S.results.Loss}</b> · surviving cards <b>${survivors.length}</b>, trashed <b>${S.trashed.length}</b></p></div>` +
      `<button class="primary" onclick="freshGame()">New Run</button>`;
  } else if (S.phase === 'victory') {
    const survivors = [...S.hand, ...S.deck, ...S.discard];
    const score = survivors.reduce((t, c) => t + c.level, 0);
    c.innerHTML =
      `<div class="phase-label">🏆 THE ${S.dragon.name.toUpperCase()} FALLS — VICTORY</div>` +
      `<div class="summary">` +
      `<p>FINAL SCORE (sum of surviving card levels): <b>${score}</b></p>` +
      `<p>Turns: <b>${S.turn}</b> — Complete <b>${S.results.Complete}</b> · Narrow <b>${S.results.Narrow}</b> · Loss <b>${S.results.Loss}</b> · Trashed: <b>${S.trashed.length}</b>${S.trashed.length ? ` (${S.trashed.map(c => c.def.name).join(', ')})` : ''}</p>` +
      `<table><tr><th>Card</th><th>Level</th></tr>` +
      survivors.sort((a, b) => b.level - a.level).map(c => `<tr><td>${c.def.name}</td><td>Lv${c.level}</td></tr>`).join('') +
      `</table></div>` +
      `<button class="primary" onclick="freshGame()">New Run</button>`;
  } else if (S.phase === 'summary') {
    const survivors = [...S.hand, ...S.deck, ...S.discard];
    const score = survivors.reduce((t, c) => t + c.level, 0);
    const runDone = S.region >= REGIONS.length;
    c.innerHTML =
      `<div class="phase-label">${runDone ? `REGION 4 CLEARED — THE ${S.dragon.name.toUpperCase()} AWAITS` : `END OF REGION ${S.region} — ${REGIONS[S.region - 1].name}`}</div>` +
      `<div class="summary">` +
      `<p>Turns played: <b>${S.turn}</b> — Complete <b>${S.results.Complete}</b> · Narrow <b>${S.results.Narrow}</b> · Loss <b>${S.results.Loss}</b></p>` +
      `<p>Score so far (sum of surviving card levels): <b>${score}</b> · Trashed: <b>${S.trashed.length}</b>${S.trashed.length ? ` (${S.trashed.map(c => c.def.name).join(', ')})` : ''}</p>` +
      `<table><tr><th>Card</th><th>Level</th></tr>` +
      survivors.sort((a, b) => b.level - a.level).map(c => `<tr><td>${c.def.name}</td><td>Lv${c.level}</td></tr>`).join('') +
      `</table></div>` +
      `<button onclick="startWheel(true)">🔥 Make camp — the long wheel (🪙 ${S.coins})</button>` +
      (runDone
        ? `<button class="primary" onclick="beginFinalBattle()">🐉 Face the ${S.dragon.name} — the Dragon Duel</button>` +
          `<button onclick="freshGame()">Restart from scratch</button>`
        : `<button class="primary" onclick="nextRegion()">Enter ${REGIONS[S.region].name} (Region ${S.region + 1}) — reshuffle, keep levels</button>` +
          `<button onclick="freshGame()">Restart from scratch</button>`);
  }
}

// hint shown under each zone label
function zoneHint(zone) {
  const isFight = S.encounter && S.encounter.type === 'fight';
  switch (zone) {
    case 'Spell': return 'pour in — one element, deeper is stronger';
    // under 'surge' the Catalyst is pure speed and the Surge carries the only element check
    case 'Element': return 'Initiative — strike first';
    case 'Boost': return '+power to the spell';
    // mid-fight the Arsenal is the ONLY card that survives the exchange — say so, because
    // that is now the most consequential choice on the row.
    case 'Reserve': return S.fuse ? 'consumed by the Fuse'
      : 'kept for next turn';
  }
}

// ONE row, four fixed labels, cards swap between them. Replaces the old zones + hand panels.
function renderSlots() {
  const panel = $('slots-panel');
  if (S.phase === 'summary' || S.phase === 'defeat' || S.phase === 'victory') { panel.innerHTML = ''; return; }
  const dnd = isAssignPhase();
  const pile = pileCards();
  const total = pile.reduce((t, c) => t + cardValue(c), 0);
  panel.innerHTML = ZONES.map(zone => {
    const isPile = zone === 'Spell';
    const cards = isPile ? pile : [cardById(S.assign[zone])].filter(Boolean);
    const head = `<div class="slot-head"><span class="slot-name">${SLOT_LABEL[zone].toUpperCase()}` +
      (isPile && pile.length > 1 ? ` <span class="pile-depth">×${pile.length} = ${total}</span>` : '') +
      `</span><span class="slot-hint">${zoneHint(zone)}</span></div>`;
    return `<div class="slot slot-${zone} ${cards.length ? 'filled' : ''} ${isPile && pile.length > 1 ? 'deep' : ''}"` +
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
  'Flicker': '✦', 'Sparkstrike': '✷', 'Stormstep': '✥', 'Streamdart': '➶',
  'Unmaking': '⊘', 'Rimeguard': '❈', 'Headlong': '➤', 'Stormglass': '◈',
  'Stonemarch': '⬗', 'Shalewake': '∿', 'Flintdart': '➹', 'Rockfall': '⁂',
  'Trailblaze': '➷', 'Hearthwall': '⌂', 'Updraft': '⇡', 'Smoulder': '✱',
  'Wander Light': '✺',
};
const ACCENT = { Fire: '#ff9e7a', Water: '#9ecfff', Lightning: '#fff29e', Stone: '#cdbe98' };

// role buttons shown on a tapped card — the easy path: tap card → tap a role (no hunting for zones)
const ROLE_BTNS = [['Spell', 'Pour in'], ['Element', 'Catalyst'], ['Boost', 'Surge'], ['Reserve', 'Arsenal']];
function roleButtons(card) {
  const cur = zoneOf(card.id);
  const btns = ROLE_BTNS.map(([role, label]) => {
    if (role === 'Reserve' && S.fuse) return ''; // no Arsenal while fused
    const active = cur === role;
    return `<button class="rolebtn r-${role} ${active ? 'active' : ''}" onclick="event.stopPropagation(); assignRole(${card.id}, '${role}')">${label}${active ? ' ✓' : ''}</button>`;
  }).join('');
  // Fuse — whenever a same-element partner is in the row
  const hasPartner = !S.fuse && card.def.element &&
    S.hand.some(o => o.id !== card.id && !isFuseBottom(o.id) && o.def.element === card.def.element);
  const fuse = hasPartner ? `<button class="rolebtn r-fuse" onclick="event.stopPropagation(); armFuse(${card.id})">Fuse</button>` : '';
  return `<div class="role-bar">${btns}${fuse}</div>`;
}
function fuseArmHint(card) {
  return `<div class="role-bar fuse-arm"><span class="fuse-arm-tip">Tap another ${elIcon(card.def.element)} ${card.def.element} card to fuse into ${card.def.name}</span>` +
    `<button class="rolebtn r-hand" onclick="event.stopPropagation(); cancelFuseArm()">Cancel</button></div>`;
}

function cardHTML(card) {
  const v = eff(card);
  const d = card.def;
  const wasDowngraded = S.downgraded.has(card.id);
  const dnd = isAssignPhase();
  const isFusedTop = S.phase === 'assign' && S.fuse && S.fuse.topId === card.id;
  const shownEl = isFusedTop ? S.fuse.element : d.element;

  // the Attuned line shows what the card becomes when its element is matched
  // No attuned line any more - a card has one value, and pouring it into the pile is what
  // makes it big. If something is buried under it by a Fuse, its value is shown combined.
  const buriedCard = (S.fuse && S.fuse.topId === card.id) ? cardById(S.fuse.bottomId) : null;
  const contributes = cardValue(card);
  const enhLine = buriedCard
    ? `⧉ ${displayName(buriedCard)} buried — +${eff(buriedCard).value}`
    : (d.wild ? '🌈 Wild' : '');
  const forged = '';

  let action = '';
  if (S.diverting) {
    action = `<div class="card-action"><button onclick="divertWith(${card.id})">Discard (Divert)</button></div>`;
  } else if (isFusedTop) {
    const bottom = cardById(S.fuse.bottomId);
    action = `<div class="fuse-panel">⧉ ${displayName(bottom)} buried — +${eff(bottom).value} value` +
      ` <button onclick="event.stopPropagation(); unfuse()">Unfuse</button></div>`;
  } else if (isAssignPhase() && S.selectedId === card.id) {
    action = S.fuseArm ? fuseArmHint(card) : roleButtons(card);
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
      action = `<div class="card-action"><button onclick="soakWith(${card.id})">Downgrade — soak ${soak}${card.level === 1 ? ' (TRASH!)' : ''}</button></div>`;
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
      action = `<div class="card-action"><button onclick="upgrade(${card.id})" ${ok ? '' : 'disabled'}>Upgrade to Lv${card.level + 1} — ${cost} XP${ok ? '' : ' (not enough)'}</button>` +
        `<div class="wo-delta">${levelDeltaText(card)}</div></div>`;
    }
  }

  // Attack/Move centerpiece: always two rows, consistent across all cards.
  // Each stat is TAGGED so CSS can quiet whatever this encounter/slot doesn't use — the
  // numbers never leave (legible math), they just stop shouting all at once.
  // ONE value: the encounter decides whether it reads as damage or as progress.
  const valIcon = (S.encounter && S.encounter.type === 'journey') ? '👣' : '⚔️';
  const vals = `<div class="card-val v-one${contributes > v.value ? ' fused-up' : ''}">${valIcon} ${contributes}</div>`;

  const slot = zoneOf(card.id);
  const ctx = (S.encounter && S.encounter.type === 'journey') ? 'ctx-journey' : 'ctx-fight';
  const slotCls = slot ? `in-${slot}` : '';
  const resoOn = false;   // resonance is gone - depth replaced it
  const boostPicker = '';

  const tint = d.wild ? 'card-el-wild' : shownEl ? `card-el-${shownEl}` : 'card-el-none';
  // sigil watermark + seek-element accent glow (wild gets its own prismatic aura via .card-el-wild)
  const sigil = SIGIL[d.name] || '✦';
  const accent = d.wild ? null : (ACCENT[enhElOf(card)] || '#cfc9ba');
  const sigilStyle = accent ? `--accent:${accent};` : '';
  // while fuse is armed, highlight the valid partners you can tap
  const fuseable = S.fuseArm && S.selectedId != null && S.selectedId !== card.id && canFuse(S.selectedId, card.id);

  return `<div class="card ${tint} ${ctx} ${slotCls} ${wasDowngraded ? 'downgraded' : ''} ${dnd ? 'grabbable' : ''} ${isFusedTop ? 'fused' : ''} ${fuseable ? 'fuseable' : ''} ${S.selectedId === card.id ? 'selected' : ''}" style="${sigilStyle}"` +
    (dnd ? ` draggable="true" ondragstart="dragStart(event, ${card.id})"` +
           ` onclick="event.stopPropagation(); tapCard(${card.id})"` +
           ` ondragover="fuseOver(event, ${card.id})" ondragleave="fuseLeave(event)" ondrop="fuseDrop(event, ${card.id})"` : '') + `>` +
    `<div class="card-sigil" aria-hidden="true">${sigil}</div>` +
    `<div class="card-head"><span class="card-name">${displayName(card)}${forged}</span><span class="card-level">Lv${card.level}</span></div>` +
    `<div class="el-identity">${elChip(shownEl)}</div>` +
    `<div class="card-row"><span class="s-init">💨 ${v.init}</span>` +
    `<span class="s-boost${resoOn ? ' resonating' : ''}"${resoOn ? ' title="Resonates — it feeds what the Spell seeks"' : ''}>` +
    `➕ ${v.boost}${resoOn ? ` ${elIcon(wantEl)}✦` : ''}</span></div>` +
    `<div class="card-vals">${vals}</div>` +
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
  S.dragonState = {
    hp: S.dragon.hp, maxHp: S.dragon.hp,
    shields: S.dragon.armor.map(a => ({ el: a.el, strength: a.v })),
  };
  S.deck = shuffle([...S.deck, ...S.discard, ...S.hand]); // gather all non-trashed, keep levels
  S.hand = []; S.discard = [];
  draw(HAND_SIZE);
  S.fuse = null; S.hardship = null;
  S.downgraded = new Set();
  S.damage = 0; S.poison = 0; S.loseReserve = null; S.afterSoak = 'upgrade';
  logHeader(`— 🐉 THE ${S.dragon.name.toUpperCase()}: THE APPROACH —`);
  log(`Region 4 is behind you. Two hard journeys race to the lair — Complete BOTH and you arrive having found the crack, shattering the ${S.dragon.name}'s weakest shield before a blow is struck. Then the duel begins.`);
  startApproachBeat();
}

// ---------- THE APPROACH: two ordinary journey-beats ----------
function startApproachBeat() {
  if (S.hand.length === 0) { finishApproach(); return; } // nothing left to travel with → straight to the lair
  const beat = S.approachOutcomes.length + 1;
  const weak = dragonWeakness(S.dragon)[0] || S.dragon.element; // travel toward the crack
  S.encounter = { type: 'journey', name: `Approach to the ${S.dragon.name} · ${beat}/2`,
    mp: APPROACH.mp, timePenalty: APPROACH.timePenalty, nightfall: APPROACH.nightfall,
    element: weak, xp: 0, finale: true };
  S.assign = { Spell: null, Element: null, Boost: null, Reserve: null };
  S.fuse = null; S.boostTarget = 'Move'; S.hardship = null; S.rangedDodge = false;
  S.divertsUsed = 0; S.diverting = false;
  S.loseReserve = null; S.afterSoak = 'upgrade';
  S.damage = 0; S.damageEl = null;
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
  if (bothComplete) {
    const live = S.dragonState.shields.filter(s => s.strength > 0).sort((a, b) => a.strength - b.strength);
    if (live.length) {
      const s = live[0]; s.strength = 0;
      log(`A clean approach — you arrive having found the crack. The ${elIcon(s.el)} ${s.el} shield is shattered before a single blow is struck!`, 'good result');
    } else {
      log(`A clean approach — but the ${S.dragon.name} bears no shields to break.`, 'good');
    }
  } else {
    log(`You reach the lair battered and late — the ${S.dragon.name}'s guard is whole.`);
  }
  startDuel();
}

// ---------- THE DUEL: one-set fight-beats vs the persistent dragon ----------
function shieldText() {
  const ds = S.dragonState;
  if (!ds.shields.length) return 'no shields';
  return ds.shields.map(s => s.strength > 0 ? `${s.strength} ${elIcon(s.el)}` : `${elIcon(s.el)}✗`).join(' · ');
}

function startDuel() {
  S.finalPhase = 'duel';
  S.duelBeat = 0;
  // steel yourself at the lair's mouth: gather every card you still hold (spent-set and all)
  // into a fresh deck — this is your finite duel stamina. Only cards TRASHED on the approach
  // (Lv1 soak losses) are gone; a clean approach preserves your full hand AND cracked a shield.
  S.deck = shuffle([...S.deck, ...S.discard, ...S.hand]);
  S.hand = []; S.discard = [];
  log(`The ${S.dragon.name} rears — ${S.dragonState.hp} HP behind its shields (${shieldText()}). You steel yourself: ${S.deck.length} cards in hand for the duel. Attune INTO a shield to crack it (overflow wounds), or bypass it unattuned for a small sure hit. Fell it before your cards run dry.`);
  startDuelBeat();
}

function startDuelBeat() {
  // DECK-AS-HEALTH, finite (no reshuffle — deliberate, see Dragons.md): each beat spends its
  // set and soaks from the same dwindling pool. The deck visibly drains; you win by felling the
  // dragon before it runs dry. A duel that outlasts your cards is the legible, developed loss.
  if (S.hand.length < HAND_SIZE) draw(HAND_SIZE - S.hand.length);
  if (S.hand.length === 0) { // deck and hand both spent — the loss has developed over the duel
    defeat(`Your cards are spent — the ${S.dragon.name} still stands at ${S.dragonState.hp} HP. You watched the shields crack, but could not finish it.`);
    return;
  }
  S.duelBeat++;
  // synthetic persistent enemy: armor [] so computeAction returns the RAW strike; shields are applied here.
  // atk = the Early bite (ceil breath/2) so losing Initiative stings without doubling the breath;
  // the counterstrike (full breath, HP-scaled) is the main threat. hp huge so computeAction never "wins" — we judge HP.
  S.encounter = { type: 'fight', name: S.dragon.name, dragon: true, hp: 9999,
    init: S.dragon.init, atk: Math.ceil(S.dragon.breath / 2), atkEl: S.dragon.element, armor: [], xp: 0, finale: true };
  S.assign = { Spell: null, Element: null, Boost: null, Reserve: null };
  S.fuse = null; S.boostTarget = 'Attack'; S.hardship = null; S.rangedDodge = false;
  S.divertsUsed = 0; S.diverting = false;
  S.loseReserve = null; S.afterSoak = 'upgrade';
  S.damage = 0; S.damageEl = null;
  S.downgraded = new Set(); S.actionSetIds = []; S.reserveId = null;
  S.phase = 'assign';
  logHeader(`— 🐉 Duel · beat ${S.duelBeat} —`);
  log(`${S.dragon.name}: ${S.dragonState.hp}/${S.dragonState.maxHp} HP · shields ${shieldText()}`);
  render();
}

function resolveDuel() {
  if (!rolesValid()) return;
  const pile = pileCards();
  const spell = pile[0];
  const elem = cardById(S.assign.Element);
  const boostC = cardById(S.assign.Boost);
  S.actionSetIds = [...pile, elem, boostC].filter(Boolean).map(c => c.id);
  if (S.fuse) {
    const top = cardById(S.fuse.topId), bottom = cardById(S.fuse.bottomId);
    S.actionSetIds.push(S.fuse.bottomId);
    log(`Fused: ${bottom.def.name} behind ${top.def.name} → counts as ${S.fuse.element} this beat. No Arsenal.`);
  }
  const reserve = S.fuse ? null : (cardById(S.assign.Reserve) || S.hand.find(c => !S.actionSetIds.includes(c.id)) || null);
  S.reserveId = reserve ? reserve.id : null;

  const r = computeAction(reserve); // fight math; e.armor=[] → r.value is the raw strike, r.enhEl = what it became
  const ds = S.dragonState;
  const atk = r.value;

  // --- apply the strike to shields / HP ---
  const hpBefore = ds.hp;
  let toHp = 0, chip = 0, shield = null, overflow = 0;
  if (r.enhUsed) {
    shield = ds.shields.find(s => s.el === r.enhEl && s.strength > 0) || null;
    if (shield) { chip = Math.min(atk, shield.strength); shield.strength -= chip; overflow = atk - chip; toHp = overflow; }
    else toHp = atk;            // Attuned into an unshielded / already-broken element → straight to HP
  } else {
    toHp = atk;                 // unattuned → bypasses the shields entirely
  }
  ds.hp = Math.max(0, ds.hp - toHp);
  const kill = ds.hp <= 0;

  // --- counterstrike shrinks with remaining HP; Early Damage if out-initiatived ---
  const counter = kill ? 0 : Math.ceil(S.dragon.breath * ds.hp / ds.maxHp);
  const early = kill ? 0 : r.early; // r.early = breath when you lose Initiative, else 0
  const damage = early + counter;
  S.duelResult = { atk, toHp, kill, early, counter, damage };

  log(`The weave — Spell: ${r.spellEl} ×${r.depth} (${r.pile.map(x => displayName(x)).join(' + ')}) = ${r.base}` +
      ` · Catalyst: ${elem ? `${elem.def.name} (${elem.def.wild ? 'Wild' : elOf(elem) || 'colorless'}, Init ${eff(elem).init})` : '—'}` +
      ` · Surge: ${boostC ? `${boostC.def.name} (+${r.boostEff} → ${S.boostTarget})` : '—'}`);

  // --- staged reveal (mirrors the normal fight) ---
  const L = (text, cls = '') => ({ text, cls });
  const beats = [];
  const b1 = [];
  if (r.enhUsed) b1.push(L(`Catalyst ${elem.def.wild ? `(Wild) supplies ${r.enhEl}` : `${elOf(elem)} matches`} → ATTUNES: ${r.enhEl} strike ${r.base}`, 'good'));
  else b1.push(L(`Basic strike ${r.base}${r.isEnh ? ' — unattuned, it will slip past the shields' : ''}`));
  if (S.boostTarget === 'Attack' && boostC) b1.push(L(`Surge: +${r.boostEff} → strike ${atk}`));
  if (shield) {
    b1.push(L(`🛡️ ${shield.el} shield takes ${chip} (${chip + shield.strength} → ${shield.strength})${shield.strength === 0 ? ' — SHATTERED' : ''}`, 'good'));
    b1.push(overflow > 0 ? L(`Overflow ${overflow} spills past the scale → HP`, 'good') : L(`The strike is spent on the shield — no HP this beat`, 'bad'));
  } else if (r.enhUsed) b1.push(L(`${r.enhEl} is unshielded — the full ${atk} bites → HP`, 'good'));
  else b1.push(L(`Unattuned — slips past the shields: ${atk} → HP`));
  b1.push(L(`🐉 ${S.dragon.name}: ${hpBefore} → ${ds.hp} HP`, ds.hp < hpBefore ? 'good' : ''));
  beats.push({ label: '⚔️ STRIKE', big: toHp, vs: `to HP · 🐉 ${hpBefore}→${ds.hp}`, numCls: r.enhUsed ? 'enh' : '', lines: b1 });

  if (!kill) {
    const b2 = [];
    if (r.initLost) b2.push(L(`Initiative: yours ${r.init} vs ${S.dragon.init} → the ${S.dragon.name} strikes first → Early Damage ${early}`, 'bad'));
    else b2.push(L(`Initiative: yours ${r.init} vs ${S.dragon.init} → you strike first — no Early Damage`, 'good'));
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
  S.damageEl = S.dragon.element; // its breath carries its element — matching armor soaks double
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

function victory() {
  const survivors = [...S.hand, ...S.deck, ...S.discard];
  const score = survivors.reduce((t, c) => t + c.level, 0);
  log(`🏆 THE ${S.dragon.name.toUpperCase()} FALLS! Final score: ${score}`, 'good result');
  S.phase = 'victory';
  render();
}

// go — restore a saved run if one exists, else start fresh
if (!loadGame()) freshGame();
