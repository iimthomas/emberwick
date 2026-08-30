// 🧪 CANDIDATE ROAD RULES, MEASURED WITHOUT BUILDING ANY OF THEM — 2026-08-28
//
// Three journey proposals failed today, one after a full build-and-revert. 🔑 **So this simulates
// a candidate instead of shipping it**: it collects the REAL `computeAction()` numbers for every
// arrangement once, then evaluates candidate rules against them arithmetically. Minutes instead of
// a build, and a bad idea becomes free to discover.
//
// 🔑 WHAT IS ALREADY PROVEN, and why the candidate list is this short:
//   • a flat tax on progress is INERT — 99.8% identical to a bare road. Subtracting a constant
//     moves the threshold, never the argmax.
//   • a road whose RACE is won by the Catalyst converges with fights (81.8% identical vs a bare
//     road's 68.2%) — fights already race on the Catalyst.
//     ⚠️ That is NOT "Initiative is shared ground", which is how I first wrote it up and it was
//     too broad: what converges is pressing the SAME SLOT the fight presses. Which stat a
//     DIFFERENT slot reads is untested and is what B1/B3 below are.
//   • so the road must read a slot differently from the fight. A fight reads Spell(value),
//     Catalyst(init), Surge(boost); ✦ the Arsenal it never reads at all.
//
// 🔴 AND THE TRAP THIS FILE EXISTS TO AVOID, learned the hard way one run earlier:
// **A CANDIDATE MEASURED AT A DIFFERENT DIFFICULTY IS NOT MEASURED.** The first pass ran every
// rule against the road's existing MP, and four of six came back at 90%+ Complete against the
// baseline's 70%. When nearly everything Completes, the outcome term never fires, the argmax is
// decided by the raw number, and "difference" is measuring an easier game rather than a different
// one. So every candidate is now CALIBRATED — its road length is scaled until its Complete rate
// matches the baseline's — and only then are the numbers comparable.
//
// The bar, set in advance by [[Blow_And_Distance]]:
//   ① identical best arrangement must fall WELL below 68% (identical-Spell below 91%)
//   ② depth — the outcome must still move when you rearrange; 'distance' died at 56% flat
'use strict';
const H = require('./headless.js');
const B = H.sandbox;
const RUNS = +(process.argv[2] || 40);
const CLS = process.argv[3] || 'mage';
H.setTunable('XP_LEVEL_FORCE', 6); H.setTunable('CLASS_LEVEL_FORCE', 3);
H.useClass(CLS); B.RUNSIM.setBankWeight(1.0);

const ZONES = ['Spell', 'Element', 'Boost', 'Reserve'];
const perms = a => a.length <= 1 ? [a] :
  a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));
const RANK = { Loss: 0, Narrow: 1, Complete: 2 };

// ── the rules under test. Each maps one arrangement's collected numbers to a progress figure ──
const CANDIDATES = {
  'baseline (today)':      a => a.value,
  // A · use the slot a fight never reads
  'A1 arsenal.boost → MP': a => a.value,                       // (mp adjusted below)
  'A2 arsenal.value → MP': a => a.value,
  // 🔑 A4 is the only candidate that makes the ✦ Arsenal a FORK rather than a tax: throw it into
  // the road, and carry nothing to next turn.
  'A4 spend the arsenal':  a => a.value + a.resValue,
  // B · read a DIFFERENT STAT from a slot the fight already uses
  'B1 surge gives init':   a => a.value - a.boostEff + a.boostInit,
  'B3 spell gives init':   a => a.spellInit + a.boostEff,
  // 🔴 B3 drops the mage's attune bonus (it lands on `value`, and this reads `init`) — the
  // class-seam blocker, made arithmetic. B3+ is the version that would actually ship: compose()
  // would apply the class rule to the ROAD's reading.
  'B3+ init, attune kept': a => a.spellInit + (a.attApplied ? a.attBonus : 0) + a.boostEff,
};
const MP_ADJ = {
  'A1 arsenal.boost → MP': a => a.resBoost,
  'A2 arsenal.value → MP': a => a.resValue,
};

