/**
 * Page Fiches (fiche 20261126170000103) : la liste filtrable de la maquette, le kanban sous l'icône
 * « Colonnes ». Les parkées sont masquées au départ, avec leur puce. Rien n'est simulé : un geste que la
 * méthode n'offre pas (parker, lever un blocage) n'est pas dans le menu « ⋯ ».
 */
import { useState, type ReactNode } from 'react';
import { InfoButton } from './Chrome.js';
import { FichesKanban } from './FichesKanban.js';
import {
  applyCriteria,
  buildRows,
  EMPTY_FILTERS,
  filterOptions,
  isGroomable,
  STAGE_LABEL,
  type FilterKey,
  type Filters,
  type ListRow,
} from './fichesListModel.js';
import type { BoardProject } from './types.js';

interface FichesViewProps {
  project: BoardProject;
  onOpenFiche: (fid: string) => void;
  /** Recherche globale (barre du haut). */
  query?: string;
}

const FILTER_LABEL: Record<FilterKey, string> = {
  etape: 'Étape',
  drapeau: 'Drapeau',
  objectif: 'Objectif',
  version: 'Version',
  priorite: 'Priorité',
};
const FILTER_KEYS = Object.keys(FILTER_LABEL) as FilterKey[];

function FilterMenu({ label, options, picked, onToggle }: { label: string; options: string[]; picked: string[]; onToggle: (v: string) => void }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <span className="fmenu">
      <button type="button" className="tgl" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      {open && (
        <div className="fpop" role="menu" aria-label={label}>
          {options.map((o) => (
            <button key={o} type="button" role="menuitemcheckbox" aria-checked={picked.includes(o)} className={picked.includes(o) ? 'on' : undefined} onClick={() => onToggle(o)}>
              {o}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

function RowMenu({ onOpen }: { onOpen: () => void }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <span className="fmenu">
      <button type="button" className="rmore" aria-label="Actions de la fiche" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        ⋯
      </button>
      {open && (
        <div className="fpop right" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpen();
            }}
          >
            Ouvrir la fiche
          </button>
        </div>
      )}
    </span>
  );
}

function Avis({ r }: { r: ListRow }): JSX.Element | null {
  if (r.stage !== 'livree') return null;
  const v = r.fiche.verdict;
  if (!v) return <span className="faint" title="avis non publié">—</span>;
  return (
    <span className={`pill avis ${v}`} role="img" aria-label={v === 'up' ? 'pouce levé' : 'pouce baissé'}>
      {v === 'up' ? '▲' : '▼'}
    </span>
  );
}

function FichesList({ project, onOpenFiche, query, switcher }: FichesViewProps & { switcher: ReactNode }): JSX.Element {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [hideParked, setHideParked] = useState(true);

  const all = buildRows(project);
  const objName = new Map((project.objectifs ?? []).map((o) => [o.slug, o.nom] as const).filter((e): e is readonly [string, string] => e[1] !== null));
  const options = filterOptions(all);
  const shown = applyCriteria(all, { searches: [search, query ?? ''], filters, hideParked });

  function toggle(key: FilterKey, value: string): void {
    setFilters((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }));
    if (key === 'drapeau' && value === 'parkée') setHideParked(false);
  }
  const chips = FILTER_KEYS.flatMap((k) => filters[k].map((v) => ({ key: k, value: v, text: `${FILTER_LABEL[k]} : ${v}` })));
  function clearAll(): void {
    setFilters(EMPTY_FILTERS);
    setSearch('');
    setHideParked(false);
  }

  return (
    <>
      <div className="vh">
        <h2>Fiches — {project.name}</h2>
        <InfoButton text="La liste des fiches du projet, une ligne chacune. Les parkées (mises de côté) sont masquées au départ ; retire leur puce pour les voir." />
        {switcher}
      </div>

      <div className="fbar">
        <input type="search" aria-label="Rechercher une fiche" placeholder="Rechercher une fiche" value={search} onChange={(e) => setSearch(e.target.value)} />
        {FILTER_KEYS.map((k) => (
          <FilterMenu key={k} label={FILTER_LABEL[k]} options={options[k]} picked={filters[k]} onToggle={(v) => toggle(k, v)} />
        ))}
        <span className="fres">{shown.length} résultats</span>
      </div>

      {(hideParked || chips.length > 0) && (
        <div className="fbar">
          {hideParked && (
            <span className="achip">
              <span>parkée : masquée</span>
              <button type="button" className="x" aria-label="Retirer le filtre parkée : masquée" onClick={() => setHideParked(false)}>
                ×
              </button>
            </span>
          )}
          {chips.map((c) => (
            <span className="achip" key={`${c.key}-${c.value}`}>
              <span>{c.text}</span>
              <button type="button" className="x" aria-label={`Retirer le filtre ${c.text}`} onClick={() => toggle(c.key, c.value)}>
                ×
              </button>
            </span>
          ))}
          <button type="button" className="lnkb" onClick={clearAll}>
            Tout effacer
          </button>
        </div>
      )}

      <section className="card">
        <h3 className="fhead">
          <span>Fiches</span>
          <span className="fcount">
            {shown.length} affichées sur {all.length}
          </span>
          <InfoButton text="Une ligne par fiche. Le titre complet s'affiche au survol. Les gestes que la méthode n'offre pas ne sont pas proposés." />
        </h3>
        <table className="tbl ftbl" aria-label="Fiches">
          <thead>
            <tr>
              <th>Fiche</th>
              <th>Étape</th>
              <th>Priorité</th>
              <th>Objectif</th>
              <th>Version</th>
              <th>Bloquée</th>
              <th>Avis</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={8} className="muted">
                  aucune fiche
                </td>
              </tr>
            ) : (
              shown.map((r) => (
                <tr key={r.fiche.id}>
                  <td className="ftitle">
                    <button type="button" className="linkbtn" title={r.fiche.title} onClick={() => onOpenFiche(r.fiche.id)}>
                      {r.fiche.title}
                    </button>
                  </td>
                  <td>{STAGE_LABEL[r.stage]}</td>
                  <td>
                    <span className={`prio ${r.fiche.prio}`}>{r.fiche.prio}</span>
                  </td>
                  <td>{r.objectif ? <span className="tag obj" title={objName.get(r.objectif) ?? "nom non publié"}>{r.objectif}</span> : null}</td>
                  <td>{r.fiche.ver ? <span className="pill ver">{r.fiche.ver}</span> : <span className="faint">—</span>}</td>
                  <td>{r.fiche.blocked ? <span className="pill blocked" title="motif brut : la méthode ne publie pas encore son libellé en français">{r.fiche.blocked}</span> : null}</td>
                  <td>
                    <Avis r={r} />
                  </td>
                  <td className="rowact">
                    {isGroomable(r) && (
                      <button type="button" className="tgl" title={`ezk backlog groom ${r.fiche.id}`} aria-disabled="true">
                        Groomer
                      </button>
                    )}
                    <RowMenu onOpen={() => onOpenFiche(r.fiche.id)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}

export function FichesView({ project, onOpenFiche, query }: FichesViewProps): JSX.Element {
  const [mode, setMode] = useState<'liste' | 'colonnes'>('liste');
  const switcher = (
    <span className="seg vsw" role="group" aria-label="Affichage des fiches">
      <button type="button" className={mode === 'liste' ? 'on' : undefined} aria-pressed={mode === 'liste'} onClick={() => setMode('liste')}>
        Liste
      </button>
      <button type="button" className={mode === 'colonnes' ? 'on' : undefined} aria-pressed={mode === 'colonnes'} onClick={() => setMode('colonnes')}>
        Colonnes
      </button>
    </span>
  );
  return mode === 'liste' ? (
    <FichesList project={project} onOpenFiche={onOpenFiche} query={query} switcher={switcher} />
  ) : (
    <FichesKanban project={project} onOpenFiche={onOpenFiche} query={query} switcher={switcher} />
  );
}
