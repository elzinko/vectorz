/**
 * Board unifié cop1 — chronologie condensée (fiche 20261012231419237).
 *
 * Tout l'historique d'un projet, UNE ligne par évènement : temps compact à gauche,
 * type, titre, pastilles (version, coût), flèche. On filtre par type et par lot, on
 * charge par lots (« afficher plus »), et cliquer une ligne ouvre son détail.
 *
 * Garde-fou ADR-079 : rien ne suppose « un run = une session » ni un fil unique ;
 * une ligne pourra porter un libellé de session (champ `session`) sans réécriture.
 */
import { useState } from 'react';
import type { BoardProject, EventKind, TimelineEvent } from './types.js';

const BATCH = 9;

const KIND_LABEL: Record<EventKind, string> = {
  sprint: 'sprint',
  lancement: 'lancement',
  tag: 'version',
  retro: 'rétro',
  gate: 'jalon',
};

const KIND_CHIPS: Array<['all' | EventKind, string]> = [
  ['all', 'tout'],
  ['sprint', 'sprint'],
  ['lancement', 'lancement'],
  ['tag', 'version'],
  ['retro', 'rétro'],
  ['gate', 'jalon'],
];

function costLabel(cost: 'lo' | 'mid' | 'hi'): string {
  return cost === 'hi' ? 'lourd' : cost === 'mid' ? 'moyen' : 'léger';
}

/** L'id de run vers lequel ouvrir, si la ligne est cliquable. */
function runTarget(e: TimelineEvent): string | null {
  if (e.ref?.type === 'run') return e.ref.id;
  if (e.ref?.type === 'sprint') return e.ref.id;
  return null;
}

interface TimelineViewProps {
  project: BoardProject;
  onOpenRun: (runId: string) => void;
}

export function TimelineView({ project, onOpenRun }: TimelineViewProps): JSX.Element {
  const [kind, setKind] = useState<'all' | EventKind>('all');
  const [ver, setVer] = useState<string>('all');
  const [shown, setShown] = useState<number>(BATCH);

  const events = project.timeline ?? [];
  // Les options de lot viennent des versions RÉELLEMENT présentes dans les
  // évènements (pas du train de versions) : pas d'option vide, pas d'oubli.
  const eventVers = Array.from(
    new Set(events.map((e) => e.ver).filter((v): v is string => Boolean(v))),
  );
  const versionOptions = ['all', ...eventVers];

  const filtered = events.filter(
    (e) => (kind === 'all' || e.kind === kind) && (ver === 'all' || e.ver === ver),
  );
  const visible = filtered.slice(0, shown);
  const more = filtered.length - visible.length;

  function setFilterKind(k: 'all' | EventKind): void {
    setKind(k);
    setShown(BATCH);
  }
  function setFilterVer(v: string): void {
    setVer(v);
    setShown(BATCH);
  }

  return (
    <>
      <div className="vh">
        <h2>Chronologie — {project.name}</h2>
        <span className="sub">tout l'historique · filtre par type et par lot</span>
      </div>

      <div className="tl-controls">
        {KIND_CHIPS.map(([k, lbl]) => (
          <button
            key={k}
            type="button"
            className={`chip${kind === k ? ' on' : ''}`}
            aria-pressed={kind === k}
            onClick={() => setFilterKind(k)}
          >
            {lbl}
          </button>
        ))}
        <span style={{ marginLeft: 6 }} />
        <label className="muted" style={{ fontSize: 12 }} htmlFor="tlversel">
          Lot
        </label>
        <select id="tlversel" value={ver} onChange={(e) => setFilterVer(e.target.value)}>
          {versionOptions.map((v) => (
            <option value={v} key={v}>
              {v === 'all' ? 'tous' : v}
            </option>
          ))}
        </select>
      </div>

      <section className="card">
        {visible.length === 0 ? (
          <div className="tl-end" style={{ padding: '14px 16px' }}>
            aucun évènement
          </div>
        ) : (
          visible.map((e, i) => {
            const target = runTarget(e);
            const clickable = target !== null;
            return (
              <div
                key={`${e.when}-${e.title}-${i}`}
                className={`tev1${clickable ? ' clk' : ''}`}
                {...(clickable
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      onClick: () => onOpenRun(target),
                      onKeyDown: (ev: React.KeyboardEvent) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault();
                          onOpenRun(target);
                        }
                      },
                    }
                  : {})}
              >
                <span className="tw">{e.when}</span>
                <span className="kindtag">{KIND_LABEL[e.kind]}</span>
                <span className="tt1">{e.title}</span>
                {e.ver && <span className="pill ver">{e.ver}</span>}
                {e.cost && e.tok && (
                  <span className={`costtag ${e.cost}`} title={`${e.tok} tokens`}>
                    {costLabel(e.cost)} · {e.tok}
                  </span>
                )}
                {e.live && <span className="live" aria-hidden="true" />}
                {clickable && <span className="arr">›</span>}
              </div>
            );
          })
        )}
      </section>

      {more > 0 ? (
        <button type="button" className="loadmore" onClick={() => setShown((s) => s + BATCH)}>
          Afficher plus ({more})
        </button>
      ) : (
        filtered.length > 0 && <div className="tl-end">↑ début du projet</div>
      )}
    </>
  );
}
