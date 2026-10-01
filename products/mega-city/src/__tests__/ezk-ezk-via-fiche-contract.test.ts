/**
 * Contrat du mode `ezk-ezk create --via-fiche` (fiche 20260830114318159).
 *
 * Leçon 0095 : une consigne qui ne vit qu'en prose peut disparaître en silence. Le mode « entrer par
 * la porte du backlog » est une suite d'instructions du SKILL.md : retirer l'option, son opposé, la
 * délégation à `ezk-backlog add`, l'un des quatre blocs de la fiche, les garde-fous ou la frontière
 * avec `ezk-chef extract` DOIT faire rougir ce fichier.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../loaders/catalog.js';

const productRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..'); // products/mega-city
const skillMd = readFileSync(join(productRoot, 'skills', 'ezk-ezk', 'SKILL.md'), 'utf8');

/** Corps du SKILL.md (sans frontmatter) : ce que l'agent lit. */
const body = skillMd.replace(/^---\n[\s\S]*?\n---\n/, '');

/** La section du mode : de son titre jusqu'au titre `## ` suivant. */
function modeSection(): string {
  const start = body.search(/^## Mode `create --via-fiche`/m);
  expect(start, 'section « Mode `create --via-fiche` » absente du SKILL.md').toBeGreaterThanOrEqual(0);
  const rest = body.slice(start + 1);
  const next = rest.search(/^## /m);
  return next === -1 ? body.slice(start) : body.slice(start, start + 1 + next);
}

describe('ezk-ezk — le mode create --via-fiche reste écrit dans le SKILL.md', () => {
  it('le tableau d’usage annonce les deux options sur `create`', () => {
    const row = body.split('\n').find((l) => l.startsWith('| `create`')) ?? '';
    expect(row, 'ligne `create` du tableau d’usage absente').not.toBe('');
    expect(row).toContain('--via-fiche');
    expect(row).toContain('--propose'); // l'alias
    expect(row).toContain('--direct');
  });

  it('la section ouvre par « En clair » et dit que le mode direct reste le défaut', () => {
    const text = modeSection();
    expect(text).toMatch(/\*\*En clair\.\*\*/);
    expect(text).toMatch(/`--direct`[^\n]*défaut|défaut[^\n]*`--direct`/);
  });

  it('les étapes 1 à 4 restent ; les étapes 5 et 6 sont remplacées par la proposition de fiche (5′)', () => {
    const text = modeSection();
    expect(text).toMatch(/étapes 1 à 4/i);
    expect(text).toMatch(/5′/);
    expect(text).toMatch(/remplac/i);
  });

  it('délègue la création à `ezk-backlog add`, qui garde anti-doublon et statut `idea`', () => {
    const text = modeSection();
    expect(text).toContain('`ezk-backlog add`');
    expect(text).toMatch(/anti-doublon/);
    expect(text).toContain('`idea`');
  });

  it('la fiche pré-remplie porte les quatre blocs', () => {
    const text = modeSection();
    for (const block of ['Problème et valeur', 'Specs', 'Contraintes et garde-fous', 'Source']) {
      expect(text, `bloc « ${block} » absent de la fiche pré-remplie`).toContain(block);
    }
  });

  it('la fiche est tirable et rappelle de construire avec --direct (pas de boucle)', () => {
    const text = modeSection();
    expect(text).toMatch(/tirable/);
    expect(text).toContain('create --direct');
    expect(text).toMatch(/boucle/);
  });

  it('garde-fous : aucun SKILL.md, deploy.sh non appelé, skill-creator non invoqué, rien hors features/', () => {
    const text = modeSection();
    expect(text).toMatch(/Aucun `SKILL\.md`/);
    expect(text).toMatch(/`deploy\.sh` n['’]est pas appelé/);
    expect(text).toMatch(/`skill-creator` n['’]est pas invoqué/);
    expect(text).toMatch(/hors de `features\/`/);
  });

  it('frontière écrite avec `ezk-chef extract` : un skill via fiche, contre une recette', () => {
    const text = modeSection();
    expect(text).toContain('`ezk-chef extract`');
    expect(text).toMatch(/recette/);
  });

  it('cite la fiche créée par son titre + lien, jamais par son id nu (règle de restitution du skill)', () => {
    expect(modeSection()).toMatch(/titre \+ lien/);
  });

  it('ezk-ezk déclare composes: [ezk-backlog] (le délégataire du mode est déjà une dépendance)', () => {
    const skill = loadCatalog(productRoot).skills.get('ezk-ezk');
    expect(skill?.composes).toContain('ezk-backlog');
  });
});
