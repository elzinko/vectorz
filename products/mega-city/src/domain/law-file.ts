/**
 * Le fichier de LOI du cap global — sa convention, partagée par ceux qui l'écrivent (le cap),
 * l'appliquent (la coquille I/O) et le diagnostiquent (`lawgiver doctor`). Fiche
 * 20260903134909124, ADR-0056.
 *
 * Claude Code charge `~/.claude/rules/*.md` dans chaque session, sans pointeur. Le fichier est
 * possédé par lawgiver : son en-tête porte un marqueur qui dit « généré, remplaçable ». Un
 * fichier du même nom SANS ce marqueur appartient à l'utilisateur et n'est jamais écrasé.
 */

/** Où le cap global range la loi, sous la racine de déploiement (`~/.claude`). */
export const GLOBAL_LAW_PATH = 'rules/iamthelaw.md';

/**
 * Le marqueur d'appartenance : une clé d'en-tête YAML. Claude Code retire l'en-tête avant de
 * lire une règle et n'y interprète que `paths` ; toute autre clé est ignorée sans erreur.
 */
export const LAW_MARKER = 'generated-by: lawgiver bind-global';

/** L'en-tête exact qui ouvre un fichier de loi généré. */
export const LAW_FRONT = `---\n${LAW_MARKER}\n---\n`;

/** Ce contenu est-il celui que lawgiver a écrit ? Le marqueur doit ouvrir le fichier. */
export function isManagedLaw(content: string): boolean {
  return content.startsWith(LAW_FRONT);
}
