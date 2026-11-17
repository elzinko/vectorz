/**
 * Cœur PUR de la gate de release (`ezk release <vX.Y>`, fiche 20260922175954296).
 *
 * En clair : avant de taguer une version, on enchaîne des « passes » bloquantes (GO/NO-GO).
 * Le verdict global est GO seulement si TOUTES les passes sont GO. Les passes sont des
 * DONNÉES (id + titre + commande shell) : ajouter une passe n'édite pas ce code (critère
 * « composable, pas monolithique »). Ce module ne fait aucune I/O : il décrit les passes par
 * défaut, substitue les variables d'une commande, agrège les résultats, rend le compte rendu,
 * et lit le réglage `release.gate`. L'exécution shell et la lecture des fichiers vivent au bord
 * (bin/ezk-release.ts, src/loaders/release-passes.ts) — frontière ADR-0003.
 */

/** Une passe déclarée : un id stable, un titre lisible, une commande shell à jouer. */
export interface ReleasePass {
  readonly id: string;
  readonly title: string;
  /** Commande shell ; `{root}` et `{version}` y sont substitués avant exécution. */
  readonly command: string;
}

/** Le résultat d'une passe jouée : GO si la commande a rendu le code 0. */
export interface PassResult {
  readonly id: string;
  readonly title: string;
  readonly command: string;
  readonly go: boolean;
  /** Première ligne utile de la sortie (pour nommer ce qui a bloqué, ou le motif d'un saut). */
  readonly detail?: string;
  /** Vrai quand la passe a été SAUTÉE (ni GO ni NO-GO) : elle n'a pas tourné, elle le dit, elle ne bloque pas. */
  readonly skipped?: boolean;
}

/** Le verdict d'une release : GO seulement si toutes les passes sont GO. */
export interface ReleaseVerdict {
  readonly version: string;
  readonly verdict: 'GO' | 'NO-GO';
  readonly passes: readonly PassResult[];
  /** Horodatage ISO de la passe (quand le verdict a été établi). */
  readonly at: string;
  /** Le commit sur lequel la gate a tourné, si connu. */
  readonly head?: string;
}

/**
 * Les deux passes du socle (demande PO : « squelette composable + DoD mécanique + chasse aux
 * bugs »). Un projet les REMPLACE en posant `.vectorz/release-passes.yml` ; sinon ces défauts
 * s'appliquent. Ajouter une passe (ex. la revue design-system, fiche sœur) = une ligne de plus
 * dans ce fichier de données, jamais une réécriture du skill.
 */
export const DEFAULT_PASSES: readonly ReleasePass[] = [
  {
    id: 'dod-mecanique',
    title: 'Definition of Done mécanique — la version est cohérente et complète',
    command: 'ezk --root {root} backlog version check {version}',
  },
  {
    id: 'chasse-aux-bugs',
    title: 'Chasse aux bugs adverse — verdict posé par `ezk release verdict chasse-aux-bugs <version> go|no-go "<motif>"`',
    command: 'ezk --root {root} release verdict-check chasse-aux-bugs {version}',
  },
];

/** L'id et le titre de la passe « tests » du socle (sa commande vient du réglage `release.tests`). */
export const TESTS_PASS_ID = 'tests';
export const TESTS_PASS_TITLE = 'Tests du projet — la commande de tests déclarée passe au vert';

/**
 * La passe « tests » du socle, dérivée de `release.tests` :
 * - une commande → une passe à jouer (GO si code 0, NO-GO sinon) ;
 * - `null` (absente/vide) → `null` : le bord la rendra SAUTÉE (cf. `skippedTestsResult`).
 */
export function testsPass(testsCommand: string | null): ReleasePass | null {
  if (testsCommand === null) return null;
  return { id: TESTS_PASS_ID, title: TESTS_PASS_TITLE, command: testsCommand };
}

/** Le résultat SAUTÉ de la passe tests quand `release.tests` est absent : dit, jamais un GO muet. */
export function skippedTestsResult(): PassResult {
  return {
    id: TESTS_PASS_ID,
    title: TESTS_PASS_TITLE,
    command: '',
    go: true,
    skipped: true,
    detail: 'sautée : release.tests absent',
  };
}

