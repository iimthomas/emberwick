// 📏 HEADLESS EMBERWICK — run game.js + solver.js under node against a DOM stub.
//
// ⚠️ NON-INVASIVE BY CONSTRUCTION. It loads both files VERBATIM. It makes exactly two edits, and
// both are declared here: it deletes the trailing showMenu() boot call (failing LOUDLY if that
// call ever moves, rather than silently measuring a game that never booted), and it appends an
// export epilogue that only copies names onto the sandbox.
//
// 🐛 THREE GOTCHAS, all the same root cause — a top-level `const` in a vm script is LEXICAL:
//  1. it never lands on the sandbox, so game.js and solver.js must be ONE script or solver.js
//     cannot see CARD_DEFS;
//  2. it is invisible from OUTSIDE the sandbox too, which is what the epilogue is for;
//  3. normalizeAssign() is called from render(), which is stubbed — so any HAND-DRIVEN test must
//     seat its own cards. RUNSIM never trips on this because chooseBest() writes S.assign directly.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const NL = '\n';

// 🔑 DEFAULTS TO ITS OWN FOLDER. This harness has been rebuilt twice because it lived in a
// session scratchpad outside the repo; it lives beside game.js now, like solver.js and measure.js.
const DIR = process.env.EMBERWICK_DIR || path.join(__dirname, '..');
const load = file => fs.readFileSync(path.join(DIR, file), 'utf8');

let game = load('game.js');
const BOOT = /\nshowMenu\(\);\s*$/;
if (!BOOT.test(game)) {
  throw new Error('headless: the trailing showMenu() boot call is not where it was. ' +
                  'Find it and update this harness — do NOT guess.');
}
game = game.replace(BOOT, NL + '/* boot call removed by headless harness */' + NL);
const solver = load('solver.js');

// ---- the DOM stub -------------------------------------------------------
function mkEl() {
  return {
    innerHTML: '', textContent: '', value: '', className: '', id: '',
    style: { setProperty() {}, removeProperty() {}, getPropertyValue: () => '' },
    dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(c) { this.children.push(c); return c; },
    removeChild() {}, remove() {}, setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, removeEventListener() {}, focus() {}, blur() {}, click() {},
    scrollIntoView() {}, closest() { return null; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }; },
    insertAdjacentHTML() {},
  };
}
const store = {};
const els = {};
const sandbox = {
  // ⚠️ startStage() asks before discarding a live run. A player clicks OK, so the bot must too -
  // without this every run after the first died on `confirm is not defined`, which the bot's own
  // try/catch swallowed into a silent "DIED".
  confirm: () => true, alert: () => {}, prompt: () => null,
  console,
  document: {
    body: mkEl(), documentElement: mkEl(),
    // 🔑 CACHED BY ID, not a fresh stub each call — otherwise innerHTML never persists and a test
    // can never READ BACK what a render function wrote. That is how a test passes over dead code.
    getElementById: id => (els[id] || (els[id] = mkEl())),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: mkEl,
    addEventListener() {}, removeEventListener() {},
  },
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
  },
  location: { href: 'http://localhost/', search: '', hash: '' },
  navigator: { userAgent: 'node', standalone: false },
  matchMedia: () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} }),
  setTimeout, clearTimeout, setInterval, clearInterval,
  requestAnimationFrame: fn => setTimeout(fn, 0),
  performance: { now: () => Date.now() },
  JSON, Date, Object, Array, String, Number, Boolean, RegExp, Error, Map, Set, isNaN, parseInt, parseFloat,
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;

