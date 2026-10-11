/**
 * gen-ide — le cœur PUR du générateur multi-IDE (fiche 20261007151859470, ADR-0073).
 *
 * Une **source unique** (les commandes `ezk` du manifeste) → un jeu de fichiers PAR IDE, où seule
 * la **syntaxe d'invocation** diffère. On GÉNÈRE, on ne POINTE pas (les IDE ne suivent pas un
 * pointeur de façon fiable — prior art OpenSpec). Aucune I/O ici (ADR-0003) : le bord
 * `bin/lawgiver.ts gen-ide` lit le manifeste et écrit / vérifie.
 *
 * POC borné : deux IDE (`claude`, `cursor`) + `AGENTS.md` (standard ouvert), sur un sous-ensemble de
 * commandes. Le markdown par IDE ne porte AUCUNE logique : il ne fait qu'appeler `ezk …`. Étendre à
 * tout le manifeste et promouvoir les scripts en verbes = Suite.
 */

/** Une commande de la source unique, prête à rendre (le bord la dérive du manifeste). */
export interface CommandSpec {
  /** Nom de fichier (sans extension), ex. `backlog-check`. */
  readonly slug: string;
  /** L'invocation CLI rendue, ex. `ezk backlog check`. */
  readonly invocation: string;
  /** Résumé d'une ligne (sert de `description`). */
  readonly summary: string;
}

/** Un fichier généré : chemin relatif à la racine du projet + contenu. */
export interface GenFile {
  readonly path: string;
  readonly content: string;
}

/** Marqueur anti-dérive : un humain qui l'édite verra qu'il ne faut pas, et `--check` le détecte. */
export const GEN_MARKER = 'généré par `ezk law gen-ide` — NE PAS ÉDITER (régénère)';

/** Placeholder d'arguments PAR IDE — c'est le SEUL morceau qui diffère entre `.claude` et `.cursor`. */
const ARG_PLACEHOLDER: Record<IdeTarget, string> = {
  claude: '$ARGUMENTS',
  cursor: '{{args}}',
};

export type IdeTarget = 'claude' | 'cursor';
export const IDE_TARGETS: readonly IdeTarget[] = ['claude', 'cursor'];

/** Le fichier de commande d'un IDE : frontmatter `description` + un appel `ezk …`. */
function commandFile(cmd: CommandSpec, ide: IdeTarget): string {
  return [
    '---',
    `description: ${cmd.summary}`,
    '---',
    '',
    `<!-- ${GEN_MARKER} -->`,
    '',
    `Lance la commande \`ezk\` correspondante avec les arguments de l'utilisateur :`,
    '',
    '```bash',
    `${cmd.invocation} ${ARG_PLACEHOLDER[ide]}`,
    '```',
    '',
  ].join('\n');
}

/** `AGENTS.md` : le moyeu universel — la liste des commandes, lisible par tout outil. */
function agentsMd(cmds: readonly CommandSpec[]): string {
  const lines = [
    '# AGENTS.md — commandes `ezk`',
    '',
    `<!-- ${GEN_MARKER} -->`,
    '',
    "Ce projet expose les commandes `ezk` suivantes (même moteur, invocation selon l'outil) :",
    '',
  ];
  for (const c of cmds) lines.push(`- \`${c.invocation}\` — ${c.summary}`);
  lines.push('');
  return lines.join('\n');
}

/**
 * De la source unique vers tous les fichiers générés, triés par chemin (reproductible byte-for-byte).
 * `.claude/commands/<slug>.md` + `.cursor/commands/<slug>.md` par commande, plus `AGENTS.md`.
 */
export function genIdeFiles(cmds: readonly CommandSpec[]): GenFile[] {
  const files: GenFile[] = [];
  for (const ide of IDE_TARGETS) {
    for (const c of cmds)
      files.push({ path: `.${ide}/commands/${c.slug}.md`, content: commandFile(c, ide) });
  }
  files.push({ path: 'AGENTS.md', content: agentsMd(cmds) });
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
