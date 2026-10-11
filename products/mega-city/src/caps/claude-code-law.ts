/**
 * Cap claude-code-law — DÉTERMINISTE et PUR (ADR-0003 ; fiche 20261007115129448, ADR-0064).
 *
 * Variante LAW-ONLY du cap claude-code : elle pose la LOI du projet et le pointeur, et RIEN
 * d'autre. Elle n'écrit **ni** `.claude/agents` **ni** `.claude/skills` — c'est ce qui évite la
 * duplication circulaire quand un projet (vectorz) est la SOURCE de ses propres skills/agents : on
 * veut juste voir, versionnée et relisible dans le dépôt, la loi qui s'y applique.
 *   - .iamthelaw/ENTRY.md  ← les règles compilées en texte (corps + level)
 *   - CLAUDE.md            ← bloc managé « lire .iamthelaw/ENTRY.md » (le reste du fichier préservé)
 *   - hooks commit-msg / … ← un hook par enforcement type:hook (niveau 2), comme le cap claude-code
 *
 * Tri stable des fichiers par `path` ⇒ plan reproductible byte-for-byte.
 */
import type { Cap, FileWrite, HookWrite, ResolvedProfile } from '../domain/model.js';
import type { WritePlan } from '../domain/plan.js';
import { compileRule } from './law-content.js';

const ENTRY_PATH = '.iamthelaw/ENTRY.md';
const CLAUDE_MD_REFERENCE = `> **iamthelaw** : avant toute action, lis et applique \`${ENTRY_PATH}\` (la loi de ce projet).`;

function entryFile(resolved: ResolvedProfile): FileWrite {
  const header = ['# I AM THE LAW', '', 'Règles compilées de ce projet (cap claude-code-law).', ''];
  const body = resolved.rules.map(compileRule);
  // Le cap POSSÈDE ENTRY.md → remplacement franc.
  return { path: ENTRY_PATH, content: [...header, ...body].join('\n'), intent: 'replace' };
}

function claudeMdFile(): FileWrite {
  // CLAUDE.md est PARTAGÉ avec l'humain → bloc managé (le reste préservé).
  return { path: 'CLAUDE.md', content: `${CLAUDE_MD_REFERENCE}\n`, intent: 'managed-block' };
}

/** Un hook par enforcement type:hook — identique au cap claude-code (le loader a résolu le script). */
function collectHooks(resolved: ResolvedProfile): HookWrite[] {
  const hooks: HookWrite[] = [];
  for (const rule of resolved.rules) {
    for (const enforcement of rule.enforcements ?? []) {
      if (enforcement.type !== 'hook' || !enforcement.hook) continue;
      hooks.push({
        stage: enforcement.hook.stage,
        script: enforcement.hook.script,
        intent: 'skip-if-exists',
      });
    }
  }
  return hooks;
}

function materialize(resolved: ResolvedProfile, _projectDir: string): WritePlan {
  // Loi + pointeur SEULEMENT : pas d'agents, pas de skills (anti-duplication circulaire).
  const files: FileWrite[] = [entryFile(resolved), claudeMdFile()].sort((a, b) =>
    a.path.localeCompare(b.path),
  );
  return { files, hooks: collectHooks(resolved) };
}

export const claudeCodeLawCap: Cap = { host: 'claude-code-law', materialize };
