/**
 * Le loader des outils — ce qu'il liste, ce qu'il lit du manifeste, et ce qu'il ne fait jamais
 * tomber (fiche 20260917123943914, ADR-0058). Sur un faux produit dans un dossier temporaire.
 */
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadCatalog } from '../loaders/catalog.js';
import { listToolFiles, readRouting } from '../loaders/tools.js';

let root: string;

function put(rel: string, content = '', mode?: number): void {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  if (mode !== undefined) chmodSync(file, mode);
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ezk-tools-'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('listToolFiles — les fichiers qui sont des outils', () => {
  it('liste les scripts de bin/ et des scripts/ de chaque skill, triés, sans les tests ni la doc', () => {
    put('bin/b.sh');
    put('bin/a.ts');
    put('bin/test-a.sh'); // un test
    put('bin/README.md'); // de la doc
    put('skills/ezk-x/SKILL.md', '---\nname: ezk-x\n---\n');
    put('skills/ezk-x/scripts/run.sh');
    put('skills/ezk-x/scripts/test-run.sh'); // un test
    put('skills/ezk-x/scripts/data.json'); // des données

    expect(listToolFiles(root)).toEqual(['bin/a.ts', 'bin/b.sh', 'skills/ezk-x/scripts/run.sh']);
  });

  it('un fichier exécutable sans extension est un outil, dans scripts/ seulement (le hook commit-msg)', () => {
    put('skills/ezk-x/SKILL.md', '---\nname: ezk-x\n---\n');
    put('skills/ezk-x/scripts/commit-msg', '#!/bin/sh\n', 0o755);
    put('skills/ezk-x/scripts/notes', 'pas exécutable', 0o644);
    put('bin/launcher', '#!/bin/sh\n', 0o755); // bin/ exige une extension de script

    expect(listToolFiles(root)).toEqual(['skills/ezk-x/scripts/commit-msg']);
  });

  it('ignore un dossier sans SKILL.md, les sous-dossiers de scripts/ et les liens symboliques', () => {
    put('skills/pas-un-skill/scripts/x.sh'); // pas de SKILL.md : pas un skill
    put('skills/ezk-x/SKILL.md', '---\nname: ezk-x\n---\n');
    put('skills/ezk-x/scripts/lib/helper.sh'); // sous-dossier : hors périmètre
    put('elsewhere/secret.sh');
    symlinkSync(join(root, 'elsewhere/secret.sh'), join(root, 'bin-link.sh'));
    mkdirSync(join(root, 'bin'), { recursive: true });
    symlinkSync(join(root, 'elsewhere/secret.sh'), join(root, 'bin/linked.sh'));

    expect(listToolFiles(root)).toEqual([]);
  });

  it('une racine sans bin/ ni skills/ n’a aucun outil, sans erreur', () => {
    expect(listToolFiles(root)).toEqual([]);
  });
});

describe('readRouting — ce que le manifeste et package.json disent des scripts', () => {
  const MANIFEST = `
commands:
  - domain: dashboard
    run: bin/map.ts
    summary: Ouvre le tableau de bord.
  - domain: graph
    verb: check
    run: bin/graph.ts --strict
    summary: Valide le graphe.
  - domain: map
    run: bin/map.ts
    summary: Ancien nom.
    deprecated: dashboard
internal:
  - script: bin/router.ts
    reason: le routeur lui-même
`;

  it('rend les commandes ezk de chaque script (ancien nom exclu) et les raisons « internal »', () => {
    put('ezk-manifest.yml', MANIFEST);

    const routed = readRouting(root);

    expect(routed.commands.get('bin/map.ts')).toEqual(['ezk dashboard']);
    expect(routed.commands.get('bin/graph.ts')).toEqual(['ezk graph check']);
    expect(routed.internal.get('bin/router.ts')).toBe('le routeur lui-même');
  });

  it('les commandes installées par package.json (bin) comptent : le lanceur est une commande', () => {
    put('package.json', JSON.stringify({ name: 'x', bin: { ezk: 'bin/ezk.mjs', autre: './bin/autre.mjs' } }));

    const routed = readRouting(root);

    expect(routed.commands.get('bin/ezk.mjs')).toEqual(['ezk']);
    expect(routed.commands.get('bin/autre.mjs')).toEqual(['autre']);
  });

  it.each([
    ['sans manifeste', () => undefined],
    ['avec un manifeste illisible', () => put('ezk-manifest.yml', 'commands: [: pas du yaml')],
    ['avec un manifeste qui n’en est pas un', () => put('ezk-manifest.yml', 'commands: 42')],
    ['avec un package.json cassé', () => put('package.json', '{ pas du json')],
  ])('ne jette jamais, %s : rien n’est routé', (_cas, arrange) => {
    arrange();

    const routed = readRouting(root);

    expect(routed.commands.size).toBe(0);
    expect(routed.internal.size).toBe(0);
  });
});

describe('loadCatalog — les outils font partie du catalogue', () => {
  it('une racine sans script n’a pas de champ `tools` : rien ne change pour le bind', () => {
    put('skills/ezk-x/SKILL.md', '---\nname: ezk-x\ndescription: x\n---\nCorps.\n');

    expect(loadCatalog(root).tools).toBeUndefined();
  });

  it('relie un script du dossier du skill au skill qui le cite dans son SKILL.md', () => {
    put('skills/ezk-x/SKILL.md', '---\nname: ezk-x\ndescription: x\n---\nLance `scripts/run.sh`.\n');
    put('skills/ezk-x/scripts/run.sh');
    put('skills/ezk-x/scripts/jamais-cite.sh');

    const tools = loadCatalog(root).tools;

    expect(tools?.get('skills/ezk-x/scripts/run.sh')?.usedBy).toEqual(['ezk-x']);
    expect(tools?.get('skills/ezk-x/scripts/jamais-cite.sh')?.usedBy).toEqual([]);
  });

  it('un fichier markdown du dossier du skill compte aussi, comme son SKILL.md', () => {
    put('skills/ezk-x/SKILL.md', '---\nname: ezk-x\ndescription: x\n---\nVoir les références.\n');
    put('skills/ezk-x/references/guide.md', 'Joue `bash <skill>/scripts/run.sh`.\n');
    put('skills/ezk-x/scripts/run.sh');

    expect(loadCatalog(root).tools?.get('skills/ezk-x/scripts/run.sh')?.usedBy).toEqual(['ezk-x']);
  });

  it('un script cité seulement dans un autre script (pas dans la doc) ne relie rien', () => {
    put('skills/ezk-x/SKILL.md', '---\nname: ezk-x\ndescription: x\n---\nCorps.\n');
    put('skills/ezk-x/scripts/run.sh', '#!/bin/sh\nbash scripts/other.sh\n');
    put('skills/ezk-x/scripts/other.sh');

    expect(loadCatalog(root).tools?.get('skills/ezk-x/scripts/other.sh')?.usedBy).toEqual([]);
  });
});
