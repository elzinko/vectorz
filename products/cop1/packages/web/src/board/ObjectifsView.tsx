/**
 * Board unifié cop1 — pages Objectifs et Un objectif (fiches 20261124111115865 et 20261126170000107).
 *
 * Un objectif (une milestone) regroupe des fiches qui servent un même but. La page liste les
 * objectifs dans l'ordre publié par la méthode ; un clic ouvre la page d'un objectif. Rien n'est
 * recalculé : les chiffres viennent de `ezk board show --json`. Aucun geste n'écrit.
 */
import { useMemo, useState } from 'react';
import { CommandHint, FicheLine, Unavailable, planUnavailable } from './PlanBits.js';
import type { BoardProject, Objectif } from './types.js';
import { InfoButton, PageHead } from './Chrome.js';

/** Le pseudo-objectif des fiches mises de côté : il n'est pas une ligne du tableau. */
const PARKED = 'parked';
const NO_NAME = 'nom non publié';
const NO_VERSION = 'aucune version posée';
const PAGE_SIZE = 10;
/** L'état affiché d'entrée : la maquette ne garde que les objectifs en cours. */
const DEFAULT_STATUS = 'in-progress';
const LIST_INFO =
  'Un objectif est le but que portent des fiches (le champ milestone). Ils sont listés dans l’ordre du plan que la méthode publie. Un nom ou un chiffre non publié s’affiche « non publié », jamais « 0 ».';

