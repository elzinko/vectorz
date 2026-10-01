/**
 * ship-fiche — livrer une fiche sans rien casser (fiche 20260830194601233).
 *
 * Trois étages : le recalage de liens (pur, calqué sur check-links.sh), le plan de la transaction
 * (pur, état du dépôt injecté — il REFUSE avant d'écrire), puis un dépôt git jetable où la VRAIE
 * gate `check-links.sh` mesure le delta de liens cassés avant / après un vrai ship.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { nodeRepoFs, nodeShipIo } from '../../io/ship-fiche-io.js';
import {
  type RepoFs,
  ShipFailure,
  ShipRefusal,
  applyShip,
  barPlanEntries,
  findBroken,
  planShip,
  recalLinks,
  setFrontMatter,
} from '../ship-fiche.js';

const A = 'features/20260101000000001_a.md';
const B = 'features/20260101000000002_b.md';
const Z = 'features/done/20260101000000009_z.md';
const fm = (id: string, body: string): string =>
  `---\nid: "${id}"\ntitle: "T ${id}"\nstatus: ready\npr:\n---\n\n${body}\n`;

/** Un dépôt jouet : une fiche riche en liens, sa voisine, une livrée, un doc, un plan. */
function fixture(): Record<string, string> {
  return {
    [A]: fm(
      '20260101000000001',
      [
        'Voir [b](20260101000000002_b.md), [doc](../docs/x.md#ancre), [z](done/20260101000000009_z.md),',
        '[site](https://ex.org), [haut](#en-clair) et [abs](/racine.md).',
        '[ref]: ../docs/x.md',
        '```',
        '[exemple](../docs/x.md)',
        '```',
      ].join('\n'),
    ),
    [B]: fm('20260101000000002', '[a](20260101000000001_a.md)'),
    [Z]: fm('20260101000000009', '[a](../20260101000000001_a.md)'),
    'docs/x.md':
      '[fiche](../features/20260101000000001_a.md) et [b](../features/20260101000000002_b.md) [cassé](../nope.md)\n',
    'features/PLAN.md':
      '# Plan\n\n## NOW\n\n- `20260101000000001` — la fiche A · `build`\n- `20260101000000003` — autre · `build`\n',
    'features/BACKLOG.md': '# index\n',
  };
}

function memFs(files: Record<string, string>): RepoFs {
  const dirs = new Set<string>();
  for (const p of Object.keys(files)) {
    for (let d = posix.dirname(p); d !== '.' && !dirs.has(d); d = posix.dirname(d)) dirs.add(d);
  }
  return {
    markdownFiles: () => Object.keys(files).filter((p) => p.endsWith('.md')),
    read: (p) => {
      if (!(p in files)) throw new Error(`absent : ${p}`);
      return files[p];
    },
    exists: (p) => p in files || dirs.has(p),
  };
}

const ship = { status: 'shipped', pr: '#270', barPlan: true };

describe('recalLinks — lit les liens comme check-links.sh', () => {
  const moved = new Map([[A, 'features/done/20260101000000001_a.md']]);
  const exists = (p: string) => p === A || p === 'docs/x.md';

  it('recale liens en ligne, définitions, <cible>, fragment ; ignore code, URL, ancre, absolu', () => {
    const text = [
      '[a](../docs/x.md#f) [b](<../docs/x.md>)',
      '[ref]: ../docs/x.md',
      '~~~',
      '[c](../docs/x.md)',
      '~~~',
      '[d](https://ex.org) [e](#top) [f](/abs.md) [g](mailto:a@b.c)',
    ].join('\n');
    const r = recalLinks(text, A, 'features/done/20260101000000001_a.md', moved, exists);
    expect(r.text).toBe(
      [
        '[a](../../docs/x.md#f) [b](<../../docs/x.md>)',
        '[ref]: ../../docs/x.md',
        '~~~',
        '[c](../docs/x.md)',
        '~~~',
        '[d](https://ex.org) [e](#top) [f](/abs.md) [g](mailto:a@b.c)',
      ].join('\n'),
    );
    expect(r.count).toBe(3);
  });

  it('recale un lien ENTRANT vers la fiche déplacée', () => {
    const r = recalLinks('[a](../features/20260101000000001_a.md)', 'docs/x.md', 'docs/x.md', moved, exists);
    expect(r.text).toBe('[a](../features/done/20260101000000001_a.md)');
  });

  it('ne « répare » pas un lien déjà cassé', () => {
    const r = recalLinks('[x](../nope.md)', A, 'features/done/20260101000000001_a.md', moved, exists);
    expect(r).toEqual({ text: '[x](../nope.md)', count: 0 });
  });
});

