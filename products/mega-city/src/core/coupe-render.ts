/**
 * coupe-render — le texte de la coupe et son fichier de version. PUR (ADR-0003).
 *
 * En clair : le dry-run imprime la coupe pour le PO ; l'écriture range la même coupe dans
 * `features/versions/<v>.md` (ADR-0088 §7), dont les notes sont rendues depuis les fiches, jamais à la main.
 */
import type { Coupe, FicheDeCoupe, ObjectifDeCoupe } from './coupe.js';
import type { Numero } from './coupe-numero.js';

const ligne = (f: FicheDeCoupe): string => `${f.id} ${f.titre}`;

const etatObjectif = (o: ObjectifDeCoupe): string => (o.complet ? 'complet' : `partiel ${o.livrees}/${o.total}`);

/** Le dry-run : la coupe groupée, puis le numéro proposé ou les raisons du refus. */
export function renderCoupe(coupe: Coupe, numero: Numero): string[] {
  const depuis = coupe.derniereEtiquette ?? 'le début (aucune étiquette stricte : la coupe couvre tout le livré)';
  const tete = numero.ok
    ? `En clair : ${coupe.fiches.length} fiche(s) livrée(s) depuis ${depuis} entrent dans la coupe. Numéro ${numero.origine === 'propose' ? 'proposé' : 'imposé'} : ${numero.numero} (${numero.genre}).`
    : `En clair : ${coupe.fiches.length} fiche(s) livrée(s) depuis ${depuis}, mais le numéro est refusé.`;
  const lines = [tete, ''];
  for (const o of coupe.objectifs) {
    lines.push(`${o.objectif} — ${etatObjectif(o)}`, ...o.fiches.map((f) => `  ${ligne(f)}`));
  }
  if (coupe.sansObjectif.length > 0) lines.push('Sans objectif', ...coupe.sansObjectif.map((f) => `  ${ligne(f)}`));
  if (coupe.correctifs.length > 0) lines.push('Correctifs', ...coupe.correctifs.map((f) => `  ${ligne(f)}`));
  if (coupe.objectifs.length > 0 && coupe.objectifs.every((o) => !o.complet)) lines.push('Aucun objectif complet dans cette coupe.');
  if (coupe.reecrites.length > 0) {
    lines.push('', `Avertissement : ${coupe.reecrites.length} fiche(s) portent déjà un version: ; la coupe le réécrit.`);
    lines.push(...coupe.reecrites.map((f) => `  ${ligne(f)} (était ${f.versionPosee})`));
  }
  lines.push('', `Hors coupe : ${coupe.horsCoupe} livrée(s) sans numéro et sans commit de livraison dans la fenêtre restent dans l'historique.`);
  if (!numero.ok) lines.push('', 'Numéro refusé :', ...numero.raisons.map((r) => `  ${r}`));
  return lines;
}

export interface EntreeFichierVersion {
  version: string;
  date: string;
  /** Le commit sur lequel la gate a joué : celui d'avant la coupe. */
  commit: string;
  gate: string;
  origine: 'propose' | 'impose';
  coupe: Coupe;
}

/** Le fichier `features/versions/<v>.md` : identité en front-matter, notes de version en corps. */
export function renderVersionFile(e: EntreeFichierVersion): string {
  const lines = ['---', `version: ${e.version}`, `date: ${e.date}`, `commit: ${e.commit}`, `gate: ${e.gate}`, `numero: ${e.origine}`, '---', '', `# ${e.version}`, ''];
  for (const o of e.coupe.objectifs) {
    lines.push(`## ${o.objectif}${o.complet ? '' : ` (partiel ${o.livrees}/${o.total})`}`, '', ...o.fiches.map((f) => `- ${f.titre}`), '');
  }
  if (e.coupe.sansObjectif.length > 0) lines.push('## Sans objectif', '', ...e.coupe.sansObjectif.map((f) => `- ${f.titre}`), '');
  if (e.coupe.correctifs.length > 0) lines.push('## Correctifs', '', ...e.coupe.correctifs.map((f) => `- ${f.titre}`), '');
  return `${lines.join('\n').trimEnd()}\n`;
}
