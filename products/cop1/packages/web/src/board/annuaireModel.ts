/**
 * annuaireModel — l'Annuaire de la méthode (fiche 20261128093846629) : ce que la méthode publie
 * (`ezk help --json` pour les commandes, skills et agents ; `ezk law show --json` pour les règles et
 * les profils), rangé par onglet. CŒUR PUR : aucune donnée n'est inventée, ce qui manque se dit
 * « non publié ».
 */
import { type LawData, type LawRule, type Portee, appliqueurs, shortName, titreClair } from './lawModel.js';

export const NON_PUBLIE = 'non publié';

export interface HelpCommand {
  domaine: string;
  verbe: string | null;
  enClair: string;
  script: string;
  ecritLeProjet: boolean;
  /** Le nouveau nom quand la commande est un ancien nom ; `null` sinon. */
  deprecie: string | null;
}

export interface HelpSkill {
  id: string;
  description: string;
}

export interface HelpAgent {
  id: string;
  description: string;
}

export interface HelpData {
  commandes: HelpCommand[];
  skills: HelpSkill[];
  agents: HelpAgent[];
}

/** L'objet de la loi qui porte les règles d'un skill ou d'un agent. */
const objetDe = (law: LawData | null, type: 'skill' | 'agent', id: string) =>
  law?.objets.find((o) => o.id === `${type}:${id}`);

export interface SkillRow {
  id: string;
  description: string;
  /** Un agent porte le même nom : la méthode le publie dans les deux listes. */
  aussiAgent: boolean;
  /** `null` : la loi n'est pas publiée, ou ne porte pas ce skill. */
  litSesRegles: boolean | null;
  nbRegles: number | null;
}

export function skillRows(help: HelpData, law: LawData | null): SkillRow[] {
  return help.skills.map((s) => {
    const objet = objetDe(law, 'skill', s.id);
    return {
      id: s.id,
      description: s.description,
      aussiAgent: help.agents.some((a) => a.id === s.id),
      litSesRegles: objet?.litSesRegles ?? null,
      nbRegles: objet?.regles.length ?? null,
    };
  });
}

export interface AgentRow {
  id: string;
  description: string;
  aussiSkill: boolean;
  litSesRegles: boolean | null;
  nbRegles: number | null;
}

export function agentRows(help: HelpData, law: LawData | null): AgentRow[] {
  return help.agents.map((a) => {
    const objet = objetDe(law, 'agent', a.id);
    return {
      id: a.id,
      description: a.description,
      aussiSkill: help.skills.some((s) => s.id === a.id),
      litSesRegles: objet?.litSesRegles ?? null,
      nbRegles: objet?.regles.length ?? null,
    };
  });
}

/** Le texte de la colonne « Lit ses règles » : oui avec le nombre de règles, non, ou non publié. */
export function litSesReglesTexte(lit: boolean | null, nbRegles: number | null): string {
  if (lit === null) return NON_PUBLIE;
  if (!lit) return 'non';
  return nbRegles ? `oui · ${nbRegles} règle${nbRegles > 1 ? 's' : ''}` : 'oui';
}

export const EFFET_LABEL: Record<Portee, string> = {
  partout: 'lue partout',
  demarrage: 'au démarrage',
  projet: 'propre au projet',
  citee: 'citée sans être installée',
  rangee: 'sans effet',
  orpheline: 'orpheline',
};

/** Les quatre filtres par effet de la maquette, et la portée publiée que chacun retient. */
export const EFFET_FILTERS = [
  { id: 'partout', label: 'lues partout', portee: 'partout' },
  { id: 'demarrage', label: 'au démarrage', portee: 'demarrage' },
  { id: 'sans-effet', label: 'sans effet', portee: 'rangee' },
  { id: 'orpheline', label: 'orphelines', portee: 'orpheline' },
] as const satisfies readonly { id: string; label: string; portee: Portee }[];
export type EffetFilterId = (typeof EFFET_FILTERS)[number]['id'];

export interface RuleFilters {
  effet: EffetFilterId | null;
  paquet: string;
  categorie: string;
  query: string;
}

export function filterRules(regles: LawRule[], f: RuleFilters): LawRule[] {
  const portee = EFFET_FILTERS.find((e) => e.id === f.effet)?.portee;
  const q = f.query.trim().toLowerCase();
  return regles.filter(
    (r) =>
      (portee === undefined || r.portee === portee) &&
      (f.paquet === '' || r.bundles.includes(f.paquet)) &&
      (f.categorie === '' || r.categorie === f.categorie) &&
      (q === '' || titreClair(r).toLowerCase().includes(q) || r.id.toLowerCase().includes(q)),
  );
}

export const paquetsDe = (regles: LawRule[]): string[] => [...new Set(regles.flatMap((r) => r.bundles))].sort();
export const categoriesDe = (regles: LawRule[]): string[] => [...new Set(regles.map((r) => r.categorie))].sort();

export interface RuleCounts {
  total: number;
  /** Lues partout, au démarrage ou propres au projet : elles ont un effet sur ce projet. */
  appliquees: number;
  /** Rangées sans effet, ou orphelines : elles ne s'appliquent nulle part. */
  nullePart: number;
  /** Citées par un skill ou un agent qui n'est pas installé. */
  citees: number;
}

/** Les comptes viennent de la méthode : on les additionne, on ne recompte pas les règles. */
export function ruleCounts(law: LawData): RuleCounts {
  const c = law.comptes;
  return { total: c.total, appliquees: c.partout + c.demarrage + c.projet, nullePart: c.rangee + c.orpheline, citees: c.citee };
}

export const appliqueePar = (rule: LawRule): string[] => appliqueurs(rule);
export const verifieePar = (rule: LawRule): string[] => rule.verifieePar.map(shortName);

export interface ProfileRow {
  nom: string;
  nbRegles: number;
}

export function profileRows(law: LawData): ProfileRow[] {
  return law.objets.filter((o) => o.type === 'profile').map((o) => ({ nom: o.id.replace(/^profile:/, ''), nbRegles: o.regles.length }));
}

export const commandName = (c: HelpCommand): string => (c.verbe ? `${c.domaine} ${c.verbe}` : c.domaine);

export const commandDomains = (cmds: HelpCommand[]): string[] => [...new Set(cmds.map((c) => c.domaine))];

export function filterCommands(cmds: HelpCommand[], domaine: string, query: string): HelpCommand[] {
  const q = query.trim().toLowerCase();
  return cmds.filter(
    (c) =>
      (domaine === '' || c.domaine === domaine) &&
      (q === '' || commandName(c).toLowerCase().includes(q) || c.enClair.toLowerCase().includes(q)),
  );
}

export const ecritTexte = (c: HelpCommand): string => (c.ecritLeProjet ? 'oui' : 'non');

export interface Warning {
  id: 'regles-sans-effet';
  text: string;
}

const plural = (n: number, mot: string): string => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Les avertissements que les comptes publiés permettent de dire : jamais un avertissement inventé. */
export function warnings(law: LawData | null): Warning[] {
  if (!law) return [];
  const { rangee, orpheline, total } = law.comptes;
  const sansEffet = rangee + orpheline;
  if (sansEffet === 0) return [];
  return [
    {
      id: 'regles-sans-effet',
      text: `${plural(sansEffet, 'règle')} sur ${total} sans effet : ${rangee} rangée${rangee > 1 ? 's' : ''} dans un paquet que rien ne lit, ${plural(orpheline, 'orpheline')}`,
    },
  ];
}