const STATUS_WORDS: Record<string, string> = {
  idea: 'à mûrir',
  ready: 'prêt',
  'in-progress': 'en cours',
  shipped: 'livré',
};
const STATUS_TAG: Record<string, string> = { idea: 'idea', ready: 'idea', 'in-progress': 'wip', shipped: 'ok' };
const statusTag = (s: string): string => STATUS_TAG[s] ?? 'idea';
const statusWords = (s: string): string => STATUS_WORDS[s] ?? s;

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`;

/** Le nombre de fiches à faire que la méthode dit bloquées. */
function blockedCount(o: Objectif, project: BoardProject): number {
  return o.aFaire.filter((id) => project.fiches?.[id]?.blocked).length;
}

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
  /** L'objectif à ouvrir d'entrée, quand la page parente le porte (son fil d'Ariane). */
  initialOpen?: string | null;
  /** Dit à la page parente quel objectif est ouvert, pour son fil d'Ariane. */
  onFocusChange: (slug: string | null) => void;
}

export function ObjectifsView({ project, onOpenFiche, initialOpen = null, onFocusChange }: ObjectifsViewProps): JSX.Element {
  const [open, setOpen] = useState<string | null>(initialOpen);
  const reason =
    planUnavailable(project) ??
    (project.objectifs ? null : 'la méthode installée ne publie pas les objectifs en entier (mettre ezk à jour)');
  if (reason !== null || !project.objectifs) {
    return (
      <>
        <PageHead title="Objectifs" />
        <Unavailable what="objectifs" reason={reason ?? ''} />
      </>
    );
  }
  const openObjectif = (slug: string): void => {
    setOpen(slug);
    onFocusChange(slug);
  };
  const objectif = open ? project.objectifs.find((o) => o.slug === open) : undefined;
  if (objectif) {
    const plan = project.objectifs.filter((o) => o.slug !== PARKED);
    return <ObjectifPage objectif={objectif} plan={plan} project={project} onOpenFiche={onOpenFiche} />;
  }
  return <ObjectifsTable objectifs={project.objectifs} project={project} onOpen={openObjectif} />;
}

/** La barre livrées / total ; sans total publié, « — » plutôt qu'une barre à zéro. */
function Progress({ slug, shipped, total }: { slug: string; shipped: number; total: number }): JSX.Element {
  if (total <= 0) return <span className="meta">—</span>;
  return (
    <span
      className="obj-bar"
      role="progressbar"
      aria-label={`${slug} : ${shipped} livrées sur ${total}`}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={shipped}
    >
      <i style={{ width: `${(shipped / total) * 100}%` }} />
    </span>
  );
}

/** Le menu « ⋯ » d'une ligne : seulement des gestes qui existent côté méthode. */
function RowMenu({ o, onOpen }: { o: Objectif; onOpen: (slug: string) => void }): JSX.Element {
  const [menu, setMenu] = useState(false);
  const [hint, setHint] = useState(false);
  const first = o.aFaire[0];
  return (
    <span className="obj-menu">
      <button
        type="button"
        className="obj-dots"
        aria-label={`Actions de l’objectif ${o.slug}`}
        aria-haspopup="menu"
        aria-expanded={menu}
        onClick={() => setMenu((m) => !m)}
      >
        ⋯
      </button>
      {menu && (
        <span className="obj-popup" role="menu">
          {first && (
            <button type="button" role="menuitem" title={`/ezk-backlog groom ${first}`} onClick={() => setHint(true)}>
              Groomer ses fiches
            </button>
          )}
          {hint && first && <code>/ezk-backlog groom {first}</code>}
          <button type="button" role="menuitem" onClick={() => onOpen(o.slug)}>
            Ouvrir l’objectif
          </button>
        </span>
      )}
    </span>
  );
}

type BlockedFilter = '' | 'avec' | 'sans';

function FilterChip({ name, value, onRemove }: { name: string; value: string; onRemove: () => void }): JSX.Element {
  return (
    <button type="button" className="fchip" aria-label={`Retirer le filtre ${name}`} onClick={onRemove}>
      <b>{name}</b> {value} <span aria-hidden="true">×</span>
    </button>
  );
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
  const [status, setStatus] = useState<string>(DEFAULT_STATUS);
  const [version, setVersion] = useState<string>('');
  const [blocked, setBlocked] = useState<BlockedFilter>('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const rows = objectifs.filter((o) => o.slug !== PARKED);
  const parked = objectifs.find((o) => o.slug === PARKED);
  const rank = useMemo(() => new Map(rows.map((o, i) => [o.slug, i + 1])), [rows]);
  const statuses = useMemo(() => [...new Set([DEFAULT_STATUS, ...rows.map((o) => o.status)])], [rows]);
  const versions = useMemo(() => [...new Set(rows.flatMap((o) => o.versions))].sort(), [rows]);
  const needle = query.trim().toLowerCase();
  const filtered = rows.filter(
    (o) =>
      (status === '' || o.status === status) &&
      (version === '' || (version === '-' ? o.versions.length === 0 : o.versions.includes(version))) &&
      (blocked === '' || (blockedCount(o, project) > 0) === (blocked === 'avec')) &&
      (needle === '' || `${o.slug} ${o.nom ?? ''}`.toLowerCase().includes(needle)),
  );
  const shown = filtered.slice(0, limit);
  const anyChip = status !== '' || version !== '' || blocked !== '';
  const clearAll = (): void => {
    setStatus('');
    setVersion('');
    setBlocked('');
  };
  return (
    <>
      <PageHead title="Objectifs" />
      <section className="card" aria-label="Liste des objectifs">
        <h3>
          Objectifs
          <span className="obj-count">{rows.length} · dans l’ordre du plan</span>
          <InfoButton text={LIST_INFO} />
        </h3>
        <div className="obj-body">
          <div className="obj-filters">
            <input
              type="search"
              className="obj-search"
              placeholder="Rechercher un objectif…"
              aria-label="Rechercher un objectif"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrer par état">
              <option value="">État : tous</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusWords(s)}
                </option>
              ))}
            </select>
            <select value={version} onChange={(e) => setVersion(e.target.value)} aria-label="Filtrer par version">
              <option value="">Version : toutes</option>
              <option value="-">{NO_VERSION}</option>
              {versions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <select value={blocked} onChange={(e) => setBlocked(e.target.value as BlockedFilter)} aria-label="Filtrer par blocage">
              <option value="">Bloquées : toutes</option>
              <option value="avec">avec une fiche bloquée</option>
              <option value="sans">sans fiche bloquée</option>
            </select>
          </div>
          {anyChip && (
            <div className="obj-chips">
              {status !== '' && <FilterChip name="État" value={statusWords(status)} onRemove={() => setStatus('')} />}
              {version !== '' && (
                <FilterChip name="Version" value={version === '-' ? NO_VERSION : version} onRemove={() => setVersion('')} />
              )}
              {blocked !== '' && <FilterChip name="Bloquées" value={blocked} onRemove={() => setBlocked('')} />}
              <button type="button" className="linkbtn obj-clear" onClick={clearAll}>
                Tout effacer
              </button>
            </div>
          )}
        </div>
        <table className="tbl obj-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Objectif</th>
              <th>Nom</th>
              <th>Livrées / total</th>
              <th>Actives</th>
              <th>Versions portées</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.slug}>
                <td className="meta">{rank.get(o.slug)}</td>
                <td>
                  <button type="button" className="tag obj linkbtn obj-slug" title={o.nom ?? NO_NAME} onClick={() => onOpen(o.slug)}>
                    {o.slug}
                  </button>
                </td>
                <td className={o.nom ? undefined : 'meta'}>{o.nom ?? NO_NAME}</td>
                <td>
                  <Progress slug={o.slug} shipped={o.shipped} total={o.total} />
                  {o.total > 0 && <div className="obj-ratio">{`${o.shipped} / ${o.total}`}</div>}
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
                <td>
                  <RowMenu o={o} onOpen={onOpen} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="obj-empty meta">Aucun objectif ne correspond aux filtres.</p>}
        <div className="obj-foot">
          <span />
          {shown.length < filtered.length ? (
            <button type="button" className="linkbtn obj-more" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
              Afficher plus
            </button>
          ) : (
            <span />
          )}
          <span className="meta" role="status">
            {shown.length} sur {rows.length} objectifs
          </span>
        </div>
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
  plan,
  project,
  onOpenFiche,
}: {
  objectif: Objectif;
  plan: Objectif[];
  project: BoardProject;
  onOpenFiche: (id: string) => void;
}): JSX.Element {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const lots = project.versionsPage?.lots;
  const perVersion = o.versions.map((v) => {
    const lot = lots?.find((l) => l.version === v);
    return { v, n: lot ? lot.livrees.filter((id) => o.livrees.includes(id)).length : null };
  });
  const sansVersion = o.livrees.filter((id) => project.fiches?.[id] && !project.fiches[id]?.ver).length;
  const first = o.aFaire[0];
  const place = plan.findIndex((x) => x.slug === o.slug) + 1;
  const summary = [plural(o.total, 'fiche', 'fiches'), ...(place > 0 ? [`place ${place} sur ${plan.length}`] : [])];
  const livrees = o.livrees.slice(0, limit);
  return (
    <>
      <div className="vh">
        <h2>
          <span className="tag obj">{o.slug}</span> <span className={o.nom ? undefined : 'meta'}>{o.nom ?? NO_NAME}</span>
        </h2>
        <span className={`tag ${statusTag(o.status)}`}>{statusWords(o.status)}</span>
        {first && <CommandHint label="Groomer ses fiches" command={`/ezk-backlog groom ${first}`} />}
      </div>
      <p className="obj-summary meta" aria-label="Résumé de l’objectif">
        {summary.join(' · ')}
        {o.nom === null && <InfoButton text="Non publié par la méthode : le nom de l’objectif." />}
      </p>
      <section className="card">
        <h3>
          En-tête
          <InfoButton text="L’avancement de l’objectif et sa place dans l’ordre du plan, tels que la méthode les publie." />
        </h3>
        <div className="row">
          <span className="meta">Avancement</span>
          <span className="obj-progress">
            <Progress slug={o.slug} shipped={o.shipped} total={o.total} />
            <span>
              {o.total > 0 ? `${o.shipped} livrées / ${o.total}` : '—'} · {activesInWords(o, project)}
            </span>
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
        <div className="row">
          <span className="meta">Place dans le plan</span>
          <span>{place > 0 ? `place ${place} sur ${plan.length} dans l’ordre du plan` : 'non publié'}</span>
          <span />
        </div>
      </section>
      <section className="card">
        <h3>
          Fiches à faire
          <span className="obj-count">{o.aFaire.length}</span>
          <InfoButton text="Les fiches actives de l’objectif : priorité, étape et motif de blocage quand la méthode en publie un." />
        </h3>
        {o.aFaire.length === 0 ? (
          <div className="row">
            <span className="meta">rien à faire</span>
          </div>
        ) : (
          o.aFaire.map((id) => <FicheLine key={id} id={id} project={project} onOpenFiche={onOpenFiche} />)
        )}
      </section>
      <section className="card">
        <h3>
          Fiches livrées
          <span className="obj-count">{o.livrees.length}</span>
          <InfoButton text="Les fiches livrées de l’objectif, avec leur version ; « à étiqueter » = livrée sans numéro de version." />
        </h3>
        {livrees.map((id) => (
          <FicheLine
            key={id}
            id={id}
            project={project}
            onOpenFiche={onOpenFiche}
            extra={project.fiches?.[id]?.ver || 'à étiqueter'}
          />
        ))}
        <div className="obj-foot">
          <span />
          {livrees.length < o.livrees.length ? (
            <button type="button" className="linkbtn obj-more" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
              Afficher plus
            </button>
          ) : (
            <span />
          )}
          <span className="meta">
            {livrees.length} sur {o.livrees.length}
          </span>
        </div>
      </section>
    </>
  );
}
