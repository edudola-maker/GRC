import { ConfirmDeleteButton, SubmitButton } from "@/components/FormControls";
import { BtnLink } from "@/components/ui";
import { ROLE_UTILISATEUR_LABELS } from "@/lib/labels";

type UniteOpt = { id: string; nom: string; code: string };
type Values = {
  id?: string;
  nom?: string;
  prenom?: string | null;
  fonction?: string | null;
  email?: string;
  uniteId?: string;
  role?: string;
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

export function UtilisateurForm({
  action,
  deleteAction,
  unites,
  values,
  cancelHref,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  unites: UniteOpt[];
  values?: Values;
  cancelHref: string;
  submitLabel: string;
}) {
  const isEdit = Boolean(values?.id);

  return (
    <form action={action} className="entity-form">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="form-grid">
        <Field label="Prénom *" htmlFor="prenom">
          <input
            id="prenom"
            name="prenom"
            required
            defaultValue={values?.prenom ?? ""}
          />
        </Field>
        <Field label="Nom *" htmlFor="nom">
          <input
            id="nom"
            name="nom"
            required
            defaultValue={values?.nom ?? ""}
          />
        </Field>
      </div>

      <div className="form-grid">
        <Field label="E-mail *" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={values?.email ?? ""}
          />
        </Field>
        <Field label="Fonction" htmlFor="fonction">
          <input
            id="fonction"
            name="fonction"
            defaultValue={values?.fonction ?? ""}
          />
        </Field>
      </div>

      <div className="form-grid">
        <Field label="Unité *" htmlFor="uniteId">
          <select
            id="uniteId"
            name="uniteId"
            required
            defaultValue={values?.uniteId ?? unites[0]?.id ?? ""}
          >
            {unites.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} — {u.nom}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Rôle applicatif *" htmlFor="role">
          <select
            id="role"
            name="role"
            required
            defaultValue={values?.role ?? "COLLABORATEUR"}
          >
            {Object.entries(ROLE_UTILISATEUR_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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

      <Field
        label={isEdit ? "Nouveau mot de passe (démo)" : "Mot de passe (démo)"}
        htmlFor="motDePasse"
        hint={
          isEdit
            ? "Laisser vide pour conserver le hash actuel. Stockage démo uniquement."
            : "Optionnel — un hash démo est généré depuis l’e-mail si vide."
        }
      >
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          autoComplete="new-password"
        />
      </Field>

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <BtnLink href={cancelHref} variant="ghost">
          Annuler
        </BtnLink>
        {isEdit && values?.id && deleteAction ? (
          <ConfirmDeleteButton
            action={deleteAction}
            id={values.id}
            label="Désactiver"
            confirmMessage="Désactiver cet utilisateur ? (soft-delete — le dernier administrateur actif ne peut pas être retiré.)"
          />
        ) : null}
      </div>
    </form>
  );
}
