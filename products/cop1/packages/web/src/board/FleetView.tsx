/**
 * Page « Projets », l'accueil de tous les projets (fiche 20261126170000102) : une carte par projet,
 * la même que celle de la Vue d'ensemble. Le nom d'un projet l'ouvre ; la déroulante reste un raccourci.
 *
 * Servi LIVE : rien n'est écrit sur disque (ADR-0043/0055).
 */
import type { BoardData } from './types.js';
import { PageHead } from './Chrome.js';
import { ProjectCard } from './ProjectCard.js';

interface FleetViewProps {
  projects: BoardData;
  onOpenProject: (name: string) => void;
}

export function FleetView({ projects, onOpenProject }: FleetViewProps): JSX.Element {
  return (
    <>
      <PageHead title="Projets" info="Tous les projets suivis : un clic sur un nom ouvre sa vue d'ensemble." />
      {Object.values(projects).map((p) => (
        <ProjectCard key={p.name} project={p} onOpen={() => onOpenProject(p.name)} />
      ))}
    </>
  );
}
