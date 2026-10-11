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

/**
 * Le statut GitHub tel que l'affiche `ezk config show` — un seul texte, que le terminal et la page
 * « config » du cockpit partagent (ADR-0062) : la page ne peut pas montrer d'autres valeurs.
 */
export function githubStatusText(configFile: string, caps: GithubCapabilities): string {
  const flag = (on: boolean): string => (on ? 'ON ' : 'OFF');
  return [
    `Config projet    : ${configFile}`,
    `github.pr            ${flag(caps.pr)}   (ouvrir une pull request)`,
    `github.ci            ${flag(caps.ci)}   (attendre la CI cloud)`,
    `github.codex-review  ${flag(caps.codexReview)}   (revue Codex)`,
  ].join('\n');
}

/**
 * Cœur pur — résolution des CHEMINS des artefacts de process depuis la clé `scrum`
 * de la config projet `.vectorz/` (fiche 20261001192624192, ADR-0066). Frère exact de
 * `resolveGithub` : AUCUNE I/O (ADR-0003), la lecture du fichier vit dans le loader.
 *
 * Où vivent les récits de sprint, le journal, les preuves de PR et les sorties de rétro.
 * Ces chemins étaient codés en dur dans 7 skills ; cette fonction en fait une seule source.
 *
 * Sémantique (défaut = non-régression : les anciens chemins `docs/…`) :
 *   - `scrum` absent / `false` / autre → disposition LEGACY (`docs/…`)
 *   - `scrum: true`                    → disposition groupée sous `scrum/…`
 *   - `scrum: { <clé>: <chemin> }`     → base LEGACY, chaque clé donnée en chaîne non vide
 *                                        REMPLACE son chemin (jamais de déplacement silencieux
 *                                        des autres clés — on ne range que ce qu'on nomme)
 */
export interface ScrumPaths {
  /** récits / clôtures de sprint */
  readonly sprints: string;
  /** journal des galères résolues */
  readonly journal: string;
  /** preuves avant/après des PR */
  readonly evidence: string;
  /** notes de rétro */
  readonly retroNotes: string;
  /** captures de rétro */
  readonly retroCaptures: string;
}

/** Les 5 clés pilotables (ni `docs/adr/` ni `features/`, qui restent fixes). */
export const SCRUM_PATH_KEYS = [
  'sprints',
  'journal',
  'evidence',
  'retroNotes',
  'retroCaptures',
] as const;
export type ScrumPathKey = (typeof SCRUM_PATH_KEYS)[number];

/** Disposition actuelle (défaut sûr) : rien ne bouge tant que `scrum:` n'est pas posé. */
export const SCRUM_LEGACY: ScrumPaths = {
  sprints: 'docs/sessions',
  journal: 'docs/journal',
  evidence: 'docs/pr-evidence',
  retroNotes: 'docs/retro-notes',
  retroCaptures: 'docs/captures',
};

/** Disposition groupée (`scrum: true`) : tous les artefacts de process sous `scrum/`. */
export const SCRUM_GROUPED: ScrumPaths = {
  sprints: 'scrum/sprints',
  journal: 'scrum/journal',
  evidence: 'scrum/evidence',
  retroNotes: 'scrum/retro/notes',
  retroCaptures: 'scrum/retro/captures',
};

export function resolveScrumPaths(raw: unknown): ScrumPaths {
  if (raw === true) return SCRUM_GROUPED;
  if (raw !== null && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const out: Record<ScrumPathKey, string> = { ...SCRUM_LEGACY };
    for (const k of SCRUM_PATH_KEYS) {
      const v = o[k];
      if (typeof v === 'string' && v.trim() !== '') out[k] = v;
    }
    return out;
  }
  // undefined / null / false / string / number… → défaut sûr (legacy, rien ne bouge)
  return SCRUM_LEGACY;
}
