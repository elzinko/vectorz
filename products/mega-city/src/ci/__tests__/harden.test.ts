import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { auditWorkflow, applyHardening } from '../harden.js';

const here = dirname(fileURLToPath(import.meta.url));
const fx = (name: string) => readFileSync(resolve(here, 'fixtures', name), 'utf8');

describe('auditWorkflow — skip-docs', () => {
  it('signale skip-docs manquant sur un workflow non frugal', () => {
    expect(auditWorkflow(fx('needs-skip-docs.yml')).missing).toContain('skip-docs');
  });

  it('ne signale rien sur un workflow déjà frugal', () => {
    expect(auditWorkflow(fx('already-frugal.yml')).missing).toEqual([]);
  });

  it('faux ami (P1) : un paths-ignore ciblant un seul .md ne vaut pas couverture docs', () => {
    const wf = `name: CI
on:
  pull_request:
    paths-ignore: ['CHANGELOG.md']
jobs:
  build:
    runs-on: ubuntu-latest
`;
    expect(auditWorkflow(wf).missing).toContain('skip-docs');
  });

  it('pull_request en forme liste (P2) : signalé hors périmètre, jamais « déjà frugal »', () => {
    const wf = `name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
`;
    const { patterns, missing } = auditWorkflow(wf);
    expect(missing).toEqual([]);
    expect(patterns[0]?.autoApplicable).toBe(false);
    expect(patterns[0]?.reason).toMatch(/liste/);
  });

  it('YAML invalide : l’audit lève (le CLI le traduit en message clair, sans écrire)', () => {
    const bad = `name: CI
on:
  pull_request:
    branches: [main
jobs: {}
`;
    expect(() => auditWorkflow(bad)).toThrow();
  });
});

describe('applyHardening — skip-docs', () => {
  it('ajoute paths-ignore docs quand il manque, et le résultat est frugal', () => {
    const { text, applied } = applyHardening(fx('needs-skip-docs.yml'));
    expect(applied).toContain('skip-docs');
    expect(auditWorkflow(text).missing).toEqual([]);
  });

  it('FUSIONNE sans écraser une liste paths-ignore existante (régression P0)', () => {
    const wf = `name: CI
on:
  pull_request:
    paths-ignore:
      - docs/**
      - assets/**
      - '*.png'
jobs:
  build:
    runs-on: ubuntu-latest
`;
    const { text, applied } = applyHardening(wf);
    expect(applied).toContain('skip-docs');
    // les entrées existantes SURVIVENT :
    expect(text).toMatch(/assets\/\*\*/);
    expect(text).toMatch(/'\*\.png'/);
    expect(text).toMatch(/docs\/\*\*/);
    // le glob manquant est ajouté :
    expect(text).toMatch(/\*\*\.md/);
    // résultat frugal :
    expect(auditWorkflow(text).missing).toEqual([]);
  });

  it('complète une couverture partielle sans dupliquer l’existant', () => {
    const wf = `name: CI
on:
  pull_request:
    paths-ignore:
      - docs/**
jobs:
  build:
    runs-on: ubuntu-latest
`;
    const { text } = applyHardening(wf);
    expect(text.match(/docs\/\*\*/g)?.length).toBe(1);
    expect(text).toMatch(/\*\*\.md/);
  });

  it('est idempotent : un second passage ne change plus rien', () => {
    const first = applyHardening(fx('needs-skip-docs.yml'));
    const second = applyHardening(first.text);
    expect(second.applied).toEqual([]);
    expect(second.text).toBe(first.text);
  });

  it('lecture seule sur un workflow déjà frugal : texte identique, rien appliqué', () => {
    const before = fx('already-frugal.yml');
    const { text, applied } = applyHardening(before);
    expect(applied).toEqual([]);
    expect(text).toBe(before);
  });

  it('no-op sur pull_request en forme liste (pas de corruption)', () => {
    const wf = `name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
`;
    const { text, applied } = applyHardening(wf);
    expect(applied).toEqual([]);
    expect(text).toBe(wf);
  });

  it('préserve les jobs et steps existants', () => {
    const { text } = applyHardening(fx('needs-skip-docs.yml'));
    expect(text).toMatch(/jobs:/);
    expect(text).toMatch(/actions\/checkout@v4/);
    expect(text).toMatch(/pnpm test/);
  });
});
