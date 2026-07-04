import { SpeedNature } from "../engine/speed";

export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

export interface Nature {
  name: string;
  plus?: Exclude<StatKey, "hp">;
  minus?: Exclude<StatKey, "hp">;
}

export const NATURES: Nature[] = [
  { name: "Adamant", plus: "atk", minus: "spa" },
  { name: "Bashful" },
  { name: "Bold", plus: "def", minus: "atk" },
  { name: "Brave", plus: "atk", minus: "spe" },
  { name: "Calm", plus: "spd", minus: "atk" },
  { name: "Careful", plus: "spd", minus: "spa" },
  { name: "Docile" },
  { name: "Gentle", plus: "spd", minus: "def" },
  { name: "Hardy" },
  { name: "Hasty", plus: "spe", minus: "def" },
  { name: "Impish", plus: "def", minus: "spa" },
  { name: "Jolly", plus: "spe", minus: "spa" },
  { name: "Lax", plus: "def", minus: "spd" },
  { name: "Lonely", plus: "atk", minus: "def" },
  { name: "Mild", plus: "spa", minus: "def" },
  { name: "Modest", plus: "spa", minus: "atk" },
  { name: "Naive", plus: "spe", minus: "spd" },
  { name: "Naughty", plus: "atk", minus: "spd" },
  { name: "Quiet", plus: "spa", minus: "spe" },
  { name: "Quirky" },
  { name: "Rash", plus: "spa", minus: "spd" },
  { name: "Relaxed", plus: "def", minus: "spe" },
  { name: "Sassy", plus: "spd", minus: "spe" },
  { name: "Serious" },
  { name: "Timid", plus: "spe", minus: "atk" },
];

const byName = new Map(NATURES.map((n) => [n.name.toLowerCase(), n]));

export function getNature(name: string): Nature {
  return byName.get(name.toLowerCase()) ?? { name: "Serious" };
}

/** Nature's effect on a specific stat as a multiplier numerator over 100. */
export function natureMod(nature: Nature, stat: StatKey): number {
  if (nature.plus === stat) return 110;
  if (nature.minus === stat) return 90;
  return 100;
}

export function speedNatureOf(nature: Nature): SpeedNature {
  if (nature.plus === "spe") return "plus";
  if (nature.minus === "spe") return "minus";
  return "neutral";
}
