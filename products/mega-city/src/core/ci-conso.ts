/**
 * ci-conso — la CONSO GitHub Actions par repo, agrégée depuis l'API billing. PUR (ADR-0003).
 *
 * Fiche 20260828150801613 : `ezk-ci conso` doit rendre le MÊME chiffre à chaque fois, sans
 * que le LLM ne réinvente `gh` + `jq` (ADR-0001 : le script compte, le LLM juge). Le bord I/O
 * (`bin/ci-conso.ts`) appelle `gh api` ; ICI on ne fait qu'agréger un `usageItems` déjà
 * récupéré — donc testable avec une fixture, déterministe.
 *
 * Endpoint source (« enhanced billing platform ») :
 *   GET /users/<u>/settings/billing/usage?year=YYYY&month=M
 *     → { usageItems: [{ product, sku, quantity, unitType, netAmount, repositoryName, … }] }
 * L'ancien GET /users/<u>/settings/billing/actions répond **410 (migré)** — fiche 20260828150801613.
 */

export interface UsageItem {
  product: string; // "actions" | "codespaces" | "packages" | …
  sku: string; // "Actions Linux" | "Actions macOS 3-core" | "Actions storage" | …
  quantity: number;
  unitType: string; // "Minutes" | "GigabyteHours" | "Hours" | …
  netAmount: number; // part FACTURÉE après remise du quota gratuit (0 si couvert / repo public)
  repositoryName: string;
}

export interface ConsoRow {
  repo: string;
  minutes: number; // somme des SKU Actions comptés en Minutes
  netUsd: number; // part facturée (Actions, tous SKU du repo)
  visibility: string; // "public" | "private" | "?" (inconnu)
}

export interface ConsoReport {
  rows: ConsoRow[]; // triées minutes DESC puis repo (déterministe)
  totalMinutes: number;
  totalNetUsd: number;
}

/**
 * Un item compte-t-il comme des MINUTES d'Actions ? On ignore le stockage (GigabyteHours),
 * Codespaces et Packages — seules les minutes de runner pèsent sur le quota Actions.
 */
export function isActionsMinutes(item: UsageItem): boolean {
  // Casse TOLÉRANTE (revue adverse, P2) : l'API live rend "actions"/"Minutes", mais la
  // DOC GitHub écrit "Actions"/"minutes". Comparer en minuscules évite un rapport vide EN
  // SILENCE si GitHub normalise un jour la casse — le mensonge « 0 min » que la fiche combat.
  return item.product?.toLowerCase() === 'actions' && item.unitType?.toLowerCase() === 'minutes';
}

/**
 * Agrège les `usageItems` en une ligne par repo (minutes Actions + part facturée), triée.
 * `visibility` : map repo → "public"/"private" (best-effort ; défaut "?" si absente — seuls
 * les repos PRIVÉS comptent contre le quota Free, d'où l'intérêt de la colonne).
 * Déterministe : même entrée → même sortie.
 */
export function aggregateActionsUsage(
  items: UsageItem[],
  visibility: Record<string, string> = {},
): ConsoReport {
  const byRepo = new Map<string, { minutes: number; netUsd: number }>();
  for (const item of items) {
    if (!isActionsMinutes(item)) continue;
    const acc = byRepo.get(item.repositoryName) ?? { minutes: 0, netUsd: 0 };
    acc.minutes += item.quantity;
    acc.netUsd += item.netAmount;
    byRepo.set(item.repositoryName, acc);
  }
  const rows: ConsoRow[] = [...byRepo.entries()]
    .map(([repo, acc]) => ({
      repo,
      minutes: Math.round(acc.minutes),
      netUsd: acc.netUsd,
      visibility: visibility[repo] ?? '?',
    }))
    .sort((a, b) => b.minutes - a.minutes || a.repo.localeCompare(b.repo));
  const totalMinutes = rows.reduce((sum, r) => sum + r.minutes, 0);
  const totalNetUsd = rows.reduce((sum, r) => sum + r.netUsd, 0);
  return { rows, totalMinutes, totalNetUsd };
}

/** Rendu texte déterministe — le LLM LIT cette table, il ne recompte pas (ADR-0001). */
export function formatConsoReport(report: ConsoReport, period: string): string {
  const lines: string[] = [];
  lines.push(`Conso GitHub Actions — ${period}`);
  lines.push('minutes  coût     visibilité  repo');
  for (const r of report.rows) {
    // Le coût SUIT netUsd, jamais la seule visibilité (retour Codex #186) : un repo public
    // sur gros runners billables peut avoir netAmount > 0 — afficher « gratuit » le masquerait
    // et contredirait le total. « gratuit » réservé au public à net nul (runners standard).
    const cost =
      r.netUsd > 0
        ? `$${r.netUsd.toFixed(2)}`
        : r.visibility === 'public'
          ? 'gratuit'
          : '$0.00';
    lines.push(
      `${String(r.minutes).padStart(7)}  ${cost.padEnd(7)}  ${r.visibility.padEnd(10)} ${r.repo}`,
    );
  }
  lines.push(`total : ${report.totalMinutes} min · net facturé $${report.totalNetUsd.toFixed(2)}`);
  // Qualifié (retour Codex #186, comment 6) : un public sur GROS runner peut être facturé
  // (colonne coût ci-dessus) — ne pas affirmer « public = gratuit » sans réserve, sinon le
  // pied contredit une ligne « $X.XX public ».
  lines.push(
    'note : seuls les repos PRIVÉS comptent contre le quota Free (public = gratuit sur les ' +
      'runners STANDARD ; un gros runner billable apparaît en coût ci-dessus).',
  );
  return lines.join('\n');
}
