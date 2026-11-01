/**
 * ezkPlanSource — la lecture du PLAN d'un projet (ADR-086) : `ezk board show --json` et
 * `ezk backlog show --json`, traduits pour la page du board. Le cache sans attente vit dans
 * `ezkSource.ts`, commun aux lectures de la méthode.
 */
import { type TranslatedPlan, translatePlan } from './ezkPlanTranslator.js';
import { EzkSource, type EzkSourceOptions, type SourceSnapshot } from './ezkSource.js';

export type PlanSnapshot = SourceSnapshot<TranslatedPlan>;

export class EzkPlanSource extends EzkSource<TranslatedPlan> {
  constructor(options: EzkSourceOptions) {
    super(options, async (root, run) => {
      const [board, backlog] = await Promise.all([
        run(['--root', root, 'board', 'show', '--json']),
        run(['--root', root, 'backlog', 'show', '--json']),
      ]);
      return translatePlan(JSON.parse(board), JSON.parse(backlog));
    });
  }
}
