/**
 * Règles PROJET-LOCAL, côté disque (fiche 20260910152227744, ADR-0050) : le chargeur du contrat, l'écriture
 * gardée du jeu composé, et la commande `ezk rules`. Banc d'essai : des projets consommateurs JETABLES —
 * A (un contrat : une règle-gate, un conseil), B (aucun contrat), C (hors git). Le test vise la couche
 * déterministe (règle chargée, étiquette de garantie), jamais l'obéissance d'un LLM.
 *
 * La commande tourne en mémoire (`runRules`) ; deux vrais processus seulement prouvent le câblage du script :
 * chaque processus lancé pèse sur les autres suites quand tout tourne en parallèle.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PROJECT_RULES_FILE, renderProjectRules } from '../core/project-rules.js';
import {
  ProjectRulesFileError,
  removeProjectRulesFile,
  writeProjectRulesFile,
} from '../io/project-rules-file.js';
import { runRules } from '../io/rules-command.js';
import { gitFacts, loadProjectRules } from '../loaders/project-rules.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

const made: string[] = [];
const scratch = (): string => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-rules-')));
  made.push(dir);
  return dir;
};
afterAll(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});

function put(root: string, files: Record<string, string>): string {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

function gitInit(root: string): string {
  const git = (...args: string[]): string =>
    execFileSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=T', '-c', 'commit.gpgsign=false', ...args], {
      cwd: root,
      encoding: 'utf8',
    });
  git('init', '--quiet');
  git('commit', '--quiet', '--allow-empty', '-m', 'init');
  return root;
}

const RULE = (id: string, level: string, body: string, extra = ''): string =>
  `---\nid: ${id}\nlevel: ${level}\n${extra}---\n\n${body}\n`;

const CONTRACT_A = {
  '.vectorz/rules.yml': [
    'bundles: [clean-code]',
    'bindings:',
    '  hexagonal-imports:',
    '    gate: pnpm lint:imports',
    '  prefer-composition: advisory',
    '',
  ].join('\n'),
  '.vectorz/rules/hexagonal-imports.md': RULE('hexagonal-imports', 'MUST', 'Aucun import de `adapters/` dans `domain/`.'),
  '.vectorz/rules/prefer-composition.md': RULE('prefer-composition', 'SHOULD', 'Préfère la composition à l’héritage.'),
};

let projectA: string; // un contrat, dépôt git
let projectB: string; // aucun contrat, dépôt git
let projectC: string; // un contrat vide, hors de tout dépôt git

beforeAll(() => {
  projectA = gitInit(put(scratch(), CONTRACT_A));
  projectB = gitInit(put(scratch(), { 'README.md': '# autre projet\n' }));
  projectC = put(scratch(), { '.vectorz/rules.yml': '{}\n' });
});

describe('loadProjectRules — lire le contrat du projet', () => {
  it('lit le manifeste et les règles locales, sans problème', () => {
    const loaded = loadProjectRules(projectA);
    expect(loaded.problems).toEqual([]);
    expect(loaded.manifest?.bundles).toEqual(['clean-code']);
    expect(loaded.manifest?.bindings['hexagonal-imports']).toEqual({ kind: 'gate', ref: 'pnpm lint:imports' });
    expect(loaded.local.map((r) => [r.id, r.level, r.file])).toEqual([
      ['hexagonal-imports', 'MUST', '.vectorz/rules/hexagonal-imports.md'],
      ['prefer-composition', 'SHOULD', '.vectorz/rules/prefer-composition.md'],
    ]);
  });

  it('un projet sans contrat : rien, et pas un problème', () => {
    const loaded = loadProjectRules(projectB);
    expect(loaded.manifest).toBeUndefined();
    expect(loaded.local).toEqual([]);
    expect(loaded.problems).toEqual([]);
  });

  it('des règles locales sans manifeste seraient mortes en silence : c’est un problème', () => {
    const root = put(scratch(), { '.vectorz/rules/x.md': RULE('x', 'SHOULD', 'texte') });
    const { problems } = loadProjectRules(root);
    expect(problems.some((p) => /rules\.yml.*absent|absent/.test(p.message))).toBe(true);
  });

  it.each([
    ['un YAML malformé', { '.vectorz/rules.yml': 'bundles: [clean-code\n' }, /malformé/],
    ['une règle sans id', { '.vectorz/rules.yml': '{}', '.vectorz/rules/a.md': '---\nlevel: MUST\n---\ntexte\n' }, /id/],
    [
      'un niveau invalide',
      { '.vectorz/rules.yml': '{}', '.vectorz/rules/a.md': RULE('a', 'ALWAYS', 'texte') },
      /MUST, SHOULD ou MAY/,
    ],
    [
      'un id qui sort du dossier',
      { '.vectorz/rules.yml': '{}', '.vectorz/rules/a.md': RULE('../a', 'SHOULD', 'texte') },
      /non sûr/,
    ],
    [
      'des enforcements dans une règle locale (sans effet)',
      {
        '.vectorz/rules.yml': '{}',
        '.vectorz/rules/a.md': RULE('a', 'SHOULD', 'texte', 'enforcements:\n  - type: prompt\n'),
      },
      /enforcements.*rules\.yml/,
    ],
  ])('refuse %s, en citant le fichier', (_label, files, message) => {
    const { problems } = loadProjectRules(put(scratch(), files));
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.some((p) => message.test(p.message))).toBe(true);
    expect(problems.every((p) => p.file !== undefined)).toBe(true);
  });
});

describe('gitFacts — chemin résolu et SHA, valeur vide explicite hors git', () => {
  it('dans un dépôt git : la racine et le commit', () => {
    const facts = gitFacts(projectA);
    expect(facts.toplevel).toBe(projectA);
    expect(facts.sha).toMatch(/^[0-9a-f]{40}$/);
  });

  it('hors dépôt git : null, pas une erreur', () => {
    expect(gitFacts(projectC)).toEqual({ toplevel: null, sha: null });
  });
});

describe('écriture gardée du jeu composé', () => {
  const content = renderProjectRules([]);

  it('crée, met à jour, puis ne touche plus à un contenu identique', () => {
    const root = scratch();
    expect(writeProjectRulesFile(root, content)).toBe('created');
    expect(existsSync(join(root, PROJECT_RULES_FILE))).toBe(true);
    expect(writeProjectRulesFile(root, content)).toBe('unchanged');
    expect(writeProjectRulesFile(root, `${content}\nAutre.\n`)).toBe('updated');
  });

  it('refuse d’écraser un fichier du projet qui n’a pas notre marqueur', () => {
    const root = put(scratch(), { [PROJECT_RULES_FILE]: '# Mes règles à moi\n' });
    expect(() => writeProjectRulesFile(root, content)).toThrow(ProjectRulesFileError);
    expect(readFileSync(join(root, PROJECT_RULES_FILE), 'utf8')).toBe('# Mes règles à moi\n');
    expect(() => removeProjectRulesFile(root)).toThrow(ProjectRulesFileError);
  });

  it('refuse d’écrire à travers un lien', () => {
    const root = scratch();
    const elsewhere = put(scratch(), { 'cible.md': 'x' });
    mkdirSync(join(root, '.claude', 'rules'), { recursive: true });
    symlinkSync(join(elsewhere, 'cible.md'), join(root, PROJECT_RULES_FILE));
    expect(() => writeProjectRulesFile(root, content)).toThrow(/lien/);
    expect(readFileSync(join(elsewhere, 'cible.md'), 'utf8')).toBe('x');
  });

  it('refuse un dossier .claude qui est un lien vers l’extérieur du projet', () => {
    const root = scratch();
    const outside = scratch();
    symlinkSync(outside, join(root, '.claude'));
    expect(() => writeProjectRulesFile(root, content)).toThrow(/sort du projet/);
    expect(existsSync(join(outside, 'rules', 'vectorz-project.md'))).toBe(false);
  });

  it('retire NOTRE fichier, et seulement lui', () => {
    const root = scratch();
    writeProjectRulesFile(root, content);
    expect(removeProjectRulesFile(root)).toBe('removed');
    expect(existsSync(join(root, PROJECT_RULES_FILE))).toBe(false);
    expect(removeProjectRulesFile(root)).toBe('absent');
  });
});

/** `ezk rules <verbe>` en mémoire : le code de sortie et ce qu'il écrit. */
function rules(verb: 'check' | 'show' | 'apply', root: string, flags: string[] = []) {
  let out = '';
  let err = '';
  const code = runRules({
    verb,
    flags,
    root,
    megaCity,
    out: (t) => {
      out += t;
    },
    err: (t) => {
      err += t;
    },
  });
  return { code, out, err };
}

