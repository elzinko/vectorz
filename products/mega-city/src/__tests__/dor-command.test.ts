/**
 * `ezk dor` côté disque (fiche 20260815080414006) : le chargeur du manifeste et la commande, sur des projets
 * consommateurs JETABLES — A (un manifeste « surfaces » + un seuil), B (aucun manifeste), C (manifeste cassé).
 * Le test vise la couche déterministe (code de sortie, slots nommés), jamais le jugement d'un LLM.
 *
 * La commande tourne en mémoire (`runDor`) ; un seul vrai processus prouve le câblage du script et de `--root`.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { parseDorManifest } from '../core/dor-manifest.js';
import { runDor } from '../io/dor-command.js';
import { loadDor } from '../loaders/dor.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

const made: string[] = [];
function project(files: Record<string, string>): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-dor-')));
  made.push(dir);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}
afterAll(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});

const fiche = (status: string, body = '', extra = ''): string =>
  `---\nid: "x"\ntitle: "t"\ntype: feature\nstatus: ${status}\n${extra}---\n\n# t\n\n${body}\n`;

const DOR_YML = `slots:
  - id: surfaces
    heading: Surfaces impactées
    ask: "Pour chaque surface : oui, non, ou comment ?"
    items: [doc, site, README]
health:
  min-ready: 2
`;

const run = (verb: 'check' | 'show' | 'health', root: string, args: string[] = []) => {
  let out = '';
  let err = '';
  const code = runDor({ verb, args, root, out: (t) => (out += t), err: (t) => (err += t) });
  return { code, out, err };
};

// A : un manifeste, trois fiches (une sans la section, une complète, une prête de plus)
const A = project({
  '.vectorz/dor.yml': DOR_YML,
  'features/20260101000000001_sans-section.md': fiche('idea', '## Contexte\n\nRien.'),
  'features/20260101000000002_complete.md': fiche(
    'idea',
    '## Surfaces impactées\n\n- doc : oui\n- site : non\n- README : non',
  ),
  'features/20260101000000003_incomplete.md': fiche('idea', '## Surfaces impactées\n\n- doc : oui'),
  'features/20260101000000004_prete.md': fiche('ready'),
  'features/20260101000000005_bloquee.md': fiche('ready', '', 'blocked: attend le PO\n'),
});
// B : aucun manifeste
const B = project({ 'features/20260101000000001_une.md': fiche('idea') });
// C : manifeste cassé (clé inconnue), puis YAML malformé
const C = project({ '.vectorz/dor.yml': 'slot:\n  - id: a\n', 'features/20260101000000001_une.md': fiche('idea') });
const D = project({ '.vectorz/dor.yml': 'slots: [\n', 'features/20260101000000001_une.md': fiche('idea') });

describe('loadDor', () => {
  it('rend undefined sans fichier, le YAML brut avec un fichier, et nomme le chemin si le YAML est cassé', () => {
    expect(loadDor(B)).toBeUndefined();
    expect(loadDor(A)?.file).toBe(join(A, '.vectorz', 'dor.yml'));
    expect(() => loadDor(D)).toThrow(join(D, '.vectorz', 'dor.yml'));
  });
});

describe('l’exemple documenté .vectorz/dor.example.yml', () => {
  it('est un manifeste valide, avec le slot « Surfaces impactées » et un seuil', () => {
    const example = readFileSync(join(megaCity, '..', '..', '.vectorz', 'dor.example.yml'), 'utf8');
    const parsed = parseDorManifest(parseYaml(example));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.manifest.slots.map((s) => s.id)).toEqual(['surfaces']);
    expect(parsed.manifest.slots[0].items.length).toBeGreaterThan(0);
    expect(parsed.manifest.minReady).toBeGreaterThanOrEqual(1);
  });
});

describe('ezk dor show', () => {
  it('liste les slots, la question, les items et le seuil', () => {
    const r = run('show', A);
    expect(r.code).toBe(0);
    expect(r.out).toContain('surfaces : section « Surfaces impactées »');
    expect(r.out).toContain('à balayer : doc, site, README');
    expect(r.out).toContain('Seuil de lot (health.min-ready) : 2');
  });

  it('sans manifeste : le socle 3+1 seul, code 0', () => {
    const r = run('show', B);
    expect(r.code).toBe(0);
    expect(r.out).toContain('socle 3+1 seul');
  });
});

describe('ezk dor check', () => {
  it('section absente : code 1, nomme le slot et ce qu’il faut trancher', () => {
    const r = run('check', A, ['20260101000000001']);
    expect(r.code).toBe(1);
    expect(r.out).toContain('surfaces : VIDE, la section est absente');
    expect(r.out).toContain('à trancher : Pour chaque surface');
    expect(r.out).toContain('Prête refusée');
  });

  it('item non mentionné : code 1, nomme l’item manquant', () => {
    const r = run('check', A, ['20260101000000003']);
    expect(r.code).toBe(1);
    expect(r.out).toContain('INCOMPLET');
    expect(r.out).toContain('ne mentionne pas : site, README');
  });

  it('section complète : code 0', () => {
    const r = run('check', A, ['20260101000000002']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('surfaces : OK');
    expect(r.out).toContain('DoR du projet tenue');
  });

  it('sabotage : sans manifeste, la même fiche ne se voit rien exiger (code 0)', () => {
    const r = run('check', B, ['20260101000000001']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('socle 3+1 seul');
  });

  it('id absent ou inconnu : code 2, jamais un faux vert', () => {
    expect(run('check', A).code).toBe(2);
    const inconnu = run('check', A, ['99999999']);
    expect(inconnu.code).toBe(2);
    expect(inconnu.err).toContain('introuvable');
    // Même sans manifeste : une faute de frappe sur l’id ne passe pas pour un succès.
    expect(run('check', B, ['99999999']).code).toBe(2);
  });
});

describe('ezk dor health', () => {
  it('sous le seuil : code 1 et « groomez d’abord » ; les ready bloquées sont comptées à part', () => {
    const r = run('health', A);
    expect(r.code).toBe(1);
    expect(r.out).toContain('tirables (ready)  : 1');
    expect(r.out).toContain('pas prêtes (idea) : 3');
    expect(r.out).toContain('ready bloquées    : 1');
    expect(r.out).toContain('INSUFFISANT');
    expect(r.out).toContain('Groomez d\'abord');
  });

  it('sans seuil déclaré : informatif, code 0', () => {
    const r = run('health', B);
    expect(r.code).toBe(0);
    expect(r.out).toContain('Seuil de lot : non déclaré');
  });

  it('au seuil : suffisant, code 0', () => {
    const E = project({
      '.vectorz/dor.yml': 'health:\n  min-ready: 1\n',
      'features/20260101000000001_prete.md': fiche('ready'),
    });
    const r = run('health', E);
    expect(r.code).toBe(0);
    expect(r.out).toContain('suffisant');
  });
});

describe('manifeste inutilisable', () => {
  it('forme invalide : code 1, le champ fautif est nommé — pour les trois verbes', () => {
    for (const verb of ['show', 'check', 'health'] as const) {
      const r = run(verb, C, ['20260101000000001']);
      expect(r.code, verb).toBe(1);
      expect(r.err, verb).toContain('slot : clé inconnue');
    }
  });

  it('YAML malformé : code 1, le chemin du fichier est nommé', () => {
    const r = run('show', D);
    expect(r.code).toBe(1);
    expect(r.err).toContain(join(D, '.vectorz', 'dor.yml'));
  });
});

describe('bin/ezk-dor.ts — le câblage du script et de --root', () => {
  it('lance la vraie commande sur un projet désigné par --root', () => {
    const r = spawnSync(
      process.execPath,
      [tsxCli, join(megaCity, 'bin', 'ezk-dor.ts'), 'check', '20260101000000001', '--root', A],
      { cwd: megaCity, encoding: 'utf8' },
    );
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('surfaces : VIDE');
  });
});
