import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  buildProjectPortfolio,
  projectStatusLabel,
  type ProjectCardModel,
  type RegistryProjectRef,
  type RunForPortfolio,
} from './projectPortfolio.js';

interface ProjectsViewProps {
  onOpenProject: (projectRoot: string) => void;
}

type AnchorMode = 'method-only' | 'supervised';

function isRegistryProject(value: unknown): value is RegistryProjectRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string' &&
    typeof (value as { path?: unknown }).path === 'string' &&
    typeof (value as { method?: unknown }).method === 'string' &&
    typeof (value as { projectRoot?: unknown }).projectRoot === 'string'
  );
}

function isRunForPortfolio(value: unknown): value is RunForPortfolio {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { projectRoot?: unknown }).projectRoot === 'string' &&
    typeof (value as { state?: unknown }).state === 'string'
  );
}

/**
 * fiche 0062 — portefeuille ; fiche 0063 — formulaire d'ancrage (geste humain).
 */
export function ProjectsView({ onOpenProject }: ProjectsViewProps) {
  const [registry, setRegistry] = useState<RegistryProjectRef[]>([]);
  const [runs, setRuns] = useState<RunForPortfolio[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pathInput, setPathInput] = useState('');
  const [projectId, setProjectId] = useState('');
  const [method, setMethod] = useState('mega-city');
  const [mode, setMode] = useState<AnchorMode>('supervised');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

  const reload = useCallback(() => {
    return Promise.all([
      fetch('/api/supervision/projects')
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
      fetch('/api/supervision/runs')
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
    ]).then(([projectsRaw, runsRaw]) => {
      const projects = Array.isArray(projectsRaw)
        ? projectsRaw.filter(isRegistryProject)
        : [];
      const observed = Array.isArray(runsRaw) ? runsRaw.filter(isRunForPortfolio) : [];
      setRegistry(projects);
      setRuns(observed);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    reload().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);
    setFormOk(null);
    setBusy(true);
    try {
      const res = await fetch('/api/supervision/projects/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectRoot: pathInput.trim(),
          mode,
          id: projectId.trim() || undefined,
          method: method.trim() || 'mega-city',
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: boolean;
        daemonRestartRequired?: boolean;
        id?: string;
      };
      if (!res.ok) {
        setFormError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      const restart = data.daemonRestartRequired
        ? ' Redémarre le daemon pour activer la surveillance.'
        : '';
      setFormOk(`Projet « ${data.id ?? 'ok'} » ancré.${restart}`);
      setPathInput('');
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setBusy(false);
    }
  }

  const cards = buildProjectPortfolio(registry, runs);

  return (
    <div className="mon">
      <div className="mon__head">
        <div>
          <h2 className="mon__title">Projets supervisés</h2>
          <p className="mon__sub">
            Portefeuille — registre 0082 + activité observée. Clique un projet pour voir ses
            runs. L&apos;ancrage est un geste humain (fiche 0063).
          </p>
        </div>
        {cards.length > 0 && (
          <div className="mon__count">
            <span className="mon__count-n">{cards.length}</span>
            <span className="mon__count-l">{cards.length > 1 ? 'projets' : 'projet'}</span>
          </div>
        )}
      </div>

      <form className="project-anchor" onSubmit={onSubmit}>
        <h3 className="project-anchor__title">Ajouter un projet</h3>
        <label className="project-anchor__field">
          <span>Chemin absolu du projet</span>
          <input
            type="text"
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            placeholder="/Users/…/mon-projet"
            required
            autoComplete="off"
          />
        </label>
        <div className="project-anchor__row">
          <label className="project-anchor__field">
            <span>Id (optionnel)</span>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="basename du dossier"
              autoComplete="off"
            />
          </label>
          <label className="project-anchor__field">
            <span>Méthode</span>
            <input
              type="text"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>
        <fieldset className="project-anchor__modes">
          <legend>Mode d&apos;install</legend>
          <label>
            <input
              type="radio"
              name="anchor-mode"
              checked={mode === 'supervised'}
              onChange={() => setMode('supervised')}
            />
            Supervisé (link + registre)
          </label>
          <label>
            <input
              type="radio"
              name="anchor-mode"
              checked={mode === 'method-only'}
              onChange={() => setMode('method-only')}
            />
            Méthode seule (bind, sans watch)
          </label>
        </fieldset>
        <button type="submit" className="project-anchor__submit" disabled={busy || !pathInput.trim()}>
          {busy ? 'Ancrage…' : 'Ajouter le projet'}
        </button>
        {formError && <p className="project-anchor__err">{formError}</p>}
        {formOk && <p className="project-anchor__ok">{formOk}</p>}
      </form>

      {loaded && cards.length === 0 && (
        <div className="mon__empty">
          <div className="mon__empty-dot" aria-hidden="true" />
          <p className="mon__empty-title">Aucun projet</p>
          <p className="mon__empty-hint">
            Ajoute un projet ci-dessus, ou déclare-le dans <code>supervision.registry.yaml</code>.
          </p>
        </div>
      )}

      <div className="project-list">
        {cards.map((card) => (
          <ProjectRow key={card.projectRoot} card={card} onOpen={onOpenProject} />
        ))}
      </div>
    </div>
  );
}

function ProjectRow({
  card,
  onOpen,
}: {
  card: ProjectCardModel;
  onOpen: (projectRoot: string) => void;
}) {
  const methodLine = card.methodName
    ? `${card.methodName}${card.methodVersion ? ` · ${card.methodVersion}` : ''}`
    : 'méthode inconnue';

  return (
    <button type="button" className="project-card" onClick={() => onOpen(card.projectRoot)}>
      <div className="project-card__main">
        <span className="project-card__name">{card.name}</span>
        <span className={`project-card__status project-card__status--${card.status}`}>
          {projectStatusLabel(card.status)}
        </span>
      </div>
      <div className="project-card__meta">
        <span>{methodLine}</span>
        <span className="project-card__loc" title={card.projectRoot}>
          {card.location}
        </span>
      </div>
      <div className="project-card__foot">
        {card.runCount} {card.runCount > 1 ? 'runs' : 'run'}
        {card.source === 'registry' ? ' · déclaré, pas encore de run' : ''}
      </div>
    </button>
  );
}
