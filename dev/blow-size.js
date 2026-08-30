// 📏 HOW BIG IS A BLOW, BY REGION? Needed to set `par` for 57 creatures from data rather than a
// tidy-looking ratio. 🔑 par is *how many turns a competent player takes*, so it must come from
// the damage the game actually produces.
const H = require('./headless.js');
const S = H.sandbox;
const byRegion = {};

const realFinish = S.finishResolve;
S.finishResolve = function () {
  const st = H.getS(), r = st.pendingR, e = st.encounter;
  if (r && e && e.type === 'fight' && !st.finalMode) {
    (byRegion[st.region] = byRegion[st.region] || []).push(Math.max(0, r.value || 0));
  }
  return realFinish.apply(this, arguments);
};
// multi-turn creatures never reach finishResolve on a surviving turn — catch those too
const realApply = S.foeApplyBlow;
S.foeApplyBlow = function (r) {
  const st = H.getS();
  (byRegion[st.region] = byRegion[st.region] || []).push(Math.max(0, r.value || 0));
  return realApply.apply(this, arguments);
};

H.useClass('mage'); H.seed(1212);
S.RUNSIM.batch(true, 30);

const stat = a => {
  const s = a.slice().sort((x, y) => x - y);
  return 'n=' + s.length + ' p25=' + s[Math.floor(s.length * .25)] + ' med=' + s[Math.floor(s.length * .5)] +
         ' p75=' + s[Math.floor(s.length * .75)] + ' avg=' + (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
};
const all = [];
for (const k of Object.keys(byRegion).sort()) { console.log('region', k, stat(byRegion[k])); all.push(...byRegion[k]); }
console.log('ALL      ', stat(all));
