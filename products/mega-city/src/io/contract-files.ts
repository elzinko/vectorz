/**
 * contract-files — les schémas et les exemples rangés pour les consommateurs des contrats JSON de la
 * méthode (ADR-086) : `ezk board show --json` (fiche 20261029112813308) et `ezk backlog show --json`
 * (fiche 20261031160441267).
 *
 * Tous GÉNÉRÉS, jamais écrits à la main (`pnpm board:contract --write`) :
 *   contracts/board-show/v1/schema.json, example.json
 *   contracts/backlog-show/v1/schema.json, example.json            ← la liste, sans id
 *   contracts/backlog-show/v1/fiche.schema.json, fiche.example.json ← une fiche, avec son id
 * Chaque schéma est tiré du schéma zod ; chaque exemple est la sortie de la commande sur la fixture.
 *
 * La fixture est un faux projet : une fiche par cas que mission control lisait mal (enquête du
 * 2026-10-30), plus une parkée, une fiche sans version, un gel de version, deux pouces de revue, et
 * des corps de fiche qui exercent le découpage en sections (bloc de code, « en clair » en ligne, CRLF).
 * Un consommateur teste son affichage sur les exemples, sans lancer `ezk`.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { BOARD_SCHEMA_VERSION, BoardContractSchema } from '../core/board-contract.js';
import { BACKLOG_SCHEMA_VERSION, BacklogShowFicheSchema, BacklogShowListeSchema } from '../core/fiche-detail.js';
import { backlogShowFiche, backlogShowListe } from './backlog-show.js';
import { boardShowData } from './board-show.js';

/** Les fichiers rangés, chemins relatifs à `products/mega-city`. */
const BOARD_DIR = `contracts/board-show/v${BOARD_SCHEMA_VERSION}`;
export const BOARD_SCHEMA_FILE = `${BOARD_DIR}/schema.json`;
export const BOARD_EXAMPLE_FILE = `${BOARD_DIR}/example.json`;
const BACKLOG_DIR = `contracts/backlog-show/v${BACKLOG_SCHEMA_VERSION}`;
export const BACKLOG_SCHEMA_FILE = `${BACKLOG_DIR}/schema.json`;
export const BACKLOG_EXAMPLE_FILE = `${BACKLOG_DIR}/example.json`;
export const BACKLOG_FICHE_SCHEMA_FILE = `${BACKLOG_DIR}/fiche.schema.json`;
export const BACKLOG_FICHE_EXAMPLE_FILE = `${BACKLOG_DIR}/fiche.example.json`;

/** La fiche de la fixture qui a une branche de travail ouverte. */
export const FIXTURE_EN_COURS = '20990101000000001';
/** La fiche de la fixture au corps complet, qui sert d'exemple à `ezk backlog show <id> --json`. */
export const FIXTURE_DETAIL = '20990101000000002';
/** La fiche de la fixture écrite avec des fins de ligne CRLF. */
export const FIXTURE_CRLF = '20990101000000008';

const DEFAULT_BODY = '## En clair\n\nFiche de fixture.\n';

/** Un corps qui exerce le découpage en sections : bloc de code, critère sur deux lignes. */
const DETAIL_BODY = [
  '## En clair',
  '',
  'Le tour guidé suit les clics.',
  '',
  '## Contexte / Problème',
  '',
  'Avant le bloc.',
  '',
  '```sh',
  '## installe',
  'echo hi',
  '```',
  '',
  'Après le bloc.',
  '',
  '## Critères d’acceptation',
  '',
  '- [x] Le premier critère est fait',
  '- [ ] Le second critère tient',
  '      sur deux lignes',
  '',
  '## Comment vérifier',
  '',
  '```bash',
  'pnpm test',
  '```',
  '',
].join('\n');

interface FixtureFiche {
  file: string;
  frontMatter: string;
  /** Le corps ; `DEFAULT_BODY` si absent. */
  body?: string;
  /** Écrire la fiche avec des fins de ligne CRLF. */
  crlf?: boolean;
}

