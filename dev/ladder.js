// 🎯 THE LADDER AGAINST THE TARGET. Thomas (2026-08-22): "i want like 40/35/30/20, with meta
// progression stuff helping make it a bit easier. this is a roguelite."
// ⚠️ The mage is measured at BANK_WEIGHT 1.0 — she channels whenever that is not strictly worse,
// which is how a human plays her — and reported against 0, the old never-channels bot. Quoting
// only the 0 column is what hid her real strength for a week.
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');
const N = +(process.argv[2] || 320);
process.argv.slice(3).filter(a => !a.startsWith('LV=')).forEach(a => {
  const [k, v] = a.split('=');
  setTunable(k, v.startsWith('{') ? JSON.parse(v) : Number(v));
});
const TARGET = [40, 35, 30, 20];
// 🔴 PIN THE BARS, OR THE SWEEP LEVELS ITSELF UP INSIDE THE MEASUREMENT (found 2026-08-24).
// RUNSIM.run() applies SIM_LEVEL for exactly this reason - but this tool calls autoRun() directly,
// which bypasses it, so `bankRun()` banked xp every run and `accountLevel()` read **15** by the
// end of a 240-run sweep. Every ladder number taken since the xp ladder shipped is a blend of a
// fresh account and a maxed one, weighted by how far into the batch each run happened to fall.
// 🔑 THE GUARD EXISTED AND LIVED IN THE ENTRY POINT NOBODY USES - the same shape as *a rule the
// engine enforces only at the UI is a rule the instrument cannot see*. A guard belongs where the
// work happens, not where the tidiest caller happens to be.
// ⚠️ Pinned to ★6/🎭3 by default so this agrees with every other probe in dev/; pass LV=n.
const LV = (process.argv.slice(3).find(a => a.startsWith('LV=')) || 'LV=6').slice(3) | 0;
setTunable('XP_LEVEL_FORCE', LV);
setTunable('CLASS_LEVEL_FORCE', Math.max(1, Math.min(5, Math.ceil(LV / 2))));

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
console.log(`n=${N}/class · ⭐${sandbox.getTunable("XP_LEVEL_FORCE")}/🎭${sandbox.getTunable("CLASS_LEVEL_FORCE")} · COIN_MULT ${sandbox.getTunable('COIN_MULT')} · BANK_MULT ${sandbox.getTunable('BANK_MULT')} · ` +
            `PAID ${sandbox.getTunable('PAID_STEP')} · HP+ ${JSON.stringify(sandbox.getTunable('DRAGON_HP_ADD'))}`);
console.log('stage  TARGET   mage(channels)  mage(never)   rogue      road C%  m/r     beats m/r');
for (let i = 0; i < 4; i++) {
  const m = mage[i], mo = mageOff[i], r = rogue[i]; if (!m || !r) continue;
  const d = x => (x - TARGET[i] >= 0 ? '+' : '') + (x - TARGET[i]);
  console.log(`  ${i+1}     ${String(TARGET[i]).padStart(3)}%     ` +
    `${String(m.win).padStart(3)}% (${d(m.win).padStart(3)})     ${String(mo.win).padStart(3)}%      ` +
    `${String(r.win).padStart(3)}% (${d(r.win).padStart(3)})   ${String(m.C).padStart(3)}/${String(r.C).padStart(3)}    ${m.beats}/${r.beats}`);
}
