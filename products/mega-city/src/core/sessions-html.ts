/**
 * sessions-html — rendu HTML PUR de l'état des sessions (fiche 20260829214131713, ADR-0043).
 *
 * `renderSessionsHtml` transforme un `SessionsData` (déjà calculé par le collecteur pur
 * `sessions-data.ts`) en une page HTML autonome. AUCUNE I/O ici : pas de git, pas de fs, pas
 * de `Date.now()`. Le bord I/O (`bin/ezk-sessions.ts`) recalcule les données et rappelle cette
 * fonction à chaque requête — la page n'est jamais écrite sur disque (ADR-0043 D2).
 */
import type { SessionRow, SessionsData } from './sessions-data.js';

/** Échappe une valeur dynamique avant insertion dans le HTML — anti-injection. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTableRow(row: SessionRow): string {
  const supprimable = row.deletable
    ? `oui (${escapeHtml(row.deletableReason)})`
    : `non (${escapeHtml(row.deletableReason)})`;
  return `
    <tr>
      <td>${escapeHtml(row.path)}</td>
      <td>${escapeHtml(row.branch || '(détaché)')}</td>
      <td>${escapeHtml(row.subject)}</td>
      <td class="activity-${row.sessionActivity}">${escapeHtml(row.sessionActivity)}</td>
      <td>${escapeHtml(row.pr)}</td>
      <td>${supprimable}</td>
    </tr>`;
}

function renderTable(rows: SessionRow[]): string {
  const body = rows.map(renderTableRow).join('');
  return `
  <table>
    <thead>
      <tr>
        <th>dossier</th>
        <th>branche</th>
        <th>sujet</th>
        <th>session</th>
        <th>PR</th>
        <th>supprimable</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>`;
}

function renderRecommendations(rows: SessionRow[]): string {
  const deletable = rows.filter((r) => r.deletable);
  const list =
    deletable.length === 0
      ? '<p>Rien à nettoyer.</p>'
      : `<ul>${deletable
          .map((r) => `<li>${escapeHtml(r.path)} (${escapeHtml(r.deletableReason)})</li>`)
          .join('')}</ul>`;
  return `
  <section>
    <h2>Recommandations</h2>
    ${list}
  </section>`;
}

function renderCollisions(rows: SessionRow[]): string {
  const withCollisions = rows.filter((r) => r.collisionsWith.length > 0);
  if (withCollisions.length === 0) {
    return `
  <section>
    <h2>⚠ Collisions</h2>
    <p>Aucune collision détectée.</p>
  </section>`;
  }
  const items = withCollisions
    .flatMap((row) =>
      row.collisionsWith.map((c) => {
        const files = c.files
          .slice()
          .sort((a, b) => Number(b.hot) - Number(a.hot))
          .map((f) =>
            f.hot
              ? `<span class="file-hot">${escapeHtml(f.file)}</span>`
              : `<span class="file">${escapeHtml(f.file)}</span>`,
          )
          .join(', ');
        return `<li>${escapeHtml(row.path)} ↔ ${escapeHtml(c.path)} : ${files}</li>`;
      }),
    )
    .join('');
  return `
  <section>
    <h2>⚠ Collisions</h2>
    <ul>${items}</ul>
  </section>`;
}

const STYLE = `
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #1b1b1b; }
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.1rem; margin-top: 2rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; text-align: left; font-size: 0.9rem; }
  th { background: #f0f0f0; }
  .activity-active { color: #1565c0; font-weight: 600; }
  .activity-dormant { color: #757575; }
  .file-hot { background: #f6d7d7; color: #c62828; padding: 0 0.25rem; border-radius: 3px; font-weight: 600; }
  .file { color: #444; }
`;

/** Page HTML autonome : tableau des sessions + recommandations + collisions. Aucune I/O. */
export function renderSessionsHtml(data: SessionsData): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>ezk-sessions — état live</title>
<style>${STYLE}</style>
</head>
<body>
  <h1>En clair : état des worktrees — dossier, branche, session, PR, supprimable.</h1>
  ${renderTable(data.rows)}
  ${renderRecommendations(data.rows)}
  ${renderCollisions(data.rows)}
</body>
</html>`;
}
