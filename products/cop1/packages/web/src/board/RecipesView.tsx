/**
 * Board unifié cop1 — vue Recettes (fiches 20261104090518109 et 20261126170000111).
 *
 * Une liste compacte : le catalogue de la méthode et les recettes du projet réunis, avec recherche, filtres
 * (toutes, prêtes, ajoutées), une ligne par recette et « Afficher plus ». Tout vient de `ezk recipes --json`,
 * servi par le daemon (`/api/recipes/<projet>`) : la vue ne devine rien. Pas de bouton « Ajouter » : la
 * méthode n'offre aucun geste d'ajout de recette que le daemon relaie.
 */
import { useEffect, useState } from 'react';
import type { BoardProject } from './types.js';
import { InfoButton, PageHead } from './Chrome.js';

/** Une recette telle que la méthode la publie. */
export interface Recipe {
  id: string;
  title: string;
  makes: string;
  status: string;
  source: string;
  dir: string;
  complete: boolean;
  missing: string[];
  /** Implémentée dans ce projet : déclarée par lui, ou sa source y mène (fiche 20261104103403956). */
  ici?: boolean;
}

interface RecipesData {
  catalogue: Recipe[];
  projet: Recipe[];
}

type RecipesState = { kind: 'loading' } | { kind: 'ok'; recipes: RecipesData } | { kind: 'unavailable'; reason: string };

/** Délai avant de redemander les recettes quand le daemon les lit encore. */
const LOADING_RETRY_MS = 2000;
const NOT_PUBLISHED = 'non publié';
/** Lignes montrées d'emblée, et ajoutées à chaque « Afficher plus » (comme la maquette). */
const PAGE_SIZE = 7;
const INFO =
  'Le catalogue de la méthode réuni aux recettes du projet. « Ajoutée » = implémentée dans ce projet. Une recette incomplète (champ requis manquant) est signalée. Source : ezk recipes --json.';
const FILTERS = [
  { id: 'all', label: 'toutes' },
  { id: 'ready', label: 'prêtes' },
  { id: 'added', label: 'ajoutées' },
] as const;
type FilterId = (typeof FILTERS)[number]['id'];

/** Une recette de la liste, avec sa marque « ajoutée » (calculée depuis `ici` et les recettes du projet). */
interface Row {
  recipe: Recipe;
  added: boolean;
}

/** Catalogue + recettes du projet, sans doublon ; ajoutée = déclarée par le projet ou implémentée ici. */
function mergeRecipes({ catalogue, projet }: RecipesData): Row[] {
  const declared = new Set(projet.map((r) => r.id));
  const known = new Set(catalogue.map((r) => r.id));
  const fromCatalogue = catalogue.map((recipe) => ({ recipe, added: recipe.ici === true || declared.has(recipe.id) }));
  const projectOnly = projet.filter((r) => !known.has(r.id)).map((recipe) => ({ recipe, added: true }));
  return [...fromCatalogue, ...projectOnly];
}

/** L'état tel que la méthode le publie, écrit en français. */
function statusLabel(status: string): string {
  if (status === 'ready') return 'prête';
  if (status === 'draft') return 'brouillon';
  return status || NOT_PUBLISHED;
}

function RecipeRow({ row }: { row: Row }): JSX.Element {
  const { recipe: r, added } = row;
  return (
    <li className="rcp">
      <div className="rcp-b">
        <b className="rcp-t">{r.title || r.id}</b>
        <span className="rcp-d">{r.makes || NOT_PUBLISHED}</span>
      </div>
      <span className={r.status === 'ready' ? 'tag ok' : 'tag idea'}>{statusLabel(r.status)}</span>
      <span className="rcp-a">
        {added && <span className="tag ok">Ajoutée</span>}
        {!r.complete && (
          <span className="tag warn" title={`Champs requis absents : ${r.missing.length > 0 ? r.missing.join(', ') : 'front-matter illisible'}`}>
            Incomplète
          </span>
        )}
      </span>
    </li>
  );
}

function RecipesList({ data }: { data: RecipesData }): JSX.Element {
  const [filter, setFilter] = useState<FilterId>('all');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const rows = mergeRecipes(data);
  const addedCount = rows.filter((r) => r.added).length;
  const needle = query.trim().toLowerCase();
  const filtered = rows.filter(
    ({ recipe: r, added }) =>
      (filter === 'all' || (filter === 'ready' ? r.status === 'ready' : added)) &&
      (needle === '' || `${r.title || r.id} ${r.makes}`.toLowerCase().includes(needle)),
  );
  const visible = filtered.slice(0, limit);
  return (
    <>
      <PageHead title="Recettes" />
      <section className="card" aria-label="Recettes disponibles">
        <h3>
          <span>
            Recettes disponibles{' '}
            <span className="cnt">
              {rows.length} · {addedCount} ajoutées
            </span>
          </span>
          <InfoButton text={INFO} />
        </h3>
        <div className="rcp-body">
          <div className="rcp-filters">
            <input
              type="search"
              className="rcp-search"
              placeholder="Rechercher une recette…"
              aria-label="Rechercher une recette"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE_SIZE);
              }}
            />
            <span className="seg" role="group" aria-label="Filtre">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={filter === f.id ? 'on' : undefined}
                  aria-pressed={filter === f.id}
                  onClick={() => {
                    setFilter(f.id);
                    setLimit(PAGE_SIZE);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </span>
          </div>
          {filtered.length === 0 ? (
            <p className="mnote">{rows.length === 0 ? 'aucune recette publiée' : 'aucune recette ne correspond'}</p>
          ) : (
            <ul className="rcp-list" aria-label="Recettes">
              {visible.map((row) => (
                <RecipeRow key={`${row.recipe.dir}:${row.recipe.id}`} row={row} />
              ))}
            </ul>
          )}
          <div className="rcp-foot">
            <span />
            {visible.length < filtered.length ? (
              <button type="button" className="linkbtn rcp-more" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                Afficher plus
              </button>
            ) : (
              <span />
            )}
            <span className="meta" role="status">
              {visible.length} sur {filtered.length} recettes
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

export function RecipesView({ project }: { project: BoardProject }): JSX.Element {
  const [state, setState] = useState<RecipesState>({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = (): void => {
      fetch(`/api/recipes/${encodeURIComponent(project.name)}`)
        .then(async (res) => {
          const body = (await res.json()) as { state?: string; recipes?: RecipesData; reason?: string; error?: string };
          if (!alive) return;
          if (body.state === 'ok' && body.recipes) setState({ kind: 'ok', recipes: body.recipes });
          else if (body.state === 'loading') {
            setState({ kind: 'loading' });
            timer = setTimeout(load, LOADING_RETRY_MS);
          } else setState({ kind: 'unavailable', reason: body.reason ?? body.error ?? `réponse ${res.status}` });
        })
        .catch(() => {
          if (alive) setState({ kind: 'unavailable', reason: 'serveur de mission control injoignable' });
        });
    };
    setState({ kind: 'loading' });
    load();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [project.name]);

  if (state.kind === 'ok') return <RecipesList data={state.recipes} />;
  return (
    <>
      <PageHead title="Recettes" />
      <section className="card">
        <div className="row">
          <span className="ttl" role="status">
            {state.kind === 'loading' ? 'recettes en cours de lecture' : `recettes indisponibles : ${state.reason}`}
          </span>
        </div>
      </section>
    </>
  );
}
