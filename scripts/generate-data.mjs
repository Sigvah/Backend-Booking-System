// Regenerates src/data/pokedex.json and src/data/moves.json from Pokemon
// Showdown's data. Run with: npm run generate-data
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Fetch a Showdown data file (`export const X: <type> = {...};`),
 * transpile the TypeScript away, and evaluate it. */
async function fetchTable(file, exportName) {
  const ts = (await import("typescript")).default;
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
  const src = await res.text();
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("exports", "module", "require", js)(mod.exports, mod, () => ({}));
  return mod.exports[exportName];
}

const dex = await fetchTable("pokedex.ts", "Pokedex");

const skip = (mon) =>
  !(mon.num > 0) || // fan-made CAP entries; cosmetic formes have no num at all
  mon.isCosmeticForme ||
  (mon.forme && /Totem/i.test(mon.forme));

const toID = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const out = Object.entries(dex)
  .filter(([, mon]) => !skip(mon))
  .map(([id, mon]) => ({
    id,
    name: mon.name,
    num: mon.num,
    types: mon.types,
    baseStats: mon.baseStats,
    abilities: Object.values(mon.abilities),
    // Sprite file name on Showdown's CDN: base species and forme joined by "-".
    sprite: mon.forme
      ? `${toID(mon.baseSpecies ?? mon.name)}-${toID(mon.forme)}`
      : toID(mon.name),
  }));

const target = join(root, "src", "data", "pokedex.json");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(out));
console.log(`Wrote ${out.length} Pokemon to ${target}`);

// Moves: just what the matchup warnings need — type, category, priority, flags.
const moves = await fetchTable("moves.ts", "Moves");
const movesOut = Object.entries(moves)
  .filter(([, m]) => m.name && m.type && m.category)
  .map(([id, m]) => ({
    id,
    name: m.name,
    type: m.type,
    category: m.category, // Physical | Special | Status
    priority: m.priority ?? 0,
    powder: m.flags?.powder ? 1 : 0,
    sound: m.flags?.sound ? 1 : 0,
  }));
const movesTarget = join(root, "src", "data", "moves.json");
writeFileSync(movesTarget, JSON.stringify(movesOut));
console.log(`Wrote ${movesOut.length} moves to ${movesTarget}`);
