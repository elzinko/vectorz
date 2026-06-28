/**
 * Cap claude-code — DÉTERMINISTE et PUR (ADR-0003, critère #2 de la fiche 0001).
 *
 * ResolvedProfile → WritePlan, SANS toucher au disque. La coquille I/O
 * (src/io/apply.ts) applique le plan. Forme native de Claude Code :
 *   - .claude/agents/<id>.md        ← un fichier par agent (rôle markdown)
 *   - .claude/skills/<id>.md        ← une skill PAR skill dont le contenu existe
 *   - .iamthelaw/ENTRY.md           ← les règles compilées en texte (corps + level)
 *   - CLAUDE.md                     ← référence « lire .iamthelaw/ENTRY.md »
 *   - hooks commit-msg / …          ← un hook par enforcement type:hook (niveau 2)
 *
 * Tri stable des fichiers par `path` ⇒ plan reproductible byte-for-byte.
 */
import type { Cap, FileWrite, HookWrite, ResolvedProfile, Rule } from '../domain/model.js';
import type { WritePlan } from '../domain/plan.js';

const ENTRY_PATH = '.iamthelaw/ENTRY.md';
const CLAUDE_MD_REFERENCE = `> **iamthelaw** : avant toute action, lis et applique \`${ENTRY_PATH}\` (la loi de ce projet).`;

function agentFiles(resolved: ResolvedProfile): FileWrite[] {
  return resolved.agents.map((agent) => ({
    path: `.claude/agents/${agent.id}.md`,
    content: `${agent.role.trim()}\n`,
    intent: 'replace',
  }));
}

/** Une skill n'est matérialisée que si son contenu est réellement présent. */
function skillFiles(resolved: ResolvedProfile): FileWrite[] {
  return resolved.skills
    .filter((skill) => skill.content.trim().length > 0)
    .map((skill) => ({
      path: `.claude/skills/${skill.id}.md`,
      content: `${skill.content.trim()}\n`,
      intent: 'replace',
    }));
}

function compileRule(rule: Rule): string {
  return [`## ${rule.id}  \`[${rule.level}]\``, '', rule.content.trim(), ''].join('\n');
}

function entryFile(resolved: ResolvedProfile): FileWrite {
  const header = ['# I AM THE LAW', '', 'Règles compilées de ce projet (cap claude-code).', ''];
  const body = resolved.rules.map(compileRule);
  // Le cap POSSÈDE ENTRY.md → remplacement franc.
  return { path: ENTRY_PATH, content: [...header, ...body].join('\n'), intent: 'replace' };
}

function claudeMdFile(): FileWrite {
  // CLAUDE.md est PARTAGÉ avec l'humain → bloc managé (le reste préservé).
  return { path: 'CLAUDE.md', content: `${CLAUDE_MD_REFERENCE}\n`, intent: 'managed-block' };
}

/** Hook git déterministe qui valide le format Conventional Commits (enforcement niveau 2). */
function commitMsgHookScript(): string {
  return [
    '#!/bin/sh',
    '# Généré par lawgiver (cap claude-code) — enforcement: conventional-commits/format.',
    'msg=$(head -n1 "$1")',
    'pattern="^(feat|fix|chore|docs|refactor|test|perf|build|ci|style|revert)(\\(.+\\))?!?: .+"',
    'if ! printf "%s" "$msg" | grep -Eq "$pattern"; then',
    '  echo "[iamthelaw] commit refusé : message non conforme à Conventional Commits." >&2',
    '  echo "  format attendu : type(scope): sujet" >&2',
    '  exit 1',
    'fi',
    '',
  ].join('\n');
}

function collectHooks(resolved: ResolvedProfile): HookWrite[] {
  const hooks: HookWrite[] = [];
  for (const rule of resolved.rules) {
    for (const enforcement of rule.enforcements ?? []) {
      if (enforcement.type !== 'hook' || !enforcement.hook) continue;
      // Un hook perso préexistant qui diffère ne doit jamais être écrasé sans --force.
      hooks.push({
        stage: enforcement.hook.stage,
        script: commitMsgHookScript(),
        intent: 'skip-if-exists',
      });
    }
  }
  return hooks;
}

function materialize(resolved: ResolvedProfile, _projectDir: string): WritePlan {
  const files: FileWrite[] = [
    ...agentFiles(resolved),
    ...skillFiles(resolved),
    entryFile(resolved),
    claudeMdFile(),
  ].sort((a, b) => a.path.localeCompare(b.path));

  return { files, hooks: collectHooks(resolved) };
}

export const claudeCodeCap: Cap = { host: 'claude-code', materialize };
