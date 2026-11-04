/**
 * Les derniers sprints lus dans leurs comptes rendus (fiche 20261104090517904) : ce qui est mesuré est
 * publié, ce qui ne l'est pas reste `null`, jamais un faux zéro.
 */
import { describe, expect, it } from 'vitest';
import { latestSprints, parseSprintReport } from '../sprint-report-summary.js';

const report = (over: { fenetre?: string; duree?: string; tokens?: string; blocages?: string; lot?: string[] } = {}) =>
  [
    '# Rapport de sprint — x',
    '',
    '## Lot scellé',
    '',
    ...(over.lot ?? ['- `1` — Une fiche (PR local (abc)) — **livrée**', '- `2` — Une autre — **reportée**']),
    '',
    '## Détail',
    '',
    `- **Fenêtre** : ${over.fenetre ?? '2026-11-03T20:22:59.900Z → 2026-11-03T21:10:58.725Z'}`,
    `- **Durée** : ${over.duree ?? '2878825 ms'}`,
    `- **Tokens** : ${over.tokens ?? 'entrée 1 / sortie 2 / cache lu 3 / cache créé 4 / total 142236333 (grain `sprint`)'}`,
    `- **Blocages** ${over.blocages ?? '(0)'}`,
  ].join('\n');

describe('parseSprintReport', () => {
  it('lit la fin, la durée, les jetons, les livrées du lot scellé et les blocages', () => {
    expect(parseSprintReport('docs/sprints', '2026-11-03-sprint-mon-sprint.md', report())).toEqual({
      slug: 'mon-sprint',
      fichier: 'docs/sprints/2026-11-03-sprint-mon-sprint.md',
      jour: '2026-11-03',
      fin: '2026-11-03T21:10:58.725Z',
      dureeMs: 2878825,
      tokens: 142236333,
      livrees: [{ id: '1', title: 'Une fiche' }],
      blocages: 0,
    });
  });

  it('jamais un faux zéro : durée nulle, jetons au grain session ou total nul restent null', () => {
    const s = parseSprintReport(
      'd',
      '2026-11-04-sprint-x.md',
      report({ duree: '0 ms', tokens: 'entrée 0 / sortie 0 / total 9999 (grain `session`)' }),
    );
    expect(s?.dureeMs).toBeNull();
    expect(s?.tokens).toBeNull();
    expect(parseSprintReport('d', '2026-11-04-sprint-x.md', report({ tokens: 'total 0 (grain `sprint`)' }))?.tokens).toBeNull();
  });

  it('une livrée sans titre compte quand même', () => {
    const s = parseSprintReport('d', '2026-11-04-sprint-x.md', report({ lot: ['- `9` — **livrée**'] }));
    expect(s?.livrees).toEqual([{ id: '9', title: '' }]);
  });

  it('un compte rendu sans détail publie des null, et un autre fichier n’est pas un sprint', () => {
    expect(parseSprintReport('d', '2026-10-30-sprint-nu.md', '# Rapport de sprint — nu\n')).toMatchObject({
      fin: null,
      dureeMs: null,
      tokens: null,
      livrees: [],
      blocages: null,
    });
    expect(parseSprintReport('d', 'notes.md', report())).toBeNull();
  });
});

describe('latestSprints', () => {
  it('garde les plus récents d’abord, par fin puis par jour, au plus `limit`', () => {
    const reports = [
      { name: '2026-11-01-sprint-a.md', text: report({ fenetre: 'x → 2026-11-01T10:00:00.000Z' }) },
      { name: '2026-11-03-sprint-b.md', text: report({ fenetre: 'x → 2026-11-03T08:00:00.000Z' }) },
      { name: '2026-11-03-sprint-c.md', text: report({ fenetre: 'x → 2026-11-03T21:00:00.000Z' }) },
      { name: '2026-11-02-sprint-d.md', text: '# nu\n' },
    ];
    expect(latestSprints('d', reports, 3).map((s) => s.slug)).toEqual(['c', 'b', 'd']);
  });
});
