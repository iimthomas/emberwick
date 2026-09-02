// 🗡️ the rogue's ladder + her knife stats — `node dev/rogue-ladder.js N`
const H = require('./headless.js'); const S = H.sandbox;
const N = +(process.argv[2] || 240);
const t = {}; let stage = null;
let turns = 0, sticks = 0, rips = 0, leaves = 0, shakes = 0, toolStrikes = 0;
const rs = S.startStage, rd = S.defeat, rv = S.victory, rL = S.log;
S.startStage = function (n) { stage = n; return rs.apply(this, arguments); };
S.defeat = function () { const st = H.getS(); const k = t[stage] = t[stage] || { r: 0, l: 0, w: 0 }; if (st.finalMode) k.l++; else k.r++; return rd.apply(this, arguments); };
S.victory = function () { (t[stage] = t[stage] || { r: 0, l: 0, w: 0 }).w++; return rv.apply(this, arguments); };
S.log = function (m) { if (typeof m === 'string') { if (m.indexOf('sticks —') >= 0) sticks++; if (m.indexOf('She rips') >= 0) rips++; if (m.indexOf('shakes a knife') >= 0) shakes++; } return rL.apply(this, arguments); };
if (S.foeLandBlow) { const rB = S.foeLandBlow; S.foeLandBlow = function (r) { const g = H.getS(); const rr = r || g.pendingR; turns++; if (rr && rr.rogue) { if (rr.rogue.sticks) toolStrikes++; if (rr.rogue.knives && !rr.rogue.rips) leaves++; } return rB.apply(this, arguments); }; }
H.useClass('rogue'); H.seed(20260902); S.RUNSIM.batch(true, N);
const st4 = [1, 2, 3, 4].map(s => t[s] || { r: 0, l: 0, w: 0 });
console.log('rogue ⭐1 win [' + st4.map(k => Math.round(100 * k.w / Math.max(1, k.r + k.l + k.w))).join(',') + '] road death [' + st4.map(k => Math.round(100 * k.r / Math.max(1, k.r + k.l + k.w))).join(',') + ']  fight turns ' + turns + ' · tool Strikes ' + toolStrikes + ' · sticks ' + sticks + ' · rips ' + rips + ' · blade turns with knives left in ' + leaves + ' · shaken loose ' + shakes);
