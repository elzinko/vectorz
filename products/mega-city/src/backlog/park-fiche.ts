/**
 * park-fiche — SORTIR une fiche inconstruisable de sa version (fiche 20261013131852779).
 *
 * En clair : quand une fiche de la version en cours s'avère inconstruisable, le run la saute déjà et
 * la journalise, mais la laisse dans la version — elle y revient au run suivant. L'auto-groom peut
 * désormais la **parker hors version** : vider son `version:`, la marquer parkée (`idea` +
 * `milestone: parked`) avec une raison `blocked:` TYPÉE, et journaliser le geste. La version avance
 * sans traîner une fiche qui ne peut pas se construire. Le geste est **réversible** : la fiche reste
 * au backlog, réveillable au grooming (re-poser version + status + retirer blocked).
 *
 * PUR (ADR-0003) : aucune I/O, aucun `git`. Le bord `bin/backlog-park.ts` lit la fiche, applique, la
 * réécrit et imprime la ligne de journal. Réutilise `setFrontMatter` (ship-fiche) : on ne réinvente
 * pas l'édition de front-matter. S'appuie sur les raisons typées (`blocked-reasons.ts`) : la raison
 * de la sortie est une raison typée, lisible par la machine (le RUN-REPORT la nomme).
 */
import { frontMatter, readField } from '../loaders/fiches.js';
import type { BlockedReason } from './blocked-reasons.js';
import type { EligibilityVerdict } from './run-eligibility.js';
import { setFrontMatter } from './ship-fiche.js';

export interface ParkInput {
  /** La raison TYPÉE de la sortie (liste fermée `BLOCKED_REASONS`) — ex. `à-découper`. */
  reason: BlockedReason;
  /** Date du geste (ISO court, `2026-10-14`) : tracée dans le contexte de `blocked:`. */
  date: string;
}

export interface ParkResult {
  /** Le nouveau texte de la fiche (front-matter mis à jour). */
  text: string;
  /** La version dont la fiche sort (`''` si elle n'en portait pas). */
  previousVersion: string;
  /** La ligne de journal pour `SPRINT.md` et le RUN-REPORT (état `sautée`, raison parkée). */
  journal: string;
}

/**
 * Parke une fiche hors de sa version. Front-matter mis à jour : `version` vidée, `status: idea`,
 * `milestone: parked`, `blocked: <raison typée> — parké hors version par auto-groom le <date>`.
 * Rend aussi la version quittée et une ligne de journal nommant la fiche et la raison.
 */
export function parkOutOfVersion(text: string, input: ParkInput): ParkResult {
  const fm = frontMatter(text);
  const id = readField(fm, 'id');
  const previousVersion = readField(fm, 'version');
  const blocked = `${input.reason} — parké hors version par auto-groom le ${input.date}`;
  const updated = setFrontMatter(text, {
    version: '', // vidée : `setFrontMatter` émet `version:` sans espace en trop
    status: 'idea',
    milestone: 'parked',
    blocked,
  });
  const where = previousVersion === '' ? 'sans version' : `version ${previousVersion} vidée`;
  const journal = `parké hors version : ${id === '' ? '(sans id)' : id} — ${input.reason} (${where}, status→idea, milestone→parked) — réversible`;
  return { text: updated, previousVersion, journal };
}

/**
 * Garde « tenter avant de parker » (règle development/tenter-avant-de-parker, fiche 20261018234206166).
 * On ne parke pas une fiche qu'on n'a pas tentée : si le filtre d'éligibilité la dit `groom` (idée à
 * mûrir) ou `build` (prête), le park est REFUSÉ — sauf preuve de tentative passée (`afterGroom`). Les
 * fiches `escalate` (blocage typé, épic) et `defer` (hors version) restent parkables de plein droit.
 * Rend le message de refus, ou `undefined` si le park est permis. Pur (ADR-0003).
 */
export function parkGuard(verdict: EligibilityVerdict, afterGroom: boolean): string | undefined {
  if (afterGroom) return undefined; // --after-groom : la tentative est attestée, on parke
  if (verdict.disposition === 'groom') {
    return "pas encore groomée (idée) : tente-la avant de l'écarter. Groome-la (ezk backlog groom-milestone, ou groom <id>), ou passe --after-groom <ref> si tu l'as déjà tenté.";
  }
  if (verdict.disposition === 'build') {
    return "déjà prête (ready) : elle n'a rien d'inconstruisable. Construis-la, ou passe --after-groom <ref> si tu l'écartes sciemment.";
  }
  return undefined; // escalate (bloquée / épic) ou defer (hors version) : parkable de plein droit
}
