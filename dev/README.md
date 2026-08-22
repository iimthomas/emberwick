# `dev/` — headless measurement tools

⚠️ **Node scripts, not part of the game.** Nothing here is loaded by `index.html`, nothing is
copied into `play/` by `cut-playtest.ps1`, and nothing may ever be imported by `game.js`.

They live here rather than in a scratchpad because **this harness has been rebuilt twice** —
it lived outside the repo, so it did not survive a session, and each rebuild cost an hour.

| file | what it is for |
|---|---|
| `headless.js` | loads `game.js` + `solver.js` under node against a ~50-line DOM stub. **Non-invasive by construction**: both files load VERBATIM, and its only edits are deleting the trailing `showMenu()` boot call (failing loudly if that call moves) and appending an export epilogue. |
| `identity.js` | **the test for a change that is supposed to change NO rule.** Same seed, same game, turn by turn — see below. |
| `field-probe.js` | asserts 🎴 the field actually renders, which an identity test can never prove. |

```bash
node dev/headless.js boot            # does it load at all
node dev/headless.js runsim 200 rogue
node dev/identity.js 150             # fingerprint 300 seeded runs, both classes
node dev/field-probe.js
```

## 🔑 Why `identity.js` exists

**A pure refactor has no number to move**, so *"RUNSIM says 56C before and 56C after"* proves
nothing — at n=200 the noise band is wider than most real changes, and an unchanged percentage is
equally consistent with *nothing broke* and with *two things broke and cancelled each other*.

What CAN be proved exactly is **whether the same seed played the same game**: it seeds
`Math.random`, plays N runs per class, and fingerprints each run plus a **per-turn trace** (hand,
arrangement, momentum, wake, aim, bank, potions, coins, phase, region). One differing character
means a rule changed — a bug, not a balance finding.

⚠️ **An identity test cannot prove anything was BUILT.** If a new render function silently returned
early on every call, the fingerprint would match perfectly. Pair it with a probe like
`field-probe.js`, and **check the screen, not only the state.**

⚠️ **Never stub the path you are testing.** `RUNSIM.run()` stubs `render()`/`saveGame()` for speed;
`identity.js` deliberately does not.

## 🐛 Gotchas, all one root cause — a top-level `const` in a vm script is LEXICAL

1. It never lands on the sandbox, so `game.js` and `solver.js` must be concatenated into **ONE**
   script or solver cannot see `CARD_DEFS`.
2. Those names are invisible from *outside* the sandbox too — hence the export epilogue.
3. `S` is reassigned every run, so it is exported as a **getter**, never a copied reference.

Two more that cost real time:

- 🐛 **A DOM stub returning a fresh element per call can never read back what a render wrote.**
  `getElementById` caches by id here — without it, a probe reads empty and it looks exactly like a
  broken feature.
- ⚠️ **`normalizeAssign()` is called from `render()`**, so any *hand-driven* test must seat its own
  cards. RUNSIM never trips on this because `chooseBest()` writes `S.assign` directly.
