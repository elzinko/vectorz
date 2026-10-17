/**
 * Board unifié cop1 — chronologie.
 *
 * Deux modes, un seul écran :
 * - **3 niveaux** (fiche 20261015082118382, ADR-079 §D11) quand le projet porte des
 *   `chantiers` : les chantiers (vue globale) → un chantier (ses sessions + son fil
 *   fusionné, chaque évènement étiqueté par sa session) → une session (son fil propre).
 *   Le menu de gauche sert de liste ET de filtre ; on descend sans changer d'écran.
 * - **fil unique** (chronologie condensée, fiche 20261012231419237) quand il n'y a pas
 *   de chantiers : un projet mono-session garde le fil plat, filtré par type et lot.
 *
 * Garde-fou ADR-079 : le fil plat accueille déjà un libellé de session (`session`)
 * sans réécriture ; les chantiers l'étendent au lieu de le remplacer.
 */
import { useState } from 'react';
import type { BoardChantier, BoardProject, EventKind, SessionState, TimelineEvent } from './types.js';

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
  if (project.chantiers && project.chantiers.length > 0) {
    return <ChantierTimeline project={project} chantiers={project.chantiers} />;
  }
  return <FlatTimeline project={project} onOpenRun={onOpenRun} />;
}

/* ------------------------------------------------------------------ */
/* Chronologie à 3 niveaux (multi-sessions)                            */
/* ------------------------------------------------------------------ */

/** Le nombre de sessions « en cours » (vivantes ou au jalon) d'un chantier. */
function activeSessionCount(c: BoardChantier): number {
  return c.sessions.filter((s) => s.state === 'live' || s.state === 'gate').length;
}

function sessionDot(state: SessionState): JSX.Element {
  return <span className={`sdot ${state}`} aria-hidden="true" />;
}

function ChantierTimeline({
  project,
  chantiers,
}: {
  project: BoardProject;
  chantiers: BoardChantier[];
}): JSX.Element {
  // null = niveau 1 (les chantiers) ; une clé = niveau 2 ou 3.
  const [openKey, setOpenKey] = useState<string | null>(null);
  // null = « Tout le run » (fil fusionné, niveau 2) ; un id = une session (niveau 3).
  const [sessionId, setSessionId] = useState<string | null>(null);

  const chantier = openKey === null ? null : (chantiers.find((c) => c.key === openKey) ?? null);

  function openChantier(key: string): void {
    setOpenKey(key);
    setSessionId(null);
  }
  function backToChantiers(): void {
    setOpenKey(null);
    setSessionId(null);
  }

  return (
    <>
      <div className="vh">
        <h2>Chronologie — {project.name}</h2>
        <span className="sub">3 niveaux · du global à la session</span>
      </div>

      {chantier === null ? (
        <>
          <div className="crumb">Chronologie</div>
          <section className="grow">
            {chantiers.map((c) => (
              <div
                key={c.key}
                className="grrow"
                role="button"
                tabIndex={0}
                onClick={() => openChantier(c.key)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    openChantier(c.key);
                  }
                }}
              >
                {sessionDot(c.state)}
                <span className="grn">{c.name}</span>
                {c.ver && <span className="verp">{c.ver}</span>}
                <span className="muted" style={{ fontSize: 12 }}>
                  {sessionsSummaryLabel(c)}
                </span>
                <span className="age">{c.age} ›</span>
              </div>
            ))}
          </section>
        </>
      ) : (
        <ChantierDetail
          chantier={chantier}
          sessionId={sessionId}
          onBack={backToChantiers}
          onSelectSession={setSessionId}
        />
      )}
    </>
  );
}

/** « 3 sessions · 2 sprints », « clôturé · … » selon l'état. */
function sessionsSummaryLabel(c: BoardChantier): string {
  if (c.state === 'done') return `clôturé · ${c.sessions.length} session(s)`;
  const active = activeSessionCount(c);
  return `${active} session${active > 1 ? 's' : ''}`;
}

function ChantierDetail({
  chantier,
  sessionId,
  onBack,
  onSelectSession,
}: {
  chantier: BoardChantier;
  sessionId: string | null;
  onBack: () => void;
  onSelectSession: (id: string | null) => void;
}): JSX.Element {
  const session = sessionId === null ? null : chantier.sessions.find((s) => s.id === sessionId) ?? null;
  // Niveau 2 = fil fusionné (étiqueté) ; niveau 3 = fil propre de la session (sans étiquette).
  const events = session === null ? chantier.merged : session.events;

  return (
    <>
      <div className="crumb">
        <button type="button" className="crumblink" onClick={onBack}>
          Chronologie
        </button>
        <span className="sep">›</span>
        {session === null ? (
          <b>{chantier.name}</b>
        ) : (
          <>
            <button type="button" className="crumblink" onClick={() => onSelectSession(null)}>
              {chantier.name}
            </button>
            <span className="sep">›</span>
            <b>{session.label}</b>
          </>
        )}
      </div>

      <div className="md2">
        <div className="slist">
          <div
            className={`sitem${session === null ? ' sel' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelectSession(null)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                onSelectSession(null);
              }
            }}
          >
            {sessionDot(chantier.state)}
            <span className="nm">◦ Tout le run · {chantier.sessions.length} sessions</span>
          </div>
          {chantier.sessions.map((s) => (
            <div
              key={s.id}
              className={`sitem${s.pilot ? '' : ' ind'}${session?.id === s.id ? ' sel' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelectSession(s.id)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  onSelectSession(s.id);
                }
              }}
            >
              {sessionDot(s.state)}
              <span className="nm">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="tl">
          {events.length === 0 ? (
            <div className="trow">aucun évènement</div>
          ) : (
            events.map((e, i) => (
              <div className="trow" key={`${e.when}-${e.title}-${i}`}>
                <span className="tw">{e.when}</span>
                <span className="ktag">{KIND_LABEL[e.kind]}</span>
                <span className="tt">{e.title}</span>
                {e.session && <span className="sbadge">{e.session}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Fil unique (projet mono-session) — comportement d'origine           */
/* ------------------------------------------------------------------ */

function FlatTimeline({ project, onOpenRun }: TimelineViewProps): JSX.Element {
  const [kind, setKind] = useState<'all' | EventKind>('all');
  const [ver, setVer] = useState<string>('all');
  const [shown, setShown] = useState<number>(BATCH);

  const events = project.timeline ?? [];
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
