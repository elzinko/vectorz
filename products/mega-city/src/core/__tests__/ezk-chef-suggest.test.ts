import { describe, expect, it } from 'vitest';
import { detectCandidates, parseSessionMarkdown } from '../ezk-chef-suggest.js';

const MONO_FEATURE_SESSION = `fiches: 20260829123707100

# Sprint — samplerz : câblage du domaine

Périmètre: x   Statut: terminé

## Galères & gestes (labo)

- **Root Directory Vercel oublié (monorepo)**
  Symptôme : build en échec.
  Geste : Settings → Root Directory.
  Pourquoi : monorepo.

- **DNS IONOS à câbler**
  Symptôme : domaine Invalid.
  Geste : poser les enregistrements.
  Pourquoi : registrar source de vérité.

## Notes
- rien à signaler
`;

const MULTI_FEATURE_SESSION = `fiches: 111,222

# Sprint — deux fiches

## Galères & gestes (labo)

- **Un truc qui a coincé**
  Symptôme : x. Geste : y. Pourquoi : z.
`;

const NO_GALERE_SESSION = `fiches: 333

# Sprint calme

## Backlog
- [x] tout est allé tout seul
`;

const NO_HEADER_SESSION = `# Sprint sans entête fiches

## Galères & gestes (labo)

- **Une galère orpheline**
  Symptôme : x. Geste : y. Pourquoi : z.
`;

describe('parseSessionMarkdown', () => {
  it('lit l’entête fiches: et les galères de la section labo', () => {
    const parsed = parseSessionMarkdown(MONO_FEATURE_SESSION, 'docs/sessions/mono.md');
    expect(parsed.ficheIds).toEqual(['20260829123707100']);
    expect(parsed.galeres).toHaveLength(2);
    expect(parsed.galeres[0].title).toBe('Root Directory Vercel oublié (monorepo)');
  });

  it('rend ficheIds vide si aucun entête fiches:', () => {
    const parsed = parseSessionMarkdown(NO_HEADER_SESSION, 'docs/sessions/orphan.md');
    expect(parsed.ficheIds).toEqual([]);
  });

  it('rend galeres vide si pas de section labo', () => {
    const parsed = parseSessionMarkdown(NO_GALERE_SESSION, 'docs/sessions/calme.md');
    expect(parsed.galeres).toEqual([]);
  });

  it('lit plusieurs ids sur l’entête fiches:', () => {
    const parsed = parseSessionMarkdown(MULTI_FEATURE_SESSION, 'docs/sessions/multi.md');
    expect(parsed.ficheIds).toEqual(['111', '222']);
  });
});

describe('detectCandidates', () => {
  it('une session mono-feature avec galères produit un candidat sur cette fiche', () => {
    const session = parseSessionMarkdown(MONO_FEATURE_SESSION, 'docs/sessions/mono.md');
    const candidates = detectCandidates([session]);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].ficheId).toBe('20260829123707100');
    expect(candidates[0].pointeurs).toEqual(['docs/sessions/mono.md']);
    expect(candidates[0].motif).toContain('Root Directory Vercel oublié (monorepo)');
  });

  it('une session multi-feature sans attribution explicite ne produit aucun candidat', () => {
    const session = parseSessionMarkdown(MULTI_FEATURE_SESSION, 'docs/sessions/multi.md');
    const candidates = detectCandidates([session]);
    expect(candidates).toEqual([]);
  });

  it('une session sans galère exploitable ne produit aucun candidat', () => {
    const session = parseSessionMarkdown(NO_GALERE_SESSION, 'docs/sessions/calme.md');
    const candidates = detectCandidates([session]);
    expect(candidates).toEqual([]);
  });

  it('une session sans entête fiches: (orpheline) ne produit aucun candidat', () => {
    const session = parseSessionMarkdown(NO_HEADER_SESSION, 'docs/sessions/orphan.md');
    const candidates = detectCandidates([session]);
    expect(candidates).toEqual([]);
  });

  it('un sprint sans galère exploitable sur aucune session → zéro candidat', () => {
    const candidates = detectCandidates([
      parseSessionMarkdown(NO_GALERE_SESSION, 'docs/sessions/calme.md'),
      parseSessionMarkdown(NO_HEADER_SESSION, 'docs/sessions/orphan.md'),
    ]);
    expect(candidates).toEqual([]);
  });

  it('agrège plusieurs sessions mono-feature pointant vers la même fiche', () => {
    const sessionA = parseSessionMarkdown(MONO_FEATURE_SESSION, 'docs/sessions/mono.md');
    const sessionB = parseSessionMarkdown(
      MONO_FEATURE_SESSION.replace('Root Directory Vercel oublié (monorepo)', 'Autre galère'),
      'docs/sessions/mono-bis.md',
    );
    const candidates = detectCandidates([sessionA, sessionB]);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].pointeurs).toEqual(['docs/sessions/mono.md', 'docs/sessions/mono-bis.md']);
  });
});
