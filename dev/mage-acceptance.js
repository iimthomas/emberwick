// 🎯 THE MAGE AGAINST HER OWN ACCEPTANCE TESTS (2026-09-01). The 16-card brief set four, and
// three are on record as "the run-100 test made numeric". This asks all four in one place so
// "is the mage in a good spot" is a printout rather than a feeling.
//   (1) 16 distinct profiles of 16   (2) every card optimal in SOME hand
//   (3) every card chosen for >=2 different slots   (4) attune availability / obligation (separate probe)
// ⚠️ Slot usage is under BOT play, which maximises one encounter — a human misses the attune ~1 turn
// in 5, so a card the bot never seats at home is not proof a player never would.
const H = require('./headless.js');
const S = H.sandbox;

// ── (1) distinct profiles: the 4-stat vector at every level ────────────────
const sig = d => [1, 2, 3, 4].map(l => (d.lv[l - 1] || []).slice(0, 5).join(',')).join('|');
const seen = new Map();
for (const d of S.CARD_DEFS) { const k = sig(d); seen.set(k, (seen.get(k) || []).concat(d.name)); }
const dupes = [...seen.values()].filter(v => v.length > 1);
console.log('(1) distinct profiles:', seen.size, 'of', S.CARD_DEFS.length, dupes.length ? '🔴 DUPES ' + JSON.stringify(dupes) : '✅');

// ── (2)+(3) slot usage per card, and whether it is ever at HOME ────────────
const use = {};   // name -> { Spell, Element, Boost, Reserve, soak, home }
const HOME = { FORCE: 'Spell', SPARK: 'Element', FLOW: 'Boost', WARD: 'soak' };
const bump = (n, z) => { const u = use[n] = use[n] || { Spell: 0, Element: 0, Boost: 0, Reserve: 0, soak: 0, home: 0, turns: 0 }; u[z]++; };

const rr = S.resolve;
S.resolve = function () {
  const st = H.getS();
  if (st && st.assign && st.hand && st.encounter && !st.finalMode) {
    for (const z of ['Spell', 'Element', 'Boost', 'Reserve']) {
      const c = st.hand.find(x => x.id === st.assign[z]); if (!c) continue;
      bump(c.def.name, z); use[c.def.name].turns++;
      if (HOME[c.def.arch] === z) use[c.def.name].home++;
    }
  }
  return rr.apply(this, arguments);
};
const rs = S.soakWith;
S.soakWith = function (id) {
  const st = H.getS(); const c = st.hand.find(x => x.id === id);
  if (c) { bump(c.def.name, 'soak'); if (c.def.arch === 'WARD') use[c.def.name].home++; }
  return rs.apply(this, arguments);
};

H.useClass('mage'); H.seed(20260901);
S.RUNSIM.batch(true, 200);

console.log('\n(2)+(3) SLOT USAGE PER CARD  (bot, 200 runs)   ✱ = its home slot');
console.log('card            arch   Spell  Cata   Surge  Arsn   soak   slots≥5%   at-home%');
let fail2 = [], fail3 = [];
for (const d of S.CARD_DEFS) {
  const u = use[d.name] || { Spell: 0, Element: 0, Boost: 0, Reserve: 0, soak: 0, home: 0, turns: 0 };
  const tot = u.Spell + u.Element + u.Boost + u.Reserve + u.soak || 1;
  const pc = z => Math.round(100 * u[z] / tot);
  const slots = ['Spell', 'Element', 'Boost', 'Reserve', 'soak'].filter(z => pc(z) >= 5).length;
  const mark = z => (HOME[d.arch] === z ? '✱' : ' ');
  if (!u.Spell) fail2.push(d.name);
  if (slots < 2) fail3.push(d.name);
  console.log(d.name.padEnd(15) + d.arch.padEnd(7) +
    (pc('Spell') + '%' + mark('Spell')).padEnd(7) + (pc('Element') + '%' + mark('Element')).padEnd(7) +
    (pc('Boost') + '%' + mark('Boost')).padEnd(7) + (pc('Reserve') + '%').padEnd(7) + (pc('soak') + '%' + mark('soak')).padEnd(7) +
    String(slots).padStart(5) + '        ' + Math.round(100 * u.home / Math.max(1, u.turns + u.soak)) + '%');
}
console.log('\n(2) never the Spell     :', fail2.length ? '🔴 ' + fail2.join(', ') : '✅ every card leads sometimes');
console.log('(3) fewer than 2 slots  :', fail3.length ? '🔴 ' + fail3.join(', ') : '✅ every card in ≥2 slots');
