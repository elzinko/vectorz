/**
 * Loader du registre des renommages (renames.yml, racine du produit) — frontière
 * entrante. Fichier ABSENT = registre vide (aucun renommage à nettoyer). Entrée mal
 * formée = erreur franche : c'est notre registre, il n'a pas le droit d'être flou.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { RenameEntry } from '../io/apply.js';

export function loadRenames(rootDir: string): RenameEntry[] {
  const path = join(rootDir, 'renames.yml');
  if (!existsSync(path)) return [];
  const raw = parseYaml(readFileSync(path, 'utf8')) as { renames?: unknown };
  const list = raw?.renames;
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list)) throw new Error('renames.yml : `renames` doit être une liste');
  return list.map((entry, i) => {
    const e = entry as Partial<RenameEntry>;
    if (
      typeof e?.ancien !== 'string' ||
      typeof e?.nouveau !== 'string' ||
      (e?.kind !== 'skill' && e?.kind !== 'agent')
    ) {
      throw new Error(`renames.yml : entrée ${i} mal formée (ancien/nouveau/kind requis)`);
    }
    return { ancien: e.ancien, nouveau: e.nouveau, kind: e.kind };
  });
}
