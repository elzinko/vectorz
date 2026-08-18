import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONTRACT_URI, type ReviewPack } from '../contract.js';
import { render } from '../render.js';
import { createGithubCommentEmitter } from '../emitters/github-comment.js';

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
      rendus: ['assets/before.png'],
      matriceValidation: 'CI ✅',
      aTester: 'pnpm test',
      provisioning: 'pnpm --dir products/mega-city test',
    },
  };
}

describe('github-comment emitter — projette le même ReviewPack en corps de commentaire (AC4)', () => {
  let scratchDir: string;

  beforeEach(() => {
    scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-github-emitter-'));
  });

  afterEach(() => {
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  it('produit le même contenu markdown que render(pack) — une source, deux rendus', () => {
    const emitter = createGithubCommentEmitter();
    const pack = buildPack();

    const body = emitter.emit(pack);

    expect(body).toBe(render(pack));
  });

  it("n'écrit AUCUN fichier sur disque (dossier scratch resté vide après emit)", () => {
    createGithubCommentEmitter().emit(buildPack());

    expect(fs.readdirSync(scratchDir)).toEqual([]);
  });

  it("n'invoque jamais `gh` (aucun accès à child_process depuis cet émetteur)", () => {
    // L'émetteur ne doit importer ni exécuter aucune commande shell : il retourne
    // un texte, l'acte `gh pr comment` reste à la frontière CLI (ADR-038 §4).
    const source = fs.readFileSync(
      new URL('../emitters/github-comment.ts', import.meta.url),
      'utf-8',
    );
    expect(source).not.toMatch(/child_process|execFile|spawn|exec\(/);
    expect(source).not.toContain("'gh'");
    expect(source).not.toContain('"gh"');
    expect(source).not.toMatch(/from 'node:fs'|from "node:fs"/);
  });
});
