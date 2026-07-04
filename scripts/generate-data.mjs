// Regenerates src/data/pokedex.json from Pokemon Showdown's pokedex.
// Run with: npm run generate-data
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE =
  "https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/pokedex.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Failed to fetch pokedex: ${res.status}`);
const src = await res.text();

// The file is `export const Pokedex: <type> = { ...object literal... };`
// Strip the declaration and evaluate the object literal.
const objectSrc = src.replace(/^export const Pokedex[^=]*=/, "");
const dex = new Function(`return (${objectSrc.replace(/;\s*$/, "")})`)();

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
