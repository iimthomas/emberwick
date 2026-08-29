// 🧩 DOES A JOURNEY EVER POSE A PROBLEM? — 2026-08-28
//
// Thomas, twice now: *"fight and journey feel a bit too samey, just different outcomes"* (Aug 18)
// and *"this is sorta the same issue though, gameplay is still the same on a journey, just the
// outcome being different"* (today, after I proposed two more outcome changes).
//
// 🔑 SO STOP PROPOSING AND CHECK THE PILLAR. *Variety comes from PROBLEMS, never from powers.* The
// thing that makes one fight different from another is its SHAPE — 🛡️ Armour wants one big hit,
// 🌀 Evasion wants speed, 🧱 Guard wants many — and a shape changes WHICH ARRANGEMENT IS CORRECT.
// A journey has no shape. It has perils and hardships, which are supposed to do the same job.
//
// This asks the only question that matters: **how often does an encounter carry anything at all
// that could change which card goes where** — and then, by permuting all 24 arrangements, how
// often that thing actually MOVES the answer.
//
// ⚠️ Non-invasive: snapshots S.assign, permutes, restores. Never calls render() or
// normalizeAssign(), because a probe that reseats the bot's arrangement is not measuring the bot.
'use strict';
const H = require('./headless.js');
const B = H.sandbox;
const RUNS = +(process.argv[2] || 60);
const CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS); B.RUNSIM.setBankWeight(1.0);

const ZONES = ['Spell', 'Element', 'Boost', 'Reserve'];
const perms = a => a.length <= 1 ? [a] :
  a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));

const tally = { fight: { n: 0, shaped: 0, hardship: 0, bare: 0, spread: 0, bestIsBiggest: 0 },
                journey: { n: 0, peril: 0, hardship: 0, bare: 0, spread: 0, bestIsBiggest: 0 } };
const shapes = {}, perils = {}, hards = { fight: {}, journey: {} };

B.RUNSIM.setHook({ onAssign: () => {
  const S = H.getS(), e = S.encounter;
  if (!e || !S.hand || S.hand.length < 4) return;
  const kind = e.type === 'journey' ? 'journey' : 'fight';
  const t = tally[kind]; t.n++;

  const h = S.hardship || null;
  if (h) { t.hardship++; hards[kind][h] = (hards[kind][h] || 0) + 1; }
  if (kind === 'fight') {
    const sh = e.shape || (e.guard ? 'guard' : null);
    if (sh) { t.shaped++; shapes[sh] = (shapes[sh] || 0) + 1; }
    if (!sh && !h) t.bare++;
  } else {
    if (e.peril) { t.peril++; perils[e.peril] = (perils[e.peril] || 0) + 1; }
    if (!e.peril && !h) t.bare++;
  }

  // 🔑 THE DEPTH PROBE from [[Blow_And_Distance]]: enumerate every arrangement and see how much
  // the answer actually moves. A problem you can ignore is not a problem.
  const snap = Object.assign({}, S.assign);
  const ids = S.hand.map(c => c.id);
  const seen = new Set();
  let best = null, biggestSpellScore = null;
  const bigId = S.hand.slice().sort((x, y) => B.eff(y).value - B.eff(x).value)[0].id;
  for (const p of perms(ids)) {
    ZONES.forEach((z, i) => { S.assign[z] = p[i]; });
    let r = null;
    try { r = B.computeAction(B.cardById(S.assign.Reserve)); } catch (err) { continue; }
    if (!r) continue;
    const rank = { Loss: 0, Narrow: 1, Complete: 2 }[r.outcome] || 0;
    seen.add(r.outcome);
    const score = rank * 1000 + (r.value || 0);
    if (!best || score > best) best = score;
    if (p[0] === bigId && (biggestSpellScore === null || score > biggestSpellScore)) biggestSpellScore = score;
  }
  Object.assign(S.assign, snap);
  // does rearranging change the OUTCOME at all? (more than one distinct outcome reachable)
  if (seen.size > 1) t.spread++;
  // is "put your biggest card in the Spell" already the right answer?
  if (biggestSpellScore !== null && biggestSpellScore === best) t.bestIsBiggest++;
} });

for (let i = 0; i < RUNS; i++) { H.seed(8800 + i); try { B.RUNSIM.autoRun(true); } catch (e) {} }

const row = (label, t, modLabel, mod) => {
  const p = n => (100 * n / (t.n || 1)).toFixed(1).padStart(5) + '%';
  console.log(`   ${label.padEnd(10)} ${String(t.n).padStart(5)}   ${p(mod)}   ${p(t.hardship)}   ${p(t.bare)}   ${p(t.spread)}   ${p(t.bestIsBiggest)}`);
};
console.log(`\n🧩 DOES THE ENCOUNTER POSE A PROBLEM? — ${CLS}, ${RUNS} runs\n`);
console.log('                  n    shape/peril  hardship     bare   arrangement   biggest card');
console.log('                                                       moves outcome  is already right');
row('⚔️ fights', tally.fight, 'shape', tally.fight.shaped);
row('👣 journeys', tally.journey, 'peril', tally.journey.peril);
console.log('');
console.log('   fight shapes  ', JSON.stringify(shapes));
console.log('   journey perils', JSON.stringify(perils));
console.log('   fight hardships  ', JSON.stringify(hards.fight));
console.log('   journey hardships', JSON.stringify(hards.journey));
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
