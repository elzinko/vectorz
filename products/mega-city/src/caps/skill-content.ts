/**
 * Skills matérialisées en DOSSIERS importables (`<prefix>/<id>/SKILL.md`) — DÉTERMINISTE
 * et PUR (ADR-0014). Logique unique partagée par les caps « skills-en-dossiers » :
 *   - claude-code-global → prefix = 'skills' (sous la racine `~/.claude/`)
 *   - claude-desktop     → prefix = ''       (la cible EST le dossier importé)
 * Voisin d'`agent-content.ts` : un helper de domaine, pas de couplage cap↔cap (DIP/SRP).
 *
 * Une skill n'est matérialisée que si son contenu est réellement présent (`content` non
 * blanc) ; `assertSafeId` interdit tout traversal de chemin via l'id (la seule source de
 * sous-chemin). Le contenu est normalisé (`trim()` + `\n` final), identique aux deux caps.
 */
import { assertSafeId } from '../loaders/catalog.js';
import type { FileWrite, ResolvedProfile } from '../domain/model.js';

/** `<prefix>/<id>/SKILL.md`, sûr même quand `prefix` est vide (jamais de slash en tête). */
function skillDocPath(prefix: string, id: string): string {
  const doc = `${assertSafeId(id)}/SKILL.md`;
  return prefix ? `${prefix}/${doc}` : doc;
}

/** Un `FileWrite` `<prefix>/<id>/SKILL.md` par skill à contenu non vide. Non trié (le cap ordonne). */
export function skillFolderFiles(resolved: ResolvedProfile, prefix: string): FileWrite[] {
  return resolved.skills
    .filter((skill) => skill.content.trim().length > 0)
    .map((skill) => ({
      path: skillDocPath(prefix, skill.id),
      content: `${skill.content.trim()}\n`,
    }));
}
