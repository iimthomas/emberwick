// 🔴 WHY IS STAGE 1 THE HARDEST? (2026-08-30) Thomas: *"i think i like the other numbers but why
// is the first one so hard"*. My standing answer has been "the six-floor map" — which is a
// hypothesis I have now repeated three times without measuring. 🔑 Check the data, not the note.
const H = require('./headless.js');
const S = H.sandbox;
const at = {};

const realBegin = S.beginFinalBattle;
S.beginFinalBattle = function () {
  const st = H.getS(), s = st.dragon.stage;
  const k = at[s] = at[s] || { n: 0, levels: 0, cards: 0, coins: 0, enc: 0, par: st.dragon.par, hp: 0 };
  k.n++; k.levels += S.deckLevels(); k.coins += st.coins; k.enc += st.turn;
  k.cards += st.deck.length + st.hand.length + st.discard.length;
  k.hp += st.dragon.hp + (H.getTunable('DRAGON_HP_ADD')[s] || 0);
  // 🔑 THE SHAPE OF THE DECK, NOT ITS TOTAL. Levelling is SHARPENING - the spike is what a blow
  // is made of - so "30 levels" and "24 levels" say nothing until you know how they are spread.
  const all = [...st.deck, ...st.hand, ...st.discard];
  k.lv4 = (k.lv4 || 0) + all.filter(c => c.level >= 4).length;
  k.lv3 = (k.lv3 || 0) + all.filter(c => c.level >= 3).length;
  k.top = (k.top || 0) + Math.max(0, ...all.map(c => c.level));
  // 🔑 THE DECK IS NOT THE ONLY THING THAT FEEDS A BLOW. Charms, potions and equipment are all
  // bought with encounters, and stage 1 has eight of them to everyone else's seventeen.
  k.charms = (k.charms || 0) + (st.charms || []).length;
  k.potions = (k.potions || 0) + (st.potions || []).length;
  return realBegin.apply(this, arguments);
};
// how big is the blow that actually lands on the dragon, and what does its shape eat?
const blow = {};
const realStrike = S.duelStrike;
S.duelStrike = function (r) {
  const out = realStrike.apply(this, arguments);
  const s = H.getS().dragon.stage;
  const b = blow[s] = blow[s] || { n: 0, raw: 0, toHp: 0 };
  b.n++; b.raw += Math.max(0, r.value || 0); b.toHp += out.toHp || 0;
  b.att = (b.att || 0) + (r.enhUsed ? 1 : 0);
  b.base = (b.base || 0) + (r.base || 0);
  b.boost = (b.boost || 0) + (r.boostEff || 0);
  b.wake = (b.wake || 0) + (r.wake || 0);
  return out;
};

H.useClass('mage'); H.seed(20260830);
S.RUNSIM.batch(true, 800);

const N = { 1: 'Cindermaw', 2: 'Skyrender', 3: 'Cragmourn', 4: 'Fathomdread' };
console.log('stage dragon        reached  encounters  cards  deck lvls (par)  Lv3+  Lv4  best  charms  potions');
for (const s of [1, 2, 3, 4]) {
  const k = at[s]; if (!k) continue;
  const a = x => (x / k.n).toFixed(1);
  console.log('  ' + s + '   ' + N[s].padEnd(13) + String(k.n).padStart(4) + '     ' +
    a(k.enc).padStart(5) + '    ' + a(k.cards).padStart(5) + '    ' +
    a(k.levels).padStart(5) + ' (' + k.par + ')    ' +
    a(k.lv3).padStart(4) + ' ' + a(k.lv4).padStart(4) + '  ' + a(k.top) +
    '    ' + a(k.charms).padStart(4) + '    ' + a(k.potions));
}
console.log('');
console.log('stage   base  + surge  + wake  =  blow   attuned%   after shape   eaten');
for (const s of [1, 2, 3, 4]) {
  const b = blow[s]; if (!b) continue;
  const raw = b.raw / b.n, hit = b.toHp / b.n;
  const a = x => (x / b.n).toFixed(1).padStart(5);
  console.log('  ' + s + '   ' + a(b.base) + '   ' + a(b.boost) + '   ' + a(b.wake) + '   ' +
    raw.toFixed(1).padStart(5) + '    ' + String(Math.round(100 * b.att / b.n)).padStart(3) + '%   ' +
    hit.toFixed(1).padStart(7) + '      ' + Math.round(100 * (1 - hit / raw)) + '%');
}
