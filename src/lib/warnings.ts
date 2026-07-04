import movesJson from "../data/moves.json";
import { Species, getSpecies } from "../data";
import { monEffectiveSpeed, opponentSpeedProfile } from "./analysis";
import { Team, TeamMon } from "./teams";
import { effectiveness } from "./typechart";

export interface MoveData {
  id: string;
  name: string;
  type: string;
  category: "Physical" | "Special" | "Status";
  priority: number;
  powder: number;
  sound: number;
}

const MOVES = new Map(
  (movesJson as MoveData[]).map((m) => [m.name.toLowerCase().replace(/[^a-z0-9]/g, ""), m]),
);

export function getMove(name: string): MoveData | undefined {
  return MOVES.get(name.toLowerCase().replace(/[^a-z0-9]/g, ""));
}

export const ALL_MOVE_NAMES: string[] = (movesJson as MoveData[])
  .map((m) => m.name)
  .sort();

export type Severity = "danger" | "warning" | "info";

export interface MatchupWarning {
  severity: Severity;
  title: string;
  detail: string;
}

const PRIORITY_BLOCKERS = new Set(["Armor Tail", "Dazzling", "Queenly Majesty"]);

/** Abilities that make the holder immune to (or absorb) a whole move type. */
const ABILITY_TYPE_IMMUNITY: Record<string, string> = {
  Levitate: "Ground",
  "Earth Eater": "Ground",
  "Flash Fire": "Fire",
  "Well-Baked Body": "Fire",
  "Water Absorb": "Water",
  "Storm Drain": "Water",
  "Dry Skin": "Water",
  "Volt Absorb": "Electric",
  "Lightning Rod": "Electric",
  "Motor Drive": "Electric",
  "Sap Sipper": "Grass",
  Soundproof: "", // handled via sound flag
};

/** Species that very commonly set Trick Room in doubles. */
const TR_SETTERS = new Set([
  "farigiraf", "armarouge", "hatterene", "dusclops", "cresselia", "porygon2",
  "bronzong", "indeedee", "indeedeef", "gothitelle", "oranguru", "runerigus",
  "mimikyu", "slowbro", "slowking", "slowkinggalar", "reuniclus", "beheeyem",
  "dusknoir", "diancie", "stakataka", "grumpig",
]);

const WEATHER_SETTER: Record<string, { weather: string; abuser: string }> = {
  Drizzle: { weather: "rain", abuser: "Swift Swim" },
  Drought: { weather: "sun", abuser: "Chlorophyll" },
  "Orichalcum Pulse": { weather: "sun", abuser: "Chlorophyll" },
  "Sand Stream": { weather: "sandstorm", abuser: "Sand Rush" },
  "Snow Warning": { weather: "snow", abuser: "Slush Rush" },
};

interface MonWithSpecies {
  mon: TeamMon;
  species: Species;
}

function resolveTeam(team: Team): MonWithSpecies[] {
  return team.mons.flatMap((mon) => {
    const species = getSpecies(mon.speciesId);
    return species ? [{ mon, species }] : [];
  });
}

export function computeWarnings(team: Team, opponents: Species[]): MatchupWarning[] {
  const warnings: MatchupWarning[] = [];
  const mine = resolveTeam(team);
  if (!mine.length || !opponents.length) return warnings;

  checkPriorityBlockers(mine, opponents, warnings);
  checkTypeImmunities(mine, opponents, warnings);
  checkAbilityAbsorbs(mine, opponents, warnings);
  checkPowderAndSound(mine, opponents, warnings);
  checkPrankster(mine, opponents, warnings);
  checkTrickRoom(mine, opponents, warnings);
  checkWeatherCombos(mine, opponents, warnings);

  const order: Severity[] = ["danger", "warning", "info"];
  return warnings.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
}

function checkPriorityBlockers(
  mine: MonWithSpecies[],
  opponents: Species[],
  out: MatchupWarning[],
) {
  const blockers = opponents.filter((o) => o.abilities.some((a) => PRIORITY_BLOCKERS.has(a)));
  const surgers = opponents.filter((o) => o.abilities.includes("Psychic Surge"));
  if (!blockers.length && !surgers.length) return;

  // Only attacking priority counts — Protect/Rage Powder target your own
  // side and are NOT blocked by Armor Tail or Psychic Terrain.
  const myPriorityMoves = mine.flatMap(({ mon, species }) =>
    mon.moves
      .map(getMove)
      .filter((m): m is MoveData => !!m && m.priority > 0 && m.category !== "Status")
      .map((m) => `${species.name}'s ${m.name}`),
  );
  if (!myPriorityMoves.length) return;

  for (const b of blockers) {
    const ability = b.abilities.find((a) => PRIORITY_BLOCKERS.has(a));
    out.push({
      severity: "danger",
      title: `Your priority moves fail against ${b.name}`,
      detail:
        `${b.name} likely has ${ability}, which makes priority moves fail against it AND its ally. ` +
        `Affected: ${myPriorityMoves.join(", ")}.`,
    });
  }
  for (const s of surgers) {
    out.push({
      severity: "danger",
      title: `${s.name} sets Psychic Terrain — priority stops working`,
      detail:
        `While Psychic Terrain is up, priority moves fail against anything on the ground. ` +
        `Affected: ${myPriorityMoves.join(", ")}. (This is the classic "my Quick Attack/Fake Out ` +
        `suddenly did nothing" moment.)`,
    });
  }
}

