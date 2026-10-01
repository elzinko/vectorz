/**
 * aggregate-llm — le moteur `llm` en mode « propose » (fiche 20260910231201744, ADR-0051).
 *
 * Le jugement par le sens reste celui de l'AGENT : le code n'appelle jamais un LLM. Ce que le code
 * garde, c'est le contrat : un fichier de propositions, VALIDÉ avant d'être rendu (un id inventé est
 * refusé, jamais deviné), croisé avec le moteur `script`, et chaque geste d'application nommé sans
 * être exécuté.
 */
import { describe, expect, it } from 'vitest';
import type { AggregateCluster } from '../aggregate.js';
import {
  type StockFiche,
  ProposalsFileError,
  applyCommand,
  crossCheck,
  parseProposals,
  renderDossier,
  validateProposals,
} from '../aggregate-llm.js';

const I = (n: number): string => `202601010000000${String(n).padStart(2, '0')}`;

const fiche = (n: number, extra: Partial<StockFiche> = {}): StockFiche => ({
  id: I(n),
  title: `Fiche ${n}`,
  priority: 'P1',
  status: 'idea',
  labels: [],
  done: false,
  ...extra,
});

const stock: StockFiche[] = [
  fiche(1),
  fiche(2),
  fiche(3),
  fiche(4),
  fiche(5),
  fiche(6, { status: 'shipped', done: true }), // livrée
  fiche(7, { status: 'superseded', done: true }), // close
];

const merge = (into: number, sources: number[], why = 'même intention') => ({
  kind: 'merge',
  into: I(into),
  sources: sources.map(I),
  why,
});
const split = (source: number, into: number[], why = 'deux sujets') => ({
  kind: 'split',
  source: I(source),
  into: into.map(I),
  why,
});

describe('parseProposals — un fichier illisible est une erreur franche', () => {
  it('lit un tableau JSON', () => {
    expect(parseProposals('[{"kind":"merge"}]')).toEqual([{ kind: 'merge' }]);
  });

  it('refuse un JSON invalide, avec un message qui nomme le problème', () => {
    expect(() => parseProposals('{pas du json')).toThrow(ProposalsFileError);
    expect(() => parseProposals('{pas du json')).toThrow(/illisible/);
  });

  it('refuse autre chose qu’un tableau (objet, texte, nombre)', () => {
    for (const raw of ['{"kind":"merge"}', '"merge"', '42', 'null']) {
      expect(() => parseProposals(raw)).toThrow(/tableau/);
    }
  });
});

describe('validateProposals — jamais d’abandon silencieux', () => {
  it('accepte une fusion et un découpage bien formés sur des fiches actives', () => {
    const r = validateProposals(stock, [merge(1, [2, 3]), split(4, [5, 1])]);
    expect(r.rejected).toEqual([]);
    expect(r.accepted).toHaveLength(2);
    expect(r.accepted[0]).toMatchObject({ kind: 'merge', into: I(1), sources: [I(2), I(3)] });
  });

  it('rejette un id inventé (inconnu du stock), en le nommant', () => {
    const r = validateProposals(stock, [merge(1, [99])]);
    expect(r.accepted).toEqual([]);
    expect(r.rejected).toEqual([{ index: 1, reason: expect.stringContaining(I(99)) }]);
    expect(r.rejected[0].reason).toContain('inconnu');
  });

  it('rejette une fiche déjà livrée ou close', () => {
    const r = validateProposals(stock, [merge(1, [6]), split(7, [2, 3])]);
    expect(r.accepted).toEqual([]);
    expect(r.rejected.map((x) => x.index)).toEqual([1, 2]);
    expect(r.rejected[0].reason).toContain('livré');
  });

  it('rejette une résultante parmi ses sources, une source en double, une fusion sans source', () => {
    const r = validateProposals(stock, [
      merge(1, [1, 2]),
      merge(1, [2, 2]),
      { kind: 'merge', into: I(1), sources: [], why: 'x' },
    ]);
    expect(r.accepted).toEqual([]);
    expect(r.rejected.map((x) => x.index)).toEqual([1, 2, 3]);
  });

  it('rejette un découpage à moins de 2 enfants, ou avec un enfant égal à la source', () => {
    const r = validateProposals(stock, [split(1, [2]), split(1, [1, 2])]);
    expect(r.accepted).toEqual([]);
    expect(r.rejected).toHaveLength(2);
  });

  it('rejette un why vide, un kind inconnu, un id qui n’est pas une chaîne', () => {
    const r = validateProposals(stock, [
      merge(1, [2], '  '),
      { kind: 'fusionner', into: I(1), sources: [I(2)], why: 'x' },
      { kind: 'merge', into: 20260101000000001, sources: [I(2)], why: 'x' },
      'pas un objet',
    ]);
    expect(r.accepted).toEqual([]);
    expect(r.rejected.map((x) => x.index)).toEqual([1, 2, 3, 4]);
    expect(r.rejected[2].reason).toContain('chaîne');
  });

  it('une fiche déplacée par une proposition ne peut plus servir dans une autre (la première gagne)', () => {
    const r = validateProposals(stock, [merge(1, [2]), merge(3, [2]), merge(2, [4]), split(5, [1, 4])]);
    expect(r.accepted).toHaveLength(2); // n°1 (2 → 1) et n°4 (5 → 1, 4 : 1 reste une résultante partagée)
    expect(r.rejected.map((x) => x.index)).toEqual([2, 3]);
    expect(r.rejected[0].reason).toContain('n°1');
  });

  it('deux fusions peuvent viser la même résultante', () => {
    const r = validateProposals(stock, [merge(1, [2]), merge(1, [3])]);
    expect(r.rejected).toEqual([]);
    expect(r.accepted).toHaveLength(2);
  });
});

