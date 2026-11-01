#!/usr/bin/env tsx
/**
 * backlog-show — le détail des fiches d'un projet (fiche 20261031160441267, ADR-086).
 *
 *   ezk backlog show <id>           # une fiche, en clair
 *   ezk backlog show <id> --json    # une fiche, contrat JSON versionné
 *   ezk backlog show --json         # toutes les fiches de features/ (hors done/), en un appel
 *   ezk backlog show                # la liste, une ligne par fiche
 *
 * Le cœur (src/core/fiche-detail.ts) découpe la fiche ; ce script est le bord. Format, schémas et
 * exemples : contracts/backlog-show/.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backlogShowFiche, backlogShowListe } from '../src/io/backlog-show.js';
import { projectRootOrExit } from '../src/io/project-root.js';

// Le projet dont on lit les fiches : --root > EZK_ROOT > ce dépôt.
const ownRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const { root } = projectRootOrExit(ownRoot);

const args = process.argv.slice(2);
const json = args.includes('--json');
// Les arguments libres, hors `--root <projet>` déjà lu par projectRootOrExit.
const free = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--root');
if (free.length > 1 || (free.length === 1 && !/^\d{4,}$/.test(free[0]))) {
  console.error('usage : ezk backlog show [<id>] [--json] [--root <projet>]');
  process.exit(2);
}
const id = free[0];

if (id === undefined) {
  const liste = backlogShowListe(root);
  if (json) {
    console.log(JSON.stringify(liste, null, 1));
    process.exit(0);
  }
  console.log(`En clair : ${liste.fiches.length} fiche(s) dans features/, hors done/.`);
  for (const f of liste.fiches) {
    const flags = `${f.enCours ? ' · en cours' : ''}${f.blocked ? ` · bloquée : ${f.blocked}` : ''}`;
    console.log(`  ${f.id}  ${f.status.padEnd(10)} ${f.title.slice(0, 70)}${flags}`);
  }
  process.exit(0);
}

const fiche = backlogShowFiche(root, id);
if (fiche === undefined) {
  console.error(`En clair : la fiche ${id} n'existe pas dans ${root} (ni dans features/, ni dans features/done/).`);
  process.exit(1);
}
if (json) {
  console.log(JSON.stringify(fiche, null, 1));
  process.exit(0);
}
const flags = `${fiche.enCours ? ' · en cours' : ''}${fiche.blocked ? ` · bloquée : ${fiche.blocked}` : ''}`;
const done = fiche.criteres.filter((c) => c.coche).length;
console.log(fiche.title);
console.log(`${fiche.id} · ${fiche.status}${flags} · ${fiche.file}`);
console.log(`\nEn clair : ${fiche.enClair || '(absent)'}`);
console.log(`\nCritères (${done}/${fiche.criteres.length} cochés) :`);
for (const c of fiche.criteres) console.log(`  [${c.coche ? 'x' : ' '}] ${c.texte}`);
