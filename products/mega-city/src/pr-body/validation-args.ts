/**
 * Les valeurs de `--validation` de `ezk pr emit-local` (fiche 20261117155515200).
 *
 * En clair : l'option peut être passée une fois, en forme à virgules (« Gate=✅,Revue=⏳ »), ou
 * plusieurs fois, une paire par option. Répétée, chaque valeur garde sa place, et une virgule dans un
 * statut ne le coupe plus. PUR : aucune I/O, le bord est `bin/pr-emit-local.ts`.
 */
import type { ValidationRow } from './render.js';

export type ValidationSpecs = { ok: true; rows: ValidationRow[] } | { ok: false; pair: string };

/** Les valeurs de `--validation`, dans l'ordre de la commande ; `undefined` si l'option est absente. */
export function parseValidationSpecs(specs: readonly string[]): ValidationSpecs | undefined {
  if (specs.length === 0) return undefined;
  const pairs = specs.length === 1 ? specs[0]!.split(',') : specs;
  const rows: ValidationRow[] = [];
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx < 0) return { ok: false, pair };
    rows.push({ modalite: pair.slice(0, idx).trim(), statut: pair.slice(idx + 1).trim() });
  }
  return { ok: true, rows };
}