// ── PASS 1 · collect. Nothing is judged here. ────────────────────────────────
// ⚠️ Non-invasive: snapshots S.assign, permutes, restores. No render(), no normalizeAssign().
const hands = [];
B.RUNSIM.setHook({ onAssign: () => {
  const S = H.getS();
  if (!S.hand || S.hand.length < 4) return;
  const road = B.ROADS[S.stage || 1] || B.REGIONS;
  const pool = [];
  for (const band of road) for (const enc of (band.encounters || [])) pool.push(enc);
  const f = pool.find(x => x.type === 'fight'), j = pool.find(x => x.type === 'journey');
  if (!f || !j) return;

  const snap = Object.assign({}, S.assign), realEnc = S.encounter;
  const P = perms(S.hand.map(c => c.id));

  S.encounter = f;
  let bf = null;
  for (const p of P) {
    ZONES.forEach((z, i) => { S.assign[z] = p[i]; });
    let r = null; try { r = B.computeAction(B.cardById(p[3])); } catch (e) { continue; }
    if (!r) continue;
    const sc = (RANK[r.outcome] || 0) * 1000 + (r.value || 0);
    if (!bf || sc > bf.sc) bf = { sc, arr: p.join(','), spell: p[0] };
  }

  S.encounter = j;
  const rows = [];
  for (const p of P) {
    ZONES.forEach((z, i) => { S.assign[z] = p[i]; });
    let r = null; try { r = B.computeAction(B.cardById(p[3])); } catch (e) { continue; }
    if (!r) continue;
    const sp = B.eff(B.cardById(p[0])), bo = B.eff(B.cardById(p[2])), re = B.eff(B.cardById(p[3]));
    rows.push({ arr: p.join(','), spell: p[0], res: p[3],
                value: r.value || 0, mpEff: r.mpEff || 1, boostEff: r.boostEff || 0,
                attApplied: !!r.attApplied, attBonus: r.attBonus || 0,
                spellInit: sp.init, boostInit: bo.init, resValue: re.value, resBoost: re.boost });
  }
  Object.assign(S.assign, snap); S.encounter = realEnc;
  if (bf && rows.length) hands.push({ bf, rows });
} });

for (let i = 0; i < RUNS; i++) { H.seed(9300 + i); try { B.RUNSIM.autoRun(true); } catch (e) {} }

// ── PASS 2 · evaluate, at a calibrated difficulty ────────────────────────────
function evaluate(name, scale) {
  const fn = CANDIDATES[name], adj = MP_ADJ[name];
  let n = 0, arr = 0, spell = 0, flat = 0, fn2 = 0;
  const mix = { Complete: 0, Narrow: 0, Loss: 0 };
  for (const { bf, rows } of hands) {
    let best = null, bestOut = 'Loss';
    const byRes = {};
    for (const a of rows) {
      const mp = Math.max(1, Math.round((a.mpEff + (adj ? adj(a) : 0)) * scale));
      const prog = fn(a);
      const outcome = prog >= mp ? 'Complete' : prog >= Math.ceil(mp / 2) ? 'Narrow' : 'Loss';
      const sc = RANK[outcome] * 1000 + prog;
      if (!best || sc > best.sc) { best = { sc, arr: a.arr, spell: a.spell }; bestOut = outcome; }
      (byRes[a.res] = byRes[a.res] || new Set()).add(outcome);
    }
    n++; mix[bestOut]++;
    if (best.arr === bf.arr) arr++;
    if (best.spell === bf.spell) spell++;
    for (const k of Object.keys(byRes)) { fn2++; if (byRes[k].size <= 1) flat++; }
  }
  return { n, arr: 100 * arr / n, spell: 100 * spell / n, flat: 100 * flat / fn2,
           C: 100 * mix.Complete / n, N: 100 * mix.Narrow / n, L: 100 * mix.Loss / n, scale };
}

// 🔑 CALIBRATE: find the road length at which this rule Completes as often as the game does today.
// Difficulty held constant, rule varied — otherwise the comparison is worthless.
const base = evaluate('baseline (today)', 1);
function calibrate(name) {
  let best = null;
  for (let s = 0.20; s <= 3.01; s += 0.05) {
    const e = evaluate(name, s);
    const d = Math.abs(e.C - base.C);
    if (!best || d < best.d) best = { d, e };
  }
  return best.e;
}

const p = v => v.toFixed(1).padStart(5) + '%';
console.log(`\n🧪 CANDIDATE ROAD RULES — ${CLS}, ${RUNS} runs, ${hands.length} hands, 24 arrangements each`);
console.log(`   every rule calibrated to the baseline's Complete rate (${base.C.toFixed(1)}%), so only the RULE differs\n`);
console.log('   rule                      road   same arrangement   same Spell   depth: flat    C / N / L');
console.log('                             ×      (baseline 65%)     (90%)        (18% today)');
for (const name of Object.keys(CANDIDATES)) {
  const e = name === 'baseline (today)' ? base : calibrate(name);
  console.log(`   ${name.padEnd(24)}${e.scale.toFixed(2).padStart(5)}   ${p(e.arr)}            ${p(e.spell)}       ${p(e.flat)}      ${p(e.C)}/${p(e.N)}/${p(e.L)}`);
}
H.setTunable('XP_LEVEL_FORCE', 0); H.setTunable('CLASS_LEVEL_FORCE', 0);
