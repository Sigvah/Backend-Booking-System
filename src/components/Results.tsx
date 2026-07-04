import { MonConfig, toSetup } from "../config";
import { Species, getSpecies } from "../data";
import { FieldState, orderByAction } from "../engine/speed";
import { Sprite } from "./SpeciesSelect";

interface Props {
  configs: MonConfig[];
  field: FieldState;
  colors: string[];
}

export function Results({ configs, field, colors }: Props) {
  const entries = configs.flatMap((cfg, i) => {
    const species = getSpecies(cfg.speciesId);
    return species
      ? [{ entry: { cfg, species, color: colors[i % colors.length] }, setup: toSetup(cfg, species) }]
      : [];
  });

  const ordered = orderByAction(entries, field);
  const maxSpeed = Math.max(...ordered.map((o) => o.speed), 1);

  return (
    <section className="results">
      <h2>
        Action order
        {field.trickRoom && <span className="tr-note"> — Trick Room: slowest moves first</span>}
      </h2>
      <ol className="result-list">
        {ordered.map((o, i) => {
          const { species, color } = o.entry as {
            cfg: MonConfig;
            species: Species;
            color: string;
          };
          const prev = ordered[i - 1];
          const tiedWithPrev = prev && !prev.movesLast && !o.movesLast && prev.speed === o.speed;
          return (
            <li key={(o.entry as { cfg: MonConfig }).cfg.uid} className="result-row">
              <span className="rank">{tiedWithPrev ? "=" : i + 1}</span>
              <Sprite species={species} size={40} />
              <div className="result-info">
                <div className="result-name-row">
                  <span className="result-name">{species.name}</span>
                  {o.movesLast && <span className="tag">moves last (Lagging Tail)</span>}
                  {tiedWithPrev && <span className="tag tie">speed tie — order is random</span>}
                </div>
                <div className="bar-track">
                  <div
                    className="bar"
                    style={{ width: `${(o.speed / maxSpeed) * 100}%`, background: color }}
                  />
                </div>
              </div>
              <span className="result-speed">{o.speed}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
