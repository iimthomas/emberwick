// 📏 RE-MEASURE PAR. `dragon.par` (36/44/48/52) is a MEASUREMENT, not a design choice — it was
// derived by bucketing lairs and reading the win rate. Raising FOE_ATK_MULT lowers arrival levels,
// so a stale par makes the Standing chip say "you are behind" on essentially every run at every
// stage. ⚠️ A display that always reads as a warning is worse than no display — it is the exact
// bug the Standing shipped with (red from turn 1, comparing a turn-1 deck to a lair target).
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 700);
const data = {};
for (const cls of ['mage', 'rogue']) {
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(9100 + i);
    let lairLv = null;
    sandbox.RUNSIM.setHook({ onLair() {
      const S = getS(); lairLv = [...S.hand,...S.deck,...S.discard].reduce((a,c)=>a+c.level,0);
    } });
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    if (m.win === null || lairLv === null) continue;
    const st = getS().dragon.stage;
    (data[st] || (data[st] = [])).push({ lv: lairLv, win: m.win });
  }
}
console.log('stage  n     all arrivals 10/50/90   WINNERS median   losers median   par now -> suggested');
for (const st of [1,2,3,4]) {
  const a = (data[st] || []).sort((x,y) => x.lv - y.lv);
  if (a.length < 40) { console.log(`  ${st}  too few (${a.length})`); continue; }
  const med = arr => arr.length ? arr[Math.floor(arr.length/2)].lv : null;
  const q = p2 => a[Math.floor(p2 * a.length)].lv;
  const W = a.filter(r => r.win), L = a.filter(r => !r.win);
  const parNow = sandbox.DRAGONS[st-1].par;
  console.log(`  ${st}  ${String(a.length).padStart(4)}  ${String(q(.1)).padStart(3)} / ${String(q(.5)).padStart(3)} / ${String(q(.9)).padStart(3)}            ` +
    `${String(med(W)).padStart(3)} (n${W.length})       ${String(med(L)).padStart(3)} (n${L.length})      ${parNow} -> ${med(W)}`);
}
