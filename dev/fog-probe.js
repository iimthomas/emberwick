// 🕯️ THE DARK MAP (build 467): a lit candle shows the next row; two lit candles two rows; seen stays seen.
const H = require('./headless.js'); const S = H.sandbox;
H.useClass('mage'); H.seed(1);
const fails = []; const ok = (c, m) => { if (!c) fails.push(m); };
const seenRows = m => m.floors.map(r => r.filter(Boolean).every(n => S.nodeSeen(n)) ? 1 : 0);
S.freshGame(1); let s = H.getS(); s.phase = 'map'; S.revealMap();
ok(seenRows(s.map)[0] === 1 && seenRows(s.map)[1] === 0, 'solo lit at the gate: row 0 seen, row 1 not — got ' + seenRows(s.map).join(''));
s.candle = false; s.map.floors.forEach(r => r.forEach(n => { if (n) n.seen = false; })); S.revealMap();
ok(seenRows(s.map)[0] === 0, 'candle out at the gate should show nothing');
s.candle = true; S.revealMap(); const ch = S.mapChoices(s.map); S.takeMapNode(ch[0].f, ch[0].c);
S.revealMap(); const rows = seenRows(s.map);
ok(rows[1] === 1 && rows[2] === 0, 'after one step lit: row 1 seen, row 2 not — got ' + rows.join(''));
s.candle = false; S.revealMap(); ok(seenRows(s.map)[1] === 1, 'a seen row must stay seen when the candle goes out');
// two-handed, both lit
S.setClass(S.MAGE); S.freshGame(1); S.startTwoHanded(1, 'mage', 'rogue'); s = H.getS(); s.phase = 'map';
S.revealMap(); const r2 = seenRows(s.map);
ok(r2[0] === 1 && r2[1] === 1 && r2[2] === 0, 'two lit candles at the gate: two rows — got ' + r2.join(''));
s.hands[1].candle = false; s.map.floors.forEach(r => r.forEach(n => { if (n) n.seen = false; })); S.revealMap();
ok(seenRows(s.map)[0] === 1 && seenRows(s.map)[1] === 0, 'one of two lit: one row');
console.log(fails.length ? '🔴 ' + fails.join('\n') : '✅ fog rules hold');
