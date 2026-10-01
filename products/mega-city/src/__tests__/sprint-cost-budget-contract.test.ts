/**
 * Contrat du budget d'appels d'agent (ADR-0060, fiche 20260920213500176).
 *
 * Leçon 0095 : une consigne qui ne vit qu'en prose peut disparaître en silence. La décision « le coût
 * d'un sprint se compte en appels d'agent » est portée par quatre choses : l'ADR, la règle
 * `token-economy/agent-call-budget`, et les consignes de `ezk-sprint` et `ezk-product-build` (les deux
 * textes que les sprints lisent vraiment). Retirer l'une d'elles DOIT faire rougir ce fichier.
 *
 * Honnêteté : ce test garde des mots, pas un budget de jetons. Aucune gate mécanique ne mesure le coût
 * réel aujourd'hui (voir « Suite » de la fiche).
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../loaders/catalog.js';

const productRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..'); // products/mega-city
const read = (...parts: string[]): string => readFileSync(join(productRoot, ...parts), 'utf8');
const bodyOf = (skill: string): string =>
  read('skills', skill, 'SKILL.md').replace(/^---\n[\s\S]*?\n---\n/, '');

/** De `heading` (une ligne) jusqu'au titre `## ` suivant. */
function section(text: string, heading: RegExp): string {
  const start = text.search(heading);
  expect(start, `section ${heading} absente`).toBeGreaterThanOrEqual(0);
  const rest = text.slice(start + 1);
  const next = rest.search(/^## /m);
  return next === -1 ? text.slice(start) : text.slice(start, start + 1 + next);
}

const RULE = 'token-economy/agent-call-budget';

describe('ADR-0060 — le coût d’un sprint se compte en appels d’agent', () => {
  const adr = read('docs', 'adr', '0060-cout-sprint-compte-en-appels-agent.md');

  it('cite les mesures du run V0.1 → V0.4 (on ne les refait pas)', () => {
    for (const measure of ['~85k', '87-95k', '107-162k', '250-700k', '370k', '~500k', '~215k']) {
      expect(adr, `mesure « ${measure} » absente de l’ADR`).toContain(measure);
    }
  });

  it('tranche les points : unité = appel, budget d’appels, cible ≤ 200k, pas de nouveau mode, DoR à 3 champs écartée', () => {
    expect(adr).toMatch(/unité de coût est l['’]appel d['’]agent/);
    expect(adr).toMatch(/Budget d['’]appels par fiche/);
    expect(adr).toContain('≤ 200k');
    expect(adr).toMatch(/Pas de nouveau mode/);
    expect(adr).toMatch(/DoR réduite à ~3 champs/);
    expect(adr).toMatch(/jamais sauté/); // le filet de qualité reste
  });

  it('dit honnêtement où la règle est matérialisée (catalogue vs SKILL.md déployés)', () => {
    expect(adr).toContain('cop1-target');
    expect(adr).toMatch(/SKILL\.md/);
  });
});

describe('règle token-economy/agent-call-budget', () => {
  const catalog = loadCatalog(productRoot);

  it('existe au catalogue et est rangée dans le bundle token-economy', () => {
    expect(catalog.rules.get(RULE), `règle ${RULE} absente`).toBeDefined();
    expect(catalog.bundles.get('token-economy')?.rules).toContain(RULE);
  });

  it('ezk-product-build l’applique (applies:), donc le graphe la voit', () => {
    expect(catalog.skills.get('ezk-product-build')?.applies).toContain(RULE);
  });
});

describe('les consignes sont écrites là où les sprints les lisent', () => {
  it('ezk-sprint § Budget tokens : appels d’agent, pas d’explorateur, artefact, prose, cible', () => {
    const text = section(bodyOf('ezk-sprint'), /^## Budget tokens/m);
    expect(text).toContain(RULE);
    expect(text).toContain('~85k');
    expect(text).toMatch(/au plus une revue/);
    expect(text).toMatch(/DoR groupée/);
    expect(text).toMatch(/Pas d['’]explorateur/);
    expect(text).toContain('grep');
    expect(text).toMatch(/Donne l['’]artefact/);
    expect(text).toMatch(/jamais sautée/);
    expect(text).toContain('≤ 200k');
  });

  it('ezk-product-build § Vigilance tokens (lean) : DoR groupée, revue partagée, aucun explorateur, cible', () => {
    const text = section(bodyOf('ezk-product-build'), /^## Vigilance tokens/m);
    expect(text).toContain(RULE);
    expect(text).toMatch(/une seule DoR/);
    expect(text).toMatch(/2-3 petits patchs/);
    expect(text).toMatch(/aucun explorateur/);
    expect(text).toMatch(/jamais sautée/);
    expect(text).toContain('≤ 200k');
  });
});
