// 🎯 THE LADDER AGAINST THE TARGET. Thomas (2026-08-22): "i want like 40/35/30/20, with meta
// progression stuff helping make it a bit easier. this is a roguelite."
// ⚠️ The mage is measured at BANK_WEIGHT 1.0 — she channels whenever that is not strictly worse,
// which is how a human plays her — and reported against 0, the old never-channels bot. Quoting
// only the 0 column is what hid her real strength for a week.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 320);
process.argv.slice(3).forEach(a => {
  const [k, v] = a.split('=');
  setTunable(k, v.startsWith('{') ? JSON.parse(v) : Number(v));
});
const TARGET = [40, 35, 30, 20];

function run(cls, w) {
  sandbox.setBankWeight(w);
  const st = {};
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(9100 + i);
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS(), k = S.dragon.stage;
    const o = st[k] || (st[k] = { n:0, win:0, C:0, tot:0, beats:0 });
    o.n++; if (m.win) o.win++;
    o.C += m.res.Complete; o.tot += m.res.Complete + m.res.Narrow + m.res.Loss;
    o.beats += m.duelBeats || 0;
  }
  return [1,2,3,4].map(k => st[k] ? {
    win: Math.round(100*st[k].win/st[k].n),
    C: Math.round(100*st[k].C/st[k].tot),
    beats: (st[k].beats/st[k].n).toFixed(1) } : null);
}
const mageOff = run('mage', 0), mage = run('mage', 1.0), rogue = run('rogue', 0);
console.log(`n=${N}/class · COIN_MULT ${sandbox.getTunable('COIN_MULT')} · BANK_MULT ${sandbox.getTunable('BANK_MULT')} · ` +
            `PAID ${sandbox.getTunable('PAID_STEP')} · HP+ ${JSON.stringify(sandbox.getTunable('DRAGON_HP_ADD'))}`);
console.log('stage  TARGET   mage(channels)  mage(never)   rogue      road C%  m/r     beats m/r');
for (let i = 0; i < 4; i++) {
  const m = mage[i], mo = mageOff[i], r = rogue[i]; if (!m || !r) continue;
  const d = x => (x - TARGET[i] >= 0 ? '+' : '') + (x - TARGET[i]);
  console.log(`  ${i+1}     ${String(TARGET[i]).padStart(3)}%     ` +
    `${String(m.win).padStart(3)}% (${d(m.win).padStart(3)})     ${String(mo.win).padStart(3)}%      ` +
    `${String(r.win).padStart(3)}% (${d(r.win).padStart(3)})   ${String(m.C).padStart(3)}/${String(r.C).padStart(3)}    ${m.beats}/${r.beats}`);
}
