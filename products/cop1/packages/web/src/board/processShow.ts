/** Contrat `ezk process show --json` (v1) : ce que la méthode publie de son process. */
export interface ProcessReglage {
  cle: string;
  valeur: string;
}

export interface ProcessEtape {
  id: string;
  num: number;
  titre: string;
  enClair: string;
  joueePar: string[];
  agents: string[];
  commandes: string[];
  regles: string[];
  reglages: ProcessReglage[];
}

export interface ProcessSkill {
  id: string;
  nom: string;
  enClair: string;
  /** Un outil se lance à côté du flux (l'archive) : la carte le range dans sa boîte à outils. */
  outil: boolean;
  etapes: ProcessEtape[];
}

export interface ProcessLien {
  de: string;
  vers: string;
  libelle: string;
}

/** Un retour d'une étape vers une autre, écrites `<skill>:<étape>` (fiche 20261117223348250). */
export interface ProcessBoucle {
  de: string;
  vers: string;
  libelle: string;
}
export interface ProcessShow {
  schema_version: number;
  skills: ProcessSkill[];
  liens: ProcessLien[];
  boucles: ProcessBoucle[];
}

/** Un contrat utilisable : ses listes de skills, de liens et de boucles existent. Sinon l'écran dit pourquoi. */
function isProcessShow(value: unknown): value is ProcessShow {
  const c = value as Partial<ProcessShow> | null | undefined;
  return Array.isArray(c?.skills) && Array.isArray(c?.liens) && Array.isArray(c?.boucles);
}

/** Comment lire le contrat au daemon : commun à la carte et aux blocs sous la carte. */
export const PROCESS_READING = {
  path: 'process',
  field: 'process',
  isUsable: isProcessShow,
  incompleteReason: 'contrat du process incomplet (compétences, liens ou boucles absents)',
};
