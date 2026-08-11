import { BtnLink } from "@/components/ui";
import { SubmitButton } from "@/components/FormControls";
import { FormSection } from "@/components/module/FormSection";
import { SectionSaveActions } from "@/components/module/EditableSection";
import { CATEGORIE_TACHE_OPTIONS } from "@/lib/catalog";

type UserOpt = { id: string; nom: string };

export type ModeleTacheValues = {
  id?: string;
  nom?: string;
  description?: string | null;
  delaiJours?: number | null;
  responsableDefautId?: string | null;
  categorieDefaut?: string | null;
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

export function ModeleTacheForm({
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
  values?: ModeleTacheValues;
  cancelHref: string;
  submitLabel: string;
  section?: "ALL" | "INFOS_GENERALES" | "PARAMETRES";
  draftActions?: boolean;
}) {
  const showInfos = section === "ALL" || section === "INFOS_GENERALES";
  const showParams = section === "ALL" || section === "PARAMETRES";

  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {section !== "ALL" ? (
        <input type="hidden" name="sectionKey" value={section} />
      ) : null}

      {showInfos ? (
        <FormSection title="Informations" defaultOpen>
          <Field label="Nom *" htmlFor="nom">
            <input
              id="nom"
              name="nom"
              required
              defaultValue={values?.nom ?? ""}
              placeholder="Ex. Entrée d’un collaborateur"
            />
          </Field>
          <Field
            label="Description"
            htmlFor="description"
            hint="Checklist standard et usage du modèle."
          >
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={values?.description ?? ""}
            />
          </Field>
        </FormSection>
      ) : null}

      {showParams ? (
        <FormSection title="Paramètres" defaultOpen={section !== "ALL"}>
          <div className="form-grid">
            <Field
              label="Délai standard (jours)"
              htmlFor="delaiJours"
              hint="Utilisé pour préremplir l’échéance à la création d’une tâche."
            >
              <input
                id="delaiJours"
                name="delaiJours"
                type="number"
                min={0}
                defaultValue={values?.delaiJours ?? ""}
              />
            </Field>
            <Field label="Responsable par défaut" htmlFor="responsableDefautId">
              <select
                id="responsableDefautId"
                name="responsableDefautId"
                defaultValue={values?.responsableDefautId ?? ""}
              >
                <option value="">— Aucun —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Catégorie par défaut" htmlFor="categorieDefaut">
              <select
                id="categorieDefaut"
                name="categorieDefaut"
                defaultValue={values?.categorieDefaut ?? ""}
              >
                <option value="">— Aucune —</option>
                {CATEGORIE_TACHE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Actif" htmlFor="actif">
              <select
                id="actif"
                name="actif"
                defaultValue={values?.actif === false ? "0" : "1"}
              >
                <option value="1">Oui</option>
                <option value="0">Non</option>
              </select>
            </Field>
          </div>
        </FormSection>
      ) : null}

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
