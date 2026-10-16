/**
 * Board unifié cop1 — vue Fiches (fiche 20261012231419224).
 *
 * Les fiches d'un projet, en kanban (par statut) ou en liste. Un filtre les range
 * par CATÉGORIE de version (à venir / en cours / réalisées) ; par défaut on cache
 * l'archive (réalisées). Un sélecteur de lot repère la version en cours, et on
 * trie par priorité / statut / version / titre.
 */
import { useState } from 'react';
import { STATUS_LABEL } from './activity.js';
import { allVersions, isCurVer, svCmp, verCat, type VersionCategory } from './helpers.js';
import type { BoardProject, FicheDetail, FicheStatus } from './types.js';

const COL_LABEL: Record<FicheStatus, string> = {
  idea: 'Idées',
  ready: 'Prêtes',
  wip: 'En cours',
  done: 'Livrées',
};
const COLS: FicheStatus[] = ['idea', 'ready', 'wip', 'done'];
const PRIO_N: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
const ST_N: Record<FicheStatus, number> = { idea: 0, ready: 1, wip: 2, done: 3 };

type SortKey = 'prio' | 'statut' | 'version' | 'titre';
const SORTERS: Record<SortKey, (a: FicheDetail, b: FicheDetail) => number> = {
  prio: (a, b) => (PRIO_N[a.prio] ?? 9) - (PRIO_N[b.prio] ?? 9) || a.title.localeCompare(b.title),
  statut: (a, b) =>
    ST_N[a.status] - ST_N[b.status] || (PRIO_N[a.prio] ?? 9) - (PRIO_N[b.prio] ?? 9) || a.title.localeCompare(b.title),
  version: (a, b) => svCmp(a.ver, b.ver) || (PRIO_N[a.prio] ?? 9) - (PRIO_N[b.prio] ?? 9) || a.title.localeCompare(b.title),
  titre: (a, b) => a.title.localeCompare(b.title),
};

const CATEGORIES: Array<[VersionCategory, string]> = [
  ['avenir', 'à venir'],
  ['encours', 'en cours'],
  ['realisees', 'réalisées'],
];

interface FichesViewProps {
  project: BoardProject;
  onOpenFiche: (fid: string) => void;
  /** Recherche globale (barre du haut) : filtre les fiches par titre ou id. */
  query?: string;
}

function FicheRow({ f, onOpenFiche }: { f: FicheDetail; onOpenFiche: (fid: string) => void }): JSX.Element {
  return (
    <div
      className="fli"
      role="button"
      tabIndex={0}
      onClick={() => onOpenFiche(f.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenFiche(f.id);
        }
      }}
    >
      <span className={`prio ${f.prio}`}>{f.prio}</span>
      <span className={`stat s-${f.status}`}>{STATUS_LABEL[f.status]}</span>
      <span className="fn">{f.title}</span>
      <span className="pill ver" style={f.ver ? undefined : { visibility: 'hidden' }}>
        {f.ver || '—'}
      </span>
      <span className="faint">›</span>
    </div>
  );
}

