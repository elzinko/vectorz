import type { RunProjection } from '@cop1/journal-validator';

/**
 * `liveness` est un overlay SERVEUR distinct du `state` de contrat calculé par
 * `journal-validator` (qui reste pur, sans horloge). Armé uniquement quand
 * `state === 'running'` (jamais en `at_gate`, D8) — voir `SupervisionService`.
 */
export type Liveness = 'alive' | 'presumed_dead';

/**
 * Snapshot d'un run affiché en mode moniteur (fiche 0031 / ADR-028). Enrichit
 * le read-model zéro-dépendance `RunProjection` avec des informations
 * propres au serveur cop1 : d'où vient le run, et si on le pense vivant.
 * Aucun champ "phase" — le read-model sous-jacent n'en porte déjà aucun
 * (verrou DP2).
 */
export interface RunSnapshot extends RunProjection {
  projectRoot: string;
  runDir: string;
  liveness: Liveness;
  /** Badge « classe B — best-effort » (fiabilité de la mesure, pas du métier). */
  emissionClass: 'B';
  /**
   * Horloge LOCALE (serveur) de la dernière absorption réussie de ce run,
   * en ISO 8601. Sert d'ancre au timer `presumed_dead` et à l'affichage
   * « il y a Xs » côté front — jamais le `ts` auto-déclaré dans le journal
   * (semi-hostile, cf. `lastEventTs`), qui reste informatif uniquement.
   */
  lastAbsorbedAt?: string;
}
