/**
 * board-contract-files — le schéma et l'exemple rangés pour les consommateurs du contrat
 * `ezk board show --json` (fiche 20261029112813308, ADR-086).
 *
 * Deux fichiers, tous deux GÉNÉRÉS, jamais écrits à la main :
 *   contracts/board-show/v1/schema.json   ← tiré du schéma zod (`core/board-contract.ts`)
 *   contracts/board-show/v1/example.json  ← la sortie de la commande sur la fixture ci-dessous
 *
 * La fixture est un faux projet : une fiche par cas que mission control lisait mal (enquête du
 * 2026-10-30), plus une parkée, une fiche sans version, un gel de version et deux pouces de revue.
 * Un consommateur teste son affichage sur l'exemple, sans lancer `ezk`.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { BOARD_SCHEMA_VERSION, BoardContractSchema } from '../core/board-contract.js';
import { boardShowData } from './board-show.js';

/** Le dossier du contrat, relatif à `products/mega-city`. */
export const CONTRACT_DIR = `contracts/board-show/v${BOARD_SCHEMA_VERSION}`;
export const SCHEMA_FILE = `${CONTRACT_DIR}/schema.json`;
export const EXAMPLE_FILE = `${CONTRACT_DIR}/example.json`;

/** La fiche de la fixture qui a une branche de travail ouverte. */
export const FIXTURE_EN_COURS = '20990101000000001';

const FIXTURE_FICHES: ReadonlyArray<[string, string]> = [
  ['features/20990101000000001_en-cours.md', 'id: "20990101000000001"\ntitle: En cours\npriority: P1\nstatus: ready\nversion: v1.0.0'],
  ['features/20990101000000002_deux-points.md', 'id: "20990101000000002"\ntitle: Tour Driver.js : tracking\npriority: P2\nstatus: idea\nversion: v2.0.0'],
  ['features/20990101000000003_bloquee.md', 'id: "20990101000000003"\ntitle: Bloquée\npriority: P1\nstatus: ready\nblocked: panel\nversion: v1.0.0'],
  ['features/done/20990101000000004_remplacee.md', 'id: "20990101000000004"\ntitle: Remplacée\npriority: P2\nstatus: superseded\nversion: v1.0.0'],
  ['features/20990101000000005_version-mal-ecrite.md', 'id: "20990101000000005"\ntitle: Version mal écrite\npriority: P3\nstatus: idea\nversion: V1.1'],
  ['features/done/20990101000000006_livree.md', 'id: "20990101000000006"\ntitle: Livrée\npriority: P2\nstatus: shipped\nversion: v1.0.0\nmilestone: board'],
  ['features/20990101000000007_parkee.md', 'id: "20990101000000007"\ntitle: Parkée\npriority: P3\nstatus: idea\nmilestone: parked'],
  ['features/20990101000000008_sans-version.md', 'id: "20990101000000008"\ntitle: Sans version\npriority: P2\nstatus: idea\nmilestone: board\nlabels: [contrat]'],
];

/**
 * Construit la fixture dans un dossier jetable : fiches, pouces de revue, un dépôt git, une branche
 * de travail pour la fiche « en cours » (ADR-0077) et un gel `freeze/v2.0.0`. Rend son chemin ; à
 * effacer par l'appelant (`rmSync(root, { recursive: true, force: true })`).
 */
export function makeBoardFixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'board-contract-'));
  const write = (file: string, text: string): void => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  };
  for (const [file, fm] of FIXTURE_FICHES) write(file, `---\n${fm}\n---\n\n## En clair\n\nFiche de fixture.\n`);
  write('features/reviews/verdicts/20990101000000002.json', '{\n  "verdict": "up",\n  "date": "2026-11-01"\n}\n');
  write('features/reviews/verdicts/20990101000000003.json', '{ illisible\n');
  const git = (...args: string[]): void => {
    execFileSync('git', ['-C', root, '-c', 'user.email=f@x', '-c', 'user.name=fixture', ...args], { stdio: 'ignore' });
  };
  git('init', '-q', '-b', 'main');
  git('add', '-A');
  git('commit', '-qm', 'fixture');
  git('tag', 'freeze/v2.0.0');
  // Une branche avec un commit que main n'a pas : la fiche est « en cours » (ADR-0077).
  git('checkout', '-qb', `feat/${FIXTURE_EN_COURS}-en-cours`);
  write('travail.txt', 'en cours\n');
  git('add', '-A');
  git('commit', '-qm', 'travail');
  git('checkout', '-q', 'main');
  return root;
}

/**
 * Retire les `additionalProperties: false` que zod pose sur ses objets stricts. Le schéma publié
 * tolère ainsi un champ ajouté (règle du README) ; les `additionalProperties` qui typent un
 * dictionnaire (`counts`, `verdicts`) restent.
 */
function tolerant(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(tolerant);
  if (typeof node !== 'object' || node === null) return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'additionalProperties' && value === false) continue;
    out[key] = tolerant(value);
  }
  return out;
}

/** Le texte de `schema.json` : le schéma JSON tiré du schéma zod, tolérant aux champs ajoutés. */
export function renderSchema(): string {
  return `${JSON.stringify(tolerant(z.toJSONSchema(BoardContractSchema)), null, 2)}\n`;
}

/**
 * Le texte de `example.json` : la sortie de la commande sur la fixture, au format de la commande.
 * `fixtureRoot` réutilise une fixture déjà construite ; sans lui, une fixture jetable est créée.
 */
export function renderExample(fixtureRoot?: string): string {
  const root = fixtureRoot ?? makeBoardFixture();
  try {
    return `${JSON.stringify(boardShowData(root), null, 1)}\n`;
  } finally {
    if (fixtureRoot === undefined) rmSync(root, { recursive: true, force: true });
  }
}

/** Les deux fichiers du contrat, chemin relatif à `products/mega-city` → texte attendu. */
export function renderContractFiles(fixtureRoot?: string): Record<string, string> {
  return { [SCHEMA_FILE]: renderSchema(), [EXAMPLE_FILE]: renderExample(fixtureRoot) };
}
