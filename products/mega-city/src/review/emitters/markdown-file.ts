/**
 * `emitters/markdown-file.ts` — Émetteur TOUJOURS actif du pack de review
 * (fiche 0183, ADR-038). Écrit `features/reviews/<id>-slug/REVIEW.md` (+
 * `assets/`) sous une racine `reviewsRoot` donnée. Le fichier in-repo écrit
 * ici **est** le substrat durable (SoT) — les autres émetteurs ne font que
 * projeter le même `ReviewPack`.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ReviewPack } from '../contract.js';
import type { ReviewEmitter } from '../ports.js';
import { render } from '../render.js';

export interface MarkdownFileEmitterOptions {
  /** Racine sous laquelle écrire `<id>-slug/REVIEW.md` (ex. `features/reviews`). */
  reviewsRoot: string;
}

/**
 * Dérive le nom de dossier `<fiche>-<slug>` depuis le front-matter du pack.
 * Si `branch` suit la convention `feat/<fiche>-<slug>`, le slug est repris tel
 * quel ; sinon le dossier retombe sur `<fiche>` seul (dégradation propre).
 */
function reviewDirName(pack: ReviewPack): string {
  const { fiche, branch } = pack.frontMatter;
  const prefix = `feat/${fiche}-`;
  if (branch.startsWith(prefix)) {
    return `${fiche}-${branch.slice(prefix.length)}`;
  }
  return fiche;
}

/**
 * Garde-fou de confinement (ADR-038) : le dossier cible DOIT rester strictement
 * sous `reviewsRoot`. Un `fiche`/slug piégé (`..`, chemin absolu) qui ferait
 * sortir la SoT de l'arbre des reviews est rejeté — plutôt qu'écrire
 * silencieusement le `REVIEW.md` hors dépôt (l'invariant « le fichier in-repo
 * EST le substrat durable » suppose qu'il reste DANS le dépôt).
 */
function assertConfined(reviewsRoot: string, dir: string): void {
  const root = path.resolve(reviewsRoot);
  const target = path.resolve(dir);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error(
      `ReviewPack refusé : chemin cible "${target}" hors de la racine des reviews "${root}" ` +
        `(fiche/slug non confiné : "${dir}")`,
    );
  }
}

/**
 * Émetteur markdown-file : écrit le pack rendu à un chemin déterministe et
 * idempotent (même pack → même fichier, aucune duplication). Refuse d'écrire
 * hors de `reviewsRoot` (garde-fou de confinement ci-dessus).
 */
export function createMarkdownFileEmitter(options: MarkdownFileEmitterOptions): ReviewEmitter {
  return {
    emit(pack: ReviewPack): string {
      const dir = path.join(options.reviewsRoot, reviewDirName(pack));
      assertConfined(options.reviewsRoot, dir);
      fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });

      const filePath = path.join(dir, 'REVIEW.md');
      fs.writeFileSync(filePath, render(pack), 'utf-8');
      return filePath;
    },
  };
}
