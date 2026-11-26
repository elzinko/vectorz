/**
 * Ce que la méthode publie des alertes de la cloche (`ezk now --json`, contrat `now-show/v1`, relayé par
 * le daemon). L'écran ne calcule aucune alerte : il montre celles qui sont publiées. Un champ non publié
 * s'écrit « non publié », jamais 0.
 */
export type NowAlertType =
  | 'fiche-bloquee'
  | 'idee-a-groomer'
  | 'proposition-retro'
  | 'question-session'
  | 'version-a-poser'
  | 'sprint-sans-retro';

export interface NowAlert {
  type: NowAlertType;
  id: string;
  titre: string;
  raison: string;
  decision: string;
  fichier: string;
  date: string;
}

export interface NowContract {
  alertes: NowAlert[];
  nonMesure: string[];
}

/** Le type d'alerte en mots, tel que la maquette le dit. */
export const ALERT_WORD: Record<NowAlertType, string> = {
  'fiche-bloquee': 'fiche bloquée',
  'idee-a-groomer': 'idée à groomer',
  'proposition-retro': 'rétro à décider',
  'question-session': 'question de session',
  'version-a-poser': 'version à poser',
  'sprint-sans-retro': 'sprint sans rétro',
};

/** Les alertes qui visent une fiche : leur `id` est l'id de la fiche. */
export const aimsAtFiche = (alert: NowAlert): boolean =>
  alert.type === 'fiche-bloquee' || alert.type === 'idee-a-groomer';
