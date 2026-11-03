/**
 * Le contrat de `ezk law show` (fiche 20261101215342537, ADR-086).
 *
 * En clair : la commande dit, pour chaque règle du catalogue, où elle est rangée, qui l'applique et si
 * elle est vraiment installée. On le prouve sur un petit catalogue factice et des fichiers de loi
 * factices, jamais sur le vrai ~/.claude : les six portées sont couvertes, un fichier de loi absent est
 * signalé, une règle ajoutée apparaît tout de suite, et la sortie JSON passe un tuyau en entier.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  type LawObject,
  LawObjectSchema,
  type LawShow,
  LawShowSchema,
  buildLawObject,
  installedRuleIds,
  readsRulesAtStartup,
  renderLawObjectText,
  startupCommand,
  renderLawText,
} from '../core/law-show.js';
import {
  LAW_EXAMPLE_FILE,
  LAW_OBJECT_EXAMPLE_FILE,
  LAW_OBJECT_SCHEMA_FILE,
  LAW_SCHEMA_FILE,
  type LawFixture,
  makeLawFixture,
  renderLawContractFiles,
  writeLawFixtureFile,
} from '../io/law-contract-files.js';
import { globalLawPath, lawShowData, projectLawPath, readLawText } from '../io/law-show.js';
import { loadCatalog } from '../loaders/catalog.js';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

let fx: LawFixture;
let data: LawShow;

beforeAll(() => {
  fx = makeLawFixture();
  data = lawShowData(fx.catalogRoot, { target: fx.target, projectRoot: fx.projectRoot });
});
afterAll(() => rmSync(fx.dir, { recursive: true, force: true }));

const regle = (id: string) => data.regles.find((r) => r.id === id);
const objet = (id: string) => data.objets.find((o) => o.id === id);

describe('law show --json — la portée vraie', () => {
  it('sort schema_version 1 et respecte le schéma, sans champ en trop', () => {
    expect(data.schema_version).toBe(1);
    expect(LawShowSchema.safeParse(data).success).toBe(true);
  });

  it('range chaque règle dans la bonne portée, les six portées couvertes', () => {
    expect(regle('r/globale')?.portee).toBe('partout');
    expect(regle('r/projet')?.portee).toBe('projet');
    expect(regle('r/demarrage')?.portee).toBe('demarrage');
    expect(regle('r/citee')?.portee).toBe('citee');
    expect(regle('r/citee-bundle')?.portee).toBe('citee');
    expect(regle('r/rangee')?.portee).toBe('rangee');
    expect(regle('r/orpheline')?.portee).toBe('orpheline');
  });

  it('les six comptes somment au total', () => {
    const c = data.comptes;
    expect(c).toEqual({ total: 7, partout: 1, projet: 1, demarrage: 1, citee: 2, rangee: 1, orpheline: 1 });
    expect(c.partout + c.projet + c.demarrage + c.citee + c.rangee + c.orpheline).toBe(c.total);
  });

  it('dit qui applique chaque règle, en direct ou par un bundle, et qui la vérifie', () => {
    expect(regle('r/citee')?.appliqueePar).toEqual([
      { objet: 'agent:a1', via: 'direct' },
      { objet: 'skill:s1', via: 'direct' },
      { objet: 'skill:s2', via: 'bundle:b2' },
    ]);
    expect(regle('r/citee-bundle')?.appliqueePar).toEqual([{ objet: 'skill:s2', via: 'bundle:b2' }]);
    expect(regle('r/globale')?.verifieePar).toEqual(['a1']);
  });

  it('donne le niveau, la catégorie, le fichier, les bundles et les profils', () => {
    const r = regle('r/rangee');
    expect(r).toMatchObject({ niveau: 'MAY', categorie: 'r', bundles: ['b3'], profils: ['p1'] });
    expect(r?.fichier).toBe('products/mega-city/rules/r/rangee.md');
    expect(regle('r/orpheline')?.bundles).toEqual([]);
  });

  it('chaque objet porte son champ regles, avec le lien', () => {
    expect(objet('skill:s1')?.regles).toEqual([{ id: 'r/citee', via: 'direct' }]);
    expect(objet('skill:s2')?.regles).toEqual([
      { id: 'r/citee', via: 'bundle:b2' },
      { id: 'r/citee-bundle', via: 'bundle:b2' },
    ]);
    expect(objet('agent:a1')?.type).toBe('agent');
    expect(objet('agent:a1')?.regles).toEqual([{ id: 'r/citee', via: 'direct' }]);
    expect(objet('bundle:b3')).toEqual({
      id: 'bundle:b3',
      type: 'bundle',
      litSesRegles: false,
      regles: [{ id: 'r/rangee', via: 'direct' }],
    });
    expect(objet('profile:p1')?.regles.map((r) => r.id)).toEqual(['r/globale', 'r/projet', 'r/rangee']);
    expect(objet('profile:p1')?.regles[0]).toEqual({ id: 'r/globale', via: 'bundle:base' });
  });

  it('lit les lois installées et le dit', () => {
    expect(data.lois.globale.installee).toBe(true);
    expect(data.lois.projet.installee).toBe(true);
    expect(data.lois.globale.chemin).toBe(join(fx.target, 'rules', 'iamthelaw.md'));
    expect(data.lois.projet.chemin).toBe(join(fx.projectRoot, '.iamthelaw', 'ENTRY.md'));
  });
});

describe('law show — un fichier de loi absent est signalé, jamais compté zéro', () => {
  it('installee false, aucune règle partout ni projet, et le texte le dit', () => {
    const vide = mkdtempSync(join(tmpdir(), 'law-vide-'));
    try {
      const d = lawShowData(fx.catalogRoot, { target: vide, projectRoot: vide });
      expect(d.lois.globale.installee).toBe(false);
      expect(d.lois.projet.installee).toBe(false);
      expect(d.comptes.partout).toBe(0);
      expect(d.comptes.projet).toBe(0);
      expect(d.comptes.total).toBe(7);
      const texte = renderLawText(d);
      expect(texte).toContain('loi globale non installée');
      expect(texte).toContain('loi du projet non installée');
    } finally {
      rmSync(vide, { recursive: true, force: true });
    }
  });
});

describe('law show — jamais périmé', () => {
  it('une règle ajoutée au catalogue apparaît sans compiler le graphe', () => {
    writeLawFixtureFile(
      fx.catalogRoot,
      'rules/r/nouvelle.md',
      '---\nid: r/nouvelle\nkind: disposition\nlevel: MUST\n---\n\nTexte.\n',
    );
    try {
      const d = lawShowData(fx.catalogRoot, { target: fx.target, projectRoot: fx.projectRoot });
      expect(d.regles.find((r) => r.id === 'r/nouvelle')?.portee).toBe('orpheline');
      expect(d.comptes.total).toBe(8);
    } finally {
      rmSync(join(fx.catalogRoot, 'rules', 'r', 'nouvelle.md'));
    }
  });
});

describe('law show — le texte', () => {
  it('ouvre par « En clair » avec les six comptes, puis liste les règles citées avec leur source', () => {
    const texte = renderLawText(data);
    expect(texte.split('\n')[0]).toBe(
      "En clair : 7 règles. 1 lues partout, 1 lues dans ce projet seulement, 1 lues au démarrage du skill ou de l'agent qui les cite, 2 citées sans être installées, 1 rangées sans effet, 1 orphelines.",
    );
    expect(texte).toContain('r/citee');
    expect(texte).toContain('agent:a1');
    expect(texte).toContain('skill:s1');
    expect(texte).toContain('r/citee-bundle');
    expect(texte).toContain('skill:s2 (via bundle:b2)');
    expect(texte).not.toContain('r/rangee');
    expect(texte).not.toContain('r/globale');
  });
});

describe('law show — la commande', () => {
  const run = (args: string[]) =>
    spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'law-show.ts'), ...args], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });

  it('--json dans un tuyau : le JSON complet se lit, sur le vrai catalogue', () => {
    const vide = mkdtempSync(join(tmpdir(), 'law-cible-'));
    try {
      const r = run(['--json', '--target', vide, '--root', fx.projectRoot]);
      expect(r.status).toBe(0);
      const sortie = JSON.parse(r.stdout) as LawShow;
      expect(LawShowSchema.safeParse(sortie).success).toBe(true);
      expect(sortie.comptes.total).toBe(loadCatalog(megaCity).rules.size);
      expect(sortie.lois.globale.installee).toBe(false);
    } finally {
      rmSync(vide, { recursive: true, force: true });
    }
  });

  it('--root désigne le projet dont on lit la loi', () => {
    const cible = mkdtempSync(join(tmpdir(), 'law-cible-'));
    const projet = mkdtempSync(join(tmpdir(), 'law-projet-'));
    try {
      mkdirSync(join(projet, '.iamthelaw'));
      writeFileSync(join(projet, '.iamthelaw', 'ENTRY.md'), '## clean-code/no-dead-code  `[MUST]`\n\n- x\n');
      const r = run(['--json', '--target', cible, '--root', projet]);
      expect(r.status).toBe(0);
      const sortie = JSON.parse(r.stdout) as LawShow;
      expect(sortie.lois.projet.chemin).toBe(join(projet, '.iamthelaw', 'ENTRY.md'));
      expect(sortie.regles.find((x) => x.id === 'clean-code/no-dead-code')?.portee).toBe('projet');
      expect(sortie.comptes.projet).toBe(1);
    } finally {
      rmSync(cible, { recursive: true, force: true });
      rmSync(projet, { recursive: true, force: true });
    }
  });

  it('sans --json, ouvre par « En clair »', () => {
    const cible = mkdtempSync(join(tmpdir(), 'law-cible-'));
    try {
      const r = run(['--target', cible, '--root', fx.projectRoot]);
      expect(r.status).toBe(0);
      expect(r.stdout.startsWith('En clair : ')).toBe(true);
    } finally {
      rmSync(cible, { recursive: true, force: true });
    }
  });
});

describe('law show — schéma et exemple rangés', () => {
  it('sont à jour avec le schéma zod et la sortie sur la fixture', () => {
    const files = renderLawContractFiles();
    expect(readFileSync(join(megaCity, LAW_SCHEMA_FILE), 'utf8')).toBe(files[LAW_SCHEMA_FILE]);
    expect(readFileSync(join(megaCity, LAW_EXAMPLE_FILE), 'utf8')).toBe(files[LAW_EXAMPLE_FILE]);
  });

  it('l’exemple respecte le schéma zod', () => {
    const exemple = JSON.parse(readFileSync(join(megaCity, LAW_EXAMPLE_FILE), 'utf8'));
    expect(LawShowSchema.safeParse(exemple).success).toBe(true);
  });

  it('le contrat des règles d’un objet est à jour, et son exemple respecte le schéma', () => {
    const files = renderLawContractFiles();
    expect(readFileSync(join(megaCity, LAW_OBJECT_SCHEMA_FILE), 'utf8')).toBe(files[LAW_OBJECT_SCHEMA_FILE]);
    expect(readFileSync(join(megaCity, LAW_OBJECT_EXAMPLE_FILE), 'utf8')).toBe(files[LAW_OBJECT_EXAMPLE_FILE]);
    expect(LawObjectSchema.safeParse(JSON.parse(files[LAW_OBJECT_EXAMPLE_FILE] as string)).success).toBe(true);
  });

  it('le schéma publié déclare le champ regles de chaque objet et tolère un champ ajouté', () => {
    const schema = JSON.stringify(JSON.parse(readFileSync(join(megaCity, LAW_SCHEMA_FILE), 'utf8')));
    expect(schema).toContain('"regles"');
    expect(schema).not.toContain('"additionalProperties":false');
  });
});

describe('law show — une règle installée est un vrai titre, jamais une ligne de bloc de code', () => {
  it('ignore un « ## <id> » dans un bloc de code clôturé', () => {
    const texte = '## real/rule  `[MUST]`\n\n```md\n## fake/rule\n```\n\n~~~\n## autre/fake\n~~~\n\n## after/rule\n';
    expect([...installedRuleIds(texte)]).toEqual(['real/rule', 'after/rule']);
  });
});

describe('law show — les règles héritées par extends', () => {
  it('une règle d’un bundle parent rejoint le bundle enfant et les profils qui en héritent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'law-extends-'));
    try {
      const write = (rel: string, text: string) => writeLawFixtureFile(join(dir, 'catalog'), rel, text);
      write('rules/r/heritee.md', '---\nid: r/heritee\nkind: disposition\nlevel: MUST\n---\n\nTexte.\n');
      write('bundles/parent.yml', 'id: parent\nrules:\n  - r/heritee\n');
      write('bundles/enfant.yml', 'id: enfant\nextends: [parent]\nrules: []\n');
      write('profiles/socle.yml', 'id: socle\nbundles: [enfant]\nagents: []\nskills: []\n');
      write('profiles/poste.yml', 'id: poste\nextends: [socle]\nbundles: []\nagents: []\nskills: []\n');
      const out = lawShowData(join(dir, 'catalog'), { target: join(dir, 'claude'), projectRoot: join(dir, 'projet') });
      const regle = out.regles.find((r) => r.id === 'r/heritee');
      expect(regle?.profils).toEqual(['poste', 'socle']);
      const ids = (id: string) => out.objets.find((o) => o.id === id)?.regles.map((l) => l.id) ?? [];
      expect(ids('bundle:enfant')).toContain('r/heritee');
      expect(ids('profile:socle')).toContain('r/heritee');
      expect(ids('profile:poste')).toContain('r/heritee');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('law show <objet> — les règles d’un skill ou d’un agent (fiche 20261102103553108)', () => {
  const input = () => ({
    catalog: loadCatalog(fx.catalogRoot),
    globale: readLawText(globalLawPath(fx.target)),
    projet: readLawText(projectLawPath(fx.projectRoot)),
  });

  it('un skill qui ouvre par sa commande lit ses règles ; les autres non', () => {
    expect(objet('skill:s3')?.litSesRegles).toBe(true);
    expect(objet('skill:s1')?.litSesRegles).toBe(false);
    expect(objet('agent:a1')?.litSesRegles).toBe(false);
    expect(objet('profile:p1')?.litSesRegles).toBe(false);
  });

  it('donne le texte complet d’une règle non installée, une ligne pour une règle installée', () => {
    const view = buildLawObject(input(), 'skill:s3') as LawObject;
    expect(LawObjectSchema.safeParse(view).success).toBe(true);
    expect(view.regles).toEqual([
      { id: 'r/demarrage', titre: 'Règle r/demarrage', niveau: 'MUST', via: 'direct', installee: null, texte: 'Texte de r/demarrage.' },
      { id: 'r/globale', titre: 'Règle r/globale', niveau: 'MUST', via: 'direct', installee: 'partout', texte: null },
    ]);
    const texte = renderLawObjectText(view);
    expect(texte.split('\n')[0]).toBe(
      'En clair : skill:s3 applique 2 règle(s). 1 sont déjà dans ta loi, 1 sont à lire ci-dessous.',
    );
    expect(texte).toContain('- r/globale — Règle r/globale (lue partout)');
    expect(texte).toContain('## r/demarrage  `[MUST]`\n\nTexte de r/demarrage.');
    expect(texte).not.toContain('Texte de r/globale');
  });

  it('un objet inconnu, un bundle ou un profil : rien', () => {
    expect(buildLawObject(input(), 'skill:inconnu')).toBeNull();
    expect(buildLawObject(input(), 'bundle:b3')).toBeNull();
    expect(buildLawObject(input(), 'profile:p1')).toBeNull();
  });

  it('la commande doit nommer CET objet, désigner le projet et être entre accents graves', () => {
    expect(readsRulesAtStartup(`Lis : \`${startupCommand('skill:s3')}\`.`, 'skill:s3')).toBe(true);
    expect(readsRulesAtStartup(`Lis : \`${startupCommand('skill:s3')}\`.`, 'skill:s1')).toBe(false);
    expect(readsRulesAtStartup(`Lis : ${startupCommand('skill:s3')}`, 'skill:s3')).toBe(false);
    // Sans --root, la commande refuse de tourner dans un projet hôte : elle ne compte pas.
    expect(readsRulesAtStartup('Lis : `ezk law show skill:s3`.', 'skill:s3')).toBe(false);
  });
});

describe('law show <objet> — la commande, sur le vrai catalogue', () => {
  const run = (args: string[]) =>
    spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'law-show.ts'), ...args], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  let vide: string;
  beforeAll(() => {
    vide = mkdtempSync(join(tmpdir(), 'law-cible-'));
  });
  afterAll(() => rmSync(vide, { recursive: true, force: true }));

  it('skill:ezk-sprint sans loi installée : le texte complet de ses règles, dont celle du worktree dédié', () => {
    const r = run(['skill:ezk-sprint', '--target', vide, '--root', fx.projectRoot]);
    expect(r.status).toBe(0);
    expect(r.stdout.startsWith('En clair : skill:ezk-sprint applique ')).toBe(true);
    expect(r.stdout).toContain('## development/story-dans-un-worktree-dedie  `[');
  });

  it('--json : la même liste, conforme au contrat', () => {
    const r = run(['skill:ezk-sprint', '--json', '--target', vide, '--root', fx.projectRoot]);
    expect(r.status).toBe(0);
    const view = JSON.parse(r.stdout) as LawObject;
    expect(LawObjectSchema.safeParse(view).success).toBe(true);
    expect(view.regles.find((x) => x.id === 'development/story-dans-un-worktree-dedie')?.texte).toBeTruthy();
  });

  it('un objet inconnu sort en erreur, sans rien sur la sortie', () => {
    const r = run(['skill:inconnu', '--target', vide, '--root', fx.projectRoot]);
    expect(r.status).toBe(1);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain('objet inconnu « skill:inconnu »');
  });

  it('un bundle ou un profil est refusé, jamais ignoré en silence', () => {
    for (const objet of ['bundle:base', 'profile:global']) {
      const r = run([objet, '--target', vide, '--root', fx.projectRoot]);
      expect(r.status).toBe(1);
      expect(r.stdout).toBe('');
      expect(r.stderr).toContain(`objet inconnu « ${objet} »`);
    }
  });
});

describe('law show — chaque skill et chaque agent qui déclare des règles les lit au démarrage (fiche 20261102103553108)', () => {
  const catalog = loadCatalog(megaCity);
  /** L'ouverture d'un texte : tout ce qui précède sa première section `## `. */
  const opening = (texte: string): string => texte.split(/\n## /)[0] as string;

  it('la ligne « ezk law show <objet> » ouvre chaque objet qui déclare des règles', () => {
    const declarants = [
      ...[...catalog.skills.values()].filter((s) => (s.applies ?? []).length > 0).map((s) => ({ objet: `skill:${s.id}`, texte: s.content })),
      ...[...catalog.agents.values()].filter((a) => a.interactions.length > 0).map((a) => ({ objet: `agent:${a.id}`, texte: a.role })),
    ];
    expect(declarants.length).toBeGreaterThan(0);
    expect(declarants.filter((d) => !readsRulesAtStartup(opening(d.texte), d.objet)).map((d) => d.objet)).toEqual([]);
  });

  it('aucune règle n’est citée sans être lue', () => {
    const vide = mkdtempSync(join(tmpdir(), 'law-cible-'));
    try {
      expect(lawShowData(megaCity, { target: vide, projectRoot: fx.projectRoot }).comptes.citee).toBe(0);
    } finally {
      rmSync(vide, { recursive: true, force: true });
    }
  });
});