describe('setFrontMatter / barPlanEntries', () => {
  it('remplace un champ, ajoute un champ absent, ne touche pas au reste', () => {
    const out = setFrontMatter(fm('1', 'corps'), { status: 'shipped', pr: '"#9"', extra: 'x' });
    expect(out).toContain('status: shipped\n');
    expect(out).toContain('pr: "#9"\n');
    expect(out).toContain('extra: x\n---');
    expect(out.endsWith('corps\n')).toBe(true);
    expect(() => setFrontMatter('pas de front-matter', { a: 'b' })).toThrow(/front-matter/);
  });

  it('barre une entrée dont toutes les fiches sont livrées ; épargne le reste', () => {
    const plan = [
      '## NOW',
      '- `20260101000000001` — A · `build`',
      '- ~~`20260101000000002` — B · `build`~~ — shipped #1',
      '- `20260101000000003` — C · `build`',
      '  - sous-item `20260101000000001`',
      '- `20260101000000001` puis `20260101000000003` — mêlées · `build`',
    ].join('\n');
    const r = barPlanEntries(plan, new Map([['20260101000000001', 'shipped #270']]));
    expect(r.text.split('\n')[1]).toBe('- ~~`20260101000000001` — A · `build`~~ — shipped #270');
    expect(r.text.split('\n')[2]).toBe('- ~~`20260101000000002` — B · `build`~~ — shipped #1');
    expect(r.text.split('\n')[3]).toBe('- `20260101000000003` — C · `build`');
    expect(r.text.split('\n')[4]).toBe('  - sous-item `20260101000000001`');
    expect(r.barred).toEqual(['20260101000000001']);
    expect(r.unbarrable).toEqual(['20260101000000001']); // la ligne mêlée : jugement humain
    expect(r.text.split('\n')[5]).toBe('- `20260101000000001` puis `20260101000000003` — mêlées · `build`');
  });
});

describe('planShip — calcule tout en mémoire, refuse avant d’écrire', () => {
  it('livre un lot : status + pr, liens sortants / entrants / entre fiches du lot, PLAN barré', () => {
    const plan = planShip(memFs(fixture()), { ...ship, files: [A, B] });
    expect(plan.moves).toEqual([
      { from: A, to: 'features/done/20260101000000001_a.md' },
      { from: B, to: 'features/done/20260101000000002_b.md' },
    ]);
    const a = plan.writes.get(A) as string;
    expect(a).toContain('status: shipped\n');
    expect(a).toContain('pr: "#270"\n');
    expect(a).toContain('[b](20260101000000002_b.md)'); // les deux vont dans done/ : même dossier
    expect(a).toContain('[doc](../../docs/x.md#ancre)'); // un cran de plus, fragment gardé
    expect(a).toContain('[z](20260101000000009_z.md)');
    expect(a).toContain('[ref]: ../../docs/x.md');
    expect(a).toContain('[exemple](../docs/x.md)'); // bloc de code : intact
    expect(plan.writes.get(Z)).toContain('[a](20260101000000001_a.md)'); // lien entrant d'une livrée
    expect(plan.writes.get('docs/x.md')).toContain('(../features/done/20260101000000001_a.md)');
    expect(plan.writes.get('features/PLAN.md')).toContain(
      '- ~~`20260101000000001` — la fiche A · `build`~~ — shipped #270',
    );
    expect(plan.planBarred).toEqual(['20260101000000001']);
    expect(plan.brokenAfter).toBe(plan.brokenBefore); // delta 0 (un lien cassé préexiste : nope.md)
    expect(plan.brokenBefore).toBe(1);
  });

  it('refuse sans rien écrire : fiche déjà dans done/, hors fiche, introuvable, double', () => {
    const run = (files: string[]) => () => planShip(memFs(fixture()), { ...ship, files });
    expect(run([Z])).toThrow(ShipRefusal);
    expect(run(['features/BACKLOG.md'])).toThrow(/directement sous features/);
    expect(run(['features/20260101000000077_absente.md'])).toThrow(/introuvable/);
    expect(run([A, A])).toThrow(/deux fois/);
    expect(run([])).toThrow(/aucune fiche/);
  });

  it('refuse un statut non admis, une PR vide, une destination existante', () => {
    const files = fixture();
    expect(() => planShip(memFs(files), { ...ship, status: 'idea', files: [A] })).toThrow(/non admis/);
    expect(() => planShip(memFs(files), { ...ship, pr: ' ', files: [A] })).toThrow(/--pr/);
    files['features/done/20260101000000001_a.md'] = fm('20260101000000001', 'déjà là');
    expect(() => planShip(memFs(files), { ...ship, files: [A] })).toThrow(/existe déjà/);
  });

  it('accepte les statuts terminaux, et pose la raison telle quelle dans `pr:`', () => {
    const plan = planShip(memFs(fixture()), {
      status: 'superseded',
      pr: 'superseded — fusionnée ailleurs',
      barPlan: true,
      files: [A],
    });
    expect(plan.writes.get(A)).toContain('status: superseded\n');
    expect(plan.writes.get(A)).toContain('pr: "superseded — fusionnée ailleurs"\n');
    expect(plan.writes.get('features/PLAN.md')).toContain('~~ — superseded\n');
  });

  it('refuse si PLAN.md garde la fiche à faire (--no-bar-plan, ou ligne mêlée)', () => {
    expect(() =>
      planShip(memFs(fixture()), { ...ship, barPlan: false, files: [A] }),
    ).toThrow(/reste à faire.*barre-la, ou retire --no-bar-plan/);
    const files = fixture();
    files['features/PLAN.md'] =
      '## NOW\n\n- `20260101000000001` et `20260101000000003` — mêlées · `build`\n';
    expect(() => planShip(memFs(files), { ...ship, files: [A] })).toThrow(/mêle une fiche livrée/);
  });

  it('filet : un recaleur défaillant fait monter les liens cassés → refus, avec les liens fautifs', () => {
    const sabote = { recal: (text: string) => ({ text, count: 0 }) };
    let refus: ShipRefusal | undefined;
    try {
      planShip(memFs(fixture()), { ...ship, files: [A] }, sabote);
    } catch (e) {
      refus = e as ShipRefusal;
    }
    expect(refus).toBeInstanceOf(ShipRefusal);
    expect(refus?.reasons[0]).toMatch(/liens cassés en hausse : 1 avant, \d+ après/);
    expect(refus?.reasons.join('\n')).toContain('docs/x.md:1 → ../features/20260101000000001_a.md');
  });

  it('findBroken compte les mêmes liens que la gate : cible absente seulement', () => {
    const files = new Map([
      ['docs/x.md', '[ok](y.md) [ko](z.md) [u](https://a.b) [h](#x)\n[r]: w.md\n```\n[c](v.md)\n```'],
    ]);
    const broken = findBroken(files, (p) => p === 'docs/y.md');
    expect(broken.map((b) => b.target)).toEqual(['z.md', 'w.md']);
  });
});

