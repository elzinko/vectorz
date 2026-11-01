/**
 * law-show (bord I/O) — assemble le contrat JSON de la loi (fiche 20261101215342537).
 *
 * Lit ce que le cœur pur (`core/law-show.ts`) attend : le catalogue courant, la loi globale installée
 * (`<cible>/rules/iamthelaw.md`, là où `ezk law bind-global` la pose) et la loi du projet visé
 * (`<projet>/.iamthelaw/ENTRY.md`). Un fichier absent donne `texte: null`, jamais une loi vide.
 * `bin/law-show.ts` et le générateur d'exemples (`io/law-contract-files.ts`) passent tous deux par ici.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type LawShow, type LawText, buildLawShow } from '../core/law-show.js';
import { loadCatalog } from '../loaders/catalog.js';

export interface LawLocations {
  /** Le dossier où `bind-global` installe la loi globale (`~/.claude` par défaut côté commande). */
  target: string;
  /** La racine du projet dont on lit la loi. */
  projectRoot: string;
}

/** Un fichier de loi lu : son chemin, et son texte (`null` s'il n'existe pas). */
export function readLawText(chemin: string): LawText {
  return { chemin, texte: existsSync(chemin) ? readFileSync(chemin, 'utf8') : null };
}

export const globalLawPath = (target: string): string => join(target, 'rules', 'iamthelaw.md');
export const projectLawPath = (projectRoot: string): string => join(projectRoot, '.iamthelaw', 'ENTRY.md');

/** Le contrat JSON de la loi : le catalogue de `catalogRoot`, lu avec les lois installées. */
export function lawShowData(catalogRoot: string, where: LawLocations): LawShow {
  return buildLawShow({
    catalog: loadCatalog(catalogRoot),
    globale: readLawText(globalLawPath(where.target)),
    projet: readLawText(projectLawPath(where.projectRoot)),
  });
}
