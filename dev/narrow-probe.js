// 👣 IS NARROW STILL EARNING ITS PLACE ON A JOURNEY? (2026-08-30)
// Thomas: *"we still have narrows for journeys? should we?"* — asked after fights lost theirs.
// 🔑 The question is not "is it consistent", it is "does the middle band DO anything a two-way
// outcome could not". So measure three things: how often it fires, what it costs when it does,
// and whether a Complete and a Narrow are actually different events.
const H = require('./headless.js');
const S = H.sandbox;

const j = { Complete: 0, Narrow: 0, Loss: 0 };
const f = { Complete: 0, Narrow: 0, Loss: 0 };
const bf = { Complete: 0, Narrow: 0, Loss: 0 };
const cost = { narrowDmg: [], lossDmg: [], narrowTP: [], lossTP: [], narrowCoins: 0, completeCoins: 0 };
let candleSnuffedByNarrow = 0, narrowsThatWereNearMisses = 0, narrowTotal = 0;

const realFinish = S.finishResolve;
S.finishResolve = function () {
  const st = H.getS(), r = st.pendingR, e = st.encounter;
  if (r && e && !st.finalMode) {
    // ⚠️ SPLIT THE FIGHTS. "fights have no Narrow" is only true of the MULTI-TURN ones, and
    // they are 6 creatures out of the roster — lumping them together hides which is which.
    const into = e.type === 'journey' ? j : (e.beatFight || st.foeState ? bf : f);
    // 🔴 A MULTI-TURN FIGHT'S `r.outcome` IS STILL THE SENTINEL'S LIE AT THIS POINT —
    // finishResolve() rewrites it to 'Complete' a few lines in. Reading it on ENTRY made my first
    // pass report "MULTI: 100% Loss", which is the eighth time that value has fooled a reader,
    // and this time the reader was the instrument built to check it. ⚠️ Ask AFTER.
    if (into === bf) { const res = realFinish.apply(this, arguments);
      if (bf[r.outcome] != null) bf[r.outcome]++; return res; }
    if (into[r.outcome] != null) into[r.outcome]++;
    if (e.type === 'journey') {
      if (r.outcome === 'Narrow') {
        narrowTotal++;
        cost.narrowDmg.push(r.combatDmg + (r.stormDmg || 0) + (r.treacherousDmg || 0));
        cost.narrowTP.push(r.timePenalty || 0);
        cost.narrowCoins += e.xp || 0;
        // "near miss" = you were within one point of clearing it
        if (r.value >= r.mpEff - 1) narrowsThatWereNearMisses++;
        if (st.candle) candleSnuffedByNarrow++;
      }
      if (r.outcome === 'Loss') {
        cost.lossDmg.push(r.combatDmg + (r.stormDmg || 0) + (r.treacherousDmg || 0));
        cost.lossTP.push(r.timePenalty || 0);
      }
      if (r.outcome === 'Complete') cost.completeCoins += (e.xp || 0);
    }
  }
  return realFinish.apply(this, arguments);
};

H.useClass('mage'); H.seed(8642);
S.RUNSIM.batch(true, 40);

const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '—';
const pc = (a, b) => b ? (100 * a / b).toFixed(0) + '%' : '—';
const jn = j.Complete + j.Narrow + j.Loss, fn = f.Complete + f.Narrow + f.Loss;
const bn = bf.Complete + bf.Narrow + bf.Loss;
console.log('👣 JOURNEYS  n=' + jn, '· C', pc(j.Complete, jn), '· N', pc(j.Narrow, jn), '· L', pc(j.Loss, jn));
console.log('⚔️ 1-HAND    n=' + fn, '· C', pc(f.Complete, fn), '· N', pc(f.Narrow, fn), '· L', pc(f.Loss, fn));
console.log('⚔️ MULTI     n=' + bn, '· C', pc(bf.Complete, bn), '· N', pc(bf.Narrow, bn), '· L', pc(bf.Loss, bn));
console.log('');
console.log('what a NARROW costs: damage', avg(cost.narrowDmg), '· Time Penalty', avg(cost.narrowTP));
console.log('what a LOSS   costs: damage', avg(cost.lossDmg), '· Time Penalty', avg(cost.lossTP));
console.log('narrows that were within 1 point of clearing:', narrowsThatWereNearMisses,
            'of', narrowTotal, pc(narrowsThatWereNearMisses, narrowTotal));
