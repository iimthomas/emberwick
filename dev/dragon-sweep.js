// 🐉 SWEEP DRAGON HP FOR "10 POINTS MORE FAILING" (2026-08-30, Thomas: *"i want the bosses being
// all 10% more failing"*).
// 🔑 DRAGON HP IS THE RIGHT LEVER HERE and coins are not, even though coins are the recorded
// difficulty dial: coins move the whole RUN, and the ask is specifically about the bosses. A dial
// that also changes the road would answer a question nobody asked.
// ⚠️ n≥60 PER STAGE. RUNSIM's round-robin divides the batch by four, and at n=20 two near-identical
// configs once read 85% and 40%. `DRAGON_HP_ADD` is a `let`, so it must move through setTunable().
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 240);
// a step is either a flat number (all four dragons) or "a:b:c:d" for a per-stage map.
// ⚠️ A FLAT ADD IS NOT A FLAT EFFECT: the same +4 took Cindermaw down 15 points and Skyrender 8,
// because each dragon converts HP to win rate at its own rate. "All ten points harder" therefore
// needs four numbers, not one.
const STEPS = (process.argv[3] || '0,3,5,7,9').split(',');
const parse = s => s.includes(':')
  ? (([a, b, c, d]) => ({ 1: +a, 2: +b, 3: +c, 4: +d }))(s.split(':'))
  : { 1: +s, 2: +s, 3: +s, 4: +s };

function run(add) {
  H.setTunable('DRAGON_HP_ADD', typeof add === 'string' ? parse(add) : add);
  H.useClass('mage');
  H.seed(20260830);                       // same seed every step — deltas are the sound part
  const r = S.RUNSIM.batch(true, N);
  const out = {};
  for (const [k, v] of Object.entries(r.perDragon)) out[k] = Math.round(100 * v.wins / v.runs);
  out._avg = Math.round(Object.values(out).reduce((a, b) => a + b, 0) / 4);
  return out;
}

const base = run({ 1: 0, 2: 0, 3: 0, 4: 0 });
console.log('HP+0  (today) :', JSON.stringify(base));
for (const s of STEPS.filter(x => x && x !== '0')) {
  const r = run(s);
  const d = k => (r[k] - base[k] >= 0 ? '+' : '') + (r[k] - base[k]);
  console.log('HP+' + String(s).padEnd(9), ':', JSON.stringify(r),
    ' Δ', ['Cindermaw', 'Skyrender', 'Cragmourn', 'Fathomdread'].map(k => d(k)).join('/'));
}
