/**
 * Fiche 20261102182259416 — le carnet de tests, cœur PUR. On éprouve :
 *   - `parseCartoTree` : un arbre YAML (écrans puis actions) devient une liste de nœuds ; un arbre
 *     mal formé est refusé avec la ligne fautive ;
 *   - `resolveCartoConfig` : la clé `carto:` de `.vectorz/config.yml`, durée de validité 14 jours
 *     par défaut ;
 *   - `serializeEntry` / `parseJournal` : une ligne JSON par résultat, une ligne illisible est
 *     comptée, jamais fatale ;
 *   - `computeStatus` : jamais testé / valide / en échec / expiré, la dernière preuve gagne,
 *     « X sur Y testés » vient du même arbre ;
 *   - `renderStatus` : « En clair » d'abord, la mention « passes d'exploration », `--todo`.
 */
import { describe, expect, it } from 'vitest';
import {
  CARTO_SCHEMA_VERSION,
  type CartoEntry,
  type CartoTree,
  DEFAULT_VALIDITY_DAYS,
  computeStatus,
  parseCartoTree,
  parseJournal,
  renderStatus,
  resolveCartoConfig,
  serializeEntry,
} from '../carto.js';

const TREE_YAML = `app: demo-app
axes: [fonctionnel]
screens:
  - id: sante
    title: Santé du serveur
  - id: export
    title: Exporter une grille
    actions:
      - id: bpm-invalide
        title: Exporter avec un BPM nul ou négatif
      - id: dossier-ferme
        title: Exporter vers un dossier non inscriptible
`;

function treeOf(yaml: string): CartoTree {
  const parsed = parseCartoTree(yaml);
  if ('errors' in parsed) throw new Error(JSON.stringify(parsed.errors));
  return parsed.tree;
}

describe('parseCartoTree — un arbre déclaré, écrans puis actions', () => {
  it('rend un nœud par écran et par action, avec les axes hérités', () => {
    const tree = treeOf(TREE_YAML);
    expect(tree.app).toBe('demo-app');
    expect(tree.nodes.map((n) => n.id)).toEqual([
      'sante',
      'export',
      'export/bpm-invalide',
      'export/dossier-ferme',
    ]);
    expect(tree.nodes.every((n) => n.axes.length === 1 && n.axes[0] === 'fonctionnel')).toBe(true);
    expect(tree.nodes[2].title).toBe('Exporter avec un BPM nul ou négatif');
  });

  it('sans axes déclarés, un nœud porte les deux axes ; un nœud peut les restreindre', () => {
    const tree = treeOf(`app: web
screens:
  - id: fiches
    title: Fiches
    actions:
      - id: filtrer
        title: Filtrer
        axes: [visuel]
`);
    expect(tree.nodes[0].axes).toEqual(['visuel', 'fonctionnel']);
    expect(tree.nodes[1].axes).toEqual(['visuel']);
  });

  it('refuse un titre manquant en nommant la ligne du nœud', () => {
    const parsed = parseCartoTree(`app: demo-app
screens:
  - id: sante
    title: Santé
  - id: export
`);
    expect('errors' in parsed).toBe(true);
    if (!('errors' in parsed)) return;
    expect(parsed.errors).toEqual([{ line: 5, message: expect.stringContaining('title') }]);
  });

  it('refuse un axe inconnu, une clé inconnue et un id en double, chacun à sa ligne', () => {
    const parsed = parseCartoTree(`app: demo-app
screens:
  - id: sante
    title: Santé
    axes: [visual]
  - id: sante
    title: Doublon
    titel: faute de frappe
`);
    if (!('errors' in parsed)) throw new Error('attendu : refus');
    const byLine = Object.fromEntries(parsed.errors.map((e) => [e.line, e.message]));
    expect(byLine[5]).toMatch(/axe inconnu « visual »/);
    expect(byLine[6]).toMatch(/en double/);
    expect(byLine[8]).toMatch(/clé inconnue « titel »/);
  });

  it("refuse un nom d'app qui n'est pas un identifiant simple (il devient un nom de dossier)", () => {
    const parsed = parseCartoTree(`app: ../evil
screens:
  - id: a
    title: A
`);
    if (!('errors' in parsed)) throw new Error('attendu : refus');
    expect(parsed.errors[0]).toEqual({ line: 1, message: expect.stringContaining('reçu « ../evil »') });
  });

  it('refuse un YAML illisible avec sa ligne, et un arbre sans écran', () => {
    const broken = parseCartoTree('app: demo-app\nscreens: [\n');
    if (!('errors' in broken)) throw new Error('attendu : refus');
    expect(broken.errors[0].line).toBeGreaterThanOrEqual(1);
    const empty = parseCartoTree('app: demo-app\nscreens: []\n');
    if (!('errors' in empty)) throw new Error('attendu : refus');
    expect(empty.errors[0].message).toMatch(/au moins un écran/);
  });
});

