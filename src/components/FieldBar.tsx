import { FieldState, Terrain, Weather } from "../engine/speed";

interface Props {
  field: FieldState;
  onChange: (field: FieldState) => void;
}

const WEATHER: { value: Weather; label: string }[] = [
  { value: "none", label: "Clear" },
  { value: "sun", label: "☀ Sun" },
  { value: "rain", label: "🌧 Rain" },
  { value: "sand", label: "🌪 Sandstorm" },
  { value: "snow", label: "❄ Snow" },
];

const TERRAIN: { value: Terrain; label: string }[] = [
  { value: "none", label: "No terrain" },
  { value: "electric", label: "⚡ Electric" },
  { value: "grassy", label: "🌿 Grassy" },
  { value: "misty", label: "🌫 Misty" },
  { value: "psychic", label: "🔮 Psychic" },
];

export function FieldBar({ field, onChange }: Props) {
  return (
    <div className="field-bar">
      <div className="field-group">
        <span className="field-label">Weather</span>
        <div className="segmented">
          {WEATHER.map((w) => (
            <button
              key={w.value}
              className={field.weather === w.value ? "active" : ""}
              onClick={() => onChange({ ...field, weather: w.value })}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field-group">
        <span className="field-label">Terrain</span>
        <div className="segmented">
          {TERRAIN.map((t) => (
            <button
              key={t.value}
              className={field.terrain === t.value ? "active" : ""}
              onClick={() => onChange({ ...field, terrain: t.value })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field-group">
        <span className="field-label">Trick Room</span>
        <div className="segmented">
          <button
            className={field.trickRoom ? "active trick-room" : ""}
            onClick={() => onChange({ ...field, trickRoom: !field.trickRoom })}
          >
            {field.trickRoom ? "Active (slow first)" : "Off"}
          </button>
        </div>
      </div>
    </div>
  );
}
