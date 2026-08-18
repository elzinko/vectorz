/**
 * `ports.ts` — Cœur hexagonal du pack de review (fiche 0183, ADR-038).
 *
 * `ReviewSource` documente l'intention (fabriquer un `ReviewPack` depuis un
 * sprint réel) mais reste une couture nommée sans registre : une seule
 * implémentation existe au MVP (YAGNI, ADR-038 §5).
 *
 * `ReviewEmitter` est le port qui gagne sa place immédiatement : ≥2
 * implémentations (`emitters/markdown-file.ts`, `emitters/github-comment.ts`)
 * prouvent l'agnosticisme des rendus (AC4). Aucun émetteur n'est SoT ; un
 * émetteur peut retourner le texte produit (`string`) pour les rendus qui ne
 * font pas d'IO, ou `void` pour ceux qui écrivent directement.
 */
import type { ReviewPack } from './contract.js';

export interface ReviewSource {
  collect(): ReviewPack;
}

export interface ReviewEmitter {
  emit(pack: ReviewPack): void | string;
}
