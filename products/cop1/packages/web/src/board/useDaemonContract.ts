/**
 * Lit un contrat que le daemon relaie par projet (`GET /api/<chemin>/<projet>`), avec re-tentative tant
 * qu'il le lit encore. Commun aux cartes (Process, Carte de la méthode) : même motif, jamais de donnée
 * inventée quand le contrat manque.
 */
import { useEffect, useState } from 'react';

export type ContractState<T> =
  | { kind: 'loading' }
  | { kind: 'ok'; contract: T }
  | { kind: 'unavailable'; reason: string };

/** Délai avant de redemander le contrat quand le daemon le lit encore. */
const LOADING_RETRY_MS = 2000;

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
    const load = (): void => {
      fetch(`/api/${path}/${encodeURIComponent(projectName)}`)
        .then(async (res) => {
          const body = (await res.json()) as Record<string, unknown> & { state?: string; reason?: string; error?: string };
          if (!alive) return;
          if (body.state === 'ok') {
            const contract = body[field];
            setState(
              isUsable(contract) ? { kind: 'ok', contract: contract as T } : { kind: 'unavailable', reason: incompleteReason },
            );
          } else if (body.state === 'loading') {
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
  }, [projectName, path, field, isUsable, incompleteReason]);
  return state;
}
