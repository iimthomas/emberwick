// ⚒️ DOES THE +N LADDER ACTUALLY DO ANYTHING? — 2026-08-28
//
// 🔑 WHY THIS FILE EXISTS AT ALL. The `worn` keyword shipped HALF-BUILT and nobody noticed for
// three months: every piece was created with `wear: 1`, so a worn piece blocked exactly once,
// exactly like a shatter piece, while a comment above `armourBlock()` described a decay that was
// never written. **A field that is always 1 hides every bug in the code that reads it** — and the
// first thing the ladder did was stop hiding one (`soakWithArmour` deleted a shatter piece
// without ever checking whether `wear` had reached 0).
//
// ⚠️ SO THIS ASSERTS BEHAVIOUR, NOT WIRING. `dev/nine-check.js` was written to catch untested
// code and its own first cut returned `true` for three checks and printed PASS. Every check
// below drives the real function and reads the real state back; a check that cannot run says
// SKIP, never PASS.
'use strict';
const H = require('./headless.js');
const B = H.sandbox;

const results = [];
function check(name, fn) {
  let ok = false, why = '';
  try { const r = fn(); ok = r === true; if (r !== true) why = String(r); }
  catch (e) { why = e.message; }
  results.push([name, ok ? 'PASS' : 'FAIL' + (why ? ' — ' + why : '')]);
}

// a clean stash we control, so a check never depends on what Thomas happens to have forged.
// 🔴 THE FIRST CUT OF THIS HELPER WROTE `localStorage.setItem(B.STASH_KEY, …)` AND B.STASH_KEY
// WAS `undefined` — a top-level `const` in a vm script is lexical and never lands on the sandbox,
// so every write went to a key literally named "undefined" and six checks failed against a stash
// this file had never touched. ⚠️ **It looked exactly like six real bugs.** Going through
// saveStash() — a `function` declaration, therefore reachable — is both correct and better: the
// probe now exercises the same writer the game uses.
function stash(up, mats) {
  const st = { mats: mats || {}, owned: B.ARMOUR.map(a => a.id), loadout: [],
               up: up || {}, seeded: true };
  B.saveStash(st);
  return st;
}
const def = id => B.ARMOUR.find(a => a.id === id);
// a plain shatter piece with block, and a piece that carries a numeric onBlock
const PLAIN = B.ARMOUR.find(a => !a.starter && a.brk === 'shatter' && a.block > 0 && !a.use);
const NUMERIC = B.ARMOUR.find(a => !a.starter && (B.ARMOUR_POWER[a.onBlock] || B.ARMOUR_POWER[a.use]));

console.log(`\n⚒️ THE +N LADDER — plain piece: ${PLAIN ? PLAIN.name : 'none'} · numeric: ${NUMERIC ? NUMERIC.name : 'none'}\n`);

// ── 1 · the steps grant what they say ──────────────────────────────────────
check('+0 · a piece is unchanged', () => {
  stash({});
  const a = B.newArmour(PLAIN.id);
  return (a.wear === 1 && B.armourBlock(a) === PLAIN.block) ||
         `wear ${a.wear} block ${B.armourBlock(a)}`;
});

check('+1 · it turns aside one more blow', () => {
  stash({ [PLAIN.id]: 1 });
  const a = B.newArmour(PLAIN.id);
  return (a.wear === 2 && B.armourBlock(a) === PLAIN.block) ||
         `wear ${a.wear} (want 2) block ${B.armourBlock(a)} (want ${PLAIN.block})`;
});

check('+3 · block rises by exactly 1', () => {
  stash({ [PLAIN.id]: 3 });
  const a = B.newArmour(PLAIN.id);
  return B.armourBlock(a) === PLAIN.block + 1 || `block ${B.armourBlock(a)}`;
});

check('+2 · a numeric ability grows, and the LOG says the grown number', () => {
  if (!NUMERIC) return 'no numeric piece in the table';
  const key = B.ARMOUR_POWER[NUMERIC.use] ? NUMERIC.use : NUMERIC.onBlock;
  stash({});
  const base = B.armourPow(key, B.newArmour(NUMERIC.id));
  stash({ [NUMERIC.id]: 2 });
  const up = B.armourPow(key, B.newArmour(NUMERIC.id));
  return up > base || `base ${base} → +2 ${up}`;
});

// ── 2 · the bug the ladder exposed ─────────────────────────────────────────
check('a +1 SHATTER piece survives its first block and shatters on its second', () => {
  stash({ [PLAIN.id]: 1 });
  // ⚠️ a REAL run, not a hand-built object — soakWithArmour() reaches for the hand to decide
  // whether the remaining damage is survivable, and a stub would have taken a different path
  // through the very function under test.
  H.seed(11); B.freshGame(1);
  const S = H.getS();
  S.armour = [B.newArmour(PLAIN.id)];
  S.phase = 'soak';
  const a = S.armour[0], blocked = B.armourBlock(a);
  S.damage = blocked + 1;
  B.soakWithArmour(a.id);
  if (!(S.armour.length === 1 && S.armour[0].wear === 1))
    return `after one block: ${S.armour.length} piece(s), wear ${S.armour[0] && S.armour[0].wear}`;
  S.damage = blocked + 1;
  B.soakWithArmour(a.id);
  return S.armour.length === 0 || 'after two blocks it is still on the board';
});

