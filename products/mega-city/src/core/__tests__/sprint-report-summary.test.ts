/**
 * Les derniers sprints lus dans leurs comptes rendus (fiche 20261104090517904) : ce qui est mesuré est
 * publié, ce qui ne l'est pas reste `null`, jamais un faux zéro.
 */
import { describe, expect, it } from 'vitest';
import { allSprints, parseSprintDetail, parseSprintReport, sprintOfFiches } from '../sprint-report-summary.js';

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
      numero: null,
      but: null,
      debut: '2026-11-03T20:22:59.900Z',
      branche: null,
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
      numero: null,
      but: null,
      debut: null,
      branche: null,
    });
    expect(parseSprintReport('d', 'notes.md', report())).toBeNull();
  });
});

describe('allSprints — l’ordre', () => {
  it('rend les plus récents d’abord, par fin puis par jour', () => {
    const reports = [
      { name: '2026-11-01-sprint-a.md', text: report({ fenetre: 'x → 2026-11-01T10:00:00.000Z' }) },
      { name: '2026-11-03-sprint-b.md', text: report({ fenetre: 'x → 2026-11-03T08:00:00.000Z' }) },
      { name: '2026-11-03-sprint-c.md', text: report({ fenetre: 'x → 2026-11-03T21:00:00.000Z' }) },
      { name: '2026-11-02-sprint-d.md', text: '# nu\n' },
    ];
    expect(allSprints('d', reports).map((s) => s.slug)).toEqual(['c', 'b', 'd', 'a']);
  });
});

// fiche 20261114131612572 — le sprint qui a livré une fiche, lu dans les lots scellés.
describe('sprintOfFiches', () => {
  it('chaque fiche livrée pointe le sprint le plus récent dont le lot scellé la cite', () => {
    const lot = (ids: string[]) => ids.map((id) => `- \`${id}\` — Fiche ${id} — **livrée**`);
    const reports = [
      { name: '2026-11-01-sprint-ancien.md', text: report({ fenetre: 'x → 2026-11-01T10:00:00.000Z', lot: lot(['1', '2']) }) },
      { name: '2026-11-03-sprint-recent.md', text: report({ fenetre: 'x → 2026-11-03T10:00:00.000Z', lot: lot(['2']) }) },
      { name: 'notes.md', text: report({ lot: lot(['9']) }) },
    ];
    const sprints = sprintOfFiches('d', reports);
    expect(sprints.get('1')).toBe('ancien');
    expect(sprints.get('2')).toBe('recent'); // citée deux fois : le plus récent l'emporte
    expect(sprints.has('9')).toBe(false); // pas un compte rendu de sprint
  });

  it('une fiche reportée ou absente des lots n’a pas de sprint', () => {
    const sprints = sprintOfFiches('d', [{ name: '2026-11-01-sprint-a.md', text: report() }]);
    expect(sprints.get('1')).toBe('a');
    expect(sprints.has('2')).toBe(false); // reportée, pas livrée
  });
});

// fiche 20261114131612204 — le numéro continu, le but complet, le début et la branche.
const HEADER = ['## En-tête', '', '- **Numéro** : 29', '- **But** : Le sprint se publie avec son numéro, son but et sa branche', '- **Branche** : feat/sprint-publie', ''];
const withHeader = (): string => report().replace('## Lot scellé', `${HEADER.join('\n')}\n## Lot scellé`);

const jsonReport = (over: Record<string, unknown> = {}): string =>
  JSON.stringify({
    schema: 'sprint-report@0.1',
    sprint: { slug: 'mon-sprint', numero: 30, but: 'But du JSON', branche: 'main' },
    generatedAt: '2026-11-04T10:00:00.000Z',
    window: { startTs: '2026-11-04T08:00:00.000Z', endTs: '2026-11-04T09:00:00.000Z' },
    duration: { ms: 3600000, grain: 'sprint' },
    tokens: { grain: 'sprint', totalTokens: 500 },
    kpi: { blockages: { count: 2 } },
    lot: {
      entries: [
        { id: '1', result: 'shipped', title: 'Livrée' },
        { id: '2', result: 'reported', title: 'Reportée' },
        { id: '3', result: 'open' },
      ],
    },
    ...over,
  });

