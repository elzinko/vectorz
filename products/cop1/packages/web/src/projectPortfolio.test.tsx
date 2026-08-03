import { describe, expect, it } from 'vitest';
import { buildProjectPortfolio } from './projectPortfolio.js';

describe('buildProjectPortfolio (fiche 0062)', () => {
  it('dérive les projets depuis les runs sans registre', () => {
    const cards = buildProjectPortfolio(
      [],
      [
        {
          projectRoot: '/a/proj',
          state: 'running',
          method: { name: 'mega-city', version: '1.2.3' },
        },
      ],
    );
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      name: 'proj',
      methodName: 'mega-city',
      methodVersion: '1.2.3',
      status: 'active',
      source: 'observed',
    });
  });

  it('montre un projet registre sans run comme inactif', () => {
    const cards = buildProjectPortfolio(
      [{ id: 'vectorz', path: '.', method: 'mega-city', projectRoot: '/repo' }],
      [],
    );
    expect(cards[0]).toMatchObject({
      id: 'vectorz',
      status: 'inactive',
      source: 'registry',
      methodName: 'mega-city',
    });
  });

  it('marque waiting si un run est at_gate', () => {
    const cards = buildProjectPortfolio(
      [{ id: 'vectorz', path: '.', method: 'mega-city', projectRoot: '/repo' }],
      [{ projectRoot: '/repo', state: 'at_gate' }],
    );
    expect(cards[0]?.status).toBe('waiting');
    expect(cards[0]?.source).toBe('both');
  });
});
