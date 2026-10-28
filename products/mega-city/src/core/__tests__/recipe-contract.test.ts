/**
 * Spike fiche 20261023120000002 — le contrat « ce dossier est une recette ».
 * On éprouve la FORME du contrat (pas encore un moteur) : il décide sur un `RECIPE.md`, le scan
 * liste les dossiers déclarés, un dossier sans déclaration n'apparaît pas, et le contrat réutilise
 * le front-matter recette existant (prouvé sur une vraie recette du dépôt).
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  RECIPE_DECLARATION_FILE,
  RECIPE_REQUIRED_FIELDS,
  declaredRecipe,
  scanDeclaredRecipes,
} from '../recipe-contract.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const repoRoot = resolve(megaCity, '..', '..');

/** Un `RECIPE.md` calqué sur le pilote muti `apps/desktop/validation/` (hors dépôt, non touché). */
const MUTI_PILOTE = `---
id: "20261018110931402"
title: Harnais de validation desktop (captures + check)
makes: Une procédure qui rejoue la validation visuelle d'un build desktop et range les captures
source: apps/desktop/validation # implémentation pilote dans muti
composes: []
status: ready
home: projet
created: 2026-10-18
---

## En clair
Ce dossier porte sa propre recette, réutilisable par un autre projet.
`;

/** Une déclaration à qui il manque \`makes\` : le contrat doit la refuser. */
const SANS_MAKES = `---
id: "20261018110931999"
title: Déclaration incomplète
source: quelque/part
status: draft
---
corps
`;

describe('declaredRecipe — le contrat sur un RECIPE.md', () => {
  it('reconnaît une recette quand les cinq champs requis sont présents', () => {
    const res = declaredRecipe(MUTI_PILOTE);
    expect(res.declared).toBe(true);
    if (res.declared) {
      expect(res.recipe.id).toBe('20261018110931402');
      expect(res.recipe.status).toBe('ready');
      // Le commentaire YAML `# …` de `source` est retiré par le parseur, pas recopié.
      expect(res.recipe.source).toBe('apps/desktop/validation');
    }
  });

  it('refuse et nomme les champs manquants', () => {
    const res = declaredRecipe(SANS_MAKES);
    expect(res.declared).toBe(false);
    if (!res.declared) expect(res.missing).toEqual(['makes']);
  });

  it('un texte sans front-matter n\'est pas une recette (tous les champs manquent)', () => {
    const res = declaredRecipe('# juste un titre markdown, pas de front-matter\n');
    expect(res.declared).toBe(false);
    if (!res.declared) expect(res.missing).toEqual([...RECIPE_REQUIRED_FIELDS]);
  });

  it('réutilise le front-matter recette existant : une vraie recette du dépôt est reconnue', () => {
    const real = readFileSync(join(repoRoot, 'recipes', 'secrets-trousseau.md'), 'utf8');
    const res = declaredRecipe(real);
    expect(res.declared).toBe(true);
    if (res.declared) expect(res.recipe.id).toBe('20261003164801823');
  });

  it('un front-matter YAML mal formé écarte le dossier SANS lever', () => {
    const res = declaredRecipe('---\ntitle: [unclosed\n---\ncorps\n');
    expect(res.declared).toBe(false);
  });

  it('un champ présent mais vide est traité comme manquant', () => {
    const res = declaredRecipe('---\nid: "1"\ntitle: X\nmakes:\nsource: s\nstatus: draft\n---\n');
    expect(res.declared).toBe(false);
    if (!res.declared) expect(res.missing).toEqual(['makes']);
  });

  it('un id NUMÉRIQUE non quoté est non conforme (l\'id doit être une chaîne, jamais un nombre)', () => {
    const res = declaredRecipe('---\nid: 20261018110931402\ntitle: X\nmakes: m\nsource: s\nstatus: draft\n---\n');
    expect(res.declared).toBe(false);
    if (!res.declared) expect(res.missing).toContain('id');
  });
});

describe('scanDeclaredRecipes — le catalogue des dossiers déclarés', () => {
  it('ne liste que les dossiers portant un RECIPE.md valide, triés par id', () => {
    const catalog = scanDeclaredRecipes([
      { dir: 'apps/desktop/validation', recipeMd: MUTI_PILOTE },
      { dir: 'src/parser', recipeMd: null }, // pas de déclaration
      { dir: 'tools/incomplet', recipeMd: SANS_MAKES }, // déclaration invalide
    ]);
    expect(catalog.map((c) => c.dir)).toEqual(['apps/desktop/validation']);
    expect(catalog[0]?.id).toBe('20261018110931402');
  });

  it('distingue recette et skill : un dossier à SKILL.md seul (RECIPE.md absent) n\'est pas une recette', () => {
    const catalog = scanDeclaredRecipes([{ dir: 'skills/ezk-backlog', recipeMd: null }]);
    expect(catalog).toEqual([]);
  });

  it('un dossier portant À LA FOIS SKILL.md et RECIPE.md est une recette (le contrat ne regarde que RECIPE.md)', () => {
    const catalog = scanDeclaredRecipes([{ dir: 'skills/double', recipeMd: MUTI_PILOTE }]);
    expect(catalog.map((c) => c.dir)).toEqual(['skills/double']);
  });

  it('un RECIPE.md mal formé est écarté sans casser le reste du catalogue', () => {
    const catalog = scanDeclaredRecipes([
      { dir: 'ok', recipeMd: MUTI_PILOTE },
      { dir: 'ko', recipeMd: '---\ntitle: [unclosed\n---\n' },
    ]);
    expect(catalog.map((c) => c.dir)).toEqual(['ok']);
  });
});

describe('la surface du contrat', () => {
  it('le fichier de déclaration est RECIPE.md (singulier, ≠ le livre RECIPES.md)', () => {
    expect(RECIPE_DECLARATION_FILE).toBe('RECIPE.md');
  });

  it('les champs requis sont ceux qu\'émet recipe-frontmatter.ts et que lit regen-recipes.sh', () => {
    expect([...RECIPE_REQUIRED_FIELDS]).toEqual(['id', 'title', 'makes', 'source', 'status']);
  });
});
