/**
 * Board unifié cop1 — config de l'outil (fiche 20261013132218656).
 *
 * Page GLOBALE (bouton ⚙) : le mapping tier → modèle concret + effort, par IDE,
 * éditable, plus les défauts de l'outil. C'est la portée POSTE ; elle ne voyage
 * pas avec les repos. L'édition met à jour la config de l'outil partagée ; dans le
 * vrai board, elle passe par une route d'écriture gardée (ADR-0057 amendé) — ici
 * l'écriture est en mémoire, et les sélecteurs n'offrent que des valeurs valides.
 */
import { EFFORTS, TIERS, type Effort, type Tier, type ToolConfig } from './configModel.js';

interface ToolConfigViewProps {
  tool: ToolConfig;
  onChange: (next: ToolConfig) => void;
}

export function ToolConfigView({ tool, onChange }: ToolConfigViewProps): JSX.Element {
  const mapping = tool.map[tool.ide];
  const ides = Object.keys(tool.map);

  if (!mapping) {
    return (
      <>
        <div className="vh">
          <h2>Configuration de l'outil</h2>
          <span className="sub">IDE sans mapping</span>
        </div>
        <section className="card">
          <div className="row">
            <span className="ttl">L'IDE « {tool.ide} » n'a pas de mapping dans cette config.</span>
          </div>
        </section>
      </>
    );
  }

  function setIde(ide: string): void {
    onChange({ ...tool, ide });
  }
  function setDefaultTier(defaultTier: Tier): void {
    onChange({ ...tool, defaultTier });
  }
  function setModel(tier: Tier, model: string): void {
    onChange({
      ...tool,
      map: { ...tool.map, [tool.ide]: { ...mapping, models: { ...mapping.models, [tier]: model } } },
    });
  }
  function setEffort(tier: Tier, effort: Effort): void {
    onChange({
      ...tool,
      map: { ...tool.map, [tool.ide]: { ...mapping, effort: { ...mapping.effort, [tier]: effort } } },
    });
  }

  return (
    <>
      <div className="vh">
        <h2>Configuration de l'outil</h2>
        <span className="sub">global · partagé par tous tes projets · ne voyage pas avec les repos</span>
      </div>

      <div className="banner">
        Le mapping « tier → modèle concret » vit <b>ici</b>, pas dans les projets : sinon un projet casse
        quand on l'ouvre dans un autre IDE.
      </div>

      <section className="card">
        <h3>Outil actif</h3>
        <div className="cfgrow">
          <span className="cfgk">IDE</span>
          <span className="seg" role="group" aria-label="IDE actif">
            {ides.map((k) => (
              <button key={k} type="button" className={tool.ide === k ? 'on' : undefined} aria-pressed={tool.ide === k} onClick={() => setIde(k)}>
                {k}
              </button>
            ))}
          </span>
        </div>
      </section>

      <section className="card">
        <h3>Tier par défaut</h3>
        <div className="cfgrow">
          <span className="cfgk">Rôle sans tier choisi</span>
          <span className="seg" role="group" aria-label="Tier par défaut">
            {TIERS.map((t) => (
              <button key={t} type="button" className={tool.defaultTier === t ? 'on' : undefined} aria-pressed={tool.defaultTier === t} onClick={() => setDefaultTier(t)}>
                {t}
              </button>
            ))}
          </span>
        </div>
      </section>

      <section className="card">
        <h3>
          Mapping — tier → modèle concret{' '}
          <span className="sub" style={{ textTransform: 'none', letterSpacing: 0 }}>
            pour {tool.ide} · éditable
          </span>
        </h3>
        {TIERS.map((t) => (
          <div className="cfgrow" key={t}>
            <span className="cfgk">
              <span className="rtier">{t}</span>
            </span>
            <select aria-label={`Modèle du tier ${t}`} value={mapping.models[t]} onChange={(e) => setModel(t, e.target.value)}>
              {mapping.catalog.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span className="reff">effort</span>
            <select aria-label={`Effort du tier ${t}`} value={mapping.effort[t]} onChange={(e) => setEffort(t, e.target.value as Effort)}>
              {EFFORTS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div className="faint" style={{ fontSize: 12, padding: '6px 16px 14px' }}>
          Catalogue {tool.ide} : {mapping.catalog.join(' · ')}
        </div>
      </section>

      <div className="banner">
        Un projet peut <b>surcharger</b> ce mapping (soupape rare, en réserve).
      </div>
    </>
  );
}
