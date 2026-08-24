// ⭐ HOW FAST THE BAR MOVES, and how wide the difficulty BAND is now that the pool grows.
// ⚠️ Every ladder number on record was taken through the old `tier <= stage` gate. This is what
// replaces it: one figure at a fresh account, one at the cap.
const H = require('./headless.js');
const B = H.sandbox, S = () => H.getS();
const N = parseInt(process.argv[2] || '60', 10);

function runsAt(level, cls) {
  H.useClass(cls);
  H.setTunable('XP_LEVEL_FORCE', level);   // ⚠️ NEVER `B.X = v` — a top-level `let` in a vm
                                           // script is lexical and a sandbox assignment is a NO-OP
                                           // that silently measures the unchanged game.
  const out = { xp: [], won: 0, n: 0, enc: [] };
  for (let i = 0; i < N; i++) {
    H.seed(1000 + i);
    B.RUNSIM.autoRun(true);
    const s = S();
    out.xp.push(s.xpRun || 0); out.enc.push(s.encountersDone || 0);
    if (s.phase === 'victory') out.won++;
    out.n++;
  }
  H.setTunable('XP_LEVEL_FORCE', 0);
  const avg = a => a.reduce((t, x) => t + x, 0) / a.length;
  return { win: Math.round(100 * out.won / out.n), xp: +avg(out.xp).toFixed(1),
           enc: +avg(out.enc).toFixed(1) };

}
console.log(`n=${N} per cell · XP_PER_LEVEL ${H.getTunable('XP_PER_LEVEL')} · cap ⭐${B.LEVEL_CAP}`);
for (const cls of ['mage', 'rogue']) {
  for (const lv of [1, B.LEVEL_CAP]) {
    const r = runsAt(lv, cls);
    console.log(`  ${cls.padEnd(6)} ⭐${String(lv).padStart(2)}  win ${String(r.win).padStart(3)}%  ` +
                `xp/run ${String(r.xp).padStart(5)}  encounters ${r.enc}`);
  }
}
