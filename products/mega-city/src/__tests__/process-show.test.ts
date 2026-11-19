/**
 * Les étapes fines de la méthode (fiche 20261110191135802) : `method/etapes.yml` déclare les étapes
 * de chaque skill, le compilateur les vérifie, `ezk process show --json` les publie.
 *
 * En clair : une référence inventée, une étape qu'on ne retrouve plus dans son skill ou un réglage
 * que `ezk config show` ne connaît pas font échouer la validation ; la sortie suit le fichier, porte
 * la valeur des réglages du projet lu, et respecte son contrat rangé.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  type EtapesDoc,
  ProcessShowSchema,
  REGLAGES,
  buildProcessShow,
  validateEtapes,
} from '../core/process-show.js';
import { makeContractFixture, PROCESS_SHOW_EXAMPLE_FILE, PROCESS_SHOW_SCHEMA_FILE } from '../io/contract-files.js';
import { configShowData } from '../io/config-show.js';
import { processShowData } from '../io/process-show.js';
import { type Catalog, loadCatalog } from '../loaders/catalog.js';
import { loadEtapesDoc } from '../loaders/method.js';

// La fixture lance git, et les tests de la commande lancent tsx : sous la charge de la gate, le délai
// vitest par défaut ne suffit pas (même réglage que board-contract.test.ts).
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

/** Un petit catalogue : deux skills (dont un sans sous-commandes), un agent. */
const tiny = (): Catalog => ({
  rules: new Map(),
  bundles: new Map(),
  profiles: new Map(),
  agents: new Map([['ezk-qa', { id: 'ezk-qa', role: '', competences: [], interactions: [] }]]),
  skills: new Map([
    ['ezk-backlog', { id: 'ezk-backlog', content: '### `groom <id>` — faire mûrir', argumentHint: '[help|groom|ready]' }],
    ['ezk-sprint', { id: 'ezk-sprint', content: '3. **BDD** — délègue' }],
  ]),
});

const doc = (over: Partial<EtapesDoc['skills'][number]['etapes'][number]> = {}, liens: EtapesDoc['liens'] = []): EtapesDoc => ({
  skills: [
    {
      id: 'ezk-backlog',
      nom: 'Le backlog',
      en_clair: 'Les fiches mûrissent.',
      etapes: [{ id: 'groomer', titre: 'Groomer', en_clair: 'La fiche mûrit.', joue_par: ['ezk-backlog:groom'], ancre: '### `groom <id>`' }],
    },
    {
      id: 'ezk-sprint',
      nom: 'Le sprint',
      en_clair: 'Le lot se construit.',
      etapes: [{ id: 'scenarios', titre: 'Scénarios', en_clair: 'Les scénarios.', joue_par: ['agent:ezk-qa'], ancre: '3. **BDD**', ...over }],
    },
  ],
  liens,
});

