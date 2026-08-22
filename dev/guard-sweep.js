// 🧱 THE GUARD PASS — find the HP band that makes the shape hard instead of losing.
// Mutates the creature pools at runtime (no file swapping), so one process can sweep.
'use strict';
const { sandbox, seed, useClass, getS } = require('./headless.js');

// --- find every Guard creature in the live pools, and its non-Guard peers ---
const pools = [];
const walk = (o) => {
  if (!o || typeof o !== 'object') return;
  if (Array.isArray(o)) { o.forEach(walk); return; }
  if (o.type === 'fight' && o.hp != null) { pools.push(o); return; }
  Object.values(o).forEach(walk);
};
walk(sandbox.REGIONS); walk(sandbox.ROADS);
const isG = e => e.shape === 'guard' || (e.shapes || []).includes('guard');
const guards = pools.filter(isG), others = pools.filter(e => !isG(e));
const uniq = a => [...new Set(a)];

console.log(`guard creatures: ${guards.length} · other fights: ${others.length}`);
console.log(`  guard HP:  ${uniq(guards.map(g => g.hp)).sort((a,b)=>a-b).join(', ')}   (mean ${(guards.reduce((t,g)=>t+g.hp,0)/guards.length).toFixed(1)})`);
console.log(`  other HP:  min ${Math.min(...others.map(o=>o.hp))} · mean ${(others.reduce((t,o)=>t+o.hp,0)/others.length).toFixed(1)} · max ${Math.max(...others.map(o=>o.hp))}`);
console.log(`  guard values in use: ${uniq(guards.map(g => g.shapeV)).join(', ')}`);
guards.forEach(g => console.log(`    ${String(g.name).padEnd(18)} hp ${String(g.hp).padStart(2)} · guard ${g.shapeV}`));

const BASE = guards.map(g => ({ g, hp: g.hp, v: g.shapeV }));
const restore = () => BASE.forEach(b => { b.g.hp = b.hp; b.g.shapeV = b.v; });

function measure(cls, N) {
  const byV = { 1: { n:0,C:0,Nw:0,L:0 }, 2: { n:0,C:0,Nw:0,L:0 } };
  for (let i = 0; i < N; i++) {
    useClass(cls); seed(2400 + i);
    sandbox.RUNSIM.setHook({ onAssign() {
      const S = getS(), e = S.encounter;
      if (S.finalMode || !e || e.type !== 'fight' || !isG(e)) return;
      const r = sandbox.computeAction(null); if (!r) return;
      const b = byV[e.shapeV] || byV[1];
      b.n++; b[r.outcome === 'Complete' ? 'C' : r.outcome === 'Narrow' ? 'Nw' : 'L']++;
    } });
    try { sandbox.RUNSIM.autoRun(true); } catch (e) {}
  }
  return byV;
}
const fmt = b => b.n ? `${Math.round(100*b.C/b.n)}C/${Math.round(100*b.Nw/b.n)}N/${Math.round(100*b.L/b.n)}L (n${b.n})` : '—';

console.log('\n=== TODAY, split by Guard value ===');
for (const cls of ['mage', 'rogue']) {
  const b = measure(cls, 200);
  console.log(`  ${cls.padEnd(6)} Guard 1: ${fmt(b[1])}    Guard 2: ${fmt(b[2])}`);
}

console.log('\n=== SWEEP — every Guard forced to 1, HP scaled ===');
for (const mult of [1.0, 0.85, 0.75, 0.65, 0.55]) {
  restore();
  BASE.forEach(b => { b.g.shapeV = 1; b.g.hp = Math.max(6, Math.round(b.hp * mult)); });
  const row = ['mage', 'rogue'].map(c => { const b = measure(c, 160); 
    const t = { n: b[1].n + b[2].n, C: b[1].C + b[2].C, Nw: b[1].Nw + b[2].Nw, L: b[1].L + b[2].L };
    return `${c} ${fmt(t)}`; });
  console.log(`  HP ×${mult.toFixed(2)} (${BASE.map(b=>b.g.hp).join('/')})  ${row.join('   ')}`);
}
restore();
