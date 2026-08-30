// 🔴 DOES A MID-FIGHT RELOAD SURVIVE? (2026-08-30)
// The screenshot showed a panel that knew it was a beat fight ("turn 1 · par 3") beside a reveal
// that did not ("vs ❤️ 26 (half 13)", LOSS, Early Damage). RUNSIM never saves or loads, so the
// bot cannot see this class of bug at all — it has to be driven by hand.
const H = require('./headless.js');
const S = H.sandbox;
H.useClass('mage'); H.seed(777);

S.startStage(1);
if (H.getS().phase === 'setout') S.pickSetout(H.getS().setout[0].k);
const st0 = H.getS();
st0.region = 1;
S.beginEncounter(JSON.parse(JSON.stringify(S.RUN()[0].encounters.find(x => x.name === 'Cairnstag'))));
S.startFoeBeat();

const before = H.getS();
const shot = {
  beatFight: !!before.encounter.beatFight, hp: before.encounter.hp,
  init: before.encounter.init, atk: before.encounter.atk, turn: before.foeState.turn,
};
S.saveGame();
const ok = S.loadGame();
const after = H.getS();
const shot2 = {
  beatFight: !!after.encounter.beatFight, hp: after.encounter.hp,
  init: after.encounter.init, atk: after.encounter.atk,
  turn: after.foeState && after.foeState.turn,
};
console.log('loadGame() returned :', ok);
console.log('BEFORE reload:', JSON.stringify(shot));
console.log('AFTER  reload:', JSON.stringify(shot2));
console.log(shot.beatFight && !shot2.beatFight
  ? '\n🔴 THE FLAG IS LOST — the rest of the fight runs the one-hand path.'
  : '\n✅ survives');
