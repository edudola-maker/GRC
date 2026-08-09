import { TYPE_EVENEMENT_LABELS } from "@/lib/journal";
import { formatDate } from "@/lib/labels";
import { formatUtilisateurNom } from "@/lib/session";

export type JournalTimelineEntry = {
  id: string;
  typeEvenement: string;
  message: string;
  creeLe: Date;
  auteur: { nom: string; prenom?: string | null } | null;
};

/** Timeline du journal d’activité (événements) — distincte de l’Historique. */
export function JournalTimeline({
  entries,
  emptyLabel = "Aucune entrée pour l’instant.",
}: {
  entries: JournalTimelineEntry[];
  emptyLabel?: string;
}) {
  if (entries.length === 0) {
    return <p className="empty">{emptyLabel}</p>;
  }

  return (
    <ul className="history-list">
      {entries.map((e) => (
        <li key={e.id}>
          <strong>
            {TYPE_EVENEMENT_LABELS[e.typeEvenement] ?? e.typeEvenement}
          </strong>
          <span>{e.message}</span>
          <em>
            {e.auteur ? formatUtilisateurNom(e.auteur) : "Système"} ·{" "}
            {formatDate(e.creeLe)}
          </em>
        </li>
      ))}
    </ul>
  );
}
