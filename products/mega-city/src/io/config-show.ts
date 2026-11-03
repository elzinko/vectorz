/**
 * config-show — le bord qui assemble le contrat JSON de la config d'un projet (ADR-086).
 *
 * Lit tout ce que le cœur pur (`core/config-contract.ts`) attend, par les loaders que
 * `ezk config show` emploie déjà : la commande texte et le JSON ne peuvent pas diverger.
 * `bin/ezk-config.ts --json` et le générateur d'exemples passent tous deux par ici.
 */
import { relative } from 'node:path';
import { type ConfigShow, buildConfigShow } from '../core/config-contract.js';
import { loadModelConfig } from '../loaders/model-config.js';
import { adverseReview, findProjectConfigFile, githubCapabilities, integrationStrategy } from '../loaders/project-config.js';
import { releaseConfig } from '../loaders/release-passes.js';

/** Le contrat JSON de la config du projet `root`. Un YAML malformé lève l'erreur qui nomme le fichier. */
export function configShowData(root: string): ConfigShow {
  const file = findProjectConfigFile(root);
  return buildConfigShow({
    file: file === undefined ? null : relative(root, file),
    github: githubCapabilities(root),
    integration: integrationStrategy(root),
    release: releaseConfig(root),
    adverseReview: adverseReview(root),
    models: loadModelConfig(root),
  });
}
