// ⚡ HOW STRONG IS STUN, REALLY? (2026-08-30) Thomas: *"stun sounds too strong, should be a
// chance to stun or something"*.
// 🔑 Measure the claim before choosing a fix — and note what Stun actually does today: it nulls
// the creature's ACTIVE ATTACK (the one-turn modifier), NOT its damage. Lose the race and it
// still hits you for its base atk. So "it skips a turn" is not what is implemented.
const H = require('./headless.js');
const S = H.sandbox;
const N = +(process.argv[2] || 600);

function run(mode) {
  const real = S.markWith;
  S.markWith = function (card, r, lvl) {
    if (mode !== 'on') {
      const el = S.elOf(card);
      if (el === 'Lightning') {
        if (mode === 'off') return null;
        // 'margin' — win the race by 3 or more, instead of by any amount
        if (mode === 'margin' && r && S.getS().encounter &&
            ((r.init || 0) - (S.getS().encounter.init || 0)) < 3) return null;
      }
    }
    return real.apply(this, arguments);
  };
  let stuns = 0;
  const rStart = S.startFoeBeat;
  H.useClass('mage'); H.seed(20260830);
  const r = S.RUNSIM.batch(true, N);
  S.markWith = real;
  const o = {};
  for (const [k, v] of Object.entries(r.perDragon)) o[k] = Math.round(100 * v.wins / v.runs);
  o._avg = Math.round(Object.values(o).reduce((a, b) => a + b, 0) / 4);
  return o;
}

const on = run('on'), off = run('off'), margin = run('margin');
const row = (lbl, o) => console.log(lbl.padEnd(22) + JSON.stringify(o));
row('stun ON (today)', on);
row('stun OFF entirely', off);
row('stun needs margin 3', margin);
console.log('\nwin-rate points Stun is worth :', on._avg - off._avg);
console.log('...with a margin-3 condition  :', margin._avg - off._avg);
