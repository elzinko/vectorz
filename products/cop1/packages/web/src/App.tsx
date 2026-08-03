import { useState } from 'react';
import { ProjectsView } from './ProjectsView.js';
import { SupervisionView } from './SupervisionView.js';

type TabId = 'projets' | 'activite';

/**
 * Moniteur (ADR-028 / fiche 0059) + portefeuille projets (fiche 0062).
 * Lecture seule — pas de contrôles pilote époque-1.
 */
function App() {
  const [tab, setTab] = useState<TabId>('projets');
  const [filterProjectRoot, setFilterProjectRoot] = useState<string | null>(null);

  function openProject(projectRoot: string): void {
    setFilterProjectRoot(projectRoot);
    setTab('activite');
  }

  function showAllActivity(): void {
    setFilterProjectRoot(null);
    setTab('activite');
  }

  return (
    <div className="app">
      <header className="header">
        <h1>👮‍♂️ cop1 · Moniteur</h1>
        <p>Supervision des méthodes autonomes — lecture seule, en direct</p>
      </header>

      <div className="container">
        <nav className="tabs" aria-label="Vues du Moniteur">
          <button
            type="button"
            className={`tab${tab === 'projets' ? ' active' : ''}`}
            aria-current={tab === 'projets' ? 'page' : undefined}
            onClick={() => setTab('projets')}
          >
            Projets
          </button>
          <button
            type="button"
            className={`tab${tab === 'activite' ? ' active' : ''}`}
            aria-current={tab === 'activite' ? 'page' : undefined}
            onClick={showAllActivity}
          >
            Activité
          </button>
        </nav>

        {tab === 'projets' ? (
          <ProjectsView onOpenProject={openProject} />
        ) : (
          <SupervisionView
            filterProjectRoot={filterProjectRoot}
            onClearFilter={() => setFilterProjectRoot(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
