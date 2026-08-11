import {
  ConfirmActionButton,
  SubmitButton,
} from "@/components/FormControls";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import {
  createJournalBordEntree,
  deleteJournalBordEntree,
} from "@/app/journal-bord/actions";
import type { JournalBordItem } from "@/lib/journal-bord";
import { formatDate } from "@/lib/labels";
import { formatUtilisateurNom } from "@/lib/session";

/**
 * Journal de bord métier volontaire — timeline compacte.
 * ≠ Notes (espace de travail) ≠ JournalEvenement (système).
 */
export function JournalBordPanel({
  typeObjet,
  objetId,
  entrees,
  canEdit,
  baseHref,
}: {
  typeObjet: "PROJET" | "CONSEIL" | "MISSION";
  objetId: string;
  entrees: JournalBordItem[];
  canEdit: boolean;
  baseHref: string;
}) {
  return (
    <CollapsibleSection
      title="Journal de bord"
      badge={entrees.length || undefined}
      defaultOpen
      id="JOURNAL_BORD"
    >
      <p className="muted" style={{ marginTop: 0 }}>
        Chronologie métier volontaire (contacts, livraisons, décisions…).
      </p>

      {canEdit ? (
        <details className="inline-create" style={{ marginBottom: "0.85rem" }}>
          <summary className="btn btn--ghost" style={{ cursor: "pointer" }}>
            + Entrée
          </summary>
          <form
            action={createJournalBordEntree}
            className="entity-form"
            style={{ marginTop: "0.75rem" }}
          >
            <input type="hidden" name="typeObjet" value={typeObjet} />
            <input type="hidden" name="objetId" value={objetId} />
            <input type="hidden" name="retour" value={baseHref} />
            <div className="form-grid form-grid--2">
              <label>
                Date
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                />
              </label>
            </div>
            <label>
              Texte
              <textarea name="texte" rows={2} required placeholder="Ex. Documentation reçue" />
            </label>
            <SubmitButton>Ajouter</SubmitButton>
          </form>
        </details>
      ) : null}

      {entrees.length === 0 ? (
        <p className="empty">Aucune entrée.</p>
      ) : (
        <ol className="journal-bord">
          {entrees.map((e) => (
            <li key={e.id} className="journal-bord__item">
              <time dateTime={e.date.toISOString()}>
                {formatDate(e.date)}
              </time>
              <div className="journal-bord__body">
                <p>{e.texte}</p>
                <span className="muted">
                  {formatUtilisateurNom(e.auteur)}
                </span>
              </div>
              {canEdit ? (
                <ConfirmActionButton
                  action={deleteJournalBordEntree}
                  id={e.id}
                  label="×"
                  confirmMessage="Supprimer cette entrée ?"
                  variant="ghost"
                  fields={{ retour: baseHref }}
                />
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </CollapsibleSection>
  );
}
