/**
 * deploy-probe — relevé en LECTURE SEULE d'un chemin du poste (fiche 20260903134906920).
 * Bord I/O du diagnostic de déploiement : il regarde, il n'écrit jamais. Le cœur pur
 * (src/core/deploy-state.ts) range ensuite ce qu'il a vu.
 */
import { existsSync, lstatSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { PathFact } from '../core/deploy-state.js';

/** Ce qu'il y a à `<root>/<rel>` : rien, un fichier, un dossier, ou un lien (vivant ou mort). */
export function probePath(root: string, rel: string): PathFact {
  const absolute = join(root, rel);
  let stat: ReturnType<typeof lstatSync>;
  try {
    stat = lstatSync(absolute);
  } catch {
    return { kind: 'absent' };
  }
  if (stat.isSymbolicLink()) {
    // existsSync suit le lien : faux si la cible a disparu.
    return { kind: 'symlink', target: readlinkSync(absolute), alive: existsSync(absolute) };
  }
  return stat.isDirectory() ? { kind: 'dir' } : { kind: 'file' };
}
