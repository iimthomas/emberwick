// ✦ WHERE DOES PERFECT KILL ACTUALLY FIRE? (2026-08-30)
// Thomas, from a screenshot of a JOURNEY reveal: *"this isn't a perfect kill"*.
// This wraps the two functions non-invasively (call through, record, return untouched) and runs
// real runs, so the answer is measured rather than read off the gate.
const H = require('./headless.js');
const S = H.sandbox;

const tally = { fire: {}, chance: {}, beatTurns: 0, beatKills: 0, dropCalls: {} };
const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };

const realPK = S.perfectKillInfo;
S.perfectKillInfo = function (outcome) {
  const r = realPK.apply(this, arguments);
  const st = H.getS(), e = st.encounter;
  const kind = !e ? 'none'
    : e.beatFight ? 'fight(beat)'
    : e.dragon ? 'dragon'
    : e.type === 'fight' ? 'fight(plain)'
    : e.type;
  if (r.perfect && r.contested) bump(tally.fire, kind);
  if (r.contested) bump(tally.chance, kind);
  return r;
};

const realDrops = S.rollDrops;
S.rollDrops = function (e, outcome, perfect) {
  const bag = realDrops.apply(this, arguments);
  const n = Object.values(bag).reduce((a, b) => a + b, 0);
  if (e && e.beatFight && n) bump(tally.dropCalls, outcome + ' → ' + JSON.stringify(bag));
  return bag;
};

const realResolveBeat = S.foeResolveBeat;
S.foeResolveBeat = function (r) {
  tally.beatTurns++;
  const alive = realResolveBeat.apply(this, arguments);
  if (!alive) tally.beatKills++;
  return alive;
};

H.useClass('mage');
H.seed(4242);
const N = +(process.argv[2] || 40);
S.RUNSIM.batch(true, N);

console.log('\n=== ✦ perfect FIRED, by encounter kind ===');
console.log(Object.keys(tally.fire).length ? tally.fire : '(never)');
console.log('=== ✦ contested CHANCES (the grade denominator) ===');
console.log(Object.keys(tally.chance).length ? tally.chance : '(never)');
console.log('=== ⚔️ beat fights: %d turns, %d kills ===', tally.beatTurns, tally.beatKills);
console.log('=== 🧰 rollDrops calls DURING a beat fight ===');
console.log(Object.keys(tally.dropCalls).length ? tally.dropCalls : '(none)');
