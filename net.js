// ============================================================
// 🌐 NETWORKED CO-OP, FIRST CUT (2026-09-03, build 479) — [[Two_Handed_Mode]] §4b.
//
// 🔑 THE HOST RUNS THE WHOLE GAME; THE GUEST IS A MIRROR WITH CONTROLS. Every action in this game
// is already an `onclick="fn(args)"` string, so the guest's page intercepts the click, sends the
// call to the host over a WebRTC data channel, the host runs it with the guest's hand loaded, and
// broadcasts the whole state back in the save format (which already carries both hands). Turn
// order is exactly Two-Handed's: whoever's hand is active acts, the other watches, cards hidden.
// This is the hot-seat over a wire — the smallest honest version. Simultaneous arranging, hidden
// hands for real, and reconnects are not built.
//
// ⚠️ NOTHING IN game.js KNOWS THIS FILE EXISTS beyond three hooks: gameData()/loadGameData() (the
// save format as an object), an `onlinePartyHTML()` call on the Stages screen, and the fact that
// top-level functions of a classic script are properties of window and can be wrapped here.
// Transport: PeerJS (a public handshake server; the game data goes browser to browser).
// ============================================================
const NET = {
  role: null,          // 'host' | 'guest'
  peer: null, conn: null, code: null, status: '',
  myIdx: 0,            // the hand this browser plays: host 0, guest 1
  guestCls: null,      // what the guest joined as (host side)
  get guest() { return this.role === 'guest'; },
  get host() { return this.role === 'host'; },
  get live() { return !!(this.conn && this.conn.open); },
};
// what a guest may ask the host to run — the game's own UI verbs, never the shell or the dev tools
const NET_ALLOW = /^(tap(Card|Zone|Node)|assignRole|resolve(Duel)?|soakWith(Armour)?|advanceBeat|toggle(Bank|Stance|Still|Mark|Rip|Fork)|setFront|bribe|cycleWake|use(Potion|PotionOn|ArmourActive)|cancel(Potion|HearthPick|MendPick)|givePotion|pick(Setout|Boon)|wheel(Buy|Done|Reroll|Spin)|buyUpgrade|previewUpgrade|doneUpgrades|swapHand|peekNode|takeMapNode|hearth(Light|Forge|MendPick)|start(HearthPick|MendPick)|stackPick|setFoeTarget|event(Choose|Continue|PickCard|CancelPick)|backToMap|nextRegion|beginFinalBattle|finishStack|takeBoon)$/;
// phases where the ACTIVE HAND's owner acts; everything else (the map, events, the shell) is the host's
const NET_HAND_PHASES = ['assign', 'soak', 'reveal', 'wheel', 'hearth', 'hearthpick', 'mendpick', 'eliteboon', 'setout', 'stack', 'upgrade'];

// 💾 the room is remembered per browser, so a reload can offer Rejoin / Reopen with the same code
function netRemember() { try { localStorage.setItem('emberwick-net-1' + KEY_NS, JSON.stringify({ role: NET.role, code: NET.code })); } catch (e) {} }
function netForget() { try { localStorage.removeItem('emberwick-net-1' + KEY_NS); } catch (e) {} }
function netRemembered() { try { const d = JSON.parse(localStorage.getItem('emberwick-net-1' + KEY_NS) || 'null'); return d && d.code ? d : null; } catch (e) { return null; } }
function netCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
function netPeerId(code) { return 'emberwick-' + code.toUpperCase(); }
function netSet(status) { NET.status = status; try { render(); } catch (e) {} }

