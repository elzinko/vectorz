/**
 * Board unifié cop1 — accueil « Tous les projets » (fiche 20261015082118382, cas 8
 * piste 1, décision PO du 2026-10-14 ; ADR-079 §D11).
 *
 * La déroulante de projet ne montre jamais toute la flotte d'un coup. Cet accueil la
 * montre : chaque projet, son compte de sessions et l'état de chacune (pastilles). Un
 * clic entre dans le board du projet (inchangé) ; la déroulante reste un raccourci.
 * Un orphelin (session présumée morte) se voit dès ce niveau.
 *
 * Servi LIVE : rien n'est écrit sur disque (ADR-0043/0055).
 */
import type { BoardData, BoardProject, SessionState } from './types.js';

interface FleetViewProps {
  projects: BoardData;
  onOpenProject: (name: string) => void;
}

/** Les états des sessions à MONTRER en pastille : les actives et celles à récupérer (pas les finies). */
function sessionStates(p: BoardProject): SessionState[] {
  const states: SessionState[] = [];
  for (const c of p.chantiers ?? []) {
    for (const s of c.sessions) {
      if (s.state !== 'done') states.push(s.state);
    }
  }
  return states;
}

/** « 3 en cours », « 1 · 1 à récupérer », « aucune session ». */
function countLabel(states: SessionState[]): JSX.Element {
  const active = states.filter((s) => s === 'live' || s === 'gate').length;
  const dead = states.filter((s) => s === 'dead').length;
  if (active === 0 && dead === 0) return <span className="muted">aucune session</span>;
  return (
    <>
      <b>{active}</b> en cours{dead > 0 && ` · ${dead} à récupérer`}
    </>
  );
}

export function FleetView({ projects, onOpenProject }: FleetViewProps): JSX.Element {
  const list = Object.values(projects);
  const totalSessions = list.reduce((n, p) => n + sessionStates(p).length, 0);

  return (
    <>
      <div className="vh">
        <h2>Tous les projets</h2>
        <span className="sub">
          {list.length} projets · {totalSessions} sessions
        </span>
      </div>

      <section className="grow">
        {list.map((p) => {
          const states = sessionStates(p);
          return (
            <div
              key={p.name}
              className="projrow"
              role="button"
              tabIndex={0}
              onClick={() => onOpenProject(p.name)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  onOpenProject(p.name);
                }
              }}
            >
              <div className="pname">
                {p.live && <span className="live" aria-hidden="true" />}
                {p.name}
              </div>
              <div className="minidots" aria-hidden="true">
                {states.map((s, i) => (
                  <span className={`md ${s}`} key={i} />
                ))}
              </div>
              <div className="pcount">{countLabel(states)}</div>
              <span className="age">›</span>
            </div>
          );
        })}
      </section>
    </>
  );
}
