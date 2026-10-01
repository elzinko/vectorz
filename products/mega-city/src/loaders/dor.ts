/**
 * Loader — lit le manifeste de DoR du projet `.vectorz/dor.yml` (ou `.yaml`) — frontière entrante
 * (ADR-0003). Même couche que `config.yml` et `rules.yml` (ADR-0050).
 *
 * - Fichier absent → `undefined` : le projet n'a pas de slot, le socle 3+1 seul (non-régression).
 * - YAML MALFORMÉ → erreur explicite avec le chemin : un manifeste cassé est une erreur à SIGNALER,
 *   jamais à masquer en le prenant pour « pas de slot » (ce serait éteindre le gate en silence).
 * - La FORME du contenu est jugée par le cœur pur (`core/dor-manifest.ts`), pas ici.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { PROJECT_CONFIG_DIR } from './project-config.js';

/** Noms acceptés ; `.yml` prioritaire s'il coexiste avec `.yaml`. */
export const DOR_FILE_NAMES = ['dor.yml', 'dor.yaml'] as const;

export interface LoadedDor {
  /** Chemin absolu du fichier lu. */
  readonly file: string;
  /** Le YAML parsé, brut. */
  readonly raw: unknown;
}

export function loadDor(projectRoot: string): LoadedDor | undefined {
  for (const name of DOR_FILE_NAMES) {
    const file = join(projectRoot, PROJECT_CONFIG_DIR, name);
    if (!existsSync(file)) continue;
    try {
      return { file, raw: parseYaml(readFileSync(file, 'utf8')) };
    } catch (cause) {
      throw new Error(`Manifeste DoR illisible (YAML malformé) : ${file}`, { cause });
    }
  }
  return undefined;
}
