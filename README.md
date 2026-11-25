# Glowgarden: A Math Adventure

An original browser math game for young children (about ages 5–8), inspired by the
structure of early-90s math adventure games: a grumpy cloud's sneeze broke the garden,
and the child fixes it zone by zone with math.

## How to play

Open `index.html` in a browser (computer or tablet). There is nothing to install or build.
Progress saves in that browser.

- **Tap or click** where you want to walk, or use the arrow keys (space/Enter to use what is next to you).
- **Friends with a `?`** ask a question and pay 5¢ for a right answer.
- **Friends with a coloured star** give a magic number. Plant that many seeds in the flower bed of the same colour to find a glow gem.
- **Each zone has a building** that pays out the 4 pieces needed to move on: clocks in Sunny Meadow, a balance scale in Apple Orchard, ones/tens/hundreds in Firefly Pond.
- **The shop** sells hats and missing pieces. You pay with exact change.
- **Professor Hoot** asks a number-pattern question at the last gate.
- At the top, the gems go to the Great Sunflower and a prize lands on the shelf at home. Each trip is a little bigger than the last.
- Tap the 🐝 for a hint, and 🔊 to hear a question again.

There is no timer and no way to lose. From the second trip, drifting "Sneezle" clouds blow away 2¢ if they touch you; tap them to pop them.

## Grown-ups area

On the home screen, tap **Grown-ups** and answer the multiplication question. There you can:

- switch each skill on or off and set its level (1–6);
- see first-try accuracy for each skill;
- turn Sneezles, read-aloud and music on or off;
- change the name or erase progress.

Each skill adjusts on its own: up a level after 3 first-try answers in a row, down after 2 missed problems.
Adding and subtracting starts at "within 20"; everything else starts at level 1.

## Files

- `index.html`, `css/style.css` — page and styles
- `js/problems.js` — problem generators for all six skills
- `js/state.js` — saving and adaptive difficulty
- `js/audio.js` — synthesized sounds, music and read-aloud (browser voice)
- `js/ui.js` — question, planting, paying and story cards
- `js/world.js` — the scrolling garden
- `js/main.js` — game flow, shop, home and grown-ups area
- `tests/` — `node tests/problems.test.js` checks the generators; `node tests/smoke.js` plays a full trip in a headless browser (needs Playwright)
- `reports/`, `research_notes/` — background research

All art is drawn in code or uses emoji; all sound is synthesized. No external assets.