/** Le verdict d'une passe à jugement (chasse aux bugs, design-system…), posé par `ezk release verdict`. */
export interface PassVerdict {
  readonly version: string;
  readonly passe: string;
  readonly verdict: 'GO' | 'NO-GO';
  readonly motif: string;
  readonly auteur?: string;
  readonly at: string;
  /** Le commit sur lequel le verdict a été posé, pour savoir s'il est périmé. */
  readonly head?: string;
}

/**
 * Décide GO/NO-GO d'une passe à verdict (chasse aux bugs…), péremption comprise :
 * - aucun verdict → NO-GO, « à poser » ;
 * - verdict posé sur un autre commit que HEAD → NO-GO « périmé », en nommant les deux commits ;
 * - verdict NO-GO → NO-GO avec son motif ;
 * - verdict GO sur HEAD → GO.
 */
export function decidePassVerdict(verdict: PassVerdict | undefined, head: string): { go: boolean; detail?: string } {
  if (verdict === undefined) {
    return {
      go: false,
      detail: 'aucun verdict posé — pose-le : ezk release verdict <passe> <version> go|no-go "<motif>"',
    };
  }
  if (verdict.head !== undefined && head !== '' && verdict.head !== head) {
    return {
      go: false,
      detail: `verdict périmé (posé sur ${verdict.head.slice(0, 9)}, HEAD ${head.slice(0, 9)}) — repose-le`,
    };
  }
  if (verdict.verdict !== 'GO') {
    return { go: false, detail: verdict.motif ? `NO-GO : ${verdict.motif}` : 'NO-GO (sans motif)' };
  }
  return { go: true };
}

/** Une passe EFFECTIVE, prête à lister ou à jouer : avec sa source et son drapeau « sautée ». */
export interface EffectivePass {
  readonly id: string;
  readonly title: string;
  /** Commande shell ; `''` quand la passe est sautée (tests sans `release.tests`). */
  readonly command: string;
  /** D'où vient la passe : socle de la méthode (`defaut`) ou fichier projet (`projet`). */
  readonly source: 'defaut' | 'projet';
  /** `false` = SAUTÉE : elle ne se joue pas et ne bloque pas (aujourd'hui, la seule est `tests`). */
  readonly run: boolean;
}

/**
 * La liste ORDONNÉE des passes effectives d'un projet, pour `ezk release` comme pour
 * `ezk release passes list` (même ordre, même source — un seul calcul, pas deux).
 *
 * Par défaut le projet COMPLÈTE le socle : d'abord `dod-mecanique`, `chasse-aux-bugs`, la passe
 * `tests` (jouée si `release.tests`, sinon SAUTÉE), puis les passes du projet. Avec `replace`, le
 * projet REMPLACE le socle : ses passes seules. En mode « complète », un id de passe projet qui
 * réutilise un id du socle est REFUSÉ (jamais deux passes homonymes).
 */
export function effectivePasses(
  project: readonly ReleasePass[],
  replace: boolean,
  testsCommand: string | null,
): readonly EffectivePass[] {
  const out: EffectivePass[] = [];
  if (!replace) {
    const socleIds = new Set<string>([...DEFAULT_PASSES.map((p) => p.id), TESTS_PASS_ID]);
    const clash = project.find((p) => socleIds.has(p.id));
    if (clash !== undefined) {
      throw new Error(
        `Passe projet « ${clash.id} » : cet id est déjà celui d'une passe du socle. Choisis un autre id, ou pose « replace: true » pour remplacer le socle.`,
      );
    }
    for (const p of DEFAULT_PASSES) out.push({ id: p.id, title: p.title, command: p.command, source: 'defaut', run: true });
    out.push(
      testsCommand === null
        ? { id: TESTS_PASS_ID, title: TESTS_PASS_TITLE, command: '', source: 'defaut', run: false }
        : { id: TESTS_PASS_ID, title: TESTS_PASS_TITLE, command: testsCommand, source: 'defaut', run: true },
    );
  }
  for (const p of project) out.push({ id: p.id, title: p.title, command: p.command, source: 'projet', run: true });
  return out;
}

