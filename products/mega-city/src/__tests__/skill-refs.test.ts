/**
 * skill-refs — un skill ou un agent ne cite que des scripts qui existent, et ne déclare que des
 * compositions que son texte honore (fiche 0066, « tester un skill avant de le merger »).
 *
 * Pourquoi : l'audit `ezk-steward` est un jugement d'agent, pas une alarme. Le 2026-07-26, un audit
 * à la main a trouvé `./scripts/validate.sh` cité par `ezk-steward` lui-même alors que le script
 * n'existait nulle part : rien n'avait rougi. Ici chaque contrôle est PROUVÉ PAR SABOTAGE : un test
 * injecte le défaut et attend le rouge, puis le dépôt réel doit rester vert.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  type ProjectScriptException,
  type RefDoc,
  citedScriptRefs,
  findDeadScriptRefs,
  findUncitedCompositions,
} from '../core/skill-refs.js';
import { loadCatalog } from '../loaders/catalog.js';
import { loadRefDocs } from '../loaders/skill-refs.js';

const skillIds = new Set(['ezk-a', 'ezk-b', 'ezk-archive']);

const skillDoc = (owner: string, text: string): RefDoc => ({
  kind: 'skill',
  owner,
  file: `skills/${owner}/SKILL.md`,
  text,
});
const agentDoc = (owner: string, text: string): RefDoc => ({
  kind: 'agent',
  owner,
  file: `agents/${owner}.md`,
  text,
});

/** Un système de fichiers fictif : `exists` répond vrai pour ces chemins (depuis la racine du produit). */
const fsWith =
  (...files: string[]) =>
  (path: string): boolean =>
    files.includes(path);

describe('findDeadScriptRefs — sabotage : un script cité qui n’existe pas fait rougir', () => {
  it('le cas réel du 2026-07-26 : `./scripts/validate.sh` nu dans un agent, script introuvable', () => {
    const doc = agentDoc('ezk-steward', 'ligne 1\nlance `./scripts/validate.sh` puis juge\n');
    const dead = findDeadScriptRefs([doc], skillIds, fsWith(), []);
    expect(dead).toHaveLength(1);
    expect(dead[0]).toMatchObject({ file: 'agents/ezk-steward.md', line: 2, cited: 'scripts/validate.sh' });
  });

  it('un chemin qualifié `bin/x.sh` inexistant rougit, existant passe', () => {
    const doc = skillDoc('ezk-a', 'voir `bin/fantome.sh` et `products/mega-city/bin/vrai.sh`');
    const dead = findDeadScriptRefs([doc], skillIds, fsWith('bin/vrai.sh'), []);
    expect(dead.map((d) => d.cited)).toEqual(['bin/fantome.sh']);
  });

  it('`skills/<skill>/scripts/x` et `<skill>/scripts/x` (skill réel) sont jugés', () => {
    const doc = skillDoc(
      'ezk-a',
      ['`skills/ezk-b/scripts/mort.sh`', '`ezk-b/scripts/mort2.sh`', '`skills/ezk-b/scripts/vif.sh`'].join('\n'),
    );
    const dead = findDeadScriptRefs([doc], skillIds, fsWith('skills/ezk-b/scripts/vif.sh'), []);
    expect(dead.map((d) => d.cited)).toEqual(['skills/ezk-b/scripts/mort.sh', 'skills/ezk-b/scripts/mort2.sh']);
  });

  it('`x/scripts/y.sh` où x n’est PAS un skill du catalogue n’est pas une affirmation sur ce dépôt', () => {
    const doc = skillDoc('ezk-a', 'dans le projet cible : `mon-app/scripts/build.sh`');
    expect(findDeadScriptRefs([doc], skillIds, fsWith(), [])).toEqual([]);
  });

  it('un `scripts/x` nu se résout dans le dossier du skill, ou du skill homonyme pour un agent', () => {
    const own = skillDoc('ezk-a', 'lance `scripts/run.sh`');
    const homonym = agentDoc('ezk-archive', 'lance `scripts/check.sh`');
    const exists = fsWith('skills/ezk-a/scripts/run.sh', 'skills/ezk-archive/scripts/check.sh');
    expect(findDeadScriptRefs([own, homonym], skillIds, exists, [])).toEqual([]);
  });

  it('un `scripts/x` nu se résout aussi dans scripts/ du produit ou de la racine du dépôt', () => {
    const doc = agentDoc('ezk-steward', 'lance `scripts/gate.sh` et `scripts/root.sh`');
    const exists = fsWith('scripts/gate.sh', '../../scripts/root.sh');
    expect(findDeadScriptRefs([doc], skillIds, exists, [])).toEqual([]);
  });

  it('ignore les gabarits (`<skill>/scripts/x`, `$VAR/scripts/x`) et les chemins relatifs `../scripts/x`', () => {
    const doc = skillDoc(
      'ezk-a',
      ['`<skill>/scripts/x.sh`', '`$SCOUT/scripts/y.sh`', '`../scripts/z.sh`', '`~/.claude/bin/w.sh`'].join('\n'),
    );
    expect(citedScriptRefs(doc, skillIds)).toEqual([]);
  });

  it('une exception explicite (propriétaire + chemin + raison) silence une citation du projet cible', () => {
    const doc = skillDoc('ezk-a', 'génère `scripts/ci-local.sh` dans le projet cible');
    const exception: ProjectScriptException = {
      owner: 'ezk-a',
      cited: 'scripts/ci-local.sh',
      reason: 'script du projet cible, généré par le bootstrap',
    };
    expect(findDeadScriptRefs([doc], skillIds, fsWith(), [exception])).toEqual([]);
    // l'exception ne couvre ni un autre propriétaire ni un autre chemin
    const other = skillDoc('ezk-b', 'génère `scripts/ci-local.sh` dans le projet cible');
    expect(findDeadScriptRefs([other], skillIds, fsWith(), [exception])).toHaveLength(1);
  });
});

