/**
 * help-contract-files — le schéma et l'exemple rangés pour les consommateurs de `ezk help --json`
 * (fiche 20261114131613129, ADR-086), et la fixture qui les produit.
 *
 * Tous GÉNÉRÉS, jamais écrits à la main (`pnpm help:contract --write`) :
 *   contracts/help/v1/schema.json   ← tiré du schéma zod
 *   contracts/help/v1/example.json  ← la sortie sur la fixture
 *
 * La fixture est un petit dépôt factice : un manifeste de trois commandes (une avec verbe, une qui
 * écrit le projet et dévie de son domaine, une sans verbe gardée sous un ancien nom), deux skills
 * (un module, un de la méthode) et un agent, rangés dans leur taxonomie.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { type Manifest, parseManifest } from '../core/ezk-cli.js';
import { HELP_SCHEMA_VERSION, HelpJsonSchema } from '../core/help-json.js';
import { tolerant } from './contract-files.js';
import { helpJsonData } from './help-json.js';

const HELP_DIR = `contracts/help/v${HELP_SCHEMA_VERSION}`;
export const HELP_SCHEMA_FILE = `${HELP_DIR}/schema.json`;
export const HELP_EXAMPLE_FILE = `${HELP_DIR}/example.json`;

const FIXTURE: Record<string, string> = {
  'ezk-manifest.yml': `commands:
  - domain: demo
    verb: show
    run: bin/demo.ts show
    summary: Montre la démo du projet.
    project: true
  - domain: demo
    verb: ship
    run: bin/demo.ts ship
    summary: Livre une fiche du dépôt où tu es.
    root: cwd
    project: true
    writes: true
  - domain: pr
    run: bin/pr.ts
    summary: Ancien nom de « demo show ».
    root: none
    deprecated: demo show
`,
  'taxonomie.yml': `etages:
  methode:
    skills: [s1]
    agents: [a1]
  modules:
    familles:
      github:
        skills: [s2]
commandes:
  demo: methode
  demo ship: librairie
  pr: modules/github
`,
  'skills/s1/SKILL.md': '---\nname: s1\ndescription: Conduit un sprint.\nargument-hint: "[help|start|close] [--lot N]"\n---\n\nCorps.\n',
  'skills/s2/SKILL.md': '---\nname: s2\ndescription: Adresse les retours de revue.\nargument-hint: "<PR>"\n---\n\nCorps.\n',
  'agents/a1.md': '---\nname: a1\ndescription: Développe en TDD.\nmodel: sonnet\neffort: medium\n---\n\nAgent de la fixture.\n',
};

export interface HelpFixture {
  /** Le dossier jetable qui contient tout : à effacer par l'appelant. */
  dir: string;
  /** La racine du dépôt factice. */
  repoRoot: string;
  /** Son catalogue, à `products/mega-city` comme dans le vrai dépôt. */
  megaCity: string;
}

/** Écrit un fichier sous `root`, en créant les dossiers. */
export function writeHelpFixtureFile(root: string, rel: string, text: string): void {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
}

/** Construit la fixture dans un dossier jetable. `rmSync(dir, { recursive: true, force: true })` pour l'effacer. */
export function makeHelpFixture(): HelpFixture {
  const dir = mkdtempSync(join(tmpdir(), 'help-fixture-'));
  const fixture = { dir, repoRoot: dir, megaCity: join(dir, 'products', 'mega-city') };
  for (const [rel, text] of Object.entries(FIXTURE)) writeHelpFixtureFile(fixture.megaCity, rel, text);
  return fixture;
}

export function readFixtureManifest(fixture: HelpFixture): Manifest {
  return parseManifest(readFileSync(join(fixture.megaCity, 'ezk-manifest.yml'), 'utf8'));
}

/** Les fichiers du contrat, chemin relatif à `products/mega-city` → texte attendu. */
export function renderHelpContractFiles(): Record<string, string> {
  const fixture = makeHelpFixture();
  try {
    const data = helpJsonData(readFixtureManifest(fixture), fixture.megaCity, fixture.repoRoot);
    return {
      [HELP_SCHEMA_FILE]: `${JSON.stringify(tolerant(z.toJSONSchema(HelpJsonSchema)), null, 2)}\n`,
      [HELP_EXAMPLE_FILE]: `${JSON.stringify(data, null, 1)}\n`,
    };
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
}
