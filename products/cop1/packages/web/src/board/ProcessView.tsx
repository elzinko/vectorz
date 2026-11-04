/**
 * Board unifié cop1 — vue Process (fiche 20261102123552183).
 *
 * Chaque fiche du projet posée sur son étape, de l'idée à la livraison, telle que la méthode la place
 * (`ezk board process --json`). Une fiche en sprint ou en revue dit ce qui l'y place : sa PR, sa
 * branche, sa session. La vue ne place aucune fiche elle-même ; sans données, elle dit pourquoi.
 */
import type { BoardProject, ProcessFiche, ProcessStageId, ProjectProcess } from './types.js';

/**
 * Les étapes internes d'un sprint, telles que la skill `ezk-sprint` les déroule. Libellé fixe, sans
 * compte : la méthode ne publie pas encore l'étape d'une fiche dans son sprint (fiche 20261104090517801).
 */
const SPRINT_STEPS = ['BDD', 'TDD', 'gate', 'revue', 'merge'] as const;

/** L'ancre de la colonne d'une étape, cible du clic sur sa pastille. */
const colId = (stage: ProcessStageId): string => `proc-col-${stage}`;

function jumpTo(stage: ProcessStageId): void {
  const col = document.getElementById(colId(stage));
  col?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  col?.focus({ preventScroll: true });
}

/**
 * Le schéma du workflow, en tête de la vue : une pastille par étape publiée, reliées par des flèches,
 * chacune avec son nombre de fiches (le même que sa colonne). Les parkées restent hors flux.
 */
function WorkflowStrip({ process, parked }: { process: ProjectProcess; parked: number | null }): JSX.Element {
  return (
    <section className="card wflow" aria-label="Workflow de la méthode">
      <div className="wf-head">
        <b>Workflow</b>
        <span className="sub">le chemin d'une fiche, de l'idée à la livraison</span>
      </div>
      <ol className="wf-steps">
        {process.stages.map((g, i) => (
          <li className={`wf-step wf-${g.stage}`} key={g.stage}>
            <div className="wf-cell">
              <button
                type="button"
                className="wf-node"
                aria-label={`Étape ${g.label} : ${g.total} fiches`}
                onClick={() => jumpTo(g.stage)}
              >
                <span className="wf-n">{g.total}</span>
                <span className="wf-l">{g.label}</span>
              </button>
              {g.stage === 'en-sprint' && (
                <span className="wf-sub" aria-label="Étapes d'un sprint">
                  {SPRINT_STEPS.map((step) => (
                    <i key={step}>{step}</i>
                  ))}
                </span>
              )}
            </div>
            {i < process.stages.length - 1 && (
              <span className="wf-arrow" aria-hidden="true">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      {parked !== null && (
        <p className="wf-parked">
          Parkées : <b>{parked}</b> — hors flux, en attente du PO
        </p>
      )}
    </section>
  );
}

/** La raison pour laquelle le process n'est pas affichable ; `null` s'il l'est. */
function unavailableReason(project: BoardProject): string | null {
  const state = project.processState;
  if (state?.state === 'loading') return 'process en cours de lecture';
  if (state?.state === 'unavailable') return state.reason;
  if (!project.process) return "la méthode n'a pas encore publié le process";
  return null;
}

/** Le signal qui place la fiche : sa PR, sa branche, sa session, dans cet ordre. */
function signal(f: ProcessFiche): string | null {
  const parts = [f.pr, f.branch, f.session ? `session ${f.session.split('/').pop()}` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

interface ProcessViewProps {
  project: BoardProject;
  onOpenFiche: (id: string) => void;
}

export function ProcessView({ project, onOpenFiche }: ProcessViewProps): JSX.Element {
  const reason = unavailableReason(project);
  const process = project.process;
  // Le compte des parkées vient du plan publié ; plan inconnu, on ne l'affiche pas (jamais un faux 0).
  const planKnown = !project.plan || project.plan.state === 'ok';
  const parked = planKnown ? project.funnel.parked : null;
  return (
    <>
      <div className="vh">
        <h2>Process</h2>
        <span className="sub">chaque fiche sur son étape, placée par la méthode</span>
      </div>
      {reason !== null || !process ? (
        <section className="card">
          <div className="row">
            <span className="ttl" role="status">
              process indisponible : {reason}
            </span>
          </div>
        </section>
      ) : (
        <>
          {process.reviewUnknown && (
            <p className="pnote" role="note">
              {process.github
                ? "GitHub n'a pas répondu : l'étape « en revue » est inconnue, une fiche en revue reste « en sprint »."
                : "Ce projet a coupé GitHub : l'étape « en revue » est inconnue, une fiche en revue reste « en sprint »."}
            </p>
          )}
          <WorkflowStrip process={process} parked={parked} />
          <section className="kanban process">
            {process.stages.map((g) => (
              <div className="col" key={g.stage} id={colId(g.stage)} tabIndex={-1}>
                <h4>
                  {g.label}{' '}
                  <span className="cnt" aria-label={`${g.label} : ${g.total} fiches`}>
                    {g.fiches.length < g.total ? `${g.fiches.length} / ${g.total}` : g.total}
                  </span>
                </h4>
                {g.fiches.length === 0 ? (
                  <div className="fcard muted">—</div>
                ) : (
                  g.fiches.map((f) => {
                    const why = signal(f);
                    const openable = project.fiches?.[f.id] !== undefined;
                    const open = (): void => {
                      if (openable) onOpenFiche(f.id);
                    };
                    return (
                      <div
                        className={openable ? 'fcard' : 'fcard muted'}
                        role={openable ? 'button' : undefined}
                        tabIndex={openable ? 0 : undefined}
                        key={f.id}
                        onClick={open}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            open();
                          }
                        }}
                      >
                        <div className="ft">{f.title}</div>
                        <div className="fm">
                          <span className={`prio ${f.priority}`}>{f.priority}</span>
                          <span className="pill ver">{f.version || 'sans version'}</span>
                        </div>
                        {why && <div className="why">{why}</div>}
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}
