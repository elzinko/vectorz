import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Cliquet anti-régression du guichet GitHub (ADR-0061, fiche 20261013074251767).
 *
 * En clair : `gh pr list` ne doit plus apparaître « au hasard » dans un script ou un texte de
 * skill sans passer par le guichet `ezk forge` ni respecter la config `.vectorz/`. Ce test est un
 * CLIQUET : il tient une liste des endroits où `gh pr list` est TOLÉRÉ aujourd'hui, chacun avec sa
 * raison. La liste peut rétrécir (on retire un chemin quand il disparaît), jamais grandir : ajouter
 * `gh pr list` dans un fichier hors de cette liste fait échouer le test.
 *
 * Périmètre : les scripts et textes de la méthode (bin/, src/, skills/) — pas les tests.
 */

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const NEEDLE = ['gh', 'pr', 'list'].join(' ');
const SCAN_DIRS = ['bin', 'src', 'skills'];
const SCAN_EXT = ['.sh', '.ts', '.md', '.mjs'];

/**
 * Les SEULS endroits autorisés à écrire `gh pr list`, chacun avec sa raison. Tout le reste doit
 * passer par le guichet `ezk forge changes` (bin/forge-changes.ts) ou être gaté sur la config.
 */
const ALLOWED: Readonly<Record<string, string>> = {
  // L'adaptateur lui-même — LE guichet, la seule porte assumée vers `gh`.
  'bin/forge-changes.ts': 'le guichet forge : l’adaptateur GitHub assumé (ADR-0061)',
  // Client gaté : lit le bundle PR (isDraft, map head→PR) que le guichet ne rend pas ; ne lance
  // plus gh en `github: false` (P2_GITHUB_OFF).
  'skills/ezk-archive/scripts/check.sh': 'bundle PR détaillé, gaté sur la config (github: false → aucun appel)',
  // Reconcile : lecture détaillée (match par id/corps) APRÈS la porte `ezk forge changes --merged`.
  'skills/ezk-backlog/SKILL.md': 'reconcile : listing détaillé derrière la porte du guichet (forge --merged)',
  // Prose de skills : décrivent le flux, n’exécutent rien par elles-mêmes.
  'skills/ezk-archive/SKILL.md': 'prose : décrit le gate P2 d’archivage',
  'skills/ezk-pr/SKILL.md': 'prose : décrit le flux PR et son repli local',
  'skills/ezk-sprint/SKILL.md': 'prose : décrit l’étape reconcile',
  // Collecte cockpit : état PR par branche pour l’affichage sessions ; best-effort, hors périmètre
  // de cette fiche (déconnexion fine suivie par le guichet).
  'src/io/sessions-collect.ts': 'collecte cockpit (affichage sessions), best-effort',
};

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === '__tests__') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.some((ext) => name.endsWith(ext))) out.push(full);
  }
}

describe('cliquet gh pr list — le guichet forge est le seul chemin assumé (fiche 20261013074251767)', () => {
  const files: string[] = [];
  for (const d of SCAN_DIRS) walk(join(megaCity, d), files);
  const found = files
    .filter((f) => readFileSync(f, 'utf8').includes(NEEDLE))
    .map((f) => relative(megaCity, f))
    .sort();

  it('aucun « gh pr list » hors de la liste tolérée (la liste ne grandit jamais)', () => {
    const intrus = found.filter((f) => !(f in ALLOWED));
    expect(intrus, `« gh pr list » ajouté hors du guichet : ${intrus.join(', ')} — passe par « ezk forge changes » ou gate sur la config, ou ajoute une raison à ALLOWED.`).toEqual([]);
  });

  it('chaque entrée de la liste existe encore (sinon on la retire — le cliquet rétrécit)', () => {
    const stale = Object.keys(ALLOWED).filter((f) => !found.includes(f));
    expect(stale, `entrées obsolètes de ALLOWED (le fichier ne contient plus « gh pr list ») : ${stale.join(', ')}`).toEqual([]);
  });
});
