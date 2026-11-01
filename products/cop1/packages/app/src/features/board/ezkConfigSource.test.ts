/**
 * La config d'un projet vient de la méthode (`ezk config show --json`, ADR-086). Le bug d'origine :
 * mission control ne la lisait pas, et la page affichait « pas encore de .vectorz/config.yml » sur
 * un projet qui en avait un. Les tests injectent un faux runner qui rend l'exemple du contrat.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { EzkConfigSource } from './ezkConfigSource.js';
import { translateConfig } from './ezkConfigTranslator.js';
import { EzkContractError } from './ezkPlanTranslator.js';
import type { EzkRunner } from './ezkSource.js';

const EXAMPLE = readFileSync(
  fileURLToPath(
    new URL('../../../../../../mega-city/contracts/config-show/v1/example.json', import.meta.url),
  ),
  'utf8',
);
const example = (): Record<string, unknown> => JSON.parse(EXAMPLE) as Record<string, unknown>;

describe('translateConfig — traduit le contrat, ne recalcule rien', () => {
  it('l’exemple du contrat : fichier, GitHub à la carte, intégration, gate, tiers par agent', () => {
    const c = translateConfig(example(), '/p');
    expect(c.file).toBe('.vectorz/config.yml');
    expect(c.github).toBe('PR on · CI off · revue Codex off');
    expect(c.integration).toBe('push-ff');
    expect(c.releaseGate).toBe(false);
    expect(c.root).toBe('/p');
    expect(c.roles['ezk-dev']).toBe('high');
    expect(c.roles['ezk-architect']).toBe('high');
  });

  it('un agent mal configuré sort dans `errors`, jamais avec un tier inventé', () => {
    const c = translateConfig(example(), '/p');
    expect(c.errors['ezk-steward']).toContain('enorme');
    expect(c.roles['ezk-steward']).toBeUndefined();
  });

  it('pas de fichier : file vaut null (les autres champs sont les défauts de la méthode)', () => {
    expect(translateConfig({ ...example(), file: null }, '/p').file).toBeNull();
  });

  it('GitHub tout coupé ou tout branché se dit en mots', () => {
    const off = translateConfig(
      { ...example(), github: { pr: false, ci: false, codexReview: false } },
      '/p',
    );
    expect(off.github).toBe('coupé (100 % local)');
    const on = translateConfig(
      { ...example(), github: { pr: true, ci: true, codexReview: true } },
      '/p',
    );
    expect(on.github).toBe('branché (PR, CI, revue Codex)');
  });

  it('un schema_version inconnu est refusé en le nommant', () => {
    expect(() => translateConfig({ ...example(), schema_version: 2 }, '/p')).toThrow(
      EzkContractError,
    );
    expect(() => translateConfig({ ...example(), schema_version: 2 }, '/p')).toThrow(
      /schema_version 2/,
    );
  });

  it('une forme inattendue est refusée, jamais lue à moitié', () => {
    expect(() => translateConfig({ ...example(), github: 'off' }, '/p')).toThrow(EzkContractError);
    expect(() => translateConfig({ ...example(), agents: {} }, '/p')).toThrow(EzkContractError);
    expect(() => translateConfig({ ...example(), releaseGate: 'off' }, '/p')).toThrow(
      EzkContractError,
    );
  });
});

describe('EzkConfigSource — la config par ezk, sans attente', () => {
  it('appelle `<commande> --root <racine> config show --json` et rend la config traduite', async () => {
    const calls: string[][] = [];
    const run: EzkRunner = async (args) => {
      calls.push(args);
      return EXAMPLE;
    };
    const source = new EzkConfigSource({ command: ['ezk'], run });
    expect(source.get('/p')).toEqual({ state: 'loading' });
    await vi.waitFor(() => expect(source.get('/p').state).toBe('ok'));
    expect(calls).toEqual([['--root', '/p', 'config', 'show', '--json']]);
    const snap = source.get('/p');
    expect(snap.state === 'ok' && snap.config.file).toBe('.vectorz/config.yml');
  });

  it('un YAML malformé côté projet : indisponible, avec la ligne d’erreur d’ezk', async () => {
    const run: EzkRunner = async () => {
      throw Object.assign(new Error('Command failed'), {
        code: 1,
        stderr: 'Config projet illisible (YAML malformé) : /p/.vectorz/config.yml\n',
      });
    };
    const source = new EzkConfigSource({ command: ['ezk'], run });
    source.get('/p');
    await vi.waitFor(() => expect(source.get('/p').state).toBe('unavailable'));
    const snap = source.get('/p');
    expect(snap.state === 'unavailable' && snap.reason).toBe(
      'ezk a échoué (code 1) : Config projet illisible (YAML malformé) : /p/.vectorz/config.yml',
    );
  });
});
