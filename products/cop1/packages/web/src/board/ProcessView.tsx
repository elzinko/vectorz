/**
 * Board unifié cop1 — vue Process (fiche 20261102123552183).
 *
 * Chaque fiche du projet posée sur son étape, de l'idée à la livraison, telle que la méthode la place
 * (`ezk board process --json`). Une fiche en sprint ou en revue dit ce qui l'y place : sa PR, sa
 * branche, sa session. La vue ne place aucune fiche elle-même ; sans données, elle dit pourquoi.
 */
import { ProcessMap } from './ProcessMap.js';
import type { BoardProject, ProcessFiche } from './types.js';
import { InfoButton } from './Chrome.js';

/** Les parkées restent hors flux : une ligne, plan inconnu = pas de faux zéro. */
function ParkedNote({ parked }: { parked: number }): JSX.Element {
  return (
    <p className="wf-parked">
      Parkées : <b>{parked}</b> — hors flux, en attente du PO
    </p>
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
        <InfoButton text="Chaque fiche sur son étape, placée par la méthode." />
      </div>
      <ProcessMap project={project} />
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
          {parked !== null && <ParkedNote parked={parked} />}
          <section className="kanban process">
            {process.stages.map((g) => (
              <div className="col" key={g.stage}>
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
