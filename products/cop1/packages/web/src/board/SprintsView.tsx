/**
 * Board unifié cop1 — pages Sprints et Un sprint (fiche 20261126170000104).
 *
 * Un sprint est un lot de fiches livré d'un bloc ; à sa clôture, la méthode écrit un compte rendu.
 * La page liste les sprints que la méthode publie (`lastSprints`), du plus récent au plus ancien.
 * Mission control n'invente rien (ADR-086) : une donnée que la méthode ne publie pas s'écrit
 * « non publié » ou « non mesuré », jamais « 0 ».
 */
import { useState } from 'react';
import { InfoButton, PageHead } from './Chrome.js';
import { fmtDuree } from './helpers.js';
import { FicheLine, Unavailable, planUnavailable } from './PlanBits.js';
import type { BoardProject, SprintSummary } from './types.js';

const NOT_PUBLISHED = 'non publié';
const NOT_MEASURED = 'non mesuré';
const PAGE_SIZE = 10;
const LIST_INFO = 'Un sprint est un lot de fiches livré d’un bloc, scellé par un compte rendu que la méthode publie. Une donnée non publiée s’affiche « non publié » ou « non mesuré ».';
const DAY_MS = 86_400_000;

type Period = 'today' | '7' | 'all';
const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'aujourd’hui' },
  { id: '7', label: '7 jours' },
  { id: 'all', label: 'tout' },
];

type State = 'all' | 'ok' | 'warn';
const STATES: { id: State; label: string }[] = [
  { id: 'all', label: 'tous' },
  { id: 'ok', label: 'ok' },
  { id: 'warn', label: 'attention' },
];

/** Le sprint est-il dans la période, comptée en jours avant `now` ? Un jour illisible n'y est jamais. */
export function inPeriod(jour: string, period: Period, now: Date): boolean {
  if (period === 'all') return true;
  const t = Date.parse(`${jour}T00:00:00Z`);
  if (Number.isNaN(t)) return false;
  if (period === 'today') return jour === now.toISOString().slice(0, 10);
  return now.getTime() - t <= Number(period) * DAY_MS;
}

/** Le titre d'un sprint : son numéro et son but quand ils sont publiés, sinon son slug. */
export function sprintTitle(s: SprintSummary): string {
  const num = s.numero !== undefined ? `Sprint ${s.numero}` : null;
  if (num && s.but) return `${num} — ${s.but}`;
  return num ?? s.but ?? s.slug;
}

/** Le titre du sprint de ce slug dans le projet ; le slug si la méthode ne le publie plus. */
export function sprintLabel(project: BoardProject, slug: string): string {
  const s = project.lastSprints?.find((x) => x.slug === slug);
  return s ? sprintTitle(s) : slug;
}

/** L'état d'un sprint d'après ses blocages ; `null` = blocages non mesurés, ni ok ni attention. */
function sprintState(s: SprintSummary): 'ok' | 'warn' | null {
  if (s.blocages === null) return null;
  return s.blocages === 0 ? 'ok' : 'warn';
}

