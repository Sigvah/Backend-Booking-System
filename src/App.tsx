import { useState } from "react";
import { FieldBar } from "./components/FieldBar";
import { PokemonPanel } from "./components/PokemonPanel";
import { Results } from "./components/Results";
import { MonConfig, makeConfig } from "./config";
import { getSpecies } from "./data";
import { DEFAULT_FIELD, FieldState } from "./engine/speed";

const COLORS = ["#e8544f", "#4f8fe8", "#4fc06a", "#c99b2e", "#a06ae8", "#e86ab8"];
const MAX_MONS = 6;

export default function App() {
  const [field, setField] = useState<FieldState>(DEFAULT_FIELD);
  const [configs, setConfigs] = useState<MonConfig[]>([
    makeConfig("dragapult"),
    makeConfig("garchomp"),
  ]);

  const updateConfig = (uid: number, next: MonConfig) =>
    setConfigs((cs) => cs.map((c) => (c.uid === uid ? next : c)));

  const removeConfig = (uid: number) =>
    setConfigs((cs) => cs.filter((c) => c.uid !== uid));

  const addConfig = () =>
    setConfigs((cs) => (cs.length < MAX_MONS ? [...cs, makeConfig("pikachu")] : cs));

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="accent">Champions</span> Speed Checker
        </h1>
        <p className="subtitle">
          Who moves first? Full Gen 9 speed mechanics: EVs, natures, items,
          abilities, weather, terrain, Tailwind and Trick Room.
        </p>
      </header>

      <FieldBar field={field} onChange={setField} />

      <div className="panels">
        {configs.map((cfg, i) => {
          const species = getSpecies(cfg.speciesId);
          if (!species) return null;
          return (
            <PokemonPanel
              key={cfg.uid}
              config={cfg}
              species={species}
              field={field}
              color={COLORS[i % COLORS.length]}
              onChange={(next) => updateConfig(cfg.uid, next)}
              onRemove={configs.length > 2 ? () => removeConfig(cfg.uid) : undefined}
            />
          );
        })}
        {configs.length < MAX_MONS && (
          <button className="add-panel" onClick={addConfig}>
            + Add Pokemon
          </button>
        )}
      </div>

      <Results configs={configs} field={field} colors={COLORS} />

      <footer className="app-footer">
        Data from the Pokemon Showdown pokedex · speed formulas follow the
        mainline games' 4096-based modifier math
      </footer>
    </div>
  );
}
