import { Species } from "../data";
import {
  DEFAULT_FIELD,
  SpeedItem,
  SpeedSetup,
  calcEffectiveSpeed,
} from "../engine/speed";
import { StatKey, getNature, natureMod, speedNatureOf } from "./natures";
import { TeamMon } from "./teams";
import { bestStab } from "./typechart";

/** Map a held-item display name to its speed-relevant category. */
export function speedItemOf(itemName: string): SpeedItem {
  const id = itemName.toLowerCase().replace(/[^a-z]/g, "");
  if (id === "choicescarf") return "choicescarf";
  if (id === "quickpowder") return "quickpowder";
  if (id === "ironball") return "ironball";
  if (id === "machobrace" || id.startsWith("power")) return "machobrace";
  if (id === "laggingtail" || id === "fullincense") return "laggingtail";
  if (id === "boosterenergy") return "boosterenergy";
  return "none";
}

/** Full stat calculation (HP uses its own formula). */
export function calcStat(
  stat: StatKey,
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureName: string,
): number {
  const core = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
  if (stat === "hp") return core + level + 10;
  const mod = natureMod(getNature(natureName), stat);
  return Math.floor(((core + 5) * mod) / 100);
}

export function calcAllStats(mon: TeamMon, species: Species): Record<StatKey, number> {
  const keys: StatKey[] = ["hp", "atk", "def", "spa", "spd", "spe"];
  const out = {} as Record<StatKey, number>;
  for (const k of keys) {
    out[k] = calcStat(k, species.baseStats[k], mon.ivs[k], mon.evs[k], mon.level, mon.nature);
  }
  return out;
}

/** My mon's effective speed under neutral field, from its stored spread. */
export function monEffectiveSpeed(mon: TeamMon, species: Species): number {
  const setup: SpeedSetup = {
    baseSpeed: species.baseStats.spe,
    level: mon.level,
    iv: mon.ivs.spe,
    ev: mon.evs.spe,
    nature: speedNatureOf(getNature(mon.nature)),
    stage: 0,
    item: speedItemOf(mon.item),
    ability: mon.ability,
    status: "healthy",
    tailwind: false,
    // Booster Energy Proto/Quark counts only when Speed is its highest stat;
    // approximate with the invested spread.
    speedIsHighestStat: isSpeedHighest(mon, species),
    unburdenActive: false,
  };
  return calcEffectiveSpeed(setup, DEFAULT_FIELD);
}

function isSpeedHighest(mon: TeamMon, species: Species): boolean {
  const stats = calcAllStats(mon, species);
  return stats.spe >= Math.max(stats.atk, stats.def, stats.spa, stats.spd);
}

export const WEATHER_SPEED_ABILITIES: Record<string, string> = {
  "Swift Swim": "rain",
  Chlorophyll: "sun",
  "Sand Rush": "sandstorm",
  "Slush Rush": "snow",
  "Surge Surfer": "Electric Terrain",
};

export interface OpponentSpeedProfile {
  species: Species;
  min: number; // 0 EV, 31 IV, neutral — a typical uninvested spread
  trueMin: number; // 0 EV, 0 IV, minus nature — the Trick Room floor
  max: number; // 252 EV, 31 IV, +nature
  scarfMax: number; // max with Choice Scarf
  doublingAbilities: string[]; // e.g. ["Swift Swim (rain)"]
}

export function opponentSpeedProfile(species: Species, level = 50): OpponentSpeedProfile {
  const base: Omit<SpeedSetup, "ev" | "nature" | "item"> = {
    baseSpeed: species.baseStats.spe,
    level,
    iv: 31,
    stage: 0,
    ability: "",
    status: "healthy",
    tailwind: false,
    speedIsHighestStat: false,
    unburdenActive: false,
  };
  const min = calcEffectiveSpeed(
    { ...base, ev: 0, nature: "neutral", item: "none" },
    DEFAULT_FIELD,
  );
  const trueMin = calcEffectiveSpeed(
    { ...base, iv: 0, ev: 0, nature: "minus", item: "none" },
    DEFAULT_FIELD,
  );
  const max = calcEffectiveSpeed(
    { ...base, ev: 252, nature: "plus", item: "none" },
    DEFAULT_FIELD,
  );
  const scarfMax = calcEffectiveSpeed(
    { ...base, ev: 252, nature: "plus", item: "choicescarf" },
    DEFAULT_FIELD,
  );
  const doublingAbilities = species.abilities
    .filter((a) => a in WEATHER_SPEED_ABILITIES)
    .map((a) => `${a} (${WEATHER_SPEED_ABILITIES[a]})`);
  return { species, min, trueMin, max, scarfMax, doublingAbilities };
}

export type SpeedVerdict = "safe" | "scarf-risk" | "tie" | "range" | "slower";

export interface MatchupCell {
  verdict: SpeedVerdict;
  mySpeed: number;
  theirStabIntoMe: number; // best STAB effectiveness of their typing vs mine
  myStabIntoThem: number;
}

export function matchupCell(
  mySpeed: number,
  mySpecies: Species,
  profile: OpponentSpeedProfile,
): MatchupCell {
  let verdict: SpeedVerdict;
  if (mySpeed > profile.scarfMax) verdict = "safe";
  else if (mySpeed > profile.max) verdict = "scarf-risk";
  else if (mySpeed === profile.max) verdict = "tie";
  else if (mySpeed >= profile.min) verdict = "range";
  else verdict = "slower";
  return {
    verdict,
    mySpeed,
    theirStabIntoMe: bestStab(profile.species.types, mySpecies.types),
    myStabIntoThem: bestStab(mySpecies.types, profile.species.types),
  };
}

export const VERDICT_LABEL: Record<SpeedVerdict, string> = {
  safe: "outspeeds even Scarf",
  "scarf-risk": "outspeeds unless Scarf",
  tie: "ties at max",
  range: "depends on investment",
  slower: "slower even vs min",
};
