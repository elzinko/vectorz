import { SupervisionView } from './SupervisionView.js';

/**
 * fiche 0059 — l'app est réduite à sa seule surface vivante : le Moniteur de
 * supervision (cop1 OBSERVE une méthode qu'il ne pilote pas). Les surfaces du
 * monde « cop1 PILOTE » (OrchestratorRunView = Run, RuleProposalsView = Rules,
 * AuthPanel = Connexion) restent dans le repo mais ne sont plus montées :
 * elles mélangeaient deux paradigmes dans un seul écran (constat PO 2026-07-25).
 * Réactivables en réintroduisant leurs onglets ici le jour où cop1 repilote.
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