/** Substitue `{root}` et `{version}` dans une commande de passe. */
export function substitute(command: string, vars: { root: string; version: string }): string {
  return command.replaceAll('{root}', vars.root).replaceAll('{version}', vars.version);
}

/**
 * GO sauf si une passe bloque. Trois états : GO et SKIP (sautée) ne bloquent pas ; seule une
 * passe NO-GO non sautée fait basculer le verdict. Zéro passe = rien ne bloque = GO.
 */
export function aggregate(results: readonly PassResult[]): 'GO' | 'NO-GO' {
  return results.some((r) => !r.go && r.skipped !== true) ? 'NO-GO' : 'GO';
}

/** Le réglage `release` d'un projet : la gate (active par défaut) et la commande de tests. */
export interface ReleaseConfig {
  /** La gate est ACTIVE par défaut (comme GitHub, défaut sûr) ; `release.gate: off`/`false` la coupe. */
  readonly gate: boolean;
  /** La commande de tests du projet (`release.tests`), ou `null` quand elle n'est pas déclarée. */
  readonly tests: string | null;
}

/**
 * Résout le réglage `release` (sous-arbre déjà parsé de `.vectorz/config.yml`).
 * `release.gate: off`/`false` coupe la gate ; tout le reste (absent, true, forme inattendue)
 * la laisse ACTIVE — jamais de coupure silencieuse par une faute de frappe.
 * `release.tests` donne la commande de tests : absente ou vide vaut « pas de commande » (la passe
 * tests sera SAUTÉE) ; une valeur qui n'est pas une chaîne est REFUSÉE, en nommant la clé et la
 * valeur — jamais un réglage ignoré en silence.
 */
export function resolveRelease(release: unknown): ReleaseConfig {
  let gate = true;
  let tests: string | null = null;
  if (release && typeof release === 'object') {
    const r = release as { gate?: unknown; tests?: unknown };
    if (r.gate === false || r.gate === 'off') gate = false;
    if (r.tests !== undefined && r.tests !== null) {
      if (typeof r.tests !== 'string') {
        throw new Error(
          `Réglage release.tests invalide : attendu une commande de tests (chaîne), reçu ${JSON.stringify(r.tests)}.`,
        );
      }
      const trimmed = r.tests.trim();
      if (trimmed !== '') tests = trimmed;
    }
  }
  return { gate, tests };
}

/**
 * Pourquoi la gate refuse l'étiquette `version` sur le commit `head`, ou `undefined` si elle l'autorise.
 * Un verdict établi sur un autre commit que HEAD est périmé. Partagé par `close --tag` et `version tag`.
 */
export function gateRefusal(verdict: ReleaseVerdict | undefined, head: string, version: string): string | undefined {
  if (verdict === undefined) return `aucune gate de release jouée — lance d'abord : ezk release ${version}`;
  if (verdict.head && verdict.head !== head) {
    return `gate de release périmée (jouée sur ${verdict.head.slice(0, 9)}, HEAD = ${head.slice(0, 9)}) — rejoue : ezk release ${version}`;
  }
  if (verdict.verdict !== 'GO') {
    return `gate de release NO-GO (passes bloquantes : ${verdict.passes.filter((p) => !p.go).map((p) => p.id).join(', ') || '—'})`;
  }
  return undefined;
}

/** Rend le compte rendu de release : verdict d'abord (En clair), puis une ligne par passe. */
export function renderReleaseReport(v: ReleaseVerdict): string {
  const mark = (p: PassResult): string => (p.skipped ? 'SKIP ' : p.go ? 'GO   ' : 'NO-GO');
  const head = v.verdict === 'GO'
    ? `En clair : ${v.version} est GO — toutes les passes sont vertes (une passe sautée est dite, pas comptée), le tag est autorisé.`
    : `En clair : ${v.version} est NO-GO — au moins une passe bloque, le tag est refusé tant que ce n'est pas traité.`;
  const lines = [head, '', `Release gate ${v.version} — verdict : ${v.verdict}`];
  for (const p of v.passes) {
    lines.push(`  [${mark(p)}] ${p.id} — ${p.title}`);
    if (p.detail && (p.skipped || !p.go)) lines.push(`           ↳ ${p.detail}`);
  }
  return lines.join('\n');
}
