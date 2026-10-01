/**
 * Bord I/O de `ship-fiche` (fiche 20260830194601233) : le dépôt réel derrière les deux
 * interfaces injectées dans le cœur (`RepoFs` pour lire, `ShipIo` pour écrire et déplacer).
 * Aucune décision ici : le cœur (`src/backlog/ship-fiche.ts`) juge, ce fichier exécute.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RepoFs, ShipIo } from '../backlog/ship-fiche.js';

/** Le markdown suivi OU non ignoré : une fiche pas encore `git add` compte aussi. */
export function nodeRepoFs(root: string): RepoFs {
  return {
    markdownFiles: () =>
      execFileSync('git', ['ls-files', '-co', '--exclude-standard', '--', '*.md'], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      })
        .split('\n')
        .filter((path) => path !== '' && existsSync(join(root, path))),
    read: (path) => readFileSync(join(root, path), 'utf8'),
    exists: (path) => existsSync(join(root, path)),
  };
}

export function nodeShipIo(root: string, regenBacklog: () => void): ShipIo {
  return {
    read: (path) => readFileSync(join(root, path), 'utf8'),
    write: (path, content) => writeFileSync(join(root, path), content),
    gitMove: (sources, destDir) => {
      mkdirSync(join(root, destDir), { recursive: true }); // 1er ship d'un projet : `done/` n'existe pas encore
      execFileSync('git', ['mv', ...sources, destDir], { cwd: root, stdio: 'pipe' });
    },
    regenBacklog,
  };
}
