/**
 * Contrat du skill `ezk-scout` (fiche 20260910165637000) — chasse aux bugs en tâche de fond.
 *
 * Leçon 0095 : un oubli de consigne est resté vert neuf jours faute de test sur le *contenu*
 * des SKILL.md. Les invariants d'ezk-scout sont des consignes en prose (find-only, aucune carte
 * créée seule, état isolé ou chemin non sondé, passe bornée) : retirer l'une d'elles, ou laisser
 * un script/gabarit orphelin, DOIT faire rougir ce fichier. Les scripts eux-mêmes ont leurs
 * propres DoD bash (`test-*.sh`, câblés dans bin/test-scripts.sh).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../loaders/catalog.js';
import { expandProfile } from '../core/expand.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..'); // products/mega-city
const skillDir = join(megaCity, 'skills', 'ezk-scout');
const skillMd = join(skillDir, 'SKILL.md');

const read = (p: string): string => readFileSync(p, 'utf8');

/** Corps du SKILL.md (sans front-matter) — ce que l'agent lit. */
function body(): string {
  return read(skillMd).replace(/^---\n[\s\S]*?\n---\n/, '');
}

describe('ezk-scout — le skill existe et se déclare', () => {
  it('est un skill du catalogue, composé de ezk-backlog (filing après accord) et ezk-docker (banc isolé)', () => {
    const skill = loadCatalog(megaCity).skills.get('ezk-scout');
    expect(skill, 'skill ezk-scout absent du catalogue').toBeDefined();
    expect(skill?.composes).toEqual(expect.arrayContaining(['ezk-backlog', 'ezk-docker']));
    expect(skill?.argumentHint).toMatch(/help/);
    for (const verb of ['run', 'check', 'file']) expect(skill?.argumentHint).toMatch(new RegExp(verb));
  });

  it('est déployé par le profil global (la convention qui installe les skills dans ~/.claude)', () => {
    const catalog = loadCatalog(megaCity);
    const global = catalog.profiles.get('global');
    if (!global) throw new Error('profil global introuvable');
    const ids = expandProfile(global, catalog).skills.map((s) => s.id);
    expect(ids).toContain('ezk-scout');
  });

  it('a une ligne au catalogue skills/README.md (garde catalog-readme)', () => {
    expect(read(join(megaCity, 'skills', 'README.md'))).toMatch(/^\|\s*`ezk-scout`\s*\|/m);
  });
});

