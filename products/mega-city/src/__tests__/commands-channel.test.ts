/**
 * Le 3ᵉ canal de lawgiver : `commands:` (fiche 20260816151112162, option A). Un profil déclare ses
 * slash-commands ; `bind-global` pose `~/.claude/commands/<id>.md` comme il pose les agents : copie
 * (marquée) ou lien, jamais d'écrasement d'un fichier de l'utilisateur ; `status` et `doctor` les comptent.
 * Preuves sur une racine JETABLE — jamais le vrai ~/.claude.
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { claudeCodeGlobalCap } from '../caps/claude-code-global.js';
import { bind } from '../core/bind.js';
import { diagnose } from '../core/deploy-doctor.js';
import { expectedItems, inspect, renderStatus } from '../core/deploy-state.js';
import { expandProfile } from '../core/expand.js';
import { MANAGED_MARKER, isManagedFile } from '../domain/managed-file.js';
import type { Profile, ResolvedProfile } from '../domain/model.js';
import { applyGlobalPlan } from '../io/apply.js';
import { probePath, readText } from '../io/deploy-probe.js';
import type { Catalog } from '../loaders/catalog.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'lawgiver-commands-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});
const read = (rel: string): string => readFileSync(join(root, rel), 'utf8');

const HELP = '---\ndescription: Index des commandes\n---\nAffiche l’index.\n';
const catalogWith = (...ids: string[]): Catalog => ({
  rules: new Map(),
  agents: new Map(),
  skills: new Map(),
  bundles: new Map(),
  profiles: new Map(),
  commands: new Map(ids.map((id) => [id, { id, content: `Commande ${id}.\n` }])),
});
const profile = (over: Partial<Profile>): Profile => ({ id: 'p', bundles: [], agents: [], skills: [], ...over });
const withCommands = (...commands: { id: string; content: string }[]): ResolvedProfile => ({
  rules: [],
  agents: [],
  skills: [],
  commands,
});

describe('expandProfile — les commandes d’un profil', () => {
  it('résout les ids déclarés : dédoublonnés, triés, un id inconnu est toléré (comme pour les skills)', () => {
    const resolved = expandProfile(profile({ commands: ['b', 'a', 'a', 'inconnue'] }), catalogWith('a', 'b'));
    expect(resolved.commands?.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('cumule celles des profils parents (extends)', () => {
    const parent = profile({ id: 'base', commands: ['a'] });
    const child = profile({ id: 'child', extends: ['base'], commands: ['b'] });
    const catalog = { ...catalogWith('a', 'b'), profiles: new Map([['base', parent], ['child', child]]) };
    expect(expandProfile(child, catalog).commands?.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('sans commande déclarée, le profil résolu n’a pas de clé commands (rien ne change pour les autres)', () => {
    expect(expandProfile(profile({}), catalogWith('a'))).toEqual({ rules: [], agents: [], skills: [] });
  });
});

describe('cap global — commands/<id>.md', () => {
  it('émet un fichier par commande, marqué dans l’en-tête, le reste intact', () => {
    const plan = claudeCodeGlobalCap.materialize(withCommands({ id: 'ezk-help', content: HELP }), root);
    const file = plan.files.find((f) => f.path === 'commands/ezk-help.md');
    expect(file?.content).toBe(`---\n${MANAGED_MARKER}\ndescription: Index des commandes\n---\nAffiche l’index.\n`);
  });

  it('sans commande, aucun fichier commands/ (le plan des profils actuels ne change pas)', () => {
    const plan = claudeCodeGlobalCap.materialize({ rules: [], agents: [], skills: [] }, root);
    expect(plan.files.some((f) => f.path.startsWith('commands/'))).toBe(false);
  });

  it('refuse un id qui s’échapperait du dossier (traversal)', () => {
    expect(() => claudeCodeGlobalCap.materialize(withCommands({ id: '../evil', content: 'x' }), root)).toThrow(/non sûr/);
  });
});

describe('bind-global — poser les commandes sans jamais écraser un fichier de l’utilisateur', () => {
  const plan = () => claudeCodeGlobalCap.materialize(withCommands({ id: 'ezk-help', content: HELP }), root);

  it('copie : pose commands/ezk-help.md, et un 2ᵉ passage réussit', () => {
    applyGlobalPlan(plan(), root);
    expect(isManagedFile(read('commands/ezk-help.md'))).toBe(true);
    expect(() => applyGlobalPlan(plan(), root)).not.toThrow();
  });

  it('copie : met à jour la commande quand le catalogue a changé', () => {
    applyGlobalPlan(plan(), root);
    applyGlobalPlan(claudeCodeGlobalCap.materialize(withCommands({ id: 'ezk-help', content: `${HELP}Nouveau.\n` }), root), root);
    expect(read('commands/ezk-help.md')).toContain('Nouveau.');
  });

  it('un vrai fichier commande de l’utilisateur n’est JAMAIS écrasé, et le refus dit quoi faire', () => {
    mkdirSync(join(root, 'commands'), { recursive: true });
    writeFileSync(join(root, 'commands/ezk-help.md'), 'Ma commande à moi.\n');
    expect(() => applyGlobalPlan(plan(), root)).toThrow(/refus non-destructif/);
    expect(() => applyGlobalPlan(plan(), root)).toThrow(/commande/);
    expect(() => applyGlobalPlan(plan(), root)).toThrow(/supprime/);
    expect(read('commands/ezk-help.md')).toBe('Ma commande à moi.\n');
  });

  it('lien : symlink vers la source du catalogue ; copie ↔ lien sans blocage', () => {
    const catalog = mkdtempSync(join(tmpdir(), 'lawgiver-catalog-'));
    try {
      mkdirSync(join(catalog, 'commands'), { recursive: true });
      writeFileSync(join(catalog, 'commands/ezk-help.md'), HELP);
      applyGlobalPlan(plan(), root, { mode: 'link', catalogRoot: catalog });
      expect(lstatSync(join(root, 'commands/ezk-help.md')).isSymbolicLink()).toBe(true);
      expect(readlinkSync(join(root, 'commands/ezk-help.md'))).toBe(join(catalog, 'commands/ezk-help.md'));
      applyGlobalPlan(plan(), root); // retour en copie : le lien est remplacé, la source reste intacte
      expect(lstatSync(join(root, 'commands/ezk-help.md')).isSymbolicLink()).toBe(false);
      expect(readFileSync(join(catalog, 'commands/ezk-help.md'), 'utf8')).toBe(HELP);
      applyGlobalPlan(plan(), root, { mode: 'link', catalogRoot: catalog }); // et de nouveau en lien
      expect(lstatSync(join(root, 'commands/ezk-help.md')).isSymbolicLink()).toBe(true);
    } finally {
      rmSync(catalog, { recursive: true, force: true });
    }
  });

  it('le profil global RÉEL pose /ezk-help (copie), et rejoue sans erreur', () => {
    const real = bind('global', root, 'claude-code-global', megaCity);
    expect(real.files.map((f) => f.path)).toContain('commands/ezk-help.md');
    applyGlobalPlan(real, root);
    applyGlobalPlan(real, root);
    expect(existsSync(join(root, 'commands/ezk-help.md'))).toBe(true);
    expect(read('commands/ezk-help.md')).toContain('description: Index des commandes ezk');
  });
});

describe('status et doctor — les commandes comptent', () => {
  const plan = () => claudeCodeGlobalCap.materialize(withCommands({ id: 'ezk-help', content: HELP }), root);
  const probe = {
    fact: (rel: string) => probePath(root, rel),
    readText: (rel: string) => readText(root, rel),
  };

  it('expectedItems range les commandes après les skills et les agents', () => {
    const mixed = claudeCodeGlobalCap.materialize(
      {
        rules: [],
        agents: [{ id: 'ezk-pm', role: 'pm', competences: [], interactions: [], model: 'sonnet' }],
        skills: [{ id: 'ezk-sprint', content: '# sprint' }],
        commands: [{ id: 'ezk-help', content: HELP }],
      },
      root,
    );
    expect(expectedItems(mixed).map((i) => `${i.kind}:${i.id}`)).toEqual([
      'skill:ezk-sprint',
      'agent:ezk-pm',
      'command:ezk-help',
    ]);
  });

  it('status : « commands (1) », puis absent / copie / lien selon l’état', () => {
    const items = expectedItems(plan());
    expect(renderStatus('global', root, inspect(items, (rel) => probe.fact(rel)))).toMatch(/commands \(1\)\n\s+absent\s+ezk-help/);
    applyGlobalPlan(plan(), root);
    expect(renderStatus('global', root, inspect(items, (rel) => probe.fact(rel)))).toMatch(/copie\s+ezk-help/);
  });

  it('status : sans commande dans le profil, la sortie est celle d’avant (aucun groupe commands)', () => {
    const none = claudeCodeGlobalCap.materialize({ rules: [], agents: [], skills: [] }, root);
    const text = renderStatus('daily', root, inspect(expectedItems(none), (rel) => probe.fact(rel)));
    expect(text).not.toMatch(/^\s+commands \(/m); // (le nom du dossier jetable, lui, peut contenir « commands »)
    expect(text).toMatch(/^\s+skills \(0\)$/m); // les groupes d'avant sont inchangés
    expect(text).toMatch(/^\s+agents \(0\)$/m);
  });

  it('doctor : manquante, puis à jour, puis périmée', () => {
    expect(diagnose(plan(), probe).problems.map((p) => p.kind)).toEqual(['manquant']);
    applyGlobalPlan(plan(), root);
    expect(diagnose(plan(), probe).problems).toEqual([]);
    writeFileSync(join(root, 'commands/ezk-help.md'), `---\n${MANAGED_MARKER}\n---\nVieille version.\n`);
    expect(diagnose(plan(), probe).problems.map((p) => p.kind)).toEqual(['copie-perimee']);
  });

  it('doctor : un lien mort (la source du catalogue a disparu) est signalé', () => {
    mkdirSync(join(root, 'commands'), { recursive: true });
    symlinkSync(join(root, 'nulle-part.md'), join(root, 'commands/ezk-help.md'));
    expect(diagnose(plan(), probe).problems.map((p) => p.kind)).toEqual(['lien-mort']);
  });
});
