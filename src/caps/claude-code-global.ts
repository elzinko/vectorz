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
 * Pas de hooks, pas de CLAUDE.md, pas de loi compilée : le global ne porte que
 * l'équipe (skills + agents). Tri stable par `path` ⇒ plan reproductible.
 */
import { assertSafeId } from '../loaders/catalog.js';
import type { Cap, FileWrite, ResolvedProfile } from '../domain/model.js';
import type { WritePlan } from '../domain/plan.js';

function agentFiles(resolved: ResolvedProfile): FileWrite[] {
  return resolved.agents.map((agent) => ({
    path: `agents/${assertSafeId(agent.id)}.md`,
    content: `${agent.role.trim()}\n`,
  }));
}

/** Une skill n'est matérialisée que si son contenu est réellement présent. */
function skillFiles(resolved: ResolvedProfile): FileWrite[] {
  return resolved.skills
    .filter((skill) => skill.content.trim().length > 0)
    .map((skill) => ({
      path: `skills/${assertSafeId(skill.id)}/SKILL.md`,
      content: `${skill.content.trim()}\n`,
    }));
}

function materialize(resolved: ResolvedProfile, _root: string): WritePlan {
  const files: FileWrite[] = [...agentFiles(resolved), ...skillFiles(resolved)].sort((a, b) =>
    a.path.localeCompare(b.path),
  );
  return { files, hooks: [] };
}

export const claudeCodeGlobalCap: Cap = { host: 'claude-code-global', materialize };
