/**
 * recipe-frontmatter — le front-matter d'un BROUILLON de recette (`ezk-chef extract`), ÉMIS par la
 * lib YAML. Règle `development/yaml-emission-via-lib` : jamais de concaténation de chaînes ni de
 * quotage maison. Avant, le script bash assemblait le bloc avec `echo` et ne protégeait que le
 * guillemet double : un titre nu contenant un antislash (`C:\dossier`) donnait un YAML invalide.
 *
 * Mise en forme VOLONTAIRE, identique à l'ancien bloc pour les cas bénins — les lecteurs `awk` et
 * `grep` des recettes (`regen-recipes.sh`, tests) lisent ligne à ligne :
 *   - texte libre (`id`, `title`, `makes`, `source`) : toujours entre guillemets doubles, sur UNE
 *     ligne (pas de repli) ; la lib échappe ce qu'il faut ;
 *   - énumérations et dates (`status`, `home`, `created`, `updated`) : nues ;
 *   - `composes: []` et `profile:` portent leur consigne `TODO(jugement)` en commentaire.
 *
 * PUR : aucune I/O. Le bord est `bin/recipe-frontmatter.ts`.
 */
import { Document, Scalar, YAMLMap, YAMLSeq } from 'yaml';

export interface RecipeFrontMatterInput {
  /** Id minté de la recette (chaîne : 17 chiffres, jamais un nombre). */
  id: string;
  /** Titre tel que le voit le loader (`readField`, pas de dé-échappement). */
  title: string;
  /** Note « source » (pointeur, jamais du code copié). */
  source: string;
  /** Date du jour, `AAAA-MM-JJ`. */
  today: string;
}

/** Texte libre : entre guillemets doubles, échappé par la lib. */
function text(value: string): Scalar<string> {
  const node = new Scalar(value);
  node.type = Scalar.QUOTE_DOUBLE;
  return node;
}

/** Le bloc `---` … `---` (terminé par un saut de ligne), prêt à être écrit en tête du fichier. */
export function recipeFrontMatter(input: RecipeFrontMatterInput): string {
  const fm = new YAMLMap();
  fm.set('id', text(input.id));
  fm.set('title', text(input.title));
  fm.set('makes', text('TODO(jugement) — ce que cette recette fabrique (une ligne)'));
  fm.set('source', text(input.source));

  const composes = new YAMLSeq();
  composes.flow = true;
  composes.comment = ' TODO(jugement) — rules composées (idiome ADR-0012/0025)';
  fm.set('composes', composes);

  const profile = new Scalar(null);
  profile.comment = ' TODO(jugement) — profil référencé, si pertinent';
  fm.set('profile', profile);

  fm.set('status', 'draft');
  fm.set('home', 'central');
  fm.set('created', input.today);
  fm.set('updated', input.today);

  const doc = new Document(fm);
  // lineWidth 0 : aucun repli de ligne. nullStr '' : `profile:` et non `profile: null`.
  return `---\n${doc.toString({ lineWidth: 0, nullStr: '' })}---\n`;
}
