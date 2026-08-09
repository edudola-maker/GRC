import Link from "next/link";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import {
  STATUT_TACHE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";

export type ModeleTacheOccurrence = {
  id: string;
  titre: string;
  statut: string;
  dateEcheance: Date | null;
  responsableNom: string;
  checklistFaits: number;
  checklistTotal: number;
};

export function ModeleTacheSuiviPanel({
  occurrences,
}: {
  occurrences: ModeleTacheOccurrence[];
}) {
  if (occurrences.length === 0) {
    return (
      <p className="empty">
        Aucune tâche créée depuis ce modèle pour l&apos;instant. Utilisez{" "}
        <strong>Créer une tâche</strong> pour générer une occurrence (checklist
        copiée, sans synchronisation ultérieure).
      </p>
    );
  }

  return (
    <div className="modele-suivi">
      <p className="muted" style={{ marginTop: 0 }}>
        Occurrences créées depuis ce modèle (snapshot indépendant). Ouvrez une
        tâche pour la modifier.
      </p>
      <ul className="modele-suivi__list">
        {occurrences.map((t) => {
          const clos = (TACHE_STATUTS_CLOS as readonly string[]).includes(
            t.statut,
          );
          const urgence = urgenceEcheance(t.dateEcheance, clos);
          return (
            <li key={t.id} className="modele-suivi__row">
              <Link href={`/taches/${t.id}`} className="modele-suivi__link">
                <strong className="modele-suivi__titre">{t.titre}</strong>
                <span className="modele-suivi__meta">
                  {t.responsableNom}
                  {" · "}
                  {formatDate(t.dateEcheance)}
                  {" · "}
                  {STATUT_TACHE_LABELS[t.statut] ?? t.statut}
                  {" · "}
                  checklist {t.checklistFaits}/{t.checklistTotal}
                  {urgence === "retard" ? (
                    <span className="tag tag--danger"> En retard</span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
