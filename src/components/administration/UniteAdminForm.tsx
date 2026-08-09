import { SubmitButton } from "@/components/FormControls";
import { BtnLink } from "@/components/ui";

type UserOpt = { id: string; nom: string };
type Values = {
  id?: string;
  code?: string;
  nom?: string;
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

export function UniteAdminForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: Values;
  cancelHref: string;
  submitLabel: string;
}) {
  const isEdit = Boolean(values?.id);

  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {isEdit && values?.code ? (
        <Field
          label="Code"
          htmlFor="code"
          hint="Identifiant stable — non modifiable."
        >
          <input id="code" name="code" value={values.code} readOnly disabled />
        </Field>
      ) : (
        <p className="field__hint" style={{ margin: 0 }}>
          Le code (UNT-xxxx) sera attribué automatiquement à la création.
        </p>
      )}

      <Field label="Nom *" htmlFor="nom">
        <input
          id="nom"
          name="nom"
          required
          defaultValue={values?.nom ?? ""}
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={values?.description ?? ""}
        />
      </Field>

      {isEdit ? (
        <div className="form-grid">
          <Field
            label="Responsable"
            htmlFor="responsableId"
            hint="Utilisateurs actifs rattachés à cette unité."
          >
            <select
              id="responsableId"
              name="responsableId"
              defaultValue={values?.responsableId ?? ""}
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
              defaultValue={values?.adjointId ?? ""}
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
              defaultValue={values?.actif === false ? "0" : "1"}
            >
              <option value="1">Actif</option>
              <option value="0">Inactif</option>
            </select>
          </Field>
        </div>
      ) : (
        <Field label="Statut" htmlFor="actif">
          <select
            id="actif"
            name="actif"
            defaultValue={values?.actif === false ? "0" : "1"}
          >
            <option value="1">Actif</option>
            <option value="0">Inactif</option>
          </select>
        </Field>
      )}

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}
