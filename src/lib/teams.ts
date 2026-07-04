import { POKEDEX, Species, getSpecies } from "../data";
import { StatKey } from "./natures";

export type StatsTable = Record<StatKey, number>;

export interface TeamMon {
  speciesId: string;
  nickname?: string;
  item: string; // display name, "" = no item
  ability: string;
  level: number;
  nature: string; // nature name, e.g. "Jolly"
  evs: StatsTable;
  ivs: StatsTable;
  moves: string[];
  teraType?: string;
}

export interface Team {
  id: string;
  name: string;
  mons: TeamMon[];
  updatedAt: number;
}

export const ZERO_EVS: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
export const MAX_IVS: StatsTable = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

const STORAGE_KEY = "csc:teams";

export function loadTeams(): Team[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Team[]) : [];
  } catch {
    return [];
  }
}

export function saveTeams(teams: Team[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

const byName = new Map<string, Species>();
for (const s of POKEDEX) byName.set(s.name.toLowerCase(), s);
const toID = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const byLooseId = new Map<string, Species>();
for (const s of POKEDEX) byLooseId.set(toID(s.name), s);

export function resolveSpecies(name: string): Species | undefined {
  const trimmed = name.trim();
  return (
    byName.get(trimmed.toLowerCase()) ??
    getSpecies(toID(trimmed)) ??
    byLooseId.get(toID(trimmed))
  );
}

const STAT_LABELS: Record<string, StatKey> = {
  hp: "hp",
  atk: "atk",
  def: "def",
  spa: "spa",
  spd: "spd",
  spe: "spe",
};

function parseStatLine(line: string, fill: number): StatsTable {
  // "252 Atk / 4 SpD / 252 Spe"
  const table: StatsTable = { hp: fill, atk: fill, def: fill, spa: fill, spd: fill, spe: fill };
  for (const part of line.split("/")) {
    const m = part.trim().match(/^(\d+)\s+([A-Za-z]+)$/);
    if (!m) continue;
    const key = STAT_LABELS[m[2].toLowerCase()];
    if (key) table[key] = parseInt(m[1], 10);
  }
  return table;
}

export interface PasteResult {
  mons: TeamMon[];
  errors: string[];
}

/** Parse the standard Showdown team-export text format. */
export function parsePaste(text: string): PasteResult {
  const mons: TeamMon[] = [];
  const errors: string[] = [];
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    // Header: "Species @ Item", "Nickname (Species) (F) @ Item", etc.
    let header = lines[0];
    let item = "";
    const atIdx = header.indexOf(" @ ");
    if (atIdx !== -1) {
      item = header.slice(atIdx + 3).trim();
      header = header.slice(0, atIdx).trim();
    }
    header = header.replace(/\s*\((M|F)\)\s*$/, "");
    let nickname: string | undefined;
    let speciesName = header;
    const parens = header.match(/^(.*)\(([^()]+)\)\s*$/);
    if (parens && resolveSpecies(parens[2])) {
      nickname = parens[1].trim() || undefined;
      speciesName = parens[2].trim();
    }

    const species = resolveSpecies(speciesName);
    if (!species) {
      errors.push(`Unknown Pokemon: "${speciesName}"`);
      continue;
    }

    const mon: TeamMon = {
      speciesId: species.id,
      nickname,
      item,
      ability: species.abilities[0] ?? "",
      level: 50,
      nature: "Serious",
      evs: { ...ZERO_EVS },
      ivs: { ...MAX_IVS },
      moves: [],
    };

    for (const line of lines.slice(1)) {
      if (line.startsWith("- ")) {
        if (mon.moves.length < 4) mon.moves.push(line.slice(2).trim());
      } else if (/^Ability:/i.test(line)) {
        mon.ability = line.replace(/^Ability:/i, "").trim();
      } else if (/^Level:/i.test(line)) {
        const lvl = parseInt(line.replace(/^Level:/i, "").trim(), 10);
        if (!Number.isNaN(lvl)) mon.level = Math.max(1, Math.min(100, lvl));
      } else if (/^EVs:/i.test(line)) {
        mon.evs = parseStatLine(line.replace(/^EVs:/i, ""), 0);
      } else if (/^IVs:/i.test(line)) {
        mon.ivs = parseStatLine(line.replace(/^IVs:/i, ""), 31);
      } else if (/Nature\s*$/i.test(line)) {
        mon.nature = line.replace(/Nature\s*$/i, "").trim();
      } else if (/^Tera Type:/i.test(line)) {
        mon.teraType = line.replace(/^Tera Type:/i, "").trim();
      }
      // Shiny, Happiness, Gigantamax etc. are irrelevant here — ignored.
    }

    mons.push(mon);
  }

  if (!mons.length && !errors.length) errors.push("No Pokemon found in the paste.");
  return { mons, errors };
}

/** Serialize back to the standard export format. */
export function serializeTeam(team: Team): string {
  return team.mons
    .map((mon) => {
      const species = getSpecies(mon.speciesId);
      const name = species?.name ?? mon.speciesId;
      const lines: string[] = [];
      lines.push(
        (mon.nickname ? `${mon.nickname} (${name})` : name) +
          (mon.item ? ` @ ${mon.item}` : ""),
      );
      if (mon.ability) lines.push(`Ability: ${mon.ability}`);
      if (mon.level !== 100) lines.push(`Level: ${mon.level}`);
      if (mon.teraType) lines.push(`Tera Type: ${mon.teraType}`);
      const evs = Object.entries(mon.evs)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${v} ${statLabel(k as StatKey)}`)
        .join(" / ");
      if (evs) lines.push(`EVs: ${evs}`);
      lines.push(`${mon.nature} Nature`);
      const ivs = Object.entries(mon.ivs)
        .filter(([, v]) => v < 31)
        .map(([k, v]) => `${v} ${statLabel(k as StatKey)}`)
        .join(" / ");
      if (ivs) lines.push(`IVs: ${ivs}`);
      for (const move of mon.moves) lines.push(`- ${move}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

function statLabel(key: StatKey): string {
  return { hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" }[key];
}

export const SAMPLE_PASTE = `Dragapult @ Choice Specs
Ability: Infiltrator
Level: 50
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Shadow Ball
- Draco Meteor
- Thunderbolt
- U-turn

Garchomp @ Choice Scarf
Ability: Rough Skin
Level: 50
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Earthquake
- Dragon Claw
- Rock Slide
- Iron Head

Iron Hands @ Assault Vest
Ability: Quark Drive
Level: 50
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Drain Punch
- Wild Charge
- Fake Out
- Heavy Slam

Amoonguss @ Rocky Helmet
Ability: Regenerator
Level: 50
EVs: 252 HP / 4 Def / 252 SpD
Calm Nature
IVs: 0 Atk / 0 Spe
- Spore
- Rage Powder
- Pollen Puff
- Protect

Flutter Mane @ Booster Energy
Ability: Protosynthesis
Level: 50
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Moonblast
- Shadow Ball
- Dazzling Gleam
- Protect

Ursaluna @ Flame Orb
Ability: Guts
Level: 50
EVs: 252 HP / 252 Atk / 4 SpD
Brave Nature
IVs: 0 Spe
- Facade
- Headlong Rush
- Crunch
- Protect`;
