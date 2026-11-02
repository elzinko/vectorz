/**
 * ezkConfigSource — la lecture de la CONFIG d'un projet (ADR-086) : `ezk config show --json`,
 * traduite pour l'onglet « Configuration ». Une source à part du plan : une config illisible
 * n'empêche pas le plan d'arriver, et l'inverse.
 */
import { type ProjectConfigData, translateConfig } from './ezkConfigTranslator.js';
import { EzkSource, type EzkSourceOptions, type SourceReading } from './ezkSource.js';

export type ConfigSnapshot = SourceReading<{ config: ProjectConfigData }>;

export class EzkConfigSource extends EzkSource<{ config: ProjectConfigData }> {
  constructor(options: EzkSourceOptions) {
    super(options, async (root, run) => ({
      config: translateConfig(
        JSON.parse(await run(['--root', root, 'config', 'show', '--json'])),
        root,
      ),
    }));
  }
}