export function FichesView({ project, onOpenFiche, query }: FichesViewProps): JSX.Element {
  const [fver, setFver] = useState<string>('all');
  const [fsort, setFsort] = useState<SortKey>('prio');
  const [fmode, setFmode] = useState<'status' | 'list'>('status');
  const [fcat, setFcat] = useState<Record<VersionCategory, boolean>>({
    avenir: true,
    encours: true,
    realisees: false,
  });

  const versionOptions = ['all', ...allVersions(project).map((v) => v.ver), 'sans version'];

  let list = Object.values(project.fiches ?? {});
  // Recherche globale : restreint aux fiches dont le titre ou l'id contient la requête.
  const q = (query ?? '').trim().toLowerCase();
  if (q) {
    list = list.filter((f) => f.title.toLowerCase().includes(q) || f.id.toLowerCase().includes(q));
  }
  if (fver === 'sans version') {
    list = list.filter((f) => !f.ver);
  } else if (fver !== 'all') {
    list = list.filter((f) => f.ver === fver);
  } else {
    // Filtre par catégorie. Une fiche sans catégorie (sans version, ou version hors
    // des listes du projet) n'est gouvernée par aucun toggle : on la montre ici, et
    // elle reste joignable par le lot « sans version ». Quand le vrai read-model
    // injectera des fiches sans version en nombre, prévoir un toggle dédié.
    list = list.filter((f) => {
      const c = verCat(project, f.ver);
      return c ? fcat[c] : true;
    });
  }
  list = list.slice().sort(SORTERS[fsort]);

  function toggleCat(c: VersionCategory): void {
    setFcat((prev) => ({ ...prev, [c]: !prev[c] }));
  }

  return (
    <>
      <div className="vh">
        <h2>Fiches — {project.name}</h2>
        <span className="sub">{list.length} fiche(s)</span>
      </div>

      <div className="toolbar">
        <label htmlFor="fversel">Lot</label>
        <select id="fversel" value={fver} onChange={(e) => setFver(e.target.value)}>
          {versionOptions.map((v) => (
            <option value={v} key={v}>
              {v === 'all'
                ? 'toutes versions'
                : v === 'sans version'
                  ? v
                  : v + (isCurVer(project, v) ? '  ● en cours' : '')}
            </option>
          ))}
        </select>

        {fver === 'all' && (
          <>
            <label>Afficher</label>
            <span className="seg" role="group" aria-label="Catégorie de version">
              {CATEGORIES.map(([c, lbl]) => (
                <button
                  key={c}
                  type="button"
                  className={fcat[c] ? 'on' : undefined}
                  aria-pressed={fcat[c]}
                  onClick={() => toggleCat(c)}
                >
                  {lbl}
                </button>
              ))}
            </span>
          </>
        )}

        <label htmlFor="fsort">Trier</label>
        <select id="fsort" value={fsort} onChange={(e) => setFsort(e.target.value as SortKey)}>
          <option value="prio">priorité</option>
          <option value="statut">statut</option>
          <option value="version">version</option>
          <option value="titre">titre</option>
        </select>

        <span className="seg" role="group" aria-label="Affichage">
          <button type="button" className={fmode === 'status' ? 'on' : undefined} aria-pressed={fmode === 'status'} onClick={() => setFmode('status')}>
            Par statut
          </button>
          <button type="button" className={fmode === 'list' ? 'on' : undefined} aria-pressed={fmode === 'list'} onClick={() => setFmode('list')}>
            En ligne
          </button>
        </span>
      </div>

      {fmode === 'status' ? (
        <section className="kanban">
          {COLS.map((c) => {
            const col = list.filter((f) => f.status === c);
            return (
              <div className="col" key={c}>
                <h4>
                  {COL_LABEL[c]} <span className="cnt">{col.length}</span>
                </h4>
                {col.length === 0 ? (
                  <div className="fcard muted" style={{ cursor: 'default' }}>
                    —
                  </div>
                ) : (
                  col.map((f) => (
                    <div
                      className="fcard"
                      role="button"
                      tabIndex={0}
                      key={f.id}
                      onClick={() => onOpenFiche(f.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenFiche(f.id);
                        }
                      }}
                    >
                      <div className="ft">{f.title}</div>
                      <div className="fm">
                        <span className={`prio ${f.prio}`}>{f.prio}</span>
                        <span className="pill ver">{f.ver || 'sans version'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </section>
      ) : (
        <section className="card flist">
          {list.length === 0 ? (
            <div className="muted" style={{ padding: '11px 16px' }}>
              aucune fiche
            </div>
          ) : (
            list.map((f) => <FicheRow key={f.id} f={f} onOpenFiche={onOpenFiche} />)
          )}
        </section>
      )}
    </>
  );
}
