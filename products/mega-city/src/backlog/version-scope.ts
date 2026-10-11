/**
 * Le garde-fou de séquence : le tirage reste dans la version EN COURS (fiche 20261010215345931,
 * [ADR-0070](../../docs/adr/0070-le-tirage-reste-dans-la-version-en-cours.md)).
 *
 * Choisir la prochaine fiche (`plan:head` = `next --ready-only`, `plan:lot` = `next --lot N`) suivait
 * l'ordre du PLAN sans regarder la version : un lot pouvait proposer du v0.8 pendant que la v0.7 n'était
 * pas finie. Ici, un FILTRE PUR posé AVANT la sélection écarte les fiches d'une version strictement
 * supérieure à la version en cours. Les cœurs `selectLot`/`crossBacklogHead` restent intacts (SRP/OCP).
 *
 * Module pur : il ne dépend que de l'état des versions (`versions.ts`), jamais du disque ni de git.
 * Les étiquettes sont lues au bord (`io/git-tags.ts`) et injectées via `buildVersions`.
 */
import { VERSION_FORMAT, type VersionsReport } from './versions.js';

export interface VersionScope {
  /** Version en cours = plus bas lot SANS étiquette git. `undefined` si aucun lot (ou tous étiquetés). */
  current?: string;
  /** Versions tirables : la version en cours et les inférieures (toutes si `allVersions`). */
  inScope: ReadonlySet<string>;
  /** Versions STRICTEMENT supérieures à la version en cours, écartées du tirage. Signalées, jamais tues. */
  deferred: readonly string[];
  /** `current` existe mais n'a aucune fiche à faire → version complète : « pousse l'étiquette ». */
  empty: boolean;
  /** La soupape `--all-versions` est levée : aucun écart, tout est tirable. */
  allVersions: boolean;
}

/**
 * Calcule le périmètre de tirage à partir de l'état des versions. Les lots de `report` sont déjà triés
 * dans l'ordre naturel (`compareVersions`), donc la version en cours est le PREMIER lot non étiqueté,
 * et les versions écartées sont celles qui la SUIVENT dans la liste.
 */
export function versionScope(report: VersionsReport, opts: { allVersions?: boolean } = {}): VersionScope {
  const allVersions = opts.allVersions === true;
  const lots = report.lots;
  const currentIndex = lots.findIndex((l) => l.releaseTag === undefined);
  const current = currentIndex >= 0 ? lots[currentIndex].version : undefined;
  // « Version complète » = tout le todo est livré ET il y a eu une livraison. Un lot dont le seul
  // membre est une fiche parkée (todo=0, shipped=0) n'est PAS complète : on ne dit pas « pousse le tag ».
  const empty = currentIndex >= 0 && lots[currentIndex].todo.length === 0 && lots[currentIndex].shipped.length > 0;

  if (allVersions || current === undefined) {
    // Scope levé, ou aucune version en cours (train entièrement étiqueté) : rien n'est écarté.
    return { current, inScope: new Set(lots.map((l) => l.version)), deferred: [], empty, allVersions };
  }
  const inScope = new Set(lots.slice(0, currentIndex + 1).map((l) => l.version));
  const deferred = lots.slice(currentIndex + 1).map((l) => l.version);
  return { current, inScope, deferred, empty, allVersions };
}

/**
 * Applique le périmètre aux fiches AVANT la sélection. Rend les fiches GARDÉES et les ÉCARTÉES (pour le
 * signal). Règle : on garde la version en cours et les inférieures, PLUS les fiches sans version (petits
 * correctifs hors train, décision PO 2026-10-11) ; on écarte toute fiche d'une version supérieure.
 */
export function applyVersionScope<T extends { version: string }>(
  fiches: readonly T[],
  scope: VersionScope,
): { kept: T[]; deferred: T[] } {
  if (scope.allVersions || scope.current === undefined) {
    return { kept: [...fiches], deferred: [] };
  }
  const kept: T[] = [];
  const deferred: T[] = [];
  for (const f of fiches) {
    // Gardée : sans version · version MALFORMÉE (jamais écartée en silence — `backlog version check`
    // la signale bruyamment ailleurs ; sinon elle disparaîtrait du tirage sans un mot) · version en
    // cours ou inférieure (`inScope`). Écartée : seulement une version bien formée STRICTEMENT supérieure.
    if (f.version === '' || !VERSION_FORMAT.test(f.version) || scope.inScope.has(f.version)) kept.push(f);
    else deferred.push(f);
  }
  return { kept, deferred };
}

/**
 * Les lignes de signal du périmètre, pour les bords `plan:lot` / `plan:head`. Jamais de saut muet :
 * on nomme ce qu'on écarte, et les deux fins de scope (version complète vs rien de prêt).
 */
export function formatVersionScope(scope: VersionScope): string[] {
  const out: string[] = [];
  if (scope.allVersions) {
    out.push('⚠ --all-versions : périmètre de version LEVÉ — fiches de toute version visibles (tirage hors séquence).');
    return out;
  }
  if (scope.current === undefined) return out; // aucun train de versions : rien à signaler
  if (scope.deferred.length > 0) {
    out.push(
      `écartées hors version en cours (${scope.current}) : ${scope.deferred.join(', ')} — ` +
        '`--all-versions` pour les voir (hors séquence).',
    );
  }
  if (scope.empty) {
    out.push(
      `version ${scope.current} complète (tout livré) : pousse son étiquette ` +
        `(\`ezk backlog version close ${scope.current}\`) pour débloquer la version suivante.`,
    );
  }
  return out;
}
