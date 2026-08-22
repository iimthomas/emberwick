// 📊 THE FULL PICTURE — both classes, every stage, one batch, one set of seeds.
// ⚠️ Cross-class numbers must come from ONE batch or they are not comparable.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 480);   // ⚠️ round-robin divides by four — read n PER STAGE

function survey(cls) {
  const st = {};
  const g = { turns: 0, dmg: 0, clean: 0, plate: 0, plateN: 0, hits2: 0,
              craftA: 0, craftF: 0, wake: 0, chan: 0, initLost: 0, fights: 0,
              blow: 0, duelBlow: 0, duelBeats: 0, oneCard: 0, hitTurns: 0 };
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(6100 + i);
    let lair = null;
    sandbox.RUNSIM.setHook({
      onLair() { const S = getS(); lair = [...S.hand,...S.deck,...S.discard].reduce((a,c)=>a+c.level,0); },
      onDuelAssign() { const r = sandbox.computeAction(null); if (r) { g.duelBlow += r.value; g.duelBeats++; } },
      onAssign() {
        const S = getS(); if (S.finalMode) return;
        const r = sandbox.computeAction(null); if (!r) return;
        g.turns++; g.blow += r.value;
        const d = (r.early||0) + (r.combatDmg||0);
        g.dmg += d;
        if (d + (r.timePenalty||0) === 0) g.clean++;
        if (d > 0) { g.hitTurns++;
          const best = Math.max(...S.hand.map(c => sandbox.soakValue(c)));
          if (best >= d) g.oneCard++; }
        for (const c of S.hand) { g.plate += sandbox.soakValue(c); g.plateN++; }
        if ((r.hits||1) > 1) g.hits2++;
        if (r.type === 'fight') { g.fights++; if (r.initLost) g.initLost++; }
        if (r.banks) g.chan++;
        if (S.wake > 0) g.wake++;
      },
    });
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS(), k = S.dragon.stage;
    const o = st[k] || (st[k] = { n:0, C:0, Nw:0, L:0, tot:0, duels:0, wins:0, beats:0,
                                  lair:0, lairN:0, trash:0, par: S.dragon.par, name: S.dragon.name });
    o.n++; o.C += m.res.Complete; o.Nw += m.res.Narrow; o.L += m.res.Loss;
    o.tot += m.res.Complete + m.res.Narrow + m.res.Loss;
    o.trash += S.trashed.length;
    if (lair) { o.lair += lair; o.lairN++; }
    if (m.win !== null) { o.duels++; if (m.win) o.wins++; o.beats += m.duelBeats; }
    g.craftA += S.stats.craftAvail; g.craftF += S.stats.craftFound;
  }
  return { st, g };
}

const M = survey('mage'), R = survey('rogue');
const pc = (o,k) => Math.round(100 * o[k] / (o.tot||1));
const win = o => o.duels ? Math.round(100*o.wins/o.duels) : 0;

console.log('\n════ PER STAGE ════');
console.log('stage  dragon        shape              MAGE duel  road C/N/L    lair/par   ‖  ROGUE duel  road C/N/L    lair/par   ‖ gap');
for (const k of [1,2,3,4]) {
  const a = M.st[k], b = R.st[k];
  if (!a || !b) continue;
  const shape = sandbox.DRAGONS[k-1].shapes.join('+');
  const row = o => `${String(win(o)).padStart(3)}% (${o.beats && o.duels ? (o.beats/o.duels).toFixed(1) : '–'}b)  ` +
    `${String(pc(o,'C')).padStart(2)}/${String(pc(o,'Nw')).padStart(2)}/${String(pc(o,'L')).padStart(2)}   ` +
    `${String(Math.round(o.lair/(o.lairN||1))).padStart(2)}/${o.par}`;
  console.log(`  ${k}    ${a.name.padEnd(12)}  ${shape.padEnd(17)}  ${row(a)}  ‖  ${row(b)}  ‖ ${String(win(b)-win(a)).padStart(4)}`);
}

console.log('\n════ THE CLASSES THEMSELVES ════');
const line = (label, f) => console.log(`  ${label.padEnd(34)} ${String(f(M)).padStart(12)}   ${String(f(R)).padStart(12)}`);
console.log(`  ${''.padEnd(34)} ${'MAGE'.padStart(12)}   ${'ROGUE'.padStart(12)}`);
line('turns measured', o => o.g.turns);
line('avg blow (road)', o => (o.g.blow/o.g.turns).toFixed(1));
line('avg blow (duel)', o => (o.g.duelBlow/(o.g.duelBeats||1)).toFixed(1));
line('turns that cost NOTHING', o => Math.round(100*o.g.clean/o.g.turns)+'%');
line('damage taken per turn', o => (o.g.dmg/o.g.turns).toFixed(2));
line('avg card plate (armour)', o => (o.g.plate/o.g.plateN).toFixed(1));
line('one card soaks the whole hit', o => Math.round(100*o.g.oneCard/(o.g.hitTurns||1))+'%');
line('loses the Initiative race', o => Math.round(100*o.g.initLost/(o.g.fights||1))+'%');
line('multi-hit turns', o => Math.round(100*o.g.hits2/o.g.turns)+'%');
line('craft found / available', o => Math.round(100*o.g.craftF/(o.g.craftA||1))+'%');
line('slot ③ used (channel / n-a)', o => Math.round(100*o.g.chan/o.g.turns)+'%');
line('holding a token', o => Math.round(100*o.g.wake/o.g.turns)+'%');
line('cards destroyed per run', o => (Object.values(o.st).reduce((t,x)=>t+x.trash,0) /
                                      Object.values(o.st).reduce((t,x)=>t+x.n,0)).toFixed(1));
