// 🗡️ "8×2 plus a +4 potion should read 12×2" — does it, and does it break the lateral property?
'use strict';
const { sandbox, seed, useClass, getS, setTunable } = require('./headless.js');

// --- 1. the arithmetic, on one hand, both ways -------------------------------
useClass('rogue'); sandbox.freshGame(1); sandbox.draw(4);
const S = getS();
S.momentum = 3; S.phase = 'assign'; sandbox.normalizeAssign();
S.encounter = { type:'fight', name:'test', hp: 40, init: 1, atk: 2, xp: 3 };
for (const on of [false, true]) {
  setTunable('SPLIT_ADDS_PER_HIT', on);
  S.potionFx.value = 0; const plain = sandbox.computeAction(null);
  S.potionFx.value = 4; const pot   = sandbox.computeAction(null);
  S.potionFx.value = 0;
  console.log(`SPLIT_ADDS_PER_HIT=${String(on).padEnd(5)}  hits ${pot.hits}  ` +
    `no potion: ${plain.value}  ·  with +4 potion: ${pot.value}  ·  the potion was worth +${pot.value - plain.value}`);
}

// --- 2. does it break "same blow, different shape"? --------------------------
const N = +(process.argv[2] || 220);
function run(on) {
  setTunable('SPLIT_ADDS_PER_HIT', on);
  const st = {}; let turns = 0, blow = 0;
  const shape = { armour:{n:0,C:0}, evasion:{n:0,C:0}, guard:{n:0,C:0}, none:{n:0,C:0} };
  for (let i = 0; i < N; i++) {
    useClass('rogue'); seed(6100 + i);
    sandbox.RUNSIM.setHook({ onAssign() {
      const s = getS(), e = s.encounter; if (s.finalMode || !e) return;
      const r = sandbox.computeAction(null); if (!r) return;
      turns++; blow += r.value;
      if (e.type === 'fight') { const sh = (e.shapes&&e.shapes[0])||e.shape||'none';
        const b = shape[sh]||shape.none; b.n++; if (r.outcome==='Complete') b.C++; }
    } });
    let m; try { m = sandbox.RUNSIM.autoRun(true); } catch (e) { continue; }
    const s = getS(), k = s.dragon.stage; const o = st[k]||(st[k]={d:0,w:0});
    if (m.win!==null) { o.d++; if (m.win) o.w++; }
  }
  const sh = k => shape[k].n ? Math.round(100*shape[k].C/shape[k].n) : 0;
  return { blow:(blow/turns).toFixed(1),
           duel:[1,2,3,4].map(k=>st[k]&&st[k].d?Math.round(100*st[k].w/st[k].d):0).join('/'),
           shapes:`armour ${sh('armour')}% · guard ${sh('guard')}% · evasion ${sh('evasion')}% · open ${sh('none')}%` };
}
console.log('\n                       blow   duel 1/2/3/4      Complete% by shape');
for (const on of [false, true]) {
  const r = run(on);
  console.log(`per-hit bonuses ${String(on).padEnd(6)} ${r.blow.padStart(4)}   ${r.duel.padEnd(14)}  ${r.shapes}`);
}
setTunable('SPLIT_ADDS_PER_HIT', true);
