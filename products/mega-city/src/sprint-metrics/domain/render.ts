import type { SprintReport } from './types.js';

function fmtDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h === 0 ? `${m} min` : `${h} h ${String(m).padStart(2, '0')}`;
}

/** Rendu markdown DEPUIS le JSON (source de vérité) — ouvre par « En clair ». */
export function renderSprintReportMarkdown(report: SprintReport): string {
  const lines: string[] = [];
  lines.push(`# Rapport de sprint — ${report.sprint.slug}`);
  lines.push('');
  lines.push('## En clair');
  lines.push('');
  lines.push(
    `Le sprint **${report.sprint.slug}** a duré **${fmtDuration(report.duration.ms)}** et consommé ` +
      `**${report.tokens.totalTokens} tokens** (grain \`${report.tokens.grain}\`${report.tokens.note ? `, ${report.tokens.note}` : ''}). ` +
      `Il a livré **${report.kpi.shippedFeatures.count} fiche(s)**, essuyé **${report.kpi.blockages.count} blocage(s)** ` +
      `et mergé **${report.kpi.prRetouches.total} PR** sur la fenêtre.`,
  );
  lines.push('');
  if (!report.steps.ventilated) {
    lines.push(`> ${report.steps.note}`);
    lines.push('');
  }
  lines.push('## Détail');
  lines.push('');
  lines.push(`- **Fenêtre** : ${report.window.startTs} → ${report.window.endTs}`);
  lines.push(`- **Durée** : ${report.duration.ms} ms`);
  lines.push(
    `- **Tokens** : entrée ${report.tokens.inputTokens} / sortie ${report.tokens.outputTokens} / ` +
      `total ${report.tokens.totalTokens} (grain \`${report.tokens.grain}\`)`,
  );
  lines.push(
    `- **Fiches livrées** (${report.kpi.shippedFeatures.count}) : ${report.kpi.shippedFeatures.ids.join(', ') || '—'}`,
  );
  lines.push(`- **Blocages** (${report.kpi.blockages.count})`);
  for (const b of report.kpi.blockages.events) {
    lines.push(`  - ${b.ts}${b.detail ? ` — ${b.detail}` : ''}`);
  }
  lines.push(
    `- **Retouches PR** : ${report.kpi.prRetouches.total} PR mergée(s), ` +
      `${report.kpi.prRetouches.sansRetouche} sans retouche confirmée, ${report.kpi.prRetouches.indetermine} indéterminée(s)`,
  );
  lines.push('');
  lines.push(`_Rapport généré le ${report.generatedAt} — schéma \`${report.schema}\`._`);
  lines.push('');
  return lines.join('\n');
}
