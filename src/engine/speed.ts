// Speed mechanics as used by the modern games (Gen 9 rules, which Pokemon
// Champions' battle system is based on). The modifier chain uses the game's
// 4096-based fixed-point math so results match the cartridge exactly.

export type Weather = "none" | "sun" | "rain" | "sand" | "snow";
export type Terrain = "none" | "electric" | "grassy" | "misty" | "psychic";
export type SpeedNature = "plus" | "neutral" | "minus";
export type Status = "healthy" | "paralyzed" | "other";

export type SpeedItem =
  | "none"
  | "choicescarf"
  | "quickpowder"
  | "ironball"
  | "machobrace" // also covers the Power training items
  | "laggingtail" // also covers Full Incense
  | "boosterenergy";

export interface FieldState {
  weather: Weather;
  terrain: Terrain;
  trickRoom: boolean;
}

export interface SpeedSetup {
  baseSpeed: number;
  level: number;
  iv: number;
  ev: number;
  nature: SpeedNature;
  stage: number; // -6..+6
  item: SpeedItem;
  ability: string;
  /** For Protosynthesis / Quark Drive: whether Speed is the boosted (highest) stat. */
  speedIsHighestStat: boolean;
  /** For Unburden: whether its held item has been consumed/lost this battle. */
  unburdenActive: boolean;
  status: Status;
  tailwind: boolean;
}

export const DEFAULT_FIELD: FieldState = {
  weather: "none",
  terrain: "none",
  trickRoom: false,
};

/** Round half down, as the games do for the final modifier application. */
function pokeRound(value: number): number {
  return value % 1 > 0.5 ? Math.ceil(value) : Math.floor(value);
}

/** Chain 4096-based modifiers the way the games do. */
function chainMods(mods: number[]): number {
  let m = 4096;
  for (const mod of mods) {
    if (mod !== 4096) m = (m * mod + 2048) >> 12;
  }
  return m;
}

/** The raw Speed stat: base stat, IVs, EVs, level and nature. */
export function calcRawSpeed(setup: SpeedSetup): number {
  const { baseSpeed, iv, ev, level, nature } = setup;
  const pre =
    Math.floor(((2 * baseSpeed + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  const natureNum = nature === "plus" ? 110 : nature === "minus" ? 90 : 100;
  return Math.floor((pre * natureNum) / 100);
}

function stageMultiplied(stat: number, stage: number): number {
  const s = Math.max(-6, Math.min(6, stage));
  return s >= 0 ? Math.floor((stat * (2 + s)) / 2) : Math.floor((stat * 2) / (2 - s));
}

/** Whether Protosynthesis / Quark Drive is switched on at all (any stat). */
export function paradoxBoostActive(setup: SpeedSetup, field: FieldState): boolean {
  if (setup.ability === "Protosynthesis") {
    return field.weather === "sun" || setup.item === "boosterenergy";
  }
  if (setup.ability === "Quark Drive") {
    return field.terrain === "electric" || setup.item === "boosterenergy";
  }
  return false;
}

/** Which ability/item/field modifiers apply, for display purposes. */
export function activeModifiers(setup: SpeedSetup, field: FieldState): string[] {
  const active: string[] = [];
  const { ability, item, status } = setup;

  if (ability === "Swift Swim" && field.weather === "rain") active.push("Swift Swim (×2)");
  if (ability === "Chlorophyll" && field.weather === "sun") active.push("Chlorophyll (×2)");
  if (ability === "Sand Rush" && field.weather === "sand") active.push("Sand Rush (×2)");
  if (ability === "Slush Rush" && field.weather === "snow") active.push("Slush Rush (×2)");
  if (ability === "Surge Surfer" && field.terrain === "electric")
    active.push("Surge Surfer (×2)");
  if (ability === "Unburden" && setup.unburdenActive) active.push("Unburden (×2)");
  if (ability === "Quick Feet" && status !== "healthy") active.push("Quick Feet (×1.5)");
  if (ability === "Slow Start") active.push("Slow Start (×0.5)");
  if (
    (ability === "Protosynthesis" || ability === "Quark Drive") &&
    paradoxBoostActive(setup, field) &&
    setup.speedIsHighestStat
  ) {
    active.push(`${ability} (×1.5)`);
  }

  if (item === "choicescarf") active.push("Choice Scarf (×1.5)");
  if (item === "quickpowder") active.push("Quick Powder (×2)");
  if (item === "ironball") active.push("Iron Ball (×0.5)");
  if (item === "machobrace") active.push("Macho Brace / Power item (×0.5)");
  if (item === "laggingtail") active.push("Lagging Tail (moves last)");

  if (setup.tailwind) active.push("Tailwind (×2)");
  if (status === "paralyzed" && ability !== "Quick Feet") active.push("Paralysis (×0.5)");

  return active;
}

/** Final effective Speed, after every modifier. */
export function calcEffectiveSpeed(setup: SpeedSetup, field: FieldState): number {
  let speed = stageMultiplied(calcRawSpeed(setup), setup.stage);

  const mods: number[] = [];
  const { ability, item, status } = setup;

  if (ability === "Swift Swim" && field.weather === "rain") mods.push(8192);
  if (ability === "Chlorophyll" && field.weather === "sun") mods.push(8192);
  if (ability === "Sand Rush" && field.weather === "sand") mods.push(8192);
  if (ability === "Slush Rush" && field.weather === "snow") mods.push(8192);
  if (ability === "Surge Surfer" && field.terrain === "electric") mods.push(8192);
  if (ability === "Unburden" && setup.unburdenActive) mods.push(8192);
  if (ability === "Quick Feet" && status !== "healthy") mods.push(6144);
  if (ability === "Slow Start") mods.push(2048);
  if (
    (ability === "Protosynthesis" || ability === "Quark Drive") &&
    paradoxBoostActive(setup, field) &&
    setup.speedIsHighestStat
  ) {
    mods.push(6144);
  }

  if (item === "choicescarf") mods.push(6144);
  if (item === "quickpowder") mods.push(8192);
  if (item === "ironball" || item === "machobrace") mods.push(2048);

  if (setup.tailwind) mods.push(8192);

  speed = pokeRound((speed * chainMods(mods)) / 4096);

  if (status === "paralyzed" && ability !== "Quick Feet") {
    speed = Math.floor(speed / 2);
  }

  return Math.max(1, Math.min(10000, speed));
}

export interface OrderedEntry<T> {
  entry: T;
  speed: number;
  movesLast: boolean;
}

/**
 * Turn order within a priority bracket: fastest first, reversed under Trick
 * Room. Lagging Tail / Full Incense holders always act after everyone else,
 * in reverse speed order among themselves.
 */
export function orderByAction<T>(
  entries: { entry: T; setup: SpeedSetup }[],
  field: FieldState,
): OrderedEntry<T>[] {
  const computed = entries.map(({ entry, setup }) => ({
    entry,
    speed: calcEffectiveSpeed(setup, field),
    movesLast: setup.item === "laggingtail",
  }));
  const cmp = (a: (typeof computed)[0], b: (typeof computed)[0]) =>
    field.trickRoom ? a.speed - b.speed : b.speed - a.speed;
  const normal = computed.filter((c) => !c.movesLast).sort(cmp);
  const last = computed.filter((c) => c.movesLast).sort((a, b) => -cmp(a, b));
  return [...normal, ...last];
}
