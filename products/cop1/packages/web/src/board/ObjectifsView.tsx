/**
 * Board unifié cop1 — pages Objectifs et Un objectif (fiche 20261124111115865).
 *
 * Un objectif (une milestone) regroupe des fiches qui servent un même but. La page liste les
 * objectifs dans l'ordre publié par la méthode ; un clic ouvre la page d'un objectif. Rien n'est
 * recalculé : les chiffres viennent de `ezk board show --json`. Aucun geste n'écrit.
 */
import { useMemo, useState } from 'react';
import { CommandHint, Crumbs, FicheLine, Unavailable, planUnavailable } from './PlanBits.js';
import type { BoardProject, Objectif } from './types.js';

/** Le pseudo-objectif des fiches mises de côté : il n'est pas une ligne du tableau. */
const PARKED = 'parked';
const NO_NAME = 'nom non publié';
const NO_VERSION = 'aucune version posée';

const STATUS_WORDS: Record<string, string> = {
  idea: 'à mûrir',
  ready: 'prêt',
  'in-progress': 'en cours',
  shipped: 'livré',
};
const statusWords = (s: string): string => STATUS_WORDS[s] ?? s;

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`;

/** Les fiches actives en mots, et leurs blocages tels que la méthode les publie (`panel`, `deferred`…). */
export function activesInWords(o: Objectif, project: BoardProject): string {
  const parts: string[] = [];
  const idea = o.counts.idea ?? 0;
  const ready = o.counts.ready ?? 0;
  const wip = o.counts['in-progress'] ?? 0;
  if (idea > 0) parts.push(plural(idea, 'idée', 'idées'));
  if (ready > 0) parts.push(plural(ready, 'prête', 'prêtes'));
  if (wip > 0) parts.push(`${wip} en cours`);
  const reasons = new Map<string, number>();
  for (const id of o.aFaire) {
    const why = project.fiches?.[id]?.blocked;
    if (why) reasons.set(why, (reasons.get(why) ?? 0) + 1);
  }
  const blocked = [...reasons.values()].reduce((a, b) => a + b, 0);
  if (blocked > 0) {
    const detail = [...reasons.entries()].map(([why, n]) => `${n} ${why}`).join(', ');
    parts.push(`${plural(blocked, 'bloquée', 'bloquées')} (${detail})`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'rien à faire';
}

export interface ObjectifsViewProps {
  project: BoardProject;
  onOpenFiche: (id: string) => void;
}

export function ObjectifsView({ project, onOpenFiche }: ObjectifsViewProps): JSX.Element {
  const [open, setOpen] = useState<string | null>(null);
  const reason =
    planUnavailable(project) ??
    (project.objectifs ? null : 'la méthode installée ne publie pas les objectifs en entier (mettre ezk à jour)');
  if (reason !== null || !project.objectifs) {
    return (
      <>
        <div className="vh">
          <h2>Objectifs</h2>
        </div>
        <Unavailable what="objectifs" reason={reason ?? ''} />
      </>
    );
  }
  const objectif = open ? project.objectifs.find((o) => o.slug === open) : undefined;
  if (objectif) {
    return (
      <ObjectifPage objectif={objectif} project={project} onOpenFiche={onOpenFiche} onBack={() => setOpen(null)} />
    );
  }
  return <ObjectifsTable objectifs={project.objectifs} project={project} onOpen={setOpen} />;
}

function ObjectifsTable({
  objectifs,
  project,
  onOpen,
}: {
  objectifs: Objectif[];
  project: BoardProject;
  onOpen: (slug: string) => void;
}): JSX.Element {
  const [status, setStatus] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const rows = objectifs.filter((o) => o.slug !== PARKED);
  const parked = objectifs.find((o) => o.slug === PARKED);
  const rank = useMemo(() => new Map(rows.map((o, i) => [o.slug, i + 1])), [rows]);
  const statuses = useMemo(() => [...new Set(rows.map((o) => o.status))], [rows]);
  const versions = useMemo(() => [...new Set(rows.flatMap((o) => o.versions))].sort(), [rows]);
  const shown = rows.filter(
    (o) =>
      (status === '' || o.status === status) &&
      (version === '' || (version === '-' ? o.versions.length === 0 : o.versions.includes(version))),
  );
  return (
    <>
      <div className="vh">
        <h2>Objectifs</h2>
        <span className="sub">{rows.length} objectifs, dans l'ordre de la méthode</span>
      </div>
      <section className="card">
        <div className="row filters">
          <label>
            État{' '}
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrer par état">
              <option value="">tous</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusWords(s)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Version{' '}
            <select value={version} onChange={(e) => setVersion(e.target.value)} aria-label="Filtrer par version">
              <option value="">toutes</option>
              <option value="-">{NO_VERSION}</option>
              {versions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <span className="meta" role="status">
            {shown.length} sur {rows.length} objectifs
          </span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Rang</th>
              <th>Objectif</th>
              <th>Nom</th>
              <th>Livrées / total</th>
              <th>Actives</th>
              <th>Versions portées</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.slug}>
                <td className="meta">{rank.get(o.slug)}</td>
                <td>
                  <button type="button" className="doclink linkbtn" onClick={() => onOpen(o.slug)}>
                    {o.slug}
                  </button>{' '}
                  <span className="pill">{statusWords(o.status)}</span>
                </td>
                <td className={o.nom ? undefined : 'meta'}>{o.nom ?? NO_NAME}</td>
                <td>
                  {o.shipped} / {o.total}
                </td>
                <td className="meta">{activesInWords(o, project)}</td>
                <td>
                  {o.versions.length > 0 ? (
                    o.versions.map((v) => (
                      <span key={v} className="pill ver">
                        {v}
                      </span>
                    ))
                  ) : (
                    <span className="meta">{NO_VERSION}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {parked && (
        <section className="card">
          <div className="row">
            <span className="meta">à part</span>
            <span>
              <span className="ttl">{PARKED}</span>{' '}
              <span className="meta">
                {parked.total} fiches mises de côté. Ce n'est pas un objectif : la méthode range là les fiches
                sorties de leur version, en attendant de les réveiller.
              </span>
            </span>
            <span />
          </div>
        </section>
      )}
    </>
  );
}

function ObjectifPage({
  objectif: o,
  project,
  onOpenFiche,
  onBack,
}: {
  objectif: Objectif;
  project: BoardProject;
  onOpenFiche: (id: string) => void;
  onBack: () => void;
}): JSX.Element {
  const lots = project.versionsPage?.lots;
  const perVersion = o.versions.map((v) => {
    const lot = lots?.find((l) => l.version === v);
    return { v, n: lot ? lot.livrees.filter((id) => o.livrees.includes(id)).length : null };
  });
  const sansVersion = o.livrees.filter((id) => project.fiches?.[id] && !project.fiches[id]?.ver).length;
  const first = o.aFaire[0];
  return (
    <>
      <Crumbs label="Fil d'Ariane des objectifs" items={[{ label: 'Objectifs', onClick: onBack }, { label: o.slug }]} />
      <div className="vh">
        <h2>{o.slug}</h2>
        <span className="sub">{o.nom ?? NO_NAME}</span>
        <span className="pill">{statusWords(o.status)}</span>
        {first && <CommandHint label="Groomer ses fiches" command={`/ezk-backlog groom ${first}`} />}
      </div>
      <section className="card">
        <h3>En-tête</h3>
        <div className="row">
          <span className="meta">Avancement</span>
          <span>
            {o.shipped} livrées / {o.total} · {activesInWords(o, project)}
          </span>
          <span />
        </div>
        <div className="row">
          <span className="meta">Versions portées</span>
          <span>
            {perVersion.length > 0
              ? perVersion.map(({ v, n }) => (
                  <span key={v} className="pill ver">
                    {v}
                    {n !== null ? ` · ${n}` : ''}
                  </span>
                ))
              : NO_VERSION}
            <span className="meta"> · {sansVersion} livrées sans numéro de version</span>
          </span>
          <span />
        </div>
      </section>
      <section className="card">
        <h3>Fiches à faire — {o.aFaire.length}</h3>
        {o.aFaire.length === 0 ? (
          <div className="row">
            <span className="meta">rien à faire</span>
          </div>
        ) : (
          o.aFaire.map((id) => <FicheLine key={id} id={id} project={project} onOpenFiche={onOpenFiche} />)
        )}
      </section>
      <section className="card">
        <h3>Fiches livrées — {o.livrees.length}</h3>
        {o.livrees.map((id) => (
          <FicheLine
            key={id}
            id={id}
            project={project}
            onOpenFiche={onOpenFiche}
            extra={project.fiches?.[id]?.ver || 'à étiqueter'}
          />
        ))}
      </section>
    </>
  );
}
