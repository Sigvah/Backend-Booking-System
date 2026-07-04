import { describe, expect, it } from "vitest";
import { getSpecies } from "../data";
import { SAMPLE_PASTE, Team, parsePaste } from "./teams";
import { computeWarnings, getMove } from "./warnings";

const team: Team = {
  id: "t",
  name: "Sample",
  mons: parsePaste(SAMPLE_PASTE).mons, // incl. Iron Hands (Fake Out), Amoonguss (Spore), Garchomp (EQ)
  updatedAt: 0,
};

const opp = (id: string) => {
  const s = getSpecies(id);
  if (!s) throw new Error(`unknown: ${id}`);
  return s;
};

describe("getMove", () => {
  it("resolves moves case/punctuation-insensitively", () => {
    expect(getMove("Fake Out")?.priority).toBe(3);
    expect(getMove("u-turn")?.type).toBe("Bug");
    expect(getMove("Spore")?.powder).toBe(1);
  });
});

describe("computeWarnings", () => {
  it("flags Armor Tail blocking my Fake Out (the Farigiraf trap)", () => {
    const warnings = computeWarnings(team, [opp("farigiraf")]);
    const w = warnings.find((x) => x.title.includes("priority moves fail"));
    expect(w).toBeDefined();
    expect(w!.severity).toBe("danger");
    expect(w!.detail).toContain("Armor Tail");
    expect(w!.detail).toContain("Iron Hands's Fake Out");
  });

  it("flags Psychic Terrain shutting off priority", () => {
    const warnings = computeWarnings(team, [opp("indeedee")]);
    const w = warnings.find((x) => x.title.includes("Psychic Terrain"));
    expect(w).toBeDefined();
    expect(w!.severity).toBe("danger");
  });

  it("flags type immunities (Earthquake vs a Flying-type)", () => {
    const warnings = computeWarnings(team, [opp("talonflame")]);
    const w = warnings.find((x) => x.title.startsWith("Ground moves do NOTHING"));
    expect(w).toBeDefined();
    expect(w!.detail).toContain("Garchomp's Earthquake");
  });

  it("flags possible ability absorbs (Levitate vs Earthquake)", () => {
    const warnings = computeWarnings(team, [opp("rotomheat")]);
    const w = warnings.find((x) => x.title.includes("Levitate"));
    expect(w).toBeDefined();
    expect(w!.detail).toContain("Earthquake");
  });

  it("flags powder immunity for Spore vs Grass-types", () => {
    const warnings = computeWarnings(team, [opp("rillaboom")]);
    const w = warnings.find((x) => x.title.startsWith("Powder moves fail"));
    expect(w).toBeDefined();
    expect(w!.detail).toContain("Amoonguss's Spore");
  });

  it("raises a Trick Room alert with my available answers", () => {
    const warnings = computeWarnings(team, [opp("hatterene"), opp("torkoal"), opp("ursaluna")]);
    const w = warnings.find((x) => x.title.includes("Trick Room"));
    expect(w).toBeDefined();
    expect(w!.severity).toBe("danger");
    expect(w!.detail).toContain("Hatterene");
    expect(w!.detail).toContain("Fake Out"); // Iron Hands can flinch the setter
    expect(w!.detail).toContain("Amoonguss"); // my slowest, best under TR
  });

  it("flags weather speed combos (Drizzle + Swift Swim)", () => {
    const warnings = computeWarnings(team, [opp("pelipper"), opp("basculegion")]);
    const w = warnings.find((x) => x.title.includes("rain speed combo"));
    expect(w).toBeDefined();
    expect(w!.severity).toBe("danger");
    expect(w!.detail).toContain("Swift Swim");
  });

  it("is quiet when nothing applies", () => {
    const warnings = computeWarnings(team, [opp("garchomp")]);
    expect(warnings.filter((w) => w.severity === "danger")).toHaveLength(0);
  });
});
