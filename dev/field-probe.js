// 🎴 DOES THE FIELD ACTUALLY RENDER? — the check the identity test cannot make.
//
// ⚠️ AN IDENTITY TEST PROVES NOTHING WAS BROKEN. It cannot prove anything was BUILT: if
// renderField() silently returned early on every call, the fingerprint would match perfectly.
// 🔑 Check the SCREEN, not only the state — the standing lesson from the four instrument bugs.
'use strict';
const { sandbox, seed, useClass, els, getS } = require('./headless.js');

const seen = {};      // token id -> a sample of its rendered HTML
let renders = 0, withTokens = 0;

function scan() {
  const f = els['field'];
  if (!f) return;
  renders++;
  const html = f.innerHTML || '';
  if (!html) return;
  withTokens++;
  for (const m of html.matchAll(/class="tok tok-([a-z]+)([^"]*)"/g)) {
    if (!seen[m[1]]) {
      const start = html.indexOf(m[0]);
      seen[m[1]] = { flags: m[2].trim(), sample: html.slice(start, start + 400) };
    }
  }
}

for (const cls of ['mage', 'rogue']) {
  for (let i = 0; i < 40; i++) {
    useClass(cls); seed(2000 + i);
    sandbox.RUNSIM.setHook({ onAssign: scan, onDuelAssign: scan });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) { console.log('THREW', e.message); break; }
  }
}

// force the three ENGINE tokens, which a bot run may never roll
useClass('mage'); seed(7); sandbox.RUNSIM.autoRun(true);
const S = getS();
S.paceBless = 2; S.emberShield = true; S.curseNextFight = true; S.wake = 5; S.wakeTarget = null;
sandbox.renderField(); scan();

console.log(`renders seen: ${renders} · with tokens: ${withTokens}`);
console.log('token ids rendered:', Object.keys(seen).sort().join(', ') || '(NONE — the field never drew)');
for (const k of Object.keys(seen).sort()) {
  console.log(`\n--- ${k} ${seen[k].flags} ---\n` + seen[k].sample.replace(/></g, '>\n<'));
}
