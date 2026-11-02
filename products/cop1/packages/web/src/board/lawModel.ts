/**
 * lawModel — la forme de la loi que sert le daemon (`/api/law/<projet>`, fiche 20260826222044335), et
 * la portée d'une règle dite en mots. CŒUR PUR : la méthode publie un code, la vue dit une phrase.
 */
export const PORTEES = ['partout', 'projet', 'citee', 'rangee', 'orpheline'] as const;
export type Portee = (typeof PORTEES)[number];

export interface LawRule {
  id: string;
  titre: string;
  niveau: string;
  fichier: string;
  bundles: string[];
  profils: string[];
  /** `skill:<id>` ou `agent:<id>`. */
  appliqueePar: string[];
  verifieePar: string[];
  portee: Portee;
}

export interface LawObject {
  id: string;
  type: 'skill' | 'agent';
  regles: string[];
}

export interface LawData {
  comptes: Record<Portee | 'total', number>;
  regles: LawRule[];
  objets: LawObject[];
}

/** Le nom d'un skill ou d'un agent, sans son préfixe. */
export const shortName = (objet: string): string => objet.replace(/^(skill|agent):/, '');

/** Le libellé de chaque compteur. */
export const PORTEE_LABEL: Record<Portee, string> = {
  partout: 'lues partout',
  projet: 'lues dans ce projet',
  citee: 'citées sans être installées',
  rangee: 'rangées sans effet',
  orpheline: 'orphelines',
};

/** La portée d'une règle, en une phrase : jamais un code. */
export function porteeText(rule: LawRule): string {
  switch (rule.portee) {
    case 'partout':
      return 'lue dans toutes tes sessions';
    case 'projet':
      return 'lue dans ce projet seulement';
    case 'citee':
      return `citée par ${rule.appliqueePar.map(shortName).join(', ')}, absente de la loi installée`;
    case 'rangee':
      return 'rangée dans un bundle, ni installée ni citée : sans effet';
    case 'orpheline':
      return 'dans aucun bundle, citée par personne';
  }
}
