/**
 * law-contract-files — le schéma et l'exemple rangés pour les consommateurs de `ezk law show --json`
 * (fiche 20261101215342537, ADR-086), et la fixture qui les produit.
 *
 * Tous GÉNÉRÉS, jamais écrits à la main (`pnpm law:contract --write`) :
 *   contracts/law-show/v1/schema.json   ← tiré du schéma zod
 *   contracts/law-show/v1/example.json  ← la sortie de la commande sur la fixture
 *
 * La fixture est un petit catalogue factice avec deux fichiers de loi factices : une règle par portée
 * (`partout`, `projet`, `citee` en direct et par bundle, `rangee`, `orpheline`). Elle ne touche jamais
 * au vrai `~/.claude`. Les chemins de loi de l'exemple sont fixes, pour qu'il ne change pas d'une
 * machine à l'autre.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { LAW_SHOW_SCHEMA_VERSION, LawShowSchema, buildLawShow } from '../core/law-show.js';
import { loadCatalog } from '../loaders/catalog.js';
import { tolerant } from './contract-files.js';
import { globalLawPath, projectLawPath, readLawText } from './law-show.js';

const LAW_DIR = `contracts/law-show/v${LAW_SHOW_SCHEMA_VERSION}`;
export const LAW_SCHEMA_FILE = `${LAW_DIR}/schema.json`;
export const LAW_EXAMPLE_FILE = `${LAW_DIR}/example.json`;

const rule = (id: string, level: string, extra = ''): string =>
  `---\nid: ${id}\nkind: disposition\nlevel: ${level}\ntitle: Règle ${id}\n${extra}---\n\nTexte de ${id}.\n`;

const FIXTURE_CATALOG: Record<string, string> = {
  'rules/r/globale.md': rule('r/globale', 'MUST', 'enforcements:\n  - type: agent-check\n    agent: a1\n'),
  'rules/r/projet.md': rule('r/projet', 'SHOULD'),
  'rules/r/citee.md': rule('r/citee', 'MUST'),
  'rules/r/citee-bundle.md': rule('r/citee-bundle', 'SHOULD'),
  'rules/r/rangee.md': rule('r/rangee', 'MAY'),
  'rules/r/orpheline.md': rule('r/orpheline', 'MUST'),
  'bundles/base.yml': 'id: base\nrules:\n  - r/globale\n  - r/projet\n',
  'bundles/b2.yml': 'id: b2\nrules:\n  - r/citee\n  - r/citee-bundle\n',
  'bundles/b3.yml': 'id: b3\nrules:\n  - r/rangee\n',
  'profiles/p1.yml': 'id: p1\nbundles: [base, b3]\nagents: []\nskills: []\n',
  'agents/a1.md': '---\nname: a1\ninteractions: [r/citee]\n---\n\nAgent de la fixture.\n',
  'skills/s1/SKILL.md': '---\nname: s1\napplies: [r/citee]\n---\n\nSkill de la fixture.\n',
  'skills/s2/SKILL.md': '---\nname: s2\napplies: [b2]\n---\n\nSkill de la fixture.\n',
};

const GLOBAL_LAW = '# La loi globale\n\n## r/globale  `[MUST]`\n\n- Texte.\n\n### Un sous-titre\n\n- Autre.\n';
const PROJECT_LAW = '# La loi du projet\n\n## r/globale  `[MUST]`\n\n- Texte.\n\n## r/projet  `[SHOULD]`\n\n- Texte.\n';

export interface LawFixture {
  /** Le dossier jetable qui contient tout : à effacer par l'appelant. */
  dir: string;
  catalogRoot: string;
  /** Le faux `~/.claude`. */
  target: string;
  projectRoot: string;
}

/** Écrit un fichier sous `root`, en créant les dossiers. */
export function writeLawFixtureFile(root: string, rel: string, text: string): void {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
}

/** Construit la fixture dans un dossier jetable. Rend ses chemins ; `rmSync(dir, { recursive: true, force: true })` pour l'effacer. */
export function makeLawFixture(): LawFixture {
  const dir = mkdtempSync(join(tmpdir(), 'law-fixture-'));
  const fixture = { dir, catalogRoot: join(dir, 'catalog'), target: join(dir, 'claude'), projectRoot: join(dir, 'projet') };
  for (const [rel, text] of Object.entries(FIXTURE_CATALOG)) writeLawFixtureFile(fixture.catalogRoot, rel, text);
  writeLawFixtureFile(fixture.target, 'rules/iamthelaw.md', GLOBAL_LAW);
  writeLawFixtureFile(fixture.projectRoot, '.iamthelaw/ENTRY.md', PROJECT_LAW);
  return fixture;
}

/** Les fichiers du contrat, chemin relatif à `products/mega-city` → texte attendu. */
export function renderLawContractFiles(): Record<string, string> {
  const fixture = makeLawFixture();
  try {
    const globale = readLawText(globalLawPath(fixture.target));
    const projet = readLawText(projectLawPath(fixture.projectRoot));
    const example = buildLawShow({
      catalog: loadCatalog(fixture.catalogRoot),
      globale: { ...globale, chemin: '~/.claude/rules/iamthelaw.md' },
      projet: { ...projet, chemin: '.iamthelaw/ENTRY.md' },
    });
    return {
      [LAW_SCHEMA_FILE]: `${JSON.stringify(tolerant(z.toJSONSchema(LawShowSchema)), null, 2)}\n`,
      [LAW_EXAMPLE_FILE]: `${JSON.stringify(example, null, 1)}\n`,
    };
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
}
