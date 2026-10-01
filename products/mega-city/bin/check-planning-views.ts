#!/usr/bin/env tsx
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findStalePlanningViews, fmField } from '../src/backlog/planning-views.js';

/**
 * Filet CLI : signale toute fiche `shipped` encore présentée comme à faire dans
 * `PORTFOLIO.md` (généré) ou `features/PLAN.md` (curé). Lecture seule.
 * Exit 0 si à jour, 1 s'il reste des incohérences, 2 si une vue est introuvable.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');

/** id → statut réel, scanné sur `features/` (actifs) + `features/done/`. */
function loadStatuses(): Map<string, string> {
  const statusById = new Map<string, string>();
  for (const dir of [join(repoRoot, 'features'), join(repoRoot, 'features', 'done')]) {
    let files: string[];
    try {
      files = readdirSync(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!/^\d/.test(file) || !file.endsWith('.md')) continue;
      const content = readFileSync(join(dir, file), 'utf8');
      const id = fmField(content, 'id');
      if (id) statusById.set(id, fmField(content, 'status'));
    }
  }
  return statusById;
}

/** Lit une vue ; `null` si le fichier est absent (distinct d'un fichier vide). */
function readView(path: string): string | null {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function main(): number {
  const statusById = loadStatuses();
  const portfolio = readView(join(repoRoot, 'PORTFOLIO.md'));
  const plan = readView(join(repoRoot, 'features', 'PLAN.md'));

  // PLAN.md est committé et curé : son absence est une vraie erreur. PORTFOLIO.md, lui, est
  // construit à la demande et n'est plus committé (ADR-0055) : absent, il n'y a rien de périmé à
  // signaler ; présent (copie locale), il est contrôlé comme avant.
  if (plan === null) {
    console.error('✗ Vue de planning introuvable : features/PLAN.md');
    return 2;
  }

  const stale = findStalePlanningViews(statusById, portfolio ?? '', plan);
  if (stale.length === 0) {
    console.log('✓ Vues de planning à jour (aucune fiche livrée présentée comme à faire).');
    return 0;
  }

  const seen = new Set<string>();
  const unique = stale.filter((entry) => {
    const key = `${entry.id}-${entry.view}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`⚠ ${unique.length} fiche(s) livrée(s) encore présentée(s) comme à faire :`);
  for (const entry of unique) {
    console.log(`  - ${entry.id} — ${entry.view} (${entry.shown}) · ${entry.where}`);
  }
  console.log('\nCorrige : cure PLAN.md (barrer + « shipped #PR ») et, si PORTFOLIO.md traîne en local, `views:regen`.');
  return 1;
}

process.exit(main());
