import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONTRACT_URI, type ReviewPack } from '../contract.js';
import { render } from '../render.js';
import { createMarkdownFileEmitter } from '../emitters/markdown-file.js';

function buildPack(): ReviewPack {
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
      rendus: [],
      matriceValidation: 'CI ✅',
      aTester: 'pnpm test',
      provisioning: 'pnpm --dir products/mega-city test',
    },
  };
}

describe('markdown-file emitter — écrit features/reviews/<id>-slug/REVIEW.md', () => {
  let reviewsRoot: string;

  beforeEach(() => {
    reviewsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'review-md-emitter-'));
  });

  afterEach(() => {
    fs.rmSync(reviewsRoot, { recursive: true, force: true });
  });

  it('écrit REVIEW.md au bon chemin, dérivé de fiche + slug de branche', () => {
    const emitter = createMarkdownFileEmitter({ reviewsRoot });
    const pack = buildPack();

    emitter.emit(pack);

    const expectedPath = path.join(
      reviewsRoot,
      '0183-pack-review-markdown-first',
      'REVIEW.md',
    );
    expect(fs.existsSync(expectedPath)).toBe(true);
    expect(fs.readFileSync(expectedPath, 'utf-8')).toBe(render(pack));
  });

  it('crée le dossier assets/ à côté de REVIEW.md', () => {
    const emitter = createMarkdownFileEmitter({ reviewsRoot });
    emitter.emit(buildPack());

    const assetsDir = path.join(reviewsRoot, '0183-pack-review-markdown-first', 'assets');
    expect(fs.existsSync(assetsDir)).toBe(true);
    expect(fs.statSync(assetsDir).isDirectory()).toBe(true);
  });

  it('est idempotent : ré-émettre le même pack ré-écrit le même fichier sans dupliquer', () => {
    const emitter = createMarkdownFileEmitter({ reviewsRoot });
    const pack = buildPack();

    emitter.emit(pack);
    emitter.emit(pack);

    const dir = path.join(reviewsRoot, '0183-pack-review-markdown-first');
    expect(fs.readdirSync(dir).sort()).toEqual(['REVIEW.md', 'assets']);
  });

  it('retourne le chemin du fichier écrit', () => {
    const emitter = createMarkdownFileEmitter({ reviewsRoot });
    const result = emitter.emit(buildPack());

    expect(result).toBe(
      path.join(reviewsRoot, '0183-pack-review-markdown-first', 'REVIEW.md'),
    );
  });

  it('refuse un slug de branche piégé (`..`) qui sortirait de reviewsRoot (confinement ADR-038)', () => {
    const emitter = createMarkdownFileEmitter({ reviewsRoot });
    const pack = buildPack();
    pack.frontMatter.branch = 'feat/0183-../../../../tmp/evil';

    expect(() => emitter.emit(pack)).toThrow(/confin|hors de la racine/i);
    // la garde s'exécute AVANT tout mkdir/write : rien n'est écrit hors racine
    expect(fs.readdirSync(reviewsRoot)).toEqual([]);
  });

  it('refuse une fiche piégée (`..`) en repli hors convention de branche', () => {
    const emitter = createMarkdownFileEmitter({ reviewsRoot });
    const pack = buildPack();
    pack.frontMatter.fiche = '../../../../tmp/pwn';
    pack.frontMatter.branch = 'not-a-feat-branch';

    expect(() => emitter.emit(pack)).toThrow(/confin|hors de la racine/i);
    expect(fs.readdirSync(reviewsRoot)).toEqual([]);
  });
});