// ---------- host ----------
function netHost(code) {
  if (typeof Peer === 'undefined') { netSet('The connection library did not load — are you online?'); return; }
  netLeave();
  NET.role = 'host'; NET.myIdx = 0; NET.code = code ? String(code).toUpperCase() : netCode();
  netRemember();
  netSet('Opening a room…');
  const peer = new Peer(netPeerId(NET.code));
  NET.peer = peer;
  peer.on('open', () => netSet(`Room <b>${NET.code}</b> — waiting for a partner to join.`));
  peer.on('error', e => { if (String(e.type) === 'unavailable-id') { if (!code) { NET.code = netCode(); netHost(); } else netSet('That room is still open somewhere else — close it there, or host a new one.'); return; } netSet('Connection error: ' + (e.type || e)); });
  peer.on('connection', conn => {
    // 🔁 a returning partner replaces a dead connection; a second stranger is refused
    if (NET.conn && NET.conn.open) { conn.close(); return; }
    NET.conn = conn;
    conn.on('data', m => netOnHostMessage(m));
    conn.on('close', () => netSet(`Your partner's connection dropped — the room <b>${NET.code}</b> stays open for them to rejoin.`));
    conn.on('open', () => { netSet(`Partner connected to room <b>${NET.code}</b>.${S && S.hands ? '' : ' Choose a stage.'}`); netBroadcast(); });
  });
}
function netOnHostMessage(m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'hello') {
    // 🔁 a live run keeps the class the guest joined with — a rejoin never re-rolls the party
    if (S && S.hands && S.hands.length > 1) { NET.guestCls = S.hands[1].cls; netSet(`Partner is back in room <b>${NET.code}</b>.`); netBroadcast(); return; }
    NET.guestCls = (typeof CLASSES !== 'undefined' && CLASSES[m.cls]) ? m.cls : 'rogue';
    // the party switch, answered by the wire instead of the picker
    pickedMode = () => 'two';
    pickedPartnerId = () => NET.guestCls;
    netSet(`Partner joined as the <b>${CLASSES[NET.guestCls].name}</b>. Choose a stage.`);
    netBroadcast();
    return;
  }
  if (m.t === 'cmd') netRunGuestCommand(m);
}
function netRunGuestCommand(m) {
  const fn = String(m.fn || '');
  if (!NET_ALLOW.test(fn) || typeof window[fn] !== 'function') return;
  if (!S || !isTwoHanded()) return;
  // the guest acts only with THEIR hand loaded, in a hand phase
  if (S.handIdx !== 1 || !NET_HAND_PHASES.includes(S.phase)) { netBroadcast(); return; }
  try { window[fn].apply(null, Array.isArray(m.args) ? m.args : []); }
  catch (e) { console.warn('net cmd failed', fn, e); }
  netBroadcast();
}
let netSendPending = false;
function netBroadcast() {
  if (!NET.host || !NET.live || !S || !S.dragon) return;
  if (netSendPending) return;
  netSendPending = true;
  setTimeout(() => {
    netSendPending = false;
    try {
      const d = gameData(); if (!d) return;
      d.net = { hostCls: S.hands ? S.hands[0].cls : CLASS.id, guestCls: NET.guestCls, status: NET.status };
      NET.conn.send({ t: 'state', d });
    } catch (e) { console.warn('net send failed', e); }
  }, 0);
}

// ---------- guest ----------
function netJoin(code) {
  code = String(code || '').trim().toUpperCase();
  if (code.length < 4) { netSet('Enter the 4-letter room code.'); return; }
  if (typeof Peer === 'undefined') { netSet('The connection library did not load — are you online?'); return; }
  netLeave();
  NET.role = 'guest'; NET.myIdx = 1; NET.code = code; NET.retries = 0;
  netRemember();
  netSet(`Joining room <b>${code}</b>…`);
  const peer = new Peer();
  NET.peer = peer;
  peer.on('error', e => netSet('Connection error: ' + (e.type || e)));
  peer.on('open', () => {
    const conn = peer.connect(netPeerId(code), { reliable: true });
    NET.conn = conn;
    conn.on('open', () => { const cls = pickedClassId(); conn.send({ t: 'hello', cls }); netSet(`Joined room <b>${code}</b> as the <b>${(CLASSES[cls] || MAGE).name}</b>. Waiting for the host to choose a stage…`); });
    conn.on('data', m => netOnGuestMessage(m));
    // 🔁 a dropped channel is retried on its own; the host keeps the room open
    conn.on('close', () => { if (NET.role !== 'guest') return; netSet('Connection dropped — reconnecting…'); netRetry(); });
  });
}
function netRetry() {
  if (NET.role !== 'guest' || !NET.code) return;
  if ((NET.retries = (NET.retries || 0) + 1) > 20) { netSet('Could not reconnect. Press Rejoin to try again.'); return; }
  const code = NET.code, tries = NET.retries;
  setTimeout(() => { if (NET.role === 'guest' && !NET.live) { const r = NET.retries; netJoin(code); NET.retries = r; } }, Math.min(15000, 2000 * tries));
}
function netOnGuestMessage(m) {
  if (!m || m.t !== 'state' || !m.d) return;
  const d = m.d;
  const ok = loadGameData(d);   // rebuilds S, both hands, the map, the creature — then renders
  if (!ok) { console.warn('net: state refused'); return; }
  S.beats = d.beats || null; S.beatIndex = d.beatIndex == null ? -1 : d.beatIndex;
  if (d.netPhase) S.phase = d.netPhase;
  if (d.net && d.net.status) NET.status = d.net.status;
  render();
}
function netSendCommand(fn, args) {
  if (!NET.guest || !NET.live) return;
  NET.conn.send({ t: 'cmd', fn, args });
}
function netLeave(forget) {
  try { if (NET.conn) NET.conn.close(); } catch (e) {}
  try { if (NET.peer) NET.peer.destroy(); } catch (e) {}
  NET.conn = null; NET.peer = null; NET.role = null; NET.status = '';
  if (forget) netForget();
}

