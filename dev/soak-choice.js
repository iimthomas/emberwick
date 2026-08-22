// 🃏 IS SOAKING A CHOICE, OR A SEARCH?
// Thomas: *"most of the time when i take damage, theres usually a single card in my hand that
// soaks the whole thing, which also makes that a bit too easy."*
// If the best plate in hand routinely covers the whole hit — and if that plate belongs to the card
// you least wanted to play anyway — then soaking costs you nothing you valued.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 150);
for (const cls of ['mage', 'rogue']) {
  let hits = 0, oneCard = 0, archCount = {}, bestSum = 0, avgSum = 0, dmgSum = 0;
  let victimValue = 0, handValue = 0, victimWasSpell = 0;
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(5100 + i);
    sandbox.RUNSIM.setHook({ onAssign() {
      const S = getS(); if (S.finalMode) return;
      const r = sandbox.computeAction(null); if (!r) return;
      const d = (r.early || 0) + (r.combatDmg || 0);
      if (d <= 0) return;
      hits++; dmgSum += d;
      const plates = S.hand.map(c => ({ c, p: sandbox.soakValue(c) })).sort((a, b) => b.p - a.p);
      const best = plates[0];
      bestSum += best.p;
      avgSum += plates.reduce((t, x) => t + x.p, 0) / plates.length;
      if (best.p >= d) oneCard++;
      // who pays? the fattest plate is the card the bot would blunt first
      const a = best.c.def.arch || best.c.def.role || '?';
      archCount[a] = (archCount[a] || 0) + 1;
      victimValue += sandbox.eff(best.c).value;
      handValue += S.hand.reduce((t, c) => t + sandbox.eff(c).value, 0) / S.hand.length;
      if (S.assign.Spell === best.c.id) victimWasSpell++;
    } });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
  }
  const p = n => Math.round(100 * n / (hits || 1));
  console.log(`\n=== ${cls} · ${hits} damaging turns ===`);
  console.log(`  avg hit ${(dmgSum/hits).toFixed(1)} · BEST plate in hand ${(bestSum/hits).toFixed(1)} · average plate ${(avgSum/hits).toFixed(1)}`);
  console.log(`  🔑 one card covers the WHOLE hit: ${p(oneCard)}%`);
  console.log(`  who pays: ${Object.entries(archCount).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${p(v)}%`).join(' · ')}`);
  console.log(`  that card's attack value ${(victimValue/hits).toFixed(1)} vs hand average ${(handValue/hits).toFixed(1)}` +
              `  → you blunt a card worth ${Math.round(100*(victimValue/hits)/(handValue/hits))}% of an average one`);
  console.log(`  it was the card you just cast as your Spell: ${p(victimWasSpell)}%`);
}
