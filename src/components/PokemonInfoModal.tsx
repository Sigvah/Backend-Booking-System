import { useEffect, useRef, useState } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { Species } from "../data";
import { abilityNote } from "../lib/abilityNotes";
import { LlmSettings } from "../lib/claude";
import { defensiveProfile } from "../lib/typechart";
import { Sprite } from "./SpeciesSelect";

interface Props {
  species: Species;
  settings: LlmSettings;
  onClose: () => void;
}

const STAT_ROWS: { key: keyof Species["baseStats"]; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "atk", label: "Attack" },
  { key: "def", label: "Defense" },
  { key: "spa", label: "Sp. Atk" },
  { key: "spd", label: "Sp. Def" },
  { key: "spe", label: "Speed" },
];

export function PokemonInfoModal({ species, settings, onClose }: Props) {
  const profile = defensiveProfile(species.types);
  const [explanation, setExplanation] = useState("");
  const [state, setState] = useState<"idle" | "streaming" | "error">("idle");
  const [error, setError] = useState("");
  const cancelled = useRef(false);

  useEffect(() => {
    return () => {
      cancelled.current = true;
    };
  }, []);

  const explain = async () => {
    setExplanation("");
    setError("");
    setState("streaming");
    try {
      const client = new Anthropic({
        apiKey: settings.apiKey,
        dangerouslyAllowBrowser: true,
      });
      const b = species.baseStats;
      const stream = client.messages.stream({
        model: settings.model,
        max_tokens: 1024,
        system:
          "You are a friendly competitive Pokemon coach explaining things to a complete beginner. " +
          "Plain language, no jargon without explaining it, at most ~180 words.",
        messages: [
          {
            role: "user",
            content:
              `Explain ${species.name} (types: ${species.types.join("/")}, ` +
              `base stats ${b.hp}/${b.atk}/${b.def}/${b.spa}/${b.spd}/${b.spe}, ` +
              `abilities: ${species.abilities.join(", ")}) for a beginner playing ` +
              "Pokemon Champions doubles: what role does it usually play, what are its most " +
              "common items/moves, what should I watch out for when facing it, and what's a " +
              "simple reliable way to beat it?",
          },
        ],
      });
      for await (const event of stream) {
        if (cancelled.current) return;
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text;
          setExplanation((p) => p + text);
        }
      }
      setState("idle");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal info-modal">
        <header className="info-head">
          <Sprite species={species} size={56} />
          <div className="panel-title">
            <h2>{species.name}</h2>
            <div className="type-row">
              {species.types.map((t) => (
                <span key={t} className={`type type-${t.toLowerCase()}`}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="stat-bars">
          {STAT_ROWS.map(({ key, label }) => {
            const value = species.baseStats[key];
            return (
              <div key={key} className="stat-bar-row">
                <span className="stat-label">{label}</span>
                <div className="stat-track">
                  <div
                    className="stat-fill"
                    style={{
                      width: `${Math.min(100, (value / 200) * 100)}%`,
                      background: statColor(value),
                    }}
                  />
                </div>
                <span className="stat-value">{value}</span>
              </div>
            );
          })}
        </div>

        <div className="def-profile">
          {profile.x4.length > 0 && <TypeLine label="Weak ×4" types={profile.x4} tone="bad" />}
          {profile.x2.length > 0 && <TypeLine label="Weak ×2" types={profile.x2} tone="bad" />}
          {profile.x05.length > 0 && <TypeLine label="Resists" types={profile.x05} tone="good" />}
          {profile.x025.length > 0 && (
            <TypeLine label="Resists ×4" types={profile.x025} tone="good" />
          )}
          {profile.x0.length > 0 && <TypeLine label="Immune" types={profile.x0} tone="good" />}
        </div>

        <div className="ability-list">
          <h3>Possible abilities</h3>
          {species.abilities.map((a) => {
            const note = abilityNote(a);
            return (
              <div key={a} className={`ability-row ${note?.tag ? "notable" : ""}`}>
                <strong>{a}</strong>
                {note ? <span> — {note.text}</span> : <span className="hint"> — no notable battle effect to worry about.</span>}
              </div>
            );
          })}
        </div>

        <div className="explain-section">
          {settings.apiKey ? (
            <button className="primary" disabled={state === "streaming"} onClick={explain}>
              {state === "streaming" ? "Thinking…" : "Explain with Claude"}
            </button>
          ) : (
            <p className="hint">Add an API key in ⚙ Settings to get a beginner-friendly rundown from Claude.</p>
          )}
          {state === "error" && <div className="errors">⚠ {error}</div>}
          {explanation && <p className="explanation">{explanation}</p>}
        </div>
      </div>
    </div>
  );
}

function TypeLine({ label, types, tone }: { label: string; types: string[]; tone: string }) {
  return (
    <div className={`type-line ${tone}`}>
      <span className="type-line-label">{label}</span>
      {types.map((t) => (
        <span key={t} className={`type type-${t.toLowerCase()}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

function statColor(value: number): string {
  if (value >= 130) return "#4fc06a";
  if (value >= 100) return "#8fc04f";
  if (value >= 70) return "#c9b52e";
  if (value >= 50) return "#c9852e";
  return "#c05a4f";
}
