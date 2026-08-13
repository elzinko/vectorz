/**
 * Ré-export des types du domaine (source de vérité : docs/domain.ts).
 *
 * Le code de `src/` dépend du contrat via ce point unique, jamais d'un chemin
 * relatif vers `docs/` éparpillé. Sens des dépendances (ADR-0003) :
 *   loaders/ caps/ core/ → domain/ ; io/ bin/ → core/.
 */
export type {
  Agent,
  Bundle,
  Cap,
  Enforcement,
  EnforcementType,
  HostId,
  LearningEntry,
  Level,
  Profile,
  ResolvedProfile,
  Rule,
  RuleKind,
  Skill,
  SkillAsset,
} from '../../docs/domain.js';

export type { FileWrite, HookWrite, WriteIntent, WritePlan } from './plan.js';
