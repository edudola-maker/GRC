import {
  PRIORITE_OPTIONS,
  STATUT_TACHE_OPTIONS,
} from "@/lib/catalog";
import { updateTacheRapide } from "@/app/taches/actions";
import { SubmitButton } from "@/components/FormControls";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";

type UserOpt = { id: string; nom: string };

export function TacheActionsRapides({
  tacheId,
  statut,
  priorite,
  responsableId,
  users,
}: {
  tacheId: string;
  statut: string;
  priorite: string;
  responsableId: string;
  users: UserOpt[];
}) {
  return (
    <CollapsibleSection title="Actions rapides" defaultOpen>
      <p className="panel-hint">
        Modifiez le statut, la priorité ou le responsable sans ouvrir le
        formulaire complet.
      </p>

      <div className="quick-actions">
        <form action={updateTacheRapide} className="quick-form">
          <input type="hidden" name="id" value={tacheId} />
          <input type="hidden" name="champ" value="statut" />
          <label>
            <span>Statut</span>
            <select name="valeur" defaultValue={statut}>
              {STATUT_TACHE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <SubmitButton pendingLabel="…">Appliquer</SubmitButton>
        </form>

        <form action={updateTacheRapide} className="quick-form">
          <input type="hidden" name="id" value={tacheId} />
          <input type="hidden" name="champ" value="priorite" />
          <label>
            <span>Priorité</span>
            <select name="valeur" defaultValue={priorite}>
              {PRIORITE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <SubmitButton pendingLabel="…">Appliquer</SubmitButton>
        </form>

        <form action={updateTacheRapide} className="quick-form">
          <input type="hidden" name="id" value={tacheId} />
          <input type="hidden" name="champ" value="responsableId" />
          <label>
            <span>Responsable</span>
            <select name="valeur" defaultValue={responsableId}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </label>
          <SubmitButton pendingLabel="…">Appliquer</SubmitButton>
        </form>
      </div>
    </CollapsibleSection>
  );
}
