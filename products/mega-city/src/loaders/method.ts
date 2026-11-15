/**
 * Loader des documents de méthode (method/ceremonies.yml, method/etapes.yml) — frontière entrante,
 * comme catalog.ts. Lit et parse ; la VALIDATION contre le catalogue vit dans le cœur :
 * src/core/ceremonies.ts (validateMethod) et src/core/process-show.ts (validateEtapes).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { MethodDoc } from '../core/ceremonies.js';
import type { EtapesDoc } from '../core/process-show.js';

function readMethodYaml(rootDir: string, file: string): unknown {
  const path = join(rootDir, 'method', file);
  if (!existsSync(path)) {
    throw new Error(`document de méthode introuvable : ${path}`);
  }
  return parseYaml(readFileSync(path, 'utf8'));
}

export function loadMethodDoc(rootDir: string): MethodDoc {
  return readMethodYaml(rootDir, 'ceremonies.yml') as MethodDoc;
}

/** Les étapes fines de chaque skill (fiche 20261110191135802), à valider par `validateEtapes`. */
export function loadEtapesDoc(rootDir: string): EtapesDoc {
  return readMethodYaml(rootDir, 'etapes.yml') as EtapesDoc;
}
