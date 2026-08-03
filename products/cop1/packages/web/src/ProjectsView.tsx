import { useEffect, useState } from 'react';
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
 * fiche 0062 — portefeuille projets (lecture seule).
 * Hydrate registre + runs, aucun POST.
 */
export function ProjectsView({ onOpenProject }: ProjectsViewProps) {
  const [registry, setRegistry] = useState<RegistryProjectRef[]>([]);
  const [runs, setRuns] = useState<RunForPortfolio[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/supervision/projects')
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
      fetch('/api/supervision/runs')
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
    ]).then(([projectsRaw, runsRaw]) => {
      if (cancelled) return;
      const projects = Array.isArray(projectsRaw)
        ? projectsRaw.filter(isRegistryProject)
        : [];
      const observed = Array.isArray(runsRaw) ? runsRaw.filter(isRunForPortfolio) : [];
      setRegistry(projects);
      setRuns(observed);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = buildProjectPortfolio(registry, runs);

  return (
    <div className="mon">
      <div className="mon__head">
        <div>
          <h2 className="mon__title">Projets supervisés</h2>
          <p className="mon__sub">
            Portefeuille lecture seule — registre 0082 + activité observée. Clique un projet
            pour voir ses runs.
          </p>
        </div>
        {cards.length > 0 && (
          <div className="mon__count">
            <span className="mon__count-n">{cards.length}</span>
            <span className="mon__count-l">{cards.length > 1 ? 'projets' : 'projet'}</span>
          </div>
        )}
      </div>

      {loaded && cards.length === 0 && (
        <div className="mon__empty">
          <div className="mon__empty-dot" aria-hidden="true" />
          <p className="mon__empty-title">Aucun projet</p>
          <p className="mon__empty-hint">
            Déclare un projet dans <code>supervision.registry.yaml</code>, ou lance une
            méthode instrumentée pour qu&apos;un projet apparaisse ici.
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
    <button
      type="button"
      className="project-card"
      onClick={() => onOpen(card.projectRoot)}
    >
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
