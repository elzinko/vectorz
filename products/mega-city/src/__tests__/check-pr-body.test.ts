/**
 * Fiche 0191 — R3a : garde déterministe du corps de PR (rendu de la fiche, ADR-0029).
 * Le corps de PR est le RENDU de la fiche ; le template de fiche a gagné deux blocs
 * d'onboarding (fiche 0191) : l'ouverture « Si tu arrives frais » et la section
 * conditionnelle « ## Glossaire ». `check-pr-body.sh` DOIT rejeter un corps qui les rend
 * en laissant leurs placeholders non remplis (au même titre que les autres placeholders
 * de template non rendu) — sinon un corps template-conforme mais vide passerait (cas #125).
 *
 * Test de COMPORTEMENT (exécute le script), pas de contenu : retirer la garde de
 * `check-pr-body.sh` DOIT faire rougir ce fichier.
 */
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const script = resolve(here, '../../skills/ezk-pr-pilot/scripts/check-pr-body.sh');

function check(body: string): { code: number; err: string } {
  try {
    execFileSync('bash', [script], { input: body, encoding: 'utf8' });
    return { code: 0, err: '' };
  } catch (e) {
    const err = e as { status?: number; stderr?: string };
    return { code: err.status ?? 1, err: String(err.stderr ?? '') };
  }
}

// Rendu de fiche complet et VALIDE (passe la garde existante : En clair + provenance
// concrète + sections + Comment vérifier + Validation, aucun placeholder de contenu).
const VALID = [
  '> 🗎 Rendu de la fiche features/0191-lisibilite.md',
  '',
  '# 0191 — Lisibilité qui tient',
  '',
  '**En clair.** Le corps de PR rend la fiche, telle quelle.',
  '',
  '## Contexte / Problème',
  'x',
  '',
  '## Proposition',
  'x',
  '',
  "## Critères d'acceptation",
  '- [ ] x',
  '',
  '## Comment vérifier',
  'pnpm test',
  '',
  '## Validation',
  '',
  '| Modalité | Statut |',
  '|---|---|',
  '| CI | ⏳ |',
  '',
].join('\n');

describe('check-pr-body — garde onboarding du rendu de fiche (fiche 0191)', () => {
  it('accepte un rendu complet sans placeholders', () => {
    expect(check(VALID).code).toBe(0);
  });

  it('rejette une ouverture « Si tu arrives frais » laissée en placeholder', () => {
    const body = VALID.replace(
      '**En clair.** Le corps de PR rend la fiche, telle quelle.',
      '**En clair.** Le corps de PR rend la fiche, telle quelle.\n\n' +
        '**Si tu arrives frais.** <1–2 lignes : le vocabulaire projet minimal pour lire cette fiche sans contexte>',
    );
    const r = check(body);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/template non rendu|placeholder|onboarding|Glossaire|arrives frais/i);
  });

  it('rejette une section « ## Glossaire » laissée en placeholder', () => {
    const body = VALID.replace(
      '## Validation',
      '## Glossaire\n\n' +
        '<CONDITIONNEL : obligatoire si la fiche emploie du jargon interne, un sigle ou un terme inventé.>\n\n' +
        '## Validation',
    );
    expect(check(body).code).toBe(1);
  });

  it('accepte une section « ## Glossaire » réellement rendue (remplie)', () => {
    const body = VALID.replace(
      '## Validation',
      '## Glossaire\n\n- DoR — Definition of Ready : la fiche est prête à tirer.\n\n## Validation',
    );
    expect(check(body).code).toBe(0);
  });

  it('accepte un rendu sans « ## Glossaire » (section conditionnelle, retirée si sans jargon)', () => {
    // La section est CONDITIONNELLE : son absence ne doit jamais faire échouer la garde.
    expect(check(VALID).code).toBe(0);
  });
});
