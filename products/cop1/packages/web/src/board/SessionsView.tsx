/**
 * Board unifié cop1 — pages Sessions et Une session (fiche 20261124111116042).
 *
 * Une session est une séance de travail dans Claude Code, sur une branche. La page montre les
 * sessions en cours, lues dans le journal de supervision, puis les sessions closes, lues dans leurs
 * récits publiés par la méthode. Tant que la méthode ne publie pas la branche d'un récit, les
 * lancements et les sprints se rangent sous une session close par la période, et la page le dit.
 */
import { useState } from 'react';
import { Crumbs, FicheLine, Unavailable, planUnavailable } from './PlanBits.js';
import { sprintTitle } from './SprintsView.js';
import type {
  BoardChantier,
  BoardProject,
  ChantierSession,
  PilotageSession,
  SessionState,
  SprintSummary,
  TimelineEvent,
} from './types.js';
import { InfoButton } from './Chrome.js';

const NOT_PUBLISHED = 'non publié';
const DAY_MS = 86_400_000;
/** Ce que la page dit du rangement, avec le nombre réel de sprints publiés. */
const attachNote = (published: number): string =>
  `Rangés par la période : la méthode ne publie pas encore la branche du récit. Seuls les ${published} derniers sprints sont publiés : une session plus ancienne n’en montre aucun.`;

const STATE_WORDS: Record<SessionState, string> = {
  live: 'en cours',
  gate: 'à un point d’arrêt',
  done: 'terminé',
  dead: 'interrompu',
};

/** Les mots d'un point d'arrêt de la méthode, sans son identifiant brut. */
const GATE_WORDS: Record<string, string> = {
  'inter-sprint': 'point entre deux sprints',
  'retro-iteration': 'rétro d’itération',
  blocage: 'blocage remonté au PO',
  ideation: 'cadrage d’une idée',
  'aucune-fiche-ready': 'aucune fiche prête',
  'derive-tokens': 'dérive des jetons',
};

/** Un moment du journal en phrase claire, sans identifiant technique. */
export function momentPhrase(e: TimelineEvent): string {
  if (e.kind === 'lancement') return 'Lancement';
  if (e.title === 'Reprise après le jalon') return 'Reprise';
  const m = /^Jalon (.+)$/.exec(e.title);
  if (!m) return 'Point d’arrêt';
  const id = m[1] ?? '';
  const sprint = /^sprint-(.+)-checkpoint$/.exec(id);
  if (sprint) return `Fin de sprint : ${(sprint[1] ?? '').replace(/-/g, ' ')}`;
  const words = GATE_WORDS[id];
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Point d’arrêt de la méthode';
}

interface Launch {
  chantier: BoardChantier;
  session: ChantierSession;
}

const dayMs = (day: string): number => Date.parse(`${day}T00:00:00Z`);

/** Vrai si l'instant ISO tombe dans la période ]après, jusqu'à] (jours, fin incluse). */
function inWindow(iso: string | undefined, after: string | null, until: string): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  const start = after ? dayMs(after) + DAY_MS : Number.NEGATIVE_INFINITY;
  return t >= start && t < dayMs(until) + DAY_MS;
}

/** Les lancements et les sprints rangés sous une session close, par sa période. */
export function attach(
  sessions: PilotageSession[],
  index: number,
  chantiers: BoardChantier[],
  sprints: SprintSummary[],
): { launches: Launch[]; sprints: SprintSummary[] } {
  const s = sessions[index];
  if (!s) return { launches: [], sprints: [] };
  const previous = sessions[index + 1]?.date ?? null;
  // Du plus ancien au plus récent, pour que le fil se lise dans l'ordre.
  const launches = chantiers
    .flatMap((chantier) =>
      chantier.sessions
        .filter((session) => inWindow(session.startedAt, previous, s.date))
        .map((session) => ({ chantier, session })),
    )
    .sort((a, b) => Date.parse(a.session.startedAt ?? '') - Date.parse(b.session.startedAt ?? ''));
  const ownSprints = sprints.filter((sp) => inWindow(`${sp.jour}T12:00:00Z`, previous, s.date));
  return { launches, sprints: ownSprints };
}

type Period = 'all' | '7' | '30';

