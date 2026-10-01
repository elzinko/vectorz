/**
 * Contenu de la LOI compilée — DÉTERMINISTE et PUR (fiche 20260903134909124, ADR-0056).
 * Voisin d'`agent-content.ts` et `skill-content.ts` : un helper de domaine partagé par les caps
 * qui compilent des règles en texte, sans couplage cap↔cap (DIP/SRP).
 *
 *   - cap claude-code (projet) → `.iamthelaw/ENTRY.md`
 *   - cap claude-code-global   → `rules/iamthelaw.md` (convention : src/domain/law-file.ts)
 */
import { LAW_FRONT } from '../domain/law-file.js';
import type { Rule } from '../domain/model.js';

/** Une règle en texte : un titre « id [NIVEAU] » puis son corps. Partagé par les deux caps. */
export function compileRule(rule: Rule): string {
  return [`## ${rule.id}  \`[${rule.level}]\``, '', rule.content.trim(), ''].join('\n');
}

/** Le fichier de loi complet du cap global. */
export function globalLawContent(rules: Rule[]): string {
  const header = [
    '# I AM THE LAW',
    '',
    'Règles compilées de la méthode (cap claude-code-global). Fichier généré par',
    '`lawgiver bind-global` : ne l’édite pas, relance la commande.',
    '',
  ];
  return `${LAW_FRONT}${[...header, ...rules.map(compileRule)].join('\n').trimEnd()}\n`;
}
