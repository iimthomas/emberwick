// ⭐ LV4 REACH (2026-09-04). How many Lv4 cards does a run actually reach today, and what would the
// mage's effect layer look like if a card's ability only switched on at Lv4 (or Lv3) while keeping
// the home-slot gate? Counts, per fight turn, cards sitting at home by level.
//   node dev/lv4-reach.js [N]
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 120);
H.useClass('mage');
let turns = 0, homeAny = 0, homeLv4 = 0, homeLv3 = 0, turnsAnyHome = 0, turnsLv4Home = 0, turnsLv3Home = 0;
let runs = 0, lv4AtLair = 0, lv3AtLair = 0, firstLv4Turn = [], runsWithLv4 = 0, lv4Dist = {};
let runFirst = null, runTurns = 0;
S.RUNSIM.setHook({
  onAssign: () => {
    const st = H.getS();
    if (!st.foeState) return;
    turns++; runTurns++;
    let any = 0, l4 = 0, l3 = 0;
    for (const z of ['Spell', 'Element', 'Boost']) {
      const id = st.assign[z]; const c = id && S.cardById(id); if (!c) continue;
      if (S.atHome(c, z)) { any++; if (c.level >= 4) l4++; if (c.level >= 3) l3++; }
    }
    homeAny += any; homeLv4 += l4; homeLv3 += l3;
    if (any) turnsAnyHome++; if (l4) turnsLv4Home++; if (l3) turnsLv3Home++;
    if (runFirst == null && st.deck.concat(st.hand, st.discard).some(c => c.level >= 4)) runFirst = runTurns;
  },
  onLair: () => {
    const st = H.getS(); runs++;
    const all = st.deck.concat(st.hand, st.discard);
    const n4 = all.filter(c => c.level >= 4).length, n3 = all.filter(c => c.level >= 3).length;
    lv4AtLair += n4; lv3AtLair += n3; lv4Dist[n4] = (lv4Dist[n4] || 0) + 1;
    if (n4) { runsWithLv4++; }
    if (runFirst != null) firstLv4Turn.push(runFirst);
    runFirst = null; runTurns = 0;
  },
});
H.seed(20260904);
S.RUNSIM.batch(true, N);
const pct = (a, b) => (100 * a / Math.max(1, b)).toFixed(0) + '%';
console.log(`mage · ⭐1 · n=${N}`);
console.log(`Lv4 cards at the lair: avg ${(lv4AtLair / runs).toFixed(2)} · runs with ≥1: ${pct(runsWithLv4, runs)} · distribution ${JSON.stringify(lv4Dist)}`);
console.log(`Lv3+ cards at the lair: avg ${(lv3AtLair / runs).toFixed(2)}`);
console.log(`first Lv4 card appears on fight turn ${firstLv4Turn.length ? (firstLv4Turn.reduce((a, b) => a + b, 0) / firstLv4Turn.length).toFixed(1) : '—'} (of ~${(turns / runs).toFixed(0)} fight turns a run)`);
console.log(`fight turns ${turns} · a card at home on ${pct(turnsAnyHome, turns)} of turns (${(homeAny / turns).toFixed(2)} per turn)`);
console.log(`  gated at Lv4: an effect on ${pct(turnsLv4Home, turns)} of turns (${(homeLv4 / turns).toFixed(2)} per turn)`);
console.log(`  gated at Lv3: an effect on ${pct(turnsLv3Home, turns)} of turns (${(homeLv3 / turns).toFixed(2)} per turn)`);
