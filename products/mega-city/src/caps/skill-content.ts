/**
 * Skills matérialisées en DOSSIERS importables (`<prefix>/<id>/SKILL.md` + assets) —
 * DÉTERMINISTE et PUR (ADR-0014, ADR-0027). Logique unique partagée par les caps
 * « skills-en-dossiers » :
 *   - claude-code-global → prefix = 'skills' (sous la racine `~/.claude/`)
 *   - claude-desktop     → prefix = ''       (la cible EST le dossier importé)
 * Voisin d'`agent-content.ts` : un helper de domaine, pas de couplage cap↔cap (DIP/SRP).
 *
 * Une skill n'est matérialisée que si son contenu est réellement présent (`content` non
 * blanc). `assertSafeId` interdit tout traversal de chemin via l'`id` ET via le chemin
 * relatif d'un asset (les deux sources de sous-chemin). Le `content` du SKILL.md est
 * normalisé (`trim()` + `\n`) ; les assets sont écrits VERBATIM (fidélité byte des scripts),
 * avec `mode 0o755` s'ils sont exécutables (ADR-0027).
 */
import { assertSafeId } from '../loaders/catalog.js';
import type { FileWrite, ResolvedProfile } from '../domain/model.js';

const EXECUTABLE = 0o755;
const NON_EXECUTABLE = 0o644;

/**
 * `<prefix>/<id>/<rel>`, sûr même quand `prefix` est vide (jamais de slash en tête).
 * `id` ET `rel` passent par `assertSafeId` au moment où ils deviennent un chemin de sortie
 * (défense frontière F1) : `assertSafeId` accepte le `/` interne, donc `approaches/x.md`
 * est validé tel quel, tandis que `..`/absolu/antislash/NUL sont refusés.
 */
function skillFilePath(prefix: string, id: string, rel: string): string {
  const withinSkill = `${assertSafeId(id)}/${assertSafeId(rel)}`;
  return prefix ? `${prefix}/${withinSkill}` : withinSkill;
}

/**
 * Les `FileWrite` d'un skill à contenu non vide : `<prefix>/<id>/SKILL.md` PLUS un fichier
 * par asset (`approaches/*.md`, `scripts/*.sh`…). Non trié (le cap ordonne).
 */
export function skillFolderFiles(resolved: ResolvedProfile, prefix: string): FileWrite[] {
  return resolved.skills
    .filter((skill) => skill.content.trim().length > 0)
    .flatMap((skill) => {
      const doc: FileWrite = {
        path: skillFilePath(prefix, skill.id, 'SKILL.md'),
        content: `${skill.content.trim()}\n`,
      };
      const assets: FileWrite[] = (skill.assets ?? []).map((asset) => ({
        path: skillFilePath(prefix, skill.id, asset.path),
        content: asset.content, // VERBATIM — pas de normalisation (ADR-0027)
        // Mode TOUJOURS explicite : sans lui, une ré-application in-place (cap desktop /
        // projet via applyPlan, sans rm préalable) laisserait survivre un ancien bit +x
        // quand l'asset redevient non-exécutable (finding Codex PR #138).
        mode: asset.executable ? EXECUTABLE : NON_EXECUTABLE,
      }));
      return [doc, ...assets];
    });
}
