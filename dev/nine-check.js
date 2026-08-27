// 🏹 DOES EACH OF THE NINE ACTUALLY DO ANYTHING?
// 🔑 The recorded failure mode is "a rule that fires without appearing" — four instances in one
// day once. So this asserts each ongoing/use CHANGES AN OBSERVABLE, not that the text exists.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
H.setTunable('XP_LEVEL_FORCE', 6); H.useClass('mage'); B.RUNSIM.setBankWeight(1.0);

const wear = id => { const s = S(); s.armour.push(B.newArmour(id)); };
const results = [];
function check(name, fn) { try { results.push([name, fn() ? 'PASS' : 'FAIL']); } catch (e) { results.push([name, 'ERR ' + e.message]); } }

let ran = false;
B.RUNSIM.setHook({ onAssign: () => {
  if (ran) return; const s = S(); if (!s.encounter || s.encounter.type !== 'fight') return; ran = true;

  check('everlit  · candle never snuffs', () => {
    s.armour = []; s.candle = true; B.snuffCandle('a test'); const without = s.candle;
    s.candle = true; wear('deepglass'); B.snuffCandle('a test'); const with_ = s.candle;
    s.armour = []; return without === false && with_ === true;
  });

  check('farsight · +2 Init while lit', () => {
    s.armour = []; s.candle = true; const a = B.computeAction().init;
    wear('farhood'); const b = B.computeAction().init; s.armour = [];
    return b === a + 2;
  });

  check('firstlight · wins the race', () => {
    s.armour = []; s.encounter.init = 99;
    const lost = B.computeAction().initLost;
    s.armourWinInit = true; const won = B.computeAction().initLost;
    s.armourWinInit = false; return lost === true && won === false;
  });

  check('softfall · Lv1 goes to discard, not lost', () => {
    s.armour = []; const c = s.hand[0]; c.level = 1;
    const t0 = s.trashed.length, d0 = s.discard.length;
    wear('boarcoat'); B.downgrade(c, '');
    const ok = s.trashed.length === t0 && s.discard.length === d0 + 1;
    s.armour = []; return ok;
  });

  check('ledger · +8 coins on a destroyed card', () => {
    s.armour = []; const c = s.hand[0] || s.deck[0]; c.level = 1;
    if (!s.hand.includes(c)) s.hand.push(c);
    wear('oxharness'); const g0 = s.coins; B.downgrade(c, '');
    const ok = s.coins === g0 + 8; s.armour = []; return ok;
  });

  check('tidewall · damage falls as you spread it', () => {
    s.armour = []; wear('siltplate');
    s.damage = 10; s.downgraded = new Set(['x', 'y']);
    const card = s.hand.find(c => c.level > 1) || s.hand[0];
    B.soakWith(card.id);
    const ok = s.damage < 10 - B.soakValue(card);   // the plate ate 2 on top of the card
    s.armour = []; s.damage = 0; s.downgraded = new Set(); return ok;
  });
}});
H.seed(11); try { B.RUNSIM.autoRun(true); } catch (e) {}

// -- the three that need a journey or a region break: tested for real ------
// The first cut of this file returned `true` for these and printed PASS. That is a test passing
// over untested code - the exact fault this file exists to catch, committed inside the file that
// catches it. If a check cannot be run it must say SKIP, never PASS.
let ranJ = false;
B.RUNSIM.setHook({ onAssign: () => {
  if (ranJ) return; const s = S();
  if (!s.encounter || s.encounter.type !== 'journey') return; ranJ = true;

  check('swiftfoot . Pace reads your fastest card', () => {
    s.armour = [];
    const a = B.computeAction().pace;
    wear('lanterngreave');
    const b = B.computeAction().pace;
    const best = Math.max.apply(null, s.hand.map(function (c) { return B.eff(c).init; }));
    s.armour = [];
    return b >= a && b >= best;
  });

  check('nightwise . Nightfall keeps your Arsenal', () => {
    // computeAction() takes the ARSENAL CARD as its argument. Calling it bare leaves `reserve`
    // undefined, and the loseReserve branch is `nightCaught && reserve && ...` - so a bare call
    // can never lose an Arsenal and the check silently tested nothing. resolve() passes it.
    const res = B.cardById(s.assign.Reserve);
    s.armour = []; s.encounter.nightfall = 99;
    const lost = B.computeAction(res).loseReserve;
    wear('grindshin');
    const kept = B.computeAction(res).loseReserve;
    s.armour = [];
    return !!lost && !kept;
  });
}});
H.seed(21); try { B.RUNSIM.autoRun(true); } catch (e) {}
if (!ranJ) results.push(['swiftfoot / nightwise', 'SKIP - no journey drawn']);

// dawnlit needs a LIVE run - the first version ran after autoRun() had finished, against an
// ended state, and reported FAIL for a rule that works. A check run outside the state it describes
// is not a check.
H.seed(5); B.freshGame(1);
check('dawnlit . relit at the region break', () => {
  const s = S(); s.armour = []; s.candle = false;
  wear('dawncap');
  B.nextRegion();
  return S().candle === true;
});

console.log('\n🏹 THE NINE — do the rules fire?\n');
for (const [n, r] of results) console.log('  ' + (r === 'PASS' ? '✅' : '❌') + ' ' + n.padEnd(44) + r);
