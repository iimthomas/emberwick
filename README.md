# 🕯️ Emberwick

A candlelit puzzle-strategy roguelite card game — playable right in the browser, no install.

**▶ Play:** https://iimthomas.github.io/emberwick/

Every turn you compose a single action from a four-card hand:

- **Wick** — your spell (the action)
- **Spark** — what ignites it (carries Initiative)
- **Tinder** — fuel (+value)
- **Ember** — kept for next turn

Kindling is **decoupled**: a Spark must match what the Wick *seeks*, not what it *is* — so the strongest play is a small combinatorial puzzle every turn. Race **Initiative** in fights and **Nightfall** on journeys, reshape your deck through the events you meet along the road, and face one of four dragons in the final **Duel**.

Your deck is your health — every downgrade and time penalty thins it. Legible math always: every number is derivable from the turn log.

## Play locally

No build step — plain HTML / CSS / JS.

```
python -m http.server 8123
```

Then open <http://localhost:8123>. On a phone, use **Add to Home Screen** for a fullscreen, app-like experience.

## Contents

- `index.html` · `style.css` · `game.js` — the whole game
- `solver.html` · `solver.js` — a balance/tuning bot (dev tool: turn analysis + whole-run A/B simulator)
- `manifest.json` · `icon.*` — PWA install + home-screen icon

## Status

Playable end to end: four regions → a random dragon (revealed from turn 1) → the Dragon Duel finale. A living prototype, tuned as it's played.