describe('ezk-scout — les invariants durs restent écrits dans le SKILL.md', () => {
  const b = (): string => body();

  it('ouvre par « En clair » et porte la règle de lisibilité (le rapport est un artefact humain)', () => {
    expect(b()).toMatch(/^## En clair/m);
    expect(b()).toMatch(/human-facing-lisibility/);
  });

  it('a une section des invariants avec les cinq règles nommées', () => {
    const text = b();
    expect(text).toMatch(/^## Les cinq invariants/m);
    for (const inv of [
      'FIND-ONLY',
      'AUCUNE CARTE',
      'ISOLER OU NE PAS SONDER',
      'BORNÉE',
      'RAPPORT CONTRÔLÉ',
    ]) {
      expect(text, `invariant « ${inv} » absent`).toContain(inv);
    }
  });

  it('FIND-ONLY : SHA de HEAD + arbre + worktree comparés avant/après par le script, pas par un simple git status', () => {
    const text = b();
    expect(text).toMatch(/find-only-guard\.sh snapshot/);
    expect(text).toMatch(/find-only-guard\.sh verify/);
    expect(text).toMatch(/SHA de HEAD/);
    expect(text).toMatch(/arbre/);
    expect(text).toMatch(/ne suffit pas/); // « git status seul ne suffit pas »
    expect(text).toMatch(/VIOLÉ/);
  });

  it("AUCUNE CARTE : `ezk-backlog add` n'est appelé qu'après validation humaine, par le seul verbe `file`", () => {
    const text = b();
    expect(text).toMatch(/jamais[^.\n]*`ezk-backlog add`|`ezk-backlog add`[^.\n]*jamais/i);
    expect(text).toMatch(/seul verbe qui écrit au backlog/);
    expect(text).toMatch(/après (?:ton |son |l'|la )?(?:accord|validation)/i);
    // Les fiches naissent `idea` + étiquette `scout` : pas de nouveau statut.
    expect(text).toMatch(/`idea`/);
    expect(text).toMatch(/labels:\s*\[scout\]/);
  });

  it('ISOLER OU NE PAS SONDER : tout l’état mutable, et un état non isolable n’est pas sondé', () => {
    const text = b();
    expect(text).toMatch(/base de données/i);
    expect(text).toMatch(/volumes?/i);
    expect(text).toMatch(/services? externes?/i);
    expect(text).toMatch(/NON ISOLÉ/);
    expect(text).toMatch(/non sondé/i);
  });

  it('BORNÉE : budget de sondes et de minutes, résumé « N trouvées · M fichées · K écartées »', () => {
    const text = b();
    expect(text).toMatch(/--max-probes/);
    expect(text).toMatch(/--max-min/);
    expect(text).toMatch(/N trouvées · M fichées · K écartées/);
  });

  it('RAPPORT CONTRÔLÉ : check-report.sh avant de rendre, gabarit et exemple livrés', () => {
    const text = b();
    expect(text).toMatch(/check-report\.sh/);
    expect(text).toMatch(/SCOUT_REPORT\.template\.md/);
    expect(text).toMatch(/demo-report\.md/);
  });

  it('UI = opt-in (règle playwright-mcp-usage) ; localisation = opt-in et indice non garanti', () => {
    const text = b();
    expect(text).toMatch(/--ui/);
    expect(text).toMatch(/playwright-mcp-usage/);
    expect(text).toMatch(/--locate/);
    expect(text).toMatch(/indice/i);
  });

  it('documente la frontière avec ezk-qa, ezk-bug, ezk-reviewer, ezk-sprint et ezk-product-build', () => {
    const text = b();
    expect(text).toMatch(/^## Frontière/m);
    for (const neighbour of ['ezk-qa', 'ezk-bug', 'ezk-reviewer', 'ezk-sprint', 'ezk-product-build']) {
      expect(text, `frontière avec ${neighbour} non documentée`).toContain(neighbour);
    }
  });

  it("dit honnêtement ce qui n'est pas encore branché (banc isolé universel, captures, émulateur)", () => {
    const text = b();
    expect(text).toMatch(/20260917162000501/); // lanceur dev universel (a absorbé ezk-testbed 0102)
    expect(text).toMatch(/20260812104022228/); // mécanisme de captures (parqué)
    expect(text).toMatch(/20260906135450000/); // recette émulateur Android (hors POC)
  });
});

describe('ezk-scout — aucun script ni gabarit orphelin', () => {
  it('chaque chemin scripts/ assets/ examples/ cité dans le SKILL.md existe sur disque', () => {
    const cited = [...body().matchAll(/`((?:scripts|assets|examples)\/[A-Za-z0-9._-]+)`/g)].map(
      (m) => m[1],
    );
    expect(cited.length).toBeGreaterThan(0);
    for (const rel of new Set(cited)) {
      expect(existsSync(join(skillDir, rel)), `chemin cité absent : ${rel}`).toBe(true);
    }
  });

  it('les deux scripts sont exécutables', () => {
    for (const script of ['find-only-guard.sh', 'check-report.sh']) {
      const mode = statSync(join(skillDir, 'scripts', script)).mode;
      expect(mode & 0o111, `${script} doit être exécutable`).not.toBe(0);
    }
  });

  it('chaque test-*.sh du skill est câblé dans bin/test-scripts.sh (sinon il est ignoré en silence)', () => {
    const runner = read(join(megaCity, 'bin', 'test-scripts.sh'));
    for (const suite of ['test-find-only-guard.sh', 'test-check-report.sh', 'test-demo-app.sh']) {
      expect(existsSync(join(skillDir, 'scripts', suite)), `${suite} absent`).toBe(true);
      expect(runner, `${suite} non câblé dans test-scripts.sh`).toContain(
        `skills/ezk-scout/scripts/${suite}`,
      );
    }
  });
});
