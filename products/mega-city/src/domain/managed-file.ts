/**
 * Le marqueur « ce fichier est à lawgiver » — fiche 20260813095351680, dans la suite d'ADR-0027 / ADR-0056.
 *
 * `bind-global` en mode COPIE ne remplace que ce qu'il peut PROUVER être à lui. Un dossier de skill se
 * reconnaît à son contenu (ADR-0027) ; le fichier de loi, à son en-tête (`law-file.ts`). Un agent (ou une
 * commande) copié est un fichier plat, sans rien de tel : sans marqueur, le 2ᵉ passage le prenait pour un
 * fichier de l'utilisateur et refusait de rejouer. Même remède que pour la loi : une clé d'en-tête YAML
 * que Claude Code ignore sans erreur, posée par le cap global dans le contenu du PLAN. `status` et `doctor`
 * comparent donc le même texte que celui qui est écrit.
 *
 * Le marqueur doit OUVRIR l'en-tête : cité ailleurs, il ne prouve rien.
 */
import { LAW_MARKER } from './law-file.js';

/** Une seule façon de dire « généré par lawgiver », pour la loi comme pour les copies. */
export const MANAGED_MARKER = LAW_MARKER;

const OPEN = `---\n${MANAGED_MARKER}\n`;

/** Ce contenu est-il celui que lawgiver a écrit ? */
export function isManagedFile(content: string): boolean {
  return content.startsWith(OPEN);
}

/**
 * Pose le marqueur en tête de l'en-tête YAML : dans l'en-tête existant s'il y en a un, sinon dans un
 * en-tête créé pour l'occasion. Idempotent.
 */
export function markManaged(content: string): string {
  if (isManagedFile(content)) return content;
  if (content.startsWith('---\n')) return `---\n${MANAGED_MARKER}\n${content.slice('---\n'.length)}`;
  return `---\n${MANAGED_MARKER}\n---\n${content}`;
}
