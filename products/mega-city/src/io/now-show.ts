/**
 * now-show — le bord qui assemble `ezk now --json` d'un projet (fiche 20261114131612944).
 *
 * Réutilise ce que la méthode publie déjà : le plan (`board show`), la dernière capture de rétro et les
 * suites de la boussole. Seule donnée lue en plus : la date de création des fiches qui alertent. Il ne
 * fait que lire : rien n'est écrit. `bin/ezk-now.ts --json` et le générateur d'exemples
 * (`io/contract-files.ts`) passent tous deux par ici.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { type NowShow, buildNowShow } from '../core/now-contract.js';
import { suggestNow } from '../core/now.js';
import { isRetroCaptureName, parseRetroCapture } from '../core/retro-capture.js';
import { readField } from '../loaders/fiches.js';
import { scrumPaths } from '../loaders/project-config.js';
import { boardShowData } from './board-show.js';
import { nowState } from './now-state.js';

/** La date de création (`created:`) de chaque fiche du plan qui peut alerter ; absente = rien dans la table. */
function createdDates(root: string, files: ReadonlyMap<string, string>): Map<string, string> {
  const dates = new Map<string, string>();
  for (const [id, file] of files) {
    const created = readField(readFileSync(join(root, file), 'utf8'), 'created');
    if (created !== '') dates.set(id, created);
  }
  return dates;
}

/** La dernière capture de rétro (la plus récente par son nom), lue et validée ; rien si le dossier est vide. */
function lastRetro(root: string): Pick<Parameters<typeof buildNowShow>[0], 'retro' | 'retroIllisible'> {
  const dir = scrumPaths(root).retroCaptures;
  const names = existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter(isRetroCaptureName).sort() : [];
  const last = names.at(-1);
  if (last === undefined) return { retro: null };
  const file = `${dir}/${last}`;
  const { capture } = parseRetroCapture(file, readFileSync(join(root, file), 'utf8'));
  return capture === undefined ? { retro: null, retroIllisible: file } : { retro: capture };
}

/** Le contrat JSON de la boussole du projet `root`. */
export function nowShowData(root: string): NowShow {
  const board = boardShowData(root);
  const dates = createdDates(root, new Map(board.actives.map((f) => [f.id, f.file])));
  return buildNowShow({
    actives: board.actives,
    lots: board.versions.lots,
    dates,
    ...lastRetro(root),
    suites: suggestNow(nowState(root)),
  });
}
