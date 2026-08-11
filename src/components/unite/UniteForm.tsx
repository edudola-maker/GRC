import { BtnLink } from "@/components/ui";
import { SubmitButton } from "@/components/FormControls";
import { FormSection } from "@/components/module/FormSection";
import { SectionSaveActions } from "@/components/module/EditableSection";

type UserOpt = { id: string; nom: string };

export type UniteValues = {
  id: string;
  nom: string;
  description?: string | null;
  responsableId?: string | null;
  adjointId?: string | null;
  actif?: boolean;
};

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field" htmlFor={htmlFor}>
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function UniteForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel = "Finaliser",
  draftActions = true,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values: UniteValues;
  cancelHref: string;
  submitLabel?: string;
  draftActions?: boolean;
}) {
  return (
    <form action={action} className="entity-form">
      <input type="hidden" name="id" value={values.id} />
      <input type="hidden" name="sectionKey" value="VUE_ENSEMBLE" />

      <FormSection title="Identité" defaultOpen>
        <Field label="Nom *" htmlFor="nom">
          <input
            id="nom"
            name="nom"
            required
            defaultValue={values.nom}
          />
        </Field>
        <Field
          label="Mission / description"
          htmlFor="description"
          hint="Synthèse : qui sommes-nous ?"
        >
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={values.description ?? ""}
          />
        </Field>
        <div className="form-grid">
          <Field label="Responsable" htmlFor="responsableId">
            <select
              id="responsableId"
              name="responsableId"
              defaultValue={values.responsableId ?? ""}
            >
              <option value="">— Aucun —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Adjoint" htmlFor="adjointId">
            <select
              id="adjointId"
              name="adjointId"
              defaultValue={values.adjointId ?? ""}
            >
              <option value="">— Aucun —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut" htmlFor="actif">
            <select
              id="actif"
              name="actif"
              defaultValue={values.actif === false ? "0" : "1"}
            >
              <option value="1">Actif</option>
              <option value="0">Inactif</option>
            </select>
          </Field>
        </div>
      </FormSection>

      {draftActions ? (
        <SectionSaveActions
          baseHref={cancelHref}
          sectionKey="VUE_ENSEMBLE"
          cancelHref={cancelHref}
          finalizeLabel={submitLabel}
        />
      ) : (
        <div className="form-actions">
          <SubmitButton>{submitLabel}</SubmitButton>
          <BtnLink href={cancelHref} variant="ghost" scroll={false}>
            Annuler
          </BtnLink>
        </div>
      )}
    </form>
  );
}
