/**
 * Board unifié cop1 — vue Pilotage (fiche 20261102123552182).
 *
 * L'avancement par milestone et l'historique des sessions closes, tels que la méthode les publie dans
 * `ezk board show --json`. La vue ne compte rien elle-même : sans ces données, elle dit pourquoi,
 * jamais une liste vide présentée comme réelle.
 */
import type { BoardProject } from './types.js';

/** La raison pour laquelle le pilotage n'est pas affichable ; `null` s'il l'est. */
function unavailableReason(project: BoardProject): string | null {
  const plan = project.plan;
  if (plan?.state === 'loading') return 'plan en cours de chargement';
  if (plan?.state === 'unavailable') return plan.reason;
  if (!project.pilotage) return "la méthode installée ne publie pas l'historique des sessions (mettre ezk à jour)";
  return null;
}

const pct = (part: number, total: number): string => (total > 0 ? `${Math.round((part / total) * 100)}%` : '0%');

export interface PilotageViewProps {
  project: BoardProject;
  /** Ouvre la fenêtre d'une fiche, comme la vue Fiches. */
  onOpenFiche: (id: string) => void;
}

/**
 * Les fiches d'une session, par leur titre cliquable (fiche 20261103203943915) : la règle de lisibilité
 * interdit l'id nu. Une fiche que mission control ne connaît pas garde son id, sans titre inventé.
 */
function SessionFiches({ ids, project, onOpenFiche }: { ids: string[] } & PilotageViewProps): JSX.Element {
  return (
    <>
      {ids.length} fiche(s) :{' '}
      {ids.map((id, i) => {
        const title = project.fiches?.[id]?.title;
        return (
          <span key={id}>
            {i > 0 && ' · '}
            {title ? (
              <button type="button" className="doclink linkbtn" onClick={() => onOpenFiche(id)}>
                {title}
              </button>
            ) : (
              `${id} (titre indisponible)`
            )}
          </span>
        );
      })}
    </>
  );
}

export function PilotageView({ project, onOpenFiche }: PilotageViewProps): JSX.Element {
  const reason = unavailableReason(project);
  return (
    <>
      <div className="vh">
        <h2>Pilotage</h2>
        <span className="sub">l'avancement par milestone et les sessions closes, publiés par la méthode</span>
      </div>
      {reason !== null || !project.pilotage ? (
        <section className="card">
          <div className="row">
            <span className="ttl" role="status">
              pilotage indisponible : {reason}
            </span>
          </div>
        </section>
      ) : (
        <>
          <section className="card">
            <h3>Milestones — avancement cumulé</h3>
            {project.pilotage.milestones.map((m) => (
              <div key={m.name} className="msrow">
                <span className="ptn">
                  <span className="nm">{m.name}</span> <span className="pill">{m.status}</span>
                </span>
                <span className="minibar" aria-hidden="true">
                  <i className="fill-dev" style={{ width: pct(m.shipped, m.total) }} />
                </span>
                <span className="ptc" aria-label={`${m.name} : ${m.shipped} livrées sur ${m.total}`}>
                  {m.shipped}/{m.total} livrées
                </span>
              </div>
            ))}
          </section>
          <section className="card">
            <h3>Sessions closes — {project.pilotage.sessions.length}</h3>
            {project.pilotage.sessions.map((s) => (
              <div key={s.file} className="row sessrow">
                <span className="meta">{s.date}</span>
                <span>
                  <span className="ttl">{s.title}</span>
                  <span className="meta">
                    {s.fiches.length > 0 ? (
                      <SessionFiches ids={s.fiches} project={project} onOpenFiche={onOpenFiche} />
                    ) : (
                      'aucune fiche notée'
                    )}
                  </span>
                </span>
                <span className="meta">{s.prs.length > 0 ? s.prs.map((n) => `#${n}`).join(' ') : '—'}</span>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}
