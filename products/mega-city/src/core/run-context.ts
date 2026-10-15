/**
 * run-context — le bloc « Contexte de run » qui s'affiche AVANT un run autonome
 * (fiche 20260906122942607, qui absorbe le préflight, l'écho du contrat et le briefing).
 *
 * En clair : un run auto démarre parfois à l'aveugle. Ce bloc dit trois choses. D'où il part
 * (la base est-elle fraîche ?), où il travaille et qui écrit les fichiers (worktree, délégation),
 * et ce qu'il fera seul (le contrat en trois lignes). Les lignes sortent des réglages RÉELS du run :
 * jamais d'un texte figé.
 *
 * Les règles de fond existent déjà : development/run-freshness-origin-main (la base),
 * development/worktree-secondary-inline-harvest (qui écrit), development/merge-when-absent-default
 * (le merge du vert). Ce module ne décide rien : il rend visible.
 *
 * PUR : aucune I/O. Les faits sont rassemblés par `src/io/run-facts.ts`, le bord est `bin/run-context.ts`.
 */

export type RunMode = 'auto' | 'manuel';
export type Delivery = 'per-feature' | 'per-epic';
export type TokenSetting = 'lean' | 'cap' | 'full';

/** Les réglages du run, tels que l'appelant les a donnés. */
export interface RunSettings {
  mode: RunMode;
  delivery: Delivery;
  tokens: TokenSetting;
  /** `--review` : le PO tamponne `ready` lui-même (absent par défaut). */
  review?: boolean;
  maxSprints?: number;
  /** La fiche visée, quand on la connaît. */
  fiche?: string;
  /**
   * `--seal-versions local` (fiche 20261013131852581, ADR-0076) : opt-in pour que le run pose
   * l'étiquette de version LUI-MÊME, en flux local. Absent par défaut : le tag reste au PO.
   */
  sealVersions?: 'local';
}

/** Les faits git, rassemblés avant l'appel (après `git fetch`). */
export interface RunFacts {
  /** `ok` : origin/main est lisible. `none` : pas de remote. `unreachable` : le fetch a échoué. */
  remote: 'ok' | 'none' | 'unreachable';
  originMain?: { sha: string; subject: string } | undefined;
  /** La base comparée, telle que `--base` l'a désignée (défaut `origin/main`). */
  baseRef?: string | undefined;
  /** `git rev-list --count HEAD..origin/main` : ce qui manque à HEAD. */
  behind: number;
  /** `git rev-list --count origin/main..HEAD` : ce que HEAD a en plus. */
  ahead: number;
  /** Arbre sans fichier modifié ni non suivi. */
  clean: boolean;
  /** HEAD est un ancêtre d'origin/main : un fast-forward strict est possible. */
  fastForwardable: boolean;
  worktree: { kind: 'primary' | 'secondary'; path: string; branch?: string | undefined };
  /**
   * Flux local = aucune pull request (`github.pr` coupé) : rien n'est poussé, donc l'auto-tag
   * (`--seal-versions local`) est permis. `undefined` quand on ne l'a pas résolu (compat).
   */
  githubLocalFlow?: boolean;
}

export interface RunContext {
  lines: string[];
}

const plural = (n: number, word: string): string => `${n} ${word}${n > 1 ? 's' : ''}`;

function baseLine(facts: RunFacts): string {
  const ref = facts.baseRef ?? 'origin/main';
  if (facts.remote !== 'ok' || !facts.originMain) {
    const why = facts.remote === 'none' ? 'pas de remote' : 'le fetch a échoué';
    return `  Base       pas de remote joignable (${why}) : ${ref} non vérifiée, c'est un avertissement, pas un blocage`;
  }
  const where = `${ref} = ${facts.originMain.sha} « ${facts.originMain.subject} »`;
  if (facts.behind === 0) {
    const ahead = facts.ahead > 0 ? ` · ${plural(facts.ahead, 'commit')} en avance` : '';
    return `  Base       ${where} · à jour${ahead}`;
  }
  const late = `en retard de ${plural(facts.behind, 'commit')}`;
  if (facts.clean && facts.fastForwardable) {
    return `  Base       ${where} · ${late} : réalignement sans risque possible (fast-forward strict, arbre propre)`;
  }
  return `  Base       ${where} · ${late} : avertissement seul, rien n'est déplacé (arbre sale ou divergent) — décision : rebase, stop ou go`;
}

