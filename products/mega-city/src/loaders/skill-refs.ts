/**
 * Loader des textes à juger par `core/skill-refs.ts` — frontière entrante (I/O), comme `catalog.ts`.
 * Fiche 0066. Il LIT : le `SKILL.md` de chaque skill et le fichier de chaque agent. Rien ici ne juge.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { RefDoc } from '../core/skill-refs.js';

export interface RefDocs {
  /** Les documents, triés par chemin : sortie reproductible. */
  docs: RefDoc[];
  /** Un chemin depuis la racine du produit existe-t-il (`..` remonte à la racine du dépôt) ? */
  exists: (pathFromProductRoot: string) => boolean;
}

export function loadRefDocs(productRoot: string): RefDocs {
  const docs: RefDoc[] = [];

  const skillsDir = join(productRoot, 'skills');
  if (existsSync(skillsDir)) {
    for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
      const file = join(skillsDir, entry.name, 'SKILL.md');
      if (entry.isDirectory() && existsSync(file)) {
        docs.push({
          kind: 'skill',
          owner: entry.name,
          file: `skills/${entry.name}/SKILL.md`,
          text: readFileSync(file, 'utf8'),
        });
      }
    }
  }

  const agentsDir = join(productRoot, 'agents');
  if (existsSync(agentsDir)) {
    for (const name of readdirSync(agentsDir)) {
      if (!name.endsWith('.md')) continue;
      docs.push({
        kind: 'agent',
        owner: name.replace(/\.md$/, ''),
        file: `agents/${name}`,
        text: readFileSync(join(agentsDir, name), 'utf8'),
      });
    }
  }

  docs.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  return { docs, exists: (path) => existsSync(join(productRoot, path)) };
}
