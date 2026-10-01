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
  /**
   * Forks écartés de `rows` par l'option `--no-forks` (fiche 20260829132313947). Absent quand
   * l'option n'est pas appliquée ; `count: 0` quand elle l'est mais qu'il n'y avait rien à masquer.
   */
  hiddenForks?: { count: number; minutes: number };
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

/**
 * Écarte du rapport les forks qui ne pèsent PAS sur le quota : publics ET sans coût net.
 * Un fork privé, de visibilité inconnue ou facturé RESTE affiché — masquer ce qui consomme
 * ferait mentir la conso (la table ne ment pas). Les totaux sont recalculés sur les lignes
 * gardées ; ce qui est masqué est compté à part (`hiddenForks`) pour ne rien perdre.
 * `forks` : noms de repo (même clé que `row.repo`) dont l'API a rendu `fork: true`.
 * Pur : le rapport d'entrée n'est pas modifié.
 */
export function hideFreeForks(report: ConsoReport, forks: ReadonlySet<string>): ConsoReport {
  const rows: ConsoRow[] = [];
  let count = 0;
  let minutes = 0;
  for (const row of report.rows) {
    if (forks.has(row.repo) && row.visibility === 'public' && row.netUsd <= 0) {
      count += 1;
      minutes += row.minutes;
    } else {
      rows.push(row);
    }
  }
  return {
    rows,
    totalMinutes: rows.reduce((sum, r) => sum + r.minutes, 0),
    totalNetUsd: rows.reduce((sum, r) => sum + r.netUsd, 0),
    hiddenForks: { count, minutes },
  };
}

export interface ConsoArgs {
  /** Période brute `YYYY-MM` (validée par la CLI) ; absente = mois courant. */
  period?: string;
  /** `--no-forks` : masquer les forks publics sans coût (voir `hideFreeForks`). */
  noForks: boolean;
}

/**
 * Lit les arguments de la CLI (`process.argv.slice(2)`) : une période optionnelle et `--no-forks`.
 * Pur. Jette sur une option inconnue ou une 2e période — une faute de frappe (`--no-fork`)
 * ne doit pas passer en silence et laisser croire que les forks sont masqués.
 */
export function parseConsoArgs(argv: readonly string[]): ConsoArgs {
  const args: ConsoArgs = { noForks: false };
  for (const arg of argv) {
    if (arg === '--') {
      continue; // séparateur laissé par un lanceur (pnpm/npm) : sans sens ici
    } else if (arg === '--no-forks') {
      args.noForks = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`option inconnue « ${arg} » — attendu : [YYYY-MM] [--no-forks]`);
    } else if (args.period === undefined) {
      args.period = arg;
    } else {
      throw new Error(`une seule période attendue (« ${args.period} » puis « ${arg} »)`);
    }
  }
  return args;
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
  if (report.hiddenForks) {
    // L'info masquée n'est pas perdue : combien de forks, combien de minutes, et pourquoi sans enjeu.
    lines.push(
      `forks masqués : ${report.hiddenForks.count} (${report.hiddenForks.minutes} min — publics, sans coût ; hors du total ci-dessus)`,
    );
  }
  // Qualifié (retour Codex #186, comment 6) : un public sur GROS runner peut être facturé
  // (colonne coût ci-dessus) — ne pas affirmer « public = gratuit » sans réserve, sinon le
  // pied contredit une ligne « $X.XX public ».
  lines.push(
    'note : seuls les repos PRIVÉS comptent contre le quota Free (public = gratuit sur les ' +
      'runners STANDARD ; un gros runner billable apparaît en coût ci-dessus).',
  );
  return lines.join('\n');
}
