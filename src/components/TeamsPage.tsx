import { useState } from "react";
import { getSpecies } from "../data";
import { calcAllStats } from "../lib/analysis";
import { NATURES } from "../lib/natures";
import {
  SAMPLE_PASTE,
  Team,
  TeamMon,
  parsePaste,
  serializeTeam,
} from "../lib/teams";
import { Sprite } from "./SpeciesSelect";

interface Props {
  teams: Team[];
  onChange: (teams: Team[]) => void;
}

export function TeamsPage({ teams, onChange }: Props) {
  const [pasteText, setPasteText] = useState("");
  const [teamName, setTeamName] = useState("");
  const [importError, setImportError] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const importPaste = (text: string, name: string) => {
    const { mons, errors } = parsePaste(text);
    setImportError(errors);
    if (!mons.length) return;
    const team: Team = {
      id: `team-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || `Team ${teams.length + 1}`,
      mons,
      updatedAt: Date.now(),
    };
    onChange([...teams, team]);
    setPasteText("");
    setTeamName("");
    setExpanded(team.id);
  };

  const updateMon = (teamId: string, index: number, mon: TeamMon) => {
    onChange(
      teams.map((t) =>
        t.id === teamId
          ? { ...t, mons: t.mons.map((m, i) => (i === index ? mon : m)), updatedAt: Date.now() }
          : t,
      ),
    );
  };

  const exportTeam = async (team: Team) => {
    await navigator.clipboard.writeText(serializeTeam(team));
    setCopied(team.id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="teams-page">
      <section className="import-box">
        <h2>Import a team</h2>
        <p className="hint">
          Paste the standard team export format (from Showdown, damage calcs, or
          most team builders). Level defaults to 50 if not specified.
        </p>
        <input
          type="text"
          placeholder="Team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
        <textarea
          rows={8}
          placeholder={"Garchomp @ Choice Scarf\nAbility: Rough Skin\nEVs: 252 Atk / 4 SpD / 252 Spe\nJolly Nature\n- Earthquake\n..."}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        {importError.length > 0 && (
          <div className="errors">
            {importError.map((e) => (
              <div key={e}>⚠ {e}</div>
            ))}
          </div>
        )}
        <div className="row">
          <button className="primary" onClick={() => importPaste(pasteText, teamName)}>
            Import team
          </button>
          <button onClick={() => importPaste(SAMPLE_PASTE, "Sample VGC team")}>
            Load sample team
          </button>
        </div>
      </section>

      {teams.length === 0 && (
        <p className="empty-note">No teams saved yet — import one above to get started.</p>
      )}

      {teams.map((team) => (
        <section key={team.id} className="team-card">
          <header className="team-header">
            <input
              className="team-name"
              value={team.name}
              onChange={(e) =>
                onChange(teams.map((t) => (t.id === team.id ? { ...t, name: e.target.value } : t)))
              }
            />
            <div className="team-sprites">
              {team.mons.map((m, i) => {
                const s = getSpecies(m.speciesId);
                return s ? <Sprite key={i} species={s} size={36} /> : null;
              })}
            </div>
            <div className="row">
              <button onClick={() => setExpanded(expanded === team.id ? null : team.id)}>
                {expanded === team.id ? "Collapse" : "Edit"}
              </button>
              <button onClick={() => exportTeam(team)}>
                {copied === team.id ? "Copied!" : "Export"}
              </button>
              <button
                className="danger"
                onClick={() => {
                  if (confirm(`Delete team "${team.name}"?`)) {
                    onChange(teams.filter((t) => t.id !== team.id));
                  }
                }}
              >
                Delete
              </button>
            </div>
          </header>

          {expanded === team.id && (
            <div className="mon-editors">
              {team.mons.map((mon, i) => (
                <MonEditor
                  key={i}
                  mon={mon}
                  onChange={(next) => updateMon(team.id, i, next)}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function MonEditor({ mon, onChange }: { mon: TeamMon; onChange: (m: TeamMon) => void }) {
  const species = getSpecies(mon.speciesId);
  if (!species) return null;
  const stats = calcAllStats(mon, species);
  const set = (patch: Partial<TeamMon>) => onChange({ ...mon, ...patch });

  return (
    <div className="mon-editor">
      <div className="mon-editor-head">
        <Sprite species={species} size={40} />
        <div>
          <strong>{species.name}</strong>
          <div className="mon-stats">
            {stats.hp}/{stats.atk}/{stats.def}/{stats.spa}/{stats.spd}/<b>{stats.spe} Spe</b>
          </div>
        </div>
      </div>
      <div className="mon-editor-grid">
        <label>
          Item
          <input value={mon.item} onChange={(e) => set({ item: e.target.value })} />
        </label>
        <label>
          Ability
          <select value={mon.ability} onChange={(e) => set({ ability: e.target.value })}>
            {[...new Set([...species.abilities, mon.ability])].filter(Boolean).map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          Nature
          <select value={mon.nature} onChange={(e) => set({ nature: e.target.value })}>
            {NATURES.map((n) => (
              <option key={n.name} value={n.name}>
                {n.name}
                {n.plus ? ` (+${n.plus}/−${n.minus})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Level
          <input
            type="number"
            min={1}
            max={100}
            value={mon.level}
            onChange={(e) => set({ level: Math.max(1, Math.min(100, +e.target.value || 1)) })}
          />
        </label>
        <label>
          Speed EVs
          <input
            type="number"
            min={0}
            max={252}
            step={4}
            value={mon.evs.spe}
            onChange={(e) =>
              set({ evs: { ...mon.evs, spe: Math.max(0, Math.min(252, +e.target.value || 0)) } })
            }
          />
        </label>
        <label>
          Speed IV
          <input
            type="number"
            min={0}
            max={31}
            value={mon.ivs.spe}
            onChange={(e) =>
              set({ ivs: { ...mon.ivs, spe: Math.max(0, Math.min(31, +e.target.value || 0)) } })
            }
          />
        </label>
      </div>
      {mon.moves.length > 0 && <div className="mon-moves">{mon.moves.join(" · ")}</div>}
    </div>
  );
}
