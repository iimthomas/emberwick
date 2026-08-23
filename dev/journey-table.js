// 👣 WHAT DO THE JOURNEYS ACTUALLY LOOK LIKE? Straight off the live pools.
'use strict';
const { sandbox } = require('./headless.js');
const found = [];
const walk = (o, where) => {
  if (!o || typeof o !== 'object') return;
  if (Array.isArray(o)) return o.forEach(x => walk(x, where));
  if (o.type === 'journey' && o.mp != null) { found.push({ ...o, where }); return; }
  for (const [k, v] of Object.entries(o)) walk(v, (v && v.name && typeof v.name === 'string' && v.encounters) ? v.name : where);
};
walk(sandbox.REGIONS, 'REGIONS'); walk(sandbox.ROADS, 'ROADS');
// de-dupe by name+mp (the same journey appears in several road pools)
const seen = new Map();
for (const j of found) { const k = j.name + '|' + j.mp + '|' + j.timePenalty; if (!seen.has(k)) seen.set(k, j); }
const J = [...seen.values()];

const tp = {}, mp = {}, nf = {};
for (const j of J) {
  tp[j.timePenalty ?? 0] = (tp[j.timePenalty ?? 0] || 0) + 1;
  mp[j.mp] = (mp[j.mp] || 0) + 1;
  nf[j.nightfall ?? 0] = (nf[j.nightfall ?? 0] || 0) + 1;
}
const dist = (o, label) => {
  const ks = Object.keys(o).map(Number).sort((a,b)=>a-b);
  const tot = ks.reduce((t,k)=>t+o[k],0);
  console.log(`  ${label.padEnd(16)} ` + ks.map(k => `${k}: ${o[k]} (${Math.round(100*o[k]/tot)}%)`).join('  ·  '));
};
console.log(`${J.length} distinct journeys in the pools\n`);
dist(tp, '⏳ Time Penalty'); dist(mp, '👣 MP'); dist(nf, '🌙 Nightfall');

console.log('\n  MP  ⏳  🌙   peril        name');
J.sort((a,b) => (a.mp - b.mp) || (a.timePenalty - b.timePenalty)).forEach(j =>
  console.log(`  ${String(j.mp).padStart(2)}  ${String(j.timePenalty ?? 0).padStart(2)}  ${String(j.nightfall ?? 0).padStart(2)}   ${String(j.peril || '—').padEnd(12)} ${j.name}`));
