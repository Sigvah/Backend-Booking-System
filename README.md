# Champions Battle Prep

A web app for winning team preview in **Pokemon Champions**: store your teams,
scout the opponent's 6, get exact speed matchups instantly — and let Claude
draft your game plan.

## The workflow

1. **Teams** — build your team directly in the app (pick species, item,
   ability, nature, EVs and moves — no external tools needed), or import via
   the standard team-export format (Showdown paste) as a shortcut. Everything
   is stored in your browser (localStorage); export back to text any time.
2. **Scout** — at team preview, pick your team and type in the opponent's 6
   (save frequent opponents for later study). You instantly get a color-coded
   speed matrix: each of their Pokemon's realistic speed range (uninvested ↔
   max, Choice Scarf ceiling, and the 0-IV/minus-nature Trick Room floor for
   slow Pokemon) against your actual spreads, plus deterministic hazard
   warnings — which of your moves fail against which of their Pokemon,
   Trick Room readiness, weather speed combos.
3. **Game plan (Claude)** — one button sends your full team + their 6 + the
   exact speed math to Claude (Haiku by default) and streams back: their
   likely sets, the biggest threats each way, recommended leads/backs for
   singles or doubles, and your win condition. The app supplies the exact
   numbers so the model never has to guess the math.
4. **Speed Calculator** — a deep-dive tab for a specific speed question:
   two-to-six Pokemon under any conditions (boost stages, items, abilities,
   weather, terrain, Tailwind, paralysis, Trick Room), using the games' exact
   4096-based fixed-point modifier chain.

## Claude API setup

Open **⚙ Settings**, paste your Anthropic API key (console.anthropic.com) and
pick a model — Claude Haiku 4.5 (default, well under a cent per analysis),
Claude Sonnet 5, or Claude Opus 4.8. The key is stored only in your browser's
localStorage and requests go directly from your browser to the Anthropic API;
there is no backend. Don't use this setup on a shared/public deployment —
it's built as a personal tool.

## Hosting

The repo ships a GitHub Pages workflow (`.github/workflows/deploy.yml`):
every push to `main` runs the tests, builds, and deploys automatically.
One-time setup: repo **Settings → Pages → Source: GitHub Actions**. Assets
use relative paths, so it works under any repo name or custom domain. The
app is fully static — your Anthropic API key stays in your own browser and
is never part of the deployment.

## Development

```bash
npm install
npm run dev        # start dev server
npm test           # speed engine + paste parser + analysis tests
npm run build      # typecheck + production build into dist/
```

### Updating the Pokemon data

`src/data/pokedex.json` (1,368 Pokemon incl. regional formes and Megas) is
generated from the [Pokemon Showdown](https://github.com/smogon/pokemon-showdown)
pokedex:

```bash
npm run generate-data
```

## Project layout

```
scripts/generate-data.mjs   Pokedex dataset generator
src/engine/speed.ts         exact speed formulas + turn order (unit tested)
src/lib/teams.ts            team storage + Showdown paste parser (unit tested)
src/lib/analysis.ts         stat calc, opponent speed ranges, matchup verdicts
src/lib/claude.ts           Claude API integration + prompt builder
src/components/             UI: Scout, Teams, Calculator, Settings
```
