/**
 * run-eligibility — le FILTRE D'ÉLIGIBILITÉ du run autonome (fiche 20261011091553794).
 *
 * En clair : avant de délibérer sur une fiche — peser le pour et le contre avec des sous-agents, ce
 * qui coûte des jetons —, le run teste son éligibilité par des signaux DÉTERMINISTES : la raison
 * `blocked:` typée et la borne de version. Il tranche d'emblée : construire, groomer, escalader, ou
 * différer. Une fiche inéligible est escaladée SANS délibération. Le run s'arrête par défaut à la
 * borne de version ; la soupape `--all-versions` la lève.
 *
 * PUR (ADR-0003) : aucune I/O. Le bord `bin/run-eligibility.ts` charge les fiches, les étiquettes et
 * le périmètre de version, puis imprime le verdict. Le tri s'appuie sur le marqueur de blocage typé
 * (`blocked-reasons.ts`) pour être déterministe, et sur `version-scope.ts` pour la borne (ADR-0070).
 */
import { type BlockedReason, blockedType, isKnownBlockedReason } from './blocked-reasons.js';
import { VERSION_FORMAT } from './versions.js';
import type { VersionScope } from './version-scope.js';

/** La décision du filtre pour une fiche, AVANT toute délibération. */
export type Disposition = 'build' | 'groom' | 'escalate' | 'defer';

export interface EligibilityVerdict {
  disposition: Disposition;
  /** Code court de la raison (raison typée, `epic`, `hors-version`, `statut-<x>`) ; `''` pour `build`. */
  reason: string;
  /** Une ligne en clair, actionnable, pour le journal (`SPRINT.md`) et le bilan de run. */
  message: string;
}

/**
 * Par raison typée, POURQUOI la fiche est inéligible au run autonome (escalade, sans délibérer).
 * Couvre toute la liste fermée de `blocked-reasons.ts` : une raison connue a toujours son message.
 */
export const ESCALATION_BY_REASON: Record<BlockedReason, string> = {
  'différée-PO': 'différée par le PO — réveil sur sa décision, pas un sujet de run autonome',
  'attend-panel': 'attend un panel adverse — décision structurelle à tenir avec le PO',
  'attend-maquette': 'attend une maquette validée avant de construire',
  'attend-GitHub': 'attend une capacité ou une autorisation GitHub',
  'attend-dépendance': 'attend une autre fiche, un agent ou un service pas encore prêt',
  'sous-revue': 'gros changement sous revue manuelle — jamais en run autonome',
  'auto-édition-risquée': 'édition risquée de la méthode par elle-même — à faire sous garde humaine',
  'à-découper': 'trop grosse pour un sprint — à découper avant de construire',
  'hérité': 'drapeau hérité, raison non tracée — à requalifier avant de délibérer',
};

/** Les champs d'une fiche que le filtre lit. Sous-ensemble du type `Fiche` (jamais le disque). */
export interface FicheEligibility {
  status: string;
  type: string;
  blocked: string;
  version: string;
}

/**
 * Le verdict d'éligibilité d'une fiche, dans l'ordre de PRÉCÉDENCE (le 1er critère qui mord gagne) :
 *   1. drapeau `blocked:` (raison typée) → **escalade**, sans délibérer ;
 *   2. hors de la borne de version (version bien formée, strictement supérieure à la version en
 *      cours, sans `--all-versions`) → **défère** (le run s'arrête là) ;
 *   3. épic → **escalade** (jamais construit tel quel, à découper) ;
 *   4. `ready` → **construit** ;
 *   5. `idea` → **groome** (auto-groom vers la DoR) ;
 *   6. autre statut (in-progress, shipped, terminal, inconnu) → **escalade** (état inattendu, prudence).
 *
 * Le blocage prime la borne : une fiche bloquée reste à escalader même hors version (la raison typée
 * est l'information utile). La borne prime le reste : on ne groome ni ne construit hors séquence.
 */
export function runDisposition(fiche: FicheEligibility, scope: VersionScope): EligibilityVerdict {
  // 1. Blocage typé — la raison typée décide, pas un texte libre que seul un humain décode.
  if (fiche.blocked.trim() !== '') {
    const type = blockedType(fiche.blocked);
    if (isKnownBlockedReason(fiche.blocked)) {
      return {
        disposition: 'escalate',
        reason: type,
        message: `inéligible (${type}) : ${ESCALATION_BY_REASON[type as BlockedReason]}`,
      };
    }
    return {
      disposition: 'escalate',
      reason: 'blocked-non-typé',
      message: `inéligible (blocked non typé) : raison « ${fiche.blocked} » hors liste fermée — à requalifier avant de délibérer`,
    };
  }
  // 2. Borne de version — le run s'arrête à la version en cours ; `--all-versions` la lève.
  if (
    !scope.allVersions &&
    scope.current !== undefined &&
    fiche.version !== '' &&
    VERSION_FORMAT.test(fiche.version) &&
    !scope.inScope.has(fiche.version)
  ) {
    return {
      disposition: 'defer',
      reason: 'hors-version',
      message: `hors borne de version : ${fiche.version} dépasse la version en cours (${scope.current}) — le run s'arrête là (soupape : --all-versions)`,
    };
  }
  // 3. Épic — jamais tiré tel quel.
  if (fiche.type === 'epic') {
    return {
      disposition: 'escalate',
      reason: 'epic',
      message: 'inéligible (épic) : jamais construit tel quel — à découper en stories',
    };
  }
  // 4-6. Statut.
  if (fiche.status === 'ready') {
    return { disposition: 'build', reason: '', message: 'éligible : prête, dans la version, non bloquée — à construire' };
  }
  if (fiche.status === 'idea') {
    return {
      disposition: 'groom',
      reason: 'idea',
      message: 'à groomer : idée pas encore prête (DoR) — auto-groom avant de construire',
    };
  }
  return {
    disposition: 'escalate',
    reason: `statut-${fiche.status || 'vide'}`,
    message: `inéligible (statut ${fiche.status || 'vide'}) : état inattendu pour un tirage — à vérifier avant de délibérer`,
  };
}
