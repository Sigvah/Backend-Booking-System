import pokedexJson from "./data/pokedex.json";

export interface Species {
  id: string;
  name: string;
  num: number;
  types: string[];
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  abilities: string[];
  sprite: string;
}

export const POKEDEX = pokedexJson as Species[];

const byId = new Map(POKEDEX.map((s) => [s.id, s]));

export function getSpecies(id: string): Species | undefined {
  return byId.get(id);
}

/** Name search: prefix matches first, then substring matches. */
export function searchSpecies(query: string, limit = 12): Species[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: Species[] = [];
  const contains: Species[] = [];
  for (const s of POKEDEX) {
    const name = s.name.toLowerCase();
    if (name.startsWith(q)) starts.push(s);
    else if (name.includes(q)) contains.push(s);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

export function spriteUrl(species: Species): string {
  return `https://play.pokemonshowdown.com/sprites/gen5/${species.sprite}.png`;
}

export function spriteFallbackUrl(species: Species): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${species.num}.png`;
}

/** True when Speed is (one of) the highest non-HP base stats — the sensible
 * default for Protosynthesis / Quark Drive's boosted stat. */
export function speedIsHighestBaseStat(species: Species): boolean {
  const { atk, def, spa, spd, spe } = species.baseStats;
  return spe >= Math.max(atk, def, spa, spd);
}
