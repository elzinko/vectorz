/**
 * Fiche 20260917… (émetteur du corps de PR local) — le rendu de la fiche EST le corps de PR
 * (ADR-0029). Contrôle fort : un rendu de fiche complète PASSE `check-pr-body.sh`, le garde-fou
 * qui régit le corps de PR. Le rendu et sa garde restent ainsi cohérents par construction.
 */
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCAL_VALIDATION, ficheBody, renderPrBody } from '../render.js';

const here = dirname(fileURLToPath(import.meta.url));
const checkScript = resolve(here, '../../../skills/ezk-pr/scripts/check-pr-body.sh');

function checkPrBody(body: string): { code: number; err: string } {
  try {
    execFileSync('bash', [checkScript], { input: body, encoding: 'utf8' });
    return { code: 0, err: '' };
  } catch (e) {
    const err = e as { status?: number; stderr?: string };
    return { code: err.status ?? 1, err: String(err.stderr ?? '') };
  }
}

// Fiche COMPLÈTE (front-matter + toutes les sections attendues par le rendu de PR).
const FICHE = [
  '---',
  'id: "0191"',
  'title: "Lisibilité qui tient"',
  'status: ready',
  'pr:',
  '---',
  '',
  '# 0191 — Lisibilité qui tient',
  '',
  '## En clair',
  '',
  'Le corps de PR rend la fiche, telle quelle.',
  '',
  '## Contexte / Problème',
  '',
  'x',
  '',
  '## Proposition',
  '',
  'x',
  '',
  "## Critères d'acceptation",
  '',
  '- [ ] x',
  '',
  '## Comment vérifier',
  '',
  'pnpm test',
  '',
].join('\n');

describe('renderPrBody — corps de PR = rendu de la fiche (ADR-0029)', () => {
  it('ficheBody retire le front-matter et garde la prose', () => {
    const body = ficheBody(FICHE);
    expect(body).toMatch(/^# 0191/);
    expect(body).not.toContain('status: ready');
    expect(body).toContain('## Comment vérifier');
  });

  it('rend provenance + prose de la fiche + matrice Validation', () => {
    const body = renderPrBody({ ficheText: FICHE, fichePath: 'features/0191-slug.md' });
    expect(body).toContain('> 🗎 Rendu de la fiche features/0191-slug.md');
    expect(body).toContain('## En clair');
    expect(body).toContain('## Validation');
    expect(body).toContain('| Gate locale (build · test · lint) | ⏳ |');
  });

  it('le rendu d’une fiche complète PASSE check-pr-body.sh (contrat ADR-0029)', () => {
    const body = renderPrBody({ ficheText: FICHE, fichePath: 'features/0191-slug.md' });
    const r = checkPrBody(body);
    expect(r.err).toBe('');
    expect(r.code).toBe(0);
  });

  it('honore des statuts de validation fournis', () => {
    const body = renderPrBody({
      ficheText: FICHE,
      fichePath: 'features/0191-slug.md',
      validation: [{ modalite: 'Gate locale', statut: '✅' }],
    });
    expect(body).toContain('| Gate locale | ✅ |');
    expect(body).not.toContain('⏳');
  });

  it('la matrice locale par défaut nomme les gates locales, pas la CI cloud', () => {
    expect(DEFAULT_LOCAL_VALIDATION.map((r) => r.modalite).join(' ')).toMatch(/locale/i);
    expect(DEFAULT_LOCAL_VALIDATION.map((r) => r.modalite).join(' ')).not.toMatch(/\bCI\b/);
  });
});
