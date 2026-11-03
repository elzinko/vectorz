/**
 * La pastille de blocage d'une fiche (fiche 20261103203943909) : une raison longue revient à la ligne
 * au lieu de déborder de la fenêtre. Elle porte sa propre variante ; les autres pastilles n'en changent pas.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FicheModal } from './FicheModal.js';
import type { FicheDetail } from './types.js';

afterEach(cleanup);

const longReason =
  'runbook de release piloté par le PO — attend la recette DAW de Thomas sur les trois plateformes';

const fiche = (blocked: string): FicheDetail => ({
  id: '20261103203943909',
  title: 'Sortir la 1.8.0',
  prio: 'P0',
  status: 'idea',
  ver: 'v1.8.0',
  enclair: '',
  ctx: '',
  crit: [],
  verif: '',
  blocked,
});

describe('FicheModal — la pastille de blocage', () => {
  it('porte la variante qui revient à la ligne, avec la raison entière', () => {
    const { container } = render(<FicheModal fiche={fiche(longReason)} onClose={() => {}} onOpenPage={() => {}} />);
    const pill = container.querySelector('.pill.blocked');
    expect(pill?.textContent).toBe(`bloquée : ${longReason}`);
  });

  it('les autres pastilles gardent leur rendu sur une ligne', () => {
    const { container } = render(<FicheModal fiche={fiche(longReason)} onClose={() => {}} onOpenPage={() => {}} />);
    expect(container.querySelector('.pill.ver')?.classList.contains('blocked')).toBe(false);
  });

  it('une fiche non bloquée n’a pas de pastille de blocage', () => {
    const { container } = render(<FicheModal fiche={fiche('')} onClose={() => {}} onOpenPage={() => {}} />);
    expect(container.querySelector('.pill.blocked')).toBeNull();
  });
});