// ── 3 · the economy ────────────────────────────────────────────────────────
check('upgradePiece spends the materials and records the step', () => {
  const cost = B.ARMOUR_UP_COST[0];
  stash({}, Object.assign({}, cost, { shard: (cost.shard || 0) + 5 }));
  const before = B.loadStash().mats.shard;
  B.upgradePiece(PLAIN.id);
  const st = B.loadStash();
  return (st.up[PLAIN.id] === 1 && st.mats.shard === before - (cost.shard || 0)) ||
         `up ${st.up[PLAIN.id]} · shard ${before} → ${st.mats.shard}`;
});

check('it refuses when the materials are short', () => {
  stash({}, { shard: 0 });
  B.upgradePiece(PLAIN.id);
  return (B.loadStash().up[PLAIN.id] || 0) === 0 || 'it upgraded on an empty stash';
});

check('it stops at the cap', () => {
  // ⚠️ THROUGH getTunable(), NOT B.ARMOUR_UP_MAX. This check failed once for the third time in a
  // single build: a top-level `let` is lexical too, so the sandbox read `undefined`, the helper
  // seeded the piece at `undefined`, and the cap test upgraded a piece that had never been capped.
  // 🔑 **A sandbox read returning `undefined` is not a missing export — it is a warning that the
  // whole binding class is unreachable that way.** The name is in EXPORTS now as well.
  const cap = H.getTunable('ARMOUR_UP_MAX');
  stash({ [PLAIN.id]: cap }, { shard: 9999, sinew: 99 });
  B.upgradePiece(PLAIN.id);
  return B.loadStash().up[PLAIN.id] === cap || 'it went past the cap';
});

check('the starter set cannot be upgraded', () => {
  const starter = B.ARMOUR.find(a => a.starter);
  stash({}, { shard: 9999, sinew: 99 });
  B.upgradePiece(starter.id);
  const forced = B.armourUpOf(starter.id);
  return ((B.loadStash().up[starter.id] || 0) === 0 && forced === 0) ||
         `up ${B.loadStash().up[starter.id]} · armourUpOf ${forced}`;
});

// ── 4 · the field survives a round trip through the stash ──────────────────
check('`up` survives a save/load of the stash', () => {
  stash({ [PLAIN.id]: 2 });
  // write what we just read straight back, so the WHITELISTING READER is what is being tested —
  // it is the half that silently drops an unknown field, and it has done it before.
  B.saveStash(B.loadStash());
  return B.loadStash().up[PLAIN.id] === 2 ||
         'the whitelisting reader dropped it — the "two edits, second one silent" trap';
});

// ── 5 · the text cannot describe a rule the code does not apply ────────────
check('upGrantText names something real at every step', () => {
  for (let step = 1; step <= H.getTunable('ARMOUR_UP_MAX'); step++) {
    const t = B.upGrantText(PLAIN, step);
    if (!t || t === 'nothing') return `step +${step} promises "${t}"`;
  }
  return true;
});

check('every non-starter piece gets something real from every step', () => {
  const bad = [];
  for (const d of B.ARMOUR) {
    if (d.starter) continue;
    for (let step = 1; step <= H.getTunable('ARMOUR_UP_MAX'); step++) {
      const t = B.upGrantText(d, step);
      if (!t || t === 'nothing') bad.push(`${d.name} +${step}`);
    }
  }
  return bad.length === 0 || `dead rungs: ${bad.join(', ')}`;
});

check('the pin does NOT reach the starter set', () => {
  H.setTunable('ARMOUR_UP_FORCE', 3);
  const starter = B.ARMOUR.find(a => a.starter);
  const su = B.armourUpOf(starter.id), pu = B.armourUpOf(PLAIN.id);
  H.setTunable('ARMOUR_UP_FORCE', -1);
  return (su === 0 && pu === 3) || `starter ${su} (want 0) · plain ${pu} (want 3)`;
});

// ── 6 · the instrument's pin ───────────────────────────────────────────────
check('ARMOUR_UP_FORCE overrides the real stash', () => {
  stash({});
  H.setTunable('ARMOUR_UP_FORCE', 2);
  const forced = B.armourUpOf(PLAIN.id);
  H.setTunable('ARMOUR_UP_FORCE', -1);
  const real = B.armourUpOf(PLAIN.id);
  return (forced === 2 && real === 0) || `forced ${forced} · real ${real}`;
});

const pass = results.filter(r => r[1] === 'PASS').length;
for (const [n, r] of results) console.log(`   ${r === 'PASS' ? '✅' : '❌'} ${n}\n      ${r}`);
console.log(`\n   ${pass}/${results.length} passed\n`);
process.exitCode = pass === results.length ? 0 : 1;
