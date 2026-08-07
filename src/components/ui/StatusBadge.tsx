import type { ReactNode } from "react";

export type StatusTone =
  | "ok"
  | "info"
  | "warn"
  | "danger"
  | "muted"
  | "neutral";

/** Badge de statut — seule zone colorée d’une ligne d’inventaire. */
export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <span className={`status-badge status-badge--${tone}`}>{children}</span>
  );
}

/** Tone par défaut selon le code statut (tous modules). */
export function toneFromStatut(statut: string): StatusTone {
  switch (statut) {
    case "CLOTURE":
    case "CLOTUREE":
    case "TERMINE":
    case "REALISE":
    case "MAITRISE":
    case "ACCEPTE":
    case "EN_VIGUEUR":
    case "REPONDU":
    case "DEPLOYE":
      return "ok";
    case "EN_COURS":
    case "EN_TRAITEMENT":
    case "EN_EVALUATION":
    case "EN_REVUE":
    case "EN_VALIDATION":
    case "PLANIFIE":
    case "VALIDE":
    case "A_VALIDER":
    case "RECU":
    case "IDENTIFIE":
    case "A_REALISER":
    case "BROUILLON":
      return "info";
    case "EN_ATTENTE":
    case "A_REVOIR":
    case "A_ETUDIER":
    case "IDEE":
      return "warn";
    case "EN_RETARD":
    case "ANNULE":
    case "ANNULEE":
    case "ABANDONNE":
    case "OBSOLETE":
      return "danger";
    case "ARCHIVE":
      return "muted";
    default:
      return "neutral";
  }
}
