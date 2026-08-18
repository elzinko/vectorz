import { describe, expect, it } from 'vitest';
import { parseReviewPack } from './reviewPack.js';

const SAMPLE = `---
schema: method-review@0.1
fiche: "0183"
branch: "feat/0183-pack-review-markdown-first"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "0.1.0"
status: ready-for-review
created: "2026-08-17"
---

# Review — 0183

## Résumé

Pack de review markdown-first livré.

## Rendus

- assets/before.png
- assets/after.png

## Matrice de validation

CI ✅ · tests 422/422

## À tester

Ouvrir l'onglet Reporting et vérifier la carte.

## Provisioning / preview

pnpm --dir products/cop1/packages/web dev
`;

describe('parseReviewPack', () => {
  it('extrait les champs de front-matter (guillemets retirés)', () => {
    const card = parseReviewPack(SAMPLE, 'features/reviews/0183/REVIEW.md');
    expect(card.fiche).toBe('0183');
    expect(card.branch).toBe('feat/0183-pack-review-markdown-first');
    expect(card.product).toBe('mega-city');
    expect(card.status).toBe('ready-for-review');
    expect(card.created).toBe('2026-08-17');
    expect(card.path).toBe('features/reviews/0183/REVIEW.md');
  });

  it('reconstitue la méthode depuis le bloc imbriqué method:', () => {
    expect(parseReviewPack(SAMPLE).method).toBe('ezk-sprint v0.1.0');
  });

  it('indexe les sections par titre', () => {
    const { sections } = parseReviewPack(SAMPLE);
    expect(sections['Résumé']).toBe('Pack de review markdown-first livré.');
    expect(sections.Rendus).toContain('- assets/before.png');
    expect(sections['Matrice de validation']).toContain('422/422');
    expect(sections['À tester']).toContain('onglet Reporting');
  });

  it('ne lit pas le schema non quoté comme une valeur guillemetée', () => {
    expect(parseReviewPack(SAMPLE).sections).not.toHaveProperty('schema');
    // schema reste un champ FM, pas une section ; et non quoté
    expect(parseReviewPack(SAMPLE).fiche).not.toContain('"');
  });

  it('tolère un pack sans front-matter (aucun champ inventé)', () => {
    const card = parseReviewPack('## Résumé\n\nrien de plus\n');
    expect(card.fiche).toBe('');
    expect(card.status).toBe('');
    expect(card.method).toBe('');
    expect(card.sections['Résumé']).toBe('rien de plus');
  });
});
