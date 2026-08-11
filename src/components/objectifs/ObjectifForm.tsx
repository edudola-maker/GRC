import { BtnLink } from "@/components/ui";
import { SubmitButton } from "@/components/FormControls";
import { FormSection } from "@/components/module/FormSection";
import { SectionSaveActions } from "@/components/module/EditableSection";
import {
  PRIORITE_OPTIONS,
  STATUT_OBJECTIF_OPTIONS,
} from "@/lib/catalog";
import { toDateInputValue } from "@/lib/form";

type UserOpt = { id: string; nom: string };

export type ObjectifValues = {
  id?: string;
  intitule?: string;
  description?: string | null;
  annee?: number;
  responsableId?: string;
  statut?: string;
  priorite?: string;
  dateEcheance?: Date | string | null;
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

export function ObjectifForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel,
  section = "ALL",
  draftActions = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: ObjectifValues;
  cancelHref: string;
  submitLabel: string;
  section?: "ALL" | "INFOS_GENERALES";
  draftActions?: boolean;
}) {
  const anneeDefaut = values?.annee ?? new Date().getFullYear();

  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {section !== "ALL" ? (
        <input type="hidden" name="sectionKey" value={section} />
      ) : null}

      <FormSection title="Objectif" defaultOpen>
        <Field label="Intitulé *" htmlFor="intitule">
          <input
            id="intitule"
            name="intitule"
            required
            defaultValue={values?.intitule ?? ""}
            placeholder="Ex. Renforcer la surveillance du SCI"
          />
        </Field>
        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={values?.description ?? ""}
          />
        </Field>
        <div className="form-grid">
          <Field label="Année / période *" htmlFor="annee">
            <input
              id="annee"
              name="annee"
              type="number"
              required
              min={2000}
              max={2100}
              defaultValue={anneeDefaut}
            />
          </Field>
          <Field label="Échéance" htmlFor="dateEcheance">
            <input
              id="dateEcheance"
              name="dateEcheance"
              type="date"
              defaultValue={toDateInputValue(values?.dateEcheance)}
            />
          </Field>
          <Field label="Responsable *" htmlFor="responsableId">
            <select
              id="responsableId"
              name="responsableId"
              required
              defaultValue={values?.responsableId ?? users[0]?.id}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut" htmlFor="statut">
            <select
              id="statut"
              name="statut"
              defaultValue={values?.statut ?? "EN_COURS"}
            >
              {STATUT_OBJECTIF_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priorité" htmlFor="priorite">
            <select
              id="priorite"
              name="priorite"
              defaultValue={values?.priorite ?? "MOYENNE"}
            >
              {PRIORITE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </FormSection>

      {draftActions ? (
        <SectionSaveActions
          baseHref={cancelHref}
          sectionKey={section !== "ALL" ? section : undefined}
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