describe('validateEtapes — vérifiées : une référence inventée fait échouer', () => {
  it('accepte les quatre formes de la grammaire (humain, agent:, skill, skill:sous-commande)', () => {
    expect(() => validateEtapes(tiny(), doc({ joue_par: ['humain', 'agent:ezk-qa', 'ezk-sprint', 'ezk-backlog:groom'] }))).not.toThrow();
  });

  it('jette sur un agent, un skill ou une sous-commande inconnus, et nomme l’étape fautive', () => {
    expect(() => validateEtapes(tiny(), doc({ joue_par: ['agent:fantome'] }))).toThrow(/ezk-sprint.*scenarios.*agent inconnu/);
    expect(() => validateEtapes(tiny(), doc({ joue_par: ['ezk-fantome'] }))).toThrow(/skill inconnu/);
    expect(() => validateEtapes(tiny(), doc({ joue_par: ['ezk-backlog:ship'] }))).toThrow(/sous-commande absente/);
  });

  it('jette sur une étape sans personne qui la joue', () => {
    expect(() => validateEtapes(tiny(), doc({ joue_par: [] }))).toThrow(/joue_par/);
  });

  it('jette sur un skill déclaré absent du catalogue, et sur un id d’étape en double', () => {
    const bad = doc();
    bad.skills[1] = { ...bad.skills[1], id: 'ezk-fantome' };
    expect(() => validateEtapes(tiny(), bad)).toThrow(/ezk-fantome.*skill inconnu/);
    const twice = doc();
    twice.skills[0].etapes.push({ ...twice.skills[0].etapes[0] });
    expect(() => validateEtapes(tiny(), twice)).toThrow(/en double/);
  });

  it('jette sur une déclaration mal formée : chaque refus nomme ce qui manque', () => {
    const cases: [EtapesDoc, RegExp][] = [
      [{ skills: [], liens: [] }, /`skills` absent ou vide/],
      [{ ...doc(), skills: [doc().skills[0], doc().skills[0]] }, /ezk-backlog.*skill en double/],
      [{ ...doc(), skills: [{ ...doc().skills[0], etapes: [] }] }, /`etapes` absent ou vide/],
      [{ ...doc(), skills: [{ ...doc().skills[0], nom: ' ' }] }, /nom manquant/],
      [doc({ titre: '' }), /scenarios.*titre manquant/],
      [doc({ joue_par: 'agent:ezk-qa' as unknown as string[] }), /joue_par doit être une liste de chaînes/],
      [doc({ reglages: [1] as unknown as string[] }), /reglages doit être une liste de chaînes/],
      [doc({}, [{ de: 'ezk-backlog', vers: 'ezk-sprint', libelle: '' }]), /lien n° 1 : libelle manquant/],
    ];
    for (const [bad, message] of cases) expect(() => validateEtapes(tiny(), bad)).toThrow(message);
  });

  it('jette sur un lien qui vise un skill non déclaré', () => {
    expect(() => validateEtapes(tiny(), doc({}, [{ de: 'ezk-sprint', vers: 'ezk-retro', libelle: 'nourrit' }]))).toThrow(
      /lien.*ezk-retro/,
    );
  });
});

describe('validateEtapes — règles rattachées à une étape (fiche 20261117223348335)', () => {
  const withRules = (): Catalog => {
    const c = tiny();
    c.rules.set('clean-code/no-dead-code', { id: 'clean-code/no-dead-code' } as never);
    c.rules.set('testing/sortie-machine-verifiee-par-un-tuyau', { id: 'testing/sortie-machine-verifiee-par-un-tuyau' } as never);
    return c;
  };

  it('publie les règles d’une étape, dans l’ordre déclaré', () => {
    const regles = ['testing/sortie-machine-verifiee-par-un-tuyau', 'clean-code/no-dead-code'];
    const out = buildProcessShow(validateEtapes(withRules(), doc({ regles })), configShowData(megaCity));
    expect(out.skills[1].etapes[0].regles).toEqual(regles);
  });

  it('jette sur une règle absente du catalogue, en nommant l’étape et la règle', () => {
    expect(() => validateEtapes(withRules(), doc({ regles: ['clean-code/inventee'] }))).toThrow(
      /étape « scenarios ».*règle « clean-code\/inventee » inconnue du catalogue/,
    );
  });

  it('jette sur une règle citée deux fois sur la même étape', () => {
    expect(() => validateEtapes(withRules(), doc({ regles: ['clean-code/no-dead-code', 'clean-code/no-dead-code'] }))).toThrow(
      /étape « scenarios ».*règle « clean-code\/no-dead-code » citée deux fois/,
    );
  });
});