describe('findUncitedCompositions — sabotage : une composition déclarée mais jamais citée', () => {
  const skill = (id: string, content: string, composes?: string[], delegates?: string[]) => ({
    id,
    content,
    ...(composes ? { composes } : {}),
    ...(delegates ? { delegates } : {}),
  });

  it('un composes: jamais cité dans le corps rougit (intégration fantôme)', () => {
    const found = findUncitedCompositions([skill('a', 'corps qui parle de ezk-b', ['ezk-b', 'ezk-c'])]);
    expect(found).toEqual([{ skill: 'a', link: 'composes', target: 'ezk-c' }]);
  });

  it('un delegates: jamais cité rougit aussi', () => {
    const found = findUncitedCompositions([skill('a', 'rien ici', undefined, ['ezk-backlog'])]);
    expect(found).toEqual([{ skill: 'a', link: 'delegates', target: 'ezk-backlog' }]);
  });

  it('la citation est un mot entier : `ezk-pr-pilot` ne cite pas `ezk-pr`', () => {
    const found = findUncitedCompositions([skill('a', 'on lance ezk-pr-pilot', ['ezk-pr'])]);
    expect(found).toHaveLength(1);
  });

  it('cité en code, en lien ou en fin de phrase, il passe', () => {
    const body = 'voir `ezk-b`, puis [ezk-c](../ezk-c/SKILL.md), enfin ezk-d.';
    expect(findUncitedCompositions([skill('a', body, ['ezk-b', 'ezk-c', 'ezk-d'])])).toEqual([]);
  });
});

describe('le dépôt réel reste vert', () => {
  const productRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..'); // products/mega-city
  const catalog = loadCatalog(productRoot);
  const ids = new Set(catalog.skills.keys());
  const { docs, exists } = loadRefDocs(productRoot);

  /** Les scripts d'un AUTRE projet, cités par nos skills. Un par un, avec leur raison : aucun joker. */
  const PROJECT_SCRIPTS: ProjectScriptException[] = [
    {
      owner: 'ezk-ci',
      cited: 'scripts/ci-local.sh',
      reason: 'script du projet CIBLE : ezk-ci le génère dans le dépôt qu’il équipe (bootstrap), il n’existe pas ici',
    },
    {
      owner: 'ezk-ci',
      cited: 'scripts/setup-act-secrets.sh',
      reason: 'script du projet CIBLE : ezk-ci le génère dans le dépôt qu’il équipe (bootstrap), il n’existe pas ici',
    },
  ];

  it('aucun script cité par un skill ou un agent n’est introuvable', () => {
    const dead = findDeadScriptRefs(docs, ids, exists, PROJECT_SCRIPTS);
    const shown = dead.map((d) => `${d.file}:${d.line} ${d.raw}`).join('\n');
    expect(dead, `scripts cités mais introuvables :\n${shown}`).toEqual([]);
  });

  it('chaque exception est encore citée par son propriétaire (pas d’exception morte)', () => {
    for (const ex of PROJECT_SCRIPTS) {
      const doc = docs.find((d) => d.owner === ex.owner);
      const cited = doc ? citedScriptRefs(doc, ids).some((c) => c.cited === ex.cited) : false;
      expect(cited, `l'exception « ${ex.owner} ${ex.cited} » ne correspond plus à aucune citation`).toBe(true);
      expect(ex.reason.length).toBeGreaterThan(10);
    }
  });

  it('chaque composes: / delegates: du catalogue est cité dans le corps du skill qui le déclare', () => {
    const uncited = findUncitedCompositions([...catalog.skills.values()]);
    const shown = uncited.map((u) => `${u.skill} ${u.link} ${u.target}`).join('\n');
    expect(uncited, `compositions déclarées mais jamais citées :\n${shown}`).toEqual([]);
  });

  it('ezk-archive délègue à ezk-backlog et le dit dans son corps (premier usage de delegates:)', () => {
    expect(catalog.skills.get('ezk-archive')?.delegates).toEqual(['ezk-backlog']);
  });
});
