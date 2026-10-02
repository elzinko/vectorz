/**
 * fiche-schema — LE schéma des fiches : la liste des statuts (colonnes du kanban), ce qui en
 * découle (les terminaux) et les champs RETIRÉS du front-matter. PUR (ADR-0003), sans import.
 *
 * Fiche 20260823121712652 (« le verrou », V0.1). Avant : la liste des statuts vivait à sept endroits
 * (validateur, board, deux copies de `regen-backlog.sh`, `portfolio.sh`, trois gabarits, le skill)
 * et avait déjà dérivé (`merged`/`split` affichés `❓`, `blocked` fantôme). Elle vit ICI, en un seul
 * endroit typé — ADR-0040 D2 : « schéma dérivé du code typé, pas de schéma parallèle » ; pas de YAML
 * par repo (arbitrage PO du 2026-09-12). Ce que le code ne peut pas importer — scripts bash,
 * gabarits markdown — est GARDÉ par `src/__tests__/fiche-schema-contract.test.ts` : ajouter un
 * statut ici sans son habillage là-bas fait échouer la suite.
 *
 * Le flux (deux axes) : la COLONNE est le champ `status`, une seule valeur : `idea` (pas encore
 * prête) → `ready` (groomée, tirable) → `shipped` (livrée). `in-progress` accompagne le travail
 * commencé ; « doing » reste DÉRIVÉ de la branche `feat/<id>`. Le statut `todo` a été RETIRÉ le
 * 2026-09-04 (panel adverse, capture `docs/captures/2026-09-04-panel-adverse-objet-sprint.md`).
 * Les DRAPEAUX se posent par-dessus la colonne : `blocked:` (+ la raison) — une fiche peut être
 * `ready` ET bloquée (sliver B, fiche 652) ; ce n'est donc PAS un statut.
 *
 * `superseded`, `merged`, `split` sont TERMINAUX : « clôturés sans livraison de forme standard »
 * (caduque après pivot ; absorbée par une autre fiche — `merged_into:` ; scindée — `split_into:`).
 * La provenance se lit dans les DEUX sens : `merged_from:` sur la résultante, `split_from:` sur les enfants
 * (posés par `backlog:apply`, fiche 20260910231201744 ; leur réciprocité est contrôlée par `fiches:check`).
 * Ils sortent du stock actif (la fiche part dans `features/done/`) SANS compter comme livrée : les
 * métriques de sprint ne comptent que `shipped`. `shipped` n'est pas terminal ici : une livrée vit
 * dans `done/`, déjà exclue par le dossier.
 */

export interface StatutDef {
  /** Valeur du champ `status:` (kebab-case). */
  id: string;
  /** Habillage des vues générées (BACKLOG.md, PORTFOLIO.md) : un emoji, puis l'id. */
  label: string;
  /** Clôturé sans livraison standard : sort du stock actif même si la fiche reste dans `features/`. */
  terminal: boolean;
}

/** LA table. L'ordre est celui du flux, puis des terminaux ; les vues l'affichent tel quel. */
export const STATUT_DEFS: readonly StatutDef[] = [
  { id: 'idea', label: '💡 idea', terminal: false },
  { id: 'ready', label: '🔵 ready', terminal: false },
  { id: 'in-progress', label: '🟠 in-progress', terminal: false },
  { id: 'shipped', label: '✅ shipped', terminal: false },
  { id: 'superseded', label: '🗑️ superseded', terminal: true },
  { id: 'merged', label: '🔀 merged', terminal: true },
  { id: 'split', label: '🧩 split', terminal: true },
];

/** Les valeurs admises de `status:` — dérivées de la table. */
export const STATUTS: readonly string[] = STATUT_DEFS.map((d) => d.id);

/**
 * Statuts TERMINAUX. Ils sortent du STOCK ACTIF même quand la fiche reste physiquement dans
 * `features/` — cas d'une fiche gardée là pour ne pas casser ses liens relatifs (ex. `0051`, ~20
 * liens). Sans ce filtre, une `superseded` gardée dans `features/` fuiterait au board actif
 * (revue Codex PR #240, exposé par le retrait de l'épic — A16).
 */
export const TERMINAUX: readonly string[] = STATUT_DEFS.filter((d) => d.terminal).map((d) => d.id);

export interface ChampRetire {
  /** Nom du champ de front-matter qui n'existe plus. */
  field: string;
  /** Version de layout (Skema) qui l'a retiré. */
  since: number;
  /** Ce qu'il faut faire à la place — repris tel quel dans le message du validateur. */
  hint: string;
}

/**
 * Champs RETIRÉS du front-matter. Leur réapparition (gabarit périmé, fiche copiée d'un vieux dépôt)
 * est une anomalie : le validateur la signale au lieu de la laisser revenir en silence.
 *
 * `ready:` (migration Skema 005) : `ready` est une COLONNE (`status: ready`), plus un champ date.
 * La date de chaque DoR historique vit dans une note « Historique » au bas de la fiche — jamais
 * dérivée de git (le squash-merge ment).
 */
export const CHAMPS_RETIRES: readonly ChampRetire[] = [
  {
    field: 'ready',
    since: 5,
    hint: "utilise la colonne `status: ready` ; la date d'origine est une note au bas de la fiche (migration 005)",
  },
];
