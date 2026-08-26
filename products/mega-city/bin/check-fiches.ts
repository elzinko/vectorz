#!/usr/bin/env tsx
/**
 * check-fiches — validateur de conformité des fiches (`features/*.md`), en mode
 * WARNING par défaut (ADR-0040 D2, fiche 652/281). Rapporte les anomalies de front-matter
 * (enum hors-liste, champ requis absent, `product:` conditionnel au monorepo, id dupliqué)
 * sans échouer : exit 0. Avec `--strict`, devient un GATE bloquant (exit 1 sur anomalie) —
 * la bascule décidée par l'ADR-0040 (étape 3), sûre car le corpus est mesuré à 0 anomalie.
 *
 *   pnpm --dir products/mega-city fiches:check
 *
 * Le cœur (src/backlog/fiche-validator.ts) est pur ; ce script est le bord I/O
 * (liste les fichiers, détecte le monorepo, lit, agrège, imprime).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type FicheAnomaly,
  findDuplicateIds,
  validateFicheFrontMatter,
} from '../src/backlog/fiche-validator.js';
import { readField } from '../src/loaders/fiches.js';

const STRICT = process.argv.slice(2).includes('--strict');

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** Monorepo (vectorz) = plusieurs produits sous `products/`. Sinon backlog autonome. */
function isMonorepo(root: string): boolean {
  return existsSync(join(root, 'products'));
}

function listFicheFiles(root: string): string[] {
  const files: string[] = [];
  for (const dir of [join(root, 'features'), join(root, 'features', 'done')]) {
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (/^\d/.test(name) && name.endsWith('.md')) {
        files.push(join(dir, name));
      }
    }
  }
  return files.sort();
}

function main(): number {
  const monorepo = isMonorepo(repoRoot);
  const files = listFicheFiles(repoRoot);
  const anomalies: FicheAnomaly[] = [];
  const idEntries: { file: string; id: string }[] = [];

  for (const path of files) {
    const relative = path.slice(repoRoot.length + 1);
    const text = readFileSync(path, 'utf8');
    anomalies.push(...validateFicheFrontMatter(relative, text, { monorepo }));
    idEntries.push({ file: relative, id: readField(text, 'id') });
  }
  anomalies.push(...findDuplicateIds(idEntries));

  // En clair d'abord (règle human-facing-lisibility).
  if (anomalies.length === 0) {
    console.log(
      `En clair : ${files.length} fiches contrôlées, aucune anomalie de front-matter.`,
    );
    return 0;
  }

  const byFile = new Map<string, FicheAnomaly[]>();
  for (const a of anomalies) {
    const list = byFile.get(a.file) ?? [];
    list.push(a);
    byFile.set(a.file, list);
  }
  const mode = STRICT
    ? 'Mode strict (--strict) : bloquant, exit 1.'
    : 'Mode warning (ADR-0040 D2) : rien n’est bloquant, rien n’est modifié.';
  console.log(
    `En clair : ${files.length} fiches contrôlées, ${anomalies.length} anomalie(s) sur ` +
      `${byFile.size} fiche(s). ${mode}`,
  );
  console.log();
  for (const [file, fileAnomalies] of byFile) {
    console.log(`  ${file}`);
    for (const a of fileAnomalies) {
      console.log(`    - ${a.field} : ${a.message}`);
    }
  }
  return STRICT ? 1 : 0; // défaut warning (D2) ; --strict = gate bloquant (fiche 652, étape 3 de l'ADR-0040)
}

process.exit(main());
