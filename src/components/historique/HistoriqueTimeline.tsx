import { formatUtilisateurNom } from "@/lib/session";
import { formatDate } from "@/lib/labels";

export type HistoriqueTimelineEntry = {
  id: string;
  champ: string;
  ancienneValeur: string | null;
  nouvelleValeur: string | null;
  modifieLe: Date;
  versionObjet: number;
  modifiePar: { nom: string; prenom?: string | null };
};

/**
 * Timeline d’historique de contenu (diffs) — distincte du Journal d’activité.
 */
export function HistoriqueTimeline({
  entries,
  champLabels,
  formatValue,
  emptyLabel = "Aucune modification enregistrée.",
}: {
  entries: HistoriqueTimelineEntry[];
  champLabels?: Record<string, string>;
  formatValue?: (champ: string, value: string | null) => string;
  emptyLabel?: string;
}) {
  if (entries.length === 0) {
    return <p className="empty">{emptyLabel}</p>;
  }

  const fmt = formatValue ?? ((_c, v) => v ?? "—");

  return (
    <ul className="history-list">
      {entries.map((h) => (
        <li key={h.id}>
          <strong>{champLabels?.[h.champ] ?? h.champ}</strong>
          <span>
            {fmt(h.champ, h.ancienneValeur)} → {fmt(h.champ, h.nouvelleValeur)}
            <span className="muted"> · v{h.versionObjet}</span>
          </span>
          <em>
            {formatUtilisateurNom(h.modifiePar)} · {formatDate(h.modifieLe)}
          </em>
        </li>
      ))}
    </ul>
  );
}
