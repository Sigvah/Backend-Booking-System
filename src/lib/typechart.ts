// Standard type effectiveness chart (Gen 6+). Only non-neutral matchups listed.
const CHART: Record<string, Record<string, number>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
};

export function effectiveness(attackType: string, defenderTypes: string[]): number {
  return defenderTypes.reduce(
    (mult, def) => mult * (CHART[attackType]?.[def] ?? 1),
    1,
  );
}

/** Best STAB effectiveness one typing can achieve against another. */
export function bestStab(attackerTypes: string[], defenderTypes: string[]): number {
  return Math.max(
    ...attackerTypes.map((t) => effectiveness(t, defenderTypes)),
  );
}

export const ALL_TYPES = Object.keys(CHART);

export interface DefensiveProfile {
  x4: string[];
  x2: string[];
  x05: string[];
  x025: string[];
  x0: string[];
}

/** What a typing is weak to / resists / is immune to. */
export function defensiveProfile(defenderTypes: string[]): DefensiveProfile {
  const profile: DefensiveProfile = { x4: [], x2: [], x05: [], x025: [], x0: [] };
  for (const atk of ALL_TYPES) {
    const mult = effectiveness(atk, defenderTypes);
    if (mult === 4) profile.x4.push(atk);
    else if (mult === 2) profile.x2.push(atk);
    else if (mult === 0.5) profile.x05.push(atk);
    else if (mult === 0.25) profile.x025.push(atk);
    else if (mult === 0) profile.x0.push(atk);
  }
  return profile;
}
