import { useMemo, useRef, useState } from "react";
import { Species, getSpecies } from "../data";
import { headlineTags } from "../lib/abilityNotes";
import {
  MatchupCell,
  VERDICT_LABEL,
  matchupCell,
  monEffectiveSpeed,
  opponentSpeedProfile,
  speedItemOf,
} from "../lib/analysis";
import { PokemonInfoModal } from "./PokemonInfoModal";
import {
  BattleFormat,
  LlmSettings,
  buildPrompt,
  streamGamePlan,
} from "../lib/claude";
import { Team } from "../lib/teams";
import { computeWarnings } from "../lib/warnings";
import { SpeciesSelect, Sprite } from "./SpeciesSelect";

interface Props {
  teams: Team[];
  settings: LlmSettings;
  onOpenSettings: () => void;
}

export function ScoutPage({ teams, settings, onOpenSettings }: Props) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [opponents, setOpponents] = useState<(Species | null)[]>(Array(6).fill(null));
  const [format, setFormat] = useState<BattleFormat>("doubles");
  const [plan, setPlan] = useState("");
  const [planState, setPlanState] = useState<"idle" | "streaming" | "error">("idle");
  const [planError, setPlanError] = useState("");
  const [infoSpecies, setInfoSpecies] = useState<Species | null>(null);
  const abortRef = useRef(false);

  const team = teams.find((t) => t.id === teamId) ?? teams[0];
  const activeOpponents = opponents.filter((o): o is Species => o !== null);

  const warnings = useMemo(
    () => (team ? computeWarnings(team, activeOpponents) : []),
    [team, activeOpponents],
  );

  const grid = useMemo(() => {
    if (!team) return [];
    return team.mons.map((mon) => {
      const species = getSpecies(mon.speciesId);
      if (!species) return null;
      const mySpeed = monEffectiveSpeed(mon, species);
      const cells = activeOpponents.map((opp) => {
        const profile = opponentSpeedProfile(opp);
        return { profile, cell: matchupCell(mySpeed, species, profile) };
      });
      return { mon, species, mySpeed, cells };
    });
  }, [team, activeOpponents]);

  const generatePlan = async () => {
    if (!team || !settings.apiKey) return;
    setPlan("");
    setPlanError("");
    setPlanState("streaming");
    abortRef.current = false;
    try {
      const prompt = buildPrompt(team, activeOpponents, format, warnings);
      for await (const chunk of streamGamePlan(settings, prompt)) {
        if (abortRef.current) return;
        setPlan((p) => p + chunk);
      }
      setPlanState("idle");
    } catch (err) {
      setPlanState("error");
      setPlanError(err instanceof Error ? err.message : String(err));
    }
  };

  if (!teams.length) {
    return (
      <p className="empty-note">
        Save a team on the <strong>Teams</strong> tab first — then scout opponents here.
      </p>
    );
  }

  return (
    <div className="scout-page">
      <div className="scout-controls">
        <label>
          My team
          <select value={team?.id} onChange={(e) => setTeamId(e.target.value)}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Format
          <div className="segmented">
            <button
              className={format === "doubles" ? "active" : ""}
              onClick={() => setFormat("doubles")}
            >
              Doubles
            </button>
            <button
              className={format === "singles" ? "active" : ""}
              onClick={() => setFormat("singles")}
            >
              Singles
            </button>
          </div>
        </label>
      </div>

      <section>
        <h2>Opponent's team preview</h2>
        <div className="opponent-slots">
          {opponents.map((opp, i) => (
            <div key={i} className="opponent-slot">
              {opp ? (
                <div className="opponent-chip">
                  <Sprite species={opp} size={36} />
                  <button className="name-link" onClick={() => setInfoSpecies(opp)}>
                    {opp.name}
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() =>
                      setOpponents(opponents.map((o, j) => (j === i ? null : o)))
                    }
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <SpeciesSelect
                  selected={{ name: `Slot ${i + 1}…` } as Species}
                  onSelect={(s) =>
                    setOpponents(opponents.map((o, j) => (j === i ? s : o)))
                  }
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {activeOpponents.length > 0 && team && (
        <section>
          <h2>Speed matchups <span className="hint-inline">(their realistic ranges at level 50 vs your actual spreads)</span></h2>
          <div className="matrix-wrap">
            <table className="matrix">
              <thead>
                <tr>
                  <th>Yours ↓ / Theirs →</th>
                  {activeOpponents.map((opp) => {
                    const p = opponentSpeedProfile(opp);
                    return (
                      <th key={opp.id}>
                        <Sprite species={opp} size={32} />
                        <div>
                          <button className="name-link" onClick={() => setInfoSpecies(opp)}>
                            {opp.name}
                          </button>
                        </div>
                        <div className="range">
                          {p.min}–{p.max} <span className="scarf">⚡{p.scarfMax}</span>
                        </div>
                        {p.doublingAbilities.map((a) => (
                          <div key={a} className="ability-note">
                            ×2: {a}
                          </div>
                        ))}
                        {headlineTags(opp.abilities).map((tag) => (
                          <div key={tag} className="warn-tag">
                            ⚠ {tag}
                          </div>
                        ))}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {grid.map((row) =>
                  row ? (
                    <tr key={row.mon.speciesId + row.mySpeed}>
                      <td className="row-head">
                        <Sprite species={row.species} size={32} />
                        <div>
                          <div>{row.species.name}</div>
                          <div className="my-speed">
                            {row.mySpeed} Spe
                            {speedItemOf(row.mon.item) === "choicescarf" && " (Scarf)"}
                          </div>
                        </div>
                      </td>
                      {row.cells.map(({ cell }, i) => (
                        <MatchupCellView key={i} cell={cell} />
                      ))}
                    </tr>
                  ) : null,
                )}
              </tbody>
            </table>
          </div>
          <div className="legend">
            <span className="cell-safe">outspeeds even Scarf</span>
            <span className="cell-scarf-risk">outspeeds unless Scarf</span>
            <span className="cell-tie">speed tie</span>
            <span className="cell-range">depends on their EVs</span>
            <span className="cell-slower">always slower</span>
            <span>⚠ their STAB hits you super-effectively</span>
          </div>
        </section>
      )}

      {warnings.length > 0 && (
        <section>
          <h2>Heads-up before you pick</h2>
          <div className="warnings">
            {warnings.map((w, i) => (
              <div key={i} className={`warning-card ${w.severity}`}>
                <div className="warning-title">
                  {w.severity === "danger" ? "🚨" : w.severity === "warning" ? "⚠️" : "ℹ️"}{" "}
                  {w.title}
                </div>
                <div className="warning-detail">{w.detail}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeOpponents.length > 0 && team && (
        <section className="plan-section">
          <h2>Game plan (Claude)</h2>
          {!settings.apiKey ? (
            <p className="hint">
              Add your Anthropic API key in{" "}
              <button className="link" onClick={onOpenSettings}>
                Settings
              </button>{" "}
              to generate a game plan with Claude.
            </p>
          ) : (
            <div className="row">
              <button
                className="primary"
                disabled={planState === "streaming"}
                onClick={generatePlan}
              >
                {planState === "streaming" ? "Thinking…" : "Generate game plan"}
              </button>
              {planState === "streaming" && (
                <button
                  onClick={() => {
                    abortRef.current = true;
                    setPlanState("idle");
                  }}
                >
                  Stop
                </button>
              )}
            </div>
          )}
          {planState === "error" && <div className="errors">⚠ {planError}</div>}
          {plan && <PlanView text={plan} />}
        </section>
      )}

      {infoSpecies && (
        <PokemonInfoModal
          species={infoSpecies}
          settings={settings}
          onClose={() => setInfoSpecies(null)}
        />
      )}
    </div>
  );
}

function MatchupCellView({ cell }: { cell: MatchupCell }) {
  return (
    <td className={`cell-${cell.verdict}`} title={VERDICT_LABEL[cell.verdict]}>
      <span className="cell-main">{shortLabel(cell)}</span>
      {cell.theirStabIntoMe >= 2 && <span className="threat" title="Their STAB is super-effective against you">⚠</span>}
      {cell.myStabIntoThem >= 2 && <span className="edge" title="Your STAB is super-effective against them">◆</span>}
    </td>
  );
}

function shortLabel(cell: MatchupCell): string {
  switch (cell.verdict) {
    case "safe":
      return "✓✓";
    case "scarf-risk":
      return "✓";
    case "tie":
      return "=";
    case "range":
      return "~";
    case "slower":
      return "✗";
  }
}

/** Minimal markdown rendering: headings, bold, bullet lists. */
function PlanView({ text }: { text: string }) {
  const blocks = text.split("\n");
  return (
    <div className="plan-output">
      {blocks.map((line, i) => {
        if (line.startsWith("### ")) return <h4 key={i}>{inline(line.slice(4))}</h4>;
        if (line.startsWith("## ")) return <h3 key={i}>{inline(line.slice(3))}</h3>;
        if (line.startsWith("# ")) return <h3 key={i}>{inline(line.slice(2))}</h3>;
        if (/^\s*[-*] /.test(line))
          return <li key={i}>{inline(line.replace(/^\s*[-*] /, ""))}</li>;
        if (/^\s*\d+\. /.test(line))
          return <li key={i}>{inline(line.replace(/^\s*\d+\. /, ""))}</li>;
        if (!line.trim()) return <div key={i} className="plan-gap" />;
        return <p key={i}>{inline(line)}</p>;
      })}
    </div>
  );
}

function inline(text: string): (string | JSX.Element)[] {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}