describe('ezk rules — le banc d’essai (projets consommateurs jetables)', () => {
  it('A : le jeu effectif porte la règle-gate ET le conseil, étiquetés différemment, avec chemin, SHA et empreinte', () => {
    const r = rules('show', projectA, ['--json']);
    expect(r.code).toBe(0);
    const shown = JSON.parse(r.out) as {
      root: string;
      rootKind: string;
      sha: string;
      digest: string;
      rules: { id: string; origin: string; guarantee: { kind: string }; label: string }[];
    };
    expect(shown.root).toBe(projectA);
    expect(shown.rootKind).toBe('git');
    expect(shown.sha).toBe(gitFacts(projectA).sha);
    expect(shown.digest).toMatch(/^[0-9a-f]{12}$/);
    const byId = Object.fromEntries(shown.rules.map((x) => [x.id, x]));
    expect(byId['hexagonal-imports']).toMatchObject({ origin: 'local', guarantee: { kind: 'gate' } });
    expect(byId['hexagonal-imports']?.label).toMatch(/gate : pnpm lint:imports/);
    expect(byId['prefer-composition']).toMatchObject({ origin: 'local', guarantee: { kind: 'advisory' } });
    expect(byId['prefer-composition']?.label).toBe('conseil, non garanti');
    expect(shown.rules.some((x) => x.origin === 'global' && x.id.startsWith('clean-code/'))).toBe(true); // le bundle choisi
  });

  it('A, en texte : le projet, le commit, l’empreinte, puis chaque règle avec son étiquette', () => {
    const r = rules('show', projectA);
    expect(r.code).toBe(0);
    expect(r.out).toContain(`Projet : ${projectA} (racine git)`);
    expect(r.out).toMatch(/Commit : [0-9a-f]{40}/);
    expect(r.out).toContain('## hexagonal-imports  `[MUST]`  gate : pnpm lint:imports (exécuté par le projet)');
    expect(r.out).toContain('## prefer-composition  `[SHOULD]`  conseil, non garanti');
    expect(r.out).not.toMatch(/^---$/m); // l'en-tête du fichier n'est pas dans l'affichage
  });

  it('B, sans contrat : rien n’est composé, et la règle de A n’y est jamais (scope étanche)', () => {
    const r = rules('show', projectB);
    expect(r.code).toBe(0);
    expect(r.out).toContain('pas de contrat de règles');
    expect(r.out).not.toContain('hexagonal-imports');
    expect(rules('apply', projectB).code).toBe(0);
    expect(existsSync(join(projectB, PROJECT_RULES_FILE))).toBe(false);
  });

  it('C, hors de tout dépôt git : le SHA est une valeur vide explicite, pas une erreur', () => {
    const r = rules('show', projectC, ['--json']);
    expect(r.code).toBe(0);
    const shown = JSON.parse(r.out) as { sha: string | null; rootKind: string };
    expect(shown.sha).toBeNull();
    expect(shown.rootKind).toBe('dossier');
  });

  it('check est vert sur A ; apply écrit le jeu dans A seulement, de façon idempotente', () => {
    expect(rules('check', projectA).code).toBe(0);
    expect(rules('apply', projectA).code).toBe(0);
    const text = readFileSync(join(projectA, PROJECT_RULES_FILE), 'utf8');
    expect(text).toContain('Aucun import de `adapters/` dans `domain/`.');
    expect(text).toContain('gate : pnpm lint:imports');
    expect(text).toContain('conseil, non garanti');
    expect(existsSync(join(projectB, PROJECT_RULES_FILE))).toBe(false);
    expect(rules('apply', projectA).out).toContain('déjà à jour');
  });

  it('un contrat qui disparaît retire le fichier généré — et lui seul', () => {
    const root = put(scratch(), { '.vectorz/rules.yml': '{}\n' });
    expect(rules('apply', root).code).toBe(0);
    expect(existsSync(join(root, PROJECT_RULES_FILE))).toBe(true);
    rmSync(join(root, '.vectorz', 'rules.yml'));
    const gone = rules('apply', root);
    expect(gone.code).toBe(0);
    expect(gone.out).toContain('retiré');
    expect(existsSync(join(root, PROJECT_RULES_FILE))).toBe(false);

    const mine = put(scratch(), { [PROJECT_RULES_FILE]: '# à moi\n' });
    expect(rules('apply', mine).code).toBe(1); // pas de contrat, mais un fichier qui n'est pas le nôtre
    expect(readFileSync(join(mine, PROJECT_RULES_FILE), 'utf8')).toBe('# à moi\n');
  });

  it('un MUST local sans gate ni revue : refusé net (code 1), et rien n’est écrit', () => {
    const bad = put(scratch(), {
      '.vectorz/rules.yml': '{}\n',
      '.vectorz/rules/r.md': RULE('r', 'MUST', 'Une règle dure sans contrôle.'),
    });
    const check = rules('check', bad);
    expect(check.code).toBe(1);
    expect(check.err).toMatch(/MUST/);
    expect(check.err).toContain('.vectorz/rules/r.md');
    expect(rules('apply', bad).code).toBe(1);
    expect(existsSync(join(bad, PROJECT_RULES_FILE))).toBe(false);
  });

  it('la précédence au chargement : desserrer un MUST global est refusé', () => {
    const loose = put(scratch(), {
      '.vectorz/rules.yml': '{}\n',
      '.vectorz/rules/l.md': RULE('hexagonal/adapter-location', 'SHOULD', 'Je desserre la loi globale.'),
    });
    const r = rules('check', loose);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/desserr/);
  });

  it('les MUST globaux sans garde restent chargeables : rien ne devient inchargeable', () => {
    const root = put(scratch(), { '.vectorz/rules.yml': 'bundles: [architecture]\n' });
    const r = rules('show', root, ['--json']);
    expect(r.code).toBe(0);
    const shown = JSON.parse(r.out) as { rules: { guarantee: { kind: string } }[] };
    expect(shown.rules.some((x) => x.guarantee.kind === 'unguarded-must')).toBe(true);
  });
});

