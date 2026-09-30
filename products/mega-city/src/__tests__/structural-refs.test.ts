/**
 * structural-refs — une référence STRUCTURELLE (« ce skill applique cette règle ») passe par
 * un ID déclaré, pas par un chemin markdown (fiche 357, ADR-0040 : « un chemin n'est pas
 * une identité »). Premier incrément : le validateur qui SIGNALE les liens par chemin
 * non déclarés par id.
 *
 * Trois étages de preuve :
 *   1. le cœur pur (`checkPathRefs`) sur des références synthétiques ;
 *   2. le scanner (`scanPathRefs`, bord I/O) sur un mini-dépôt jetable ;
 *   3. l'invariant sur le catalogue RÉEL — toute future référence par chemin non déclarée
 *      rougit la CI (le 0 est prouvé, pas supposé : le filet 2 montre que le détecteur mord).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Edge } from '../core/graph.js';
import { graphEdges } from '../core/graph.js';
import { type PathRef, checkPathRefs } from '../core/structural-refs.js';
import { loadCatalog } from '../loaders/catalog.js';
import { scanPathRefs } from '../loaders/path-refs.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const ref = (
  from: PathRef['from'],
  to: PathRef['to'],
  file = 'skills/a/SKILL.md',
  line = 10,
): PathRef => ({ from, to, file, line, href: '../x.md' });

const skill = (id: string) => ({ kind: 'skill', id }) as const;
const rule = (id: string) => ({ kind: 'rule', id }) as const;
const agent = (id: string) => ({ kind: 'agent', id }) as const;

describe('checkPathRefs — le cœur pur', () => {
  const edges: Edge[] = [
    {
      from: 'a',
      fromKind: 'skill',
      link: 'roles',
      verb: 'convoque',
      to: 'reviewer',
      toKind: 'agent',
    },
  ];

  it('une relation déjà déclarée par id laisse le lien de lecture tranquille', () => {
    const report = checkPathRefs([ref(skill('a'), agent('reviewer'))], edges);

    expect(report.undeclared).toEqual([]);
    expect(report.unsupported).toEqual([]);
  });

  it('un lien par chemin SANS déclaration est signalé, avec le champ qui le déclarerait', () => {
    const report = checkPathRefs([ref(skill('a'), rule('clean/x'))], edges);

    expect(report.undeclared).toHaveLength(1);
    expect(report.undeclared[0]).toMatchObject({ file: 'skills/a/SKILL.md', line: 10 });
    expect(report.undeclared[0]?.declareWith).toEqual(['applies']);
  });

  it('skill → skill non déclaré : le champ attendu est `composes`', () => {
    const report = checkPathRefs([ref(skill('a'), skill('b'))], edges);

    expect(report.undeclared[0]?.declareWith).toEqual(['composes']);
  });

  it("rule → rule : aucun champ d'id n'existe, donc info (reliquat assumé), pas une faute", () => {
    const report = checkPathRefs([ref(rule('r1'), rule('r2'), 'rules/r1.md')], edges);

    expect(report.undeclared).toEqual([]);
    expect(report.unsupported).toHaveLength(1);
  });

  it('une déclaration vers une AUTRE cible ne couvre pas le lien', () => {
    const report = checkPathRefs([ref(skill('a'), agent('autre-agent'))], edges);

    expect(report.undeclared).toHaveLength(1);
  });
});

describe('scanPathRefs — le bord I/O sur un mini-dépôt', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'lawgiver-pathrefs-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const write = (rel: string, text: string): void => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  };

  function buildRepo(alphaFrontmatter = 'name: alpha'): void {
    write(
      'skills/alpha/SKILL.md',
      [
        '---',
        alphaFrontmatter,
        '---',
        '',
        'Applique [la règle](../../rules/ns/r1.md#section) et compose [beta](../beta/SKILL.md).',
        'Externe [doc](https://example.com/x.md), ancre [haut](#top).',
        'Hors catalogue : [note](../../docs/d.md).',
        '',
        '```text',
        '[dans un bloc](../../rules/ns/r2.md)',
        '```',
        '',
        'Exemple en ligne : `[code](../../rules/ns/r2.md)`.',
        '',
      ].join('\n'),
    );
    write('skills/alpha/references/tpl.md', 'Voir [r1](../../../rules/ns/r1.md).\n');
    write('skills/beta/SKILL.md', '---\nname: beta\n---\n\ncorps\n');
    write('agents/bot.md', '---\nname: bot\n---\n\nUtilise [alpha](../skills/alpha/SKILL.md).\n');
    write('rules/ns/r1.md', '---\nid: ns/r1\nlevel: MUST\n---\n\nVoir [r2](./r2.md).\n');
    write('rules/ns/r2.md', '---\nid: ns/r2\nlevel: MUST\n---\n\ncorps\n');
    write('docs/d.md', '# une note, pas une entité du catalogue\n');
  }

  const brief = (refs: PathRef[]): string[] =>
    refs.map((r) => `${r.file}:${r.line} ${r.from.kind}:${r.from.id} → ${r.to.kind}:${r.to.id}`);

  it("trouve les liens par chemin vers des entités — et seulement eux (l'asset appartient à son skill)", () => {
    buildRepo();

    expect(brief(scanPathRefs(root))).toEqual([
      'agents/bot.md:5 agent:bot → skill:alpha',
      'rules/ns/r1.md:6 rule:ns/r1 → rule:ns/r2',
      'skills/alpha/SKILL.md:5 skill:alpha → rule:ns/r1',
      'skills/alpha/SKILL.md:5 skill:alpha → skill:beta',
      'skills/alpha/references/tpl.md:1 skill:alpha → rule:ns/r1',
    ]);
  });

  it('garde le href tel qu\'écrit (fragment compris) pour que le message soit actionnable', () => {
    buildRepo();

    const first = scanPathRefs(root).find((r) => r.to.id === 'ns/r1' && r.line === 5);

    expect(first?.href).toBe('../../rules/ns/r1.md#section');
  });

  it('suit les blocs de code imbriqués (CommonMark) : seul le lien APRÈS le bloc compte', () => {
    buildRepo();
    write(
      'skills/gamma/SKILL.md',
      [
        '---',
        'name: gamma',
        '---',
        '',
        '````md',
        '```text',
        '[dans le bloc imbriqué](../../rules/ns/r2.md)',
        '```',
        '[encore dans le bloc externe](../../rules/ns/r2.md)',
        '````',
        '',
        'Après le bloc : [vraie référence](../../rules/ns/r2.md).',
        '',
      ].join('\n'),
    );

    const gamma = scanPathRefs(root).filter((r) => r.from.id === 'gamma');

    expect(brief(gamma)).toEqual(['skills/gamma/SKILL.md:12 skill:gamma → rule:ns/r2']);
  });

  it('un lien vers un DOSSIER de skill (forme conventionnelle) vise bien ce skill, avec ou sans `/` final', () => {
    buildRepo();
    write(
      'skills/delta/SKILL.md',
      [
        '---',
        'name: delta',
        '---',
        '',
        'Voir [beta](../beta/) et [alpha](../alpha).',
        'Section : [usage](../beta/#usage).',
        'Dossier de règles, pas une entité : [ns](../../rules/ns/).',
        '',
      ].join('\n'),
    );
    write('agents/scout.md', '---\nname: scout\n---\n\nSuit [alpha](../skills/alpha/).\n');

    const refs = scanPathRefs(root).filter((r) => r.from.id === 'delta' || r.from.id === 'scout');

    expect(brief(refs)).toEqual([
      'agents/scout.md:5 agent:scout → skill:alpha',
      'skills/delta/SKILL.md:5 skill:delta → skill:beta',
      'skills/delta/SKILL.md:5 skill:delta → skill:alpha',
      'skills/delta/SKILL.md:6 skill:delta → skill:beta',
    ]);
  });

  it('sans `composes:`, un lien vers un dossier de skill est signalé — il ne disparaît plus en silence', () => {
    buildRepo();
    const linkToBetaDir = (frontmatter: string): void =>
      write('skills/delta/SKILL.md', `---\n${frontmatter}\n---\n\nVoir [beta](../beta/).\n`);
    const undeclared = (): string[] =>
      brief(checkPathRefs(scanPathRefs(root), graphEdges(loadCatalog(root))).undeclared).filter(
        (line) => line.includes('skill:delta'),
      );

    linkToBetaDir('name: delta');
    expect(undeclared()).toEqual(['skills/delta/SKILL.md:5 skill:delta → skill:beta']);

    linkToBetaDir('name: delta\ncomposes: [beta]');
    expect(undeclared()).toEqual([]);
  });

  it('sabotage : sans `applies:` le lien est signalé ; avec `applies:` il est déclaré', () => {
    buildRepo();
    const undeclaredBefore = checkPathRefs(
      scanPathRefs(root),
      graphEdges(loadCatalog(root)),
    ).undeclared;
    expect(brief(undeclaredBefore)).toContain(
      'skills/alpha/SKILL.md:5 skill:alpha → rule:ns/r1',
    );

    buildRepo('name: alpha\napplies: [ns/r1]\ncomposes: [beta]');
    const undeclaredAfter = checkPathRefs(
      scanPathRefs(root),
      graphEdges(loadCatalog(root)),
    ).undeclared;

    // r1 et beta sont maintenant déclarés ; reste le lien agent → skill (competences) non déclaré.
    expect(brief(undeclaredAfter)).toEqual(['agents/bot.md:5 agent:bot → skill:alpha']);
  });
});

describe('catalogue RÉEL — aucune référence structurelle par chemin non déclarée par id', () => {
  const refs = scanPathRefs(megaCity);
  const report = checkPathRefs(refs, graphEdges(loadCatalog(megaCity)));

  it('le scanner voit bien des liens par chemin (le 0 ci-dessous n\'est pas un 0 aveugle)', () => {
    expect(refs.length).toBeGreaterThan(0);
  });

  it('0 lien par chemin vers un skill/agent/règle sans déclaration par id', () => {
    const shown = report.undeclared.map(
      (u) =>
        `${u.file}:${u.line} → ${u.to.kind} ${u.to.id} — déclare-le : ${u.declareWith.join(' | ')}`,
    );

    expect(shown).toEqual([]);
  });
});