/** La politique de scellage des versions par le run (fiche 20261013131852581, ADR-0076). */
export type SealPolicy = 'auto-local' | 'po-not-local' | 'po-default';

/**
 * Tranche si le run pose l'étiquette de version lui-même. Opt-in STRICT, par sûreté :
 *   - sans `--seal-versions local` → `po-default` : le run clôt mais NE TAGUE PAS (tag au PO) ;
 *   - `--seal-versions local` en flux local confirmé → `auto-local` : le run tague, en local, réversible ;
 *   - `--seal-versions local` hors flux local (GitHub actif, ou flux non résolu) → `po-not-local` :
 *     le drapeau ne mord pas, le tag reste au PO (jamais d'auto-tag si quelque chose serait poussé).
 */
export function sealPolicy(
  sealVersions: RunSettings['sealVersions'],
  githubLocalFlow: boolean | undefined,
): SealPolicy {
  if (sealVersions !== 'local') return 'po-default';
  return githubLocalFlow === true ? 'auto-local' : 'po-not-local';
}

function contractLines(s: RunSettings, seal: SealPolicy): string[] {
  const one =
    s.mode === 'manuel'
      ? "En manuel, je ne décide rien seul : je m'arrête à chaque checkpoint."
      : s.delivery === 'per-epic'
        ? "En auto avec livraison par lot, je laisse les PR du lot ouvertes jusqu'au lot complet ; ezk-pr les livre en cascade."
        : "En auto, je merge les fiches vertes (gate verte et revue GO), une PR par fiche, au fil de l'eau.";
  const two =
    "Je m'arrête sur 4 cas : action irréversible ou sortante, hausse de budget, idée produit sur backlog vide, exigences contradictoires.";
  const three =
    s.tokens === 'cap'
      ? "Plafond de jetons : cap — je m'arrête au point sûr le plus proche dès que le seuil est dépassé, et je demande (hausse de budget = décision humaine)."
      : s.tokens === 'full'
        ? 'Plafond de jetons : full — fan-out libre, aucun plafond automatique : surveille la consommation toi-même.'
        : "Plafond de jetons : lean — délégation simple et séquentielle, je préviens avant tout fan-out ; une dérive qui persiste m'arrête (hausse de budget = décision humaine).";
  const lines = [`    1. ${one}`, `    2. ${two}`, `    3. ${three}`];
  // Ligne de scellage ajoutée SEULEMENT en opt-in : le défaut garde trois lignes de contrat.
  if (seal === 'auto-local') {
    lines.push('    4. À chaque frontière de version, je pose l\'étiquette moi-même, en local et réversible (opt-in --seal-versions local).');
  } else if (seal === 'po-not-local') {
    lines.push('    4. --seal-versions local est posé, mais le flux n\'est pas local (GitHub actif) : le tag reste au PO.');
  }
  return lines;
}

/** Rend le bloc. Ne jette jamais : une base illisible devient un avertissement dans la ligne Base. */
export function buildRunContext(settings: RunSettings, facts: RunFacts): RunContext {
  const seal = sealPolicy(settings.sealVersions, facts.githubLocalFlow);
  const flags = [
    `--mode ${settings.mode}`,
    `--tokens ${settings.tokens}`,
    `--delivery ${settings.delivery}`,
    `--review ${settings.review ? 'présent' : 'absent'}`,
    ...(settings.maxSprints !== undefined ? [`--max-sprints ${settings.maxSprints}`] : []),
    ...(settings.sealVersions ? [`--seal-versions ${settings.sealVersions}`] : []),
  ];
  const target = settings.fiche ? ` · fiche visée ${settings.fiche}` : '';
  const wt = facts.worktree;
  const branch = wt.branch ?? 'tête détachée';

  const write =
    wt.kind === 'secondary'
      ? "  Écriture   inline : le pilote écrit lui-même les fichiers (un sous-agent lancé ici écrirait dans son propre worktree, pas dans le tien)"
      : '  Écriture   délégation à un sous-agent possible (worktree principal)';

  return {
    lines: [
      'Contexte de run',
      `  Réglages   ${flags.join(' · ')}${target}`,
      baseLine(facts),
      `  Worktree   ${wt.kind === 'secondary' ? 'secondaire' : 'principal'} · ${branch} · ${wt.path}`,
      write,
      '  Contrat',
      ...contractLines(settings, seal),
    ],
  };
}
