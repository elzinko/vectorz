/**
 * Règles PROJET-LOCAL (fiche 20260910152227744, ADR-0050) — le cœur pur : le manifeste
 * `.vectorz/rules.yml`, la composition avec les bundles choisis, le méta-lint et l'étiquette de garantie.
 * Aucun disque ici : les règles arrivent déjà lues.
 */
import { describe, expect, it } from 'vitest';
import type { Rule } from '../domain/model.js';
import {
  type ComposeInput,
  type LocalRule,
  type RulesManifest,
  composeProjectRules,
  guaranteeLabel,
  isManagedProjectRules,
  parseRulesManifest,
  renderProjectRules,
  rulesDigest,
} from '../core/project-rules.js';

const globalRule = (id: string, level: Rule['level'], enforcements?: Rule['enforcements']): Rule => ({
  id,
  kind: 'disposition',
  level,
  content: `Texte global de ${id}.`,
  ...(enforcements ? { enforcements } : {}),
});

const localRule = (id: string, level: LocalRule['level'], content = `Texte local de ${id}.`): LocalRule => ({
  id,
  level,
  content,
  file: `.vectorz/rules/${id}.md`,
});

const CATALOG: Rule[] = [
  globalRule('hexagonal/adapter-location', 'MUST'),
  globalRule('clean-code/small-functions', 'SHOULD'),
  globalRule('development/adversarial-review-before-merge', 'MUST', [{ type: 'agent-check', agent: 'ezk-reviewer' }]),
  globalRule('conventional-commits/format', 'MUST', [
    { type: 'hook', hook: { stage: 'commit-msg', script: '#!/bin/sh' } },
  ]),
];

function input(over: Partial<ComposeInput> & { manifest?: RulesManifest | undefined }): ComposeInput {
  return {
    manifest: { bundles: [], bindings: {} },
    catalog: new Map(CATALOG.map((r) => [r.id, r])),
    knownBundles: new Set(['hexagonal', 'clean-code']),
    selected: [],
    local: [],
    ...over,
  };
}

describe('parseRulesManifest — le contrat du projet', () => {
  it('absent : rien à composer, rien à reprocher', () => {
    expect(parseRulesManifest(undefined, '.vectorz/rules.yml')).toEqual({ manifest: undefined, problems: [] });
  });

  it('lit les bundles choisis et un binding par règle (gate, review, advisory)', () => {
    const { manifest, problems } = parseRulesManifest(
      {
        bundles: ['hexagonal'],
        bindings: {
          'hexagonal-imports': { gate: 'pnpm lint:imports' },
          'revue-archi': { review: 'ezk-reviewer' },
          'prefer-composition': 'advisory',
        },
      },
      '.vectorz/rules.yml',
    );
    expect(problems).toEqual([]);
    expect(manifest).toEqual({
      bundles: ['hexagonal'],
      bindings: {
        'hexagonal-imports': { kind: 'gate', ref: 'pnpm lint:imports' },
        'revue-archi': { kind: 'review', ref: 'ezk-reviewer' },
        'prefer-composition': { kind: 'advisory' },
      },
    });
  });

  it('un manifeste vide est valide : aucun bundle, aucun binding', () => {
    expect(parseRulesManifest({}, 'f').manifest).toEqual({ bundles: [], bindings: {} });
  });

  it('refuse une clé inconnue, en citant le fichier et la clé', () => {
    const { problems } = parseRulesManifest({ bundle: ['x'] }, '.vectorz/rules.yml');
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain('bundle');
    expect(problems[0]?.file).toBe('.vectorz/rules.yml');
  });

  it.each([
    ['bundles qui n’est pas une liste de textes', { bundles: 'hexagonal' }],
    ['un binding à deux clés', { bindings: { r: { gate: 'x', review: 'y' } } }],
    ['un gate vide', { bindings: { r: { gate: '  ' } } }],
    ['un binding inconnu', { bindings: { r: 'garanti' } }],
    ['des bindings qui ne sont pas un objet', { bindings: ['r'] }],
    ['une racine qui n’est pas un objet', 'hexagonal'],
  ])('refuse %s', (_label, raw) => {
    const { manifest, problems } = parseRulesManifest(raw, '.vectorz/rules.yml');
    expect(manifest).toBeUndefined();
    expect(problems.length).toBeGreaterThan(0);
  });
});

