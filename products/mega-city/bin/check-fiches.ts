#!/usr/bin/env tsx
/**
 * check-fiches — validateur de conformité des fiches (`features/*.md`), en mode
 * WARNING (ADR-0040 D2, fiche 652/281). Rapporte les anomalies de front-matter
 * (enum hors-liste, champ requis absent, `product:` conditionnel au monorepo) SANS
 * jamais échouer : exit 0 même s'il y a des anomalies. La bascule bloquante (exit
 * ≠ 0, préflight/CI) est explicitement hors périmètre de ce POC.
 *
 *   pnpm --dir products/mega-city fiches:check
 *
 * Le cœur (src/backlog/fiche-validator.ts) est pur ; ce script est le bord I/O
 * (liste les fichiers, détecte le monorepo, lit, agrège, imprime).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type FicheAnomaly, validateFicheFrontMatter } from '../src/backlog/fiche-validator.js';

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

  for (const path of files) {
    const relative = path.slice(repoRoot.length + 1);
    const text = readFileSync(path, 'utf8');
    anomalies.push(...validateFicheFrontMatter(relative, text, { monorepo }));
  }

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
  console.log(
    `En clair : ${files.length} fiches contrôlées, ${anomalies.length} anomalie(s) sur ` +
      `${byFile.size} fiche(s). Mode warning (ADR-0040 D2) : rien n'est bloquant, rien n'est modifié.`,
  );
  console.log();
  for (const [file, fileAnomalies] of byFile) {
    console.log(`  ${file}`);
    for (const a of fileAnomalies) {
      console.log(`    - ${a.field} : ${a.message}`);
    }
  }
  return 0; // volontaire : mode warning, cf. en-tête.
}

process.exit(main());
