/**
 * Cœur PUR de la revue design-system (fiche 20261011153019643) — une passe composable
 * d'`ezk-release`.
 *
 * En clair : avant de taguer une version, on veut vérifier que l'UI livrée respecte le
 * référentiel de design du projet (chez muti : `.rules/design-system.md`). Cette revue est une
 * PASSE déclarée dans `ezk-release` (donnée, pas code dans le skill — critère « composable »).
 *
 * Comme la chasse aux bugs du socle, le skill NE JUGE PAS lui-même : un agent (ezk-ux ou un
 * reviewer de référentiel) fait la revue et ENREGISTRE un verdict ; cette passe est la gate
 * déterministe qui le relit et rend GO/NO-GO. Ce module ne fait aucune I/O : il résout le réglage,
 * décrit le verdict, et décide le résultat. La lecture des fichiers vit au bord (bin + loader,
 * frontière ADR-0003).
 */

/** Le réglage design-system d'un projet : le chemin de son référentiel. */
export interface DesignSystemConfig {
  /** Chemin du référentiel, relatif à la racine du projet. */
  readonly reference: string;
}

/** Le référentiel par défaut (né côté muti, fiche 20261011153019643). */
export const DEFAULT_REFERENCE = '.rules/design-system.md';

/**
 * Résout le réglage `release.design_system` (sous-arbre déjà parsé de `.vectorz/config.yml`).
 * `release.design_system.reference` surcharge le chemin ; toute autre forme (absent, vide,
 * inattendue) retombe sur le défaut — jamais de coupure silencieuse par une faute de frappe.
 */
export function resolveDesignSystem(release: unknown): DesignSystemConfig {
  if (release && typeof release === 'object') {
    const ds = (release as { design_system?: unknown }).design_system;
    if (ds && typeof ds === 'object') {
      const ref = (ds as { reference?: unknown }).reference;
      if (typeof ref === 'string' && ref.trim() !== '') return { reference: ref.trim() };
    }
  }
  return { reference: DEFAULT_REFERENCE };
}

/**
 * Le verdict enregistré de la revue design-system d'une version. Produit par l'agent de revue
 * (jamais par cette passe), relu par la gate. Les écarts nommés accompagnent un NO-GO.
 */
export interface DesignSystemVerdict {
  readonly version: string;
  readonly verdict: 'GO' | 'NO-GO';
  /** Les écarts bloquants nommés (vide quand GO). */
  readonly gaps: readonly string[];
  /** Horodatage ISO de la revue. */
  readonly at: string;
  /** Le commit sur lequel la revue a tourné, si connu. */
  readonly head?: string;
}

/** Les quatre issues possibles d'une passe design-system. */
export type DesignSystemStatus = 'skip' | 'go' | 'no-go' | 'pending';

export interface DesignSystemOutcome {
  readonly status: DesignSystemStatus;
  /** Code de sortie de la passe : 0 = GO (passe), 1 = NO-GO (bloque le tag). */
  readonly exitCode: 0 | 1;
  /** Le compte rendu lisible (ouvre par « En clair »). */
  readonly report: string;
}

/**
 * Décide PUREMENT le résultat de la passe, sans I/O :
 * - référentiel absent → SKIP (GO, exit 0) : un projet sans design-system n'est pas bloqué ;
 * - référentiel présent mais aucun verdict enregistré → PENDING (NO-GO, exit 1) : la revue
 *   reste à faire, la passe ne la fabrique pas ;
 * - verdict GO → GO (exit 0) ;
 * - verdict NO-GO → NO-GO (exit 1) en NOMMANT les écarts.
 */
export function decideDesignSystem(input: {
  readonly version: string;
  readonly reference: string;
  readonly referencePresent: boolean;
  readonly verdict?: DesignSystemVerdict;
}): DesignSystemOutcome {
  const { version, reference, referencePresent, verdict } = input;

  if (!referencePresent) {
    return {
      status: 'skip',
      exitCode: 0,
      report: `En clair : revue design-system sautée — aucun référentiel (${reference}). ${version} passe cette passe sans la bloquer.`,
    };
  }

  if (!verdict) {
    return {
      status: 'pending',
      exitCode: 1,
      report:
        `En clair : revue design-system en attente pour ${version} — le référentiel ${reference} existe, mais aucun verdict n'est enregistré.\n` +
        '  ↳ Fais la revue (UI livrée vs référentiel), enregistre le verdict (GO/NO-GO + écarts), puis rejoue la passe.',
    };
  }

  if (verdict.verdict === 'GO') {
    return {
      status: 'go',
      exitCode: 0,
      report: `En clair : revue design-system GO pour ${version} — l'UI livrée respecte ${reference}.`,
    };
  }

  const gaps = verdict.gaps.length > 0 ? verdict.gaps : ['(verdict NO-GO sans écart nommé — à documenter dans le verdict)'];
  return {
    status: 'no-go',
    exitCode: 1,
    report: [
      `En clair : revue design-system NO-GO pour ${version} — l'UI livrée s'écarte de ${reference}.`,
      'Écarts bloquants :',
      ...gaps.map((g) => `  ↳ ${g}`),
    ].join('\n'),
  };
}
