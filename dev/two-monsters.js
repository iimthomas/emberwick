// 👹👹 WOULD A PAIR BE A DECISION WHERE A DOUBLE SHAPE IS A WALL?
// Thomas: *"what if encounters were 2 monsters to deal with instead, and you could target which one
// you want to attack."* And, on finding the source game's own co-op rules: *"they fight 2 creatures
// at a time... the fact that he also does 2 encounters at once validates my idea a bit."*
// ⚠️ Partial validation, and the difference matters: the SOURCE pairs 2 creatures with **2 PLAYERS**.
// This proposes 2 creatures for **ONE**. So it validates the SHAPE of the encounter, not the RATIO —
// and it independently supports the tuning warning, because two creatures worth two players'
// resources must be cut hard to face one.
//
// 🔑 MEASURED WITHOUT BUILDING IT, the way the equipment HP pool was: record the blow the bot's
// hand actually produces against the five 🛡️+🌀 Sunless Fathom creatures, then ask arithmetic what
// would have happened had that same hand met a PAIR carrying one shape each.
// ⚠️ A paper model, so it cannot see anything the arrangement search would have done DIFFERENTLY
// against a pair — a real build gives the player a target choice the bot never had. **Every number
// here is therefore a FLOOR on the pair and a fair reading of the single.**
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();

const RUNS = +(process.argv[2] || 200);
const CLS = process.argv[3] || 'mage';
const HP_MULT = +(process.argv[4] || 0.67);
const ATK_MULT = +(process.argv[5] || 0.67);
const SPILL = process.argv[6] !== 'nospill';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS);
B.RUNSIM.setBankWeight(1.0);

const outcomeOf = (v, hp) => v >= hp ? 'Complete' : v >= Math.ceil(hp / 2) ? 'Narrow' : 'Loss';

// what a blow of `per` × `hits` does to one creature carrying one shape
function hit(per, hits, shape, v, initLost) {
  if (shape === 'armour') return hits * Math.max(0, per - v);
  let val = hits * per;
  if (shape === 'evasion' && initLost) val = Math.floor(val / 2);   // 🌀 halved unless you won the race
  return val;
}

const single = { Complete: 0, Narrow: 0, Loss: 0, dmg: 0, n: 0 };
const pair   = { Complete: 0, Narrow: 0, Loss: 0, dmg: 0, n: 0 };

B.RUNSIM.setHook({ onAssign: () => {
  const s = S(), e = s.encounter;
  if (!e || e.type !== 'fight') return;
  const shapes = (e.shapes || (e.shape ? [e.shape] : []));
  if (shapes.length < 2) return;                 // only the 🛡️+🌀 bodies
  const r = B.computeAction();
  if (!r || r.value == null) return;
  const hits = Math.max(1, r.hits || 1);
  const per = (r.withBoost || 0) / hits;
  const v = e.shapeV || 0, initLost = !!r.initLost;

  // ── WORLD A — as shipped: one body, BOTH shapes, and they multiply ──────
  let a = hits * Math.max(0, per - v);
  if (initLost) a = Math.floor(a / 2);
  const ao = outcomeOf(a, e.hp);
  single.n++; single[ao]++;
  single.dmg += ao === 'Complete' ? 0 : e.atk;

  // ── WORLD B — a pair, one shape each, cut to HP_MULT / ATK_MULT ─────────
  const php = Math.max(1, Math.round(e.hp * HP_MULT)), patk = Math.max(1, Math.round(e.atk * ATK_MULT));
  // every way to aim: all into one, or (if the class lands 2+) split them
  const plans = [
    { kills: [outcomeOf(hit(per, hits, 'armour', v, initLost), php), 'Loss'] },
    { kills: ['Loss', outcomeOf(hit(per, hits, 'evasion', v, initLost), php)] },
  ];
  if (hits >= 2) {
    const h1 = Math.floor(hits / 2), h2 = hits - h1;
    plans.push({ kills: [outcomeOf(hit(per, h1, 'armour', v, initLost), php),
                         outcomeOf(hit(per, h2, 'evasion', v, initLost), php)] });
  }
  // 🔑 SPILL — kill one and the OVERKILL carries to the other. Without it a one-hit class can
  // never clear a pair, which is the 🧱 GUARD 2 shape again: a gate on an outcome the class hit
  // ceiling forbids. ✅ And it is the RIGHT fix rather than a patch, because it gives the two
  // classes genuinely different answers to one problem: **the mage answers a pair with
  // CONCENTRATION (overkill spills through), the rogue with DIVISION (split the hits).**
  if (SPILL) for (const [first, second] of [['armour','evasion'], ['evasion','armour']]) {
    const dealt = hit(per, hits, first, v, initLost);
    if (dealt >= php) {
      // the excess crosses over, re-read through the SECOND creature's own shape
      const over = dealt - php;
      const perOver = over / hits;
      const spilled = hit(perOver, hits, second, v, initLost);
      plans.push({ kills: first === 'armour' ? ['Complete', outcomeOf(spilled, php)]
                                             : [outcomeOf(spilled, php), 'Complete'] });
    }
  }
  // 🔑 the player picks the plan that kills most; damage is the tie-break, because *which one you
  // let live* is exactly the decision this design exists to create.
  let best = null;
  for (const p of plans) {
    const dead = p.kills.filter(k => k === 'Complete').length;
    // 🔑 THE RULE: whatever you did not kill hits you — and if you lost Initiative, everything
    // swings before it dies, so you eat the lot.
    const dmg = initLost ? 2 * patk : (2 - dead) * patk;
    const score = dead * 1000 - dmg;
    if (!best || score > best.score) best = { dead, dmg, score };
  }
  const po = best.dead === 2 ? 'Complete' : best.dead === 1 ? 'Narrow' : 'Loss';
  pair.n++; pair[po]++; pair.dmg += best.dmg;
}});

for (let i = 0; i < RUNS; i++) { H.seed(6600 + i); try { B.RUNSIM.autoRun(true); } catch (e) {} }
B.RUNSIM.setHook({});

const pc = (o, k) => o.n ? Math.round(100 * o[k] / o.n) : 0;
console.log(`\n\u{1F479}\u{1F479} A DOUBLE SHAPE vs A PAIR — ${CLS}, ${RUNS} runs, ${single.n} encounters against the 5 \u{1F6E1}️+\u{1F300} Fathom bodies`);
console.log(`   pair cut to ×${HP_MULT} HP and ×${ATK_MULT} atk each · spill ${SPILL ? "ON" : "OFF"}\n`);
console.log('   world                          Complete   Narrow   Loss    avg damage taken');
for (const [label, o] of [['as shipped (one body, 2 shapes)', single], ['a PAIR (one shape each)', pair]]) {
  console.log(`   ${label.padEnd(32)}${String(pc(o, 'Complete')).padStart(5)}%  ${String(pc(o, 'Narrow')).padStart(6)}%  ${String(pc(o, 'Loss')).padStart(4)}%  ${(o.dmg / (o.n || 1)).toFixed(1).padStart(16)}`);
}
console.log(`\n   \u{1F511} the question is not "is the pair easier" — it is whether the LOSS RATE stops being`);
console.log(`      the story. A wall reads as Loss; a decision reads as Narrow.`);
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
