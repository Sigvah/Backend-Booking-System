import { useState } from "react";
import { MonConfig, makeConfig } from "../config";
import { getSpecies } from "../data";
import { DEFAULT_FIELD, FieldState } from "../engine/speed";
import { FieldBar } from "./FieldBar";
import { PokemonPanel } from "./PokemonPanel";
import { Results } from "./Results";

const COLORS = ["#e8544f", "#4f8fe8", "#4fc06a", "#c99b2e", "#a06ae8", "#e86ab8"];
const MAX_MONS = 6;

export function CalculatorPage() {
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
    <>
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
    </>
  );
}
