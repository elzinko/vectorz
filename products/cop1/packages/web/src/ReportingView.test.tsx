import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ReportingView } from './ReportingView.js';
import type { ReviewCard } from './reviewPack.js';

const CARD: ReviewCard = {
  path: 'features/reviews/0183-pack-review-markdown-first/REVIEW.md',
  fiche: '0183',
  branch: 'feat/0183-pack-review-markdown-first',
  product: 'mega-city',
  status: 'ready-for-review',
  created: '2026-08-17',
  method: 'ezk-sprint v0.1.0',
  sections: {
    Résumé: 'Pack de review markdown-first livré.',
    Rendus: '- assets/after.png',
    'Matrice de validation': 'CI ✅',
    'À tester': "Ouvrir l'onglet Reporting.",
  },
};

describe('ReportingView (fiche 0184, lot 1)', () => {
  afterEach(cleanup);

  it('affiche un état vide quand aucun pack', () => {
    render(<ReportingView packs={[]} />);
    expect(screen.getByText(/Aucun pack de review trouvé/)).toBeTruthy();
  });

  it('rend un pack réel en carte façon PR (fiche, statut, sections)', () => {
    render(<ReportingView packs={[CARD]} />);
    expect(screen.getByText(/Fiche 0183/)).toBeTruthy();
    expect(screen.getByText('À revoir')).toBeTruthy(); // libellé du statut ready-for-review
    expect(screen.getByText('Pack de review markdown-first livré.')).toBeTruthy();
    expect(screen.getByText('Résumé')).toBeTruthy();
    expect(screen.getByText('À tester')).toBeTruthy();
    expect(screen.getByText(/feat\/0183-pack-review-markdown-first/)).toBeTruthy();
  });

  it('est clairement une vue « livré », distincte du Moniteur', () => {
    render(<ReportingView packs={[CARD]} />);
    expect(screen.getByText(/ce que le run a livré/)).toBeTruthy();
  });
});
