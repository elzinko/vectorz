import { useState } from 'react';
import { AuthPanel } from './AuthPanel.js';
import { OrchestratorRunView } from './OrchestratorRunView.js';
import { RuleProposalsView } from './RuleProposalsView.js';
import { SupervisionView } from './SupervisionView.js';

// fiche 0022 — the Projects/Agents/Tasks tabs fetched /api/{projects,agents,tasks},
// endpoints the daemon never served (404). Removed: no dead promise in the UI.
// The live surfaces are Run (mission-control), Rules and Connexion, each of which
// owns its own data fetching/state.
// fiche 0031 (ADR-028) — "moniteur" : lecteur read-only de .supervision/runs/.
type Tab = 'run' | 'rules' | 'connexion' | 'moniteur';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('run');

  return (
    <div className="app">
      <header className="header">
        <h1>👮‍♂️ cop1</h1>
        <p>AI Agents Team - Autonomous Task Execution</p>
      </header>

      <div className="container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'run' ? 'active' : ''}`}
            onClick={() => setActiveTab('run')}
          >
            Run
          </button>
          <button
            className={`tab ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            Rules
          </button>
          <button
            className={`tab ${activeTab === 'connexion' ? 'active' : ''}`}
            onClick={() => setActiveTab('connexion')}
          >
            Connexion
          </button>
          <button
            className={`tab ${activeTab === 'moniteur' ? 'active' : ''}`}
            onClick={() => setActiveTab('moniteur')}
          >
            Moniteur
          </button>
        </div>

        {activeTab === 'run' && <OrchestratorRunView />}
        {activeTab === 'rules' && <RuleProposalsView />}
        {activeTab === 'connexion' && <AuthPanel />}
        {activeTab === 'moniteur' && <SupervisionView />}
      </div>
    </div>
  );
}

export default App;