describe('composeProjectRules — le scope étanche', () => {
  it('sans manifeste, rien n’est composé (le projet n’a pas de contrat)', () => {
    const r = composeProjectRules(input({ manifest: undefined, local: [localRule('hexagonal-imports', 'MUST')] }));
    expect(r.rules).toEqual([]);
    expect(r.problems).toEqual([]);
  });

  it('un manifeste sans bundle ni règle locale compose un jeu vide', () => {
    expect(composeProjectRules(input({})).rules).toEqual([]);
  });

  it('les règles locales d’un projet ne sortent que de SES entrées (deux projets, deux jeux)', () => {
    const a = composeProjectRules(
      input({
        manifest: { bundles: [], bindings: { 'hexagonal-imports': { kind: 'gate', ref: 'pnpm lint:imports' } } },
        local: [localRule('hexagonal-imports', 'MUST')],
      }),
    );
    const b = composeProjectRules(input({ manifest: { bundles: [], bindings: {} }, local: [] }));
    expect(a.rules.map((r) => r.id)).toEqual(['hexagonal-imports']);
    expect(b.rules.map((r) => r.id)).toEqual([]);
  });
});

describe('composeProjectRules — le méta-gate (jamais de dégradation silencieuse)', () => {
  const gate = { kind: 'gate', ref: 'pnpm lint:imports' } as const;

  it('un MUST local adossé à un gate est accepté, étiqueté « gate »', () => {
    const r = composeProjectRules(
      input({ manifest: { bundles: [], bindings: { 'hexagonal-imports': gate } }, local: [localRule('hexagonal-imports', 'MUST')] }),
    );
    expect(r.problems).toEqual([]);
    expect(r.rules[0]).toMatchObject({ id: 'hexagonal-imports', level: 'MUST', origin: 'local', guarantee: gate });
  });

  it('un MUST local adossé à une revue a posteriori est accepté : les deux types d’enforcement comptent', () => {
    const r = composeProjectRules(
      input({
        manifest: { bundles: [], bindings: { 'design-hexa': { kind: 'review', ref: 'ezk-reviewer' } } },
        local: [localRule('design-hexa', 'MUST')],
      }),
    );
    expect(r.problems).toEqual([]);
    expect(r.rules[0]?.guarantee).toEqual({ kind: 'review', ref: 'ezk-reviewer' });
  });

  it('un MUST local sans binding est REFUSÉ, avec son fichier et son id (pas rétrogradé)', () => {
    const r = composeProjectRules(input({ local: [localRule('hexagonal-imports', 'MUST')] }));
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0]).toMatchObject({ ruleId: 'hexagonal-imports', file: '.vectorz/rules/hexagonal-imports.md' });
    expect(r.problems[0]?.message).toMatch(/MUST/);
    expect(r.problems[0]?.message).toMatch(/gate|review/);
  });

  it('un MUST local déclaré « advisory » est REFUSÉ : un conseil ne peut pas être un MUST', () => {
    const r = composeProjectRules(
      input({ manifest: { bundles: [], bindings: { x: { kind: 'advisory' } } }, local: [localRule('x', 'MUST')] }),
    );
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0]?.message).toMatch(/advisory|conseil/);
  });

  it('un SHOULD ou MAY local sans binding est un conseil : accepté, étiqueté comme tel', () => {
    const r = composeProjectRules(input({ local: [localRule('prefer-composition', 'SHOULD'), localRule('naming', 'MAY')] }));
    expect(r.problems).toEqual([]);
    expect(r.rules.map((x) => x.guarantee.kind)).toEqual(['advisory', 'advisory']);
  });

  it('refuse une règle locale sans niveau valide ou deux règles locales de même id', () => {
    const twice = composeProjectRules(input({ local: [localRule('a', 'SHOULD'), localRule('a', 'SHOULD')] }));
    expect(twice.problems.some((p) => /deux fois|doublon/.test(p.message))).toBe(true);
  });

  it('un binding qui ne vise aucune règle est une faute de frappe : refusé', () => {
    const r = composeProjectRules(
      input({ manifest: { bundles: [], bindings: { 'hexagonal-imprts': gate } }, local: [localRule('hexagonal-imports', 'SHOULD')] }),
    );
    expect(r.problems.some((p) => p.ruleId === 'hexagonal-imprts')).toBe(true);
  });

  it('un bundle inconnu du catalogue est refusé', () => {
    const r = composeProjectRules(input({ manifest: { bundles: ['hexagonale'], bindings: {} } }));
    expect(r.problems.some((p) => p.message.includes('hexagonale'))).toBe(true);
  });
});

