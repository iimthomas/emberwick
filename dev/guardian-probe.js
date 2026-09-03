// 🛡️ THE GUARDIAN, first measurement (build 471). RUNSIM plays her solo at ⭐1; hooks count what
// her kit does: how often the bot taunts vs braces, Wrath at the moment a Bulwark lands, damage
// turned by a brace, and her ladder against the mage's. Also the 8-profile acceptance check.
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 120);
S.clearStage(2);                        // she unlocks at stage 2
H.useClass('guardian'); H.seed(+(process.argv[3] || 20260902));

// acceptance: 8 distinct profiles, every card the best somewhere
const defs = S.GUARDIAN.defs;
const prof = defs.map(d => d.lv.map(r => [r[0], r[2], r[4]].join('/')).join(' · '));
console.log('profiles distinct:', new Set(prof).size, 'of', defs.length);
defs.forEach((d, i) => console.log(`  ${d.name.padEnd(13)} ${d.role.padEnd(8)} ${prof[i]}`));

let turns = 0, taunts = 0, braces = 0, wrathAtBlow = 0, blows = 0, turned = 0, shieldSeated = 0;
const rShield = S.GUARDIAN.shield;
S.GUARDIAN.shield = function (n) { const out = rShield.call(this, n); turned += n - out; return out; };
S.RUNSIM.setHook({ onAssign: () => {
  const st = H.getS();
  if (!st.encounter || st.encounter.type !== 'fight') return;
  turns++;
  if (st.assign.Boost) { shieldSeated++; if (st.guardStance === 'taunt') taunts++; else braces++; }
  const sp = S.spellCard();
  if (sp) { blows++; wrathAtBlow += st.wrath || 0; }
} });
const b = S.RUNSIM.batch(true, N);
const pct = (a, c) => c ? (100 * a / c).toFixed(0) + '%' : '—';
console.log(`runs ${N} · fight turns ${turns} · shield seated ${pct(shieldSeated, turns)} · taunt ${pct(taunts, shieldSeated)} / brace ${pct(braces, shieldSeated)} · avg Wrath at the blow ${(wrathAtBlow / Math.max(1, blows)).toFixed(1)} · damage turned by bracing ${turned}`);
if (b && b.perDragon) console.log('ladder (duel win %):', Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/'), '· road complete', b.completePct + '%');
