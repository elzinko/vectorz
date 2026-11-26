/**
 * Board unifié cop1 — vue Process (fiches 20261102123552183 et 20261126170000108).
 *
 * Dans l'ordre de la maquette : « En clair », les fiches par statut, le schéma, les étapes de chaque
 * compétence, qui appelle qui, livrer une version, l'équipe. La vue ne place aucune fiche elle-même
 * (`ezk board process --json`) et n'invente rien : sans données, elle dit pourquoi.
 */
import { InfoButton } from './Chrome.js';
import { ProcessMap } from './ProcessMap.js';
import { ProcessSections } from './ProcessSections.js';
import type { BoardProject, ProcessStageId } from './types.js';

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

/** Les cinq statuts d'une fiche, dans l'ordre du flux, avec ce que chacun veut dire. */
const STATUSES: { stage: ProcessStageId; label: string; kicker: string; hint: string }[] = [
  { stage: 'idee', label: 'idée', kicker: 'backlog', hint: 'à groomer' },
  { stage: 'prete', label: 'prête', kicker: 'backlog', hint: 'tirable' },
  { stage: 'en-sprint', label: 'en sprint', kicker: 'sprint', hint: 'sur une branche' },
  { stage: 'en-revue', label: 'en revue', kicker: 'sprint', hint: 'revue adverse' },
  { stage: 'livree', label: 'livrée', kicker: 'intégrée', hint: 'sur main' },
];

function EnClair(): JSX.Element {
  return (
    <section className="card">
      <h3>
        En clair <InfoButton text="Fiche : une idée groomée jusqu'à être prête. Sprint : la construction d'un lot de fiches. Loi : les règles que lisent les skills et les agents." />
      </h3>
      <div className="bd pc-pad">
        <p className="pc-clair">
          Mega-city est une méthode pour faire avancer un produit avec des agents. Tout part d'une <b>fiche</b> (une idée groomée jusqu'à être prête).
          Un <b>sprint</b> la construit : le skill /ezk-sprint convoque des agents (architecte, QA, dev, relecteur), passe la gate locale, puis une revue
          adverse rend GO ou NO-GO avant l'intégration sur la branche principale. Au-dessus, /ezk-product-build enchaîne les sprints tout seul et ne
          s'arrête que pour les décisions qui te reviennent ; une <b>loi</b> (des règles lues par les skills et les agents) encadre le tout.
        </p>
      </div>
    </section>
  );
}

function StatusTiles({ project }: { project: BoardProject }): JSX.Element {
  const reason = unavailableReason(project);
  const process = project.process;
  // Le compte des parkées vient du plan publié ; plan inconnu, on ne l'affiche pas (jamais un faux 0).
  const planKnown = !project.plan || project.plan.state === 'ok';
  const parked = planKnown ? project.funnel.parked : null;
  return (
    <section className="card">
      <h3>
        Mes fiches par statut <InfoButton text="Chaque fiche sur son étape, placée par la méthode. Source : ezk board process --json." />
      </h3>
      {reason !== null || !process ? (
        <p className="pc-pad" role="status">
          process indisponible : {reason}
        </p>
      ) : (
        <div>
          {process.reviewUnknown && (
            <p className="pnote pc-note" role="note">
              {process.github
                ? "GitHub n'a pas répondu : l'étape « en revue » est inconnue, une fiche en revue reste « en sprint »."
                : "Ce projet a coupé GitHub : l'étape « en revue » est inconnue, une fiche en revue reste « en sprint »."}
            </p>
          )}
          <div className="pc-stats">
            {STATUSES.map(({ stage, label, kicker, hint }) => {
              const total = process.stages.find((s) => s.stage === stage)?.total;
              const unknown = total === undefined || (stage === 'en-revue' && process.reviewUnknown);
              return (
                <div className="pc-stat" role="group" aria-label={label} key={stage}>
                  <span className="faint">{kicker}</span>
                  <b>{label}</b>
                  <span className="pc-count" data-testid="tile-count">
                    {unknown ? '—' : total}
                  </span>
                  <span className="faint">{hint}</span>
                </div>
              );
            })}
          </div>
          {parked !== null && <ParkedNote parked={parked} />}
        </div>
      )}
    </section>
  );
}

interface ProcessViewProps {
  project: BoardProject;
  onOpenConfig: () => void;
}

export function ProcessView({ project, onOpenConfig }: ProcessViewProps): JSX.Element {
  return (
    <>
      <div className="vh">
        <h2>Process</h2>
        <InfoButton text="Chaque fiche sur son étape, placée par la méthode." />
      </div>
      <EnClair />
      <StatusTiles project={project} />
      <ProcessMap project={project} />
      <ProcessSections project={project} onOpenConfig={onOpenConfig} />
    </>
  );
}