describe('composeProjectRules — la précédence (ajouter et durcir, jamais desserrer)', () => {
  it('une règle locale qui desserre un MUST global est une erreur', () => {
    const r = composeProjectRules(input({ local: [localRule('hexagonal/adapter-location', 'SHOULD')] }));
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0]?.message).toMatch(/desserr/);
  });

  it('même un MUST global hors des bundles choisis ne peut pas être desserré (la loi globale vaut partout)', () => {
    const r = composeProjectRules(input({ selected: [], local: [localRule('hexagonal/adapter-location', 'MAY')] }));
    expect(r.problems.some((p) => /desserr/.test(p.message))).toBe(true);
  });

  it('une règle locale peut durcir une règle globale (SHOULD → MUST) à condition d’avoir son binding', () => {
    const ok = composeProjectRules(
      input({
        manifest: { bundles: [], bindings: { 'clean-code/small-functions': { kind: 'gate', ref: 'pnpm lint' } } },
        selected: [CATALOG[1] as Rule],
        local: [localRule('clean-code/small-functions', 'MUST', 'Plus strict ici.')],
      }),
    );
    expect(ok.problems).toEqual([]);
    expect(ok.rules).toHaveLength(1);
    expect(ok.rules[0]).toMatchObject({ level: 'MUST', content: 'Plus strict ici.', origin: 'local' });
    const ko = composeProjectRules(
      input({ selected: [CATALOG[1] as Rule], local: [localRule('clean-code/small-functions', 'MUST')] }),
    );
    expect(ko.problems).toHaveLength(1); // durcir sans gate ni revue : refusé comme tout MUST local
  });

  it('même niveau : la règle locale précise la globale (une seule règle dans le jeu effectif)', () => {
    const r = composeProjectRules(
      input({ selected: [CATALOG[1] as Rule], local: [localRule('clean-code/small-functions', 'SHOULD', 'Ici : 20 lignes.')] }),
    );
    expect(r.problems).toEqual([]);
    expect(r.rules.map((x) => x.content)).toEqual(['Ici : 20 lignes.']);
  });
});

describe('composeProjectRules — les règles globales des bundles choisis', () => {
  it('apparaissent avec leur garantie réelle : hook, agent-check, conseil, ou MUST sans garde (héritage)', () => {
    const r = composeProjectRules(
      input({
        manifest: { bundles: ['hexagonal', 'clean-code'], bindings: {} },
        selected: CATALOG,
      }),
    );
    expect(r.problems).toEqual([]); // rien ne devient inchargeable
    const kinds = Object.fromEntries(r.rules.map((x) => [x.id, x.guarantee.kind]));
    expect(kinds).toEqual({
      'hexagonal/adapter-location': 'unguarded-must',
      'clean-code/small-functions': 'advisory',
      'development/adversarial-review-before-merge': 'agent-check',
      'conventional-commits/format': 'hook',
    });
    expect(r.rules.every((x) => x.origin === 'global')).toBe(true);
  });

  it('un binding du projet peut adosser un gate à une règle globale sans garde', () => {
    const r = composeProjectRules(
      input({
        manifest: { bundles: ['hexagonal'], bindings: { 'hexagonal/adapter-location': { kind: 'gate', ref: 'pnpm lint:imports' } } },
        selected: [CATALOG[0] as Rule],
      }),
    );
    expect(r.problems).toEqual([]);
    expect(r.rules[0]?.guarantee).toEqual({ kind: 'gate', ref: 'pnpm lint:imports' });
  });

  it('mais un binding « advisory » sur un MUST global desserrerait la loi : refusé', () => {
    const r = composeProjectRules(
      input({
        manifest: { bundles: ['hexagonal'], bindings: { 'hexagonal/adapter-location': { kind: 'advisory' } } },
        selected: [CATALOG[0] as Rule],
      }),
    );
    expect(r.problems.some((p) => /desserr|advisory|conseil/.test(p.message))).toBe(true);
  });

  it('trie le jeu effectif par id (plan reproductible)', () => {
    const r = composeProjectRules(
      input({ manifest: { bundles: [], bindings: {} }, local: [localRule('zeta', 'SHOULD'), localRule('alpha', 'MAY')] }),
    );
    expect(r.rules.map((x) => x.id)).toEqual(['alpha', 'zeta']);
  });
});

