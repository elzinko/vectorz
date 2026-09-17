/**
 * Cœur pur — résolution des capacités du plugin `github` depuis la config projet `.vectorz/`.
 *
 * Modèle plugin (fiche 20260916225506856) : `github` est un MODULE activable
 * (ADR-0039 §2 — la PR est un mécanisme GitHub, pas une cérémonie), piloté par la
 * couche de config projet `.vectorz/` (ADR-0050). Le cran mince ne couvre que la
 * famille `github` et ses trois capacités. AUCUNE I/O ici (ADR-0003) : la lecture du
 * fichier vit dans `src/loaders/project-config.ts` ; ce module ne fait que RÉSOUDRE.
 *
 * Sémantique (défaut = non-régression, tout allumé) :
 *   - `github` absent / `true`  → { pr:true, ci:true, codexReview:true }
 *   - `github: false`           → tout OFF (le « déconnecter GitHub »)
 *   - `github: { … }`           → granulaire ; une capacité vaut `false` seulement si
 *                                 écrite `false`, sinon `true` (absente = allumée)
 *   - toute autre valeur        → défaut sûr (tout ON) : on ne coupe jamais par accident
 */

export interface GithubCapabilities {
  /** ouvrir une pull request GitHub */
  readonly pr: boolean;
  /** attendre la CI cloud (GitHub Actions) */
  readonly ci: boolean;
  /** demander la revue Codex sur la PR */
  readonly codexReview: boolean;
}

/** Une capacité est allumée sauf si elle est explicitement `false`. */
function on(value: unknown): boolean {
  return value !== false;
}

/**
 * Résout les capacités github depuis la valeur BRUTE de la clé `github` du YAML
 * (déjà parsée ; `undefined` quand la clé — ou le fichier — est absente).
 *
 * La clé YAML canonique est `codex-review` (kebab), mais la graphie `codexReview`
 * (camel) est acceptée aussi, pour ne pas couper en silence sur une faute de frappe.
 */
export function resolveGithub(raw: unknown): GithubCapabilities {
  if (raw === undefined || raw === null || raw === true) {
    return { pr: true, ci: true, codexReview: true };
  }
  if (raw === false) {
    return { pr: false, ci: false, codexReview: false };
  }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    return {
      pr: on(o.pr),
      ci: on(o.ci),
      codexReview: on(o['codex-review'] ?? o.codexReview),
    };
  }
  // valeur inattendue (string / number…) → défaut sûr
  return { pr: true, ci: true, codexReview: true };
}
