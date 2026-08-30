// ⚔️ Drives real beat fights and reports, per turn: did a reveal modal open, and what dropped.
const H = require('./headless.js');
const S = H.sandbox;
H.useClass('mage'); H.seed(9001);

const seen = { starts: 0, modals: 0, modalsInBeat: 0, kills: 0, banks: [] };

const realStart = S.startFoeBeat;
S.startFoeBeat = function () { seen.starts++; return realStart.apply(this, arguments); };

const realAdvance = S.advanceBeat;
S.advanceBeat = function () {
  // ⚠️ advanceBeat() steps EVERY beat of a reveal, so counting calls counts BEATS. A reveal
  // OPENS when beatIndex is still -1 — count that, or four stages of one modal read as four modals.
  const st = H.getS();
  const opening = st && st.beatIndex === -1;
  if (opening) {
    seen.modals++;
    if (st.encounter && st.encounter.beatFight) seen.modalsInBeat++;
  }
  return realAdvance.apply(this, arguments);
};

const realApply = S.foeApplyBlow;
S.foeApplyBlow = function (r) { const felled = realApply.apply(this, arguments); if (felled) seen.kills++; return felled; };

const realBank = S.bankDrops;
S.bankDrops = function (bag) { seen.banks.push(bag || {}); return realBank.apply(this, arguments); };

S.RUNSIM.batch(true, 12);
const n = Object.keys(seen.banks.length ? seen.banks : []).length;
console.log('beat-fight turns started :', seen.starts);
console.log('beat-fight kills         :', seen.kills);
console.log('reveal modals, whole run :', seen.modals);
console.log('  ...of those, DURING a beat fight:', seen.modalsInBeat,
            '  (should equal kills =', seen.kills + ')');
console.log('drop bags banked         :', seen.banks.length,
            '· empty:', seen.banks.filter(b => !Object.keys(b).length).length);
console.log('sample fight bags:', JSON.stringify(seen.banks.filter(b => b.shard).slice(0, 5)));

// ── and does the LOG carry what the modal used to show? ────────────────────
// 🔑 The whole fix is "move the information, remove the interruption" — so the silent turn has to
// be provably NOT silent in the log, or this traded a nuisance for a black box.
H.seed(9001); H.useClass('mage');
const lines = [];
const realLog2 = S.log;
S.log = function (t, c) { lines.push(String(t).replace(/<[^>]+>/g, '')); return realLog2.apply(this, arguments); };
for (let i = 0; i < 8 && !lines.some(l => /ATTACK/.test(l)); i++) { lines.length = 0; S.RUNSIM.run(true); }
const start = lines.findIndex(l => /ATTACK/.test(l));
if (start < 0) console.log('\n(no second fight turn in this run)');
else {
  console.log('\n── the log across one silent turn ──');
  lines.slice(start, start + 14).forEach(l => console.log('   ', l.slice(0, 110)));
}