describe('étiquette de garantie — honnête sur ce qui est vérifié', () => {
  it('chaque garantie a son mot, et le conseil n’est jamais présenté comme garanti', () => {
    const gate = guaranteeLabel({ kind: 'gate', ref: 'pnpm lint:imports' });
    expect(gate).toMatch(/gate déclaré.*pnpm lint:imports.*projet/);
    expect(gate).toMatch(/non vérifié/); // vectorz lit la déclaration, il ne vérifie pas que le contrôle existe
    expect(guaranteeLabel({ kind: 'review', ref: 'ezk-reviewer' })).toMatch(/revue a posteriori déclarée.*ezk-reviewer/);
    expect(guaranteeLabel({ kind: 'hook' })).toMatch(/hook/);
    expect(guaranteeLabel({ kind: 'agent-check', ref: 'ezk-reviewer' })).toMatch(/ezk-reviewer/);
    expect(guaranteeLabel({ kind: 'unguarded-must' })).toMatch(/sans garde.*non vérifié/);
    const advisory = guaranteeLabel({ kind: 'advisory' });
    expect(advisory).toMatch(/conseil/);
    expect(advisory).toMatch(/non garanti/);
    expect(advisory).not.toMatch(/gate|hook|revue/);
  });
});

describe('empreinte et rendu du jeu effectif', () => {
  const compose = (over: Partial<ComposeInput> = {}) =>
    composeProjectRules(
      input({
        manifest: { bundles: [], bindings: { a: { kind: 'gate', ref: 'pnpm lint' } } },
        local: [localRule('a', 'MUST'), localRule('b', 'SHOULD')],
        ...over,
      }),
    ).rules;

  it('l’empreinte ne dépend pas de l’ordre des entrées, ni des chemins de fichiers', () => {
    const one = rulesDigest(compose());
    const reordered = rulesDigest(
      compose({ local: [{ ...localRule('b', 'SHOULD'), file: 'ailleurs/b.md' }, localRule('a', 'MUST')] }),
    );
    expect(one).toMatch(/^[0-9a-f]{12}$/);
    expect(reordered).toBe(one);
  });

  it('l’empreinte change quand le texte d’une règle change', () => {
    const changed = rulesDigest(compose({ local: [localRule('a', 'MUST', 'Autre texte.'), localRule('b', 'SHOULD')] }));
    expect(changed).not.toBe(rulesDigest(compose()));
  });

  it('le rendu porte le marqueur de fichier généré, la légende, l’id, le niveau, l’étiquette et le texte', () => {
    const text = renderProjectRules(compose());
    expect(isManagedProjectRules(text)).toBe(true);
    expect(text).toMatch(/^---\ngenerated-by: ezk rules apply\n---\n/);
    expect(text).toContain('## a  `[MUST]`');
    expect(text).toContain('gate déclaré : pnpm lint');
    expect(text).toContain('## b  `[SHOULD]`');
    expect(text).toContain('conseil, non garanti');
    expect(text).toContain('Texte local de a.');
    expect(text).toContain(rulesDigest(compose()));
    expect(text).toMatch(/jamais présenté/i); // la légende dit qu’un conseil n’est pas une garantie
  });

  it('le rendu est identique d’une exécution à l’autre (aucune date, aucun SHA)', () => {
    expect(renderProjectRules(compose())).toBe(renderProjectRules(compose()));
  });

  it('un fichier qui ne commence pas par le marqueur n’est pas à nous', () => {
    expect(isManagedProjectRules('# Mes règles à moi\n')).toBe(false);
    expect(isManagedProjectRules('---\ngenerated-by: autre chose\n---\n')).toBe(false);
  });
});
