/**
 * Board unifié cop1 — vue Cartes (fiche 20261102123552184).
 *
 * Les documents de la méthode (carte de la méthode, schémas, benchmark), tels que `ezk board maps` les
 * liste. Un clic en ouvre un dans un cadre isolé : ses scripts tournent, mais ne lisent rien de
 * mission control. Le daemon ne sert que ce que la méthode a listé ; sans la méthode, la vue dit pourquoi.
 */
import { useEffect, useState } from 'react';
import type { BoardProject } from './types.js';

interface MapDocument {
  id: string;
  titre: string;
  type: 'html' | 'svg';
  fichier: string;
}

type MapsState = { kind: 'loading' } | { kind: 'unavailable'; reason: string } | { kind: 'ok'; documents: MapDocument[] };

const mapsUrl = (projet: string, ...rest: string[]): string =>
  ['/api/maps', projet, ...rest].map((p, i) => (i === 0 ? p : encodeURIComponent(p))).join('/');

export function MapsView({ project }: { project: BoardProject }): JSX.Element {
  const [state, setState] = useState<MapsState>({ kind: 'loading' });
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setState({ kind: 'loading' });
    setOpenId(null);
    fetch(mapsUrl(project.name))
      .then(async (res) => {
        const body = (await res.json()) as { documents?: MapDocument[]; error?: string };
        if (!alive) return;
        if (res.ok && Array.isArray(body.documents)) setState({ kind: 'ok', documents: body.documents });
        else setState({ kind: 'unavailable', reason: body.error ?? `réponse ${res.status}` });
      })
      .catch(() => {
        if (alive) setState({ kind: 'unavailable', reason: 'serveur de mission control injoignable' });
      });
    return () => {
      alive = false;
    };
  }, [project.name]);

  const open = state.kind === 'ok' ? state.documents.find((d) => d.id === openId) : undefined;
  return (
    <>
      <div className="vh">
        <h2>Cartes</h2>
        <span className="sub">les documents de la méthode : sa carte, ses schémas</span>
      </div>
      {state.kind !== 'ok' ? (
        <section className="card">
          <div className="row">
            <span className="ttl" role="status">
              {state.kind === 'loading' ? 'cartes en cours de lecture' : `cartes indisponibles : ${state.reason}`}
            </span>
          </div>
        </section>
      ) : (
        <section className="maps">
          <div className="card">
            <h3>Documents — {state.documents.length}</h3>
            {state.documents.map((d) => (
              <button
                type="button"
                key={d.id}
                className={d.id === openId ? 'mapitem on' : 'mapitem'}
                aria-pressed={d.id === openId}
                onClick={() => setOpenId(d.id)}
              >
                <span className="ttl">{d.titre}</span>
                <span className="meta">{d.type.toUpperCase()}</span>
              </button>
            ))}
          </div>
          {open ? (
            <iframe
              className="mapframe"
              title={open.titre}
              src={mapsUrl(project.name, open.id, open.fichier)}
              sandbox="allow-scripts"
            />
          ) : (
            <div className="card mapempty">Choisis un document pour l'ouvrir.</div>
          )}
        </section>
      )}
    </>
  );
}
