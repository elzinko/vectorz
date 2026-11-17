/**
 * contract-files — les schémas et les exemples rangés pour les consommateurs des contrats JSON de la
 * méthode (ADR-086) : `ezk board show --json` (fiche 20261029112813308), `ezk backlog show --json`
 * (fiche 20261031160441267) et `ezk config show --json`.
 *
 * Tous GÉNÉRÉS, jamais écrits à la main (`pnpm board:contract --write`) :
 *   contracts/board-show/v1/schema.json, example.json
 *   contracts/backlog-show/v1/schema.json, example.json            ← la liste, sans id
 *   contracts/backlog-show/v1/fiche.schema.json, fiche.example.json ← une fiche, avec son id
 *   contracts/config-show/v1/schema.json, example.json             ← la config résolue du projet
 *   contracts/board-process/v1/schema.json, example.json           ← chaque fiche sur son étape
 *   contracts/board-maps/v1/schema.json, example.json              ← les documents de la méthode
 *   contracts/process-show/v1/schema.json, example.json            ← les étapes fines de chaque skill
 *   contracts/graph-check/v1/schema.json, example.json             ← le graphe de la méthode, briques et liens
 * Chaque schéma est tiré du schéma zod ; chaque exemple est la sortie de la commande sur la fixture.
 * L'exemple de `ezk process show --json` porte les VRAIES étapes de `method/etapes.yml` (la fixture ne
 * donne que les réglages) : une étape ajoutée au fichier demande de régénérer l'exemple.
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
import { CONFIG_SCHEMA_VERSION, ConfigShowSchema } from '../core/config-contract.js';
import { MAPS_SCHEMA_VERSION, MapsContractSchema } from '../core/maps-contract.js';
import { PROCESS_SCHEMA_VERSION, ProcessContractSchema } from '../core/process-contract.js';
import { PROCESS_SHOW_SCHEMA_VERSION, ProcessShowSchema } from '../core/process-show.js';
import { GRAPH_CHECK_SCHEMA_VERSION, GraphCheckSchema } from '../core/graph-check.js';
import { BACKLOG_SCHEMA_VERSION, BacklogShowFicheSchema, BacklogShowListeSchema } from '../core/fiche-detail.js';
import { RECIPES_SCHEMA_VERSION, RecipesContractSchema, discover, recipesContract } from '../core/recipe-discovery.js';
import { backlogShowFiche, backlogShowListe } from './backlog-show.js';
import { boardProcessData } from './board-process.js';
import { boardShowData } from './board-show.js';
import { configShowData } from './config-show.js';
import { graphCheckExample } from './graph-check.js';
import { methodMapsData } from './method-maps.js';
import { processShowData } from './process-show.js';

/** Les fichiers rangés, chemins relatifs à `products/mega-city`. */
const BOARD_DIR = `contracts/board-show/v${BOARD_SCHEMA_VERSION}`;
export const BOARD_SCHEMA_FILE = `${BOARD_DIR}/schema.json`;
export const BOARD_EXAMPLE_FILE = `${BOARD_DIR}/example.json`;
const BACKLOG_DIR = `contracts/backlog-show/v${BACKLOG_SCHEMA_VERSION}`;
export const BACKLOG_SCHEMA_FILE = `${BACKLOG_DIR}/schema.json`;
export const BACKLOG_EXAMPLE_FILE = `${BACKLOG_DIR}/example.json`;
export const BACKLOG_FICHE_SCHEMA_FILE = `${BACKLOG_DIR}/fiche.schema.json`;
export const BACKLOG_FICHE_EXAMPLE_FILE = `${BACKLOG_DIR}/fiche.example.json`;
const CONFIG_DIR = `contracts/config-show/v${CONFIG_SCHEMA_VERSION}`;
export const CONFIG_SCHEMA_FILE = `${CONFIG_DIR}/schema.json`;
export const CONFIG_EXAMPLE_FILE = `${CONFIG_DIR}/example.json`;
const PROCESS_DIR = `contracts/board-process/v${PROCESS_SCHEMA_VERSION}`;
export const PROCESS_SCHEMA_FILE = `${PROCESS_DIR}/schema.json`;
export const PROCESS_EXAMPLE_FILE = `${PROCESS_DIR}/example.json`;
const MAPS_DIR = `contracts/board-maps/v${MAPS_SCHEMA_VERSION}`;
export const MAPS_SCHEMA_FILE = `${MAPS_DIR}/schema.json`;
export const MAPS_EXAMPLE_FILE = `${MAPS_DIR}/example.json`;
const RECIPES_DIR = `contracts/recipes/v${RECIPES_SCHEMA_VERSION}`;
export const RECIPES_SCHEMA_FILE = `${RECIPES_DIR}/schema.json`;
export const RECIPES_EXAMPLE_FILE = `${RECIPES_DIR}/example.json`;
const PROCESS_SHOW_DIR = `contracts/process-show/v${PROCESS_SHOW_SCHEMA_VERSION}`;
export const PROCESS_SHOW_SCHEMA_FILE = `${PROCESS_SHOW_DIR}/schema.json`;
export const PROCESS_SHOW_EXAMPLE_FILE = `${PROCESS_SHOW_DIR}/example.json`;
const GRAPH_CHECK_DIR = `contracts/graph-check/v${GRAPH_CHECK_SCHEMA_VERSION}`;
export const GRAPH_CHECK_SCHEMA_FILE = `${GRAPH_CHECK_DIR}/schema.json`;
export const GRAPH_CHECK_EXAMPLE_FILE = `${GRAPH_CHECK_DIR}/example.json`;

