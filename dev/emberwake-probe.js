// 🔥 WHY DOESN'T THE EMBERWAKE FEEL LIKE PART OF HER KIT?
//
// Thomas: *"i want the emberwake to be a bigger part of her kit.. the way to get it is probably
// not good enough."*
//
// ⚠️ THE BOT CAN NEVER BANK — it scores ONE encounter, so trading this turn's boost for next
// turn's token is always negative to it. Uptake is therefore UNMEASURABLE (a previous "fires on
// 0.8% of turns" line was retracted for exactly this). So measure the CONDITIONS instead:
//   1. availability — how often can she bank at all?
//   2. price — how often does banking actually cost an outcome tier?
//   3. size — is an Emberwake even worth holding?
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');
const N = +(process.argv[2] || 200);

const TIER = { Complete: 2, Narrow: 1, Loss: 0 };
let turns = 0, hasSurge = 0, free = 0, costsTier = 0, boostSum = 0, boostN = 0;
const bands = { alreadyWon: 0, alreadyLost: 0, stuckNarrow: 0, live: 0 };
const sizes = {};

for (let i = 0; i < N; i++) {
  useClass('mage'); seed(4400 + i);
  sandbox.RUNSIM.setHook({
    onAssign() {
      const S = getS();
      if (S.finalMode) return;
      turns++;
      const surge = sandbox.cardById(S.assign.Boost);
      if (!surge) return;
      hasSurge++;
      const v = sandbox.bankValueOf(surge);
      boostSum += v; boostN++;
      sizes[v] = (sizes[v] || 0) + 1;

      // spend it (normal) vs bank it (boost withheld) — same arrangement, both ways
      S.bankArmed = false; const spent = sandbox.computeAction(null);
      S.bankArmed = true;  const banked = sandbox.computeAction(null);
      S.bankArmed = false;
      if (!spent || !banked) return;
      const d = TIER[spent.outcome] - TIER[banked.outcome];
      if (d === 0) free++; else costsTier++;
      // WHY was it free? the recorded framing: you bank when THIS turn is already decided
      if (d === 0) {
        if (banked.outcome === 'Complete') bands.alreadyWon++;
        else if (banked.outcome === 'Loss') bands.alreadyLost++;
        else bands.stuckNarrow++;
      } else bands.live++;
    },
  });
  try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
}

const p = n => Math.round(100 * n / (hasSurge || 1));
console.log(`turns ${turns} · a Surge card was seated on ${Math.round(100*hasSurge/(turns||1))}% of them\n`);
console.log(`  🔑 banking is FREE (same outcome either way): ${p(free)}%`);
console.log(`     ...because the turn was already won      ${p(bands.alreadyWon)}%`);
console.log(`     ...already lost                          ${p(bands.alreadyLost)}%`);
console.log(`     ...stuck on Narrow                       ${p(bands.stuckNarrow)}%`);
console.log(`  ⚠️ banking COSTS an outcome tier:            ${p(costsTier)}%\n`);
console.log(`  Emberwake size if banked: mean ${(boostSum/(boostN||1)).toFixed(1)}`);
const ks = Object.keys(sizes).map(Number).sort((a,b)=>a-b);
console.log(`    distribution: ${ks.map(k => `${k}:${Math.round(100*sizes[k]/boostN)}%`).join('  ')}`);
console.log(`\n  for scale — her duel blow is ~14.8, an ordinary creature has ~12.7 HP.`);
