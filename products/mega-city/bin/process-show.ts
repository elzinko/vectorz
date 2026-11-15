#!/usr/bin/env tsx
/**
 * process-show — les étapes fines de chaque skill (fiche 20261110191135802).
 *
 *   ezk process show                    # en clair : chaque skill, ses étapes, qui les joue
 *   ezk process show --json             # le contrat JSON versionné (contracts/process-show/)
 *   ezk --root <projet> process show    # la valeur des réglages lue dans un AUTRE projet
 *
 * Les étapes sont celles de la méthode (`method/etapes.yml`) ; `--root` ne change que la valeur des
 * réglages. Une déclaration que le compilateur refuse sort en erreur, code 1.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProcessShow } from '../src/core/process-show.js';
import { processShowData } from '../src/io/process-show.js';
import { projectRootOrExit } from '../src/io/project-root.js';

/** La sortie lisible : chaque skill, ses étapes numérotées, qui les joue et leurs réglages, puis les liens. */
function inClear(data: ProcessShow): string {
  const total = data.skills.reduce((n, s) => n + s.etapes.length, 0);
  const lines = [`En clair : la méthode déroule ${data.skills.length} skills, ${total} étapes.`];
  for (const s of data.skills) {
    lines.push('', `${s.id} — ${s.nom} : ${s.enClair}`);
    for (const e of s.etapes) {
      const reglages = e.reglages.map((r) => `${r.cle} = ${r.valeur}`).join(', ');
      lines.push(`  ${e.num}. ${e.titre} — ${e.joueePar.join(', ')}${reglages ? ` · ${reglages}` : ''}`);
    }
  }
  lines.push('', 'Liens', ...data.liens.map((l) => `  ${l.de} → ${l.vers} : ${l.libelle}`));
  return lines.join('\n');
}

const ownRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const { root, rest } = projectRootOrExit(ownRoot);
const args = rest.filter((a) => a !== '--');
const unknown = args.find((a) => a !== '--json');

// Pas de `process.exit` après la sortie : il couperait le JSON à 64 Ko dans un tuyau (constat du 2026-11-01).
if (unknown) {
  console.error(`option inconnue : ${unknown} — usage : ezk [--root <projet>] process show [--json]`);
  process.exitCode = 2;
} else {
  try {
    const data = processShowData(root);
    console.log(args.includes('--json') ? JSON.stringify(data, null, 1) : inClear(data));
  } catch (err) {
    // Une déclaration refusée, ou la config du projet illisible : l'erreur dit laquelle.
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
