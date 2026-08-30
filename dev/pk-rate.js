// ✦ HOW OFTEN DOES THE NEW PERFECT KILL FIRE, and is each half reachable on its own?
// 🔑 A prize nobody ever earns is the same failure as one that fires by default — measure the
// rate before shipping the rule, not after someone reports never seeing it.
const H = require('./headless.js');
const S = H.sandbox;
const t = { kills: 0, exact: 0, untouched: 0, both: 0, journeys: 0, plainFights: 0, plainPerfect: 0 };

const realApply = S.foeApplyBlow;
S.foeApplyBlow = function (r) {
  const st = H.getS().foeState;
  const dealt = Math.max(0, r.value || 0);
  const wasExact = dealt === st.hp, wasClean = !!st.untouched;
  const felled = realApply.apply(this, arguments);
  if (felled) {
    t.kills++;
    if (wasExact) t.exact++;
    if (wasClean) t.untouched++;
    if (wasExact && wasClean) t.both++;
  }
  return felled;
};

const realPK = S.perfectKillInfo;
S.perfectKillInfo = function (r) {
  const out = realPK.apply(this, arguments);
  const st = H.getS(), e = st.encounter;
  if (e && e.type === 'journey' && out.perfect) t.journeys++;
  if (e && e.type === 'fight' && !e.beatFight) { t.plainFights++; if (out.perfect) t.plainPerfect++; }
  return out;
};

H.useClass('mage'); H.seed(2468);
S.RUNSIM.batch(true, 60);

const pc = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '—';
console.log('multi-turn kills        :', t.kills);
console.log('  ⚔️ exactly lethal      :', t.exact, pc(t.exact, t.kills));
console.log('  ❤️ untouched all fight :', t.untouched, pc(t.untouched, t.kills));
console.log('  ✦ BOTH (perfect kill)  :', t.both, pc(t.both, t.kills));
console.log('one-hand fight turns    :', t.plainFights, '· perfect:', t.plainPerfect, pc(t.plainPerfect, t.plainFights));
console.log('✦ on a JOURNEY          :', t.journeys, t.journeys ? '🔴 STILL LEAKING' : '✅ never');
