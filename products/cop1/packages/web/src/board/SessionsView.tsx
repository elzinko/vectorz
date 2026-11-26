/**
 * Board unifié cop1 — pages Sessions et Une session (fiche 20261124111116042).
 *
 * Une session est une séance de travail dans Claude Code, sur une branche. La page montre les
 * sessions en cours, lues dans le journal de supervision, puis les sessions closes, lues dans leurs
 * récits publiés par la méthode. Tant que la méthode ne publie pas la branche d'un récit, les
 * lancements et les sprints se rangent sous une session close par la période, et la page le dit.
 */
import { useState } from 'react';
import { inlineMarkdown } from './inlineMarkdown.js';
import { FicheLine, Unavailable, planUnavailable } from './PlanBits.js';
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
import { InfoButton, PageHead } from './Chrome.js';

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

/** Une fin de sprint dans le journal. */
const isSprintEnd = (e: TimelineEvent): boolean => /^Jalon sprint-.+-checkpoint$/.test(e.title);

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

/** Ce que la méthode a publié : au-delà, un nombre n'est pas « 0 », il est inconnu. */
export interface Coverage {
  /** Le plus ancien lancement du journal, en ms ; `null` si le journal est vide. */
  launchFrom: number | null;
  /** Le plus ancien sprint publié, en ms ; `null` si aucun. */
  sprintFrom: number | null;
}

export function coverage(chantiers: BoardChantier[], sprints: SprintSummary[]): Coverage {
  const starts = chantiers.flatMap((c) => c.sessions.map((s) => Date.parse(s.startedAt ?? ''))).filter((t) => !Number.isNaN(t));
  const days = sprints.map((sp) => dayMs(sp.jour)).filter((t) => !Number.isNaN(t));
  return {
    launchFrom: starts.length ? Math.min(...starts) : null,
    sprintFrom: days.length ? Math.min(...days) : null,
  };
}

/** Le nombre d'une session close, ou `null` quand sa période commence avant ce que la méthode publie. */
function counted(n: number, sessionDate: string, from: number | null, noun: string): string | null {
  const covered = from !== null && dayMs(sessionDate) + DAY_MS > from;
  if (!covered && n === 0) return null;
  return `${n} ${noun}${n > 1 ? 's' : ''}`;
}

