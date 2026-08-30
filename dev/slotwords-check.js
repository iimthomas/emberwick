// 🔤 DOES EVERY CONTENT STRING SPEAK THE PLAYER'S CLASS? — 2026-08-28
//
// Thomas: *"the bitterroot potion is only for mage right? we need to figure out a system of naming
// things… or else we have to just make every potion, charms, events, equip, everything, call
// every characters slots correctly."*
//
// 🔑 Two failure modes, and the second is the one that survived to build 419 because it is
// INVISIBLE TO THE MAGE:
//   ① a `{slot:Zone}` placeholder reaching the screen unrendered — obvious, loud, easy.
//   ② a generic entry hardcoding one class's word — reads perfectly for the mage and as nonsense
//      for everyone else, so nothing ever complains.
//
// ⚠️ And a third that is not a naming problem at all: content naming a stat a class DOES NOT HAVE.
// `ROGUE.compose()` returns `boost: 0`, so a "your Surge gives +3" item does literally nothing for
// her — that wants a `cls` gate, never a reworded string. **You cannot rename a stat into
// existence.**
'use strict';
const H = require('./headless.js');
const B = H.sandbox;

const results = [];
function check(name, fn) {
  let ok = false, why = '';
  try { const r = fn(); ok = r === true; if (r !== true) why = String(r); }
  catch (e) { why = e.message; }
  results.push([name, ok, why]);
}

check('the renderer speaks each class', () => {
  H.useClass('mage');
  const m = B.classText('your {slot:Boost} and your {slot:Spell}, if you {gate}');
  H.useClass('rogue');
  const r = B.classText('your {slot:Boost} and your {slot:Spell}, if you {gate}');
  if (/[{}]/.test(m + r)) return `a placeholder survived: ${m} / ${r}`;
  return (m !== r && /Surge/.test(m) && /Spell/.test(m) && /Energy/.test(r) && /Strike/.test(r))
    || `mage "${m}" · rogue "${r}"`;
});

check('no generic entry hardcodes a class word', () => {
  const bad = B.auditSlotWords();
  return bad.length === 0 || bad.join(', ');
});

check('the guard actually catches one', () => {
  // 🔑 A guard nobody has seen fail is a guard nobody has tested. Plant one and take it out again.
  const victim = B.POTIONS.find(p => !p.cls);
  const keep = victim.text;
  victim.text = 'your <b>Surge</b> does something';
  const caught = B.auditSlotWords().length;
  victim.text = keep;
  const clean = B.auditSlotWords().length;
  return (caught === 1 && clean === 0) || `planted → ${caught} found, restored → ${clean}`;
});

check('every {slot:} placeholder names a real zone', () => {
  const zones = Object.keys(B.MAGE.labels);
  const bad = [];
  const scan = (list, kind) => (list || []).forEach(x => {
    for (const m of String((x && x.text) || '').matchAll(/\{slot:(\w+)\}/g))
      if (!zones.includes(m[1])) bad.push(`${kind} · ${x.name} · {slot:${m[1]}}`);
  });
  scan(B.POTIONS, 'potion'); scan(B.CHARMS, 'charm'); scan(B.ARMOUR, 'equipment');
  return bad.length === 0 || bad.join(', ');
});

check('nothing generic touches a stat the rogue does not have', () => {
  // 🔴 the third failure mode. `boosts: false` and `compose()` returns boost 0, so any generic
  // entry whose whole effect is a boost mod is dead content in her pool — and a dead CURSE is a
  // gift. Damp Wick was exactly that.
  const bad = [];
  for (const c of B.CHARMS) if (!c.cls && c.mods && c.mods.boost) bad.push(`charm · ${c.name}`);
  return bad.length === 0 || bad.join(', ');
});

check('the rogue can still be offered a reasonable pool', () => {
  // ⚠️ gating three charms away from her makes a known-thin pool thinner. This does not fail the
  // build; it prints the number so the cost is on the record rather than discovered later.
  const generic = B.CHARMS.filter(c => !c.cls && !c.curse).length;
  const mageOnly = B.CHARMS.filter(c => c.cls === 'mage' && !c.curse).length;
  const rogueOnly = B.CHARMS.filter(c => c.cls === 'rogue' && !c.curse).length;
  console.log(`      (pool: ${generic} generic · ${mageOnly} mage-only · ${rogueOnly} rogue-only)`);
  return generic > 0 || 'no generic charms at all';
});

console.log('\n🔤 CLASS-CORRECT CONTENT STRINGS\n');
let pass = 0;
for (const [n, ok, why] of results) {
  console.log(`   ${ok ? '✅' : '❌'} ${n}${ok ? '' : '\n      ' + why}`);
  if (ok) pass++;
}
console.log(`\n   ${pass}/${results.length} passed\n`);
process.exitCode = pass === results.length ? 0 : 1;
