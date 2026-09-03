// 📦 EXPORT THE PURE DATA (build 477) — the port's files, generated from the live tables.
// The tables stay in game.js as the runtime truth (a no-build static page cannot fetch JSON
// synchronously without a loader, and the frozen /play/ channel copies an allow-list of files).
// This writes data/*.json from them and REFUSES if a table carries a function — pure data must
// stay pure, and the moment behaviour leaks into one of these it stops being portable.
//   node dev/export-data.js          write data/*.json
//   node dev/export-data.js --check  exit 1 if data/ is stale against game.js
const fs = require('fs'), path = require('path');
const H = require('./headless.js');
const S = H.sandbox;
const OUT = path.join(__dirname, '..', 'data');
const check = process.argv.includes('--check');

function assertPure(name, v, trail) {
  if (typeof v === 'function') throw new Error(`${name}: a function at ${trail} — this table is no longer pure data`);
  if (Array.isArray(v)) v.forEach((x, i) => assertPure(name, x, trail + '[' + i + ']'));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) assertPure(name, v[k], trail + '.' + k);
}
// a road's regions hold creature objects; an encounter may reference a creature by object in
// `pack` etc. — JSON serialises by value, which is what the port wants
const TABLES = {
  cards_mage: S.CARD_DEFS,
  cards_rogue: S.ROGUE_DEFS,
  cards_guardian: S.CLASSES.guardian.defs,
  cards_alchemist: S.CLASSES.alchemist.defs,
  dragons: S.DRAGONS,
  dragon_attacks: S.DRAGON_ATTACKS,
  roads: S.ROADS,
  statuses: S.STATUSES,
  materials: S.MATERIALS,
  recipes: S.RECIPES,
  stage_floors: S.STAGE_FLOORS,
};
let stale = 0, written = 0;
if (!check) fs.mkdirSync(OUT, { recursive: true });
for (const [name, table] of Object.entries(TABLES)) {
  if (table === undefined) { console.log(`⚠️ ${name}: not exported to the sandbox — add it to EXPORTS in dev/headless.js`); continue; }
  assertPure(name, table, name);
  const json = JSON.stringify(table, null, 1) + '\n';
  const file = path.join(OUT, name + '.json');
  if (check) {
    const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (cur !== null && cur.replace(/
/g, '
') !== json) { stale++; console.log(`🔴 ${name}.json is stale`); }   // ⚠️ EOL-insensitive: git rewrites the working copy to CRLF on checkout
  } else { fs.writeFileSync(file, json); written++; }
  const count = Array.isArray(table) ? table.length : Object.keys(table).length;
  console.log(`${check ? '·' : '✅'} ${name}: ${count} entries, ${(json.length / 1024).toFixed(1)} KB`);
}
if (check) { console.log(stale ? `🔴 ${stale} stale — run node dev/export-data.js` : '✅ data/ matches game.js'); process.exit(stale ? 1 : 0); }
console.log(`written ${written} files to ${OUT}`);
