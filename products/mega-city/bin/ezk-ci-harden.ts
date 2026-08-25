#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from 'node:fs';
import { auditWorkflow, applyHardening } from '../src/ci/harden.js';

/**
 * CLI de `ezk-ci harden` : audite un workflow, et l'applique avec `--apply`.
 * Sans `--apply`, c'est strictement lecture seule (aucune écriture).
 */
function main(argv: string[]): number {
  const apply = argv.includes('--apply');
  const file = argv.find((arg) => !arg.startsWith('--'));

  if (!file) {
    console.error('usage: tsx bin/ezk-ci-harden.ts <workflow.yml> [--apply]');
    return 2;
  }

  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    console.error(`✗ Fichier introuvable ou illisible : ${file}`);
    return 2;
  }

  let audit: ReturnType<typeof auditWorkflow>;
  try {
    audit = auditWorkflow(text);
  } catch {
    console.error(`✗ YAML non parsable : ${file} (rien n'a été modifié).`);
    return 2;
  }

  const autoMissing = audit.patterns.filter((p) => !p.present && p.autoApplicable);
  const notes = audit.patterns.filter((p) => !p.present && !p.autoApplicable);

  if (audit.patterns.length === 0) {
    console.log(`✓ ${file} — aucun pattern de frugalité applicable ici.`);
    return 0;
  }
  if (autoMissing.length === 0 && notes.length === 0) {
    console.log(`✓ ${file} — déjà frugal (aucun pattern manquant).`);
    return 0;
  }

  if (autoMissing.length > 0) {
    console.log(`Patterns de frugalité manquants dans ${file} :`);
    for (const pattern of autoMissing) console.log(`  - ${pattern.id} : ${pattern.reason}`);
  }
  for (const note of notes) console.log(`  ⚠ ${note.id} : ${note.reason}`);

  if (!apply) {
    if (autoMissing.length > 0) {
      console.log('\nMode audit (lecture seule). Relance avec --apply pour appliquer.');
    }
    return 0;
  }
  if (autoMissing.length === 0) return 0; // rien d'auto-applicable (que des notes)

  const { text: next, applied } = applyHardening(text);
  writeFileSync(file, next);
  console.log(`\n✓ Appliqué : ${applied.join(', ')} → ${file}`);
  return 0;
}

process.exit(main(process.argv.slice(2)));
