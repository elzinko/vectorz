/**
 * Petites pièces partagées des pages Objectifs et Versions (fiches 20261124111115865,
 * 20261124111115783) : le fil d'Ariane, le geste qui montre sa commande sans rien écrire, l'âge
 * d'une étiquette, et la ligne d'une fiche cliquable.
 */
import { useState } from 'react';
import type { BoardProject } from './types.js';

export interface Crumb {
  label: string;
  /** Absent pour le dernier élément : on y est déjà. */
  onClick?: () => void;
}

/** Le fil d'Ariane d'une page : chaque élément sauf le dernier ramène en arrière. */
export function Crumbs({ items, label }: { items: Crumb[]; label: string }): JSX.Element {
  return (
    <nav className="plan-crumbs" aria-label={label}>
      {items.map((c, i) => (
        <span key={c.label}>
          {i > 0 && <span className="sep"> › </span>}
          {c.onClick ? (
            <button type="button" className="pc" onClick={c.onClick}>
              {c.label}
            </button>
          ) : (
            <span className="pc" aria-current="page">
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * Un geste de la méthode qui reste au PO ou à l'agent : le bouton n'écrit rien, il montre la commande
 * à lancer. C'est la frontière d'ADR-086 : mission control lit, la méthode agit.
 */
export function CommandHint({ label, command }: { label: string; command: string }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <span className="cmdhint">
      <button type="button" className="chip" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      {open && (
        <span role="status" className="cmd">
          à lancer : <code>{command}</code>
        </span>
      )}
    </span>
  );
}

const DAY_MS = 86_400_000;

/** L'âge d'une date ISO, en mots courts : « aujourd'hui », « il y a 3 j », « il y a 2 mois ». */
export function ageLabel(iso: string | null, now: Date = new Date()): string {
  if (iso === null) return 'non publié';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'date illisible';
  const days = Math.floor((now.getTime() - t) / DAY_MS);
  if (days <= 0) return "aujourd'hui";
  if (days < 45) return `il y a ${days} j`;
  return `il y a ${Math.round(days / 30)} mois`;
}

/** Les mots d'un état de fiche, tels que le board les affiche ailleurs. */
const FICHE_STATUS: Record<string, string> = {
  idea: 'idée',
  ready: 'prête',
  wip: 'en cours',
  done: 'livrée',
  parked: 'parkée',
};

/** Une fiche par son titre cliquable ; une fiche que mission control ne connaît pas garde son id. */
export function FicheLine({
  id,
  project,
  onOpenFiche,
  extra,
}: {
  id: string;
  project: BoardProject;
  onOpenFiche: (id: string) => void;
  extra?: string;
}): JSX.Element {
  const f = project.fiches?.[id];
  return (
    <div className="row ficherow">
      <span className="meta">{f?.prio || '—'}</span>
      <span>
        {f ? (
          <button type="button" className="doclink linkbtn ttl" onClick={() => onOpenFiche(id)}>
            {f.title}
          </button>
        ) : (
          <span className="ttl">{id} (titre indisponible)</span>
        )}
        {f?.blocked ? <span className="pill blocked">bloquée : {f.blocked}</span> : null}
      </span>
      <span className="meta">
        {f ? FICHE_STATUS[f.status] ?? f.status : '—'}
        {extra ? ` · ${extra}` : ''}
      </span>
    </div>
  );
}

/** La raison pour laquelle le plan n'est pas affichable ; `null` s'il l'est. */
export function planUnavailable(project: BoardProject): string | null {
  const plan = project.plan;
  if (plan?.state === 'loading') return 'plan en cours de chargement';
  if (plan?.state === 'unavailable') return plan.reason;
  return null;
}

/** Une carte qui dit pourquoi une page ne peut pas s'afficher. */
export function Unavailable({ what, reason }: { what: string; reason: string }): JSX.Element {
  return (
    <section className="card">
      <div className="row">
        <span className="ttl" role="status">
          {what} indisponible : {reason}
        </span>
      </div>
    </section>
  );
}
