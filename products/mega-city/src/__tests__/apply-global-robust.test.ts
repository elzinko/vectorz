/**
 * Matérialisation robuste (fiche 20260813095351680) — trois défauts de lawgiver, prouvés sur une racine
 * JETABLE (jamais le vrai ~/.claude) :
 *   1. `bind-global` en copie plantait au 2ᵉ passage sur un agent qu'il avait lui-même copié ;
 *   2. le regroupement des fichiers d'un skill déduisait son dossier de ses `SKILL.md` : un fichier annexe
 *      nommé `SKILL.md` disparaissait en copie, deux skills imbriqués s'effaçaient l'un l'autre ;
 *   3. (le cap projet, lui, est dans `claude-code.test.ts` et `apply-project-skills.test.ts`).
 */
import { mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, existsSync, lstatSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { claudeCodeGlobalCap } from '../caps/claude-code-global.js';
import { bind } from '../core/bind.js';
import { diagnose } from '../core/deploy-doctor.js';
import { expectedItems } from '../core/deploy-state.js';
import { MANAGED_MARKER, isManagedFile } from '../domain/managed-file.js';
import type { ResolvedProfile } from '../domain/model.js';
import type { WritePlan } from '../domain/plan.js';
import { applyGlobalPlan } from '../io/apply.js';
import { probePath, readText } from '../io/deploy-probe.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'lawgiver-robust-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const read = (rel: string): string => readFileSync(join(root, rel), 'utf8');

const emptyProfile: ResolvedProfile = { rules: [], agents: [], skills: [] };
const withAgent = (role = 'Tu es le reviewer.'): ResolvedProfile => ({
  ...emptyProfile,
  agents: [{ id: 'ezk-reviewer', role, competences: [], interactions: [], model: 'sonnet' }],
});

describe('agents en copie — rejouer bind-global (le bug : le 2ᵉ passage plantait)', () => {
  it('un 2ᵉ passage réussit sur un plan RÉEL, agents compris, et laisse le même résultat', () => {
    const plan = bind('global', root, 'claude-code-global', megaCity);
    applyGlobalPlan(plan, root);
    const first = read('agents/ezk-architect.md');
    expect(() => applyGlobalPlan(plan, root)).not.toThrow();
    expect(read('agents/ezk-architect.md')).toBe(first);
    expect(isManagedFile(first)).toBe(true);
  });

  it('chaque copie porte le marqueur en tête de son en-tête, et garde son contenu', () => {
    const plan = claudeCodeGlobalCap.materialize(withAgent(), root);
    applyGlobalPlan(plan, root);
    expect(read('agents/ezk-reviewer.md')).toBe(
      `---\n${MANAGED_MARKER}\nname: ezk-reviewer\nmodel: sonnet\n---\nTu es le reviewer.\n`,
    );
  });

  it('met la copie à jour quand le catalogue a changé entre deux passages', () => {
    applyGlobalPlan(claudeCodeGlobalCap.materialize(withAgent('Version 1.'), root), root);
    applyGlobalPlan(claudeCodeGlobalCap.materialize(withAgent('Version 2.'), root), root);
    expect(read('agents/ezk-reviewer.md')).toContain('Version 2.');
    expect(read('agents/ezk-reviewer.md')).not.toContain('Version 1.');
  });

  it('un vrai fichier agent de l’utilisateur n’est JAMAIS écrasé, et le refus dit quoi faire', () => {
    mkdirSync(join(root, 'agents'), { recursive: true });
    writeFileSync(join(root, 'agents/ezk-reviewer.md'), '# Mon reviewer à moi\n');
    const plan = claudeCodeGlobalCap.materialize(withAgent(), root);
    expect(() => applyGlobalPlan(plan, root)).toThrow(/refus non-destructif/);
    expect(() => applyGlobalPlan(plan, root)).toThrow(/supprime/);
    expect(read('agents/ezk-reviewer.md')).toBe('# Mon reviewer à moi\n');
  });

  it('une ancienne copie, faite avant le marqueur, est refusée UNE fois : la supprimer suffit, ce n’est pas un défaut', () => {
    mkdirSync(join(root, 'agents'), { recursive: true });
    const legacy = '---\nname: ezk-reviewer\nmodel: sonnet\n---\nTu es le reviewer.\n'; // sans marqueur
    writeFileSync(join(root, 'agents/ezk-reviewer.md'), legacy);
    const plan = claudeCodeGlobalCap.materialize(withAgent(), root);
    expect(() => applyGlobalPlan(plan, root)).toThrow(/rm /);
    rmSync(join(root, 'agents/ezk-reviewer.md'));
    applyGlobalPlan(plan, root);
    expect(isManagedFile(read('agents/ezk-reviewer.md'))).toBe(true);
    expect(() => applyGlobalPlan(plan, root)).not.toThrow(); // désormais rejouable
  });

  it('copie → lien → copie : les changements de mode ne bloquent pas une copie marquée', () => {
    const catalog = mkdtempSync(join(tmpdir(), 'lawgiver-catalog-'));
    try {
      mkdirSync(join(catalog, 'agents'), { recursive: true });
      writeFileSync(join(catalog, 'agents/ezk-reviewer.md'), '---\nname: ezk-reviewer\n---\nSource.\n');
      const plan = claudeCodeGlobalCap.materialize(withAgent(), root);
      applyGlobalPlan(plan, root); // copie
      applyGlobalPlan(plan, root, { mode: 'link', catalogRoot: catalog }); // la copie marquée devient un lien
      expect(lstatSync(join(root, 'agents/ezk-reviewer.md')).isSymbolicLink()).toBe(true);
      expect(readlinkSync(join(root, 'agents/ezk-reviewer.md'))).toBe(join(catalog, 'agents/ezk-reviewer.md'));
      applyGlobalPlan(plan, root); // et revient en copie, sans écrire à travers le lien
      expect(lstatSync(join(root, 'agents/ezk-reviewer.md')).isSymbolicLink()).toBe(false);
      expect(readFileSync(join(catalog, 'agents/ezk-reviewer.md'), 'utf8')).toContain('Source.'); // la source est intacte
    } finally {
      rmSync(catalog, { recursive: true, force: true });
    }
  });

  it('`status` et `doctor` restent justes : copie à jour = rien à signaler, copie périmée = signalée', () => {
    const plan = claudeCodeGlobalCap.materialize(withAgent(), root);
    applyGlobalPlan(plan, root);
    const probe = { fact: (rel: string) => probePath(root, rel), readText: (rel: string) => readText(root, rel) };
    expect(diagnose(plan, probe).problems).toEqual([]);
    writeFileSync(join(root, 'agents/ezk-reviewer.md'), `---\n${MANAGED_MARKER}\nname: ezk-reviewer\n---\nVieille version.\n`);
    expect(diagnose(plan, probe).problems.map((p) => p.kind)).toEqual(['copie-perimee']);
  });
});

describe('regroupement des fichiers d’un skill — le plan porte le dossier', () => {
  const skills = (...list: ResolvedProfile['skills']): ResolvedProfile => ({ ...emptyProfile, skills: list });

  it('un fichier annexe nommé SKILL.md est LIVRÉ en copie, et ne passe pas pour un skill', () => {
    const plan = claudeCodeGlobalCap.materialize(
      skills({
        id: 'gen',
        content: '# gen',
        assets: [
          { path: 'templates/x/SKILL.md', content: '# modèle de skill\n' },
          { path: 'templates/x/notes.md', content: 'notes\n' },
        ],
      }),
      root,
    );
    applyGlobalPlan(plan, root);
    expect(read('skills/gen/SKILL.md')).toBe('# gen\n');
    expect(read('skills/gen/templates/x/SKILL.md')).toBe('# modèle de skill\n'); // ne disparaît plus
    expect(read('skills/gen/templates/x/notes.md')).toBe('notes\n');
    expect(() => applyGlobalPlan(plan, root)).not.toThrow(); // et le 2ᵉ passage tient
    expect(read('skills/gen/templates/x/SKILL.md')).toBe('# modèle de skill\n');
  });

  it('deux skills imbriqués (foo, foo/bar) sont posés TOUS LES DEUX en copie, et rejouables', () => {
    const plan = claudeCodeGlobalCap.materialize(
      skills({ id: 'foo', content: '# foo' }, { id: 'foo/bar', content: '# bar' }),
      root,
    );
    applyGlobalPlan(plan, root);
    expect(read('skills/foo/SKILL.md')).toBe('# foo\n');
    expect(read('skills/foo/bar/SKILL.md')).toBe('# bar\n'); // l’enfant n’est plus effacé par le parent
    expect(() => applyGlobalPlan(plan, root)).not.toThrow();
    expect(read('skills/foo/bar/SKILL.md')).toBe('# bar\n');
  });

  it('en --link, des skills imbriqués sont refusés net : rien n’est écrit, le catalogue n’est pas abîmé', () => {
    const catalog = mkdtempSync(join(tmpdir(), 'lawgiver-catalog-'));
    try {
      mkdirSync(join(catalog, 'skills/foo/bar'), { recursive: true });
      writeFileSync(join(catalog, 'skills/foo/SKILL.md'), '# foo\n');
      writeFileSync(join(catalog, 'skills/foo/bar/SKILL.md'), '# bar\n');
      const plan = claudeCodeGlobalCap.materialize(
        skills({ id: 'foo', content: '# foo' }, { id: 'foo/bar', content: '# bar' }),
        root,
      );
      expect(() => applyGlobalPlan(plan, root, { mode: 'link', catalogRoot: catalog })).toThrow(/imbriqu/);
      expect(existsSync(join(root, 'skills'))).toBe(false);
      expect(readFileSync(join(catalog, 'skills/foo/bar/SKILL.md'), 'utf8')).toBe('# bar\n');
    } finally {
      rmSync(catalog, { recursive: true, force: true });
    }
  });

  it('un plan écrit à la main, sans métadonnée de dossier, garde l’ancien repérage par SKILL.md', () => {
    const plan: WritePlan = {
      files: [
        { path: 'skills/a/SKILL.md', content: '# a\n' },
        { path: 'skills/a/scripts/run.sh', content: '#!/bin/sh\n' },
      ],
      hooks: [],
    };
    applyGlobalPlan(plan, root);
    applyGlobalPlan(plan, root);
    expect(read('skills/a/scripts/run.sh')).toBe('#!/bin/sh\n');
  });
});

describe('deploy-state — les éléments du profil suivent le dossier déclaré par le plan', () => {
  it('un fichier annexe SKILL.md n’est pas un skill du profil ; deux skills imbriqués sont deux éléments', () => {
    const plan = claudeCodeGlobalCap.materialize(
      {
        ...emptyProfile,
        skills: [
          { id: 'gen', content: '# gen', assets: [{ path: 'templates/x/SKILL.md', content: 'm' }] },
          { id: 'foo', content: '# foo' },
          { id: 'foo/bar', content: '# bar' },
        ],
      },
      root,
    );
    expect(expectedItems(plan).map((i) => `${i.kind}:${i.id}`)).toEqual([
      'skill:foo',
      'skill:foo/bar',
      'skill:gen',
    ]);
  });
});
