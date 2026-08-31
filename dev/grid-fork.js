// 🏷️ HOW MANY MARKS CAN ACTUALLY FIRE IN ONE TURN, and does marking beat attuning? (2026-08-30)
// Thomas: *"can 2 elemental spells fire off if they are in the right slot? sounds powerful, seems
// like people might want to do that instead of attuning for damage? dunno"*
// 🔑 The ceiling is not a rule we get to choose — it is a property of the hand. One card per slot,
// so the most marks you can land is the number of DISTINCT ARCHETYPES you drew.
const H = require('./headless.js');
const S = H.sandbox;
const archHome = { FORCE: 'Spell', SPARK: 'Element', FLOW: 'Boost' };

const dist = {}, atHomeNaive = {}, hands = [];
let n = 0;

const rr = S.resolve;
S.resolve = function () {
  const st = H.getS();
  if (st && st.hand && st.hand.length === 4 && st.encounter && st.assign) {
    n++;
    const distinct = new Set(st.hand.map(c => c.def.arch)).size;
    dist[distinct] = (dist[distinct] || 0) + 1;
    // how many seated cards happen to be at home in the arrangement the BOT chose — the bot
    // optimises damage and knows nothing about marks, so this is "marks you get for free"
    let home = 0;
    for (const a of ['FORCE', 'SPARK', 'FLOW']) {
      const id = st.assign[archHome[a]];
      const c = id ? st.hand.find(x => x.id === id) : null;
      if (c && c.def.arch === a) home++;
    }
    atHomeNaive[home] = (atHomeNaive[home] || 0) + 1;
    // 🔑 THE CRUX: can this hand attune AND home the Catalyst? That needs the ONE SPARK card whose
    // element matches a FORCE card you could lead — four such cards in a sixteen-card deck.
    const spellEls = new Set(st.hand.filter(c => c.def.arch === 'FORCE').map(c => S.elOf(c)));
    const both = st.hand.some(c => c.def.arch === 'SPARK' && spellEls.has(S.elOf(c)));
    const els = st.hand.map(c => S.elOf(c)).filter(Boolean);
    const canAttune = els.some((e, i) => els.indexOf(e) !== i);
    hands.push({ both, canAttune });
  }
  return rr.apply(this, arguments);
};

H.useClass('mage'); H.seed(20260830);
S.RUNSIM.batch(true, 300);

const pc = (a, b) => b ? (100 * a / b).toFixed(0) + '%' : '—';
console.log('hands seen:', n);
console.log('\nDISTINCT ARCHETYPES IN HAND  (the ceiling on marks per turn)');
for (const k of Object.keys(dist).sort()) console.log('   ' + k + ' :', String(dist[k]).padStart(5), pc(dist[k], n));
console.log('\nMARKS YOU GET WHILE PLAYING PURELY FOR DAMAGE (the bot never aims for them)');
for (const k of Object.keys(atHomeNaive).sort()) console.log('   ' + k + ' :', String(atHomeNaive[k]).padStart(5), pc(atHomeNaive[k], n));
const att = hands.filter(h => h.canAttune).length;
console.log('\nhands that can attune at all              :', pc(att, n));
console.log('hands that can attune AND home the Catalyst:', pc(hands.filter(h => h.both).length, n),
            '  (of attunable hands:', pc(hands.filter(h => h.both).length, att) + ')');