describe('parseSprintReport — en-tête et début', () => {
  it('lit le numéro, le but complet et la branche dans la section « En-tête » du markdown', () => {
    const s = parseSprintReport('d', '2026-11-03-sprint-mon-sprint.md', withHeader());
    expect(s).toMatchObject({
      numero: 29,
      but: 'Le sprint se publie avec son numéro, son but et sa branche',
      branche: 'feat/sprint-publie',
      debut: '2026-11-03T20:22:59.900Z',
    });
  });

  it('un ancien compte rendu sans en-tête : numéro, but et branche valent null, jamais devinés', () => {
    expect(parseSprintReport('d', '2026-11-03-sprint-x.md', report())).toMatchObject({ numero: null, but: null, branche: null });
  });

  it('lit le JSON quand il existe : c’est la même source que `sprint show`', () => {
    const s = parseSprintReport('d', '2026-11-04-sprint-mon-sprint.md', withHeader(), jsonReport());
    expect(s).toMatchObject({
      numero: 30,
      but: 'But du JSON',
      branche: 'main',
      debut: '2026-11-04T08:00:00.000Z',
      fin: '2026-11-04T09:00:00.000Z',
      dureeMs: 3600000,
      tokens: 500,
      blocages: 2,
      livrees: [{ id: '1', title: 'Livrée' }],
    });
  });

  it('un JSON non daté ne publie ni fenêtre, ni durée, ni jetons : des null', () => {
    const undated = jsonReport({
      window: { startTs: 'x', endTs: 'x' },
      duration: { ms: 0, grain: 'sprint' },
      tokens: { grain: 'session', totalTokens: 0, note: 'fenêtre de supervision absente — durée et tokens non datés (lot seulement)' },
      kpi: { blockages: { count: 0 } },
    });
    expect(parseSprintReport('d', '2026-11-04-sprint-x.md', '# x', undated)).toMatchObject({
      debut: null,
      fin: null,
      dureeMs: null,
      tokens: null,
      blocages: null,
    });
  });

  it('un JSON illisible ou d’un autre schéma : retour au markdown', () => {
    expect(parseSprintReport('d', '2026-11-03-sprint-x.md', withHeader(), '{ illisible')).toMatchObject({ numero: 29 });
    expect(parseSprintReport('d', '2026-11-03-sprint-x.md', withHeader(), '{"schema":"autre@1"}')).toMatchObject({ numero: 29 });
  });
});

describe('allSprints — la liste complète, numéro continu', () => {
  const reports = [
    { name: '2026-11-01-sprint-a.md', text: report({ fenetre: 'x → 2026-11-01T10:00:00.000Z' }) },
    { name: '2026-11-02-sprint-b.md', text: report({ fenetre: 'x → 2026-11-02T10:00:00.000Z' }) },
    { name: '2026-11-03-sprint-c.md', text: withHeader().replace('29', '7') },
    { name: 'notes.md', text: '# pas un sprint' },
  ];

  it('rend tous les comptes rendus, le plus récent d’abord, sans plafond', () => {
    expect(allSprints('d', reports).map((s) => s.slug)).toEqual(['c', 'b', 'a']);
  });

  it('le numéro écrit au close fait foi ; sinon c’est le rang dans l’historique', () => {
    expect(allSprints('d', reports).map((s) => [s.slug, s.numero])).toEqual([['c', 7], ['b', 2], ['a', 1]]);
  });
});

describe('parseSprintDetail — les sections en champs', () => {
  const md = [
    '# Rapport de sprint — x',
    '',
    '## En clair',
    '',
    'Le sprint a livré une fiche.',
    '',
    '## Lot scellé',
    '',
    '- `1` — Livrée (PR local (abc)) — **livrée**',
    '- `2` — Reportée — **reportée**',
    '- `3` — **restée ouverte**',
    '',
    '## Abandon',
    '',
    'plus de budget',
    '',
  ].join('\n');

  it('découpe « En clair », le lot et l’abandon du markdown', () => {
    const d = parseSprintDetail('d', '2026-11-03-sprint-x.md', md);
    expect(d?.source).toBe('markdown');
    expect(d?.enClair).toBe('Le sprint a livré une fiche.');
    expect(d?.lot).toEqual([
      { id: '1', title: 'Livrée', resultat: 'livree' },
      { id: '2', title: 'Reportée', resultat: 'reportee' },
      { id: '3', title: '', resultat: 'ouverte' },
    ]);
    expect(d?.abandon).toBe('plus de budget');
  });

  it('sans ces sections : null, jamais un texte deviné', () => {
    const d = parseSprintDetail('d', '2026-11-03-sprint-x.md', '# nu\n');
    expect(d).toMatchObject({ enClair: null, lot: [], abandon: null });
  });

  it('avec le JSON : la source est `json`, le lot vient du JSON, la prose du markdown', () => {
    const d = parseSprintDetail('d', '2026-11-04-sprint-x.md', md, jsonReport());
    expect(d?.source).toBe('json');
    expect(d?.lot.map((e) => e.resultat)).toEqual(['livree', 'reportee', 'ouverte']);
    expect(d?.enClair).toBe('Le sprint a livré une fiche.');
  });

  it('un nom qui n’est pas un compte rendu rend null', () => {
    expect(parseSprintDetail('d', 'notes.md', md)).toBeNull();
  });
});
