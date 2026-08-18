/**
 * `contract.ts` — Contrat du pack de review `method-review@0.1` (fiche 0183, ADR-038).
 *
 * Module PUR : aucune I/O, aucune dépendance VCS. Décrit la forme d'un `ReviewPack`
 * (front-matter + 7 sections obligatoires) et sa validation. Le pack **agrège par
 * référence, jamais par copie** (invariant hérité d'ADR-033) : les champs de
 * `ReviewSections` portent des liens/résumés courts, pas des rapports recopiés.
 */

/** URI de contrat versionnée stable — écrite telle quelle dans le front-matter. */
export const CONTRACT_URI = 'method-review@0.1';

export type ReviewStatus = 'ready-for-review' | 'changes-requested' | 'approved';

/** Les 3 statuts autorisés, dans l'ordre du cycle de vie d'une review. */
export const REVIEW_STATUSES: readonly ReviewStatus[] = [
  'ready-for-review',
  'changes-requested',
  'approved',
];

export interface ReviewMethod {
  name: string;
  version: string;
}

export interface ReviewPackFrontMatter {
  schema: string;
  fiche: string;
  branch: string;
  product: string;
  method: ReviewMethod;
  status: ReviewStatus;
  created: string;
  run_id?: string;
  pr?: string;
}

/**
 * Les 7 sections obligatoires du pack (table de la fiche 0183). Chaque champ est
 * une référence courte (lien, résumé, commande) — jamais une copie de rapport
 * source. Les champs optionnels dégradent en « N.A. » au rendu (`render.ts`)
 * quand leur source n'existe pas.
 */
export interface ReviewSections {
  /** Résumé : ce qui a été fait / pourquoi. */
  resume: string;
  /** Rendus : liens assets/*, URL preview, commande démo. */
  rendus: string[];
  /** Matrice de validation : CI / tests / E2E / before-after / preview / N.A. */
  matriceValidation: string;
  /** À tester : checklist rejouable (compose `features/checks/`, 0178). */
  aTester: string;
  /** Qualité : métriques lues depuis `.quality/` — absent si non produit. */
  qualite?: string;
  /** Provisioning / preview : commandes littérales local + mode démo. */
  provisioning: string;
  /** Trouvailles : bug / trou → `ezk-backlog add` proposé — absent si aucune. */
  trouvailles?: string[];
}

export interface ReviewPack {
  frontMatter: ReviewPackFrontMatter;
  sections: ReviewSections;
}

/**
 * Valide un `ReviewPack` : champs de front-matter requis + énum `status` +
 * `schema` conforme à la `CONTRACT_URI` courante. Lance une erreur explicite
 * (nommant le champ) au premier défaut trouvé.
 */
export function validateReviewPack(pack: ReviewPack): void {
  const fm = pack.frontMatter;

  const requiredStringFields: Array<[keyof ReviewPackFrontMatter, string]> = [
    ['schema', 'schema'],
    ['fiche', 'fiche'],
    ['branch', 'branch'],
    ['product', 'product'],
    ['created', 'created'],
  ];
  for (const [field, label] of requiredStringFields) {
    const value = fm[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`ReviewPack invalide : le champ front-matter "${label}" est requis`);
    }
  }

  if (!fm.method || typeof fm.method !== 'object') {
    throw new Error('ReviewPack invalide : le champ front-matter "method" est requis');
  }
  if (typeof fm.method.name !== 'string' || fm.method.name.trim().length === 0) {
    throw new Error('ReviewPack invalide : le champ front-matter "method.name" est requis');
  }
  if (typeof fm.method.version !== 'string' || fm.method.version.trim().length === 0) {
    throw new Error('ReviewPack invalide : le champ front-matter "method.version" est requis');
  }

  if (!REVIEW_STATUSES.includes(fm.status)) {
    throw new Error(
      `ReviewPack invalide : "status" doit être l'un de ${REVIEW_STATUSES.join(', ')} (reçu "${fm.status}")`,
    );
  }

  if (fm.schema !== CONTRACT_URI) {
    throw new Error(
      `ReviewPack invalide : "schema" doit être "${CONTRACT_URI}" (reçu "${fm.schema}")`,
    );
  }

  const requiredSections: Array<[keyof ReviewSections, string]> = [
    ['resume', 'resume'],
    ['matriceValidation', 'matriceValidation'],
    ['aTester', 'aTester'],
    ['provisioning', 'provisioning'],
  ];
  for (const [field, label] of requiredSections) {
    const value = pack.sections[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`ReviewPack invalide : la section "${label}" est requise`);
    }
  }
  if (!Array.isArray(pack.sections.rendus)) {
    throw new Error('ReviewPack invalide : la section "rendus" doit être un tableau');
  }
}
