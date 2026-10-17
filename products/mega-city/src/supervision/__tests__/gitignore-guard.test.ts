/**
 * Garde `.supervision/` (ADR-079 §D7, fiche T1 20261015133600298).
 *
 * `.supervision/` est le journal local du kit émetteur : il ne doit JAMAIS être
 * suivi par git, sur AUCUNE branche. Le mécanisme, c'est l'entrée committée dans
 * le `.gitignore` racine — ignorée partout où ce commit est présent. Ce garde
 * empêche sa suppression silencieuse (qui ferait tracker le journal → churn).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Remonte jusqu'à la racine du dépôt (dossier portant une entrée `.git`). */
function findRepoRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error('racine du dépôt introuvable depuis ' + start);
    dir = parent;
  }
}

describe('garde .gitignore — .supervision/ ignoré sur toute branche (ADR-079 §D7)', () => {
  it('le .gitignore racine committé contient l’entrée .supervision/', () => {
    const root = findRepoRoot(__dirname);
    const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
    const entries = gitignore.split('\n').map((line) => line.trim());

    expect(entries).toContain('.supervision/');
  });
});
