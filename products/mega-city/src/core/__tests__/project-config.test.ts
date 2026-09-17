import { describe, expect, it } from 'vitest';
import { type GithubCapabilities, resolveGithub } from '../project-config.js';

const ON: GithubCapabilities = { pr: true, ci: true, codexReview: true };
const OFF: GithubCapabilities = { pr: false, ci: false, codexReview: false };

describe('resolveGithub — capacités du plugin github (fiche 20260916225506856)', () => {
  it('défaut tout-ON quand `github` est absent (non-régression)', () => {
    expect(resolveGithub(undefined)).toEqual(ON);
    expect(resolveGithub(null)).toEqual(ON);
    expect(resolveGithub(true)).toEqual(ON);
  });

  it('`github: false` coupe tout (déconnecter GitHub)', () => {
    expect(resolveGithub(false)).toEqual(OFF);
  });

  it('objet granulaire : une capacité off, les autres restent on', () => {
    expect(resolveGithub({ 'codex-review': false })).toEqual({
      pr: true,
      ci: true,
      codexReview: false,
    });
    expect(resolveGithub({ pr: false })).toEqual({ pr: false, ci: true, codexReview: true });
    expect(resolveGithub({ ci: false })).toEqual({ pr: true, ci: false, codexReview: true });
  });

  it('objet : capacité absente = allumée, seul `false` explicite coupe', () => {
    expect(resolveGithub({})).toEqual(ON);
    expect(resolveGithub({ pr: true })).toEqual(ON);
  });

  it('accepte aussi la graphie camelCase `codexReview`', () => {
    expect(resolveGithub({ codexReview: false })).toEqual({
      pr: true,
      ci: true,
      codexReview: false,
    });
  });

  it('valeur inattendue → défaut sûr tout-ON (jamais couper par accident)', () => {
    expect(resolveGithub('off')).toEqual(ON);
    expect(resolveGithub(42)).toEqual(ON);
  });

  it('valeur granulaire non-booléenne ne coupe pas (seul `false` coupe)', () => {
    expect(resolveGithub({ pr: 'false' })).toEqual(ON); // la string "false" n'est pas `false`
    expect(resolveGithub({ 'codex-review': null })).toEqual(ON); // null ne coupe pas
    expect(resolveGithub({ ci: 0 })).toEqual(ON); // 0 non plus
  });

  it('array (objet en JS) sans clé connue → tout ON', () => {
    expect(resolveGithub([])).toEqual(ON);
  });

  it('conflit kebab/camel : la graphie kebab `codex-review` gagne', () => {
    expect(resolveGithub({ 'codex-review': false, codexReview: true })).toEqual({
      pr: true,
      ci: true,
      codexReview: false,
    });
  });

  it('renvoie un objet neuf à chaque appel (pas de référence mutable partagée)', () => {
    const a = resolveGithub(undefined) as { pr: boolean };
    a.pr = false;
    expect(resolveGithub(undefined)).toEqual(ON);
  });
});
