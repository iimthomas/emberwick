// 🏷️ DO THE ELEMENTAL STATUSES ACTUALLY FIRE, AND DO THEY REACH THE DRAGON? (2026-08-30)
// 🔑 The second half is the whole point. ● Momentum was measured DEAD IN THE DUEL — "a road
// mechanic that switches off at the boss" — so a probe that only counts road applications would
// report this feature healthy while the mage's kit switched off on the fight that decides the run.
const H = require('./headless.js');
const S = H.sandbox;
const road = {}, duel = {};
let burnDmg = 0, burnKills = 0, stunsDenied = 0, exposeSpent = 0, turns = 0;

const rApply = S.applySpellStatus;
S.applySpellStatus = function (r) {
  const out = rApply.apply(this, arguments);
  const st = H.getS();
  turns++;
  if (out) {
    const into = st.finalMode ? duel : road;
    into[out.id] = (into[out.id] || 0) + 1;
  }
  return out;
};
const rBurn = S.tickBurn;
S.tickBurn = function (hp, name) {
  const before = hp, out = rBurn.apply(this, arguments);
  if (out < before) { burnDmg += before - out; if (out <= 0) burnKills++; }
  return out;
};

H.useClass('mage'); H.seed(20260830);
S.RUNSIM.batch(true, 300);

const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
console.log('spell-turns seen        :', turns);
console.log('🛣️  applied ON THE ROAD  :', JSON.stringify(road), '· total', sum(road));
console.log('🐉 applied IN THE DUEL   :', JSON.stringify(duel), '· total', sum(duel),
            sum(duel) ? '✅ reaches the boss' : '🔴 DEAD IN THE DUEL — the ● Momentum failure again');
console.log('🔥 burn damage dealt     :', burnDmg, '· burn kills', burnKills);