describe('ezk rules — le script, de bout en bout (vrais processus)', () => {
  function script(args: string[], cwd: string) {
    const r = spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'ezk-rules.ts'), ...args], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, EZK_ROOT: '', INIT_CWD: '' },
    });
    return { code: r.status, out: r.stdout, err: r.stderr };
  }

  it('--root vise le projet depuis un autre dossier ; EZK_ROOT aussi ; sans rien, le projet du dossier courant', { timeout: 60_000 }, () => {
    const viaFlag = script(['show', '--root', projectA, '--json'], projectB);
    expect(viaFlag.code).toBe(0);
    expect(JSON.parse(viaFlag.out).root).toBe(projectA);
    const here = script(['show', '--json'], projectA); // la racine git du dossier courant
    expect(JSON.parse(here.out).root).toBe(projectA);
  });

  it('un contrat refusé sort en code 1, message sur stderr', { timeout: 60_000 }, () => {
    const bad = put(scratch(), {
      '.vectorz/rules.yml': '{}\n',
      '.vectorz/rules/r.md': RULE('r', 'MUST', 'Dure, sans contrôle.'),
    });
    const r = script(['check', '--root', bad], projectB);
    expect(r.code).toBe(1);
    expect(r.err).toContain('.vectorz/rules/r.md');
    expect(r.out).toBe('');
  });
});