function checkTypeImmunities(
  mine: MonWithSpecies[],
  opponents: Species[],
  out: MatchupWarning[],
) {
  // Group by (move type) → immune opponents, listing which of my moves that hits.
  const byType = new Map<string, { movers: string[]; immune: Set<string> }>();
  for (const { mon, species } of mine) {
    for (const name of mon.moves) {
      const move = getMove(name);
      if (!move || move.category === "Status") continue;
      const immune = opponents.filter((o) => effectiveness(move.type, o.types) === 0);
      if (!immune.length) continue;
      const entry = byType.get(move.type) ?? { movers: [], immune: new Set() };
      entry.movers.push(`${species.name}'s ${move.name}`);
      for (const o of immune) entry.immune.add(o.name);
      byType.set(move.type, entry);
    }
  }
  for (const [type, { movers, immune }] of byType) {
    out.push({
      severity: "warning",
      title: `${type} moves do NOTHING vs ${[...immune].join(", ")}`,
      detail: `Type immunity — zero damage, turn wasted: ${[...new Set(movers)].join(", ")}.`,
    });
  }
}

function checkAbilityAbsorbs(
  mine: MonWithSpecies[],
  opponents: Species[],
  out: MatchupWarning[],
) {
  for (const opp of opponents) {
    for (const ability of opp.abilities) {
      const blockedType = ABILITY_TYPE_IMMUNITY[ability];
      if (!blockedType) continue;
      // Skip if already fully immune by typing (covered above).
      if (effectiveness(blockedType, opp.types) === 0) continue;
      const affected = mine.flatMap(({ mon, species }) =>
        mon.moves
          .map(getMove)
          .filter((m): m is MoveData => !!m && m.category !== "Status" && m.type === blockedType)
          .map((m) => `${species.name}'s ${m.name}`),
      );
      if (!affected.length) continue;
      out.push({
        severity: "warning",
        title: `${opp.name} may absorb your ${blockedType} moves (${ability})`,
        detail:
          `If it has ${ability}, ${blockedType} moves do nothing or even help it. ` +
          `Affected: ${[...new Set(affected)].join(", ")}. It has ${opp.abilities.length} possible ` +
          `abilities, so this isn't guaranteed — but don't rely on those moves.`,
      });
    }
  }
}

function checkPowderAndSound(
  mine: MonWithSpecies[],
  opponents: Species[],
  out: MatchupWarning[],
) {
  const myPowderMoves = mine.flatMap(({ mon, species }) =>
    mon.moves
      .map(getMove)
      .filter((m): m is MoveData => !!m && m.powder === 1)
      .map((m) => ({ label: `${species.name}'s ${m.name}` })),
  );
  if (myPowderMoves.length) {
    const immuneOpps = opponents.filter(
      (o) => o.types.includes("Grass") || o.abilities.includes("Overcoat"),
    );
    if (immuneOpps.length) {
      out.push({
        severity: "warning",
        title: `Powder moves fail vs ${immuneOpps.map((o) => o.name).join(", ")}`,
        detail:
          `Grass-types (and Overcoat) are immune to powder moves like Spore and Rage Powder. ` +
          `Affected: ${[...new Set(myPowderMoves.map((p) => p.label))].join(", ")}.`,
      });
    }
    const sleepBlockers = opponents.filter(
      (o) => o.abilities.includes("Electric Surge") || o.abilities.includes("Misty Surge") ||
        o.abilities.includes("Hadron Engine"),
    );
    if (sleepBlockers.length) {
      out.push({
        severity: "info",
        title: `${sleepBlockers.map((o) => o.name).join(", ")} can block sleep with terrain`,
        detail:
          "Electric/Misty Terrain protects grounded Pokemon from being statused — Spore stops " +
          "working while it's up.",
      });
    }
  }

  const soundUsers = mine.flatMap(({ mon, species }) =>
    mon.moves
      .map(getMove)
      .filter((m): m is MoveData => !!m && m.sound === 1 && m.category !== "Status")
      .map((m) => `${species.name}'s ${m.name}`),
  );
  const soundproof = opponents.filter((o) => o.abilities.includes("Soundproof"));
  if (soundUsers.length && soundproof.length) {
    out.push({
      severity: "info",
      title: `${soundproof.map((o) => o.name).join(", ")} may ignore sound moves (Soundproof)`,
      detail: `Affected: ${[...new Set(soundUsers)].join(", ")}.`,
    });
  }
}

