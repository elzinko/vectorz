import { describe, expect, it } from 'vitest';
import { reviewPacks } from './reviewPacks.js';

/**
 * Garde de non-régression du seam d'intégration (glob Vite `?raw`, fiche 0184).
 * Sans ce test, une régression de profondeur du glob ou du layout monorepo ferait
 * tomber `reviewPacks` à `[]` → la vue Reporting passerait en état vide SANS erreur
 * (AC2 casserait en silence). On exige donc ≥ 1 pack réel, réellement parsé.
 */
describe('reviewPacks (loader glob repo → packs)', () => {
  it('charge au moins un REVIEW.md réel du dépôt, parsé', () => {
    expect(reviewPacks.length).toBeGreaterThan(0);
  });

  it('chaque pack chargé est bien parsé (fiche + chemin REVIEW.md)', () => {
    for (const pack of reviewPacks) {
      expect(pack.path).toMatch(/REVIEW\.md$/);
      expect(pack.fiche).not.toBe('');
    }
  });
});
