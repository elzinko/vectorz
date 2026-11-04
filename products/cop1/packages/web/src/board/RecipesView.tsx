/**
 * Board unifié cop1 — vue Recettes (fiche 20261104090518109).
 *
 * Les recettes que le projet affiché déclare, avec le dossier qui les implémente, puis le catalogue de la
 * méthode, chaque recette avec ce qu'elle fabrique et son implémentation de référence. Tout vient de
 * `ezk recipes --json`, servi par le daemon (`/api/recipes/<projet>`) : la vue ne devine rien.
 */
import { useEffect, useState } from 'react';
import type { BoardProject } from './types.js';

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

function Missing({ r }: { r: Recipe }): JSX.Element | null {
  if (r.complete) return null;
  return (
    <span className="pill rc-missing" title="Champs requis absents de la recette">
      incomplète : {r.missing.length > 0 ? r.missing.join(', ') : 'front-matter illisible'}
    </span>
  );
}

function StatusPill({ status }: { status: string }): JSX.Element {
  return <span className={`pill rc-status rc-${status || 'none'}`}>{status || 'sans statut'}</span>;
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

  const header = (
    <div className="vh">
      <h2>Recettes — {project.name}</h2>
      <span className="sub">ce que ce projet implémente, et le catalogue de la méthode</span>
    </div>
  );

  if (state.kind !== 'ok') {
    return (
      <>
        {header}
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

  const { catalogue, projet } = state.recipes;
  // Ce que le projet implémente : ses recettes déclarées, puis celles du catalogue dont l'implémentation
  // de référence vit ici (publié par la méthode, la page ne devine rien).
  const fromCatalogue = catalogue.filter((r) => r.ici === true);
  const usedHere = new Set([...projet.map((r) => r.id), ...fromCatalogue.map((r) => r.id)]);
  const total = projet.length + fromCatalogue.length;
  return (
    <>
      {header}

      <section className="card clip" aria-label="Recettes du projet">
        <h3>
          Dans ce projet <span className="cnt">{total}</span>
        </h3>
        {total === 0 ? (
          <p className="mnote">
            ce projet ne déclare aucune recette : un dossier qui en implémente une porte un <code>RECIPE.md</code>
          </p>
        ) : (
          <div className="rc-list">
            {projet.map((r) => (
              <div className="rc-row" key={`${r.dir}:${r.id}`}>
                <div className="rc-main">
                  <b>{r.title || r.id}</b>
                  <span className="rc-makes">{r.makes}</span>
                </div>
                <code className="rc-dir" title="Dossier qui implémente la recette">
                  {r.dir}
                </code>
                <StatusPill status={r.status} />
                <Missing r={r} />
              </div>
            ))}
            {fromCatalogue.map((r) => (
              <div className="rc-row" key={`cat:${r.id}`}>
                <div className="rc-main">
                  <b>{r.title || r.id}</b>
                  <span className="rc-makes">{r.makes}</span>
                </div>
                <code className="rc-dir" title="Implémentation de référence, dans ce projet">
                  {r.source}
                </code>
                <StatusPill status={r.status} />
                <Missing r={r} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Catalogue de la méthode">
        <h3 className="rc-h">
          Catalogue de la méthode <span className="cnt">{catalogue.length}</span>
        </h3>
        <div className="rc-grid">
          {catalogue.map((r) => (
            <article className={usedHere.has(r.id) ? 'card rc-card used' : 'card rc-card'} key={r.id}>
              <div className="rc-top">
                <b>{r.title || r.id}</b>
                {usedHere.has(r.id) && <span className="pill rc-used">utilisée ici</span>}
              </div>
              <p className="rc-makes">{r.makes || '—'}</p>
              <div className="rc-foot">
                <StatusPill status={r.status} />
                <Missing r={r} />
              </div>
              <div className="rc-src">
                implémentation de référence : <code>{r.source || 'non déclarée'}</code>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
