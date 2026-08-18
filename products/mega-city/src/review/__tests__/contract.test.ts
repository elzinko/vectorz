import { describe, expect, it } from 'vitest';
import {
  CONTRACT_URI,
  REVIEW_STATUSES,
  validateReviewPack,
  type ReviewPack,
} from '../contract.js';

function buildValidPack(): ReviewPack {
  return {
    frontMatter: {
      schema: CONTRACT_URI,
      fiche: '0183',
      branch: 'feat/0183-pack-review-markdown-first',
      product: 'mega-city',
      method: { name: 'ezk-sprint', version: '0.1.0' },
      status: 'ready-for-review',
      created: '2026-08-17',
    },
    sections: {
      resume: 'Pack de review markdown-first implémenté.',
      rendus: ['assets/before.png', 'assets/after.png'],
      matriceValidation: 'CI: ✅ · Tests unitaires: ✅',
      aTester: 'Rejouer `pnpm test` depuis products/mega-city.',
      provisioning: 'pnpm --dir products/mega-city test',
    },
  };
}

describe('contract method-review@0.1', () => {
  it('expose une URI de contrat versionnée stable', () => {
    expect(CONTRACT_URI).toBe('method-review@0.1');
  });

  it('accepte un pack valide sans lancer', () => {
    expect(() => validateReviewPack(buildValidPack())).not.toThrow();
  });

  it("refuse un pack dont le front-matter n'a pas le champ requis 'fiche'", () => {
    const pack = buildValidPack();
    // @ts-expect-error test délibéré d'un front-matter incomplet
    delete pack.frontMatter.fiche;
    expect(() => validateReviewPack(pack)).toThrow(/fiche/);
  });

  it("refuse un pack dont le front-matter n'a pas le champ requis 'method.version'", () => {
    const pack = buildValidPack();
    // @ts-expect-error test délibéré d'un front-matter incomplet
    delete pack.frontMatter.method.version;
    expect(() => validateReviewPack(pack)).toThrow(/method\.version/);
  });

  it('refuse un status hors énum', () => {
    const pack = buildValidPack();
    // @ts-expect-error test délibéré d'un status invalide
    pack.frontMatter.status = 'wip';
    expect(() => validateReviewPack(pack)).toThrow(/status/);
  });

  it("liste les 3 statuts autorisés de l'énum", () => {
    expect(REVIEW_STATUSES).toEqual(['ready-for-review', 'changes-requested', 'approved']);
  });

  it('refuse un schema qui ne correspond pas à la CONTRACT_URI courante', () => {
    const pack = buildValidPack();
    pack.frontMatter.schema = 'method-review@9.9';
    expect(() => validateReviewPack(pack)).toThrow(/schema/);
  });

  it('accepte les champs optionnels run_id et pr quand présents', () => {
    const pack = buildValidPack();
    pack.frontMatter.run_id = 'run-123';
    pack.frontMatter.pr = 'https://github.com/example/pr/1';
    expect(() => validateReviewPack(pack)).not.toThrow();
  });

  it('refuse un pack dont une section obligatoire (resume) est absente', () => {
    const pack = buildValidPack();
    // @ts-expect-error test délibéré d'une section requise manquante
    delete pack.sections.resume;
    expect(() => validateReviewPack(pack)).toThrow(/resume/);
  });

  it("refuse un pack dont la section 'rendus' n'est pas un tableau", () => {
    const pack = buildValidPack();
    // @ts-expect-error test délibéré d'un rendus non-tableau
    pack.sections.rendus = 'assets/before.png';
    expect(() => validateReviewPack(pack)).toThrow(/rendus/);
  });
});
