/**
 * diagram-meta — ce qu'on lit d'un document de la méthode (`diagrams/<slug>/meta.yaml`). PUR
 * (ADR-0003) : le bord I/O est `src/io/method-maps.ts`, qui sert `ezk board maps`. Repris du menu de
 * l'ancienne page web de la méthode, retirée par la fiche 20261102123552185.
 */

export interface DiagramEntry {
  /** Nom du dossier `diagrams/<slug>/`. */
  slug: string;
  /** Fichier d'entrée servi (`board.html`, `methode.svg`…). */
  entry: string;
  /** Titre lisible (du `meta.yaml`), ou le slug en secours. */
  title: string;
  /** Section d'accueil (`pilotage | archi | autres`) — du `meta.yaml`, défaut « autres ». */
  categorie?: string;
}

/**
 * Lit le titre d'un `meta.yaml` par BALAYAGE DE LIGNE — pas de lib YAML (zéro dépendance).
 * Tolère les DEUX clés qui coexistent dans le dépôt : `title:` (anglais) ET `titre:`
 * (français). Guillemets optionnels retirés. Renvoie null si aucune clé (⇒ repli slug côté
 * appelant).
 */
export function readMetaTitle(metaYaml: string): string | null {
  // Ancré en COLONNE 0 : une clé de premier niveau YAML n'est jamais indentée. Sans cet
  // ancrage, une sous-clé `title:`/`titre:` d'un autre bloc serait captée par erreur (revue
  // adverse, P2). Si les deux clés coexistent, la 1re ligne l'emporte (ordre du fichier).
  const m = metaYaml.match(/^(?:title|titre)[ \t]*:[ \t]*(.+?)[ \t]*$/im);
  if (!m) return null;
  const value = m[1].replace(/^["']|["']$/g, '').trim();
  return value || null;
}

/**
 * Lit le champ `categorie:` d'un `meta.yaml` par BALAYAGE DE LIGNE (comme `readMetaTitle`,
 * zéro dépendance). Ancré en COLONNE 0 (clé de 1er niveau) ; valeur normalisée en minuscules.
 * Renvoie null si absent ⇒ l'appelant retombe sur « autres ». Fiche 20260828165644452.
 */
export function readMetaCategorie(metaYaml: string): string | null {
  const m = metaYaml.match(/^categorie[ \t]*:[ \t]*(.+?)[ \t]*$/im);
  if (!m) return null;
  const value = m[1].replace(/^["']|["']$/g, '').trim().toLowerCase();
  return value || null;
}