describe('validateEtapes — boucles et outils (fiche 20261117223348250)', () => {
  const boucle = (de: string, vers: string): NonNullable<EtapesDoc['boucles']>[number] => ({ de, vers, libelle: 'on reprend' });
  const withBoucles = (boucles: EtapesDoc['boucles']): EtapesDoc => ({ ...doc(), boucles });

  it('accepte une boucle entre deux étapes déclarées, même d’un skill à l’autre', () => {
    const out = validateEtapes(tiny(), withBoucles([boucle('ezk-sprint:scenarios', 'ezk-backlog:groomer')]));
    expect(out.boucles).toEqual([{ de: 'ezk-sprint:scenarios', vers: 'ezk-backlog:groomer', libelle: 'on reprend' }]);
  });

  it('sans boucles déclarées, la liste est vide et aucun skill n’est un outil', () => {
    const out = validateEtapes(tiny(), doc());
    expect(out.boucles).toEqual([]);
    expect(out.skills.map((s) => s.outil)).toEqual([false, false]);
  });

  it('jette sur une boucle qui vise une étape inconnue, ou une référence sans étape', () => {
    expect(() => validateEtapes(tiny(), withBoucles([boucle('ezk-sprint:code', 'ezk-sprint:scenarios')]))).toThrow(
      /boucle n° 1.*ezk-sprint:code/,
    );
    expect(() => validateEtapes(tiny(), withBoucles([boucle('ezk-sprint', 'ezk-backlog:groomer')]))).toThrow(/boucle n° 1.*ezk-sprint/);
    expect(() => validateEtapes(tiny(), withBoucles([{ de: 'ezk-sprint:scenarios', vers: 'ezk-backlog:groomer', libelle: '' }]))).toThrow(
      /boucle n° 1.*libelle manquant/,
    );
  });

  it('jette sur un drapeau outil qui n’est pas un booléen', () => {
    const bad = doc();
    (bad.skills[1] as { outil?: unknown }).outil = 'oui';
    expect(() => validateEtapes(tiny(), bad)).toThrow(/ezk-sprint.*outil doit être true ou false/);
  });

  it('jette sur un lien ou une boucle qui touche un outil : un outil est hors du flux', () => {
    const tool = (extra: Partial<EtapesDoc>): EtapesDoc => {
      const d = { ...doc(), ...extra };
      d.skills[1] = { ...d.skills[1], outil: true };
      return d;
    };
    expect(() => validateEtapes(tiny(), tool({ liens: [{ de: 'ezk-backlog', vers: 'ezk-sprint', libelle: 'part' }] }))).toThrow(
      /lien n° 1.*ezk-sprint.*outil/,
    );
    expect(() => validateEtapes(tiny(), tool({ boucles: [boucle('ezk-backlog:groomer', 'ezk-sprint:scenarios')] }))).toThrow(
      /boucle n° 1.*ezk-sprint.*outil/,
    );
  });
});

describe('validateEtapes — ancrées : l’étape se retrouve dans le texte de son skill', () => {
  it('jette quand l’ancre ne figure plus dans le SKILL.md du skill', () => {
    expect(() => validateEtapes(tiny(), doc({ ancre: '3. **Scénarios BDD**' }))).toThrow(
      /ezk-sprint.*scenarios.*introuvable dans skills\/ezk-sprint\/SKILL.md/,
    );
  });

  it('sur le vrai catalogue : renommer l’étape dans le skill, sans toucher la déclaration, fait échouer', () => {
    const catalog = loadCatalog(megaCity);
    const etapes = loadEtapesDoc(megaCity);
    const sprint = catalog.skills.get('ezk-sprint');
    if (!sprint) throw new Error('ezk-sprint absent du catalogue');
    catalog.skills.set('ezk-sprint', { ...sprint, content: sprint.content.replace('3. **BDD**', '3. **Spécifications**') });
    expect(() => validateEtapes(catalog, etapes)).toThrow(/ezk-sprint.*scenarios.*introuvable/);
  });
});

describe('validateEtapes — réglages : seules les clés de `ezk config show`', () => {
  it('jette sur une clé de réglage inconnue, en listant les clés connues', () => {
    expect(() => validateEtapes(tiny(), doc({ reglages: ['review.adverses'] }))).toThrow(
      /réglage inconnu « review.adverses ».*review.adverse/,
    );
  });

  it('chaque clé connue est une ligne de `ezk config show`', () => {
    const fixture = makeContractFixture();
    try {
      const r = spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'ezk-config.ts'), '--root', fixture, 'show'], {
        encoding: 'utf8',
      });
      expect(r.status, r.stderr).toBe(0);
      const lines = r.stdout.split('\n');
      for (const cle of REGLAGES.keys()) {
        expect(lines.some((l) => l.startsWith(`${cle} `)), `${cle} absente de ezk config show`).toBe(true);
      }
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
});

