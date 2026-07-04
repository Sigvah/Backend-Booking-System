/**
 * Plain-English notes for abilities a novice must recognize at team preview.
 * `tag` is a very short warning shown directly in the scout matrix header;
 * `text` is the full explanation shown on the Pokemon info card.
 */
export interface AbilityNote {
  tag?: string;
  text: string;
}

export const ABILITY_NOTES: Record<string, AbilityNote> = {
  // --- priority blockers & flinch protection ---
  "Armor Tail": {
    tag: "blocks Fake Out/priority",
    text: "Priority moves (Fake Out, Extreme Speed, Sucker Punch…) simply fail against it AND its ally. This is why Fake Out does nothing into Farigiraf.",
  },
  Dazzling: {
    tag: "blocks Fake Out/priority",
    text: "Priority moves fail against it and its ally — Fake Out, Aqua Jet, Sucker Punch all do nothing.",
  },
  "Queenly Majesty": {
    tag: "blocks Fake Out/priority",
    text: "Priority moves fail against it and its ally — Fake Out, Aqua Jet, Sucker Punch all do nothing.",
  },
  "Inner Focus": {
    tag: "can't flinch",
    text: "Cannot flinch — Fake Out still deals damage but won't skip its turn.",
  },
  "Shield Dust": {
    text: "Ignores added effects of moves against it — no Fake Out flinch, no Icy Wind speed drop side effects (the damage still applies).",
  },

  // --- switch-in disruption ---
  Intimidate: {
    tag: "drops your Atk",
    text: "Lowers the Attack of both opposing Pokemon by one stage when it switches in. Physical attackers hate this.",
  },

  // --- stat-drop interactions ---
  "Clear Body": { text: "Its stats can't be lowered — Intimidate and Icy Wind drops fail." },
  "White Smoke": { text: "Its stats can't be lowered — Intimidate and Icy Wind drops fail." },
  "Full Metal Body": { text: "Its stats can't be lowered — Intimidate and Icy Wind drops fail." },
  Defiant: {
    tag: "punishes Intimidate",
    text: "Gets +2 Attack whenever a stat is lowered — Intimidating it makes it MUCH stronger.",
  },
  Competitive: {
    tag: "punishes Intimidate",
    text: "Gets +2 Sp. Atk whenever a stat is lowered — Intimidate backfires badly.",
  },
  Unaware: {
    text: "Ignores your stat boosts when taking hits — sweeping through it with +2 Attack doesn't help.",
  },

  // --- weather / terrain setters ---
  Drizzle: { tag: "sets rain", text: "Summons rain on entry: Water moves ×1.5, Fire moves ×0.5, enables Swift Swim." },
  Drought: { tag: "sets sun", text: "Summons sun on entry: Fire moves ×1.5, Water moves ×0.5, enables Chlorophyll and Protosynthesis." },
  "Orichalcum Pulse": { tag: "sets sun", text: "Summons sun and boosts its own Attack in it — Koraidon's signature." },
  "Sand Stream": { tag: "sets sand", text: "Summons a sandstorm on entry: chip damage to most types, Rock-types get +50% Sp. Def, enables Sand Rush." },
  "Snow Warning": { tag: "sets snow", text: "Summons snow on entry: Ice-types get +50% Defense, enables Slush Rush." },
  "Electric Surge": { tag: "sets Electric Terrain", text: "Sets Electric Terrain: Electric moves ×1.3, grounded Pokemon can't fall asleep (blocks Spore!), enables Quark Drive." },
  "Hadron Engine": { tag: "sets Electric Terrain", text: "Sets Electric Terrain and boosts its own Sp. Atk in it — Miraidon's signature." },
  "Grassy Surge": { tag: "sets Grassy Terrain", text: "Sets Grassy Terrain: Grass moves ×1.3, grounded Pokemon heal each turn, Earthquake is halved." },
  "Misty Surge": { tag: "sets Misty Terrain", text: "Sets Misty Terrain: grounded Pokemon can't be statused (no Spore, no Will-O-Wisp), Dragon moves halved." },
  "Psychic Surge": { tag: "sets Psychic Terrain", text: "Sets Psychic Terrain: blocks priority moves (incl. Fake Out) against grounded Pokemon." },

  // --- immunities / redirection ---
  Levitate: { text: "Immune to Ground moves — Earthquake does nothing." },
  "Flash Fire": { text: "Immune to Fire moves and gets stronger when hit by one." },
  "Water Absorb": { text: "Immune to Water moves — they heal it instead." },
  "Storm Drain": { tag: "eats Water moves", text: "Sucks in all Water moves (even ones aimed at its ally), takes no damage and gets +1 Sp. Atk." },
  "Lightning Rod": { tag: "eats Electric moves", text: "Sucks in all Electric moves (even ones aimed at its ally), takes no damage and gets +1 Sp. Atk." },
  "Volt Absorb": { text: "Immune to Electric moves — they heal it instead." },
  "Motor Drive": { text: "Immune to Electric moves — they give it +1 Speed instead." },
  "Sap Sipper": { text: "Immune to Grass moves (including Spore!) — they give it +1 Attack instead." },
  "Earth Eater": { text: "Immune to Ground moves — they heal it instead." },
  "Well-Baked Body": { text: "Immune to Fire moves — they give it +2 Defense instead." },
  "Good as Gold": {
    tag: "immune to status moves",
    text: "Immune to status moves from others — Spore, Will-O-Wisp, Taunt and Thunder Wave all fail. Attack it or ignore it.",
  },
  "Magic Bounce": {
    tag: "reflects status moves",
    text: "Bounces status moves back at the user — your own Spore can put YOU to sleep.",
  },
  Telepathy: { text: "Takes no damage from its ally's spread moves (its partner can Earthquake freely)." },

  // --- "free hit" / survivability ---
  Disguise: { tag: "free hit", text: "The first attack that hits it does no damage (only breaks the disguise). Budget one extra hit to KO it." },
  "Ice Face": { tag: "free physical hit", text: "The first physical hit does no damage (breaks its ice head, re-forms in snow)." },
  Sturdy: { text: "Can't be knocked out in one hit from full HP — always survives with 1 HP." },
  Multiscale: { text: "Takes half damage while at full HP — much bulkier than it looks until you chip it." },
  Regenerator: { text: "Heals a third of its HP every time it switches out — punish it for staying in, or it never dies." },

  // --- offensive threats ---
  "Huge Power": { tag: "double Attack", text: "Its Attack is doubled — hits twice as hard as its stats suggest." },
  "Pure Power": { tag: "double Attack", text: "Its Attack is doubled — hits twice as hard as its stats suggest." },
  "Water Bubble": { text: "Its Water moves hit double, and it can't be burned." },
  Guts: {
    tag: "wants to be statused",
    text: "Status boosts its Attack ×1.5 and Facade doubles — burning it makes it STRONGER (Flame Orb Ursaluna does this to itself).",
  },
  "Speed Boost": { tag: "gets faster every turn", text: "Gains +1 Speed at the end of every turn — outspeed problems get worse the longer it stays." },
  Moxie: { text: "+1 Attack every time it knocks something out — don't feed it KOs." },
  "Chilling Neigh": { text: "+1 Attack every time it knocks something out." },
  "Grim Neigh": { text: "+1 Sp. Atk every time it knocks something out." },
  "Beast Boost": { text: "Boosts its best stat every time it knocks something out." },
  Prankster: {
    tag: "priority status moves",
    text: "Its status moves get +1 priority (Thunder Wave, Tailwind, Taunt go first). Dark-types are immune to Prankster status moves.",
  },
  "Gale Wings": { text: "Its Flying moves have priority while at full HP (Brave Bird first)." },
  Technician: { text: "Weak moves (≤60 power) hit ×1.5 — Fake Out and multi-hit moves hurt more than expected." },
  "Parental Bond": { text: "Hits twice with every attack." },
  Libero: { text: "Changes type to match its move — every attack gets the same-type boost." },
  Protean: { text: "Changes type to match its move — every attack gets the same-type boost." },
  "Sheer Force": { text: "Moves with side effects hit ×1.3 (loses the side effect)." },

  // --- the Ruin quartet ---
  "Sword of Ruin": { tag: "team-wide Def cut", text: "Everyone else's Defense is cut 25% while it's on the field (Chien-Pao)." },
  "Beads of Ruin": { tag: "team-wide SpD cut", text: "Everyone else's Sp. Def is cut 25% while it's on the field (Chi-Yu)." },
  "Tablets of Ruin": { text: "Everyone else's Attack is cut 25% while it's on the field (Wo-Chien)." },
  "Vessel of Ruin": { text: "Everyone else's Sp. Atk is cut 25% while it's on the field (Ting-Lu)." },

  // --- doubles-specific ---
  Commander: {
    tag: "Dondozo combo",
    text: "Tatsugiri jumps into Dondozo's mouth: Dondozo gets +2 to everything and Tatsugiri becomes untargetable. Scary but puts two Pokemon in one slot.",
  },
  "Friend Guard": { text: "Its ally takes 25% less damage while it's out." },
  "Flame Body": { text: "Contact moves have a 30% chance to burn you." },
  Static: { text: "Contact moves have a 30% chance to paralyze you." },
  "Rough Skin": { text: "Contact moves hurt the attacker (⅛ HP each hit)." },
  "Iron Barbs": { text: "Contact moves hurt the attacker (⅛ HP each hit)." },
  "Cursed Body": { text: "Moves that hit it can get disabled (30%)." },

  // --- speed abilities (engine also models these) ---
  "Swift Swim": { text: "Speed doubles in rain." },
  Chlorophyll: { text: "Speed doubles in sun." },
  "Sand Rush": { text: "Speed doubles in a sandstorm (and takes no sand chip damage)." },
  "Slush Rush": { text: "Speed doubles in snow." },
  "Surge Surfer": { text: "Speed doubles in Electric Terrain." },
  Unburden: { text: "Speed doubles once its held item is used or lost (e.g. after eating a berry)." },
  Protosynthesis: {
    text: "In sun (or with Booster Energy): its highest stat gets +30% (+50% if that's Speed). Ancient 'paradox' Pokemon only.",
  },
  "Quark Drive": {
    text: "In Electric Terrain (or with Booster Energy): its highest stat gets +30% (+50% if that's Speed). Future 'paradox' Pokemon only.",
  },
  "Quick Feet": { text: "Speed ×1.5 when statused, and paralysis doesn't slow it." },
  "Slow Start": { text: "Attack and Speed halved for its first 5 turns." },
};

export function abilityNote(name: string): AbilityNote | undefined {
  return ABILITY_NOTES[name];
}

/** Short warning tags for a species' possible abilities (scout header). */
export function headlineTags(abilities: string[]): string[] {
  const tags: string[] = [];
  for (const a of abilities) {
    const note = ABILITY_NOTES[a];
    if (note?.tag && !tags.includes(note.tag)) tags.push(note.tag);
  }
  return tags.slice(0, 3);
}
