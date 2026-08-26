import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readField } from '../../loaders/fiches.js';
import { findDuplicateIds, validateFicheFrontMatter } from '../fiche-validator.js';

/**
 * Gate de conformité du CORPUS réel (fiche 652, ADR-0040 étape 3). Ce test EST le gate :
 * il fait échouer la suite — donc la CI — dès qu'une fiche `features/*.md` devient non
 * conforme (front-matter hors-enum, champ requis manquant, id dupliqué). Frugal : pas de
 * config CI, pas de minutes runner supplémentaires — la suite tourne déjà.
 */

/** Remonte jusqu'à la racine du monorepo (contient `features/` ET `products/`). */
function findRepoRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'features')) && existsSync(join(dir, 'products'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('racine du dépôt introuvable depuis ' + start);
}

function listFiches(root: string): string[] {
  const files: string[] = [];
  for (const dir of [join(root, 'features'), join(root, 'features', 'done')]) {
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (/^\d/.test(name) && name.endsWith('.md')) files.push(join(dir, name));
    }
  }
  return files.sort();
}

describe('conformité du corpus réel (gate — fiche 652, ADR-0040 étape 3)', () => {
  const repoRoot = findRepoRoot(dirname(fileURLToPath(import.meta.url)));

  it('toutes les fiches features/ sont conformes (front-matter valide + ids uniques)', () => {
    const files = listFiches(repoRoot);
    expect(files.length).toBeGreaterThan(0);

    const monorepo = existsSync(join(repoRoot, 'products'));
    const anomalies = [];
    const idEntries: { file: string; id: string }[] = [];
    for (const path of files) {
      const rel = path.slice(repoRoot.length + 1);
      const text = readFileSync(path, 'utf8');
      anomalies.push(...validateFicheFrontMatter(rel, text, { monorepo }));
      idEntries.push({ file: rel, id: readField(text, 'id') });
    }
    anomalies.push(...findDuplicateIds(idEntries));

    // Message lisible si ça casse : la liste des anomalies apparaît dans le diff attendu/reçu.
    expect(anomalies).toEqual([]);
  });
});
