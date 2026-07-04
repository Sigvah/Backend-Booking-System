import { useState } from "react";
import { Species, getSpecies } from "../data";
import { calcAllStats } from "../lib/analysis";
import { NATURES, StatKey } from "../lib/natures";
import {
  SAMPLE_PASTE,
  Team,
  TeamMon,
  blankMon,
  newId,
  parsePaste,
  serializeTeam,
} from "../lib/teams";
import { ALL_MOVE_NAMES } from "../lib/warnings";
import { SpeciesSelect, Sprite } from "./SpeciesSelect";

interface Props {
  teams: Team[];
  onChange: (teams: Team[]) => void;
}

const MAX_TEAM_SIZE = 6;
const EV_KEYS: { key: StatKey; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "atk", label: "Atk" },
  { key: "def", label: "Def" },
  { key: "spa", label: "SpA" },
  { key: "spd", label: "SpD" },
  { key: "spe", label: "Spe" },
];

export function TeamsPage({ teams, onChange }: Props) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [teamName, setTeamName] = useState("");
  const [importError, setImportError] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const addTeam = (team: Team) => {
    onChange([...teams, team]);
    setExpanded(team.id);
  };

  const newTeam = () => {
    addTeam({
      id: newId("team"),
      name: `Team ${teams.length + 1}`,
      mons: [blankMon("pikachu")],
      updatedAt: Date.now(),
    });
  };

  const importPaste = (text: string, name: string) => {
    const { mons, errors } = parsePaste(text);
    setImportError(errors);
    if (!mons.length) return;
    addTeam({
      id: newId("team"),
      name: name.trim() || `Team ${teams.length + 1}`,
      mons,
      updatedAt: Date.now(),
    });
    setPasteText("");
    setTeamName("");
  };

  const updateTeam = (teamId: string, patch: Partial<Team>) =>
    onChange(
      teams.map((t) => (t.id === teamId ? { ...t, ...patch, updatedAt: Date.now() } : t)),
    );

  const exportTeam = async (team: Team) => {
    await navigator.clipboard.writeText(serializeTeam(team));
    setCopied(team.id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="teams-page">
      {/* Shared move-name autocomplete for all move inputs */}
      <datalist id="all-moves">
        {ALL_MOVE_NAMES.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="row team-actions-top">
        <button className="primary" onClick={newTeam}>
          + New team
        </button>
        <button onClick={() => importPaste(SAMPLE_PASTE, "Sample VGC team")}>
          Load sample team
        </button>
        <button onClick={() => setPasteOpen(!pasteOpen)}>
          {pasteOpen ? "Hide paste import" : "Import from paste…"}
        </button>
      </div>

      {pasteOpen && (
        <section className="import-box">
          <p className="hint">
            Shortcut for teams from Showdown / team builders — paste the standard export text.
            You can also just build a team by hand with “New team”.
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
          </div>
        </section>
      )}

      {teams.length === 0 && (
        <p className="empty-note">
          No teams yet. Hit <strong>+ New team</strong> and build your in-game team here —
          pick each Pokemon, its item, ability, nature and moves.
        </p>
      )}

      {teams.map((team) => (
        <section key={team.id} className="team-card">
          <header className="team-header">
            <input
              className="team-name"
              value={team.name}
              onChange={(e) => updateTeam(team.id, { name: e.target.value })}
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
            <>
              <div className="mon-editors">
                {team.mons.map((mon, i) => (
                  <MonEditor
                    key={i}
                    mon={mon}
                    onChange={(next) =>
                      updateTeam(team.id, {
                        mons: team.mons.map((m, j) => (j === i ? next : m)),
                      })
                    }
                    onRemove={() =>
                      updateTeam(team.id, { mons: team.mons.filter((_, j) => j !== i) })
                    }
                  />
                ))}
              </div>
              {team.mons.length < MAX_TEAM_SIZE && (
                <button
                  className="add-mon"
                  onClick={() =>
                    updateTeam(team.id, { mons: [...team.mons, blankMon("pikachu")] })
                  }
                >
                  + Add Pokemon ({team.mons.length}/{MAX_TEAM_SIZE})
                </button>
              )}
            </>
          )}
        </section>
      ))}
    </div>
  );
}

function MonEditor({
  mon,
  onChange,
  onRemove,
}: {
  mon: TeamMon;
  onChange: (m: TeamMon) => void;
  onRemove: () => void;
}) {
  const species = getSpecies(mon.speciesId);
  if (!species) return null;
  const stats = calcAllStats(mon, species);
  const evTotal = Object.values(mon.evs).reduce((a, b) => a + b, 0);
  const set = (patch: Partial<TeamMon>) => onChange({ ...mon, ...patch });

  const changeSpecies = (s: Species) =>
    set({ speciesId: s.id, ability: s.abilities[0] ?? "" });

  return (
    <div className="mon-editor">
      <div className="mon-editor-head">
        <Sprite species={species} size={40} />
        <div className="mon-head-main">
          <SpeciesSelect selected={species} onSelect={changeSpecies} />
          <div className="mon-stats">
            {stats.hp}/{stats.atk}/{stats.def}/{stats.spa}/{stats.spd}/<b>{stats.spe} Spe</b>
          </div>
        </div>
        <button className="icon-btn" title="Remove from team" onClick={onRemove}>
          ✕
        </button>
      </div>

      <div className="mon-editor-grid">
        <label>
          Item
          <input
            value={mon.item}
            placeholder="e.g. Choice Scarf"
            onChange={(e) => set({ item: e.target.value })}
          />
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
            onChange={(e) => set({ level: clampNum(e.target.value, 1, 100) })}
          />
        </label>
        <label>
          Speed IV
          <input
            type="number"
            min={0}
            max={31}
            value={mon.ivs.spe}
            onChange={(e) => set({ ivs: { ...mon.ivs, spe: clampNum(e.target.value, 0, 31) } })}
          />
        </label>
      </div>

      <div className="ev-block">
        <div className="ev-heading">
          EVs{" "}
          <span className={evTotal > 508 ? "ev-total over" : "ev-total"}>
            {evTotal}/508{evTotal > 508 ? " — over the limit!" : ""}
          </span>
        </div>
        <div className="ev-grid">
          {EV_KEYS.map(({ key, label }) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min={0}
                max={252}
                step={4}
                value={mon.evs[key]}
                onChange={(e) =>
                  set({ evs: { ...mon.evs, [key]: clampNum(e.target.value, 0, 252) } })
                }
              />
            </label>
          ))}
        </div>
      </div>

      <div className="moves-block">
        <div className="ev-heading">Moves</div>
        <div className="moves-grid">
          {[0, 1, 2, 3].map((i) => (
            <input
              key={i}
              list="all-moves"
              placeholder={`Move ${i + 1}`}
              value={mon.moves[i] ?? ""}
              onChange={(e) => {
                const moves = [...mon.moves];
                while (moves.length <= i) moves.push("");
                moves[i] = e.target.value;
                set({ moves });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function clampNum(raw: string, min: number, max: number): number {
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? min : Math.max(min, Math.min(max, n));
}
