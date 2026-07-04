import { useEffect, useState } from "react";
import { CalculatorPage } from "./components/CalculatorPage";
import { GuidePage } from "./components/GuidePage";
import { ScoutPage } from "./components/ScoutPage";
import { SettingsModal } from "./components/SettingsModal";
import { TeamsPage } from "./components/TeamsPage";
import { LlmSettings, loadSettings, saveSettings } from "./lib/claude";
import { Team, loadTeams, saveTeams } from "./lib/teams";

type Tab = "scout" | "teams" | "calculator" | "guide";

export default function App() {
  const [tab, setTab] = useState<Tab>("scout");
  const [teams, setTeams] = useState<Team[]>(() => loadTeams());
  const [settings, setSettings] = useState<LlmSettings>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => saveTeams(teams), [teams]);

  const updateSettings = (next: LlmSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <h1>
            <span className="accent">Champions</span> Battle Prep
          </h1>
          <button className="icon-btn settings-btn" title="Claude settings" onClick={() => setShowSettings(true)}>
            ⚙
          </button>
        </div>
        <nav className="tabs">
          <button className={tab === "scout" ? "active" : ""} onClick={() => setTab("scout")}>
            Scout
          </button>
          <button className={tab === "teams" ? "active" : ""} onClick={() => setTab("teams")}>
            Teams
          </button>
          <button
            className={tab === "calculator" ? "active" : ""}
            onClick={() => setTab("calculator")}
          >
            Speed Calculator
          </button>
          <button className={tab === "guide" ? "active" : ""} onClick={() => setTab("guide")}>
            Beginner Guide
          </button>
        </nav>
      </header>

      {tab === "scout" && (
        <ScoutPage teams={teams} settings={settings} onOpenSettings={() => setShowSettings(true)} />
      )}
      {tab === "teams" && <TeamsPage teams={teams} onChange={setTeams} />}
      {tab === "calculator" && <CalculatorPage />}
      {tab === "guide" && <GuidePage />}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      <footer className="app-footer">
        Teams stay in your browser · Pokedex data from Pokemon Showdown · speed
        math follows the games' 4096-based modifier rules
      </footer>
    </div>
  );
}