describe('resolveCartoConfig — la clé carto: de la config projet', () => {
  it('sans clé, aucun arbre et la durée par défaut de 14 jours', () => {
    expect(DEFAULT_VALIDITY_DAYS).toBe(14);
    expect(resolveCartoConfig(undefined)).toEqual({ trees: {}, validityDays: 14, errors: [] });
  });

  it('lit les arbres par app et une durée réglée', () => {
    expect(
      resolveCartoConfig({ trees: { 'demo-app': 'examples/carto.yml' }, 'validity-days': 7 }),
    ).toEqual({ trees: { 'demo-app': 'examples/carto.yml' }, validityDays: 7, errors: [] });
  });

  it('signale une durée qui n’est pas un entier positif, et garde le défaut', () => {
    const r = resolveCartoConfig({ trees: {}, 'validity-days': 0 });
    expect(r.validityDays).toBe(14);
    expect(r.errors[0]).toMatch(/validity-days/);
  });
});

describe('serializeEntry / parseJournal — une ligne par résultat', () => {
  const entry: CartoEntry = {
    node: 'sante',
    axis: 'fonctionnel',
    verdict: 'valide',
    at: '2026-11-02T10:00:00.000Z',
    sha: 'abc1234',
    proof: '0f00.log',
  };

  it('une ligne JSON porte le numéro de format, et se relit telle quelle', () => {
    const line = serializeEntry(entry);
    expect(line.endsWith('\n')).toBe(true);
    expect(JSON.parse(line).schema_version).toBe(CARTO_SCHEMA_VERSION);
    expect(parseJournal(line)).toEqual({ entries: [entry], skipped: 0 });
  });

  it('une ligne illisible ou incomplète est comptée, sans arrêter la lecture', () => {
    const text = `${serializeEntry(entry)}pas du json\n{"node":"sante"}\n\n${serializeEntry({ ...entry, verdict: 'echec' })}`;
    const { entries, skipped } = parseJournal(text);
    expect(entries.map((e) => e.verdict)).toEqual(['valide', 'echec']);
    expect(skipped).toBe(2);
  });

  it('une ligne dont le SHA n’a pas la forme d’un SHA git est écartée (jamais passée à git)', () => {
    const forged = serializeEntry({ ...entry, sha: '--output=/tmp/pwned' });
    expect(parseJournal(forged)).toEqual({ entries: [], skipped: 1 });
  });
});

