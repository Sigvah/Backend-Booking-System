import { useEffect, useRef, useState } from "react";
import { Species, searchSpecies, spriteFallbackUrl, spriteUrl } from "../data";

interface Props {
  selected: Species;
  onSelect: (species: Species) => void;
}

export function SpeciesSelect({ selected, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = open ? searchSpecies(query) : [];

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const pick = (s: Species) => {
    onSelect(s);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="species-select" ref={rootRef}>
      <input
        type="text"
        placeholder={selected.name}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(results[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        aria-label="Search Pokemon"
      />
      {open && results.length > 0 && (
        <ul className="species-options" role="listbox">
          {results.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === highlight}
              className={i === highlight ? "highlighted" : ""}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
            >
              <Sprite species={s} size={32} />
              <span>{s.name}</span>
              <span className="option-spe">Spe {s.baseStats.spe}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Sprite({ species, size }: { species: Species; size: number }) {
  const [stage, setStage] = useState(0);
  useEffect(() => setStage(0), [species.id]);
  if (stage >= 2) return <div className="sprite-blank" style={{ width: size, height: size }} />;
  return (
    <img
      className="sprite"
      width={size}
      height={size}
      alt={species.name}
      src={stage === 0 ? spriteUrl(species) : spriteFallbackUrl(species)}
      onError={() => setStage((s) => s + 1)}
    />
  );
}
