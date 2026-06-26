/**
 * Plan d'écriture — la sortie PURE du moteur `bind` (ADR-0003).
 *
 * Le calcul (load → expand → cap.materialize) produit un WritePlan ; il n'écrit
 * jamais sur le disque. La coquille I/O unique (`src/io/apply.ts`) consomme ce plan.
 * Déterministe par construction : `files`/`hooks` sont triés stablement par le cap.
 */

/** Un fichier à écrire. `mode` (octal, ex. 0o755) rend un fichier exécutable. */
export interface FileWrite {
  path: string; // relatif au projet (ex. '.claude/agents/ezk-reviewer.md')
  content: string;
  mode?: number;
}

/** Un git hook à poser (toujours exécutable, posé dans .git/hooks par la coquille I/O). */
export interface HookWrite {
  stage: string; // ex. 'commit-msg'
  script: string; // contenu du hook
}

/** Le plan complet : ce que la coquille I/O doit matérialiser, rien de plus. */
export interface WritePlan {
  files: FileWrite[];
  hooks: HookWrite[];
}
