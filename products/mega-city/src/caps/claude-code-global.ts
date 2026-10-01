/**
 * Cap claude-code-global — DÉTERMINISTE et PUR (ADR-0003 ; fiche 0017 ; ADR-0006).
 *
 * Variante GLOBALE du cap claude-code : matérialise un profil résolu dans la racine
 * `~/.claude/` (skills + agents partagés entre tous les projets) au lieu d'un projet.
 * La racine est passée en PARAMÈTRE — seul le CLI résout `~/.claude`. Forme native :
 *   - skills/<id>/SKILL.md  ← un dossier par skill (comme claude-skills/install.sh)
 *   - agents/<id>.md        ← un fichier par agent (rôle markdown)
 *
 * PUR : ResolvedProfile → WritePlan, sans toucher au disque. La coquille I/O global
 * (src/io/apply.ts → applyGlobalPlan) applique le plan de façon NON-DESTRUCTIVE.
 * Le global porte l'équipe (skills + agents) ET le socle de loi du profil, compilé dans
 *   - rules/iamthelaw.md ← les règles du profil (ADR-0056 ; fiche 20260903134909124) : Claude
 *     Code charge `~/.claude/rules/*.md` dans chaque session, sous-agents compris.
 * Pas de hooks (pas de dépôt git ici) et pas de CLAUDE.md (fichier de l'utilisateur : on n'y
 * touche pas). Un profil sans règle n'émet pas de fichier de loi. Tri stable par `path` ⇒ plan
 * reproductible.
 */
import { assertSafeId } from '../loaders/catalog.js';
import type { Cap, FileWrite, ResolvedProfile } from '../domain/model.js';
import type { WritePlan } from '../domain/plan.js';
import { GLOBAL_LAW_PATH } from '../domain/law-file.js';
import { markManaged } from '../domain/managed-file.js';
import { agentContent } from './agent-content.js';
import { globalLawContent } from './law-content.js';
import { skillFolderFiles } from './skill-content.js';

/**
 * Un agent copié est un fichier plat : rien ne dit qu'il est « à lawgiver ». On pose le marqueur dans le
 * PLAN (donc `status` et `doctor` comparent le texte réellement écrit) pour que le 2ᵉ `bind-global` en
 * copie reconnaisse son fichier et le remplace, au lieu de le prendre pour celui de l'utilisateur.
 */
function agentFiles(resolved: ResolvedProfile): FileWrite[] {
  return resolved.agents.map((agent) => ({
    path: `agents/${assertSafeId(agent.id)}.md`,
    content: markManaged(agentContent(agent)),
  }));
}

/** La loi du profil, en UN fichier — absent si le profil ne porte aucune règle. */
function lawFiles(resolved: ResolvedProfile): FileWrite[] {
  if (resolved.rules.length === 0) return [];
  return [{ path: GLOBAL_LAW_PATH, content: globalLawContent(resolved.rules) }];
}

function materialize(resolved: ResolvedProfile, _root: string): WritePlan {
  // Skills en dossiers `skills/<id>/SKILL.md` — logique partagée (ADR-0014, prefix='skills').
  const files: FileWrite[] = [
    ...agentFiles(resolved),
    ...skillFolderFiles(resolved, 'skills'),
    ...lawFiles(resolved),
  ].sort((a, b) => a.path.localeCompare(b.path));
  return { files, hooks: [] };
}

export const claudeCodeGlobalCap: Cap = { host: 'claude-code-global', materialize };
