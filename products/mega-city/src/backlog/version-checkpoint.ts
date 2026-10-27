/**
 * version-checkpoint — les deux VERDICTS d'une version vue comme un checkpoint de run
 * (fiche 20261015125606808, ADR-0080). PUR (ADR-0003/0069) : tout se calcule depuis le lot de la
 * version et le périmètre de tirage ; aucun objet persistant, aucun nouveau canal de bus.
 *
 *   launch(lot, scope) — ENTRÉE : « cette version est-elle LANÇABLE ? » Agrège `runDisposition` sur
 *     les fiches NON LIVRÉES du lot → combien à construire / à groomer / à escalader. Un VERDICT,
 *     pas un barrage : le run groome ce qu'il peut, fait surface le reste.
 *   seal(lot) — SORTIE : « cette version est-elle SCELLABLE ? » Partitionne les fiches NON LIVRÉES
 *     par leur raison (via `runDisposition`) → la table « fiche → raison → décision attendue ».
 *
 * Le prédicat de scellabilité (« tout le `todo` est livré ou sorti ») est le MÊME que celui de
 * `closeVersion` : les deux lisent `lot.todo` de `buildVersions` — source unique, pas de divergence.
 * On ne fait pas `closeVersion` → `seal` ni l'inverse : le graphe de modules l'interdit (`versions.ts`
 * ne peut importer `run-eligibility`, qui l'importe déjà), donc on partage la DONNÉE (`lot.todo`),
 * pas l'appel. Le run appelle `seal` pour la table riche ; `closeVersion` reste le portier du tag.
 */
import type { Fiche } from '../loaders/fiches.js';
import { type EligibilityVerdict, type FicheEligibility, runDisposition } from './run-eligibility.js';
import type { VersionScope } from './version-scope.js';
import type { VersionLot } from './versions.js';

/** Une fiche non livrée, avec le verdict d'éligibilité qui dit pourquoi elle n'est pas (encore) construite. */
export interface CheckpointFiche {
  id: string;
  title: string;
  /** Code court de la raison (`''` si prête à construire) — repris de `runDisposition`. */
  reason: string;
  /** Le verdict brut, pour qui veut le message en clair. */
  verdict: EligibilityVerdict;
}

/** Verdict d'ENTRÉE : la version est lançable si rien ne reste à groomer ni à escalader. */
export interface LaunchVerdict {
  version: string;
  /** Vrai quand toutes les fiches non livrées sont prêtes à construire (0 à groomer, 0 à escalader, 0 déférée). */
  launchable: boolean;
  /** Prêtes à construire (disposition `build`). */
  build: CheckpointFiche[];
  /** À groomer vers la DoR avant de construire (disposition `groom`). */
  groom: CheckpointFiche[];
  /** À escalader : blocage typé, épic, statut inattendu (disposition `escalate`). */
  escalate: CheckpointFiche[];
  /** Hors borne de version (disposition `defer`) — rare dans un lot d'une seule version. */
  defer: CheckpointFiche[];
}

/** Une ligne de la table de sortie : la fiche, pourquoi elle n'est pas livrée, et la décision attendue du PO. */
export interface SealRow {
  id: string;
  title: string;
  reason: string;
  decision: string;
}

/** Verdict de SORTIE : la version est scellable quand plus aucune fiche n'est à livrer. */
export interface SealVerdict {
  version: string;
  /** Vrai quand `lot.todo` est vide : chaque fiche prévue est livrée ou sortie de la version. */
  sealable: boolean;
  /** Les fiches non livrées, chacune avec sa raison et la décision attendue (reporter / parker / clôturer / construire). */
  pending: SealRow[];
}

const toEligibility = (f: Fiche): FicheEligibility => ({
  status: f.status,
  type: f.type,
  blocked: f.blocked,
  version: f.version,
});

/** La décision attendue du PO à la frontière, selon la raison typée (fiche 20261015125606808, table ADR-0080). */
export function expectedDecision(verdict: EligibilityVerdict): string {
  switch (verdict.disposition) {
    case 'build':
      return 'construire avant de sceller, ou sortir la fiche de la version';
    case 'groom':
      return 'groomer vers la DoR puis construire, ou sortir de la version';
    case 'defer':
      return 'hors borne de version — sortir de la version';
    case 'escalate':
      break;
  }
  // disposition `escalate` : la décision dépend de la raison typée.
  switch (verdict.reason) {
    case 'epic':
      return 'découper en stories, ou sortir de la version';
    case 'dependency':
    case 'github':
      return 'reporter à la version où la dépendance arrive';
    case 'deferred':
    case 'panel':
    case 'design':
    case 'review':
    case 'risky':
      return 'le PO fait le geste, ou reporte la fiche à une autre version';
    case 'oversized':
      return 're-groomer (découper), ou reporter / clôturer';
    case 'legacy':
    case 'blocked-non-typé':
      return 'requalifier le blocage, puis décider';
    default:
      return 'requalifier l’état de la fiche, puis décider'; // statut inattendu (statut-<x>)
  }
}

/**
 * ENTRÉE — « version lançable ? ». Agrège `runDisposition` sur les fiches NON LIVRÉES du lot
 * (`lot.todo`, déjà hors parkées et hors livrées). Lançable = tout est prêt à construire.
 */
export function launch(lot: VersionLot, scope: VersionScope): LaunchVerdict {
  const buckets: Record<string, CheckpointFiche[]> = { build: [], groom: [], escalate: [], defer: [] };
  for (const f of lot.todo) {
    const verdict = runDisposition(toEligibility(f), scope);
    buckets[verdict.disposition].push({ id: f.id, title: f.title, reason: verdict.reason, verdict });
  }
  return {
    version: lot.version,
    launchable: buckets.groom.length === 0 && buckets.escalate.length === 0 && buckets.defer.length === 0,
    build: buckets.build,
    groom: buckets.groom,
    escalate: buckets.escalate,
    defer: buckets.defer,
  };
}

/**
 * SORTIE — « version scellable ? ». Scellable quand `lot.todo` est vide. Sinon, chaque fiche non
 * livrée est rendue avec sa raison typée et la décision attendue : le run FAIT SURFACE au lieu de
 * s'arrêter muet (fiche 20261015125606808, critère « ne s'arrête plus en silence »).
 */
export function seal(lot: VersionLot, scope: VersionScope): SealVerdict {
  const pending: SealRow[] = lot.todo.map((f) => {
    const verdict = runDisposition(toEligibility(f), scope);
    return { id: f.id, title: f.title, reason: verdict.reason || verdict.disposition, decision: expectedDecision(verdict) };
  });
  return { version: lot.version, sealable: lot.todo.length === 0, pending };
}
