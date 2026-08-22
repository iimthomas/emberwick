// 🏅 the grade's craft term, per class — it must describe the mechanic that class actually has.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
for (const cls of ['mage', 'rogue']) {
  let avail = 0, found = 0, turns = 0;
  for (let i = 0; i < 60; i++) {
    useClass(cls); seed(3300 + i);
    try { sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const S = getS();
    avail += S.stats.craftAvail; found += S.stats.craftFound; turns++;
  }
  const g = { craftAvail: avail / turns, craftFound: found / turns };
  console.log(`${cls.padEnd(6)} label="${(cls === "rogue" ? sandbox.ROGUE : sandbox.MAGE).craft.label}"  ` +
              `avail ${g.craftAvail.toFixed(1)}/run · found ${g.craftFound.toFixed(1)}/run · ` +
              `craft score ${Math.round(20 * g.craftFound / (g.craftAvail || 1))}/20`);
}
