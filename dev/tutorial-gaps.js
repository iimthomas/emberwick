// 🎓 WHY DOESN'T A LESSON FIRE? Three very different answers, and lumping them together is how a
// real regression hides behind "known gap":
//   (a) STRUCTURAL — the mechanic does not exist in stage 0 at all. Needs a design decision.
//   (b) PATH-DEPENDENT — it exists, the bot's route missed it. A player may well see it.
//   (c) A BUG — it should fire and does not.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();

// —— what does the tutorial's map actually CONTAIN? ————————————————————————
H.useClass('mage'); H.seed(1); B.freshGame(0);
const m = S().map;
const types = {};
for (const row of m.floors) for (const n of row) if (n) types[n.type] = (types[n.type] || 0) + 1;
console.log('tutorial map node types:', JSON.stringify(types));
console.log('  ❓ event nodes  :', types.event || 0, (types.event ? '' : '🔴 none — the `event` lesson CANNOT fire'));
console.log('  🕯️ hearth nodes :', types.hearth || 0);
console.log('  💀 elite nodes  :', types.elite || 0);

// —— play it many times and see which lessons are merely RARE ————————————
const fireCount = {};
const runs = 40;
for (let i = 0; i < runs; i++) {
  H.useClass('mage'); H.seed(500 + i);
  const realFresh = B.freshGame;
  B.freshGame = () => realFresh(0);
  const realRender = B.render;
  const fired = new Set();
  B.render = function () {
    const s = S();
    if (s && s.tutorial) {
      s.taught = s.taught || [];
      let g = 0, L = B.nextLesson();
      while (L && g++ < 40) { fired.add(L.id); s.taught.push(L.id); L = B.nextLesson(); }
    }
    return realRender.apply(this, arguments);
  };
  B.RUNSIM.setBankWeight(1.0);
  try { B.RUNSIM.autoRun(true); } catch (e) {}
  B.render = realRender; B.freshGame = realFresh;
  for (const id of fired) fireCount[id] = (fireCount[id] || 0) + 1;
}
const all = B.TUTORIAL.lessons.map(l => l.id);
console.log(`\nover ${runs} tutorial runs:`);
const never = [], rare = [];
for (const id of all) {
  const n = fireCount[id] || 0;
  if (n === 0) never.push(id);
  else if (n < runs) rare.push(`${id} (${Math.round(100 * n / runs)}%)`);
}
console.log('  always fires  :', all.filter(id => (fireCount[id] || 0) === runs).length + ' of ' + all.length);
console.log('  sometimes     :', rare.join(', ') || '(none)');
console.log('  NEVER         :', never.join(', ') || '(none)');

// —— and can the tutorial even reach the things the never-list needs? ————
console.log('\ncan stage 0 reach what the silent lessons need?');
const checks = {
  'an ❓ event node': !!types.event,
  'the stack phase (needs the 🃏 Reversed charm)': B.CHARMS.some(c => c.id === 'reversed' && B.charmUnlocked(c)),
  'a curse (needs an event or wheel that grants one)': !!types.event,
  'a Lv4 card (needs enough coins)': null,
};
for (const [k, v] of Object.entries(checks))
  console.log(`  ${v === null ? '❔' : v ? '✅' : '🔴'} ${k}`);