describe('buildProcessShow — la sortie suit la déclaration', () => {
  let fixture: string;
  beforeAll(() => {
    fixture = makeContractFixture();
  });
  afterAll(() => rmSync(fixture, { recursive: true, force: true }));

  it('numérote les étapes, range agents et commandes, et porte la valeur des réglages du projet', () => {
    const out = buildProcessShow(
      validateEtapes(tiny(), doc({ joue_par: ['agent:ezk-qa', 'ezk-backlog:groom', 'ezk-sprint', 'humain'], reglages: ['review.adverse', 'github.pr'] })),
      configShowData(fixture),
    );
    expect(out.skills[1].etapes[0]).toEqual({
      id: 'scenarios',
      num: 1,
      titre: 'Scénarios',
      enClair: 'Les scénarios.',
      joueePar: ['agent:ezk-qa', 'ezk-backlog:groom', 'ezk-sprint', 'humain'],
      agents: ['ezk-qa'],
      commandes: ['/ezk-backlog groom', '/ezk-sprint'],
      regles: [],
      reglages: [
        { cle: 'review.adverse', valeur: 'run' },
        { cle: 'github.pr', valeur: 'on' },
      ],
    });
    expect(ProcessShowSchema.safeParse(out).success).toBe(true);
  });

  it('une valeur de réglage change avec le projet lu', () => {
    const root = mkdtempSync(join(tmpdir(), 'process-show-poc-'));
    try {
      mkdirSync(join(root, '.vectorz'));
      writeFileSync(join(root, '.vectorz', 'config.yml'), 'review:\n  adverse: skip\n');
      const out = buildProcessShow(validateEtapes(tiny(), doc({ reglages: ['review.adverse'] })), configShowData(root));
      expect(out.skills[1].etapes[0].reglages).toEqual([{ cle: 'review.adverse', valeur: 'skip' }]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('ajouter une étape au fichier la fait apparaître dans la sortie, sans toucher au code', () => {
    const dir = mkdtempSync(join(tmpdir(), 'process-show-ajout-'));
    try {
      const text = readFileSync(join(megaCity, 'method', 'etapes.yml'), 'utf8');
      const ajout = [
        '      - id: checkpoint',
        '        titre: Checkpoint',
        '        en_clair: Le PO valide la story sur les critères prouvés.',
        '        joue_par: [humain]',
        '        ancre: "9. **⛳ Checkpoint**"',
        '',
      ].join('\n');
      mkdirSync(join(dir, 'method'));
      writeFileSync(join(dir, 'method', 'etapes.yml'), text.replace(/(\n {6}- id: integration\n)/, `\n${ajout}$1`));
      const out = buildProcessShow(validateEtapes(loadCatalog(megaCity), loadEtapesDoc(dir)), configShowData(fixture));
      const sprint = out.skills.find((s) => s.id === 'ezk-sprint');
      expect(sprint?.etapes.map((e) => e.id).slice(-2)).toEqual(['checkpoint', 'integration']);
      expect(sprint?.etapes.at(-2)?.num).toBe(8);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('buildProcessShow — une déclaration non validée', () => {
  it('refuse un réglage inconnu plutôt que de sortir une valeur inventée', () => {
    const fixture = makeContractFixture();
    try {
      expect(() => buildProcessShow(doc({ reglages: ['inconnu'] }), configShowData(fixture))).toThrow(/n’a pas été validée/);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
});

describe('method/etapes.yml — la vraie déclaration', () => {
  let fixture: string;
  beforeAll(() => {
    fixture = makeContractFixture();
  });
  afterAll(() => rmSync(fixture, { recursive: true, force: true }));

  it('déclarées : les quatre skills dans l’ordre, leurs étapes, et la boucle rétro → backlog', () => {
    const out = processShowData(fixture);
    expect(out.skills.map((s) => [s.id, s.etapes.map((e) => e.id)])).toEqual([
      ['ezk-backlog', ['capturer', 'groomer', 'prete', 'tirer-un-lot']],
      ['ezk-sprint', ['cadrage', 'archi', 'scenarios', 'code', 'gate', 'e2e', 'revue-adverse', 'integration']],
      ['ezk-retro', ['cadrer', 'round-robin', 'juge', 'rangement-po']],
      ['ezk-archive', ['portier', 'cloture']],
    ]);
    expect(out.liens).toContainEqual(expect.objectContaining({ de: 'ezk-retro', vers: 'ezk-backlog' }));
  });

  it('l’archive est un outil, hors du flux : aucun lien n’y mène, et les quatre boucles internes sont publiées', () => {
    const out = processShowData(fixture);
    expect(out.skills.filter((s) => s.outil).map((s) => s.id)).toEqual(['ezk-archive']);
    expect(out.liens.some((l) => l.de === 'ezk-archive' || l.vers === 'ezk-archive')).toBe(false);
    expect(out.boucles.map((b) => [b.de, b.vers])).toEqual([
      ['ezk-sprint:gate', 'ezk-sprint:code'],
      ['ezk-sprint:revue-adverse', 'ezk-sprint:code'],
      ['ezk-sprint:integration', 'ezk-sprint:cadrage'],
      ['ezk-sprint:integration', 'ezk-backlog:tirer-un-lot'],
    ]);
  });

  it('règles : les rattachements de départ sont publiés, et chaque règle citée existe au catalogue', () => {
    const out = processShowData(fixture);
    const regles = (skill: string, etape: string): string[] =>
      out.skills.find((s) => s.id === skill)?.etapes.find((e) => e.id === etape)?.regles ?? [];
    expect(regles('ezk-sprint', 'gate')).toEqual(['agent-ops/pipe-garde-le-code-de-sortie', 'testing/sortie-machine-verifiee-par-un-tuyau']);
    expect(regles('ezk-sprint', 'code')).toEqual(['clean-code/no-dead-code']);
    expect(regles('ezk-sprint', 'integration')).toEqual([
      'conventional-commits/format',
      'development/one-story-one-commit-local',
      'agent-ops/push-nomme-les-commits-d-autrui',
    ]);
    expect(regles('ezk-retro', 'rangement-po')).toEqual(['documentation-guidelines/readable-deliverable-trio']);
    const catalog = loadCatalog(megaCity);
    const all = out.skills.flatMap((s) => s.etapes.flatMap((e) => e.regles));
    expect(all.length).toBeGreaterThanOrEqual(15);
    for (const id of all) expect(catalog.rules.has(id)).toBe(true);
  });

  it('réglages : la revue adverse porte `review.adverse` et sa valeur pour le projet lu', () => {
    const revue = processShowData(fixture)
      .skills.find((s) => s.id === 'ezk-sprint')
      ?.etapes.find((e) => e.id === 'revue-adverse');
    expect(revue?.reglages).toEqual([{ cle: 'review.adverse', valeur: 'run' }]);
  });

  it('publiées : la sortie réelle respecte le schéma ; schéma et exemple rangés sont à jour', () => {
    expect(ProcessShowSchema.safeParse(processShowData(megaCity)).success).toBe(true);
    const example = JSON.parse(readFileSync(join(megaCity, PROCESS_SHOW_EXAMPLE_FILE), 'utf8'));
    expect(example).toEqual(JSON.parse(JSON.stringify(processShowData(fixture))));
    const schema = JSON.parse(readFileSync(join(megaCity, PROCESS_SHOW_SCHEMA_FILE), 'utf8'));
    expect(schema.properties.schema_version.const).toBe(1);
  });
});

describe('ezk process show — la commande', () => {
  let fixture: string;
  beforeAll(() => {
    fixture = makeContractFixture();
  });
  afterAll(() => rmSync(fixture, { recursive: true, force: true }));

  const run = (...args: string[]) =>
    spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'process-show.ts'), ...args], { encoding: 'utf8' });

  it('--json --root <projet> sort l’exemple rangé du contrat', () => {
    const r = run('--json', '--root', fixture);
    expect(r.status, r.stderr).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual(JSON.parse(readFileSync(join(megaCity, PROCESS_SHOW_EXAMPLE_FILE), 'utf8')));
  });

  it('sans --json : les skills et leurs étapes en clair, avec le réglage et sa valeur', () => {
    const r = run('--root', fixture);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toMatch(/^En clair : la méthode déroule 4 skills, 18 étapes\./);
    expect(r.stdout).toContain('ezk-sprint');
    expect(r.stdout).toMatch(/7\. Revue adverse .*review\.adverse = run/);
    expect(r.stdout).toMatch(/ezk-retro → ezk-backlog/);
  });

  it('une config de projet illisible sort en erreur qui nomme le fichier, code 1', () => {
    const root = mkdtempSync(join(tmpdir(), 'process-show-yaml-'));
    try {
      mkdirSync(join(root, '.vectorz'));
      writeFileSync(join(root, '.vectorz', 'config.yml'), 'review: [\n');
      const r = run('--root', root);
      expect(r.status).toBe(1);
      expect(r.stderr).toContain('config.yml');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('une option inconnue est refusée, jamais ignorée', () => {
    const r = run('--jsonn');
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/option inconnue/);
  });
});
