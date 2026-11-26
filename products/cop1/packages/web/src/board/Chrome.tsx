/**
 * L'habillage commun de mission control (fiche 20261126170000101) : titre de page avec son « i »,
 * fil d'Ariane, pied de page, et la pastille de version de l'en-tête.
 */
import type { ReactNode } from 'react';
import type { BoardProject } from './types.js';

const NO_VERSION = 'aucune version';
const NOT_PUBLISHED = 'non publié';

/** La dernière version étiquetée du projet : jamais la version du paquet web. */
export function latestTaggedVersion(project: BoardProject): string {
  if (project.plan && project.plan.state !== 'ok') return NOT_PUBLISHED;
  const page = project.versionsPage;
  if (page) return page.prochaineCoupe.derniereEtiquette ?? NO_VERSION;
  const past = project.versions.past.find((v) => v.date && !v.toClose);
  return past ? past.ver : NO_VERSION;
}

/** Bouton « i » : une phrase d'aide au survol, à la place d'un sous-titre. */
export function InfoButton({ text }: { text: string }): JSX.Element {
  return (
    <button type="button" className="ibtn" title={text} aria-label={`Aide : ${text}`}>
      i
    </button>
  );
}

/** Titre de page : le titre, son « i » à droite, puis d'éventuelles données courtes. */
export function PageHead({ title, info, children }: { title: string; info?: string; children?: ReactNode }): JSX.Element {
  return (
    <div className="vh">
      <h2>{title}</h2>
      {info && <InfoButton text={info} />}
      {children}
    </div>
  );
}

export interface CrumbItem {
  label: string;
  /** Absent sur le dernier maillon : la page où l'on est. */
  onClick?: () => void;
}

export function Crumb({ trail }: { trail: CrumbItem[] }): JSX.Element {
  return (
    <nav className="crumb" aria-label="Fil d'Ariane">
      {trail.map((item, i) => (
        <span key={`${i}-${item.label}`} className="crumb-item">
          {i > 0 && <span aria-hidden="true"> › </span>}
          {item.onClick ? (
            <button type="button" className="crumb-link" onClick={item.onClick}>
              {item.label}
            </button>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Footer(): JSX.Element {
  return (
    <footer className="foot">
      mega-city · <span>Documentation</span>
    </footer>
  );
}
