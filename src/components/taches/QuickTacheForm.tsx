import { SubmitButton } from "@/components/FormControls";
import { createTacheRapide } from "@/app/notes/actions";

type UserOpt = { id: string; nom: string };

/**
 * Création rapide : titre, responsable, échéance, charge.
 * Le rattachement à l’objet source est automatique (champs cachés).
 */
export function QuickTacheForm({
  users,
  retour,
  defaults,
  hidden,
}: {
  users: UserOpt[];
  retour: string;
  defaults?: { responsableId?: string };
  hidden: {
    projetId?: string;
    conseilId?: string;
    missionId?: string;
    risqueId?: string;
    documentId?: string;
    controleSCIId?: string;
  };
}) {
  return (
    <details className="inline-create">
      <summary className="btn btn--ghost" style={{ cursor: "pointer" }}>
        + Tâche
      </summary>
      <form
        action={createTacheRapide}
        className="entity-form"
        style={{ marginTop: "0.75rem" }}
      >
        <input type="hidden" name="retour" value={retour} />
        {hidden.projetId ? (
          <input type="hidden" name="projetId" value={hidden.projetId} />
        ) : null}
        {hidden.conseilId ? (
          <input type="hidden" name="conseilId" value={hidden.conseilId} />
        ) : null}
        {hidden.missionId ? (
          <input type="hidden" name="missionId" value={hidden.missionId} />
        ) : null}
        {hidden.risqueId ? (
          <input type="hidden" name="risqueId" value={hidden.risqueId} />
        ) : null}
        {hidden.documentId ? (
          <input type="hidden" name="documentId" value={hidden.documentId} />
        ) : null}
        {hidden.controleSCIId ? (
          <input
            type="hidden"
            name="controleSCIId"
            value={hidden.controleSCIId}
          />
        ) : null}
        <div className="form-grid form-grid--2">
          <label>
            Titre
            <input name="titre" required maxLength={200} />
          </label>
          <label>
            Responsable
            <select
              name="responsableId"
              defaultValue={defaults?.responsableId ?? users[0]?.id}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </label>
          <label>
            Échéance
            <input type="date" name="dateEcheance" />
          </label>
          <label>
            Charge estimée (j.)
            <input
              name="chargeJours"
              type="number"
              step="0.25"
              min="0"
              placeholder="0,5 · 1 · 2"
            />
          </label>
        </div>
        <SubmitButton>Créer</SubmitButton>
      </form>
    </details>
  );
}
