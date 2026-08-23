/**
 * Loader du document de méthode (method/ceremonies.yml) — frontière entrante, comme
 * catalog.ts. Lit et parse ; la VALIDATION contre le catalogue vit dans
 * src/core/ceremonies.ts (validateMethod), appelée par le compilateur de carte.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { MethodDoc } from '../core/ceremonies.js';

export function loadMethodDoc(rootDir: string): MethodDoc {
  const path = join(rootDir, 'method', 'ceremonies.yml');
  if (!existsSync(path)) {
    throw new Error(`document de méthode introuvable : ${path}`);
  }
  return parseYaml(readFileSync(path, 'utf8')) as MethodDoc;
}
