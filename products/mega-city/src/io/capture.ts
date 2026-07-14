/**
 * Coquille I/O de `capture` (ADR-0004) — la SEULE frontière I/O de la capture.
 *
 * Consomme un `CapturePlan` (calculé purement par `planCapture`) et le matérialise :
 *   - écrit l'artefact dans le catalogue (rules/ | skills/ | agents/) ;
 *   - APPEND la ligne au journal append-only (jamais de réécriture de l'existant) ;
 *   - `git add` (artefact + journal) puis `git commit` avec le message déterministe.
 *
 * Aucune logique métier ici : le « quoi écrire » vient entièrement du plan.
 */
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import type { AgentWiring, CapturePlan } from '../core/capture.js';

const JOURNAL_PATH = join('journal', 'learnings.md');

/** Défense en profondeur : tout chemin doit résoudre SOUS `rootDir` (cf. src/io/apply.ts). */
function resolveInsideRoot(rootDir: string, path: string): string {
  const root = resolve(rootDir);
  const absolute = resolve(root, path);
  if (absolute !== root && !absolute.startsWith(root + sep)) {
    throw new Error(`écriture hors du dépôt refusée : ${JSON.stringify(path)}`);
  }
  return absolute;
}

function writeArtifact(rootDir: string, path: string, content: string): void {
  const absolute = resolveInsideRoot(rootDir, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

/** Append-only : ajoute la ligne EN BAS, ne réécrit jamais le journal existant. */
function appendJournalLine(rootDir: string, line: string): void {
  const absolute = resolveInsideRoot(rootDir, JOURNAL_PATH);
  if (!existsSync(absolute)) {
    throw new Error(`journal introuvable : ${JSON.stringify(JOURNAL_PATH)}`);
  }
  // Garantit le séparateur : si le journal ne finit pas par un newline, on l'ajoute
  // avant la nouvelle ligne (sinon la table Markdown serait corrompue).
  const current = readFileSync(absolute, 'utf8');
  const sep = current.length > 0 && !current.endsWith('\n') ? '\n' : '';
  appendFileSync(absolute, `${sep}${line}\n`);
}

/**
 * Câblage frontmatter (fiche 0013) : lit l'agent ciblé, APPEND `idToAdd` à la liste
 * SI absent (idempotent), re-stringify stable via gray-matter, réécrit. Le SCRIPT
 * range — jamais le LLM (ADR-0004). Retourne le chemin modifié (à commiter), ou
 * `undefined` si aucun câblage.
 */
function applyAgentWiring(rootDir: string, wiring: AgentWiring | undefined): string | undefined {
  if (!wiring) return undefined;
  const absolute = resolveInsideRoot(rootDir, wiring.agentPath);
  if (!existsSync(absolute)) {
    throw new Error(`agent introuvable pour le câblage : ${JSON.stringify(wiring.agentPath)}`);
  }
  const parsed = matter(readFileSync(absolute, 'utf8'));
  const list: string[] = Array.isArray(parsed.data[wiring.listField])
    ? parsed.data[wiring.listField]
    : [];
  if (list.includes(wiring.idToAdd)) return wiring.agentPath; // idempotent : rien à ajouter
  // On NE mute PAS `parsed.data` en place : gray-matter mémoise l'objet retourné
  // pour un input identique, une mutation corromprait ce cache partagé. On stringify
  // à partir d'une copie fraîche du frontmatter, l'objet d'origine reste intact.
  const nextData = { ...parsed.data, [wiring.listField]: [...list, wiring.idToAdd] };
  writeFileSync(absolute, matter.stringify(parsed.content, nextData));
  return wiring.agentPath;
}

/**
 * Commit SCOPÉ aux seuls chemins du plan : `git commit -- <paths>` n'embarque
 * jamais ce qui traînait dans l'index (isolation déterministe, cf. revue 0002).
 */
function commit(rootDir: string, paths: string[], message: string): void {
  execFileSync('git', ['add', '--', ...paths], { cwd: rootDir });
  execFileSync('git', ['commit', '--quiet', '-m', message, '--', ...paths], { cwd: rootDir });
}

/** Applique le plan de capture sur `rootDir`. */
export function applyCapture(plan: CapturePlan, rootDir: string): void {
  writeArtifact(rootDir, plan.artifact.path, plan.artifact.content);
  appendJournalLine(rootDir, plan.journalLine);
  const wiredAgentPath = applyAgentWiring(rootDir, plan.agentWiring);
  const paths = [plan.artifact.path, JOURNAL_PATH, ...(wiredAgentPath ? [wiredAgentPath] : [])];
  commit(rootDir, paths, plan.commitMessage);
}
