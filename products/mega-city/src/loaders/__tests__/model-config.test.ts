import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveAgent } from '../../core/model-config.js';
import { loadModelConfig, writeModelConfig } from '../model-config.js';

function tmpProject(initialYaml?: string): string {
  const root = mkdtempSync(join(tmpdir(), 'ezk-model-'));
  if (initialYaml !== undefined) {
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(join(root, '.vectorz', 'config.yml'), initialYaml, 'utf8');
  }
  return root;
}

describe('writeModelConfig / loadModelConfig (fiche 451)', () => {
  it('régler un tier change le modèle résolu des agents de ce tier, pas des autres', () => {
    const root = tmpProject();
    const file = writeModelConfig(root, { scope: 'modeles', tier: 'high', model: 'Opus 5.5', effort: 'high' });
    expect(file).toContain(join('.vectorz', 'config.yml'));
    const config = loadModelConfig(root);
    expect(resolveAgent(config, 'ezk-architect').model).toBe('Opus 5.5');
    expect(resolveAgent(config, 'ezk-reviewer').model).toBe('Opus 5.5');
    // un agent d'un autre tier garde son défaut
    expect(resolveAgent(config, 'ezk-dev').model).toBe('sonnet');
  });

  it('régler le tier d’un rôle (roles) est chargé et résolu (source tier-projet)', () => {
    const root = tmpProject();
    writeModelConfig(root, { scope: 'roles', role: 'ezk-dev', tier: 'high' });
    const r = resolveAgent(loadModelConfig(root), 'ezk-dev');
    expect(r.tier).toBe('high');
    expect(r.model).toBe('claude-opus-4-8');
    expect(r.source).toBe('tier-projet');
  });

  it('un réglage d’agent direct l’emporte, et la source devient « agent »', () => {
    const root = tmpProject();
    writeModelConfig(root, { scope: 'agents', role: 'ezk-dev', model: 'gpt-5' });
    const r = resolveAgent(loadModelConfig(root), 'ezk-dev');
    expect(r.model).toBe('gpt-5');
    expect(r.source).toBe('agent');
  });

  it('unset revient au défaut (retire l’entrée)', () => {
    const root = tmpProject();
    writeModelConfig(root, { scope: 'agents', role: 'ezk-dev', model: 'gpt-5' });
    writeModelConfig(root, { scope: 'agents', role: 'ezk-dev', unset: true });
    const r = resolveAgent(loadModelConfig(root), 'ezk-dev');
    expect(r.model).toBe('sonnet');
    expect(r.source).toBe('defaut');
  });

  it('préserve les commentaires et les clés voisines du YAML', () => {
    const root = tmpProject('# ma config\ngithub: false\n');
    writeModelConfig(root, { scope: 'agents', role: 'ezk-dev', model: 'gpt-5' });
    const text = readFileSync(join(root, '.vectorz', 'config.yml'), 'utf8');
    expect(text).toContain('# ma config');
    expect(text).toContain('github: false');
    expect(text).toContain('gpt-5');
  });
});
