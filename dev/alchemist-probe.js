// ⚗️ THE ALCHEMIST, first measurement (build 473). RUNSIM plays her solo at ⭐1 with the bot's
// brewing price and its drink-everything policy. Counts: throws vs fires, brews made (by name),
// concentrations, brews drunk, and her ladder. Also the 8-profile check.
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 120);
H.useClass('alchemist'); H.seed(+(process.argv[3] || 20260903));

const defs = S.ALCHEMIST.defs;
const prof = defs.map(d => d.lv.map(r => [r[0], r[2], r[3], r[4]].join('/')).join(' · '));
console.log('profiles distinct:', new Set(prof).size, 'of', defs.length);
defs.forEach((d, i) => console.log(`  ${d.name.padEnd(15)} ${d.reagent.padEnd(5)} ${prof[i]}`));

let turns = 0, throws = 0, fires = 0, brewed = 0, concentrated = 0, drunk = 0;
const byBrew = {};
const rLog = S.log;
S.log = function (t) {
  if (typeof t === 'string') {
    if (t.indexOf('It is in your kit') >= 0) { brewed++; const m = t.match(/<b>([^<]+)<\/b>/); if (m) byBrew[m[1]] = (byBrew[m[1]] || 0) + 1; }
    if (t.indexOf('concentrates into') >= 0) concentrated++;
    if (/^⚗️ (Balm|Nightshade|Black Nightshade|Wildfire|Greenfire|Quicksilver|Glass|Dragonglass|Tar|Pitch|Elixir|Brimstone|Hellsalt|Stillwater|Ashglass) — /.test(t)) drunk++;
  }
  return rLog.apply(this, arguments);
};
S.RUNSIM.setHook({ onAssign: () => {
  const st = H.getS();
  if (!st.encounter || st.encounter.type !== 'fight' || !st.assign.Boost) return;
  turns++; if (st.stillArmed) throws++; else fires++;
} });
const b = S.RUNSIM.batch(true, N);
const pct = (a, c) => c ? (100 * a / c).toFixed(0) + '%' : '—';
console.log(`runs ${N} · fight turns with a Still card ${turns} · thrown in ${pct(throws, turns)} / fired ${pct(fires, turns)} · brews made ${brewed} (${(brewed / N).toFixed(1)} a run) · concentrated ${concentrated} · brews drunk ${drunk}`);
console.log('by brew:', JSON.stringify(byBrew));
if (b && b.perDragon) console.log('ladder (duel win %):', Object.values(b.perDragon).map(d => Math.round(100 * d.wins / Math.max(1, d.runs))).join('/'), '· road complete', b.completePct + '%');
