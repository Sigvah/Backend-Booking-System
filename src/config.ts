import { Species, getSpecies, speedIsHighestBaseStat } from "./data";
import { SpeedItem, SpeedNature, SpeedSetup, Status } from "./engine/speed";

export interface MonConfig {
  uid: number;
  speciesId: string;
  level: number;
  iv: number;
  ev: number;
  nature: SpeedNature;
  stage: number;
  item: SpeedItem;
  ability: string;
  status: Status;
  tailwind: boolean;
  speedIsHighestStat: boolean;
  unburdenActive: boolean;
}

let nextUid = 1;

export function makeConfig(speciesId: string): MonConfig {
  const species = getSpecies(speciesId);
  if (!species) throw new Error(`Unknown species: ${speciesId}`);
  return {
    uid: nextUid++,
    speciesId,
    level: 50,
    iv: 31,
    ev: 252,
    nature: "plus",
    stage: 0,
    item: "none",
    ability: species.abilities[0] ?? "",
    status: "healthy",
    tailwind: false,
    speedIsHighestStat: speedIsHighestBaseStat(species),
    unburdenActive: false,
  };
}

export function toSetup(cfg: MonConfig, species: Species): SpeedSetup {
  return {
    baseSpeed: species.baseStats.spe,
    level: cfg.level,
    iv: cfg.iv,
    ev: cfg.ev,
    nature: cfg.nature,
    stage: cfg.stage,
    item: cfg.item,
    ability: cfg.ability,
    status: cfg.status,
    tailwind: cfg.tailwind,
    speedIsHighestStat: cfg.speedIsHighestStat,
    unburdenActive: cfg.unburdenActive,
  };
}

export const ITEM_OPTIONS: { value: SpeedItem; label: string }[] = [
  { value: "none", label: "No item" },
  { value: "choicescarf", label: "Choice Scarf (×1.5)" },
  { value: "boosterenergy", label: "Booster Energy" },
  { value: "quickpowder", label: "Quick Powder (Ditto, ×2)" },
  { value: "ironball", label: "Iron Ball (×0.5)" },
  { value: "machobrace", label: "Macho Brace / Power item (×0.5)" },
  { value: "laggingtail", label: "Lagging Tail / Full Incense (moves last)" },
];
