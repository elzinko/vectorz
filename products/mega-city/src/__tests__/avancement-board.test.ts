/**
 * buildAvancementData — le board d'avancement que publie `ezk board show` (le cœur, sans page).
 *
 * La page `diagrams/avancement/board.html` est retirée (fiche 20261102123552185) : mission control
 * affiche ces données. Ici on garde ce qui reste propre au cœur : les labels du front-matter
 * alimentent bien les filtres.
 */
import { describe, expect, it } from 'vitest';
import { buildAvancementData } from '../core/avancement-data.js';
import type { Fiche } from '../loaders/fiches.js';

describe('buildAvancementData — les labels', () => {
  it('les labels du front-matter alimentent BoardFiche.labels et filtres.labels (filtre par tag)', () => {
    const mk = (id: string, labels: string[]): Fiche => ({
      id,
      title: 't' + id,
      type: 'feature',
      priority: 'P2',
      status: 'idea',
      milestone: '',
      product: 'mega-city',
      pr: '',
      labels,
      blocked: '',
      depends: [],
      version: '',
      done: false,
      file: `features/${id}.md`,
    });
    const data = buildAvancementData([mk('1', ['bmad', 'x']), mk('2', ['bmad'])]);
    expect(data.actives[0].labels).toContain('bmad');
    expect(data.filtres.labels).toEqual(['bmad', 'x']); // uniq + trié, dédupliqué
  });
});
