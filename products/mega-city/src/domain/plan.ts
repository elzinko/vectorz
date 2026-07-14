/**
 * Plan d'écriture — la sortie PURE du moteur `bind` (ADR-0003).
 *
 * Le calcul (load → expand → cap.materialize) produit un WritePlan ; il n'écrit
 * jamais sur le disque. La coquille I/O unique (`src/io/apply.ts`) consomme ce plan.
 * Déterministe par construction : `files`/`hooks` sont triés stablement par le cap.
 */

/**
 * Intention de fusion d'un fichier/hook (fiche 0010). Le plan DÉCLARE l'intention ;
 * la coquille I/O lit l'état du projet et fusionne en conséquence.
 *   - `replace`        : le cap POSSÈDE le fichier → écriture franche (défaut, rétro-compat).
 *   - `managed-block`  : fichier PARTAGÉ avec l'humain → ne (ré)écrire que le bloc managé,
 *                        le reste du fichier est préservé à 100%.
 *   - `skip-if-exists` : ne pas écraser un existant qui DIFFÈRE sans `--force` (backup + refus).
 */
export type WriteIntent = 'replace' | 'managed-block' | 'skip-if-exists';

/**
 * Un fichier à écrire. `mode` (octal, ex. 0o755) rend un fichier exécutable.
 * `intent` (défaut `replace`) décrit comment la coquille I/O doit fusionner.
 */
export interface FileWrite {
  path: string; // relatif au projet (ex. '.claude/agents/ezk-reviewer.md')
  content: string;
  mode?: number;
  intent?: WriteIntent;
}

/**
 * Un git hook à poser (toujours exécutable, posé dans .git/hooks par la coquille I/O).
 * `intent` (défaut `replace`) : un hook perso préexistant qui diffère n'est jamais
 * écrasé silencieusement quand `intent === 'skip-if-exists'`.
 */
export interface HookWrite {
  stage: string; // ex. 'commit-msg'
  script: string; // contenu du hook
  intent?: WriteIntent;
}

/** Le plan complet : ce que la coquille I/O doit matérialiser, rien de plus. */
export interface WritePlan {
  files: FileWrite[];
  hooks: HookWrite[];
}
