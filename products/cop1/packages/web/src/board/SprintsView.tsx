/**
 * Board unifié cop1 — pages Sprints et Un sprint (fiche 20261124111115955).
 *
 * Un sprint est un lot de fiches livré d'un bloc ; à sa clôture, la méthode écrit un compte rendu.
 * La page liste les sprints que la méthode publie (`derniersSprints`), du plus récent au plus
 * ancien, et dit combien elle en montre sur combien. Le numéro, le but et la session s'écrivent
 * « non publié » tant que la méthode ne les publie pas, et s'affichent dès qu'elle le fait.
 */
import { useState } from 'react';
import { fmtDuree, fmtTokens } from './OverviewView.js';
import { CommandHint, Crumbs, FicheLine, Unavailable, planUnavailable } from './PlanBits.js';
import type { BoardProject, SprintSummary } from './types.js';

const NOT_PUBLISHED = 'non publié';
const DAY_MS = 86_400_000;

type Period = 'all' | '7' | '30';
const PERIODS: { id: Period; label: string }[] = [
  { id: '7', label: '7 derniers jours' },
  { id: '30', label: '30 derniers jours' },
  { id: 'all', label: 'tout' },
];

/** Le sprint est-il dans la période, comptée en jours avant `now` ? Un jour illisible n'y est jamais. */
export function inPeriod(jour: string, period: Period, now: Date): boolean {
  if (period === 'all') return true;
  const t = Date.parse(`${jour}T00:00:00Z`);
  if (Number.isNaN(t)) return false;
  return now.getTime() - t <= Number(period) * DAY_MS;
}

/** Le titre d'un sprint : son numéro et son but quand ils sont publiés, sinon son slug. */
export function sprintTitle(s: SprintSummary): string {
  const num = s.numero !== undefined ? `Sprint ${s.numero}` : null;
  if (num && s.but) return `${num} — ${s.but}`;
  return num ?? s.but ?? s.slug;
}

const heure = (iso: string | null): string => (iso ? iso.slice(11, 16) : NOT_PUBLISHED);

export interface SprintsViewProps {
  project: BoardProject;
  onOpenFiche: (id: string) => void;
  /** Le sprint à ouvrir d'entrée, quand une autre page y mène (page d'une session). */
  initialOpen?: string | null;
  now?: Date;
}

export function SprintsView({ project, onOpenFiche, initialOpen = null, now = new Date() }: SprintsViewProps): JSX.Element {
  const [open, setOpen] = useState<string | null>(initialOpen);
  const [period, setPeriod] = useState<Period>('all');
  const sprints = project.lastSprints;
  const reason =
    planUnavailable(project) ??
    (sprints ? null : 'la méthode installée ne publie pas les derniers sprints (mettre ezk à jour)');
  if (reason !== null || !sprints) {
    return (
      <>
        <div className="vh">
          <h2>Sprints</h2>
        </div>
        <Unavailable what="sprints" reason={reason ?? ''} />
      </>
    );
  }
  const sprint = open ? sprints.find((s) => s.slug === open) : undefined;
  if (sprint) {
    return <SprintPage sprint={sprint} project={project} onOpenFiche={onOpenFiche} onBack={() => setOpen(null)} />;
  }
  const total = project.metrics.sprints;
  const shown = sprints.filter((s) => inPeriod(s.jour, period, now));
  return (
    <>
      <div className="vh">
        <h2>Sprints</h2>
        <span className="sub" role="note">
          {typeof total === 'number' && total > sprints.length
            ? `${sprints.length} sprints montrés sur ${total} : la méthode ne publie que les derniers`
            : `${sprints.length} sprints`}
        </span>
      </div>
      <section className="card">
        <div className="row filters">
          <span className="seg" role="group" aria-label="Période">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={period === p.id ? 'on' : undefined}
                aria-pressed={period === p.id}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </span>
          <span />
          <span className="meta" role="status">
            {shown.length} sur {sprints.length} sprints
          </span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Sprint</th>
              <th>Jour</th>
              <th>Durée</th>
              <th>Fiches</th>
              <th>Session</th>
              <th>Rétro</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((s) => (
              <tr key={s.slug}>
                <td>
                  <button type="button" className="doclink linkbtn" onClick={() => setOpen(s.slug)}>
                    {sprintTitle(s)}
                  </button>
                </td>
                <td className="meta nowrap">
                  {s.jour} · {heure(s.fin)}
                </td>
                <td>{fmtDuree(s.dureeMs)}</td>
                <td>{s.livrees.length}</td>
                <td className="meta">{s.branche ?? NOT_PUBLISHED}</td>
                <td className="meta">{NOT_PUBLISHED}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function SprintPage({
  sprint: s,
  project,
  onOpenFiche,
  onBack,
}: {
  sprint: SprintSummary;
  project: BoardProject;
  onOpenFiche: (id: string) => void;
  onBack: () => void;
}): JSX.Element {
  const rows: [string, string][] = [
    ['Numéro', s.numero !== undefined ? String(s.numero) : NOT_PUBLISHED],
    ['But', s.but ?? NOT_PUBLISHED],
    ['Jour', `${s.jour}, fin à ${heure(s.fin)}`],
    ['Durée', fmtDuree(s.dureeMs)],
    ['Taille du lot', `${s.livrees.length} fiches livrées`],
    ['Incrément', NOT_PUBLISHED],
    ['Session', s.branche ?? NOT_PUBLISHED],
    ['Blocages', s.blocages === null ? 'non mesurés' : String(s.blocages)],
    ['Jetons', fmtTokens(s.tokens)],
  ];
  return (
    <>
      <Crumbs label="Fil d'Ariane des sprints" items={[{ label: 'Sprints', onClick: onBack }, { label: s.slug }]} />
      <div className="vh">
        <h2>{sprintTitle(s)}</h2>
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
        <h3>Fiches livrées — {s.livrees.length}</h3>
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
      </section>
      <section className="card">
        <h3>Compte rendu</h3>
        <div className="row">
          <span className="meta">Fichier</span>
          <code>{s.fichier}</code>
          <span className="meta">sections : {NOT_PUBLISHED}</span>
        </div>
      </section>
      <section className="card">
        <h3>Rétro</h3>
        <div className="row">
          <span className="meta">jouée ou pas : {NOT_PUBLISHED}</span>
          <span />
          <CommandHint label="Lancer une rétro" command={`/ezk-retro run "sprint ${s.slug}"`} />
        </div>
      </section>
    </>
  );
}
