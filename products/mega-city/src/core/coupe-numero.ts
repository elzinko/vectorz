/**
 * coupe-numero — le numéro d'une coupe. PUR (ADR-0003).
 *
 * En clair : sans numéro imposé, la coupe en propose un. Patch si chaque fiche est un correctif
 * (`type: bug`), mineure sinon, majeure sur `--major` seulement (ADR-0088 §2.3). Deux refus
 * mécaniques (§5) : un numéro qui ne dépasse pas le dernier tag strict, et un patch qui couperait
 * une fiche hors `type: bug`. Chaque refus nomme ses sorties.
 */
import { compareVersions } from '../backlog/versions.js';
import type { Coupe } from './coupe.js';

export type Genre = 'patch' | 'mineure' | 'majeure';

export type Numero =
  | { ok: true; numero: string; origine: 'propose' | 'impose'; genre: Genre }
  | { ok: false; raisons: string[] };

export interface EntreeNumero {
  coupe: Coupe;
  /** La dernière étiquette stricte atteignable depuis HEAD, ou `null`. */
  derniere: string | null;
  /** Toutes les étiquettes du dépôt : un numéro déjà tagué est refusé, même hors de l'ascendance. */
  tags: ReadonlySet<string>;
  major: boolean;
  /** Le numéro que le PO impose, ou `undefined`. */
  impose: string | undefined;
}

const parts = (v: string): [number, number, number] => {
  const [a, b, c] = v.slice(1).split('.').map(Number);
  return [a, b, c];
};

/** Le numéro suivant `base` selon le genre. */
function suivant(base: string, genre: Genre): string {
  const [maj, min, pat] = parts(base);
  if (genre === 'majeure') return `v${maj + 1}.0.0`;
  if (genre === 'mineure') return `v${maj}.${min + 1}.0`;
  return `v${maj}.${min}.${pat + 1}`;
}

/** Le genre d'un numéro par rapport à la dernière étiquette. */
function genreDe(numero: string, derniere: string): Genre {
  const [maj, min] = parts(numero);
  const [dmaj, dmin] = parts(derniere);
  if (maj !== dmaj) return 'majeure';
  return min !== dmin ? 'mineure' : 'patch';
}

/** Le numéro de la coupe, proposé ou imposé, ou les raisons du refus (rien n'est écrit sur un refus). */
export function proposerNumero(entree: EntreeNumero): Numero {
  const { coupe, derniere, tags, major, impose } = entree;
  if (coupe.fiches.length === 0) {
    return { ok: false, raisons: ['rien à couper : aucune fiche livrée depuis la dernière étiquette'] };
  }
  const base = derniere ?? 'v0.0.0';
  const toutCorrectif = coupe.fiches.every((f) => f.type === 'bug');

  if (impose === undefined) {
    const genre: Genre = major ? 'majeure' : toutCorrectif ? 'patch' : 'mineure';
    const numero = suivant(base, genre);
    if (tags.has(numero)) {
      return {
        ok: false,
        raisons: [
          `${numero} est déjà tagué hors de la ligne de HEAD (une branche de maintenance ?)`,
          'impose un numéro libre : version tag <vX.Y.Z>',
        ],
      };
    }
    return { ok: true, numero, origine: 'propose', genre };
  }

  const raisons: string[] = [];
  if (tags.has(impose)) raisons.push(`${impose} est déjà tagué`);
  if (derniere !== null && compareVersions(impose, derniere) <= 0) {
    raisons.push(`${impose} ne dépasse pas la dernière étiquette ${derniere}`);
  }
  const genre = derniere === null ? 'mineure' : genreDe(impose, derniere);
  if (raisons.length === 0 && genre === 'patch' && !toutCorrectif) {
    const horsBug = coupe.fiches.filter((f) => f.type !== 'bug').length;
    const [maj, min] = parts(base);
    raisons.push(
      `${impose} est un patch, mais la coupe contient ${horsBug} fiche(s) hors type: bug`,
      `deux sorties : couper une mineure (${suivant(base, 'mineure')}), ou ouvrir maint/v${maj}.${min} depuis v${maj}.${min}.0 et y reporter les correctifs par leurs sha`,
    );
  }
  return raisons.length > 0 ? { ok: false, raisons } : { ok: true, numero: impose, origine: 'impose', genre };
}
