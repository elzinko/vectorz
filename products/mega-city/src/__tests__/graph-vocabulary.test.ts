/**
 * graph-vocabulary — les cinq mots de lien (`composes` · `roles` · `competences` ·
 * `interactions` · `enforcements`) se lisent comme des verbes fermés (fiche 357,
 * ADR-0040 D1 : l'unification vit dans le compilateur, par ALIAS — aucun champ renommé).
 * Quatre verbes à l'origine ; l'ADR-0058 en ajoute un cinquième, `utilise` (skill → outil).
 *
 * Ce fichier fige la décision : si quelqu'un ajoute un lien, change son verbe ou ouvre
 * un sixième verbe, un test rougit et force un choix conscient.
 */
import { describe, expect, it } from 'vitest';
import { compileGraph } from '../core/compiled-graph.js';
import { EDGE_SOURCES, LINK_VERB, LINK_VERBS, type LinkVerb, graphEdges } from '../core/graph.js';
import type { Agent, Bundle, Profile, Rule, Skill } from '../domain/model.js';
import type { Catalog } from '../loaders/catalog.js';

const index = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map((x) => [x.id, x]));

function catalogOf(parts: Partial<Catalog>): Catalog {
  return {
    rules: index<Rule>([]),
    agents: index<Agent>([]),
    skills: index<Skill>([]),
    bundles: index<Bundle>([]),
    profiles: index<Profile>([]),
    ...parts,
  };
}

describe('vocabulaire de liens — jeu fermé de 5 verbes (ADR-0040 D1, amendé par ADR-0058)', () => {
  it('le jeu est fermé : exactement cinq verbes', () => {
    expect([...LINK_VERBS]).toEqual([
      'compose',
      'convoque',
      'applique',
      'est-verifie-par',
      'utilise',
    ]);
  });

  it('chaque type de lien porte UN verbe du jeu, et chaque verbe sert à quelque chose', () => {
    const used = new Set<LinkVerb>();
    for (const src of EDGE_SOURCES) {
      expect(LINK_VERBS, `le lien « ${src.link} » n'a pas de verbe valide`).toContain(src.verb);
      used.add(src.verb);
    }
    expect([...used].sort()).toEqual([...LINK_VERBS].sort());
  });

  it('les cinq champs historiques tombent chacun dans le verbe décidé', () => {
    expect(LINK_VERB.composes).toBe('compose'); // skill → skill
    expect(LINK_VERB.delegates).toBe('compose'); // skill → skill, optionnel : même verbe, pas un 6e
    expect(LINK_VERB.competences).toBe('compose'); // agent → skill : « je suis fait de ces briques »
    expect(LINK_VERB.roles).toBe('convoque'); // skill → agent
    expect(LINK_VERB.interactions).toBe('applique'); // agent → règle
    expect(LINK_VERB.enforces).toBe('est-verifie-par'); // règle → agent (enforcements agent-check)
  });

  it('chaque verbe est TYPÉ : il ne relie que ces couples source → cible', () => {
    const couples = (verb: LinkVerb): string[] =>
      [
        ...new Set(
          EDGE_SOURCES.filter((s) => s.verb === verb).map((s) => `${s.fromKind}>${s.toKind}`),
        ),
      ].sort();

    expect(couples('compose')).toEqual([
      'agent>skill',
      'bundle>bundle',
      'bundle>rule',
      'profile>agent',
      'profile>bundle',
      'profile>profile',
      'profile>skill',
      'skill>skill',
    ]);
    expect(couples('convoque')).toEqual(['rule>agent', 'skill>agent']);
    expect(couples('applique')).toEqual(['agent>rule', 'profile>rule', 'skill>rule']);
    expect(couples('est-verifie-par')).toEqual(['rule>agent']);
    expect(couples('utilise')).toEqual(['skill>tool']); // ADR-0058 : « ce skill lance cet outil »
  });

  it('chaque arête sortie de graphEdges porte le verbe de son lien', () => {
    const catalog = catalogOf({
      skills: index<Skill>([
        { id: 'a', content: '', composes: ['b'], roles: ['reviewer'], applies: ['clean/x'] },
        { id: 'b', content: '' },
      ]),
      agents: index<Agent>([
        { id: 'reviewer', role: '', competences: ['b'], interactions: ['clean/x'] },
      ]),
      rules: index<Rule>([
        {
          id: 'clean/x',
          kind: 'disposition',
          level: 'MUST',
          content: '',
          enforcements: [{ type: 'agent-check', agent: 'reviewer' }],
        },
      ]),
    });

    const edges = graphEdges(catalog);

    expect(edges.length).toBeGreaterThan(0);
    for (const e of edges) expect(e.verb, `${e.link} ${e.from}→${e.to}`).toBe(LINK_VERB[e.link]);
  });
});

describe('applies — skill → règle, par id (fiche 357, premier incrément des refs par id)', () => {
  const ruleX: Rule = { id: 'clean/x', kind: 'disposition', level: 'MUST', content: '' };

  it('un skill qui déclare `applies` donne une arête skill → règle, verbe « applique »', () => {
    const catalog = catalogOf({
      skills: index<Skill>([{ id: 'a', content: '', applies: ['clean/x'] }]),
      rules: index<Rule>([ruleX]),
    });

    expect(compileGraph(catalog).edges).toContainEqual({
      from: 'a',
      fromKind: 'skill',
      link: 'applies',
      verb: 'applique',
      to: 'clean/x',
      toKind: 'rule',
    });
  });

  it('un id de règle inconnu fait ÉCHOUER la compilation (fin du lien silencieux, D5)', () => {
    const catalog = catalogOf({
      skills: index<Skill>([{ id: 'a', content: '', applies: ['regle-fantome'] }]),
      rules: index<Rule>([ruleX]),
    });

    expect(() => compileGraph(catalog)).toThrow(/regle-fantome/);
  });
});