describe('crossCheck — script ↔ llm', () => {
  const cluster = (key: string, ids: number[]): AggregateCluster => ({
    key,
    reason: 'label',
    ficheIds: ids.map(I).sort(),
  });

  it('dit quel cluster est confirmé, lequel n’est pas retenu, et quelle proposition vient du sens seul', () => {
    const accepted = validateProposals(stock, [merge(1, [2]), merge(4, [5])]).accepted;
    const clusters = [cluster('bmad', [1, 2, 3]), cluster('recette', [3, 6])];
    const r = crossCheck(clusters, accepted);
    expect(r.confirmed.map((c) => c.cluster.key)).toEqual(['bmad']);
    expect(r.confirmed[0].proposals).toEqual([1]); // n° de la proposition (1-based dans accepted)
    expect(r.notRetained.map((c) => c.key)).toEqual(['recette']);
    expect(r.senseOnly).toEqual([2]); // la fusion 4 ← 5 : aucun cluster ne la couvre
  });

  it('sans proposition, tout cluster est « non retenu » et rien n’est « par le sens »', () => {
    const r = crossCheck([cluster('bmad', [1, 2])], []);
    expect(r.notRetained).toHaveLength(1);
    expect(r.senseOnly).toEqual([]);
  });
});

describe('applyCommand — le geste est nommé, jamais exécuté', () => {
  it('fusion : backlog:apply merge --into <résultante> <sources…>', () => {
    const [p] = validateProposals(stock, [merge(1, [2, 3])]).accepted;
    expect(applyCommand(p)).toBe(
      `pnpm --dir products/mega-city backlog:apply merge --into ${I(1)} ${I(2)} ${I(3)}`,
    );
  });

  it('découpage : backlog:apply split <source> --into <a>,<b>', () => {
    const [p] = validateProposals(stock, [split(4, [5, 1])]).accepted;
    expect(applyCommand(p)).toBe(
      `pnpm --dir products/mega-city backlog:apply split ${I(4)} --into ${I(5)},${I(1)}`,
    );
  });
});

describe('renderDossier — ce que l’agent doit juger', () => {
  const lines = renderDossier(
    [fiche(1, { labels: ['bmad'], priority: 'P0' }), fiche(2), fiche(6, { status: 'shipped', done: true })],
    'all',
  );
  const text = lines.join('\n');

  it('ouvre par « En clair » et liste seulement les fiches ACTIVES (id, priorité, titre, labels)', () => {
    expect(lines[0].startsWith('En clair :')).toBe(true);
    expect(text).toContain(`${I(1)}  P0  Fiche 1  [bmad]`);
    expect(text).toContain(I(2));
    expect(text).not.toContain(I(6));
  });

  it('donne le format JSON attendu et le geste suivant', () => {
    expect(text).toContain('"kind": "merge"');
    expect(text).toContain('"kind": "split"');
    expect(text).toContain('chaînes');
    expect(text).toContain('--proposals');
  });
});
