/**
 * Lit un contrat que le daemon relaie par projet (`GET /api/<chemin>/<projet>`). Commun aux cartes
 * (Process, Carte de la méthode) : jamais de donnée inventée quand le contrat manque.
 *
 * Re-tentatives mesurées (fiche 20261117135600942) : tant que le daemon lit encore, on redemande
 * toutes les 2 s, au plus 30 fois ; après une erreur réseau, on redemande après 2, 4 puis 8 s. Au-delà,
 * la carte dit pourquoi elle s'arrête.
 */
import { useEffect, useState } from 'react';

export type ContractState<T> =
  | { kind: 'loading' }
  | { kind: 'ok'; contract: T }
  | { kind: 'unavailable'; reason: string };

/** Délai avant de redemander le contrat quand le daemon le lit encore. */
const LOADING_RETRY_MS = 2000;
/** Nombre de demandes au plus pendant que le daemon lit encore : une minute. */
const MAX_LOADING_TRIES = 30;
/** Délais avant chaque nouvelle demande après une erreur réseau. */
const NETWORK_RETRY_MS = [2000, 4000, 8000] as const;

interface Reading {
  path: string;
  /** Le champ de la réponse qui porte le contrat (`process`, `graph`). */
  field: string;
  isUsable: (value: unknown) => boolean;
  incompleteReason: string;
}

export function useDaemonContract<T>(projectName: string, reading: Reading): ContractState<T> {
  const [state, setState] = useState<ContractState<T>>({ kind: 'loading' });
  const { path, field, isUsable, incompleteReason } = reading;
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let loadingTries = 0;
    let networkFailures = 0;
    const load = (): void => {
      fetch(`/api/${path}/${encodeURIComponent(projectName)}`)
        .then(async (res) => {
          // Le serveur a répondu : une réponse illisible n'est pas une coupure réseau, on ne re-tente pas
          // (fiche 20261117150145880).
          let body: Record<string, unknown> & { state?: string; reason?: string; error?: string };
          try {
            body = (await res.json()) as typeof body;
            // Un JSON valide mais qui n'est pas un objet (`null`, un nombre) est tout aussi illisible.
            if (typeof body !== 'object' || body === null) throw new TypeError('réponse sans objet');
          } catch {
            if (alive) setState({ kind: 'unavailable', reason: `réponse illisible du daemon (HTTP ${res.status})` });
            return;
          }
          if (!alive) return;
          networkFailures = 0;
          if (body.state === 'ok') {
            const contract = body[field];
            setState(
              isUsable(contract) ? { kind: 'ok', contract: contract as T } : { kind: 'unavailable', reason: incompleteReason },
            );
          } else if (body.state === 'loading') {
            loadingTries += 1;
            if (loadingTries >= MAX_LOADING_TRIES) {
              setState({ kind: 'unavailable', reason: 'le daemon lit encore ce contrat depuis plus d’une minute' });
            } else {
              setState({ kind: 'loading' });
              timer = setTimeout(load, LOADING_RETRY_MS);
            }
          } else setState({ kind: 'unavailable', reason: body.reason ?? body.error ?? `réponse ${res.status}` });
        })
        .catch(() => {
          if (!alive) return;
          const delay = NETWORK_RETRY_MS[networkFailures];
          networkFailures += 1;
          if (delay === undefined) {
            setState({ kind: 'unavailable', reason: 'serveur de mission control injoignable' });
          } else {
            timer = setTimeout(load, delay);
          }
        });
    };
    setState({ kind: 'loading' });
    load();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [projectName, path, field, isUsable, incompleteReason]);
  return state;
}
