#!/usr/bin/env tsx
/**
 * lawgiver — CLI du moteur déterministe (ADR-0003 / ADR-0004).
 *
 *   lawgiver bind <profile> <projet> [host]          (host par défaut : claude-code)
 *   lawgiver bind-global <profile>                   (matérialise dans ~/.claude — fiche 0017)
 *   lawgiver capture <cible> <kind> --content "<md>"  (kind = rule|skill|agent|interaction)
 *
 * Parse les args, calcule un plan PUR puis l'applique via la coquille I/O unique.
 * Aucune logique métier ici. Pour `capture`, le markdown est fourni par `--content`
 * (les vrais ports LLM author/judge sont injectés ailleurs ; le POC ne câble aucun
 * appel LLM réel — ADR-0004 §2).
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { bind } from '../src/core/bind.js';
import { applyPlan, applyGlobalPlan } from '../src/io/apply.js';
import { planCapture } from '../src/core/capture.js';
import { applyCapture } from '../src/io/capture.js';
import type { HostId, LearningEntry } from '../src/domain/model.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function usage(): never {
  console.error('Usage: lawgiver bind <profile> <projet> [host]');
  console.error('       lawgiver bind-global <profile>');
  console.error('       lawgiver capture <cible> <kind> --content "<markdown>"');
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

/**
 * bind-global — matérialise un profil dans `~/.claude` (fiche 0017). SEUL point qui
 * résout la racine globale ; le cœur (cap + plan) la reçoit en paramètre. Coquille
 * I/O non-destructive : ne remplace que ses propres entrées.
 */
function runBindGlobal(profile: string): void {
  const root = join(homedir(), '.claude');
  const plan = bind(profile, root, 'claude-code-global', repoRoot);
  applyGlobalPlan(plan, root);
  console.log(
    `lawgiver: bind-global '${profile}' → ${root} [claude-code-global] : ${plan.files.length} fichier(s).`,
  );
}

const CAPTURE_KINDS: ReadonlyArray<LearningEntry['kind']> = ['rule', 'skill', 'agent', 'interaction'];

function isCaptureKind(value: string): value is LearningEntry['kind'] {
  return (CAPTURE_KINDS as readonly string[]).includes(value);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function runCapture(target: string, kind: string, content: string): void {
  if (!isCaptureKind(kind)) usage();
  const plan = planCapture(target, kind, content, today());
  applyCapture(plan, repoRoot);
  console.log(`lawgiver: capture ${kind} '${target}' → ${plan.artifact.path} + journal + commit.`);
}

function parseContentFlag(args: string[]): string {
  const i = args.indexOf('--content');
  if (i === -1 || !args[i + 1]) usage();
  return args[i + 1];
}

function main(argv: string[]): void {
  const [command, ...rest] = argv;
  if (command === 'bind') {
    const [profile, projectDir, host = 'claude-code'] = rest;
    if (!profile || !projectDir) usage();
    return runBind(profile, projectDir, host);
  }
  if (command === 'bind-global') {
    const [profile] = rest;
    if (!profile) usage();
    return runBindGlobal(profile);
  }
  if (command === 'capture') {
    const [target, kind] = rest;
    if (!target || !kind) usage();
    return runCapture(target, kind, parseContentFlag(rest));
  }
  usage();
}

main(process.argv.slice(2));