describe('computeStatus — ce qui est testé, et ce qui a expiré', () => {
  const tree = treeOf(TREE_YAML);
  const now = new Date('2026-11-10T12:00:00.000Z');
  const at = (iso: string, node: string, verdict: CartoEntry['verdict']): CartoEntry => ({
    node,
    axis: 'fonctionnel',
    verdict,
    at: iso,
    sha: 'aaa1111',
    proof: `${node.replace('/', '-')}.log`,
  });
  const commitsSince = (sha: string): number | null => (sha === 'aaa1111' ? 3 : null);

  it('sans journal, tout est « jamais testé » et 0 sur 4', () => {
    const s = computeStatus(tree, [], { now, validityDays: 14, commitsSince });
    expect(s.schema_version).toBe(CARTO_SCHEMA_VERSION);
    expect(s.counts).toEqual({ tested: 0, total: 4, jamais: 4, valide: 0, echec: 0, expire: 0 });
    expect(s.scope).toBe('exploration');
  });

  it('3 échecs et 1 valide récents donnent 4 sur 4 testés, avec âge et commits depuis', () => {
    const s = computeStatus(
      tree,
      [
        at('2026-11-09T12:00:00.000Z', 'sante', 'valide'),
        at('2026-11-09T12:00:00.000Z', 'export', 'echec'),
        at('2026-11-09T12:00:00.000Z', 'export/bpm-invalide', 'echec'),
        at('2026-11-09T12:00:00.000Z', 'export/dossier-ferme', 'echec'),
      ],
      { now, validityDays: 14, commitsSince },
    );
    expect(s.counts).toEqual({ tested: 4, total: 4, jamais: 0, valide: 1, echec: 3, expire: 0 });
    expect(s.checks[0]).toMatchObject({ node: 'sante', state: 'valide', ageDays: 1, commitsSince: 3 });
  });

  it('une preuve plus vieille que la durée de validité ressort « expirée », même un échec', () => {
    const s = computeStatus(
      tree,
      [at('2026-10-20T12:00:00.000Z', 'sante', 'valide'), at('2026-10-27T11:00:00.000Z', 'export', 'echec')],
      { now, validityDays: 14, commitsSince },
    );
    expect(s.checks.find((c) => c.node === 'sante')).toMatchObject({ state: 'expire', ageDays: 21 });
    expect(s.checks.find((c) => c.node === 'export')).toMatchObject({ state: 'expire', ageDays: 14 });
    expect(s.counts.tested).toBe(0);
  });

  it('la limite est stricte : 14 jours pile reste valide, une milliseconde de plus expire', () => {
    const exactly = new Date(Date.parse('2026-10-27T12:00:00.000Z') + 14 * 86_400_000);
    const entries = [at('2026-10-27T12:00:00.000Z', 'sante', 'valide')];
    expect(computeStatus(tree, entries, { now: exactly, validityDays: 14, commitsSince }).checks[0].state).toBe('valide');
    const after = new Date(exactly.getTime() + 1);
    expect(computeStatus(tree, entries, { now: after, validityDays: 14, commitsSince }).checks[0].state).toBe('expire');
  });

  it('la dernière preuve gagne, quel que soit l’ordre du journal', () => {
    const s = computeStatus(
      tree,
      [at('2026-11-09T12:00:00.000Z', 'sante', 'echec'), at('2026-11-01T12:00:00.000Z', 'sante', 'valide')],
      { now, validityDays: 14, commitsSince },
    );
    expect(s.checks[0].state).toBe('echec');
  });

  it('une ligne sur un nœud ou un axe absent de l’arbre est ignorée, et comptée', () => {
    const s = computeStatus(
      tree,
      [at('2026-11-09T12:00:00.000Z', 'ancien-ecran', 'valide'), { ...at('2026-11-09T12:00:00.000Z', 'sante', 'valide'), axis: 'visuel' }],
      { now, validityDays: 14, commitsSince },
    );
    expect(s.ignored_entries).toBe(2);
    expect(s.counts.tested).toBe(0);
  });
});

describe('renderStatus — la sortie lue par le PO', () => {
  const tree = treeOf(TREE_YAML);
  const now = new Date('2026-11-10T12:00:00.000Z');
  const status = computeStatus(
    tree,
    [
      { node: 'sante', axis: 'fonctionnel', verdict: 'valide', at: '2026-11-09T12:00:00.000Z', sha: 'aaa1111', proof: 'p.log' },
      { node: 'export', axis: 'fonctionnel', verdict: 'echec', at: '2026-10-01T12:00:00.000Z', sha: 'aaa1111', proof: 'q.log' },
    ],
    { now, validityDays: 14, commitsSince: () => 2 },
  );

  it('ouvre par « En clair » avec « X sur Y testés » et la mention des passes d’exploration', () => {
    const text = renderStatus(status, { todo: false });
    const first = text.split('\n')[0];
    expect(first).toMatch(/^En clair : 1 sur 4 testés/);
    expect(text).toMatch(/passes d'exploration/);
    expect(text).toMatch(/14 jours/);
    expect(text).toMatch(/sante\s+fonctionnel\s+valide/);
    expect(text).toMatch(/2 commits depuis/);
  });

  it('--todo ne liste que les contrôles jamais testés ou expirés', () => {
    const text = renderStatus(status, { todo: true });
    expect(text).not.toMatch(/^\s+sante\s/m);
    expect(text).toMatch(/^\s+export\s+fonctionnel\s+expirée/m);
    expect(text).toMatch(/^\s+export\/bpm-invalide\s+fonctionnel\s+jamais testé/m);
  });
});
