/**
 * fiche-detail — le DÉTAIL d'une fiche, et le contrat JSON de `ezk backlog show --json`. PUR (ADR-0003).
 *
 * En clair : quand on ouvre une fiche, on veut son « en clair », son contexte, ses critères et la façon
 * de la vérifier. La méthode découpe la fiche une fois, ici, et le publie ; mission control l'affiche
 * sans réécrire un découpeur de markdown (fiche 20261031160441267, ADR-086).
 *
 * Mêmes règles que le contrat du board (`board-contract.ts`) : format décrit en zod, strict pour le
 * producteur ; schéma JSON publié tolérant, tiré par `pnpm board:contract --write` ; `schema_version`
 * monte quand un champ disparaît, change de nom ou de sens.
 */
import { z } from 'zod';
import type { Fiche } from '../loaders/fiches.js';
import { ficheBodyText, sectionLines } from './fiche-sections.js';

/** La version du format. Un consommateur qui lit une autre valeur le dit, et n'affiche rien de faux. */
export const BACKLOG_SCHEMA_VERSION = 1;

const CritereSchema = z.strictObject({
  texte: z.string().describe('Le texte du critère, lignes de suite comprises.'),
  coche: z.boolean().describe('La case est cochée (`- [x]`).'),
});

const FicheDetailShape = {
  id: z.string(),
  title: z.string(),
  type: z.string(),
  priority: z.string(),
  status: z.string().describe('Le statut écrit. « En cours » est le drapeau enCours, jamais un statut.'),
  milestone: z.string(),
  product: z.string(),
  version: z.string().describe("Version ciblée telle qu'écrite, '' sans version."),
  labels: z.array(z.string()),
  blocked: z.string().describe("Raison du blocage (`blocked:`), '' si la fiche n'est pas bloquée."),
  pr: z.string(),
  enCours: z.boolean().describe('Une branche de travail est ouverte pour la fiche (ADR-0077).'),
  done: z.boolean().describe('La fiche est rangée dans `features/done/`.'),
  file: z.string().describe('Chemin de la fiche, relatif à la racine du projet.'),
  enClair: z.string().describe('Section « En clair », ou paragraphe `**En clair.**` ; vide si absent.'),
  contexte: z.string().describe('Section dont le titre commence par « Contexte » ; vide si absente.'),
  criteres: z.array(CritereSchema).describe('Cases à cocher de la section « Critères… », dans l’ordre.'),
  commentVerifier: z.string().describe('Section « Comment vérifier », blocs de code compris ; vide si absente.'),
};

/** Le détail d'une fiche, tel qu'il sort dans la liste. */
export const FicheDetailSchema = z.strictObject(FicheDetailShape);

/** `ezk backlog show <id> --json` : une fiche. */
export const BacklogShowFicheSchema = z.strictObject({
  schema_version: z.literal(BACKLOG_SCHEMA_VERSION),
  ...FicheDetailShape,
});

/** `ezk backlog show --json` : toutes les fiches de `features/`, hors `done/`, triées par id. */
export const BacklogShowListeSchema = z.strictObject({
  schema_version: z.literal(BACKLOG_SCHEMA_VERSION),
  fiches: z.array(FicheDetailSchema).describe('Les fiches de features/, hors done/, triées par id.'),
});

export type FicheDetail = z.infer<typeof FicheDetailSchema>;
export type BacklogShowFiche = z.infer<typeof BacklogShowFicheSchema>;
export type BacklogShowListe = z.infer<typeof BacklogShowListeSchema>;

/** Le texte d'une section dont le titre comparable passe le test, sans blancs autour ; '' si absente. */
const sectionText = (body: string, test: (plainTitle: string) => boolean): string =>
  (sectionLines(body, test) ?? []).join('\n').trim();

const INLINE_EN_CLAIR = /\*\*En clair\.?\*\*[ \t]*([\s\S]*?)(?=\r?\n[ \t]*\r?\n|\r?\n#|$)/;

/** « En clair » : la section d'abord, sinon le paragraphe en ligne `**En clair.** …`. */
function enClairOf(body: string): string {
  const fromSection = sectionText(body, (t) => t === 'en clair');
  if (fromSection !== '') return fromSection;
  return INLINE_EN_CLAIR.exec(body)?.[1]?.trim() ?? '';
}

const ITEM = /^\s*[-*][ \t]+\[([ xX])\][ \t]*(.*)$/;

/** Les cases à cocher d'une section. Une ligne indentée qui suit une case la continue. */
function criteresOf(lines: readonly string[]): FicheDetail['criteres'] {
  const out: FicheDetail['criteres'] = [];
  let current: FicheDetail['criteres'][number] | undefined;
  for (const line of lines) {
    const item = ITEM.exec(line);
    if (item) {
      current = { texte: item[2].trim(), coche: item[1] !== ' ' };
      out.push(current);
    } else if (current !== undefined && /^\s+\S/.test(line)) {
      current.texte = `${current.texte} ${line.trim()}`.trim();
    } else {
      current = undefined;
    }
  }
  return out;
}

/** Le détail d'une fiche, depuis la fiche lue (`loaders/fiches.ts`) et son texte complet. */
export function buildFicheDetail(fiche: Fiche, text: string, enCours: boolean): FicheDetail {
  const body = ficheBodyText(text);
  return {
    id: fiche.id,
    title: fiche.title,
    type: fiche.type,
    priority: fiche.priority,
    status: fiche.status,
    milestone: fiche.milestone,
    product: fiche.product,
    version: fiche.version,
    labels: fiche.labels,
    blocked: fiche.blocked,
    pr: fiche.pr,
    enCours,
    done: fiche.done,
    file: fiche.file,
    enClair: enClairOf(body),
    contexte: sectionText(body, (t) => t.startsWith('contexte')),
    criteres: criteresOf(sectionLines(body, (t) => t.startsWith('criteres')) ?? []),
    commentVerifier: sectionText(body, (t) => t.startsWith('comment verifier')),
  };
}