type Period = 'all' | '7';
const PAGE = 20;

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
  const [branch, setBranch] = useState('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const closed = project.pilotage?.sessions;
  const reason =
    planUnavailable(project) ??
    (closed ? null : 'la méthode installée ne publie pas les récits de session (mettre ezk à jour)');
  if (reason !== null || !closed) {
    return (
      <>
        <PageHead title="Sessions" />
        <Unavailable what="sessions" reason={reason ?? ''} />
      </>
    );
  }
  const chantiers = project.chantiers ?? [];
  const sprints = project.lastSprints ?? [];
  const cover = coverage(chantiers, sprints);
  if (open !== null && closed[open]) {
    return (
      <SessionPage
        {...props}
        session={closed[open]}
        attached={attach(closed, open, chantiers, sprints)}
        cover={cover}
      />
    );
  }
  const current = chantiers.flatMap((chantier) =>
    chantier.sessions.filter((s) => s.state === 'live' || s.state === 'gate').map((session) => ({ chantier, session })),
  );
  const branches = [...new Set(closed.flatMap((s) => (s.branch ? [s.branch] : [])))];
  const needle = query.trim().toLowerCase();
  const matching = closed
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => period === 'all' || now.getTime() - dayMs(s.date) <= Number(period) * DAY_MS)
    .filter(({ s }) => branch === '' || s.branch === branch)
    .filter(({ s }) => needle === '' || s.title.toLowerCase().includes(needle));
  const shown = matching.slice(0, limit);
  return (
    <>
      <PageHead title="Sessions" info="La session en cours, puis les sessions closes." />
      <section className="card">
        <h3>En cours — {current.length}</h3>
        {current.length === 0 ? (
          <div className="row">
            <span className="meta">aucune session en cours dans le journal</span>
          </div>
        ) : (
          current.map(({ chantier, session }) => {
            const ends = session.events.filter(isSprintEnd);
            const last = ends[0];
            return (
              <div key={`${chantier.key}/${session.id}`} className="row">
                <span className="ttl">{session.label}</span>
                <span className="meta">
                  {chantier.name} · {STATE_WORDS[session.state]} · depuis {session.startedAt?.slice(0, 10) ?? NOT_PUBLISHED} ·{' '}
                  {ends.length} fins de sprint
                  {last ? ` · dernier terminé : ${momentPhrase(last)}, ${last.when}` : ''}
                  {session.events[0] ? ` · dernier moment : ${momentPhrase(session.events[0])}, ${session.events[0].when}` : ''}
                </span>
                <button type="button" className="chip" onClick={() => props.onViewRun(chantier.key)}>
                  Voir le lancement
                </button>
              </div>
            );
          })
        )}
      </section>
      <section className="card">
        <h3>
          <span>Closes — {closed.length}</span>
          <InfoButton text={`Non publié par la méthode : la branche d’une session et ce qui précède ses lancements ou ses sprints publiés, omis de la ligne. ${attachNote(sprints.length)}`} />
        </h3>
        <div className="row filters">
          <span className="seg" role="group" aria-label="Période">
            {(
              [
                ['7', '7 derniers jours'],
                ['all', 'tout'],
              ] as [Period, string][]
            ).map(([id, label]) => (
              <button key={id} type="button" className={period === id ? 'on' : undefined} aria-pressed={period === id} onClick={() => setPeriod(id)}>
                {label}
              </button>
            ))}
          </span>
          {branches.length > 0 && (
            <select aria-label="Branche" value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">toutes les branches</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
          <input
            type="search"
            aria-label="Rechercher une session"
            placeholder="Rechercher"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="meta" role="status">
            {shown.length} sur {closed.length} sessions
          </span>
        </div>
        <ul className="sess-list">
          {shown.map(({ s, i }) => {
            const a = attach(closed, i, chantiers, sprints);
            const facts = [
              s.date,
              s.branch,
              counted(a.launches.length, s.date, cover.launchFrom, 'lancement'),
              counted(a.sprints.length, s.date, cover.sprintFrom, 'sprint'),
            ].filter((f): f is string => Boolean(f));
            return (
              <li key={s.file} className="sess-row">
                <span className="tag idea">close</span>
                <span className="sess-main">
                  <button type="button" className="doclink linkbtn sess-link" onClick={() => setOpen(i)}>
                    {s.title}
                  </button>
                  <span className="meta">{facts.join(' · ')}</span>
                </span>
                <span className="tag ok">close</span>
              </li>
            );
          })}
        </ul>
        <div className="sessions-foot">
          <span />
          {matching.length > shown.length ? (
            <button type="button" className="chip" onClick={() => setLimit(limit + PAGE)}>
              Afficher plus
            </button>
          ) : (
            <span />
          )}
          <span className="meta">
            {current.length} en cours · {closed.length} closes
          </span>
        </div>
      </section>
    </>
  );
}

function SessionPage({
  session: s,
  attached,
  cover,
  project,
  onOpenFiche,
  onOpenSprint,
  onViewRun,
}: SessionsViewProps & {
  session: PilotageSession;
  attached: { launches: Launch[]; sprints: SprintSummary[] };
  cover: Coverage;
}): JSX.Element {
  const fil = attached.launches.flatMap(({ session }) => [...session.events].reverse().map((e) => ({ e, label: session.label })));
  const filCount = counted(fil.length, s.date, cover.launchFrom, 'moment');
  // Les plus récents d'abord.
  const sprintsRecent = [...attached.sprints].sort((a, b) => b.jour.localeCompare(a.jour));
  const days = s.openedAt ? Math.round((dayMs(s.date) - dayMs(s.openedAt)) / DAY_MS) : Number.NaN;
  const known: [string, string | null][] = [
    ['ouverture', s.openedAt ? `ouverte le ${s.openedAt}` : null],
    ['durée', Number.isNaN(days) ? null : `durée : ${days} jour${days > 1 ? 's' : ''}`],
    ['branche', s.branch ? `branche : ${s.branch}` : null],
  ];
  const missing = known.filter(([, v]) => v === null).map(([k]) => k);
  const facts = [
    known[0]?.[1],
    `close le ${s.date}`,
    known[1]?.[1],
    known[2]?.[1],
    `${s.fiches.length} fiche${s.fiches.length > 1 ? 's' : ''} citée${s.fiches.length > 1 ? 's' : ''}`,
    `PR : ${s.prs.length > 0 ? s.prs.map((n) => `#${n}`).join(' ') : 'aucune (flux local)'}`,
  ].filter((f): f is string => Boolean(f));
  const launchCount = counted(attached.launches.length, s.date, cover.launchFrom, 'lancement');
  const sprintCount = counted(attached.sprints.length, s.date, cover.sprintFrom, 'sprint');
  return (
    <>
      <PageHead title={s.title} />
      <div className="sess-summary" data-testid="session-summary">
        <span className="tag ok">close</span>
        <span className="meta">{facts.join(' · ')}</span>
        {missing.length > 0 && <InfoButton text={`Non publié par la méthode : ${missing.join(', ')}`} />}
      </div>
      <section className="card">
        <h3>
          <span>Lancements — {launchCount ?? NOT_PUBLISHED}</span>
          <InfoButton text={attachNote(project.lastSprints?.length ?? 0)} />
        </h3>
        {attached.launches.length === 0 ? (
          <div className="row">
            <span className="meta">{launchCount === null ? 'non publié pour cette période' : 'aucun lancement du journal dans sa période'}</span>
          </div>
        ) : (
          attached.launches.map(({ chantier, session }) => {
            const ends = session.events.filter(isSprintEnd).length;
            const questions = session.events.filter((e) => e.kind === 'gate' && !isSprintEnd(e) && e.title !== 'Reprise après le jalon').length;
            return (
              <div key={`${chantier.key}/${session.id}`} className="row">
                <span className="ttl">{chantier.name}</span>
                <span className="meta">
                  {session.label} · {session.startedAt?.slice(0, 10) ?? NOT_PUBLISHED} → {session.lastAt?.slice(0, 10) ?? NOT_PUBLISHED} ·{' '}
                  {STATE_WORDS[session.state]} · {ends} fins de sprint · {questions} questions posées
                </span>
                <button type="button" className="chip" onClick={() => onViewRun(chantier.key)}>
                  Voir le lancement
                </button>
              </div>
            );
          })
        )}
      </section>
      <section className="card">
        <h3>Le fil — {filCount ?? NOT_PUBLISHED}</h3>
        {fil.length === 0 ? (
          <div className="row">
            <span className="meta">{filCount === null ? 'non publié pour cette période' : 'aucun moment du journal dans sa période'}</span>
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
        <h3>
          <span>Sprints — {sprintCount ?? NOT_PUBLISHED}</span>
          {sprintsRecent.length > 0 && <span className="meta">{sprintsRecent.length} montrés</span>}
        </h3>
        {sprintsRecent.length === 0 ? (
          <div className="row">
            <span className="meta">{sprintCount === null ? 'non publié pour cette période' : 'aucun sprint publié dans sa période'}</span>
          </div>
        ) : (
          sprintsRecent.map((sp) => (
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
      <div className="sess-two">
      <section className="card">
        <h3>Le récit</h3>
        {s.sections && s.sections.length > 0 ? (
          s.sections.map((sec) => (
            <div key={sec.title} className="row sessions-recit">
              <span className="ttl">{sec.title}</span>
              <span>{inlineMarkdown(sec.text)}</span>
              <span />
            </div>
          ))
        ) : (
          <div className="row">
            <span className="meta">{NOT_PUBLISHED}</span>
          </div>
        )}
      </section>
      <section className="card">
        <h3>Les fiches citées — {s.fiches.length}</h3>
        {s.fiches.map((id) => (
          <FicheLine key={id} id={id} project={project} onOpenFiche={onOpenFiche} />
        ))}
      </section>
      </div>
    </>
  );
}
