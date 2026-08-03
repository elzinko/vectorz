/**
 * Non-récidive fiche 0079 : le corps de PR relisable (Summary + Lien fiche +
 * Comment tester) doit rester câblé — skill ↔ règle ↔ asset template.
 *
 * Leçon 0095 : un oubli de consigne est resté vert neuf jours faute de test sur
 * le *contenu* des SKILL.md. Retirer la consigne de l'étape PR d'`ezk-sprint`
 * (ou l'asset mince, ou le cas PR de la règle) DOIT faire rougir ce fichier.
 */
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const megaCityDir = resolve(here, '../..'); // products/mega-city (from src/__tests__)

const sprintSkill = join(megaCityDir, 'skills', 'ezk-sprint', 'SKILL.md');
const prPilotSkill = join(megaCityDir, 'skills', 'ezk-pr-pilot', 'SKILL.md');
const thinTemplate = join(
  megaCityDir,
  'skills',
  'ezk-pr-pilot',
  'assets',
  'PULL_REQUEST_TEMPLATE.thin.md',
);
const lisibilityRule = join(
  megaCityDir,
  'rules',
  'documentation-guidelines',
  'human-facing-lisibility.md',
);
const restitutionSkills = [
  join(megaCityDir, 'skills', 'ezk-retro', 'SKILL.md'),
  join(megaCityDir, 'skills', 'ezk-product-builder', 'SKILL.md'),
  sprintSkill,
  join(megaCityDir, 'skills', 'ezk-archive', 'SKILL.md'),
  join(megaCityDir, 'skills', 'ezk-backlog', 'SKILL.md'),
  prPilotSkill,
  join(megaCityDir, 'skills', 'ezk-ezk', 'SKILL.md'),
] as const;

const modelPolicyDoc = join(megaCityDir, 'docs', 'ezk-model-and-lisibility.md');

const archiveHandoffTemplate = join(
  megaCityDir,
  'skills',
  'ezk-archive',
  'references',
  'handoff-template.md',
);

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('contrat lisibilité artefacts humains (fiche 0079)', () => {
  it('la règle MUST existe avec le cas corps de PR', () => {
    expect(existsSync(lisibilityRule), 'règle human-facing-lisibility absente').toBe(true);
    const body = read(lisibilityRule);
    expect(body).toMatch(/level:\s*MUST/);
    expect(body).toMatch(/ezk-reviewer/);
    expect(body).toMatch(/## Summary/);
    expect(body).toMatch(/## Lien fiche/);
    expect(body).toMatch(/## Comment tester/);
  });

  it("ezk-sprint étape PR + DoD exigent les trois blocs littéraux", () => {
    const body = read(sprintSkill);
    expect(body).toMatch(/## Summary/);
    expect(body).toMatch(/## Lien fiche/);
    expect(body).toMatch(/## Comment tester/);
    expect(body).toMatch(/corps relisable seul/);
    expect(body).toMatch(/human-facing-lisibility/);
  });

  it('asset PULL_REQUEST_TEMPLATE.thin.md matérialise le squelette mince', () => {
    expect(existsSync(thinTemplate), 'asset thin template absent').toBe(true);
    const body = read(thinTemplate);
    expect(body).toMatch(/^## Summary/m);
    expect(body).toMatch(/^## Lien fiche/m);
    expect(body).toMatch(/^## Comment tester/m);
    expect(body).toMatch(/PR_VALIDATION\.md/);
  });

  it('ezk-pr-pilot init référence le thin asset (plus seulement de la prose)', () => {
    const body = read(prPilotSkill);
    expect(body).toMatch(/PULL_REQUEST_TEMPLATE\.thin\.md/);
  });

  it('ezk-pr-pilot documente fallback copy-mode + résolution check-pr-body (Codex P2)', () => {
    const body = read(prPilotSkill);
    // Mode copy ne matérialise que SKILL.md — fallback obligatoire.
    expect(body).toMatch(/Mode copy/);
    expect(body).toMatch(/écrire le squelette\s+inline|fallback inline/i);
    // Template mince réellement embarqué (pas seulement des puces descriptives).
    expect(body).toMatch(/````markdown[\s\S]*?## Summary[\s\S]*?## Lien fiche[\s\S]*?## Comment tester[\s\S]*?## Validation[\s\S]*?````/);
    expect(body).toMatch(/\| CI \|/);
    // Résolution hors cwd mega-city.
    expect(body).toMatch(/~\/\.claude\/skills\/ezk-pr-pilot\/scripts\/check-pr-body\.sh/);
    expect(body).toMatch(/products\/mega-city\/skills\/ezk-pr-pilot\/scripts\/check-pr-body\.sh/);
    expect(body).toMatch(/Fallback inline/);
    // Chemin résolu = fichier .sh (pas …/check-pr-body.sh en suffixe).
    expect(body).toMatch(/bash <chemin-résolu>(?!\/check-pr-body)/);
  });

  it.each(restitutionSkills.map((p) => [p.split('/').slice(-2).join('/'), p] as const))(
    '%s porte la consigne lisibilité à la restitution',
    (_label, path) => {
      const body = read(path);
      expect(body).toMatch(/En clair/);
      expect(body).toMatch(/human-facing-lisibility/);
    },
  );

  it('ezk-archive handoff template ouvre par En clair + baseline Reprendre', () => {
    expect(existsSync(archiveHandoffTemplate), 'handoff-template absent').toBe(true);
    const body = read(archiveHandoffTemplate);
    expect(body).toMatch(/\*\*En clair :\*\*/);
    expect(body).toMatch(/\*\*À faire \(toi\) :\*\*/);
    expect(body).toMatch(/human-facing-lisibility/);
    // Codex #91 P2 : ne pas omettre le démarrage de session suivante.
    expect(body).toMatch(/git switch main && git pull/);
    expect(body).toMatch(/\/ezk-backlog list/);
  });

  it('doc politique modèles 0181 pinne claude-opus-4-8 (pas alias opus / Opus 5)', () => {
    expect(existsSync(modelPolicyDoc), 'ezk-model-and-lisibility.md absent').toBe(true);
    const body = read(modelPolicyDoc);
    expect(body).toMatch(/model_spare/);
    expect(body).toMatch(/claude-opus-4-8/);
    expect(body).toMatch(/En clair/);
    expect(body).toMatch(/éviter Opus 5|jamais.*Opus 5|pas.*Opus 5/i);
    // L'alias nu `opus` ne doit plus être le défaut recommandé comme model:
    expect(body).not.toMatch(/\|\s*`opus`\s*\|/);
  });
});