describe('sur un dépôt git jetable — la vraie gate check-links.sh mesure le delta', () => {
  const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const checkLinks = join(megaCity, 'bin', 'check-links.sh');
  const roots: string[] = [];
  afterEach(() => {
    for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
  });

  const git = (root: string, ...args: string[]) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8' });

  function toyRepo(): string {
    const root = mkdtempSync(join(tmpdir(), 'ship-fiche-'));
    roots.push(root);
    git(root, 'init', '--quiet');
    git(root, 'config', 'user.email', 'test@example.com');
    git(root, 'config', 'user.name', 'Test');
    for (const [path, content] of Object.entries(fixture())) {
      mkdirSync(join(root, dirname(path)), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    git(root, 'add', '.');
    git(root, 'commit', '--quiet', '-m', 'seed');
    return root;
  }

  /** Le nombre de liens cassés que la gate réelle voit (1 par ligne de sortie). */
  const brokenByGate = (root: string): number => {
    const r = spawnSync('bash', [checkLinks, root, 'features', 'docs'], { encoding: 'utf8' });
    return r.stdout.split('\n').filter((l) => l.includes('\t')).length;
  };

  // Délai large : ces tests lancent git et la vraie gate bash, et la suite complète tourne en parallèle.
  const slow = { timeout: 60_000 };

  it('un vrai ship : fiches déplacées, delta de liens cassés = 0 pour la gate, état prêt à committer', slow, () => {
    const root = toyRepo();
    const baseline = brokenByGate(root);
    expect(baseline).toBe(1); // nope.md préexiste : on mesure un DELTA, pas un zéro absolu

    const plan = planShip(nodeRepoFs(root), { ...ship, files: [A, B] });
    const regen = () => writeFileSync(join(root, 'features/BACKLOG.md'), '# index régénéré\n');
    applyShip(plan, nodeShipIo(root, regen));

    expect(readFileSync(join(root, 'features/BACKLOG.md'), 'utf8')).toBe('# index régénéré\n');
    expect(readFileSync(join(root, 'features/done/20260101000000001_a.md'), 'utf8')).toContain(
      'pr: "#270"',
    );
    expect(git(root, 'status', '--porcelain')).toContain('features/done/20260101000000002_b.md');
    expect(brokenByGate(root)).toBe(baseline);
  });

  it('un échec en route (régénération) remet le dépôt à l’état initial', slow, () => {
    const root = toyRepo();
    const plan = planShip(nodeRepoFs(root), { ...ship, files: [A, B] });
    const regen = () => {
      throw new Error('regen-backlog a planté');
    };
    let echec: ShipFailure | undefined;
    try {
      applyShip(plan, nodeShipIo(root, regen));
    } catch (e) {
      echec = e as ShipFailure;
    }
    expect(echec).toBeInstanceOf(ShipFailure);
    expect(echec?.rolledBack).toBe(true);
    expect(echec?.message).toBe('regen-backlog a planté');
    expect(git(root, 'status', '--porcelain')).toBe(''); // plus rien de modifié, ni déplacé
    expect(readFileSync(join(root, A), 'utf8')).toBe(fixture()[A]);
  });
});
