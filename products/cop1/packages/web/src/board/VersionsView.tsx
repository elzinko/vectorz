/**
 * Board unifié cop1 — pages Versions et Une version (fiche 20261124111115783).
 *
 * Une version est une coupe : une étiquette git posée sur ce qui est livré. La page dit ce qui attend
 * d'être versionné, les versions en construction, puis les versions étiquetées ; un clic ouvre la page
 * d'une version. Tout vient de `ezk board show --json`. La coupe reste un geste du PO : le bouton
 * montre la commande, il n'écrit rien.
 */
import { useState } from 'react';
import { CommandHint, Crumbs, FicheLine, Unavailable, ageLabel, planUnavailable } from './PlanBits.js';
import type { BoardProject, ProchaineCoupe, VersionLot } from './types.js';

const NOT_PUBLISHED = 'non publié';

/** Les mots de l'état publié par la méthode (tableau de la fiche 20261124111115783). */
export const ETAT_WORDS: Record<string, string> = {
  'en-cours': 'en construction',
  'a-clore': "à clore : tout est livré, l'étiquette manque",
  livree: 'étiquetée',
  rouverte: 'rouverte',
  vide: 'vide',
};
const etatWords = (e: string): string => ETAT_WORDS[e] ?? e;

const CYCLE_WORDS: Record<string, string> = {
  brouillon: 'en construction',
  figee: 'figée',
  livree: 'livrée',
};

/** Le contenu d'un lot en mots : livrées, à faire, prêtes, bloquées. */
function contentWords(l: VersionLot): string {
  const parts = [`${l.livrees.length} livrées`];
  if (l.aFaire.length > 0) parts.push(`${l.aFaire.length} à faire`);
  if (l.pretes.length > 0) parts.push(`${l.pretes.length} prêtes`);
  if (l.bloquees.length > 0) parts.push(`${l.bloquees.length} bloquées`);
  if (l.aFaire.length === 0) parts.push('rien à faire');
  return parts.join(' · ');
}

/** Combien de fiches de la version tombent dans chacun de ses objectifs, publiés par la méthode. */
function objectifsOfLot(l: VersionLot, project: BoardProject): { slug: string; here: number | null }[] {
  const ids = [...l.livrees, ...l.aFaire];
  return l.milestones.map((slug) => {
    const o = project.objectifs?.find((x) => x.slug === slug);
    return { slug, here: o ? ids.filter((id) => o.livrees.includes(id) || o.aFaire.includes(id)).length : null };
  });
}

export interface VersionsViewProps {
  project: BoardProject;
  onOpenFiche: (id: string) => void;
  /** L'instant de référence des âges ; défaut maintenant (les tests le figent). */
  now?: Date;
}

