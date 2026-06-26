#!/usr/bin/env tsx
/**
 * lawgiver — CLI du moteur déterministe (ADR-0003).
 *
 *   lawgiver bind <profile> <projet> [host]   (host par défaut : claude-code)
 *
 * Parse les args, calcule le plan PUR (`bind`) puis l'applique via la coquille
 * I/O unique (`applyPlan`). Aucune logique métier ici.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { bind } from '../src/core/bind.js';
import { applyPlan } from '../src/io/apply.js';
import type { HostId } from '../src/domain/model.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function usage(): never {
  console.error('Usage: lawgiver bind <profile> <projet> [host]');
  process.exit(2);
}

function runBind(profile: string, projectDir: string, host: HostId): void {
  const absoluteProject = resolve(projectDir);
  const plan = bind(profile, absoluteProject, host, repoRoot);
  applyPlan(plan, absoluteProject);
  const files = plan.files.length;
  const hooks = plan.hooks.length;
  console.log(
    `lawgiver: bind '${profile}' → ${absoluteProject} [${host}] : ${files} fichier(s), ${hooks} hook(s).`,
  );
}

function main(argv: string[]): void {
  const [command, profile, projectDir, host = 'claude-code'] = argv;
  if (command !== 'bind' || !profile || !projectDir) usage();
  runBind(profile, projectDir, host);
}

main(process.argv.slice(2));
