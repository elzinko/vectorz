/**
 * process-show — le bord qui assemble le contrat de `ezk process show --json` (fiche 20261110191135802).
 *
 * La déclaration vaut pour la méthode : `method/etapes.yml`, validée contre le catalogue de la
 * méthode. La sortie vaut pour un projet : la valeur de chaque réglage vient de `configShowData`,
 * la résolution même de `ezk config show`. `bin/process-show.ts` et le générateur d'exemples passent
 * tous deux par ici.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ProcessShow, buildProcessShow, validateEtapes } from '../core/process-show.js';
import { loadCatalog } from '../loaders/catalog.js';
import { loadEtapesDoc } from '../loaders/method.js';
import { configShowData } from './config-show.js';

const MEGA_CITY = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Les étapes fines de la méthode, avec les réglages du projet `root`. Une déclaration fausse lève l'erreur qui la situe. */
export function processShowData(root: string): ProcessShow {
  const etapes = validateEtapes(loadCatalog(MEGA_CITY), loadEtapesDoc(MEGA_CITY));
  return buildProcessShow(etapes, configShowData(root));
}
