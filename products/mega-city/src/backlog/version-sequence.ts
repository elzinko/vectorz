/**
 * version-sequence — la SUITE DE VERSIONS qu'un run multi-versions enchaîne (fiche 20261013131852375).
 *
 * En clair : `ezk-product-build run --versions all` ne fait plus UNE itération, il enchaîne les
 * versions à faire du plan, dans l'ordre, avec une frontière (rétro + clôture) à chacune. Ce module
 * calcule la liste ordonnée des versions à parcourir ; la boucle (SKILL.md) la déroule. C'est le POC :
 * il ne tague pas tout seul (fiche sœur auto-tag) et ne parke pas hors version (fiche sœur park).
 *
 * PUR (ADR-0003) : aucune I/O. Le bord `bin/run-versions.ts` charge les fiches et les étiquettes,
 * construit le `VersionsReport` (`versions.ts`) et imprime la suite. Les lots du report sont déjà
 * triés en ordre naturel, donc la suite sort dans l'ordre du plan sans retri.
 */
import { VERSION_FORMAT, type VersionsReport, compareLoose } from './versions.js';

export interface VersionSequenceInput {
  /** `all` = toutes les versions à faire, dans l'ordre ; sinon la liste explicite demandée. */
  versions: 'all' | readonly string[];
}

export interface VersionSequence {
  /** Les versions à enchaîner, dans l'ordre du plan (croissant). */
  sequence: string[];
  /** Versions demandées mais non retenues (inconnue, déjà livrée, rien à faire, format), avec la raison. */
  skipped: Array<{ version: string; reason: string }>;
}

/** Une version est « à faire » : son lot a des fiches à livrer ET aucune étiquette de release. */
const toBuild = (lot: { todo: readonly unknown[]; releaseTag?: string }): boolean =>
  lot.todo.length > 0 && lot.releaseTag === undefined;

/**
 * Calcule la suite de versions à enchaîner. `all` prend toutes les versions à faire, dans l'ordre.
 * Une liste explicite est filtrée et ordonnée pareil ; chaque version demandée mais non retenue est
 * **signalée** (jamais tue) : inconnue du plan, déjà livrée (étiquette posée), ou rien à faire.
 */
export function versionSequence(report: VersionsReport, input: VersionSequenceInput): VersionSequence {
  const byVersion = new Map(report.lots.map((l) => [l.version, l] as const));

  if (input.versions === 'all') {
    return { sequence: report.lots.filter(toBuild).map((l) => l.version), skipped: [] };
  }

  const sequence: string[] = [];
  const skipped: VersionSequence['skipped'] = [];
  const seen = new Set<string>();
  // L'ordre de SORTIE vient du plan (ordre naturel), pas de l'ordre où l'humain a tapé les versions.
  // `compareLoose` (jamais `compareVersions` nu) : un jeton illisible (`vnext`, `v1.2.0-rc.1`) rendrait
  // NaN et corromprait le tri des versions VALIDES entre elles. compareLoose range l'illisible en fin,
  // sans toucher l'ordre des lisibles ; l'illisible est ensuite écarté (VERSION_FORMAT) avec sa raison.
  const requested = [...new Set(input.versions)].sort(compareLoose);
  for (const version of requested) {
    if (seen.has(version)) continue;
    seen.add(version);
    if (!VERSION_FORMAT.test(version)) {
      skipped.push({ version, reason: 'format illisible (attendu v0.3.0)' });
      continue;
    }
    const lot = byVersion.get(version);
    if (lot === undefined) {
      skipped.push({ version, reason: 'aucune fiche ne porte cette version' });
      continue;
    }
    if (lot.releaseTag !== undefined) {
      skipped.push({ version, reason: `déjà livrée (étiquette ${lot.releaseTag})` });
      continue;
    }
    if (lot.todo.length === 0) {
      skipped.push({ version, reason: 'rien à faire (tout est livré ou parké)' });
      continue;
    }
    sequence.push(version);
  }
  return { sequence, skipped };
}
