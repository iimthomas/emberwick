// 🙌 THE PAIR LADDER (build 475). RUNSIM holds both hands for every duo, through the real party
// switch. Reports each pair's duel ladder, road result and fight length — and the mode's
// acceptance test: DOES THE SECOND HAND'S ARRANGEMENT CHANGE BECAUSE OF THE FIRST'S BLOW?
// For every second-hand turn the bot arranges twice: against the creature as it now stands (what
// it plays) and against the creature as it stood BEFORE the partner struck (HP and statuses
// restored). If the two arrangements never differ, the follow-up is not paying.
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 32);
const only = process.argv[3];
const PAIRS = [['mage', 'rogue'], ['mage', 'guardian'], ['mage', 'alchemist'], ['rogue', 'guardian'], ['rogue', 'alchemist'], ['guardian', 'alchemist']];

const sig = st => JSON.stringify([st.assign, st.guardStance || '', !!st.ripArmed, !!st.stillArmed, !!st.bankArmed, st.foeTarget]);
const copyBag = b => JSON.parse(JSON.stringify(b || {}));

for (const [a, c] of PAIRS) {
  if (only && !(a + '+' + c).includes(only)) continue;
  H.useParty(a, c); H.seed(20260903);
  let second = 0, changed = 0, snap = null;
  S.RUNSIM.setHook({ onAssign: () => {
    const st = H.getS();
    if (!st.foeState || !st.hands) return;
    const struckBefore = st.hands.filter(h => h.struck).length;
    if (struckBefore === 0) {   // the first hand this creature turn: remember the creature as it stands
      snap = { hp: st.foeState.hp, status: copyBag(st.foeState.status), minions: (st.foeState.minions || []).map(m => ({ hp: m.hp, status: copyBag(m.status) })) };
      return;
    }
    if (!snap) return;
    second++;
    const now = sig(st);
    // arrange against the creature as it WAS
    const keep = { hp: st.foeState.hp, status: st.foeState.status, minions: (st.foeState.minions || []).map(m => ({ hp: m.hp, status: m.status })) };
    st.foeState.hp = snap.hp; st.foeState.status = copyBag(snap.status);
    (st.foeState.minions || []).forEach((m, i) => { if (snap.minions[i]) { m.hp = snap.minions[i].hp; m.status = copyBag(snap.minions[i].status); } });
    S.publishFoeTurn(); S.RUNSIM.chooseBest();
    const before = sig(st);
    // restore, and re-arrange for real so the run continues on what it actually plays
    st.foeState.hp = keep.hp; st.foeState.status = keep.status;
    (st.foeState.minions || []).forEach((m, i) => { if (keep.minions[i]) { m.hp = keep.minions[i].hp; m.status = keep.minions[i].status; } });
    S.publishFoeTurn(); S.RUNSIM.chooseBest();
    if (now !== before) changed++;
  } });
  const b = S.RUNSIM.batch(true, N);
  const duel = Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/');
  console.log(`${(a + ' + ' + c).padEnd(22)} duel ${duel.padEnd(12)} finale ${String(b.finaleWinPct).padStart(3)}% · turns ${b.turns} · follow-up changed the 2nd hand's play ${second ? Math.round(100 * changed / second) : 0}% (${changed}/${second})`);
}
