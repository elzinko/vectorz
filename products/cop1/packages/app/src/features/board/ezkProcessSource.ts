/**
 * ezkProcessSource — la lecture du PROCESS d'un projet (fiche 20261102123552183, ADR-086) :
 * `ezk board process --json`, traduit pour la vue « Process ». Une source à part du plan : la
 * commande interroge git (quelques secondes), elle ne doit ni retarder ni casser le plan.
 */
import { type ProcessViewData, translateProcess } from './ezkProcessTranslator.js';
import { EzkSource, type EzkSourceOptions, type SourceReading } from './ezkSource.js';

export type ProcessSnapshot = SourceReading<{ process: ProcessViewData }>;

export class EzkProcessSource extends EzkSource<{ process: ProcessViewData }> {
  constructor(options: EzkSourceOptions) {
    super(options, async (root, run) => ({
      process: translateProcess(
        JSON.parse(await run(['--root', root, 'board', 'process', '--json'])),
      ),
    }));
  }
}
