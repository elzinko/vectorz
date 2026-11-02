/**
 * ezkLawSource — la lecture de la LOI d'un projet (fiche 20260826222044335, ADR-086) :
 * `ezk law show --json`, traduit pour la vue « Loi ». La loi bouge rarement : relue au plus toutes
 * les cinq minutes, et servie tout de suite depuis la dernière réponse.
 */
import { type LawViewData, translateLaw } from './ezkLawTranslator.js';
import { EzkSource, type EzkSourceOptions, type SourceReading } from './ezkSource.js';

export type LawSnapshot = SourceReading<{ law: LawViewData }>;

const LAW_TTL_MS = 5 * 60_000;

export class EzkLawSource extends EzkSource<{ law: LawViewData }> {
  constructor(options: EzkSourceOptions) {
    super({ ttlMs: LAW_TTL_MS, ...options }, async (root, run) => ({
      law: translateLaw(JSON.parse(await run(['--root', root, 'law', 'show', '--json']))),
    }));
  }
}