export function VersionsView({ project, onOpenFiche, now }: VersionsViewProps): JSX.Element {
  const [open, setOpen] = useState<string | null>(null);
  const page = project.versionsPage;
  const reason =
    planUnavailable(project) ??
    (page ? null : 'la méthode installée ne publie pas les versions en entier (mettre ezk à jour)');
  if (reason !== null || !page) {
    return (
      <>
        <div className="vh">
          <h2>Versions</h2>
        </div>
        <Unavailable what="versions" reason={reason ?? ''} />
      </>
    );
  }
  const lot = open ? page.lots.find((l) => l.version === open) : undefined;
  if (lot) {
    return (
      <VersionPage lot={lot} project={project} onOpenFiche={onOpenFiche} onBack={() => setOpen(null)} now={now} />
    );
  }
  const tagged = page.lots.filter((l) => l.etiquette !== null).reverse();
  const building = page.lots.filter((l) => l.etiquette === null);
  return (
    <>
      <div className="vh">
        <h2>Versions</h2>
        <span className="sub">{tagged.length} versions étiquetées</span>
      </div>
      <ToVersion coupe={page.prochaineCoupe} lots={page.lots} now={now} />
      <section className="card">
        <h3>En construction — {building.length}</h3>
        {building.length === 0 ? (
          <div className="row">
            <span className="meta">aucune version sans étiquette</span>
          </div>
        ) : (
          building.map((l) => (
            <div key={l.version} className="row">
              <button type="button" className="doclink linkbtn" onClick={() => setOpen(l.version)}>
                {l.version}
              </button>
              <span>
                <span className="ttl">{l.nom ?? NOT_PUBLISHED}</span>{' '}
                <span className="pill">{etatWords(l.etat)}</span>
              </span>
              <span className="meta">{contentWords(l)}</span>
            </div>
          ))
        )}
      </section>
      <section className="card">
        <h3>Versions étiquetées — {tagged.length}</h3>
        <table className="tbl">
          <thead>
            <tr>
              <th>Version</th>
              <th>Nom</th>
              <th>Livrées</th>
              <th>Objectifs</th>
              <th>Étiquetée</th>
            </tr>
          </thead>
          <tbody>
            {tagged.map((l) => (
              <tr key={l.version}>
                <td>
                  <button type="button" className="doclink linkbtn" onClick={() => setOpen(l.version)}>
                    {l.version}
                  </button>
                </td>
                <td className={l.nom ? undefined : 'meta'}>{l.nom ?? NOT_PUBLISHED}</td>
                <td>{l.livrees.length}</td>
                <td>
                  {objectifsOfLot(l, project).map(({ slug, here }) => (
                    <span key={slug} className="pill">
                      {slug}
                      {here !== null ? ` · ${here}` : ''}
                    </span>
                  ))}
                </td>
                <td className="meta">{ageLabel(l.dateEtiquette, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function ToVersion({
  coupe,
  lots,
  now,
}: {
  coupe: ProchaineCoupe;
  lots: VersionLot[];
  now?: Date;
}): JSX.Element {
  const last = coupe.derniereEtiquette;
  const lastDate = last ? (lots.find((l) => l.etiquette === last)?.dateEtiquette ?? null) : null;
  const target = coupe.numeroPropose ?? '<vX.Y.Z>';
  return (
    <section className="card">
      <h3>À versionner</h3>
      <div className="row">
        <span className="meta">Depuis</span>
        <span>
          {last ?? 'aucune étiquette'}
          {last && <span className="meta"> · {ageLabel(lastDate, now)}</span>}
        </span>
        <span>{coupe.nombre === null ? `fiches livrées depuis : ${NOT_PUBLISHED}` : `${coupe.nombre} fiches livrées depuis`}</span>
      </div>
      <div className="row">
        <span className="meta">Gate de release</span>
        <span>
          {coupe.gate === null ? (
            'aucun verdict publié'
          ) : (
            <>
              <span className={`pill ${coupe.gate.verdict === 'GO' ? 'rc-used' : 'rc-missing'}`}>
                {coupe.gate.verdict}
              </span>{' '}
              <span className="meta">
                {coupe.gate.version} ·{' '}
                {coupe.gate.passes
                  .map((p) => `${p.title} : ${p.sautee ? 'sautée' : p.go ? 'GO' : 'NO-GO'}`)
                  .join(' · ')}
              </span>
            </>
          )}
        </span>
        <span />
      </div>
      <div className="row">
        <span className="meta">Prochaine version</span>
        <span>{coupe.numeroPropose ?? `numéro ${NOT_PUBLISHED}`}</span>
        <CommandHint label="Versionner" command={`ezk backlog version tag ${target}`} />
      </div>
    </section>
  );
}

function VersionPage({
  lot: l,
  project,
  onOpenFiche,
  onBack,
  now,
}: {
  lot: VersionLot;
  project: BoardProject;
  onOpenFiche: (id: string) => void;
  onBack: () => void;
  now?: Date;
}): JSX.Element {
  return (
    <>
      <Crumbs label="Fil d'Ariane des versions" items={[{ label: 'Versions', onClick: onBack }, { label: l.version }]} />
      <div className="vh">
        <h2>{l.version}</h2>
        <span className="sub">{l.nom ?? `nom ${NOT_PUBLISHED}`}</span>
        <span className="pill">{etatWords(l.etat)}</span>
        {l.etiquette === null && <CommandHint label={`Versionner ${l.version}`} command={`ezk backlog version tag ${l.version}`} />}
      </div>
      <section className="card">
        <h3>En-tête</h3>
        <div className="row">
          <span className="meta">État</span>
          <span>{etatWords(l.etat)}</span>
          <span />
        </div>
        <div className="row">
          <span className="meta">Cycle de vie</span>
          <span>en construction → figée → livrée. Ici : {CYCLE_WORDS[l.cycleDeVie] ?? l.cycleDeVie}</span>
          <span />
        </div>
        <div className="row">
          <span className="meta">Contenu</span>
          <span>{contentWords(l)}</span>
          <span />
        </div>
        <div className="row">
          <span className="meta">Étiquette posée</span>
          <span>{l.dateEtiquette ? `${l.dateEtiquette.slice(0, 10)} · ${ageLabel(l.dateEtiquette, now)}` : 'pas encore'}</span>
          <span />
        </div>
      </section>
      <section className="card">
        <h3>Objectifs de cette version — {l.milestones.length}</h3>
        {l.milestones.length === 0 ? (
          <div className="row">
            <span className="meta">aucun objectif posé sur ses fiches</span>
          </div>
        ) : (
          objectifsOfLot(l, project).map(({ slug, here }) => {
            const o = project.objectifs?.find((x) => x.slug === slug);
            return (
              <div key={slug} className="row">
                <span className="ttl">{slug}</span>
                <span className="meta">{o?.nom ?? 'nom non publié'}</span>
                <span className="meta">
                  {here !== null ? `${here} fiches ici` : 'fiches ici : non publié'}
                  {o ? ` · ${o.shipped} / ${o.total} livrées au total` : ''}
                </span>
              </div>
            );
          })
        )}
      </section>
      <section className="card">
        <h3>Qui l'a livrée</h3>
        <div className="row">
          <span className="meta">non publié : la méthode ne publie pas les lancements par version.</span>
        </div>
      </section>
      <section className="card">
        <h3>Fiches livrées — {l.livrees.length}</h3>
        {l.livrees.map((id) => (
          <FicheLine key={id} id={id} project={project} onOpenFiche={onOpenFiche} />
        ))}
      </section>
      <section className="card">
        <h3>Fiches à faire — {l.aFaire.length}</h3>
        {l.aFaire.length === 0 ? (
          <div className="row">
            <span className="meta">rien à faire</span>
          </div>
        ) : (
          l.aFaire.map((id) => <FicheLine key={id} id={id} project={project} onOpenFiche={onOpenFiche} />)
        )}
      </section>
    </>
  );
}
