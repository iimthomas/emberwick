// 🛡️ IS "AIM THE SURGE AT YOUR GUARD" WORTH ANYTHING?
// The original slot-③ proposal had FOUR targets — Spell / Catalyst / GUARD / banked — and the
// guard one was never built. It would only matter if losing turns actually cost real cards.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 200);
const by = { Complete: {n:0,dmg:0,soak:0}, Narrow: {n:0,dmg:0,soak:0}, Loss: {n:0,dmg:0,soak:0} };
let boostSum = 0, boostN = 0;
for (let i = 0; i < N; i++) {
  useClass('mage'); seed(4400 + i);
  sandbox.RUNSIM.setHook({ onAssign() {
    const S = getS(); if (S.finalMode) return;
    const r = sandbox.computeAction(null); if (!r) return;
    const b = by[r.outcome]; b.n++;
    const dmg = (r.early || 0) + (r.combatDmg || 0);
    b.dmg += dmg;
    // cards a soak of this size costs, at her typical armour per card
    const surge = sandbox.cardById(S.assign.Boost);
    if (surge) { boostSum += sandbox.eff(surge).boost; boostN++; }
    let left = dmg, cards = 0;
    for (const c of S.hand) { if (left <= 0) break; left -= (sandbox.eff(c).armor || 0); cards++; }
    b.soak += cards;
  } });
  try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
}
const tot = by.Complete.n + by.Narrow.n + by.Loss.n;
console.log('outcome     share   avg damage   cards it costs to soak');
for (const k of ['Complete','Narrow','Loss']) {
  const b = by[k];
  console.log(`  ${k.padEnd(9)} ${String(Math.round(100*b.n/tot)).padStart(3)}%    ${(b.dmg/(b.n||1)).toFixed(1).padStart(5)}        ${(b.soak/(b.n||1)).toFixed(2)}`);
}
console.log(`\n  a Surge is worth ${(boostSum/(boostN||1)).toFixed(1)} on average — as SOAK that is`);
console.log(`  roughly ${((boostSum/(boostN||1))/3).toFixed(1)} cards' worth of plate (typical card armour ~3).`);