// 🎲 SEEDED RNG so a before/after comparison is BIT-EXACT rather than two noisy percentages.
// rnd() falls through to Math.random outside the tutorial, so seeding Math.random seeds the game.
// 🔑 THIS IS WHAT MAKES A NO-RULE-CHANGE REFACTOR TESTABLE: there is no number to compare at
// n=200 that is not noise, but there IS an exact answer to "did the same seed play the same run?"
let _seed = 1;
const seed = n => { _seed = (n >>> 0) || 1; };
// 🎯 THE RNG POSITION, READ AND WRITTEN. A probe that snapshots mid-run must restore WHERE IN
// THE STREAM the run was, not just the game state — `seed()` rewinds to the beginning, and a replay
// that starts the stream over plays a different game from the same board.
// 🔑 Found by a fidelity test: 4 of 12 restore-and-continue replays diverged from the original,
// and the clone was not at fault. **State and randomness are two halves of one snapshot.**
const getRng = () => _seed;
const setRng = v => { _seed = v | 0; };
sandbox.Math = Object.create(Math);
sandbox.Math.random = function () {
  _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

vm.createContext(sandbox);
// 🔑 ONE script, not two — see gotcha (1). The epilogue is gotcha (2); it cannot change the game.
const EXPORTS = ['CARD_DEFS', 'ROGUE_DEFS', 'DRAGONS', 'REGIONS', 'ROADS', 'MAGE', 'ROGUE',
                 'RUNSIM', 'CHARMS', 'POTIONS', 'EVENTS', 'MATERIALS', 'CREATURE_INDEX', 'ARMOUR', 'ARMOUR_SLOTS', 'RECIPE', 'MOMENTUM_CAP', 'WAKE_TARGETS', 'BUILD',
                 'SETOUT', 'SETOUT_BUCKETS', 'CONTRACTS', 'CLASS_KEY', 'UNLOCKS', 'UNLOCK_AT', 'LEVEL_CAP', 'XP_AWARD', 'XP_KEY', 'TUTORIAL', 'CLASSES', 'ARMOUR_SLOTS'];
// the `let` tuning constants a sweep is allowed to move. Add a name here and it becomes sweepable;
// ⚠️ it must be `let` in game.js or the assignment throws.
const TUNABLES = ['ATTUNE_BONUS', 'LOOSE_CUT', 'PAID_STEP', 'BANK_MULT', 'FOE_ATK_MULT', 'MOMENTUM_CAP', 'MOMENTUM_STEP', 'MOMENTUM_BREAK', 'MOMENTUM_VALUE', 'MOMENTUM_FULL', 'SPLIT_ADDS_PER_HIT', 'TIME_PENALTY_MULT', 'ELITE_HP', 'ELITE_ATK', 'ELITE_COIN',
                  'COIN_MULT', 'DRAGON_HP_ADD', 'ARMOUR_SLOTS_OPEN', 'RELENTLESS_STEP', 'JOURNEY_MP_MULT', 'FORK_ENABLED', 'WHEEL_PER_ENCOUNTER',
                  'XP_PER_LEVEL', 'XP_LEVEL_FORCE', 'CLASS_XP_PER_LEVEL', 'CLASS_LEVEL_FORCE'];
const epilogue = NL + ';' + NL +
  EXPORTS.map(n => 'try { globalThis.' + n + ' = ' + n + '; } catch (e) {}').join(NL) + NL +
  // S is reassigned every run, so it must be exported as a GETTER, never a copied reference.
  'globalThis.getS = function () { return S; };' + NL +
  // ⚠️ A SETTER TOO, so a probe can RESTORE a snapshot and let autoRun replay from it rather
  // than forking the run loop. `S` is a top-level `let` and therefore lexical — it cannot be
  // assigned from outside the sandbox any other way, which is the same binding rule that has
  // cost this project something in four separate builds.
  'globalThis.setS = function (v) { S = v; return S; };' + NL +
  // ⚠️ SWEEP TUNABLES IN PLACE — never by patching game.js on disk.
  // 🐛 A sweep that writes a patched game.js and restores it in a `finally` LEAVES THE GAME
  // PATCHED if the process is killed (a timeout, a ^C). That happened: game.js was found holding
  // ATTUNE_BONUS = 5 after a sweep timed out, and only git had the real value.
  // 🔑 These are declared `let` in game.js precisely so they can be set. A lexical binding
  // cannot be assigned by name dynamically, hence the generated switch — it is the whole reason
  // this lives in the epilogue rather than being done from outside.
  'globalThis.setTunable = function (k, v) { switch (k) {' +
    TUNABLES.map(n => `case ${JSON.stringify(n)}: ${n} = v; return true;`).join(' ') +
    ' default: throw new Error("unknown tunable: " + k); } };' + NL +
  'globalThis.getTunable = function (k) { switch (k) {' +
    TUNABLES.map(n => `case ${JSON.stringify(n)}: return ${n};`).join(' ') +
    ' default: throw new Error("unknown tunable: " + k); } };' + NL;
vm.runInContext(game + NL + ';' + NL + solver + epilogue, sandbox, { filename: 'emberwick-headless.js' });

// 🔴 IT MUST WRITE THE PICKER'S CHOICE TOO, NOT JUST setClass (fixed 2026-08-25).
// `RUNSIM.autoRun()` was taught to walk the player's entry path via `startStage()`, and
// startStage re-reads the class from `pickedClassId()` - so from that change onward **every bot
// run was the MAGE regardless of useClass**, silently. The tell was a rogue row coming back
// BIT-IDENTICAL to the mage's.
// 🔑 THE LESSON IS THE ONE THE ENTRY-PATH FIX ITSELF TAUGHT, POINTING BACK AT ME: walking the
// real entry path means inheriting what that path READS. startStage reads localStorage; the
// harness has to write it, exactly as a player choosing a class would.
const useClass = name => {
  const id = name === 'rogue' ? 'rogue' : 'mage';
  // ⚠️ Writing CLASS_KEY is not enough: `pickedClassId()` also asks `classUnlocked()`, and the
  // rogue is gated behind CLEARING A STAGE - which a headless sandbox has no record of, so it
  // silently fell back to the mage. Overriding the reader is the honest instrument fix: the bot
  // is not pretending to have earned her, it is being told which class to measure.
  sandbox.pickedClassId = () => id;
  try { sandbox.localStorage.setItem(sandbox.CLASS_KEY, id); } catch (e) {}
  return sandbox.setClass(id === 'rogue' ? sandbox.ROGUE : sandbox.MAGE);
};
module.exports = { sandbox, seed, useClass, DIR, els, getS: () => sandbox.getS(),
  setS: v => sandbox.setS(v),
  getRng, setRng,
  setTunable: (k, v) => sandbox.setTunable(k, v), getTunable: k => sandbox.getTunable(k) };

// ---- CLI ----------------------------------------------------------------
if (require.main === module) {
  const arg = process.argv[2];
  if (arg === 'runsim') {
    const N = +(process.argv[3] || 100);
    useClass(process.argv[4] || 'mage');
    seed(+(process.argv[5] || 12345));
    console.log(JSON.stringify(sandbox.RUNSIM.batch(true, N), null, 2));
  } else if (arg === 'boot') {
    console.log('booted ok · CARD_DEFS', sandbox.CARD_DEFS.length,
                '· DRAGONS', sandbox.DRAGONS.length,
                '· build', sandbox.BUILD);
  }
}
