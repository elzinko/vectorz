/**
 * Cœur pur — rend une FICHE en CORPS DE PR (ADR-0029 : « la fiche est le document, la PR
 * en est le rendu »). En mode `github: false` (fiche 20260916225506856), ce même rendu
 * s'écrit dans un fichier LOCAL au lieu d'être posté sur une PR GitHub : c'est « ce qu'une
 * PR contiendrait », le même texte des deux côtés (direction PO, 2026-09-17).
 *
 * Le corps = ligne de provenance + prose de la fiche (sans front-matter) + matrice
 * « Validation » (le seul bloc propre à la PR, ADR-0029 pt 4). AUCUNE I/O ici (ADR-0003) :
 * la lecture de la fiche et l'écriture du fichier vivent dans `bin/pr-emit-local.ts`.
 *
 * Le rendu vise le contrat de `skills/ezk-pr/scripts/check-pr-body.sh` (le garde-fou du corps
 * de PR). Il RECOPIE la fiche : il ne fabrique pas les sections manquantes. Une fiche complète
 * (En clair + Contexte + Proposition + Critères + Comment vérifier) produit un corps conforme ;
 * une fiche incomplète produit un corps incomplet, et le garde-fou le signale.
 */

export interface ValidationRow {
  readonly modalite: string;
  readonly statut: string;
}

/**
 * Matrice « Validation » par défaut du mode local : pas de CI cloud ni de revue Codex — les
 * modalités sont les gates LOCALES (fiche 20260916225506856). `⏳` = à statuer au moment de
 * l'émission ; l'émetteur tournant APRÈS la gate locale et la revue adverse, l'appelant passe
 * normalement l'état RÉEL via `--validation` (`✅`), le `⏳` n'étant qu'un repli.
 *
 * La ligne « Before / after (UI) » (ADR-0045) n'est PAS dans ce défaut générique : l'émetteur
 * rend une fiche, il ne connaît pas le diff — la détection des chemins d'écran vit dans
 * `pr-evidence.sh` / `check-pr-body.sh`. Quand la feature touche un écran, l'appelant ajoute
 * cette ligne via `--validation` (liens avant+après ou « N.A. — <raison> »).
 */
export const DEFAULT_LOCAL_VALIDATION: readonly ValidationRow[] = [
  { modalite: 'Gate locale (build · test · lint)', statut: '⏳' },
  { modalite: 'Revue adverse locale (ezk-reviewer)', statut: '⏳' },
];

/**
 * Retire le front-matter YAML (`---\n…\n---`) en tête et renvoie la prose seule. Le corps de
 * PR ne porte PAS les métadonnées (id/status/pr…) : elles vivent dans la fiche source, pas
 * dans son rendu. Repli défensif : sans délimiteur de front-matter, renvoie le texte entier.
 */
export function ficheBody(ficheText: string): string {
  return ficheText.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').replace(/^\s+/, '');
}

function renderValidation(rows: readonly ValidationRow[]): string {
  const lines = rows.map((r) => `| ${r.modalite} | ${r.statut} |`);
  return ['## Validation', '', '| Modalité | Statut |', '|---|---|', ...lines].join('\n');
}

export interface RenderPrBodyInput {
  /** Texte brut de la fiche (front-matter + prose). */
  readonly ficheText: string;
  /** Chemin CONCRET de la fiche, relatif à la racine du projet (ex. `features/0191-slug.md`).
   *  Sert de ligne de provenance — `check-pr-body.sh` rejette le placeholder `<id>_<slug>`. */
  readonly fichePath: string;
  /** Matrice de validation ; par défaut les gates locales (`DEFAULT_LOCAL_VALIDATION`). */
  readonly validation?: readonly ValidationRow[];
}

/**
 * Rend le corps de PR : provenance + prose de la fiche + matrice « Validation ».
 * C'est le rendu utilisé DES DEUX CÔTÉS — corps de PR GitHub quand `github` est allumé,
 * fichier local quand il est coupé — d'où l'unicité du texte (ADR-0029).
 */
export function renderPrBody(input: RenderPrBodyInput): string {
  const body = ficheBody(input.ficheText);
  const validation = renderValidation(input.validation ?? DEFAULT_LOCAL_VALIDATION);
  return `> 🗎 Rendu de la fiche ${input.fichePath}\n\n${body}\n\n${validation}\n`;
}
