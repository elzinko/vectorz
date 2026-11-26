/**
 * La carte de projet de la maquette (fiche 20261126170000102), partagée par « Projets » (une par
 * projet) et « Vue d'ensemble » (celle du projet courant) : en-tête, compteurs « depuis le début »,
 * trois tuiles, trois vignettes. Mission control n'invente rien (ADR-086) : une donnée que la méthode
 * ne publie pas se dit « non publié » ou « — », jamais « 0 ».
 */
import type { BoardProject, Objectif, SprintSummary } from './types.js';
import { fmtDuree } from './helpers.js';
import { InfoButton, latestTaggedVersion } from './Chrome.js';

const NOT_PUBLISHED = 'non publié';
const UNKNOWN = '—';

const SOURCE_INFO =
  'Chiffres publiés par la méthode : fiches, objectifs, comptes rendus de sprint. ' +
  'Une donnée qu’elle ne publie pas s’affiche « non publié » ou « — ».';

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`;

/** Le plan est reçu (ou sans état) : sinon aucun compte n'est connu. */
const planKnown = (p: BoardProject): boolean => !p.plan || p.plan.state === 'ok';

/** Le but d'un sprint : « Sprint N — but » si la méthode le publie, sinon le nom de son compte rendu. */
function sprintTitle(s: SprintSummary): string {
  const but = s.but ?? s.slug.replace(/-/g, ' ');
  return s.numero !== undefined && s.but !== undefined ? `Sprint ${s.numero} — ${but}` : but;
}

/** Le dernier objectif dont toutes les fiches sont livrées. */
function lastReachedObjectif(objectifs: Objectif[]): Objectif | undefined {
  return objectifs.filter((o) => o.total > 0 && o.shipped === o.total).at(-1);
}

type Tone = 'ok' | 'warn' | 'idea' | 'done';

interface Vignette {
  label: string;
  hint?: string;
  title: string;
  meta: string;
  chip?: { text: string; tone: Tone };
}

const NOT_PUBLISHED_CHIP = { text: NOT_PUBLISHED, tone: 'idea' } as const;

function objectifVignette(p: BoardProject): Vignette {
  const label = 'Dernier objectif';
  const hint = 'Le dernier objectif dont toutes les fiches sont livrées';
  if (!p.objectifs) return { label, hint, title: 'Objectifs non publiés', meta: 'plan non lu', chip: NOT_PUBLISHED_CHIP };
  const o = lastReachedObjectif(p.objectifs);
  if (!o) return { label, hint, title: 'Aucun objectif atteint', meta: plural(p.objectifs.length, 'objectif', 'objectifs') };
  return { label, hint, title: o.nom ? `${o.slug} — ${o.nom}` : o.slug, meta: plural(o.total, 'fiche', 'fiches'), chip: { text: 'atteint', tone: 'done' } };
}

function sprintVignette(p: BoardProject): Vignette {
  const label = 'Dernier sprint';
  const last = p.lastSprints?.[0];
  if (!last) return { label, title: 'Aucun compte rendu publié', meta: 'pas de comptes rendus', chip: NOT_PUBLISHED_CHIP };
  const blocages = last.blocages;
  return {
    label,
    title: sprintTitle(last),
    meta: `${last.jour} · ${fmtDuree(last.dureeMs)} · ${plural(last.livrees.length, 'fiche', 'fiches')}`,
    chip:
      blocages === null
        ? undefined
        : blocages === 0
          ? { text: 'ok', tone: 'ok' }
          : { text: plural(blocages, 'blocage', 'blocages'), tone: 'warn' },
  };
}

function retroVignette(p: BoardProject): Vignette {
  const label = 'Dernière rétro';
  const n = p.metrics.retros;
  if (n === UNKNOWN) return { label, title: 'Rétros non publiées', meta: 'compteur non publié', chip: NOT_PUBLISHED_CHIP };
  return { label, title: plural(n, 'rétro', 'rétros'), meta: 'dates non publiées', chip: NOT_PUBLISHED_CHIP };
}

function Tile({ value, label, hint }: { value: string | number; label: string; hint?: string }): JSX.Element {
  return (
    <div className="mcell" title={hint}>
      <div className="mv">{value}</div>
      <div className="mk">{label}</div>
    </div>
  );
}

function VignetteBlock({ v }: { v: Vignette }): JSX.Element {
  return (
    <div className="t3" role="group" aria-label={v.label}>
      <span className="lab" title={v.hint}>
        {v.label}
      </span>
      <span className="ttl" title={v.title}>
        {v.title}
      </span>
      <span className="mt">
        <span>{v.meta}</span>
        {v.chip && <span className={`tag ${v.chip.tone}`}>{v.chip.text}</span>}
      </span>
    </div>
  );
}

interface ProjectCardProps {
  project: BoardProject;
  /** Absent : le nom n'est pas un bouton (la page est déjà celle du projet). */
  onOpen?: () => void;
}

/** Aucun compte rendu ni capture publiés : « — », jamais un « 0 » qui passerait pour une mesure. */
function noneAsUnknown(n: string | number): string | number {
  return n === 0 ? UNKNOWN : n;
}

export function ProjectCard({ project, onOpen }: ProjectCardProps): JSX.Element {
  const known = planKnown(project);
  const m = project.metrics;
  const coupe = project.versionsPage?.prochaineCoupe;
  const blocked = project.fiches ? Object.values(project.fiches).filter((f) => f.blocked).length : undefined;
  const sinceLabel = coupe?.derniereEtiquette ? `livrées depuis ${coupe.derniereEtiquette}` : 'livrées depuis la dernière version';
  const since: Array<[string | number, string]> = [
    [known ? m.done : UNKNOWN, 'livrées'],
    [noneAsUnknown(m.sprints), 'sprints'],
    [noneAsUnknown(m.retros), 'rétros'],
  ];

  return (
    <section className="card pcard" aria-label={`Projet ${project.name}`}>
      <h3>
        {onOpen ? (
          <button type="button" className="pname-btn" onClick={onOpen}>
            {project.name}
          </button>
        ) : (
          <span className="pname-btn">{project.name}</span>
        )}
        <InfoButton text={SOURCE_INFO} />
        <span className="pill ver" title="Dernière version étiquetée">
          {latestTaggedVersion(project)}
        </span>
        <span className="since" aria-label="Depuis le début">
          <span className="sl">Depuis le début</span>
          {since.map(([value, label]) => (
            <span key={label}>
              <b>{value}</b> {label}
            </span>
          ))}
        </span>
      </h3>
      <div className="pbody">
        <div className="mgrid tiles3">
          <Tile value={known ? project.funnel.ready : UNKNOWN} label="fiches prêtes" />
          <Tile value={known && blocked !== undefined ? blocked : UNKNOWN} label="bloquées" />
          <Tile
            value={known ? (coupe?.nombre ?? UNKNOWN) : UNKNOWN}
            label={sinceLabel}
            hint="Fiches livrées pas encore étiquetées"
          />
        </div>
        <div className="grid3">
          {[objectifVignette(project), sprintVignette(project), retroVignette(project)].map((v) => (
            <VignetteBlock key={v.label} v={v} />
          ))}
        </div>
      </div>
    </section>
  );
}