function checkPrankster(mine: MonWithSpecies[], opponents: Species[], out: MatchupWarning[]) {
  const pranksters = mine.filter(({ mon }) => mon.ability === "Prankster");
  const darks = opponents.filter((o) => o.types.includes("Dark"));
  if (pranksters.length && darks.length) {
    out.push({
      severity: "warning",
      title: `Prankster status moves fail vs ${darks.map((o) => o.name).join(", ")}`,
      detail:
        `Dark-types are immune to Prankster-boosted status moves — ` +
        `${pranksters.map((p) => p.species.name).join(", ")} can't Thunder Wave/Taunt them.`,
    });
  }
}

function checkTrickRoom(mine: MonWithSpecies[], opponents: Species[], out: MatchupWarning[]) {
  const setters = opponents.filter((o) => TR_SETTERS.has(o.id));
  const verySlow = opponents.filter((o) => o.baseStats.spe <= 55);
  const likely = setters.length > 0 || verySlow.length >= 3;
  if (!likely) return;

  const mySpeeds = mine
    .map(({ mon, species }) => ({ name: species.name, spe: monEffectiveSpeed(mon, species) }))
    .sort((a, b) => a.spe - b.spe);
  const slowest = mySpeeds.slice(0, 2);
  const myAnswers: string[] = [];
  for (const { mon, species } of mine) {
    for (const name of mon.moves) {
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (id === "trickroom") myAnswers.push(`${species.name} has Trick Room too — bounce it back or refuse to set yours`);
      if (id === "taunt") myAnswers.push(`${species.name}'s Taunt can stop the setter (unless it's Good as Gold / Armor Tail-protected by Psychic Terrain rules)`);
      if (id === "fakeout") myAnswers.push(`${species.name}'s Fake Out can flinch the setter for a turn (watch for Armor Tail/Inner Focus)`);
      if (id === "imprison") myAnswers.push(`${species.name}'s Imprison can lock Trick Room entirely`);
      if (id === "encore") myAnswers.push(`${species.name}'s Encore can trap them re-setting it`);
    }
  }

  const setterNames = setters.length
    ? setters.map((s) => s.name).join(", ")
    : "no classic setter, but lots of very slow attackers";
  const trFloors = [...opponents]
    .sort((a, b) => a.baseStats.spe - b.baseStats.spe)
    .slice(0, 3)
    .map((o) => `${o.name} can go as low as ${opponentSpeedProfile(o).trueMin}`);
  const detailParts = [
    `Likely setter(s): ${setterNames}.`,
    `Under Trick Room the SLOWEST Pokemon moves first — your speed advantage flips into a liability.`,
    `TR builds run 0 Speed IVs and a minus nature: ${trFloors.join("; ")}.`,
    `Your slowest (best under TR): ${slowest.map((s) => `${s.name} (${s.spe})`).join(", ")}.`,
  ];
  detailParts.push(
    myAnswers.length
      ? `Your tools: ${[...new Set(myAnswers)].join("; ")}.`
      : `You have NO direct answer (no Taunt/Fake Out/own Trick Room) — plan to stall the 5 TR turns with Protect and spread positioning, or pressure the setter before it goes off.`,
  );
  out.push({
    severity: setters.length ? "danger" : "warning",
    title: setters.length
      ? `Trick Room alert — ${setterNames}`
      : "This looks like it could be a Trick Room team",
    detail: detailParts.join(" "),
  });
}

function checkWeatherCombos(mine: MonWithSpecies[], opponents: Species[], out: MatchupWarning[]) {
  for (const setter of opponents) {
    for (const ability of setter.abilities) {
      const combo = WEATHER_SETTER[ability];
      if (!combo) continue;
      const abusers = opponents.filter(
        (o) => o !== setter && o.abilities.includes(combo.abuser),
      );
      if (!abusers.length) continue;
      const myFastest = Math.max(...mine.map(({ mon, species }) => monEffectiveSpeed(mon, species)));
      const abuserDoubled = abusers.map((a) => {
        // max invested, +nature, doubled
        const max = Math.floor(
          (Math.floor(((2 * a.baseStats.spe + 31 + 63) * 50) / 100) + 5) * 1.1,
        );
        return `${a.name} (~${max * 2} Spe in ${combo.weather})`;
      });
      out.push({
        severity: "danger",
        title: `${combo.weather} speed combo: ${setter.name} + ${abusers.map((a) => a.name).join(", ")}`,
        detail:
          `${setter.name} sets ${combo.weather} on entry (${ability}) and ${combo.abuser} doubles ` +
          `Speed in it: ${abuserDoubled.join(", ")} — your fastest is ${myFastest}. ` +
          `Knock out or pressure the weather setter first, or bring your own weather to overwrite it.`,
      });
    }
  }
}
