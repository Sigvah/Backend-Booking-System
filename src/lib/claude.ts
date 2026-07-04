import Anthropic from "@anthropic-ai/sdk";
import { Species, getSpecies } from "../data";
import {
  VERDICT_LABEL,
  calcAllStats,
  matchupCell,
  monEffectiveSpeed,
  opponentSpeedProfile,
} from "./analysis";
import { Team } from "./teams";

export interface LlmSettings {
  apiKey: string;
  model: string;
}

export const MODELS = [
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 (fast & cheap)" },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5 (balanced)" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8 (most thorough)" },
];

const SETTINGS_KEY = "csc:settings";

export function loadSettings(): LlmSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { model: MODELS[0].id, ...JSON.parse(raw) };
  } catch {
    /* fall through */
  }
  return { apiKey: "", model: MODELS[0].id };
}

export function saveSettings(settings: LlmSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export type BattleFormat = "singles" | "doubles";

/** Build the full analysis prompt from my team + their 6 + our exact math. */
export function buildPrompt(
  team: Team,
  opponents: Species[],
  format: BattleFormat,
  warnings: { title: string; detail: string }[] = [],
): string {
  const lines: string[] = [];

  lines.push(`Battle format: ${format} (Pokemon Champions ranked, level 50).`);
  lines.push("");
  lines.push("## My team (full sets)");
  for (const mon of team.mons) {
    const species = getSpecies(mon.speciesId);
    if (!species) continue;
    const stats = calcAllStats(mon, species);
    lines.push(
      `- ${species.name} [${species.types.join("/")}] @ ${mon.item || "no item"} | ` +
        `${mon.ability} | ${mon.nature} | ` +
        `stats ${stats.hp}/${stats.atk}/${stats.def}/${stats.spa}/${stats.spd}/${stats.spe} | ` +
        `moves: ${mon.moves.join(", ") || "unknown"}`,
    );
  }
  lines.push("");
  lines.push("## Opponent's team preview (species only — sets unknown)");
  for (const s of opponents) {
    const b = s.baseStats;
    lines.push(
      `- ${s.name} [${s.types.join("/")}] base ${b.hp}/${b.atk}/${b.def}/${b.spa}/${b.spd}/${b.spe}, ` +
        `abilities: ${s.abilities.join(", ")}`,
    );
  }
  lines.push("");
  lines.push("## Exact speed math (already computed — trust these numbers)");
  for (const mon of team.mons) {
    const species = getSpecies(mon.speciesId);
    if (!species) continue;
    const mySpeed = monEffectiveSpeed(mon, species);
    const parts = opponents.map((opp) => {
      const profile = opponentSpeedProfile(opp);
      const cell = matchupCell(mySpeed, species, profile);
      return `vs ${opp.name} (max ${profile.max}, scarf ${profile.scarfMax}): ${VERDICT_LABEL[cell.verdict]}`;
    });
    lines.push(`- ${species.name} at ${mySpeed} Speed: ${parts.join("; ")}`);
  }
  if (warnings.length) {
    lines.push("");
    lines.push("## Detected matchup hazards (already verified by the app — address them)");
    for (const w of warnings) lines.push(`- ${w.title}: ${w.detail}`);
  }
  lines.push("");
  lines.push(
    "Give me a team-preview game plan: (1) the most likely sets/items/spreads for each of their Pokemon, " +
      "(2) their biggest threats to my team and my biggest threats to theirs, " +
      `(3) recommended ${format === "doubles" ? "lead pair + back pair" : "lead + top 2 backups"} with reasoning, ` +
      "(4) my win condition and the key turns/scenarios to watch for (Tailwind, Trick Room, weather, Protect timing), " +
      "and (5) if hazards were detected above, work each one into the plan — e.g. if they threaten Trick Room, " +
      "say explicitly whether I can beat it and how. " +
      "The user is a beginner: explain WHY briefly, avoid unexplained jargon. " +
      "Be concrete and concise — this is read during a 90-second team preview.",
  );
  return lines.join("\n");
}

const SYSTEM_PROMPT =
  "You are an expert competitive Pokemon (VGC / Pokemon Champions) coach. " +
  "You know current metagame trends, common sets, items and EV spreads. " +
  "The user gives you their exact team and the opponent's team preview. " +
  "Exact speed calculations are provided — do not recompute or contradict them. " +
  "Answer in tight markdown with short sections and bullet points.";

export async function* streamGamePlan(
  settings: LlmSettings,
  prompt: string,
): AsyncGenerator<string> {
  const client = new Anthropic({
    apiKey: settings.apiKey,
    dangerouslyAllowBrowser: true,
  });

  const stream = client.messages.stream({
    model: settings.model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
  await stream.finalMessage();
}
