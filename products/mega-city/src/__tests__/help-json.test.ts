/**
 * Le contrat de `ezk help --json` (fiche 20261114131613129, ADR-086).
 *
 * En clair : la méthode publie son annuaire — chaque commande de terminal avec son étage, chaque
 * compétence, chaque agent — dans une sortie versionnée qu'un écran lit sans relire un seul fichier
 * de la méthode. On le prouve sur un petit catalogue factice (rangement, dérogation, oubli, ajout)
 * puis sur le vrai dépôt : la sortie compte autant de commandes que le manifeste et que `ezk help`
 * texte, et ses compétences et agents portent les valeurs que la carte sert déjà.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { parseManifest } from '../core/ezk-cli.js';
import { type HelpJson, HelpJsonSchema, buildHelpJson, sousCommandes } from '../core/help-json.js';
import type { MapData } from '../core/map-data.js';
import { placeCommandes } from '../core/taxonomie.js';
import { DATA_VIEWS } from '../io/derived-views.js';
import {
  HELP_EXAMPLE_FILE,
  HELP_SCHEMA_FILE,
  type HelpFixture,
  makeHelpFixture,
  readFixtureManifest,
  renderHelpContractFiles,
  writeHelpFixtureFile,
} from '../io/help-contract-files.js';
import { helpJsonData } from '../io/help-json.js';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = realpathSync(resolve(megaCity, '..', '..'));
const launcher = join(megaCity, 'bin', 'ezk.mjs');

const COMMANDS = [{ domain: 'demo', verb: 'show' }, { domain: 'demo', verb: 'ship' }, { domain: 'pr' }];

describe('placeCommandes — chaque commande du manifeste a un étage', () => {
  it('range par domaine, une commande précise peut dévier de son domaine', () => {
    const placed = placeCommandes(COMMANDS, {
      etages: {},
      commandes: { demo: 'methode', 'demo ship': 'librairie', pr: 'modules/github' },
    });
    expect(placed).toEqual({
      'demo show': { etage: 'methode' },
      'demo ship': { etage: 'librairie' },
      pr: { etage: 'modules', famille: 'github' },
    });
  });

  it('une commande du manifeste absente de la taxonomie fait échouer la validation', () => {
    expect(() => placeCommandes(COMMANDS, { etages: {}, commandes: { demo: 'methode' } })).toThrow(
      /commande « pr » sans étage/,
    );
    expect(() => placeCommandes(COMMANDS, { etages: {} })).toThrow(/sans étage/);
  });

  it('refuse une clé qui ne nomme ni un domaine ni une commande du manifeste', () => {
    expect(() =>
      placeCommandes(COMMANDS, { etages: {}, commandes: { demo: 'methode', pr: 'librairie', fantome: 'methode' } }),
    ).toThrow(/inconnu « fantome »/);
  });

  it('refuse un étage ou une famille qui n’existe pas', () => {
    expect(() => placeCommandes(COMMANDS, { etages: {}, commandes: { demo: 'hote', pr: 'methode' } })).toThrow(
      /étage inconnu « hote »/,
    );
    expect(() =>
      placeCommandes(COMMANDS, { etages: {}, commandes: { demo: 'modules/jira', pr: 'methode' } }),
    ).toThrow(/étage inconnu « modules\/jira »/);
  });
});

describe('sousCommandes — l’argument-hint découpé', () => {
  it('prend le premier groupe de noms séparés par « | »', () => {
    expect(sousCommandes('[help|fix|check] [PR]')).toEqual(['help', 'fix', 'check']);
    expect(sousCommandes('[help|run|status] [--mode manuel|auto] [--once]')).toEqual(['help', 'run', 'status']);
  });

  it('rend une liste vide quand l’argument-hint ne nomme pas de sous-commandes', () => {
    expect(sousCommandes('<vX.Y.Z>')).toEqual([]);
    expect(sousCommandes('[chemin-projet=.]')).toEqual([]);
    expect(sousCommandes('')).toEqual([]);
  });
});

describe('buildHelpJson — les trois listes, sans relation', () => {
  const manifest = parseManifest(`
commands:
  - domain: demo
    verb: show
    run: bin/demo.ts show
    summary: Montre la démo.
    root: none
  - domain: pr
    run: bin/pr.ts "{root}"
    summary: Écrit une PR.
    root: cwd
    project: true
    writes: true
    deprecated: demo show
`);
  const carte: Pick<MapData, 'skills' | 'agents'> = {
    skills: {
      s1: {
        id: 's1',
        source: 'products/mega-city/skills/s1/SKILL.md',
        description: 'Fait s1.',
        usage: '[help|run]',
        etage: 'modules',
        famille: 'techno',
        composes: ['s2'],
        composesExternal: [],
        roles: ['a1'],
        composedBy: [],
        tools: [],
        profiles: [],
      },
    },
    agents: {
      a1: {
        id: 'a1',
        description: 'Agent a1.',
        etage: 'methode',
        model: 'opus',
        effort: 'high',
        competences: ['s1'],
        interactions: ['r/x'],
        convokedBy: ['s1'],
        profiles: [],
      },
    },
  };
  const json = buildHelpJson(manifest, carte, { etages: {}, commandes: { demo: 'methode', pr: 'modules/github' } });

  it('sort schema_version 1 et respecte le schéma, sans champ en trop', () => {
    expect(json.schema_version).toBe(1);
    expect(HelpJsonSchema.safeParse(json).success).toBe(true);
  });

  it('une commande porte ses champs du manifeste, son étage et sa famille', () => {
    expect(json.commandes).toEqual([
      {
        domaine: 'demo',
        verbe: 'show',
        enClair: 'Montre la démo.',
        script: 'bin/demo.ts show',
        racine: 'none',
        projet: false,
        ecritLeProjet: false,
        deprecie: null,
        etage: 'methode',
        famille: null,
      },
      {
        domaine: 'pr',
        verbe: null,
        enClair: 'Écrit une PR.',
        script: 'bin/pr.ts "{root}"',
        racine: 'cwd',
        projet: true,
        ecritLeProjet: true,
        deprecie: 'demo show',
        etage: 'modules',
        famille: 'github',
      },
    ]);
  });

  it('une compétence et un agent portent les valeurs de la carte', () => {
    expect(json.skills).toEqual([
      {
        id: 's1',
        description: 'Fait s1.',
        sousCommandes: ['help', 'run'],
        fichier: 'products/mega-city/skills/s1/SKILL.md',
        etage: 'modules',
        famille: 'techno',
      },
    ]);
    expect(json.agents).toEqual([
      { id: 'a1', description: 'Agent a1.', fichier: null, etage: 'methode', famille: null, modele: 'opus', effort: 'high' },
    ]);
  });

  it('aucune relation (composes, roles, applies, competences) ne figure dans le contrat', () => {
    const text = JSON.stringify(json);
    for (const relation of ['composes', 'roles', 'applies', 'competences', 'interactions', 'convokedBy']) {
      expect(text).not.toContain(`"${relation}"`);
    }
  });
});

describe('helpJsonData — rien n’est codé en dur (catalogue factice)', () => {
  let fx: HelpFixture;
  beforeAll(() => {
    fx = makeHelpFixture();
  });
  afterAll(() => rmSync(fx.dir, { recursive: true, force: true }));

  const data = (): HelpJson => helpJsonData(readFixtureManifest(fx), fx.megaCity, fx.repoRoot);

  it('lit le manifeste, les compétences, les agents et la taxonomie du catalogue visé', () => {
    const d = data();
    expect(HelpJsonSchema.safeParse(d).success).toBe(true);
    expect(d.commandes.map((c) => `${c.domaine} ${c.verbe ?? ''}`.trim())).toEqual(['demo show', 'demo ship', 'pr']);
    expect(d.skills.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(d.skills[0]?.fichier).toBe('products/mega-city/skills/s1/SKILL.md');
    expect(d.agents.map((a) => a.id)).toEqual(['a1']);
  });

  it('une commande ajoutée au manifeste, non rangée, fait échouer ; rangée, elle sort avec son étage', () => {
    const manifest = readFixtureManifest(fx);
    const added = { ...manifest, commands: [...manifest.commands, { domain: 'neuve', run: 'bin/n.ts', summary: 'Neuve.', root: 'none' as const }] };
    expect(() => helpJsonData(added, fx.megaCity, fx.repoRoot)).toThrow(/commande « neuve » sans étage/);
    const taxo = readFileSync(join(fx.megaCity, 'taxonomie.yml'), 'utf8');
    writeHelpFixtureFile(fx.megaCity, 'taxonomie.yml', `${taxo}  neuve: modules/observabilite\n`);
    const neuve = helpJsonData(added, fx.megaCity, fx.repoRoot).commandes.find((c) => c.domaine === 'neuve');
    expect(neuve).toMatchObject({ etage: 'modules', famille: 'observabilite' });
    writeHelpFixtureFile(fx.megaCity, 'taxonomie.yml', taxo);
  });

  it('une compétence ajoutée au dossier apparaît sans toucher au code', () => {
    writeHelpFixtureFile(fx.megaCity, 'skills/s3/SKILL.md', '---\nname: s3\ndescription: Neuve.\n---\n\nCorps.\n');
    const taxo = readFileSync(join(fx.megaCity, 'taxonomie.yml'), 'utf8');
    writeHelpFixtureFile(fx.megaCity, 'taxonomie.yml', taxo.replace('skills: [s1]', 'skills: [s1, s3]'));
    expect(data().skills.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
    rmSync(join(fx.megaCity, 'skills', 's3'), { recursive: true, force: true });
    writeHelpFixtureFile(fx.megaCity, 'taxonomie.yml', taxo);
  });
});

describe('contracts/help/v1 — le schéma et l’exemple publiés sont à jour', () => {
  it('les fichiers rangés égalent ce que le code produit (pnpm help:contract --write)', () => {
    const files = renderHelpContractFiles();
    expect(readFileSync(join(megaCity, HELP_SCHEMA_FILE), 'utf8')).toBe(files[HELP_SCHEMA_FILE]);
    expect(readFileSync(join(megaCity, HELP_EXAMPLE_FILE), 'utf8')).toBe(files[HELP_EXAMPLE_FILE]);
  });

  it('l’exemple respecte le schéma strict du producteur', () => {
    const exemple = JSON.parse(readFileSync(join(megaCity, HELP_EXAMPLE_FILE), 'utf8'));
    expect(HelpJsonSchema.safeParse(exemple).success).toBe(true);
  });
});

/** Exécute le fichier de données de la carte dans un faux `window`, comme le navigateur. */
function carteServie(): MapData {
  const carte = DATA_VIEWS.find((v) => v.id === 'carte');
  if (!carte) throw new Error('vue « carte » absente du registre DATA_VIEWS');
  const sandbox: { window: { EZK?: MapData } } = { window: {} };
  runInNewContext(carte.build(repoRoot), sandbox);
  if (!sandbox.window.EZK) throw new Error('le fichier de données ne pose pas window.EZK');
  return sandbox.window.EZK;
}

