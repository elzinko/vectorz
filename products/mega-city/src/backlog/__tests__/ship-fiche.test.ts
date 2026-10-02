/**
 * ship-fiche — livrer une fiche sans rien casser (fiche 20260830194601233).
 *
 * Trois étages : le recalage de liens (pur, calqué sur check-links.sh), le plan de la transaction
 * (pur, état du dépôt injecté — il REFUSE avant d'écrire), puis un dépôt git jetable où la VRAIE
 * gate `check-links.sh` mesure le delta de liens cassés avant / après un vrai ship. Le vrai bin y
 * livre aussi dans un dépôt qui n'est pas vectorz, désigné par `--root`.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, posix, resolve } from 'node:path';
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

  it('coupe la cible au premier blanc et garde le titre optionnel, comme la gate', () => {
    const text =
      '[a](../docs/x.md "titre") [b](<../docs/x.md> "t") [c]( ../docs/x.md )\n[ref]: ../docs/x.md "titre"';
    const r = recalLinks(text, A, 'features/done/20260101000000001_a.md', moved, exists);
    expect(r.text).toBe(
      '[a](../../docs/x.md "titre") [b](<../../docs/x.md> "t") [c]( ../../docs/x.md )\n[ref]: ../../docs/x.md "titre"',
    );
    expect(r.count).toBe(4);
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

  it('refuse aussi pour merged / split : PLAN.md ne garde jamais la fiche à faire', () => {
    const merged = { status: 'merged', pr: 'merged — fusionnée ailleurs', barPlan: false, files: [A] };
    expect(() => planShip(memFs(fixture()), merged)).toThrow(/reste à faire/);
    const barred = planShip(memFs(fixture()), { ...merged, barPlan: true });
    expect(barred.writes.get('features/PLAN.md')).toContain('~~ — merged\n');
    const files = fixture();
    files['features/PLAN.md'] =
      '## NOW\n\n- `20260101000000001` et `20260101000000003` — mêlées · `build`\n';
    expect(() =>
      planShip(memFs(files), { status: 'split', pr: 'split — x', barPlan: true, files: [A] }),
    ).toThrow(/mêle une fiche livrée/);
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

  it('filet : un lien réparé par accident ne masque pas un lien cassé par le ship', () => {
    const files = {
      [A]: fm('20260101000000001', '[p](../zz.md)\n[q](../docs/x.md)'),
      'docs/x.md': 'ok\n',
      'features/zz.md': '# existe\n', // `../zz.md` y tombe depuis done/ : cassé avant, valide après
    };
    const input = { ...ship, barPlan: false, files: [A] };
    expect(() => planShip(memFs(files), input)).not.toThrow(); // le vrai recaleur ne casse rien
    const sabote = { recal: (text: string) => ({ text, count: 0 }) };
    // Avec un recaleur défaillant : 1 lien cassé avant, 1 après — le nombre ne bouge pas, mais
    // ce n'est plus le même lien. Comparer les liens (pas les nombres) le voit.
    expect(() => planShip(memFs(files), input, sabote)).toThrow(/dont 1 nouveau/);
  });

  it('findBroken coupe la cible au premier blanc (titre optionnel), comme la gate', () => {
    const files = new Map([['docs/x.md', '[ok](y.md "titre") [ko](z.md "titre")']]);
    expect(findBroken(files, (p) => p === 'docs/y.md').map((b) => b.target)).toEqual(['z.md']);
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

  it('refuse une fiche pas encore suivie par git, avant d’écrire quoi que ce soit', slow, () => {
    const root = toyRepo();
    const neuve = 'features/20260101000000042_neuve.md';
    writeFileSync(join(root, neuve), fm('20260101000000042', 'neuve'));
    expect(() => planShip(nodeRepoFs(root), { ...ship, files: [neuve] })).toThrow(
      /pas suivie par git/,
    );
    expect(git(root, 'status', '--porcelain')).toBe(`?? ${neuve}\n`); // rien n'a bougé
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

  /** Le VRAI bin, lancé comme `pnpm --dir products/mega-city` le lance : depuis mega-city. */
  const tsx = createRequire(import.meta.url).resolve('tsx/cli');
  const shipBin = (args: string[], env: Record<string, string> = {}) => {
    const r = spawnSync(process.execPath, [tsx, join(megaCity, 'bin', 'ship-fiche.ts'), '--', ...args], {
      cwd: megaCity,
      encoding: 'utf8',
      env: { ...process.env, INIT_CWD: '', EZK_ROOT: '', ...env },
    });
    return { code: r.status, out: `${r.stdout}${r.stderr}` };
  };

  it('--root : le bin livre dans un AUTRE dépôt que vectorz — fiches, liens, BACKLOG.md régénérés là-bas', slow, () => {
    const root = toyRepo();
    // Un vrai projet ezk-backlog a son guide : l'index régénéré y renvoie et y lit son titre.
    writeFileSync(join(root, 'features/README.md'), '---\nbacklog_title: Backlog — projet jouet\n---\n\n# Guide\n');
    git(root, 'add', '.');
    git(root, 'commit', '--quiet', '-m', 'guide');
    const baseline = brokenByGate(root);
    // Racine relative, lue depuis le dossier où la commande est tapée (INIT_CWD) ; une fiche en absolu.
    const r = shipBin(['--root', basename(root), '--pr', '#273', A, join(root, B)], { INIT_CWD: dirname(root) });

    expect(r.out).toContain(`Projet visé : ${root}`);
    expect(r.code).toBe(0); // les fiches jouets n'existent pas dans vectorz : sans --root, ce serait un refus
    const shipped = readFileSync(join(root, 'features/done/20260101000000001_a.md'), 'utf8');
    expect(shipped).toMatch(/^status: shipped$/m);
    expect(shipped).toContain('pr: "#273"');
    expect(readFileSync(join(root, 'features/PLAN.md'), 'utf8')).toContain('~~`20260101000000001`');
    // Le vrai regen-backlog.sh a tourné sur CE dépôt : titre lu dans son guide, livrées citées.
    const backlog = readFileSync(join(root, 'features/BACKLOG.md'), 'utf8');
    expect(backlog.split('\n')[0]).toBe('# Backlog — projet jouet');
    expect(backlog).toContain('done/20260101000000002_b.md');
    expect(git(root, 'status', '--porcelain')).toContain('features/done/20260101000000002_b.md');
    expect(brokenByGate(root)).toBe(baseline);
  });

  it('--root mal formé ou faux : refus (code 1), rien écrit ; EZK_ROOT seule ne redirige pas les écritures', slow, () => {
    const root = toyRepo();
    const sansDossier = shipBin(['--pr', '#1', A, '--root']);
    expect(sansDossier.code).toBe(1);
    expect(sansDossier.out).toContain('attend un dossier');

    const absent = shipBin(['--root', join(root, 'absent'), '--pr', '#1', A]);
    expect(absent.code).toBe(1);
    expect(absent.out).toContain("n'existe pas");

    // Une variable restée dans le shell : le bin garde son défaut (vectorz), où la fiche jouet n'existe pas.
    const parVariable = shipBin(['--dry-run', '--pr', '#1', A], { EZK_ROOT: root });
    expect(parVariable.code).toBe(1);
    expect(parVariable.out).toContain(`${A} : introuvable`);
    expect(git(root, 'status', '--porcelain')).toBe('');
  });
});