// ---------- the guest's clicks become commands ----------
document.addEventListener('click', ev => {
  if (!NET.guest) return;
  const el = ev.target && ev.target.closest ? ev.target.closest('[onclick]') : null;
  if (!el) return;
  const src = el.getAttribute('onclick') || '';
  // shell buttons (Menu, the Stages screen, joining) stay local — a guest still needs its own menu
  if (/^(show|net|pick(Mode|Class|Partner)|devSet|dev[A-Z])/.test(src.trim())) return;
  const m = src.replace(/^\s*event\.stopPropagation\(\);\s*/, '').match(/^\s*([A-Za-z_]\w*)\s*\((.*)\)\s*;?\s*$/s);
  ev.preventDefault(); ev.stopImmediatePropagation();
  if (!m) return;
  const fn = m[1];
  if (!NET_ALLOW.test(fn)) return;
  let args = [];
  try { args = m[2].trim() ? JSON.parse('[' + m[2].replace(/'/g, '"') + ']') : []; } catch (e) { return; }
  netSendCommand(fn, args);
}, true);

// ---------- what each side sees ----------
function netWaiting() {
  if (!NET.role || !S || !S.hands || S.hands.length < 2) return false;
  const active = S.handIdx === NET.myIdx && NET_HAND_PHASES.includes(S.phase);
  if (NET.guest) return !active;                     // a guest waits on the road and on the host's hand
  return S.handIdx === 1 && NET_HAND_PHASES.includes(S.phase);   // a host waits while the guest's hand is up
}
function netDecorate() {
  const b = document.body; if (!b) return;
  b.classList.toggle('net-host', NET.host); b.classList.toggle('net-guest', NET.guest);
  const wait = netWaiting();
  b.classList.toggle('net-wait', wait);
  let ban = document.getElementById('net-banner');
  const panel = document.getElementById('controls-panel');
  if (!panel) return;
  if (!ban) { ban = document.createElement('div'); ban.id = 'net-banner'; }
  if (NET.role && S && S.hands && S.hands.length > 1) {
    const other = (typeof CLASSES !== 'undefined' && S.hands[NET.myIdx === 0 ? 1 : 0]) ? CLASSES[S.hands[NET.myIdx === 0 ? 1 : 0].cls].name : 'partner';
    ban.innerHTML = wait
      ? `⏳ <b>The ${other} is ${NET_HAND_PHASES.includes(S.phase) ? 'arranging' : 'choosing the road'}</b> — their cards are hidden. ${NET.live ? '' : '<i>(connection lost)</i>'}`
      : `🌐 <b>Your turn</b> · room ${NET.code}${NET.live ? '' : ' · <i>connection lost</i>'}`;
    if (ban.parentNode !== panel) panel.insertBefore(ban, panel.firstChild);
  } else if (ban.parentNode) ban.parentNode.removeChild(ban);
}
function onlinePartyHTML() {
  const st = NET.status ? `<div class="net-status">${NET.status}</div>` : '';
  if (NET.role === 'host') return `<div class="wall-line">🌐 <b>Online</b></div><div class="net-box">${st}<button onclick="netLeave(true); render()">close the room</button></div>`;
  if (NET.role === 'guest') return `<div class="wall-line">🌐 <b>Online</b></div><div class="net-box">${st}<button onclick="netLeave(true); render()">leave</button></div>`;
  const rem = netRemembered();
  const back = rem ? (rem.role === 'host'
    ? `<div class="net-row"><button class="primary" onclick="netHost('${rem.code}')">Reopen room ${rem.code}</button><span class="dim">your save carries the run; your partner rejoins with the same code</span></div>`
    : `<div class="net-row"><button class="primary" onclick="netJoin('${rem.code}')">Rejoin room ${rem.code}</button><span class="dim">the host's game continues where it was</span></div>`) : '';
  return `<div class="wall-line">🌐 <b>Online</b></div><div class="net-box">` + back +
    `<div class="net-row"><button class="primary" onclick="netHost()">Host a game</button><span class="dim">you pick the stage; your partner joins with a code</span></div>` +
    `<div class="net-row"><input id="net-code" maxlength="4" placeholder="CODE" autocapitalize="characters"><button onclick="netJoin(document.getElementById('net-code').value)">Join</button><span class="dim">with the character you have picked above</span></div>` +
    st + `</div>`;
}

// ---------- the hooks into game.js ----------
(function () {
  const _render = render;
  render = function () { _render.apply(this, arguments); netDecorate(); if (NET.host) netBroadcast(); };
  const _save = saveGame;
  saveGame = function (key, force) { if (NET.guest && !force) return; return _save.apply(this, arguments); };
})();
