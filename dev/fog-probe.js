// 🕯️ THE DARK MAP (build 474): the next row is ALWAYS seen; each lit candle adds a row; seen stays seen.
const H = require('./headless.js'); const S = H.sandbox;
H.useClass('mage'); H.seed(1);
const fails = []; const ok = (c, m) => { if (!c) fails.push(m); };
const seenRows = m => m.floors.map(r => r.filter(Boolean).every(n => S.nodeSeen(n)) ? 1 : 0).join('');
const clear = m => m.floors.forEach(r => r.forEach(n => { if (n) n.seen = false; }));
S.freshGame(1); let s = H.getS(); s.phase = 'map'; S.revealMap();
ok(seenRows(s.map).startsWith('110'), 'solo lit at the gate: two rows — got ' + seenRows(s.map));
s.candle = false; clear(s.map); S.revealMap();
ok(seenRows(s.map).startsWith('10'), 'candle out at the gate: the next row only — got ' + seenRows(s.map));
s.candle = true; clear(s.map); S.revealMap(); const ch = S.mapChoices(s.map); S.takeMapNode(ch[0].f, ch[0].c);
S.revealMap();
ok(seenRows(s.map).startsWith('1110'), 'after one step lit: rows 1 and 2 seen, row 3 not — got ' + seenRows(s.map));
s.candle = false; S.revealMap(); ok(seenRows(s.map).startsWith('111'), 'a seen row must stay seen when the candle goes out');
// two-handed
S.setClass(S.MAGE); S.freshGame(1); S.startTwoHanded(1, 'mage', 'rogue'); s = H.getS(); s.phase = 'map';
S.revealMap(); ok(seenRows(s.map).startsWith('1110'), 'two lit candles at the gate: three rows — got ' + seenRows(s.map));
s.hands[1].candle = false; clear(s.map); S.revealMap();
ok(seenRows(s.map).startsWith('110'), 'one of two lit: two rows — got ' + seenRows(s.map));
s.candle = false; clear(s.map); S.revealMap();
ok(seenRows(s.map).startsWith('10'), 'both out: the next row only — got ' + seenRows(s.map));
console.log(fails.length ? '🔴 ' + fails.join('\n') : '✅ fog rules hold');
