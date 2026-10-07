/**
 * Loader du catalogue des moments (moments.yml, à la racine du produit) — frontière
 * entrante. Lit, parse, et VALIDE (src/core/moments.ts). Jette si le catalogue est
 * malformé. Calqué sur le loader de la taxonomie.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { type MomentsDoc, validateMomentsDoc } from '../core/moments.js';

export function loadMomentsDoc(rootDir: string): MomentsDoc {
  const path = join(rootDir, 'moments.yml');
  if (!existsSync(path)) {
    throw new Error(`catalogue des moments introuvable : ${path}`);
  }
  return validateMomentsDoc(parseYaml(readFileSync(path, 'utf8')));
}
