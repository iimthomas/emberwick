// 🎓 AUDIT THE TUTORIAL BY PLAYING IT, NOT BY READING IT. That is the recorded method — it is how
// nine gaps were found on 2026-08-12, and reading the list finds none of them because a lesson only
// exists if its `when()` actually becomes true during stage 0.
//
// ⚠️ A mechanic that never OCCURS in stage 0 is never taught ANYWHERE — lessons only fire while
// `S.tutorial` is set. So "does the lesson exist" is the wrong question; "does it fire" is the one.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();

const fired = new Set();
const seen = { phases: new Set(), nodes: new Set(), systems: new Set() };

// walk the real lesson list the same way pointAtLesson() does
function tick() {
  const s = S(); if (!s || !s.tutorial) return;
  try {
    // ⚠️ TEACH AND DISMISS, the way a player does. `nextLesson()` returns the first UNTAUGHT
    // lesson whose when() is true, so a reader that never calls learned() sees the same lesson
    // forever and the run never progresses past it.
    // 🐛 MARK IT TAUGHT DIRECTLY — do NOT call learned(), which calls render(), which calls
    // normalizeAssign(). This hook runs between chooseBest() and resolve(), so a render here
    // RESEATS the arrangement the bot just built and the turn plays a different hand than the one
    // it chose. That is the documented headless gotcha biting through a third party.
    // 🔑 An instrument that perturbs the thing it measures is not an instrument.
    const s2 = S(); s2.taught = s2.taught || [];
    let guard = 0;
    let L = B.nextLesson && B.nextLesson();
    while (L && L.id && guard++ < 40) { fired.add(L.id); s2.taught.push(L.id); L = B.nextLesson(); }
  } catch (e) {}
  seen.phases.add(s.phase);
  if (s.encounter) seen.nodes.add(s.encounter.type + (s.encounterElite ? '/elite' : ''));
  // systems a player is exposed to in this run
  if ((s.armour || []).length) seen.systems.add('armour worn');
  if (Object.keys(s.loot || {}).length) seen.systems.add('materials dropped');
  if (s.xpRun > 0) seen.systems.add('xp earned');
  if (s.map) seen.systems.add('the map');
  if ((s.charms || []).length) seen.systems.add('charms');
  if (s.wake || s.wakePending) seen.systems.add('emberwake');
  if (s.momentum) seen.systems.add('momentum');
}

H.useClass('mage');
// ⚠️ THE BOT MUST BE ALLOWED TO CHANNEL, or lessons about the 🔥 Emberwake can never fire and the
// audit reports them as gaps. At weight 0 it never banks, so it never HOLDS a wake, so the `aim`
// lesson's when() is never true. **Check the bot is allowed to do a thing before reporting that
// the thing is untaught** — the same trap that produced a retracted measurement once already.
B.RUNSIM.setBankWeight(1.0);
H.seed(1);
// 🔴 THE BOT HAS NEVER PLAYED THE TUTORIAL. `autoRun()` calls `freshGame(rungCursor)` with 1-4,
// round-robining the four real stages — stage 0 is unreachable from it. So the one screen every
// new player meets first is the one screen the instrument has never touched.
// ⚠️ Redirected by wrapping the global rather than forking autoRun's loop: a forked run loop drifts
// (that is why measure.js hooks RUNSIM instead of copying it), and this is one line, restored after.
// 🔴 AND WALK THE PLAYER'S DOOR, NOT THE BOT'S. `autoRun()` calls `freshGame(0)` and goes
// straight to the map — it never reads the 5-page brief. A player does, and `introNext()`'s exit
// used to hardcode `S.phase = 'assign'`, dropping them into a turn with **no encounter** on a map
// run. The audit reported the tutorial healthy for two builds because it entered somewhere else.
// ⚠️ **An audit that does not walk the player's entry path has not audited the entry path.**
const realFresh = B.freshGame;
B.freshGame = () => {
  realFresh(0);
  const s = S();
  if (s.phase === 'intro' || (B.TUTORIAL.intro || []).length) {
    s.phase = 'intro'; s.introPage = 0;
    for (let i = 0; i <= (B.TUTORIAL.intro || []).length; i++) B.introNext(1);
  }
  if (s.phase === 'assign' && !s.encounter)
    console.log('	🔴 THE BRIEF LANDS ON A TURN WITH NO ENCOUNTER');
};
// ⚠️ SAMPLE ON EVERY RENDER, not at the four RUNSIM hooks. Those only fire during `assign`, so a
// lesson whose when() is only true in `soak`, `stack`, `wheel` or `reveal` is never even LOOKED at
// — and the probe would report it as "never fires" when it fires fine.
// 🔑 An audit's blind spots look exactly like the bugs it is hunting.
const realRender = B.render;
B.render = function () { tick(); return realRender.apply(this, arguments); };
B.RUNSIM.setHook({ onAssign: tick, onMap: tick, onLair: tick, onDuelAssign: tick });
try { B.RUNSIM.autoRun(true); } catch (e) { console.log('run ended:', e.message); }
B.RUNSIM.setHook({});
tick();
B.freshGame = realFresh; B.render = realRender;

const all = B.TUTORIAL.lessons.map(l => l.id);
const never = all.filter(id => !fired.has(id));
console.log(`tutorial run: ${S().phase}, ${S().turn} turns, tutorial flag = ${!!S().tutorial}\n`);
console.log(`lessons that FIRED   (${fired.size}/${all.length}): ${[...fired].join(', ') || '(none)'}`);
console.log(`\nlessons that NEVER fired (${never.length}): ${never.join(', ') || '(none)'}`);
console.log(`\nphases the run visited: ${[...seen.phases].sort().join(', ')}`);
console.log(`encounter kinds:        ${[...seen.nodes].sort().join(', ') || '(none)'}`);
console.log(`systems exposed:        ${[...seen.systems].sort().join(', ') || '(none)'}`);

// 🔑 THE REAL QUESTION: what does the player MEET that has no lesson at all?
const TAUGHT = all.join(' ');
const SYSTEMS = {
  'armour / equipment': /armour|equip|plate|loadout/i,
  'the map (choosing a road)': /\bmap\b|road|node/i,
  'materials / drops': /material|shard|carve|drop|loot/i,
  'the Workshop / crafting': /workshop|forge|craft/i,
  'the Stash': /stash/i,
  '⭐ levels & unlocks': /\bxp\b|level up|unlock/i,
  '💀 elites': /elite|dangerous/i,
  '🕯️ hearth': /hearth/i,
  '🎴 the field row': /field|token/i,
};
console.log('\nsystems with NO lesson mentioning them:');
for (const [name, re] of Object.entries(SYSTEMS)) {
  const hit = B.TUTORIAL.lessons.some(l => re.test(l.id + ' ' + (l.title || '') + ' ' + (l.text || '')));
  if (!hit) console.log(`  🔴 ${name}`);
}
