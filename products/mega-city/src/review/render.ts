/**
 * `render.ts` — `ReviewPack → markdown`, fonction PURE (fiche 0183, ADR-038).
 *
 * Zéro IO, zéro VCS. Sérialise le front-matter (YAML) puis les 7 sections
 * obligatoires, dans l'ordre du contrat `method-review@0.1`. Chaque section
 * reproduit le contenu du pack **par référence** (le texte fourni tel quel —
 * jamais de copie transformée d'une source externe) ; une section optionnelle
 * absente ou vide dégrade proprement en « N.A. ».
 */
import type { ReviewPack } from './contract.js';

/** Échappe le strict nécessaire pour une valeur YAML scalaire entre guillemets. */
function yamlQuoted(value: string): string {
  return `"${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}"`;
}

function renderFrontMatter(pack: ReviewPack): string {
  const fm = pack.frontMatter;
  const lines = [
    `schema: ${fm.schema}`,
    `fiche: ${yamlQuoted(fm.fiche)}`,
    `branch: ${yamlQuoted(fm.branch)}`,
    `product: ${yamlQuoted(fm.product)}`,
    `method:`,
    `  name: ${yamlQuoted(fm.method.name)}`,
    `  version: ${yamlQuoted(fm.method.version)}`,
    `status: ${fm.status}`,
    `created: ${yamlQuoted(fm.created)}`,
  ];
  if (fm.run_id) lines.push(`run_id: ${yamlQuoted(fm.run_id)}`);
  if (fm.pr) lines.push(`pr: ${yamlQuoted(fm.pr)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

/** Rend une section texte ; dégrade en « N.A. » si vide/absente. */
function renderTextSection(heading: string, value: string | undefined): string {
  const body = value && value.trim().length > 0 ? value.trim() : 'N.A.';
  return `## ${heading}\n\n${body}\n`;
}

/** Rend une section liste ; dégrade en « N.A. » si vide/absente. */
function renderListSection(heading: string, items: readonly string[] | undefined): string {
  if (!items || items.length === 0) {
    return `## ${heading}\n\nN.A.\n`;
  }
  const body = items.map((item) => `- ${item}`).join('\n');
  return `## ${heading}\n\n${body}\n`;
}

/**
 * Sérialise un `ReviewPack` en markdown : front-matter + 7 sections obligatoires
 * (Résumé, Rendus, Matrice de validation, À tester, Qualité, Provisioning /
 * preview, Trouvailles), dans cet ordre.
 */
export function render(pack: ReviewPack): string {
  const { sections } = pack;
  const parts = [
    renderFrontMatter(pack),
    `# Review — ${pack.frontMatter.fiche}\n`,
    renderTextSection('Résumé', sections.resume),
    renderListSection('Rendus', sections.rendus),
    renderTextSection('Matrice de validation', sections.matriceValidation),
    renderTextSection('À tester', sections.aTester),
    renderTextSection('Qualité', sections.qualite),
    renderTextSection('Provisioning / preview', sections.provisioning),
    renderListSection('Trouvailles', sections.trouvailles),
  ];
  return parts.join('\n');
}