export interface SessionsViewProps {
  project: BoardProject;
  onOpenFiche: (id: string) => void;
  /** Ouvre la page d'un sprint. */
  onOpenSprint: (slug: string) => void;
  /** Ouvre le détail d'un lancement. */
  onViewRun: (runId: string) => void;
  /** La session close à rouvrir d'entrée, au retour du détail d'un lancement. */
  initialOpen?: number | null;
  /** Dit quelle session close est ouverte, pour la retrouver au retour. */
  onOpenChange?: (index: number | null) => void;
  now?: Date;
}

export function SessionsView(props: SessionsViewProps): JSX.Element {
  const { project, now = new Date(), initialOpen = null, onOpenChange } = props;
  const [open, setOpenState] = useState<number | null>(initialOpen);
  const setOpen = (i: number | null): void => {
    setOpenState(i);
    onOpenChange?.(i);
  };
  const [period, setPeriod] = useState<Period>('all');
  const closed = project.pilotage?.sessions;
  const reason =
    planUnavailable(project) ??
    (closed ? null : 'la méthode installée ne publie pas les récits de session (mettre ezk à jour)');
  if (reason !== null || !closed) {
    return (
      <>
        <div className="vh">
          <h2>Sessions</h2>
        </div>
        <Unavailable what="sessions" reason={reason ?? ''} />
      </>
    );
  }
  const chantiers = project.chantiers ?? [];
  const sprints = project.lastSprints ?? [];
  if (open !== null && closed[open]) {
    return (
      <SessionPage
        {...props}
        session={closed[open]}
        attached={attach(closed, open, chantiers, sprints)}
        onBack={() => setOpen(null)}
      />
    );
  }
  const current = chantiers.flatMap((chantier) =>
    chantier.sessions.filter((s) => s.state === 'live' || s.state === 'gate').map((session) => ({ chantier, session })),
  );
  const shown = closed
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => period === 'all' || now.getTime() - dayMs(s.date) <= Number(period) * DAY_MS);
  return (
    <>
      <div className="vh">
        <h2>Sessions</h2>
        <InfoButton text="La session en cours, puis les sessions closes." />
      </div>
      <section className="card">
        <h3>En cours — {current.length}</h3>
        {current.length === 0 ? (
          <div className="row">
            <span className="meta">aucune session en cours dans le journal</span>
          </div>
        ) : (
          current.map(({ chantier, session }) => (
            <div key={`${chantier.key}/${session.id}`} className="row">
              <span className="ttl">{session.label}</span>
              <span className="meta">
                {chantier.name} · {STATE_WORDS[session.state]}
                {session.events[0] ? ` · dernier moment : ${momentPhrase(session.events[0])}, ${session.events[0].when}` : ''}
              </span>
              <button type="button" className="chip" onClick={() => props.onViewRun(chantier.key)}>
                Voir le lancement
              </button>
            </div>
          ))
        )}
      </section>
      <section className="card">
        <h3>Closes — {closed.length}</h3>
        <div className="row filters">
          <span className="seg" role="group" aria-label="Période">
            {(
              [
                ['7', '7 derniers jours'],
                ['30', '30 derniers jours'],
                ['all', 'tout'],
              ] as [Period, string][]
            ).map(([id, label]) => (
              <button key={id} type="button" className={period === id ? 'on' : undefined} aria-pressed={period === id} onClick={() => setPeriod(id)}>
                {label}
              </button>
            ))}
          </span>
          <span />
          <span className="meta" role="status">
            {shown.length} sur {closed.length} sessions
          </span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Clôture</th>
              <th>Session</th>
              <th>Branche</th>
              <th>Lancements</th>
              <th>Sprints</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(({ s, i }) => {
              const a = attach(closed, i, chantiers, sprints);
              return (
                <tr key={s.file}>
                  <td className="meta nowrap">{s.date}</td>
                  <td>
                    <button type="button" className="doclink linkbtn" onClick={() => setOpen(i)}>
                      {s.title}
                    </button>
                  </td>
                  <td className="meta">{NOT_PUBLISHED}</td>
                  <td>{a.launches.length}</td>
                  <td>{a.sprints.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="row">
          <span className="meta">{attachNote((project.lastSprints ?? []).length)}</span>
        </div>
      </section>
    </>
  );
}

function SessionPage({
  session: s,
  attached,
  project,
  onOpenFiche,
  onOpenSprint,
  onViewRun,
  onBack,
}: SessionsViewProps & {
  session: PilotageSession;
  attached: { launches: Launch[]; sprints: SprintSummary[] };
  onBack: () => void;
}): JSX.Element {
  const fil = attached.launches
    .flatMap(({ session }) => [...session.events].reverse().map((e) => ({ e, label: session.label })));
  const rows: [string, string][] = [
    ['Clôture', s.date],
    ['Ouverture', NOT_PUBLISHED],
    ['Durée', NOT_PUBLISHED],
    ['Branche', NOT_PUBLISHED],
    ['Fiches citées', String(s.fiches.length)],
    ['PR', s.prs.length > 0 ? s.prs.map((n) => `#${n}`).join(' ') : 'aucune'],
  ];
  return (
    <>
      <Crumbs label="Fil d'Ariane des sessions" items={[{ label: 'Sessions', onClick: onBack }, { label: s.date }]} />
      <div className="vh">
        <h2>{s.title}</h2>
      </div>
      <section className="card">
        <h3>En-tête</h3>
        {rows.map(([k, v]) => (
          <div key={k} className="row">
            <span className="meta">{k}</span>
            <span>{v}</span>
            <span />
          </div>
        ))}
      </section>
      <section className="card">
        <h3>Lancements — {attached.launches.length}</h3>
        {attached.launches.length === 0 ? (
          <div className="row">
            <span className="meta">aucun lancement du journal dans sa période</span>
          </div>
        ) : (
          attached.launches.map(({ chantier, session }) => {
            const ends = session.events.filter((e) => /^Jalon sprint-.+-checkpoint$/.test(e.title)).length;
            return (
              <div key={`${chantier.key}/${session.id}`} className="row">
                <span className="ttl">{chantier.name}</span>
                <span className="meta">
                  {session.label} · {session.startedAt?.slice(0, 10) ?? NOT_PUBLISHED} → {session.lastAt?.slice(0, 10) ?? NOT_PUBLISHED} ·{' '}
                  {ends} fins de sprint · {STATE_WORDS[session.state]}
                </span>
                <button type="button" className="chip" onClick={() => onViewRun(chantier.key)}>
                  Voir le lancement
                </button>
              </div>
            );
          })
        )}
        <div className="row">
          <span className="meta">{attachNote((project.lastSprints ?? []).length)}</span>
        </div>
      </section>
      <section className="card">
        <h3>Le fil — {fil.length} moments</h3>
        {fil.length === 0 ? (
          <div className="row">
            <span className="meta">aucun moment du journal dans sa période</span>
          </div>
        ) : (
          fil.map(({ e, label }, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: le fil n'a pas d'identifiant stable, son ordre est fixe
            <div key={i} className="row">
              <span className="meta">{e.when}</span>
              <span>{momentPhrase(e)}</span>
              <span className="meta">{label}</span>
            </div>
          ))
        )}
      </section>
      <section className="card">
        <h3>Sprints — {attached.sprints.length}</h3>
        {attached.sprints.length === 0 ? (
          <div className="row">
            <span className="meta">aucun sprint publié dans sa période</span>
          </div>
        ) : (
          attached.sprints.map((sp) => (
            <div key={sp.slug} className="row">
              <span className="meta">{sp.jour}</span>
              <button type="button" className="doclink linkbtn" onClick={() => onOpenSprint(sp.slug)}>
                {sprintTitle(sp)}
              </button>
              <span className="meta">{sp.livrees.length} fiches</span>
            </div>
          ))
        )}
      </section>
      <section className="card">
        <h3>Récit</h3>
        <div className="row">
          <span className="meta">Fichier</span>
          <code>{s.file}</code>
          <span className="meta">sections : {NOT_PUBLISHED}</span>
        </div>
      </section>
      <section className="card">
        <h3>Fiches citées — {s.fiches.length}</h3>
        {s.fiches.map((id) => (
          <FicheLine key={id} id={id} project={project} onOpenFiche={onOpenFiche} />
        ))}
      </section>
    </>
  );
}