/**
 * L'exemple de `ezk recipes --json` part d'entrées écrites ici, pas de `recipes/` : l'exemple ne doit
 * pas changer à chaque recette ajoutée. Une recette complète, un brouillon, une recette de projet.
 */
const recipesExample = () =>
  recipesContract({
    methodRecipes: discover([
      {
        dir: 'recipes/lanceur-dev-universel.md',
        recipeMd:
          '---\nid: "20261001004228784"\ntitle: Lancer l\'app de n\'importe quelle branche\nmakes: Une commande unique qui lance l\'app de la branche voulue\nsource: tools/launcher\nstatus: draft\n---\n',
      },
      {
        dir: 'recipes/page-attente.md',
        recipeMd: '---\nid: "20260830104013705"\ntitle: Mailing list sur une page d\'attente\nmakes: Une page d\'attente qui collecte des emails\n---\n',
      },
    ]),
    projectRecipes: discover([
      {
        dir: 'apps/outil',
        recipeMd:
          '---\nid: "20261018110931402"\ntitle: Harnais de validation\nmakes: Une procédure de validation rejouable\nsource: apps/outil\nstatus: ready\n---\n',
      },
    ]),
  });

/**
 * La config de la fixture : chaque portée réglée au moins une fois (GitHub granulaire, intégration,
 * gate coupée, tier de projet, repli d'agent), plus un tier mal saisi qui sort en erreur.
 */
const FIXTURE_CONFIG = [
  'github:',
  '  pr: true',
  '  ci: false',
  '  codex-review: false',
  'integration: push-ff',
  'release:',
  '  gate: off',
  'roles:',
  '  ezk-dev: high',
  '  ezk-steward: enorme',
  'agents:',
  '  ezk-qa:',
  '    model: haiku',
  '',
].join('\n');

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
  write('.vectorz/config.yml', FIXTURE_CONFIG);
  // Ce que la méthode a mené (fiche 20261102104443762) : 2 comptes rendus, 1 rétro, et un intrus par dossier.
  write('docs/sprints/2026-10-30-sprint-premier.md', '# Rapport de sprint — premier\n');
  write(
    'docs/sprints/2026-10-31-sprint-second.md',
    [
      '# Rapport de sprint — second',
      '',
      '## Lot scellé',
      '',
      '- `20990101000000001` — Une fiche livrée (PR local (abc1234)) — **livrée**',
      '- `20990101000000002` — Une fiche reportée — **reportée**',
      '',
      '## Détail',
      '',
      '- **Fenêtre** : 2026-10-31T09:00:00.000Z → 2026-10-31T09:42:00.000Z',
      '- **Durée** : 2520000 ms',
      '- **Tokens** : entrée 10 / sortie 20 / cache lu 30 / cache créé 40 / total 100 (grain `sprint`)',
      '- **Fiches livrées** (1) : 20990101000000001',
      '- **Blocages** (0)',
      '',
    ].join('\n'),
  );
  write('docs/sprints/notes.md', '# Notes libres, pas un compte rendu\n');
  write('docs/captures/2026-10-31-retro-premiere.md', '# Rétro\n');
  write('docs/captures/2026-10-31-panel-board.md', '# Panel, pas une rétro\n');
  // Les sessions closes (fiche 20261102123552182) : 2 récits, et le README du dossier, qui n'en est pas un.
  write('docs/sessions/README.md', '# Les récits de session\n');
  write('docs/sessions/2026-10-30-premiere-session.md', 'fiches: 20990101000000001\n\n# Première session\n\nLivré en PR #12.\n');
  write('docs/sessions/2026-10-31-seconde-session.md', '# Seconde session\n\nRien de livré.\n');
  // Les documents de la méthode (fiche 20261102123552184) : une page à données, un schéma SVG et un
  // dossier sans document (ignoré).
  write('diagrams/methode-mega-city/carte-interactive.html', '<script src="carte-interactive.data.js"></script>\n');
  write('diagrams/methode-mega-city/meta.yaml', 'title: "La méthode en une carte"\n');
  write('diagrams/qualite-composants/diagram.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>\n');
  write('diagrams/qualite-composants/meta.yaml', 'titre: Qualité — composants\n');
  write('diagrams/notes/README.md', '# Pas un document\n');
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
export function tolerant(node: unknown): unknown {
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
      [CONFIG_SCHEMA_FILE]: schemaText(ConfigShowSchema),
      [CONFIG_EXAMPLE_FILE]: exampleText(configShowData(root)),
      [PROCESS_SCHEMA_FILE]: schemaText(ProcessContractSchema),
      // GitHub non lu : l'exemple ne dépend ni du réseau ni d'un compte (« en revue » y est inconnue).
      [PROCESS_EXAMPLE_FILE]: exampleText(boardProcessData(root, { github: false })),
      [MAPS_SCHEMA_FILE]: schemaText(MapsContractSchema),
      [MAPS_EXAMPLE_FILE]: exampleText(methodMapsData(join(root, 'diagrams'))),
      [RECIPES_SCHEMA_FILE]: schemaText(RecipesContractSchema),
      [RECIPES_EXAMPLE_FILE]: exampleText(recipesExample()),
      [PROCESS_SHOW_SCHEMA_FILE]: schemaText(ProcessShowSchema),
      [PROCESS_SHOW_EXAMPLE_FILE]: exampleText(processShowData(root)),
      [GRAPH_CHECK_SCHEMA_FILE]: schemaText(GraphCheckSchema),
      // Un petit graphe écrit à la main : l'exemple ne bouge pas quand la méthode gagne une brique.
      [GRAPH_CHECK_EXAMPLE_FILE]: exampleText(graphCheckExample()),
    };
  } finally {
    if (fixtureRoot === undefined) rmSync(root, { recursive: true, force: true });
  }
}
