/**
 * La source des rétros (fiche 20260826072532537) : le JSON de `ezk retro captures --json` est vérifié, un
 * format inconnu est refusé net, jamais deviné. Aucun contrat versionné n'existe encore : l'absence de
 * `schema_version` est acceptée, une version annoncée autre que 1 est refusée.
 */
import { describe, expect, it } from 'vitest';
import { retroCapturesOutput, translateRetroCaptures } from './ezkRetroCapturesSource.js';

const action = {
  proposition: 'Vérifier avant de citer',
  kind: 'regle',
  target: 'global',
  by: ['architecture', 'qualite'],
  status: '✅',
  decision: 'Adoptée : règle proven-outbound-references',
  date: '2026-07-18',
};

const capture = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  file: 'docs/captures/2026-07-18-retro-cinq-sprints.md',
  date: '2026-07-18',
  theme: 'Cinq sprints autonomes du jour',
  scope: 'Les 5 sprints du 18 juillet',
  participants: ['architecture', 'po'],
  actions: [action, { proposition: 'En attente', kind: 'action', by: [], status: '⏳', decision: '' }],
  ...over,
});

describe('translateRetroCaptures', () => {
  it('garde chaque champ publié par la méthode, y compris les propositions et leur décision', () => {
    const { captures, problems } = translateRetroCaptures({ captures: [capture()], problems: [] });
    expect(problems).toEqual([]);
    expect(captures).toHaveLength(1);
    expect(captures[0]).toMatchObject({
      file: 'docs/captures/2026-07-18-retro-cinq-sprints.md',
      date: '2026-07-18',
      theme: 'Cinq sprints autonomes du jour',
      scope: 'Les 5 sprints du 18 juillet',
      participants: ['architecture', 'po'],
    });
    expect(captures[0]?.actions[0]).toEqual(action);
    expect(captures[0]?.actions[1]).toMatchObject({ status: '⏳', decision: '' });
    expect(captures[0]?.actions[1]?.date).toBeUndefined();
  });

  it('relaie les défauts de lisibilité publiés', () => {
    const problem = { file: 'docs/captures/x-retro-y.md', where: 'actions', message: 'tableau absent' };
    expect(translateRetroCaptures({ captures: [], problems: [problem] }).problems).toEqual([problem]);
  });

  it('accepte une réponse sans problems, et un schema_version 1', () => {
    expect(translateRetroCaptures({ schema_version: 1, captures: [] })).toEqual({ captures: [], problems: [] });
  });

  it('refuse un format inconnu ou mal formé', () => {
    expect(() => translateRetroCaptures(null)).toThrow(/ezk retro captures --json/);
    expect(() => translateRetroCaptures({ captures: [], schema_version: 2 })).toThrow(/schema_version 2 inconnu/);
    expect(() => translateRetroCaptures({})).toThrow(/champ captures/);
    expect(() => translateRetroCaptures({ captures: [capture({ theme: undefined })] })).toThrow(/champ theme absent/);
    expect(() => translateRetroCaptures({ captures: [capture({ actions: [{ ...action, status: '?' }] })] })).toThrow(
      /statut/,
    );
    expect(() => translateRetroCaptures({ captures: [capture({ participants: 'po' })] })).toThrow(/participants/);
  });
});

describe('retroCapturesOutput — une capture mal formée ne fait pas tomber la page', () => {
  const failWith = (stdout: unknown) => () => Promise.reject(Object.assign(new Error('ezk a échoué (code 1)'), { stdout }));

  it('garde la sortie complète quand ezk sort en code 1 parce qu’une capture est mal formée', async () => {
    const full = JSON.stringify({ captures: [], problems: [{ file: 'docs/captures/x.md', message: 'pas de tableau normé' }] });
    await expect(retroCapturesOutput(failWith(full), '/projet')).resolves.toBe(full);
  });

  it('laisse remonter l’échec quand ezk ne sort rien', async () => {
    await expect(retroCapturesOutput(failWith(''), '/projet')).rejects.toThrow(/code 1/);
  });

  it('lance la commande des rétros sur la racine du projet', async () => {
    const seen: string[][] = [];
    await retroCapturesOutput(async (args) => {
      seen.push(args);
      return '{}';
    }, '/projet');
    expect(seen).toEqual([['--root', '/projet', 'retro', 'captures', '--json']]);
  });
});
