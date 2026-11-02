#!/usr/bin/env tsx
/**
 * board-maps — les cartes et les documents de la méthode (fiche 20261102123552184).
 *
 *   ezk board maps                    # la liste, lisible
 *   ezk board maps --json             # le contrat JSON versionné (contracts/board-maps/)
 *   ezk board maps --file <id> <nom>  # le contenu d'un document, ou des données qu'il charge
 *
 * Les documents sont ceux de la méthode : `--root` ne les change pas. `--file` ne rend que le fichier
 * principal d'un document listé, ou ses données calculées à l'instant ; tout autre nom est refusé.
 */
import { methodMapFile, methodMapsData } from '../src/io/method-maps.js';

const args = process.argv.slice(2).filter((a) => a !== '--');
const fileAt = args.indexOf('--file');
// Une option inconnue est refusée : elle ne doit jamais retomber en silence sur la liste.
const unknown = args.find((a) => a.startsWith('--') && a !== '--json' && a !== '--file' && a !== '--root');

// Pas de `process.exit` après une sortie réussie : il couperait le contenu à 64 Ko dans un tuyau.
if (unknown) {
  console.error(`option inconnue : ${unknown} — usage : ezk board maps [--json] | --file <id> <nom>`);
  process.exitCode = 2;
} else if (fileAt >= 0) {
  const [id, nom] = [args[fileAt + 1], args[fileAt + 2]];
  if (!id || !nom) {
    console.error('usage : ezk board maps --file <id> <nom>');
    process.exitCode = 2;
  } else {
    const content = methodMapFile(id, nom);
    if (content === null) {
      console.error(`refusé : « ${nom} » n'est ni le fichier ni les données du document « ${id} »`);
      process.exitCode = 1;
    } else {
      process.stdout.write(content);
    }
  }
} else if (args.includes('--json')) {
  console.log(JSON.stringify(methodMapsData(), null, 1));
} else {
  const { documents } = methodMapsData();
  console.log(`En clair : la méthode range ${documents.length} documents, hors des pages qui ont leur vue.`);
  for (const d of documents) {
    console.log(`  ${d.id.padEnd(34)} ${d.type.padEnd(4)} ${d.titre}${d.donnees ? ` (données : ${d.donnees})` : ''}`);
  }
}
