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
  etapes: ProcessEtape[];
}

export interface ProcessLien {
  de: string;
  vers: string;
  libelle: string;
}

export interface ProcessShow {
  schema_version: number;
  skills: ProcessSkill[];
  liens: ProcessLien[];
}
