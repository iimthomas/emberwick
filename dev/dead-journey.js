// 🧹 WHAT STILL TALKS ABOUT JOURNEYS? (2026-08-30) Thomas: *"there are charms and potions that
// talk about pace and nightfall and stuff i believe that needs to get removed, and anywhere else"*.
// 🔑 Cutting a system means sweeping for everything denominated in it — the same rule that caught
// ⚔️ lunge silently doing nothing when Early Damage was deleted. Grep is not enough; this asks the
// live tables what they still SAY and what they still GATE on.
const H = require('./headless.js');
const S = H.sandbox;
const WORDS = /\b(pace|nightfall|journey|journeys|Move Points|\bMP\b|peril|perils|road ahead|travel|arriv)/i;

function scan(label, table, textOf) {
  const hits = [];
  for (const k of Object.keys(table || {})) {
    const v = table[k];
    const t = textOf(v, k) || '';
    if (WORDS.test(t)) hits.push('  ' + (v && v.name ? v.name : k) + ' :: ' + String(t).replace(/<[^>]+>/g, '').slice(0, 110));
  }
  console.log('\n' + label + '  (' + hits.length + ')');
  hits.forEach(h => console.log(h));
}

const arr = a => (a || []).reduce((o, x, i) => (o[x.id || x.name || i] = x, o), {});
scan('🎁 CHARMS', arr(S.CHARMS), c => (c.text || '') + ' ' + JSON.stringify(c.mods || {}));
scan('🧪 POTIONS', arr(S.POTIONS), p => (p.text || '') + ' ' + JSON.stringify(p.fx || {}));
scan('❓ EVENTS', arr(S.EVENTS), e => (e.text || '') + ' ' + (e.opts || []).map(o => o.label + ' ' + (o.note || '')).join(' '));
scan('⚠️ HARDSHIPS', S.HARDSHIPS || {}, (v, k) => typeof v === 'string' ? v : (v && v.text) || k);
scan('📜 CONTRACTS', arr(S.CONTRACTS), q => (q.text || q.label || '') + ' ' + (q.track || ''));
scan('🛡️ EQUIPMENT', arr(S.ARMOURS), a => (a.text || '') + ' ' + JSON.stringify(a.mods || {}));
