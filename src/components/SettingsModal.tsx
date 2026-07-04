import { useState } from "react";
import { LlmSettings, MODELS } from "../lib/claude";

interface Props {
  settings: LlmSettings;
  onSave: (settings: LlmSettings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onSave, onClose }: Props) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Claude settings</h2>
        <label>
          Anthropic API key
          <input
            type="password"
            placeholder="sk-ant-…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>
        <p className="hint">
          Stored only in this browser's localStorage and sent directly to the
          Anthropic API — no other server involved. Get a key at
          console.anthropic.com. A Haiku game-plan costs well under a cent.
        </p>
        <label>
          Model
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <div className="row modal-actions">
          <button
            className="primary"
            onClick={() => {
              onSave({ apiKey: apiKey.trim(), model });
              onClose();
            }}
          >
            Save
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
