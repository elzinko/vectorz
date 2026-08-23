/**
 * Loader de la taxonomie (taxonomie.yml, à la racine du produit) — frontière entrante.
 * Lit et parse ; la VALIDATION (complétude, ids, bandes) vit dans src/core/taxonomie.ts.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { TaxonomieDoc } from '../core/taxonomie.js';

export function loadTaxonomieDoc(rootDir: string): TaxonomieDoc {
  const path = join(rootDir, 'taxonomie.yml');
  if (!existsSync(path)) {
    throw new Error(`taxonomie introuvable : ${path}`);
  }
  return parseYaml(readFileSync(path, 'utf8')) as TaxonomieDoc;
}
