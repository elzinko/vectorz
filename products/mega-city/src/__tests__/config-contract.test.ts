/**
 * `ezk config show --json` — le contrat de la config projet (ADR-086).
 *
 * Le bug : mission control affichait « Ce projet n'a pas encore de .vectorz/config.yml » sur un
 * projet qui en a un. Mission control ne lisait pas la config ; la page concluait qu'elle manquait.
 * La méthode publie donc la config qu'elle résout, et dit si le fichier existe.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { CONFIG_SCHEMA_VERSION, ConfigShowSchema, buildConfigShow } from '../core/config-contract.js';
import { ROLES } from '../core/model-config.js';
import { configShowData } from '../io/config-show.js';
import { CONFIG_EXAMPLE_FILE } from '../io/contract-files.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const roots: string[] = [];
function project(configYaml?: string, name = 'config.yml'): string {
  const root = mkdtempSync(join(tmpdir(), 'config-contract-'));
  roots.push(root);
  if (configYaml !== undefined) {
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(join(root, '.vectorz', name), configYaml);
  }
  return root;
}
afterEach(() => {
  for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
});

describe('config show --json — le contrat', () => {
  it('un projet avec config.yml : le fichier est nommé, ses réglages sortent', () => {
    const data = configShowData(project('github: false\nintegration: push-ff\nrelease:\n  gate: off\n'));
    expect(ConfigShowSchema.parse(data)).toEqual(data);
    expect(data.schema_version).toBe(CONFIG_SCHEMA_VERSION);
    expect(data.file).toBe('.vectorz/config.yml');
    expect(data.github).toEqual({ pr: false, ci: false, codexReview: false });
    expect(data.integration).toBe('push-ff');
    expect(data.releaseGate).toBe(false);
  });

  it('un projet sans config : file vaut null, et les défauts de la méthode sortent', () => {
    const data = configShowData(project());
    expect(data.file).toBeNull();
    expect(data.github).toEqual({ pr: true, ci: true, codexReview: true });
    expect(data.integration).toBe('local-squash');
    expect(data.releaseGate).toBe(true);
  });

  it('config.yaml est trouvé aussi', () => {
    expect(configShowData(project('github: true\n', 'config.yaml')).file).toBe('.vectorz/config.yaml');
  });

  it('chaque agent sort résolu, avec la source de la valeur', () => {
    const data = configShowData(project('roles:\n  ezk-dev: high\nagents:\n  ezk-qa:\n    model: haiku\n'));
    expect(data.agents.map((a) => a.agent)).toEqual(ROLES);
    expect(data.agents.find((a) => a.agent === 'ezk-dev')).toEqual({
      agent: 'ezk-dev',
      tier: 'high',
      model: 'claude-opus-4-8',
      effort: 'high',
      source: 'tier-projet',
    });
    expect(data.agents.find((a) => a.agent === 'ezk-qa')).toMatchObject({ model: 'haiku', source: 'agent' });
    expect(data.agents.find((a) => a.agent === 'ezk-architect')).toMatchObject({ source: 'defaut' });
  });

  it('un tier mal saisi : l’agent sort avec son erreur, les autres restent lisibles', () => {
    const data = buildConfigShow({
      file: '.vectorz/config.yml',
      github: { pr: true, ci: true, codexReview: true },
      integration: 'local-squash',
      release: { gate: true },
      adverseReview: 'run',
      models: { roles: { 'ezk-dev': 'enorme' as never } },
    });
    expect(ConfigShowSchema.parse(data)).toEqual(data);
    const dev = data.agents.find((a) => a.agent === 'ezk-dev');
    expect(dev).toEqual({ agent: 'ezk-dev', error: expect.stringContaining('enorme') });
    expect(data.agents.find((a) => a.agent === 'ezk-pm')).toMatchObject({ source: 'defaut' });
  });

  it('la revue adverse : run par défaut, skip seulement si la config le pose (fiche 20260830110131158)', () => {
    expect(configShowData(project()).adverseReview).toBe('run');
    expect(configShowData(project('review:\n  adverse: skip\n')).adverseReview).toBe('skip');
    expect(configShowData(project('review:\n  adverse: oui\n')).adverseReview).toBe('run');
  });

  it('un YAML malformé lève une erreur qui nomme le fichier, jamais les défauts en silence', () => {
    expect(() => configShowData(project('github: [\n'))).toThrow(/config\.yml/);
  });

  it('l’exemple rangé respecte le schéma strict : le producteur décrit chaque champ qu’il sort', () => {
    const example = JSON.parse(readFileSync(join(megaCity, CONFIG_EXAMPLE_FILE), 'utf8'));
    expect(ConfigShowSchema.parse(example)).toEqual(example);
  });
});
