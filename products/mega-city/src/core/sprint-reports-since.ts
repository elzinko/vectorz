/**
 * Les comptes rendus de sprint à relire à la rétro (fiche 20261008072306360, ADR-0068) : ceux écrits
 * DEPUIS la dernière capture, quelle que soit la session qui les a produits.
 *
 * PUR : aucune I/O. Le bord `bin/retro-reports.ts` lit `docs/captures/` et `docs/sprints/`, passe les
 * NOMS de fichiers ici, et imprime la liste. Les comptes rendus de toutes les sessions atterrissent
 * dans le même `docs/sprints/` committé : les lister par date est donc session-agnostique (c'est ce qui
 * garantit qu'une rétro voit les sprints qu'elle n'a pas vécus).
 */

/** `AAAA-MM-JJ-retro-<slug>.md` — une capture de rétro. */
const CAPTURE_NAME = /^(\d{4}-\d{2}-\d{2})-retro-.+\.md$/;
/** `AAAA-MM-JJ-sprint-<slug>.md` — un compte rendu de sprint (écrit par `ezk-sprint close`). */
const REPORT_NAME = /^(\d{4}-\d{2}-\d{2})-sprint-.+\.md$/;

/** La date (AAAA-MM-JJ) d'un nom qui matche `re`, ou `undefined`. Les dates ISO se comparent en texte. */
function dateOf(name: string, re: RegExp): string | undefined {
  return re.exec(name)?.[1];
}

/** La date de la capture la plus récente, ou `undefined` s'il n'y en a aucune. */
export function latestCaptureDate(captureNames: readonly string[]): string | undefined {
  let latest: string | undefined;
  for (const n of captureNames) {
    const d = dateOf(n, CAPTURE_NAME);
    if (d !== undefined && (latest === undefined || d > latest)) latest = d;
  }
  return latest;
}

/**
 * Les comptes rendus de sprint à relire : ceux dont la date est **≥ la dernière capture** (le même jour
 * compte — la capture et le compte rendu n'ont qu'une granularité au jour). Sans aucune capture, on rend
 * **tous** les comptes rendus (première rétro : rien n'a encore été capitalisé). Triés par nom (donc par
 * date) croissant. Les noms qui ne matchent pas le format d'un compte rendu sont ignorés.
 *
 * Compromis assumé du `≥` : un compte rendu daté **du jour** de la dernière capture reste listé aux
 * rétros suivantes tant qu'une capture d'un autre jour n'a pas déplacé la borne — donc potentiellement
 * relu après avoir déjà été capitalisé. On préfère re-montrer que manquer une 2ᵉ session close le même
 * jour (la rétro déduplique au jugement). La granularité au jour l'impose : les noms n'ont pas d'heure.
 */
export function reportsSince(
  captureNames: readonly string[],
  reportNames: readonly string[],
): string[] {
  const since = latestCaptureDate(captureNames);
  const reports = reportNames
    .filter((n) => {
      const d = dateOf(n, REPORT_NAME);
      return d !== undefined && (since === undefined || d >= since);
    })
    .sort();
  return reports;
}
