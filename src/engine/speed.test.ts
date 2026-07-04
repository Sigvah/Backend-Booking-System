import { describe, expect, it } from "vitest";
import {
  DEFAULT_FIELD,
  FieldState,
  SpeedSetup,
  calcEffectiveSpeed,
  calcRawSpeed,
  orderByAction,
} from "./speed";

const base = (overrides: Partial<SpeedSetup> = {}): SpeedSetup => ({
  baseSpeed: 100,
  level: 50,
  iv: 31,
  ev: 252,
  nature: "plus",
  stage: 0,
  item: "none",
  ability: "",
  speedIsHighestStat: true,
  unburdenActive: false,
  status: "healthy",
  tailwind: false,
  ...overrides,
});

const field = (overrides: Partial<FieldState> = {}): FieldState => ({
  ...DEFAULT_FIELD,
  ...overrides,
});

describe("calcRawSpeed", () => {
  // Well-known competitive benchmarks.
  it("Jolly max-speed Garchomp (base 102) is 169 at level 50", () => {
    expect(calcRawSpeed(base({ baseSpeed: 102 }))).toBe(169);
  });

  it("Jolly max-speed Garchomp is 333 at level 100", () => {
    expect(calcRawSpeed(base({ baseSpeed: 102, level: 100 }))).toBe(333);
  });

  it("Jolly max-speed Dragapult (base 142) is 213 at level 50", () => {
    expect(calcRawSpeed(base({ baseSpeed: 142 }))).toBe(213);
  });

  it("neutral no-investment base 100 is 120 at level 50", () => {
    expect(calcRawSpeed(base({ nature: "neutral", ev: 0 }))).toBe(120);
  });

  it("minimum speed (0 IV, 0 EV, minus nature) base 100 is 94 at level 50", () => {
    expect(calcRawSpeed(base({ nature: "minus", ev: 0, iv: 0 }))).toBe(94);
  });
});

describe("calcEffectiveSpeed", () => {
  it("applies Choice Scarf as ×1.5 with the game's rounding", () => {
    // 169 * 1.5 = 253.5, rounds half down to 253.
    expect(
      calcEffectiveSpeed(base({ baseSpeed: 102, item: "choicescarf" }), field()),
    ).toBe(253);
  });

  it("doubles speed with Swift Swim, but only in rain", () => {
    const setup = base({ ability: "Swift Swim" });
    expect(calcEffectiveSpeed(setup, field({ weather: "rain" }))).toBe(334);
    expect(calcEffectiveSpeed(setup, field({ weather: "sun" }))).toBe(167);
  });

  it("doubles speed under Tailwind", () => {
    expect(calcEffectiveSpeed(base({ tailwind: true }), field())).toBe(334);
  });

  it("halves speed when paralyzed", () => {
    expect(calcEffectiveSpeed(base({ status: "paralyzed" }), field())).toBe(83);
  });

  it("Quick Feet ignores the paralysis drop and boosts instead", () => {
    expect(
      calcEffectiveSpeed(
        base({ ability: "Quick Feet", status: "paralyzed" }),
        field(),
      ),
    ).toBe(250);
  });

  it("applies boost stages before the modifier chain", () => {
    expect(calcEffectiveSpeed(base({ stage: 1 }), field())).toBe(250); // 167 * 1.5
    expect(calcEffectiveSpeed(base({ stage: -1 }), field())).toBe(111); // 167 * 2/3
  });

  it("chains scarf + tailwind + rain ability like the games", () => {
    const setup = base({
      baseSpeed: 102,
      ability: "Swift Swim",
      item: "choicescarf",
      tailwind: true,
    });
    // 169 → ×2 ×1.5 ×2 chained in 4096ths = 1014
    expect(calcEffectiveSpeed(setup, field({ weather: "rain" }))).toBe(1014);
  });

  it("halves speed with Iron Ball", () => {
    expect(calcEffectiveSpeed(base({ item: "ironball" }), field())).toBe(83);
  });

  it("Protosynthesis boosts speed in sun when Speed is the highest stat", () => {
    const setup = base({ ability: "Protosynthesis" });
    expect(calcEffectiveSpeed(setup, field({ weather: "sun" }))).toBe(250);
    expect(calcEffectiveSpeed(setup, field())).toBe(167);
    expect(
      calcEffectiveSpeed(setup.item === "none" ? { ...setup, item: "boosterenergy" } : setup, field()),
    ).toBe(250);
  });

  it("Quark Drive does not boost when another stat is highest", () => {
    const setup = base({ ability: "Quark Drive", speedIsHighestStat: false });
    expect(calcEffectiveSpeed(setup, field({ terrain: "electric" }))).toBe(167);
  });
});

describe("orderByAction", () => {
  it("orders fastest first normally, slowest first under Trick Room", () => {
    const entries = [
      { entry: "slow", setup: base({ baseSpeed: 50 }) },
      { entry: "fast", setup: base({ baseSpeed: 150 }) },
    ];
    expect(orderByAction(entries, field()).map((e) => e.entry)).toEqual([
      "fast",
      "slow",
    ]);
    expect(
      orderByAction(entries, field({ trickRoom: true })).map((e) => e.entry),
    ).toEqual(["slow", "fast"]);
  });

  it("sends Lagging Tail holders to the back regardless of speed", () => {
    const entries = [
      { entry: "slow", setup: base({ baseSpeed: 50 }) },
      { entry: "fast-lagging", setup: base({ baseSpeed: 150, item: "laggingtail" }) },
    ];
    expect(orderByAction(entries, field()).map((e) => e.entry)).toEqual([
      "slow",
      "fast-lagging",
    ]);
  });
});
