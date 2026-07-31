import { SupervisionView } from './SupervisionView.js';

/**
 * Moniteur only (ADR-028 / fiche 0059) — cop1 OBSERVE une méthode qu'il ne pilote pas.
 *
 * Surfaces époque-1 « méthode dans le moniteur » retirées 2026-07-28 (fiche 0059).
 * Backend pilote retiré en E4 (fiche 0039 / ADR-029) — dogfood = mega-city + Moniteur.
 */
function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>👮‍♂️ cop1 · Moniteur</h1>
        <p>Supervision des méthodes autonomes — lecture seule, en direct</p>
      </header>

      <div className="container">
        <SupervisionView />
      </div>
    </div>
  );
}

export default App;
