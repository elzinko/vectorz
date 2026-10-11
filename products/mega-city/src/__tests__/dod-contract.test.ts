/**
 * dod-contract — la DoD est un BUNDLE partagé (`dod`), cité par `ezk-dev` ET `ezk-reviewer`
 * dans leur `interactions:`, déplié par F1 (consommateur → bundle) en LA MÊME liste de règles
 * des deux côtés. Fiche F2 (20261008154804532), ADR-0071.
 *
 * Ce fichier fige le contrat partagé : si quelqu'un remet de la recopie à la main côté
 * reviewer, ou laisse fuir une règle de PROCÉDÉ du dev dans ce que le reviewer contrôle
 * (frontière adverse, ADR-0059), un test rougit.
 *
 * Portée honnête (ADR-0071) : on contrôle le contrat DÉCLARÉ au niveau catalogue/graphe
 * (ce que `appliedRuleIds` déplie), pas le prompt — l'en-tête `interactions:` n'est pas lu
 * par le modèle. L'enforcement runtime reste la prose + le cliquet `law-coverage`.
 */
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadCatalog } from '../loaders/catalog.js';
import { appliedRuleIds } from '../core/expand.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

const sorted = (xs: readonly string[]): string[] => [...xs].sort((a, b) => a.localeCompare(b));

/** Des règles de PROCÉDÉ du dev (comment il travaille) — jamais contrôlées par le reviewer. */
const DEV_PROCESS = [
  'development/local-first-feedback',
  'development/use-project-scripts',
  'development/handle-blockers',
  'development/quality-guardrails',
  'development/playwright-mcp-usage',
  'development/run-freshness-origin-main',
  'development/command-reproducibility',
  'development/merge-when-absent-default',
  'development/worktree-secondary-inline-harvest',
  'development/fiche-read-via-loader',
  'development/one-story-one-commit-local',
  'development/workaround-traceability',
];

describe('DoD = bundle `dod`, contrat partagé dev↔reviewer (fiche F2, ADR-0071)', () => {
  it('le bundle `dod` existe et ne contient QUE des critères de « done » (aucun procédé dev)', () => {
    const catalog = loadCatalog(repoRoot);
    const dod = catalog.bundles.get('dod');
    expect(dod, 'bundle dod introuvable').toBeDefined();
    expect(dod!.rules.length).toBeGreaterThan(0);
    for (const p of DEV_PROCESS) expect(dod!.rules, `procédé dev dans la DoD : ${p}`).not.toContain(p);
  });

  it('`ezk-dev` ET `ezk-reviewer` citent le bundle `dod` (plus de recopie manuelle)', () => {
    const catalog = loadCatalog(repoRoot);
    expect(catalog.agents.get('ezk-dev')?.interactions).toContain('dod');
    expect(catalog.agents.get('ezk-reviewer')?.interactions).toContain('dod');
  });

  it('les deux lisent LA MÊME liste de règles, dépliée par F1 (critère 2)', () => {
    const catalog = loadCatalog(repoRoot);
    const dod = catalog.bundles.get('dod')!;
    const dodRules = sorted(dod.rules);

    const dev = appliedRuleIds(catalog.agents.get('ezk-dev')!.interactions, catalog.bundles);
    const rev = appliedRuleIds(catalog.agents.get('ezk-reviewer')!.interactions, catalog.bundles);

    // Le reviewer contrôle EXACTEMENT la DoD (rien de plus → aucun procédé dev ne fuit, critère 3).
    expect(rev).toEqual(dodRules);
    // Le dev applique AU MOINS toute la DoD (il peut, plus tard, déclarer en plus son procédé).
    for (const r of dodRules) expect(dev, `le dev n'applique pas ${r}`).toContain(r);
  });

  it('le reviewer n\'applique AUCUNE règle de procédé dev connue (frontière adverse, ADR-0059)', () => {
    // Non circulaire : on confronte ce que le reviewer déplie réellement à une liste blanche
    // figée de règles de PROCÉDÉ — indépendante de la définition de `dod`. Si demain `dod`
    // (ou un bundle qu'il cite) avalait un de ces procédés, ce test rougirait.
    const catalog = loadCatalog(repoRoot);
    const rev = appliedRuleIds(catalog.agents.get('ezk-reviewer')!.interactions, catalog.bundles);
    for (const p of DEV_PROCESS) expect(rev, `procédé dev contrôlé par le reviewer : ${p}`).not.toContain(p);
  });
});
