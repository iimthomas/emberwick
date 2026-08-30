// ⚠️ NUMBERS ARE STRIPPED, NOT TRUNCATED. Cutting these messages at 60 chars turned the duel's
// perfectly ordinary "still stands at 11 of 60 HP" into "11 of 6", which reads as corrupt state —
// and I went hunting a bug that did not exist. 🔑 **A truncated log line can invent a bug.**
// 🔴 WHY ARE RUNS ENDING AT 6 TURNS? Converting the whole roster to multi-turn made every run
// short. Before assuming it is difficulty, ask what actually terminates the run.
const H = require('./headless.js');
const S = H.sandbox;
const ends = {}, fightTurns = [], deckAt = [];

const realDefeat = S.defeat;
S.defeat = function (why) { ends[String(why).replace(/\d+/g, 'N').slice(0, 80)] = (ends[String(why).replace(/\d+/g, 'N').slice(0, 80)] || 0) + 1; return realDefeat.apply(this, arguments); };

const realStart = S.startFoeBeat;
S.startFoeBeat = function () {
  const st = H.getS();
  deckAt.push({ deck: st.deck.length, hand: st.hand.length, discard: st.discard.length });
  return realStart.apply(this, arguments);
};
const realApply = S.foeApplyBlow;
S.foeApplyBlow = function (r) { const f = realApply.apply(this, arguments); if (f) fightTurns.push(H.getS().foeState.turn); return f; };

H.useClass('mage'); H.seed(4321);
S.RUNSIM.batch(true, 40);

console.log('how runs ended:'); Object.entries(ends).forEach(([k, v]) => console.log('   ', v, '×', k));
const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '—';
console.log('turns per kill: avg', avg(fightTurns), '· max', Math.max(...fightTurns, 0), '· n', fightTurns.length);
console.log('deck at the START of a fight turn: deck', avg(deckAt.map(d => d.deck)),
            '· hand', avg(deckAt.map(d => d.hand)), '· discard', avg(deckAt.map(d => d.discard)));
console.log('turns that began with deck 0:', deckAt.filter(d => d.deck === 0).length, 'of', deckAt.length);
