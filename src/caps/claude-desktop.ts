/**
 * Cap claude-desktop — DÉTERMINISTE et PUR (ADR-0003 ; fiche 0003 ; ADR-0014).
 *
 * Matérialise les SKILLS d'un profil résolu en dossiers importables par Claude Desktop :
 *   - <id>/SKILL.md   ← un dossier par skill (la cible passée au cap EST le dossier importé)
 *
 * Skills SEULS : Claude Desktop ne consomme ni agents, ni loi compilée, ni hooks →
 * `hooks: []`, aucun fichier agent / CLAUDE.md / ENTRY.md. La logique « skill → dossier »
 * est partagée avec claude-code-global via `skillFolderFiles` (ici `prefix = ''`).
 * Tri stable par `path` ⇒ plan reproductible byte-for-byte.
 *
 * PUR : ResolvedProfile → WritePlan, sans toucher au disque. La coquille I/O
 * (src/io/apply.ts) applique le plan (`bind <profile> <dir> claude-desktop`).
 */
import type { Cap, ResolvedProfile } from '../domain/model.js';
import type { WritePlan } from '../domain/plan.js';
import { skillFolderFiles } from './skill-content.js';

function materialize(resolved: ResolvedProfile, _projectDir: string): WritePlan {
  const files = skillFolderFiles(resolved, '').sort((a, b) => a.path.localeCompare(b.path));
  return { files, hooks: [] };
}

export const claudeDesktopCap: Cap = { host: 'claude-desktop', materialize };
