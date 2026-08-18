/**
 * `emitters/github-comment.ts` — Émetteur OPT-IN du pack de review (fiche 0183,
 * ADR-038 §4). Projette le `ReviewPack` en corps de commentaire GitHub.
 *
 * Adaptateur mince : sa seule responsabilité testée est de **produire le
 * texte**. Aucune I/O, aucun appel `gh` — l'acte `gh pr comment` reste un
 * appel shell à la frontière CLI (`bin/review-emit.ts`, flag `--github`).
 * Preuve d'AC4 : même `ReviewPack` que `emitters/markdown-file.ts`, un second
 * rendu — l'agnosticisme du cœur vis-à-vis du transport.
 */
import type { ReviewPack } from '../contract.js';
import type { ReviewEmitter } from '../ports.js';
import { render } from '../render.js';

export function createGithubCommentEmitter(): ReviewEmitter {
  return {
    emit(pack: ReviewPack): string {
      return render(pack);
    },
  };
}
