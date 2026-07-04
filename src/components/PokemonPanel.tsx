import { ITEM_OPTIONS, MonConfig, toSetup } from "../config";
import { Species, speedIsHighestBaseStat } from "../data";
import {
  FieldState,
  activeModifiers,
  calcEffectiveSpeed,
  calcRawSpeed,
} from "../engine/speed";
import { SpeciesSelect, Sprite } from "./SpeciesSelect";

interface Props {
  config: MonConfig;
  species: Species;
  field: FieldState;
  color: string;
  onChange: (config: MonConfig) => void;
  onRemove?: () => void;
}

const CONDITIONAL_ABILITIES = new Set([
  "Swift Swim",
  "Chlorophyll",
  "Sand Rush",
  "Slush Rush",
  "Surge Surfer",
  "Unburden",
  "Quick Feet",
  "Slow Start",
  "Protosynthesis",
  "Quark Drive",
]);

export function PokemonPanel({ config, species, field, color, onChange, onRemove }: Props) {
  const set = (patch: Partial<MonConfig>) => onChange({ ...config, ...patch });

  const setup = toSetup(config, species);
  const raw = calcRawSpeed(setup);
  const effective = calcEffectiveSpeed(setup, field);
  const mods = activeModifiers(setup, field);

  const selectSpecies = (s: Species) =>
    set({
      speciesId: s.id,
      ability: s.abilities[0] ?? "",
      speedIsHighestStat: speedIsHighestBaseStat(s),
      unburdenActive: false,
    });

  return (
    <section className="panel" style={{ borderTopColor: color }}>
      <header className="panel-header">
        <Sprite species={species} size={48} />
        <div className="panel-title">
          <SpeciesSelect selected={species} onSelect={selectSpecies} />
          <div className="type-row">
            {species.types.map((t) => (
              <span key={t} className={`type type-${t.toLowerCase()}`}>
                {t}
              </span>
            ))}
            <span className="base-spe">Base Spe {species.baseStats.spe}</span>
          </div>
        </div>
        {onRemove && (
          <button className="icon-btn" title="Remove" onClick={onRemove}>
            ✕
          </button>
        )}
      </header>

      <div className="controls">
        <label>
          Level
          <input
            type="number"
            min={1}
            max={100}
            value={config.level}
            onChange={(e) => set({ level: clamp(+e.target.value, 1, 100) })}
          />
        </label>
        <label>
          IV
          <input
            type="number"
            min={0}
            max={31}
            value={config.iv}
            onChange={(e) => set({ iv: clamp(+e.target.value, 0, 31) })}
          />
        </label>
        <label>
          EV
          <input
            type="number"
            min={0}
            max={252}
            step={4}
            value={config.ev}
            onChange={(e) => set({ ev: clamp(+e.target.value, 0, 252) })}
          />
        </label>
        <label>
          Nature
          <select
            value={config.nature}
            onChange={(e) => set({ nature: e.target.value as MonConfig["nature"] })}
          >
            <option value="plus">+Spe (Timid/Jolly)</option>
            <option value="neutral">Neutral</option>
            <option value="minus">−Spe (Brave/Quiet)</option>
          </select>
        </label>
        <label>
          Boost stage
          <select
            value={config.stage}
            onChange={(e) => set({ stage: +e.target.value })}
          >
            {Array.from({ length: 13 }, (_, i) => i - 6).map((s) => (
              <option key={s} value={s}>
                {s > 0 ? `+${s}` : s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Item
          <select
            value={config.item}
            onChange={(e) => set({ item: e.target.value as MonConfig["item"] })}
          >
            {ITEM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ability
          <select
            value={config.ability}
            onChange={(e) => set({ ability: e.target.value })}
          >
            {species.abilities.map((a) => (
              <option key={a} value={a}>
                {a}
                {CONDITIONAL_ABILITIES.has(a) ? " ★" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={config.status}
            onChange={(e) => set({ status: e.target.value as MonConfig["status"] })}
          >
            <option value="healthy">Healthy</option>
            <option value="paralyzed">Paralyzed</option>
            <option value="other">Other status</option>
          </select>
        </label>
      </div>

      <div className="toggles">
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.tailwind}
            onChange={(e) => set({ tailwind: e.target.checked })}
          />
          Tailwind on this side
        </label>
        {config.ability === "Unburden" && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={config.unburdenActive}
              onChange={(e) => set({ unburdenActive: e.target.checked })}
            />
            Unburden triggered (item lost)
          </label>
        )}
        {(config.ability === "Protosynthesis" || config.ability === "Quark Drive") && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={config.speedIsHighestStat}
              onChange={(e) => set({ speedIsHighestStat: e.target.checked })}
            />
            Speed is the boosted stat
          </label>
        )}
      </div>

      <footer className="panel-result">
        <div className="speed-readout">
          <span className="speed-final" style={{ color }}>
            {effective}
          </span>
          <span className="speed-raw">raw {raw}</span>
        </div>
        {mods.length > 0 && (
          <ul className="mod-list">
            {mods.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </footer>
    </section>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Number.isNaN(n) ? min : Math.max(min, Math.min(max, n));
}
