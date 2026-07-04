import { describe, expect, it } from "vitest";
import { calcAllStats, monEffectiveSpeed, opponentSpeedProfile } from "./analysis";
import { getSpecies } from "../data";
import { SAMPLE_PASTE, parsePaste, serializeTeam } from "./teams";

describe("parsePaste", () => {
  it("parses a full standard set", () => {
    const { mons, errors } = parsePaste(`Garchomp @ Choice Scarf
Ability: Rough Skin
Level: 50
Tera Type: Steel
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
IVs: 0 SpA
- Earthquake
- Dragon Claw
- Rock Slide
- Iron Head`);
    expect(errors).toEqual([]);
    expect(mons).toHaveLength(1);
    const mon = mons[0];
    expect(mon.speciesId).toBe("garchomp");
    expect(mon.item).toBe("Choice Scarf");
    expect(mon.ability).toBe("Rough Skin");
    expect(mon.level).toBe(50);
    expect(mon.nature).toBe("Jolly");
    expect(mon.teraType).toBe("Steel");
    expect(mon.evs).toEqual({ hp: 4, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 });
    expect(mon.ivs.spa).toBe(0);
    expect(mon.ivs.spe).toBe(31);
    expect(mon.moves).toHaveLength(4);
  });

  it("handles nicknames, genders and multi-word species", () => {
    const { mons, errors } = parsePaste(`Chompy (Garchomp) (F) @ Life Orb
Ability: Rough Skin
- Earthquake

Iron Hands @ Assault Vest
Ability: Quark Drive
- Drain Punch`);
    expect(errors).toEqual([]);
    expect(mons.map((m) => m.speciesId)).toEqual(["garchomp", "ironhands"]);
    expect(mons[0].nickname).toBe("Chompy");
  });

  it("reports unknown species instead of crashing", () => {
    const { mons, errors } = parsePaste("Fakemon @ Leftovers\n- Tackle");
    expect(mons).toHaveLength(0);
    expect(errors[0]).toContain("Fakemon");
  });

  it("round-trips through serializeTeam", () => {
    const { mons } = parsePaste(SAMPLE_PASTE);
    expect(mons).toHaveLength(6);
    const text = serializeTeam({ id: "t", name: "T", mons, updatedAt: 0 });
    const reparsed = parsePaste(text);
    expect(reparsed.errors).toEqual([]);
    expect(reparsed.mons).toEqual(mons);
  });
});

describe("analysis", () => {
  it("computes full stats correctly (max-speed Jolly Garchomp @ 50)", () => {
    const { mons } = parsePaste(`Garchomp @ Choice Scarf
Ability: Rough Skin
Level: 50
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Earthquake`);
    const species = getSpecies("garchomp")!;
    const stats = calcAllStats(mons[0], species);
    expect(stats.spe).toBe(169);
    expect(stats.atk).toBe(182); // 252 Atk Jolly Garchomp @ 50
    expect(stats.hp).toBe(184); // 4 HP
  });

  it("includes the mon's own item in its effective speed", () => {
    const { mons } = parsePaste(`Garchomp @ Choice Scarf
Ability: Rough Skin
Level: 50
EVs: 252 Spe
Jolly Nature
- Earthquake`);
    const species = getSpecies("garchomp")!;
    expect(monEffectiveSpeed(mons[0], species)).toBe(253);
  });

  it("profiles opponent speed ranges", () => {
    const p = opponentSpeedProfile(getSpecies("dragapult")!);
    expect(p.min).toBe(162); // base 142, 31 IV, 0 EV, neutral @ 50
    expect(p.max).toBe(213);
    expect(p.scarfMax).toBe(319); // 213 * 1.5 = 319.5 → pokeRound half-down 319
  });

  it("flags weather speed abilities on opponents", () => {
    const p = opponentSpeedProfile(getSpecies("basculegion")!);
    expect(p.doublingAbilities.join()).toContain("Swift Swim");
  });
});
