# Champions Speed Checker

A web app for checking which Pokemon moves first in **Pokemon Champions** —
compare full speed setups side by side under any battle conditions.

![App type](https://img.shields.io/badge/app-React%20%2B%20Vite%20%2B%20TypeScript-blue)

## What it does

Pick two to six Pokemon, configure each one's setup, set the battle field, and
see the resulting action order with exact effective speed numbers.

Supported mechanics (Gen 9 rules, which Champions' battle system is based on):

- **Stats** — base speed, level, IVs, EVs, speed natures (+Spe / neutral / −Spe)
- **Boost stages** — −6 to +6
- **Items** — Choice Scarf, Booster Energy, Quick Powder, Iron Ball,
  Macho Brace / Power items, Lagging Tail / Full Incense
- **Abilities** — Swift Swim, Chlorophyll, Sand Rush, Slush Rush, Surge Surfer,
  Unburden, Quick Feet, Slow Start, Protosynthesis, Quark Drive
- **Field** — weather (sun/rain/sand/snow), terrain, Tailwind per side,
  Trick Room (reverses the order), paralysis
- **Exact math** — the game's 4096-based fixed-point modifier chain with
  round-half-down, so results match the cartridge, including edge cases like
  Choice Scarf 169 → 253 (not 254)

The full Pokedex (1,368 Pokemon incl. regional formes and Megas) is bundled as
static data — the app works offline and needs no backend.

## Development

```bash
npm install
npm run dev        # start dev server
npm test           # run the speed-engine test suite
npm run build      # typecheck + production build into dist/
```

### Updating the Pokemon data

The dataset in `src/data/pokedex.json` is generated from the
[Pokemon Showdown](https://github.com/smogon/pokemon-showdown) pokedex:

```bash
npm run generate-data
```

Re-run it when new Pokemon or formes are released, then commit the updated
JSON.

## Project layout

```
scripts/generate-data.mjs   dataset generator
src/engine/speed.ts         speed formulas + turn-order logic (unit tested)
src/data/pokedex.json       bundled Pokedex (generated)
src/components/             UI: Pokemon panels, field bar, results
```
