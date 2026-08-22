'use strict';
const { sandbox, seed, useClass } = require('./headless.js');
for (const cls of ['mage', 'rogue']) {
  useClass(cls); seed(77);
  try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
  const g = sandbox.gradeRun(true);
  console.log(`${cls}: ${g.letter} ${g.total}/100 · deck ${g.deck} exec ${g.exec} craft ${g.craft} kill ${g.kill}`);
  console.log('   ' + sandbox.gradeHTML(g, true).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 190));
  console.log(`   craft locked out? ${g.st.craftAvail === 0}`);
}
