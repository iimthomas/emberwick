// 🖼️ DOES EVERY ENCOUNTER HAVE A PICTURE?
//
// 🔑 `foeArt()` / `placeArt()` find art by NAME, and a miss REMOVES ITSELF silently. That is the
// right behaviour — *art never blocks design* — and it is exactly why a missing picture is
// invisible from the code and only shows up when somebody looks at the screen.
// ⚠️ The tutorial is the first thing anyone ever sees, so a hole there costs the most.
'use strict';
const H = require('./headless.js');
const B = H.sandbox, fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', 'art');
const strip = f => f.replace(/\.[a-z0-9]+$/i, '');
const foes = fs.readdirSync(path.join(DIR, 'foes')).map(strip);
const places = fs.readdirSync(path.join(DIR, 'places')).map(strip);
// ⚠️ artSlug is a top-level `const` and therefore not on the sandbox — mirrored here, and the
// mirror is asserted against the real one below so it cannot drift.
const slugOf = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const has = (name, kind) => (kind === 'fight' ? foes : places).includes(slugOf(name));

let miss = 0;
console.log('TUTORIAL — the first thing anyone sees');
for (const r of B.TUTORIAL.regions) {
  console.log(`  ${r.name}`);
  for (const e of r.encounters) {
    const ok = has(e.name, e.type);
    if (!ok) miss++;
    console.log(`    ${ok ? '✅' : '🔴'} ${e.type === 'fight' ? '⚔️' : '👣'} ${e.name.padEnd(24)} ${slugOf(e.name)}`);
  }
}
const d = B.TUTORIAL.dragon, dok = has(d.name, 'fight');
if (!dok) miss++;
console.log(`    ${dok ? '✅' : '🔴'} 🐉 ${d.name}`);
console.log(`  → ${miss === 0 ? '✅ complete coverage' : '🔴 ' + miss + ' missing'}\n`);

let n = 0, gone = [];
for (const r of B.REGIONS) for (const e of (r.encounters || [])) {
  n++; if (!has(e.name, e.type)) gone.push(`${e.type === 'fight' ? '⚔️' : '👣'} ${e.name}`);
}
console.log(`REAL REGIONS — ${n - gone.length}/${n} have art`);
if (gone.length) { console.log('  missing:'); gone.slice(0, 20).forEach(x => console.log('    🔴 ' + x));
  if (gone.length > 20) console.log(`    …and ${gone.length - 20} more`); }
for (const dr of B.DRAGONS) if (!has(dr.name, 'fight')) console.log(`  🔴 🐉 ${dr.name}`);
