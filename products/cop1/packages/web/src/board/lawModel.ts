/**
 * lawModel — la forme de la loi que sert le daemon (`/api/law/<projet>`, fiche 20260826222044335), et
 * la portée d'une règle dite en mots. CŒUR PUR : la méthode publie un code, la vue dit une phrase.
 */
export const PORTEES = ['partout', 'projet', 'demarrage', 'citee', 'rangee', 'orpheline'] as const;
export type Portee = (typeof PORTEES)[number];

export interface LawRule {
  id: string;
  titre: string;
  niveau: string;
  categorie: string;
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
  type: 'skill' | 'agent' | 'bundle' | 'profile';
  /** Le skill ou l'agent lit ses règles au démarrage. */
  litSesRegles: boolean;
  regles: string[];
}

export interface LawData {
  lois?: Record<string, { chemin: string; installee: boolean } | undefined>;
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
  demarrage: 'lues au démarrage',
  citee: 'citées sans être installées',
  rangee: 'rangées sans effet',
  orpheline: 'orphelines',
};

export type Origine = 'installee' | 'demarrage' | 'projet';

/** D'où vient une règle en vigueur ; `null` pour une règle sans effet sur le projet. */
const ORIGINE_DE: Partial<Record<Portee, Origine>> = { partout: 'installee', demarrage: 'demarrage', projet: 'projet' };

export const ORIGINE_LABEL: Record<Origine, string> = {
  installee: 'installées',
  demarrage: 'lues au démarrage',
  projet: 'propres au projet',
};

export interface EnVigueurRow {
  rule: LawRule;
  origine: Origine;
}

/** Les règles qui s'appliquent ici : installées, lues au démarrage ou propres au projet. */
export function enVigueur(law: LawData): EnVigueurRow[] {
  const rows: EnVigueurRow[] = [];
  for (const rule of law.regles) {
    const origine = ORIGINE_DE[rule.portee];
    if (origine) rows.push({ rule, origine });
  }
  return rows;
}

/** Le titre en clair : le titre publié, ou le dernier segment de l'identifiant quand il n'a pas de titre. */
export function titreClair(rule: LawRule): string {
  if (rule.titre !== rule.id) return rule.titre;
  const slug = rule.id.split('/').pop() ?? rule.id;
  return slug.replace(/-/g, ' ');
}

/** Qui règle la règle. Le nom du profil n'est pas publié : on dit seulement qu'il est lié. */
export function reglePar(origine: Origine): string {
  return origine === 'installee' ? 'profil lié' : origine === 'projet' ? 'projet' : 'méthode';
}

/** Les skills et agents qui appliquent une règle, sans doublon. */
export function appliqueurs(rule: LawRule): string[] {
  return [...new Set(rule.appliqueePar.map(shortName))];
}

/** La loi du projet est-elle installée dans son dépôt ? « non publié » quand la méthode ne le dit pas. */
export function loiProjetInstallee(law: LawData): 'oui' | 'non' | 'non publié' {
  const projet = law.lois?.projet;
  if (!projet) return 'non publié';
  return projet.installee ? 'oui' : 'non';
}

export interface PaquetRow {
  nom: string;
  total: number;
  enVigueur: number;
  par: string;
  etat: { kind: 'installe' | 'lu' | 'partiel' | 'disponible'; texte: string };
  regles: LawRule[];
}

const plural = (n: number, mot: string): string => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Les paquets du catalogue et leur état ici, déduits des règles et de leur portée. */
export function paquets(law: LawData): PaquetRow[] {
  const byId = new Map(law.regles.map((r) => [r.id, r]));
  return law.objets
    .filter((o) => o.type === 'bundle')
    .map((o): PaquetRow => {
      const regles = o.regles.flatMap((ref) => byId.get(ref) ?? []);
      const vigueur = regles.filter((r) => ORIGINE_DE[r.portee]);
      const installees = vigueur.filter((r) => r.portee === 'partout').length;
      const total = regles.length;
      const nom = o.id.replace(/^bundle:/, '');
      if (vigueur.length === 0) return { nom, total, enVigueur: 0, par: '—', etat: { kind: 'disponible', texte: 'disponible' }, regles };
      if (installees === total) return { nom, total, enVigueur: total, par: 'profil lié', etat: { kind: 'installe', texte: 'installé par la loi' }, regles };
      if (installees === 0 && vigueur.length === total) {
        const lecteurs = [...new Set(vigueur.flatMap(appliqueurs))];
        return { nom, total, enVigueur: total, par: 'méthode', etat: { kind: 'lu', texte: lecteurs.length ? `lu au démarrage par ${lecteurs.join(', ')}` : 'lu au démarrage' }, regles };
      }
      return {
        nom,
        total,
        enVigueur: vigueur.length,
        par: 'méthode',
        etat: { kind: 'partiel', texte: `${plural(vigueur.length, 'règle')} sur ${total} en vigueur` },
        regles,
      };
    });
}
