/**
 * Vérifie que le catalogue `skills/README.md` reste à jour — le trou par lequel
 * ezk-docker/ezk-readme/ezk-diagram avaient dérivé (deploy.sh range le skill mais
 * ne touche pas l'index ; cf. PR récupération). Invariant testable, donc CI :
 *   - tout skill du profil `global` (le set daily-driver curated) DOIT être catalogué ;
 *   - le catalogue ne référence aucun skill fantôme (chaque entrée existe sur disque).
 * `supervision-demo` (méthode jouet hors `global`) n'est donc pas requis dans le tableau.
 */
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { loadCatalog } from '../loaders/catalog.js';
import { expandProfile } from '../core/expand.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..'); // products/mega-city
const skillsDir = join(repoRoot, 'skills');
const readmePath = join(skillsDir, 'README.md');

/** ids de skills listés dans la 1re colonne du tableau du catalogue (| `ezk-x` | … |). */
function cataloguedSkillIds(): Set<string> {
  const ids = new Set<string>();
  for (const line of readFileSync(readmePath, 'utf8').split('\n')) {
    const m = line.match(/^\|\s*`([a-z0-9][a-z0-9_-]*)`\s*\|/);
    if (m) ids.add(m[1]);
  }
  return ids;
}

/** ids de dossiers de skill réels (un dossier contenant un SKILL.md). */
function skillDirIds(): Set<string> {
  return new Set(
    readdirSync(skillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(skillsDir, e.name, 'SKILL.md')))
      .map((e) => e.name),
  );
}

/** ids de skills résolus par le profil `global` (le set daily-driver curated). */
function globalSkillIds(): string[] {
  const catalog = loadCatalog(repoRoot);
  const global = catalog.profiles.get('global');
  if (!global) throw new Error('profil global introuvable');
  return expandProfile(global, catalog).skills.map((s) => s.id);
}

describe('catalogue skills/README.md à jour', () => {
  it('documente TOUS les skills du profil global (aucun skill livré non catalogué)', () => {
    const catalogued = cataloguedSkillIds();
    const missing = globalSkillIds().filter((id) => !catalogued.has(id));
    expect(missing, `skills du profil global absents du catalogue : ${missing.join(', ')}`).toEqual(
      [],
    );
  });

  it('ne référence aucun skill fantôme (chaque entrée du tableau existe sur disque)', () => {
    const dirs = skillDirIds();
    const phantom = [...cataloguedSkillIds()].filter((id) => !dirs.has(id));
    expect(phantom, `entrées de catalogue sans dossier de skill : ${phantom.join(', ')}`).toEqual(
      [],
    );
  });
});

/**
 * Tableau « scannable » (fiche 20260824122629925, reprend le volet 3 de 20260813131737962) :
 * une ligne par skill, une phrase courte, et une colonne « profil » qui dit la vérité.
 */
interface CatalogRow {
  id: string;
  role: string;
  profil: string;
}

function catalogRows(): CatalogRow[] {
  const rows: CatalogRow[] = [];
  // Seule la section « Catalogue » compte : un autre tableau du README ne doit pas casser le test.
  const section = readFileSync(readmePath, 'utf8')
    .split(/^## /m)
    .find((s) => s.startsWith('Catalogue'));
  for (const line of (section ?? '').split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    const id = /^`([a-z0-9][a-z0-9_-]*)`$/.exec(cells[1] ?? '')?.[1];
    if (id) rows.push({ id, role: cells[2] ?? '', profil: cells[3] ?? '' });
  }
  return rows;
}

describe('catalogue skills/README.md — tableau scannable', () => {
  it('catalogue TOUS les dossiers de skills, hors profil global compris', () => {
    const catalogued = cataloguedSkillIds();
    const missing = [...skillDirIds()].filter((id) => !catalogued.has(id));
    expect(missing, `dossiers de skills absents du tableau : ${missing.join(', ')}`).toEqual([]);
  });

  it('dit vrai dans la colonne « profil » (global ou opt-in, d’après profiles/global.yml)', () => {
    const inGlobal = new Set(globalSkillIds());
    const wrong = catalogRows()
      .filter((r) => r.profil !== (inGlobal.has(r.id) ? 'global' : 'opt-in'))
      .map((r) => `${r.id} : « ${r.profil} »`);
    expect(wrong, `colonne profil fausse : ${wrong.join(' ; ')}`).toEqual([]);
  });

  it('tient une ligne par skill en une phrase courte (≤ 170 caractères)', () => {
    const tooLong = catalogRows()
      .filter((r) => r.role.length === 0 || r.role.length > 170)
      .map((r) => `${r.id} (${r.role.length} car.)`);
    expect(tooLong, `lignes vides ou trop longues : ${tooLong.join(', ')}`).toEqual([]);
  });

  it('ne renvoie plus à install.sh (migration terminée) et ne code aucun total en dur', () => {
    const text = readFileSync(readmePath, 'utf8');
    expect(text).not.toMatch(/install\.sh/);
    expect(text).not.toMatch(/\b\d+\s+(skills|agents)\b/i);
  });
});