const FIXTURE_FICHES: readonly FixtureFiche[] = [
  { file: 'features/20990101000000001_en-cours.md', frontMatter: 'id: "20990101000000001"\ntitle: En cours\npriority: P1\nstatus: ready\nversion: v1.0.0' },
  { file: 'features/20990101000000002_deux-points.md', frontMatter: 'id: "20990101000000002"\ntitle: Tour Driver.js : tracking\npriority: P2\nstatus: idea\nversion: v2.0.0', body: DETAIL_BODY },
  { file: 'features/20990101000000003_bloquee.md', frontMatter: 'id: "20990101000000003"\ntitle: Bloquée\npriority: P1\nstatus: ready\nblocked: panel\nversion: v1.0.0' },
  { file: 'features/done/20990101000000004_remplacee.md', frontMatter: 'id: "20990101000000004"\ntitle: Remplacée\npriority: P2\nstatus: superseded\nversion: v1.0.0' },
  { file: 'features/20990101000000005_version-mal-ecrite.md', frontMatter: 'id: "20990101000000005"\ntitle: Version mal écrite\npriority: P3\nstatus: idea\nversion: V1.1', body: '**En clair.** La version est mal écrite.\n\n## Notes\n\nRien.\n' },
  { file: 'features/done/20990101000000006_livree.md', frontMatter: 'id: "20990101000000006"\ntitle: Livrée\npriority: P2\nstatus: shipped\nversion: v1.0.0\nmilestone: board' },
  { file: 'features/20990101000000007_parkee.md', frontMatter: 'id: "20990101000000007"\ntitle: Parkée\npriority: P3\nstatus: idea\nmilestone: parked' },
  { file: 'features/20990101000000008_sans-version.md', frontMatter: 'id: "20990101000000008"\ntitle: Sans version\npriority: P2\nstatus: idea\nmilestone: board\nlabels: [contrat]', crlf: true },
];

/**
 * Construit la fixture dans un dossier jetable : fiches, pouces de revue, un dépôt git, une branche
 * de travail pour la fiche « en cours » (ADR-0077) et un gel `freeze/v2.0.0`. Rend son chemin ; à
 * effacer par l'appelant (`rmSync(root, { recursive: true, force: true })`).
 */
export function makeContractFixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'contract-fixture-'));
  const write = (file: string, text: string): void => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  };
  for (const f of FIXTURE_FICHES) {
    const text = `---\n${f.frontMatter}\n---\n\n${f.body ?? DEFAULT_BODY}`;
    write(f.file, f.crlf ? text.replace(/\n/g, '\r\n') : text);
  }
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

/** Le texte d'un `schema.json` : le schéma JSON tiré du schéma zod, tolérant aux champs ajoutés. */
const schemaText = (schema: z.ZodType): string => `${JSON.stringify(tolerant(z.toJSONSchema(schema)), null, 2)}\n`;

/** Le texte d'un exemple : au format de la commande (`JSON.stringify(…, null, 1)`). */
const exampleText = (data: unknown): string => `${JSON.stringify(data, null, 1)}\n`;

/**
 * Les fichiers des contrats, chemin relatif à `products/mega-city` → texte attendu. `fixtureRoot`
 * réutilise une fixture déjà construite ; sans lui, une fixture jetable est créée puis effacée.
 */
export function renderContractFiles(fixtureRoot?: string): Record<string, string> {
  const root = fixtureRoot ?? makeContractFixture();
  try {
    return {
      [BOARD_SCHEMA_FILE]: schemaText(BoardContractSchema),
      [BOARD_EXAMPLE_FILE]: exampleText(boardShowData(root)),
      [BACKLOG_SCHEMA_FILE]: schemaText(BacklogShowListeSchema),
      [BACKLOG_EXAMPLE_FILE]: exampleText(backlogShowListe(root)),
      [BACKLOG_FICHE_SCHEMA_FILE]: schemaText(BacklogShowFicheSchema),
      [BACKLOG_FICHE_EXAMPLE_FILE]: exampleText(backlogShowFiche(root, FIXTURE_DETAIL)),
    };
  } finally {
    if (fixtureRoot === undefined) rmSync(root, { recursive: true, force: true });
  }
}
