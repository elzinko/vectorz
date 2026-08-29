/**
 * ci-conso — le cœur d'agrégation de la conso Actions est PUR et déterministe
 * (fiche 20260828150801613 : réparer l'endpoint 410 → /usage + capitaliser en script,
 * ADR-0001 « le script compte, le LLM juge »). Le bord I/O (`bin/ci-conso.ts`, appels
 * `gh`) n'est pas testé ici ; l'agrégation, elle, l'est sur fixture.
 */
import { describe, expect, it } from 'vitest';
import {
  type UsageItem,
  aggregateActionsUsage,
  formatConsoReport,
  isActionsMinutes,
} from '../core/ci-conso.js';

// Fixture inspirée d'une vraie réponse /settings/billing/usage : plusieurs SKU par repo,
// du storage (à ignorer) et du codespaces (à ignorer).
const FIXTURE: UsageItem[] = [
  { product: 'actions', sku: 'Actions Linux', quantity: 879, unitType: 'Minutes', netAmount: 0, repositoryName: 'vectorz' },
  { product: 'actions', sku: 'Actions macOS 3-core', quantity: 80, unitType: 'Minutes', netAmount: 4.96, repositoryName: 'muti' },
  { product: 'actions', sku: 'Actions Linux', quantity: 744, unitType: 'Minutes', netAmount: 0, repositoryName: 'muti' },
  { product: 'actions', sku: 'Actions storage', quantity: 100, unitType: 'GigabyteHours', netAmount: 2, repositoryName: 'vectorz' },
  { product: 'codespaces', sku: 'Codespaces compute', quantity: 5, unitType: 'Hours', netAmount: 1, repositoryName: 'muti' },
];

describe('ci-conso — agrégation déterministe (fiche 20260828150801613)', () => {
  it('somme les minutes Actions par repo, ignore storage/codespaces, trie minutes DESC', () => {
    const r = aggregateActionsUsage(FIXTURE, { vectorz: 'public', muti: 'private' });
    expect(r.rows).toEqual([
      { repo: 'vectorz', minutes: 879, netUsd: 0, visibility: 'public' },
      { repo: 'muti', minutes: 824, netUsd: 4.96, visibility: 'private' }, // 80 + 744
    ]);
    expect(r.totalMinutes).toBe(879 + 824);
    expect(r.totalNetUsd).toBeCloseTo(4.96);
  });

  it('isActionsMinutes ne retient que product=actions ET unitType=Minutes', () => {
    expect(isActionsMinutes(FIXTURE[0])).toBe(true); // Actions Linux Minutes
    expect(isActionsMinutes(FIXTURE[3])).toBe(false); // Actions storage (GigabyteHours)
    expect(isActionsMinutes(FIXTURE[4])).toBe(false); // codespaces
  });

  it('casse tolérante : la casse de la DOC GitHub ("Actions"/"minutes") est AUSSI comptée', () => {
    // Non-régression du P2 de revue : si le code n'acceptait que "actions"/"Minutes", un
    // changement de casse côté GitHub viderait le rapport en silence (« 0 min »).
    const r = aggregateActionsUsage(
      [{ product: 'Actions', sku: 'Actions Linux', quantity: 10, unitType: 'minutes', netAmount: 0, repositoryName: 'x' }],
      {},
    );
    expect(r.rows).toEqual([{ repo: 'x', minutes: 10, netUsd: 0, visibility: '?' }]);
  });

  it('visibilité inconnue → "?" (pas de crash, best-effort)', () => {
    const r = aggregateActionsUsage(FIXTURE, {}); // aucune visibilité fournie
    expect(r.rows.every((row) => row.visibility === '?')).toBe(true);
  });

  it('déterministe : même entrée → même sortie', () => {
    const vis = { vectorz: 'public', muti: 'private' };
    expect(aggregateActionsUsage(FIXTURE, vis)).toEqual(aggregateActionsUsage(FIXTURE, vis));
  });

  it('rendu texte : public = "gratuit", note sur les privés, total présent', () => {
    const out = formatConsoReport(aggregateActionsUsage(FIXTURE, { vectorz: 'public', muti: 'private' }), '2026-08');
    expect(out).toMatch(/public/);
    expect(out).toMatch(/private/);
    expect(out).toMatch(/gratuit/); // vectorz public
    expect(out).toMatch(/seuls les repos PRIVÉS comptent/);
    expect(out).toMatch(/total : 1703 min/);
  });

  it('backlog vide → rapport vide, pas d’erreur', () => {
    const r = aggregateActionsUsage([], {});
    expect(r.rows).toEqual([]);
    expect(r.totalMinutes).toBe(0);
    expect(r.totalNetUsd).toBe(0);
  });
});
