/**
 * Vue d'ensemble d'un projet (fiche 20261126170000102) : la carte du projet — la même que sur
 * « Projets » —, puis « Objectifs en cours ». L'Entonnoir et la table « Versions dans le process »
 * n'existent plus : la page ne montre que ce que la méthode publie.
 */
import type { BoardProject } from './types.js';
import { InfoButton, PageHead } from './Chrome.js';
import { ProjectCard } from './ProjectCard.js';

interface OverviewViewProps {
  project: BoardProject;
  /** Ouvre la page Objectifs. */
  onOpenObjectifs: () => void;
}

const NO_NAME = 'nom non publié';

function ObjectifsEnCours({ project, onOpenObjectifs }: OverviewViewProps): JSX.Element {
  const all = project.objectifs;
  const running = (all ?? []).filter((o) => o.status === 'in-progress');
  return (
    <section className="card" aria-label="Objectifs en cours">
      <h3>
        Objectifs en cours
        {all && (
          <button type="button" className="linkbtn" onClick={onOpenObjectifs}>
            {`Tous les objectifs (${all.length}) →`}
          </button>
        )}
        <InfoButton text="Les objectifs que la méthode publie, avec leurs fiches livrées sur le total." />
      </h3>
      <div className="pbody">
        {all === undefined ? (
          <p className="mnote">non publié : la méthode ne publie pas encore les objectifs de ce projet</p>
        ) : running.length === 0 ? (
          <p className="mnote">aucun objectif en cours</p>
        ) : (
          <div className="grid3">
            {running.map((o) => (
              <div className="t3" key={o.slug}>
                <span className="tag obj" title={o.nom ?? NO_NAME}>
                  {o.slug}
                </span>
                <span className="mt">
                  <span>
                    <span className="minibar">
                      <i className="fill-dev" style={{ width: `${(o.shipped / (o.total || 1)) * 100}%` }} />
                    </span>{' '}
                    <span>
                      {o.shipped}/{o.total}
                    </span>
                  </span>
                  <span className="tag wip">en cours</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function OverviewView(props: OverviewViewProps): JSX.Element {
  const { project } = props;
  return (
    <>
      <PageHead title={`Vue d'ensemble — ${project.name}`} info={project.desc} />
      <ProjectCard project={project} />
      <ObjectifsEnCours {...props} />
    </>
  );
}
