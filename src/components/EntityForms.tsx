import { toDateInputValue } from "@/lib/form";
import {
  CATEGORIE_TACHE_OPTIONS,
  PRIORITE_OPTIONS,
  STATUT_PROJET_OPTIONS,
  STATUT_TACHE_OPTIONS,
} from "@/lib/catalog";
import { SubmitButton } from "@/components/FormControls";
import { BtnLink } from "@/components/ui";

type UserOpt = { id: string; nom: string };
type ProjetOpt = { id: string; nom: string };

type ProjetValues = {
  id?: string;
  nom?: string;
  description?: string | null;
  responsableId?: string;
  dateDebut?: Date | string | null;
  dateEcheance?: Date | string | null;
  statut?: string;
  priorite?: string;
  avancement?: number;
  commentaires?: string | null;
};

type TacheValues = {
  id?: string;
  titre?: string;
  description?: string | null;
  responsableId?: string;
  projetId?: string | null;
  dateEcheance?: Date | string | null;
  statut?: string;
  priorite?: string;
  categorie?: string;
  commentaires?: string | null;
};

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field" htmlFor={htmlFor}>
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function ProjetForm({
  action,
  users,
  values,
  cancelHref,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  values?: ProjetValues;
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <Field label="Nom du projet" htmlFor="nom">
        <input
          id="nom"
          name="nom"
          required
          defaultValue={values?.nom ?? ""}
          placeholder="Ex. Modernisation des procédures"
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
        <Field label="Responsable" htmlFor="responsableId">
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
            defaultValue={values?.statut ?? "A_FAIRE"}
          >
            {STATUT_PROJET_OPTIONS.map((o) => (
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

        <Field label="Avancement (%)" htmlFor="avancement">
          <input
            id="avancement"
            name="avancement"
            type="number"
            min={0}
            max={100}
            defaultValue={values?.avancement ?? 0}
          />
        </Field>

        <Field label="Date de début" htmlFor="dateDebut">
          <input
            id="dateDebut"
            name="dateDebut"
            type="date"
            defaultValue={toDateInputValue(values?.dateDebut)}
          />
        </Field>

        <Field label="Date d'échéance" htmlFor="dateEcheance">
          <input
            id="dateEcheance"
            name="dateEcheance"
            type="date"
            defaultValue={toDateInputValue(values?.dateEcheance)}
          />
        </Field>
      </div>

      <Field label="Commentaires" htmlFor="commentaires">
        <textarea
          id="commentaires"
          name="commentaires"
          rows={2}
          defaultValue={values?.commentaires ?? ""}
        />
      </Field>

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}

export function TacheForm({
  action,
  users,
  projets,
  values,
  cancelHref,
  submitLabel,
  defaultCategorie,
}: {
  action: (formData: FormData) => void | Promise<void>;
  users: UserOpt[];
  projets: ProjetOpt[];
  values?: TacheValues;
  cancelHref: string;
  submitLabel: string;
  defaultCategorie?: string;
}) {
  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <Field label="Titre" htmlFor="titre">
        <input
          id="titre"
          name="titre"
          required
          defaultValue={values?.titre ?? ""}
          placeholder='Ex. Analyser la question X'
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
        <Field label="Responsable" htmlFor="responsableId">
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

        <Field
          label="Catégorie"
          htmlFor="categorie"
          hint="Ex. Conseil pour une demande ponctuelle sans projet."
        >
          <select
            id="categorie"
            name="categorie"
            defaultValue={
              values?.categorie ?? defaultCategorie ?? "AUTRE"
            }
          >
            {CATEGORIE_TACHE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Projet associé"
          htmlFor="projetId"
          hint="Facultatif — laisser vide pour une tâche indépendante."
        >
          <select
            id="projetId"
            name="projetId"
            defaultValue={values?.projetId ?? ""}
          >
            <option value="">Aucun (indépendante)</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Statut" htmlFor="statut">
          <select
            id="statut"
            name="statut"
            defaultValue={values?.statut ?? "A_FAIRE"}
          >
            {STATUT_TACHE_OPTIONS.map((o) => (
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

        <Field label="Date d'échéance" htmlFor="dateEcheance">
          <input
            id="dateEcheance"
            name="dateEcheance"
            type="date"
            defaultValue={toDateInputValue(values?.dateEcheance)}
          />
        </Field>
      </div>

      <Field label="Commentaire" htmlFor="commentaires">
        <textarea
          id="commentaires"
          name="commentaires"
          rows={2}
          defaultValue={values?.commentaires ?? ""}
        />
      </Field>

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
          Annuler
        </BtnLink>
      </div>
    </form>
  );
}