const heure = (iso: string | null): string => (iso ? iso.slice(11, 16) : NOT_PUBLISHED);
const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`;
const nbFiches = (n: number): string => plural(n, 'fiche', 'fiches');
const tokens = (n: number | null): string => (n === null ? NOT_MEASURED : String(n));

function StateTag({ s }: { s: SprintSummary }): JSX.Element {
  const state = sprintState(s);
  if (state === null) return <span className="tag idea">{NOT_MEASURED}</span>;
  return <span className={`tag ${state}`}>{state === 'ok' ? 'ok' : 'attention'}</span>;
}

function SessionLink({ branche, onOpenSession }: { branche?: string; onOpenSession?: (branche: string) => void }): JSX.Element {
  if (branche === undefined) return <span>session non publiée</span>;
  if (!onOpenSession) return <span>session {branche}</span>;
  return (
    <button type="button" className="doclink linkbtn sprint-link" onClick={() => onOpenSession(branche)}>
      session {branche}
    </button>
  );
}

export interface SprintsViewProps {
  project: BoardProject;
  onOpenFiche: (id: string) => void;
  /** Le sprint à ouvrir d'entrée, quand une autre page y mène (page d'une session). */
  initialOpen?: string | null;
  /** Ouvre la page de la session (sa branche). Absent : la session s'écrit sans lien. */
  onOpenSession?: (branche: string) => void;
  /** Dit à la page parente quel sprint est ouvert (`null` = la liste), pour son fil d'Ariane. */
  onFocusChange?: (slug: string | null) => void;
  now?: Date;
}

export function SprintsView({ project, onOpenFiche, initialOpen = null, onOpenSession, onFocusChange, now = new Date() }: SprintsViewProps): JSX.Element {
  const [open, setOpen] = useState<string | null>(initialOpen);
  const [period, setPeriod] = useState<Period>('all');
  const [state, setState] = useState<State>('all');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const sprints = project.lastSprints;
  const reason =
    planUnavailable(project) ??
    (sprints ? null : 'la méthode installée ne publie pas les derniers sprints (mettre ezk à jour)');
  if (reason !== null || !sprints) {
    return (
      <>
        <PageHead title="Sprints" />
        <Unavailable what="sprints" reason={reason ?? ''} />
      </>
    );
  }
  const sprint = open ? sprints.find((s) => s.slug === open) : undefined;
  if (sprint) {
    return (
      <SprintPage
        sprint={sprint}
        project={project}
        onOpenFiche={onOpenFiche}
        onOpenSession={onOpenSession}
      />
    );
  }
  const total = project.metrics.sprints;
  const needle = query.trim().toLowerCase();
  const filtered = sprints.filter(
    (s) =>
      inPeriod(s.jour, period, now) &&
      (state === 'all' || sprintState(s) === state) &&
      (needle === '' || `${sprintTitle(s)} ${s.branche ?? ''}`.toLowerCase().includes(needle)),
  );
  const visible = filtered.slice(0, limit);
  return (
    <>
      <PageHead title="Sprints" />
      <section className="card" aria-label="Liste des sprints">
        <h3>
          Sprints
          <InfoButton text={LIST_INFO} />
        </h3>
        <div className="sprint-body">
        <div className="sprint-filters">
          <span className="meta">Type :</span>
          <span className="seg" role="group" aria-label="Type">
            <button type="button" className="on" aria-pressed="true">
              sprints
            </button>
          </span>
          <span className="meta">État :</span>
          <span className="seg" role="group" aria-label="État">
            {STATES.map((st) => (
              <button key={st.id} type="button" className={state === st.id ? 'on' : undefined} aria-pressed={state === st.id} onClick={() => setState(st.id)}>
                {st.label}
              </button>
            ))}
          </span>
          <span className="meta">Période :</span>
          <span className="seg" role="group" aria-label="Période">
            {PERIODS.map((p) => (
              <button key={p.id} type="button" className={period === p.id ? 'on' : undefined} aria-pressed={period === p.id} onClick={() => setPeriod(p.id)}>
                {p.label}
              </button>
            ))}
          </span>
          <input
            type="search"
            className="sprint-search"
            placeholder="Rechercher…"
            aria-label="Rechercher un sprint"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ul className="sprint-list" aria-label="Sprints">
          {visible.map((s) => (
            <li key={s.slug} className="sprint-item">
              <div className="sprint-main">
                <span className="tag sprint-kind">sprint</span>
                <button type="button" className="doclink linkbtn sprint-title" onClick={() => {
                    setOpen(s.slug);
                    onFocusChange?.(s.slug);
                  }}>
                  {sprintTitle(s)}
                </button>
                <div className="sprint-meta meta">
                  <span>
                    {s.jour} · {heure(s.fin)}
                  </span>
                  <span>{fmtDuree(s.dureeMs)}</span>
                  <span>{nbFiches(s.livrees.length)}</span>
                  <SessionLink branche={s.branche} onOpenSession={onOpenSession} />
                </div>
              </div>
              <div className="sprint-tags">
                <span className="tag idea sprint-retro">rétro : {NOT_PUBLISHED}</span>
                <StateTag s={s} />
              </div>
            </li>
          ))}
        </ul>
        <div className="sprint-foot">
          {typeof total === 'number' && total > sprints.length ? (
            <span className="meta sprint-note" role="note">
              La méthode ne publie que les {sprints.length} derniers sprints sur {total}.
            </span>
          ) : (
            <span />
          )}
          {visible.length < filtered.length ? (
            <button type="button" className="linkbtn sprint-more" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
              Afficher plus
            </button>
          ) : (
            <span />
          )}
          <span className="meta" role="status">
            {visible.length} sur {filtered.length} sprints
          </span>
        </div>
        </div>
      </section>
    </>
  );
}

function Block({ title, info, wide, children }: { title: string; info: string; wide?: boolean; children: React.ReactNode }): JSX.Element {
  return (
    <section className={wide ? 'card sprint-block wide' : 'card sprint-block'}>
      <h3>
        {title}
        <InfoButton text={info} />
      </h3>
      <div className="sprint-body">{children}</div>
    </section>
  );
}

function SprintPage({
  sprint: s,
  project,
  onOpenFiche,
  onOpenSession,
}: {
  sprint: SprintSummary;
  project: BoardProject;
  onOpenFiche: (id: string) => void;
  onOpenSession?: (branche: string) => void;
}): JSX.Element {
  const lot = s.livrees.length === 1 ? 'lot d’une fiche' : `lot de ${s.livrees.length} fiches`;
  const blocages = s.blocages === null ? 'blocages non mesurés' : plural(s.blocages, 'blocage', 'blocages');
  const compteRendu: [string, string][] = [
    ['Lot scellé', `${plural(s.livrees.length, 'fiche livrée', 'fiches livrées')}`],
    ['Durée', fmtDuree(s.dureeMs)],
    ['Jetons', tokens(s.tokens)],
    ['Retouches de PR', NOT_PUBLISHED],
    ['Étapes', NOT_PUBLISHED],
  ];
  return (
    <>
      <PageHead title={sprintTitle(s)} info="Le compte rendu d’un sprint : ce que la méthode a publié à sa clôture. Une donnée absente s’affiche « non publié » ou « non mesuré ».">
        <StateTag s={s} />
      </PageHead>
      <p className="sprint-summary meta" aria-label="Résumé du sprint">
        {[
          `${s.jour} · ${heure(s.fin)}`,
          fmtDuree(s.dureeMs),
          lot,
          `incrément : ${NOT_PUBLISHED}`,
          <SessionLink key="session" branche={s.branche} onOpenSession={onOpenSession} />,
          blocages,
          `jetons : ${tokens(s.tokens)}`,
          `objectif : ${NOT_PUBLISHED}`,
        ].map((part, i) => (
          <span key={i}>
            {i > 0 && ' · '}
            {part}
          </span>
        ))}
      </p>
      <div className="sprint-grid">
      <Block title="Fiches livrées" info="Les fiches du lot scellé, avec leur priorité. L’objectif et l’intégration de chaque fiche ne sont pas publiés.">
        {s.livrees.map((f) =>
          project.fiches?.[f.id] ? (
            <FicheLine key={f.id} id={f.id} project={project} onOpenFiche={onOpenFiche} />
          ) : (
            <div key={f.id} className="row ficherow">
              <span className="meta">—</span>
              <span className="ttl">{f.title}</span>
              <span className="meta">livrée</span>
            </div>
          ),
        )}
      </Block>
      <Block title="Session" info="La session qui a mené ce sprint.">
        {s.branche === undefined ? (
          <div className="row">
            <span className="meta">{NOT_PUBLISHED}</span>
          </div>
        ) : (
          <div className="row">
            {onOpenSession ? (
              <button type="button" className="doclink linkbtn ttl" onClick={() => onOpenSession(s.branche as string)}>
                {s.branche}
              </button>
            ) : (
              <span className="ttl">{s.branche}</span>
            )}
            <span className="meta">récit pas encore écrit</span>
          </div>
        )}
      </Block>
      <Block wide title="Compte rendu" info="Ce que le compte rendu du sprint dit, tel que la méthode le publie.">
        {compteRendu.map(([k, v]) => (
          <div key={k} className="row">
            <span className="meta">{k}</span>
            <span>{v}</span>
            <span />
          </div>
        ))}
        <div className="row">
          <span className="meta">Fichier</span>
          <code>{s.fichier}</code>
          <span />
        </div>
      </Block>
      <Block title="Dans le journal" info="Les lignes horodatées du lancement : début, fin de sprint, reprise, fin du lancement.">
        <div className="row">
          <span className="meta">{NOT_PUBLISHED}</span>
        </div>
      </Block>
      <Block title="Rétro" info="La rétro de ce sprint, quand la méthode la publie.">
        <div className="row">
          <span className="meta">État</span>
          <span>{NOT_PUBLISHED}</span>
          <span />
        </div>
        <div className="row">
          <span className="meta">Précédente</span>
          <span>{NOT_PUBLISHED}</span>
          <span />
        </div>
      </Block>
      </div>
    </>
  );
}
