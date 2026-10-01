/**
 * versions-render — le texte que `ezk-backlog version` affiche (fiche 20260824204751403).
 * PUR : des lignes en entrée de `console.log`, « En clair » toujours en tête (règle de lisibilité).
 */
import {
  type VersionFinding,
  type VersionState,
  type VersionsReport,
  tagOf,
} from './versions.js';

const STATE_LABEL: Record<VersionState, string> = {
  'en-cours': 'en cours',
  'a-clore': 'à clore',
  livree: 'livrée',
  rouverte: 'rouverte',
  vide: 'vide',
};

/** Un tableau en texte : première et dernière colonnes à gauche, les nombres à droite. */
function table(head: string[], rows: string[][]): string[] {
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)));
  const last = head.length - 1;
  const line = (cells: string[]): string =>
    cells
      .map((c, i) => (i === 0 || i === last ? c.padEnd(widths[i]) : c.padStart(widths[i])))
      .join('  ')
      .trimEnd();
  return [line(head), ...rows.map(line)];
}

/** La liste des versions : états, compteurs, et les fiches sans version dites en toutes lettres. */
export function renderVersionList(report: VersionsReport): string[] {
  const perState = new Map<VersionState, number>();
  for (const lot of report.lots) perState.set(lot.state, (perState.get(lot.state) ?? 0) + 1);
  const states = [...perState].map(([state, n]) => `${n} ${STATE_LABEL[state]}`).join(', ');
  const { total, parked } = report.unversioned;

  let intro =
    report.lots.length === 0
      ? 'En clair : aucune fiche ne porte de version.'
      : `En clair : ${report.lots.length} version(s) dans le backlog (${states}).`;
  intro += ` ${total} fiche(s) active(s) n'ont pas de version, dont ${parked} parkée(s).`;
  if (report.malformed.length > 0) {
    intro += ` ${report.malformed.length} fiche(s) ont une version illisible : lance « version check ».`;
  }

  if (report.lots.length === 0) return [intro];
  const rows = report.lots.map((l) => [
    l.version,
    String(l.shipped.length + l.todo.length),
    String(l.shipped.length),
    String(l.todo.length),
    String(l.ready.length),
    String(l.blocked.length),
    String(l.intruders.length),
    l.state === 'livree' ? `${STATE_LABEL[l.state]} (${tagOf(l.version)})` : STATE_LABEL[l.state],
  ]);
  return [
    intro,
    '',
    ...table(['Version', 'Fiches', 'Livrées', 'À faire', 'Prêtes', 'Bloquées', 'Intrus', 'État'], rows),
  ];
}

/** Les constats du contrôle de lot, et ce qu'il ne contrôle pas. */
export function renderFindings(findings: readonly VersionFinding[], scope: string): string[] {
  const errors = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.length - errors;
  const intro =
    findings.length === 0
      ? `En clair : ${scope} tient debout : aucune erreur, aucune alerte.`
      : `En clair : ${errors} erreur(s) et ${warnings} alerte(s) pour ${scope}.`;
  const lines = findings.map((f) => {
    const who = f.ficheId ? `${f.version} · ${f.ficheId}` : f.version;
    return `  ${f.severity === 'error' ? '✗ erreur' : '⚠ alerte'} [${f.code}] ${who} — ${f.message}`;
  });
  return [
    intro,
    ...(lines.length > 0 ? ['', ...lines] : []),
    '',
    "Non contrôlé ici : le séquencement des dépendances (le champ `depends:` n'est pas encore lu).",
  ];
}

/** La clôture refusée : ce qui reste, en clair. */
export function renderRefusal(version: string, reasons: readonly string[]): string[] {
  return [`En clair : ${version} n'est pas prête à être close. Rien n'a été écrit.`, '', ...reasons];
}

/**
 * La clôture acceptée : l'étiquette est PROPOSÉE, jamais exécutée ni poussée par le script. Elle vise
 * `HEAD`, le commit dont les fiches ont été lues ; `originMain` (sa pointe, si on la connaît) permet de
 * dire si ce commit est bien la pointe de `origin/main`.
 */
export function renderProposal(
  version: string,
  tag: string,
  sha: string,
  originMain?: string,
): string[] {
  const where =
    originMain === undefined
      ? "Pas de origin/main connu : l'étiquette vise HEAD, le commit dont les fiches ont été lues."
      : originMain === sha
        ? "L'étiquette vise HEAD, qui est la pointe de origin/main : le commit dont les fiches ont été lues."
        : `Attention : HEAD (${sha.slice(0, 9)}) n'est pas la pointe de origin/main (${originMain.slice(0, 9)}). L'étiquette vise HEAD, le commit dont les fiches ont été lues.`;
  return [
    `En clair : ${version} est complète, toutes ses fiches sont livrées.`,
    '',
    "Étiquette proposée (rien n'est exécuté) :",
    `  git tag -a ${tag} -m "Version ${version}" ${sha}`,
    `  git push origin ${tag}`,
    '',
    where,
    `Pour créer l'étiquette en local, relance avec --tag. Réversible : git tag -d ${tag}. Jamais poussée.`,
  ];
}
