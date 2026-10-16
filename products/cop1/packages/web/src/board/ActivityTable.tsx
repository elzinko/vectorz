/**
 * Board unifié cop1 — table d'activité par run (fiche 20261012231419211).
 *
 * Une table par lentille (cadrage / développement). Chaque ligne porte un nom de
 * run RÉEL et des pastilles de moments RÉELS — jamais de texte résumé inventé.
 * Cliquer une ligne ouvre le détail du run.
 */
import type { BoardProject, RunKind } from './types.js';
import { runChips, runsForLens } from './activity.js';

interface ActivityTableProps {
  project: BoardProject;
  lens: RunKind;
  onOpenRun: (runId: string) => void;
}

export function ActivityTable({ project, lens, onOpenRun }: ActivityTableProps): JSX.Element {
  const runs = runsForLens(project, lens);
  const title = lens === 'cadrage' ? 'Runs de cadrage récents' : 'Runs de développement';

  return (
    <section className="card">
      <h3>
        {title}{' '}
        <span className="sub" style={{ textTransform: 'none', letterSpacing: 0 }}>
          un run qui a fait {lens === 'cadrage' ? 'du cadrage' : 'des sprints'} · clique pour les étapes
        </span>
      </h3>
      {runs.length === 0 ? (
        <div className="actg">
          <span className="muted">aucun run</span>
        </div>
      ) : (
        runs.map((run) => (
          <div
            key={run.id}
            className="actg clk"
            role="button"
            tabIndex={0}
            onClick={() => onOpenRun(run.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenRun(run.id);
              }
            }}
          >
            <span className="al-run">
              {run.live && <span className="live" aria-hidden="true" />}
              {run.name}
            </span>
            <span className="pill ver">{run.ver}</span>
            <span className="schips">
              {runChips(run, lens).map((chip) => (
                <span className="schip" key={chip.key}>
                  {chip.label}
                </span>
              ))}
            </span>
            <span className="al-when">{run.when ?? ''}</span>
          </div>
        ))
      )}
    </section>
  );
}
