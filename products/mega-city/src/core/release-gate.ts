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
  /** Première ligne utile de la sortie (pour nommer ce qui a bloqué). */
  readonly detail?: string;
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
    title: 'Chasse aux bugs adverse — verdict ezk-reviewer requis (fichier .vectorz/release/{version}.bughunt-go)',
    command: 'test -f {root}/.vectorz/release/{version}.bughunt-go',
  },
];

/** Substitue `{root}` et `{version}` dans une commande de passe. */
export function substitute(command: string, vars: { root: string; version: string }): string {
  return command.replaceAll('{root}', vars.root).replaceAll('{version}', vars.version);
}

/** GO seulement si toutes les passes jouées sont GO. Zéro passe = rien ne bloque = GO. */
export function aggregate(results: readonly PassResult[]): 'GO' | 'NO-GO' {
  return results.every((r) => r.go) ? 'GO' : 'NO-GO';
}

/** Le réglage `release.gate` d'un projet. Défaut : la gate est ACTIVE (comme GitHub, défaut sûr). */
export interface ReleaseConfig {
  readonly gate: boolean;
}

/**
 * Résout le réglage `release` (sous-arbre déjà parsé de `.vectorz/config.yml`).
 * `release.gate: off`/`false` coupe la gate ; tout le reste (absent, true, forme inattendue)
 * la laisse ACTIVE — jamais de coupure silencieuse par une faute de frappe.
 */
export function resolveRelease(release: unknown): ReleaseConfig {
  if (release && typeof release === 'object') {
    const gate = (release as { gate?: unknown }).gate;
    if (gate === false || gate === 'off') return { gate: false };
  }
  return { gate: true };
}

/** Rend le compte rendu de release : verdict d'abord (En clair), puis une ligne par passe. */
export function renderReleaseReport(v: ReleaseVerdict): string {
  const mark = (go: boolean): string => (go ? 'GO  ' : 'NO-GO');
  const head = v.verdict === 'GO'
    ? `En clair : ${v.version} est GO — toutes les passes sont vertes, le tag est autorisé.`
    : `En clair : ${v.version} est NO-GO — au moins une passe bloque, le tag est refusé tant que ce n'est pas traité.`;
  const lines = [head, '', `Release gate ${v.version} — verdict : ${v.verdict}`];
  for (const p of v.passes) {
    lines.push(`  [${mark(p.go)}] ${p.id} — ${p.title}`);
    if (!p.go && p.detail) lines.push(`           ↳ ${p.detail}`);
  }
  return lines.join('\n');
}
