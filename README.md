# 🕯️ Emberwick

A candlelit puzzle-strategy roguelite card game — playable right in the browser, no install.

**▶ Play the playtest build:** https://iimthomas.github.io/emberwick/play/

Sixteen cards, four slots, and something old at the end of the road. Every turn you compose a single action out of a four-card hand, and **position is the role** — rearranging the row *is* the decision:

- **Spell** — your action. What actually strikes, or how far you travel.
- **Catalyst** — what sets it off. It carries your **Initiative**, so it decides who moves first.
- **Surge** — fuel. It adds to the action.
- **Arsenal** — the one card you keep for next turn.

A pair **attunes**: when the Catalyst shares the Spell's element, the Spell strikes far harder. But the Catalyst is also your Initiative — so it serves two masters, and the enemy in front of you decides which one matters. 🛡️ **Armour** shaves a flat amount off every blow and wants one big hit. 🌀 **Evasion** halves anything it saw coming and wants speed. You cannot have both from four cards, which is the whole game.

**Your deck is your health.** Damage you can't absorb blunts a card; there is no health bar, only the deck getting thinner and blander. Legible math always — every number in the game is derivable from the turn log.

Four dragons, met as **stages**, each teaching one shape. Clearing one unlocks the next without taking it away, so any stage can be replayed. The 📖 **Tutorial** on the main menu teaches the whole game in one short run.

## Play locally

No build step — plain HTML / CSS / JS.

```
python -m http.server 8123
```

Then open <http://localhost:8123>. On a phone, **Add to Home Screen** for a fullscreen, app-like experience.

## Two builds, one repo

| | URL | |
|---|---|---|
| 🔒 **Playtest** | `…/emberwick/play/` | Frozen. Only changes when a drop is cut. This is the one to bookmark and install. |
| 🔧 **Live** | `…/emberwick/` | The working build. Changes with every push. Add `?dev` for the dev menu. |

Development happens in the open, so the live build can change under your feet mid-run. The playtest folder is a snapshot taken deliberately, cut with `./cut-playtest.ps1` — a copy, not a branch, so there is nothing to merge and no second cache-buster to keep in step. The two builds keep **separate saves** (localStorage is per-origin, not per-folder, so the playtest keys are namespaced).

The main menu prints the build number. **If you hit a bug, that number is the single most useful thing to include.**

## Contents

- `index.html` · `style.css` · `game.js` — the whole game
- `play/` — the frozen playtest drop (generated; don't edit by hand)
- `cut-playtest.ps1` — cuts a new drop
- `solver.html` · `solver.js` · `measure.js` — a headless bot and a measurement rig (dev tools; not shipped to the playtest build)
- `manifest.json` · `icon.*` — PWA install + home-screen icon

## Status

Playable end to end: pick a stage → four regions of encounters, events, charms and potions → the dragon at the end of the road, then a grade on the way out. A living prototype, tuned as it's played.
