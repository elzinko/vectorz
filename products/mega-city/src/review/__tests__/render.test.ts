import { describe, expect, it } from 'vitest';
import { CONTRACT_URI, type ReviewPack } from '../contract.js';
import { render } from '../render.js';

function buildFullPack(): ReviewPack {
  return {
    frontMatter: {
      schema: CONTRACT_URI,
      fiche: '0183',
      branch: 'feat/0183-pack-review-markdown-first',
      product: 'mega-city',
      method: { name: 'ezk-sprint', version: '0.1.0' },
      status: 'ready-for-review',
      created: '2026-08-17',
      run_id: 'run-123',
      pr: 'https://github.com/example/pr/1',
    },
    sections: {
      resume: 'Pack de review markdown-first implémenté (contrat + render + 2 émetteurs).',
      rendus: ['assets/before.png', 'assets/after.png'],
      matriceValidation: 'Voir docs/PR_VALIDATION.md — CI ✅ · Tests unitaires ✅',
      aTester: 'Rejouer `pnpm --dir products/mega-city test`.',
      qualite: 'Couverture lue depuis .quality/ : 92 %',
      provisioning: 'pnpm --dir products/mega-city test',
      trouvailles: ['0058 à finir de reclasser'],
    },
  };
}

function buildMinimalPack(): ReviewPack {
  const full = buildFullPack();
  return {
    frontMatter: { ...full.frontMatter, run_id: undefined, pr: undefined },
    sections: {
      resume: full.sections.resume,
      rendus: [],
      matriceValidation: full.sections.matriceValidation,
      aTester: full.sections.aTester,
      provisioning: full.sections.provisioning,
      // qualite et trouvailles volontairement absents
    },
  };
}

describe('render(pack) — sérialisation pure du pack en markdown', () => {
  it('est une fonction pure : deux appels sur le même pack rendent le même texte', () => {
    const pack = buildFullPack();
    expect(render(pack)).toBe(render(pack));
  });

  it('sérialise le front-matter en tête de document (YAML entre ---)', () => {
    const markdown = render(buildFullPack());
    expect(markdown.startsWith('---\n')).toBe(true);
    expect(markdown).toContain('schema: method-review@0.1');
    expect(markdown).toContain('fiche: "0183"');
    expect(markdown).toContain('status: ready-for-review');
  });

  it.each([
    ['Résumé', 'resume'],
    ['Rendus', 'rendus'],
    ['Matrice de validation', 'matriceValidation'],
    ['À tester', 'aTester'],
    ['Qualité', 'qualite'],
    ['Provisioning', 'provisioning'],
    ['Trouvailles', 'trouvailles'],
  ])('contient la section obligatoire "%s"', (heading) => {
    const markdown = render(buildFullPack());
    expect(markdown).toContain(`## ${heading}`);
  });

  it('reproduit le contenu des sections par référence (même texte, pas une copie transformée)', () => {
    const pack = buildFullPack();
    const markdown = render(pack);
    expect(markdown).toContain(pack.sections.resume);
    expect(markdown).toContain(pack.sections.matriceValidation);
    expect(markdown).toContain(pack.sections.provisioning);
    for (const rendu of pack.sections.rendus) {
      expect(markdown).toContain(rendu);
    }
  });

  it('dégrade proprement en "N.A." les sections optionnelles absentes (qualité, trouvailles)', () => {
    const markdown = render(buildMinimalPack());
    expect(markdown).toContain('## Qualité');
    expect(markdown).toContain('## Trouvailles');
    expect(markdown).toMatch(/## Qualité\s*\n+N\.A\./);
    expect(markdown).toMatch(/## Trouvailles\s*\n+N\.A\./);
  });

  it('dégrade proprement "Rendus" vide en "N.A."', () => {
    const markdown = render(buildMinimalPack());
    expect(markdown).toMatch(/## Rendus\s*\n+N\.A\./);
  });
});