describe('ezk help --json sur le vrai dépôt', () => {
  let elsewhere: string;
  let out: HelpJson;
  let text: string;
  const ezk = (args: string[]) =>
    spawnSync(process.execPath, [launcher, ...args], {
      cwd: elsewhere,
      encoding: 'utf8',
      env: { PATH: '/usr/bin:/bin', HOME: elsewhere, EZK_NO_LAG_WARNING: '1' },
    });
  beforeAll(() => {
    elsewhere = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-help-json-')));
    const json = ezk(['help', '--json']);
    expect(json.status, json.stderr).toBe(0);
    out = JSON.parse(json.stdout);
    text = ezk(['help']).stdout;
  });
  afterAll(() => rmSync(elsewhere, { recursive: true, force: true }));

  it('sort le contrat et la sortie réelle le respecte', () => {
    expect(HelpJsonSchema.safeParse(out).success).toBe(true);
  });

  it('compte autant de commandes que le manifeste et que les commandes de terminal de « ezk help » texte', () => {
    const manifest = parseManifest(readFileSync(join(megaCity, 'ezk-manifest.yml'), 'utf8'));
    expect(out.commandes).toHaveLength(manifest.commands.length);
    const lines = text.split('\n');
    const start = lines.indexOf('Commandes de terminal') + 1;
    const terminal = lines.slice(start, lines.indexOf('', start));
    expect(out.commandes.filter((c) => c.deprecie === null)).toHaveLength(terminal.length);
  });

  it('chaque commande porte un étage, et une famille seulement pour un module', () => {
    for (const c of out.commandes) {
      expect(c.famille === null, `${c.domaine} ${c.verbe ?? ''}`).toBe(c.etage !== 'modules');
    }
  });

  it('les compétences et les agents portent les valeurs que la carte sert déjà', () => {
    const carte = carteServie();
    expect(out.skills.map((s) => s.id)).toEqual(Object.keys(carte.skills));
    expect(out.agents.map((a) => a.id)).toEqual(Object.keys(carte.agents));
    for (const s of out.skills) {
      const c = carte.skills[s.id];
      expect(s, s.id).toEqual({
        id: s.id,
        description: c?.description,
        sousCommandes: sousCommandes(c?.usage ?? ''),
        fichier: c?.source,
        etage: c?.etage,
        famille: c?.famille ?? null,
      });
    }
    for (const a of out.agents) {
      const c = carte.agents[a.id];
      expect(a, a.id).toEqual({
        id: a.id,
        description: c?.description,
        fichier: c?.source,
        etage: c?.etage,
        famille: c?.famille ?? null,
        modele: c?.model,
        effort: c?.effort,
      });
    }
  });

  it('refuse un sujet avec --json, code 2', () => {
    const r = ezk(['help', 'law', '--json']);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/--json/);
  });
});
